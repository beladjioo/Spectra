# C'est quoi un SDR ?

Une **radio logicielle** (Software Defined Radio) déporte dans le logiciel ce qu'une radio classique fait avec des circuits dédiés. Le matériel se réduit à : une antenne, un étage qui ramène la bande voulue à une fréquence basse, et un **convertisseur analogique-numérique** qui [[echantillonnage|échantillonne]]. Tout le reste — filtrer, démoduler, décoder — devient du code.

L'étage clé est le **mélangeur** : il multiplie le signal reçu par une fréquence de référence (l'oscillateur local) pour **translater** la bande d'intérêt autour de zéro. C'est ainsi qu'on « accorde » : changer la fréquence centrale, c'est changer cet oscillateur. Le moteur de l'académie le fait à la volée quand une mission envoie une commande d'accord.

L'immense avantage : **une seule boîte, mille usages**. La même puce écoute la FM, l'aviation, l'IoT, les drones — il suffit de changer le logiciel. L'inconvénient : la qualité dépend du matériel (bruit, linéarité, plage dynamique) et du CPU pour la [[fft-spectre|DSP]].

Familles courantes : RTL-SDR (très bon marché, réception seule, ~2,4 MHz de bande), HackRF (large couverture,半-duplex), des SDR à FPGA (Pluto, USRP) pour le très haut débit.

Le tien, c'est le [[hackrf]].
