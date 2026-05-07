# Workflow détaillé

13 étapes de la mise à jour d'une fiche du Plant Database.

## Setup

Toujours commencer par :
1. Vérifier que `KNOWLEDGE_API_KEY` est exportée : `[ -n "$KNOWLEDGE_API_KEY" ] || export KNOWLEDGE_API_KEY=...`
2. Pré-fetch enums : `curl -s https://terranova.semisto.org/api/v1/plants/filter-options -H "Authorization: Bearer $KNOWLEDGE_API_KEY"`

---

## Étape 1 — Parser l'input utilisateur

Identifier la cible et le mode :

```
Mode "single"   → 1 target (genre, espèce ou variété spécifique)
Mode "batch"    → liste de targets résolue par filtre
```

| Pattern | Mode | Résolution |
|---|---|---|
| "Mets à jour Camellia sinensis" | single | search → premier match `species` |
| "Mets à jour le genre Acer" | single | search → premier match `genus` |
| "Mets à jour la variété Belle de Boskoop" | single | search → premier match `variety` |
| "Mets à jour /plants/species/1036" | single | extraire ID, GET direct |
| "Toutes les espèces du genre Acer" | batch | GET genus → species[] |
| "Toutes les variétés de Malus pumila" | batch | GET species → varieties[] |
| "Toutes les espèces de type tree" | batch | GET /species?type=tree |
| "Fiches sans photo" | batch | itérer + filtrer |

⚠️ **Si batch >5 targets → afficher la liste et demander confirmation utilisateur** avant de lancer.

---

## Étape 2 — Pour chaque target : GET current data

```bash
curl -s https://terranova.semisto.org/api/v1/plants/species/{ID} -H "Authorization: Bearer $KNOWLEDGE_API_KEY" | jq .
```

Cas spéciaux :
- Variété : `GET /api/v1/plants/varieties/{ID}` puis remonter à l'espèce parent
- Genre : `GET /api/v1/plants/genera/{ID}` (cascade vers les espèces si demandé)

Skip si les `references` ou photos contiennent des entrées récentes (<30 jours) sauf si l'utilisateur force avec "force" ou "re-traite".

---

## Étape 3 — Bootstrap genre si manquant

Si `species.genusId` est null (rare) ou si le genre n'a pas de description :

```bash
curl -s -X PATCH https://terranova.semisto.org/api/v1/plants/genera/{GENUS_ID} \
  -H "Authorization: Bearer $KNOWLEDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "...",
    "common_names": [{"language": "fr", "name": "..."}, ...],
    "mark_as_audited": true
  }'
```

Si le genre n'existe pas du tout (création d'une nouvelle espèce) :

```bash
curl -s -X POST https://terranova.semisto.org/api/v1/plants/genera \
  -H "Authorization: Bearer $KNOWLEDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "latin_name": "Acer",
    "description": "Genre de la famille des Sapindaceae...",
    "common_names": [{"language": "fr", "name": "Érable"}, ...]
  }'
```

---

## Étape 4 — Détecter la catégorie

Voir `filling-rules.md` § "Détection automatique de catégorie".

Une espèce peut appartenir à plusieurs catégories (ex: noyer = fruitier + forestier). Appliquer toutes les grilles applicables pour le payload.

---

## Étape 5 — Recherche multi-source

Lancer en parallèle (via Agent tool ou WebFetch) :

```
WebFetch:
- https://pfaf.org/user/Plant.aspx?LatinName={Latin+name}
  prompt: "Extract: hardiness USDA zones, life cycle, flowering months, flower color, edible parts, medicinal uses, propagation methods, native countries, soil moisture, pH preference"

- https://fr.wikipedia.org/wiki/{Nom français}
  prompt: "Extract: noms communs FR/EN/ES/DE/IT, classification taxonomique, distribution, dimensions, période de floraison, usages, statut invasif"

- https://en.wikipedia.org/wiki/{Latin_name}
  prompt: "Extract: USDA hardiness zone, mature size, flowering period, fruiting period, native range, cultivars list"

- https://powo.science.kew.org/results?q={Latin+name}
  prompt: "Extract: accepted name, synonyms, native distribution map (countries), life form"

- https://www.gbif.org/search?q={Latin+name}
  prompt: "Extract: species ID, native distribution, conservation status"

Sources spécialisées par catégorie (cf filling-rules.md)
```

---

## Étape 6 — Construire le payload

Appliquer les règles de catégorie de `filling-rules.md`.

