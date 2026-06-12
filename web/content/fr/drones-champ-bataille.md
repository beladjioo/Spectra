# Drones et spectre sur le champ de bataille moderne

En quelques années, le petit drone — du quadricoptère grand public au munition rôdeuse — est devenu un acteur central des conflits. Et toute son efficacité repose sur le **spectre radio** : un drone qui ne peut ni recevoir d'ordres, ni renvoyer sa vidéo, ni se géolocaliser n'est plus qu'un jouet. C'est pourquoi la lutte anti-drone est d'abord une affaire de [[guerre-electronique|guerre électronique]].

> Note **pédagogique** : on décrit les principes physiques publics (quelles bandes, comment on détecte, pourquoi le brouillage marche ou non). Aucune instruction opérationnelle. Émettre/brouiller est interdit aux civils ([[legal-securite]]).

## Les trois liaisons d'un drone

Un drone piloté à distance dépend de trois liaisons radio, chacune sur des bandes repérables :

1. **Commande & contrôle (C2)** : montant, du pilote vers le drone. Souvent en **2,4 GHz** et **5,8 GHz** (les mêmes bandes [[bandes-a-explorer|ISM]] que ton WiFi), en [[guerre-electronique|saut de fréquence]] pour résister au brouillage.
2. **Retour vidéo** : descendant, du drone vers le pilote. Large bande (plusieurs MHz) — c'est la **signature large bande** que tu apprends à repérer dans la mission Capstone. Les drones FPV de course utilisent souvent une vidéo analogique 5,8 GHz ; les drones grand public, un lien numérique (type OcuSync).
3. **Navigation (GNSS)** : le drone écoute GPS/GLONASS/Galileo pour se positionner et tenir un cap. Signal très faible au sol, donc **vulnérable au brouillage et au leurrage**.

Couper *une* de ces liaisons suffit souvent à neutraliser le drone — ou à déclencher son comportement de sécurité (retour au point de départ, atterrissage, vol stationnaire).

## Détecter un drone par la radio

La détection passive (réception seule, comme un SDR) cherche les signatures de ces liaisons :

- **Énergie large bande en 2,4 / 5,8 GHz** : le retour vidéo occupe beaucoup de spectre — c'est précisément l'objectif de la mission drone ([[decoder-vs-detecter|détecter]] une émission ≥ 5 MHz).
- **Motif de saut de fréquence** : le lien C2 saute selon une cadence reconnaissable, différente du WiFi domestique.
- **Remote ID** : dans beaucoup de pays, les drones doivent diffuser en clair (souvent en WiFi/Bluetooth) un identifiant et la position du drone *et* du pilote. C'est un signal **décodable** légalement, très utile pour la détection coopérative.
- **Empreinte du modèle** : largeur de bande, fréquences et protocole permettent souvent d'identifier le *type* de drone.

La détection radio a un avantage majeur : elle est **passive et silencieuse**, et porte au-delà de la vue (le drone se trahit avant d'être visible). Elle se combine au radar, à l'acoustique et à l'optique pour fiabiliser l'alerte.

## Neutraliser : pourquoi c'est dur

Les contre-mesures visent les trois liaisons :

- **Brouillage du C2** → le drone perd les ordres et déclenche sa sécurité.
- **Brouillage/leurrage GNSS** → le drone perd sa position ; le leurrage peut même le faire dériver.
- **Capture/prise de contrôle** → exploiter une faille du protocole (de plus en plus rare, les liaisons étant chiffrées et agiles).

Mais l'adversaire répond par l'**agilité** ([[guerre-electronique|protection électronique]]) : sauts de bande, formes d'onde résistantes, et surtout les drones **autonomes** guidés par caméra et IA embarquée, qui **n'ont plus besoin de liaison radio** une fois lancés — rien à brouiller. C'est la frontière actuelle : quand le drone ne parle plus, la GE classique perd prise, et la lutte se déplace vers l'optique, l'acoustique et l'intercepteur cinétique.

## La course en cours

L'évolution récente tient en quelques tendances :

- **Saturation des bandes ISM** : tant de drones et de brouilleurs que 2,4 et 5,8 GHz deviennent un champ de bataille électromagnétique permanent.
- **Brouillage GNSS de zone** : des régions entières où le GPS civil est inutilisable, avec des effets collatéraux sur l'aviation et la navigation maritime.
- **Drones filaires (fibre optique)** : reliés au pilote par un fil de plusieurs kilomètres — **aucune émission radio**, donc indétectables et imbrouillables par la GE.
- **Autonomie et essaims** : guidage par IA, ciblage terminal optique, coordination d'essaims — déplaçant la valeur du lien radio vers le calcul embarqué.

Pour un civil curieux, le point d'entrée concret reste la mission drone et l'écoute du 2,4 GHz : tu y vois, en miniature et en toute légalité, la même physique de signature large bande qui structure tout ce domaine.

Lié : [[guerre-electronique]] · [[decoder-vs-detecter]] · [[bandes-a-explorer]] · [[modulations]] · [[legal-securite]]
