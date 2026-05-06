# Plant Cards — Design

**Date**: 2026-05-06
**Status**: Draft

## Goal

Generate printable A6 recto-verso plant identity cards from the Plant Database,
usable in nursery work, training sessions, and forest garden design. Each card
carries a QR code linking to a public web page (`/s/:slug`) presenting the full
fiche.

Cards are deliberately **structurally identical** across species: same blocks
in the same positions, with placeholders when data is missing. This consistency
lets users stack, fan out, and scan a set of cards to compose plant
combinations by season, strate, ecosystem service, etc.

## Scope

### In scope

- New model fields on `Plant::Species` to capture forest-garden-design
  information (strate, successional role, growth speed, lifespan,
  pollination distance, soil pH, eco services/needs, resource parts,
  cautions).
- Server-rendered HTML view at `/plants/species/:id/card` rendering one card
  recto + verso to fit A6 print via CSS `@page`.
- Batch print at `/plants/cards?ids=1,2,3,...` rendering 4 cards per A4 in 2×2
  grid with cut marks, including duplex-aware verso layout.
- Public web page at `/s/:slug` (no auth) presenting the fiche complete.
- QR code generation (server-side SVG) on each card.
- "Imprimer la fiche" / "Imprimer les fiches" buttons in the existing Plant
  Database admin UI.
- SVG icon library (plant silhouettes, root systems, eco services, resources,
  pollination states, etc.) as inline `<symbol>` defs in a Rails partial.

### Out of scope (deferred)

- Pre-rendered PDF generation (wicked_pdf, headless Chrome). HTML print is
  sufficient for v1; a PDF layer can be added later without re-architecting.
- Programmatic batch export (CSV/PDF download). Manual print only for now.
- AI-generated decorative pictograms (Freepik / Imagen). v1 ships with
  hand-drawn line-art SVG; finalised pictograms come later.
- Rich admin form to edit every new field at once. Tabbed reorganisation of
  `SpeciesFormModal` deferred to a follow-up.
- Variety-level cards. Cards are at species level only in v1; varieties would
  inherit species data with overrides.

## Architecture

### Tech stack

- **Card view**: server-rendered HTML/ERB (no Inertia), printed via
  browser print dialog. CSS `@page { size: A6; margin: 0 }` for sizing.
  Browser handles "Save as PDF" if the user wants a file.
- **Batch view**: same approach, A4 page with 2×2 A6 grid + cut marks.
- **Public page**: Inertia React page, added to the no-shell allowlist
  (consistent with other public pages like `Auth/Login`,
  `Design/ClientPortal`).
- **QR**: gem `rqrcode ~> 2.2`, SVG output inlined in HTML.
- **Slug**: latin name slugified
  (`Amelanchier canadensis → amelanchier-canadensis`). Since the database is
  on a path to multilingual (per-locale common names), the latin name is the
  language-independent canonical identifier, so the slug stays stable across
  locales.

### Card visual layout

A6 size: 105 × 148 mm. At 96 dpi this is **396 × 558 px** (used in CSS
mockups). Universal scale: `1 m = 33 px`, `1 m 70 human = 56 px`.

#### Recto

Top to bottom:

1. **Strate color bar** — full-width, 6 px high, color from strate palette.
2. **Header** — common name (Sole Serif 28 px), latin name (italic,
   sentence case, 12 px), 3 badges in a row (`strate`, `cycle`,
   `successional_role`), 2 dim-lines:
   - Line 1: `↕ height-min–height-max m · ↔ spread-min–spread-max m · ⇿ Espacement N m`
   - Line 2: `🐇/🚶/🐢 Croissance X · ⏳ N–M ans · {growth_habit label}`
3. **Hardiness tag** — top-right, `❄ −X °C` (translated from USDA zone).
4. **Hero photos** — split 50/50, 130 px tall, role=`flower` left,
   role=`fruit` right. Each labelled "FLORAISON" / "FRUIT". Hatched
   placeholder if photo missing.
