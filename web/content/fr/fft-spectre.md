# De l'IQ au spectre : la FFT

Le flux [[iq|I/Q]] brut est illisible tel quel — une marée de nombres. Pour voir *quelles fréquences* sont présentes, on applique la **FFT** (Fast Fourier Transform) : un algorithme qui décompose un bloc d'échantillons en ses composantes fréquentielles.

En entrée : un bloc de N échantillons complexes (ici N = 4096). En sortie : N **bins**, chacun représentant une petite tranche de fréquence et la **puissance** qu'on y trouve. La largeur d'un bin = `sample_rate / N`. Avec 20 MSps et N = 4096, chaque bin fait ≈ 5 kHz : c'est la **résolution** du spectre. Plus N est grand, plus la résolution est fine (mais plus c'est lent).

Deux raffinements que fait le moteur :
- **Moyennage** : on cumule plusieurs FFT avant d'afficher, pour lisser le bruit et faire ressortir les signaux stables.
- **fftshift** : on réordonne les bins pour mettre la fréquence centrale… au centre, et les fréquences négatives à gauche.

La puissance est ensuite convertie en [[decibels|dB]]. Le résultat est la courbe que tu vois : l'axe horizontal = la fréquence, l'axe vertical = la puissance. Un signal = une bosse au-dessus du [[bruit-et-snr|plancher]].

C'est exactement le cœur du moteur Rust de l'académie (`server/src/dsp.rs`) — et c'est aussi ce qui sert à repérer un drone.

Une seule FFT = une photo. Empile-les dans le temps et tu obtiens le [[waterfall]].
