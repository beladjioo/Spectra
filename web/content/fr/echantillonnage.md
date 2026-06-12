# Échantillonnage, Nyquist et aliasing

Un SDR transforme l'onde analogique en **chiffres** : il mesure le signal très vite, à intervalles réguliers. C'est l'**échantillonnage**, et sa cadence est le **sample rate** (échantillons par seconde, Sps — souvent en MSps).

## La règle d'or : Nyquist

Le théorème de **Nyquist** fixe la limite : pour représenter fidèlement une bande de largeur *B*, il faut échantillonner à au moins **2·B**. Grâce aux échantillons [[iq|I/Q]] (complexes), la règle devient encore plus simple pour un SDR : **sample rate = largeur de fenêtre observée**. 20 MSps → tu vois ~20 MHz autour de la fréquence centrale.

| Sample rate | Fenêtre | Usage typique | Débit USB |
|---|---|---|---|
| 2 MSps | 2 MHz | une station FM, ADS-B, zoom fin | 4 Mo/s |
| 4 MSps | 4 MHz | bande ISM 868 entière | 8 Mo/s |
| 8 MSps | 8 MHz | toute une portion de bande FM | 16 Mo/s |
| 20 MSps | 20 MHz | le chaos du 2,4 GHz, chasse au drone | 40 Mo/s |

Large = vue d'ensemble mais plus de charge CPU/USB et un plancher de bruit *apparent* plus haut par bin ; étroit = zoom détaillé et machine au repos. Le bon réflexe : **large pour chercher, étroit pour étudier**.

## L'aliasing : le fantôme du spectre

Si un signal dépasse la fenêtre, il ne disparaît pas : il **se replie** à l'intérieur, à une fausse position. C'est l'**aliasing** — un fantôme qui ressemble à un vrai signal mais n'existe pas là.

Exemple concret : fenêtre de 8 MHz centrée sur 100 MHz (96–104 MHz). Un émetteur puissant à 105 MHz, mal filtré, peut réapparaître en miroir vers 103 MHz — là où il n'y a personne.

Les SDR limitent ça avec un **filtre anti-repliement** analogique placé avant l'échantillonneur (le HackRF en règle un automatiquement à ~75 % du sample rate). Mais le piège reste classique. Signes qui trahissent un alias :

- le pic **bouge dans le mauvais sens** quand tu changes la fréquence centrale ;
- il bouge **deux fois plus vite** que les autres ;
- il disparaît quand tu **élargis** le sample rate.

## Et les bits, dans tout ça ?

Chaque mesure est codée sur un nombre fini de bits — c'est la **quantification**. Un HackRF code sur **8 bits** : 256 niveaux, soit une plage dynamique théorique d'environ **48 dB** entre le plus petit et le plus grand signal mesurables *en même temps*. Un SDR 12 bits (Airspy, SDRplay) gagne ~24 dB : il encaisse un émetteur fort sans écraser le faible d'à côté. C'est pour ça que le réglage du [[hackrf|gain]] compte tant sur un 8 bits : il place ta fenêtre de 48 dB au bon étage.

## À toi de jouer

1. Tu veux observer toute la bande FM (88–108 MHz) d'un coup. Quel sample rate minimum ? (20 MSps, centré sur 98 MHz.)
2. À 2,4 MSps, combien d'octets par seconde sort un RTL-SDR ? (2,4 M × 2 = 4,8 Mo/s.)
3. Un pic glisse vers la gauche quand tu accordes vers la droite. Vrai signal ou alias ? (Alias — ou saturation, baisse le gain pour trancher.)

> 👉 Vois l'effet de la largeur de bande : [Le chaos du 2.4 GHz](#mission:wifi24)

Suite : [[iq]] — pourquoi les échantillons sont des nombres *complexes*.