Stocker dans un fichier temporaire JSON pour éviter les problèmes d'échappement bash :

```bash
cat > /tmp/species_update.json <<'EOF'
{
  "plant_type": "shrub",
  "growth_habit": "buissonnant-arrondi",
  "life_cycle": "perennial",
  ...
  "common_names": [
    {"language": "fr", "name": "..."},
    ...
  ]
}
EOF
```

⚠️ **Validation des enums avant PATCH** : recroiser chaque valeur enum avec `filter-options`.

---

## Étape 7 — Vérifier les URLs photos

Pour chaque photo candidate, lancer un WebFetch :

```
WebFetch URL: https://commons.wikimedia.org/wiki/Category:{Latin_name}
prompt: "List 4-5 best public-domain or CC photos of {Latin_name} showing whole plant, leaves, flowers, fruit (if applicable). For each, return the direct upload.wikimedia.org URL and license."
```

Vérifier chaque URL retournée :

```bash
curl -sI "{photo_url}" | grep -E "HTTP|content-type"
```

Doit renvoyer 200 + `content-type: image/*`.

---

## Étape 8 — PATCH l'espèce

```bash
curl -s -X PATCH "https://terranova.semisto.org/api/v1/plants/species/{ID}" \
  -H "Authorization: Bearer $KNOWLEDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/species_update.json | jq '{latinName, type, foliageType, ...}'
```

Le champ `common_names` dans le payload **remplace tous les noms communs existants** — fournir la liste complète à chaque fois.

**Toujours inclure `"mark_as_audited": true`** dans `species_update.json` pour que `audited_at` soit mis à jour avec la date de cet audit. Ce timestamp s'affiche en bas de la fiche dans l'UI.

---

## Étape 9 — POST photos (avec contributor_id Nova)

Pour chaque photo validée :

```bash
curl -s -X POST https://terranova.semisto.org/api/v1/plants/photos \
  -H "Authorization: Bearer $KNOWLEDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "target_type": "species",
    "target_id": {ID},
    "contributor_id": 1,
    "url": "https://upload.wikimedia.org/...",
    "caption": "Description (Wikimedia Commons, CC)",
    "role": "habit"
  }'
```

**Roles** : `flower`, `fruit`, `foliage`, `habit`, `general`.

---

## Étape 10 — POST références

Pour chaque source canonique (PFAF, Wikipédia FR/EN, Tela Botanica, GBIF, Kew POWO) :

```bash
curl -s -X POST https://terranova.semisto.org/api/v1/plants/references \
  -H "Authorization: Bearer $KNOWLEDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "target_type": "species",
    "target_id": {ID},
    "reference_type": "website",
    "title": "...",
    "url": "https://...",
    "source": "PFAF | Wikipédia (FR) | ..."
  }'
```

`reference_type` libre : `website`, `wikipedia`, `botanical_database`, `book`.

---

## Étape 11 — Variétés (si mode species ou genus avec cascade)

Pour chaque variété de l'espèce :

### Détection de doublons (CRITIQUE)

```bash
# Lister les variétés via l'espèce
curl -s "https://terranova.semisto.org/api/v1/plants/species/{ID}" -H "Authorization: Bearer $KNOWLEDGE_API_KEY" | jq '.varieties | group_by(.latinName) | map({name: .[0].latinName, ids: map(.id), count: length}) | map(select(.count > 1))'
```

Si doublons détectés :
1. Pour chaque doublon, vérifier les FK :
   ```bash
   # Stock batches pointant vers les IDs en doublon
   curl -s "https://terranova.semisto.org/api/v1/nursery" -H "Authorization: Bearer $KNOWLEDGE_API_KEY" | jq '[.stockBatches[] | select(.varietyId == "{DUPLICATE_ID}")]'
   ```
2. Réassigner vers l'ID le plus bas :
   ```bash
   curl -s -X PATCH "https://terranova.semisto.org/api/v1/nursery/stock-batches/{BATCH_ID}" \
     -H "Authorization: Bearer $KNOWLEDGE_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"variety_id": {KEPT_ID}}'
   ```
3. DELETE les variétés en doublon :
   ```bash
   curl -s -X DELETE "https://terranova.semisto.org/api/v1/plants/varieties/{DUPLICATE_ID}" \
     -H "Authorization: Bearer $KNOWLEDGE_API_KEY"
   ```
   Le contrôleur cascade les associations polymorphiques (common_names, photos, notes, references, palette_items) et **nullifie automatiquement le `variety_id` des `nursery_stock_batches` soft-deleted** (`deleted_at NOT NULL`) qui pointent vers la variété — le `variety_name` dénormalisé est préservé pour l'historique. Tu n'as donc à gérer que les batches **actifs** (étapes 1-2 ci-dessus). Si tu reçois un 422, c'est qu'un batch actif a échappé à la réassignation — re-lister via `/api/v1/nursery` et corriger.

