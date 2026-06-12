# De l'IQ au spectre : la FFT

Le flux [[iq|I/Q]] brut est illisible tel quel — une marée de nombres. Pour voir *quelles fréquences* sont présentes, on applique la **FFT** (Fast Fourier Transform) : un algorithme qui décompose un bloc d'échantillons en ses composantes fréquentielles.

En entrée : un bloc de N échantillons complexes. En sortie : N **bins**, chacun représentant une petite tranche de fréquence et la **puissance** qu'on y trouve.

## La résolution : le compromis central

La largeur d'un bin = `sample_rate / N`. C'est **la** formule à retenir :

| Sample rate | N (taille FFT) | Largeur d'un bin | Tu distingues… |
|---|---|---|---|
| 2 MSps | 2048 | ~1 kHz | deux talkies espacés de 12,5 kHz |
| 8 MSps | 2048 | ~4 kHz | deux stations FM voisines |
| 20 MSps | 4096 | ~5 kHz | les canaux WiFi dans le 2,4 GHz |
| 2 MSps | 65536 | ~30 Hz | les raies fines du Morse ou du FT8 |

Plus N est grand, plus la résolution est fine — mais chaque image demande plus d'échantillons et plus de calcul : on échange de la **réactivité** contre du **détail**. Un compteur : à 2 MSps et N = 65536, chaque image « consomme » 33 ms de signal ; les bursts plus courts s'y diluent.

## Les raffinements qui changent tout

- **La fenêtre (Hann)** : couper brutalement un bloc de N échantillons crée des « fuites » — chaque signal bave sur ses voisins. On multiplie d'abord le bloc par une courbe douce (la fenêtre de **Hann**) qui amène les bords à zéro : les pics deviennent propres et le plancher net. Tous les analyseurs sérieux le font ; le moteur de l'académie aussi.
- **Le moyennage** : une FFT seule est « neigeuse » (le bruit fluctue). On cumule plusieurs FFT avant d'afficher : le bruit se lisse, les signaux stables ressortent. Sa variante **max-hold** garde le maximum par bin — idéale pour attraper des bursts fugaces.
- **fftshift** : on réordonne les bins pour mettre la fréquence centrale… au centre, et les fréquences négatives à gauche. Sans ça, le spectre s'affiche « coupé en deux ».

La puissance de chaque bin est ensuite convertie en [[decibels|dB]]. Le résultat est la courbe que tu vois : l'axe horizontal = la fréquence, l'axe vertical = la puissance. Un signal = une bosse au-dessus du [[bruit-et-snr|plancher]].

## Du spectre au détecteur

C'est exactement le cœur du moteur de l'académie (en Rust côté serveur, en TypeScript dans ton navigateur) : fenêtre de Hann → FFT → moyennage → dB → estimation du plancher → tout ce qui dépasse de `plancher + seuil` devient un **pic** avec sa fréquence, sa largeur et son [[bruit-et-snr|SNR]]. C'est aussi ce qui sert à repérer un drone : un « pic » de 10 MHz de large ne ressemble à rien d'autre.

Une seule FFT = une photo. Empile-les dans le temps et tu obtiens le [[waterfall]].

## À toi de jouer

1. 8 MSps, N = 2048 : largeur d'un bin ? (~3,9 kHz.)
2. Tu cherches un burst LoRa de 50 ms. Plutôt N géant ou moyennage max-hold ? (Max-hold — un N géant diluerait le burst.)
3. Pourquoi la fenêtre de Hann rend-elle le plancher « plus propre » ? (Elle supprime les fuites spectrales des bords de bloc, qui sinon noient les bins voisins.)