5. **Cross-section** at bottom (270 px), full-bleed left/right.
   - Above-ground (160 px): plant silhouette anchored to ground line at
     `1/4 card width` (trunk x ≈ 99 px), human silhouette (28 × 56 px) at
     left edge `left: 6 px`. Plant SVG height = `height_max_m × 33 px`.
     Mask gradient: full opacity for first 150 px from ground line, fades to
     alpha 22 % above. For tall species (oak, etc.) the silhouette extends as
     a watermark across the full card.
     **3 sky-tiles** on the right (145 px wide column, vertical stack):
     Feuillage (leaf icon — 4 fill states) / Soleil (sun icon — 3 fill states) /
     Eau (drop icon with digit 0–5 inside).
   - Below-ground (110 px): brown earth gradient. Roots SVG (5 templates by
     `root_system`) on the left, 3 horizontal scale tracks on the right
     (Texture / Humus / pH), and a `Racines: TRAÇANTES · drageonnant` label
     in the corner.

#### Verso

1. **Strate color bar** — same as recto.
2. **Header** — common name + latin (compact).
3. **Calendar** — single row of 12 cells with month letters (J F M A M J J A
   S O N D) inside. Empty = light gray bg + gray letter, `flow` = green
   `#AFBD00` + white letter, `harv` = orange `#EF9B0D` + white letter, `both`
   (overlap) = vertical split bg + white letter. Legend below, right-aligned.
4. **Pollinisation section** — pink-tinted block (`#fdf2f8` bg, left border
   `#EC4899`). Big fertility icon left, "Statut" + value, separator,
   then 2 fact rows (vector + specific pollinators, croisement distance).
5. **Système écosystémique** — section title with legend
   (`● Service / ● Besoin / ◐ 2 en 1`). Grid 6×N of pictograms, each
   with 4 states:
   - Inactive — gray
   - Service — green stroke
   - Besoin — violet stroke
   - 2 en 1 — left half green / right half violet (clip-path on doubled SVG)
6. **Ressources** — Caragana-style: 3-column grid of resource icons (line
   art) with the **plant parts** below each (e.g. "Fruit, fleur" under
   Comestible). Inactive resources show a `—`.
7. **Bandeau d'avertissements** — conditional, amber `#FEF3C7` bg + amber
   left border. Shows only if any of {`is_drageonnant`, toxicity,
   allelopathy, invasive} is set. E.g. `⚠ Drageonne · Toxique brebis (graines)`.
8. **QR code** — bottom-right corner, 50 × 50 px.
9. **Signature** — bottom-left:
   - Line 1: `Fiche réalisée par **Semisto**` (italic, gray)
   - Line 2: `plantes.semisto.org` (regular, slightly stronger gray)

### Strate color palette

| Strate (DB id) | Label FR | Range | Color |
|---|---|---|---|
| `low` | Basse | < 50 cm | `#C8E6A0` |
| `medium` | Médiane | 50 cm – 2 m | `#8FBC4F` |
| `shrub` | Arbrisseau | 2 – 5 m | `#5A9A2F` |
| `tree` | Arbre | 5 – 10 m | `#2D7A1F` |
| `canopy` | Canopée | > 10 m | `#1B4D14` |
| `vine` | Grimpante | — | `#B45F8E` |
| `aquatic` | Aquatique | — | `#4A90C2` |
| `subterranean` | Racinaire | — | `#8B5A3C` |

### Successional role palette

| Role (DB id) | Label FR | Color |
|---|---|---|
| `pioneer` | Pionnier | `#E07A47` (terra cotta) |
| `nurse` | Nourricier | `#B8916A` (honey/tan) |
| `climax` | Climax | `#1B4D52` (deep teal) |

### Cycle palette (existing)

| Cycle (DB id) | Label FR | Color |
|---|---|---|
| `annual` | Annuelle | `#F4D35E` |
| `biennial` | Bisannuelle | `#EE964B` |
| `perennial` | Vivace | `#274C77` |

### Hardiness conversion

Display formula: `T_min_°C = case usda_zone; when 3 then -40; when 4 then -34;
when 5 then -29; when 6 then -23; when 7 then -18; when 8 then -12; when 9 then
-7; when 10 then -1; end`. Existing `hardiness` column stays in USDA notation
(`zone-5`); the conversion happens at view time.

