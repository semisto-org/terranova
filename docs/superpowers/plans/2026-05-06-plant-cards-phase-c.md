# Plant Cards — Phase C: Public Web Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a public web page for each species at `GET /s/:slug` that anyone can visit (no auth) by scanning the QR code from a printed card. The page presents the same data as the card but in a richer, scrollable, mobile-friendly layout. The slug is `latin_name.parameterize` (e.g., `amelanchier-canadensis`).

**Architecture:** Inertia React page added to the no-shell allowlist (no AppShell, no nav). Server-side controller action resolves slug → species, builds a full public payload, renders `Plants/PublicSpecies` Inertia view. The page is mobile-first with Tailwind. SEO meta tags via Inertia head helper. The page links back to the printable card (`/plants/species/:id/card`) — only visible when authenticated as admin.

**Tech Stack:** Rails 8.1, Inertia.js, React 18 + TypeScript, Tailwind CSS 4, lucide-react icons.

**Spec reference:** `docs/superpowers/specs/2026-05-06-plant-cards-design.md` (sections "Routes & Pages", "Multilingual considerations", "Public web page").

**Phase A delivered:** schema + slug method + admin form. **Phase B delivered:** printable card + QR pointing to `/s/:slug`. Phase C now activates that QR target.

---

## File Structure

### Files to create

- `app/views/inertia_template.html.erb` is shared with all Inertia pages — no new file.
- `app/frontend/pages/Plants/PublicSpecies.jsx` — the new public Inertia page.
- `app/frontend/plant-database/components/PublicSpeciesView.tsx` — main view component (broken into smaller subcomponents below).
- `app/frontend/plant-database/components/public/HeroSection.tsx` — hero (photos + name + badges).
- `app/frontend/plant-database/components/public/IdentityBlock.tsx` — strate / cycle / role / dimensions / hardiness.
- `app/frontend/plant-database/components/public/ConditionsBlock.tsx` — sun / water / foliage / soil scales.
- `app/frontend/plant-database/components/public/CalendarBlock.tsx` — flowering + harvest months in a wider format.
- `app/frontend/plant-database/components/public/EcosystemBlock.tsx` — services + needs in a 2-column layout.
- `app/frontend/plant-database/components/public/ResourcesBlock.tsx` — 6 categories with parts.
- `app/frontend/plant-database/components/public/PollinationBlock.tsx` — fertility + vector + distance.
- `app/frontend/plant-database/components/public/CautionsBlock.tsx` — warnings (drageonnant / toxicity / allelopathy).
- `app/frontend/plant-database/components/public/VarietiesBlock.tsx` — list of varieties when present.
- `app/frontend/plant-database/components/public/PublicFooter.tsx` — Semisto branding + admin print link.
- `test/integration/public_species_test.rb` — integration tests for routing, 404, payload shape.

### Files to modify

- `config/routes.rb` — add `get "s/:slug", to: "app#public_species_page", as: :public_species` BEFORE catch-alls.
- `app/controllers/app_controller.rb` — new `public_species_page` action; add to `before_action :require_authentication, except: […]` exception list.
- `app/controllers/application_controller.rb` — only if needed for shared serialization helpers (probably not).
- `app/frontend/entrypoints/application.jsx` — add `'Plants/PublicSpecies'` to `PAGES_WITHOUT_SHELL`.

### Decision points

- **Photo source.** Existing `Plant::Photo.url` is an external URL string. We embed `<img src="…">` directly. No ActiveStorage involvement.
- **Cross-section visual on web.** The biological cross-section (silhouette + roots + soil scales) is complex SVG/CSS that's already built for the print card. Phase C **does not** re-render it on the web page — instead it shows a clean photo-led layout. A "Voir la fiche imprimable" link (admin-only) opens the printable card.
- **i18n.** Hard-coded French for v1, matching Phase A/B. The slug stays canonical (latin) so URLs remain valid when locales are added.
- **SEO.** Inertia's `<Head>` helper sets `<title>`, `<meta description>`, `<meta og:title/description>`. No structured data, no sitemap (deferred).

---

## Tasks

### Task 1: Route + controller scaffold

**Files:**
- Modify: `config/routes.rb`
- Modify: `app/controllers/app_controller.rb`
- Create: `app/frontend/pages/Plants/PublicSpecies.jsx` (minimal stub)
- Modify: `app/frontend/entrypoints/application.jsx` (add to NO_SHELL allowlist)
- Create: `test/integration/public_species_test.rb`

- [ ] **Step 1: Write the failing tests**

Create `test/integration/public_species_test.rb`:

```ruby
require 'test_helper'

class PublicSpeciesTest < ActionDispatch::IntegrationTest
  setup do
    Plant::Species.delete_all
    @species = Plant::Species.create!(
      latin_name: 'Amelanchier canadensis',
      plant_type: 'shrub'
    )
  end

  test 'GET /s/:slug returns 200 without auth' do
    get '/s/amelanchier-canadensis'
    assert_response :success
    assert_match 'Amelanchier canadensis', response.body
  end

  test 'GET /s/:slug returns 404 for unknown slug' do
    get '/s/martian-plant'
    assert_response :not_found
  end

  test 'GET /s/:slug accepts uppercase and accent variations' do
    Plant::Species.create!(latin_name: 'Quercus rôbur', plant_type: 'tree')
    get '/s/quercus-robur'
    assert_response :success
  end
end
```

- [ ] **Step 2: Add the route**

In `config/routes.rb`, add BEFORE the catch-alls:

```ruby
  get "s/:slug", to: "app#public_species_page", as: :public_species
```

