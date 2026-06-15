# Semisto — Visual Design System & skill `semisto-imagegen`

## Méta

- Date : 2026-05-07
- Auteur : Michael Hulet, brainstormé avec Claude Opus 4.7
- Objectif : produire des illustrations cohérentes avec l'identité Semisto via Google Gemini Imagen, à partir d'un Visual Design System de référence
- Sources : `Semisto - Brand Voice Guidelines.md` (vault Obsidian), logos carrés, semisto.org, skill `petit-kiwi-imagegen` (modèle structurel)

## Résumé

Créer un skill Claude Code `semisto-imagegen` qui génère des images on-brand pour Semisto en suivant un Visual Design System hébergé dans le vault Obsidian de l'équipe. Le skill couvre deux registres principaux (planche botanique en trois sous-modes A1/A2/A3, et aquarelle paysagère narrative B), avec une matrice combinatoire (style, sujet, lieu, saison, pôle, émotion, format), un ensemble de constantes et d'exclusions strictes, et une intégration directe vers un dossier Google Drive partagé avec l'équipe Semisto.

---

## 1. Identité visuelle Semisto (rappel des fondations)

Validé par les Brand Voice Guidelines :

- **Voix** : mobilisatrice, poétique, ancrée, joyeuse — archétype "guide-jardinier en bottes boueuses"
- **Logo** : typographique (semisto + food forest, italique serif), décliné en 5 fonds carrés (violet main, olive design, rouge academy, orange nursery, navy heroes)
- **Palette nommée** : Artichaud, Vert lime, Croque-poux, Poire, Citron vif, Mangue, Abricot, Pêche, Orange, Grenade, Framboise, Aubergine, Prune, Myrtille, Mûre
- **Couleurs des pôles** :

  | Pôle | Couleur | Hex |
  |---|---|---|
  | Design | Vert artichaud / olive | `#afbd00` |
  | Academy | Rouge profond | `#b01a19` |
  | Nursery | Orange doré | `#ef9b0d` |
  | Heroes | Bleu marine | `#234766` |
  | Kids | Rose | (à définir) |
  | Edition | Gris-vert | (à définir) |
  | Tools | Olive | (à définir) |

- **Typographies** : Allotrope + Sole Serif (print) ; Inter + Cera + Cormorant Garamond (web)
- **Règles de fond** : blanc, beige clair, vert pâle ou photo nature ; jamais de fond coloré uni saturé

---

## 2. Deux registres principaux

### Style B — aquarelle paysagère narrative

Carnets de naturaliste, lumière dorée, traits doux. Évoque l'expérience vécue d'un·e jardinier·e dans sa forêt-jardin. Pour : hero web, illustrations narratives, récits.

**Anchors stylistiques (à inclure dans tous les prompts B) :**
- "watercolor on cream paper, naturalist sketchbook style"
- "soft golden light, late afternoon or early morning"
- "delicate ink linework with loose watercolor washes"
- "warm earthy palette : sage green, ochre, dusty pink, terracotta"
- "European temperate climate, generic countryside"

### Style A — planche botanique (trois sous-modes)

Référence : Redouté, Curtis Botanical Magazine, Kew. Trait fin à l'encre + aquarelle douce, fond crème ivoire (`#faf8f1`, jamais blanc pur).

**Anchors stylistiques (à inclure dans tous les prompts A) :**
- "botanical illustration, fine ink linework, delicate watercolor"
- "cream ivory background (#faf8f1), never pure white"
- "natural muted colors from the Semisto fruit palette"
- "scientific accuracy, observational drawing tradition"

#### Sous-mode A1 — planche complète

Plante entière + détails (fleur, fruit, feuille, parfois racine), composition multi-éléments, **annotation latine** en italique discrète autorisée (exception à la règle "no text"). Pour : fiches plantes complètes, syllabus, éditions. Format 3:4 ou A4 portrait.

#### Sous-mode A2 — carte pédagogique d'espèce

Plante seule, illustration centrée, **pas d'annotation**, composition simple et claire. La plante "respire" sur le fond crème. Pour : cartes/flashcards d'espèces, vignettes pédagogiques. Format 1:1 ou 3:4.

#### Sous-mode A3 — picto carré

