//! Spectra drone-agent (edge, Rust) — passive drone-presence detector.
//!
//! Captures wideband IQ from a HackRF around 2.44 GHz, runs an FFT power
//! spectrum, and flags WIDEBAND bursts (the OFDM video/control link of drones
//! like DJI OcuSync). v1 is a wideband-activity detector — it reports candidate
//! emitters (center / bandwidth / power); WiFi can still trigger it (filtered
//! later by hop/burst signature). Publishes detections + a downsampled spectrum
//! to MQTT `spectra/<node>/drone` for the web map/UI.
//!
//! Receive-only. Nothing is transmitted.

use std::time::{Duration, SystemTime, UNIX_EPOCH};

use num_complex::Complex;
use rumqttc::{Client, MqttOptions, QoS};
use rustfft::FftPlanner;
use serde::Serialize;
use soapysdr::Direction::Rx;

const N: usize = 4096; // FFT size
const FRAMES_AVG: usize = 32; // averaged FFTs per published spectrum
const SNR_DB: f32 = 8.0; // a band is "occupied" if > noise + SNR_DB
const MIN_DRONE_BW_MHZ: f32 = 5.0; // wideband threshold for a drone candidate

#[derive(Serialize)]
struct Detection {
    center_mhz: f32,
    bandwidth_mhz: f32,
    power_db: f32,
    snr_db: f32,
}

#[derive(Serialize)]
struct Report {
    node_id: String,
    band_center_mhz: f32,
    span_mhz: f32,
    noise_floor_db: f32,
    drone_suspected: bool,
    detections: Vec<Detection>,
    bins: Vec<f32>, // downsampled spectrum (dB) for the UI
    ts: f64,
}

fn now_ts() -> f64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs_f64()
}

fn env(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let node = env("SPECTRA_NODE_ID", "drone-node");
    let mqtt_host = env("MQTT_HOST", "mosquitto.spectra.svc");
    let mqtt_port: u16 = env("MQTT_PORT", "1883").parse().unwrap_or(1883);
    let fs: f64 = env("SDR_SAMPLE_RATE", "20000000").parse().unwrap_or(20e6);
    let center: f64 = env("SDR_CENTER_HZ", "2440000000").parse().unwrap_or(2.44e9);

    // --- MQTT (drive the event loop in a background thread) ---
    let mut opts = MqttOptions::new(format!("spectra-drone-{node}"), &mqtt_host, mqtt_port);
    opts.set_keep_alive(Duration::from_secs(30));
    let (client, mut connection) = Client::new(opts, 16);
    std::thread::spawn(move || {
        for _ in connection.iter() { /* keep the connection serviced */ }
    });

    // --- SDR ---
    let dev = soapysdr::Device::new("driver=hackrf")?;
    dev.set_sample_rate(Rx, 0, fs)?;
    dev.set_frequency(Rx, 0, center, ())?;
    let _ = dev.set_gain(Rx, 0, 40.0);
    let mut stream = dev.rx_stream::<Complex<f32>>(&[0])?;
    stream.activate(None)?;

    let mut planner = FftPlanner::<f32>::new();
    let fft = planner.plan_fft_forward(N);

    let topic = format!("spectra/{node}/drone");
    let bin_hz = fs / N as f64;
    let mut buf = vec![Complex::<f32>::new(0.0, 0.0); N];
    let mut acc = vec![0f32; N];

    eprintln!("drone-agent: {node} @ {:.3} GHz, {:.0} Msps", center / 1e9, fs / 1e6);

    loop {
        // average FRAMES_AVG FFTs into a power spectrum
        acc.iter_mut().for_each(|x| *x = 0.0);
        let mut frames = 0;
        for _ in 0..FRAMES_AVG {
            match stream.read(&mut [&mut buf], 1_000_000) {
                Ok(n) if n == N => {}
                _ => continue,
            }
            let mut spec = buf.clone();
            fft.process(&mut spec);
            for (i, c) in spec.iter().enumerate() {
                acc[i] += c.norm_sqr();
            }
            frames += 1;
        }
        if frames == 0 {
            continue;
        }

        // fftshift to DC-centered + convert to dB
        let mut db = vec![0f32; N];
        for i in 0..N {
            let src = (i + N / 2) % N;
            let p = acc[src] / frames as f32 / N as f32;
            db[i] = 10.0 * (p + 1e-12).log10();
        }

        // noise floor = ~20th percentile
        let mut sorted = db.clone();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
        let noise = sorted[N / 5];
        let thr = noise + SNR_DB;

        // find contiguous occupied regions; flag wideband ones as drone candidates
        let mut detections = Vec::new();
        let mut i = 0usize;
        while i < N {
            if db[i] > thr {
                let start = i;
                let mut peak = db[i];
                while i < N && db[i] > thr {
                    peak = peak.max(db[i]);
                    i += 1;
                }
                let width_bins = i - start;
                let bw_mhz = (width_bins as f64 * bin_hz / 1e6) as f32;
                if bw_mhz >= MIN_DRONE_BW_MHZ {
                    let mid = start + width_bins / 2;
                    let off_hz = (mid as f64 - N as f64 / 2.0) * bin_hz;
                    detections.push(Detection {
                        center_mhz: ((center + off_hz) / 1e6) as f32,
                        bandwidth_mhz: bw_mhz,
                        power_db: peak,
                        snr_db: peak - noise,
                    });
                }
            } else {
                i += 1;
            }
        }

        // downsample spectrum to ~256 bins for the UI
        let step = N / 256;
        let bins: Vec<f32> = (0..256).map(|k| db[k * step]).collect();

        let report = Report {
            node_id: node.clone(),
            band_center_mhz: (center / 1e6) as f32,
            span_mhz: (fs / 1e6) as f32,
            noise_floor_db: noise,
            drone_suspected: !detections.is_empty(),
            detections,
            bins,
            ts: now_ts(),
        };
        let payload = serde_json::to_vec(&report)?;
        let _ = client.publish(&topic, QoS::AtMostOnce, false, payload);
    }
}
