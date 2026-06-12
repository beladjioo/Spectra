# Bruit de fond, SNR et sensibilité

Branche un récepteur sur rien : tu vois quand même une ligne basse, agitée. C'est le **bruit de fond** (noise floor) — l'énergie aléatoire toujours présente. Aucun signal ne peut être lu *en dessous* de ce plancher.

## D'où vient ce bruit ?

- **Thermique** : l'agitation des électrons dans tout conducteur. Incompressible — c'est la physique (−174 dBm/Hz à température ambiante, le « plancher des planchers »).
- **Le récepteur lui-même** : chaque étage ajoute le sien ; on résume cette dégradation par le **facteur de bruit** (noise figure) — quelques dB pour un bon LNA.
- **L'environnement** : alimentations à découpage, écrans, câbles USB, box, LED… En ville, ce bruit *humain* domine largement le thermique sur la plupart des bandes. C'est lui que tu peux combattre.

## Le SNR : la seule mesure qui compte

Un signal n'est utile que s'il **dépasse** le plancher. L'écart entre les deux, c'est le **SNR** (Signal-to-Noise Ratio), en dB :

`SNR = puissance_signal_dB − plancher_dB`

| SNR | Ce que ça donne |
|---|---|
| < 6 dB | présence à peine détectable, rien d'exploitable |
| 6–12 dB | détection fiable, décodage des modes robustes (ADS-B, FT8) |
| 12–20 dB | écoute FM correcte, décodage confortable |
| 20–35 dB | station locale propre, audio limpide |
| > 35 dB | émetteur très proche — surveille la saturation |

Une station FM proche peut culminer à +40 dB au-dessus du plancher ; un capteur lointain à peine +6 dB. C'est ce chiffre que le panneau « Signaux captés » de la console t'affiche en direct.

## Deux leviers (et un piège)

- **Monter le signal** : une meilleure [[antennes|antenne]], mieux placée ([[reglage-antenne]]), ou se rapprocher.
- **Baisser le bruit** : éloigner le SDR des sources parasites (rallonge USB blindée), couper les alimentations suspectes, filtrer.
- **Le piège** : monter le [[hackrf|gain]] ne crée pas de SNR. Le gain amplifie signal *et* bruit ; il sert seulement à placer l'ensemble au-dessus du bruit propre du récepteur. Trop de gain → saturation → SNR *en baisse*.

## Sensibilité et plage dynamique

La **sensibilité** d'un récepteur, c'est le plus petit signal qu'il peut extraire du bruit. La **plage dynamique**, c'est l'écart entre le plus faible et le plus fort qu'il gère *en même temps* sans saturer — cruciale quand un émetteur puissant côtoie un faible (8 bits ≈ 48 dB, voir [[echantillonnage]]).

Le détecteur de l'académie applique exactement cette logique : il estime le plancher (≈ 20ᵉ percentile des bins) puis ne retient que ce qui dépasse `plancher + seuil`.

## À toi de jouer

1. Plancher à −85 dB, pic FM à −52 dB : SNR ? (33 dB — écoute limpide.)
2. En débranchant l'écran externe, ton plancher descend de 6 dB. Qu'as-tu gagné ? (+6 dB de SNR sur *tous* les signaux — l'équivalent d'une antenne 4× plus efficace, gratuit.)
3. Gain au maximum : le plancher monte de 20 dB et le pic de 20 dB aussi. SNR gagné ? (Zéro — et tu risques la saturation.)

> 👉 Mesure le SNR d'une station : [Capter une radio FM](#mission:fm)

Lié : [[decibels]] · [[fft-spectre]] · [[reglage-antenne]]