## Data Model

All new columns are **nullable** for backwards compatibility. Existing data
remains valid; cards render with placeholders when data is missing.

### Migration — `add_card_fields_to_plant_species`

```ruby
class AddCardFieldsToPlantSpecies < ActiveRecord::Migration[8.1]
  def change
    # Identité forestière
    add_column :plant_species, :strate, :string
    add_column :plant_species, :successional_role, :string

    # Temporel
    add_column :plant_species, :lifespan_min_years, :integer
    add_column :plant_species, :lifespan_max_years, :integer

    # Spatial
    add_column :plant_species, :planting_spacing_cm, :integer

    # Sol
    add_column :plant_species, :soil_ph, :jsonb, default: [], null: false
    add_column :plant_species, :soil_texture, :jsonb, default: [], null: false

    # Pollinisation
    add_column :plant_species, :pollination_distance_m, :integer
    add_column :plant_species, :specific_pollinators, :jsonb, default: [], null: false

    # Précautions
    add_column :plant_species, :is_drageonnant, :boolean, default: false, null: false
    add_column :plant_species, :toxicity, :jsonb, default: {}, null: false
    add_column :plant_species, :allelopathy, :string, default: "", null: false

    # Eco services / besoins (vocabulaire partagé)
    add_column :plant_species, :eco_services_provided, :jsonb, default: [], null: false
    add_column :plant_species, :eco_services_needed, :jsonb, default: [], null: false

    # Resources : parties par usage
    add_column :plant_species, :resource_parts, :jsonb, default: {}, null: false

    # Indices utiles
    add_index :plant_species, :strate
    add_index :plant_species, :successional_role

    # Index expression sur le slug pour la route publique /s/:slug
    add_index :plant_species, "lower(replace(latin_name, ' ', '-'))",
              name: 'index_plant_species_on_slug'
  end
end
```

### Existing fields kept as-is

- `latin_name`, `common_names_fr` (will be supplemented by `common_names_en`,
  etc. when DB goes multilingual)
- `plant_type`, `growth_habit`, `foliage_type`, `fertility`,
  `pollination_type`
- `height_min_cm`, `height_max_cm`, `spread_min_cm`, `spread_max_cm`
- `flowering_months`, `harvest_months`, `fruiting_months`
- `hardiness`, `watering_need` (extend allowed values to include `0`)
- `soil_types` (kept as additional info), `soil_moisture`, `soil_richness`
- `root_system`, `growth_rate` (the helper renders `growth_rate='fast'` as
  `🐇 Croissance rapide` on the card; no new column needed)
- `edible_parts`, `medicinal_rating`, `edible_rating`, `fragrance`,
  `fodder_qualities`, `transformations` (kept; not used directly on card but
  surfaced on public web page)

### Existing fields restructured (data migration deferred to phase E)

- `interests` (mixed bag) and `ecosystem_needs` (mislabeled) are **not used
  on the card**. Phase E adds a one-shot `bin/rake plants:migrate_interests`
  task that splits them into `eco_services_provided`, `eco_services_needed`,
  and `resource_parts` based on heuristics + a manual review step.

### Vocabulary — `eco_services_*`

Shared vocabulary for both `eco_services_provided` and `eco_services_needed`,
stored as arrays of string IDs:

| ID | Label FR | Card icon |
|---|---|---|
| `windbreak` | Brise-vent | `e-windbreak` |
| `mellifere` | Mellifère | `e-melli` |
| `birds` | Oiseaux | `e-bird` |
| `beneficial-insects` | Auxiliaires | `e-aux` |
| `erosion-control` | Anti-érosion | `e-erosion` |
| `light-shade` | Ombre légère | `e-shade` |
| `nitrogen` | Azote | `e-nitrogen` |
| `ground-cover` | Tapissant | `e-groundcover` |
| `cross-pollination` | Pollin. croisée | `e-pollination` |
| `organic-matter` | Matière organique | `e-orgmatter` |
| `minerals` | Minéraux | `e-mineral` |
| `weed-suppression` | Suppression herbe | `e-grass` |

