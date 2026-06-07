# Émetteur et récepteur

**Le récepteur superhétérodyne.** L'architecture reine. L'idée : au lieu de filtrer/amplifier directement à la fréquence reçue (difficile et variable), on **translate** d'abord le signal vers une **fréquence intermédiaire (FI)** fixe, où l'on peut bâtir de bons filtres et amplificateurs.

Chaîne typique :
1. **Antenne → filtre d'entrée** (sélectionne la bande, voir [[circuits-resonance-filtres]]).
2. **Mélangeur** : multiplie le signal par un **oscillateur local (OL)** accordable → produit la FI. Accorder le poste = changer l'OL.
3. **Filtre FI** : assure la **sélectivité** (ne garder que le canal voulu).
4. **Amplification + démodulation** ([[modulations]]) → audio ou données.

C'est exactement le principe que ton [[sdr-architecture|SDR]] applique, sauf que la dernière partie est faite en logiciel.

**Pièges du mélange.** Le mélangeur crée aussi une **fréquence image** (de l'autre côté de l'OL) qu'il faut rejeter par filtrage, sinon deux stations différentes se superposent.

**L'émetteur** fait le chemin inverse : un oscillateur stable génère la porteuse, un étage la **module** avec l'information, des filtres suppriment les **harmoniques** et émissions **parasites** (obligation réglementaire — voir [[reglementation]]), puis un amplificateur de puissance attaque l'[[antennes|antenne]] via la [[lignes-ros-adaptation|ligne]].

Lié : [[composants-electroniques]] · [[modulations]]
