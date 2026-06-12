# Régler son antenne, pas à pas

La théorie est dans [[antennes]] ; ici, on **agit**. Objectif : partir d'un télescopique standard et obtenir la meilleure réception possible sur la bande que tu écoutes — mesurée, pas devinée.

## 1. La longueur juste

Une antenne quart d'onde capte le mieux quand le brin mesure un quart de la [[ondes-radio|longueur d'onde]], raccourci d'environ 5 % (l'onde « ralentit » dans le métal — facteur de vélocité) :

```
L (cm) ≈ 7125 / f (MHz)
```

| Bande | Fréquence | Longueur du brin | Télescopique ? |
|---|---|---|---|
| Radio FM | 100 MHz | **71 cm** | déployé presque entier |
| Aviation (voix) | 125 MHz | **57 cm** | aux trois quarts |
| 2 m radioamateur | 145 MHz | **49 cm** | aux deux tiers |
| ISM 433 | 433 MHz | **16,5 cm** | 2–3 segments |
| ISM 868 (LoRa, capteurs) | 868 MHz | **8,2 cm** | le tout premier segment |
| ADS-B (avions) | 1090 MHz | **6,5 cm** | premier segment, ou antenne dédiée |
| 2,4 GHz (WiFi, drones) | 2440 MHz | **2,9 cm** | trop court — antenne dédiée |

Retiens le geste : **fréquence qui monte → antenne qui raccourcit**. Un télescopique tout déployé sur 868 MHz capte *moins bien* que sorti de 8 cm : trop long, il n'est plus accordé.

## 2. Le placement (souvent plus important que la longueur)

- **En hauteur et dégagé** : près d'une fenêtre, mieux : dehors. Les murs et le béton armé mangent les UHF.
- **Vertical** : la quasi-totalité de ce que tu écoutes (FM locale, aviation, ISM, ADS-B) est polarisée verticalement. Antenne couchée = signal divisé.
- **Loin du bruit** : alimentations à découpage, écrans, hubs USB et box internet polluent le [[bruit-et-snr|plancher de bruit]] à plusieurs mètres. Une rallonge USB blindée qui éloigne le SDR du PC est l'amélioration au meilleur rapport efficacité/prix.
- **Un plan de sol aide** : la base magnétique posée sur une plaque métallique (boîte de conserve, toit de voiture, radiateur) complète le quart d'onde et gagne facilement quelques dB.

## 3. Mesurer au lieu de croire

Ouvre la console **Explorer** et utilise le panneau « Signaux captés » :

1. Accorde-toi sur la bande visée (préréglage ou fréquence manuelle).
2. Note le **SNR** du signal le plus fort.
3. Change *une seule chose* (longueur, position, orientation), attends deux secondes, relis le SNR.
4. Garde la configuration qui gagne. Répète.

Repères : **< 10 dB** l'écoute est pénible, **15–25 dB** c'est confortable, **> 25 dB** excellent. Si *tout* le spectre monte d'un coup, ce n'est pas une meilleure réception : c'est le gain trop haut qui sature — voir [[workflow-live]].

## 4. Dépannage express

| Symptôme | Cause probable | Remède |
|---|---|---|
| Rien ne dépasse du bruit | gain trop bas, antenne débranchée | monte le gain par paliers, vérifie le connecteur |
| Plancher de bruit très haut | parasites USB/alim à proximité | éloigne le SDR, rallonge blindée, ferrites |
| Forte station mais audio haché | saturation (gain trop haut) | redescends le gain jusqu'à un plancher plat |
| Bonne FM, mauvais 868 MHz | antenne trop longue pour la bande | raccourcis à ~8 cm ou change d'antenne |
| Signaux fantômes répétés | images (récepteur surchargé) | baisse le gain, écarte-toi des émetteurs puissants |

## 5. Aller plus loin

Quand tu voudras des antennes taillées (dipôle en V pour satellites, colinéaire ADS-B, Yagi directive), la théorie de l'adaptation et du ROS est dans [[lignes-ros-adaptation]], et le choix du matériel dans [[materiel-debuter]].

Lié : [[antennes]] · [[workflow-live]] · [[bandes-a-explorer]]
