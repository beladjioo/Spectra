# RF Academy — one image: the all-Rust backend with the built React UI baked in.
# Build context is the repo root.

# 1. Build the React UI
FROM node:20-bookworm-slim AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# 2. Build the Rust backend
FROM rust:1.83-bookworm AS build
RUN apt-get update && apt-get install -y --no-install-recommends \
        libsoapysdr-dev clang libclang-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY server/Cargo.toml server/Cargo.lock ./
COPY server/src ./src
RUN cargo build --release

# 3. Runtime: slim image with the HackRF SoapySDR module
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
        hackrf soapysdr-module-hackrf libsoapysdr0.8 ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/target/release/rf-academy /usr/local/bin/rf-academy
COPY --from=web /web/dist /app/web
ENV STATIC_DIR=/app/web BIND=0.0.0.0:8090
EXPOSE 8090
ENTRYPOINT ["/usr/local/bin/rf-academy"]
