# Semisto Imagegen — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer un skill `semisto-imagegen` qui génère des illustrations on-brand Semisto via Google Gemini Imagen et les upload sur le Drive partagé de l'équipe, en s'appuyant sur un Visual Design System hébergé dans le vault Obsidian.

**Architecture:** Deux fichiers markdown **dans le même répertoire de skill** (compatible cloud). Le **Visual Design System** (`~/.claude/skills/semisto-imagegen/visual-design-system.md`) est la source de vérité opérationnelle (palette, registres, prompts templates, contraintes). Le **SKILL.md** est l'orchestrateur — il dit à Claude de lire le VDS voisin, parser l'intent utilisateur, composer un prompt anglais, appeler Gemini en Python, et uploader sur Drive via le MCP existant. Pas de copie locale, pas de dépendance au vault Obsidian local.

**Tech Stack:** 
- Markdown (skill format Claude Code)
- Python 3 + `google-genai` SDK (appel Gemini)
- MCP `mcp__claude_ai_Google_Drive__*` (upload Drive, déjà connecté à michael@hulet.eu)
- Modèle Gemini : `gemini-3.1-flash-image-preview`

**Spec source :** `docs/superpowers/specs/2026-05-07-semisto-imagegen-design.md`

---

## Task 1: Pré-flight — environnement + accès Drive

Vérifier que tout est en place avant d'écrire quoi que ce soit. Si quelque chose manque, demander à Michael de débloquer.

**Files:** aucun (vérifications uniquement)

- [ ] **Step 1: Vérifier Python 3**

```bash
python3 --version
```
Attendu : `Python 3.10` ou supérieur. Le système actuel est `3.14.3` (vérifié).

- [ ] **Step 2: Installer le SDK google-genai**

```bash
pip3 install google-genai --break-system-packages -q
```
Attendu : pas d'erreur. Vérifier avec `pip3 show google-genai` qui doit afficher la version installée.

- [ ] **Step 3: Vérifier l'accès au folder Drive cible**

Appeler le MCP `mcp__claude_ai_Google_Drive__get_file_metadata` avec `fileId: 13AKVyRfq0nj2FBmVAGfIjuP5f97G4I7x`.

- **Si 200 + métadonnées du folder** → continuer Task 2.
- **Si `Requested entity was not found`** → STOP. Dire à Michael : *"Le folder Drive Semisto `13AKVyRfq0nj2FBmVAGfIjuP5f97G4I7x` n'est pas encore partagé en éditeur avec michael@hulet.eu. Partage-le et relance la tâche."* Attendre confirmation, puis re-tester.

<!-- Step 4 (vault Obsidian) supprimé — le VDS est désormais voisin du skill, pas dans le vault. -->

---

## Task 2: Créer le répertoire du skill

**Files:**
- Create: `~/.claude/skills/semisto-imagegen/`

- [ ] **Step 1: Créer le répertoire**

```bash
mkdir -p ~/.claude/skills/semisto-imagegen/
```

- [ ] **Step 2: Vérifier**

```bash
ls -la ~/.claude/skills/semisto-imagegen/
```
Attendu : répertoire vide (juste `.` et `..`).

---

## Task 3: Écrire le Visual Design System dans le répertoire du skill

Le VDS est le document source-de-vérité que le skill relira avant chaque génération. Il doit être **autonome** (pas de cross-référence à la spec) et **opérationnel** (prêt à être consommé par Claude au runtime).

**Important pour le cloud :** ce fichier est livré **dans le répertoire du skill** (pas dans le vault Obsidian local). Wherever le skill `semisto-imagegen` est installé, le VDS est à côté. Aucune dépendance au vault Obsidian.

**Files:**
- Create: `~/.claude/skills/semisto-imagegen/visual-design-system.md`

- [ ] **Step 1: Écrire le fichier complet avec ce contenu (verbatim sauf adaptations notées)**

````markdown
---
type: visual-design-system
project: Semisto
version: 1.0
created: 2026-05-07
last_updated: 2026-05-07
status: active
sources:
  - Brand Voice Guidelines.md (vault Obsidian Semisto/Brand)
  - Logos carrés (vault Obsidian Semisto/Brand)
  - Spec brainstorm 2026-05-07
---

# Semisto — Visual Design System

Document de référence pour toute génération d'illustration Semisto. À lire **avant chaque génération** par le skill `semisto-imagegen`.

