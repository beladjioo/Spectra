# Les ondes radio

Une onde radio est un champ électromagnétique qui oscille et se propage à la vitesse de la lumière. Deux grandeurs la décrivent :

- **La fréquence** *f* : le nombre d'oscillations par seconde, en hertz (Hz). La radio FM est vers 100 **mégahertz** (MHz, millions de Hz), le WiFi vers 2,4 **gigahertz** (GHz, milliards de Hz).
- **La longueur d'onde** *λ* : la distance parcourue pendant une oscillation. On passe de l'une à l'autre par `λ = c / f` (c ≈ 3×10⁸ m/s). À 100 MHz, λ ≈ 3 m ; à 2,4 GHz, λ ≈ 12,5 cm.

Cette longueur d'onde n'est pas qu'une curiosité : elle dicte la **taille des antennes** (voir [[antennes]]) et la façon dont l'onde traverse ou contourne les obstacles. Les basses fréquences pénètrent mieux les murs ; les hautes fréquences portent moins loin mais transportent plus de débit.

Le **spectre** radio est simplement l'ensemble de ces fréquences, découpé en bandes par la réglementation (FM, aviation, ISM, téléphonie…). Ton HackRF couvre de 1 MHz à 6 GHz : une fenêtre énorme sur ce spectre.

Une onde « nue » à une seule fréquence (une **porteuse**) ne transporte aucune information. Pour cela on la **module** — voir [[modulations]].

> 👉 Vois une porteuse réelle pour la première fois : [Premier contact](#mission:first-contact)

## La carte du spectre

| Gamme | Fréquences | λ | On y trouve |
|---|---|---|---|
| LF / MF | 30 kHz – 3 MHz | km | radio AM, balises, horloge DCF77 |
| HF | 3 – 30 MHz | 100–10 m | ondes courtes, radioamateur DX |
| VHF | 30 – 300 MHz | 10–1 m | FM, aviation, bande 2 m, satellites météo |
| UHF | 300 MHz – 3 GHz | 1 m – 10 cm | 70 cm, ISM 433/868, ADS-B, GSM, GPS, WiFi 2,4 |
| SHF | 3 – 30 GHz | cm | WiFi 5 GHz, radars, liaisons satellites |

Plus on monte en fréquence : antennes plus courtes, portée « à vue » dominante, débits plus élevés — et murs plus opaques.

## La polarisation

Le champ électrique oscille dans un plan : **verticale** (la plupart des mobiles) ou **horizontale** (beaucoup de TV/DX). Un récepteur croisé à 90° avec l'émetteur perd ≈ **20 dB** — si un signal connu paraît anormalement faible, commence par redresser ton antenne.

## À toi de jouer

`λ = 300 / f(MHz)`. Calcule de tête : 433 MHz → ~69 cm ; 1090 MHz → ~27,5 cm ; 2440 MHz → ~12,3 cm. Ces ordres de grandeur reviennent partout, des antennes aux obstacles.

Suite logique : [[decibels]] pour mesurer la puissance de ces ondes.
