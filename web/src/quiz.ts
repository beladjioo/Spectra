// Banque de questions type examen radioamateur français (ANFR), bilingue.
// Question bank modelled on the French (ANFR) amateur-radio exam — the
// syllabus is HAREC-harmonised, so it travels well. Two domains, like the
// real exam: regulations and technical.

import type { LStr } from "./lib/i18n";

export type Category = "reglementation" | "technique";

export type Question = {
  id: string;
  cat: Category;
  q: LStr;
  choices: [LStr, LStr, LStr, LStr];
  answer: 0 | 1 | 2 | 3;
  why: LStr;
  note?: string; // slug d'une note de la bibliothèque pour réviser
};

export const CATEGORY_LABEL: Record<Category, LStr> = {
  reglementation: { fr: "Réglementation", en: "Regulations" },
  technique: { fr: "Technique", en: "Technical" },
};

const L = (fr: string, en: string): LStr => ({ fr, en });

export const QUESTIONS: Question[] = [
  // ── Réglementation / Regulations ──────────────────────────────────────────
  {
    id: "r-anfr",
    cat: "reglementation",
    q: L(
      "En France, quel organisme organise l'examen et délivre le certificat d'opérateur radioamateur ?",
      "In France, which body runs the exam and issues the amateur-radio operator certificate?"
    ),
    choices: [L("L'ANFR", "ANFR"), L("L'ARCEP", "ARCEP"), L("La DGAC", "DGAC"), L("L'ARCOM", "ARCOM")],
    answer: 0,
    why: L(
      "L'ANFR (Agence nationale des fréquences) organise l'examen, délivre le certificat et attribue les indicatifs.",
      "ANFR (the French national frequency agency) runs the exam, issues the certificate and assigns callsigns."
    ),
    note: "examen-radioamateur",
  },
  {
    id: "r-qth",
    cat: "reglementation",
    q: L("Que signifie le code Q « QTH » ?", "What does the Q-code “QTH” mean?"),
    choices: [
      L("Ma position est…", "My location is…"),
      L("Je change de fréquence", "I am changing frequency"),
      L("Qui m'appelle ?", "Who is calling me?"),
      L("Accusé de réception", "Acknowledgement of receipt"),
    ],
    answer: 0,
    why: L(
      "QTH = position/emplacement de la station. « Mon QTH est Montpellier. »",
      "QTH = the station's location. “My QTH is Montpellier.”"
    ),
    note: "code-q-phonetique-rst",
  },
  {
    id: "r-qrm",
    cat: "reglementation",
    q: L("Un opérateur signale du « QRM ». De quoi parle-t-il ?", "An operator reports “QRM”. What are they talking about?"),
    choices: [
      L("De brouillages d'origine artificielle", "Man-made interference"),
      L("De parasites atmosphériques", "Atmospheric static"),
      L("D'un signal trop fort", "A signal that is too strong"),
      L("D'une demande de relais", "A request for a relay"),
    ],
    answer: 0,
    why: L(
      "QRM = interférences artificielles (autres émissions). Les parasites naturels, c'est QRN.",
      "QRM = man-made interference (other transmissions). Natural static is QRN."
    ),
    note: "code-q-phonetique-rst",
  },
  {
    id: "r-qsy",
    cat: "reglementation",
    q: L("Que signifie « QSY » ?", "What does “QSY” mean?"),
    choices: [
      L("Je change de fréquence", "I am changing frequency"),
      L("Je diminue la puissance", "I am reducing power"),
      L("Je termine le contact", "I am ending the contact"),
      L("Je répète le message", "I am repeating the message"),
    ],
    answer: 0,
    why: L(
      "QSY = changer de fréquence d'émission. « On QSY sur 145,450 MHz. »",
      "QSY = change transmit frequency. “Let's QSY to 145.450 MHz.”"
    ),
    note: "code-q-phonetique-rst",
  },
  {
    id: "r-qsl",
    cat: "reglementation",
    q: L("Une « carte QSL » sert à :", "A “QSL card” is used to:"),
    choices: [
      L("Confirmer un contact radio", "Confirm a radio contact"),
      L("Déclarer son antenne", "Register an antenna"),
      L("Demander une licence", "Apply for a licence"),
      L("Signaler un brouillage", "Report interference"),
    ],
    answer: 0,
    why: L(
      "QSL = accusé de réception : la carte (papier ou électronique) confirme qu'un QSO a bien eu lieu.",
      "QSL = acknowledgement: the card (paper or electronic) confirms a QSO took place."
    ),
    note: "indicatifs-trafic-journal",
  },
  {
    id: "r-qrz",
    cat: "reglementation",
    q: L("Que demande un opérateur qui lance « QRZ ? » ?", "What is an operator asking with “QRZ?”?"),
    choices: [
      L("Qui m'appelle ?", "Who is calling me?"),
      L("Quelle est ma force de signal ?", "What is my signal strength?"),
      L("Êtes-vous prêt ?", "Are you ready?"),
      L("Quelle heure est-il ?", "What time is it?"),
    ],
    answer: 0,
    why: L(
      "QRZ ? = « qui m'appelle ? » — typiquement après un appel entendu partiellement.",
      "QRZ? = “who is calling me?” — typically after partially copying a call."
    ),
    note: "code-q-phonetique-rst",
  },
  {
    id: "r-phon-r",
    cat: "reglementation",
    q: L(
      "Dans l'alphabet phonétique international, la lettre R s'épelle :",
      "In the international phonetic alphabet, the letter R is spoken as:"
    ),
    choices: [L("Romeo", "Romeo"), L("Radio", "Radio"), L("Roger", "Roger"), L("Rome", "Rome")],
    answer: 0,
    why: L(
      "A = Alfa, B = Bravo… R = Romeo. « Roger » signifie « bien reçu », ce n'est pas une lettre.",
      "A = Alfa, B = Bravo… R = Romeo. “Roger” means “received OK”, it isn't a letter."
    ),
    note: "code-q-phonetique-rst",
  },
  {
    id: "r-prefixe",
    cat: "reglementation",
    q: L(
      "L'indicatif F4ABC commence par F. Que signifie ce préfixe ?",
      "The callsign F4ABC starts with F. What does that prefix indicate?"
    ),
    choices: [
      L("La station est française", "The station is French"),
      L("L'opérateur est de classe F", "The operator holds class F"),
      L("La station est fixe", "The station is fixed"),
      L("L'opérateur utilise la FM", "The operator uses FM"),
    ],
    answer: 0,
    why: L(
      "Le préfixe identifie le pays d'attribution : F (et TM, TK…) = France.",
      "The prefix identifies the issuing country: F (and TM, TK…) = France."
    ),
    note: "indicatifs-trafic-journal",
  },
  {
    id: "r-2m",
    cat: "reglementation",
    q: L(
      "En France, la bande radioamateur « 2 mètres » s'étend de :",
      "In France, the “2-metre” amateur band spans:"
    ),
    choices: [
      L("144 à 146 MHz", "144 to 146 MHz"),
      L("144 à 148 MHz", "144 to 148 MHz"),
      L("140 à 144 MHz", "140 to 144 MHz"),
      L("146 à 148 MHz", "146 to 148 MHz"),
    ],
    answer: 0,
    why: L(
      "En région 1 de l'UIT (Europe), le 2 m radioamateur va de 144 à 146 MHz.",
      "In ITU Region 1 (Europe), the amateur 2 m band runs from 144 to 146 MHz."
    ),
    note: "bandes-radioamateur",
  },
  {
    id: "r-70cm",
    cat: "reglementation",
    q: L("La bande « 70 centimètres » correspond à :", "The “70-centimetre” band corresponds to:"),
    choices: [
      L("430–440 MHz", "430–440 MHz"),
      L("420–450 MHz", "420–450 MHz"),
      L("400–410 MHz", "400–410 MHz"),
      L("440–460 MHz", "440–460 MHz"),
    ],
    answer: 0,
    why: L(
      "En France, le 70 cm s'étend de 430 à 440 MHz (statut partagé).",
      "In France, 70 cm spans 430 to 440 MHz (shared allocation)."
    ),
    note: "bandes-radioamateur",
  },
  {
    id: "r-40m",
    cat: "reglementation",
    q: L("La bande des 40 mètres s'étend en France de :", "In France, the 40-metre band spans:"),
    choices: [
      L("7,0 à 7,2 MHz", "7.0 to 7.2 MHz"),
      L("7,0 à 7,5 MHz", "7.0 to 7.5 MHz"),
      L("6,9 à 7,1 MHz", "6.9 to 7.1 MHz"),
      L("7,2 à 7,4 MHz", "7.2 to 7.4 MHz"),
    ],
    answer: 0,
    why: L(
      "Le 40 m : 7,0–7,2 MHz en région 1 — une bande HF très active le soir.",
      "40 m: 7.0–7.2 MHz in Region 1 — a very active HF band in the evening."
    ),
    note: "bandes-radioamateur",
  },
  {
    id: "r-f3e",
    cat: "reglementation",
    q: L("La classe d'émission F3E désigne :", "The emission class F3E designates:"),
    choices: [
      L("La téléphonie en modulation de fréquence", "Frequency-modulated telephony"),
      L("La télégraphie Morse", "Morse telegraphy"),
      L("La téléphonie en bande latérale unique", "Single-sideband telephony"),
      L("La télévision amateur", "Amateur television"),
    ],
    answer: 0,
    why: L(
      "F = modulation de fréquence, 3 = un canal analogique, E = téléphonie. F3E = la phonie FM classique.",
      "F = frequency modulation, 3 = one analogue channel, E = telephony. F3E = classic FM voice."
    ),
    note: "modulations",
  },
  {
    id: "r-a3e",
    cat: "reglementation",
    q: L("La classe d'émission A3E correspond à :", "The emission class A3E corresponds to:"),
    choices: [
      L("La téléphonie en modulation d'amplitude", "Amplitude-modulated telephony"),
      L("La téléphonie FM", "FM telephony"),
      L("La télégraphie", "Telegraphy"),
      L("Les données numériques", "Digital data"),
    ],
    answer: 0,
    why: L(
      "A = modulation d'amplitude double bande, 3 = analogique, E = téléphonie. C'est l'AM « historique ».",
      "A = double-sideband amplitude modulation, 3 = analogue, E = telephony. The “historic” AM."
    ),
    note: "modulations",
  },
  {
    id: "r-j3e",
    cat: "reglementation",
    q: L(
      "La BLU (bande latérale unique) en téléphonie correspond à la classe :",
      "SSB (single sideband) telephony corresponds to emission class:"
    ),
    choices: [L("J3E", "J3E"), L("F3E", "F3E"), L("A1A", "A1A"), L("G3E", "G3E")],
    answer: 0,
    why: L(
      "J3E = BLU à porteuse supprimée, le mode phonie dominant en HF (USB/LSB).",
      "J3E = suppressed-carrier SSB, the dominant voice mode on HF (USB/LSB)."
    ),
    note: "modulations",
  },
  {
    id: "r-rst59",
    cat: "reglementation",
    q: L("Un report « 59 » signifie :", "A “59” report means:"),
    choices: [
      L("Parfaitement lisible et signal très fort", "Perfectly readable and very strong signal"),
      L("Faiblement lisible, signal fort", "Barely readable, strong signal"),
      L("Lisible, signal faible", "Readable, weak signal"),
      L("Code postal du correspondant", "The other station's postcode"),
    ],
    answer: 0,
    why: L(
      "RST : R5 = parfaitement lisible (sur 5), S9 = signal très fort (sur 9).",
      "RST: R5 = perfectly readable (out of 5), S9 = very strong signal (out of 9)."
    ),
    note: "code-q-phonetique-rst",
  },
  {
    id: "r-secret",
    cat: "reglementation",
    q: L(
      "Vous captez une communication qui ne vous est pas destinée. Que dit la loi ?",
      "You receive a communication not intended for you. What does the law say?"
    ),
    choices: [
      L("Interdiction de la divulguer ou de l'exploiter", "You must not disclose or exploit it"),
      L("Vous pouvez la publier si elle est intéressante", "You may publish it if it's interesting"),
      L("Vous devez la signaler à l'ANFR", "You must report it to the regulator"),
      L("Vous pouvez y répondre", "You may reply to it"),
    ],
    answer: 0,
    why: L(
      "Le secret des correspondances s'applique : écouter n'autorise jamais à divulguer le contenu à des tiers.",
      "Secrecy of correspondence applies: listening never entitles you to disclose the content to third parties."
    ),
    note: "legal-securite",
  },
  {
    id: "r-clair",
    cat: "reglementation",
    q: L("Les communications radioamateurs doivent se faire :", "Amateur-radio communications must be conducted:"),
    choices: [
      L(
        "En langage clair, sans chiffrement destiné à masquer le sens",
        "In plain language, without encryption meant to obscure meaning"
      ),
      L("Dans une langue européenne uniquement", "Only in a European language"),
      L("En code secret entre membres d'un club", "In secret code between club members"),
      L("Uniquement en Morse sur HF", "Only in Morse on HF"),
    ],
    answer: 0,
    why: L(
      "Le service amateur impose le langage clair : pas de chiffrement pour dissimuler le contenu des échanges.",
      "The amateur service requires plain language: no encryption to conceal the content of exchanges."
    ),
    note: "reglementation",
  },
  {
    id: "r-musique",
    cat: "reglementation",
    q: L(
      "Diffuser de la musique ou de la publicité sur les bandes amateurs est :",
      "Broadcasting music or advertising on the amateur bands is:"
    ),
    choices: [
      L("Interdit", "Forbidden"),
      L("Toléré le week-end", "Tolerated at weekends"),
      L("Autorisé en FM seulement", "Allowed on FM only"),
      L("Autorisé en dessous de 30 MHz", "Allowed below 30 MHz"),
    ],
    answer: 0,
    why: L(
      "Les bandes amateurs servent à l'expérimentation et au trafic entre stations autorisées — pas de radiodiffusion.",
      "Amateur bands exist for experimentation and traffic between licensed stations — no broadcasting."
    ),
    note: "reglementation",
  },
  {
    id: "r-indicatif",
    cat: "reglementation",
    q: L(
      "Quand devez-vous transmettre votre indicatif en cours de contact ?",
      "When must you transmit your callsign during a contact?"
    ),
    choices: [
      L("Au début, à la fin et à intervalles réguliers", "At the start, at the end and at regular intervals"),
      L("Uniquement au début", "Only at the start"),
      L("Uniquement si on vous le demande", "Only if asked"),
      L("Jamais en FM", "Never on FM"),
    ],
    answer: 0,
    why: L(
      "L'identification est obligatoire en début et fin d'émission et à intervalles rapprochés pendant le trafic.",
      "Identification is mandatory at the start and end of transmissions and at short intervals while operating."
    ),
    note: "indicatifs-trafic-journal",
  },
  {
    id: "r-exam",
    cat: "reglementation",
    q: L("L'examen radioamateur français évalue :", "The French amateur-radio exam assesses:"),
    choices: [
      L("La réglementation et la technique", "Regulations and technical knowledge"),
      L("Uniquement le code Morse", "Morse code only"),
      L("Uniquement la technique", "Technical knowledge only"),
      L("L'anglais aéronautique", "Aviation English"),
    ],
    answer: 0,
    why: L(
      "Deux épreuves : réglementation (et procédures) + technique (électricité/radioélectricité). Le Morse n'est plus exigé.",
      "Two parts: regulations (and procedures) + technical (electricity/radio). Morse is no longer required."
    ),
    note: "examen-radioamateur",
  },

  // ── Technique / Technical ─────────────────────────────────────────────────
  {
    id: "t-ohm",
    cat: "technique",
    q: L(
      "Une résistance de 50 Ω est parcourue par 0,1 A. La tension à ses bornes vaut :",
      "A 50 Ω resistor carries 0.1 A. The voltage across it is:"
    ),
    choices: [L("5 V", "5 V"), L("0,5 V", "0.5 V"), L("50 V", "50 V"), L("500 V", "500 V")],
    answer: 0,
    why: L("Loi d'Ohm : U = R × I = 50 × 0,1 = 5 V.", "Ohm's law: V = R × I = 50 × 0.1 = 5 V."),
    note: "electricite",
  },
  {
    id: "t-puissance",
    cat: "technique",
    q: L(
      "Un émetteur alimenté en 13,8 V consomme 2 A. La puissance consommée est d'environ :",
      "A transmitter on a 13.8 V supply draws 2 A. The power consumed is about:"
    ),
    choices: [L("27,6 W", "27.6 W"), L("6,9 W", "6.9 W"), L("15,8 W", "15.8 W"), L("55,2 W", "55.2 W")],
    answer: 0,
    why: L("P = U × I = 13,8 × 2 = 27,6 W.", "P = V × I = 13.8 × 2 = 27.6 W."),
    note: "electricite",
  },
  {
    id: "t-3db",
    cat: "technique",
    q: L("Augmenter une puissance de 3 dB revient à la :", "Increasing a power level by 3 dB means:"),
    choices: [
      L("Doubler", "Doubling it"),
      L("Tripler", "Tripling it"),
      L("Multiplier par 10", "Multiplying it by 10"),
      L("Augmenter de 3 %", "Increasing it by 3%"),
    ],
    answer: 0,
    why: L(
      "+3 dB ≈ ×2 en puissance ; +10 dB = ×10 ; +20 dB = ×100. Le décibel est logarithmique.",
      "+3 dB ≈ ×2 in power; +10 dB = ×10; +20 dB = ×100. The decibel is logarithmic."
    ),
    note: "decibels",
  },
  {
    id: "t-20db",
    cat: "technique",
    q: L(
      "+20 dB correspond à une multiplication de la puissance par :",
      "+20 dB corresponds to multiplying power by:"
    ),
    choices: [L("100", "100"), L("20", "20"), L("2", "2"), L("1000", "1000")],
    answer: 0,
    why: L("20 dB = 2 × 10 dB = ×10 × ×10 = ×100.", "20 dB = 2 × 10 dB = ×10 × ×10 = ×100."),
    note: "decibels",
  },
  {
    id: "t-lambda144",
    cat: "technique",
    q: L("Quelle est la longueur d'onde d'un signal à 144 MHz ?", "What is the wavelength of a 144 MHz signal?"),
    choices: [
      L("Environ 2 m", "About 2 m"),
      L("Environ 4 m", "About 4 m"),
      L("Environ 70 cm", "About 70 cm"),
      L("Environ 1 m", "About 1 m"),
    ],
    answer: 0,
    why: L(
      "λ(m) = 300 / f(MHz) = 300/144 ≈ 2,08 m — d'où le nom « bande des 2 mètres ».",
      "λ(m) = 300 / f(MHz) = 300/144 ≈ 2.08 m — hence the name “2-metre band”."
    ),
    note: "ondes-radio",
  },
  {
    id: "t-freq10m",
    cat: "technique",
    q: L(
      "Une longueur d'onde de 10 m correspond à une fréquence de :",
      "A wavelength of 10 m corresponds to a frequency of:"
    ),
    choices: [L("30 MHz", "30 MHz"), L("10 MHz", "10 MHz"), L("3 MHz", "3 MHz"), L("300 MHz", "300 MHz")],
    answer: 0,
    why: L("f(MHz) = 300 / λ(m) = 300/10 = 30 MHz.", "f(MHz) = 300 / λ(m) = 300/10 = 30 MHz."),
    note: "ondes-radio",
  },
  {
    id: "t-dipole",
    cat: "technique",
    q: L("Un dipôle demi-onde pour 100 MHz mesure environ :", "A half-wave dipole for 100 MHz is about:"),
    choices: [L("1,5 m", "1.5 m"), L("3 m", "3 m"), L("0,75 m", "0.75 m"), L("6 m", "6 m")],
    answer: 0,
    why: L(
      "λ = 300/100 = 3 m ; un dipôle demi-onde fait λ/2 ≈ 1,5 m.",
      "λ = 300/100 = 3 m; a half-wave dipole is λ/2 ≈ 1.5 m."
    ),
    note: "antennes",
  },
  {
    id: "t-coax",
    cat: "technique",
    q: L(
      "L'impédance caractéristique des câbles coaxiaux usuels en radio est :",
      "The characteristic impedance of common radio coax cables is:"
    ),
    choices: [L("50 Ω", "50 Ω"), L("75 Ω", "75 Ω"), L("300 Ω", "300 Ω"), L("600 Ω", "600 Ω")],
    answer: 0,
    why: L(
      "Le standard radio/SDR est 50 Ω (la télévision utilise du 75 Ω).",
      "The radio/SDR standard is 50 Ω (television uses 75 Ω)."
    ),
    note: "lignes-ros-adaptation",
  },
  {
    id: "t-ros",
    cat: "technique",
    q: L(
      "Le ROS idéal d'une antenne parfaitement adaptée vaut :",
      "The ideal SWR of a perfectly matched antenna is:"
    ),
    choices: [L("1:1", "1:1"), L("0:1", "0:1"), L("2:1", "2:1"), L("∞", "∞")],
    answer: 0,
    why: L(
      "ROS 1:1 = toute la puissance part dans l'antenne, aucune onde réfléchie.",
      "SWR 1:1 = all the power goes into the antenna, nothing reflected."
    ),
    note: "lignes-ros-adaptation",
  },
  {
    id: "t-ros-eleve",
    cat: "technique",
    q: L("Un ROS élevé indique :", "A high SWR indicates:"),
    choices: [
      L("Une désadaptation entre la ligne et l'antenne", "A mismatch between the line and the antenna"),
      L("Une antenne trop performante", "An antenna that performs too well"),
      L("Un récepteur trop sensible", "A receiver that is too sensitive"),
      L("Une propagation exceptionnelle", "Exceptional propagation"),
    ],
    answer: 0,
    why: L(
      "Plus le ROS monte, plus la puissance est réfléchie vers l'émetteur au lieu d'être rayonnée.",
      "The higher the SWR, the more power is reflected back to the transmitter instead of radiated."
    ),
    note: "lignes-ros-adaptation",
  },
  {
    id: "t-passebas",
    cat: "technique",
    q: L("En sortie d'émetteur, un filtre passe-bas sert à :", "At a transmitter's output, a low-pass filter is used to:"),
    choices: [
      L(
        "Atténuer les harmoniques au-dessus de la fréquence de travail",
        "Attenuate harmonics above the operating frequency"
      ),
      L("Amplifier les basses fréquences", "Amplify low frequencies"),
      L("Supprimer le bruit de fond", "Remove the noise floor"),
      L("Adapter l'impédance", "Match the impedance"),
    ],
    answer: 0,
    why: L(
      "Il laisse passer la fondamentale et atténue les harmoniques (2f, 3f…) qui brouilleraient d'autres services.",
      "It passes the fundamental and attenuates harmonics (2f, 3f…) that would interfere with other services."
    ),
    note: "circuits-resonance-filtres",
  },
  {
    id: "t-harmonique",
    cat: "technique",
    q: L(
      "Le deuxième harmonique d'un émetteur réglé sur 7 MHz se trouve à :",
      "The second harmonic of a transmitter set to 7 MHz is at:"
    ),
    choices: [L("14 MHz", "14 MHz"), L("3,5 MHz", "3.5 MHz"), L("21 MHz", "21 MHz"), L("7,2 MHz", "7.2 MHz")],
    answer: 0,
    why: L(
      "Harmonique 2 = 2 × f = 14 MHz — en plein dans la bande des 20 m, d'où l'importance du filtrage.",
      "2nd harmonic = 2 × f = 14 MHz — right inside the 20 m band, hence the importance of filtering."
    ),
    note: "circuits-resonance-filtres",
  },
  {
    id: "t-condo",
    cat: "technique",
    q: L("Un condensateur :", "A capacitor:"),
    choices: [
      L("Bloque le courant continu et laisse passer l'alternatif", "Blocks DC and passes AC"),
      L("Laisse passer le continu et bloque l'alternatif", "Passes DC and blocks AC"),
      L("Amplifie le signal", "Amplifies the signal"),
      L("Redresse le courant", "Rectifies the current"),
    ],
    answer: 0,
    why: L(
      "Le condensateur se charge en continu (courant nul en régime établi) mais transmet les variations.",
      "A capacitor charges up under DC (no steady-state current) but passes variations."
    ),
    note: "composants-electroniques",
  },
  {
    id: "t-diode",
    cat: "technique",
    q: L("Une diode laisse passer le courant :", "A diode conducts current:"),
    choices: [
      L("Dans un seul sens", "In one direction only"),
      L("Dans les deux sens", "In both directions"),
      L("Jamais", "Never"),
      L("Seulement en alternatif", "Only on AC"),
    ],
    answer: 0,
    why: L(
      "Conduction de l'anode vers la cathode en polarisation directe — c'est la base du redressement et de la détection AM.",
      "It conducts from anode to cathode under forward bias — the basis of rectification and AM detection."
    ),
    note: "composants-electroniques",
  },
  {
    id: "t-lc",
    cat: "technique",
    q: L(
      "Dans un circuit LC, si on diminue la capacité C, la fréquence de résonance :",
      "In an LC circuit, if you decrease the capacitance C, the resonant frequency:"
    ),
    choices: [L("Augmente", "Increases"), L("Diminue", "Decreases"), L("Ne change pas", "Stays the same"), L("Devient nulle", "Drops to zero")],
    answer: 0,
    why: L(
      "f = 1/(2π√(LC)) : C plus petit → √(LC) plus petit → f plus grande.",
      "f = 1/(2π√(LC)): smaller C → smaller √(LC) → higher f."
    ),
    note: "circuits-resonance-filtres",
  },
  {
    id: "t-iono",
    cat: "technique",
    q: L(
      "Les liaisons HF intercontinentales (ex. 14 MHz) sont possibles grâce à :",
      "Intercontinental HF contacts (e.g. 14 MHz) are possible thanks to:"
    ),
    choices: [
      L("La réflexion sur l'ionosphère", "Reflection off the ionosphere"),
      L("La courbure des ondes par le vent", "Waves bent by the wind"),
      L("Les satellites", "Satellites"),
      L("La conduction par le sol uniquement", "Ground conduction alone"),
    ],
    answer: 0,
    why: L(
      "Les couches ionisées (notamment F) réfléchissent les ondes courtes, permettant des bonds de milliers de km.",
      "Ionised layers (especially F) reflect short waves, enabling hops of thousands of km."
    ),
    note: "propagation",
  },
  {
    id: "t-vhf",
    cat: "technique",
    q: L("En VHF/UHF, la propagation habituelle se fait :", "On VHF/UHF, propagation is normally:"),
    choices: [
      L("En ligne de vue (portée quasi optique)", "Line of sight (near-optical range)"),
      L("Par réflexion ionosphérique systématique", "Always via ionospheric reflection"),
      L("Par le sol sur des milliers de km", "Via ground wave over thousands of km"),
      L("Uniquement la nuit", "Only at night"),
    ],
    answer: 0,
    why: L(
      "Au-dessus de ~30 MHz, l'ionosphère ne réfléchit plus de façon fiable : la portée est essentiellement directe.",
      "Above ~30 MHz the ionosphere no longer reflects reliably: range is essentially direct."
    ),
    note: "propagation",
  },
  {
    id: "t-fm",
    cat: "technique",
    q: L(
      "En modulation de fréquence (FM), l'information fait varier :",
      "In frequency modulation (FM), the information varies:"
    ),
    choices: [
      L("La fréquence instantanée de la porteuse", "The carrier's instantaneous frequency"),
      L("L'amplitude de la porteuse", "The carrier's amplitude"),
      L("La phase uniquement", "Only the phase"),
      L("La largeur des impulsions", "The pulse width"),
    ],
    answer: 0,
    why: L(
      "FM = la fréquence s'écarte de la porteuse au rythme du signal modulant ; l'amplitude reste constante.",
      "FM = the frequency deviates around the carrier at the rhythm of the modulating signal; amplitude stays constant."
    ),
    note: "modulations",
  },
  {
    id: "t-snr",
    cat: "technique",
    q: L(
      "Un signal 20 dB au-dessus du bruit a une puissance :",
      "A signal 20 dB above the noise has a power:"
    ),
    choices: [
      L("100 fois celle du bruit", "100 times the noise"),
      L("20 fois celle du bruit", "20 times the noise"),
      L("2 fois celle du bruit", "2 times the noise"),
      L("400 fois celle du bruit", "400 times the noise"),
    ],
    answer: 0,
    why: L(
      "SNR de 20 dB = rapport de puissance 10^(20/10) = 100.",
      "20 dB SNR = power ratio of 10^(20/10) = 100."
    ),
    note: "bruit-et-snr",
  },
  {
    id: "t-dbm",
    cat: "technique",
    q: L("+30 dBm correspond à une puissance de :", "+30 dBm corresponds to a power of:"),
    choices: [L("1 W", "1 W"), L("30 W", "30 W"), L("100 mW", "100 mW"), L("3 W", "3 W")],
    answer: 0,
    why: L("0 dBm = 1 mW ; +30 dB = ×1000 → 1 W.", "0 dBm = 1 mW; +30 dB = ×1000 → 1 W."),
    note: "decibels",
  },
];

export const byCategory = (cat: Category) => QUESTIONS.filter((q) => q.cat === cat);

export function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
