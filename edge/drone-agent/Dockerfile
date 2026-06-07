# Build the Rust drone-agent, then a slim runtime with the SoapySDR HackRF module.
FROM rust:1.83-bookworm AS build
RUN apt-get update && apt-get install -y --no-install-recommends \
        libsoapysdr-dev clang libclang-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Cargo.toml ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
        hackrf soapysdr-module-hackrf libsoapysdr0.8 ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/release/spectra-drone-agent /usr/local/bin/spectra-drone-agent
ENTRYPOINT ["/usr/local/bin/spectra-drone-agent"]