Defined as a Ruby constant `Plant::Species::ECO_SERVICES`.

### Vocabulary — `resource_parts`

Stored as `{ category: [parts] }`:

```json
{
  "edible":     ["fruit", "flower"],
  "aromatic":   [],
  "medicinal":  ["bark", "fruit"],
  "fiber":      [],
  "sensory":    ["ornamental"],
  "animal":     ["pecked"]
}
```

Categories (always present, possibly with empty array):
`edible`, `aromatic`, `medicinal`, `fiber`, `sensory`, `animal`.

Plant parts vocabulary (used in `edible`, `medicinal`, `aromatic`, `fiber`):
`fruit`, `flower`, `leaf`, `seed`, `root`, `bark`, `sap`, `stem`.

Sensory subtypes: `ornamental`, `dye`, `fragrant`.

Animal subtypes: `pecked`, `browsed`.

### Vocabulary — `toxicity`

```json
{
  "humans":   ["seeds"],
  "sheep":    ["seeds"],
  "dogs":     [],
  "horses":   [],
  "poultry":  []
}
```

Targets: `humans`, `sheep`, `dogs`, `horses`, `poultry`, `cattle`.
Parts (where applicable): same as `resource_parts` plant parts.

### Specific pollinators vocabulary

`bees`, `bumblebees`, `butterflies`, `hoverflies`, `beetles`, `wind`, `birds`.

### Strate enum

```ruby
class Plant::Species
  STRATES = %w[low medium shrub tree canopy vine aquatic subterranean].freeze
  validates :strate, inclusion: { in: STRATES }, allow_nil: true
end
```

### Successional role enum

```ruby
SUCCESSIONAL_ROLES = %w[pioneer nurse climax].freeze
validates :successional_role, inclusion: { in: SUCCESSIONAL_ROLES }, allow_nil: true
```

### Slug method

```ruby
def slug
  latin_name.parameterize  # "Amelanchier canadensis" → "amelanchier-canadensis"
end
```

Slug is deterministic from `latin_name`; uniqueness is already enforced by the
`latin_name` unique index. We do **not** store the slug in DB to avoid drift —
controllers resolve it on demand via parameterize. Lookup by slug uses an
expression index for efficiency:

```ruby
add_index :plant_species, "lower(replace(latin_name, ' ', '-'))",
          name: 'index_plant_species_on_slug'
```

The controller query becomes a fast index hit:

```ruby
Plant::Species.where("lower(replace(latin_name, ' ', '-')) = ?", slug.downcase).first!
```

## Routes

```ruby
# config/routes.rb
# Printable card (HTML, full bleed for browser print)
get "plants/species/:id/card", to: "plant_cards#show", as: :plant_card
get "plants/cards", to: "plant_cards#batch", as: :plant_cards

# Public page (Inertia, no auth)
get "s/:slug", to: "app#public_species", as: :public_species
```

The public route uses `:slug` (latin slugified) as identifier; the controller
finds by `latin_name = slug.gsub('-', ' ').capitalize` (or stores the slug
explicitly and queries by it).

## Backend

### Controller — `app/controllers/plant_cards_controller.rb`

```ruby
class PlantCardsController < ApplicationController
  layout "plant_card"  # minimal layout, no AppShell

  def show
    @species = Plant::Species.find(params[:id])
    render :card  # app/views/plant_cards/card.html.erb
  end

  def batch
    ids = params[:ids].to_s.split(",").map(&:to_i)
    @species_list = Plant::Species.where(id: ids).order(Arel.sql("array_position(ARRAY[#{ids.join(',')}]::int[], id)"))
    render :batch  # app/views/plant_cards/batch.html.erb
  end
end
```

Auth: `show` requires authentication (admin print). `batch` ditto.
Public no-auth route is the `/s/:slug` Inertia page, handled by `AppController#public_species`.

### Layout — `app/views/layouts/plant_card.html.erb`

Minimal HTML 5 doc, embedded CSS for print (`@page { size: A6; margin: 0 }`).
Inlines `_svg_defs.html.erb` once at top.

### Partials