### Mise à jour des variétés gardées

Pour chaque variété (cultivar) avec données >95% confiance :

```bash
curl -s -X PATCH "https://terranova.semisto.org/api/v1/plants/varieties/{ID}" \
  -H "Authorization: Bearer $KNOWLEDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "productivity": "...",
    "fruit_size": "...",
    "maturity": "...",
    "storage_life": "...",
    "disease_resistance": "...",
    "additional_notes": "...",
    "mark_as_audited": true
  }'
```

---

## Étape 12 — Lancer le verifier

Spawn un sous-agent indépendant via le Agent tool :

```
Agent({
  description: "Verify species data {ID}",
  subagent_type: "general-purpose",
  prompt: """
  Tu es botaniste expert et fact-checker. Audite la fiche Terranova de l'espèce {ID}.
  Tu ne dois RIEN écrire dans la base.

  GET https://terranova.semisto.org/api/v1/plants/species/{ID} -H "Authorization: Bearer $KNOWLEDGE_API_KEY"

  Vérifie selon les 5 catégories définies dans /Users/michael/.claude/skills/terranova-update-species/references/verification-rules.md :
  1. Cohérence interne (calendrier, botanique, usage)
  2. Cross-source validation (PFAF, Wikipédia, Kew POWO, Tela Botanica)
  3. Complétude par catégorie (catégorie détectée: {CATEGORY})
  4. Validation technique (URLs HTTP 200, enums valides, pas de doublons)
  5. Sanity botanique (cohérence pour la sous-catégorie)

  Output JSON STRICT suivant le schéma défini dans verification-rules.md.

  Sois critique. Cite tes sources pour chaque erreur/warning.
  """
})
```

---

## Étape 13 — Refine + Output rapport

### Sur retour du verifier

| Verdict | Action |
|---|---|
| `approved` | Continuer, marquer la target comme OK |
| `needs_review` (warnings/missing) | Garder le rapport pour l'output final |
| `errors` avec tous les fix `autoFixable: true` | Appliquer auto-fixes via PATCH, re-vérifier (1 retry max) |
| `errors` avec fix non-autoFixable | Stopper le processing pour cette target, remonter à l'utilisateur |

### Format rapport final

```markdown
## Rapport — {N} target(s) traitée(s)

### ✅ Camellia sinensis (id 1036) — approved
- Champs ajoutés : 23
- Photos : 5 ajoutées
- Références : 6 ajoutées
- Variétés : 12 → 3 (9 doublons supprimés)
- Verifier : approved

### ⚠️ Acer pseudoplatanus (id 1234) — needs_review
- Verifier : needs_review
- Warnings :
  - `pruning_months` : févr-mars chevauche le débourrement
- Action requise : confirmer la fenêtre de taille pour érables

### ❌ Quercus robur (id 5678) — errors auto-corrigées
- Verifier : errors → auto-fixed → re-verified ✅
- Corrections appliquées :
  - `is_invasive` remis à false (pas dans liste belge)
- Verifier final : approved
```

---

## Tableau de bord progression (mode batch)

Si batch >5 targets, afficher périodiquement la progression :

```
[3/12] Acer platanoides — done ✅
[4/12] Acer pseudoplatanus — running...
[5/12] Acer campestre — pending
...
```

Pour les batches >20, considérer de lancer en parallèle avec `Agent` (1 sous-agent par target) pour gagner du temps.

---

## Erreurs courantes & gestion

| Erreur | Cause | Fix |
|---|---|---|
| 401 Unauthorized | KNOWLEDGE_API_KEY pas exportée | `export KNOWLEDGE_API_KEY=...` |
| 422 sur PATCH species | Enum invalide | Re-fetch `filter-options`, mapper |
| 422 sur DELETE variety | FK contraint | Réassigner stock_batches d'abord |
| Photo 404 sur Wikimedia | URL renommée | Re-WebFetch la page Commons |
| Genre déjà existant lors de POST | Idempotence GenusName | Lookup d'abord via search |
| Common name dupliqué | `common_names` array fourni partiellement | Toujours fournir la liste complète (replace all) |
