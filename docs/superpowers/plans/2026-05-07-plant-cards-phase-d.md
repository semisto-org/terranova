# Plant Cards — Phase D: Batch Print Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Print multiple plant cards on a single A4 sheet (4 cards in a 2×2 grid) with cut marks, ready to be duplex-printed and cut to A6. Admin selects N species in the search view, clicks "Imprimer N fiches", and gets a printable A4 layout. The QR/links keep working per card.

**Architecture:** A new controller action `PlantCardsController#batch` accepts `?ids=1,2,3,...` and renders a `batch.html.erb` view that lays out the card recto/verso pairs across A4 pages. Reuses the same Phase B card partials (`_recto`, `_verso`, `_svg_defs`) — no new visual logic. Frontend adds a multi-select mode to SearchView with a footer action bar. CSS uses `@page { size: A4 }` with one A4 page per "side" — page 1 = 4 rectos, page 2 = 4 versos in mirrored order for long-edge duplex.

**Tech Stack:** Same as Phase B (Rails ERB, CSS @page, inline SVG). No new gems.

**Spec reference:** `docs/superpowers/specs/2026-05-06-plant-cards-design.md` (section "Card visual layout" + "Routes" `/plants/cards?ids=...`).

---

## File Structure

### Files to create

- `app/views/plant_cards/batch.html.erb` — A4 grid view (recto pages + verso pages).
- `app/views/layouts/plant_card_batch.html.erb` — A4-sized layout (separate from single-card layout).

### Files to modify

- `config/routes.rb` — add `get "plants/cards", to: "plant_cards#batch"` BEFORE the `plants/*path` catch-all.
- `app/controllers/plant_cards_controller.rb` — add `batch` action.
- `app/frontend/plant-database/components/SearchView.tsx` — add multi-select state + checkboxes in result rows + footer action bar.
- `test/integration/plant_cards_test.rb` — add batch route tests.

### Decisions

- **Layout strategy:** 2×2 A6 grid on A4. 4 cards per sheet of paper. For N=1 → 1 card. For N=5 → 2 sheets (4+1). For N=8 → 2 sheets full. Maximum 12 cards per request (avoid abuse).
- **Duplex order:** Page 1 = rectos in reading order (1,2,3,4). Page 2 = versos in mirrored order (2,1,4,3) so long-edge-binding duplex aligns recto/verso of each card.
- **Cut marks:** thin gray crop marks at the inner crossings of the 2×2 grid (so the user can cut along them with a paper trimmer).
- **Selection cap:** soft cap at 12 in frontend, hard cap at 24 in controller (returns 422 if more).
- **Single card via batch:** `?ids=42` gracefully renders 1 card on a single A4 (top-left position, 3 empty quadrants). User can also use the existing single-card route.

---

## Tasks

### Task D-1: Route + controller batch action

**Files:**
- Modify: `config/routes.rb`
- Modify: `app/controllers/plant_cards_controller.rb`
- Modify: `test/integration/plant_cards_test.rb`

#### Step 1: Write failing tests

Append to `test/integration/plant_cards_test.rb`:

```ruby
test 'batch print returns 200 with multiple species' do
  s2 = Plant::Species.create!(latin_name: 'Quercus robur', plant_type: 'tree')
  s3 = Plant::Species.create!(latin_name: 'Ribes nigrum', plant_type: 'shrub')
  get "/plants/cards?ids=#{@species.id},#{s2.id},#{s3.id}"
  assert_response :success
  assert_match 'Amelanchier canadensis', response.body
  assert_match 'Quercus robur', response.body
  assert_match 'Ribes nigrum', response.body
end

test 'batch print rejects more than 24 ids' do
  ids = (1..25).map(&:to_s).join(',')
  get "/plants/cards?ids=#{ids}"
  assert_response :unprocessable_entity
end

test 'batch print rejects empty ids' do
  get '/plants/cards?ids='
  assert_response :unprocessable_entity
end

test 'batch print silently drops unknown ids' do
  get "/plants/cards?ids=#{@species.id},999999"
  assert_response :success
  assert_match 'Amelanchier canadensis', response.body
end
```

#### Step 2: Add the route

In `config/routes.rb`, BEFORE the `plants/*path` catch-all (near the existing `plants/species/:id/card` route):

```ruby
  get "plants/cards", to: "plant_cards#batch", as: :plant_cards_batch
```

#### Step 3: Add the controller action

In `app/controllers/plant_cards_controller.rb`:

