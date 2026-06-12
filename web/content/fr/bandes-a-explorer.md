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

## Pour aller plus loin : le carnet de chasse

| Bande | Quoi | Pourquoi c'est fascinant |
|---|---|---|
| **27 MHz** | Citizen Band | les routiers, l'ancêtre libre de tout |
| **77,5 kHz** | DCF77 (horloge atomique allemande) | l'heure officielle de millions de réveils |
| **131–137 MHz** | ACARS | les « SMS » des avions de ligne, décodables |
| **174–240 MHz** | DAB+ | la radio numérique, gros blocs OFDM |
| **400–406 MHz** | **Radiosondes météo** | des ballons à 30 km d'altitude — certains les retrouvent au sol ! |
| **446 MHz** | PMR446 | talkies-walkies sans licence |
| **466 MHz** | POCSAG | les messageries des hôpitaux, encore vivantes |

Les meilleures heures : l'**ISM s'anime en journée** (capteurs, télécommandes), la **HF s'ouvre le soir** (propagation, voir [[propagation]]), l'**ADS-B ne dort jamais**.

**Écoute responsable** : on observe, on apprend — on ne divulgue pas le contenu de communications privées, même décodables. Relis [[legal-securite]] avant d'explorer.