A good location: near other `get "plants"` routes (around line 84, before the `plants/*path` catch-all).

- [ ] **Step 3: Add the controller action**

In `app/controllers/app_controller.rb`, find the `before_action :require_authentication, except: […]` line. Add `:public_species_page` to the except list.

Then add the action:

```ruby
def public_species_page
  slug = params[:slug].to_s.downcase
  species = Plant::Species.where("lower(replace(latin_name, ' ', '-')) = ?", slug).first
  raise ActiveRecord::RecordNotFound unless species

  render inertia: 'Plants/PublicSpecies', props: {
    species: { id: species.id, latinName: species.latin_name }
    # full payload built in Task 2
  }
end
```

The `lower(replace(latin_name, ' ', '-'))` matches the expression index added in the Phase A migration. It also handles the accent normalization differently than `parameterize` (which lower-cases AND removes accents). For the v1 we keep both `Amelanchier canadensis → amelanchier-canadensis` (works) and `Quercus rôbur → quercus-robur`. The DB query uses the lower-replace expression; for accent handling we may need to also `unaccent` — see Step 5.

- [ ] **Step 4: Create the minimal Inertia page**

Create `app/frontend/pages/Plants/PublicSpecies.jsx`:

```jsx
import { Head } from '@inertiajs/react'

export default function PublicSpecies({ species }) {
  return (
    <>
      <Head>
        <title>{`${species.latinName} — Semisto`}</title>
        <meta name="description" content={`Fiche botanique : ${species.latinName}`} />
      </Head>
      <main className="min-h-screen bg-stone-50 p-6">
        <h1 className="text-3xl font-serif">{species.latinName}</h1>
      </main>
    </>
  )
}
```

- [ ] **Step 5: Add to NO_SHELL allowlist**

In `app/frontend/entrypoints/application.jsx`, find the `PAGES_WITHOUT_SHELL` array and append `'Plants/PublicSpecies'`.

- [ ] **Step 6: Handle accent normalization (if test fails on accents)**

If the third test fails because `Quercus rôbur` doesn't match `quercus-robur` via `lower(replace(...))`, extend the SQL to use `unaccent`:

```ruby
species = Plant::Species.where(
  "lower(unaccent(replace(latin_name, ' ', '-'))) = ?",
  slug
).first
```

This requires the `unaccent` PostgreSQL extension. Check if it's enabled:
```bash
bin/rails runner "puts ActiveRecord::Base.connection.execute(\"SELECT extname FROM pg_extension WHERE extname='unaccent'\").to_a.inspect"
```

If empty, enable it via migration:
```ruby
class EnableUnaccent < ActiveRecord::Migration[8.1]
  def change
    enable_extension 'unaccent'
  end
end
```

(Defer to a separate task only if the test fails. For most botanical names without accents, the simpler query works.)

- [ ] **Step 7: Run tests**

```bash
bin/rails test test/integration/public_species_test.rb
```

Expected: 3 tests pass.

- [ ] **Step 8: Commit**

```bash
git add config/routes.rb \
        app/controllers/app_controller.rb \
        app/frontend/pages/Plants/PublicSpecies.jsx \
        app/frontend/entrypoints/application.jsx \
        test/integration/public_species_test.rb
git commit -m "Bootstrap public species page at /s/:slug

Resolves slug to latin_name via the expression index added in Phase A.
Renders a minimal Inertia page (no shell) with the species name. Full
content lands in subsequent tasks."
```

---

### Task 2: Full public species payload

**Files:**
- Modify: `app/controllers/app_controller.rb`
- Modify: `test/integration/public_species_test.rb`

- [ ] **Step 1: Add a payload assertion test**

Append to `test/integration/public_species_test.rb`:

```ruby
test 'public species page payload includes all card-relevant fields' do
  @species.update!(
    common_names_fr: 'Amélanchier',
    strate: 'shrub',
    life_cycle: 'perennial',
    successional_role: 'nurse',
    height_min_cm: 300, height_max_cm: 600,
    spread_min_cm: 200, spread_max_cm: 400,
    planting_spacing_cm: 300,
    growth_habit: 'arbustif-arrondi',
    foliage_type: 'deciduous',
    exposures: ['sun', 'partial-shade'],
    hardiness: 'zone-5',
    watering_need: '3',
    soil_texture: ['balanced'],
    soil_richness: 'moderate',
    soil_ph: ['acid', 'neutral'],
    root_system: 'spreading',
    fertility: 'partially-self-fertile',
    specific_pollinators: ['bees'],
    pollination_distance_m: 30,
    flowering_months: ['mar', 'apr'],
    harvest_months: ['jun', 'jul'],
    is_drageonnant: true,
    toxicity: { 'sheep' => ['seeds'] },
    eco_services_provided: ['windbreak', 'mellifere'],
    eco_services_needed: ['nitrogen'],
    resource_parts: { 'edible' => ['fruit'] }
  )

  get '/s/amelanchier-canadensis'
  assert_response :success

  # The Inertia X-Inertia header makes the response a JSON envelope; without it
  # we get the HTML wrapper. Easier to assert against props by checking the
  # data-page attribute of the wrapper div.
  assert_match 'Amelanchier canadensis', response.body
  assert_match 'Amélanchier', response.body
  assert_match 'shrub', response.body
  assert_match 'partially-self-fertile', response.body
  assert_match '"floweringMonths"', response.body
  assert_match '"ecoServicesProvided"', response.body
end
```

- [ ] **Step 2: Build the full payload**

