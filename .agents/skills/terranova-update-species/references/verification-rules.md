# Règles de vérification

L'agent vérificateur (`species-data-verifier`) audit chaque fiche après remplissage. Il **n'écrit rien** — il cherche uniquement des erreurs, contradictions, et omissions.

## Prompt système du vérificateur

```
Tu es botaniste expert et fact-checker spécialisé dans le Plant Database
de Terranova. Ton seul rôle est d'auditer les données d'une espèce après
mise à jour automatisée. Tu ne dois RIEN écrire dans la base.

Recherche systématiquement des erreurs, contradictions, et omissions
selon les 5 catégories de checks ci-dessous. Sois critique : ne valide
RIEN sans preuve sourcée.

Output JSON strict suivant le schéma défini.
```

---

## 1. Cohérence interne (priorité haute)

### Calendrier
- **Floraison → Fructification → Récolte des fruits** doivent être chronologiques sur l'année
- **Si décalage >12 mois (cycle bisannuel)** : doit être explicitement mentionné dans `additional_notes` (sinon ERROR)
- **`pruning_months` pendant `flowering_months`** = warning (sauf rajeunissement justifié)
- **`harvest_months` sans `fruiting_months`** + parties récoltées = `fruit` → warning
- **`flowering_months` hivernal** (déc-fév) en climat belge sur espèce non rustique (zone-9+) → warning

### Cohérence botanique
- **`foliage_type: evergreen`** + mention de "chute des feuilles" dans description → ERROR
- **`root_system: taproot`** sur herbacée non-pissenlit-like → warning
- **`forest_garden_zone: canopy`** + `height_max_cm < 500` → ERROR
- **`forest_garden_zone: canopy`** + `plant_type ≠ tree` → ERROR
- **`life_cycle: annual`** + `growth_rate: slow` → warning (incohérent)
- **`pollination_type: wind`** + `flower_colors` vives (rouge/violet/jaune vif) → warning (les fleurs anémophiles sont généralement discrètes)

### Cohérence usage
- **`is_invasive: true`** sans climat compatible (espèce tropicale stricte en Belgique) → ERROR
- **`is_invasive: true`** mais espèce absente de la liste officielle SPF Santé publique / AlterIAS Belgique → warning
- **`fertility: self-sterile`** sans variétés pollinisatrices listées dans `additional_notes` ou notes de variétés → warning
- **`interests` contient `nitrogen-fixer`** mais espèce hors Fabaceae/Betulaceae/Elaeagnaceae → ERROR
- **`interests` contient `edible`** mais `edible_parts` vide → ERROR
- **`interests` contient `medicinal`** mais `therapeutic_properties` vide ou null → warning

---

## 2. Cross-source validation

Pour chaque champ rempli, comparer avec ces sources et flagger les divergences :

### Sources principales
- PFAF : `https://pfaf.org/user/Plant.aspx?LatinName={latin+name}`
- Wikipédia FR + EN : `https://fr.wikipedia.org/wiki/{Nom}`, `https://en.wikipedia.org/wiki/{Latin_name}`
- Kew POWO : `https://powo.science.kew.org/taxon/{id}` (pour taxonomie + distribution)
- GBIF : `https://www.gbif.org/species/{id}` (pour distribution)
- Tela Botanica : `https://www.tela-botanica.org/bdtfx-nn-{id}` (pour statut FR/BE)

### Champs à cross-validate
- `hardiness` : convergence USDA zones entre sources
- `origin` / `nativeCountries` : géographie d'origine
- `flower_colors`, `flowering_months` : timing de floraison
- `fertility`, `pollination_type`
- `is_invasive` : doit s'appuyer sur sources belges spécifiques

### Verdict cross-source
- **2+ sources concordent** : OK
- **1 source seulement** : `LOW_CONFIDENCE` warning
- **Sources contradictoires** : ERROR + citer chaque source et sa valeur

---

## 3. Complétude par catégorie

Champs **obligatoires** (sinon ERROR) selon catégorie détectée :

| Catégorie | Champs obligatoires |
|-----------|---------------------|
| **Fruitier** | `fertility`, `pollination_type`, `harvest_months`, `transformations`, `edible_parts: ["fruit"]` |
| **Aromatique** | `edible_parts: ["leaf"]`, `harvest_months`, `transformations: ["dried"]` |
| **Ornementale** | `flower_colors`, `flowering_months`, `growth_habit` |
| **Forestier** | `growth_rate`, `pollination_type`, `height_max_cm > 500` |
| **Légume vivace** | `life_cycle: perennial`, `edible_parts` non vide |
| **Médicinale** | `therapeutic_properties` non vide, `toxic_elements` (peut être "Aucun connu") |
| **Fixateur d'azote** | `interests` contient `nitrogen-fixer`, `ecosystem_needs` non vide |

Champs **recommandés** (sinon warning `MISSING`) :
- Toutes catégories : `common_names` (≥3 langues), `references` (≥3 sources), `photos` (≥2)
- Espèces avec `interests: ["edible"]` : `edible_rating` peut être absent (subjectif), mais `transformations` recommandé
- Espèces avec `interests: ["medicinal"]` : `therapeutic_properties` détaillé (>200 caractères)

---

## 4. Validation technique

