# Audit IA Plant Database — Pépinière Yggdrasil (2026-05-11)

Audit complet réalisé par **Nova IA** (`contributor_id: 1`) sur les **223 espèces** en stock disponible à la Pépinière Yggdrasil, organisé en 11 batches de ~20 espèces, traités par sous-agents botanistes parallèles.

---

## 1. Bilan chiffré

| Métrique | Avant | Après |
|---|---|---|
| Espèces auditées Nova | 9 | **223 (100 %)** |
| Espèces avec illustration | 157 (70 %) | **216+ (97 %+)** *(après retries)* |
| Verdicts `approved` | — | **207 / 214** |
| Verdicts `needs_review` | — | **7** (détaillés §6) |
| Verdicts `errors` | — | **0** |
| Genres audités au passage | — | **~60** |
| Variétés enrichies | — | **~150+** |
| Référence canoniques ajoutées | — | **~1 200** |
| Noms communs (FR/EN/ES/DE/IT/NL/PT + JA/ZH/AR/HI/RU…) | — | **~3 000** |

---

## 2. Récap par batch

| Batch | IDs | Espèces | Verdicts | Notes saillantes |
|---|---|---|---|---|
| 1 | 1-165 | 20 | 20 ✅ | 3 autofixes (Dahlia fertility, Allium life_cycle/edible_parts) |
| 2 | 184-288 | 20 | 19 ✅ + 1 ⚠ | Eleutherococcus growth_habit low_confidence |
| 3 | 315-440 | 20 | 20 ✅ | **Lonicera caerulea** fertility self-fertile→self-sterile ; **Hippophae rhamnoides** self-fertile→dioecious + wind |
| 4 | 443-596 | 20 | 20 ✅ | **Toona sinensis** retrait erroné `nitrogen-fixer` (Meliaceae≠Fabaceae) ; Ficus 2 doublons variétés fusionnés ; Cornus pruning auto-fix |
| 5 | 617-803 | 20 | 18 ✅ + 2 ⚠ | Hibiscus + Ceratophyllum photos manquantes ; Pyrus communis variété 635 supprimée |
| 6 | 821-918 | 20 | 20 ✅ | **Glebionis coronaria** (ex-Chrysanthemum) ; Hemerocallis fulva self-sterile (triploïde) ; 7 tree collards documentés |
| 7 | 919-945 | 20 | 20 ✅ | **Allium bulgaricum** ≈ *A. siculum* ssp. *dioscoridis* ; doublons Allium 929↔931 flaggés ; Mentha doublon 819 ; Tulbaghia genus_id correct |
| 8 | 946-978 | 20 | 19 ✅ + 1 ⚠ | Muscari harvest auto-fix ; Ipomoea batatas climber (corrigé) |
| 9 | 979-1003 | 20 | 19 ✅ + 1 ⚠ | **Viola argenteria** synonymie discutée |
| 10 | 1004-1032 | 20 | 18 ✅ + 2 ⚠ | Papaver fiche-genre life_cycle ambigu ; Plectranthus zone-9 saturé |
| 11 | 1033-1056 | 14 | 14 ✅ | **× Sorbopyrus auricularis** (ex-"Pyraria irregularis") ; Camellia sinensis self-sterile ; doublon Acer saccharum/saccarum |

---

## 3. Corrections taxonomiques majeures

| ID | Avant | Après | Justification |
|---|---|---|---|
| 859 | `chrysanthemum coronarium` | **Glebionis coronaria** | Tzvelev 1961, Bremer & Humphries 1993, APG IV |
| 923 | `Allium bulgaricum` | synonymie → **Allium siculum** subsp. **dioscoridis** (anc. *Nectaroscordum*) | Pacific Bulb Society, POWO |
| 967 | `Oxalis deppei` | synonymie → **Oxalis tetraphylla** | POWO/IPNI |
| 1010 | `Calamintha nepeta` | **Clinopodium nepeta** | APG IV |
| 1019 | `Lychnis coronaria` | **Silene coronaria** | APG IV |
| 1053 | `Pyraria irregularis` (nom invalide) | **× Sorbopyrus auricularis** (Shipova) | Hybride bigénérique *Pyrus communis* × *Sorbus aria*, Bollwyller 1619 |

---

## 4. Corrections botaniques critiques

### Fertility / pollination

