# Quel matériel pour débuter ?

Bonne nouvelle : la radio logicielle a rendu l'écoute du spectre **ridiculement abordable**. Voici le guide honnête, sans matériel inutile.

## Option 1 — la clé RTL-SDR (~30–40 €) : commence ici

Une clé USB de la taille d'un briquet, dérivée des tuners TNT. La référence : **RTL-SDR Blog V3 ou V4** (évite les clones sans marque, souvent bruyants et sans TCXO).

- Couverture **~500 kHz à 1766 MHz** (la V3/V4 reçoit même la HF en mode « direct sampling »).
- **2,4 MSps** : une fenêtre de ~2,4 MHz — largement assez pour la FM, l'aviation, l'ISM, l'ADS-B.
- **Réception seule** : aucun risque réglementaire.
- Et surtout : **elle fonctionne ici même** — onglet *Explorer* → « Brancher mon SDR (USB) » (Chrome/Edge). Rien à installer, le navigateur la pilote.

## Option 2 — le HackRF One (~300–350 €) : pour aller plus loin

- Couverture **1 MHz à 6 GHz** : il voit le 2,4 GHz (WiFi, drones), invisible pour une RTL-SDR.
- **Jusqu'à 20 MSps** : des fenêtres dix fois plus larges.
- **Émission possible** (half-duplex) — donc interdite sans licence : voir [[legal-securite]]. L'académie reste en réception.
- C'est le cœur de l'appliance Pi d'OpenHertz, et il marche aussi en WebUSB ici.

| | RTL-SDR V3/V4 | HackRF One |
|---|---|---|
| Prix | ~35 € | ~330 € |
| Couverture | 0,5–1766 MHz | 1–6000 MHz |
| Largeur (MSps) | 2,4 | 20 |
| Émission | non | oui (licence !) |
| Premier achat ? | **oui** | quand tu sauras pourquoi |

## Les premières antennes

L'antenne fournie est un compromis. Très vite : un **dipôle réglable** (le kit RTL-SDR Blog est excellent), une **λ/4 magnétique** à poser sur un toit de voiture ou un radiateur, et plus tard une antenne dédiée par bande — voir [[antennes]].

## Installation selon ton système

- **Windows** : lance Zadig (zadig.akeo.ie), sélectionne la clé, installe le pilote **WinUSB**. Indispensable pour WebUSB.
- **Linux** : une règle udev pour autoriser l'accès sans root, puis rebranche :
  `echo 'SUBSYSTEM=="usb", ATTRS{idVendor}=="0bda", MODE="0666"' | sudo tee /etc/udev/rules.d/20-rtlsdr.rules && sudo udevadm control --reload`
  (pour un HackRF, remplace l'idVendor par `1d50`.)
- **macOS** : rien à faire.
- Puis Chrome/Edge → *Explorer* → **Brancher mon SDR**.

## Les pièges à éviter

- Les clones à 12 € : dérive en fréquence, bruit, faux « R820T2 ». Le **TCXO** des V3/V4 compte vraiment (ex. pour rester calé sur l'ADS-B).
- Les antennes « miracle » large bande à gain annoncé fantaisiste.
- Acheter un HackRF « pour plus tard » avant d'avoir épuisé ce qu'une RTL-SDR enseigne — c'est-à-dire beaucoup.

> 👉 Matériel branché ? Va vérifier le bruit de fond : [Premier contact](#mission:first-contact)

Lié : [[hackrf]] · [[antennes]] · [[bandes-a-explorer]]
