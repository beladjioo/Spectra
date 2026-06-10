# GO-LIVE — mise en production depuis le homelab K3s & monétisation

> Analyse pour exposer RF Academy sur Internet à partir du cluster K3s du
> homelab, et recommandations paiements (CB, crypto, dons). Rédigé pour être
> actionnable : chaque section se termine par une recommandation ferme.

---

## 1. L'insight architectural qui change tout

Le produit a **deux natures** qu'il ne faut pas confondre :

1. **L'appliance** (Pi 5 + SDR chez l'utilisateur) — c'est elle qui a besoin du
   matériel radio. Elle reste locale, GitOps, hors-ligne. Rien à changer.
2. **Le site public** (vitrine + démo + parcours + bibliothèque + examen) — il
   tourne **en mode simulateur**, donc *sans aucun matériel*. Le frontend est
   un bundle statique de ~180 kB gzip ; seul le flux WS du simulateur est
   dynamique, et il est trivialement peu coûteux.

Conséquence : **le site public n'a presque pas besoin de serveur**. La
stratégie robuste n'est pas « comment exposer mon homelab » mais « comment en
servir le moins possible depuis chez moi ».

## 2. Le homelab K3s comme hébergement public : verdict honnête

### Pertinence
- ✅ Excellent pour **apprendre** et pour démarrer à coût zéro : tu as déjà
  k3s + ArgoCD + CI ; les manifests sont réutilisables tels quels.
- ⚠️ Inadapté comme **fondation long terme** d'un produit payant : IP
  résidentielle, pas de SLA, panne de courant/box = site down, et surtout un
  **risque de pivot vers ton réseau personnel** si l'app est compromise.