```ruby
def batch
  ids = params[:ids].to_s.split(',').map(&:strip).reject(&:empty?).map(&:to_i)
  if ids.empty? || ids.size > 24
    head :unprocessable_entity and return
  end

  @species_list = Plant::Species
    .where(id: ids)
    .order(Arel.sql("array_position(ARRAY[#{ids.join(',')}]::int[], id)"))

  @photos_by_species = Plant::Photo
    .where(target_type: 'species', target_id: ids)
    .group_by(&:target_id)

  render :batch
end
```

#### Step 4: Create stub batch view

Create `app/views/plant_cards/batch.html.erb`:

```erb
<%= render 'plant_cards/svg_defs' %>
<% @species_list.each do |species| %>
  <div data-species-id="<%= species.id %>">
    <h2><%= species.latin_name %></h2>
  </div>
<% end %>
```

(Real layout in Task D-2.)

#### Step 5: Run tests

```bash
bin/rails test test/integration/plant_cards_test.rb
```

Expected: existing 18 tests + 4 new tests = 22 tests pass.

#### Step 6: Commit

```bash
git add config/routes.rb \
        app/controllers/plant_cards_controller.rb \
        app/views/plant_cards/batch.html.erb \
        test/integration/plant_cards_test.rb
git commit -m "Bootstrap batch print at /plants/cards?ids=..."
```

---

### Task D-2: A4 layout with 2×2 recto grid + cut marks

**Files:**
- Create: `app/views/layouts/plant_card_batch.html.erb`
- Modify: `app/views/plant_cards/batch.html.erb`
- Modify: `app/controllers/plant_cards_controller.rb` (use the new layout)

#### Step 1: Create the batch layout

Create `app/views/layouts/plant_card_batch.html.erb`:

```erb
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Fiches plantes — impression batch</title>
  <%= csrf_meta_tags %>
  <%= csp_meta_tag %>
  <style>
    @page { size: A4 portrait; margin: 0; }
    @media print {
      body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .a4-page { page-break-after: always; box-shadow: none; }
      .a4-page:last-child { page-break-after: auto; }
    }
    body { font-family: 'Inter', system-ui, sans-serif; margin: 0; background: #f0f0f0; padding: 24px; }
    .a4-page {
      width: 210mm; height: 297mm;
      background: #fff;
      margin: 0 auto 24px;
      box-shadow: 0 12px 40px rgba(0,0,0,.12);
      position: relative;
      display: grid;
      grid-template-columns: 105mm 105mm;
      grid-template-rows: 148mm 148mm;
    }
    .a4-cell {
      width: 105mm; height: 148mm;
      position: relative;
      overflow: hidden;
    }
    .a4-cell.empty { background: transparent; }
    /* Cut marks at the inner crossing of the 2x2 grid */
    .cut-marks {
      position: absolute;
      top: 50%; left: 50%;
      width: 1px; height: 1px;
      pointer-events: none;
    }
    .cut-marks::before, .cut-marks::after {
      content: ''; position: absolute;
      background: #999;
    }
    .cut-marks::before { /* horizontal mark */
      top: 0; left: -8mm;
      width: 16mm; height: 1px;
    }
    .cut-marks::after { /* vertical mark */
      top: -8mm; left: 0;
      width: 1px; height: 16mm;
    }
    /* Reuse the same .a6 styles for the cards inside .a4-cell */
    /* (the card CSS is included via the included partial) */
  </style>
  <%= render 'plant_cards/card_styles' %>
</head>
<body>
  <%= yield %>
</body>
</html>
```

Note: We extract the card CSS into a separate partial `_card_styles.html.erb` so both `plant_card.html.erb` (single) and `plant_card_batch.html.erb` (batch) can include it.

#### Step 2: Extract card CSS into a partial

Create `app/views/plant_cards/_card_styles.html.erb` by copying the entire `<style>` block from `app/views/layouts/plant_card.html.erb` (everything inside `<style>...</style>`).

Then in `app/views/layouts/plant_card.html.erb`, replace the inline `<style>` block with `<%= render 'plant_cards/card_styles' %>`.

In the new `_card_styles.html.erb`, you'll need to OVERRIDE `.a6 { width: ...; height: ...; }` for the batch context — the cells in batch are exactly A6 (105mm × 148mm), but the .a6 in the single-card layout is in pixels (396×558px). Add a class scope:

In the styles partial, change:
```css
.a6 { width: 396px; height: 558px; ... }
```
to:
```css
.a6 { width: 105mm; height: 148mm; ... }
```

(Use mm everywhere for print accuracy. The single-card view will still print at A6 since `@page { size: A6 }` constrains it.)

For screen preview where px feels right, the `.a6` will be slightly larger than the previous 396×558px. That's acceptable — the print result is what matters.