In `app/controllers/app_controller.rb` `public_species_page` action, replace the placeholder props with a full payload. Build a private helper `serialize_public_species_full(species)` returning all card-relevant fields plus photos, common_names, varieties:

```ruby
def public_species_page
  slug = params[:slug].to_s.downcase
  species = Plant::Species.where("lower(replace(latin_name, ' ', '-')) = ?", slug).first
  raise ActiveRecord::RecordNotFound unless species

  render inertia: 'Plants/PublicSpecies', props: {
    species: serialize_public_species_full(species),
    photos: photos_for_species(species),
    commonNames: common_names_for_species(species),
    varieties: species.varieties.order(:latin_name).map { |v|
      { id: v.id.to_s, latinName: v.latin_name, additionalNotes: v.additional_notes.presence }
    },
    genus: species.genus ? { id: species.genus.id.to_s, latinName: species.genus.latin_name } : nil
  }
end

private

def serialize_public_species_full(s)
  {
    id: s.id.to_s,
    slug: s.slug,
    latinName: s.latin_name,
    commonNamesFr: s.common_names_fr.presence,
    plantType: s.plant_type,
    strate: s.strate,
    successionalRole: s.successional_role,
    lifeCycle: s.life_cycle,
    growthHabit: s.growth_habit,
    growthRate: s.growth_rate,
    foliageType: s.foliage_type,
    foliageColor: s.foliage_color,
    fragrance: s.fragrance,
    fertility: s.fertility,
    pollinationType: s.pollination_type,
    rootSystem: s.root_system,
    forestGardenZone: s.forest_garden_zone,
    hardiness: s.hardiness,
    wateringNeed: s.watering_need,
    soilMoisture: s.soil_moisture,
    soilRichness: s.soil_richness,
    isInvasive: s.is_invasive,
    isDrageonnant: s.is_drageonnant,
    allelopathy: s.allelopathy.presence,
    heightMinCm: s.height_min_cm,
    heightMaxCm: s.height_max_cm,
    heightDescription: s.height_description.presence,
    spreadMinCm: s.spread_min_cm,
    spreadMaxCm: s.spread_max_cm,
    spreadDescription: s.spread_description.presence,
    plantingSpacingCm: s.planting_spacing_cm,
    lifespanMinYears: s.lifespan_min_years,
    lifespanMaxYears: s.lifespan_max_years,
    pollinationDistanceM: s.pollination_distance_m,
    flowerColors: s.flower_colors,
    floweringMonths: s.flowering_months,
    fruitingMonths: s.fruiting_months,
    harvestMonths: s.harvest_months,
    pruningMonths: s.pruning_months,
    plantingSeasons: s.planting_seasons,
    propagationMethods: s.propagation_methods,
    transformations: s.transformations,
    fodderQualities: s.fodder_qualities,
    edibleParts: s.edible_parts,
    interests: s.interests,
    ecosystemNeeds: s.ecosystem_needs,
    nativeCountries: s.native_countries,
    soilTypes: s.soil_types,
    exposures: s.exposures,
    soilPh: s.soil_ph,
    soilTexture: s.soil_texture,
    specificPollinators: s.specific_pollinators,
    toxicity: s.toxicity,
    ecoServicesProvided: s.eco_services_provided,
    ecoServicesNeeded: s.eco_services_needed,
    resourceParts: s.resource_parts,
    therapeuticProperties: s.therapeutic_properties.presence,
    additionalNotes: s.additional_notes.presence,
    edibleRating: s.edible_rating,
    medicinalRating: s.medicinal_rating
  }
end

def photos_for_species(species)
  Plant::Photo
    .where(target_type: 'species', target_id: species.id)
    .order(:created_at)
    .map { |p| { id: p.id.to_s, url: p.url, role: p.role, caption: p.caption.presence } }
end

def common_names_for_species(species)
  Plant::CommonName
    .where(target_type: 'species', target_id: species.id)
    .map { |cn| { name: cn.name, language: cn.language } }
end
```

- [ ] **Step 3: Run tests**

```bash
bin/rails test test/integration/public_species_test.rb
```

Expected: 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/controllers/app_controller.rb test/integration/public_species_test.rb
git commit -m "Build full public species payload for /s/:slug

Serializes all card-relevant fields from Phase A, plus photos, common
names, varieties, and genus reference. Used by the Plants/PublicSpecies
Inertia page."
```

---

### Task 3: Hero section — photos + name + badges

**Files:**
- Modify: `app/frontend/pages/Plants/PublicSpecies.jsx`
- Create: `app/frontend/plant-database/components/public/HeroSection.tsx`

- [ ] **Step 1: Create the HeroSection component**

`app/frontend/plant-database/components/public/HeroSection.tsx`:

```tsx
type Photo = { id: string; url: string; role: string | null; caption: string | null }
type Species = {
  latinName: string
  commonNamesFr?: string | null
  strate?: string | null
  lifeCycle?: string | null
  successionalRole?: string | null
  hardiness?: string
  heightMinCm?: number | null
  heightMaxCm?: number | null
  spreadMinCm?: number | null
  spreadMaxCm?: number | null
  plantingSpacingCm?: number | null
  growthHabit?: string | null
}

