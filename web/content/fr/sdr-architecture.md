# C'est quoi un SDR ?

Une **radio logicielle** (Software Defined Radio) déporte dans le logiciel ce qu'une radio classique fait avec des circuits dédiés. Le matériel se réduit au strict nécessaire ; tout le reste — filtrer, démoduler, décoder — devient du code.

```
 antenne                                            logiciel
   │    ┌─────┐   ┌───────────┐   ┌─────┐   ┌─────┐   ┌──────────────┐
   └───→│ LNA │──→│ mélangeur │──→│filtre│──→│ ADC │──→│ FFT · démod  │
        └─────┘   └───────────┘   └─────┘   └─────┘   │ décodage     │
       amplifie    translate la    anti-    mesure    └──────────────┘
       sans bruit  bande vers 0    alias    en I/Q      ton CPU
                        ↑
                 oscillateur local
                 (= le bouton d'accord)
```

## Les étages, un par un

- **LNA** (Low-Noise Amplifier) : amplifie le murmure capté par l'antenne en ajoutant le moins de bruit possible. Chaque dB de bruit ajouté ici est perdu pour toujours.
- **Mélangeur + oscillateur local** : multiplie le signal par une fréquence de référence pour **translater** la bande d'intérêt autour de zéro. « Accorder » la radio = changer cet oscillateur. Quand une mission accorde la radio, c'est ce réglage qu'elle envoie.
- **Filtre anti-repliement** : coupe ce qui déborde de la fenêtre avant numérisation (voir [[echantillonnage]]).
- **ADC** : le convertisseur analogique-numérique échantillonne en [[iq|I/Q]]. À partir d'ici, tout est nombres.

## Deux architectures à connaître

- **Conversion directe** (HackRF, RTL-SDR…) : un seul mélange, droit vers zéro. Simple et compact, mais ça laisse une signature : le fameux **pic central** (« DC spike ») visible pile à la fréquence d'accord — un artefact, pas un signal. Réflexe : se décaler de quelques centaines de kHz pour étudier un signal précis.
- **Superhétérodyne** : une ou plusieurs fréquences intermédiaires avant la bande de base. Plus de composants, mais meilleure réjection des images — l'architecture des récepteurs de trafic haut de gamme.

## L'immense avantage… et la contrepartie

**Une seule boîte, mille usages.** La même puce écoute la FM, l'aviation, l'IoT, les drones — il suffit de changer le logiciel. La contrepartie : la qualité dépend du matériel (bruit, linéarité, [[echantillonnage|bits]] de l'ADC) et du CPU disponible pour la [[fft-spectre|DSP]].

## Les familles courantes

| SDR | Prix | Couverture | Bande max | Bits | Pour qui |
|---|---|---|---|---|---|
| RTL-SDR v3/v4 | ~30 € | 24–1766 MHz | 2,4 MHz | 8 | débuter, ADS-B, FM, ISM |
| HackRF One | ~300 € | 1 MHz–6 GHz | 20 MHz | 8 | tout-terrain, 2,4 GHz, large bande |
| Airspy Mini | ~120 € | 24–1700 MHz | 6 MHz | 12 | qualité d'écoute VHF/UHF |
| SDRplay RSP1B | ~120 € | 1 kHz–2 GHz | 10 MHz | 14 | HF + VHF en finesse |
| ADALM-Pluto | ~250 € | 325 MHz–3,8 GHz | 20 MHz | 12 | expérimentation, émission (licence !) |

Le tien, c'est le [[hackrf]] — et le choix raisonné est détaillé dans [[materiel-debuter]].

## À toi de jouer

1. Tu vois un pic immobile pile au centre, quel que soit l'accord. Signal ou artefact ? (DC spike — artefact de conversion directe.)
2. Pourquoi le LNA est-il le composant le plus critique de la chaîne ? (Le bruit qu'il ajoute est amplifié par tous les étages suivants — il fixe la sensibilité.)
