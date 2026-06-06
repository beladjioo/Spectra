#!/bin/sh
# Generate a self-signed cert on first start so the UI can serve HTTPS (required
# for browser geolocation over the LAN). The browser shows a one-time warning.
set -e
CERT=/etc/nginx/certs
if [ ! -f "$CERT/tls.crt" ]; then
  mkdir -p "$CERT"
  openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
    -keyout "$CERT/tls.key" -out "$CERT/tls.crt" \
    -subj "/CN=spectra-survey" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" >/dev/null 2>&1
fi
exec nginx -g 'daemon off;'
