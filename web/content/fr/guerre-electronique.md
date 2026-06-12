# Guerre électronique : comprendre le spectre comme terrain

La **guerre électronique** (GE, en anglais *Electronic Warfare*, EW) regroupe tout ce qui se joue dans le spectre radio quand celui-ci devient un enjeu de conflit. Le même spectre que tu explores avec un SDR — FM, [[bandes-a-explorer|ISM]], 2,4 GHz, radars — est, sur un théâtre d'opérations, un espace disputé : on cherche à y voir l'adversaire, à l'aveugler, et à protéger ses propres liaisons.

> Cette note est **pédagogique et conceptuelle**. Elle explique des principes publics (détection, brouillage, contre-mesures) pour comprendre l'actualité et la physique en jeu — pas pour fabriquer un brouilleur, ce qui est illégal et dangereux ([[legal-securite]]).

## Les trois piliers

La doctrine classique découpe la GE en trois fonctions :

| Pilier | Sigle OTAN | En clair | Lien SDR |
|---|---|---|---|
| **Soutien électronique** | ES (ESM) | *écouter* : détecter, localiser, identifier les émissions | c'est exactement ce que fait un récepteur SDR, en plus sensible |
| **Attaque électronique** | EA (ECM) | *agir* : brouiller, leurrer, saturer | émission — interdite hors cadre militaire |
| **Protection électronique** | EP (ECCM) | *résister* : sauts de fréquence, étalement, directivité | conception des formes d'onde robustes |

Un récepteur SDR grand public ne fait *que* le premier pilier, et uniquement en **réception seule**.

## Soutien électronique : voir sans être vu

Écouter le spectre adverse renseigne énormément, sans jamais émettre :

- **Détection d'émission** : un radar, une radio, un lien de drone trahissent leur présence dès qu'ils émettent. C'est le principe que tu manipules en repérant un pic au-dessus du [[bruit-et-snr|plancher de bruit]].
- **Goniométrie (radiogoniométrie, DF)** : avec plusieurs antennes ou une antenne directive, on estime la **direction** d'arrivée d'un signal. Croiser deux relèvements donne une position (triangulation).
- **Empreinte / SIGINT** : la « signature » d'un émetteur (fréquence, largeur de bande, modulation, motif de saut) permet de l'**identifier** et de le cataloguer. Voir un signal ([[decoder-vs-detecter|détecter]]) et le comprendre (décoder) sont deux niveaux différents.

C'est silencieux, passif, et indétectable — d'où sa valeur.

## Attaque électronique : brouiller et leurrer

Brouiller, c'est noyer le signal utile sous du bruit ou un signal trompeur de plus forte puissance dans la bande visée. Conceptuellement :

- **Brouillage barrage** : on arrose toute une bande de bruit → simple mais gourmand en énergie et peu discret.
- **Brouillage spot/suiveur** : on concentre l'énergie sur la fréquence exacte utilisée → efficace, mais il faut d'abord la *trouver* (retour au soutien électronique).
- **Leurrage (spoofing)** : au lieu de bruit, on émet un *faux* signal crédible. L'exemple le plus connu est le **spoofing GNSS** (GPS) : un faux signal de positionnement, plus fort que les satellites réels (très faibles au sol), fait calculer au récepteur une position erronée.

Tout cela suppose d'**émettre**, donc relève strictement du domaine militaire et est interdit aux civils.

## Protection électronique : rendre une liaison résistante

Côté défense, on conçoit des formes d'onde difficiles à brouiller ou à intercepter :

- **Saut de fréquence (FHSS)** : la liaison change de fréquence des dizaines à des milliers de fois par seconde selon une séquence connue des seuls correspondants. Brouiller devient un jeu de cache-cache. Le Bluetooth en est une version civile.
- **Étalement de spectre (DSSS)** : le signal est étalé sous le plancher de bruit ; sans le code d'étalement, il est quasi invisible. C'est le principe du GPS et des liaisons « LPI/LPD » (faible probabilité d'interception/détection).
- **Antennes directives & annulation** : pointer un faisceau étroit vers l'utile et créer un « creux » (null) dans la direction du brouilleur.
- **Agilité de bande** : sauter de bande entière (2,4 → 5,8 GHz) quand l'une est saturée.

Ces idées expliquent pourquoi les liaisons modernes (drones, militaires, mais aussi WiFi) sont si difficiles à perturber proprement.

## Pourquoi ça compte aujourd'hui

Les conflits récents ont fait de la GE un facteur décisif : drones omniprésents, brouillage GNSS de zones entières, course permanente entre brouilleurs et liaisons agiles. Le détail côté drones est dans [[drones-champ-bataille]].

Lié : [[drones-champ-bataille]] · [[decoder-vs-detecter]] · [[bandes-a-explorer]] · [[legal-securite]]
