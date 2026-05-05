---
name: terranova-update-species
description: Met à jour automatiquement les fiches du Plant Database de Terranova (genres, espèces, variétés) avec des données botaniques sourcées (PFAF, Wikipédia, Kew POWO, GBIF, Tela Botanica) et des photos Wikimedia Commons. Utiliser quand l'utilisateur demande de "compléter", "remplir", "mettre à jour", "auditer" ou "traiter" une ou plusieurs fiches plante. Supporte cibles uniques (un genre/espèce/variété) ou sélections (toutes les espèces d'un genre, toutes les fiches obsolètes, etc.). Inclut une passe de vérification automatique pour détecter les incohérences.
---

# Terranova — Update Species

Skill de remplissage automatisé du Plant Database de Terranova. S'appuie sur le skill `terranova-api` pour les appels HTTP.

## Quand utiliser ce skill

L'utilisateur demande l'une de ces actions sur une ou plusieurs fiches du Plant Database :
- "Mets à jour Camellia sinensis"
- "Complète la fiche du genre Acer"
- "Remplis les variétés de Malus pumila"
- "Traite toutes les espèces du genre Quercus"
- "Audit les fiches modifiées il y a plus d'un an"
- "Vérifie les données de [espèce]"

## Prérequis

1. `KNOWLEDGE_API_KEY` exportée dans le shell (clé production)
2. Skill `terranova-api` chargé pour les conventions d'appels (lire `~/.claude/skills/terranova-api/SKILL.md`)
3. Contributrice **Nova** existe en base (`Plant::Contributor` id 1) — créer via Rails console si absente :
   ```ruby
   Plant::Contributor.create!(name: "Nova IA", joined_at: Date.current, lab_id: nil)
   ```

## Identité

Toutes les contributions sont signées **Nova** (`contributor_id: 1`, email `nova@semisto.org`). C'est obligatoire pour les photos (champ requis) et recommandé pour références/notes.

## Architecture

```
[Sélecteur de cibles] → [Filler] → [Verifier] → [Refine si erreurs] → [Rapport]
```

- **Sélecteur** : résout l'input utilisateur en liste de targets (`{type: 'species'|'genus'|'variety', id: N}`)
- **Filler** : pour chaque target, recherche multi-source + remplit les champs >95% confiance
- **Verifier** : sous-agent indépendant qui audit les données après écriture
- **Refine** : applique les corrections évidentes (ex: vider un fruiting incohérent), remonte les ambiguïtés à l'utilisateur
- **Rapport** : récap structuré (champs ajoutés, vides + raison, doublons, photos, verification verdict)

## Workflow

Lire **`references/workflow.md`** pour les 13 étapes détaillées avec endpoints API et exemples de payload.

### Résumé du workflow

