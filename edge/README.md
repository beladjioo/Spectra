# Spectra edge

The sensor side: a HackRF on a Raspberry Pi / mini-PC running k3s, with Flux pulling
this folder so each sensor self-heals from git.

## Hardware

- HackRF One (+ a decent antenna for your target band — 868 MHz here)
- Raspberry Pi 4/5 (arm64) or any mini-PC (amd64)
- Stable USB power; the HackRF is power-hungry under continuous sweep

## Bring-up

```bash
# 1. Install k3s on the sensor node
curl -sfL https://get.k3s.io | sh -

# 2. Label the node so the DaemonSet schedules here
kubectl label node "$(hostname)" spectra.io/hackrf=true

# 3. Create the MQTT credentials secret (kept out of git)
kubectl create namespace spectra-edge
kubectl -n spectra-edge create secret generic spectra-mqtt-creds \
  --from-literal=username='sensor-paris-13' \
  --from-literal=password='REDACTED'

# 4. Install Flux and point it at edge/flux/ in your repo
flux bootstrap github \
  --owner=CHANGEME --repository=spectra \
  --path=edge/flux --personal
```

## Verifying the radio locally (no k8s)

```bash
hackrf_info                     # HackRF detected?
hackrf_sweep -f 863:870 -1      # one ISM sweep, CSV to stdout
rtl_433 -d soapy:driver=hackrf -f 868.3M -F json   # decode devices
```

## Build the agent image

From the repo root: `make edge-build` (multi-arch via buildx).

## Legal note

Spectra is **receive-only**. It never transmits. Passive reception of public RF is
generally permitted, but decoding/storing some signals (and any retransmission) is
regulated and jurisdiction-dependent. Know your local rules before deploying.