### Charge & scalabilité
- Statique + WS simulateur : un seul nœud tient sans peine **des centaines de
  connexions WS simultanées** (le backend Rust broadcast un frame ~8/s à tous
  les abonnés ; c'est du O(n) trivial). Pour un lancement (Reddit/HN), le
  goulot sera **l'upload de ta box** (typiquement 50–700 Mbit/s), pas le CPU.
- La scalabilité propre = sortir le statique vers un CDN (gratuit, infini) et
  ne garder en origin que le WS sim. Au-delà : un VPS à 5–10 €/mois encaisse
  des milliers d'utilisateurs simultanés pour cette charge.

### Risques d'exposer un homelab (à prendre au sérieux)
| Risque | Réalité | Mitigation |
|---|---|---|
| DDoS / scan permanent | certain (toute IP exposée est scannée en minutes) | ne jamais exposer l'IP : tunnel sortant uniquement |
| Pivot vers le LAN perso | le vrai danger : NAS, PC, domotique sur le même réseau | VLAN dédié + NetworkPolicies + aucun secret perso sur ce cluster |
| IP résidentielle qui change / CGNAT | fréquent | tunnel (résout aussi ça) |
| Panne maison = site down | certain, un jour | statique sur CDN → la vitrine reste up |
| CGU du FAI (interdiction d'héberger) | à vérifier | tunnel = trafic sortant, discret et conforme dans les faits |
| RGPD / données utilisateurs | dès qu'il y a des comptes/emails | ne stocker AUCUNE donnée perso sur le homelab |

### Architecture recommandée (robuste et pro, coût ≈ 0–5 €/mois)

```
Internet
   │
Cloudflare (DNS + CDN + TLS + WAF + analytics)
   ├── rfacademy.app  → Cloudflare Pages : le bundle web STATIQUE
   │                    (build par le CI GitHub — zéro origin à protéger)
   └── live.rfacademy.app → Cloudflare Tunnel (cloudflared, connexion SORTANTE)
                              │
                        homelab K3s (namespace dédié, NetworkPolicy "deny all
                        sauf egress tunnel") → pod rf-academy SDR_SIM=1
                              (le simulateur public ; AUCUN port ouvert sur la box)
```

1. **Front statique sur Cloudflare Pages** (ou GitHub Pages) : gratuit,
   mondial, increvable. Le CI le déploie déjà presque (un job `vite build` +
   upload).
2. **Cloudflare Tunnel** pour le WS du simulateur : `cloudflared` tourne en
   pod, ouvre une connexion *sortante* — **aucun port entrant sur ta box**, IP
   cachée, TLS et protection DDoS inclus. (Alternative auto-hébergée : un VPS
   3–5 €/mois en bastion WireGuard + Caddy, si tu veux éviter Cloudflare.)
3. **Isolation** : namespace dédié, `NetworkPolicy` par défaut deny,
   idéalement un nœud/VLAN séparé du LAN familial ; pas de kubeconfig, pas de
   dashboard, pas d'ArgoCD exposés (ArgoCD reste en pull, c'est son génie).
4. **Hygiène K3s** : mises à jour automatiques (le CI pousse déjà des images
   pinnées par SHA), RBAC minimal, `kube-bench` une fois pour la base.
5. **Observabilité** : Cloudflare Analytics (gratuit) + uptime-kuma sur le
   cluster + une alerte (ntfy/Telegram) si le tunnel tombe.
6. **Plan de sortie** : le jour où ça décolle ou que tu vends sérieusement,
   le *même* manifest part sur un VPS k3s ou un managed k8s — ArgoCD pointe
   vers le nouveau cluster, terminé. C'est l'avantage décisif de ton GitOps.

> **Règle d'or : aucun paiement, aucun compte, aucune donnée personnelle ne
> transite ni n'est stocké sur le homelab.** Le homelab sert du contenu et un
> simulateur ; tout ce qui touche à l'argent vit chez des tiers spécialisés
> (section suivante). Ainsi une compromission du homelab ne coûte que de la
> disponibilité, jamais des données clients.

À terme (déjà évoqué) : compiler le DSP simulateur en **WASM** rendrait le
site 100 % statique — plus d'origin du tout, charge infinie, coût nul.

---

## 3. Paiements : recommandations argumentées

Critères : simplicité de maintenance (tu es seul), sécurité (ne jamais
manipuler de données de carte), conformité (TVA UE, MiCA pour la crypto), et
ton objectif de recevoir en crypto.

### 3.1 Carte bancaire — la voie principale

| Option | Commission | TVA UE gérée | Effort | Verdict |
|---|---|---|---|---|
| **Lemon Squeezy / Paddle** (merchant of record) | ~5 % + 0,50 € | ✅ ils sont le vendeur, ils déclarent | quasi nul | **Recommandé pour démarrer** |
| **Stripe** (Checkout + Payment Links) | ~1,5–2,5 % + 0,25 € | ❌ à toi (OSS/TVA par pays) | moyen | Recommandé quand le volume justifie la paperasse |
| PayPal | ~3 % | ❌ | faible | seulement en complément (certains clients l'exigent) |

**Recommandation : démarre avec Lemon Squeezy** (ou Paddle). Le statut
*merchant of record* signifie qu'ils encaissent, gèrent la TVA de chaque pays
européen, les factures et les remboursements — pour un indé, c'est des
dizaines d'heures d'administratif évitées et zéro risque fiscal. La
commission supérieure est le prix de ta tranquillité. Migration vers Stripe
plus tard si le volume le justifie (>~1 000 €/mois, le delta de commission
paie l'expert-comptable).

**Livraison de la clé Pro** : webhook Lemon Squeezy/Stripe → un **Cloudflare
Worker** (gratuit, hors homelab) qui génère la clé (le checksum de
`tools/genkey.mjs` est 10 lignes de JS, réutilisable tel quel) et l'envoie par
email (Resend/Postmark). Aucune base de données nécessaire au début : la clé
est auto-validante.

### 3.2 Cryptomonnaies — alignées avec l'ADN du projet

| Option | Commission | Custody | KYC | Verdict |
|---|---|---|---|---|
| **BTCPay Server** (self-hosted) | 0 % | **ton wallet directement** | aucun | **Recommandé** |
| Coinbase Commerce / NOWPayments | ~1 % | le leur puis retrait | oui | si tu refuses d'héberger |

**Recommandation : BTCPay Server sur un petit VPS** (pas sur le homelab : un
service de paiement doit avoir une disponibilité et une isolation que la box
familiale ne garantit pas). BTCPay est open-source, sans intermédiaire, sans
commission, accepte **BTC + Lightning** (et des altcoins via plugins), et les
fonds arrivent **directement sur ton wallet** — ton exigence n°4 est
satisfaite nativement pour la partie crypto. Il génère des boutons/factures
intégrables dans la page d'achat et des webhooks pour livrer la clé comme en
3.1.

### 3.3 Dons ponctuels et récurrents

- **GitHub Sponsors** : 0 % de commission, public développeur idéal pour un
  projet open-source — **à activer en premier**.
- **Ko-fi** (ponctuel + récurrent, 0 % sur les dons simples) ou **Liberapay**
  (open-source, récurrent) en complément grand public.
- Dons crypto : une page BTCPay "pay what you want" — déjà couvert par 3.2.

### 3.4 Recevoir les paiements CB sur un wallet crypto

Point délicat, à traiter avec lucidité :

- **Aucun processeur CB sérieux ne règle directement en crypto** vers un
  wallet auto-custodial (contraintes bancaires/AML). Les services qui le
  promettent ajoutent du risque (gel de fonds, KYC répété, commissions
  cumulées) pour un bénéfice nul.
- **La voie propre** : encaisse en fiat (Lemon Squeezy/Stripe → compte
  bancaire), puis **achat récurrent automatisé (DCA)** sur un exchange
  réglementé MiCA en Europe (Kraken, Bitstamp… ont des achats programmés et
  des API), suivi d'un **retrait automatique vers ton wallet**. Résultat
  identique (tes revenus finissent en crypto sur ton wallet), conformité
  simple, frais maîtrisés (~0,2–1 %), et tu gardes une trace comptable nette.
- Les paiements **crypto natifs** (BTCPay), eux, arrivent déjà directement
  sur ton wallet sans conversion.

### 3.5 Cadre légal (France) — à valider avec un comptable

- Statut **micro-entrepreneur** : suffisant pour démarrer la vente de
  licences ; facturation obligatoire, seuils de franchise de TVA à surveiller
  (d'où l'intérêt du merchant of record qui neutralise le sujet pour l'UE).
- Les revenus crypto issus de **ventes** sont du chiffre d'affaires classique
  (valorisé au jour de l'encaissement) ; la fiscalité des plus-values ne
  concerne que la revente ultérieure.
- Mentions légales + CGV + politique de confidentialité sur le site (le
  produit ne collecte rien aujourd'hui : c'est un argument, affiche-le).

---

## 4. Ordre de mise en œuvre conseillé

1. **Cloudflare Pages** pour le site statique + domaine (≈ 10 €/an, seul coût
   obligatoire). Job CI : build web → upload Pages.
2. **Cloudflare Tunnel** vers le pod simulateur du homelab (namespace isolé,
   NetworkPolicy). Le site devient vivant (spectre en direct) sans un seul
   port ouvert.
3. **GitHub Sponsors + Ko-fi** (une heure de travail, premiers dons
   possibles).
4. **Lemon Squeezy** : produit "RF Academy Pro" + webhook → Worker →
   génération/envoi de clé. Première vente CB.
5. **BTCPay Server** sur un VPS 5 €/mois quand la demande crypto se présente.
6. **DCA automatisé** exchange → wallet si tu veux convertir le fiat.
7. Plus tard : WASM du simulateur (origin supprimé), comptes utilisateurs
   (sync progression) — seulement quand le besoin est prouvé.
