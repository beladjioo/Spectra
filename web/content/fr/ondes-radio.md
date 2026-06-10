# Les ondes radio

Une onde radio est un champ électromagnétique qui oscille et se propage à la vitesse de la lumière. Deux grandeurs la décrivent :

- **La fréquence** *f* : le nombre d'oscillations par seconde, en hertz (Hz). La radio FM est vers 100 **mégahertz** (MHz, millions de Hz), le WiFi vers 2,4 **gigahertz** (GHz, milliards de Hz).
- **La longueur d'onde** *λ* : la distance parcourue pendant une oscillation. On passe de l'une à l'autre par `λ = c / f` (c ≈ 3×10⁸ m/s). À 100 MHz, λ ≈ 3 m ; à 2,4 GHz, λ ≈ 12,5 cm.

Cette longueur d'onde n'est pas qu'une curiosité : elle dicte la **taille des antennes** (voir [[antennes]]) et la façon dont l'onde traverse ou contourne les obstacles. Les basses fréquences pénètrent mieux les murs ; les hautes fréquences portent moins loin mais transportent plus de débit.

Le **spectre** radio est simplement l'ensemble de ces fréquences, découpé en bandes par la réglementation (FM, aviation, ISM, téléphonie…). Ton HackRF couvre de 1 MHz à 6 GHz : une fenêtre énorme sur ce spectre.

Une onde « nue » à une seule fréquence (une **porteuse**) ne transporte aucune information. Pour cela on la **module** — voir [[modulations]].

> 👉 Vois une porteuse réelle pour la première fois : [Premier contact](#mission:first-contact)

Suite logique : [[decibels]] pour mesurer la puissance de ces ondes.
