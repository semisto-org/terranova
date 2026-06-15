# Plant Database Illustrations Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an in-app illustration generation feature for the Plant Database — bulk + single regeneration UI, async background jobs via SolidQueue, Claude Haiku for prompt composition, Gemini Imagen for generation, ActiveStorage for attachment.

**Architecture:** Three layers. Data: `Plant::Species.silhouette_illustration` (already deployed) + new `Plant::IllustrationJob` model. Backend: `Plants::Vds` (YAML loader), `Plants::IllustrationPromptComposer` (Claude Haiku), `Plants::GeminiImageClient` (Net::HTTP), `IllustrationGenerationJob` (SolidQueue). UI: `/plants/illustrations` atelier page (gallery + queue) + enriched list view + regeneration modal from species fiche.

**Tech Stack:** Rails 8.1.2 + ActiveJob/SolidQueue + Inertia React + TS + Tailwind 4 + Turbo Streams + `anthropic` gem + Net::HTTP for Gemini.

**Spec source :** `docs/superpowers/specs/2026-05-08-illustrations-management-design.md`

**Frontend constraint :** All frontend tasks (Sprints 3 and 4) MUST invoke the `frontend-design` skill before writing components. Reference: `Skill('frontend-design')`. Goal: distinctive, production-grade UI without generic AI aesthetics.

---

## File Structure (created/modified)

```
Backend:
  Gemfile                                                          # +anthropic, +solid_queue
  config/database.yml                                              # +queue database
  config/queue.yml                                                 # NEW
  config/initializers/visual_design_system.rb                      # NEW
  config/visual_design_system.yml                                  # NEW
  config/routes.rb                                                 # +6 routes
  db/migrate/[ts]_install_solid_queue.rb                           # NEW (rails generate)
  db/migrate/[ts]_create_plant_illustration_jobs.rb                # NEW
  app/models/plant/illustration_job.rb                             # NEW
  app/models/plant/species.rb                                      # +scopes, +has_many
  app/services/plants/vds.rb                                       # NEW
  app/services/plants/illustration_prompt_composer.rb              # NEW
  app/services/plants/gemini_image_client.rb                       # NEW
  app/jobs/illustration_generation_job.rb                          # NEW
  app/controllers/api/v1/plants_controller.rb                      # +6 actions
  app/controllers/plant_illustrations_controller.rb                # NEW (Inertia page)
  app/views/plants/illustration_jobs/_job_row.html.erb             # NEW (Turbo partial)

Backend tests:
  test/models/plant/illustration_job_test.rb                       # NEW
  test/models/plant/species_scopes_test.rb                         # NEW
  test/services/plants/vds_test.rb                                 # NEW
  test/services/plants/illustration_prompt_composer_test.rb        # NEW
  test/services/plants/gemini_image_client_test.rb                 # NEW
  test/jobs/illustration_generation_job_test.rb                    # NEW
  test/integration/illustrations_api_test.rb                       # NEW

Frontend:
  app/frontend/pages/Plants/Illustrations.tsx                      # NEW (Inertia page)
  app/frontend/plant-database/components/IllustrationStatsTile.tsx # NEW
  app/frontend/plant-database/components/IllustrationFilterBar.tsx # NEW
  app/frontend/plant-database/components/IllustrationGalleryGrid.tsx # NEW
  app/frontend/plant-database/components/IllustrationQueuePanel.tsx # NEW
  app/frontend/plant-database/components/RegenerateIllustrationModal.tsx # NEW
  app/frontend/plant-database/components/IllustrationStatusBadge.tsx # NEW
  app/frontend/plant-database/components/ConfirmBulkGenerationModal.tsx # NEW
  app/frontend/plant-database/components/SearchView.tsx            # +filter, +footer, +select-all
  app/frontend/plant-database/components/SearchResultItem.tsx      # +status badge
  app/frontend/plant-database/components/FilterPanel.tsx           # +illustration status filter
  app/frontend/plant-database/components/SpeciesDetail.tsx         # +Régénérer button + modal trigger

Skill:
  ~/.claude/skills/semisto-imagegen/SKILL.md                       # delegate to Rails for species
  ~/.claude/skills/semisto-imagegen/visual-design-system.md        # add mirror note
```

---

# SPRINT 1 — Backend foundations

## Task 1: Add gems + env vars

**Files:**
- Modify: `Gemfile`
- Create: `.env.local` (or update existing) — add `ANTHROPIC_API_KEY` and `GEMINI_API_KEY`

- [ ] **Step 1: Add gems to Gemfile**

Edit `Gemfile`, add these lines (find an appropriate section, e.g. near other API clients) :

```ruby
# Anthropic Claude API client (used by Plants::IllustrationPromptComposer)
gem "anthropic", "~> 1.10"

# Job queue with database backend (Rails 8 default companion)
gem "solid_queue", "~> 1.2"
```

- [ ] **Step 2: Install gems**

```bash
bundle install
```

Expected: bundle installs `anthropic` and `solid_queue` without errors.

- [ ] **Step 3: Set env vars locally**

Add to `.env.local` (or your equivalent — whichever loader the dev environment uses) :

```
ANTHROPIC_API_KEY=sk-ant-api03-...   # ask Michael for the key
GEMINI_API_KEY=AIzaSyDHLN9ZqifSPKsuUBnEZKjeLw8JLyFLeoQ   # reuse the Petit Kiwi key
```

- [ ] **Step 4: Verify Anthropic client loads**

```bash
bin/rails runner 'puts Anthropic::Client.name'
```
Expected output: `Anthropic::Client`

- [ ] **Step 5: Commit**

```bash
git add Gemfile Gemfile.lock
git commit -m "Add anthropic and solid_queue gems"
```

---

## Task 2: Install SolidQueue + create illustrations queue

**Files:**
- Generate: SolidQueue migration via `rails generate solid_queue:install`
- Create: `config/queue.yml`
- Modify: `config/database.yml` (queue database)
- Modify: `config/environments/development.rb` and `config/environments/production.rb` (active_job adapter)

- [ ] **Step 1: Run installer**

```bash
bin/rails generate solid_queue:install
```

This creates `db/queue_schema.rb` and `config/queue.yml`. It also adds the queue database config to `config/database.yml` automatically.

- [ ] **Step 2: Configure queue.yml with `:illustrations` queue**

Replace `config/queue.yml` with :

```yaml
default: &default
  dispatchers:
    - polling_interval: 1
      batch_size: 500
  workers:
    - queues: ["default", "*"]
      threads: 5
      processes: 1
      polling_interval: 0.1
    - queues: "illustrations"
      threads: 3
      processes: 1
      polling_interval: 0.5

development:
  <<: *default

production:
  <<: *default

test:
  <<: *default
```

The `illustrations` queue has `threads: 3` — this caps Gemini concurrency.

- [ ] **Step 3: Set ActiveJob adapter**

Edit `config/environments/development.rb` and `config/environments/production.rb`. Add (or modify if exists) :

```ruby
config.active_job.queue_adapter = :solid_queue
```

For tests, edit `config/environments/test.rb` :

```ruby
config.active_job.queue_adapter = :test
```

- [ ] **Step 4: Run the queue migration**

```bash
bin/rails db:prepare
```

Expected: SolidQueue tables (`solid_queue_jobs`, `solid_queue_processes`, etc.) created in the queue database.

- [ ] **Step 5: Commit**

```bash
git add config/queue.yml config/database.yml config/environments db/queue_schema.rb
git commit -m "Install SolidQueue with dedicated :illustrations queue (threads: 3)"
```

---

## Task 3: `Plant::IllustrationJob` model + migration

**Files:**
- Create: `db/migrate/[timestamp]_create_plant_illustration_jobs.rb`
- Create: `app/models/plant/illustration_job.rb`
- Create: `test/models/plant/illustration_job_test.rb`

- [ ] **Step 1: Generate migration**

```bash
bin/rails generate migration CreatePlantIllustrationJobs
```

- [ ] **Step 2: Edit migration**

Replace the generated migration content (path: `db/migrate/<timestamp>_create_plant_illustration_jobs.rb`) with :

```ruby
class CreatePlantIllustrationJobs < ActiveRecord::Migration[8.1]
  def change
    create_table :plant_illustration_jobs do |t|
      t.references :species, null: false, foreign_key: { to_table: :plant_species }
      t.references :triggered_by, null: false, foreign_key: { to_table: :members }
      t.string :status, null: false, default: "pending"
      t.string :kind, null: false
      t.text :feedback
      t.text :prompt_used
      t.string :vds_version
      t.timestamp :triggered_at, null: false
      t.timestamp :started_at
      t.timestamp :finished_at
      t.text :error_message
      t.string :error_class
      t.integer :gemini_attempts, default: 0, null: false
      t.bigint :byte_size

      t.timestamps
    end

    add_index :plant_illustration_jobs, :status
    add_index :plant_illustration_jobs, :triggered_at, order: { triggered_at: :desc }
  end
end
```

- [ ] **Step 3: Run migration**

```bash
bin/rails db:migrate
```

Expected: table `plant_illustration_jobs` created.

- [ ] **Step 4: Write the failing test**

Create `test/models/plant/illustration_job_test.rb` :

```ruby
require "test_helper"

class Plant::IllustrationJobTest < ActiveSupport::TestCase
  setup do
    Plant::IllustrationJob.delete_all
    @member = Member.first || Member.create!(first_name: "T", last_name: "U", email: "tu@test.local", password: "x12345678", is_admin: true)
    @genus = Plant::Genus.find_or_create_by!(latin_name: "Testus") { |g| g.plant_type = "tree" }
    @species = Plant::Species.create!(latin_name: "Testus testus", plant_type: "tree", genus: @genus)
  end

  test "creates job with required fields" do
    job = Plant::IllustrationJob.create!(
      species: @species,
      triggered_by: @member,
      kind: "initial",
      triggered_at: Time.current
    )
    assert job.persisted?
    assert_equal "pending", job.status
    assert_equal 0, job.gemini_attempts
  end

  test "scopes status helpers" do
    job = Plant::IllustrationJob.create!(species: @species, triggered_by: @member, kind: "initial", triggered_at: Time.current)
    assert job.pending?
    job.update!(status: "running", started_at: Time.current)
    assert job.running?
    job.update!(status: "completed", finished_at: Time.current)
    assert job.completed?
  end

  test "scope recent orders by triggered_at desc" do
    older = Plant::IllustrationJob.create!(species: @species, triggered_by: @member, kind: "initial", triggered_at: 1.hour.ago)
    newer = Plant::IllustrationJob.create!(species: @species, triggered_by: @member, kind: "initial", triggered_at: Time.current)
    assert_equal [newer, older], Plant::IllustrationJob.recent.to_a
  end
end
```

- [ ] **Step 5: Run test (expected to fail)**

```bash
bin/rails test test/models/plant/illustration_job_test.rb
```

