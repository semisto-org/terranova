# Stock batch mapping — Shopify variant → Nursery::StockBatch

Cette doc fige le contrat de mapping entre une variante Shopify et un `Nursery::StockBatch` Terranova.

## Mapping des champs

| Champ Terranova | Source Shopify | Notes |
|---|---|---|
| `nursery_id` | (bootstrap) | ID de la pépinière trouvée par nom |
| `species_id` | parse + lookup/create | Obligatoire (FK Plant::Species) |
| `variety_id` | parse + lookup/create | Optionnel, null si produit sans variété |
| `container_id` | `variant.title` parse + lookup/create | Optionnel, null si "Default Title" |
| `quantity` | (constante) | `1` — on ne connaît pas la vraie quantité Shopify |
| `available_quantity` | `variant.available` | `1` si true, `0` si false |
| `reserved_quantity` | (constante) | `0` |
| `status` | `variant.available` | `"available"` si true, `"sold_out"` si false |
| `growth_stage` | (constante) | `"established"` (plantes prêtes à la vente) |
| `price_euros` | `variant.price` | Float (Shopify donne des cents en string, ex `"15.00"`) |
| `accepts_semos` | (constante) | `false` |
| `price_semos` | (constante) | `null` |
| `origin` | `variant.id` | `"shopify-variant:<variant.id>"` — clé d'idempotence |
| `notes` | `product.handle` | URL canonique : `"https://<store>/products/<handle>"` |
| `availability_label` | (constante) | `null` (uniquement si status=in_production) |
| `expected_availability_on` | (constante) | `null` |
| `sowing_date` | (constante) | `null` |

## Justifications

### Pourquoi `quantity = 1` et pas `999` ?

- L'utilisateur a configuré la pépinière en `integration='manual'`. Le sérialiseur `build_catalog` masque alors `availableQuantity` (renvoie `null`). Donc la valeur exacte n'est jamais affichée.
- On utilise `1` comme valeur sentinelle pour signifier "1 unité disponible (au moins)". Pas mensonger : on ne prétend pas avoir un stock précis.
- Si Shopify dit `available: false`, on met `available_quantity = 0` et `status = "sold_out"` (ce qui retire la variante du catalogue par défaut, conforme au comportement attendu).

### Pourquoi `growth_stage = "established"` ?

- Les produits Arbuste Fruitier sont vendus prêts à planter (en pot 2L+).
- `"established"` est plus précis que `"young"` ou `"mature"` pour ce contexte.
- Si une pépinière vendait des semis ou jeunes plants, ce serait à reconfigurer.

### Pourquoi `origin` et pas un nouveau champ DB ?

- Le champ `origin` existe déjà sur `nursery_stock_batches` (text, défaut `""`)
- Pas de migration nécessaire
- Format namespacé `shopify-variant:<id>` permet de distinguer d'autres origines (ex futur `notion-import:`, `manual:`)
- Recherche par préfixe : `WHERE origin LIKE 'shopify-variant:%'`

## Construction du payload POST

```json
{
  "nursery_id": 12,
  "species_id": 487,
  "variety_id": 1024,
  "container_id": 8,
  "quantity": 1,
  "available_quantity": 1,
  "reserved_quantity": 0,
  "status": "available",
  "growth_stage": "established",
  "price_euros": 22.0,
  "accepts_semos": false,
  "origin": "shopify-variant:46680105943363",
  "notes": "https://arbustefruitier.com/products/pommier-reine-des-reinettes"
}
```

⚠️ **Attention aux nulls** : selon `~/.claude/skills/terranova-api/api-reference/nursery.md`, le contrôleur `create_stock_batch` accepte `null` pour `notes` et `availability_label` (coercés à `""`), mais **PAS** pour les payloads vides. Toujours envoyer `notes` explicitement (string ou `null`).

## Détection des changements (PATCH)

Comparer le payload calculé au batch existant (du snapshot). Détecter :

```python
def diff_batch(existing: dict, new_payload: dict) -> list[str]:
    """Returns list of fields that changed and need a PATCH."""
    changes = []
    if existing["status"] != new_payload["status"]:
        changes.append("status")
    if existing["availableQuantity"] != new_payload["available_quantity"]:
        changes.append("available_quantity")
    if abs(existing["priceEuros"] - new_payload["price_euros"]) > 0.001:
        changes.append("price_euros")
    if (existing.get("containerId") or None) != (str(new_payload["container_id"]) if new_payload["container_id"] else None):
        changes.append("container_id")
    return changes
```

⚠️ Comparer en chaîne pour les ID (l'API renvoie des strings, le payload envoie des ints).

### Quand utiliser PATCH `/status` vs PATCH général

| Changement | Endpoint |
|---|---|
| Uniquement `status` (et `availability_label` / `expected_availability_on`) | `PATCH /api/v1/nursery/stock-batches/:id/status` (plus léger) |
| Tout autre champ (`price_euros`, `container_id`, etc.) | `PATCH /api/v1/nursery/stock-batches/:id` (full update) |

### Cas particulier : changement available_quantity = 0 ↔ 1

Toujours combiné à un changement de `status`. Donc passer par PATCH général en envoyant les deux ensemble :

```json
{
  "status": "sold_out",
  "available_quantity": 0
}
```

ou pour la remise en stock :
```json
{
  "status": "available",
  "available_quantity": 1
}
```

## Archivage des batches orphelins

Pour un batch Terranova avec `origin LIKE 'shopify-variant:%'` mais variant_id absent du fetch Shopify actuel (= produit retiré du site) :

```bash
PATCH /api/v1/nursery/stock-batches/<id>/status
{"status": "archived"}
```

Conserve l'historique sans polluer le catalogue.

⚠️ **Ne PAS supprimer** (DELETE) les batches archivés — l'historique des `nursery_orders` y fait référence (FK `restrict_with_error`). Le soft-delete est déclenché par DELETE mais bloqué par FK si des order_lines existent.