const STRATE_LABELS: Record<string, string> = {
  low: 'Basse', medium: 'Médiane', shrub: 'Arbrisseau', tree: 'Arbre',
  canopy: 'Canopée', vine: 'Grimpante', aquatic: 'Aquatique', subterranean: 'Racinaire',
}
const STRATE_BG: Record<string, string> = {
  low: 'bg-[#C8E6A0] text-[#2d4a1f]', medium: 'bg-[#8FBC4F] text-white',
  shrub: 'bg-[#5A9A2F] text-white', tree: 'bg-[#2D7A1F] text-white',
  canopy: 'bg-[#1B4D14] text-white', vine: 'bg-[#B45F8E] text-white',
  aquatic: 'bg-[#4A90C2] text-white', subterranean: 'bg-[#8B5A3C] text-white',
}
const CYCLE_LABELS: Record<string, string> = {
  annual: 'Annuelle', biennial: 'Bisannuelle', perennial: 'Vivace',
}
const CYCLE_BG: Record<string, string> = {
  annual: 'bg-[#F4D35E] text-[#5C4500]', biennial: 'bg-[#EE964B] text-white',
  perennial: 'bg-[#274C77] text-white',
}
const ROLE_LABELS: Record<string, string> = {
  pioneer: 'Pionnier', nurse: 'Nourricier', climax: 'Climax',
}
const ROLE_BG: Record<string, string> = {
  pioneer: 'bg-[#E07A47] text-white', nurse: 'bg-[#B8916A] text-white', climax: 'bg-[#1B4D52] text-white',
}
const USDA_TO_C: Record<string, number> = {
  'zone-3': -40, 'zone-4': -34, 'zone-5': -29, 'zone-6': -23, 'zone-7': -18,
  'zone-8': -12, 'zone-9': -7, 'zone-10': -1,
}