- `app/views/plant_cards/_svg_defs.html.erb` — all `<symbol>` definitions
- `app/views/plant_cards/_recto.html.erb` — single recto for one species
- `app/views/plant_cards/_verso.html.erb` — single verso
- `app/views/plant_cards/card.html.erb` — single card (one recto + one verso
  on 2 A6 pages)
- `app/views/plant_cards/batch.html.erb` — N cards on A4 grid with cut marks
- `app/views/plant_cards/_silhouettes/...` — per-`growth_habit` plant SVGs
- `app/views/plant_cards/_roots/...` — per-`root_system` root SVGs

### Helpers — `app/helpers/plant_cards_helper.rb`

```ruby
def strate_label(strate); { 'low' => 'Basse', 'medium' => 'Médiane', ... }[strate] end
def strate_color(strate); { 'low' => '#C8E6A0', ... }[strate] end
def hardiness_to_celsius(usda); { 3 => -40, 4 => -34, 5 => -29, ... }[usda] end
def watering_drops(level); ... end       # 0-5 → SVG drop with digit
def sun_icon(exposures); ... end         # ['sun','partial-shade'] → 'half'/'empty'/'full'
def leaf_icon(foliage); ... end          # 'deciduous' → leaf-deciduous symbol
def fertility_icon(fertility); ... end   # 'partially-self-fertile' → pollin-partial
def cell_state(month, species); ... end  # returns 'flow' | 'harv' | 'both' | nil
def card_warnings(species); ... end      # returns [] of warning strings if any
def qr_svg(url); RQRCode::QRCode.new(url).as_svg(...) end
```

### Public web page — `app/controllers/app_controller.rb`

```ruby
def public_species
  slug = params[:slug]
  @species = Plant::Species.where("LOWER(REPLACE(latin_name, ' ', '-')) = ?", slug.downcase).first!
  render inertia: "Plants/Public", props: { species: serialize_for_public(@species) }
end
```

The Inertia page `Plants/Public` is added to the no-shell allowlist in
`application.jsx`.

## Frontend (admin actions)

### "Imprimer la fiche" button — `SpeciesDetail.tsx`

Adds a button next to other actions:

```tsx
<a href={`/plants/species/${species.id}/card`} target="_blank" className="...">
  <Printer className="w-4 h-4" /> Imprimer la fiche
</a>
```

### Multi-select + "Imprimer N fiches" — `SearchView.tsx`

The search results already support a per-item context; add a new
"select for printing" mode (toggle), which collects ids and shows a footer
action bar:

```tsx
{selectedIds.length > 0 && (
  <a href={`/plants/cards?ids=${selectedIds.join(',')}`} target="_blank">
    Imprimer {selectedIds.length} fiche{selectedIds.length > 1 ? 's' : ''}
  </a>
)}
```

### Public page — `Plants/Public.jsx` (Inertia)

A standalone read-only page (no `AppShell`). Shows the same data as the card
in a richer mobile-friendly layout: hero photos, full description, references,
all calendars, all eco services with explanations, recipes/uses if available.
Footer credits Semisto.

Added to no-shell allowlist in
`app/frontend/entrypoints/application.jsx`:

```js
const NO_SHELL_PAGES = [
  'Auth/Login', 'Auth/ForgotPassword', 'Auth/ResetPassword',
  'Design/ClientPortal',
  'Plants/Public',   // ← new
];
```

## Multilingual considerations

The DB will move to multilingual common names (per locale). The card design
already accommodates this:

- **Slug** is built from `latin_name`, language-independent.
- **Common name** on the card uses `common_names_fr` for now; will become
  `common_names[I18n.locale]` once the schema migrates.
- **Labels** (Strate, Cycle, Feuillage, Soleil, Eau, etc.) are localised via
  `I18n.t('plant_cards.labels.foliage', ...)`.

For v1, French only, hard-coded labels are acceptable. Future work:
add `i18n` keys when the multilingual DB migration lands.

## Phasing

**Phase A (1–2 days)** — Data model + form
- Create migration and apply
- Update `Plant::Species` model (validations, constants, slug method)
- Update `Api::V1::PlantsController#filter_options` with new vocabularies
- Extend `SpeciesFormModal.tsx` with new field inputs (organised in a new
  "Conception" tab)
