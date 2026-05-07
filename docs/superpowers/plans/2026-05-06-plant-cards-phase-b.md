# Plant Cards — Phase B: Print Card View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render printable A6 plant cards via `GET /plants/species/:id/card`. The HTML uses `@page { size: A6 }` so users print directly from the browser. The view contains a recto (name, badges, photos, biological cross-section with plant silhouette + human + soil scales) and a verso (calendar, pollination, eco services pictograms, resources, QR code, signature). After this phase, an admin clicks "Imprimer la fiche" on the species detail and a print-ready window opens.

**Architecture:** Server-rendered HTML/ERB with a minimal layout (no Inertia, no AppShell). All SVG inlined as `<symbol>` defs in a partial included once at top of the card view. Plant silhouettes + roots have one partial each per `growth_habit` / `root_system` — the controller picks the right partial. QR code is generated server-side via the `rqrcode` gem and inlined as SVG.

**Tech Stack:** Rails 8.1, ERB, CSS @page, inline SVG, `rqrcode ~> 2.2`. No JS needed for the card itself.

**Spec reference:** `docs/superpowers/specs/2026-05-06-plant-cards-design.md` (sections "Card visual layout", "Strate / Cycle / Successional palettes", "Hardiness conversion"). The validated visual layout is mockup v30 (in `.superpowers/brainstorm/`); use it as the pixel-perfect target.

**Phase A delivered:** schema, validations, vocabulary constants, API serialization, admin form. Phase B uses those fields to render the card.

---

## File Structure

### Files to create

**Controller + layout:**
- `app/controllers/plant_cards_controller.rb` — `show` action only (batch, public are Phase C/D)
- `app/views/layouts/plant_card.html.erb` — minimal HTML5 doc with embedded CSS

**Card views (decomposed by responsibility):**
- `app/views/plant_cards/show.html.erb` — single card (recto + verso pair)
- `app/views/plant_cards/_recto.html.erb` — recto face
- `app/views/plant_cards/_verso.html.erb` — verso face
- `app/views/plant_cards/_svg_defs.html.erb` — all `<symbol>` defs (sun, drop, leaf, eco icons, resource icons, pollination icons, vector icons, human, hardiness)

**Plant silhouettes (one per growth_habit, 9 partials):**
- `app/views/plant_cards/silhouettes/_arbustif_elance.html.erb`
- `app/views/plant_cards/silhouettes/_arbustif_arrondi.html.erb`
- `app/views/plant_cards/silhouettes/_buissonnant_elance.html.erb`
- `app/views/plant_cards/silhouettes/_buissonnant_arrondi.html.erb`
- `app/views/plant_cards/silhouettes/_grimpant.html.erb`
- `app/views/plant_cards/silhouettes/_tige.html.erb`
- `app/views/plant_cards/silhouettes/_touffe.html.erb`
- `app/views/plant_cards/silhouettes/_acaule.html.erb`
- `app/views/plant_cards/silhouettes/_tapissant.html.erb`
- `app/views/plant_cards/silhouettes/_default.html.erb` — fallback when growth_habit is nil

**Roots (one per root_system, 5 partials):**
- `app/views/plant_cards/roots/_taproot.html.erb`
- `app/views/plant_cards/roots/_fibrous.html.erb`
- `app/views/plant_cards/roots/_spreading.html.erb`
- `app/views/plant_cards/roots/_shallow.html.erb`
- `app/views/plant_cards/roots/_deep.html.erb`
- `app/views/plant_cards/roots/_default.html.erb` — fallback when root_system is nil

**Helper + tests:**
- `app/helpers/plant_cards_helper.rb`
- `test/integration/plant_cards_test.rb`

### Files to modify

- `Gemfile` — add `rqrcode` (run `bundle add rqrcode --version "~> 2.2"`)
- `config/routes.rb` — add `get "plants/species/:id/card", to: "plant_cards#show", as: :plant_card` BEFORE the existing `get "plants/*path"` catch-all
- `app/frontend/plant-database/components/SpeciesDetail.tsx` — add an "Imprimer la fiche" button

---

## Tasks

### Task 1: Add rqrcode gem

**Files:**
- Modify: `Gemfile`
- Modify: `Gemfile.lock` (auto-generated)

- [ ] **Step 1: Add the gem**

```bash
cd /Users/michael/.superset/worktrees/terranova/hurricane-citrine
bundle add rqrcode --version "~> 2.2"
```

Expected: gem installed, `Gemfile` and `Gemfile.lock` updated.

- [ ] **Step 2: Smoke check**

```bash
bin/rails runner "require 'rqrcode'; puts RQRCode::QRCode.new('https://example.org').as_svg(viewbox: true, use_path: true)[0..100]"
```

Expected: prints an SVG snippet starting with `<svg`.

- [ ] **Step 3: Commit**

```bash
git add Gemfile Gemfile.lock
git commit -m "Add rqrcode gem for plant card QR codes"
```

---

### Task 2: Bootstrap controller, layout, route

This task delivers the smallest end-to-end render: visit the URL, get a 200 response with the species' latin name. Everything else is later.

**Files:**
- Create: `app/controllers/plant_cards_controller.rb`
- Create: `app/views/layouts/plant_card.html.erb`
- Create: `app/views/plant_cards/show.html.erb`
- Create: `test/integration/plant_cards_test.rb`
- Modify: `config/routes.rb`

- [ ] **Step 1: Write the failing test**

Create `test/integration/plant_cards_test.rb`:

```ruby
require 'test_helper'

class PlantCardsTest < ActionDispatch::IntegrationTest
  setup do
    Plant::Species.delete_all
    @species = Plant::Species.create!(latin_name: 'Amelanchier canadensis', plant_type: 'shrub')
  end

  test 'GET /plants/species/:id/card returns 200' do
    sign_in_test_admin
    get "/plants/species/#{@species.id}/card"
    assert_response :success
    assert_match 'Amelanchier canadensis', response.body
  end
end
```

(Use whatever helper the existing tests use to authenticate. Search `grep -l "sign_in" test/integration/`. If the codebase uses `Member.create` + session manipulation, follow that pattern.)

- [ ] **Step 2: Add the route**

In `config/routes.rb`, add this line BEFORE the `get "plants/*path"` catch-all (around line 84):

```ruby
  get "plants/species/:id/card", to: "plant_cards#show", as: :plant_card
```

- [ ] **Step 3: Create the controller**

`app/controllers/plant_cards_controller.rb`:

```ruby
class PlantCardsController < ApplicationController
  layout "plant_card"

  def show
    @species = Plant::Species.find(params[:id])
  end
end
```

- [ ] **Step 4: Create the minimal layout**

`app/views/layouts/plant_card.html.erb`:

```erb
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Fiche — <%= @species&.latin_name %></title>
  <%= csrf_meta_tags %>
  <%= csp_meta_tag %>
  <style>
    @page { size: A6; margin: 0; }
    @media print { body { margin: 0; } }
    body { font-family: 'Inter', system-ui, sans-serif; margin: 0; }
  </style>
</head>
<body>
  <%= yield %>
</body>
</html>
```

- [ ] **Step 5: Create the minimal show view**

`app/views/plant_cards/show.html.erb`:

```erb
<div><%= @species.latin_name %></div>
```

- [ ] **Step 6: Run the test**

```bash
bin/rails test test/integration/plant_cards_test.rb
```

Expected: 1 passing test.

- [ ] **Step 7: Commit**

```bash
git add app/controllers/plant_cards_controller.rb \
        app/views/layouts/plant_card.html.erb \
        app/views/plant_cards/show.html.erb \
        test/integration/plant_cards_test.rb \
        config/routes.rb
git commit -m "Bootstrap PlantCardsController with A6 print layout

Single endpoint GET /plants/species/:id/card returns the species' latin
name in a layout configured for A6 paper size. All other content is
filled in by subsequent tasks."
```

---

### Task 3: Helpers — palette, hardiness, photos, calendar, warnings, QR

This task delivers all the pure helper logic needed by the views. Tests verify each helper independently.

**Files:**
- Create: `app/helpers/plant_cards_helper.rb`
- Create: `test/helpers/plant_cards_helper_test.rb`

- [ ] **Step 1: Write the failing tests**

Create `test/helpers/plant_cards_helper_test.rb`:

```ruby
require 'test_helper'

class PlantCardsHelperTest < ActionView::TestCase
  include PlantCardsHelper

  test 'strate_label returns French label' do
    assert_equal 'Arbrisseau', strate_label('shrub')
    assert_equal 'Canopée', strate_label('canopy')
    assert_nil strate_label(nil)
  end

  test 'strate_color returns hex' do
    assert_equal '#5A9A2F', strate_color('shrub')
    assert_equal '#1B4D14', strate_color('canopy')
  end

  test 'strate_fg returns contrast color' do
    assert_equal '#fff', strate_fg('shrub')
    assert_equal '#2d4a1f', strate_fg('low')  # light bg → dark text
  end

  test 'hardiness_celsius converts USDA zone to °C' do
    assert_equal '−29 °C', hardiness_celsius('zone-5')
    assert_equal '−40 °C', hardiness_celsius('zone-3')
    assert_nil hardiness_celsius(nil)
    assert_nil hardiness_celsius('')
  end

  test 'cycle_label and cycle_class' do
    assert_equal 'Vivace', cycle_label('perennial')
    assert_equal 'cycle-perennial', cycle_class('perennial')
  end

  test 'role_label and role_class' do
    assert_equal 'Pionnier', role_label('pioneer')
    assert_equal 'role-pioneer', role_class('pioneer')
  end

  test 'pick_photo returns the first photo with the given role' do
    photos = [
      OpenStruct.new(role: 'general', url: 'a'),
      OpenStruct.new(role: 'flower',  url: 'b'),
      OpenStruct.new(role: 'flower',  url: 'c')
    ]
    assert_equal 'b', pick_photo(photos, 'flower').url
    assert_nil pick_photo(photos, 'fruit')
  end

  test 'cell_state classifies a month' do
    species = Struct.new(:flowering_months, :harvest_months).new(['mar', 'apr'], ['jun', 'jul'])
    assert_equal 'flow', cell_state('mar', species)
    assert_equal 'harv', cell_state('jul', species)
    assert_equal 'both', cell_state('aug', Struct.new(:flowering_months, :harvest_months).new(['aug'], ['aug']))
    assert_nil cell_state('feb', species)
  end

  test 'card_warnings collects active flags' do
    s = OpenStruct.new(is_drageonnant: true, allelopathy: '', toxicity: { 'sheep' => ['seeds'] })
    warnings = card_warnings(s)
    assert_includes warnings, 'Drageonne'
    assert(warnings.any? { |w| w.include?('Toxique brebis') })
    assert_not(warnings.any? { |w| w.include?('Allélopath') })
  end

  test 'card_warnings is empty when nothing flagged' do
    s = OpenStruct.new(is_drageonnant: false, allelopathy: '', toxicity: {})
    assert_empty card_warnings(s)
  end

  test 'qr_svg returns inline SVG' do
    svg = qr_svg('https://example.org/foo')
    assert_match(/^<svg/, svg)
    assert_includes svg, 'viewBox'
  end

  test 'plant_height_px scales 1m=33px' do
    assert_equal 165, plant_height_px(500)  # 5m → 165px
    assert_equal 33, plant_height_px(100)
    assert_nil plant_height_px(nil)
    assert_nil plant_height_px(0)
  end

  test 'silhouette_partial picks correct view' do
    s_shrub = OpenStruct.new(growth_habit: 'arbustif-arrondi', strate: 'shrub')
    assert_equal 'plant_cards/silhouettes/arbustif_arrondi', silhouette_partial(s_shrub)
    s_nil = OpenStruct.new(growth_habit: nil, strate: 'shrub')
    assert_equal 'plant_cards/silhouettes/default', silhouette_partial(s_nil)
  end

  test 'roots_partial picks correct view' do
    s = OpenStruct.new(root_system: 'taproot')
    assert_equal 'plant_cards/roots/taproot', roots_partial(s)
    s_nil = OpenStruct.new(root_system: nil)
    assert_equal 'plant_cards/roots/default', roots_partial(s_nil)
  end
end
```

