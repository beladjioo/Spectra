# La bande aéronautique (airband, AM)

Entre **118 et 137 MHz** vit l'une des bandes les plus gratifiantes pour débuter : l'**airband**, les communications voix de l'aviation. Tours de contrôle, approche, pilotes, ATIS météo — tout est en clair, en **AM**, et entièrement dans la portée d'un simple [[materiel-debuter|RTL-SDR]].

## Pourquoi de l'AM et pas de la FM ?

La [[modulations|FM]] domine la radio grand public, mais l'aviation est restée à l'**AM** (modulation d'amplitude) pour une raison de **sécurité** :

- Si deux stations émettent en même temps sur le même canal, l'AM laisse entendre **les deux** (avec un sifflement de battement caractéristique). En FM, l'effet de capture en effacerait une — un avion pourrait ne jamais savoir qu'il a été couvert.
- L'AM est simple et increvable : un récepteur AM tombe en panne « en douceur ».

Chaque canal ne fait que **~8,33 kHz** de large (espacement moderne) : sur le spectre, une **raie fine et brève**, pas la large bosse stable d'une station FM.

## Comment ça se démodule

L'AM porte l'information dans l'**amplitude** de la porteuse. Démoduler = suivre cette amplitude :

1. On isole le canal (filtrage autour de la fréquence).
2. On calcule l'**enveloppe** : `√(I² + Q²)` à chaque instant (voir [[iq]]).
3. On retire la composante continue (la porteuse elle-même) — ce qui reste *est* la voix.
4. Un peu d'AGC (gain automatique) égalise les transmissions fortes et faibles.

C'est exactement ce que fait OpenHertz quand tu écoutes un canal airband.

## Quelques fréquences pour commencer

| Usage | Fréquence | Note |
|---|---|---|
| Urgence aéronautique | 121,500 MHz | la « garde » internationale |
| Tour / sol | 118–122 MHz | varie selon l'aéroport |
| Approche / contrôle | 119–135 MHz | secteurs régionaux |
| ATIS (météo en boucle) | propre à l'aéroport | idéal pour s'entraîner : ça parle en continu |

> ⚠️ **Réception seule.** Écouter l'aviation est libre dans beaucoup de pays mais pas tous, et **réémettre ou exploiter** ces communications est strictement encadré. Voir [[legal-securite]].

## Conseils de réception

- Une [[reglage-antenne|antenne]] verticale ~57 cm (quart d'onde à 125 MHz) bien dégagée fait des merveilles.
- Les communications sont **brèves et intermittentes** : laisse tourner, sois patient, le waterfall t'aidera à repérer un canal actif.
- Trop loin d'un aéroport ? L'ATIS et les avions en croisière (haute altitude, portée « à vue » énorme) restent souvent captables.

> 👉 Mets-toi à l'écoute : [Écouter l'aviation (AM)](#mission:airband)

Lié : [[modulations]] · [[bandes-a-explorer]] · [[reglage-antenne]] · [[legal-securite]]
