# Circuits résonants et filtres

Associe une bobine [[composants-electroniques|L]] et un condensateur C : à une fréquence particulière, leurs réactances opposées s'égalent et le circuit **résonne**. C'est la **fréquence de résonance** :

`f₀ = 1 / (2π·√(L·C))`

À mémoriser : pour **monter** la fréquence d'accord, on **diminue** L ou C ; pour la descendre, on les augmente. C'est exactement comment un poste « s'accorde » sur une station.

**Facteur de qualité Q** : il mesure la « finesse » de la résonance. Un Q élevé = un pic étroit et sélectif (on isole bien une fréquence) ; un Q faible = une réponse large. Q décrit aussi les pertes : plus les pertes sont faibles, plus Q est grand.

**Filtres** — on combine R, L, C pour laisser passer certaines fréquences et bloquer les autres :
- **Passe-bas** : laisse les basses fréquences, coupe les hautes.
- **Passe-haut** : l'inverse.
- **Passe-bande** : ne laisse qu'une plage (un circuit résonant en est un).
- **Coupe-bande / réjecteur** : élimine une plage précise (utile contre un brouilleur).

En radio, les filtres servent partout : sélectionner une bande, supprimer les harmoniques en émission, nettoyer un signal en réception. La sélectivité d'un récepteur dépend directement de ses filtres — voir [[emetteur-recepteur]].

Lié : [[composants-electroniques]] · [[fft-spectre]]
