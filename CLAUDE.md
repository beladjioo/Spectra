# Spectra / openhertz — règles pour agents

**Charte plateforme obligatoire : `~/Desktop/CLAUDE.md` +
`~/Desktop/REVENUE_PLAYBOOK.md`.** Ce fichier ancre le pivot produit décidé le
2026-07-21.

## Le pivot : d'open source gratuit à produit payant

Spectra (RF Academy) reste open source sur le cœur, mais devient un produit à
deux jambes de revenus :

1. **Cours payants** — parcours guidés HackRF / GNU Radio / SDR (labs
   pratiques, progression, certificats). Le contenu libre existant devient le
   funnel d'acquisition ; les parcours structurés et les labs avancés sont
   payants.
2. **Boutique de merch hardware** — vente de matériel RF (HackRF, antennes,
   SDR, kits pédagogiques, bundles « cours + matériel ») **sur le site
   Spectra**. Cette boutique **prend le relais du projet `drop-shipping`** :
   la plateforme e-commerce déjà construite là-bas (Astro sur Cloudflare) est
   réutilisée/spécialisée ici — on ne repart pas de zéro, et `drop-shipping`
   ne cherche plus de « produits gagnants » génériques.

## Réorientation du 2026-09-29 : la prépa examen d'abord, sans boutique

Décision de l'utilisateur après le classement ROI du 2026-09-29 : le **premier
euro** vient d'une **prépa payante à l'examen radioamateur** (ANFR, HAREC), pas
de la boutique. La boutique de matériel (conformité CE/RED, stock, SAV, TVA,
marges minces) est **suspendue** — ne pas la construire sans nouvelle demande ;
l'affiliation (zéro stock) reste envisageable.

- **Encaissement : Polar** (merchant of record — il collecte et reverse la TVA),
  produit à achat unique avec avantage « clé de licence ». Le compte vendeur est
  créé **par l'utilisateur**, jamais par un agent.
- **Le dépôt est public** : la banque payante n'y entre **jamais**. Elle vit dans
  `~/Desktop/openhertz-prep/` (ignoré par Git) et dans le KV Cloudflare `PREP`
  (clé `bank:v1`). Le Worker (`web/worker/index.js`, `/api/prep/*`) vérifie la clé
  Polar et délivre un jeton de 30 jours ; l'application (`web/src/lib/prep.ts`)
  n'affiche l'offre que si tout est configuré. Procédure : `docs/prep-payante.md`.
- **Aucune question vendue sans relecture humaine** : chaque lot passe par
  `openhertz-prep/REVIEW.md` ; les faits marqués ⚠ se vérifient sur le texte
  officiel (ANFR, décision ARCEP, plan de bandes) avant la mise en ligne.
- Le reste du site reste gratuit (missions, bibliothèque, 40 questions, examen
  blanc) : c'est l'entonnoir. Ne pas écrire « 100 % gratuit » tant que la prépa
  est en vente.

## Règles spécifiques

- Web-facing → **Cloudflare** (Pages/Workers), pas le cluster (le DaemonSet
  rf-academy du cluster a été retiré le 2026-07-21 — ne pas le ressusciter
  sans besoin réel).
- Vente de hardware = obligations réelles : conformité CE/RED des produits
  radio revendus, CGV, rétractation 14 j, gestion TVA — à câbler avec eu-inc
  (facturation) avant la première vente.
- **Cadre légal RF affiché partout** : les cours et le matériel sont vendus
  pour l'expérimentation légale (bandes autorisées, réception, labs isolés) ;
  aucun contenu qui guide vers l'émission illégale ou l'interception de
  communications de tiers.
- Bundles = le vrai différenciateur : « kit matériel + parcours » que ni un
  vendeur de hardware ni un site de cours seuls ne proposent.

## Étapes vers le premier euro

> Remplacées le 2026-09-29 par la prépa examen (section ci-dessus) : 1) relire le
> lot 1, 2) créer le produit Polar, 3) activer `/api/prep/*`, 4) diffuser
> (forums radioamateurs, radio-clubs, REF). Liste d'origine conservée pour mémoire :

1. Restructurer le contenu existant : libre (funnel) vs payant (parcours).
2. Paiement (Stripe) + accès aux parcours payants.
3. Boutique : reprendre la base Astro/Cloudflare de `drop-shipping`,
   catalogue initial 5–10 références RF à forte demande + 1 bundle.
4. Distribution : communauté SDR (forums, YouTube RF, Discord) — niche
   passionnée, faible concurrence francophone.
