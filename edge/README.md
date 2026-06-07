# edge/drone-agent — standalone drone detector (reference)

This is the original Rust drone-presence detector: it reads IQ from a HackRF at a fixed
2.44 GHz, runs an FFT, flags wideband bursts, and publishes them over MQTT. It is **kept
as a reference / starting point** — its analysis now lives, generalised into a *tunable*
spectrum engine, in [`../server/src/dsp.rs`](../server/src/dsp.rs), and the drone is the
capstone mission of **RF Academy** (the deployed product).

It is no longer part of the GitOps deployment (that's `apps/rf-academy/`). Build/run it
on its own only if you want the dedicated MQTT-publishing agent:

```bash
sudo apt-get install -y libsoapysdr-dev pkg-config clang   # for cargo check/build
cd drone-agent
cargo build --release
SPECTRA_NODE_ID=dev MQTT_HOST=127.0.0.1 ./target/release/spectra-drone-agent
```

Receive-only — it never transmits. Passive RX of public RF is generally permitted, but
rules are jurisdiction-dependent; know yours before deploying.
