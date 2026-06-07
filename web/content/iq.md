# Les échantillons I/Q

Un SDR ne stocke pas une simple suite de valeurs : chaque échantillon est une **paire** de nombres, I (in-phase) et Q (quadrature). Ensemble ils forment un nombre **complexe** `I + jQ`, qu'on peut voir comme un point dans un plan : sa **distance à l'origine** = l'amplitude du signal, son **angle** = sa phase.

Pourquoi se compliquer la vie ? Parce qu'avec une seule valeur réelle, on ne peut pas distinguer une fréquence *au-dessus* de la fréquence centrale d'une fréquence *en dessous* — les deux donneraient la même mesure. Avec I et Q, l'angle tourne dans un sens ou dans l'autre selon le côté : on récupère les **fréquences négatives**, donc toute la fenêtre, centrée sur la fréquence d'accord.

C'est ce qui permet d'observer, disons, ±10 MHz **autour** de 2,44 GHz d'un seul coup. Le récepteur « descend » la bande qui t'intéresse autour de zéro (le mélange), puis échantillonne en I/Q.

Concrètement, le flux brut d'un HackRF est une suite `I,Q,I,Q,…`. Le moteur de l'académie lit ce flux complexe, lui applique une [[fft-spectre|FFT]], et obtient le spectre. Tout le reste (pics, [[bruit-et-snr|SNR]], waterfall) en découle.

Lié : [[echantillonnage]] · [[fft-spectre]]
