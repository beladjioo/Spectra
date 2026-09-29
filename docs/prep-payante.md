# Prépa examen payante — mise en service

La fonction est livrée **dormante** : tant que les étapes ci-dessous ne sont pas
faites, `/api/prep/config` répond `enabled: false` et le site n'affiche rien.

## 1. Relire le contenu (utilisateur)

`~/Desktop/openhertz-prep/REVIEW.md` : chaque question, bonne réponse en premier.
Corriger dans `build.py`, puis `python3 build.py`. Les lignes ⚠ se vérifient sur
le texte officiel. Le contenu reste **hors du dépôt public**.

## 2. Polar (utilisateur — création de compte)

1. Compte vendeur sur polar.sh, organisation « OpenHertz », **au nom de
   l'entreprise individuelle québécoise** (décision du 2026-09-29) : pays
   Canada, versements Stripe Connect Express sur le compte bancaire canadien de
   l'EI. Le Canada figure dans les pays pris en charge par Polar. Polar reste
   vendeur officiel face à l'acheteur (TVA/TPS collectées et reversées par
   lui) ; l'EI déclare les versements reçus comme revenu d'entreprise.
2. Produit « Prépa examen radioamateur », **paiement unique** (prix proposé :
   19 €), avec un avantage **License Keys** (sans limite d'activation ni
   d'expiration).
3. Relever : l'**ID d'organisation**, l'**ID de l'avantage** (benefit) et le
   **lien de paiement** (Checkout Link).

## 3. Cloudflare (depuis `web/`)

    npx wrangler kv namespace create PREP            # → id
    npx wrangler secret put PREP_SIGNING_KEY         # longue chaîne aléatoire
    npx wrangler kv key put --binding PREP bank:v1 \
      --path ~/Desktop/openhertz-prep/bank.json --remote

Puis décommenter dans `wrangler.jsonc` le bloc `kv_namespaces` et `vars`
(`POLAR_ORG_ID`, `POLAR_BENEFIT_ID`, `PREP_CHECKOUT_URL`, `PREP_PRICE`) — ce ne
sont pas des secrets —, et `npx wrangler deploy`.

## 4. Vérifier

    curl -s https://openhertz.org/api/prep/config    # enabled: true
    # achat test en mode sandbox Polar → coller la clé dans l'onglet Examen

## Fonctionnement

- `POST /api/prep/unlock {key}` → validation auprès de
  `api.polar.sh/v1/customer-portal/license-keys/validate` (public, sans jeton),
  statut `granted` exigé → jeton HMAC de 30 jours.
- `GET /api/prep/bank` (Bearer) → contenu du KV `bank:v1`.
- Le navigateur garde clé, jeton et banque ; au-delà de 30 jours la clé est
  revalidée (remboursement ou révocation = accès retiré).
- Aucune donnée d'acheteur n'est stockée par OpenHertz ; Polar est le vendeur
  officiel (merchant of record) et gère la TVA.
- Ajouter des questions : éditer `build.py`, relire, puis relancer le `kv key put` —
  sans redéployer le site.
