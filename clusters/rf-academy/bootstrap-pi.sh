#!/usr/bin/env bash
# Bootstrap an RF Academy node on a fresh Raspberry Pi 5 (Pi OS 64-bit / Ubuntu
# arm64). Installs k3s + ArgoCD, points ArgoCD at this repo, labels the node so
# the rf-academy DaemonSet schedules on it, and turns the Pi into a self-hosted
# WiFi access point so it works in a white zone (no cell coverage): your phone
# joins the Pi's WiFi and opens the app locally. Everything else is GitOps:
# push to main, ArgoCD reconciles.
#
#   sudo ./bootstrap-pi.sh
#
# The network install (k3s/ArgoCD/images) needs internet, so the AP is configured
# LAST — bringing it up takes over wlan0. Update later over ethernet or by
# toggling the AP off (see the notes printed at the end).
#
set -euo pipefail

REPO="https://github.com/beladjioo/Spectra.git"
ROOT_APP_PATH="clusters/rf-academy/root-app.yaml"

# --- field WiFi access point (white-zone access). Override via env. ---
AP_SSID="${AP_SSID:-RF-Academy}"
AP_PASS="${AP_PASS:-rfacademy}"        # WPA2 PSK, 8-63 chars — change it for real deployments
AP_IFACE="${AP_IFACE:-wlan0}"
AP_ADDR="${AP_ADDR:-10.42.0.1/24}"
# 5 GHz on purpose: the HackRF watches 2.4 GHz, so a 2.4 GHz AP would jam the
# detector. Channel 36 is non-DFS and widely allowed.
AP_BAND="${AP_BAND:-a}"
AP_CHANNEL="${AP_CHANNEL:-36}"
SKIP_AP="${SKIP_AP:-0}"                 # SKIP_AP=1 to leave networking untouched

if [[ $EUID -ne 0 ]]; then echo "run with sudo"; exit 1; fi

setup_ap() {
  echo "==> field WiFi access point ($AP_SSID on $AP_IFACE, 5 GHz)"
  if ! command -v nmcli >/dev/null; then
    echo "   installing NetworkManager (needed for the AP)"
    apt-get install -y network-manager
    systemctl enable --now NetworkManager
  fi
  nmcli connection delete rf-academy-ap >/dev/null 2>&1 || true
  # 'shared' makes NetworkManager run DHCP for clients and NAT any uplink (eth0)
  # to them, so a phone gets an IP automatically — and internet too if ethernet
  # is plugged in.
  nmcli connection add type wifi ifname "$AP_IFACE" con-name rf-academy-ap \
    autoconnect yes ssid "$AP_SSID"
  nmcli connection modify rf-academy-ap \
    802-11-wireless.mode ap \
    802-11-wireless.band "$AP_BAND" \
    802-11-wireless.channel "$AP_CHANNEL" \
    ipv4.method shared ipv4.addresses "$AP_ADDR" \
    wifi-sec.key-mgmt wpa-psk wifi-sec.psk "$AP_PASS"
  nmcli connection up rf-academy-ap || \
    echo "!! AP failed to come up (5 GHz unsupported here? try: AP_BAND=bg AP_CHANNEL=1) — node still works over ethernet/LAN"
}

echo "==> host tools (hackrf for SDR sanity check, avahi for <hostname>.local)"
apt-get update -y
apt-get install -y hackrf avahi-daemon curl

echo "==> HackRF check (should print a serial)"
hackrf_info || echo "!! HackRF not detected — plug it in via USB and re-check with: hackrf_info"

echo "==> k3s (single node, no traefik — the app serves its own HTTP)"
curl -sfL https://get.k3s.io | sh -s - --disable=traefik --write-kubeconfig-mode=644
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
until kubectl get nodes >/dev/null 2>&1; do sleep 2; done
NODE="$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')"

echo "==> label node $NODE so rf-academy lands here"
kubectl label node "$NODE" spectra.io/hackrf=true --overwrite

echo "==> ArgoCD"
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
echo "   waiting for ArgoCD server..."
kubectl -n argocd rollout status deploy/argocd-server --timeout=300s

echo "==> app-of-apps (ArgoCD now pulls everything from $REPO)"
kubectl apply -f "https://raw.githubusercontent.com/beladjioo/Spectra/main/${ROOT_APP_PATH}"

# AP last: it takes over wlan0, so do it after everything is pulled over the net.
AP_IP="${AP_ADDR%/*}"
if [[ "$SKIP_AP" == "1" ]]; then
  echo "==> SKIP_AP=1 — leaving networking untouched"
else
  setup_ap
fi

cat <<DONE

==> Done.
   ArgoCD admin password:
     kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d; echo

   FIELD / WHITE ZONE — join the Pi's own WiFi from your phone or laptop:
     SSID: ${AP_SSID}   pass: ${AP_PASS}
     then open:  http://${AP_IP}:30920
   Also reachable on a normal LAN: http://<pi-ip>:30920  or  http://${NODE}.local:30920

   UPDATING LATER (needs internet — the AP took wlan0):
     - plug in ethernet (AP clients even get internet through the Pi), or
     - free wlan0 to join a hotspot:   nmcli con down rf-academy-ap
       (re-enable the AP afterwards:)  nmcli con up   rf-academy-ap
DONE
