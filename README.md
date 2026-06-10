# RF Academy — apprends la radio en la pratiquant, avec un vrai SDR

> La « bible du SDR » gamifiée : branche un **RTL-SDR (~30 €)** ou un **HackRF**,
> et progresse mission par mission — lire un spectre, capter une station FM
> (démodulée en direct), surprendre un burst LoRa, survivre au chaos du 2.4 GHz,
> **décoder les avions en ADS-B**, et détecter un drone. Moteur RF et backend
> 100 % **Rust** ; UI React ; base de connaissances en français ; préparation à
> l'**examen radioamateur** intégrée.

Passif, **réception seule** — le SDR ne fait qu'écouter, rien n'est jamais émis.

## Pourquoi

- **La RF est intimidante.** Les outils SDR classiques jettent un mur de boutons
  à la figure. RF Academy est un parcours guidé et gamifié, de « c'est quoi un
  dB ? » jusqu'à « j'ai décodé un avion de ligne ».
- **Du vrai décodage, pas que de la détection.** Le moteur Rust démodule la FM
  (désaccentuation 50 µs comprise) et décode le Mode S/ADS-B (CRC-24, CPR
  global) — sur le CPU d'un Pi 5, sans GPU.
- **Ça marche toujours.** Sans matériel, un simulateur intégré prend le relais :
  l'app se démontre, se teste en CI, et sert de démo gratuite.
- **En français.** Curriculum, bibliothèque type Obsidian (wikilinks,
  backlinks) et QCM type ANFR — une niche que personne ne couvre.

## Gratuit vs Pro

| | Gratuit | Pro |
|---|---|---|
| Missions 1–4 (spectre, FM, ISM 868, 2.4 GHz) | ✅ | ✅ |
| Console SDR libre + écoute FM démodulée | ✅ | ✅ |
| Bibliothèque complète (27 notes) | ✅ | ✅ |
| Révision examen (répétition espacée, 40 questions) | ✅ | ✅ |
| ✈️ **Radar ADS-B** (décodage réel des avions) | — | ✅ |
| 🚁 **Capstone drone** (lien vidéo large bande) | — | ✅ |
| ⏱️ **Examens blancs** chronométrés, notés par domaine | — | ✅ |

La licence est une clé hors-ligne (`RFA-XXXXXX-XXXX`, générée par
`tools/genkey.mjs`) : l'appareil fonctionne sans internet, souvent en zone
blanche. C'est une barrière honnête, pas du DRM — le code est Apache-2.0, la
clé finance le contenu.

## Architecture — une image, un binaire

```
NŒUD (Pi 5 + SDR, k3s + ArgoCD)            ┌─ navigateur (LAN ou AP WiFi du Pi)
  rf-academy (Rust, DaemonSet, USB)         │   missions · console · examen · bibliothèque
   ┌──────────────────────────────────────┐ │
   │ SDR (HackRF/RTL-SDR, hot-plug)        │ │
   │  → rustfft (fenêtre Hann) → spectre   │ │
   │  → démod FM → PCM /audio (WS)         ├─┘  POST /api/tune
   │  → décodeur ADS-B 1090 (CRC, CPR)     │    GET  /ws (frames JSON)
   │ axum : UI React embarquée + WS        │
   └──────────────────────────────────────┘
      :8090 → NodePort 30920
```

Pas de MQTT, pas de gateway, pas de nginx — un seul binaire Rust possède la
radio, fait le DSP et sert l'UI. Sans SDR branché : simulateur (spectres et
trafic ADS-B synthétiques).

## Dépôt

```
.
├── server/               # backend Rust (axum + tokio + rustfft + soapysdr)
│   ├── src/dsp.rs        # analyse spectrale + démod FM (testés)
│   └── src/adsb.rs       # décodeur Mode S/ADS-B complet (testé sur vecteurs connus)
├── web/                  # UI React + Tailwind : missions, console, examen, bibliothèque
│   ├── content/          # la base de connaissances (markdown, wikilinks)
│   └── src/quiz.ts       # banque de questions type ANFR
├── tools/genkey.mjs      # génération de clés Pro
├── Dockerfile            # une image : UI → Rust → runtime (HackRF + RTL-SDR)
├── apps/rf-academy/      # k8s : namespace + configmap + DaemonSet + NodePort
└── clusters/rf-academy/  # ArgoCD app-of-apps + bootstrap-pi.sh par nœud
```

## Déployer (GitOps — la vraie voie)

```bash
# Sur un Pi 5 vierge (arm64), SDR branché en USB :
sudo ./clusters/rf-academy/bootstrap-pi.sh
# installe k3s + ArgoCD, applique l'app-of-apps ; ArgoCD tire l'image et la fait tourner.
```

UI depuis le téléphone/laptop : `http://<ip-du-pi>:30920` — ou en **zone
blanche**, rejoindre l'AP WiFi `RF-Academy` (5 GHz) du Pi → `http://10.42.0.1:30920`.

## Dev local

```bash
cd web && npm install && npm run build
cd ../server && STATIC_DIR=../web/dist cargo run --release   # SDR auto-détecté, sinon sim
# → http://localhost:8090
cargo test        # DSP + décodeur ADS-B (vecteurs de test canoniques)
```

## Le curriculum

| Mission | Bande | Tu apprends | |
|---|---|---|---|
| 📡 Premier contact | FM 98 MHz | spectre, bruit de fond, dB, gain | gratuit |
| 📻 Capter une radio FM | 100.2 MHz | porteuses, SNR, modulation FM | gratuit |
| 📶 ISM 868 | 868.3 MHz | bursts IoT/LoRa, duty-cycle | gratuit |
| 🌐 Le chaos du 2.4 GHz | 2.44 GHz | WiFi/BT, OFDM, occupation | gratuit |
| ✈️ Radar ADS-B | 1090 MHz | démodulation PPM, CRC, décodage CPR | **Pro** |
| 🚁 Capstone : drone | 2.44 GHz | détection de lien vidéo large bande | **Pro** |

Plus l'onglet **🎓 Examen** : 40 questions type ANFR (réglementation +
technique) en répétition espacée, et l'examen blanc chronométré (Pro).

## Licence

Code sous Apache-2.0 (voir `LICENSE`).
