# Matching Plant::Species / Variety + auto-création de brouillons

Cette doc décrit comment relier une variante Shopify parsée à une espèce/variété du Plant Database, et comment créer un brouillon si aucune correspondance n'existe.

## Stratégie de lookup (en cascade)

Pour une variante parsée `{ common, variety, latin }` (latin = nom binomial de l'espèce, ex `"Ficus carica"`) :

### Cas A — Variety présente

1. **Exact match variety** : `GET /api/v1/plants/search?query=<urlencode(latin) + ' ' + variety>`
   - Filtrer la réponse `items[]` sur `type == "variety"` ET `latinName == "<latin> '<variety>'"` (insensible à la casse)
   - Si match unique → utiliser cette variety_id
2. **Match par species + variety séparés** : `GET /api/v1/plants/search?query=<latin>` puis filtrer `type == "species"` exact match sur `latinName`. Pour la species trouvée, `GET /api/v1/plants/species/<id>` puis chercher dans `varieties[]` un `latinName` qui contient le nom de variété (insensible à la casse).
3. **Aucun match** → auto-création (cf section "Auto-création")

### Cas B — Variety absente

1. **Exact match species** : `GET /api/v1/plants/search?query=<urlencode(latin)>`
   - Filtrer sur `type == "species"` ET `latinName.toLowerCase() == latin.toLowerCase()`
   - Si match unique → utiliser cette species_id
2. **Aucun match** → auto-création de l'espèce

## Auto-création de brouillon

### 1. Lookup ou création du Plant::Genus

Le genus = premier mot du nom latin (ex `"Hippophae"` pour `"Hippophae rhamnoides"`).

```bash
GENUS=$(echo "$LATIN" | awk '{print $1}')

# Search existing
GENUS_ID=$(curl -s "$API/api/v1/plants/genera" \
  -H "Authorization: Bearer $KNOWLEDGE_API_KEY" \
  | jq -r --arg g "$GENUS" '.items[] | select(.latinName == $g) | .id' | head -1)

# Create if missing
if [ -z "$GENUS_ID" ]; then
  GENUS_ID=$(curl -s -X POST "$API/api/v1/plants/genera" \
    -H "Authorization: Bearer $KNOWLEDGE_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"latin_name\": \"$GENUS\"}" \
    | jq -r '.id')
fi
```

### 2. Création du Plant::Species

⚠️ **`plant_type` est obligatoire** (`validates :plant_type, presence: true` sur le modèle). Valeurs valides récupérées via `GET /api/v1/plants/filter-options` (champ `types`) :
- `tree` (Arbre)
- `shrub` (Arbuste) ← défaut sûr pour pépinière fruitière
- `small-shrub` (Petit arbuste)
- `climber` (Grimpante)
- `herbaceous` (Herbacée)
- `ground-cover` (Couvre-sol)

Heuristique simple à partir du nom commun FR (suffisamment correcte pour un brouillon, sera affinée par `terranova-update-species`) :

```python
def heuristic_plant_type(common_fr: str) -> str:
    c = common_fr.lower()
    if any(w in c for w in ["kiwa", "vigne", "liane", "chèvrefeuille", "akebia"]):
        return "climber"
    if "fraise" in c and "arbuste" not in c:
        return "herbaceous"
    if any(w in c for w in ["pommier", "cerisier", "poirier", "prunier", "mûrier", "noyer",
                             "tilleul", "châtaignier", "asiminier", "kaki", "figuier",
                             "amélanchier", "aubépine", "sorbier", "pluot", "noisetier",
                             "pêcher", "abricotier", "néflier", "cognassier"]):
        return "tree"
    return "shrub"
```

```bash
SPECIES_ID=$(curl -s -X POST "$API/api/v1/plants/species" \
  -H "Authorization: Bearer $KNOWLEDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"genus_id\": $GENUS_ID,
    \"latin_name\": \"$LATIN\",
    \"plant_type\": \"$PLANT_TYPE\",
    \"common_names\": [{\"language\": \"fr\", \"name\": \"$COMMON\"}],
    \"contributor_id\": 1
  }" | jq -r '.id // .species.id')
```

⚠️ La réponse de POST species est `{id, ...}` directement (pas wrapping `{species: ...}`). Le `// .species.id` est défensif.

→ Ajouter `{type: "species", id: SPECIES_ID, latin: $LATIN}` à `newly_created_for_enrichment[]`.

### 3. Création du Plant::Variety (si applicable)

⚠️ **Format réel de `latinName` côté Plant DB** : juste le nom court de la variété (`"Brown Turkey"`), **PAS** le format binôme `"Ficus carica 'Brown Turkey'"`. C'est la convention en base et c'est ce qu'il faut envoyer en POST.

⚠️ **Doublons existants en base** : il peut y avoir 2-4 instances du même nom de variété pour une espèce donnée (ex 4× `"Brown Turkey"` pour Ficus carica). Lors d'un lookup, prendre le plus petit `id` (le plus ancien original).

```bash
if [ -n "$VARIETY" ]; then
  VARIETY_ID=$(curl -s -X POST "$API/api/v1/plants/varieties" \
    -H "Authorization: Bearer $KNOWLEDGE_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"species_id\": $SPECIES_ID,
      \"latin_name\": \"$VARIETY\",
      \"common_names\": [{\"language\": \"fr\", \"name\": \"$COMMON '$VARIETY'\"}],
      \"contributor_id\": 1
    }" | jq -r '.id')
fi
```

L'endpoint POST varieties est **idempotent sur (species_id, latin_name)** — retourne 200 avec l'objet existant si la paire existe déjà, 201 si création réelle. Safe à rappeler à chaque sync.

→ Ajouter `{type: "variety", id: VARIETY_ID, latin: VARIETY_LATIN}` à `newly_created_for_enrichment[]` **seulement si la réponse est 201** (création réelle, pas reprise d'existante).

## Cache lookup intra-session

Sur une sync de 141 produits, beaucoup partagent la même espèce (plusieurs variétés de pommier `Malus domestica`, plusieurs cassis `Ribes nigrum`, etc.). Pour éviter des appels API répétés :

```python
species_cache = {}  # latin → species_id
genus_cache = {}    # latin → genus_id

def find_or_create_species(latin, common):
    if latin in species_cache:
        return species_cache[latin]
    # ... lookup or create ...
    species_cache[latin] = species_id
    return species_id
```

## Exemple complet de mapping

Variante Shopify : `Pommier 'Reine des Reinettes' - Malus domestica` / Pot de 5L

1. Parse → `{common: "Pommier", variety: "Reine des Reinettes", latin: "Malus domestica"}`
2. Search variety `Malus domestica 'Reine des Reinettes'` → trouvé id 487 → utiliser
3. Pas d'auto-création
4. Container "Pot de 5L" → lookup → id 8
5. POST stock-batch `{nursery_id, species_id: <species de 487>, variety_id: 487, container_id: 8, quantity: 1, available_quantity: 1, status: "available", price_euros: 22.0, origin: "shopify-variant:46680105943363", notes: "https://arbustefruitier.com/products/pommier-reine-des-reinettes"}`

## Quand abandonner sans erreur

- Titre ne match pas le pattern → `parsing_errors[]`, pas de tentative de création
- Lookup retourne plusieurs candidats avec doute → consigner dans `ambiguous_matches[]`, ne PAS créer (laisser au rapport pour décision manuelle)
- Création échoue (422 sur validation Plant DB) → consigner dans `creation_errors[]`, continuer la sync