Ce fichier est livré dans le répertoire du skill (`~/.claude/skills/semisto-imagegen/visual-design-system.md`) pour être accessible aussi bien en local que par les routines cloud.

## 1. Identité visuelle (rappel)

- **Voix de marque** : mobilisatrice, poétique, ancrée, joyeuse — archétype "guide-jardinier en bottes boueuses"
- **Logo** : typographique (semisto + food forest, italique serif), 5 fonds carrés (violet main, olive design, rouge academy, orange nursery, navy heroes)
- **Palette nommée Semisto** (palette "fruits") : Artichaud, Vert lime, Croque-poux, Poire, Citron vif, Mangue, Abricot, Pêche, Orange, Grenade, Framboise, Aubergine, Prune, Myrtille, Mûre

### Couleurs des pôles

| Pôle | Couleur | Hex |
|---|---|---|
| Design | Vert artichaud / olive | `#afbd00` |
| Academy | Rouge profond | `#b01a19` |
| Nursery | Orange doré | `#ef9b0d` |
| Heroes | Bleu marine | `#234766` |
| Kids | Rose | (à définir) |
| Edition | Gris-vert | (à définir) |
| Tools | Olive | (à définir) |

## 2. Deux registres principaux

### Style B — aquarelle paysagère narrative

Carnet de naturaliste, lumière dorée, traits doux, scènes vivantes. Pour : hero web, illustrations narratives, récits.

**Anchors stylistiques (toujours dans le prompt B) :**
- "watercolor on cream paper, naturalist sketchbook style"
- "soft golden light, late afternoon or early morning"
- "delicate ink linework with loose watercolor washes"
- "warm earthy palette : sage green, ochre, dusty pink, terracotta"
- "European temperate climate, generic countryside"

### Style A — planche botanique (3 sous-modes)

Référence : Redouté, Curtis Botanical Magazine, Kew. Trait fin à l'encre + aquarelle douce, **fond crème ivoire `#faf8f1`** (jamais blanc pur).

**Anchors stylistiques (toujours dans le prompt A) :**
- "botanical illustration, fine ink linework, delicate watercolor"
- "cream ivory background (#faf8f1), never pure white"
- "natural muted colors from the Semisto fruit palette"
- "scientific accuracy, observational drawing tradition"

| Sous-mode | Description | Format | Usage |
|---|---|---|---|
| **A1** Planche complète | Plante entière + détails (fleur, fruit, feuille, racine), composition multi-éléments, **annotation latine** italique discrète autorisée | 3:4 ou A4 portrait | Fiches plantes, syllabus, éditions |
| **A2** Carte pédagogique | Plante seule, illustration centrée, **pas d'annotation**, composition simple | 1:1 ou 3:4 | Cartes/flashcards d'espèces, vignettes |
| **A3** Picto carré | Trait fin + 1-2 lavis colorés max, fond crème, lisible à 64-200 px, pas d'ombre | 1:1 strict | Syllabus, navigation web, badges |

## 3. Casting des humains (Style B)

- **Diversifié, pas de personnages récurrents** : âges, morphologies, expressions de genre, origines variées
- Cohésion par : palette unifiée, lumière dorée, trait commun, vêtements de terrain (bottes, t-shirts colorés patinés, pantalons usés, gants, chapeaux), posture (mains dans la terre, observation attentive)

## 4. Ancrage géographique

**Europe tempérée générique.** Architecture rurale neutre, paysages variés (vergers, vallons, jardins mélangés, haies champêtres), espèces communes à toute l'Europe, lumière douce, 4 saisons identifiables. **Pas de marqueurs nationaux forts.**

## 5. Constantes — toujours présent

