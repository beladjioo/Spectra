# Spectra field box — portable LoRa coverage survey (Raspberry Pi 5)

A pocket, **GitOps-driven** survey node: a Pi + HackRF + battery runs k3s, ArgoCD
pulls this repo and deploys the lean survey stack (mosquitto + agent + gateway + web).
Your **phone** joins the box's network, opens the UI over HTTPS, and provides the
precise GPS while you walk/drive the commune.

> Use a **dedicated Pi** for the field box — your home cluster's master Pi should stay home.

## Kit

- **Raspberry Pi 5** (64-bit OS: Raspberry Pi OS or Ubuntu)
- **HackRF One** + antenna (retract to ~8 cm for 868 MHz)
- **USB-C PD power bank ≥ 30 W** (Pi 5 wants 5 V/5 A; the HackRF adds ~2.5 W)
- A **phone** (real GPS) for location + display

## 1. Bootstrap the Pi (once)

Plug in the HackRF, then on the Pi:
```bash
curl -sfL https://raw.githubusercontent.com/beladjioo/Spectra/main/clusters/field/bootstrap-pi.sh | bash
```
This installs `hackrf` + `avahi` + k3s + ArgoCD, deploys the field stack, and labels
the node so the agent grabs the HackRF. (Manual steps are in `bootstrap-pi.sh`.)

## 2. Field networking (no home WiFi out there)

Easiest: **your phone is the hotspot, the Pi joins it.** Pre-configure the Pi once to
auto-connect to your phone's hotspot:
```bash
sudo nmcli dev wifi connect "<your-phone-hotspot-SSID>" password "<password>"
```
In the field: enable the phone hotspot → power the Pi (it auto-joins) → on the phone
browse to **https://spectra.local:30943**.

> If `spectra.local` doesn't resolve (older Android), find the Pi's IP in the phone's
> hotspot client list and use `https://<pi-ip>:30943`.

## 3. Survey

1. Open **https://spectra.local:30943** on the phone → accept the one-time self-signed
   cert (needed so the browser GPS works).
2. *Activer ma position* → check the accuracy (±m). A phone gives ~5-10 m.
3. Pick a layer:
   - **📈 Bruit 868** — green = quiet (gateway will hear well), red = noisy/interference.
   - **📶 Activité LoRa** — green = uplinks heard (strong/many), red = dead zone.
4. *Démarrer le relevé* → walk/drive. The map fills with colored points.
5. **⬇ GeoJSON** to export the survey for your report / gateway-placement decision.

## Notes

- **Passive / receive-only** — nothing is transmitted.
- The HackRF is less sensitive than your Multitech SX1302 → the map is **indicative**
  (if the HackRF hears it, the gateway will; not necessarily the reverse).
- LoRa activity = **burst detection** (no DevAddr decode).
- Same repo also bootstraps on a laptop (Linux, or k3s in WSL2 with `usbipd` USB
  passthrough) if you prefer Option A.