Trait fin à l'encre + 1-2 lavis colorés (palette fruits maximum). Détail minimal, lisible à 64-200 px. Centré, fond crème net, pas d'ombre. Pour : syllabus, navigation web, badges, légendes. **Format 1:1 strict.**

---

## 3. Casting des humains (Style B uniquement)

**Décision** : casting diversifié, pas de personnages récurrents.

- Pas de "famille mascotte" comme Petit Kiwi — ne convient pas à la voix Semisto qui cite des vraies personnes (Christophe Wautier, Wouter Van Eck, Mickaël Teerlinck…)
- Diversité d'âges, morphologies, expressions de genre, origines, dans tout groupe représenté
- Cohésion stylistique via : palette unifiée, lumière dorée, trait commun, vêtements de terrain (bottes, t-shirts colorés patinés, pantalons usés, gants, chapeaux), posture (mains dans la terre, attentive observation)

---

## 4. Ancrage géographique

**Décision** : Europe tempérée générique.

- Architecture rurale neutre européenne (pas de marqueurs nationaux forts — pas de fermes carrées wallonnes spécifiques, pas de toits provençaux)
- Paysages variés : vergers, vallons, jardins mélangés, haies champêtres
- Espèces tempérées communes à toute l'Europe
- Climat : lumière douce, 4 saisons identifiables

Cohérent avec la vision Semisto pan-européenne ("transformer l'Europe en mosaïque de forêts comestibles").

---

## 5. Constantes — toujours présent

Si l'élément n'est pas là, l'image rate.