| # | Constante | Portée |
|---|---|---|
| 1 | Diversité d'espèces visible (jamais de monoculture) | A+B |
| 2 | Plantes comestibles ou utiles (pas que ornemental) | A+B |
| 3 | Multi-strate suggéré (au moins 2 niveaux en arrière-plan) | B |
| 4 | Sol vivant (paillage, BRF, feuilles ; jamais de terre nue ou tondue) | B |
| 5 | Lumière douce et naturelle (golden hour, lumière diffuse) | B |
| 6 | Saison identifiable (bourgeons, floraison, fruits, feuilles d'automne) | B |
| 7 | Palette "fruits Semisto" | A+B |
| 8 | Vêtements de terrain (jamais costume) | B |
| 9 | Casting diversifié | B |
| 10 | Fond crème ivoire `#faf8f1` (jamais blanc pur) | A |
| 11 | Annotation latine discrète autorisée sur planches A1 | A1 |

## 6. Exclusions — jamais visible

1. Aucun texte intégré dans l'image (sauf annotation latine sur A1)
2. Aucune monoculture (pas de rangs identiques, pas de pelouse rase)
3. Aucun produit chimique (pulvérisateurs, bidons, granulés, herbicides)
4. Aucun plastique de paillage, toile tissée noire, film agricole
5. Aucune tondeuse, débroussailleuse thermique, motoculteur — outils manuels uniquement
6. Aucune haie taillée au cordeau — haies champêtres libres, cépées, trognes
7. Aucun catastrophisme — pas de désert, friche, incendie ; on montre l'abondance
8. Aucun logo ni marque commerciale visible
9. Aucun visage d'enfant identifiable en gros plan (3/4, profil, dos, ou couvre-chef)
10. Aucun marqueur architectural national fort
11. Aucun rendu "AI generic" (visages symétriques, mains à 6 doigts, lumière irréaliste)
12. Aucun ton militant agressif — pas de poings levés, pas de pancartes

## 7. Matrice combinatoire

```
[Style] + [Sujet] + [Lieu (B)] + [Saison] + [Pôle (optionnel)] + [Émotion (B)] + [Format]
```

| Variable | Valeurs |
|---|---|
| Style | A1, A2, A3, B |
| Sujet (A) | espèce végétale, coupe multi-strates, cycle saisonnier, profil de sol, processus pédagogique, outil/objet |
| Sujet (B) | chantier participatif, formation, observation, récolte, portrait collectif, paysage forêt-jardin, détail sensoriel |
| Lieu (B) | verger établi, forêt-jardin mature, pépinière, plantation en cours, salle de formation, cuisine de plein air |
| Saison | hiver (silhouettes nues), début printemps (bourgeons), floraison (mai), plein été, récolte (août-octobre), automne (couleurs) |
| Pôle | Design (olive), Academy (rouge), Nursery (orange), Heroes (navy), Kids (rose), Aucun |
| Émotion (B) | contemplatif, joyeux/festif, concentré/apprenant, mobilisateur, tendre/sensoriel |
| Format | hero 16:9, panoramique 3:1, vignette 1:1, portrait 3:4, paysage 4:3 |

**Règles :**
- A1, A2, A3, B mutuellement exclusifs (un style par image)
- Saison **obligatoire** pour B
- Pôle **optionnel** — accent dans un objet/vêtement, jamais en filtre global
- Format détermine les dimensions (table section 8)

## 8. Formats par usage

| Usage | Style | Ratio | Dimensions cible |
|---|---|---|---|
| Hero page d'accueil web | B | 16:9 | 1920 × 1080 |
| Hero page de pôle | B (accent pôle) | 16:9 | 1920 × 1080 |
| Bannière site (haut de page) | B | 3:1 | 2400 × 800 |
| Illustration article / blog inline | A1 ou B | 4:3 | 1600 × 1200 |
| Vignette de section / carte | A2 ou B | 1:1 | 1200 × 1200 |
| Fiche plante complète (syllabus) | A1 | 3:4 | 1200 × 1600 |
| Illustration pleine page (édition print) | A1 ou B | A4 portrait | 2480 × 3508 (300 dpi) |
| Diagramme pédagogique (strates, cycle) | A1 | 4:3 | 1600 × 1200 |
| Carte pédagogique d'espèce | A2 | 1:1 ou 3:4 | 1200 × 1200 ou 1200 × 1600 |
| Picto syllabus | A3 | 1:1 | 1024 × 1024 |
| Picto navigation site web | A3 | 1:1 | 512 × 512 |

## 9. Prompts de référence

### Bloc IMPORTANT RULES (toujours en fin de prompt)

```
IMPORTANT RULES:
- NO TEXT integrated in the image (except discrete italic Latin annotation on A1 botanical plates).
  Text is added in post-production.
- Show DIVERSITY of plant species — never a monoculture, never identical rows, never a mowed lawn.
- Plants must be edible or useful — fruits, berries, leaves, roots, edible flowers — not purely ornamental.
- NO chemical products visible — sprayers, pesticide canisters, blue granules, herbicides.
- NO plastic mulch, black woven tarp, or agricultural film.
- NO lawnmower, brushcutter, motorized tiller — manual tools only.
- NO formally trimmed hedges — wild country hedges, coppices, pollard trees.
- NO doom imagery — no deserts, no abandoned wasteland, no fires. Show ABUNDANCE.
- NO commercial logos or brand marks visible on tools, clothing, vehicles.
- NO identifiable child faces in close-up (use 3/4, profile, back, or hat).
- NO strong national architectural markers (generic temperate European countryside only).
- NO "AI generic" rendering — no perfectly symmetrical faces, no 6-fingered hands, no unrealistic turquoise/purple lighting.
- NO aggressive militant imagery — no raised fists, no protest signs. Values are conveyed through abundance.
```

### Template B — aquarelle paysagère

```
Generate an image in hand-painted naturalist watercolor style, like a forager's
sketchbook. Delicate ink linework with loose watercolor washes on cream paper.

[FORMAT] composition.

Scene: [SUBJECT] in [LOCATION], during [SEASON]. [EMOTION] atmosphere.

Characters (if applicable): a diverse group — varied ages, morphologies, gender
expressions, ethnicities. Wearing field clothing : muddy boots, worn colored
t-shirts, used trousers, work gloves, sun hats. Hands in the soil or attentively
observing plants.

Setting: generic temperate European countryside, rural neutral architecture,
multi-strata vegetation visible in the background (canopy + understory + shrubs
+ herbaceous + ground cover), living soil with mulch / leaves / biomass.
Wild country hedges, never trimmed.

Light: soft natural golden hour or diffuse morning light. Never harsh midday sun.

Color palette: warm earthy tones from the Semisto fruit palette — sage artichaut
green, lime, ochre mangue, dusty pink pêche, terracotta grenade, deep aubergine
purple. Muted, never oversaturated.

[POLE_ACCENT — if pole specified : "Subtle navy/red/olive/orange accent on a
single object or piece of clothing — a tool, a t-shirt, a wheelbarrow."]

Hand-painted watercolor aesthetic, warm and inviting atmosphere, sensory and
poetic.

[IMPORTANT RULES BLOCK]
```

### Template A1 — planche botanique complète

```
Generate a botanical illustration in the tradition of Redouté, Curtis Botanical
Magazine, and Kew herbarium plates. Fine ink linework with delicate watercolor
washes on cream ivory paper (#faf8f1, never pure white).

Portrait composition.

Subject: [PLANT SPECIES — Latin name : Common name]. Show the whole plant with
detailed studies of [LEAF/FLOWER/FRUIT/ROOT — as relevant]. Composition arranged
like a 19th century botanical plate — main specimen central, with smaller
detailed studies in the negative space.

Annotation: discrete Latin name in fine italic script at the bottom or beside
the specimen. Optional smaller scientific notes (e.g., scale bar). No other
text.

Color palette: natural muted greens, browns, and accent fruit/flower colors
drawn from the Semisto palette — never oversaturated.

Style: scientific accuracy, observational drawing tradition, delicate brushwork,
traditional botanical art aesthetic.

[IMPORTANT RULES BLOCK — annotation Latin allowed exception]
```

### Template A2 — carte pédagogique d'espèce

```
Generate a botanical illustration of [PLANT SPECIES] in the style of a clean,
centered teaching card. Fine ink linework with delicate watercolor washes on
cream ivory paper (#faf8f1, never pure white).

[1:1 / 3:4] composition, plant centered, breathing room around it.

Subject: a single specimen of [PLANT SPECIES], showing the most representative
form — a flowering branch, a fruiting cluster, or the whole plant if compact.
No additional studies, no annotations, no Latin name.

Color palette: natural muted greens, browns, and accent fruit/flower colors
from the Semisto palette.

Style: simple, clear, pedagogical. The plant is the only subject — readable
and memorable.

[IMPORTANT RULES BLOCK]
```

### Template A3 — picto carré

```
Generate a square pictogram of [SUBJECT — plant / tool / concept] in a
simplified botanical illustration style. Fine ink linework with 1 to 2 small
watercolor color washes from the Semisto palette. Cream ivory background
(#faf8f1).

1:1 strict composition.

Subject: [SUBJECT], reduced to its most essential and recognizable form.
Centered. Minimal detail — must be readable at 64-200 px.

Style: clean, iconographic, but organic and hand-drawn — never flat vector
icon style. No shadow, no gradient, no decorative elements.

Color: 1 or 2 muted color accents maximum. Lots of negative space on the cream
background.

[IMPORTANT RULES BLOCK]
```

## 10. Workflow d'exécution (rappel)

L'utilisateur invoque le skill en français. Le skill :

1. Lit ce VDS
2. Parse l'intent (style, sujet, lieu, saison, pôle, émotion, format)
3. Compose un prompt en anglais à partir du template
4. Appelle Gemini (retry sur 503)
5. Sauve temporairement, upload sur Drive (sous-dossier mensuel YYYY-MM/)
6. Renvoie l'URL Drive et nettoie le local

## 11. Versionnement

Toute modification de ce document = nouvelle version dans le frontmatter (`version`, `last_updated`). Les changements substantiels sont notés en commentaire en haut du fichier sous `### Changelog` (ajouter cette section au premier changement).
````

- [ ] **Step 2: Vérifier le fichier**

```bash
wc -l ~/.claude/skills/semisto-imagegen/visual-design-system.md
```
Attendu : ~250-300 lignes (le contenu ci-dessus).

```bash
head -10 ~/.claude/skills/semisto-imagegen/visual-design-system.md
```
Attendu : voir le frontmatter YAML correctement formé.

- [ ] **Step 3 (optionnel) : Miroir vers le vault Obsidian pour navigation humaine**

Si Michael veut consulter le VDS depuis Obsidian, créer un lien symbolique :

```bash
ln -sf ~/.claude/skills/semisto-imagegen/visual-design-system.md \
       "/Users/michael/Library/CloudStorage/SynologyDrive-mhulet/Obsidian/Second Brain/Semisto/Brand/Semisto - Visual Design System.md"
```

Le skill ne dépend **pas** de ce miroir — c'est un confort de navigation uniquement. Le miroir reflète automatiquement les éditions faites côté skill.

---

## Task 4: Écrire le SKILL.md

**Files:**
- Create: `~/.claude/skills/semisto-imagegen/SKILL.md`

- [ ] **Step 1: Écrire le SKILL.md complet avec ce contenu (verbatim)**

````markdown
---
name: semisto-imagegen
description: >
  Génère des illustrations on-brand pour Semisto via l'API Google Gemini (Imagen).
  Le skill lit le Visual Design System voisin (visual-design-system.md) et produit
  des images cohérentes avec l'univers visuel de Semisto (forêt-jardin, palette
  fruits, registres planche botanique A1/A2/A3 + aquarelle paysagère B). Upload
  vers le Drive partagé Semisto. Compatible local et routines cloud. Invoquer
  en langage naturel : "génère un picto pour le pommier", "j'ai besoin d'un hero
  pour la page Academy", etc.