### URLs
- **Photos** : HTTP 200 + `Content-Type: image/*` (JPEG/PNG/WebP)
- **Références** : HTTP 200, pas de redirection vers 404, domaine attendu (pfaf.org, *.wikipedia.org, etc.)

### Enums
- Toutes les valeurs des champs enumérés ∈ `/api/v1/plants/filter-options`
- Vérifier en particulier : `plant_type`, `life_cycle`, `foliage_type`, `growth_habit`, `growth_rate`, `forest_garden_zone`, `pollination_type`, `fertility`, `root_system`, `soil_moisture`, `soil_richness`, `watering_need`, `fragrance`, `hardiness`

### Doublons
- Pas de variété dupliquée pour la même espèce (`(species_id, latin_name)` unique)
- Pas de référence dupliquée (même URL)
- Pas de photo dupliquée (même URL)

### Liaison taxonomique
- `genus_id` non null
- `genus.latin_name` = première partie de `species.latin_name` (avant l'espace)
- Cohérence : si `species.latin_name = "Camellia sinensis"` alors `genus.latin_name = "Camellia"`

---

## 5. Sanity botanique par catégorie

Vérifications spécifiques selon la sous-catégorie détectée :

### Fruitiers à pépins
- Floraison : avr-mai
- Récolte : juil-oct selon variété
- `fertility` : majoritairement autostériles (Malus, Pyrus) — variétés pollinisatrices critiques

### Fruitiers à noyaux (Prunus)
- Floraison : fin fév à mai selon espèce
- Récolte : mai (cerise hâtive) à sep (prune tardive)
- Pas de chevauchement floraison/récolte

### Vigne (Vitis)
- Floraison : juin
- Récolte : sep-oct
- `pollination_type: insect` (souvent autogame)

### Camellias
- Fleurs : automne ou hiver/printemps précoce
- Fruits : décalés de 9-12 mois après floraison → cycle bisannuel à expliciter

### Chênes / châtaigniers / hêtres
- Floraison : printemps (avr-mai)
- Glands/châtaignes/faînes : automne (sep-nov)
- `pollination_type: wind`

### Arbustes à floraison printanière (forsythia, deutzia)
- `pruning_months` après floraison (mai-juin)
- Floraison sur bois de l'année précédente

### Arbustes à floraison estivale/automnale (buddleia, hortensia paniculé)
- `pruning_months` fin hiver (fév-mars)
- Floraison sur bois de l'année

### Aubépine, sureau, prunellier
- Floraison : avr-mai
- Fruits : août-oct

---

## Schéma de sortie JSON

```json
{
  "speciesId": "1036",
  "latinName": "Camellia sinensis",
  "verdict": "approved" | "needs_review" | "errors",
  "summary": {
    "errorsCount": 0,
    "warningsCount": 2,
    "missingCount": 1,
    "lowConfidenceCount": 0
  },
  "errors": [
    {
      "field": "fruiting_months",
      "issue": "Apparaît avant la floraison (sep-oct vs oct-nov) sans note explicative du décalage bisannuel",
      "category": "internal_consistency",
      "suggestion": "Vider fruiting_months OU ajouter mention dans additional_notes du cycle de 9-12 mois",
      "autoFixable": true,
      "autoFix": { "fruiting_months": [] }
    }
  ],
  "warnings": [
    {
      "field": "pruning_months",
      "issue": "Inclut mars qui chevauche le débourrement printanier",
      "category": "internal_consistency",
      "suggestion": "Considérer février uniquement",
      "autoFixable": false
    }
  ],
  "missing": [
    {
      "field": "fragrance",
      "category": "completeness",
      "reason": "Ornementale + médicinale, attendu",
      "suggestion": "Rechercher PFAF + Wikipédia"
    }
  ],
  "lowConfidence": [
    {
      "field": "soil_richness",
      "issue": "PFAF dit 'moderate', Wikipedia dit 'rich'",
      "sources": [
        { "name": "PFAF", "url": "https://pfaf.org/user/Plant.aspx?LatinName=Camellia+sinensis", "value": "moderate" },
        { "name": "Wikipedia EN", "url": "https://en.wikipedia.org/wiki/Camellia_sinensis", "value": "rich" }
      ],
      "category": "cross_source"
    }
  ]
}
```

### Verdicts

- **approved** : 0 errors, ≤2 warnings, ≤2 missing → continuer sans intervention
- **needs_review** : 0 errors, mais warnings/missing significatifs → afficher rapport, attendre instruction utilisateur
- **errors** : ≥1 erreur → tenter auto-fix si tous `autoFixable: true`, sinon remonter à l'utilisateur

---

## Auto-fix policy

Erreurs auto-corrigeables (le filler peut appliquer le fix sans confirmation) :
- Vidage d'un champ aberrant (`fruiting_months` qui contredit `flowering_months`)
- Correction d'un enum invalide (mapping vers la valeur correcte)
- Suppression d'une référence à URL morte
- Correction de doublons trivial (garder le premier)

Erreurs PAS auto-corrigeables (toujours demander) :
- Conflit cross-source de fond (deux sources sérieuses divergent)
- Données catégorisées différemment selon les sources
- Suppression de contenu textuel (notes, descriptions) — toujours demander