Also update `.cross-section { height: 270px; ... }` and other px-based dimensions if needed. But since the layout is responsive within the .a6 box, keeping internal pixel values should work — the .a6 box itself is the constraining frame.

Actually for simplicity in v1, leave the internal px values alone. Only the outer `.a6` gets sized in mm.

#### Step 3: Update batch.html.erb to use the grid

Replace `app/views/plant_cards/batch.html.erb`:

```erb
<%= render 'plant_cards/svg_defs' %>

<% @species_list.each_slice(4).with_index do |group, page_idx| %>
  <%# RECTO PAGE for cards group %>
  <section class="a4-page">
    <% group.each do |species| %>
      <div class="a4-cell">
        <%= render 'plant_cards/recto', species: species, photos: (@photos_by_species[species.id] || []) %>
      </div>
    <% end %>
    <% (4 - group.size).times do %>
      <div class="a4-cell empty"></div>
    <% end %>
    <div class="cut-marks"></div>
  </section>
<% end %>
```

(Verso pages come in Task D-3.)

#### Step 4: Update controller to use the layout

In `app/controllers/plant_cards_controller.rb`, the `batch` action should use the new layout. Add at the top of the controller (or in the action):

```ruby
def batch
  # ... existing logic ...
  render :batch, layout: 'plant_card_batch'
end
```

#### Step 5: Run tests

```bash
bin/rails test test/integration/plant_cards_test.rb
```

Expected: all green.

#### Step 6: Visual smoke

Start `bin/dev`. Visit `http://localhost:3000/plants/cards?ids=42,43,44` (use real IDs). Should see an A4 sheet with 3 cards in 2×2 grid + 1 empty quadrant + cut marks at the center.

#### Step 7: Commit

```bash
git add app/views/plant_cards/batch.html.erb \
        app/views/layouts/plant_card_batch.html.erb \
        app/views/plant_cards/_card_styles.html.erb \
        app/views/layouts/plant_card.html.erb \
        app/controllers/plant_cards_controller.rb
git commit -m "Batch print: A4 layout with 2x2 recto grid + cut marks

Extracts card CSS to a partial, sizes .a6 in mm for accurate print, adds
a new plant_card_batch.html.erb layout (A4 portrait, no margin), and
renders rectos in a 2x2 grid with cut marks at the inner crossing."
```

---

### Task D-3: Verso pages (mirrored for duplex)

**Files:**
- Modify: `app/views/plant_cards/batch.html.erb`

#### Step 1: Add verso pages to the batch view

After each recto page, render a verso page with the same group of species in MIRRORED ORDER (2,1,4,3) so long-edge duplex flips correctly.

Update `app/views/plant_cards/batch.html.erb`:

```erb
<%= render 'plant_cards/svg_defs' %>

<% @species_list.each_slice(4).with_index do |group, page_idx| %>
  <%# RECTO PAGE %>
  <section class="a4-page">
    <% group.each do |species| %>
      <div class="a4-cell">
        <%= render 'plant_cards/recto', species: species, photos: (@photos_by_species[species.id] || []) %>
      </div>
    <% end %>
    <% (4 - group.size).times do %>
      <div class="a4-cell empty"></div>
    <% end %>
    <div class="cut-marks"></div>
  </section>

  <%# VERSO PAGE — mirrored 2-1-4-3 for long-edge duplex %>
  <% padded = group + Array.new(4 - group.size, nil) %>
  <% mirrored = [padded[1], padded[0], padded[3], padded[2]] %>
  <section class="a4-page">
    <% mirrored.each do |species| %>
      <% if species %>
        <div class="a4-cell">
          <%= render 'plant_cards/verso', species: species %>
        </div>
      <% else %>
        <div class="a4-cell empty"></div>
      <% end %>
    <% end %>
    <div class="cut-marks"></div>
  </section>
<% end %>
```

#### Step 2: Add a test

```ruby
test 'batch print includes both recto and verso pages' do
  s2 = Plant::Species.create!(latin_name: 'Quercus robur', plant_type: 'tree')
  get "/plants/cards?ids=#{@species.id},#{s2.id}"
  assert_response :success
  # 1 recto page + 1 verso page = 2 .a4-page sections
  pages_count = response.body.scan(/class="a4-page"/).size
  assert_equal 2, pages_count
end
```

#### Step 3: Run tests + commit

```bash
bin/rails test test/integration/plant_cards_test.rb

git add app/views/plant_cards/batch.html.erb test/integration/plant_cards_test.rb
git commit -m "Batch print: verso pages with mirrored layout for long-edge duplex"
```

