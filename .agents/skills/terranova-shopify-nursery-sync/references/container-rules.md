# Container rules — mapping format de pot Shopify → Nursery::Container

Les variantes Shopify d'Arbuste Fruitier portent toutes un titre de format de pot, ex `"Pot de 2L"`, `"Pot de 5L"`, `"Pot de 7L"`. On les mappe vers des `Nursery::Container` côté Terranova.

## Modèle Terranova

```ruby
Nursery::Container # table: nursery_containers
  - name           # string, ex "Pot de 2L"
  - short_name     # string, ex "2L"
  - volume_liters  # float, ex 2.0
  - description    # string
  - sort_order     # integer
```

Le `short_name` est ce qui s'affiche dans le catalogue (`containerName` du sérialiseur).

## Parsing du titre de variante Shopify

Une pépinière fruitière comme Arbuste Fruitier propose plusieurs formats au-delà du simple "Pot de XL". Le parser doit couvrir :

| Forme observée | Container généré |
|---|---|
| `Pot de 2L`, `Pot de 5L`, etc. | `{name: "Pot de 2L", short_name: "2L", volume_liters: 2.0}` |
| `Pot profond de 5L` | `{name: "Pot profond de 5L", short_name: "5L prof.", volume_liters: 5.0}` |
| `Godet` | `{name: "Godet", short_name: "Godet", volume_liters: 0.3}` (convention) |
| `Racine nue` (seul ou suivi de `/ Plant de XYZ`) | `{name: "Racine nue", short_name: "RN", volume_liters: 0.0}` |
| `Basse-tige / Racine nue` | `{name: "Basse-tige / Racine nue", short_name: "BT-RN", volume_liters: 0.0}` |
| `Demi-tige / Racine nue` | `{name: "Demi-tige / Racine nue", short_name: "DT-RN", volume_liters: 0.0}` |
| `Haute-tige / Racine nue` | `{name: "Haute-tige / Racine nue", short_name: "HT-RN", volume_liters: 0.0}` |
| Autres (`Default Title`, `Scion / Racine nue`, etc.) | `None` (batch créé sans container) |

```python
import re

POT_RE = re.compile(r"^Pot(?P<deep>\s+profond)?\s+de\s+(?P<vol>\d+(?:[.,]\d+)?)\s*L$", re.IGNORECASE)
GODET_RE = re.compile(r"^Godet$", re.IGNORECASE)
RACINE_NUE_RE = re.compile(r"^Racine\s+nue(?:\s*/\s*Plant\s+de.*)?$", re.IGNORECASE)
TIGE_RACINE_RE = re.compile(r"^(?P<tige>Basse|Demi|Haute)-tige\s*/\s*Racine\s+nue$", re.IGNORECASE)

def parse_container(variant_title: str) -> dict | None:
    t = variant_title.strip()
    m = POT_RE.match(t)
    if m:
        deep = bool(m.group("deep"))
        volume = float(m.group("vol").replace(",", "."))
        prefix = "Pot profond" if deep else "Pot"
        return {
            "name": f"{prefix} de {volume:g}L",
            "short_name": f"{volume:g}L{' prof.' if deep else ''}",
            "volume_liters": volume,
        }
    if GODET_RE.match(t):
        return {"name": "Godet", "short_name": "Godet", "volume_liters": 0.3}
    if RACINE_NUE_RE.match(t):
        return {"name": "Racine nue", "short_name": "RN", "volume_liters": 0.0}
    m = TIGE_RACINE_RE.match(t)
    if m:
        tige = m.group("tige").capitalize()
        return {
            "name": f"{tige}-tige / Racine nue",
            "short_name": f"{tige[0]}T-RN",
            "volume_liters": 0.0,
        }
    return None
```

## Stratégie : lookup puis auto-création

```bash
# 1. Récupérer tous les containers existants une seule fois en début de sync
CONTAINERS=$(curl -s "$API/api/v1/nursery" \
  -H "Authorization: Bearer $KNOWLEDGE_API_KEY" \
  | jq '.containers')

# 2. Pour chaque variante, lookup par name exact
get_or_create_container() {
  local title="$1"
  # Extract from CONTAINERS by name
  local cid
  cid=$(echo "$CONTAINERS" | jq -r --arg n "$title" '.[] | select(.name == $n) | .id')
  if [ -n "$cid" ]; then
    echo "$cid"
    return
  fi
  # Parse and create
  local parsed
  parsed=$(python3 -c "...parse_container('$title')...")
  if [ -z "$parsed" ]; then
    echo ""  # Indique container_id = null
    return
  fi
  cid=$(curl -s -X POST "$API/api/v1/nursery/containers" \
    -H "Authorization: Bearer $KNOWLEDGE_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$parsed" | jq -r '.id')
  # Refresh local cache
  CONTAINERS=$(echo "$CONTAINERS" | jq --argjson new "$(echo $parsed | jq --arg i "$cid" '. + {id: $i}')" '. + [$new]')
  echo "$cid"
}
```

## Cas du "Default Title" Shopify

Quand un produit Shopify n'a qu'une seule variante (pas de choix de format), Shopify nomme cette variante `"Default Title"`. Dans ce cas :
- Le titre ne match pas le pattern `Pot de XL`
- → `container_id = null` dans le stock_batch
- C'est valide côté Terranova (`container_id` est optionnel)
- Le catalogue affichera `containerName: null` (rendu UI : tiret `—`)

## Logging dans le rapport

Tracker les containers créés dans le rapport final :

```
### Conteneurs auto-créés
- "Pot de 7L" (id 14, volume 7.0L)
- "Pot de 0.5L" (id 15, volume 0.5L)
```

Si un titre de variante Shopify n'est PAS un format de pot connu et n'a pas pu être parsé, l'inclure dans une section "Containers ignorés" :

```
### Containers ignorés (non parsés, batch créé sans container)
- "Default Title" (produit "Cassis - Ribes nigrum")
- "Format spécial 12 plants" (produit "Pack haie nourricière")
```
