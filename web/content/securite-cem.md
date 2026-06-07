# Sécurité et compatibilité électromagnétique

**Sécurité électrique.** Une station se branche sur le secteur : respecte la mise à la **terre**, des fusibles adaptés, et ne travaille pas sous tension. Les **condensateurs** d'une alimentation peuvent rester chargés après extinction — décharge-les avant d'y toucher. Les amplificateurs à tubes utilisent des **hautes tensions** dangereuses.

**Exposition aux champs RF.** Émettre, c'est rayonner de la puissance : il faut respecter des **distances de sécurité** vis-à-vis des personnes, d'autant plus près de l'antenne et à puissance élevée. Les réglementations fixent des limites d'exposition.

**Foudre et pylônes.** Une antenne extérieure est un point haut : prévoir une **protection foudre** (parafoudre, mise à la terre du mât) et la sécurité mécanique de l'installation.

**CEM (compatibilité électromagnétique).** Ton émetteur ne doit pas perturber les autres appareils, et réciproquement :
- **TVI / BCI** : perturbation de la télé / radio du voisinage, souvent due aux **harmoniques** mal filtrées (voir [[emetteur-recepteur]]) ou à des appareils mal blindés.
- **Filtrage et blindage** sont les remèdes : filtres passe-bas en sortie d'émetteur, ferrites sur les câbles, bon blindage.
- Côté réception, les sources de **bruit** domestiques (alimentations à découpage, écrans, LED) dégradent ton [[bruit-et-snr|plancher]] — un vrai sujet en ville.

Tout cela s'inscrit dans le cadre légal du service amateur — voir [[reglementation]] et [[legal-securite]].
