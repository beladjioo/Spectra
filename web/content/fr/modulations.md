# Modulations : graver l'information sur une onde

Une [[ondes-radio|porteuse]] nue ne dit rien. **Moduler**, c'est faire varier une de ses propriétés au rythme de l'information. Trois propriétés possibles : l'**amplitude**, la **fréquence**, la **phase**.

**Analogique**
- **AM** (amplitude) : l'info module la hauteur de la porteuse. Simple, mais sensible au bruit d'amplitude. (radio AM, aviation)
- **FM** (fréquence) : l'info module la fréquence. Robuste au bruit → la qualité de la radio FM. Dans le [[waterfall]], une station FM est une raie large (~200 kHz) et stable.

**Numérique** — on transmet des **symboles** (des bits) :
- **ASK / OOK** : on allume/éteint la porteuse. Beaucoup de télécommandes 433 MHz.
- **FSK** : on saute entre deux (ou plus) fréquences. Beaucoup de capteurs [[bandes-a-explorer|ISM]], LoRa en est un cousin (chirp).
- **PSK** : on code l'info dans la **phase** (d'où l'intérêt des échantillons [[iq|I/Q]] qui mesurent la phase).
- **OFDM** : des centaines de sous-porteuses en parallèle → gros débit, signal **large bande**. C'est le WiFi, et le lien vidéo des drones.

**Reconnaître à l'œil** : largeur de bande, stabilité, motif temporel et saut de fréquence dans le waterfall te disent souvent *quel type* de signal tu regardes — avant même tout décodage.

## Reconnaître au waterfall : la table d'identification

| Signal | Largeur | Motif dans le [[waterfall]] |
|---|---|---|
| FM broadcast | ~200 kHz | raie large, continue, stable |
| NFM (talkies, relais) | 12,5 kHz | raie fine, intermittente |
| AM aviation | ~8 kHz | porteuse fine + voix par bouffées |
| CW (Morse) | < 500 Hz | pointillés très fins |
| FT8 (HF numérique) | 50 Hz | petites tuiles toutes les 15 s (14,074 MHz) |
| LoRa | 125 kHz | chirps diagonaux brefs |
| WiFi/OFDM | 20–40 MHz | bloc large et granuleux |
| Mode S / ADS-B | ~2 MHz | bursts ultra-brefs |

## Et la voix numérique ?

Les talkies modernes (DMR, D-STAR, C4FM) transmettent la voix **en bits** (modulations 4FSK et cousines) : au waterfall, une raie fine au débit régulier, mais rien d'audible en FM — il faut le bon décodeur. Différence détection/décodage : [[decoder-vs-detecter]].

> 👉 Repère une signature large bande OFDM : [Capstone — détecter un drone](#mission:drone)