Expected: failure with `NameError: uninitialized constant Plant::IllustrationJob` (model doesn't exist yet).

- [ ] **Step 6: Create the model**

Create `app/models/plant/illustration_job.rb` :

```ruby
module Plant
  class IllustrationJob < ApplicationRecord
    self.table_name = "plant_illustration_jobs"

    STATUSES = %w[pending running completed failed].freeze
    KINDS = %w[initial regeneration].freeze

    belongs_to :species, class_name: "Plant::Species"
    belongs_to :triggered_by, class_name: "Member"

    validates :status, inclusion: { in: STATUSES }
    validates :kind, inclusion: { in: KINDS }
    validates :triggered_at, presence: true

    scope :recent, -> { order(triggered_at: :desc) }
    scope :pending, -> { where(status: "pending") }
    scope :running, -> { where(status: "running") }
    scope :completed, -> { where(status: "completed") }
    scope :failed, -> { where(status: "failed") }

    def pending?;   status == "pending";   end
    def running?;   status == "running";   end
    def completed?; status == "completed"; end
    def failed?;    status == "failed";    end
  end
end
```

- [ ] **Step 7: Run test (expected to pass)**

```bash
bin/rails test test/models/plant/illustration_job_test.rb
```

Expected: 3 tests, 0 failures.

- [ ] **Step 8: Commit**

```bash
git add db/migrate app/models/plant/illustration_job.rb test/models/plant/illustration_job_test.rb db/schema.rb
git commit -m "Plant::IllustrationJob model + migration"
```

---

## Task 4: `Plant::Species` scopes + has_many

**Files:**
- Modify: `app/models/plant/species.rb`
- Create: `test/models/plant/species_scopes_test.rb`

- [ ] **Step 1: Write the failing test**

Create `test/models/plant/species_scopes_test.rb` :

```ruby
require "test_helper"

class Plant::SpeciesScopesTest < ActiveSupport::TestCase
  setup do
    Plant::IllustrationJob.delete_all
    @genus = Plant::Genus.find_or_create_by!(latin_name: "Testus") { |g| g.plant_type = "tree" }
    @with    = Plant::Species.create!(latin_name: "Testus withus",    plant_type: "tree", genus: @genus)
    @without = Plant::Species.create!(latin_name: "Testus withoutus", plant_type: "tree", genus: @genus)
    @with.silhouette_illustration.attach(
      io: StringIO.new("\x89PNG\r\n\x1a\n" + "x" * 1000),
      filename: "fake.png",
      content_type: "image/png"
    )
  end

  test "with_illustration includes only species with attached illustration" do
    ids = Plant::Species.with_illustration.pluck(:id)
    assert_includes ids, @with.id
    refute_includes ids, @without.id
  end

  test "without_illustration excludes species with attached illustration" do
    ids = Plant::Species.without_illustration.pluck(:id)
    refute_includes ids, @with.id
    assert_includes ids, @without.id
  end

  test "last_illustration_job returns most recent" do
    member = Member.first || Member.create!(first_name: "T", last_name: "U", email: "tu@test.local", password: "x12345678", is_admin: true)
    older = Plant::IllustrationJob.create!(species: @with, triggered_by: member, kind: "initial", triggered_at: 1.hour.ago)
    newer = Plant::IllustrationJob.create!(species: @with, triggered_by: member, kind: "regeneration", triggered_at: Time.current)
    assert_equal newer, @with.last_illustration_job
  end
end
```

- [ ] **Step 2: Run test (expected to fail)**

```bash
bin/rails test test/models/plant/species_scopes_test.rb
```

Expected: failures (`with_illustration`, `without_illustration`, `last_illustration_job` undefined).

- [ ] **Step 3: Add scopes and association**

Edit `app/models/plant/species.rb`. Find the existing `has_one_attached :silhouette_illustration` line (added in commit `bf60331`). After it, add :

```ruby
    has_one_attached :silhouette_illustration
    has_many :illustration_jobs, class_name: "Plant::IllustrationJob", dependent: :destroy

    scope :with_illustration, -> {
      joins(:silhouette_illustration_attachment)
    }
    scope :without_illustration, -> {
      left_joins(:silhouette_illustration_attachment)
        .where(active_storage_attachments: { id: nil })
    }

    def last_illustration_job
      illustration_jobs.order(triggered_at: :desc).first
    end
```

- [ ] **Step 4: Run test (expected to pass)**

```bash
bin/rails test test/models/plant/species_scopes_test.rb
```

Expected: 3 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add app/models/plant/species.rb test/models/plant/species_scopes_test.rb
git commit -m "Plant::Species: add illustration scopes and has_many :illustration_jobs"
```

---

## Task 5: `Plants::Vds` service + YAML config

**Files:**
- Create: `config/visual_design_system.yml`
- Create: `app/services/plants/vds.rb`
- Create: `config/initializers/visual_design_system.rb`
- Create: `test/services/plants/vds_test.rb`

- [ ] **Step 1: Create the YAML config**

Create `config/visual_design_system.yml` (transcription of the markdown VDS for Rails consumption):

```yaml
version: "1.2"
last_updated: "2026-05-08"

styles:
  a2s:
    name: "Silhouette plant card"
    background: "#ffffff"
    template: |
      Generate a botanical illustration of [SPECIES_LATIN] ([SPECIES_COMMON]) showing
      the WHOLE plant in its mature form. Hand-drawn watercolor with fine ink linework.
      PURE WHITE background (#ffffff, no cream tint, no off-white, no texture).

      Canvas aspect ratio: derived from real spread:height of the species
      (e.g. 4m wide × 6m tall plant → 2:3 portrait ; 1m wide × 0.3m tall ground
      cover → 10:3 landscape ; 1m wide × 8m climber → 1:8 very narrow portrait).

      Composition: the plant FILLS the canvas vertically — base of the trunks
      touches the BOTTOM EDGE of the image with no white space below ; topmost
      foliage touches the TOP EDGE of the image with no white space above.
      Horizontal centering with minimal breathing room on the sides.

      Subject: [SPECIES_LATIN]. Real height: [HEIGHT_RANGE]. Real spread:
      [SPREAD_RANGE]. Growth habit: [GROWTH_HABIT]. Show characteristic
      mature features: leaves, flowers (if seasonal), fruits (if seasonal),
      bark texture, branching pattern.

      Color palette: muted greens, warm earthy browns, soft accent colors
      (flowers/fruits) — drawn from the Semisto fruit palette. Never oversaturated.

      Style: observational botanical drawing, hand-painted watercolor, never
      flat vector. Ink contour with loose watercolor wash.

  # Other styles documented for skill standalone usage but not used by Rails today
  a1:
    name: "Planche complète"
    background: "#faf8f1"
    template: "..."  # see ~/.claude/skills/semisto-imagegen/visual-design-system.md
  a2:
    name: "Carte pédagogique flashcard"
    background: "#faf8f1"
    template: "..."
  a3:
    name: "Picto carré"
    background: "#faf8f1"
    template: "..."
  b:
    name: "Aquarelle paysagère narrative"
    background: "natural watercolor cream paper"
    template: "..."

important_rules: |
  IMPORTANT RULES:
  - Background MUST be pure white #ffffff for A2s (silhouette plant card use case).
    No cream, no off-white, no texture.
  - Plant occupies the FULL vertical extent — base at bottom edge, top at top edge.
  - NO scale figure (no human, no other organism), NO ground line, NO sky, NO landscape, NO shadow.
  - Plant is the ONLY visible element. Everything else is empty white.
  - NO TEXT integrated in the image. No Latin name, no scale bar, no annotation.
  - Plant must be edible/useful — no purely ornamental.
  - NO chemical products visible.
  - NO commercial logos.
  - NO doom imagery — show ABUNDANCE.
  - NO "AI generic" rendering — no perfectly symmetrical faces, no 6-fingered hands, no unrealistic turquoise/purple lighting.
  - NO aggressive militant imagery.
```

- [ ] **Step 2: Create the initializer**

Create `config/initializers/visual_design_system.rb` :

```ruby
Rails.application.config.after_initialize do
  Plants::Vds.load!
end
```

- [ ] **Step 3: Write the failing test**

Create `test/services/plants/vds_test.rb` :

```ruby
require "test_helper"

class Plants::VdsTest < ActiveSupport::TestCase
  setup { Plants::Vds.load! }

  test "loads version" do
    assert_match(/^\d+\.\d+/, Plants::Vds.version)
  end

  test "exposes a2s template" do
    template = Plants::Vds.template_for(:a2s)
    assert_kind_of Hash, template
    assert template["template"].include?("WHITE background")
  end

  test "exposes important_rules" do
    rules = Plants::Vds.important_rules
    assert rules.include?("IMPORTANT RULES")
    assert rules.include?("NO TEXT integrated")
  end

  test "raises on unknown style" do
    assert_raises(KeyError) { Plants::Vds.template_for(:unknown_style) }
  end
end
```

- [ ] **Step 4: Run test (expected to fail)**

```bash
bin/rails test test/services/plants/vds_test.rb
```

Expected: `NameError: uninitialized constant Plants::Vds`.

- [ ] **Step 5: Create the service**

Create `app/services/plants/vds.rb` :

```ruby
module Plants
  class Vds
    cattr_accessor :data

    class << self
      def load!
        @@data = YAML.safe_load_file(
          Rails.root.join("config/visual_design_system.yml"),
          permitted_classes: []
        )
      end

      def template_for(style)
        ensure_loaded!
        @@data["styles"].fetch(style.to_s)
      end

      def important_rules
        ensure_loaded!
        @@data["important_rules"]
      end

      def version
        ensure_loaded!
        @@data["version"]
      end

      private

      def ensure_loaded!
        load! if @@data.nil?
      end
    end
  end
end
```

- [ ] **Step 6: Run test (expected to pass)**

```bash
bin/rails test test/services/plants/vds_test.rb
```

Expected: 4 tests, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add config/visual_design_system.yml config/initializers/visual_design_system.rb app/services/plants/vds.rb test/services/plants/vds_test.rb
git commit -m "Plants::Vds: load visual design system from YAML config"
```

---

## Task 6: `Plants::IllustrationPromptComposer` service

**Files:**
- Create: `app/services/plants/illustration_prompt_composer.rb`
- Create: `test/services/plants/illustration_prompt_composer_test.rb`

- [ ] **Step 1: Write the failing test (with VCR-like stubbing)**

Create `test/services/plants/illustration_prompt_composer_test.rb` :

```ruby
require "test_helper"

class Plants::IllustrationPromptComposerTest < ActiveSupport::TestCase
  setup do
    @genus = Plant::Genus.find_or_create_by!(latin_name: "Amelanchier") { |g| g.plant_type = "tree" }
    @species = Plant::Species.create!(
      latin_name: "Amelanchier canadensis",
      plant_type: "tree",
      genus: @genus,
      height_min_cm: 400, height_max_cm: 800,
      spread_min_cm: 400, spread_max_cm: 600,
      growth_habit: "buissonnant-elance",
      strate: "tree"
    )
  end

  test "compose returns Claude response text" do
    fake_response = OpenStruct.new(content: [OpenStruct.new(text: "Generate a botanical illustration of...")])
    Anthropic::Client.any_instance.stubs(:messages).returns(
      OpenStruct.new(create: fake_response)
    )

    result = Plants::IllustrationPromptComposer.new(species: @species, style: :a2s).compose
    assert_match(/botanical illustration/, result)
  end

  test "compose includes feedback when provided" do
    captured_messages = nil
    Anthropic::Client.any_instance.stubs(:messages).returns(
      Object.new.tap do |o|
        o.define_singleton_method(:create) do |params|
          captured_messages = params[:messages]
          OpenStruct.new(content: [OpenStruct.new(text: "ok")])
        end
      end
    )

    Plants::IllustrationPromptComposer.new(
      species: @species,
      style: :a2s,
      feedback: "less dense, more flowers"
    ).compose

    assert captured_messages.first[:content].include?("less dense, more flowers")
  end

  test "raises Plants::IllustrationPromptComposer::Error on Anthropic error" do
    Anthropic::Client.any_instance.stubs(:messages).raises(
      Anthropic::Errors::APIError.new("rate limit")
    )

    assert_raises(Plants::IllustrationPromptComposer::Error) do
      Plants::IllustrationPromptComposer.new(species: @species).compose
    end
  end
end
```

- [ ] **Step 2: Run test (expected to fail)**

```bash
bin/rails test test/services/plants/illustration_prompt_composer_test.rb
```

Expected: NameError.

- [ ] **Step 3: Create the service**

Create `app/services/plants/illustration_prompt_composer.rb` :

```ruby
require "anthropic"

module Plants
  class IllustrationPromptComposer
    Error = Class.new(StandardError)

    SYSTEM_PROMPT = <<~SYS.freeze
      You compose botanical illustration prompts for Gemini Imagen, following
      the Semisto Visual Design System exactly. Output the final English prompt
      only — no preamble, no markdown, no explanations.
    SYS

    def initialize(species:, style: :a2s, feedback: nil)
      @species  = species
      @style    = style
      @feedback = feedback
    end

    def compose
      response = client.messages.create(
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: user_prompt }]
      )
      response.content.first.text.strip
    rescue => e
      raise Error, "Claude API error: #{e.class}: #{e.message}"
    end

    private

    def client
      @client ||= Anthropic::Client.new(access_token: ENV.fetch("ANTHROPIC_API_KEY"))
    end

    def user_prompt
      <<~PROMPT
        Compose an illustration prompt for the following species using style #{@style.to_s.upcase}.

        Species data:
        - Latin name: #{@species.latin_name}
        - Common name (FR): #{@species.common_names_fr}
        - Height: #{@species.height_min_cm}-#{@species.height_max_cm} cm
        - Spread: #{@species.spread_min_cm}-#{@species.spread_max_cm} cm
        - Growth habit: #{@species.growth_habit}
        - Strate: #{@species.strate}
        - Foliage type: #{@species.foliage_type}
        - Plant type: #{@species.plant_type}

        Style template:
        #{Plants::Vds.template_for(@style)["template"]}

        Important rules to append at end of prompt:
        #{Plants::Vds.important_rules}

        #{"User feedback for this regeneration (incorporate naturally into the composition): #{@feedback}" if @feedback.present?}

        Output the final English prompt to send to Gemini, ready to use as-is.
      PROMPT
    end
  end
end
```

- [ ] **Step 4: Run test (expected to pass)**

```bash
bin/rails test test/services/plants/illustration_prompt_composer_test.rb
```

Expected: 3 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add app/services/plants/illustration_prompt_composer.rb test/services/plants/illustration_prompt_composer_test.rb
git commit -m "Plants::IllustrationPromptComposer: Claude Haiku-based prompt composition"
```

---

## Task 7: `Plants::GeminiImageClient` service

**Files:**
- Create: `app/services/plants/gemini_image_client.rb`
- Create: `test/services/plants/gemini_image_client_test.rb`

- [ ] **Step 1: Write the failing test**

Create `test/services/plants/gemini_image_client_test.rb` :

```ruby
require "test_helper"
require "base64"

class Plants::GeminiImageClientTest < ActiveSupport::TestCase
  PNG_HEADER = "\x89PNG\r\n\x1a\n".force_encoding("ASCII-8BIT")
  JPEG_HEADER = "\xFF\xD8\xFF\xE0".force_encoding("ASCII-8BIT")

  test "generate returns image bytes on success" do
    fake_bytes = PNG_HEADER + "x" * 2000
    fake_response = build_response(200, {
      candidates: [{ content: { parts: [{ inlineData: { mimeType: "image/png", data: Base64.encode64(fake_bytes) } }] } }]
    }.to_json)

    Net::HTTP.any_instance.stubs(:request).returns(fake_response)

    result = Plants::GeminiImageClient.new(api_key: "fake").generate(prompt: "anything")
    assert_equal fake_bytes.bytes, result.bytes
  end

  test "generate retries on 503 then succeeds" do
    failure = build_response(503, "{}")
    fake_bytes = PNG_HEADER + "x" * 2000
    success = build_response(200, {
      candidates: [{ content: { parts: [{ inlineData: { mimeType: "image/png", data: Base64.encode64(fake_bytes) } }] } }]
    }.to_json)

    call_count = 0
    Net::HTTP.any_instance.stubs(:request) do
      call_count += 1
      call_count == 1 ? failure : success
    end
    Plants::GeminiImageClient.any_instance.stubs(:sleep)

    result = Plants::GeminiImageClient.new(api_key: "fake").generate(prompt: "anything")
    assert_equal 2, call_count
    assert result.bytesize > 1000
  end

  test "generate raises RateLimitError after 2 failed 503s" do
    Net::HTTP.any_instance.stubs(:request).returns(build_response(503, "{}"))
    Plants::GeminiImageClient.any_instance.stubs(:sleep)

    assert_raises(Plants::GeminiImageClient::RateLimitError) do
      Plants::GeminiImageClient.new(api_key: "fake").generate(prompt: "anything")
    end
  end

  test "generate raises InvalidImageError on non-image bytes" do
    fake_response = build_response(200, {
      candidates: [{ content: { parts: [{ inlineData: { mimeType: "image/png", data: Base64.encode64("not an image") } }] } }]
    }.to_json)
    Net::HTTP.any_instance.stubs(:request).returns(fake_response)

    assert_raises(Plants::GeminiImageClient::InvalidImageError) do
      Plants::GeminiImageClient.new(api_key: "fake").generate(prompt: "anything")
    end
  end

  private

  def build_response(code, body)
    Net::HTTPResponse.send(:response_class, code.to_s).new("1.1", code.to_s, "OK").tap do |r|
      r.instance_variable_set(:@body, body)
      r.define_singleton_method(:body) { @body }
      r.define_singleton_method(:code) { code.to_s }
    end
  end
end
```

- [ ] **Step 2: Run test (expected to fail)**

```bash
bin/rails test test/services/plants/gemini_image_client_test.rb
```

Expected: NameError.

- [ ] **Step 3: Create the service**

Create `app/services/plants/gemini_image_client.rb` :

```ruby
require "net/http"
require "json"
require "base64"

module Plants
  class GeminiImageClient
    GenerationError = Class.new(StandardError)
    InvalidImageError = Class.new(GenerationError)
    RateLimitError = Class.new(GenerationError)

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent".freeze
    MAX_ATTEMPTS = 2

    def initialize(api_key: ENV.fetch("GEMINI_API_KEY"))
      @api_key = api_key
    end

    def generate(prompt:)
      attempt = 0
      begin
        attempt += 1
        response = post_request(prompt)
        case response.code.to_i
        when 200
          bytes = extract_image_bytes(JSON.parse(response.body))
          validate_image!(bytes)
          bytes
        when 503
          raise GenerationError, "Gemini 503"
        when 429
          raise RateLimitError, "Gemini 429 (rate limited)"
        else
          raise GenerationError, "Gemini #{response.code}: #{response.body[0..500]}"
        end
      rescue GenerationError => e
        if attempt < MAX_ATTEMPTS && e.message.include?("503")
          sleep 10
          retry
        end
        raise RateLimitError, "Gemini 503 after #{MAX_ATTEMPTS} attempts" if e.message.include?("503")
        raise
      end
    end

    private

    def post_request(prompt)
      uri = URI("#{BASE_URL}?key=#{@api_key}")
      payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: %w[TEXT IMAGE] }
      }
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.read_timeout = 120
      req = Net::HTTP::Post.new(uri)
      req["Content-Type"] = "application/json"
      req.body = payload.to_json
      http.request(req)
    end

    def extract_image_bytes(response_json)
      part = response_json.dig("candidates", 0, "content", "parts")&.find { |p| p["inlineData"] }
      raise GenerationError, "Gemini did not return an inline image part" unless part
      Base64.decode64(part["inlineData"]["data"])
    end

    def validate_image!(bytes)
      raise InvalidImageError, "Empty bytes returned" if bytes.blank? || bytes.bytesize < 1000
      magic = bytes[0..3].bytes
      png  = magic == [137, 80, 78, 71]
      jpeg = magic[0..1] == [255, 216]
      raise InvalidImageError, "Returned bytes are not PNG or JPEG (magic: #{magic.inspect})" unless png || jpeg
    end
  end
