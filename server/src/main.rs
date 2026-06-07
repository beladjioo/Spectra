//! RF Academy — all-Rust backend.
//!
//! Owns the HackRF (tunable), runs the DSP, serves the React app, and streams the
//! live spectrum to browsers over a WebSocket. The browser retunes the radio via
//! POST /api/tune (each mission tunes to its band). Falls back to a built-in
//! simulator if no HackRF is present, so the app always runs.
//!
//! Receive-only — nothing is ever transmitted.

mod dsp;

use std::sync::Arc;
use std::time::Duration;

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use num_complex::Complex;
use serde::Deserialize;
use tokio::sync::{broadcast, mpsc};
use tower_http::services::{ServeDir, ServeFile};

use dsp::{extract, synth, Analyzer, Frame, Rng, SdrInfo, N};

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

    // start tuned to the FM band (mission 1 territory)
    let init = Tune { center_hz: 98.0e6, fs: 8.0e6, gain: 32.0 };
    {
        let frames = frame_tx.clone();
        std::thread::spawn(move || sdr_loop(sim, frames, cmd_rx, init));
    }

    let state = AppState { frames: frame_tx, cmds: cmd_tx };
    let index = format!("{static_dir}/index.html");
    let serve = ServeDir::new(&static_dir).fallback(ServeFile::new(index));
    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/api/tune", post(tune))
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
) {
    let mut cur = init;
    loop {
        if !sim_forced {
            if let Some((args, info)) = probe() {
                eprintln!("SDR detected: {} (serial {})", info.label, info.serial);
                if let Err(e) = real_loop(&frames, &mut cmds, &mut cur, args, &info) {
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
        sim_loop(&frames, &mut cmds, &mut cur, &sim, sim_forced);
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
) {
    let mut rng = Rng::new(0xC0FFEE);
    let start = std::time::Instant::now();
    loop {
        while let Ok(c) = cmds.try_recv() {
            *cur = c;
        }
        let db = synth(cur.center_hz, cur.fs, &mut rng);
        let _ = frames.send(Arc::new(extract(&db, cur.center_hz, cur.fs, cur.gain, info)));
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
        for _ in 0..AVG {
            match stream.read(&mut [&mut buf], 1_000_000) {
                Ok(n) if n == N => {
                    an.accumulate(&buf);
                    errors = 0;
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
