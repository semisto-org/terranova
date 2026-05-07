# Plant Cards — Phase E: Legacy Data Migration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** One-shot data migration that maps legacy `interests` / `ecosystem_needs` / `edible_parts` values onto the new clean fields introduced in Phase A (`eco_services_provided`, `eco_services_needed`, `successional_role`, `resource_parts`). The legacy columns are NOT dropped — they remain as historical reference and a fallback for any code paths still reading them. After this migration, the new fields are populated for all species that had legacy data, and the printable card / public page reflect that data.

**Architecture:** A single Ruby rake task in `lib/tasks/plants_migrate_legacy.rake` that walks every `Plant::Species`, computes the new field values from the legacy ones (purely additive — never overwrites manually-set new values), and saves. Idempotent (running it twice is safe). Logs each species' before/after to STDOUT and a summary at the end.

**Spec reference:** `docs/superpowers/specs/2026-05-06-plant-cards-design.md` section "Existing fields restructured (data migration deferred to phase E)".

---

## Mapping rules

### Legacy `interests` → new fields

| Legacy value | New field updates |
|---|---|
| `edible` | `resource_parts.edible ||= []` (kept empty if no `edible_parts` to copy) |
| `medicinal` | `resource_parts.medicinal ||= []` |
| `nitrogen-fixer` | `eco_services_provided += ['nitrogen']` |
| `pollinator` | `eco_services_provided += ['mellifere']` |
| `hedge` | `eco_services_provided += ['windbreak']` |
| `ornamental` | `resource_parts.sensory ||= []`; ensure `'ornamental'` is in it |

### Legacy `ecosystem_needs` → new fields

| Legacy value | New field updates |
|---|---|
| `nurse-tree` | `successional_role ||= 'nurse'` |
| `pioneer` | `successional_role ||= 'pioneer'` |
| `climax` | `successional_role ||= 'climax'` |
| `ground-cover` | `eco_services_provided += ['ground-cover']` |
| `erosion-control` | `eco_services_provided += ['erosion-control']` |

### Legacy `edible_parts` → `resource_parts.edible`

Copy directly. The set is already `fruit/leaf/flower/seed/root/bark/sap` which matches `Plant::Species::PLANT_PARTS`.

### Legacy `medicinal_rating` (1..5)

If `medicinal_rating.present?` AND `resource_parts['medicinal']` is empty AND `interests` doesn't include `'medicinal'`: skip — we don't know which parts are medicinal without the legacy info, and a rating alone isn't enough.

### Legacy `fragrance` ('strong' or 'medium')

If `fragrance.in?(%w[strong medium])`: `resource_parts.sensory ||= []`; ensure `'fragrant'` is in it.

### Legacy `fodder_qualities` (sheep/goats/pigs/cattle/poultry/rabbits)

These are species-level animal targets, not parts. They map to:
- For each animal, mark `resource_parts.animal += ['browsed']` if it's a grazing animal (sheep/goats/cattle/horses)
- `resource_parts.animal += ['pecked']` for poultry

Simplification: if `fodder_qualities.any?`, set `resource_parts.animal = ['browsed']` (assume the plant is browsed by something). Don't try to be fancy about pecked vs browsed — botanists can refine later.

### Idempotence rule

The migration NEVER overwrites a non-empty new value. It only:
- Appends to arrays (with `.uniq`)
- Sets a single-value field (like `successional_role`) only if it's currently nil

---

## Tasks

### Task E-1: Write the rake task

**Files:**
- Create: `lib/tasks/plants_migrate_legacy.rake`
- Create: `test/lib/tasks/plants_migrate_legacy_test.rb`

#### Step 1: Write failing tests

Create `test/lib/tasks/plants_migrate_legacy_test.rb`:

```ruby
require 'test_helper'
require 'rake'

class PlantsMigrateLegacyTest < ActiveSupport::TestCase
  setup do
    Rails.application.load_tasks if Rake::Task.tasks.empty?
    Rake::Task['plants:migrate_legacy'].reenable
    Plant::Species.delete_all
  end

  test 'maps interests:nitrogen-fixer to eco_services_provided' do
    sp = Plant::Species.create!(latin_name: 'Robinia pseudoacacia', plant_type: 'tree', interests: ['nitrogen-fixer'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_includes sp.eco_services_provided, 'nitrogen'
  end

  test 'maps interests:pollinator to mellifere' do
    sp = Plant::Species.create!(latin_name: 'Tilia cordata', plant_type: 'tree', interests: ['pollinator'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_includes sp.eco_services_provided, 'mellifere'
  end

  test 'maps interests:hedge to windbreak' do
    sp = Plant::Species.create!(latin_name: 'Carpinus betulus', plant_type: 'tree', interests: ['hedge'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_includes sp.eco_services_provided, 'windbreak'
  end

  test 'maps interests:ornamental to resource_parts.sensory' do
    sp = Plant::Species.create!(latin_name: 'Cornus alba', plant_type: 'shrub', interests: ['ornamental'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_includes sp.resource_parts.fetch('sensory', []), 'ornamental'
  end

  test 'maps ecosystem_needs:nurse-tree to successional_role nurse' do
    sp = Plant::Species.create!(latin_name: 'Alnus glutinosa', plant_type: 'tree', ecosystem_needs: ['nurse-tree'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_equal 'nurse', sp.successional_role
  end

  test 'maps ecosystem_needs:pioneer/climax to role' do
    pioneer = Plant::Species.create!(latin_name: 'Betula pendula', plant_type: 'tree', ecosystem_needs: ['pioneer'])
    climax  = Plant::Species.create!(latin_name: 'Quercus robur',  plant_type: 'tree', ecosystem_needs: ['climax'])
    Rake::Task['plants:migrate_legacy'].invoke
    assert_equal 'pioneer', pioneer.reload.successional_role
    assert_equal 'climax',  climax.reload.successional_role
  end

  test 'maps ecosystem_needs:ground-cover/erosion-control to eco_services_provided' do
    sp = Plant::Species.create!(latin_name: 'Vinca minor', plant_type: 'ground-cover', ecosystem_needs: ['ground-cover', 'erosion-control'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_includes sp.eco_services_provided, 'ground-cover'
    assert_includes sp.eco_services_provided, 'erosion-control'
  end

  test 'copies edible_parts into resource_parts.edible' do
    sp = Plant::Species.create!(latin_name: 'Fragaria vesca', plant_type: 'ground-cover', edible_parts: ['fruit', 'leaf'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_equal ['fruit', 'leaf'], sp.resource_parts.fetch('edible', []).sort
  end

  test 'maps fragrance strong/medium to resource_parts.sensory.fragrant' do
    strong = Plant::Species.create!(latin_name: 'Rosa damascena', plant_type: 'shrub', fragrance: 'strong')
    medium = Plant::Species.create!(latin_name: 'Lavandula',      plant_type: 'shrub', fragrance: 'medium')
    none   = Plant::Species.create!(latin_name: 'Aspen',          plant_type: 'tree',  fragrance: 'none')
    Rake::Task['plants:migrate_legacy'].invoke
    assert_includes strong.reload.resource_parts.fetch('sensory', []), 'fragrant'
    assert_includes medium.reload.resource_parts.fetch('sensory', []), 'fragrant'
    assert_not_includes Array(none.reload.resource_parts['sensory']), 'fragrant'
  end

  test 'maps fodder_qualities presence to resource_parts.animal browsed' do
    sp = Plant::Species.create!(latin_name: 'Trifolium', plant_type: 'ground-cover', fodder_qualities: ['sheep', 'cattle'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_includes sp.resource_parts.fetch('animal', []), 'browsed'
  end

  test 'is idempotent — running twice produces same result' do
    sp = Plant::Species.create!(latin_name: 'Robinia pseudoacacia', plant_type: 'tree', interests: ['nitrogen-fixer'])
    Rake::Task['plants:migrate_legacy'].invoke
    Rake::Task['plants:migrate_legacy'].reenable
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_equal ['nitrogen'], sp.eco_services_provided
  end

  test 'never overwrites a manually-set successional_role' do
    sp = Plant::Species.create!(latin_name: 'Alnus glutinosa', plant_type: 'tree',
                                ecosystem_needs: ['nurse-tree'],
                                successional_role: 'climax')  # manually set
    Rake::Task['plants:migrate_legacy'].invoke
    assert_equal 'climax', sp.reload.successional_role  # not overwritten
  end

  test 'preserves existing eco_services_provided values when adding' do
    sp = Plant::Species.create!(latin_name: 'X', plant_type: 'tree',
                                interests: ['nitrogen-fixer'],
                                eco_services_provided: ['mellifere'])
    Rake::Task['plants:migrate_legacy'].invoke
    sp.reload
    assert_equal ['mellifere', 'nitrogen'], sp.eco_services_provided.sort
  end
end
```

