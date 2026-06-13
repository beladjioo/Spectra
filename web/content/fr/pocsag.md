# POCSAG : le paging qui ne meurt pas

On les croyait disparus avec les années 90, mais les **bipeurs** (pagers) sont toujours là — et pour une bonne raison. Là où un réseau mobile sature ou tombe, un message **POCSAG** diffusé par un puissant émetteur passe partout, instantanément, vers des milliers de récepteurs à la fois. Hôpitaux, pompiers, secours et industrie s'y fient encore.

## Ce qu'on capte, et ce qu'on ne capte pas

En Europe, le paging vit souvent autour de **466 MHz** — pile dans la portée d'un [[materiel-debuter|RTL-SDR]]. C'est du **POCSAG**, un protocole de 1982 :

- **Modulation FSK** : l'information saute entre deux fréquences proches (typiquement ±4,5 kHz). Au [[waterfall]], un **burst étroit** (~16 kHz) qui apparaît, dure une fraction de seconde, puis se tait.
- **Débits** 512, 1200 ou 2400 bauds. Structure simple : un préambule, des « batches » de mots de 32 bits avec correction d'erreur (BCH).

OpenHertz s'arrête volontairement à la **détection de présence** : repérer le burst, pas lire le message. Décoder POCSAG en clair, c'est potentiellement exposer des **données nominatives** — appels médicaux, coordonnées, alertes opérationnelles. Capter une onde est une chose ; en exploiter le contenu en est une autre, juridiquement très différente ([[legal-securite]]).

## Détecter ≠ décoder (encore et toujours)

C'est le même principe d'honnêteté que pour les [[decoder-vs-detecter|drones]] : voir qu'« il se passe quelque chose » à 466 MHz est facile et inoffensif. Aller plus loin engage ta responsabilité. La mission te fait **voir le paging vivre** sur le spectre — la partie passionnante et légale.

## Pour reconnaître un burst de paging

- **Régularité** : les bursts arrivent souvent groupés, à intervalles, quand un cycle de diffusion part.
- **Largeur** : ~12–20 kHz, bien plus étroit qu'un canal WiFi, plus large qu'une porteuse pure.
- **Son** (si tu le démodules en FM étroite) : un grésillement « modem » caractéristique, façon vieux fax.

> 👉 Surprends le paging en action : [Bipeurs POCSAG](#mission:pocsag)

Lié : [[modulations]] · [[decoder-vs-detecter]] · [[bandes-a-explorer]] · [[legal-securite]]
