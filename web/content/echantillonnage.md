# Échantillonnage, Nyquist et aliasing

Un SDR transforme l'onde analogique en **chiffres** : il mesure le signal très vite, à intervalles réguliers. C'est l'**échantillonnage**, et sa cadence est le **sample rate** (échantillons par seconde, Sps — souvent en MSps).

Le théorème de **Nyquist** fixe la règle d'or : pour représenter fidèlement une bande de largeur *B*, il faut échantillonner à au moins **2·B**. Autrement dit, un sample rate de 20 MSps te donne une fenêtre d'observation d'environ **20 MHz** de large autour de la fréquence centrale (grâce à l'astuce des échantillons [[iq|I/Q]]).

Si un signal dépasse cette limite, il ne disparaît pas : il **se replie** dans ta fenêtre à une fausse position. C'est l'**aliasing** — un fantôme qui ressemble à un vrai signal mais n'existe pas là. Les SDR limitent ça avec un filtre analogique avant l'échantillonneur, mais ça reste un piège classique : un pic qui bouge « dans le mauvais sens » quand tu changes de fréquence est souvent un alias.

Conséquence pratique : le **sample rate fixe la largeur** que tu observes d'un coup. Large (20 MSps) = vue d'ensemble d'une bande encombrée comme le 2,4 GHz ; étroit (2–4 MSps) = zoom détaillé et moins de charge CPU/USB.

> 👉 Vois l'effet de la largeur de bande : [Le chaos du 2.4 GHz](#mission:wifi24)

Suite : [[iq]] — pourquoi les échantillons sont des nombres *complexes*.
