# Title parsing — extraction du nom commun, variété et nom latin

Les titres de produits Shopify d'Arbuste Fruitier suivent un pattern régulier. Cette doc décrit comment l'extraire de manière robuste.

## Pattern observé

```
<Common name FR> [<modificateur>] [' Variety '] - <Genus species>
```

Trois exemples typiques :

| Titre Shopify | Common | Variety | Latin |
|---|---|---|---|
| `Kiwaï mâle 'Weiki' - Actinidia arguta` | Kiwaï mâle | Weiki | Actinidia arguta |
| `Figuier 'Brown Turkey' - Ficus carica` | Figuier | Brown Turkey | Ficus carica |
| `Argousier mâle 'Otto' - Hippophae rhamnoides` | Argousier mâle | Otto | Hippophae rhamnoides |
| `Cassis - Ribes nigrum` | Cassis | _(none)_ | Ribes nigrum |

## Regex

```
^(?<common>.+?)(?:\s+['‘’]\s*(?<variety>[^'‘’]+?)\s*['‘’])?\s*-\s*(?<latin>[A-Z][a-z]+(?:\s+(?:[a-z\-]+|[xX×]|[A-Z][a-z]+)){1,4})\s*$
```

Notes :
- Les guillemets peuvent être ASCII (`'`) ou typographiques (`‘`/`’`). La regex couvre les trois.
- `latin` exige une capitale initiale (genus) + 1 à 4 mots additionnels de l'une des formes :
  - `[a-z\-]+` — épithète d'espèce en minuscules, tirets autorisés (ex `vitis-idaea`)
  - `[xX×]` — marqueur d'hybride (ASCII `x`/`X` ou typographique `×`)
  - `[A-Z][a-z]+` — second genus dans une hybridation intergénérique (ex `Sorbus aucuparia x Sorbaronia`)
- `common` est greedy minimal (`.+?`) pour ne pas absorber la variété.

**Normalisation après match** : forcer le 1er mot en `Capitalize`, les autres en lowercase (sauf détectés comme genus). Ça corrige les typos Shopify type `Asimina Triloba` → `Asimina triloba`.

```python
def normalize_latin(latin: str) -> str:
    parts = latin.split()
    out = [parts[0].capitalize()]
    for p in parts[1:]:
        if p in ("x", "X", "×"):
            out.append("x")
        elif len(p) > 1 and p[0].isupper() and p[1:].islower():
            out.append(p)  # likely intergeneric hybrid parent
        else:
            out.append(p.lower())
    return " ".join(out)
```

### Implémentation bash (jq + sed)

```bash
parse_title() {
  local title="$1"
  # Normalize fancy quotes to ASCII
  title=$(echo "$title" | sed -e "s/[‘’]/'/g")
  # Extract latin (right side of last " - ")
  local latin
  latin=$(echo "$title" | sed -nE "s/.*-\s+([A-Z][a-z]+(\s+[a-z×]+)?(\s+[a-z]+)?)\s*$/\1/p")
  # Extract variety (between quotes)
  local variety
  variety=$(echo "$title" | sed -nE "s/.*'([^']+)'.*/\1/p")
  # Common = everything before the variety quote, or before the " - " if no variety
  local common
  if [ -n "$variety" ]; then
    common=$(echo "$title" | sed -nE "s/^(.+?)\s+'.*/\1/p")
  else
    common=$(echo "$title" | sed -nE "s/^(.+?)\s+-\s+[A-Z].*/\1/p")
  fi
  echo "{\"common\": \"$common\", \"variety\": \"$variety\", \"latin\": \"$latin\"}"
}
```

### Implémentation Python (recommandée pour robustesse)

```python
import re

PATTERN = re.compile(
    r"^(?P<common>.+?)"
    r"(?:\s+['‘’]\s*(?P<variety>[^'‘’]+?)\s*['‘’])?"
    r"\s*-\s*(?P<latin>[A-Z][a-z]+(?:\s+[a-z×]+(?:\s+[a-z]+)?)?)$"
)

def parse_title(title: str) -> dict | None:
    m = PATTERN.match(title.strip())
    if not m:
        return None
    return {
        "common": m.group("common").strip(),
        "variety": (m.group("variety") or "").strip() or None,
        "latin": m.group("latin").strip(),
    }
```

## Edge cases connus

| Titre | Action |
|---|---|
| `Cassis - Ribes nigrum` | Pas de variété → `variety=None` |
| `Citrus × limon` | Hybride (×) → matché par `[a-z×]+` |
| `Pommier 'Belle de Boskoop' - Malus domestica` | Variété multi-mots → OK (regex tolère espaces dans variety) |
| `Pack permaculture - 5 essences mellifères` | Pas de nom latin valide → push dans `parsing_errors[]` |
| `Promo - Lot 3 framboisiers` | Idem → ignoré |

## Stratégie en cas d'échec

Si `parse_title()` retourne `None` :
1. **Logger** dans `parsing_errors[]` avec le titre + handle
2. **Ne PAS créer** de stock_batch
3. Inclure dans le rapport final pour décision manuelle (souvent : produits "pack/lot/promo" qu'on ne veut pas synchroniser)

## Construction du nom latin de variété

Une fois variety + latin extraits, le nom latin complet de la variété est :
```
<Genus species> '<Variety>'
```

Exemple : `Hippophae rhamnoides 'Otto'`

C'est ce qui sert de `latin_name` lors d'un POST `/api/v1/plants/varieties`.
