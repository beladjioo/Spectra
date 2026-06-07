//! RF Academy — all-Rust backend.
//!
//! Owns the HackRF (tunable), runs the DSP, serves the React app, and streams the
//! live spectrum to browsers over a WebSocket. The browser retunes the radio via
//! POST /api/tune (each mission tunes to its band). Falls back to a built-in
//! simulator if no HackRF is present, so the app always runs.
//!
//! Receive-only — nothing is ever transmitted.

mod dsp;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use num_complex::Complex;
use serde::Deserialize;
use tokio::sync::{broadcast, mpsc};
use tower_http::services::{ServeDir, ServeFile};

use dsp::{extract, fm_demod, synth, Analyzer, Frame, Rng, SdrInfo, AUDIO_RATE, N};

/// Current radio tuning, pushed from the web UI to the SDR thread.
#[derive(Clone, Copy)]
struct Tune {
    center_hz: f64,
    fs: f64,
    gain: f64,
}

#[derive(Deserialize)]
struct TuneReq {
    center_mhz: f64,
    sample_rate_msps: Option<f64>,
    gain_db: Option<f64>,
}

#[derive(Clone)]
struct AppState {
    frames: broadcast::Sender<Arc<Frame>>,
    cmds: mpsc::UnboundedSender<Tune>,
    audio: broadcast::Sender<Vec<u8>>, // i16 LE PCM @ AUDIO_RATE
    audio_on: Arc<AtomicBool>,
}

/// f32 PCM [-1,1] → little-endian i16 bytes for the browser's Web Audio.
fn pcm_bytes(pcm: &[f32]) -> Vec<u8> {
    let mut b = Vec::with_capacity(pcm.len() * 2);
    for &s in pcm {
        b.extend_from_slice(&((s.clamp(-1.0, 1.0) * 32767.0) as i16).to_le_bytes());
    }
    b
}

fn env(k: &str, d: &str) -> String {
    std::env::var(k).unwrap_or_else(|_| d.to_string())
}

#[tokio::main]
async fn main() {
    let sim = matches!(env("SDR_SIM", "0").as_str(), "1" | "true" | "TRUE");
    let static_dir = env("STATIC_DIR", "web/dist");
    let addr = env("BIND", "0.0.0.0:8090");

    let (frame_tx, _) = broadcast::channel::<Arc<Frame>>(16);
    let (cmd_tx, cmd_rx) = mpsc::unbounded_channel::<Tune>();
    let (audio_tx, _) = broadcast::channel::<Vec<u8>>(32);
    let audio_on = Arc::new(AtomicBool::new(false));

    // start tuned to the FM band (mission 1 territory)
    let init = Tune { center_hz: 98.0e6, fs: 8.0e6, gain: 32.0 };
    {
        let frames = frame_tx.clone();
        let audio = audio_tx.clone();
        let on = audio_on.clone();
        std::thread::spawn(move || sdr_loop(sim, frames, cmd_rx, init, audio, on));
    }

    let state = AppState { frames: frame_tx, cmds: cmd_tx, audio: audio_tx, audio_on };
    let index = format!("{static_dir}/index.html");
    let serve = ServeDir::new(&static_dir).fallback(ServeFile::new(index));
    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/audio", get(audio_handler))
        .route("/api/tune", post(tune))
        .route("/api/audio", post(set_audio))
        .route("/healthz", get(|| async { "ok" }))
        .fallback_service(serve)
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    eprintln!("rf-academy on http://{addr}  (sim={sim}, static={static_dir})");
    axum::serve(listener, app).await.unwrap();
}

async fn tune(State(s): State<AppState>, Json(r): Json<TuneReq>) -> impl IntoResponse {
    let cmd = Tune {
        center_hz: r.center_mhz * 1e6,
        fs: r.sample_rate_msps.unwrap_or(8.0) * 1e6,
        gain: r.gain_db.unwrap_or(32.0),
    };
    let _ = s.cmds.send(cmd);
    Json(serde_json::json!({ "ok": true }))
}

#[derive(Deserialize)]
struct AudioReq {
    on: bool,
}

async fn set_audio(State(s): State<AppState>, Query(q): Query<AudioReq>) -> impl IntoResponse {
    s.audio_on.store(q.on, Ordering::Relaxed);
    Json(serde_json::json!({ "on": q.on }))
}

async fn audio_handler(ws: WebSocketUpgrade, State(s): State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(move |sock| audio_task(sock, s))
}

async fn audio_task(mut sock: WebSocket, s: AppState) {
    let mut rx = s.audio.subscribe();
    loop {
        match rx.recv().await {
            Ok(bytes) => {
                if sock.send(Message::Binary(bytes)).await.is_err() {
                    break;
                }
            }
            Err(broadcast::error::RecvError::Lagged(_)) => continue,
            Err(broadcast::error::RecvError::Closed) => break,
        }
    }
}

async fn ws_handler(ws: WebSocketUpgrade, State(s): State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(move |sock| ws_task(sock, s))
}

async fn ws_task(mut sock: WebSocket, s: AppState) {
    let mut rx = s.frames.subscribe();
    loop {
        match rx.recv().await {
            Ok(frame) => {
                let txt = match serde_json::to_string(&*frame) {
                    Ok(t) => t,
                    Err(_) => continue,
                };
                if sock.send(Message::Text(txt)).await.is_err() {
                    break;
                }
            }
            Err(broadcast::error::RecvError::Lagged(_)) => continue,
            Err(broadcast::error::RecvError::Closed) => break,
        }
    }
}

