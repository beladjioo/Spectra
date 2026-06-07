# Composants électroniques

Les briques que tu retrouveras dans tout schéma radio.

**Passifs**
- **Résistance** (R, en ohms) : limite le courant, crée une chute de tension. Voir [[electricite]].
- **Condensateur** (C, en farads) : stocke de l'énergie dans un champ électrique, **bloque le continu** et laisse passer l'alternatif d'autant mieux que la fréquence est haute. Son opposition au courant, la **réactance**, vaut `Xc = 1/(2πfC)` — elle diminue quand f monte.
- **Bobine / self** (L, en henrys) : stocke l'énergie dans un champ magnétique, **laisse passer le continu** et s'oppose à l'alternatif d'autant plus que la fréquence est haute : `XL = 2πfL` — elle augmente avec f.

Condensateur et bobine ont donc des comportements **opposés** vis-à-vis de la fréquence : c'est ce qui rend possibles les filtres et les circuits accordés ([[circuits-resonance-filtres]]).

**Actifs (semi-conducteurs)**
- **Diode** : laisse passer le courant dans un seul sens. Usages : redressement (alimentation), détection, protection. Variantes utiles : diode Zener (référence de tension), LED, varicap (capacité commandée en tension).
- **Transistor** (bipolaire ou FET) : commande un courant/une tension important à partir d'un petit signal → c'est l'**amplification** et la **commutation**. Le cœur des étages d'émission/réception.

Lié : [[electricite]] · [[emetteur-recepteur]]