---

### Task D-4: Multi-select UX in SearchView

**Files:**
- Modify: `app/frontend/plant-database/components/SearchView.tsx`

#### Step 1: Add multi-select state

At the top of `SearchView` component (where state is declared), add:

```tsx
const [printSelection, setPrintSelection] = useState<Set<string>>(new Set())
const togglePrintSelection = (id: string) => {
  setPrintSelection(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else if (next.size < 12) next.add(id)
    return next
  })
}
```

#### Step 2: Add a checkbox to each species result row

Find the result row component (likely `SpeciesResultRow` or similar in the same file or a sibling). Add a small checkbox in the leading position. Look at existing structure:

```bash
grep -n "result.type === 'species'\|SpeciesResultRow" app/frontend/plant-database/components/SearchView.tsx | head -5
```

Add a checkbox prop to the component:

```tsx
{result.type === 'species' && (
  <input
    type="checkbox"
    className="mr-2 cursor-pointer"
    checked={printSelection.has(result.id)}
    onClick={(e) => e.stopPropagation()}
    onChange={(e) => { e.stopPropagation(); togglePrintSelection(result.id) }}
    aria-label="Sélectionner pour impression"
  />
)}
```

The `stopPropagation` prevents the row's `onClick={onSelect}` from firing when the checkbox is clicked.

#### Step 3: Smoke test

Run `bin/dev`. Open Plant Database, see species rows. Each row has a small checkbox at left. Clicking checkboxes toggles selection state. Up to 12 selections allowed.

#### Step 4: Commit

```bash
git add app/frontend/plant-database/components/SearchView.tsx
git commit -m "SearchView: add multi-select checkboxes for batch print"
```

---

### Task D-5: "Imprimer N fiches" footer action bar

**Files:**
- Modify: `app/frontend/plant-database/components/SearchView.tsx`

#### Step 1: Add footer action bar

When `printSelection.size > 0`, render a sticky footer at the bottom of the search results panel:

```tsx
{printSelection.size > 0 && (
  <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-lg p-3 flex items-center justify-between gap-3 z-50">
    <button
      onClick={() => setPrintSelection(new Set())}
      className="text-sm text-stone-600 hover:text-stone-900"
    >
      Désélectionner ({printSelection.size})
    </button>
    <a
      href={`/plants/cards?ids=${Array.from(printSelection).join(',')}`}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-800 text-sm font-medium"
    >
      <Printer className="w-4 h-4" />
      Imprimer {printSelection.size} fiche{printSelection.size > 1 ? 's' : ''}
    </a>
  </div>
)}
```

(Import `Printer` from lucide-react if not already.)

#### Step 2: Manual verification

Run `bin/dev`. Select 3 species. Footer appears with "Imprimer 3 fiches". Click → opens batch print page in new tab with the 3 species rendered in A4.

#### Step 3: Commit

```bash
git add app/frontend/plant-database/components/SearchView.tsx
git commit -m "SearchView: 'Imprimer N fiches' sticky footer action bar"
```

---

### Task D-6: E2E verification + final tests

#### Step 1: Run all tests

```bash
bin/rails test test/integration/plant_cards_test.rb test/integration/public_species_test.rb test/helpers/plant_cards_helper_test.rb test/integration/plants_card_fields_test.rb
```

Expected: all green.

#### Step 2: TypeScript check

```bash
yarn tsc --noEmit 2>&1 | grep -c "error TS"
```

Expected: baseline (8).

#### Step 3: Manual print preview

`bin/dev`. Workflow:
1. Plant Database → search → select 3-5 species via checkboxes
2. Footer appears → click "Imprimer N fiches"
3. New tab opens with A4 sheets:
   - Recto page 1 with the cards in 2×2
   - Verso page 1 mirrored
4. Ctrl/⌘+P → confirm A4 paper, recto and verso align
5. Cut marks visible at the center

#### Step 4: No commit needed; Phase D done

---

## Final verification checklist

- [ ] All 6 tasks completed
- [ ] `bin/rails test` passes
- [ ] `yarn tsc --noEmit` baseline preserved (8)
- [ ] Visiting `/plants/cards?ids=X,Y,Z` renders A4 grid
- [ ] Multi-select + footer works in SearchView
- [ ] Print preview shows aligned recto/verso

## Out of scope

- Per-card cut marks (we only place center crossings; full per-card crop marks could be added later)
- Booklet imposition (folded A5 pamphlets)
- Print job queueing or PDF export endpoint (browser print sufficient for v1)
- Shareable batch URLs (`?ids=...` is the shareable URL but no permanence guarantee on ids)
