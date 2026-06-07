# Lignes, ROS et adaptation

Entre l'émetteur/récepteur et l'[[antennes|antenne]], il y a la **ligne de transmission** (câble coaxial le plus souvent). Elle a une **impédance caractéristique** — typiquement **50 Ω** en radioamateur.

**L'adaptation d'impédance.** Le transfert d'énergie est maximal quand la source, la ligne et l'antenne présentent **la même impédance** (50 Ω). Si l'antenne n'est pas adaptée, une partie de l'énergie est **réfléchie** vers l'émetteur au lieu d'être rayonnée.

**Le ROS (SWR).** On mesure ce défaut par le **Rapport d'Ondes Stationnaires** (en anglais SWR), donné par un **ROS-mètre** :
- **ROS = 1:1** → adaptation parfaite, aucune réflexion.
- **ROS = 2:1** → encore acceptable.
- **ROS élevé** → beaucoup d'énergie réfléchie : pertes, et risque pour l'étage de puissance de l'émetteur.

Pour corriger, on insère une **boîte d'accord** (tuner) qui ramène l'impédance vue à 50 Ω.

**Pertes & symétrie.** Un câble long et une fréquence haute augmentent les **pertes** dans la ligne. Pour relier un câble asymétrique (coax) à une antenne symétrique (dipôle), on utilise un **balun**, qui évite que la gaine du coax ne rayonne (courants de gaine).

Côté réception (ton cas avec le HackRF), une bonne adaptation améliore directement le [[bruit-et-snr|SNR]].

Lié : [[antennes]] · [[circuits-resonance-filtres]]