---

# Semisto — Générateur d'images

## Objectif

Générer des illustrations cohérentes avec l'identité visuelle de Semisto, en respectant le **Visual Design System** voisin (`visual-design-system.md`).

## Prérequis (lus à chaque invocation)

- **Document de référence** : lire le Visual Design System voisin **avant chaque génération** :
  `~/.claude/skills/semisto-imagegen/visual-design-system.md`
  (si l'environnement utilise un préfixe différent, le fichier est à côté de ce SKILL.md)
- **Folder Drive cible** : `13AKVyRfq0nj2FBmVAGfIjuP5f97G4I7x` — doit être partagé en éditeur avec le compte qui a accès au MCP Drive (michael@hulet.eu en local)
- **API** : Google Gemini, modèle `gemini-3.1-flash-image-preview`
- **Clé API** : `AIzaSyDHLN9ZqifSPKsuUBnEZKjeLw8JLyFLeoQ`
- **SDK** : si absent, installer avec `pip3 install google-genai --break-system-packages -q`

## Étapes de génération

### 1. Lire le VDS voisin

Utiliser l'outil Read sur `~/.claude/skills/semisto-imagegen/visual-design-system.md`.

Si l'expansion `~` ne fonctionne pas dans l'environnement courant (certaines routines cloud), tenter ces fallbacks dans l'ordre :
1. `$HOME/.claude/skills/semisto-imagegen/visual-design-system.md`
2. Recherche par glob : `glob.glob("**/skills/semisto-imagegen/visual-design-system.md", recursive=True)` à partir de la racine de session

Si le fichier reste introuvable :

> Le Visual Design System est introuvable. Le skill `semisto-imagegen` doit être installé avec son fichier `visual-design-system.md` voisin. Vérifie que le répertoire du skill contient les deux fichiers.

### 2. Vérifier l'accès au folder Drive (au début de la session)

Appeler `mcp__claude_ai_Google_Drive__get_file_metadata` avec `fileId: 13AKVyRfq0nj2FBmVAGfIjuP5f97G4I7x`.

Si erreur "Requested entity was not found", arrêter avec :

> Le folder Drive Semisto n'est pas accessible depuis le compte michael@hulet.eu. Demande à Michael de partager le folder `13AKVyRfq0nj2FBmVAGfIjuP5f97G4I7x` en éditeur avec michael@hulet.eu, puis relance.

### 3. Parser l'intent utilisateur

À partir de la demande informelle, extraire les variables de la matrice :

| Variable | Inférence |
|---|---|
| **Style** | "picto" → A3 ; "carte / fiche / flashcard" → A2 ; "planche / fiche complète / syllabus" → A1 ; "hero / récit / scène / chantier / formation / paysage" → B |
| **Sujet** | Nom de plante, action, concept mentionné |
| **Lieu (B)** | Inféré du contexte ; sinon "forêt-jardin mature" par défaut |
| **Saison** | Inférée de la date courante ; sinon demander |
| **Pôle** | Mentionné explicitement ("Academy", "Heroes"...) ; sinon aucun |
| **Émotion (B)** | Inférée du ton de la demande ; sinon "contemplatif" par défaut |
| **Format** | Inféré de l'usage ("hero" → 16:9, "picto" → 1:1, "fiche plante" → 3:4) |

Si une variable critique manque et qu'on ne peut pas raisonnablement la déduire, demander à l'utilisateur (une question à la fois). Ne jamais bloquer pour des variables optionnelles (pôle, émotion).

### 4. Composer le prompt en anglais

- Sélectionner le **template du style choisi** depuis le VDS section 9
- Substituer les variables (traduire FR → EN si besoin)
- Ajouter le **bloc IMPORTANT RULES** en fin

### 5. Générer l'image via Gemini (Python via Bash)

Installer le SDK si nécessaire (idempotent) :

```bash
pip3 install google-genai --break-system-packages -q
```

Puis exécuter ce script Python via Bash (substituer `PROMPT_HERE`, `STYLE_HERE` ∈ {a1,a2,a3,b}, `SLUG_HERE` en kebab-case du sujet) :

```python
import os, time, datetime
from google import genai
from google.genai import types

client = genai.Client(api_key="AIzaSyDHLN9ZqifSPKsuUBnEZKjeLw8JLyFLeoQ")

prompt = """PROMPT_HERE"""

for attempt in range(3):
    try:
        response = client.models.generate_content(
            model="gemini-3.1-flash-image-preview",
            contents=prompt,
            config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"])
        )
        break
    except Exception as e:
        if "503" in str(e) and attempt < 2:
            time.sleep(10)
        else:
            raise

os.makedirs("/tmp/semisto-imagegen", exist_ok=True)
ts = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
filename = f"semisto-STYLE_HERE-SLUG_HERE-{ts}.png"
local_path = f"/tmp/semisto-imagegen/{filename}"

for part in response.candidates[0].content.parts:
    if part.inline_data:
        with open(local_path, "wb") as f:
            f.write(part.inline_data.data)
        break

print(f"LOCAL_PATH: {local_path}")
print(f"FILENAME: {filename}")
```

Capturer `local_path` et `filename` depuis stdout.

### 6. Trouver ou créer le sous-dossier mensuel sur Drive

Mois courant au format `YYYY-MM` (ex: `2026-05`).

Chercher le sous-dossier :

`mcp__claude_ai_Google_Drive__search_files` avec query :
```
parentId = '13AKVyRfq0nj2FBmVAGfIjuP5f97G4I7x' and title = 'YYYY-MM' and mimeType = 'application/vnd.google-apps.folder'
```

- Si résultat : récupérer son `id`.
- Si pas de résultat : créer avec `mcp__claude_ai_Google_Drive__create_file` :
  - `title: 'YYYY-MM'`
  - `mimeType: 'application/vnd.google-apps.folder'`
  - `parentId: '13AKVyRfq0nj2FBmVAGfIjuP5f97G4I7x'`

Récupérer le folder id pour l'étape suivante.

### 7. Uploader le PNG sur Drive

Lire le PNG en base64 (via Bash) :

```bash
base64 -i /tmp/semisto-imagegen/FILENAME_HERE | tr -d '\n'
```

Capturer la sortie. Puis appeler `mcp__claude_ai_Google_Drive__create_file` :
- `title`: `filename`
- `parentId`: id du sous-dossier mensuel
- `contentMimeType`: `image/png`
- `base64Content`: la sortie base64
- (optionnel) ajouter le prompt complet en métadonnée — Drive ne stocke pas un champ "description" via cette tool, donc le prompt n'est pas archivé pour le MVP

Récupérer `viewUrl` de la réponse.

### 8. Nettoyer le fichier local

```bash
rm /tmp/semisto-imagegen/FILENAME_HERE
```

### 9. Renvoyer le résultat à l'utilisateur

```
✓ Image générée : [nom court du sujet]
  Style : [A1 / A2 / A3 / B]
  Format : [WxH]
  Drive : [viewUrl cliquable]
```

## Règles critiques (rappel)

1. **Pas de texte dans les images** sauf annotation latine sur A1
2. **Pas de monoculture, pas de produits chimiques, pas de plastique de paillage** (voir VDS section 6 pour la liste complète)
3. **Casting diversifié** sur Style B — jamais de "famille mascotte"
4. **Fond crème ivoire #faf8f1** sur Style A — jamais blanc pur
5. **Pas de copie locale** — le PNG est uniquement sur Drive après l'upload
6. **Toujours en anglais dans le prompt** — l'utilisateur parle français, le prompt Gemini est en anglais

## Exemple complet (référence)

Demande : *"Génère un picto pour le pommier"*

→ Style : **A3**, Sujet : `Malus domestica` (pommier), Format : 1:1
→ Prompt composé (template A3 du VDS, substitué) :

```
Generate a square pictogram of an apple tree (Malus domestica), showing
a single branch with a few leaves and one ripe red apple, in a simplified
botanical illustration style. Fine ink linework with 1 to 2 small watercolor
color washes from the Semisto palette. Cream ivory background (#faf8f1).

1:1 strict composition.

Subject: apple tree branch with one apple, reduced to its most essential
and recognizable form. Centered. Minimal detail — must be readable at 64-200 px.

Style: clean, iconographic, but organic and hand-drawn — never flat vector
icon style. No shadow, no gradient, no decorative elements.

Color: 1 or 2 muted color accents maximum (apple red, leaf green). Lots of
negative space on the cream background.

[IMPORTANT RULES BLOCK]
```

→ Génération, upload sur `13AKVyRfq0nj2FBmVAGfIjuP5f97G4I7x/2026-05/semisto-a3-pommier-20260507-143012.png`, retour à l'utilisateur avec l'URL Drive.
````

- [ ] **Step 2: Vérifier**

```bash
wc -l ~/.claude/skills/semisto-imagegen/SKILL.md
```
Attendu : ~200-220 lignes.

```bash
head -10 ~/.claude/skills/semisto-imagegen/SKILL.md
```
Attendu : voir le frontmatter YAML avec `name: semisto-imagegen` et `description:` (multiligne).

---

## Task 5: Smoke test — première génération

L'objectif est de produire une image et la voir atterrir dans Drive. **Test à exécuter dans une nouvelle conversation Claude Code** (pour valider que le skill se charge correctement depuis zéro).

**Files:** aucun

- [ ] **Step 1: Ouvrir une nouvelle conversation Claude Code**

Lancer `claude` dans n'importe quel répertoire. Le skill doit apparaître dans la liste des skills disponibles.

- [ ] **Step 2: Invoquer le skill avec une demande simple**

Demander : *"Utilise le skill semisto-imagegen pour générer un picto pour le pommier"*

Attendu : Claude lit le VDS, compose un prompt A3 avec le pommier comme sujet, exécute le script Python via Bash, upload sur Drive sous `2026-05/`, renvoie l'URL.

- [ ] **Step 3: Vérifier l'image dans Drive**

Ouvrir l'URL Drive renvoyée. L'image doit :
- Être un picto carré (proche de 1:1, mêmes hauteur/largeur)
- Avoir un **fond crème ivoire** (pas blanc pur, pas blanc cassé légèrement bleuté — visuellement chaud)
- Montrer une **branche/feuille/pomme reconnaissable** au centre
- Avoir un **trait d'encre fin** + 1-2 lavis colorés max
- **Pas de texte** dans l'image
- **Pas de logo** ni marque
- Être **lisible** réduit à 100×100 px (test : zoom out dans Drive)

- [ ] **Step 4: Documenter l'écart si quality issue**

Si l'image rate sur un point :
- Si fond blanc au lieu de crème → renforcer "cream ivory background, NEVER white" dans le template A3 du VDS
- Si style trop "flat vector icon" → renforcer "hand-painted watercolor, observational drawing, NOT vector graphics"
- Si texte parasite → revoir le bloc IMPORTANT RULES (texte le plus en évidence)
- Si plante non reconnaissable → enrichir la description du sujet (ajouter détails distinctifs)

Faire l'édition dans le VDS (pas dans le SKILL.md) puis re-tester.

- [ ] **Step 5: Si OK, dire à Michael que le skill est prêt**

Message : *"Skill `semisto-imagegen` opérationnel. Premier test réussi : pommier picto A3 → URL Drive. Tu peux maintenant l'invoquer en langage naturel : 'génère un hero pour la page Academy en mai', 'fais-moi une planche botanique du sureau', etc."*

---

## Task 6 (optionnelle): Itérer sur la qualité après plusieurs générations

À faire **après une dizaine de générations réelles** sur des sujets variés, pour identifier les biais récurrents.

**Files:**
- Modify: `/Users/michael/Library/CloudStorage/SynologyDrive-mhulet/Obsidian/Second Brain/Semisto/Brand/Semisto - Visual Design System.md`

- [ ] **Step 1: Auditer les 10 dernières images**

Ouvrir le folder Drive `13AKVyRfq0nj2FBmVAGfIjuP5f97G4I7x/YYYY-MM/`, regarder les 10 dernières. Lister les écarts récurrents (ex: "lumière trop dorée artificielle 3 fois", "les humains ont tendance à se ressembler", "la palette dérive vers le saturé").

- [ ] **Step 2: Mettre à jour le VDS**

Renforcer les anchors stylistiques ou les exclusions selon les écarts. Bumper la version dans le frontmatter (`version: 1.1`, `last_updated: YYYY-MM-DD`).

- [ ] **Step 3: Documenter le changelog**

Ajouter une section `### Changelog` en haut du VDS (après le frontmatter) avec :
```markdown
### Changelog
- 1.1 (YYYY-MM-DD) : renforcement de [X] suite à audit de 10 générations
```

---

## Self-Review checklist

Avant de marquer le plan comme prêt, l'auteur a vérifié :

- [x] **Spec coverage** : chaque section de la spec (1-12) est implémentée par une tâche
  - Identité visuelle → Task 3 (VDS section 1)
  - Deux registres → Task 3 (VDS section 2)
  - Casting → Task 3 (VDS section 3)
  - Ancrage → Task 3 (VDS section 4)
  - Constantes → Task 3 (VDS section 5)
  - Exclusions → Task 3 (VDS section 6)
  - Matrice → Task 3 (VDS section 7)
  - Formats → Task 3 (VDS section 8)
  - Templates prompts → Task 3 (VDS section 9)
  - Structure technique → Task 4 (SKILL.md complet)
  - VDS minimal → Task 3
  - Critères de succès → Task 5 (smoke test)
  - Compatibilité cloud → Task 3 + Task 4 (VDS voisin du skill, fallbacks de chemin documentés)
- [x] **Pas de placeholder** : tous les chemins sont absolus, tous les contenus sont fournis verbatim
- [x] **Cohérence des types** : `style` ∈ {a1, a2, a3, b} partout, `pôle` ∈ {design, academy, nursery, heroes, kids, none} partout
- [x] **Folder ID Drive constant** : `13AKVyRfq0nj2FBmVAGfIjuP5f97G4I7x` partout
- [x] **Clé API constante** : `AIzaSyDHLN9ZqifSPKsuUBnEZKjeLw8JLyFLeoQ` partout
- [x] **Path VDS constant** : `~/.claude/skills/semisto-imagegen/visual-design-system.md` dans Task 3 et Task 4 (fichier voisin du SKILL.md, compatible cloud)
