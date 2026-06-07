# Bandes intéressantes à explorer

Une carte au trésor pour ton HackRF. (Les fréquences varient selon les pays — ici, l'Europe.)

| Bande | Quoi | À l'écran |
|---|---|---|
| **88–108 MHz** | Radio FM commerciale | raies larges (~200 kHz), stables |
| **118–137 MHz** | Aviation (AM) | porteuses intermittentes, voix |
| **1090 MHz** | **ADS-B** : position des avions | bursts très courts, nombreux |
| **162 MHz** | **AIS** : position des navires | bursts |
| **137 MHz** | **NOAA APT** : images météo satellites | balayage lent au passage du satellite |
| **433 / 868 MHz** | **ISM** : capteurs, télécommandes, LoRa | bursts brefs, intermittents |
| **2,4 GHz** | WiFi, Bluetooth, drones | bandes larges, sauts de fréquence |

Pour chaque cible, la démarche est la même : bonne [[antennes|antenne]], accord, [[waterfall]], identification de la [[modulations|modulation]]. Certains signaux se contentent d'être **détectés** (présence), d'autres se **décodent** avec un outil dédié — voir [[decoder-vs-detecter]].

Les missions de l'académie te font pratiquer trois de ces bandes :

> 👉 [ISM 868](#mission:ism868) · [Le chaos du 2.4 GHz](#mission:wifi24) · [Capter une radio FM](#mission:fm)

Pense toujours au cadre légal avant d'explorer : [[legal-securite]].
