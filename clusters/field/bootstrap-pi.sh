#!/usr/bin/env bash
# Spectra field box — one-shot bootstrap for a Raspberry Pi 5 (arm64).
# Turns a Pi + HackRF + battery into a portable, GitOps-driven LoRa survey node.
# Run ON THE PI (Raspberry Pi OS / Ubuntu, 64-bit). Idempotent.
#
#   curl -sfL https://raw.githubusercontent.com/beladjioo/Spectra/main/clusters/field/bootstrap-pi.sh | bash
#
set -euo pipefail
REPO_RAW="https://raw.githubusercontent.com/beladjioo/Spectra/main"

echo "==> 1/5 system packages (hackrf tools + mDNS so the phone can use spectra.local)"
sudo apt-get update -qq
sudo apt-get install -y --no-install-recommends hackrf avahi-daemon curl
sudo hostnamectl set-hostname spectra 2>/dev/null || true   # -> https://spectra.local

echo "==> 2/5 check the HackRF"
hackrf_info | grep -E "Found HackRF|Serial number" || {
  echo "!! No HackRF detected — plug it into the Pi's USB and re-run."; exit 1; }

echo "==> 3/5 k3s (single-node)"
if ! command -v k3s >/dev/null; then curl -sfL https://get.k3s.io | sh -; fi
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
until sudo k3s kubectl get nodes >/dev/null 2>&1; do sleep 3; done
KUBECTL="sudo k3s kubectl"

echo "==> 4/5 ArgoCD + the field app-of-apps (same Git repo)"
$KUBECTL create namespace argocd --dry-run=client -o yaml | $KUBECTL apply -f -
$KUBECTL apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
$KUBECTL -n argocd rollout status deploy/argocd-server --timeout=300s
$KUBECTL apply -f "$REPO_RAW/clusters/field/root-app.yaml"

echo "==> 5/5 label this node so the agent grabs the HackRF"
$KUBECTL label node "$(hostname)" spectra.io/hackrf=true --overwrite

cat <<EOF

✅ Spectra field box ready.
   ArgoCD is deploying mosquitto + agent + gateway + web from git.
   On your PHONE (joined to the same network — see PI-BOX section of the README):
       https://spectra.local:30943      (or https://<pi-ip>:30943)
   Accept the one-time self-signed cert, allow location, start the survey.
EOF
