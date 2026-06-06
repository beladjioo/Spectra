# Spectra edge agent image.
# Bundles hackrf tools + rtl_433 (with SoapySDR HackRF support) + the Python agent.
# Multi-arch: builds for arm64 (Raspberry Pi) and amd64 (mini-PC).
FROM debian:bookworm-slim

# All from official Debian packages — no third-party source builds.
# python3-soapysdr + numpy/scipy power our own FM demodulator (fm_demod.py);
# ffmpeg encodes its audio to MP3 for the live stream.
RUN apt-get update && apt-get install -y --no-install-recommends \
        hackrf \
        rtl-433 \
        soapysdr-tools \
        soapysdr-module-hackrf \
        libsoapysdr0.8 \
        python3-soapysdr \
        python3-numpy \
        python3-scipy \
        ffmpeg \
        python3 \
        python3-paho-mqtt \
        python3-yaml \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY agent.py fm_demod.py lora_activity.py config.example.yaml ./

# Default config path; override with a mounted config.yaml + env secrets.
ENV SPECTRA_CONFIG=/app/config.yaml \
    SPECTRA_LOG_LEVEL=INFO

# USB access to the HackRF requires the container to run privileged or with the
# device mapped (see edge/flux/ for the k3s DaemonSet that wires /dev/bus/usb).
ENTRYPOINT ["python3", "/app/agent.py"]
