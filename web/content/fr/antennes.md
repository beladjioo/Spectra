# Antennes

L'antenne est le premier maillon — la meilleure DSP ne rattrape pas un mauvais signal capté. Une règle simple : une antenne **résonne** quand sa taille est en rapport avec la [[ondes-radio|longueur d'onde]] de la bande visée.

Le cas le plus courant est le **quart d'onde** : un brin de longueur `λ/4`. À 100 MHz (λ = 3 m) ça fait ~75 cm ; à 868 MHz, ~8,6 cm ; à 2,4 GHz, ~3 cm. C'est pourquoi un télescopique long est parfait pour la FM mais inutilement grand pour le 2,4 GHz, où un petit fouet ou une antenne dédiée fait mieux.

Quelques notions utiles :
- **Gain & directivité** : une antenne directive (Yagi, patch) concentre la réception dans une direction → meilleur [[bruit-et-snr|SNR]] sur une cible, au prix de devoir la pointer.
- **Polarisation** : verticale vs horizontale ; un décalage de 90° entre émetteur et récepteur fait perdre beaucoup de signal.
- **Adaptation (SWR)** : une antenne mal adaptée à sa bande réfléchit l'énergie au lieu de la capter. Une antenne « accordée » sur la bande = transfert maximal.

En pratique : garde **une antenne par grande bande** et change selon la mission. Place-la haut, dégagée, loin du bruit (alimentations, USB, écrans).

## Quelle antenne pour quoi ?

| Type | Gain typique | Diagramme | Idéale pour |
|---|---|---|---|
| Dipôle λ/2 | 2,15 dBi | omni (plan ⊥) | tout débuter : FM, airband |
| Ground plane λ/4 | ~2 dBi | omni | poste fixe, ISM |
| Télescopique | variable | omni | exploration multi-bandes |
| Discone | ~2 dBi | omni **très large bande** | écoute scanner 25 MHz–1,3 GHz |
| Yagi | 7–15 dBi | directive | DX, chasse au signal, satellites |
| Colinéaire | 5–8 dBi | omni aplatie | ADS-B (1090 MHz), relais |

## Aide-mémoire λ/4 (longueur du brin)

| Bande | Fréquence | λ/4 |
|---|---|---|
| FM | 100 MHz | 75 cm |
| Aviation | 125 MHz | 60 cm |
| 2 m | 145 MHz | 52 cm |
| ISM 433 | 433 MHz | 17,3 cm |
| ISM 868 | 868 MHz | 8,6 cm |
| ADS-B | 1090 MHz | 6,9 cm |
| WiFi | 2440 MHz | 3,1 cm |

Règle d'or du placement : **la hauteur vaut mieux que le gain**. Une antenne moyenne, dégagée et en hauteur, bat une excellente antenne au fond d'une pièce — et éloigne-la des alimentations à découpage, écrans et câbles USB qui polluent le [[bruit-et-snr|plancher]].

Lié : [[hackrf]] · [[bandes-a-explorer]] · [[materiel-debuter]]