end
```

- [ ] **Step 4: Run test (expected to pass)**

```bash
bin/rails test test/services/plants/gemini_image_client_test.rb
```

Expected: 4 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add app/services/plants/gemini_image_client.rb test/services/plants/gemini_image_client_test.rb
git commit -m "Plants::GeminiImageClient: Net::HTTP-based Gemini Imagen client with retry"
```

---

## Task 8: `IllustrationGenerationJob`

**Files:**
- Create: `app/jobs/illustration_generation_job.rb`
- Create: `test/jobs/illustration_generation_job_test.rb`

- [ ] **Step 1: Write the failing test**

Create `test/jobs/illustration_generation_job_test.rb` :

```ruby
require "test_helper"

class IllustrationGenerationJobTest < ActiveSupport::TestCase
  PNG_HEADER = "\x89PNG\r\n\x1a\n".force_encoding("ASCII-8BIT")

  setup do
    Plant::IllustrationJob.delete_all
    @member = Member.first || Member.create!(first_name: "T", last_name: "U", email: "tu@test.local", password: "x12345678", is_admin: true)
    @genus = Plant::Genus.find_or_create_by!(latin_name: "Testus") { |g| g.plant_type = "tree" }
    @species = Plant::Species.create!(latin_name: "Testus testus", plant_type: "tree", genus: @genus)
    @job = Plant::IllustrationJob.create!(
      species: @species, triggered_by: @member, kind: "initial", triggered_at: Time.current
    )
  end

  test "perform sets status running, calls services, attaches image, sets completed" do
    Plants::IllustrationPromptComposer.any_instance.stubs(:compose).returns("English prompt for Gemini")
    Plants::GeminiImageClient.any_instance.stubs(:generate).returns(PNG_HEADER + "x" * 2000)
    Turbo::StreamsChannel.stubs(:broadcast_replace_to)

    IllustrationGenerationJob.new.perform(@job.id)

    @job.reload
    assert_equal "completed", @job.status
    assert @job.species.silhouette_illustration.attached?
    assert_match(/English prompt/, @job.prompt_used)
    assert_equal "1.2", @job.vds_version
    assert @job.byte_size > 1000
  end

  test "perform marks job failed on exception and re-raises" do
    Plants::IllustrationPromptComposer.any_instance.stubs(:compose).raises(StandardError, "boom")
    Turbo::StreamsChannel.stubs(:broadcast_replace_to)

    assert_raises(StandardError) { IllustrationGenerationJob.new.perform(@job.id) }
    @job.reload
    assert_equal "failed", @job.status
    assert_equal "boom", @job.error_message
    assert_equal "StandardError", @job.error_class
  end

  test "perform is idempotent (skips completed jobs)" do
    @job.update!(status: "completed", finished_at: Time.current)
    Plants::IllustrationPromptComposer.any_instance.expects(:compose).never

    IllustrationGenerationJob.new.perform(@job.id)
  end
end
```

- [ ] **Step 2: Run test (expected to fail)**

