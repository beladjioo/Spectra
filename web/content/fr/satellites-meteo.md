# Images de satellites météo (à venir)

> **Chapitre en construction.** L'objectif est ambitieux et mérite d'être fait correctement — voici déjà la promesse et la théorie.

C'est **le** moment de bascule pour beaucoup de débutants en SDR : recevoir, avec une antenne de fortune et une clé à 30 €, l'**image d'un vrai satellite** qui passe au-dessus de ta tête. Pas une donnée abstraite — une *photo* des nuages, prise à 800 km d'altitude, descendue en direct.

## Ce qui rend ça magique (et faisable)

Les satellites météo défilants **NOAA** (15, 18, 19) émettent en **APT** (Automatic Picture Transmission) vers **137 MHz** — pile dans la portée d'un [[materiel-debuter|RTL-SDR]]. Le signal est lent, robuste, conçu dans les années 70 pour être décodé avec trois fois rien.

- **Modulation** : une sous-porteuse audio de 2400 Hz modulée en amplitude, elle-même en FM sur la porteuse. On démodule en FM large, on récupère un signal audio, et la **luminosité de chaque pixel** est l'amplitude de cette sous-porteuse.
- **Cadence** : 2 lignes par seconde. Un passage complet dure ~15 minutes et donne une bande d'image de plusieurs milliers de km de long.
- Le successeur russe **Meteor-M** émet en **LRPT** (numérique, QPSK) : image couleur, plus belle, un poil plus exigeante.

## Le vrai défi : savoir *quand* regarder le ciel

Un satellite défilant n'est visible que quelques minutes, lors d'un **passage**. Il faut donc **prédire** ses passages à partir de ses paramètres orbitaux (les **TLE**, *Two-Line Elements*, publiés et mis à jour régulièrement) et de ta position. C'est cette brique — prédiction de passage + suivi Doppler — qui demande le plus de travail, et pourquoi ce chapitre arrive après les autres.

## L'antenne fait tout

La polarisation est **circulaire** (le satellite tourne) : une simple verticale capte mal. Les classiques :
- **Dipôle en V** (deux brins ~52 cm formant un V à 120°), simple et efficace.
- **Antenne QFH** (quadrifilaire hélicoïdale), la référence omnidirectionnelle pour le 137 MHz.

## En attendant

Tu peux déjà tout préparer : comprendre la [[modulations|modulation]], régler ton [[reglage-antenne|antenne]], maîtriser le [[waterfall]] pour reconnaître le signal APT (une « échelle » qui défile). Quand le décodeur de passages sera prêt, tu seras paré.

Lié : [[bandes-a-explorer]] · [[modulations]] · [[reglage-antenne]] · [[propagation]]
