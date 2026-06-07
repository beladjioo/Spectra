# Le waterfall (cascade temporelle)

Le spectre seul ne montre que l'instant présent. Le **waterfall** ajoute le **temps** : chaque nouvelle FFT devient une ligne horizontale colorée (la couleur = la puissance de chaque fréquence), et les lignes défilent vers le bas. On lit donc une fréquence en X, le temps en Y.

C'est l'outil le plus puissant pour *comprendre* un signal, parce qu'il révèle son **comportement dans le temps** :

- Une **raie verticale continue** = une porteuse stable (une station FM, une balise).
- Des **traits courts et espacés** = des **bursts** intermittents (capteurs [[bandes-a-explorer|ISM]], LoRa, télécommandes).
- Des **motifs qui sautent en fréquence** = du **saut de fréquence** (Bluetooth, certains drones).
- Une **bande large et floue** = un signal large bande type WiFi/OFDM ou lien vidéo de drone.

Le choix de la **palette de couleurs** et de l'échelle (min/max en dB) change tout : bien réglé, un signal faible saute aux yeux ; mal réglé, il se noie. Dans l'académie, l'échelle s'ajuste autour du [[bruit-et-snr|plancher]] et du pic courant.

Avec l'habitude, tu **reconnais une modulation à l'œil** dans le waterfall avant même de la décoder — voir [[modulations]].

> 👉 Observe un waterfall en direct dans n'importe quelle mission, par ex. [Capter une radio FM](#mission:fm)