// ---------------------------------------------------------------------------
// SDR thread (blocking) — talks to the HackRF, or simulates when absent.
// ---------------------------------------------------------------------------

fn sdr_loop(
    sim_forced: bool,
    frames: broadcast::Sender<Arc<Frame>>,
    mut cmds: mpsc::UnboundedReceiver<Tune>,
    init: Tune,
    audio: broadcast::Sender<Vec<u8>>,
    audio_on: Arc<AtomicBool>,
) {
    let mut cur = init;
    loop {
        if !sim_forced {
            if let Some((args, info)) = probe() {
                eprintln!("SDR detected: {} (serial {})", info.label, info.serial);
                if let Err(e) = real_loop(&frames, &mut cmds, &mut cur, args, &info, &audio, &audio_on) {
                    eprintln!("SDR lost ({e}) — back to simulator, will keep scanning");
                }
            }
        }
        // No SDR (or forced sim): run the simulator. When not forced, return after
        // a few seconds so a freshly plugged SDR gets picked up (hot-plug).
        let sim = SdrInfo {
            present: false,
            driver: "sim".into(),
            label: "Simulateur".into(),
            serial: String::new(),
        };
        sim_loop(&frames, &mut cmds, &mut cur, &sim, sim_forced, &audio, &audio_on);
    }
}

/// Enumerate connected SDRs; return the first one's open-args and its identity.
fn probe() -> Option<(soapysdr::Args, SdrInfo)> {
    let args = soapysdr::enumerate("").ok()?.into_iter().next()?;
    let get = |k: &str| args.get(k).unwrap_or("").to_string();
    let nz = |s: String, d: &str| if s.is_empty() { d.to_string() } else { s };
    let info = SdrInfo {
        present: true,
        driver: nz(get("driver"), "sdr"),
        label: nz(get("label"), "SDR"),
        serial: get("serial"),
    };
    Some((args, info))
}

fn sim_loop(
    frames: &broadcast::Sender<Arc<Frame>>,
    cmds: &mut mpsc::UnboundedReceiver<Tune>,
    cur: &mut Tune,
    info: &SdrInfo,
    forever: bool,
    audio: &broadcast::Sender<Vec<u8>>,
    audio_on: &AtomicBool,
) {
    let mut rng = Rng::new(0xC0FFEE);
    let mut ph = 0f32;
    let start = std::time::Instant::now();
    loop {
        while let Ok(c) = cmds.try_recv() {
            *cur = c;
        }
        let db = synth(cur.center_hz, cur.fs, &mut rng);
        let _ = frames.send(Arc::new(extract(&db, cur.center_hz, cur.fs, cur.gain, info)));
        if audio_on.load(Ordering::Relaxed) {
            // 440 Hz test tone so the audio path can be validated without a HackRF
            let n = (AUDIO_RATE * 0.12) as usize;
            let step = std::f32::consts::TAU * 440.0 / AUDIO_RATE as f32;
            let mut pcm = Vec::with_capacity(n);
            for _ in 0..n {
                pcm.push(ph.sin() * 0.2);
                ph = (ph + step) % std::f32::consts::TAU;
            }
            let _ = audio.send(pcm_bytes(&pcm));
        }
        std::thread::sleep(Duration::from_millis(120));
        if !forever && start.elapsed() >= Duration::from_secs(3) {
            return; // rescan for a hot-plugged SDR
        }
    }
}

fn real_loop(
    frames: &broadcast::Sender<Arc<Frame>>,
    cmds: &mut mpsc::UnboundedReceiver<Tune>,
    cur: &mut Tune,
    args: soapysdr::Args,
    info: &SdrInfo,
    audio: &broadcast::Sender<Vec<u8>>,
    audio_on: &AtomicBool,
) -> Result<(), Box<dyn std::error::Error>> {
    use soapysdr::Direction::Rx;

    let dev = soapysdr::Device::new(args)?;
    dev.set_sample_rate(Rx, 0, cur.fs)?;
    dev.set_frequency(Rx, 0, cur.center_hz, ())?;
    let _ = dev.set_gain(Rx, 0, cur.gain);
    let mut stream = dev.rx_stream::<Complex<f32>>(&[0])?;
    stream.activate(None)?;

    let mut an = Analyzer::new();
    let mut buf = vec![Complex::new(0.0f32, 0.0); N];
    let mut last = Complex::new(0.0f32, 0.0); // FM demod state across blocks
    const AVG: usize = 16;
    let mut errors = 0u32;

    loop {
        // apply pending retune commands from the UI
        while let Ok(c) = cmds.try_recv() {
            let fs_changed = c.fs != cur.fs;
            *cur = c;
            let _ = dev.set_frequency(Rx, 0, cur.center_hz, ());
            let _ = dev.set_gain(Rx, 0, cur.gain);
            if fs_changed {
                let _ = dev.set_sample_rate(Rx, 0, cur.fs);
            }
        }
        let listen = audio_on.load(Ordering::Relaxed);
        for _ in 0..AVG {
            match stream.read(&mut [&mut buf], 1_000_000) {
                Ok(n) if n == N => {
                    an.accumulate(&buf);
                    errors = 0;
                    if listen {
                        let pcm = fm_demod(&buf, cur.fs, &mut last);
                        let _ = audio.send(pcm_bytes(&pcm));
                    }
                }
                Ok(_) => {}
                Err(_) => errors += 1,
            }
        }
        if errors > 40 {
            return Err("repeated read failures (SDR unplugged?)".into());
        }
        let db = an.render_db();
        let _ = frames.send(Arc::new(extract(&db, cur.center_hz, cur.fs, cur.gain, info)));
    }
}
