# Le waterfall (cascade temporelle)

Le spectre seul ne montre que l'instant présent. Le **waterfall** ajoute le **temps** : chaque nouvelle FFT devient une ligne horizontale colorée (la couleur = la puissance de chaque fréquence), et les lignes défilent vers le bas. On lit donc une fréquence en X, le temps en Y.

## Le bestiaire : apprendre à lire les formes

C'est l'outil le plus puissant pour *comprendre* un signal, parce qu'il révèle son **comportement dans le temps** :

```
 fréquence →                          ce que c'est
 ┃                                    porteuse stable
 ┃          ▌ ▌    ▌                  bursts intermittents (capteurs, LoRa)
 ┃         ╱  ╱   ╱                   chirps diagonaux (LoRa)
 ┃      ▖ ▘▗  ▘ ▖ ▗ ▘                 saut de fréquence (Bluetooth)
 ┃   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                  bloc large granuleux (WiFi/OFDM, drone)
 ↓ temps
```

- Une **raie verticale continue** = une porteuse stable (une station FM, une balise).
- Des **traits courts et espacés** = des **bursts** intermittents (capteurs [[bandes-a-explorer|ISM]], télécommandes).
- Des **diagonales brèves** = des chirps **LoRa**.
- Des **points qui sautillent** sur toute la bande = du **saut de fréquence** (Bluetooth, certains drones).
- Une **bande large et floue** = un signal large bande type WiFi/OFDM ou lien vidéo de drone.

## Régler l'échelle : là où tout se joue

Le choix de la **palette** et de l'échelle (min/max en dB) change tout : bien réglé, un signal faible saute aux yeux ; mal réglé, il se noie.

- **Min** : à caler juste sous le [[bruit-et-snr|plancher]]. Trop bas, tout est sombre et tu perds le contraste ; trop haut, tu effaces les signaux faibles.
- **Max** : juste au-dessus de ton pic le plus fort. L'écart min–max est ta « fenêtre de contraste ».
- Dans l'académie, l'échelle s'ajuste automatiquement autour du plancher et du pic courant — sur d'autres logiciels (SDR++, GQRX), ce réglage manuel est la première chose à apprivoiser.

## La méthode de lecture en trois questions

1. **Largeur ?** Fine (kHz) = voix/télémétrie ; moyenne (100–200 kHz) = FM broadcast/LoRa ; très large (MHz) = OFDM, vidéo.
2. **Continuité ?** Permanent = broadcast/balise ; périodique = capteur (compte les secondes entre bursts !) ; erratique = activité humaine.
3. **Mouvement ?** Fréquence fixe = canal assigné ; dérive lente = oscillateur bas de gamme ou Doppler (satellites !) ; sauts = FHSS.

Avec ces trois réponses, tu **reconnais une [[modulations|modulation]] à l'œil** avant même de la décoder. La période d'un capteur, la dérive Doppler d'un satellite, la signature d'un drone : tout est dans ce dessin.

## À toi de jouer

1. Une raie fine apparaît 1 s toutes les 60 s exactement. Hypothèse ? (Un capteur à période fixe — compteur, station météo.)
2. Une raie dérive lentement vers le bas en 10 minutes. Hypothèse ? (Doppler d'un satellite qui passe, ou oscillateur qui chauffe.)
3. Tout le waterfall est orange vif. Premier réflexe ? (Échelle mal calée ou gain trop fort — recadre min/max avant de conclure.)

> 👉 Observe un waterfall en direct dans n'importe quelle mission, par ex. [Capter une radio FM](#mission:fm)