```bash
bin/rails test test/jobs/illustration_generation_job_test.rb
```

Expected: NameError.

- [ ] **Step 3: Create the job**

Create `app/jobs/illustration_generation_job.rb` :

```ruby
class IllustrationGenerationJob < ApplicationJob
  queue_as :illustrations

  retry_on Plants::GeminiImageClient::RateLimitError, wait: 10.seconds, attempts: 1
  discard_on ActiveRecord::RecordNotFound

  def perform(illustration_job_id)
    job = Plant::IllustrationJob.find(illustration_job_id)
    return if job.completed? || job.running?

    job.update!(status: "running", started_at: Time.current)

    prompt = Plants::IllustrationPromptComposer.new(
      species: job.species,
      style: :a2s,
      feedback: job.feedback
    ).compose
    job.update!(prompt_used: prompt, vds_version: Plants::Vds.version)

    bytes = Plants::GeminiImageClient.new.generate(prompt: prompt)

    species = job.species
    species.silhouette_illustration.purge_later if species.silhouette_illustration.attached?
    content_type = bytes[0..1].bytes == [255, 216] ? "image/jpeg" : "image/png"
    species.silhouette_illustration.attach(
      io: StringIO.new(bytes),
      filename: "#{species.slug}-illustration.#{content_type == 'image/jpeg' ? 'jpg' : 'png'}",
      content_type: content_type
    )

    job.update!(
      status: "completed",
      finished_at: Time.current,
      byte_size: bytes.bytesize
    )
    broadcast(job)
  rescue => e
    job.update!(
      status: "failed",
      finished_at: Time.current,
      error_message: e.message,
      error_class: e.class.name,
      gemini_attempts: job.gemini_attempts + 1
    )
    broadcast(job)
    raise
  end

  private

  def broadcast(job)
    Turbo::StreamsChannel.broadcast_replace_to(
      "illustration_jobs",
      target: ActionView::RecordIdentifier.dom_id(job),
      partial: "plants/illustration_jobs/job_row",
      locals: { job: job }
    )
  end
end
```

- [ ] **Step 4: Create the partial used by broadcast**

Create `app/views/plants/illustration_jobs/_job_row.html.erb` :

```erb
<div id="<%= dom_id(job) %>" class="job-row job-row-<%= job.status %>">
  <span class="status-icon"><%= job.status %></span>
  <span class="species-name"><em><%= job.species.latin_name %></em></span>
  <span class="status-label">
    <% case job.status %>
    <% when 'pending' %>En queue
    <% when 'running' %>Génération…
    <% when 'completed' %>✓ Terminé
    <% when 'failed' %>✗ Erreur
    <% end %>
  </span>
  <% if job.failed? %>
    <span class="error-text"><%= job.error_message&.truncate(80) %></span>
  <% end %>
</div>
```

- [ ] **Step 5: Run test (expected to pass)**

```bash
bin/rails test test/jobs/illustration_generation_job_test.rb
```