#### Step 2: Run tests, confirm they fail

```bash
bin/rails test test/lib/tasks/plants_migrate_legacy_test.rb
```

Expected: many failures (rake task doesn't exist).

#### Step 3: Implement the rake task

Create `lib/tasks/plants_migrate_legacy.rake`:

```ruby
namespace :plants do
  desc 'Migrate legacy interests/ecosystem_needs/edible_parts/fragrance/fodder_qualities into the new card fields. Idempotent.'
  task migrate_legacy: :environment do
    INTERESTS_TO_ECO = {
      'nitrogen-fixer' => 'nitrogen',
      'pollinator'     => 'mellifere',
      'hedge'          => 'windbreak'
    }.freeze

    INTERESTS_TO_RESOURCE = {
      'edible'     => 'edible',
      'medicinal'  => 'medicinal'
      # 'ornamental' is handled as a sensory subtype (not a separate resource category)
    }.freeze

    NEEDS_TO_ROLE = {
      'nurse-tree' => 'nurse',
      'pioneer'    => 'pioneer',
      'climax'     => 'climax'
    }.freeze

    NEEDS_TO_ECO = %w[ground-cover erosion-control].freeze

    stats = Hash.new(0)
    Plant::Species.find_each do |s|
      provided = Array(s.eco_services_provided).dup
      role     = s.successional_role
      parts    = s.resource_parts.is_a?(Hash) ? s.resource_parts.dup : {}

      # interests → eco_services_provided
      Array(s.interests).each do |interest|
        if (eco = INTERESTS_TO_ECO[interest])
          provided |= [eco]
        end
        if (cat = INTERESTS_TO_RESOURCE[interest])
          parts[cat] ||= []
        end
        if interest == 'ornamental'
          parts['sensory'] = (parts['sensory'] || []) | ['ornamental']
        end
      end

      # ecosystem_needs → role + eco_services_provided
      Array(s.ecosystem_needs).each do |need|
        if (mapped_role = NEEDS_TO_ROLE[need])
          role ||= mapped_role
        end
        if NEEDS_TO_ECO.include?(need)
          provided |= [need]
        end
      end

      # edible_parts → resource_parts.edible
      if Array(s.edible_parts).any?
        existing = Array(parts['edible'])
        parts['edible'] = (existing | s.edible_parts).sort
      end

      # fragrance strong/medium → resource_parts.sensory += fragrant
      if %w[strong medium].include?(s.fragrance.to_s)
        parts['sensory'] = (parts['sensory'] || []) | ['fragrant']
      end

      # fodder_qualities → resource_parts.animal += browsed
      if Array(s.fodder_qualities).any?
        parts['animal'] = (parts['animal'] || []) | ['browsed']
      end

      changed = (provided != s.eco_services_provided) ||
                (role != s.successional_role) ||
                (parts != s.resource_parts)

      if changed
        s.update_columns(
          eco_services_provided: provided,
          successional_role: role,
          resource_parts: parts
        )
        stats[:migrated] += 1
        puts "  ↑ #{s.latin_name}"
      else
        stats[:skipped] += 1
      end
    end

    puts "\n=== Migration summary ==="
    puts "Migrated: #{stats[:migrated]}"
    puts "Skipped:  #{stats[:skipped]} (already up to date or no legacy data)"
  end
end
```

(`update_columns` skips validations and callbacks. We're confident the values are valid since we control the mapping. This makes the task fast and safe to re-run.)

#### Step 4: Run tests, confirm pass

```bash
bin/rails test test/lib/tasks/plants_migrate_legacy_test.rb
```

Expected: all tests pass.

#### Step 5: Commit

```bash
git add lib/tasks/plants_migrate_legacy.rake test/lib/tasks/plants_migrate_legacy_test.rb
git commit -m "Add rake task plants:migrate_legacy for Phase E data migration

Maps legacy interests / ecosystem_needs / edible_parts / fragrance /
fodder_qualities to the new card fields (eco_services_provided,
successional_role, resource_parts). Idempotent — never overwrites
manually-set new values, only appends to arrays. Run via:
bin/rake plants:migrate_legacy"
```

---

### Task E-2: Run on real data + verification

**Files:** none (data-only task)

#### Step 1: Inventory current state

```bash
bin/rails runner "
puts 'Species total: ' + Plant::Species.count.to_s
puts 'With interests: ' + Plant::Species.where(\"interests::text != '[]'\").count.to_s
puts 'With ecosystem_needs: ' + Plant::Species.where(\"ecosystem_needs::text != '[]'\").count.to_s
puts 'With edible_parts: ' + Plant::Species.where(\"edible_parts::text != '[]'\").count.to_s
puts 'With fodder_qualities: ' + Plant::Species.where(\"fodder_qualities::text != '[]'\").count.to_s
puts 'Already with successional_role: ' + Plant::Species.where.not(successional_role: nil).count.to_s
puts 'Already with eco_services_provided: ' + Plant::Species.where(\"eco_services_provided::text != '[]'\").count.to_s
"
```

Note the numbers before running.

#### Step 2: Run the migration

```bash
bin/rake plants:migrate_legacy 2>&1 | tee /tmp/plants-migrate-$(date +%s).log
```

Read the log: scan for any unexpected output (errors, exceptions). Confirm migration count is reasonable.

#### Step 3: Verify the result

```bash
bin/rails runner "
puts 'Species total: ' + Plant::Species.count.to_s
puts 'Now with successional_role: ' + Plant::Species.where.not(successional_role: nil).count.to_s
puts 'Now with eco_services_provided: ' + Plant::Species.where(\"eco_services_provided::text != '[]'\").count.to_s
puts 'Now with resource_parts: ' + Plant::Species.where(\"resource_parts::text != '{}'\").count.to_s
"
```

Numbers should be higher than before.

#### Step 4: Spot-check a few species in the admin UI

Open Plant Database, click on 2-3 species that previously had `interests = ['nitrogen-fixer']` (search for nitrogen fixers like Robinia, Alnus). Open the Conception tab. Check that:
- `Eco services provided` chip group shows `Azote` highlighted
- `Successional role` is set if the species had `nurse-tree`/`pioneer`/`climax` in `ecosystem_needs`

Also visit `/plants/species/:id/card` for one of those species: the eco grid on the verso should now show `Azote` in green.

#### Step 5: No commit needed; data is on the database

The rake task is committed. Running it is a side effect on the data, not on the code.

#### Step 6: Mark legacy fields as deprecated (optional doc note)

Append to `app/models/plant/species.rb` near the GROWTH_HABITS constant (or similar comment block):

```ruby
# Legacy fields:
# - interests, ecosystem_needs, edible_parts, fodder_qualities, fragrance
#   were originally a mixed bag. Use the structured fields instead:
#     interests + ecosystem_needs → eco_services_provided + successional_role
#     edible_parts                → resource_parts.edible
#     fodder_qualities            → resource_parts.animal
#     fragrance                   → resource_parts.sensory.fragrant
#   The plants:migrate_legacy rake task copies legacy values onto the new
#   fields. Legacy fields are kept for historical reference and are not
#   used by the printable card or public page.
```

Commit:

```bash
git add app/models/plant/species.rb
git commit -m "Document legacy fields as deprecated post Phase E migration"
```

---

## Final verification

- [ ] `bin/rails test` passes
- [ ] `bin/rake plants:migrate_legacy` runs cleanly twice in a row (idempotent)
- [ ] Spot-checked species show new fields populated in admin form
- [ ] Printable card and public page reflect the new data

## Out of scope

- Removing legacy columns (defer indefinitely; they don't hurt)
- Migrating the `transformations` field (jam/syrup/etc.) — these are products, not card content; leave them alone
- Notion sync changes — out of scope for the card project
- Per-target toxicity migration from `toxic_elements` text — keep manual since toxic_elements is unstructured prose
