# Bruit de fond, SNR et sensibilité

Branche un récepteur sur rien : tu vois quand même une ligne basse, agitée. C'est le **bruit de fond** (noise floor) — l'énergie thermique aléatoire toujours présente, plus le bruit ajouté par le récepteur lui-même. Aucun signal ne peut être lu *en dessous* de ce plancher.

Un signal n'est utile que s'il **dépasse** ce plancher. L'écart entre les deux, c'est le **SNR** (Signal-to-Noise Ratio), en dB :

`SNR = puissance_signal_dB − plancher_dB`

Plus le SNR est grand, plus le signal est propre et facile à décoder. Une station FM proche peut culminer à +40 dB au-dessus du plancher ; un capteur lointain à peine +6 dB.

Deux leviers pour améliorer le SNR :
- **Monter le signal** : une meilleure [[antennes|antenne]], mieux orientée, ou se rapprocher.
- **Baisser le bruit** : régler le [[hackrf|gain]] intelligemment (voir le piège de la saturation), s'éloigner des sources d'interférence.

La **sensibilité** d'un récepteur, c'est le plus petit signal qu'il peut encore extraire du bruit. La **plage dynamique**, c'est l'écart entre le plus faible et le plus fort qu'il gère sans saturer — cruciale quand un émetteur puissant côtoie un émetteur faible.

Le détecteur de l'académie utilise exactement cette idée : il fixe le plancher (≈ 20ᵉ percentile des points) puis ne retient que ce qui dépasse `plancher + seuil`.

> 👉 Mesure le SNR d'une station : [Capter une radio FM](#mission:fm)

Lié : [[decibels]] · [[fft-spectre]]
