# Les échantillons I/Q

Un SDR ne stocke pas une simple suite de valeurs : chaque échantillon est une **paire** de nombres, I (in-phase) et Q (quadrature). Ensemble ils forment un nombre **complexe** `I + jQ`, qu'on peut voir comme un point dans un plan : sa **distance à l'origine** = l'amplitude du signal, son **angle** = sa phase.

```
        Q ↑
          |      • (I=0.6, Q=0.8)
          |     /
          |    /  amplitude = √(I²+Q²) = 1.0
          |   /   phase     = atan2(Q, I) ≈ 53°
          |  /
   ───────+──────────→ I
          |
```

## Pourquoi deux nombres au lieu d'un ?

Avec une seule valeur réelle, on ne peut pas distinguer une fréquence *au-dessus* de la fréquence centrale d'une fréquence *en dessous* — les deux donneraient exactement la même mesure. Avec I et Q, le point tourne dans le plan : **sens anti-horaire** = fréquence au-dessus du centre, **sens horaire** = en dessous. On récupère les **fréquences négatives**, donc toute la fenêtre, centrée sur la fréquence d'accord.

C'est ce qui permet d'observer, disons, ±10 MHz **autour** de 2,44 GHz d'un seul coup. Le récepteur « descend » la bande qui t'intéresse autour de zéro (le mélange, voir [[sdr-architecture]]), puis échantillonne en I/Q.

## L'image qui fait tout comprendre : le point qui tourne

Imagine le couple (I, Q) comme la pointe d'une aiguille d'horloge :

- L'aiguille **immobile** → un signal exactement à la fréquence centrale (fréquence relative nulle).
- Elle tourne **1000 fois par seconde** → un signal à +1 kHz du centre.
- Sa **longueur varie** au rythme de la voix → de la modulation d'amplitude (AM).
- Sa **vitesse de rotation** varie au rythme de la musique → de la modulation de fréquence (FM).
- Elle **saute brusquement d'angle** → de la modulation de phase (PSK).

Toutes les [[modulations]] se lisent dans ce plan. C'est aussi pour ça que les récepteurs numériques affichent des **constellations** : pour une PSK, les points se regroupent en paquets bien nets (4 paquets = QPSK, soit 2 bits par symbole) ; si les paquets bavent, la liaison est bruitée.

## Concrètement, dans la machine

Le flux brut d'un HackRF est une suite d'octets `I,Q,I,Q,…`, chacun **signé sur 8 bits** (−128 à +127) ; un RTL-SDR fait pareil en non-signé. Conséquences pratiques :

- **Débit** : à 10 MSps, ça fait 10 millions de paires × 2 octets = **20 Mo/s** sur l'USB. C'est le sample rate, pas la fréquence d'écoute, qui coûte cher.
- **Amplitude max** : un échantillon saturé « colle » à ±127 — au spectre, tout le [[bruit-et-snr|plancher]] monte. Le gain se règle pour rester en dessous.
- Le moteur de l'académie lit ce flux complexe, lui applique une [[fft-spectre|FFT]], et obtient le spectre. Tout le reste (pics, SNR, [[waterfall]]) en découle.

## À toi de jouer

1. Un échantillon vaut (I = −0,7 ; Q = 0). Amplitude ? Phase ? (0,7 ; 180°.)
2. Le point fait un tour complet toutes les 2 ms, sens anti-horaire. À quelle fréquence relative est le signal ? (+500 Hz au-dessus du centre.)
3. Pourquoi un enregistrement I/Q de 8 secondes à 2,4 MSps pèse-t-il ~38 Mo ? (2,4 M × 2 octets × 8 s.)

Lié : [[echantillonnage]] · [[fft-spectre]] · [[modulations]]