- [ ] **Step 2: Run, confirm fails**

```bash
bin/rails test test/helpers/plant_cards_helper_test.rb
```

Expected: 12+ failures (helper module missing).

- [ ] **Step 3: Implement the helper**

Create `app/helpers/plant_cards_helper.rb`:

```ruby
module PlantCardsHelper
  STRATE_LABELS = {
    'low'          => 'Basse',
    'medium'       => 'Médiane',
    'shrub'        => 'Arbrisseau',
    'tree'         => 'Arbre',
    'canopy'       => 'Canopée',
    'vine'         => 'Grimpante',
    'aquatic'      => 'Aquatique',
    'subterranean' => 'Racinaire'
  }.freeze

  STRATE_COLORS = {
    'low'          => '#C8E6A0',
    'medium'       => '#8FBC4F',
    'shrub'        => '#5A9A2F',
    'tree'         => '#2D7A1F',
    'canopy'       => '#1B4D14',
    'vine'         => '#B45F8E',
    'aquatic'      => '#4A90C2',
    'subterranean' => '#8B5A3C'
  }.freeze

  STRATE_FG = {
    'low' => '#2d4a1f'  # only the light strate uses dark text; others use white
  }.freeze
  STRATE_FG.default = '#fff'

  USDA_TO_CELSIUS = {
    'zone-3' => -40, 'zone-4' => -34, 'zone-5' => -29, 'zone-6' => -23,
    'zone-7' => -18, 'zone-8' => -12, 'zone-9' => -7,  'zone-10' => -1
  }.freeze

  CYCLE_LABELS = {
    'annual'    => 'Annuelle',
    'biennial'  => 'Bisannuelle',
    'perennial' => 'Vivace'
  }.freeze

  ROLE_LABELS = {
    'pioneer' => 'Pionnier',
    'nurse'   => 'Nourricier',
    'climax'  => 'Climax'
  }.freeze

  FOLIAGE_LABELS = {
    'deciduous'      => 'Caduc',
    'semi-evergreen' => 'Semi-persistant',
    'evergreen'      => 'Persistant',
    'marcescent'     => 'Marcescent'
  }.freeze

  ROOT_LABELS = {
    'taproot'   => 'Pivotant',
    'fibrous'   => 'Fasciculé',
    'spreading' => 'Traçant',
    'shallow'   => 'Superficiel',
    'deep'      => 'Profond'
  }.freeze

  PIXELS_PER_METER = 33  # 1 m = 33 px (matches the v30 mockup scale where 1m70 human = 56 px)

  def strate_label(strate); STRATE_LABELS[strate]; end
  def strate_color(strate); STRATE_COLORS[strate]; end
  def strate_fg(strate); STRATE_FG[strate]; end

  def cycle_label(cycle); CYCLE_LABELS[cycle]; end
  def cycle_class(cycle); "cycle-#{cycle}" if cycle; end

  def role_label(role); ROLE_LABELS[role]; end
  def role_class(role); "role-#{role}" if role; end

  def foliage_label(foliage); FOLIAGE_LABELS[foliage]; end

  def root_label(root_system); ROOT_LABELS[root_system]; end

  def hardiness_celsius(zone)
    return nil if zone.blank?
    return nil unless USDA_TO_CELSIUS.key?(zone)
    "#{USDA_TO_CELSIUS[zone].to_s.tr('-', '−')} °C"  # use Unicode minus sign
  end

  def pick_photo(photos, role)
    photos.find { |p| p.role == role }
  end

  def cell_state(month_id, species)
    flow = species.flowering_months.include?(month_id)
    harv = species.harvest_months.include?(month_id)
    return 'both' if flow && harv
    return 'flow' if flow
    return 'harv' if harv
    nil
  end

  def card_warnings(species)
    out = []
    out << 'Drageonne' if species.is_drageonnant
    out << "Allélopathie : #{species.allelopathy}" if species.allelopathy.present?
    Array(species.toxicity).each do |target, parts|
      next if parts.blank?
      target_label = case target.to_s
                     when 'humans' then 'humains'
                     when 'sheep' then 'brebis'
                     when 'dogs' then 'chiens'
                     when 'horses' then 'chevaux'
                     when 'poultry' then 'volaille'
                     when 'cattle' then 'bovins'
                     else target.to_s
                     end
      out << "Toxique #{target_label} (#{parts.join(', ')})"
    end
    out
  end

  def qr_svg(url)
    require 'rqrcode'
    RQRCode::QRCode.new(url).as_svg(
      viewbox: true,
      use_path: true,
      module_size: 4,
      standalone: true
    ).html_safe
  end

  def plant_height_px(height_cm)
    return nil if height_cm.nil? || height_cm.zero?
    (height_cm.to_i * PIXELS_PER_METER / 100.0).round
  end

  def silhouette_partial(species)
    habit = species.growth_habit.to_s.tr('-', '_')
    return 'plant_cards/silhouettes/default' if habit.empty?
    "plant_cards/silhouettes/#{habit}"
  end

  def roots_partial(species)
    rs = species.root_system.to_s
    return 'plant_cards/roots/default' if rs.empty?
    "plant_cards/roots/#{rs}"
  end
end
```

- [ ] **Step 4: Run, confirm pass**

```bash
bin/rails test test/helpers/plant_cards_helper_test.rb
```

Expected: 12+ passing tests.

- [ ] **Step 5: Commit**

```bash
git add app/helpers/plant_cards_helper.rb test/helpers/plant_cards_helper_test.rb
git commit -m "Add PlantCardsHelper with palette, hardiness, photo, calendar, QR helpers

Helpers used by the card view: strate label/color/fg, cycle label/class,
successional role label/class, foliage label, root system label,
hardiness USDA→°C conversion, photo role lookup, calendar cell_state
classifier, card_warnings collector, QR SVG generator, plant height in
pixels, silhouette/roots partial picker."
```

---

### Task 4: SVG defs partial — sun, drop, leaf, human, hardiness

This task creates the `_svg_defs.html.erb` partial with the small icons (sun states, drop with digit, leaf states, human silhouette, hardiness snowflake). Plant silhouettes and roots are separate (Tasks 8/9). Eco/resource/pollination icons are added in Tasks 12/13.

**Files:**
- Create: `app/views/plant_cards/_svg_defs.html.erb`

- [ ] **Step 1: Create the partial with sun, drop, leaf, human symbols**

`app/views/plant_cards/_svg_defs.html.erb`:

```erb
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <!-- Sun states (3 fill levels) -->
    <symbol id="sun-empty" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" fill="none" stroke="#F59E0B" stroke-width="1.7"/>
      <g stroke="#F59E0B" stroke-width="1.7" stroke-linecap="round">
        <line x1="12" y1="2.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.5"/>
        <line x1="2.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.5" y2="12"/>
        <line x1="5.4" y1="5.4" x2="7.2" y2="7.2"/><line x1="16.8" y1="16.8" x2="18.6" y2="18.6"/>
        <line x1="5.4" y1="18.6" x2="7.2" y2="16.8"/><line x1="16.8" y1="7.2" x2="18.6" y2="5.4"/>
      </g>
    </symbol>
    <symbol id="sun-half" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" fill="none" stroke="#F59E0B" stroke-width="1.7"/>
      <path d="M 12 7 A 5 5 0 0 1 12 17 Z" fill="#F59E0B"/>
      <g stroke="#F59E0B" stroke-width="1.7" stroke-linecap="round">
        <line x1="12" y1="2.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.5"/>
        <line x1="2.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.5" y2="12"/>
        <line x1="5.4" y1="5.4" x2="7.2" y2="7.2"/><line x1="16.8" y1="16.8" x2="18.6" y2="18.6"/>
        <line x1="5.4" y1="18.6" x2="7.2" y2="16.8"/><line x1="16.8" y1="7.2" x2="18.6" y2="5.4"/>
      </g>
    </symbol>
    <symbol id="sun-full" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" fill="#F59E0B"/>
      <g stroke="#F59E0B" stroke-width="1.7" stroke-linecap="round">
        <line x1="12" y1="2.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.5"/>
        <line x1="2.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.5" y2="12"/>
        <line x1="5.4" y1="5.4" x2="7.2" y2="7.2"/><line x1="16.8" y1="16.8" x2="18.6" y2="18.6"/>
        <line x1="5.4" y1="18.6" x2="7.2" y2="16.8"/><line x1="16.8" y1="7.2" x2="18.6" y2="5.4"/>
      </g>
    </symbol>

    <!-- Drop clip path (used by water level rendering) -->
    <clipPath id="drop-clip" clipPathUnits="userSpaceOnUse">
      <path d="M12 2 C 7 9 4 13 4 16.5 C 4 20 7 22 12 22 C 17 22 20 20 20 16.5 C 20 13 17 9 12 2 Z"/>
    </clipPath>

    <!-- Leaf states (4 fill modes for foliage_type) -->
    <pattern id="leaf-hatch" patternUnits="userSpaceOnUse" width="3" height="3" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="3" stroke="#5A9A2F" stroke-width="1.2"/>
    </pattern>
    <symbol id="leaf-deciduous" viewBox="0 0 24 24">
      <path d="M12 2 C 4 4 2 11 5 17 C 8 22 12 22 12 22 C 12 22 16 22 19 17 C 22 11 20 4 12 2 Z"
            stroke="#5A9A2F" stroke-width="1.6" fill="none" stroke-linejoin="round"/>
      <line x1="12" y1="3" x2="12" y2="22" stroke="#5A9A2F" stroke-width="1" stroke-dasharray="2 2"/>
    </symbol>
    <symbol id="leaf-marcescent" viewBox="0 0 24 24">
      <path d="M12 2 C 4 4 2 11 5 17 C 8 22 12 22 12 22 C 12 22 16 22 19 17 C 22 11 20 4 12 2 Z"
            stroke="#5A9A2F" stroke-width="1.6" fill="url(#leaf-hatch)" stroke-linejoin="round"/>
      <line x1="12" y1="3" x2="12" y2="22" stroke="#5A9A2F" stroke-width="1"/>
    </symbol>
    <symbol id="leaf-semi" viewBox="0 0 24 24">
      <path d="M12 2 C 4 4 2 11 5 17 C 8 22 12 22 12 22 L 12 2 Z"
            stroke="#5A9A2F" stroke-width="1.6" fill="none" stroke-linejoin="round"/>
      <path d="M12 2 C 12 22 12 22 12 22 C 12 22 16 22 19 17 C 22 11 20 4 12 2 Z"
            stroke="#5A9A2F" stroke-width="1.6" fill="#5A9A2F" stroke-linejoin="round"/>
    </symbol>
    <symbol id="leaf-evergreen" viewBox="0 0 24 24">
      <path d="M12 2 C 4 4 2 11 5 17 C 8 22 12 22 12 22 C 12 22 16 22 19 17 C 22 11 20 4 12 2 Z"
            stroke="#5A9A2F" stroke-width="1.6" fill="#5A9A2F" stroke-linejoin="round"/>
      <line x1="12" y1="3" x2="12" y2="22" stroke="#fff" stroke-width="1"/>
    </symbol>

    <!-- Human (1m70 = 56px = constant scale across all cards) -->
    <symbol id="human-1m70" viewBox="0 0 28 56">
      <circle cx="14" cy="6" r="4.5" fill="#1f2937"/>
      <path d="M14 11 L14 30" stroke="#1f2937" stroke-width="3" stroke-linecap="round"/>
      <path d="M14 17 L7 25" stroke="#1f2937" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M14 17 L21 25" stroke="#1f2937" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M14 30 L8 54" stroke="#1f2937" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M14 30 L20 54" stroke="#1f2937" stroke-width="2.8" stroke-linecap="round"/>
    </symbol>
  </defs>
</svg>
```