1. **Parser l'input** → liste de targets
2. **Pour chaque target** :
   - GET current data (skip si déjà mis à jour <30 jours sauf force)
   - Si genre absent (espèce sans `genus_id` ou nouveau) → créer le genre d'abord
   - Détecter la **catégorie** (fruitier/aromatique/ornementale/forestier/légume vivace/médicinale/fixateur d'azote)
   - Recherche multi-source via WebFetch (PFAF, Wikipédia FR/EN, Kew POWO, Tela Botanica, GBIF + sources spécialisées par catégorie)
   - Pré-fetch enums : `GET /api/v1/plants/filter-options`
   - Construire payload selon les **règles de catégorie** (cf `references/filling-rules.md`)
   - Vérifier URLs photos avec WebFetch
   - PATCH species + POST common_names + POST photos + POST references (avec `contributor_id: 1`)
   - Pour chaque variété : appliquer règles + détecter doublons
   - **Lancer le verifier** (cf section "Verifier" ci-dessous)
   - Refine si erreurs auto-corrigeables, sinon collecter pour rapport
3. **Rapport final** structuré avec verdict par target

## Sélection de cibles

### Cible unique

| Input utilisateur | Résolution |
|---|---|
| "Mets à jour Camellia sinensis" | `GET /api/v1/plants/search?query=Camellia+sinensis` → première espèce match |
| "Mets à jour le genre Acer" | `GET /api/v1/plants/search?query=Acer` → premier `type: "genus"` match |
| "Mets à jour la variété Belle de Boskoop" | `GET /api/v1/plants/search?query=Belle+de+Boskoop` → premier `type: "variety"` |
| "Mets à jour /plants/species/1036" | Extraire ID 1036 de l'URL, GET direct |

### Sélection batch

| Input utilisateur | Résolution |
|---|---|
| "Toutes les espèces du genre Acer" | `GET /api/v1/plants/genera/{acer_id}` → `species[]` |
| "Toutes les variétés de Malus pumila" | `GET /api/v1/plants/species/{id}` → `varieties[]` |
| "Toutes les espèces de type tree" | `GET /api/v1/plants/species?type=tree` |
| "Fiches modifiées il y a plus d'un an" | ⚠️ Pas exposé directement par l'API actuelle — demander à l'utilisateur d'exposer `updatedAt` dans le serializer ou fetcher chaque espèce individuellement |
| "Toutes les fiches sans photo" | Itérer sur `GET /api/v1/plants/species` puis `GET /:id` et filtrer `photos.length == 0` |

⚠️ **Confirmation obligatoire avant batch >5 espèces** — afficher le nombre de cibles et demander OK avant de lancer.

## Règles de remplissage

Lire **`references/filling-rules.md`** pour le détail complet des règles par catégorie.

### Principes clés

- **Confiance >95% strict** : si non sûr → laisser vide
- **Pré-valider les enums** via `filter-options`
- **Multi-source obligatoire** : au moins 2 sources concordantes pour chaque champ rempli
- **Noms communs** : 6+ langues (FR/EN/ES/DE/IT/NL/PT) si convergence
- **Photos** : Wikimedia Commons uniquement, vérif WebFetch avant POST
- **Références canoniques** : PFAF + Wikipédia FR + Wikipédia EN + Kew POWO + GBIF + Tela Botanica (+ sources spécialisées par catégorie)

### Catégories détectées

`fruitier`, `aromatique`, `ornementale`, `forestier`, `légume-vivace`, `médicinale`, `fixateur-azote`. Chaque catégorie a sa propre grille de champs prioritaires (cf `references/filling-rules.md`).

## Verification

Lire **`references/verification-rules.md`** pour le détail des 5 catégories de checks.

### Mode 1 — Verifier inline (par défaut)

Les sous-agents `general-purpose` lancés via le Task/Agent tool **n'ont PAS accès au Task/Agent tool eux-mêmes** — ils ne peuvent donc pas spawner un verifier indépendant. Dans ce cas (le plus fréquent quand on traite plusieurs espèces en parallèle), fais la vérification toi-même comme une étape distincte AVANT de produire ton rapport final :

1. Une fois tous les PATCH/POST terminés, **change explicitement de posture** : "je passe en mode verifier critique, j'ai fini de remplir, je cherche maintenant les erreurs"
2. Re-fetch la fiche complète via `GET /api/v1/plants/species/{ID}`
3. Applique les 5 catégories de checks de `references/verification-rules.md` une par une
4. Re-WebFetch 1-2 sources principales (PFAF + Wikipédia) pour cross-validation
5. Produis un mini-rapport JSON (verdict + errors/warnings/missing) dans la section "Verifier" de ton rapport final

⚠️ **Risque connu** : le verifier inline peut être complaisant avec son propre travail. Pour compenser :
- Sois explicitement critique et accepte un verdict `needs_review` dès qu'un warning réel existe
- Ne valide pas un champ rempli juste parce que tu l'as rempli — re-vérifie sa source maintenant
- Si tu as fait une approximation pour remplir, marque-la `low_confidence` dans le rapport

### Mode 2 — Verifier sub-agent (uniquement quand l'agent principal a accès au Task/Agent tool)

Quand tu es l'agent principal de la conversation (pas un sous-agent), tu peux spawner un verifier indépendant :

```
Tu es botaniste expert et fact-checker. Audite la fiche de l'espèce {ID} dans Terranova.
Tu ne dois rien écrire — uniquement chercher des erreurs, contradictions, et omissions.

API : `curl -s https://terranova.semisto.org/api/v1/plants/species/{ID} -H "Authorization: Bearer $KNOWLEDGE_API_KEY"`

Vérifie selon les 5 catégories définies dans .agents/skills/terranova-update-species/references/verification-rules.md :
1. Cohérence interne
2. Cross-source validation (re-fetch PFAF, Wikipédia, Kew POWO, Tela Botanica)
3. Complétude par catégorie
4. Validation technique (URLs, enums, doublons)
5. Sanity botanique

Output JSON strict : { speciesId, verdict: "approved"|"needs_review"|"errors", errors: [...], warnings: [...], missing: [...], low_confidence: [...] }

Sois critique, ne valide rien sans preuve. Cite tes sources.
```

### Refine

Sur retour du verifier :
- `verdict: "approved"` → continuer
- `verdict: "needs_review"` → afficher le rapport à l'utilisateur, attendre instruction
- `verdict: "errors"` :
  - Erreurs auto-corrigeables (ex: `fruiting_months` aberrant → vider) → corriger automatiquement et re-vérifier
  - Erreurs ambiguës → remonter à l'utilisateur

## Limitations connues

- **Pas de filtre `updated_before` sur l'API species** — pour "fiches modifiées il y a plus d'un an", il faut soit ajouter ce filtre côté Rails, soit fetcher chaque espèce individuellement (lent).
- **Pas de POST `/plants/contributors`** — Nova doit être créée manuellement en Rails console (une seule fois).
- **Photos Wikimedia** : URLs peuvent évoluer (renommages). Toujours WebFetch avant POST.

## Format du rapport final

```markdown
## Rapport de mise à jour — N espèces traitées

### ✅ [Espèce A] (id 1234)
- Champs ajoutés : 23
- Champs laissés vides : 4 (raisons : ...)
- Photos : 5 ajoutées
- Références : 6 ajoutées
- Verifier : approved

### ⚠️ [Espèce B] (id 5678)
- Verifier : needs_review
- Warnings :
  - `fruiting_months` : commence avant `flowering_months` (cycle décalé ?)
  - `pruning_months` : chevauche débourrement
- Action requise : confirmer le cycle bisannuel

### ❌ [Espèce C] (id 9012)
- Verifier : errors
- Errors :
  - `is_invasive: true` mais climat tropical incompatible avec liste belge
- Action automatique : `is_invasive` remis à false, re-verified ✅
```