export function HeroSection({ species, photos }: { species: Species; photos: Photo[] }) {
  const flowerPhoto = photos.find(p => p.role === 'flower')
  const fruitPhoto = photos.find(p => p.role === 'fruit')
  const otherPhotos = photos.filter(p => !['flower', 'fruit'].includes(p.role || ''))

  const tempC = species.hardiness ? USDA_TO_C[species.hardiness] : null

  const fmtMeters = (cm: number | null | undefined) =>
    cm == null ? null : (cm / 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })

  return (
    <section className="bg-white">
      {(flowerPhoto || fruitPhoto || otherPhotos.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1 aspect-[16/9] md:aspect-[2/1] overflow-hidden">
          {flowerPhoto && (
            <figure className="relative">
              <img src={flowerPhoto.url} alt={flowerPhoto.caption || 'Floraison'} className="w-full h-full object-cover" />
              <figcaption className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white/90 text-[10px] tracking-widest uppercase font-bold text-[#234766]">Floraison</figcaption>
            </figure>
          )}
          {fruitPhoto && (
            <figure className="relative">
              <img src={fruitPhoto.url} alt={fruitPhoto.caption || 'Fruit'} className="w-full h-full object-cover" />
              <figcaption className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white/90 text-[10px] tracking-widest uppercase font-bold text-[#234766]">Fruit</figcaption>
            </figure>
          )}
          {otherPhotos.slice(0, 1).map(p => (
            <figure key={p.id} className="hidden md:block relative">
              <img src={p.url} alt={p.caption || ''} className="w-full h-full object-cover" />
            </figure>
          ))}
        </div>
      )}

      <div className="px-6 md:px-12 py-6 md:py-8 max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl md:text-5xl tracking-tight text-stone-900">
          {species.commonNamesFr || species.latinName}
        </h1>
        <div className="italic text-stone-500 text-base md:text-lg mt-1">{species.latinName}</div>

        <div className="flex flex-wrap gap-2 mt-4">
          {species.strate && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${STRATE_BG[species.strate]}`}>
              {STRATE_LABELS[species.strate]}
            </span>
          )}
          {species.lifeCycle && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${CYCLE_BG[species.lifeCycle]}`}>
              {CYCLE_LABELS[species.lifeCycle]}
            </span>
          )}
          {species.successionalRole && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${ROLE_BG[species.successionalRole]}`}>
              {ROLE_LABELS[species.successionalRole]}
            </span>
          )}
          {tempC != null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#dde4ec] text-[#234766]">
              ❄ −{Math.abs(tempC)} °C
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-sm text-stone-600">
          {species.heightMinCm && species.heightMaxCm && (
            <span>↕ {fmtMeters(species.heightMinCm)}–{fmtMeters(species.heightMaxCm)} m</span>
          )}
          {species.spreadMinCm && species.spreadMaxCm && (
            <span>↔ {fmtMeters(species.spreadMinCm)}–{fmtMeters(species.spreadMaxCm)} m</span>
          )}
          {species.plantingSpacingCm && (
            <span>⇿ Espacement {fmtMeters(species.plantingSpacingCm)} m</span>
          )}
          {species.growthHabit && (
            <span className="text-stone-500">Port : {species.growthHabit.replace('-', ' ')}</span>
          )}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire it into PublicSpecies.jsx**

```jsx
import { Head } from '@inertiajs/react'
import { HeroSection } from '@/plant-database/components/public/HeroSection'

export default function PublicSpecies({ species, photos = [] }) {
  return (
    <>
      <Head>
        <title>{`${species.commonNamesFr || species.latinName} — Semisto`}</title>
        <meta name="description" content={`Fiche botanique : ${species.latinName}`} />
      </Head>
      <main className="min-h-screen bg-stone-50">
        <HeroSection species={species} photos={photos} />
      </main>
    </>
  )
}
```

- [ ] **Step 3: Visual smoke test**

`bin/dev`. Visit `http://localhost:3000/s/amelanchier-canadensis` (replace with your seeded slug). The hero renders with photos (or empty grid) + name + badges + dim-line.

- [ ] **Step 4: Commit**

```bash
git add app/frontend/plant-database/components/public/ \
        app/frontend/pages/Plants/PublicSpecies.jsx
git commit -m "Public page hero: photos + name + badges + dim-line"
```

---

### Task 4: Conditions block — sun / water / foliage

**Files:**
- Create: `app/frontend/plant-database/components/public/ConditionsBlock.tsx`
- Modify: `app/frontend/pages/Plants/PublicSpecies.jsx`

- [ ] **Step 1: Create ConditionsBlock**

`app/frontend/plant-database/components/public/ConditionsBlock.tsx`:

```tsx
import { Sun, Droplets, Leaf } from 'lucide-react'

const FOLIAGE_LABELS: Record<string, string> = {
  deciduous: 'Caduc', 'semi-evergreen': 'Semi-persistant',
  evergreen: 'Persistant', marcescent: 'Marcescent',
}

const WATER_LABELS = ['Sec', 'Très sec', 'Faible', 'Modéré', 'Régulier', 'Humide']

function sunLabel(exposures: string[]): string {
  if (!exposures || exposures.length === 0) return '—'
  if (exposures.includes('sun') && exposures.includes('partial-shade')) return 'Plein soleil et mi-ombre'
  if (exposures.includes('sun')) return 'Plein soleil'
  if (exposures.includes('partial-shade')) return 'Mi-ombre'
  return 'Ombre'
}

export function ConditionsBlock({ species }: { species: any }) {
  const water = species.wateringNeed != null ? Number(species.wateringNeed) : null
  return (
    <section className="px-6 md:px-12 py-8 max-w-3xl mx-auto border-t border-stone-200">
      <h2 className="font-serif text-2xl text-stone-900 mb-4">Conditions de culture</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-stone-200">
          <Sun className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Soleil</div>
            <div className="font-semibold mt-0.5">{sunLabel(species.exposures || [])}</div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-stone-200">
          <Droplets className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Eau</div>
            <div className="font-semibold mt-0.5">
              {water != null ? `${WATER_LABELS[water] || '—'} (${water}/5)` : '—'}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-stone-200">
          <Leaf className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Feuillage</div>
            <div className="font-semibold mt-0.5">{FOLIAGE_LABELS[species.foliageType] || '—'}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire it into the page**

```jsx
import { ConditionsBlock } from '@/plant-database/components/public/ConditionsBlock'
// ...
<HeroSection species={species} photos={photos} />
<ConditionsBlock species={species} />
```

- [ ] **Step 3: Commit**

```bash
git add app/frontend/plant-database/components/public/ConditionsBlock.tsx \
        app/frontend/pages/Plants/PublicSpecies.jsx
git commit -m "Public page Conditions block: sun, water, foliage"
```

---

### Task 5: Soil block — texture / humus / pH / roots

**Files:**
- Create: `app/frontend/plant-database/components/public/SoilBlock.tsx`
- Modify: `app/frontend/pages/Plants/PublicSpecies.jsx`

- [ ] **Step 1: Create SoilBlock**

`app/frontend/plant-database/components/public/SoilBlock.tsx`:

```tsx
const TEXTURE = ['light', 'balanced', 'heavy']
const TEXTURE_FR = { light: 'Léger', balanced: 'Équilibré', heavy: 'Lourd' }
const HUMUS = ['poor', 'moderate', 'rich']
const HUMUS_FR = { poor: 'Pauvre', moderate: 'Moyen', rich: 'Riche' }
const PH = ['acid', 'neutral', 'basic']
const PH_FR = { acid: 'Acide', neutral: 'Neutre', basic: 'Basique' }
const ROOT_FR = {
  taproot: 'Pivotant', fibrous: 'Fasciculé', spreading: 'Traçant',
  shallow: 'Superficiel', deep: 'Profond',
}

function Scale({ values, order, labels }: any) {
  const active = new Set(values || [])
  return (
    <div className="grid grid-cols-3 gap-1">
      {order.map((key: string) => (
        <div key={key} className="text-center">
          <div className={`h-2 rounded ${active.has(key) ? 'bg-[#234766]' : 'bg-stone-200'}`} />
          <div className="text-[10px] mt-1 text-stone-500">{labels[key]}</div>
        </div>
      ))}
    </div>
  )
}

export function SoilBlock({ species }: { species: any }) {
  return (
    <section className="px-6 md:px-12 py-8 max-w-3xl mx-auto border-t border-stone-200">
      <h2 className="font-serif text-2xl text-stone-900 mb-6">Sol</h2>
      <div className="space-y-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-2">Texture</div>
          <Scale values={species.soilTexture} order={TEXTURE} labels={TEXTURE_FR} />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-2">Humus</div>
          <Scale values={species.soilRichness ? [species.soilRichness] : []} order={HUMUS} labels={HUMUS_FR} />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-2">pH</div>
          <Scale values={species.soilPh} order={PH} labels={PH_FR} />
        </div>
        {species.rootSystem && (
          <div className="pt-2">
            <span className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Racines : </span>
            <span className="font-semibold">{ROOT_FR[species.rootSystem] || species.rootSystem}</span>
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire it in. Commit**

```bash
git add app/frontend/plant-database/components/public/SoilBlock.tsx \
        app/frontend/pages/Plants/PublicSpecies.jsx
git commit -m "Public page Soil block: texture/humus/pH scales + root system"
```

---

### Task 6: Calendar block — flowering + harvest

**Files:**
- Create: `app/frontend/plant-database/components/public/CalendarBlock.tsx`

- [ ] **Step 1: Create CalendarBlock**

```tsx
const MONTH_LETTERS = ['J','F','M','A','M','J','J','A','S','O','N','D']
const MONTH_IDS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']

export function CalendarBlock({ species }: { species: any }) {
  if ((species.floweringMonths?.length ?? 0) === 0 && (species.harvestMonths?.length ?? 0) === 0) {
    return null
  }
  const flow = new Set<string>(species.floweringMonths || [])
  const harv = new Set<string>(species.harvestMonths || [])

  return (
    <section className="px-6 md:px-12 py-8 max-w-3xl mx-auto border-t border-stone-200">
      <h2 className="font-serif text-2xl text-stone-900 mb-4">Calendrier</h2>
      <div className="grid grid-cols-12 gap-1">
        {MONTH_IDS.map((id, i) => {
          const isFlow = flow.has(id)
          const isHarv = harv.has(id)
          const both = isFlow && isHarv
          const bg = both ? 'bg-gradient-to-b from-[#AFBD00] from-50% to-[#EF9B0D] to-50%'
            : isFlow ? 'bg-[#AFBD00]'
            : isHarv ? 'bg-[#EF9B0D]'
            : 'bg-stone-100'
          const fg = (isFlow || isHarv) ? 'text-white' : 'text-stone-400'
          return (
            <div key={id} className={`h-8 rounded flex items-center justify-center text-sm font-bold ${bg} ${fg}`}>
              {MONTH_LETTERS[i]}
            </div>
          )
        })}
      </div>
      <div className="flex justify-end gap-4 text-xs text-stone-500 mt-2 uppercase tracking-wider">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#AFBD00]"></span> Floraison
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#EF9B0D]"></span> Récolte
        </span>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire in + commit**

```bash
git add app/frontend/plant-database/components/public/CalendarBlock.tsx \
        app/frontend/pages/Plants/PublicSpecies.jsx
git commit -m "Public page Calendar block: 12 months with flow/harv/both states"
```

---

### Task 7: Pollination block

**Files:**
- Create: `app/frontend/plant-database/components/public/PollinationBlock.tsx`

- [ ] **Step 1: Create PollinationBlock**

```tsx
const FERTILITY_LABELS: Record<string, string> = {
  'self-fertile': 'Auto-fertile',
  'self-sterile': 'Pollinisation croisée',
  'partially-self-fertile': 'Partiellement auto-fertile',
  dioecious: 'Dioïque (♂♀ séparés)',
}

const POLLINATOR_LABELS: Record<string, string> = {
  bees: 'abeilles', bumblebees: 'bourdons', butterflies: 'papillons',
  hoverflies: 'syrphes', beetles: 'coléoptères', wind: 'vent', birds: 'oiseaux',
}

export function PollinationBlock({ species }: { species: any }) {
  if (!species.fertility && !species.pollinationDistanceM && (species.specificPollinators?.length ?? 0) === 0) {
    return null
  }
  const pollList = (species.specificPollinators || []).map(p => POLLINATOR_LABELS[p] || p).join(', ')
  return (
    <section className="px-6 md:px-12 py-8 max-w-3xl mx-auto border-t border-stone-200">
      <h2 className="font-serif text-2xl text-stone-900 mb-4">Pollinisation</h2>
      <div className="bg-pink-50 border-l-4 border-pink-500 rounded-r-lg p-5 space-y-3">
        {species.fertility && (
          <div>
            <div className="text-xs uppercase tracking-wider text-pink-700 font-bold">Statut</div>
            <div className="text-lg font-semibold mt-1">{FERTILITY_LABELS[species.fertility] || species.fertility}</div>
          </div>
        )}
        {pollList && (
          <div className="text-sm text-stone-700">
            <strong>Pollinisateurs :</strong> {pollList}
          </div>
        )}
        {species.pollinationDistanceM && (
          <div className="text-sm text-stone-700">
            <strong>Distance bénéfique :</strong> &lt; {species.pollinationDistanceM} m
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire + commit**

```bash
git add app/frontend/plant-database/components/public/PollinationBlock.tsx \
        app/frontend/pages/Plants/PublicSpecies.jsx
git commit -m "Public page Pollination block: status + pollinators + distance"
```

---

### Task 8: Ecosystem block — services + needs

**Files:**
- Create: `app/frontend/plant-database/components/public/EcosystemBlock.tsx`

- [ ] **Step 1: Create EcosystemBlock**

```tsx
const ECO_LABELS: Record<string, string> = {
  windbreak: 'Brise-vent', mellifere: 'Mellifère', birds: 'Attire les oiseaux',
  'beneficial-insects': 'Insectes auxiliaires', 'erosion-control': 'Anti-érosion',
  'light-shade': 'Ombre légère', nitrogen: 'Azote',
  'ground-cover': 'Tapissant', 'cross-pollination': 'Pollinisation croisée',
  'organic-matter': 'Matière organique', minerals: 'Minéraux',
  'weed-suppression': 'Suppression des herbes',
}

const ECO_ORDER = [
  'windbreak', 'mellifere', 'birds', 'beneficial-insects', 'erosion-control',
  'light-shade', 'nitrogen', 'ground-cover', 'cross-pollination',
  'organic-matter', 'minerals', 'weed-suppression',
]

export function EcosystemBlock({ species }: { species: any }) {
  const provided = new Set<string>(species.ecoServicesProvided || [])
  const needed = new Set<string>(species.ecoServicesNeeded || [])

  if (provided.size === 0 && needed.size === 0) return null

  return (
    <section className="px-6 md:px-12 py-8 max-w-3xl mx-auto border-t border-stone-200">
      <h2 className="font-serif text-2xl text-stone-900 mb-4">Système écosystémique</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-3">Services rendus</h3>
          <ul className="space-y-1.5 text-sm">
            {ECO_ORDER.filter(id => provided.has(id)).map(id => (
              <li key={id} className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">●</span>
                <span>{ECO_LABELS[id]}</span>
              </li>
            ))}
            {provided.size === 0 && <li className="text-stone-400 italic">—</li>}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-violet-700 uppercase tracking-wider mb-3">Besoins</h3>
          <ul className="space-y-1.5 text-sm">
            {ECO_ORDER.filter(id => needed.has(id)).map(id => (
              <li key={id} className="flex items-start gap-2">
                <span className="text-violet-600 mt-0.5">●</span>
                <span>{ECO_LABELS[id]}</span>
              </li>
            ))}
            {needed.size === 0 && <li className="text-stone-400 italic">—</li>}
          </ul>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire + commit**

```bash
git add app/frontend/plant-database/components/public/EcosystemBlock.tsx \
        app/frontend/pages/Plants/PublicSpecies.jsx
git commit -m "Public page Ecosystem block: services + needs in 2 columns"
```

---

### Task 9: Resources block

**Files:**
- Create: `app/frontend/plant-database/components/public/ResourcesBlock.tsx`

- [ ] **Step 1: Create ResourcesBlock**

```tsx
const RESOURCE_FR: Record<string, string> = {
  edible: 'Comestible', aromatic: 'Aromatique', medicinal: 'Médicinale',
  fiber: 'Fibre', sensory: 'Sensorielle', animal: 'Animale',
}
const PART_FR: Record<string, string> = {
  fruit: 'fruit', flower: 'fleur', leaf: 'feuille', seed: 'graine',
  root: 'racine', bark: 'écorce', sap: 'sève', stem: 'tige',
  ornamental: 'ornementale', dye: 'tinctoriale', fragrant: 'odorante',
  pecked: 'picorée', browsed: 'broutée',
}
const ORDER = ['edible', 'aromatic', 'medicinal', 'fiber', 'sensory', 'animal']

export function ResourcesBlock({ species }: { species: any }) {
  const parts = species.resourceParts || {}
  const filled = ORDER.filter(cat => (parts[cat]?.length ?? 0) > 0)
  if (filled.length === 0) return null

  return (
    <section className="px-6 md:px-12 py-8 max-w-3xl mx-auto border-t border-stone-200">
      <h2 className="font-serif text-2xl text-stone-900 mb-4">Ressources</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filled.map(cat => (
          <div key={cat} className="p-4 bg-white rounded-lg border border-stone-200">
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold">{RESOURCE_FR[cat]}</div>
            <div className="mt-1 text-sm text-stone-700">
              {(parts[cat] || []).map(p => PART_FR[p] || p).join(', ')}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire + commit**

```bash
git add app/frontend/plant-database/components/public/ResourcesBlock.tsx \
        app/frontend/pages/Plants/PublicSpecies.jsx
git commit -m "Public page Resources block: 6 categories with parts"
```

---

### Task 10: Cautions block + varieties + footer

**Files:**
- Create: `app/frontend/plant-database/components/public/CautionsBlock.tsx`
- Create: `app/frontend/plant-database/components/public/VarietiesBlock.tsx`
- Create: `app/frontend/plant-database/components/public/PublicFooter.tsx`
- Modify: `app/frontend/pages/Plants/PublicSpecies.jsx`

- [ ] **Step 1: Create the three components**

`CautionsBlock.tsx`:

```tsx
import { AlertTriangle } from 'lucide-react'

const TOXICITY_TARGET_FR: Record<string, string> = {
  humans: 'humains', sheep: 'brebis', dogs: 'chiens',
  horses: 'chevaux', poultry: 'volaille', cattle: 'bovins',
}
const PART_FR: Record<string, string> = {
  fruit: 'fruit', flower: 'fleur', leaf: 'feuille', seed: 'graine',
  root: 'racine', bark: 'écorce', sap: 'sève', stem: 'tige',
}

export function CautionsBlock({ species }: { species: any }) {
  const items: string[] = []
  if (species.isDrageonnant) items.push('Plante drageonnante (système racinaire traçant et envahissant)')
  if (species.allelopathy) items.push(`Allélopathique : ${species.allelopathy}`)
  Object.entries(species.toxicity || {}).forEach(([target, parts]) => {
    if (Array.isArray(parts) && parts.length > 0) {
      const partsLabel = parts.map(p => PART_FR[p] || p).join(', ')
      items.push(`Toxique pour les ${TOXICITY_TARGET_FR[target] || target} (${partsLabel})`)
    }
  })

  if (items.length === 0) return null

  return (
    <section className="px-6 md:px-12 py-8 max-w-3xl mx-auto border-t border-stone-200">
      <h2 className="font-serif text-2xl text-stone-900 mb-4">Précautions</h2>
      <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-5">
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

`VarietiesBlock.tsx`:

```tsx
type Variety = { id: string; latinName: string; additionalNotes?: string | null }

export function VarietiesBlock({ varieties }: { varieties: Variety[] }) {
  if (!varieties || varieties.length === 0) return null
  return (
    <section className="px-6 md:px-12 py-8 max-w-3xl mx-auto border-t border-stone-200">
      <h2 className="font-serif text-2xl text-stone-900 mb-4">Variétés</h2>
      <ul className="space-y-2">
        {varieties.map(v => (
          <li key={v.id} className="p-3 bg-white rounded border border-stone-200">
            <div className="italic font-semibold">{v.latinName}</div>
            {v.additionalNotes && <div className="text-sm text-stone-600 mt-1">{v.additionalNotes}</div>}
          </li>
        ))}
      </ul>
    </section>
  )
}
```

`PublicFooter.tsx`:

```tsx
export function PublicFooter() {
  return (
    <footer className="border-t border-stone-200 px-6 md:px-12 py-8 text-center text-sm text-stone-500">
      <div className="italic">Fiche réalisée par <strong className="not-italic font-semibold text-stone-700">Semisto</strong></div>
      <div className="mt-1 text-xs uppercase tracking-wider">plantes.semisto.org</div>
    </footer>
  )
}
```

- [ ] **Step 2: Wire all blocks into PublicSpecies.jsx**

```jsx
import { Head } from '@inertiajs/react'
import { HeroSection } from '@/plant-database/components/public/HeroSection'
import { ConditionsBlock } from '@/plant-database/components/public/ConditionsBlock'
import { SoilBlock } from '@/plant-database/components/public/SoilBlock'
import { CalendarBlock } from '@/plant-database/components/public/CalendarBlock'
import { PollinationBlock } from '@/plant-database/components/public/PollinationBlock'
import { EcosystemBlock } from '@/plant-database/components/public/EcosystemBlock'
import { ResourcesBlock } from '@/plant-database/components/public/ResourcesBlock'
import { CautionsBlock } from '@/plant-database/components/public/CautionsBlock'
import { VarietiesBlock } from '@/plant-database/components/public/VarietiesBlock'
import { PublicFooter } from '@/plant-database/components/public/PublicFooter'

export default function PublicSpecies({ species, photos = [], varieties = [] }) {
  return (
    <>
      <Head>
        <title>{`${species.commonNamesFr || species.latinName} — Semisto`}</title>
        <meta name="description" content={`Fiche botanique : ${species.latinName}`} />
        <meta property="og:title" content={`${species.commonNamesFr || species.latinName} — Semisto`} />
        <meta property="og:description" content={`Fiche botanique de ${species.latinName} sur le réseau Semisto.`} />
      </Head>
      <main className="min-h-screen bg-stone-50">
        <HeroSection species={species} photos={photos} />
        <ConditionsBlock species={species} />
        <SoilBlock species={species} />
        <CalendarBlock species={species} />
        <PollinationBlock species={species} />
        <EcosystemBlock species={species} />
        <ResourcesBlock species={species} />
        <CautionsBlock species={species} />
        <VarietiesBlock varieties={varieties} />
        <PublicFooter />
      </main>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/frontend/plant-database/components/public/ \
        app/frontend/pages/Plants/PublicSpecies.jsx
git commit -m "Public page: cautions + varieties + footer

Cautions banner (drageonnant / allelopathy / per-target toxicity).
Varieties listing with latin name + notes. Footer with Semisto branding."
```

---

### Task 11: Admin print link + e2e verification

**Files:**
- Modify: `app/frontend/pages/Plants/PublicSpecies.jsx`
- Modify: `app/controllers/app_controller.rb` (pass `isAdmin` flag)

- [ ] **Step 1: Pass isAdmin in props**

In `public_species_page`:

```ruby
render inertia: 'Plants/PublicSpecies', props: {
  species: serialize_public_species_full(species),
  photos: photos_for_species(species),
  commonNames: common_names_for_species(species),
  varieties: ...,
  genus: ...,
  isAdmin: !!current_member  # logged-in admins see the print link
}
```

- [ ] **Step 2: Show print link conditionally**

In `PublicSpecies.jsx`, accept `isAdmin` prop. After `<PublicFooter />`, before closing `</main>`, add:

```jsx
{isAdmin && (
  <div className="text-center pb-8">
    <a
      href={`/plants/species/${species.id}/card`}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-stone-300 hover:bg-stone-100 text-sm text-stone-700"
    >
      Imprimer la fiche A6
    </a>
  </div>
)}
```

- [ ] **Step 3: Manual verification**

`bin/dev`. Test scenarios:
1. Visit `/s/cardus-demoensis` (or any seeded slug) WITHOUT being logged in. The page renders fully, NO print link.
2. Log in as admin. Visit the same URL. The print link appears.
3. Click "Imprimer la fiche A6". Opens the printable card in a new tab.
4. Visit `/s/martian-plant` (no such species). Returns 404.
5. Test responsive: open dev tools, switch to mobile viewport. Layout adapts (single-column, hero full-width).

- [ ] **Step 4: Run all tests**

```bash
bin/rails test test/integration/public_species_test.rb test/integration/plant_cards_test.rb test/helpers/plant_cards_helper_test.rb
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add app/frontend/pages/Plants/PublicSpecies.jsx app/controllers/app_controller.rb
git commit -m "Public page: admin-only print link

Logged-in admins see a 'Imprimer la fiche A6' button at the bottom that
opens the printable card in a new tab. Public visitors don't see it."
```

---

## Final verification

- [ ] Run `bin/rails test` — all pass
- [ ] `yarn tsc --noEmit` — no new TypeScript errors
- [ ] Manual visit `/s/<slug>` with and without auth
- [ ] Manual visit on mobile viewport (responsive)
- [ ] QR scanned from a printed card resolves correctly
- [ ] 404 on unknown slug

## Out of scope

- Multilingual (will rely on the slug being canonical when locale switching lands)
- Sitemap / structured data (SEO advanced)
- Photo gallery / lightbox (showing 1-3 photos in hero is sufficient for v1)
- Sharing buttons (Twitter, Facebook) — defer
- Analytics events
- Cache headers / CDN optimization