Expected: 3 tests, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add app/jobs/illustration_generation_job.rb app/views/plants/illustration_jobs test/jobs/illustration_generation_job_test.rb
git commit -m "IllustrationGenerationJob: orchestrates compose+gemini+attach with broadcast"
```

---

# SPRINT 2 — API endpoints

## Task 9: `POST /api/v1/plants/illustrations/generate`

**Files:**
- Modify: `config/routes.rb` (add 6 routes for illustrations)
- Modify: `app/controllers/api/v1/plants_controller.rb` (add `generate_illustrations` action)
- Create: `test/integration/illustrations_api_test.rb`

- [ ] **Step 1: Add routes**

Edit `config/routes.rb`. In the `api/v1` namespace block, after the existing `plants/*` routes, add :

```ruby
      # Illustrations management
      post "plants/illustrations/generate",       to: "plants#generate_illustrations"
      get  "plants/illustrations",                to: "plants#list_illustrations"
      get  "plants/illustrations/stats",          to: "plants#illustration_stats"
      get  "plants/illustrations/jobs",           to: "plants#list_illustration_jobs"
      get  "plants/illustrations/jobs/:id",       to: "plants#show_illustration_job"
      post "plants/illustrations/jobs/:id/retry", to: "plants#retry_illustration_job"
```

- [ ] **Step 2: Write the failing test**

Create `test/integration/illustrations_api_test.rb` :

```ruby
require "test_helper"

class IllustrationsApiTest < ActionDispatch::IntegrationTest
  setup do
    Plant::IllustrationJob.delete_all
    @genus = Plant::Genus.find_or_create_by!(latin_name: "Testus") { |g| g.plant_type = "tree" }
    @s1 = Plant::Species.create!(latin_name: "Testus a", plant_type: "tree", genus: @genus)
    @s2 = Plant::Species.create!(latin_name: "Testus b", plant_type: "tree", genus: @genus)
  end

  test "POST /illustrations/generate creates jobs and enqueues" do
    assert_enqueued_jobs 2, only: IllustrationGenerationJob do
      post "/api/v1/plants/illustrations/generate",
           params: { species_ids: [@s1.id, @s2.id] }, as: :json
    end

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 2, body["created_jobs"]
    assert_equal 2, body["jobs"].size
    assert_equal "pending", body["jobs"][0]["status"]
  end

  test "POST /illustrations/generate skips species with running jobs" do
    Plant::IllustrationJob.create!(
      species: @s1, triggered_by: Member.first || create_admin_member,
      kind: "initial", status: "running", triggered_at: Time.current, started_at: Time.current
    )

    assert_enqueued_jobs 1, only: IllustrationGenerationJob do
      post "/api/v1/plants/illustrations/generate",
           params: { species_ids: [@s1.id, @s2.id] }, as: :json
    end

    body = JSON.parse(response.body)
    assert_equal 1, body["created_jobs"]
    assert_includes body["skipped"], @s1.id
  end

  test "POST /illustrations/generate accepts feedback" do
    post "/api/v1/plants/illustrations/generate",
         params: { species_ids: [@s1.id], feedback: "less dense" }, as: :json
    assert_response :success
    job = Plant::IllustrationJob.last
    assert_equal "less dense", job.feedback
  end

  test "POST /illustrations/generate refuses if queue saturated (>100 pending+running)" do
    member = Member.first || create_admin_member
    101.times do |i|
      Plant::IllustrationJob.create!(
        species: @s1, triggered_by: member, kind: "initial",
        status: "pending", triggered_at: i.seconds.ago
      )
    end

    post "/api/v1/plants/illustrations/generate",
         params: { species_ids: [@s2.id] }, as: :json
    assert_response :unprocessable_entity
    assert_match(/Queue saturée/, JSON.parse(response.body)["error"])
  end

  private

  def create_admin_member
    Member.create!(first_name: "T", last_name: "U", email: "tu@test.local", password: "x12345678", is_admin: true)
  end
end
```

- [ ] **Step 3: Run test (expected to fail)**

```bash
bin/rails test test/integration/illustrations_api_test.rb
```

Expected: NoMethodError or 404 (action doesn't exist yet).

- [ ] **Step 4: Add the action**

Edit `app/controllers/api/v1/plants_controller.rb`. Add this method (place it after the existing `attach_silhouette_illustration` action):

```ruby
      def generate_illustrations
        species_ids = Array(params[:species_ids]).map(&:to_i).reject(&:zero?)
        return render(json: { error: "species_ids requis" }, status: :unprocessable_entity) if species_ids.empty?

        # Queue saturation check
        in_flight_count = Plant::IllustrationJob.where(status: %w[pending running]).count
        if in_flight_count >= 100
          return render json: { error: "Queue saturée (100+ jobs en cours), attendre la fin" }, status: :unprocessable_entity
        end

        feedback = params[:feedback].presence
        kind_param = params[:kind].presence

        species = Plant::Species.where(id: species_ids).index_by(&:id)
        skipped = []
        created_jobs = []

        species_ids.each do |sid|
          sp = species[sid]
          next unless sp

          # Skip if already running or pending
          if Plant::IllustrationJob.where(species_id: sid, status: %w[pending running]).exists?
            skipped << sid
            next
          end

          inferred_kind = sp.silhouette_illustration.attached? ? "regeneration" : "initial"
          job = Plant::IllustrationJob.create!(
            species: sp,
            triggered_by: current_member,
            kind: kind_param || inferred_kind,
            feedback: feedback,
            triggered_at: Time.current,
            status: "pending"
          )
          created_jobs << job
          IllustrationGenerationJob.perform_later(job.id)
        end

        render json: {
          created_jobs: created_jobs.size,
          skipped: skipped,
          estimated_duration_seconds: (created_jobs.size / 3.0 * 30).round,
          jobs: created_jobs.map { |j| { id: j.id, species_id: j.species_id, status: j.status } }
        }
      end
```

- [ ] **Step 5: Add admin guard via shared helper**

Same file, in the private section, add :

```ruby
      def require_admin!
        return if current_member&.is_admin?
        render json: { error: "Admin uniquement" }, status: :forbidden
      end
```

And add `before_action :require_admin!, only: %i[generate_illustrations retry_illustration_job show_illustration_job]` near the top of the controller.

- [ ] **Step 6: Run test (expected to pass)**

```bash
bin/rails test test/integration/illustrations_api_test.rb
```

Expected: 4 tests, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add config/routes.rb app/controllers/api/v1/plants_controller.rb test/integration/illustrations_api_test.rb
git commit -m "API: POST /illustrations/generate with skip-running and queue saturation guard"
```

---

## Task 10: `GET /api/v1/plants/illustrations/stats`

**Files:**
- Modify: `app/controllers/api/v1/plants_controller.rb` (add `illustration_stats` action)
- Modify: `test/integration/illustrations_api_test.rb` (add tests)

- [ ] **Step 1: Add tests**

Append to `test/integration/illustrations_api_test.rb` :

```ruby
  test "GET /illustrations/stats returns counts and percent" do
    @s1.silhouette_illustration.attach(io: StringIO.new("\x89PNG\r\n\x1a\n" + "x" * 2000), filename: "f.png", content_type: "image/png")

    get "/api/v1/plants/illustrations/stats", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body["total"] >= 2
    assert body["withIllustration"] >= 1
    assert body["completionPct"].is_a?(Numeric)
  end
```

- [ ] **Step 2: Run test (expected to fail)**

```bash
bin/rails test test/integration/illustrations_api_test.rb -n "/stats/"
```

- [ ] **Step 3: Add action**

Add to `app/controllers/api/v1/plants_controller.rb` :

```ruby
      def illustration_stats
        stats = Rails.cache.fetch("plant_illustration_stats", expires_in: 30.seconds) do
          total = Plant::Species.count
          with_illustration = Plant::Species.with_illustration.count
          {
            total: total,
            withIllustration: with_illustration,
            withoutIllustration: total - with_illustration,
            running: Plant::IllustrationJob.running.count,
            failedRecently: Plant::IllustrationJob.failed.where("triggered_at > ?", 24.hours.ago).count,
            completionPct: total > 0 ? (with_illustration * 100.0 / total).round(1) : 0.0
          }
        end
        render json: stats
      end
```

- [ ] **Step 4: Run test (expected to pass)**

```bash
bin/rails test test/integration/illustrations_api_test.rb -n "/stats/"
```

- [ ] **Step 5: Commit**

```bash
git add app/controllers/api/v1/plants_controller.rb test/integration/illustrations_api_test.rb
git commit -m "API: GET /illustrations/stats with 30s cache"
```

---

## Task 11: `GET /api/v1/plants/illustrations` (gallery list)

**Files:**
- Modify: `app/controllers/api/v1/plants_controller.rb` (add `list_illustrations` + helper)
- Modify: `test/integration/illustrations_api_test.rb`

- [ ] **Step 1: Add tests**

Append :

```ruby
  test "GET /illustrations returns paginated species with thumbnails" do
    @s1.silhouette_illustration.attach(io: StringIO.new("\x89PNG\r\n\x1a\n" + "x" * 2000), filename: "f.png", content_type: "image/png")

    get "/api/v1/plants/illustrations", params: { filter: "with", per_page: 10 }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body["items"].is_a?(Array)
    assert body["items"].any? { |i| i["latinName"] == @s1.latin_name }
    item = body["items"].find { |i| i["latinName"] == @s1.latin_name }
    assert item["thumbnailUrl"].present?
    assert item["fullUrl"].present?
  end

  test "GET /illustrations filter=without excludes attached species" do
    @s1.silhouette_illustration.attach(io: StringIO.new("\x89PNG\r\n\x1a\n" + "x" * 2000), filename: "f.png", content_type: "image/png")

    get "/api/v1/plants/illustrations", params: { filter: "without" }, as: :json
    body = JSON.parse(response.body)
    latin_names = body["items"].map { |i| i["latinName"] }
    refute_includes latin_names, @s1.latin_name
    assert_includes latin_names, @s2.latin_name
  end
```

- [ ] **Step 2: Run tests (expected to fail)**

```bash
bin/rails test test/integration/illustrations_api_test.rb -n "/GET .illustrations /"
```

- [ ] **Step 3: Add action**

Add to controller :

```ruby
      def list_illustrations
        per_page = [params[:per_page]&.to_i || 24, 100].min
        page = [params[:page]&.to_i || 1, 1].max

        scope = Plant::Species.includes(:genus, silhouette_illustration_attachment: :blob)
        scope = case params[:filter]
                when "with"    then scope.with_illustration
                when "without" then scope.without_illustration
                else                scope
                end
        scope = scope.where(genus_id: params[:genus_id])     if params[:genus_id].present?
        scope = scope.where(strate: params[:strate])         if params[:strate].present?
        scope = scope.where(plant_type: params[:plant_type]) if params[:plant_type].present?

        case params[:sort]
        when "recently_generated"
          scope = scope.joins(:silhouette_illustration_attachment).order("active_storage_attachments.created_at DESC")
        else
          scope = scope.order(:latin_name)
        end

        total_count = scope.count
        items = scope.offset((page - 1) * per_page).limit(per_page).map { |sp| serialize_illustration_item(sp) }

        render json: {
          items: items,
          page: page,
          totalPages: (total_count.to_f / per_page).ceil,
          totalCount: total_count
        }
      end
```

In the private section, add the serializer :

```ruby
      def serialize_illustration_item(species)
        attachment = species.silhouette_illustration if species.silhouette_illustration.attached?
        last_job = species.illustration_jobs.order(triggered_at: :desc).first
        {
          id: species.id.to_s,
          latinName: species.latin_name,
          commonName: species.common_names_fr,
          thumbnailUrl: attachment ? rails_representation_url(attachment.variant(resize_to_limit: [200, 280]).processed) : nil,
          fullUrl: attachment ? rails_blob_url(attachment) : nil,
          lastJobStatus: last_job&.status,
          lastJobAt: last_job&.triggered_at&.iso8601,
          totalJobs: species.illustration_jobs.count
        }
      end
```

- [ ] **Step 4: Run tests (expected to pass)**

```bash
bin/rails test test/integration/illustrations_api_test.rb
```

- [ ] **Step 5: Commit**

```bash
git add app/controllers/api/v1/plants_controller.rb test/integration/illustrations_api_test.rb
git commit -m "API: GET /illustrations with filter/sort/pagination + variant thumbnails"
```

---

## Task 12: `GET /illustrations/jobs` and `GET /illustrations/jobs/:id`

**Files:**
- Modify: `app/controllers/api/v1/plants_controller.rb` (add `list_illustration_jobs`, `show_illustration_job`)
- Modify: `test/integration/illustrations_api_test.rb`

- [ ] **Step 1: Add tests**

Append :

```ruby
  test "GET /illustrations/jobs returns recent jobs" do
    member = Member.first || create_admin_member
    Plant::IllustrationJob.create!(species: @s1, triggered_by: member, kind: "initial", status: "running", triggered_at: 5.minutes.ago, started_at: 5.minutes.ago)
    Plant::IllustrationJob.create!(species: @s2, triggered_by: member, kind: "initial", status: "completed", triggered_at: 1.hour.ago, finished_at: 50.minutes.ago)

    get "/api/v1/plants/illustrations/jobs", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 2, body["jobs"].size
    statuses = body["jobs"].map { |j| j["status"] }
    assert_includes statuses, "running"
    assert_includes statuses, "completed"
  end
```

- [ ] **Step 2: Run test (expected to fail)**

- [ ] **Step 3: Add actions**

```ruby
      def list_illustration_jobs
        limit = [params[:limit]&.to_i || 50, 200].min
        scope = Plant::IllustrationJob.includes(:species).recent
        if params[:status].present?
          statuses = params[:status].split(",").map(&:strip)
          scope = scope.where(status: statuses)
        end
        jobs = scope.limit(limit).map { |j| serialize_illustration_job(j) }
        render json: { jobs: jobs }
      end

      def show_illustration_job
        job = Plant::IllustrationJob.includes(:species, :triggered_by).find(params[:id])
        render json: serialize_illustration_job(job, full: true)
      end
```

In private :

```ruby
      def serialize_illustration_job(job, full: false)
        base = {
          id: job.id,
          speciesId: job.species_id,
          speciesLatinName: job.species.latin_name,
          status: job.status,
          kind: job.kind,
          triggeredAt: job.triggered_at&.iso8601,
          startedAt: job.started_at&.iso8601,
          finishedAt: job.finished_at&.iso8601,
          errorMessage: job.error_message,
          feedback: job.feedback
        }
        base.merge!(promptUsed: job.prompt_used, vdsVersion: job.vds_version, geminiAttempts: job.gemini_attempts) if full
        base
      end
```

- [ ] **Step 4: Run test, commit**

```bash
bin/rails test test/integration/illustrations_api_test.rb
git add app/controllers/api/v1/plants_controller.rb test/integration/illustrations_api_test.rb
git commit -m "API: GET /illustrations/jobs and /illustrations/jobs/:id"
```

---

## Task 13: `POST /api/v1/plants/illustrations/jobs/:id/retry`

**Files:**
- Modify: `app/controllers/api/v1/plants_controller.rb`
- Modify: `test/integration/illustrations_api_test.rb`

- [ ] **Step 1: Add test**

```ruby
  test "POST /illustrations/jobs/:id/retry creates new job for same species" do
    member = Member.first || create_admin_member
    failed_job = Plant::IllustrationJob.create!(
      species: @s1, triggered_by: member, kind: "regeneration",
      status: "failed", feedback: "less dense",
      triggered_at: 1.hour.ago, finished_at: 30.minutes.ago,
      error_message: "Gemini timeout", error_class: "Plants::GeminiImageClient::GenerationError"
    )

    assert_enqueued_jobs 1, only: IllustrationGenerationJob do
      post "/api/v1/plants/illustrations/jobs/#{failed_job.id}/retry", as: :json
    end

    assert_response :success
    new_job = Plant::IllustrationJob.recent.first
    assert_equal @s1.id, new_job.species_id
    assert_equal "regeneration", new_job.kind
    assert_equal "less dense", new_job.feedback
    assert_equal "pending", new_job.status

    failed_job.reload
    assert_equal "failed", failed_job.status # original is preserved
  end
```

- [ ] **Step 2: Run test (fails)**

- [ ] **Step 3: Add action**

```ruby
      def retry_illustration_job
        original = Plant::IllustrationJob.find(params[:id])
        new_job = Plant::IllustrationJob.create!(
          species: original.species,
          triggered_by: current_member,
          kind: "regeneration",
          feedback: original.feedback,
          status: "pending",
          triggered_at: Time.current
        )
        IllustrationGenerationJob.perform_later(new_job.id)
        render json: serialize_illustration_job(new_job)
      end
```

- [ ] **Step 4: Run, commit**

```bash
bin/rails test test/integration/illustrations_api_test.rb
git add app/controllers/api/v1/plants_controller.rb test/integration/illustrations_api_test.rb
git commit -m "API: POST /illustrations/jobs/:id/retry creates new job inheriting feedback"
```

---

# SPRINT 3 — Page atelier

> **IMPORTANT for Sprint 3 and Sprint 4 tasks** : invoke the `frontend-design` skill before writing any component. Reference: `Skill('frontend-design')`. Apply its guidelines on layout hierarchy, color usage, typography, and avoiding generic AI aesthetics. Where Tailwind classes are shown below, treat them as a starting point — refine per the skill's guidelines.

## Task 14: Inertia route + page skeleton + controller

**Files:**
- Modify: `config/routes.rb`
- Create: `app/controllers/plant_illustrations_controller.rb`
- Create: `app/frontend/pages/Plants/Illustrations.tsx`

- [ ] **Step 1: Invoke frontend-design skill**

```
Skill('frontend-design')
```

Apply guidelines for the page layout that follows.

- [ ] **Step 2: Add route**

Edit `config/routes.rb`. Add (in the main routes, near other plant routes) :

```ruby
get "plants/illustrations", to: "plant_illustrations#index"
```

- [ ] **Step 3: Create controller**

Create `app/controllers/plant_illustrations_controller.rb` :

```ruby
class PlantIllustrationsController < ApplicationController
  before_action :require_authentication

  def index
    render inertia: "Plants/Illustrations", props: {
      isAdmin: current_member&.is_admin? || false
    }
  end
end
```

- [ ] **Step 4: Create page skeleton**

Create `app/frontend/pages/Plants/Illustrations.tsx` :

```tsx
import { useEffect, useState } from 'react'
import { useShellNav } from '@/components/shell/ShellContext'
import { apiRequest } from '@/lib/api'

interface Stats {
  total: number
  withIllustration: number
  withoutIllustration: number
  running: number
  failedRecently: number
  completionPct: number
}

interface Props {
  isAdmin: boolean
}

export default function PlantsIllustrations({ isAdmin }: Props) {
  const [stats, setStats] = useState<Stats | null>(null)

  useShellNav({
    sections: [
      { id: 'list', label: 'Catalogue' },
      { id: 'illustrations', label: 'Atelier illustrations' }
    ],
    activeSection: 'illustrations'
  })

  useEffect(() => {
    apiRequest('/api/v1/plants/illustrations/stats').then(setStats)
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-serif mb-2">Atelier d'illustrations</h1>
      <p className="text-stone-600 text-sm mb-6">
        Pilotage du rattrapage des silhouettes pour les fiches imprimables.
      </p>

      {/* Stats banner — Task 15 */}
      {/* Filter bar — Task 16 */}
      {/* Gallery — Task 17 */}
      {/* Queue panel — Task 18 */}

      {stats && (
        <div className="text-sm text-stone-500">
          {stats.withIllustration} / {stats.total} illustrées
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Test in browser**

```bash
bin/dev   # if not running
```

Then open `http://127.0.0.1:3000/plants/illustrations` (logged in). Expected: page loads with title and stats line "X / Y illustrées".

- [ ] **Step 6: Commit**

```bash
git add config/routes.rb app/controllers/plant_illustrations_controller.rb app/frontend/pages/Plants/Illustrations.tsx
git commit -m "Plants/Illustrations: Inertia page skeleton at /plants/illustrations"
```

---

## Task 15: `IllustrationStatsTile` component

**Files:**
- Create: `app/frontend/plant-database/components/IllustrationStatsTile.tsx`
- Modify: `app/frontend/pages/Plants/Illustrations.tsx`

- [ ] **Step 1: Invoke frontend-design skill** (`Skill('frontend-design')`)

- [ ] **Step 2: Create component**

Create `app/frontend/plant-database/components/IllustrationStatsTile.tsx` :

```tsx
interface Stats {
  total: number
  withIllustration: number
  withoutIllustration: number
  running: number
  failedRecently: number
  completionPct: number
}

interface Props {
  stats: Stats
  onLaunchBulk?: () => void
  isAdmin: boolean
}

export function IllustrationStatsTile({ stats, onLaunchBulk, isAdmin }: Props) {
  return (
    <section className="mb-8">
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Tile label="Illustrées" value={stats.withIllustration} accent="positive" />
        <Tile label="En cours" value={stats.running} accent="info" pulse={stats.running > 0} />
        <Tile label="Restantes" value={stats.withoutIllustration} accent="warning" />
      </div>
      <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#afbd00] transition-all duration-500"
          style={{ width: `${stats.completionPct}%` }}
        />
      </div>
      <p className="text-xs text-stone-500 mt-2">
        {stats.completionPct}% du catalogue couvert
      </p>
      {isAdmin && stats.withoutIllustration > 0 && (
        <button
          onClick={onLaunchBulk}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#5B5781] text-white rounded-lg font-medium hover:bg-[#4A4670] transition"
        >
          ⚡ Rattraper {stats.withoutIllustration} manquantes
        </button>
      )}
    </section>
  )
}

function Tile({
  label, value, accent, pulse
}: { label: string; value: number; accent: 'positive' | 'info' | 'warning'; pulse?: boolean }) {
  const accentClass = {
    positive: 'border-[#afbd00] text-[#5a7028]',
    info: 'border-[#234766] text-[#234766]',
    warning: 'border-[#ef9b0d] text-[#8a5a08]'
  }[accent]
  return (
    <div className={`bg-white border-l-4 ${accentClass} rounded-lg p-4 shadow-sm ${pulse ? 'animate-pulse' : ''}`}>
      <div className="text-2xl font-bold">{value.toLocaleString('fr-FR')}</div>
      <div className="text-xs uppercase tracking-wide text-stone-500 mt-1">{label}</div>
    </div>
  )
}
```

- [ ] **Step 3: Wire it into the page**

Edit `app/frontend/pages/Plants/Illustrations.tsx`. Replace the `<div className="text-sm text-stone-500">...</div>` block with :

```tsx
{stats && <IllustrationStatsTile stats={stats} isAdmin={isAdmin} />}
```

And add the import at the top :

```tsx
import { IllustrationStatsTile } from '@/plant-database/components/IllustrationStatsTile'
```

- [ ] **Step 4: Manual test in browser**

Open `/plants/illustrations`. Expected: 3 stat tiles + progress bar visible. If admin, "Rattraper N manquantes" button visible (no-op for now, wired in Task 19).

- [ ] **Step 5: Commit**

```bash
git add app/frontend/plant-database/components/IllustrationStatsTile.tsx app/frontend/pages/Plants/Illustrations.tsx
git commit -m "IllustrationStatsTile: 3-tile banner + progress + bulk trigger"
```

---

## Task 16: `IllustrationFilterBar` component

**Files:**
- Create: `app/frontend/plant-database/components/IllustrationFilterBar.tsx`
- Modify: `app/frontend/pages/Plants/Illustrations.tsx`

- [ ] **Step 1: Invoke frontend-design skill**

- [ ] **Step 2: Create component**

Create `app/frontend/plant-database/components/IllustrationFilterBar.tsx` :

```tsx
type Filter = 'all' | 'with' | 'without' | 'running' | 'failed'

interface Props {
  filter: Filter
  onFilterChange: (f: Filter) => void
  showCardContext: boolean
  onShowCardContextChange: (b: boolean) => void
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'with', label: 'Avec illustration' },
  { value: 'without', label: 'Sans illustration' },
  { value: 'running', label: 'En cours' },
  { value: 'failed', label: 'Erreurs' }
]

export function IllustrationFilterBar({ filter, onFilterChange, showCardContext, onShowCardContextChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === f.value
                ? 'bg-[#afbd00] text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <label className="ml-auto flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
        <input
          type="checkbox"
          checked={showCardContext}
          onChange={e => onShowCardContextChange(e.target.checked)}
          className="rounded"
        />
        Voir en contexte fiche
      </label>
    </div>
  )
}
```

- [ ] **Step 3: Wire into page with state**

Edit `app/frontend/pages/Plants/Illustrations.tsx`. Add state and render :

```tsx
const [filter, setFilter] = useState<'all' | 'with' | 'without' | 'running' | 'failed'>('without')
const [showCardContext, setShowCardContext] = useState(false)
```

```tsx
<IllustrationFilterBar
  filter={filter}
  onFilterChange={setFilter}
  showCardContext={showCardContext}
  onShowCardContextChange={setShowCardContext}
/>
```

- [ ] **Step 4: Manual test**

Open page, click filters — visual state changes. Toggle should persist.

- [ ] **Step 5: Commit**

```bash
git add app/frontend/plant-database/components/IllustrationFilterBar.tsx app/frontend/pages/Plants/Illustrations.tsx
git commit -m "IllustrationFilterBar: pill filters + card-context toggle"
```

---

## Task 17: `IllustrationGalleryGrid` component

**Files:**
- Create: `app/frontend/plant-database/components/IllustrationGalleryGrid.tsx`
- Modify: `app/frontend/pages/Plants/Illustrations.tsx`

- [ ] **Step 1: Invoke frontend-design skill**

- [ ] **Step 2: Create component**

Create `app/frontend/plant-database/components/IllustrationGalleryGrid.tsx` :

```tsx
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'

interface Item {
  id: string
  latinName: string
  commonName: string | null
  thumbnailUrl: string | null
  fullUrl: string | null
  lastJobStatus: string | null
  totalJobs: number
}

interface Props {
  filter: string
  onSpeciesClick?: (id: string) => void
}

export function IllustrationGalleryGrid({ filter, onSpeciesClick }: Props) {
  const [items, setItems] = useState<Item[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    apiRequest(`/api/v1/plants/illustrations?filter=${filter}&page=${page}&per_page=24`)
      .then(d => {
        setItems(d.items)
        setTotalPages(d.totalPages)
      })
      .finally(() => setLoading(false))
  }, [filter, page])

  if (loading && items.length === 0) {
    return <div className="text-sm text-stone-500 py-8 text-center">Chargement…</div>
  }

  return (
    <section>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onSpeciesClick?.(item.id)}
            className="group aspect-[3/4] bg-white border border-stone-200 rounded-md overflow-hidden hover:shadow-md hover:border-[#afbd00] transition"
            title={item.latinName}
          >
            {item.thumbnailUrl ? (
              <img src={item.thumbnailUrl} alt={item.latinName} className="w-full h-full object-contain" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-stone-50 flex items-center justify-center text-stone-300 text-xs">
                Sans illustration
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-900/80 to-transparent text-white text-xs italic px-2 py-1 opacity-0 group-hover:opacity-100 transition">
              {item.latinName}
            </div>
          </button>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-30"
          >‹</button>
          <span>{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-30"
          >›</button>
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Wire into page**

In `Illustrations.tsx`, after the filter bar :

```tsx
<IllustrationGalleryGrid filter={filter} />
```

(Card-context view via `showCardContext` toggle is left for future iteration; gallery is the default.)

- [ ] **Step 4: Manual test**

Page should show grid of thumbnails. Click filter "Sans illustration" → grid updates with placeholder cells.

- [ ] **Step 5: Commit**

```bash
git add app/frontend/plant-database/components/IllustrationGalleryGrid.tsx app/frontend/pages/Plants/Illustrations.tsx
git commit -m "IllustrationGalleryGrid: paginated thumbnail gallery with hover label"
```

---

## Task 18: `IllustrationQueuePanel` + Turbo Streams

**Files:**
- Create: `app/frontend/plant-database/components/IllustrationQueuePanel.tsx`
- Modify: `app/frontend/pages/Plants/Illustrations.tsx`

> Note : pour le MVP nous utilisons polling 5s côté React au lieu de Turbo Streams (intégration Turbo + React via Inertia n'est pas trivial). Le `Turbo::StreamsChannel.broadcast_replace_to` côté backend reste utilisable pour d'autres consumers (e.g. les `_recto` en ERB), mais le panel React poll.

- [ ] **Step 1: Invoke frontend-design skill**

- [ ] **Step 2: Create component**

Create `app/frontend/plant-database/components/IllustrationQueuePanel.tsx` :

```tsx
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'

interface Job {
  id: number
  speciesId: number
  speciesLatinName: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  kind: string
  triggeredAt: string
  startedAt: string | null
  finishedAt: string | null
  errorMessage: string | null
}

interface Props {
  isAdmin: boolean
  onRetry?: (jobId: number) => void
}

export function IllustrationQueuePanel({ isAdmin, onRetry }: Props) {
  const [jobs, setJobs] = useState<Job[]>([])

  useEffect(() => {
    let active = true
    const fetchJobs = () =>
      apiRequest('/api/v1/plants/illustrations/jobs?limit=15').then(d => {
        if (active) setJobs(d.jobs)
      })
    fetchJobs()
    const id = setInterval(fetchJobs, 5000)
    return () => { active = false; clearInterval(id) }
  }, [])

  if (jobs.length === 0) {
    return (
      <aside className="border border-stone-200 rounded-lg p-4 bg-white">
        <h3 className="text-xs uppercase tracking-wide text-stone-500 mb-3 font-semibold">Queue jobs</h3>
        <p className="text-xs text-stone-400 italic">Aucun job récent</p>
      </aside>
    )
  }

  return (
    <aside className="border border-stone-200 rounded-lg p-4 bg-white max-h-[600px] overflow-auto">
      <h3 className="text-xs uppercase tracking-wide text-stone-500 mb-3 font-semibold">Queue jobs</h3>
      <ul className="space-y-2">
        {jobs.map(job => (
          <li key={job.id} className="flex items-start gap-2 text-xs">
            <StatusDot status={job.status} />
            <div className="flex-1 min-w-0">
              <div className="italic truncate">{job.speciesLatinName}</div>
              <div className="text-stone-400 text-[10px]">
                {job.status === 'running' && 'génération…'}
                {job.status === 'pending' && 'en queue'}
                {job.status === 'completed' && relativeTime(job.finishedAt)}
                {job.status === 'failed' && (
                  <>
                    <span className="text-red-600">{job.errorMessage?.slice(0, 60)}</span>
                    {isAdmin && onRetry && (
                      <button onClick={() => onRetry(job.id)} className="ml-2 text-[#5B5781] underline">
                        Retry
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}

function StatusDot({ status }: { status: string }) {
  const cls = {
    pending: 'bg-stone-300',
    running: 'bg-[#ef9b0d] animate-pulse',
    completed: 'bg-[#afbd00]',
    failed: 'bg-red-500'
  }[status] || 'bg-stone-300'
  return <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${cls}`} />
}

function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000
  if (seconds < 60) return `il y a ${Math.round(seconds)}s`
  if (seconds < 3600) return `il y a ${Math.round(seconds / 60)}m`
  return `il y a ${Math.round(seconds / 3600)}h`
}
```

- [ ] **Step 3: Wire into page (2-column layout)**

Edit `Illustrations.tsx` main return :

```tsx
return (
  <div className="max-w-7xl mx-auto px-6 py-8">
    <h1 className="text-3xl font-serif mb-2">Atelier d'illustrations</h1>
    <p className="text-stone-600 text-sm mb-6">…</p>

    {stats && <IllustrationStatsTile stats={stats} isAdmin={isAdmin} />}

    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      <div>
        <IllustrationFilterBar filter={filter} onFilterChange={setFilter} showCardContext={showCardContext} onShowCardContextChange={setShowCardContext} />
        <IllustrationGalleryGrid filter={filter} />
      </div>
      <IllustrationQueuePanel isAdmin={isAdmin} onRetry={handleRetry} />
    </div>
  </div>
)
```

Add `handleRetry` :

```tsx
const handleRetry = async (jobId: number) => {
  await apiRequest(`/api/v1/plants/illustrations/jobs/${jobId}/retry`, { method: 'POST' })
}
```

- [ ] **Step 4: Manual test**

Page shows queue panel on right. Trigger a generation manually (Rails console or curl) → panel updates within 5s.

- [ ] **Step 5: Commit**

```bash
git add app/frontend/plant-database/components/IllustrationQueuePanel.tsx app/frontend/pages/Plants/Illustrations.tsx
git commit -m "IllustrationQueuePanel: 5s polling queue with retry button (admin)"
```

---

## Task 19: "Rattraper N manquantes" + ConfirmBulkGenerationModal

**Files:**
- Create: `app/frontend/plant-database/components/ConfirmBulkGenerationModal.tsx`
- Modify: `app/frontend/pages/Plants/Illustrations.tsx`

- [ ] **Step 1: Invoke frontend-design skill**

- [ ] **Step 2: Create modal**

Create `app/frontend/plant-database/components/ConfirmBulkGenerationModal.tsx` :

```tsx
interface Props {
  open: boolean
  count: number
  estimatedSeconds: number
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmBulkGenerationModal({ open, count, estimatedSeconds, onConfirm, onCancel }: Props) {
  if (!open) return null
  const hours = Math.round(estimatedSeconds / 3600 * 10) / 10
  const duration = hours >= 1 ? `~${hours}h` : `~${Math.round(estimatedSeconds / 60)} min`

  return (
    <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-serif mb-3">Lancer {count} génération{count > 1 ? 's' : ''} ?</h2>
        <p className="text-sm text-stone-600 mb-4">
          Estimation : {duration} en arrière-plan. Tu peux quitter cette page, les générations continuent.
          La queue panel à droite te montre la progression.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#5B5781] text-white rounded-lg hover:bg-[#4A4670]"
          >
            Lancer {count} génération{count > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire bulk trigger in page**

In `Illustrations.tsx`, add state + handler :

```tsx
const [confirmOpen, setConfirmOpen] = useState(false)

const handleLaunchBulk = async () => {
  if (!stats) return
  // Fetch all species_ids without illustration
  const data = await apiRequest('/api/v1/plants/illustrations?filter=without&per_page=1500')
  const ids = data.items.map((i: any) => parseInt(i.id))
  await apiRequest('/api/v1/plants/illustrations/generate', {
    method: 'POST',
    body: JSON.stringify({ species_ids: ids }),
    headers: { 'Content-Type': 'application/json' }
  })
  setConfirmOpen(false)
  // Refresh stats
  apiRequest('/api/v1/plants/illustrations/stats').then(setStats)
}
```

Then pass `onLaunchBulk={() => setConfirmOpen(true)}` to `IllustrationStatsTile`. Add the modal at the end of the page :

```tsx
{stats && (
  <ConfirmBulkGenerationModal
    open={confirmOpen}
    count={stats.withoutIllustration}
    estimatedSeconds={Math.round(stats.withoutIllustration / 3 * 30)}
    onConfirm={handleLaunchBulk}
    onCancel={() => setConfirmOpen(false)}
  />
)}
```

- [ ] **Step 4: Manual test**

Click "Rattraper N manquantes" → modal opens. Click "Lancer" → modal closes, queue starts populating with new jobs within 5s.

- [ ] **Step 5: Commit**

```bash
git add app/frontend/plant-database/components/ConfirmBulkGenerationModal.tsx app/frontend/pages/Plants/Illustrations.tsx
git commit -m "Bulk catch-up: confirmation modal triggers POST /illustrations/generate for all missing"
```

---

# SPRINT 4 — UI list + fiche

## Task 20: Filter illustration status + IllustrationStatusBadge

**Files:**
- Create: `app/frontend/plant-database/components/IllustrationStatusBadge.tsx`
- Modify: `app/frontend/plant-database/components/FilterPanel.tsx`
- Modify: `app/frontend/plant-database/components/SearchResultItem.tsx`

- [ ] **Step 1: Invoke frontend-design skill**

- [ ] **Step 2: Create badge**

Create `app/frontend/plant-database/components/IllustrationStatusBadge.tsx` :

```tsx
interface Props { hasIllustration: boolean; size?: 'sm' | 'md' }

export function IllustrationStatusBadge({ hasIllustration, size = 'sm' }: Props) {
  const dim = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
  const cls = hasIllustration
    ? 'bg-[#afbd00] border-[#afbd00]'
    : 'bg-transparent border-stone-300 border-dashed'
  return <span title={hasIllustration ? 'Illustrée' : 'Sans illustration'}
               className={`inline-block ${dim} rounded-full border-2 ${cls}`} />
}
```

- [ ] **Step 3: Add filter to FilterPanel**

Edit `app/frontend/plant-database/components/FilterPanel.tsx`. Find where existing filters are rendered (e.g. `strate`, `plant_type`). Add a new section :

```tsx
<fieldset className="mb-4">
  <legend className="text-xs font-semibold text-stone-700 uppercase tracking-wide mb-2">Statut illustration</legend>
  {[{v: 'all', l: 'Toutes'}, {v: 'with', l: 'Avec illustration'}, {v: 'without', l: 'Sans illustration'}].map(opt => (
    <label key={opt.v} className="flex items-center gap-2 text-sm py-0.5">
      <input
        type="radio"
        name="illustration_status"
        value={opt.v}
        checked={filters.illustrationStatus === opt.v}
        onChange={e => onChange({ illustrationStatus: e.target.value })}
      />
      {opt.l}
    </label>
  ))}
</fieldset>
```

(Adapt the prop names — `filters.illustrationStatus` and `onChange` — to whatever pattern `FilterPanel` already uses.)

- [ ] **Step 4: Show badge on SearchResultItem**

Edit `app/frontend/plant-database/components/SearchResultItem.tsx`. Near the species name display, add :

```tsx
import { IllustrationStatusBadge } from './IllustrationStatusBadge'
...
<IllustrationStatusBadge hasIllustration={!!item.hasIllustration} />
```

The `hasIllustration` field needs to come from the search API. Edit `app/controllers/api/v1/plants_controller.rb` `serialize_species_card` (or equivalent) to include :

```ruby
hasIllustration: species.silhouette_illustration.attached?
```

- [ ] **Step 5: Wire filter to search**

In `SearchView.tsx`, pass `illustration_status` filter param to the species list API call. Adjust the `list_species` controller action to apply `with_illustration` / `without_illustration` scopes if `params[:illustration_status]` is `with` / `without`.

- [ ] **Step 6: Manual test**

Open `/plants` (list view). Set filter "Sans illustration" → list filters down. Each item shows a status dot. Click a species with illustration → drawer shows the silhouette.

- [ ] **Step 7: Commit**

```bash
git add app/frontend/plant-database/components/IllustrationStatusBadge.tsx app/frontend/plant-database/components/FilterPanel.tsx app/frontend/plant-database/components/SearchResultItem.tsx app/frontend/plant-database/components/SearchView.tsx app/controllers/api/v1/plants_controller.rb
git commit -m "Plant list: illustration status filter + badge per row"
```

---

## Task 21: Sticky footer adapté + "Tout sélectionner du filtre courant"

**Files:**
- Modify: `app/frontend/plant-database/components/SearchView.tsx`

- [ ] **Step 1: Invoke frontend-design skill**

- [ ] **Step 2: Add "Sélectionner tout du filtre" button**

In `SearchView.tsx`, near the result list header, add :

```tsx
{isAdmin && filteredCount > 0 && (
  <button
    onClick={() => selectAllVisible()}
    className="text-xs text-[#5B5781] hover:underline mb-2"
  >
    Tout sélectionner ({filteredCount})
  </button>
)}
```

Where `selectAllVisible` adds all current filter result IDs into the existing multi-select Set.

- [ ] **Step 3: Adapt sticky footer**

In the existing sticky footer block, add a new button :

```tsx
const selectedSpecies = /* current selection items array */
const allHaveIllustration = selectedSpecies.every(s => s.hasIllustration)
const allMissing = selectedSpecies.every(s => !s.hasIllustration)
const buttonLabel = allMissing
  ? `🎨 Générer ${selectedCount} illustration${selectedCount > 1 ? 's' : ''}`
  : allHaveIllustration
    ? `🔄 Régénérer ${selectedCount} illustration${selectedCount > 1 ? 's' : ''}`
    : `🎨 Générer/Régénérer ${selectedCount}`
```

Render :

```tsx
{isAdmin && (
  <button
    onClick={handleBulkGenerate}
    disabled={selectedCount === 0 || selectedCount > 200}
    className="px-4 py-2 bg-[#afbd00] text-stone-900 font-semibold rounded-lg disabled:opacity-50"
    title={selectedCount > 200 ? 'Maximum 200 par batch' : ''}
  >
    {buttonLabel}
  </button>
)}
```

`handleBulkGenerate` :

```tsx
const handleBulkGenerate = async () => {
  await apiRequest('/api/v1/plants/illustrations/generate', {
    method: 'POST',
    body: JSON.stringify({ species_ids: Array.from(selectedSpeciesIds) }),
    headers: { 'Content-Type': 'application/json' }
  })
  // Toast: "N générations lancées — voir l'atelier"
  showToast(`${selectedCount} générations lancées. [Voir l'atelier](/plants/illustrations)`)
  clearSelection()
}
```

- [ ] **Step 4: Manual test**

Filter "Sans illustration", click "Tout sélectionner (903)", click "Générer 200 illustrations" → toast appears, jobs created.

- [ ] **Step 5: Commit**

```bash
git add app/frontend/plant-database/components/SearchView.tsx
git commit -m "SearchView: 'Tout sélectionner du filtre' + adaptive 'Générer/Régénérer N illustrations' footer"
```

---

## Task 22: `RegenerateIllustrationModal` from SpeciesDetail

**Files:**
- Create: `app/frontend/plant-database/components/RegenerateIllustrationModal.tsx`
- Modify: `app/frontend/plant-database/components/SpeciesDetail.tsx`

- [ ] **Step 1: Invoke frontend-design skill**

- [ ] **Step 2: Create the modal**

Create `app/frontend/plant-database/components/RegenerateIllustrationModal.tsx` :

```tsx
import { useState } from 'react'
import { apiRequest } from '@/lib/api'

interface Species { id: string; latinName: string; commonName: string | null; silhouetteUrl?: string | null }

interface Props {
  open: boolean
  species: Species
  onClose: () => void
  onSuccess?: () => void
}

export function RegenerateIllustrationModal({ open, species, onClose, onSuccess }: Props) {
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  if (!open) return null

  const submit = async () => {
    setSubmitting(true)
    try {
      await apiRequest('/api/v1/plants/illustrations/generate', {
        method: 'POST',
        body: JSON.stringify({
          species_ids: [parseInt(species.id)],
          kind: 'regeneration',
          feedback: feedback.trim() || undefined
        }),
        headers: { 'Content-Type': 'application/json' }
      })
      onSuccess?.()
      onClose()
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl">
        <h2 className="text-xl font-serif mb-1">Régénérer l'illustration</h2>
        <div className="flex items-center gap-3 mb-5">
          {species.silhouetteUrl ? (
            <img src={species.silhouetteUrl} alt="" className="w-16 h-20 object-contain border border-stone-200 rounded" />
          ) : (
            <div className="w-16 h-20 bg-stone-100 rounded" />
          )}
          <div>
            <div className="font-semibold">{species.commonName || species.latinName}</div>
            <div className="italic text-stone-600 text-sm">{species.latinName}</div>
          </div>
        </div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600 mb-1.5">
          Notes pour la prochaine génération (optionnel)
        </label>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Ex: trop dense, plus de fleurs visibles, troncs plus fins…"
          className="w-full min-h-[90px] border border-stone-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#5B5781]"
        />
        <p className="text-xs text-stone-500 mt-1.5">Ces notes sont ajoutées au prompt envoyé à Claude Haiku.</p>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700">Annuler</button>
          <button onClick={submit} disabled={submitting}
                  className="px-4 py-2 bg-[#5B5781] text-white rounded-lg disabled:opacity-60">
            {submitting ? 'Lancement…' : 'Régénérer maintenant'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire into SpeciesDetail**

Edit `app/frontend/plant-database/components/SpeciesDetail.tsx`. Add a button (admin only, in the existing amber callout pattern from CLAUDE.md) :

```tsx
{isAdmin && (
  <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-3">
    <div className="flex items-center gap-4">
      <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <button onClick={() => setRegenOpen(true)} className="text-sm font-medium">
        {species.silhouetteUrl ? 'Régénérer' : 'Générer'} l'illustration
      </button>
    </div>
  </div>
)}

<RegenerateIllustrationModal
  open={regenOpen}
  species={species}
  onClose={() => setRegenOpen(false)}
  onSuccess={() => {/* show toast */}}
/>
```

(Adapt to existing component conventions in `SpeciesDetail`.)

- [ ] **Step 4: Manual test**

Open species fiche → "Régénérer l'illustration" button visible (admin). Click → modal opens. Type feedback "less dense, more flowers" → submit → modal closes, job appears in atelier queue.

- [ ] **Step 5: Commit**

```bash
git add app/frontend/plant-database/components/RegenerateIllustrationModal.tsx app/frontend/plant-database/components/SpeciesDetail.tsx
git commit -m "RegenerateIllustrationModal: free-text feedback regen from species fiche"
```

---

## Task 23: Toast notifications

**Files:**
- Existing toast system (check via `grep "toast" app/frontend/`) — reuse if any, otherwise create a minimal one.
- Wire toasts into Sprints 3+4 actions

- [ ] **Step 1: Check existing toast pattern**

```bash
grep -rn "toast\|Toast\|ToastProvider\|sonner" app/frontend/ | head
```

If none exists, install `sonner` (lightweight toast library) :

```bash
yarn add sonner
```

Add `<Toaster />` in `app/frontend/entrypoints/application.jsx` near the AppShell wrap.

- [ ] **Step 2: Add toast on bulk generate**

In `SearchView.tsx` (Task 21) :

```tsx
import { toast } from 'sonner'
...
toast.success(`${selectedCount} générations lancées. Voir l'atelier`, {
  action: { label: 'Atelier', onClick: () => router.visit('/plants/illustrations') }
})
```

- [ ] **Step 3: Add toast on single regen**

In `RegenerateIllustrationModal.tsx`, on success :

```tsx
import { toast } from 'sonner'
...
onSuccess: () => toast.success('Régénération lancée — l\'image sera mise à jour automatiquement')
```

- [ ] **Step 4: Add toast on bulk catch-up**

In `Illustrations.tsx` `handleLaunchBulk`, after the API call :

```tsx
toast.success(`${stats.withoutIllustration} générations lancées`)
```

- [ ] **Step 5: Manual test**

Trigger each path → toast visible.

- [ ] **Step 6: Commit**

```bash
git add app/frontend/ package.json yarn.lock
git commit -m "Toast notifications: bulk generate, regen, catch-up"
```

---

# SPRINT 5 — Skill standalone update

## Task 24: Update `~/.claude/skills/semisto-imagegen/SKILL.md`

**Files:**
- Modify: `~/.claude/skills/semisto-imagegen/SKILL.md`
- Modify: `~/.claude/skills/semisto-imagegen/visual-design-system.md`

- [ ] **Step 1: Update SKILL.md routing logic for species**

In the SKILL.md, replace the section "6a. Si une espèce est identifiée → upload vers Terranova" with :

```markdown
### 6a. Si une espèce est identifiée → déléguer au pipeline Rails

Le skill **ne génère plus localement** pour les espèces. Il déclenche un job Terranova.

```bash
# 1. Résoudre species_id via search
SPECIES_ID=$(curl -s "${TERRANOVA_BASE}/api/v1/plants/search?query=${SPECIES_NAME_URLENC}" \
  | python3 -c "import sys, json; items = [i for i in json.load(sys.stdin)['items'] if i['type']=='species']; print(items[0]['id'] if items else '')")

# 2. Lancer le job
curl -s -X POST "${TERRANOVA_BASE}/api/v1/plants/illustrations/generate" \
  -H "Authorization: Bearer ${KNOWLEDGE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"species_ids\": [${SPECIES_ID}], \"feedback\": \"${FEEDBACK_OR_EMPTY}\"}"
```

Réponse : `{ "created_jobs": 1, "jobs": [{ "id": <job_id>, "status": "pending" }], ... }`

Retourner à l'utilisateur :
```
✓ Job créé pour {species_latin_name} (job #{job_id})
  Suis l'avancée : https://terranova.semisto.org/plants/illustrations
  L'image sera attachée automatiquement à la fiche dans ~30s
```

**Pas de génération Gemini locale, pas d'upload manuel.** Le pipeline Rails (Claude Haiku → Gemini → ActiveStorage) prend le relais.
```

- [ ] **Step 2: Keep non-species generation unchanged**

Sections 5 (génération Gemini), 6b (sauvegarde locale), 7 (cleanup) restent inchangées pour les usages **non-species** (B paysages, A3 pictos hors plante, A1 planches non liées au catalogue).

Ajoute un encart en tête de la section "Étapes de génération" :

```markdown
> **Routing automatique selon le sujet :**
> - Si une espèce végétale du catalogue est identifiée → le skill délègue au pipeline Rails (sections 6a). Pas de Gemini local.
> - Sinon → le skill génère via Gemini local et sauvegarde dans `~/Downloads/semisto-imagegen-output/` (sections 5, 6b, 7).
```

- [ ] **Step 3: Update visual-design-system.md mirror note**

En tête de `~/.claude/skills/semisto-imagegen/visual-design-system.md`, après le frontmatter, ajoute :

```markdown
> **Note importante** : pour les générations d'illustrations d'espèces du catalogue
> Plant Database, le VDS source-de-vérité est `config/visual_design_system.yml` côté
> Terranova. Ce fichier reste éditable comme miroir humain mais doit être tenu en
> sync manuellement avec le yaml. Pour les générations hors-catalogue (B paysages,
> A3 pictos hors plante), c'est ce fichier-ci qui pilote.
```

- [ ] **Step 4: Test end-to-end**

Dans une nouvelle conversation Claude Code :

```
Utilise le skill semisto-imagegen pour générer une illustration du sureau noir (Sambucus nigra)
```

Attendu :
1. Skill lit le VDS local
2. Identifie l'espèce, résout `species_id` via search
3. Appelle `/api/v1/plants/illustrations/generate` avec Bearer auth
4. Retourne le `job_id`
5. Job apparaît dans `/plants/illustrations` en `running`
6. ~30s plus tard, image attachée à `Plant::Species[Sambucus nigra]`

- [ ] **Step 5: Commit (skill repo, hors terranova)**

Le skill vit dans `~/.claude/skills/semisto-imagegen/`, pas dans le repo Terranova. Si tu veux versionner le skill, fais-le séparément. Sinon, juste sauvegarder les modifs.

---

## Self-Review checklist

L'auteur du plan a vérifié :

- [x] **Spec coverage** :
  - Section 1 (Architecture) → Tasks 1-8
  - Section 2 (Data model) → Task 3
  - Section 3 (Backend services) → Tasks 5, 6, 7, 8
  - Section 4 (API endpoints) → Tasks 9-13
  - Section 5 (UI surfaces) → Tasks 14-22
  - Section 6 (Throttling, auth) → Task 2 (queue config), Task 9 (require_admin), task 9 (queue saturation)
  - Section 7 (Hors scope MVP) → respecté
  - Section 11 (Implementation phasée) → 5 sprints distincts
- [x] **No placeholders** : tous les chemins sont absolus, tous les contenus sont fournis verbatim
- [x] **Type consistency** :
  - `Plants::Vds.template_for(:a2s)` partout (symbole)
  - `Plants::IllustrationPromptComposer.new(species:, style:, feedback:)` partout
  - `Plants::GeminiImageClient.new.generate(prompt:)` partout
  - `Plant::IllustrationJob` avec champs cohérents (`status`, `kind`, `feedback`, `prompt_used`, `vds_version`, etc.)
  - API endpoints renvoient les mêmes shapes que dans la spec section 4
- [x] **Frontend skill invoked** : tâches Sprint 3 et 4 demandent explicitement `Skill('frontend-design')` avant écriture
- [x] **Authentication** : `require_admin!` ajouté en Task 9, appliqué aux actions sensibles
- [x] **TDD applied** : tests précèdent l'implémentation pour tous les services backend (Tasks 3-8) et l'API (Tasks 9-13)
- [x] **Frequent commits** : 1 commit par Task = 24 commits au total

**Risques identifiés à l'exécution** :
- Stub Anthropic API in tests : utilise `mocha` (déjà dans Gemfile via `minitest`) ou `webmock`
- ActiveStorage variants need processing — peut nécessiter `image_processing` gem si pas déjà actif
- Turbo broadcast côté Inertia/React n'est pas natif → on poll côté React (5s) au lieu de subscribe Turbo Streams (Task 18 documenté)
- `current_member` dans `Api::V1::BaseController` doit retourner un Member valide (Bearer auth or session). Vérifier que le pattern existe pour les nouveaux endpoints.
- Variants ActiveStorage pour les thumbnails 200×280 nécessite `libvips` ou `imagemagick` installé sur le serveur
