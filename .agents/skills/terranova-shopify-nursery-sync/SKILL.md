---
name: terranova-shopify-nursery-sync
description: Synchronise le catalogue d'une pépinière externe basée sur Shopify (ex. Arbuste Fruitier) vers Terranova. Récupère la liste des produits via l'endpoint public `/products.json`, matche chaque variante (produit + format de pot) à une espèce/variété du Plant Database (auto-création si absente), et upserte les `Nursery::StockBatch` correspondants. Détecte aussi les ruptures (status sold_out) et les remises en stock. Idempotent via le champ `origin`. Utiliser quand l'utilisateur demande de "synchroniser le catalogue", "scraper la pépinière", "mettre à jour les stocks d'Arbuste Fruitier", ou similaire. Conçu pour être lancé manuellement ou via une routine `/schedule` hebdomadaire.
---

# Terranova — Shopify Nursery Sync

Skill de synchronisation idempotent entre une pépinière Shopify externe et le catalogue Nursery de Terranova. S'appuie sur le skill **`terranova-api`** pour les appels HTTP authentifiés et chaîne avec **`terranova-update-species`** pour enrichir botaniquement les espèces qu'il aurait dû créer.

## Quand utiliser ce skill

L'utilisateur demande l'une de ces actions :
- "Synchronise le catalogue d'Arbuste Fruitier"
- "Scrape les produits d'arbustefruitier.com"
- "Mets à jour le stock de la pépinière Arbuste Fruitier"
- "Refresh le catalogue Shopify"
- Routine planifiée hebdomadaire

Toute pépinière partenaire qui utilise Shopify (`/products.json` accessible publiquement) est compatible.

## Prérequis