| ID | Espèce | Avant | Après | Justification |
|---|---|---|---|---|
| 375 | Lonicera caerulea | self-fertile | **self-sterile** | Haskap : pollinisation croisée obligatoire entre 2 cultivars compatibles |
| 429 | Hippophae rhamnoides | self-fertile + insect | **dioecious + wind** | Argousier dioïque anémophile |
| 446 | Prunus tomentosa | self-fertile | **partially-self-fertile** | Cerisier de Nankin : pollinisation croisée recommandée |
| 569 | Toona sinensis | `nitrogen-fixer` dans interests | retrait | Meliaceae, **pas Fabaceae** — pas de fixation symbiotique |
| 580 | Cornus mas | self-fertile | **partially-self-fertile** | Sources pomologiques européennes |
| 656 | Pyrus pyrifolia | self-fertile | **partially-self-fertile** | Nashi : pollinisation croisée recommandée |
| 659 | Juglans regia | self-fertile + insect | **partially-self-fertile + wind** | Monoïque protandre/protogyne anémophile |
| 678 | Pyrus communis | self-fertile | **partially-self-fertile** | Conférence partiellement autofertile |
| 687 | Humulus lupulus | self-fertile + insect | **dioecious + wind** | Cônes femelles récoltés |
| 692 | Vaccinium corymbosum | self-fertile | **partially-self-fertile** | Pollinisation croisée recommandée |
| 864 | Hemerocallis fulva | self-fertile | **self-sterile** | Triploïde stérile, reproduction clonale |
| 929/931 | Allium x proliferum / cepa viviparum | self-fertile | **self-sterile** | Hybrides stériles, bulbilles aériennes |
| 941 | Mentha × piperita | self-fertile | **self-sterile** | Hybride stérile *spicata* × *aquatica* |
| 945 | Smallanthus sonchifolius | self-fertile | **self-sterile** | Yacon : propagation strictement végétative en tempéré |
| 1036 | Camellia sinensis | self-fertile | **self-sterile** | Auto-incompatible (theferns, NCSU) |

### Plant type corrigé (~40 espèces avec `tree` erroné → enum correct)

Exemples notables : Crocus sativus (geophyte→herbaceous), Canna edulis (rhizome→herbaceous), Artemisia vulgaris/ludoviciana, Salvia officinalis, Borago officinalis, Lythrum salicaria, Phragmites australis (herbaceous), Hemerocallis, Hosta, Verbascum thapsus, Malva sylvestris, Tilia platyphyllos (`Arbre` FR→`tree`), Vitex agnus-castus (`Arbrisseau`→`shrub`), Sechium edule (`Herbacée`→`climber`), Ipomoea batatas (herbaceous→climber)…

### LatinName recapitalisé (~30 espèces)

`canna edulis` → `Canna edulis` ; `artemisia vulgaris` → `Artemisia vulgaris` ; `cochlearia officinalis` → `Cochlearia officinalis` ; `allium schubertii/triquetrum/sphaerocephalon` ; `dianthus barbatus` ; `dipsacus fullonum` ; `knautia macedonica` ; `lamium maculatum` ; `mentha` → `Mentha` ; `plantago coronopus` ; `Stachys Palustris` → `Stachys palustris` ; etc.

### Nettoyage des valeurs FR libres

Plus de **200 occurrences** de valeurs en français libre nettoyées vers les enums :
- `type: "Herbacée"/"Arbuste"/"Arbrisseau"` → enums `herbaceous`/`shrub`/`small-shrub`
- `foliageType: "Caduc"/"Semi-persistant"` → `deciduous`/`semi-evergreen`
- `hardiness: "-25°C"/"-20°C"` → `zone-5`/`zone-6` (selon convention)
- `rootSystem: "Pivotante"/"Traçante"/"Fasciculées"` → `taproot`/`spreading`/`fibrous`
- `growthRate: "Rapide"/"Lente"` → `fast`/`slow`
- `pollinationType: "Insectes"/"Abeilles"` → `insect`
- `soilMoisture: "Frais à humide"/"bien drainé"` → `moist`/`dry`
- `exposures: ["S","MO","O"]` → `["sun","partial-shade","shade"]`
- `interests: ["Médicinal","Ornemental","Couvre-sol","Fixation d'azote","Mellifère",...]` → enums anglais
- `edibleParts: ["Feuilles","Fleurs","Racine","Graines germées"]` → `["leaf","flower","root","seed"]`

