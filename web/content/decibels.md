# Les décibels (dB et dBm)

En radio, les puissances couvrent une plage colossale : un signal fort peut être un milliard de fois plus puissant qu'un signal faible. Pour rester lisible, on travaille en **échelle logarithmique** : le décibel.

Le **dB** exprime un *rapport* entre deux puissances :

`dB = 10 · log₁₀(P₁ / P₂)`

Quelques repères à mémoriser :
- **+3 dB** ≈ ×2 (le double de puissance)
- **+10 dB** = ×10
- **−10 dB** = ÷10
- **+20 dB** = ×100

Le **dBm** est un dB *absolu*, référencé à 1 milliwatt : 0 dBm = 1 mW, −30 dBm = 1 µW, −90 dBm = un signal radio déjà très faible mais parfaitement exploitable.

Sur ton analyseur, l'axe vertical du spectre est en dB. **Attention** : avec un HackRF ces valeurs sont *relatives* (elles dépendent du [[antennes|gain]] réglé) — excellentes pour *voir* et *comparer* des signaux, mais pas pour une mesure étalonnée en dBm absolus.

Ce qui compte vraiment n'est pas la valeur brute mais l'**écart** entre un signal et le plancher : c'est le SNR — voir [[bruit-et-snr]].

> 👉 Lis l'axe en dB sur un vrai spectre : [Premier contact](#mission:first-contact)