1. **`KNOWLEDGE_API_KEY`** exportée dans le shell (clé production, auth en tant que premier admin)
2. Skill **`terranova-api`** chargé pour les conventions d'appels (lire `~/.claude/skills/terranova-api/SKILL.md`)
3. Une `Nursery::Nursery` correspondant au fournisseur **existe en base** avec le bon nom (sinon le skill s'arrête avec une erreur claire). Recommandé : `integration='manual'`.
4. Le fournisseur Shopify doit exposer `https://<domaine>/products.json` sans auth (cas général).

## Invocation

Ce skill n'est PAS un slash command — il s'active par détection sémantique. L'utilisateur formule sa demande en langage naturel, et Claude charge ce skill via le tool `Skill`.

### Phrases d'activation typiques

- "Synchronise le catalogue d'Arbuste Fruitier en dry-run"
- "Lance la sync Shopify d'Arbuste Fruitier"
- "Scrape arbustefruitier.com et mets à jour le catalogue"
- "Refresh le stock de la pépinière Arbuste Fruitier"

### Paramètres à extraire de la demande utilisateur

| Paramètre | Source | Défaut si absent |
|---|---|---|
| `shopify_url` | URL mentionnée dans la demande, ou défaut Arbuste Fruitier | `https://arbustefruitier.com` |
| `nursery_name` | Nom de pépinière mentionné dans la demande | `Arbuste Fruitier` |
| `dry_run` | Mots-clés "dry-run", "à blanc", "simulation", "sans écrire" | `false` (run réel) |
| `limit` | Mots-clés "test sur N produits", "échantillon de N" | `null` (tous) |

Si la demande est ambiguë (URL inconnue, plusieurs pépinières en base), demander confirmation à l'utilisateur via `AskUserQuestion`.

### Comportements

| Demande utilisateur | Comportement |
|---|---|
| "Sync Arbuste Fruitier en dry-run" | `dry_run=true`, run complet, aucune écriture |
| "Sync Arbuste Fruitier sur 5 produits" | `dry_run=false`, `limit=5`, écritures réelles sur 5 produits |
| "Sync Arbuste Fruitier" | `dry_run=false`, run complet réel — **demander confirmation** si plus de 50 écritures attendues |
| "Sync la pépinière X" (X inconnue) | Erreur claire, lister les pépinières disponibles via `GET /api/v1/nursery` |

## Architecture

```
[Bootstrap nursery]
       ↓
[Fetch Shopify products] ─── [Snapshot Terranova batches]
       ↓                              ↓
[Pour chaque variante : parse + match + upsert]
       ↓
[Détecter batches orphelins → archiver]
       ↓
[Rapport final + commande terranova-update-species pour brouillons]
```

## Workflow détaillé

### Étape 1 — Bootstrap nursery

```bash
NURSERY_ID=$(curl -s "https://terranova.semisto.org/api/v1/nursery" \
  -H "Authorization: Bearer $KNOWLEDGE_API_KEY" \
  | jq -r --arg name "Arbuste Fruitier" \
    '.nurseries[] | select(.name == $name) | .id')
```

- Si vide → erreur explicite : "Pépinière 'X' introuvable. Crée-la d'abord via l'UI Nursery → Pépinières."

### Étape 2 — Fetch Shopify

```bash
curl -s "https://arbustefruitier.com/products.json?limit=250&page=1" > /tmp/shopify-products.json
```

- 1 seule page suffit pour ≤ 250 produits (cas Arbuste Fruitier : 141)
- Si la réponse contient `products` non vide ET de longueur 250, fetcher `page=2` aussi (paginer jusqu'à réponse vide)

### Étape 3 — Snapshot Terranova

```bash
curl -s "https://terranova.semisto.org/api/v1/nursery?nursery_id=$NURSERY_ID" \
  -H "Authorization: Bearer $KNOWLEDGE_API_KEY" \
  > /tmp/terranova-snapshot.json
```

- Construire un index `{ shopify_variant_id → terranova_batch }` en parsant `stockBatches[]` filtré sur `origin LIKE 'shopify-variant:%'`

### Étape 4 — Pour chaque variante Shopify (boucle)

Pour chaque `product` dans `/tmp/shopify-products.json`, et chaque `variant` dans `product.variants` :

1. **Parser le titre du produit** → `{ common_name, variety_name?, latin_name }` (cf `references/title-parsing.md`)
2. **Lookup ou auto-créer le container** à partir de `variant.title` (cf `references/container-rules.md`)
3. **Lookup ou auto-créer Plant::Species/Variety** (cf `references/matching-rules.md`)
   - Si nouvelle entrée créée → ajouter `{species_id, latin_name}` à `newly_created_for_enrichment[]`
4. **Construire le payload du stock_batch** (cf `references/stock-batch-mapping.md`)
5. **Diff & action** :
   - Variante Shopify NOUVELLE (pas dans le snapshot par origin) → POST `stock-batches` + ajouter à `created[]`
   - Variante Shopify EXISTANTE :
     - Si `status` divergent (available ↔ sold_out) → PATCH status + ajouter à `status_changed[]`
     - Si `price_euros` divergent → PATCH stock-batch + ajouter à `price_changed[]`
     - Sinon → ajouter à `unchanged[]`

### Étape 5 — Batches orphelins (produit retiré du site Shopify)

Tout batch dans le snapshot Terranova avec `origin LIKE 'shopify-variant:%'` mais qui n'a PAS été touché à l'étape 4 (i.e. variant_id absent du fetch Shopify) → PATCH `status='archived'` + ajouter à `archived[]`.

### Étape 6 — Rapport final

Format markdown :

```markdown
## Sync Arbuste Fruitier — <DATE>

**Pépinière** : Arbuste Fruitier (id <NURSERY_ID>)
**Source** : https://arbustefruitier.com/products.json
**Mode** : <real | dry-run> [--limit N]

### Statistiques

- **Produits Shopify lus** : 141
- **Variantes Shopify totales** : <N>
- **Stock batches créés** : <X>
- **Statuts changés** : <Y> (entrants: A, sortants: B)
- **Prix changés** : <Z>
- **Inchangés** : <W>
- **Archivés (produit retiré du site)** : <K>
- **Conteneurs auto-créés** : <C>
- **Brouillons Plant DB créés** : <D>
- **Erreurs de parsing** : <E>

### Conteneurs auto-créés

- "Pot de 2L" (id 12, volume 2.0L)
- ...

### Brouillons Plant DB créés (à enrichir)

| ID | Type | Nom latin | Source Shopify |
|---|---|---|---|
| 1234 | species | Hippophae rhamnoides | https://arbustefruitier.com/products/argousier-... |
| 1235 | variety | Hippophae rhamnoides 'Otto' | idem |
| ... |

**Pour enrichir** (à demander dans une nouvelle session) :
> "Traite les espèces ids 1234, 1236, 1238 (auto-créées depuis Arbuste Fruitier)"
> 
> (Claude chargera le skill `terranova-update-species`.)

### Variantes archivées (produit retiré du site)

- batch 567 — "Cerisier 'Bigarreau' - Prunus avium" / Pot de 5L

### Erreurs de parsing (titre non décodable)

- "Promo packs prêts à planter" (handle `pack-promo`) — pas de nom latin détecté → ignoré
```

## Idempotence

- **Clé de correspondance** : champ `origin` du stock_batch, format `shopify-variant:<variant_id>`
- **Idempotent par construction** : chaque variante Shopify a un `variant.id` stable
- **Re-run sans changement réel** → "0 créé, 0 mis à jour"
- **Variétés** : POST `/api/v1/plants/varieties` est idempotent sur `(species_id, latin_name)` — safe à appeler à chaque run

## Dry-run vs run réel

- **`--dry-run`** : effectue les GET (snapshot, lookup species), simule POST/PATCH (compte ce qu'il ferait), AFFICHE le rapport complet, ne touche RIEN en production.
  - Implémentation : entourer chaque écriture par `if [ "$DRY_RUN" = "1" ]; then echo "[DRY] would POST ..."; else curl -X POST ...; fi`
- **Run réel** (sans `--dry-run`) : exécute toutes les écritures.

**Toujours** lancer en `--dry-run` la première fois sur un nouveau fournisseur Shopify, puis valider le rapport avant le vrai run.

## Limitations

- **Quantités exactes non récupérables** pour arbustefruitier.com. Vérifié 2026-05-06 : `/cart/add.js` accepte n'importe quelle quantité (jusqu'à 99999) sur n'importe quel variant, même `sold_out` — donc le probing par panier ne fonctionne PAS (ni pour les oversell ni pour le seuil bas). `inventory_quantity` est `null` partout. Storefront API 401 sans token. → **seul signal utilisable** : le boolean `variant.available` du `/products.json` public, mappé en `quantity=1, available_quantity=1` (en stock) ou `available_quantity=0, status='sold_out'` (rupture). Convention `quantity=1` = sentinel interne, invisible côté catalogue grâce à `integration='manual'`.
- **Pas d'import d'images** en v1. Les fiches Plant DB ont leurs propres photos via `terranova-update-species`.
- **`body_html` Shopify ignoré** : la source de vérité botanique est le Plant DB Terranova, pas le site fournisseur.
- **Brouillons enrichissement séparé** : si la sync découvre 100 nouvelles espèces, l'enrichissement (long, coûteux) est volontairement laissé en phase 2 manuelle/planifiée.
- **Titres "genus only"** (`Agastache - Agastache`, `Hémérocalle - Hemerocallis`) sont actuellement skippés — le parser exige une épithète d'espèce. Si nécessaire à l'avenir, créer une convention `<Genus> sp.` côté Plant DB.

## Pièges à éviter (leçons du run initial)

1. **User-Agent obligatoire** : l'API rejette `Python-urllib/X.Y` avec **HTTP 403** silencieux. Toujours envoyer un `User-Agent` non-default (ex `terranova-sync/1.0`). Ne PAS swallow d'exception sur les lookups variétés — ça masque massivement les matches.
2. **`plant_type` est requis** côté `Plant::Species.create` (`validates :plant_type, presence: true`). 422 sans body explicite si absent. Heuristique simple sur le nom commun FR suffit pour un brouillon (cf `references/matching-rules.md`).
3. **Variety `latinName` = nom court seul** (ex `"Brown Turkey"`), PAS `"Ficus carica 'Brown Turkey'"`. Erreur de matching sinon → tout est traité comme "à créer".
4. **Doublons existants** dans Plant DB (4× même variété pour certaines espèces). Lookup → prendre le plus petit ID.
5. **Containers au-delà de "Pot de XL"** : Godet, Racine nue, X-tige/Racine nue représentent ~50% des variants pour une pépinière fruitière. Un parser uniquement "Pot de XL" rate la majorité des batches.

## Routine hebdomadaire

Une fois le skill validé en manuel, créer une routine via le skill `schedule` (l'utilisateur dira simplement à Claude : *"Programme une sync hebdo d'Arbuste Fruitier le lundi à 8h"*).

Le prompt de la routine doit être en langage naturel pour ré-activer ce skill, par exemple :

> "Synchronise le catalogue d'Arbuste Fruitier (https://arbustefruitier.com)."

Cron suggéré : `0 8 * * 1` (lundi 8h, à adapter).

## Références

- **`references/title-parsing.md`** — regex et règles d'extraction
- **`references/matching-rules.md`** — stratégie de lookup et auto-création Plant::Species/Variety
- **`references/container-rules.md`** — mapping "Pot de XL" → Nursery::Container
- **`references/stock-batch-mapping.md`** — mapping complet Shopify → stock_batch payload

## Scripts de référence

Implémentations Python qui ont fonctionné en production lors du run initial du 2026-05-06 :

- **`scripts/sync_dryrun.py`** — analyse complète sans écriture, génère le rapport de planification
- **`scripts/sync_real.py`** — exécution complète : containers → species → varieties → batches

Ces scripts servent de point de départ pour les futurs runs (à adapter si les API/schemas Terranova évoluent).
