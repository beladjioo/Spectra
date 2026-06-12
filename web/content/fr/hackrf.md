# Le HackRF One

Le HackRF One est un SDR très polyvalent — le couteau suisse de l'exploration du spectre.

| Caractéristique | Valeur | Ce que ça veut dire |
|---|---|---|
| Couverture | **1 MHz → 6 GHz** | de la radio AM au WiFi 5 GHz, une fenêtre énorme |
| Sample rate | jusqu'à **20 MSps** | ~20 MHz observés d'un coup (voir [[echantillonnage]]) |
| Résolution | **8 bits** | plage dynamique modeste (~48 dB) → le gain se règle finement |
| Duplex | **half-duplex** | il émet *ou* reçoit, jamais les deux — ici, **réception seule** |
| Connecteur | SMA femelle | + ports d'horloge externe (CLKIN/CLKOUT) pour la synchro |
| Alimentation | bus USB | un câble court et de qualité évite bien des mystères |

## La chaîne de gain : trois boutons, un seul but

| Étage | Plage | Rôle | Point de départ conseillé |
|---|---|---|---|
| **Ampli RF** | 0 ou +14 dB | coup de pouce d'entrée | **éteint** (ne l'allumer qu'en dernier) |
| **LNA** (IF) | 0–40 dB, pas de 8 | amplifie côté antenne | 16–24 dB |
| **VGA** (bande de base) | 0–62 dB, pas de 2 | ajuste avant l'échantillonneur | 20–30 dB |

**La méthode** : pars bas, monte le LNA jusqu'à voir tes signaux ressortir du [[bruit-et-snr|plancher]], affine au VGA — et **redescends dès que le plancher entier monte** ou que des pics « fantômes » apparaissent : c'est la **saturation**, et un récepteur saturé invente des signaux qui n'existent pas. Sur 8 bits, mieux vaut un poil trop bas que trop haut.

Dans l'interface de l'académie, le curseur unique répartit intelligemment LNA/VGA pour toi — mais savoir ce qu'il pilote t'aidera sur n'importe quel autre logiciel SDR.

## Les pièges connus (et leurs parades)

- **Le pic central (DC spike)** : un pic immobile pile à la fréquence d'accord, quel que soit le réglage. Artefact de la [[sdr-architecture|conversion directe]], pas un signal — décale-toi de quelques centaines de kHz pour étudier une fréquence précise.
- **FM ultra-puissante en ville** : les émetteurs broadcast peuvent saturer tout l'étage d'entrée même accordé ailleurs. Baisse le LNA, ou ajoute un filtre coupe-FM (~10 €).
- **Bruit USB** : rallonge blindée, loin des hubs et écrans ; le HackRF est sensible à son environnement électrique.
- **Électricité statique** : l'entrée n'est pas protégée contre les fortes décharges — pas d'antenne extérieure sans protection, et on touche du métal avant le connecteur SMA.

## Côté logiciel

- **Dans le navigateur (ce site)** : Chrome/Edge pilotent le HackRF en **WebUSB** — clique « Brancher mon SDR » dans la console. Le numéro de série s'affiche une fois connecté.
- **En ligne de commande** : `hackrf_info` confirme firmware et numéro de série.
- **Sur un serveur/Pi** : via **SoapySDR** (`driver=hackrf`), la même API partout.

Il lui faut une [[antennes|antenne]] adaptée à la bande visée — l'ANT500 fournie est un compromis, et le [[reglage-antenne|guide de réglage]] t'aidera à en tirer le maximum.

## À toi de jouer

1. Le plancher de bruit vient de bondir de 15 dB d'un coup sur toute la fenêtre. Diagnostic ? (Saturation — baisse le LNA.)
2. Pourquoi laisser l'ampli RF éteint par défaut ? (+14 dB *avant* tout filtrage : il sature en premier, surtout en ville.)
3. Quelle différence verras-tu entre 8 et 20 MSps sur la bande FM ? (Fenêtre 8 vs 20 MHz — plus de stations visibles, mais plus de charge machine.)

> 👉 Confirme qu'il répond : [Premier contact](#mission:first-contact)
