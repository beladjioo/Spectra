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

> 👉 Repère une signature large bande OFDM : [Capstone — détecter un drone](#mission:drone)