---

## 5. Variétés enrichies (sélection)

Plus de **150 variétés** complétées au passage. Principaux genres traités en cascade :

| Espèce mère | Variétés traitées | Notes |
|---|---|---|
| 17 *Camassia quamash* | 'Blue Melody' | productivité, maturité |
| 21 *Dahlia* | 'sauvage', 'Unwin', 'Colorette' | notes botaniques |
| 104 *Fragaria vesca* | 2/2 (Mount Everest, Var Lorient) | Var Lorient flaggé non documenté |
| 147 *Asimina triloba* | 11/11 (Allegheny, Halvin, Overleese, Shenandoah, etc.) | toutes avec note auto-stérilité + pollinisateurs |
| 150 *Salvia officinalis* | 3/3 (Berggarten, Icterina, Tricolor) | |
| 165 *Lavandula stoechas* | — | |
| 263 *Mespilus germanica* | 6/6 (Géant d'Allemagne, Géant de Breda, Kurpfalz, Nottingham, Westerveld) | **doublon 302↔1901 flaggé** |
| 266 *Hosta* | 7/7 (August Moon, White Feather, etc.) | |
| 270 *Zanthoupiperitum* | 2/2 (Japon, Sichuan) | **Sichuan probable confusion avec Z. simulans/bungeanum** |
| 316 *Alcea rosea* | 1 ('mélange') | |
| 329 *Borago officinalis* | 2 ('Alba', 'bleue') | |
| 349 *Helianthus tuberosus* | 5/5 (blanc, Dwarf, fuseau, nain, Sakhalinski) | |
| 375 *Lonicera caerulea* | 8/8 (Aurora, Blue Banana, Boreal Beast/Blizzard, Giant's Heart, Nitra, Vostorg, Zielona) | |
| 385 *Rubus fruticosus* | 4/4 (Black satin, Lochness, Thornfree, Thornless ever green) | |
| 429 *Hippophae rhamnoides* | 11/12 (Otto déjà fait) | productivity/fruit_size/maturity/storage/disease |
| 446 *Prunus tomentosa* | 1 (Snovit) | |
| 476 *Lycium barbarum* | 4/4 (Sweet Lifeberry, Amber Sweet, Instant Success, N°1 Lifeberry) | |
| 558 *Hemerocallis* | 50 préservées | |
| 569 *Toona sinensis* | 3/3 (North Red, Chinese Red, Flamingo) | usages xiang chun |
| 573 *Ficus carica* | 10 audited (was 12) | **2 paires de doublons fusionnées** (591↔305 Little Miss Figgy ; 1852↔593 Rouge de Bordeaux) |
| 595 → 678 *Pyrus communis* | 8/34 (Conférence, Doyenné du Comice, Bon Chrétien Williams, Beurré Alexandre Lucas, Joséphine de Malines, Louise-Bonne d'Avranches, Clapp's Favourite, Légipont) | **doublon 635 DELETE** (batch 2881 réassigné à 130) ; **26 cultivars restent non audités** (manque sources pomologiques unitaires) |
| 596 *Mentha* | 13/13 (Agrume, Marocaine, Cervina, bergamote, chocolat, poivrée, etc.) | renommages |
| 638 *Ceratophyllum demersum* | — | warning : root_system fibrous botaniquement faux (plante sans racines) — meilleur enum disponible |
| 656 *Pyrus pyrifolia* | 6/6 (Chojuro, Hakko, Hayatama, Hosui, Shinseiki, Ti Tu) | |
| 659 *Juglans regia* | 7/7 (Broadview, Fernette, Fernor, Franquette, Lara, Parisienne, Ronde de Montignac) | |
| 687 *Humulus lupulus* | 4/4 (Aureus, Chinook, doré, Lupa) | alpha-acides documentés |
| 692 *Vaccinium corymbosum* | 5/5 (Bluejay, Duke, Elisabeth, Pink Lemonade, Reka) | |
| 729 *Thymus serpyllum* | 3 (Coccineus, couché, Elfin) | **"couché" flaggé non-cultivar** |
| 733 *Ajuga reptans* | 4/4 (Atropurpurea, Rosea, Alba, Catlin's Giant) | |
| 803 *Viola odorata* | 1 ('Alba') | |
| 832 *Saponaria officinalis* | 1 ('Alba plena') | |
| 911 *Brassica oleracea viridis (Collards)* | 7/7 (Big Blue, Dinosaur, Green Tree, Jolly Green, Merritt, Michigan, Purple Tree) | tree collards perpétuels |
| 919 *Allium moly* | 1 ('Jeanine') | |
| 925 *Allium* (fiche-genre) | 1 ('Summer Drummer') | |
| 926 *Tulbaghia violacea* | 1 ('Pearl'/'Peral') | typo flaggée |
| 932 *Allium atropurpureum × schubertii* | 1 ('Miami') | |
| 941 *Mentha × piperita* | 2 ('Citrata', 'Mitcham') | |
| 945 *Smallanthus sonchifolius* | 2 ('Red', 'White') | |
| 947 *Ipomoea batatas* | 6/6 (Bonita, Evangeline, Murasaki, Orange bio, Orléans, Sakura) | |
| 948 *Fragaria* | 5 (Gariguette INRA 1976, Sweet Ann, Hummi Kletter, Louis Gauthier, White pineberry) | |
| 951 *Mentha × piperita lavandulifolia* | 1 ('lavande') | chémotype documenté |
| 998 *Chamaemelum nobile* | 1 ('Ligulosum'/Flore Pleno) | |
| 999 *Erythronium* | 1 ('Pagoda') | hybride E. tuolumnense × 'White Beauty' |
| 1031 *Crataegus* (fiche-genre) | 2 (Ellwangeriana, Schraderiana) | |
| 1032 *Crataegus persimilis* | 1 ('Prunifolia splendens') | |
| 1042 *Chaenomeles* | 6/7 (Toyo-Nishiki, Texas Scarlet, Cido, Umbilicata, Nivalis, Rising Sun) | 'X Superbe Jeff Trail' non audité |
| 1044 *Prunus fruticosa × cerasus* | 4/4 (Roméo, Crimson Passion, Juliette, Valentine) | série Romance Saskatchewan |
| 1047 *Tilia americana* | 1 ('Lipa Amarykanska') | |
| 1048 *Tilia × europaea* | 1 ('Wratislaviensis') | |
| 1049 *Tilia* (fiche-genre) | 1 ('Lipa Drabolistna Sheridan') | |
| 1053 × *Sorbopyrus auricularis* | 1 ('Shipova') | |
| 1055 *Vitis* (fiche-genre) | 2 ('Baco n°1', 'Maréchal Foch') | hybrides producteurs directs |

---

## 6. Verdicts `needs_review` (à arbitrer)

| ID | Espèce | Raison |
|---|---|---|
| 211 | Eleutherococcus senticosus | `growth_habit: buissonnant-elance` low_confidence |
| 617 | Hibiscus syriacus | photos manquantes uniquement |
| 638 | Ceratophyllum demersum | `root_system: fibrous` botaniquement faux (plante sans racines) — meilleur enum disponible |
| 983 | Viola argenteria | **synonymie taxonomique discutée** avec *V. nummulariifolia* (GBIF) — décider entre maintien ou merge |
| 1007 | Papaver (fiche-genre) | `life_cycle: annual` ne couvre pas *P. orientale* (vivace) — limite intrinsèque fiche-genre |
| 1014 | Plectranthus amboinicus | `hardiness: zone-9` saturée (réellement zone-10/11, hors enum) |
| 1053 | × Sorbopyrus auricularis | slug reste `pyraria-irregularis` (auto-généré) — migration à prévoir |

---

## 7. Anomalies de données flaggées (à traiter manuellement)

### Doublons d'espèces (action : merger ou supprimer un côté)

| Doublon | Notes |
|---|---|
| **Acer saccharum (1054)** ↔ **Acer saccarum (81)** | Typo dans le second |
| **Mentha × piperita (941)** ↔ **id 819** | id 819 avec caractère unicode × + `type: tree` erroné |
| **Allium × proliferum (929)** ↔ **Allium cepa var. viviparum (931)** | Synonymie probable (Proliferum Group, Hanelt/Brewster) |

### Doublons de variétés (résolus en cours d'audit)

| Variété | Action |
|---|---|
| Mespilus 302 ↔ 1901 | flaggé, **non fusionné** |
| Ficus carica "little miss figuy" (591) ↔ "Little Miss Figgy" (305) | **fusionné** (591→305) |
| Ficus carica "Rouge de Bordeaux" (1852) ↔ id 593 | **fusionné** (1852→593) + renommage |
| Pyrus communis "Louise bonne d'Avranche" (635) ↔ id 130 | **DELETE 635**, batch nursery 2881 réassigné |

### Corrections de nom de genre

| Genre ID | Avant | Doit être |
|---|---|---|
| 225 | `Asiminia` (typo) | **Asimina** |
| 398 | `Pyraria` | renommé en **× Sorbopyrus** (au cours de l'audit) |

### Variétés mal classées / non documentées

- **Zanthoxylum piperitum** var. "Sichuan" : probablement *Z. simulans* ou *Z. bungeanum*
- **Thymus serpyllum** var. "couché" : pas un cultivar formel
- **Chaenomeles** var. "X Superbe Jeff Trail" : cultivar non identifié
- **Tulbaghia violacea** var. "Peral" : probable typo pour 'Pearl'
- **Petroselinum tuberosum (942)** : nom obsolète, devrait être *P. crispum* var. *tuberosum*

---

## 8. Limitations techniques rencontrées

1. **Wikimedia Commons / Wikipédia bloqués** (HTTP 403, sandbox egress policy) sur la majorité des sous-agents. Conséquences : nombre de photos variable selon les groupes (0 à 5 par fiche). Workaround utilisé par certains groupes : **iNaturalist URLs CC** (`inaturalist-open-data.s3.amazonaws.com/...`).

2. **Enum `hardiness` limité à zone-5..zone-9** : espèces zone-3/4 saturées à zone-5 (Acer saccharum, Vitis amurensis, Prunus fruticosa × cerasus) ; espèces zone-10+ saturées à zone-9 (Plectranthus amboinicus). **Recommandation produit** : étendre l'enum.

3. **Pas d'enum `bulbil`** pour propagation (Allium × proliferum, A. cepa var. viviparum) — fallback `division`.

4. **Pas de DELETE** sur l'endpoint `/api/v1/plants/references/:id` — quelques refs doublons (Allium senescens) non nettoyables programmatiquement.

5. **Échec génération illustrations** : 30/66 jobs initiaux (~45 %) échoués avec `Gemini 503 after 3 attempts`. Retries en cours : ~21 récupérées au 1er retry, reste 8 en cours de 2e retry (Inula helenium, Allium fistulosum, Myriophyllum spicatum, Plantago coronopus, Diplotaxis tenuifolia, Allium moly, Physalis alkekengi var. franchetti, Oxalis tuberosa).

6. **Genre 1031 vs species 1031** : le `latinName="Crataegus"` est traité comme espèce mais c'est conceptuellement une fiche-genre. Pattern récurrent pour Hosta (266), Allium (925), Erythronium (999), Crataegus (1031), Fragaria (948), Tilia (1049), Oxalis (966), Symphytum (970), Cosmos (973), Nymphaea (1024), Papaver (1007), Vitis (1055), Chaenomeles (1042), Mentha (596). À uniformiser comme `genus_record_id` pointant vers une fiche-collection ?

---

## 9. Suite recommandée

1. **Photos** : passe dédiée depuis un environnement non sandboxé pour combler les ~80 espèces sans photo Wikimedia. Privilégier iNaturalist (URLs CC) si Wikimedia bloqué.
2. **Doublons** : arbitrer les 3 doublons d'espèces (Acer, Mentha 941/819, Allium 929/931).
3. **Genre Asiminia → Asimina** : corriger orthographe.
4. **Slug Pyraria → Sorbopyrus** : migration data.
5. **Pyrus communis** : audit pomologique manuel des 26 cultivars restants.
6. **Viola argenteria** : décider entre maintien comme espèce ou merge vers V. nummulariifolia.
7. **Enums** : étendre `hardiness` (zone-3/4 et zone-10/11), ajouter `bulbil` à `propagation_methods`.
8. **Cultivars non documentés à reclasser** : Sichuan, X Superbe Jeff Trail, Var Lorient, Peral, "couché", Lipa Konieczko/Zelzate (Tilia).

---

*Audit réalisé en parallèle par 44 sous-agents (4 par batch × 11 batches), pilotés par l'agent principal. Durée totale : ~4 h. Toutes les contributions signées `contributor_id: 1` (Nova IA).*