| # | Constante | Portée |
|---|---|---|
| 1 | Diversité d'espèces visible (jamais de monoculture) | A+B |
| 2 | Plantes comestibles ou utiles (pas que ornemental) | A+B |
| 3 | Multi-strate suggéré (au moins 2 niveaux en arrière-plan) | B |
| 4 | Sol vivant (paillage, BRF, feuilles mortes ; jamais de terre nue ou tondue) | B |
| 5 | Lumière douce et naturelle (golden hour, lumière diffuse ; jamais zénithal dur) | B |
| 6 | Saison identifiable (bourgeons, floraison, fruits, feuilles d'automne, neige) | B |
| 7 | Palette "fruits Semisto" extraite de la palette nommée | A+B |
| 8 | Vêtements de terrain (bottes, t-shirts colorés, gants, chapeaux ; jamais costume) | B |
| 9 | Casting diversifié (âges, morphologies, expressions de genre, origines) | B |
| 10 | Fond crème ivoire (`#faf8f1`) sur planches botaniques (jamais blanc pur) | A |
| 11 | Annotation latine discrète autorisée sur planches A1 (italique fin) | A1 |

---

## 6. Exclusions — jamais visible

Si l'élément apparaît, on régénère.

1. Aucun texte intégré dans l'image (sauf annotation latine sur A1)
2. Aucune monoculture (pas de rangs identiques, pas de pelouse rase)
3. Aucun produit chimique (pulvérisateurs, bidons, granulés, herbicides)
4. Aucun plastique de paillage, toile tissée noire, film agricole
5. Aucune tondeuse, débroussailleuse thermique, motoculteur — outils manuels uniquement
6. Aucune haie taillée au cordeau — haies champêtres libres, cépées, trognes
7. Aucun catastrophisme — pas de désert, friche dévastée, incendie ; on montre l'abondance
8. Aucun logo ni marque commerciale visible sur outils, vêtements, véhicules
9. Aucun visage d'enfant identifiable en gros plan (3/4, profil, dos, ou couvre-chef)
10. Aucun marqueur architectural national fort (rester "Europe tempérée générique")
11. Aucun rendu "AI generic" (visages symétriques parfaits, mains à 6 doigts, lumière irréaliste turquoise/violet)
12. Aucun ton militant agressif — pas de poings levés, pas de pancartes ; les valeurs passent par l'abondance

---

## 7. Matrice combinatoire

Construire un prompt à partir de :

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

**Règles de combinaison :**

- A1, A2, A3, B sont **mutuellement exclusifs** dans une même image (jamais de mélange botanique + paysager)
- Saison **obligatoire** pour B (jamais de paysage "intemporel")
- Pôle **optionnel** — si défini, l'accent couleur apparaît dans un objet ou vêtement (ex: brouette navy pour Heroes, écharpe rouge pour Academy), pas en filtre global
- Format détermine les dimensions de sortie (voir section 8)

---

## 8. Formats par usage

| Usage | Style | Ratio | Dimensions cible |
|---|---|---|---|
| Hero page d'accueil web | B | 16:9 | 1920 × 1080 |
| Hero page de pôle | B (accent pôle) | 16:9 | 1920 × 1080 |
| Bannière site (haut de page) | B | 3:1 | 2400 × 800 |
| Illustration article / blog inline | A1 ou B | 4:3 | 1600 × 1200 |
| Vignette de section / carte | A2 ou B | 1:1 | 1200 × 1200 |
| Fiche plante complète (syllabus, édition) | A1 | 3:4 | 1200 × 1600 |
| Illustration pleine page (édition print) | A1 ou B | A4 portrait | 2480 × 3508 (300 dpi) |
| Diagramme pédagogique (strates, cycle) | A1 | 4:3 | 1600 × 1200 |
| **Carte pédagogique d'espèce végétale** | A2 | 1:1 ou 3:4 | 1200 × 1200 ou 1200 × 1600 |
| **Picto syllabus (concept, espèce, outil)** | A3 | 1:1 | 1024 × 1024 |
| **Picto navigation site web** | A3 | 1:1 | 512 × 512 |

Note : la résolution réelle dépend du modèle Gemini. La dimension cible sert au prompt (`"horizontal 16:9 composition"`, etc.) et au rendu final via redimensionnement après génération si nécessaire.

---

## 9. Prompts de référence (templates)

Chaque template inclut **obligatoirement** le bloc de règles communes :

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

[FORMAT] composition. [DIMENSIONS_HINT]

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

Portrait composition. [DIMENSIONS_HINT]

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

1:1 strict composition. [DIMENSIONS_HINT — 512 or 1024 px square]

Subject: [SUBJECT], reduced to its most essential and recognizable form.
Centered. Minimal detail — must be readable at 64-200 px.

Style: clean, iconographic, but organic and hand-drawn — never flat vector
icon style. No shadow, no gradient, no decorative elements.

Color: 1 or 2 muted color accents maximum. Lots of negative space on the cream
background.

[IMPORTANT RULES BLOCK]
```

---

## 10. Structure technique du skill

### Localisation et fichiers

| Élément | Chemin |
|---|---|
| Skill | `~/.claude/skills/semisto-imagegen/SKILL.md` |
| Visual Design System (source de vérité) | `~/.claude/skills/semisto-imagegen/visual-design-system.md` (fichier voisin du SKILL.md) |
| Sortie images | Google Drive folder ID `13AKVyRfq0nj2FBmVAGfIjuP5f97G4I7x` |

Le VDS est livré **dans le répertoire du skill** (pas dans le vault Obsidian local) pour être accessible aussi bien en local qu'en mode cloud (routines automatisées). Aucune dépendance au vault Obsidian au runtime. Un miroir symbolique vers le vault peut être créé pour le confort de navigation humaine, mais le skill ne dépend pas de son existence.

### API Google Gemini

- **Modèle** : `gemini-3.1-flash-image-preview` (Nano Banana 2 / Imagen)
- **SDK** : `google-genai` (Python). Installer si absent : `pip install google-genai --break-system-packages -q`
- **Clé API** : réutilisation de la clé Petit Kiwi `AIzaSyDHLN9ZqifSPKsuUBnEZKjeLw8JLyFLeoQ` (même compte Google)
- **Retry** : jusqu'à 3 tentatives sur erreur 503 (modèle surchargé), avec attente 10 s entre chaque

### Sortie : Google Drive partagé (uniquement)

- **Folder cible** : `13AKVyRfq0nj2FBmVAGfIjuP5f97G4I7x`
- **Pas de copie locale** — l'image est uniquement uploadée sur Drive, le skill renvoie l'URL Drive en sortie
- **Sous-dossiers par mois** : si `YYYY-MM/` n'existe pas, le skill le crée à la première exécution du mois
- **Naming** : `semisto-{style}-{slug}-{YYYYMMDD-HHMMSS}.png`
  - `style` ∈ {a1, a2, a3, b}
  - `slug` = sujet en kebab-case (ex: `chantier-eghezee-printemps`, `prunus-avium`)
  - timestamp inclus pour éviter les collisions
- **Métadonnées Drive** :
  - `description` : prompt utilisé (pour traçabilité)
  - `alt` (Drive ne supporte pas alt natif, mais on peut stocker dans `description`)

### Pré-requis utilisateur

- **Le folder Drive `13AKVyRfq0nj2FBmVAGfIjuP5f97G4I7x` doit être partagé avec `michael@hulet.eu` en éditeur** (le MCP Google Drive est connecté à ce compte, pas à `michael@semisto.org`).
- Ce partage est manuel — à faire une fois avant la première exécution. Le skill doit échouer proprement avec un message clair si l'accès n'est pas accordé.

### Workflow d'exécution

L'utilisateur invoque le skill en langage naturel (français typiquement) avec une demande informelle, par exemple "génère-moi une carte pédagogique pour le pommier" ou "j'ai besoin d'un hero pour la page Academy, ambiance formation en mai".

1. **Parser l'intent utilisateur** : extraire les variables de la matrice (style, sujet, lieu, saison, pôle, émotion, format) en posant les questions manquantes uniquement si l'ambiguïté empêche la génération. Demande par défaut = Style B en 16:9 si la demande est vague et orientée "page web" / "hero" / "récit". Demande pour une "fiche plante" / "carte espèce" / "picto" → Style A1/A2/A3 selon le contexte.
2. **Lire le VDS** depuis le vault Obsidian (chemin fixe ; échec clair si fichier manquant)
3. **Composer le prompt en anglais** selon le template du style choisi, en injectant systématiquement le bloc IMPORTANT RULES. La traduction des variables (sujets, lieux français → anglais) est gérée en interne ; l'utilisateur ne voit jamais d'anglais.
4. **Appeler Gemini** avec retry sur 503
5. **Sauver temporairement** dans `/tmp/semisto-imagegen/{filename}` (cleanup automatique après upload)
6. **Vérifier ou créer le sous-dossier mensuel** `YYYY-MM/` dans le folder Drive cible
7. **Uploader sur Drive** avec métadonnées (prompt en `description`)
8. **Retourner l'URL Drive** + les métadonnées (style, sujet, slug, dimensions)
9. **Nettoyer** le fichier local

### Erreurs gérées explicitement

- VDS manquant ou non lisible → message d'erreur clair pointant vers le path attendu
- Clé API invalide → message de l'API remonté tel quel
- 503 sur 3 tentatives → erreur explicite avec mention du modèle surchargé
- Folder Drive inaccessible (pas partagé) → message clair pointant vers la procédure de partage

### Hors scope (MVP)

- Pas d'intégration Notion / Super.so / Substack — l'utilisateur copie/colle manuellement vers ces destinations depuis l'URL Drive
- Pas de génération en lot (1 image par invocation pour ce MVP)
- Pas d'édition / inpainting d'images existantes (génération uniquement)
- Pas de génération depuis Buffer / Slack / etc. — invocation uniquement via Claude Code, par l'utilisateur

---

## 11. Contenu d'un VDS minimal (livré avec le skill à l'implémentation)

Le VDS est dérivé directement de cette spec mais structuré pour usage opérationnel :

1. Métadonnées (date, version, sources)
2. Synthèse identité (rappel des fondations)
3. Matrice combinatoire (table)
4. Constantes & exclusions (listes)
5. Prompts de référence (templates A1/A2/A3/B)
6. Formats par usage (table)
7. Anchors stylistiques (par style)
8. Exemples annotés (à enrichir au fur et à mesure des générations)

Le VDS est versionné via le frontmatter (`version`, `last_updated`) et un changelog en haut du fichier. Si le skill est sous gestion de configuration (Git, MCP package, etc.), les modifications du VDS suivent ce versioning.

---

## 12. Critères de succès

- À partir d'une demande informelle ("génère-moi une image pour la page Academy"), le skill produit une image cohérente avec l'identité Semisto, sans intervention manuelle de prompt engineering
- Trois générations indépendantes sur le même sujet produisent trois images stylistiquement homogènes (même main, même palette, même registre)
- Les exclusions sont respectées dans 95%+ des générations (validation à l'œil sur un échantillon de 20 images)
- Le VDS est lisible et modifiable par un humain non-développeur dans Obsidian
- Le folder Drive reste organisé (sous-dossiers par mois) sans intervention manuelle
