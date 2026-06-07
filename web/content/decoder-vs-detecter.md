# Détecter vs décoder

Deux niveaux d'ambition, à ne pas confondre :

**Détecter (présence)** — répondre à « y a-t-il un signal, où, de quelle largeur, quelle puissance ? ». C'est ce que fait le moteur de l'académie : [[fft-spectre|FFT]] → plancher → pics. Pas besoin de connaître le protocole. Suffisant pour : cartographier une bande, repérer une interférence, détecter la *présence* d'un drone, mesurer une occupation.

**Décoder (contenu)** — extraire l'**information** : démoduler, retrouver les bits, le protocole, le message. Beaucoup plus exigeant : il faut connaître la [[modulations|modulation]], la synchro, le codage, parfois la cryptographie.

Quelques décodages classiques accessibles : la FM audio (démodulation simple), ADS-B (avions), AIS (navires), images NOAA, et la grande famille des capteurs ISM via des outils dédiés.

**Pourquoi s'arrêter souvent à la détection ?** Parce que c'est :
- *générique* (marche sans connaître le protocole),
- *robuste* (pas besoin d'un bon SNR pour juste « voir »),
- *honnête* (un drone non conforme ne se décode pas, mais son énergie large bande se **détecte**).

L'étape suivante d'un projet est souvent : détecter d'abord, puis ajouter un décodeur ciblé pour une bande précise.

Lié : [[bandes-a-explorer]] · [[workflow-live]]
