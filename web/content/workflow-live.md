# Bien l'utiliser en live : la méthode

Un réflexe d'opérateur, à répéter à chaque session :

1. **Vérifie le matériel.** HackRF détecté (`hackrf_info`), bonne [[antennes|antenne]] pour la bande, antenne dégagée.
2. **Accorde large d'abord.** Pose-toi au centre de la bande avec un [[echantillonnage|sample rate]] large pour voir l'ensemble, puis zoome (sample rate plus étroit) sur ce qui t'intéresse.
3. **Règle le [[hackrf|gain]].** Monte jusqu'à voir les signaux ressortir du [[bruit-et-snr|plancher]] ; redescends dès que le plancher entier monte (saturation).
4. **Lis le [[waterfall]] avant de conclure.** La dimension temps distingue une porteuse stable d'un burst, d'un saut de fréquence, d'un signal large bande.
5. **Identifie avant de décoder.** Largeur, stabilité, motif → quel type de [[modulations|modulation]] ? Beaucoup d'analyses s'arrêtent (utilement) à la **détection de présence**, sans décodage.
6. **Méfie-toi des fantômes.** Un pic qui bouge dans le mauvais sens quand tu changes de fréquence est souvent un **alias** (voir [[echantillonnage]]) ou une saturation, pas un vrai signal.

L'académie automatise les étapes 2–3 par mission (chaque mission accorde la radio pour toi) et te fait pratiquer les étapes 4–5 à l'œil.

> 👉 Mets-toi en condition : [Premier contact](#mission:first-contact)