- Tests on validations and JSON payload

**Phase B (3–4 days)** — Print card
- Routes + `PlantCardsController`
- Card layout (`card.html.erb`, `_recto`, `_verso`)
- Helpers and view logic
- SVG library (`_svg_defs.html.erb`, silhouettes, roots, eco icons,
  resources, pollination, vectors, sun, leaf, drop)
- QR generation with `rqrcode`
- "Imprimer la fiche" button on SpeciesDetail

**Phase C (2–3 days)** — Public page
- `/s/:slug` route
- `AppController#public_species`
- Inertia `Plants/Public.jsx` with no-shell wrapping
- Mobile-friendly layout
- Update no-shell allowlist

**Phase D (1–2 days)** — Batch print
- `/plants/cards?ids=...` route
- `_batch.html.erb` with 2×2 A6 grid, duplex-aware verso ordering, cut marks
- Multi-select UX in `SearchView`
- "Imprimer N fiches" footer action bar

**Phase E (1 day)** — Data migration + cleanup
- One-shot `bin/rake plants:migrate_interests` to split `interests` and
  `ecosystem_needs` into the new fields
- Manual review pass for Yggdrasil pilot data
- Mark `interests` and `ecosystem_needs` as deprecated

**Total**: 8–12 days.

## Testing

### Backend integration tests

`test/integration/plant_cards_test.rb`:

- `GET /plants/species/:id/card` returns 200 for a fully populated species
- `GET /plants/species/:id/card` returns 200 for a minimally populated
  species (placeholders shown, no errors)
- `GET /plants/cards?ids=1,2,3` returns 200 with all three rendered
- `GET /s/:slug` returns 200 for an existing latin name
- `GET /s/:slug` returns 404 for a missing slug

### Helper unit tests

`test/helpers/plant_cards_helper_test.rb`:

- `hardiness_to_celsius('zone-5')` returns `-29`
- `cell_state('mar', species)` returns `'flow'` when March is in flowering
  months and not in harvest months
- `cell_state('mar', species)` returns `'both'` when both
- `card_warnings(species)` returns expected list

### Visual regression (manual)

- Print preview the card from Chrome with the A6 paper size
- Verify the silhouettes scale correctly across strates (basse → canopy)
- Verify the QR scans correctly to `/s/:slug`
- Verify the batch print at A4 with duplex aligns recto-verso

## Open questions

1. **Verso QR placement on duplex print** — when 4 cards are on an A4 with
   cards in positions 1/2/3/4, the duplex back must mirror to 2/1/4/3 (long
   edge bind). Need to confirm the user's typical printer setting; otherwise
   provide a print preview note.
2. **Plant silhouettes for varieties** — varieties inherit the species
   silhouette by default. If a variety has a distinct port (e.g. dwarf
   apple), should we allow per-variety override? **Deferred to future work
   (variety-level cards are out of scope in v1).**
3. **Pollinator distance default** — for `pollination_type='insect'` and
   `fertility='self-sterile'`, what is a reasonable default if
   `pollination_distance_m` is null? Suggestion: don't show the line if null;
   show only if filled by a botanist. **Confirmed: hide if null.**
4. **Card width vs A6** — A6 is 105 × 148 mm = 396 × 559 px at 96 dpi. We
   use 396 × 558 px in mockups. The 1 px difference is negligible and within
   browser rounding tolerance.
5. **Eco services vocabulary completeness** — 12 entries per the user spec.
   Pré-validation: are there others worth adding (e.g. mycorrhizal partner,
   carbon storage)? **Deferred to phase E review.**

## References

- Brainstorm session mockups: `.superpowers/brainstorm/55794-1778069455/content/`
  (v1 → v30, the latter is the validated layout)
- Caragana pedagogical card (visual inspiration): user-provided screenshots
- CLAUDE.md — Plant Database section
- `app/controllers/api/v1/plants_controller.rb` — existing
  `filter_options` taxonomy (to be extended)
- Rails guides on `@page` CSS and browser print
