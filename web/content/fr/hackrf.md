# Le HackRF One

Le HackRF One est un SDR très polyvalent. Ses caractéristiques clés à connaître :

- **Couverture 1 MHz → 6 GHz** : de la radio AM jusqu'au WiFi 5 GHz. Une fenêtre énorme.
- **Jusqu'à 20 MSps** : une largeur d'observation d'environ 20 MHz d'un coup (voir [[echantillonnage]]).
- **Half-duplex** : il émet *ou* il reçoit, jamais les deux en même temps. Dans l'académie, on reste **en réception seule** — il n'émet jamais.
- **8 bits** de résolution : plage dynamique modeste. D'où l'importance de bien régler le gain.

Trois **gains** réglables, à comprendre comme une chaîne :
- **LNA** (amplificateur faible bruit, côté antenne) : aide les signaux faibles, mais trop haut il sature sur les signaux forts.
- **VGA** (gain de l'étage en bande de base) : ajuste le niveau avant l'échantillonneur.
- **Ampli RF** (+14 dB) : un coup de pouce, à n'activer que si nécessaire.

**Le bon réglage** : monte le gain jusqu'à voir tes signaux ressortir du [[bruit-et-snr|plancher]], mais **redescends dès que le plancher entier monte** ou que des pics « fantômes » apparaissent — c'est la **saturation**. Un récepteur saturé invente des signaux qui n'existent pas.

Côté logiciel, on parle au HackRF via **SoapySDR** (`driver=hackrf`) : la même API sur ton laptop de dev et sur le Pi 5. Vérifie qu'il est vu avec `hackrf_info`.

Il lui faut une [[antennes|antenne]] adaptée à la bande visée — l'antenne fournie est un compromis.

> 👉 Confirme qu'il répond : [Premier contact](#mission:first-contact)
