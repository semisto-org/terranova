# Règles de remplissage par catégorie

## Détection automatique de catégorie

Combiner ces signaux pour classer une espèce dans une catégorie :

| Catégorie | Signaux |
|---|---|
| Fruitier | `plant_type` ∈ {tree, shrub, climber} + `edible_parts` contient `fruit` + genre dans liste fruitière |
| Aromatique | famille Lamiaceae OU `edible_parts: ["leaf"]` + `interests: ["edible"]` + plante herbacée/petit arbuste |
| Ornementale | `interests` contient `ornamental` MAIS PAS `edible` |
| Forestier | `plant_type: tree` + `forest_garden_zone: canopy` + `growth_rate` ∈ {slow, medium} |
| Légume vivace | `life_cycle: perennial` + `plant_type` ∈ {herbaceous, ground-cover} + `edible_parts` non vide |
| Médicinale | `interests` contient `medicinal` comme rôle principal (pas juste secondaire) |
| Fixateur d'azote | famille Fabaceae OU genre ∈ {Alnus, Elaeagnus, Robinia, Hippophae} OU `interests` contient `nitrogen-fixer` |

Une espèce peut appartenir à **plusieurs** catégories (ex: noyer = fruitier + forestier). Appliquer toutes les grilles applicables.

---

## Champs à remplir pour TOUTES les espèces (>95% confiance)

### Genre
- `latin_name` (donné en input)
- `common_names` (FR/EN/ES/DE/IT/ZH au minimum)
- `description` : taxonomie + famille + origine + usages principaux + 1-2 espèces emblématiques