- [ ] **Step 2: Smoke test that the partial renders**

Add a render call temporarily in `show.html.erb`:

```erb
<%= render 'plant_cards/svg_defs' %>
<svg width="40" height="40"><use href="#sun-full"/></svg>
```

Then run the test:
```bash
bin/rails test test/integration/plant_cards_test.rb
```

Expected: still passes (200 OK). The `<svg>` defs render and the test sun icon is included.

After the test passes, REMOVE the temporary `<svg>` from `show.html.erb` (we'll re-include it properly in Task 5).

- [ ] **Step 3: Commit**

```bash
git add app/views/plant_cards/_svg_defs.html.erb app/views/plant_cards/show.html.erb
git commit -m "Add SVG defs partial for plant card icons

Sun (3 states), drop clip, leaf (4 foliage_type fills), human silhouette
(1m70 = 56px constant scale). Eco/resource/pollination icons land in
later tasks alongside their consumers."
```

---

### Task 5: Recto layout skeleton — strate bar, header, badges

**Files:**
- Create: `app/views/plant_cards/_recto.html.erb`
- Modify: `app/views/plant_cards/show.html.erb`
- Modify: `app/views/layouts/plant_card.html.erb` (add the card-specific CSS)

- [ ] **Step 1: Replace the show view to render recto + verso pair**

`app/views/plant_cards/show.html.erb`:

```erb
<%= render 'plant_cards/svg_defs' %>
<div class="card-stage">
  <%= render 'plant_cards/recto', species: @species, photos: @photos %>
  <%= render 'plant_cards/verso', species: @species %>
</div>
```

Update `PlantCardsController#show` to fetch photos:

```ruby
def show
  @species = Plant::Species.find(params[:id])
  @photos = Plant::Photo.where(target_type: 'species', target_id: @species.id)
end
```

- [ ] **Step 2: Stub the verso so the render call succeeds**

`app/views/plant_cards/_verso.html.erb`:

```erb
<div class="a6 strate-<%= species.strate %>"><div class="strate-bar"></div></div>
```

(Just enough for the page to render. Real verso content lands in Tasks 14–18.)

- [ ] **Step 3: Create the recto with strate bar + header**

`app/views/plant_cards/_recto.html.erb`:

```erb
<div class="a6 strate-<%= species.strate %>" data-face="recto">
  <div class="strate-bar"></div>
  <div class="body">
    <div class="header-row">
      <div>
        <h1><%= species.common_names_fr.presence || species.latin_name %></h1>
        <div class="latin"><%= species.latin_name %></div>
        <div class="badge-row">
          <% if species.strate %>
            <span class="strate-badge"><%= strate_label(species.strate) %></span>
          <% end %>
          <% if species.life_cycle %>
            <span class="cycle-chip <%= cycle_class(species.life_cycle) %>"><%= cycle_label(species.life_cycle) %></span>
          <% end %>
          <% if species.successional_role %>
            <span class="role-chip <%= role_class(species.successional_role) %>"><%= role_label(species.successional_role) %></span>
          <% end %>
        </div>
        <div class="dim-line">
          <% if species.height_min_cm && species.height_max_cm %>
            <span class="item"><span class="ic">↕</span> <%= species.height_min_cm/100.0 %>–<%= species.height_max_cm/100.0 %> m</span>
            <span class="sep">·</span>
          <% end %>
          <% if species.spread_min_cm && species.spread_max_cm %>
            <span class="item"><span class="ic">↔</span> <%= species.spread_min_cm/100.0 %>–<%= species.spread_max_cm/100.0 %> m</span>
            <span class="sep">·</span>
          <% end %>
          <% if species.planting_spacing_cm %>
            <span class="item"><span class="ic">⇿</span> Espacement <%= species.planting_spacing_cm/100.0 %> m</span>
          <% end %>
        </div>
      </div>
      <% if hardiness_celsius(species.hardiness) %>
        <span class="hardiness-tag"><span class="ic">❄</span><%= hardiness_celsius(species.hardiness) %></span>
      <% end %>
    </div>
    <%# Photos, sky tiles, cross-section come in Tasks 6, 11, 7-10 %>
  </div>
</div>
```

- [ ] **Step 4: Add the card CSS to the layout**

In `app/views/layouts/plant_card.html.erb`, replace the `<style>` block with the full card stylesheet. This is the v30 mockup CSS adapted to ERB. **Keep this in the layout for now**; if it gets unwieldy we'll extract to a separate file in a later task.

```erb
<style>
  @page { size: A6; margin: 0; }
  @media print {
    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .card-stage { gap: 0; }
    .a6 { page-break-after: always; box-shadow: none; }
  }
  body { font-family: 'Inter', system-ui, sans-serif; margin: 0; background: #f0f0f0; padding: 24px; }
  .card-stage { display: flex; flex-direction: column; gap: 24px; align-items: center; }

  /* Strate palette via class */
  .strate-low        { --strate: #C8E6A0; --strate-fg: #2d4a1f; --plant: #6b9b3a; }
  .strate-medium     { --strate: #8FBC4F; --strate-fg: #fff;    --plant: #5a9a2f; }
  .strate-shrub      { --strate: #5A9A2F; --strate-fg: #fff;    --plant: #3d7a1f; }
  .strate-tree       { --strate: #2D7A1F; --strate-fg: #fff;    --plant: #1f5a14; }
  .strate-canopy     { --strate: #1B4D14; --strate-fg: #fff;    --plant: #143d0e; }
  .strate-vine       { --strate: #B45F8E; --strate-fg: #fff;    --plant: #8a4a6e; }
  .strate-aquatic    { --strate: #4A90C2; --strate-fg: #fff;    --plant: #357494; }
  .strate-subterranean { --strate: #8B5A3C; --strate-fg: #fff;  --plant: #6e4630; }

  .a6 {
    width: 396px; height: 558px;
    background: #FFFFFF;
    color: #1f2937;
    border-radius: 6px;
    box-shadow: 0 12px 40px rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.08);
    position: relative;
    overflow: hidden;
    font-size: 11px;
  }
  .strate-bar { position: absolute; top: 0; left: 0; right: 0; height: 6px; background: var(--strate); z-index: 6; }

  .a6 .body { padding: 22px 18px 0; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; position: relative; z-index: 3; }

  .a6 h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 27px; line-height: 1; margin: 0; letter-spacing: -0.01em; color: #1f2937; }
  .a6 .latin { font-style: italic; font-size: 12px; color: #6b7280; letter-spacing: 0.01em; margin-top: 3px; }

  .header-row { display: flex; align-items: flex-start; gap: 8px; }
  .header-row > div:first-child { flex: 1; }

  .hardiness-tag {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 700; color: #234766;
    background: #dde4ec; padding: 4px 10px; border-radius: 999px;
    white-space: nowrap;
  }
  .hardiness-tag .ic { font-size: 13px; }

  .badge-row { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; margin-top: 7px; }
  .strate-badge {
    display: inline-flex; align-items: center;
    padding: 4px 11px; border-radius: 999px;
    font-size: 9.5px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase;
    background: var(--strate); color: var(--strate-fg);
  }
  .cycle-chip {
    display: inline-flex; align-items: center;
    padding: 4px 11px; border-radius: 999px;
    font-size: 9.5px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase;
  }
  .cycle-annual    { background: #F4D35E; color: #5C4500; }
  .cycle-biennial  { background: #EE964B; color: #fff; }
  .cycle-perennial { background: #274C77; color: #fff; }

  .role-chip {
    display: inline-flex; align-items: center;
    padding: 4px 11px; border-radius: 999px;
    font-size: 9.5px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase;
  }
  .role-pioneer { background: #E07A47; color: #fff; }
  .role-nurse   { background: #B8916A; color: #fff; }
  .role-climax  { background: #1B4D52; color: #fff; }

  .dim-line { margin-top: 6px; font-size: 10px; color: #6b7280; display: flex; gap: 9px; align-items: center; flex-wrap: wrap; line-height: 1.3; }
  .dim-line .item { display: inline-flex; align-items: center; gap: 4px; }
  .dim-line .ic { color: #234766; font-weight: 700; font-size: 11px; }
  .dim-line .sep { color: #cbd5e1; }

  /* Subsequent task CSS sections will be appended here */
</style>
```

- [ ] **Step 5: Test the render**

```bash
bin/rails test test/integration/plant_cards_test.rb
```

Add an assertion that the strate badge renders:

```ruby
test 'GET card renders strate badge when set' do
  @species.update!(strate: 'shrub')
  sign_in_test_admin
  get "/plants/species/#{@species.id}/card"
  assert_match 'strate-badge', response.body
  assert_match 'Arbrisseau', response.body
end
```

Run it and confirm pass.

- [ ] **Step 6: Visual smoke (manual)**

```bash
bin/dev
# Then visit http://localhost:3000/plants/species/<id>/card
```

You should see a single A6-sized card with the species name, badges, dim-line. The verso is just the strate-bar at this point.

- [ ] **Step 7: Commit**

```bash
git add app/views/plant_cards/_recto.html.erb \
        app/views/plant_cards/_verso.html.erb \
        app/views/plant_cards/show.html.erb \
        app/views/layouts/plant_card.html.erb \
        app/controllers/plant_cards_controller.rb \
        test/integration/plant_cards_test.rb
git commit -m "Recto skeleton: strate bar, header, badges, dim-line, hardiness tag"
```

---

### Task 6: Recto photos floraison/fruit

**Files:**
- Modify: `app/views/plant_cards/_recto.html.erb`
- Modify: `app/views/layouts/plant_card.html.erb` (CSS for `.hero-split`)

- [ ] **Step 1: Add the hero-split block to the recto**

Insert after the closing `</div>` of `.header-row` and before the `<%# Photos %>` comment:

```erb
    <div class="hero-split">
      <% flower = pick_photo(photos, 'flower') %>
      <% fruit = pick_photo(photos, 'fruit') %>
      <div class="photo-tile <%= flower ? 'has-img' : 'empty' %>">
        <% if flower %>
          <img src="<%= flower.url %>" alt="<%= flower.caption.presence || 'Floraison' %>">
        <% end %>
        <span class="role-tag">Floraison</span>
      </div>
      <div class="photo-tile <%= fruit ? 'has-img' : 'empty' %>">
        <% if fruit %>
          <img src="<%= fruit.url %>" alt="<%= fruit.caption.presence || 'Fruit' %>">
        <% end %>
        <span class="role-tag">Fruit</span>
      </div>
    </div>
```

- [ ] **Step 2: Add the CSS**

Append to the `<style>` block in the layout:

```css
  .hero-split { margin-top: 10px; height: 130px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
  .photo-tile { border-radius: 4px; overflow: hidden; position: relative; background: #fff; }
  .photo-tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .photo-tile.empty {
    background: repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 6px, #fafafa 6px, #fafafa 12px);
    border: 1px dashed #d1d5db;
  }
  .photo-tile.empty::after {
    content: "Photo manquante";
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    font-size: 8px; color: #9ca3af; letter-spacing: .1em; text-transform: uppercase;
  }
  .photo-tile .role-tag {
    position: absolute; bottom: 6px; left: 6px;
    font-size: 8px; background: rgba(255,255,255,.92); padding: 2px 7px;
    border-radius: 999px; color: #234766; font-weight: 700;
    letter-spacing: .14em; text-transform: uppercase;
  }
```

- [ ] **Step 3: Add a test**

```ruby
test 'photos render with role tags' do
  Plant::Contributor.create!(id: 1, name: 'X', avatar_url: '', joined_at: Date.current, lab_id: 'l')
  Plant::Photo.create!(target_type: 'species', target_id: @species.id, role: 'flower', url: 'https://example.org/f.jpg', contributor_id: 1)
  sign_in_test_admin
  get "/plants/species/#{@species.id}/card"
  assert_match 'https://example.org/f.jpg', response.body
  assert_match 'Floraison', response.body
  assert_match 'Photo manquante', response.body  # fruit photo missing
end
```

Run and confirm pass.

- [ ] **Step 4: Commit**

```bash
git add app/views/plant_cards/_recto.html.erb \
        app/views/layouts/plant_card.html.erb \
        test/integration/plant_cards_test.rb
git commit -m "Recto photos: floraison + fruit with hatched placeholder fallback"
```

---

### Task 7: Cross-section frame — above-ground + below-ground containers

**Files:**
- Modify: `app/views/plant_cards/_recto.html.erb`
- Modify: `app/views/layouts/plant_card.html.erb`

- [ ] **Step 1: Add the cross-section structure to recto**

Append to recto's `.body` (before its closing `</div>`):

```erb
    <div class="cross-section">
      <div class="above-ground">
        <div class="human"><svg viewBox="0 0 28 56"><use href="#human-1m70"/></svg></div>
        <%# Sky tiles in Task 11; plant silhouette in Task 8 %>
      </div>
      <div class="below-ground">
        <%# Roots in Task 9; soil scales in Task 10 %>
      </div>
      <div class="ground-line"></div>
      <div class="grass"></div>
    </div>
```

- [ ] **Step 2: Add the CSS**

```css
  .cross-section {
    margin-top: auto;
    margin-left: -18px; margin-right: -18px;
    height: 270px;
    position: relative;
    display: grid;
    grid-template-rows: 160px 110px;
    z-index: 2;
  }
  .above-ground { position: relative; background: transparent; overflow: visible; }
  .below-ground { position: relative; background: linear-gradient(to bottom, #6b4f30 0%, #4a3621 100%); overflow: hidden; }
  .ground-line { position: absolute; left: 0; right: 0; top: 160px; height: 2px; background: #2d2519; z-index: 4; }
  .grass {
    position: absolute; left: 0; right: 0; top: 156px; height: 6px;
    background: repeating-linear-gradient(85deg, #5A9A2F 0 1px, transparent 1px 4px);
    opacity: 0.7; z-index: 5;
  }
  .human { position: absolute; left: 6px; bottom: 0; width: 28px; height: 56px; z-index: 4; }
  .human svg { width: 100%; height: 100%; }
```

- [ ] **Step 3: Visual smoke**

`bin/dev`, visit the card. Should see: photos, then below them a brown soil block ~110px tall with a green-grass strip on top, and the human silhouette standing on the ground line.

- [ ] **Step 4: Commit**

```bash
git add app/views/plant_cards/_recto.html.erb app/views/layouts/plant_card.html.erb
git commit -m "Cross-section frame: above-ground + below-ground + ground-line + grass + human"
```

---

### Task 8: Plant silhouettes library (9 partials + default)

This is mechanical — 10 small SVG partials, each rendering a stylised plant shape sized so the canopy width = 130 px and trunk extends down to the ground line.

**Files:**
- Create: `app/views/plant_cards/silhouettes/_arbustif_arrondi.html.erb`
- Create: `app/views/plant_cards/silhouettes/_arbustif_elance.html.erb`
- Create: `app/views/plant_cards/silhouettes/_buissonnant_arrondi.html.erb`
- Create: `app/views/plant_cards/silhouettes/_buissonnant_elance.html.erb`
- Create: `app/views/plant_cards/silhouettes/_grimpant.html.erb`
- Create: `app/views/plant_cards/silhouettes/_tige.html.erb`
- Create: `app/views/plant_cards/silhouettes/_touffe.html.erb`
- Create: `app/views/plant_cards/silhouettes/_acaule.html.erb`
- Create: `app/views/plant_cards/silhouettes/_tapissant.html.erb`
- Create: `app/views/plant_cards/silhouettes/_default.html.erb`
- Modify: `app/views/plant_cards/_recto.html.erb` to render the picked partial
- Modify: `app/views/layouts/plant_card.html.erb` (CSS for `.plant-bg`)

Each partial receives `species` and `height_px` (already-computed by helper) as locals. Inside, an SVG sized `0 0 240 height_px` with the canopy at top and trunk to the bottom (the ground line).

- [ ] **Step 1: Create _arbustif_arrondi.html.erb**

```erb
<svg viewBox="0 0 240 <%= height_px %>" preserveAspectRatio="xMidYEnd meet">
  <ellipse cx="120" cy="<%= height_px - 50 %>" rx="115" ry="50" fill="var(--plant)" opacity=".88"/>
  <ellipse cx="75" cy="<%= height_px - 30 %>" rx="55" ry="32" fill="var(--plant)" opacity=".75"/>
  <ellipse cx="170" cy="<%= height_px - 35 %>" rx="55" ry="30" fill="var(--plant)" opacity=".75"/>
  <% trunk_top = [height_px - 100, 0].max %>
  <rect x="116" y="<%= trunk_top %>" width="8" height="<%= height_px - trunk_top %>" fill="#5a4a36"/>
</svg>
```

(Trunk grows downward from canopy to ground.)

- [ ] **Step 2: Create the other 8 silhouettes following the same convention**

Each has its own canopy shape:

- `_arbustif_elance.html.erb`: tall narrow ellipse (rx=80, ry=70)
- `_buissonnant_arrondi.html.erb`: wide round canopy at the top, low trunk (~30 px)
- `_buissonnant_elance.html.erb`: tall narrow bushy
- `_grimpant.html.erb`: vertical line (support) + several leaf clusters along it
- `_tige.html.erb`: single thin stem with a small leaf cluster at top
- `_touffe.html.erb`: low wide cluster (rx=110, ry=20)
- `_acaule.html.erb`: very low rosette (height_px under 30)
- `_tapissant.html.erb`: long thin strip at very bottom (rx=118, ry=5)
- `_default.html.erb`: simple ellipse + thin trunk (used when growth_habit is nil)

For each: viewBox is `0 0 240 <%= height_px %>`, fills use `var(--plant)`. Trunk in `#5a4a36`.

(You can keep the SVGs minimal — they're stylised, not botanically accurate. The v30 mockup uses 3 stacked ellipses for arbustif_arrondi which is enough.)

- [ ] **Step 3: Add the .plant-bg container to recto**

Inside `.cross-section .above-ground`, BEFORE the `<div class="human">`:

```erb
<% height_px = plant_height_px(species.height_max_cm) || 100 %>
<div class="plant-bg" style="bottom: 110px; height: <%= height_px %>px;">
  <%= render silhouette_partial(species), species: species, height_px: height_px %>
</div>
```

- [ ] **Step 4: Add the .plant-bg CSS**

```css
  .plant-bg {
    position: absolute;
    left: -21px;
    width: 240px;
    z-index: 1;
    pointer-events: none;
    -webkit-mask-image: linear-gradient(to top,
      rgba(0,0,0,1) 0,
      rgba(0,0,0,1) 150px,
      rgba(0,0,0,0.22) 170px,
      rgba(0,0,0,0.22) 100%);
    mask-image: linear-gradient(to top,
      rgba(0,0,0,1) 0,
      rgba(0,0,0,1) 150px,
      rgba(0,0,0,0.22) 170px,
      rgba(0,0,0,0.22) 100%);
  }
  .plant-bg svg { width: 100%; height: 100%; display: block; }
```

- [ ] **Step 5: Test**

Add an assertion that the right silhouette partial is invoked:

```ruby
test 'silhouette partial selected by growth_habit' do
  @species.update!(growth_habit: 'arbustif-arrondi', height_max_cm: 500)
  sign_in_test_admin
  get "/plants/species/#{@species.id}/card"
  assert_match 'class="plant-bg"', response.body
  # The silhouette renders its trunk
  assert_match 'fill="#5a4a36"', response.body
end
```

Run and confirm pass.

- [ ] **Step 6: Commit**

```bash
git add app/views/plant_cards/silhouettes/ \
        app/views/plant_cards/_recto.html.erb \
        app/views/layouts/plant_card.html.erb \
        test/integration/plant_cards_test.rb
git commit -m "Plant silhouettes library: 9 partials per growth_habit + default

Each partial renders an SVG sized 0 0 240 height_px with canopy at top
and trunk descending to the ground line. The silhouette_partial helper
picks the right one. plant-bg container uses a CSS mask gradient so the
silhouette is full-opacity inside the cross-section and faded above
(useful for tall trees that overflow the cross-section)."
```

---

### Task 9: Roots library (5 partials + default)

**Files:**
- Create: `app/views/plant_cards/roots/_taproot.html.erb`
- Create: `app/views/plant_cards/roots/_fibrous.html.erb`
- Create: `app/views/plant_cards/roots/_spreading.html.erb`
- Create: `app/views/plant_cards/roots/_shallow.html.erb`
- Create: `app/views/plant_cards/roots/_deep.html.erb`
- Create: `app/views/plant_cards/roots/_default.html.erb`
- Modify: `app/views/plant_cards/_recto.html.erb`
- Modify: `app/views/layouts/plant_card.html.erb`

Each partial draws root paths in `#d4b896` strokes against the brown soil. ViewBox `0 0 240 110`. Below the trunk (x=120) downward.

- [ ] **Step 1: Create the 6 root partials**

`_taproot.html.erb` (deep vertical taproot):

```erb
<svg viewBox="0 0 240 110" preserveAspectRatio="xMidYStart meet">
  <path d="M120 0 L120 100" stroke-width="2.5"/>
  <path d="M120 25 Q 100 35 95 60"/>
  <path d="M120 25 Q 140 35 145 60"/>
  <line x1="120" y1="60" x2="115" y2="90"/>
  <line x1="120" y1="60" x2="125" y2="90"/>
</svg>
```

`_fibrous.html.erb` (many fine threads):

```erb
<svg viewBox="0 0 240 110" preserveAspectRatio="xMidYStart meet">
  <% (-5..5).each do |i| %>
    <line x1="120" y1="0" x2="<%= 120 + i*10 %>" y2="<%= 70 + (i.abs * 4) %>"/>
  <% end %>
</svg>
```

`_spreading.html.erb` (horizontal spread — Amélanchier-style traçant):

```erb
<svg viewBox="0 0 240 110" preserveAspectRatio="xMidYStart meet">
  <path d="M120 0 L120 22"/>
  <path d="M120 22 Q70 26 30 32 Q12 36 4 42"/>
  <path d="M120 22 Q90 28 50 36 Q22 42 8 50"/>
  <path d="M120 22 Q170 26 210 32 Q228 36 236 42"/>
  <path d="M120 22 Q150 28 190 36 Q218 42 232 50"/>
  <line x1="40" y1="34" x2="40" y2="62"/>
  <line x1="65" y1="38" x2="65" y2="68"/>
  <line x1="90" y1="34" x2="90" y2="62"/>
  <line x1="150" y1="34" x2="150" y2="62"/>
  <line x1="175" y1="38" x2="175" y2="68"/>
  <line x1="200" y1="34" x2="200" y2="62"/>
</svg>
```

`_shallow.html.erb` (wide near surface, low depth):

```erb
<svg viewBox="0 0 240 110" preserveAspectRatio="xMidYStart meet">
  <path d="M120 0 L120 18"/>
  <path d="M120 18 Q60 22 20 30"/>
  <path d="M120 18 Q180 22 220 30"/>
  <path d="M40 28 Q30 40 25 55"/>
  <path d="M200 28 Q210 40 215 55"/>
</svg>
```

`_deep.html.erb` (mostly downward, no spread):

```erb
<svg viewBox="0 0 240 110" preserveAspectRatio="xMidYStart meet">
  <path d="M120 0 L120 100" stroke-width="2.5"/>
  <line x1="115" y1="40" x2="100" y2="80"/>
  <line x1="125" y1="40" x2="140" y2="80"/>
</svg>
```

`_default.html.erb` (simple cross):

```erb
<svg viewBox="0 0 240 110" preserveAspectRatio="xMidYStart meet">
  <path d="M120 0 L120 80"/>
  <path d="M120 30 L80 60"/>
  <path d="M120 30 L160 60"/>
</svg>
```

- [ ] **Step 2: Add the .roots container to recto**

Inside `.cross-section .below-ground`, at the top:

```erb
<div class="roots">
  <%= render roots_partial(species), species: species %>
</div>
```

- [ ] **Step 3: Add the CSS**

```css
  .roots { position: absolute; left: -21px; top: 0; width: 240px; height: 100%; z-index: 3; }
  .roots svg { width: 100%; height: 100%; display: block; }
  .roots svg path,
  .roots svg line {
    stroke: #d4b896;
    fill: none;
    stroke-width: 1.6;
    stroke-linecap: round;
    opacity: .85;
  }
```

- [ ] **Step 4: Add a test**

```ruby
test 'roots partial selected by root_system' do
  @species.update!(root_system: 'spreading')
  sign_in_test_admin
  get "/plants/species/#{@species.id}/card"
  assert_match 'class="roots"', response.body
end
```

- [ ] **Step 5: Commit**

```bash
git add app/views/plant_cards/roots/ \
        app/views/plant_cards/_recto.html.erb \
        app/views/layouts/plant_card.html.erb \
        test/integration/plant_cards_test.rb
git commit -m "Roots library: 5 partials per root_system + default"
```

---

### Task 10: Soil scales (texture, humus, pH)

**Files:**
- Modify: `app/views/plant_cards/_recto.html.erb`
- Modify: `app/views/layouts/plant_card.html.erb`
- Modify: `app/helpers/plant_cards_helper.rb` (add a `soil_scale_segments` helper)

- [ ] **Step 1: Add helper for soil scale**

In `app/helpers/plant_cards_helper.rb`, add:

```ruby
TEXTURE_ORDER = %w[light balanced heavy].freeze
HUMUS_ORDER   = %w[poor moderate rich].freeze
PH_ORDER      = %w[acid neutral basic].freeze

# Returns array of booleans, one per segment, indicating which are "active"
def soil_scale_segments(values, order)
  active = Array(values).map(&:to_s)
  order.map { |id| active.include?(id) }
end
```

(The model stores `soil_richness` as a single string like `'moderate'`, but the spec uses `humus` as the displayed scale. Map `soil_richness` to `[richness]` if you want active=single-segment, or treat `poor/very-rich` as ranges. For v1, just include the single value.)

In the view, you'll convert `soil_richness` to a 1-element array.

- [ ] **Step 2: Add the .soil-scales block to .below-ground**

After the `<div class="roots">…</div>`:

```erb
<div class="soil-scales">
  <% texture_segs = soil_scale_segments(species.soil_texture, TEXTURE_ORDER) %>
  <% humus_segs   = soil_scale_segments([species.soil_richness], HUMUS_ORDER) %>
  <% ph_segs      = soil_scale_segments(species.soil_ph, PH_ORDER) %>
  <% [
    ['Texture', %w[Léger Équil. Lourd], texture_segs],
    ['Humus',   %w[Pauvre Moyen Riche], humus_segs],
    ['pH',      %w[Acide Neutre Basique], ph_segs]
  ].each do |label, ticks, segs| %>
    <div class="soil-scale">
      <span class="axis-label"><%= label %></span>
      <div class="axis-stack">
        <div class="axis">
          <% segs.each do |on| %>
            <div class="seg <%= 'on' if on %>"></div>
          <% end %>
        </div>
        <div class="axis-ticks">
          <% ticks.each do |t| %><span><%= t %></span><% end %>
        </div>
      </div>
    </div>
  <% end %>
</div>

<% if species.root_system %>
  <div class="root-type-label">Racines<strong><%= root_label(species.root_system) %></strong></div>
<% end %>
```

- [ ] **Step 3: Add the CSS**

```css
  .soil-scales {
    position: absolute;
    right: 12px; top: 8px; bottom: 22px;
    width: 200px;
    display: flex; flex-direction: column;
    justify-content: space-around;
    z-index: 4;
  }
  .soil-scale { display: grid; grid-template-columns: 44px 1fr; gap: 8px; align-items: center; }
  .soil-scale .axis-label { font-size: 8.5px; color: #f5e6c8; text-transform: uppercase; letter-spacing: .12em; font-weight: 800; }
  .soil-scale .axis-stack { display: flex; flex-direction: column; gap: 2px; }
  .soil-scale .axis { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px; height: 7px; }
  .soil-scale .axis .seg { background: rgba(255,255,255,.13); border-radius: 1px; }
  .soil-scale .axis .seg.on { background: #f5e6c8; }
  .soil-scale .axis-ticks { display: grid; grid-template-columns: 1fr 1fr 1fr; font-size: 7px; color: #b89870; letter-spacing: .03em; }
  .soil-scale .axis-ticks span:nth-child(1) { text-align: left; }
  .soil-scale .axis-ticks span:nth-child(2) { text-align: center; }
  .soil-scale .axis-ticks span:nth-child(3) { text-align: right; }
  .root-type-label {
    position: absolute; left: 14px; bottom: 6px;
    font-size: 7.5px; color: #d4b896;
    text-transform: uppercase; letter-spacing: .14em; font-weight: 700; z-index: 5;
  }
  .root-type-label strong { color: #f5e6c8; font-size: 9.5px; margin-left: 4px; }
```

- [ ] **Step 4: Test**

```ruby
test 'soil scales render with active segments' do
  @species.update!(soil_texture: ['balanced', 'heavy'], soil_richness: 'moderate', soil_ph: ['acid', 'neutral'])
  sign_in_test_admin
  get "/plants/species/#{@species.id}/card"
  assert_match 'class="soil-scales"', response.body
  assert_match 'Texture', response.body
  assert_match 'pH', response.body
end
```

- [ ] **Step 5: Commit**

```bash
git add app/views/plant_cards/_recto.html.erb \
        app/views/layouts/plant_card.html.erb \
        app/helpers/plant_cards_helper.rb \
        test/integration/plant_cards_test.rb
git commit -m "Soil scales: texture, humus, pH bars + root type label"
```

---

### Task 11: Sky tiles — feuillage, soleil, eau

**Files:**
- Modify: `app/views/plant_cards/_recto.html.erb`
- Modify: `app/views/layouts/plant_card.html.erb`
- Modify: `app/helpers/plant_cards_helper.rb` (add `sun_state_id`, `leaf_symbol_id` helpers)

- [ ] **Step 1: Add helpers**

```ruby
def sun_state_id(exposures)
  ex = Array(exposures).map(&:to_s)
  return 'sun-empty' if ex == ['shade'] || ex.empty?
  return 'sun-full'  if ex.include?('sun')
  'sun-half'
end

def leaf_symbol_id(foliage_type)
  case foliage_type
  when 'deciduous'      then 'leaf-deciduous'
  when 'marcescent'     then 'leaf-marcescent'
  when 'semi-evergreen' then 'leaf-semi'
  when 'evergreen'      then 'leaf-evergreen'
  else 'leaf-deciduous'
  end
end

def water_level_int(watering_need)
  return nil if watering_need.blank?
  Integer(watering_need) rescue nil
end
```

- [ ] **Step 2: Add the sky-tiles block to .above-ground (after the .human)**

```erb
<div class="sky-tiles">
  <div class="sky-tile">
    <span class="icon-side"><span class="leaf-icon"><svg viewBox="0 0 24 24"><use href="#<%= leaf_symbol_id(species.foliage_type) %>"/></svg></span></span>
    <div class="text-side">
      <span class="lbl">Feuillage</span>
      <span class="val"><%= foliage_label(species.foliage_type) || '—' %></span>
    </div>
  </div>
  <div class="sky-tile">
    <span class="icon-side"><span class="sun-icon"><svg viewBox="0 0 24 24"><use href="#<%= sun_state_id(species.exposures) %>"/></svg></span></span>
    <div class="text-side">
      <span class="lbl">Soleil</span>
      <span class="val">
        <% case sun_state_id(species.exposures) %>
        <% when 'sun-full'  %>Plein soleil
        <% when 'sun-half'  %>Mi-ombre
        <% when 'sun-empty' %>Ombre
        <% end %>
      </span>
    </div>
  </div>
  <div class="sky-tile">
    <span class="icon-side">
      <% level = water_level_int(species.watering_need) %>
      <% fill_y = level ? (24 - (level * 4) - 0.5) : 24 %>
      <span class="drop-icon">
        <svg viewBox="0 0 24 24">
          <path d="M12 2 C 7 9 4 13 4 16.5 C 4 20 7 22 12 22 C 17 22 20 20 20 16.5 C 20 13 17 9 12 2 Z" fill="none" stroke="#2563eb" stroke-width="1.5"/>
          <% if level && level > 0 %>
            <g clip-path="url(#drop-clip)">
              <rect x="0" y="<%= fill_y %>" width="24" height="<%= 24 - fill_y %>" fill="#2563eb"/>
            </g>
          <% end %>
          <text x="12" y="18" font-size="10" font-weight="800" fill="<%= level && level >= 2 ? '#fff' : '#2563eb' %>" text-anchor="middle" font-family="Inter, sans-serif"><%= level || 0 %></text>
        </svg>
      </span>
    </span>
    <div class="text-side">
      <span class="lbl">Eau</span>
      <span class="val">
        <% case level
           when 0 then 'Sec' when 1 then 'Très sec'
           when 2 then 'Faible' when 3 then 'Modéré'
           when 4 then 'Régulier' when 5 then 'Humide'
           else '—' end %>
      </span>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Add the CSS**

```css
  .sky-tiles {
    position: absolute;
    right: 14px; top: 12px;
    width: 145px;
    display: flex; flex-direction: column;
    gap: 4px;
    z-index: 4;
  }
  .sky-tile {
    background: rgba(255,255,255,.92);
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 5px 8px;
    display: flex; align-items: center; gap: 7px;
    height: 35px; box-sizing: border-box;
  }
  .sky-tile .icon-side { flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 24px; }
  .sky-tile .text-side { display: flex; flex-direction: column; gap: 0; line-height: 1.05; min-width: 0; }
  .sky-tile .lbl { font-size: 7px; color: #9ca3af; text-transform: uppercase; letter-spacing: .1em; font-weight: 700; }
  .sky-tile .val { font-size: 10.5px; font-weight: 700; color: #1f2937; line-height: 1.05; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .leaf-icon, .sun-icon, .drop-icon { width: 22px; height: 22px; display: inline-block; }
  .leaf-icon svg, .sun-icon svg, .drop-icon svg { width: 100%; height: 100%; display: block; }
```

- [ ] **Step 4: Test**

```ruby
test 'sky tiles render with foliage, sun, water' do
  @species.update!(foliage_type: 'deciduous', exposures: ['sun', 'partial-shade'], watering_need: '3')
  sign_in_test_admin
  get "/plants/species/#{@species.id}/card"
  assert_match 'class="sky-tiles"', response.body
  assert_match 'Caduc', response.body
  assert_match 'Modéré', response.body
end
```

- [ ] **Step 5: Commit**

```bash
git add app/views/plant_cards/_recto.html.erb \
        app/views/layouts/plant_card.html.erb \
        app/helpers/plant_cards_helper.rb \
        test/integration/plant_cards_test.rb
git commit -m "Recto sky tiles: feuillage / soleil / eau with reactive icons"
```

---

### Task 12: Verso — calendar 12 cells

**Files:**
- Modify: `app/views/plant_cards/_verso.html.erb`
- Modify: `app/views/layouts/plant_card.html.erb`

- [ ] **Step 1: Replace verso stub with header + calendar**

`app/views/plant_cards/_verso.html.erb`:

```erb
<div class="a6 strate-<%= species.strate %>" data-face="verso">
  <div class="strate-bar"></div>
  <div class="verso-top">
    <div class="verso-name-row">
      <h2><%= species.common_names_fr.presence || species.latin_name %></h2>
      <span class="latin-mini"><%= species.latin_name %></span>
    </div>
    <% letters = %w[J F M A M J J A S O N D] %>
    <% months  = %w[jan feb mar apr may jun jul aug sep oct nov dec] %>
    <div class="cal-line">
      <% months.each_with_index do |m, i| %>
        <% state = cell_state(m, species) %>
        <span class="cell <%= state %>"><%= letters[i] %></span>
      <% end %>
    </div>
    <div class="cal-legend">
      <span><span class="dot flow"></span>Floraison</span>
      <span><span class="dot harv"></span>Récolte</span>
    </div>
  </div>
  <div class="body" style="padding-top: 10px; padding-bottom: 30px">
    <%# Tasks 13-17: pollination, eco grid, resources, warnings, qr/signature %>
  </div>
</div>
```

- [ ] **Step 2: Add CSS**

```css
  .verso-top { background: #FFFFFF; padding: 18px 14px 12px; border-bottom: 1px solid #e5e7eb; position: relative; z-index: 2; }
  .verso-name-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
  .verso-name-row h2 { margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; line-height: 1; }
  .verso-name-row .latin-mini { font-style: italic; font-size: 11px; color: #6b7280; letter-spacing: .01em; }

  .cal-line { display: grid; grid-template-columns: repeat(12, 1fr); gap: 2px; }
  .cal-line .cell {
    height: 22px; border-radius: 3px; background: #f3f4f6;
    display: flex; align-items: center; justify-content: center;
    font-size: 9.5px; font-weight: 700; color: #b9bdc4; letter-spacing: .04em;
  }
  .cal-line .cell.flow { background: #AFBD00; color: #fff; }
  .cal-line .cell.harv { background: #EF9B0D; color: #fff; }
  .cal-line .cell.both { background: linear-gradient(to bottom, #AFBD00 50%, #EF9B0D 50%); color: #fff; }

  .cal-legend {
    display: flex; gap: 14px; justify-content: flex-end; align-items: center;
    font-size: 8px; color: #6b7280; margin-top: 6px;
    text-transform: uppercase; letter-spacing: .08em;
  }
  .cal-legend span { display: inline-flex; align-items: center; gap: 4px; }
  .cal-legend .dot { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
  .cal-legend .dot.flow { background: #AFBD00; }
  .cal-legend .dot.harv { background: #EF9B0D; }
```

- [ ] **Step 3: Test**

```ruby
test 'verso calendar marks flowering and harvest months' do
  @species.update!(flowering_months: ['mar', 'apr'], harvest_months: ['jun', 'jul'])
  sign_in_test_admin
  get "/plants/species/#{@species.id}/card"
  assert_match 'class="cal-line"', response.body
  assert_match 'class="cell flow"', response.body
  assert_match 'class="cell harv"', response.body
end
```

- [ ] **Step 4: Commit**

```bash
git add app/views/plant_cards/_verso.html.erb \
        app/views/layouts/plant_card.html.erb \
        test/integration/plant_cards_test.rb
git commit -m "Verso: name + 12-cell calendar with month letters and floraison/récolte states"
```

---

### Task 13: Verso — Pollinisation section

**Files:**
- Modify: `app/views/plant_cards/_svg_defs.html.erb` (add pollin + vector symbols)
- Modify: `app/views/plant_cards/_verso.html.erb`
- Modify: `app/views/layouts/plant_card.html.erb`
- Modify: `app/helpers/plant_cards_helper.rb`

- [ ] **Step 1: Add fertility/vector symbols to svg_defs**

In `_svg_defs.html.erb`, after the leaf symbols, add:

```erb
    <symbol id="pollin-self" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" fill="#EC4899"/>
      <g stroke="#EC4899" stroke-width="1.4" fill="none" stroke-linecap="round">
        <circle cx="12" cy="6" r="2.2"/>
        <circle cx="12" cy="18" r="2.2"/>
        <circle cx="6"  cy="12" r="2.2"/>
        <circle cx="18" cy="12" r="2.2"/>
      </g>
      <path d="M 19 5 A 8 8 0 0 1 19 19" stroke="#9333EA" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-dasharray="2.5 2"/>
      <path d="M 18.5 19 L 19 19 L 19 18" stroke="#9333EA" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    </symbol>
    <symbol id="pollin-cross" viewBox="0 0 24 24">
      <circle cx="6" cy="9" r="3" fill="#EC4899"/>
      <circle cx="18" cy="15" r="3" fill="#EC4899"/>
      <path d="M9 11 Q 12 6 15 13" stroke="#9333EA" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-dasharray="2 1.5"/>
      <path d="M14.2 13 L 15 13 L 15 12.2" stroke="#9333EA" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </symbol>
    <symbol id="pollin-partial" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" fill="#EC4899"/>
      <path d="M 19 5 A 8 8 0 0 1 21 12" stroke="#9333EA" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-dasharray="2 2"/>
    </symbol>
    <symbol id="pollin-dio" viewBox="0 0 24 24">
      <g transform="translate(2 2)">
        <circle cx="6" cy="6" r="3.5" stroke="#EC4899" stroke-width="1.6" fill="none"/>
        <line x1="6" y1="9.5" x2="6" y2="13" stroke="#EC4899" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="4" y1="11.5" x2="8" y2="11.5" stroke="#EC4899" stroke-width="1.6" stroke-linecap="round"/>
      </g>
      <g transform="translate(11 11)">
        <circle cx="3.5" cy="6" r="3" stroke="#3B82F6" stroke-width="1.6" fill="none"/>
        <line x1="6" y1="3.5" x2="9.5" y2="0" stroke="#3B82F6" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="9.5" y1="0" x2="9.5" y2="2.5" stroke="#3B82F6" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="9.5" y1="0" x2="7" y2="0" stroke="#3B82F6" stroke-width="1.6" stroke-linecap="round"/>
      </g>
    </symbol>
    <symbol id="vec-insect" viewBox="0 0 24 24">
      <ellipse cx="12" cy="14" rx="3.5" ry="4.5" fill="currentColor"/>
      <path d="M12 11 Q 8 6 4 8" fill="currentColor" opacity=".5"/>
      <path d="M12 11 Q 16 6 20 8" fill="currentColor" opacity=".5"/>
    </symbol>
    <symbol id="vec-distance" viewBox="0 0 24 24">
      <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M5 10 L 3 12 L 5 14" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M19 10 L 21 12 L 19 14" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </symbol>
```

- [ ] **Step 2: Add helpers**

```ruby
FERTILITY_LABELS = {
  'self-fertile'              => 'Auto-fertile',
  'self-sterile'              => 'Pollin. croisée',
  'partially-self-fertile'    => 'Part. auto-fertile',
  'dioecious'                 => 'Dioïque'
}.freeze

FERTILITY_SYMBOLS = {
  'self-fertile'              => 'pollin-self',
  'self-sterile'              => 'pollin-cross',
  'partially-self-fertile'    => 'pollin-partial',
  'dioecious'                 => 'pollin-dio'
}.freeze

def fertility_label(fertility); FERTILITY_LABELS[fertility]; end
def fertility_symbol(fertility); FERTILITY_SYMBOLS[fertility] || 'pollin-self'; end

POLLINATOR_LABELS = {
  'bees' => 'abeilles', 'bumblebees' => 'bourdons', 'butterflies' => 'papillons',
  'hoverflies' => 'syrphes', 'beetles' => 'coléoptères', 'wind' => 'vent', 'birds' => 'oiseaux'
}.freeze
def pollinators_label(list)
  Array(list).map { |p| POLLINATOR_LABELS[p] || p }.join(', ').presence
end
```

- [ ] **Step 3: Add the section in verso .body**

```erb
<% if species.fertility.present? || species.pollination_distance_m.present? || species.specific_pollinators.any? %>
  <div class="section-title"><span>Pollinisation</span></div>
  <div class="pollin-section">
    <div class="pollin-main">
      <span class="icn-big"><svg viewBox="0 0 24 24"><use href="#<%= fertility_symbol(species.fertility) %>"/></svg></span>
      <div class="status">
        <span class="lbl">Statut</span>
        <span class="val"><%= fertility_label(species.fertility) || '—' %></span>
      </div>
    </div>
    <div class="pollin-extras">
      <% if (vec_label = pollinators_label(species.specific_pollinators)) %>
        <div class="extra">
          <span class="ic"><svg viewBox="0 0 24 24"><use href="#vec-insect"/></svg></span>
          <span><strong>Insectes</strong> — <%= vec_label %></span>
        </div>
      <% end %>
      <% if species.pollination_distance_m.present? %>
        <div class="extra">
          <span class="ic"><svg viewBox="0 0 24 24"><use href="#vec-distance"/></svg></span>
          <span>Croisement <strong>&lt; <%= species.pollination_distance_m %> m</strong> bénéfique</span>
        </div>
      <% end %>
    </div>
  </div>
<% end %>
```

- [ ] **Step 4: Add CSS**

```css
  .section-title {
    font-size: 8.5px; font-weight: 700; color: #234766;
    letter-spacing: .14em; text-transform: uppercase;
    margin: 10px 0 6px;
    display: flex; gap: 10px; align-items: center;
  }
  .section-title::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
  .pollin-section {
    display: flex; align-items: stretch; gap: 14px;
    margin-top: 4px;
    padding: 10px 12px;
    background: #fdf2f8;
    border-radius: 6px;
    border-left: 3px solid #EC4899;
  }
  .pollin-main { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .pollin-main .icn-big { width: 38px; height: 38px; flex-shrink: 0; }
  .pollin-main .icn-big svg { width: 100%; height: 100%; display: block; }
  .pollin-main .status { display: flex; flex-direction: column; line-height: 1.1; }
  .pollin-main .status .lbl {
    font-size: 7.5px; color: #9ca3af;
    text-transform: uppercase; letter-spacing: .1em; font-weight: 700;
  }
  .pollin-main .status .val { font-size: 11.5px; font-weight: 700; color: #1f2937; }
  .pollin-extras {
    flex: 1;
    display: flex; flex-direction: column; justify-content: center;
    gap: 5px;
    border-left: 1px solid #f9c5d8;
    padding-left: 12px;
    font-size: 9.5px; color: #4b5563;
  }
  .pollin-extras .extra { display: flex; align-items: center; gap: 6px; }
  .pollin-extras .extra .ic { width: 16px; height: 16px; flex-shrink: 0; color: #BE185D; }
  .pollin-extras .extra .ic svg { width: 100%; height: 100%; display: block; }
  .pollin-extras .extra strong { color: #1f2937; font-weight: 700; }
```

- [ ] **Step 5: Commit**

```bash
git add app/views/plant_cards/_svg_defs.html.erb \
        app/views/plant_cards/_verso.html.erb \
        app/views/layouts/plant_card.html.erb \
        app/helpers/plant_cards_helper.rb
git commit -m "Verso pollination section: fertility status + vector + distance"
```

---

### Task 14: Verso — eco services pictograms grid

**Files:**
- Modify: `app/views/plant_cards/_svg_defs.html.erb` (add 12 eco icons)
- Modify: `app/views/plant_cards/_verso.html.erb`
- Modify: `app/views/layouts/plant_card.html.erb`

- [ ] **Step 1: Add 12 eco service icons to svg_defs**

After the pollin/vector symbols, add:

```erb
    <symbol id="e-windbreak" viewBox="0 0 24 24"><path d="M3 8 L18 8 M3 12 L21 12 M3 16 L17 16" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M19 4 L21 8 L19 8 L20 12 L18 12 L19 16" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round"/></symbol>
    <symbol id="e-melli" viewBox="0 0 24 24"><ellipse cx="12" cy="14" rx="6" ry="5" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M12 9 Q 9 4 5 5 M12 9 Q 15 4 19 5" stroke="currentColor" stroke-width="1.4" fill="none"/></symbol>
    <symbol id="e-bird" viewBox="0 0 24 24"><path d="M5 14 Q 8 10 14 12 L 19 9 L 18 13 Q 17 17 12 18 Q 7 18 5 14 Z" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round"/><circle cx="16" cy="10" r="0.8" fill="currentColor"/></symbol>
    <symbol id="e-aux" viewBox="0 0 24 24"><circle cx="12" cy="13" r="5" stroke="currentColor" stroke-width="1.4" fill="none"/><line x1="12" y1="6" x2="12" y2="20" stroke="currentColor" stroke-width="1"/><circle cx="11" cy="6" r="1" fill="currentColor"/><circle cx="13" cy="6" r="1" fill="currentColor"/></symbol>
    <symbol id="e-erosion" viewBox="0 0 24 24"><path d="M3 18 Q 6 14 9 16 Q 12 18 15 14 Q 18 12 21 14" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></symbol>
    <symbol id="e-shade" viewBox="0 0 24 24"><circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M3 17 Q 7 13 11 14 L 17 14 Q 21 16 21 19 L 3 19 Z" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round"/></symbol>
    <symbol id="e-nitrogen" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.4" fill="none"/><text x="12" y="16" font-size="11" font-weight="800" fill="currentColor" text-anchor="middle" font-family="Inter">N</text></symbol>
    <symbol id="e-groundcover" viewBox="0 0 24 24"><path d="M3 16 Q 7 13 11 16 Q 15 13 19 16 Q 21 14 21 18 L 3 18 Z" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round"/></symbol>
    <symbol id="e-pollination" viewBox="0 0 24 24"><circle cx="8" cy="9" r="3" stroke="currentColor" stroke-width="1.4" fill="none"/><circle cx="16" cy="15" r="3" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M11 11 L 13 13" stroke="currentColor" stroke-width="1.4" stroke-dasharray="1.5 1.5"/></symbol>
    <symbol id="e-orgmatter" viewBox="0 0 24 24"><path d="M5 18 Q 5 14 9 13 L 9 8 Q 12 6 14 8 L 14 12 Q 18 13 18 18 Z" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round"/></symbol>
    <symbol id="e-mineral" viewBox="0 0 24 24"><path d="M12 4 L18 9 L15 18 L9 18 L6 9 Z" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round"/></symbol>
    <symbol id="e-grass" viewBox="0 0 24 24"><path d="M5 14 L5 8 M9 14 L9 5 M13 14 L13 7 M17 14 L17 9" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/><line x1="6" y1="3" x2="20" y2="11" stroke="currentColor" stroke-width="1.4"/></symbol>
```

- [ ] **Step 2: Add the helper**

```ruby
ECO_ICONS = {
  'windbreak' => 'e-windbreak', 'mellifere' => 'e-melli', 'birds' => 'e-bird',
  'beneficial-insects' => 'e-aux', 'erosion-control' => 'e-erosion',
  'light-shade' => 'e-shade', 'nitrogen' => 'e-nitrogen',
  'ground-cover' => 'e-groundcover', 'cross-pollination' => 'e-pollination',
  'organic-matter' => 'e-orgmatter', 'minerals' => 'e-mineral',
  'weed-suppression' => 'e-grass'
}.freeze

ECO_FR_LABELS = {
  'windbreak' => 'Brise-vent', 'mellifere' => 'Mellifère', 'birds' => 'Oiseaux',
  'beneficial-insects' => 'Auxiliaires', 'erosion-control' => 'Anti-érosion',
  'light-shade' => 'Ombre lég.', 'nitrogen' => 'Azote',
  'ground-cover' => 'Tapissant', 'cross-pollination' => 'Pollin.',
  'organic-matter' => 'Mat. org.', 'minerals' => 'Minéraux',
  'weed-suppression' => 'Herbe−'
}.freeze

def eco_state(species, eco_id)
  provided = species.eco_services_provided.include?(eco_id)
  needed   = species.eco_services_needed.include?(eco_id)
  return 'both'    if provided && needed
  return 'service' if provided
  return 'need'    if needed
  ''
end

def eco_icon(eco_id); ECO_ICONS[eco_id]; end
def eco_label(eco_id); ECO_FR_LABELS[eco_id]; end
```

- [ ] **Step 3: Add the section to verso .body (after pollination)**

```erb
<div class="section-title">
  <span>Système écosystémique</span>
  <span class="legend">
    <span><span class="dot service"></span>Service</span>
    <span><span class="dot need"></span>Besoin</span>
    <span><span class="dot both"></span>2 en 1</span>
  </span>
</div>
<div class="eco-grid">
  <% Plant::Species::ECO_SERVICES.each do |eco_id| %>
    <% state = eco_state(species, eco_id) %>
    <div class="eco-item <%= state %>">
      <span class="pic">
        <% if state == 'both' %>
          <svg class="half left" viewBox="0 0 24 24"><use href="#<%= eco_icon(eco_id) %>"/></svg>
          <svg class="half right" viewBox="0 0 24 24"><use href="#<%= eco_icon(eco_id) %>"/></svg>
        <% else %>
          <svg viewBox="0 0 24 24"><use href="#<%= eco_icon(eco_id) %>"/></svg>
        <% end %>
      </span>
      <span class="lbl"><%= eco_label(eco_id) %></span>
    </div>
  <% end %>
</div>
```

- [ ] **Step 4: Add CSS**

```css
  .section-title .legend { display: inline-flex; gap: 8px; font-size: 7.5px; font-weight: 700; letter-spacing: .1em; flex-wrap: wrap; }
  .section-title .legend span { display: inline-flex; align-items: center; gap: 3px; text-transform: uppercase; color: #6b7280; }
  .section-title .legend .dot { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }
  .section-title .legend .dot.service { background: #5A9A2F; }
  .section-title .legend .dot.need { background: #5B5781; }
  .section-title .legend .dot.both { background: linear-gradient(to right, #5A9A2F 50%, #5B5781 50%); }

  .eco-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px 4px; margin-top: 6px; }
  .eco-item {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; padding: 2px; gap: 3px;
    color: #cbd5e1;
  }
  .eco-item .pic { width: 26px; height: 26px; color: #cbd5e1; position: relative; }
  .eco-item .pic > svg { width: 100%; height: 100%; display: block; }
  .eco-item .pic .half { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .eco-item .pic .half.left  { color: #5A9A2F; clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%); }
  .eco-item .pic .half.right { color: #5B5781; clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%); }
  .eco-item .lbl { font-size: 7px; font-weight: 700; line-height: 1.05; letter-spacing: .02em; }
  .eco-item.service .pic { color: #5A9A2F; }
  .eco-item.service .lbl { color: #166534; }
  .eco-item.need .pic { color: #5B5781; }
  .eco-item.need .lbl { color: #4c1d95; }
  .eco-item.both .lbl {
    background: linear-gradient(to right, #166534 50%, #4c1d95 50%);
    -webkit-background-clip: text; background-clip: text;
    color: transparent; font-weight: 800;
  }
```

- [ ] **Step 5: Commit**

```bash
git add app/views/plant_cards/_svg_defs.html.erb \
        app/views/plant_cards/_verso.html.erb \
        app/views/layouts/plant_card.html.erb \
        app/helpers/plant_cards_helper.rb
git commit -m "Verso eco services grid: 12 unified pictograms with service/need/both states"
```

---

### Task 15: Verso — Resources Caragana-style

**Files:**
- Modify: `app/views/plant_cards/_svg_defs.html.erb`
- Modify: `app/views/plant_cards/_verso.html.erb`
- Modify: `app/views/layouts/plant_card.html.erb`
- Modify: `app/helpers/plant_cards_helper.rb`

- [ ] **Step 1: Add 6 resource icons to svg_defs**

```erb
    <symbol id="r-edible" viewBox="0 0 24 24"><path d="M5 3 L5 11 M9 3 L9 11 M5 11 Q5 14 7 14 Q9 14 9 11" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 14 L7 22" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M16 3 Q14 4 14 8 Q14 11 17 11 Q19 11 19 8 Q19 4 17 3 L17 22" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></symbol>
    <symbol id="r-aromatic" viewBox="0 0 24 24"><path d="M12 3 C 8 6 6 11 8 16 C 9 19 12 21 12 21 C 12 21 15 19 16 16 C 18 11 16 6 12 3 Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M12 8 L12 19" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></symbol>
    <symbol id="r-medicinal" viewBox="0 0 24 24"><path d="M12 3 L12 21 M8 7 Q 12 7 12 11 Q 12 7 16 7 M9 13 Q 12 13 12 16 Q 12 13 15 13" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="12" cy="3.5" r="1.2" fill="currentColor"/></symbol>
    <symbol id="r-fiber" viewBox="0 0 24 24"><path d="M6 4 L6 22 M10 4 L10 22 M14 4 L14 22 M18 4 L18 22" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></symbol>
    <symbol id="r-sensory" viewBox="0 0 24 24"><circle cx="12" cy="13" r="6" stroke="currentColor" stroke-width="1.4" fill="none"/><circle cx="12" cy="13" r="2" fill="currentColor"/></symbol>
    <symbol id="r-fodder" viewBox="0 0 24 24"><path d="M5 16 Q 6 10 9 9 Q 11 8 11 6 Q 11 4 13 4 Q 16 4 16 8 Q 16 11 18 12 Q 20 14 19 17 L 17 19 L 8 19 Q 5 19 5 16 Z" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round"/></symbol>
```

- [ ] **Step 2: Helpers for resource categories and parts labels**

```ruby
RESOURCE_ICONS = {
  'edible' => 'r-edible', 'aromatic' => 'r-aromatic', 'medicinal' => 'r-medicinal',
  'fiber' => 'r-fiber', 'sensory' => 'r-sensory', 'animal' => 'r-fodder'
}.freeze
RESOURCE_FR = {
  'edible' => 'Comestible', 'aromatic' => 'Aromatique', 'medicinal' => 'Médicinale',
  'fiber' => 'Fibre', 'sensory' => 'Sensorielle', 'animal' => 'Animale'
}.freeze
PART_FR = {
  'fruit' => 'fruit', 'flower' => 'fleur', 'leaf' => 'feuille', 'seed' => 'graine',
  'root' => 'racine', 'bark' => 'écorce', 'sap' => 'sève', 'stem' => 'tige',
  'ornamental' => 'ornementale', 'dye' => 'tinctoriale', 'fragrant' => 'odorante',
  'pecked' => 'picorée', 'browsed' => 'broutée'
}.freeze

def resource_icon(cat); RESOURCE_ICONS[cat]; end
def resource_label(cat); RESOURCE_FR[cat]; end
def parts_label(parts)
  Array(parts).map { |p| PART_FR[p] || p }.join(', ').presence
end
```

- [ ] **Step 3: Add to verso .body (after eco grid)**

```erb
<div class="section-title"><span>Ressources</span></div>
<div class="resource-grid-c">
  <% Plant::Species::RESOURCE_CATEGORIES.each do |cat| %>
    <% parts = species.resource_parts.is_a?(Hash) ? species.resource_parts[cat] : nil %>
    <% pl = parts_label(parts) %>
    <div class="resource-c <%= 'off' unless pl %>">
      <span class="icn"><svg viewBox="0 0 24 24"><use href="#<%= resource_icon(cat) %>"/></svg></span>
      <div class="info">
        <span class="name"><%= resource_label(cat) %></span>
        <span class="parts <%= 'empty' unless pl %>"><%= pl || '—' %></span>
      </div>
    </div>
  <% end %>
</div>
```

- [ ] **Step 4: Add CSS**

```css
  .resource-grid-c { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px 12px; margin-top: 4px; }
  .resource-c { display: flex; align-items: flex-start; gap: 6px; padding: 3px 0; }
  .resource-c .icn { width: 22px; height: 22px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #234766; }
  .resource-c.off .icn { color: #cbd5e1; }
  .resource-c .icn svg { width: 100%; height: 100%; display: block; }
  .resource-c .info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .resource-c .name {
    font-size: 8.5px; font-weight: 800; color: #234766;
    letter-spacing: .04em; text-transform: uppercase;
  }
  .resource-c.off .name { color: #cbd5e1; }
  .resource-c .parts { font-size: 9px; color: #4b5563; line-height: 1.25; }
  .resource-c.off .parts { color: #d1d5db; }
  .resource-c .parts.empty { font-style: italic; color: #cbd5e1; }
```

- [ ] **Step 5: Commit**

```bash
git add app/views/plant_cards/_svg_defs.html.erb \
        app/views/plant_cards/_verso.html.erb \
        app/views/layouts/plant_card.html.erb \
        app/helpers/plant_cards_helper.rb
git commit -m "Verso resources: Caragana-style icon + parts list per category"
```

---

### Task 16: Verso — Warnings banner (conditional) + QR + signature

**Files:**
- Modify: `app/views/plant_cards/_verso.html.erb`
- Modify: `app/views/layouts/plant_card.html.erb`

- [ ] **Step 1: Add the warnings banner + QR + signature**

After the resources grid, append:

```erb
<% warnings = card_warnings(species) %>
<% if warnings.any? %>
  <div class="warnings-banner">
    <span class="label-icon">⚠</span>
    <% warnings.each_with_index do |w, i| %>
      <% if i > 0 %><span class="sep">·</span><% end %>
      <span class="warning-item"><%= w %></span>
    <% end %>
  </div>
<% end %>
```

After `</div>` of `.body`:

```erb
<div class="qr-corner"><%= qr_svg(public_species_url(slug: species.slug, host: ENV.fetch('PLANTS_HOST', 'plantes.semisto.org'))) %></div>
<div class="signature">
  <div class="line1">Fiche réalisée par <strong>Semisto</strong></div>
  <div class="line2">plantes.semisto.org</div>
</div>
```

(The `public_species_url` route comes in Phase C. For now, build the URL by hand:)

```erb
<div class="qr-corner">
  <% public_url = "https://#{ENV.fetch('PLANTS_HOST', 'plantes.semisto.org')}/s/#{species.slug}" %>
  <%= qr_svg(public_url) %>
</div>
```

- [ ] **Step 2: Add CSS**

```css
  .warnings-banner {
    margin-top: 8px;
    padding: 6px 10px;
    background: #FEF3C7;
    border-left: 3px solid #F59E0B;
    border-radius: 3px;
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    font-size: 9px; color: #92400E;
  }
  .warnings-banner .label-icon { font-size: 13px; line-height: 1; }
  .warnings-banner .warning-item { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; letter-spacing: .02em; }
  .warnings-banner .sep { color: #d97706; }

  .qr-corner {
    position: absolute; bottom: 12px; right: 14px;
    width: 50px; height: 50px;
    z-index: 5;
  }
  .qr-corner svg { width: 100%; height: 100%; }
  .signature {
    position: absolute; bottom: 12px; left: 18px; right: 76px;
    text-align: left; font-size: 9px; color: #b5b9bf;
    letter-spacing: .02em; font-weight: 400;
    z-index: 4; line-height: 1.35;
  }
  .signature .line1 { font-style: italic; }
  .signature .line1 strong { font-weight: 600; font-style: normal; color: #6b7280; }
  .signature .line2 {
    font-style: normal; color: #6b7280;
    font-weight: 600; letter-spacing: .04em; font-size: 9px;
  }
```

- [ ] **Step 3: Test**

```ruby
test 'warnings banner shows when species has flags' do
  @species.update!(is_drageonnant: true, toxicity: { sheep: ['seeds'] })
  sign_in_test_admin
  get "/plants/species/#{@species.id}/card"
  assert_match 'warnings-banner', response.body
  assert_match 'Drageonne', response.body
  assert_match 'Toxique brebis', response.body
end

test 'warnings banner hidden when species has no flags' do
  sign_in_test_admin
  get "/plants/species/#{@species.id}/card"
  assert_no_match 'warnings-banner', response.body
end

test 'qr code embeds public slug url' do
  sign_in_test_admin
  get "/plants/species/#{@species.id}/card"
  assert_match 'qr-corner', response.body
  assert_match '<svg', response.body
end
```

- [ ] **Step 4: Commit**

```bash
git add app/views/plant_cards/_verso.html.erb \
        app/views/layouts/plant_card.html.erb \
        test/integration/plant_cards_test.rb
git commit -m "Verso warnings banner (conditional) + QR code + signature"
```

---

### Task 17: Frontend — "Imprimer la fiche" button on SpeciesDetail

**Files:**
- Modify: `app/frontend/plant-database/components/SpeciesDetail.tsx`

- [ ] **Step 1: Locate the action area**

```bash
grep -n "edit\|Edit\|button\|action" app/frontend/plant-database/components/SpeciesDetail.tsx | head -20
```

Find where existing action buttons (Edit, etc.) are rendered. Likely near the top of the panel.

- [ ] **Step 2: Add the print link**

Insert a new `<a>` element near the existing actions:

```tsx
<a
  href={`/plants/species/${species.id}/card`}
  target="_blank"
  rel="noopener"
  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-stone-200 hover:bg-stone-50 text-sm text-stone-700"
>
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v7H6z"/>
  </svg>
  Imprimer la fiche
</a>
```

(Adjust the icon SVG and class names to match the existing button style in the file.)

- [ ] **Step 3: Manual smoke test**

`bin/dev`. Open Plant Database, click a species. The "Imprimer la fiche" button appears. Clicking opens the card in a new tab. Press Ctrl/⌘+P → printer dialog should show A6 sized paper.

- [ ] **Step 4: Commit**

```bash
git add app/frontend/plant-database/components/SpeciesDetail.tsx
git commit -m "Add 'Imprimer la fiche' button on SpeciesDetail"
```

---

### Task 18: End-to-end verification

- [ ] **Step 1: Test all the integration tests pass**

```bash
bin/rails test test/integration/plant_cards_test.rb test/helpers/plant_cards_helper_test.rb test/integration/plants_card_fields_test.rb test/models/plant/species_test.rb test/integration/plants_step1_test.rb
```

Expected: all green.

- [ ] **Step 2: TypeScript check**

```bash
yarn tsc --noEmit 2>&1 | grep -c "error TS"
```

Expected: same as baseline (8 from SimpleEditor).

- [ ] **Step 3: Browser print preview**

Start `bin/dev`. Pick a species with rich data (Amelanchier canadensis if seeded). Click "Imprimer la fiche". The card opens in a new tab.

Verify visually (compare to mockup v30 in `.superpowers/brainstorm/`):

- Strate color bar at top of both faces
- Header: name + latin (italic, sentence case)
- Strate badge, cycle chip, role badge
- Dim-line: ↕ height · ↔ spread · ⇿ spacing
- Hardiness in °C
- Two photos side-by-side (or hatched placeholder)
- 3 sky-tiles (feuillage / soleil / eau)
- Plant silhouette with human at left
- Ground line + grass strip
- Below ground: roots + 3 soil scales + root type label
- Verso: name + 12-cell calendar
- Pollination block (pink-tinted)
- Eco services 6×2 grid
- Resources 3×2 grid with parts
- Warnings banner (only if applicable)
- QR code bottom-right
- Signature bottom-left

Press Ctrl/⌘+P. The browser dialog should show A6 paper size, recto on page 1, verso on page 2.

- [ ] **Step 4: No commit needed; Phase B is done**

---

## Final Verification Checklist

- [ ] All 17 tasks completed
- [ ] `bin/rails test` passes
- [ ] `yarn tsc --noEmit` shows the baseline error count, no new errors
- [ ] Print preview produces an A6 recto + verso for any species
- [ ] QR code resolves to `https://<host>/s/<slug>` (path will exist after Phase C)
- [ ] Verso content respects all conditional sections (warnings, pollination)
- [ ] Existing tests do not regress

## Out of scope (deferred)

- **Public web page at `/s/:slug`** — Phase C
- **Batch print at `/plants/cards?ids=…`** — Phase D
- **Data migration of legacy `interests` and `ecosystem_needs`** — Phase E
- **Final pictogram polish (Freepik / Imagen prompts)** — handled separately
- **Mobile-friendly card render** — Phase C public page handles mobile
- **Variety-level cards** — future work
