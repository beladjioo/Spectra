# Antennes

L'antenne est le premier maillon — la meilleure DSP ne rattrape pas un mauvais signal capté. Une règle simple : une antenne **résonne** quand sa taille est en rapport avec la [[ondes-radio|longueur d'onde]] de la bande visée.

Le cas le plus courant est le **quart d'onde** : un brin de longueur `λ/4`. À 100 MHz (λ = 3 m) ça fait ~75 cm ; à 868 MHz, ~8,6 cm ; à 2,4 GHz, ~3 cm. C'est pourquoi un télescopique long est parfait pour la FM mais inutilement grand pour le 2,4 GHz, où un petit fouet ou une antenne dédiée fait mieux.

Quelques notions utiles :
- **Gain & directivité** : une antenne directive (Yagi, patch) concentre la réception dans une direction → meilleur [[bruit-et-snr|SNR]] sur une cible, au prix de devoir la pointer.
- **Polarisation** : verticale vs horizontale ; un décalage de 90° entre émetteur et récepteur fait perdre beaucoup de signal.
- **Adaptation (SWR)** : une antenne mal adaptée à sa bande réfléchit l'énergie au lieu de la capter. Une antenne « accordée » sur la bande = transfert maximal.

En pratique : garde **une antenne par grande bande** et change selon la mission. Place-la haut, dégagée, loin du bruit (alimentations, USB, écrans).

Lié : [[hackrf]] · [[bandes-a-explorer]]