### Espèce — botanique pure
- `plant_type` (tree/shrub/herbaceous/climber/ground-cover/small-shrub)
- `life_cycle` (annual/biennial/perennial)
- `foliage_type` (deciduous/evergreen/semi-evergreen/marcescent)
- `foliage_color` (default green, sinon dark-green/light-green/purple/silver/golden/variegated)
- `growth_habit` (port botanique précis : `arbustif-elance`, `buissonnant-arrondi`, etc.)
- `growth_rate` (slow/medium/fast/slow-start/fast-start)
- `exposures` (sun/partial-shade/shade — souvent multiples)
- `hardiness` (zone-5 à zone-9 — utiliser la zone limite la plus chaude)
- `root_system` (taproot/fibrous/spreading/shallow/deep)
- `pollination_type` (insect/wind/self/bird)
- `flower_colors` (multi-valeurs)
- `fragrance` (none/light/medium/strong)
- `soil_types`, `soil_moisture`, `soil_richness`
- `watering_need` (1-5)
- `is_invasive` (boolean — référence : liste officielle SPF Santé publique pour la Belgique)
- `origin` (texte court : continent/région d'origine)

### Espèce — calendrier
- `flowering_months`, `harvest_months`, `pruning_months`
- `fruiting_months` SI cycle annuel ; sinon laisser vide + expliquer dans `additional_notes`
- `planting_seasons` (spring/autumn standard)

### Espèce — usages
- `edible_parts`
- `interests`
- `propagation_methods`
- `transformations` (jam/jelly/juice/dried/...)
- `therapeutic_properties` (texte structuré : principes actifs + indications)
- `toxic_elements` (texte ou null)
- `additional_notes` (texte enrichi avec contexte botanique + culture + variétés botaniques + cycle de fructification si décalé)

### Multi-langues
- `common_names` : FR (multiples si plusieurs noms communs) + EN + ES + DE + IT + NL + PT + ZH/JA si pertinent

### Photos
- 3 à 5 photos Wikimedia Commons couvrant : `habit` (port général), `foliage` (feuilles), `flower`, `fruit` si applicable, `general` (plantation/usage)
- Vérifier chaque URL avec WebFetch avant POST
- Roles autorisés : `flower`, `fruit`, `foliage`, `habit`, `general`

### Références
- PFAF : `https://pfaf.org/user/Plant.aspx?LatinName={latin+name}`
- Wikipédia FR : `https://fr.wikipedia.org/wiki/{Nom}`
- Wikipédia EN : `https://en.wikipedia.org/wiki/{Latin_name}`
- Tela Botanica : recherche par nom latin
- GBIF : `https://www.gbif.org/species/{id}`
- Kew POWO : `https://powo.science.kew.org/results?q={latin+name}`

---

## Règles spécifiques par catégorie

### 🍎 Fruitier

**Identification (genres)** : Malus, Pyrus, Prunus, Cydonia, Vitis, Fragaria, Rubus, Ribes, Morus, Juglans, Castanea, Corylus, Diospyros, Ficus, Mespilus, Sorbus, Punica, Olea, Citrus, Actinidia, Sambucus, Hippophae.

**Champs critiques (toujours remplir)** :
- `fertility` ⚠️ CRUCIAL — utiliser pomologie spécialisée (varietelocale.org, mes-arbres.fr, RFR Pomme/Poire)
- `pollination_type` (insect pour la majorité, wind pour noyer/noisetier/châtaignier)
- `harvest_months` précis (Belgique +2-3 semaines vs sources françaises)
- `transformations` selon usages traditionnels (jam, jelly, juice, dried, frozen, vinegar, liqueur)
- `edible_parts: ["fruit"]` minimum, ajouter `seed`/`leaf` si applicable

**Variétés (cultivars documentés)** :
- `productivity` (faible/moyenne/élevée/très élevée)
- `fruit_size` (calibre mm ou catégorie petit/moyen/gros)
- `maturity` (saison + semaine de récolte estimée Belgique)
- `storage_life` (durée + conditions, ex: "3 mois en cave fraîche")
- `disease_resistance` (par maladie : tavelure, oïdium, feu bactérien, monilia, chancre, sharka, mildiou)
- `additional_notes` : origine + année + obtenteur + parents génétiques + **variétés pollinisatrices recommandées** + usage (couteau/cuisson/cidre/confiture)
- `taste_rating` UNIQUEMENT si convergence sur 3+ sources pomologiques

### 🌿 Aromatique / herbe culinaire

**Identification** : Lamiaceae (Lavandula, Thymus, Rosmarinus, Salvia, Mentha, Ocimum, Origanum, Melissa) + Apiaceae (Anethum, Petroselinum, Coriandrum, Foeniculum) + Allium (ciboulette).

**Champs spécifiques** :
- `edible_parts: ["leaf"]` minimum (parfois `flower`, `seed`)
- `interests: ["edible", "medicinal", "ornamental"]` souvent les 3
- `transformations: ["dried"]` quasi-systématique
- `harvest_months` : période de coupe optimale (avant/pendant floraison selon usage culinaire vs huile essentielle)
- `propagation_methods` : `cutting` + `seed` + parfois `division`
- `growth_habit: "buissonnant-arrondi"` ou `touffe`
- Souvent vivaces méditerranéennes → sol drainant + exposition `sun` + watering 2

**Variétés** :
- Champs fruitiers (`fruit_size`, `storage_life`, `disease_resistance`) → laisser vide
- `additional_notes` : profil aromatique (chémotype si applicable, ex: thym à carvacrol vs thym à thymol) + usage culinaire + huile essentielle

### 🌸 Ornementale

**Identification** : Camellia, Rhododendron, Magnolia, Rosa, Hydrangea, Paeonia, Wisteria, Clematis, Hibiscus, Lavandula (aussi aromatique), Lonicera, Syringa, Buddleja.

**Champs spécifiques** :
- `flower_colors` exhaustif (lister toutes les couleurs des cultivars principaux)
- `fragrance` toujours renseigné (light/medium/strong/none)
- `flowering_months` précis et vérifié
- `foliage_color` important si autre que `green` standard
- `growth_habit` (port) bien documenté

**Variétés** :
- Champs fruitiers N/A → laisser vide
- `additional_notes` : couleur de fleur précise (RHS color code si possible) + période + parfum + port spécifique au cultivar + obtenteur/année

### 🌳 Arbre forestier / nourricier

**Identification** : Quercus, Fagus, Carpinus, Acer, Fraxinus, Tilia, Castanea, Larix, Pinus, Abies, Picea, Betula, Alnus, Populus, Salix, Robinia, Aesculus.

**Champs spécifiques** :
- `forest_garden_zone: "canopy"` (souvent — vérifier hauteur)
- `growth_rate` important (slow pour chêne/hêtre/houx, fast pour érable/saule/peuplier)
- `root_system` documenté (`taproot` chêne/châtaignier, `fibrous` hêtre/charme, `spreading` peuplier)
- `ecosystem_needs` ici utile : `pioneer` (bouleau, saule), `climax` (hêtre, chêne), `nurse-tree` (aulne)
- `pollination_type: "wind"` pour la plupart (sauf tilleul = insect)
- `fodder_qualities` parfois (cattle/goats pour glands de chêne, châtaignes pour porcs)
- `interests: ["nitrogen-fixer"]` pour aulne, robinier (et famille Fabaceae)
- Dimensions naturelles peuvent dépasser 20-30m → utiliser `height_description` pour préciser : "Naturellement 25-30 m, cultivé en alignement à 15-20 m"

**Variétés** : rares pour forestiers — généralement skip.

### 🥬 Légume vivace / herbacée comestible

**Identification** : Asparagus, Rheum, Rumex, Helianthus tuberosus, Levisticum, Urtica, Symphytum, Borago, Allium (perpétuel), Crambe, Bunias.

**Champs spécifiques** :
- `life_cycle: "perennial"` (toujours)
- `edible_parts` variable (leaf/root/stem/shoot/sap)
- `growth_habit: "touffe"` ou `acaule` ou `tapissant`
- `harvest_months` étendus (souvent printemps + été, parfois automne pour racines)
- `forest_garden_zone: "edge"` ou `understory`
- `propagation_methods` souvent `division` ou `seed`

### 🌺 Médicinale spécialisée

**Identification** : `interests` inclut `medicinal` comme rôle principal (pas secondaire). Genres typiques : Echinacea, Calendula, Valeriana, Melissa officinalis, Hypericum, Achillea, Arnica, Salvia officinalis, Matricaria, Tilia.

**Champs spécifiques** :
- `therapeutic_properties` détaillé (principes actifs + indications traditionnelles + voie d'administration : tisane, teinture, infusion, décoction)
- `toxic_elements` important (interactions médicamenteuses, contre-indications grossesse, dosage maximal)
- `harvest_months` selon partie utilisée et concentration en principes actifs (ex: fleurs de calendula en pleine ouverture, racines de valériane à l'automne)
- `transformations`: ajouter `dried` (séchage standard pour tisanes), parfois `liqueur`

### 🌱 Fixateur d'azote / couvre-sol

**Identification** : Fabaceae (Trifolium, Vicia, Medicago, Onobrychis, Lupinus, Lotus, Robinia, Cytisus, Genista, Glycine), Betulaceae (Alnus), Elaeagnaceae (Elaeagnus, Hippophae).

**Champs spécifiques** :
- `interests` doit inclure `nitrogen-fixer` (systématique)
- `ecosystem_needs` typiquement : `pioneer` (Robinia, Alnus, Hippophae), `ground-cover` (trèfles), `nurse-tree` (aulne, robinier)
- `forest_garden_zone` selon : `edge`/`understory` pour herbacées, `canopy` pour arbres
- `pollination_type: "insect"` (excellents mellifères → ajouter `pollinator` à `interests`)

---

## À éviter systématiquement (confiance <95%)

- `edibleRating` / `medicinalRating` (1-5) : trop subjectif. Sauf cas extrêmes : 5 = espèces emblématiques (thé, vigne, pomme), 1 = comestible mais sans intérêt gastronomique.
- Données régionales très précises sans source belge spécifique (dates exactes de récolte locales).
- `ecosystem_needs` si le rôle écologique n'est pas explicite dans la littérature (ne pas inventer).
- `taste_rating` pour cultivars sauf convergence pomologique 3+ sources.

---

## Sources spécialisées par catégorie

| Catégorie | Sources additionnelles |
|---|---|
| Fruitiers | varietelocale.org, mes-arbres.fr, fruitsoublies.com, RFR (Réseau Français des Ressources génétiques) |
| Aromatiques | itm-conseil.fr, plantes-et-sante.fr, Pharmacopée européenne |
| Forestiers | onf.fr, cnpf.fr, ardoise.cra.wallonie.be (Belgique) |
| Médicinales | Pharmacopée française, EMA HMPC monographs, ESCOP |
| Vergers belges | Le Sillon Belge, agric-en-bio.be, semispostes.org |
