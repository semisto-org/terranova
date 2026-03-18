# Guilds & Labs Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce multi-Lab support and enrich Guilds with collaboration tools (documents, tasks, wiki, credentials) plus a frontend interface.

**Architecture:** Evolve the existing Guild model by adding a `guild_type` field (lab/network). Create a new Lab model with member join table. Reuse existing TaskList/Action and KnowledgeSection/KnowledgeTopic systems by adding `guild_id` FK columns. Add GuildDocument for file uploads and Credential with ActiveRecord::Encryption for secrets. Build a dedicated Guild API controller and React frontend page.

**Tech Stack:** Rails 8.1, PostgreSQL, ActiveRecord::Encryption, ActiveStorage, React 18, Inertia.js, Tailwind CSS 4, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-18-guilds-and-labs-design.md`

---

### Task 1: ActiveRecord::Encryption Prerequisites

**Files:**
- Modify: `config/credentials.yml.enc` (via `rails credentials:edit`)

- [ ] **Step 1: Generate encryption keys**

Run: `bin/rails db:encryption:init`

This outputs three key/value pairs. Copy them.

- [ ] **Step 2: Add keys to credentials**

Run: `EDITOR="code --wait" bin/rails credentials:edit`

Add the generated keys under:

```yaml
active_record_encryption:
  primary_key: <generated>
  deterministic_key: <generated>
  key_derivation_salt: <generated>
```

Save and close.

- [ ] **Step 3: Verify encryption is configured**

Run: `bin/rails runner "puts ActiveRecord::Encryption.config.primary_key.present?"`
Expected: `true`

- [ ] **Step 4: Commit**

```bash
git add config/credentials.yml.enc
git commit -m "feat: configure ActiveRecord::Encryption keys for credential vault"
```

---

### Task 2: Create Lab and LabMembership models

**Files:**
- Create: `db/migrate/XXX_create_labs.rb`
- Create: `app/models/lab.rb`
- Create: `app/models/lab_membership.rb`
- Create: `test/integration/guilds_and_labs_test.rb`
- Modify: `app/models/member.rb`

- [ ] **Step 1: Write the failing test**

Create `test/integration/guilds_and_labs_test.rb`:

```ruby
require 'test_helper'

class GuildsAndLabsTest < ActionDispatch::IntegrationTest
  setup do
    [LabMembership, Lab, GuildMembership, Guild].each(&:delete_all)
  end

  test 'create a lab and assign members' do
    lab = Lab.create!(name: 'Wallonie-Bruxelles', slug: 'wallonie-bruxelles')
    member = Member.first

    LabMembership.create!(lab: lab, member: member)

    assert_equal 1, lab.members.count
    assert_includes member.labs, lab
  end

  test 'lab slug must be unique' do
    Lab.create!(name: 'Lab A', slug: 'lab-a')
    duplicate = Lab.new(name: 'Lab B', slug: 'lab-a')
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:slug], 'has already been taken'
  end

  test 'member cannot join same lab twice' do
    lab = Lab.create!(name: 'Lab A', slug: 'lab-a')
    member = Member.first

    LabMembership.create!(lab: lab, member: member)
    duplicate = LabMembership.new(lab: lab, member: member)
    assert_not duplicate.valid?
  end
end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb`
Expected: FAIL — `Lab` class not found

- [ ] **Step 3: Generate migration**

Run: `bin/rails generate migration CreateLabs`

Edit the generated migration:

```ruby
class CreateLabs < ActiveRecord::Migration[8.1]
  def change
    create_table :labs do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.timestamps
    end

    add_index :labs, :slug, unique: true

    create_table :lab_memberships do |t|
      t.references :lab, null: false, foreign_key: true
      t.references :member, null: false, foreign_key: true
      t.timestamps
    end

    add_index :lab_memberships, [:lab_id, :member_id], unique: true
  end
end
```

- [ ] **Step 4: Run migration**

Run: `bin/rails db:migrate`
Expected: Tables `labs` and `lab_memberships` created

- [ ] **Step 5: Create Lab model**

Create `app/models/lab.rb`:

```ruby
class Lab < ApplicationRecord
  has_many :lab_memberships, dependent: :destroy
  has_many :members, through: :lab_memberships
  has_many :guilds, -> { where(guild_type: "lab") }

  validates :name, :slug, presence: true
  validates :slug, uniqueness: true
end
```

- [ ] **Step 6: Create LabMembership model**

Create `app/models/lab_membership.rb`:

```ruby
class LabMembership < ApplicationRecord
  belongs_to :lab
  belongs_to :member

  validates :member_id, uniqueness: { scope: :lab_id }
end
```

- [ ] **Step 7: Add lab associations to Member**

In `app/models/member.rb`, after the existing `has_many :guilds, through: :guild_memberships` line (line 11), add:

```ruby
  has_many :lab_memberships, dependent: :destroy
  has_many :labs, through: :lab_memberships
```

- [ ] **Step 8: Run test to verify it passes**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb`
Expected: 3 tests, 0 failures

- [ ] **Step 9: Run full test suite**

Run: `bin/rails test`
Expected: All existing tests still pass

- [ ] **Step 10: Commit**

```bash
git add app/models/lab.rb app/models/lab_membership.rb app/models/member.rb db/migrate/ db/schema.rb test/integration/guilds_and_labs_test.rb
git commit -m "feat: add Lab and LabMembership models with multi-lab member support"
```

---

### Task 3: Evolve Guild model with guild_type, lab_id, icon

**Files:**
- Create: `db/migrate/XXX_add_guild_type_and_lab_to_guilds.rb`
- Modify: `app/models/guild.rb`
- Modify: `test/integration/guilds_and_labs_test.rb`

- [ ] **Step 1: Write the failing test**

Append to `test/integration/guilds_and_labs_test.rb`:

```ruby
  test 'guild with guild_type lab requires lab_id' do
    lab = Lab.create!(name: 'Test Lab', slug: 'test-lab')

    # Network guild: no lab_id needed
    network_guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    assert network_guild.valid?
    assert_nil network_guild.lab_id

    # Lab guild: lab_id required
    lab_guild = Guild.new(name: 'Design', color: 'green', guild_type: 'lab')
    assert_not lab_guild.valid?
    assert_includes lab_guild.errors[:lab_id], "can't be blank"

    # Lab guild with lab_id: valid
    lab_guild.lab = lab
    assert lab_guild.valid?
  end

  test 'existing guilds default to network type' do
    guild = Guild.create!(name: 'Old Guild', color: 'purple')
    assert_equal 'network', guild.guild_type
  end

  test 'guild scopes filter by type' do
    lab = Lab.create!(name: 'Lab', slug: 'lab')
    Guild.create!(name: 'Net Guild', color: 'blue', guild_type: 'network')
    Guild.create!(name: 'Lab Guild', color: 'red', guild_type: 'lab', lab: lab)

    assert_equal 1, Guild.network_guilds.count
    assert_equal 1, Guild.lab_guilds.count
  end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb`
Expected: FAIL — `guild_type` column unknown

- [ ] **Step 3: Generate and write migration**

Run: `bin/rails generate migration AddGuildTypeAndLabToGuilds`

Edit:

```ruby
class AddGuildTypeAndLabToGuilds < ActiveRecord::Migration[8.1]
  def change
    add_column :guilds, :guild_type, :string, default: "network", null: false
    add_reference :guilds, :lab, null: true, foreign_key: true
    add_column :guilds, :icon, :string

    add_index :guilds, :guild_type
  end
end
```

- [ ] **Step 4: Run migration**

Run: `bin/rails db:migrate`

- [ ] **Step 5: Update Guild model**

Replace `app/models/guild.rb` with:

```ruby
class Guild < ApplicationRecord
  COLORS = %w[blue purple green orange red].freeze
  GUILD_TYPES = %w[lab network].freeze

  belongs_to :leader, class_name: "Member", optional: true
  belongs_to :lab, optional: true

  has_many :guild_memberships, dependent: :destroy
  has_many :members, through: :guild_memberships

  validates :name, :color, presence: true
  validates :color, inclusion: { in: COLORS }
  validates :guild_type, inclusion: { in: GUILD_TYPES }
  validates :lab_id, presence: true, if: -> { guild_type == "lab" }

  scope :lab_guilds, -> { where(guild_type: "lab") }
  scope :network_guilds, -> { where(guild_type: "network") }
end
```

- [ ] **Step 6: Run test to verify it passes**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb`
Expected: 6 tests, 0 failures

- [ ] **Step 7: Run full test suite**

Run: `bin/rails test`
Expected: All pass

- [ ] **Step 8: Commit**

```bash
git add app/models/guild.rb db/migrate/ db/schema.rb test/integration/guilds_and_labs_test.rb
git commit -m "feat: add guild_type, lab_id, icon to Guild model"
```

---

### Task 4: Create GuildDocument model (files + tags)

**Files:**
- Create: `db/migrate/XXX_create_guild_documents.rb`
- Create: `app/models/guild_document.rb`
- Modify: `app/models/guild.rb`
- Modify: `test/integration/guilds_and_labs_test.rb`

- [ ] **Step 1: Write the failing test**

Append to `test/integration/guilds_and_labs_test.rb`:

```ruby
  test 'guild document requires name and file' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')

    doc = GuildDocument.new(guild: guild)
    assert_not doc.valid?
    assert_includes doc.errors[:name], "can't be blank"
  end

  test 'guild document tags filtering' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    member = Member.first

    GuildDocument.create!(
      guild: guild,
      name: 'Brand Guide',
      tags: ['branding', 'design'],
      uploaded_by_id: member.id,
      file: fixture_file_upload('test/fixtures/files/sample.pdf', 'application/pdf')
    )
    GuildDocument.create!(
      guild: guild,
      name: 'Meeting Notes',
      tags: ['admin'],
      file: fixture_file_upload('test/fixtures/files/sample.pdf', 'application/pdf')
    )

    assert_equal 1, GuildDocument.by_tag('branding').count
    assert_equal 2, guild.documents.count
  end
```

- [ ] **Step 2: Create test fixture file**

Run: `mkdir -p test/fixtures/files && echo "sample" > test/fixtures/files/sample.pdf`

- [ ] **Step 3: Run test to verify it fails**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb`
Expected: FAIL — `GuildDocument` not found

- [ ] **Step 4: Generate and write migration**

Run: `bin/rails generate migration CreateGuildDocuments`

Edit:

```ruby
class CreateGuildDocuments < ActiveRecord::Migration[8.1]
  def change
    create_table :guild_documents do |t|
      t.references :guild, null: false, foreign_key: true
      t.references :uploaded_by, null: true, foreign_key: { to_table: :members }
      t.string :name, null: false
      t.jsonb :tags, default: []
      t.timestamps
    end
  end
end
```

- [ ] **Step 5: Run migration**

Run: `bin/rails db:migrate`

- [ ] **Step 6: Create GuildDocument model**

Create `app/models/guild_document.rb`:

```ruby
class GuildDocument < ApplicationRecord
  belongs_to :guild
  belongs_to :uploader, class_name: "Member", foreign_key: :uploaded_by_id, optional: true

  has_one_attached :file

  validates :name, presence: true
  validates :file, presence: true

  scope :by_tag, ->(tag) { where("tags::text ILIKE ?", "%#{tag}%") if tag.present? }
end
```

- [ ] **Step 7: Add documents association to Guild**

In `app/models/guild.rb`, after `has_many :guild_memberships`, add:

```ruby
  has_many :documents, class_name: "GuildDocument", dependent: :destroy
```

- [ ] **Step 8: Run test to verify it passes**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb`
Expected: 8 tests, 0 failures

- [ ] **Step 9: Commit**

```bash
git add app/models/guild_document.rb app/models/guild.rb db/migrate/ db/schema.rb test/integration/guilds_and_labs_test.rb test/fixtures/files/
git commit -m "feat: add GuildDocument model with ActiveStorage file upload and tags"
```

---

### Task 5: Add guild_id to TaskList and Action

**Files:**
- Create: `db/migrate/XXX_add_guild_id_to_task_lists_and_actions.rb`
- Modify: `app/models/task_list.rb`
- Modify: `app/models/action.rb`
- Modify: `app/models/guild.rb`
- Modify: `test/integration/guilds_and_labs_test.rb`

- [ ] **Step 1: Write the failing test**

Append to `test/integration/guilds_and_labs_test.rb`:

```ruby
  test 'guild can have task lists with actions' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')

    list = TaskList.create!(name: 'Sprint 1', guild: guild)
    action = Action.create!(name: 'Write newsletter', task_list: list, guild: guild, status: 'todo')

    assert_equal 1, guild.task_lists.count
    assert_equal guild, list.guild
    assert_equal guild, action.guild
  end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb`
Expected: FAIL — unknown attribute `guild` for TaskList

- [ ] **Step 3: Generate and write migration**

Run: `bin/rails generate migration AddGuildIdToTaskListsAndActions`

Edit:

```ruby
class AddGuildIdToTaskListsAndActions < ActiveRecord::Migration[8.1]
  def change
    add_reference :task_lists, :guild, null: true, foreign_key: true
    add_reference :actions, :guild, null: true, foreign_key: true
  end
end
```

- [ ] **Step 4: Run migration**

Run: `bin/rails db:migrate`

- [ ] **Step 5: Update TaskList model**

In `app/models/task_list.rb`, add after the `belongs_to :training` line:

```ruby
  belongs_to :guild, optional: true
```

- [ ] **Step 6: Update Action model**

In `app/models/action.rb`, add after the `belongs_to :task_list` line:

```ruby
  belongs_to :guild, optional: true
```

- [ ] **Step 7: Add task_lists association to Guild**

In `app/models/guild.rb`, after `has_many :documents`, add:

```ruby
  has_many :task_lists, dependent: :destroy
```

- [ ] **Step 8: Run test to verify it passes**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb`
Expected: 9 tests, 0 failures

- [ ] **Step 9: Run full test suite**

Run: `bin/rails test`
Expected: All pass

- [ ] **Step 10: Commit**

```bash
git add app/models/task_list.rb app/models/action.rb app/models/guild.rb db/migrate/ db/schema.rb test/integration/guilds_and_labs_test.rb
git commit -m "feat: add guild_id FK to TaskList and Action for guild task management"
```

---

### Task 6: Add guild_id to KnowledgeSection + update KnowledgeTopic

**Files:**
- Create: `db/migrate/XXX_add_guild_id_to_knowledge_sections.rb`
- Modify: `app/models/knowledge_section.rb`
- Modify: `app/models/knowledge_topic.rb`
- Modify: `app/models/guild.rb`
- Modify: `test/integration/guilds_and_labs_test.rb`

- [ ] **Step 1: Write the failing test**

Append to `test/integration/guilds_and_labs_test.rb`:

```ruby
  test 'knowledge sections can be scoped to a guild' do
    guild_a = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    guild_b = Guild.create!(name: 'Design', color: 'green', guild_type: 'network')

    KnowledgeSection.where(guild_id: [guild_a.id, guild_b.id]).delete_all

    section_a = KnowledgeSection.create!(name: 'Ressources', guild: guild_a)
    section_b = KnowledgeSection.create!(name: 'Ressources', guild: guild_b)

    # Same name, different guilds: both valid
    assert section_a.valid?
    assert section_b.valid?
    assert_equal 1, guild_a.knowledge_sections.count
  end

  test 'knowledge topic inherits guild from section' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    section = KnowledgeSection.create!(name: 'Wiki', guild: guild)
    topic = KnowledgeTopic.create!(
      title: 'How to post',
      content: 'Steps to post on social media',
      status: 'published',
      section: section
    )

    assert_equal guild, topic.guild
  end

  test 'knowledge topics for_guild scope works' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    section = KnowledgeSection.create!(name: 'Wiki', guild: guild)
    KnowledgeTopic.create!(title: 'Guild Topic', content: 'content', status: 'published', section: section)

    global_section = KnowledgeSection.find_or_create_by!(name: 'Global Section Test', guild_id: nil)
    KnowledgeTopic.create!(title: 'Global Topic', content: 'content', status: 'published', section: global_section)

    assert_equal 1, KnowledgeTopic.for_guild(guild.id).count
  end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb`
Expected: FAIL — unknown attribute `guild` for KnowledgeSection

- [ ] **Step 3: Generate and write migration**

Run: `bin/rails generate migration AddGuildIdToKnowledgeSections`

Edit:

```ruby
class AddGuildIdToKnowledgeSections < ActiveRecord::Migration[8.1]
  def change
    add_reference :knowledge_sections, :guild, null: true, foreign_key: true

    # Remove existing uniqueness index on name if any, then add composite
    remove_index :knowledge_sections, :name if index_exists?(:knowledge_sections, :name)
    add_index :knowledge_sections, [:guild_id, :name], unique: true
  end
end
```

- [ ] **Step 4: Run migration**

Run: `bin/rails db:migrate`

- [ ] **Step 5: Update KnowledgeSection model**

In `app/models/knowledge_section.rb`, add after `belongs_to :creator` (line 4):

```ruby
  belongs_to :guild, optional: true
```

Change the validates line from:
```ruby
  validates :name, presence: true, uniqueness: true
```
to:
```ruby
  validates :name, presence: true, uniqueness: { scope: :guild_id }
```

- [ ] **Step 6: Update KnowledgeTopic model**

In `app/models/knowledge_topic.rb`, after the `belongs_to :creator` line (line 7), add:

```ruby
  delegate :guild, to: :section, allow_nil: true

  scope :for_guild, ->(guild_id) { joins(:section).where(knowledge_sections: { guild_id: guild_id }) }
```

- [ ] **Step 7: Add knowledge_sections association to Guild**

In `app/models/guild.rb`, after `has_many :task_lists`, add:

```ruby
  has_many :knowledge_sections, class_name: "KnowledgeSection", dependent: :nullify
```

- [ ] **Step 8: Run test to verify it passes**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb`
Expected: 12 tests, 0 failures

- [ ] **Step 9: Run full test suite**

Run: `bin/rails test`
Expected: All pass

- [ ] **Step 10: Commit**

```bash
git add app/models/knowledge_section.rb app/models/knowledge_topic.rb app/models/guild.rb db/migrate/ db/schema.rb test/integration/guilds_and_labs_test.rb
git commit -m "feat: add guild_id to KnowledgeSection for guild-scoped wiki"
```

---

### Task 7: Create Credential model (encrypted vault)

**Files:**
- Create: `db/migrate/XXX_create_credentials.rb`
- Create: `app/models/credential.rb`
- Modify: `app/models/guild.rb`
- Modify: `test/integration/guilds_and_labs_test.rb`

- [ ] **Step 1: Write the failing test**

Append to `test/integration/guilds_and_labs_test.rb`:

```ruby
  test 'credential encrypts sensitive fields' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    member = Member.first

    cred = Credential.create!(
      guild: guild,
      service_name: 'Canva',
      username: 'team@semisto.org',
      password: 'super-secret-123',
      url: 'https://canva.com',
      notes: 'Shared team account',
      created_by_id: member.id
    )

    assert_equal 'Canva', cred.service_name
    assert_equal 'team@semisto.org', cred.username
    assert_equal 'super-secret-123', cred.password
    assert_equal 'Shared team account', cred.notes

    # Verify the raw DB value is NOT plaintext
    raw_password = Credential.connection.select_value(
      "SELECT password FROM credentials WHERE id = #{cred.id}"
    )
    assert_not_equal 'super-secret-123', raw_password
  end

  test 'credential requires service_name' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    cred = Credential.new(guild: guild)
    assert_not cred.valid?
    assert_includes cred.errors[:service_name], "can't be blank"
  end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb`
Expected: FAIL — `Credential` not found

- [ ] **Step 3: Generate and write migration**

Run: `bin/rails generate migration CreateCredentials`

Edit:

```ruby
class CreateCredentials < ActiveRecord::Migration[8.1]
  def change
    create_table :credentials do |t|
      t.references :guild, null: false, foreign_key: true
      t.string :service_name, null: false
      t.string :username
      t.string :password
      t.string :url
      t.text :notes
      t.references :created_by, null: true, foreign_key: { to_table: :members }
      t.timestamps
    end
  end
end
```

- [ ] **Step 4: Run migration**

Run: `bin/rails db:migrate`

- [ ] **Step 5: Create Credential model**

Create `app/models/credential.rb`:

```ruby
class Credential < ApplicationRecord
  belongs_to :guild
  belongs_to :creator, class_name: "Member", foreign_key: :created_by_id, optional: true

  encrypts :username, :password, :notes

  validates :service_name, presence: true
end
```

- [ ] **Step 6: Add credentials association to Guild**

In `app/models/guild.rb`, after `has_many :knowledge_sections`, add:

```ruby
  has_many :credentials, dependent: :destroy
```

- [ ] **Step 7: Run test to verify it passes**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb`
Expected: 14 tests, 0 failures

- [ ] **Step 8: Run full test suite**

Run: `bin/rails test`
Expected: All pass

- [ ] **Step 9: Commit**

```bash
git add app/models/credential.rb app/models/guild.rb db/migrate/ db/schema.rb test/integration/guilds_and_labs_test.rb
git commit -m "feat: add Credential model with ActiveRecord::Encryption for guild vault"
```

---

### Task 8: Guild API Controller — CRUD + documents + task lists + credentials

**Files:**
- Create: `app/controllers/api/v1/guilds_controller.rb`
- Modify: `config/routes.rb`
- Modify: `test/integration/guilds_and_labs_test.rb`

- [ ] **Step 1: Write the failing test for guild CRUD API**

Append to `test/integration/guilds_and_labs_test.rb`:

```ruby
  # === API Tests ===

  test 'GET /api/v1/guilds returns all guilds with details' do
    guild = Guild.create!(name: 'Communication', color: 'blue', guild_type: 'network')
    member = Member.first
    GuildMembership.create!(guild: guild, member: member)

    get '/api/v1/guilds', as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert body['guilds'].any? { |g| g['name'] == 'Communication' }
  end

  test 'GET /api/v1/guilds/:id returns guild detail with all associations' do
    guild = Guild.create!(name: 'Communication', color: 'blue', guild_type: 'network')

    get "/api/v1/guilds/#{guild.id}", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 'Communication', body['guild']['name']
    assert body['guild'].key?('documents')
    assert body['guild'].key?('taskLists')
    assert body['guild'].key?('credentials')
    assert body['guild'].key?('knowledgeSections')
  end

  test 'POST /api/v1/guilds creates a guild' do
    post '/api/v1/guilds', params: {
      name: 'New Guild', color: 'purple', guild_type: 'network', description: 'Test'
    }, as: :json
    assert_response :created

    body = JSON.parse(response.body)
    assert_equal 'New Guild', body['guild']['name']
    assert_equal 'network', body['guild']['guildType']
  end

  test 'PATCH /api/v1/guilds/:id updates a guild' do
    guild = Guild.create!(name: 'Old Name', color: 'blue', guild_type: 'network')

    patch "/api/v1/guilds/#{guild.id}", params: { name: 'New Name' }, as: :json
    assert_response :success

    assert_equal 'New Name', guild.reload.name
  end

  test 'DELETE /api/v1/guilds/:id destroys a guild' do
    guild = Guild.create!(name: 'To Delete', color: 'red', guild_type: 'network')

    delete "/api/v1/guilds/#{guild.id}", as: :json
    assert_response :no_content
    assert_nil Guild.find_by(id: guild.id)
  end

  test 'guild task list CRUD via API' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')

    post "/api/v1/guilds/#{guild.id}/task-lists", params: { name: 'Sprint 1' }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    list_id = body['taskList']['id']

    post "/api/v1/guilds/#{guild.id}/task-lists/#{list_id}/actions",
      params: { name: 'Write post', status: 'todo' }, as: :json
    assert_response :created

    get "/api/v1/guilds/#{guild.id}/task-lists", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['taskLists'].size
    assert_equal 1, body['taskLists'][0]['actions'].size
  end

  test 'guild credential CRUD via API with password masking' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')

    post "/api/v1/guilds/#{guild.id}/credentials",
      params: { service_name: 'Canva', username: 'team@test.com', password: 'secret123', url: 'https://canva.com' },
      as: :json
    assert_response :created
    body = JSON.parse(response.body)
    cred_id = body['credential']['id']

    # Password not in default response
    assert_not body['credential'].key?('password')
    assert body['credential']['hasPassword']

    # Reveal endpoint returns password
    get "/api/v1/guilds/#{guild.id}/credentials/#{cred_id}/reveal", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'secret123', body['credential']['password']
  end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb`
Expected: FAIL — routing error, no route for `/api/v1/guilds`

- [ ] **Step 3: Add guild routes**

In `config/routes.rb`, inside the `namespace :api do; namespace :v1 do` block, after the lab management routes (around line 145), add:

```ruby
      # Guilds
      get "guilds", to: "guilds#index"
      get "guilds/:id", to: "guilds#show"
      post "guilds", to: "guilds#create"
      patch "guilds/:id", to: "guilds#update"
      delete "guilds/:id", to: "guilds#destroy"

      # Guild documents
      get "guilds/:guild_id/documents", to: "guilds#list_documents"
      post "guilds/:guild_id/documents", to: "guilds#create_document"
      delete "guilds/:guild_id/documents/:id", to: "guilds#destroy_document"

      # Guild task lists
      get "guilds/:guild_id/task-lists", to: "guilds#list_task_lists"
      post "guilds/:guild_id/task-lists", to: "guilds#create_task_list"
      patch "guilds/:guild_id/task-lists/:id", to: "guilds#update_task_list"
      delete "guilds/:guild_id/task-lists/:id", to: "guilds#destroy_task_list"

      # Guild task list actions
      post "guilds/:guild_id/task-lists/:task_list_id/actions", to: "guilds#create_action"
      patch "guilds/:guild_id/actions/:id", to: "guilds#update_action"
      delete "guilds/:guild_id/actions/:id", to: "guilds#destroy_action"

      # Guild credentials
      get "guilds/:guild_id/credentials", to: "guilds#list_credentials"
      post "guilds/:guild_id/credentials", to: "guilds#create_credential"
      patch "guilds/:guild_id/credentials/:id", to: "guilds#update_credential"
      get "guilds/:guild_id/credentials/:id/reveal", to: "guilds#reveal_credential"
      delete "guilds/:guild_id/credentials/:id", to: "guilds#destroy_credential"

      # Guild memberships
      post "guilds/:guild_id/members", to: "guilds#add_member"
      delete "guilds/:guild_id/members/:member_id", to: "guilds#remove_member"
```

- [ ] **Step 4: Create guilds controller**

Create `app/controllers/api/v1/guilds_controller.rb`:

```ruby
# frozen_string_literal: true

module Api
  module V1
    class GuildsController < BaseController
      before_action :require_effective_member
      before_action :set_guild, only: [
        :show, :update, :destroy,
        :list_documents, :create_document, :destroy_document,
        :list_task_lists, :create_task_list, :update_task_list, :destroy_task_list,
        :create_action, :update_action, :destroy_action,
        :list_credentials, :create_credential, :update_credential, :reveal_credential, :destroy_credential,
        :add_member, :remove_member
      ]

      # GET /api/v1/guilds
      def index
        guilds = Guild.includes(:guild_memberships, :lab).order(:name)
        guilds = guilds.where(guild_type: params[:guild_type]) if params[:guild_type].present?
        guilds = guilds.where(lab_id: params[:lab_id]) if params[:lab_id].present?

        render json: { guilds: guilds.map { |g| serialize_guild_brief(g) } }
      end

      # GET /api/v1/guilds/:id
      def show
        render json: { guild: serialize_guild_full(@guild) }
      end

      # POST /api/v1/guilds
      def create
        guild = Guild.new(guild_params)
        if guild.save
          render json: { guild: serialize_guild_brief(guild) }, status: :created
        else
          render json: { errors: guild.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/guilds/:id
      def update
        if @guild.update(guild_params)
          render json: { guild: serialize_guild_brief(@guild) }
        else
          render json: { errors: @guild.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/guilds/:id
      def destroy
        @guild.destroy!
        head :no_content
      end

      # --- Documents ---

      # GET /api/v1/guilds/:guild_id/documents
      def list_documents
        docs = @guild.documents.order(created_at: :desc)
        docs = docs.by_tag(params[:tag]) if params[:tag].present?
        render json: { documents: docs.map { |d| serialize_document(d) } }
      end

      # POST /api/v1/guilds/:guild_id/documents
      def create_document
        doc = @guild.documents.build(document_params)
        doc.uploaded_by_id = current_member&.id
        if doc.save
          render json: { document: serialize_document(doc) }, status: :created
        else
          render json: { errors: doc.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/guilds/:guild_id/documents/:id
      def destroy_document
        doc = @guild.documents.find(params[:id])
        doc.destroy!
        head :no_content
      end

      # --- Task Lists ---

      # GET /api/v1/guilds/:guild_id/task-lists
      def list_task_lists
        lists = @guild.task_lists.includes(:actions).order(:position, :id)
        render json: { taskLists: lists.map { |l| serialize_task_list(l) } }
      end

      # POST /api/v1/guilds/:guild_id/task-lists
      def create_task_list
        list = @guild.task_lists.build(task_list_params)
        if list.save
          render json: { taskList: serialize_task_list(list) }, status: :created
        else
          render json: { errors: list.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/guilds/:guild_id/task-lists/:id
      def update_task_list
        list = @guild.task_lists.find(params[:id])
        if list.update(task_list_params)
          render json: { taskList: serialize_task_list(list) }
        else
          render json: { errors: list.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/guilds/:guild_id/task-lists/:id
      def destroy_task_list
        list = @guild.task_lists.find(params[:id])
        list.destroy!
        head :no_content
      end

      # --- Actions ---

      # POST /api/v1/guilds/:guild_id/task-lists/:task_list_id/actions
      def create_action
        list = @guild.task_lists.find(params[:task_list_id])
        action = list.actions.build(action_params)
        action.guild = @guild
        if action.save
          render json: { action: serialize_action(action) }, status: :created
        else
          render json: { errors: action.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/guilds/:guild_id/actions/:id
      def update_action
        action = Action.find(params[:id])
        if action.update(action_params)
          render json: { action: serialize_action(action) }
        else
          render json: { errors: action.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/guilds/:guild_id/actions/:id
      def destroy_action
        action = Action.find(params[:id])
        action.destroy!
        head :no_content
      end

      # --- Credentials ---

      # GET /api/v1/guilds/:guild_id/credentials
      def list_credentials
        render json: { credentials: @guild.credentials.map { |c| serialize_credential(c) } }
      end

      # POST /api/v1/guilds/:guild_id/credentials
      def create_credential
        cred = @guild.credentials.build(credential_params)
        cred.created_by_id = current_member&.id
        if cred.save
          render json: { credential: serialize_credential(cred) }, status: :created
        else
          render json: { errors: cred.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/guilds/:guild_id/credentials/:id
      def update_credential
        cred = @guild.credentials.find(params[:id])
        if cred.update(credential_params)
          render json: { credential: serialize_credential(cred) }
        else
          render json: { errors: cred.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/guilds/:guild_id/credentials/:id/reveal
      def reveal_credential
        cred = @guild.credentials.find(params[:id])
        render json: { credential: serialize_credential(cred, reveal: true) }
      end

      # DELETE /api/v1/guilds/:guild_id/credentials/:id
      def destroy_credential
        cred = @guild.credentials.find(params[:id])
        cred.destroy!
        head :no_content
      end

      # --- Members ---

      # POST /api/v1/guilds/:guild_id/members
      def add_member
        membership = @guild.guild_memberships.build(member_id: params[:member_id])
        if membership.save
          render json: { memberIds: @guild.guild_memberships.pluck(:member_id).map(&:to_s) }, status: :created
        else
          render json: { errors: membership.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/guilds/:guild_id/members/:member_id
      def remove_member
        membership = @guild.guild_memberships.find_by!(member_id: params[:member_id])
        membership.destroy!
        head :no_content
      end

      private

      def set_guild
        @guild = Guild.find(params[:guild_id] || params[:id])
      end

      def guild_params
        params.permit(:name, :description, :color, :guild_type, :lab_id, :icon, :leader_id)
      end

      def document_params
        params.permit(:name, :file, tags: [])
      end

      def task_list_params
        params.permit(:name, :position)
      end

      def action_params
        params.permit(:name, :status, :due_date, :assignee_name, :priority, :position, :parent_id, tags: [])
      end

      def credential_params
        params.permit(:service_name, :username, :password, :url, :notes)
      end

      # --- Serializers ---

      def serialize_guild_brief(guild)
        {
          id: guild.id.to_s,
          name: guild.name,
          description: guild.description,
          color: guild.color,
          guildType: guild.guild_type,
          labId: guild.lab_id&.to_s,
          labName: guild.lab&.name,
          icon: guild.icon,
          leaderId: guild.leader_id&.to_s,
          memberIds: guild.guild_memberships.map { |gm| gm.member_id.to_s },
          memberCount: guild.guild_memberships.size,
          createdAt: guild.created_at&.iso8601
        }
      end

      def serialize_guild_full(guild)
        serialize_guild_brief(guild).merge(
          documents: guild.documents.order(created_at: :desc).map { |d| serialize_document(d) },
          taskLists: guild.task_lists.includes(:actions).order(:position, :id).map { |l| serialize_task_list(l) },
          knowledgeSections: guild.knowledge_sections.ordered.map(&:as_json_brief),
          credentials: guild.credentials.map { |c| serialize_credential(c) }
        )
      end

      def serialize_document(doc)
        {
          id: doc.id.to_s,
          name: doc.name,
          tags: doc.tags || [],
          uploadedById: doc.uploaded_by_id&.to_s,
          fileUrl: doc.file.attached? ? Rails.application.routes.url_helpers.rails_blob_path(doc.file, only_path: true) : nil,
          fileName: doc.file.attached? ? doc.file.filename.to_s : nil,
          contentType: doc.file.attached? ? doc.file.content_type : nil,
          byteSize: doc.file.attached? ? doc.file.byte_size : nil,
          createdAt: doc.created_at&.iso8601
        }
      end

      def serialize_task_list(list)
        {
          id: list.id.to_s,
          name: list.name,
          position: list.position,
          actions: list.actions.order(:position, :id).map { |a| serialize_action(a) }
        }
      end

      def serialize_action(action)
        {
          id: action.id.to_s,
          name: action.name,
          status: action.status,
          dueDate: action.due_date&.iso8601,
          assigneeName: action.assignee_name,
          priority: action.priority,
          position: action.position,
          tags: action.tags || [],
          parentId: action.parent_id&.to_s
        }
      end

      def serialize_credential(cred, reveal: false)
        data = {
          id: cred.id.to_s,
          serviceName: cred.service_name,
          username: cred.username,
          url: cred.url,
          notes: cred.notes,
          createdById: cred.created_by_id&.to_s,
          createdAt: cred.created_at&.iso8601,
          hasPassword: cred.password.present?
        }
        data[:password] = cred.password if reveal
        data
      end
    end
  end
end
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb`
Expected: 21 tests, 0 failures

- [ ] **Step 6: Run full test suite**

Run: `bin/rails test`
Expected: All pass

- [ ] **Step 7: Commit**

```bash
git add app/controllers/api/v1/guilds_controller.rb config/routes.rb test/integration/guilds_and_labs_test.rb
git commit -m "feat: add Guild API controller with CRUD, documents, tasks, and credentials endpoints"
```

---

### Task 9: Update Knowledge controllers with guild filtering

**Files:**
- Modify: `app/controllers/api/v1/knowledge/sections_controller.rb`
- Modify: `app/controllers/api/v1/knowledge/topics_controller.rb`
- Modify: `test/integration/guilds_and_labs_test.rb`

- [ ] **Step 1: Write the failing test**

Append to `test/integration/guilds_and_labs_test.rb`:

```ruby
  test 'GET knowledge sections filters by guild_id param' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    KnowledgeSection.create!(name: 'Guild Section', guild: guild)
    KnowledgeSection.find_or_create_by!(name: 'Global Section', guild_id: nil)

    # Without filter: only global sections
    get '/api/v1/knowledge/sections', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body['sections'].none? { |s| s['name'] == 'Guild Section' }

    # With guild_id filter: only guild sections
    get "/api/v1/knowledge/sections?guild_id=#{guild.id}", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body['sections'].any? { |s| s['name'] == 'Guild Section' }
  end

  test 'GET knowledge topics filters by guild_id param' do
    guild = Guild.create!(name: 'Comm', color: 'blue', guild_type: 'network')
    section = KnowledgeSection.create!(name: 'Wiki', guild: guild)
    KnowledgeTopic.create!(title: 'Guild Topic', content: 'c', status: 'published', section: section)

    global_section = KnowledgeSection.find_or_create_by!(name: 'Global Test', guild_id: nil)
    KnowledgeTopic.create!(title: 'Global Topic', content: 'c', status: 'published', section: global_section)

    # Without filter: only global topics
    get '/api/v1/knowledge/topics', as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body['topics'].none? { |t| t['title'] == 'Guild Topic' }

    # With guild_id filter: only guild topics
    get "/api/v1/knowledge/topics?guild_id=#{guild.id}", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body['topics'].any? { |t| t['title'] == 'Guild Topic' }
  end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb -n /knowledge.*filters/`
Expected: FAIL — guild sections appear in unfiltered results

- [ ] **Step 3: Update SectionsController**

In `app/controllers/api/v1/knowledge/sections_controller.rb`, change the `index` method from:

```ruby
        def index
          sections = KnowledgeSection.ordered
          render json: { sections: sections.map(&:as_json_brief) }
        end
```

to:

```ruby
        def index
          sections = if params[:guild_id].present?
                       KnowledgeSection.where(guild_id: params[:guild_id]).ordered
                     else
                       KnowledgeSection.where(guild_id: nil).ordered
                     end
          render json: { sections: sections.map(&:as_json_brief) }
        end
```

Also update `section_params` to permit `:guild_id`:

```ruby
        def section_params
          params.permit(:name, :description, :position, :guild_id)
        end
```

- [ ] **Step 4: Update TopicsController**

In `app/controllers/api/v1/knowledge/topics_controller.rb`, in the `index` method, after the `topics = topics.by_section(params[:section_id])` line (line 16), add:

```ruby
          if params[:guild_id].present?
            topics = topics.for_guild(params[:guild_id])
          else
            topics = topics.left_joins(:section).where(knowledge_sections: { guild_id: nil }).or(
              topics.left_joins(:section).where(section_id: nil)
            )
          end
```

Also update `topic_params` to permit `:guild_id` is NOT needed — topics inherit guild from their section.

- [ ] **Step 5: Run test to verify it passes**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb`
Expected: 23 tests, 0 failures

- [ ] **Step 6: Run full test suite**

Run: `bin/rails test`
Expected: All pass

- [ ] **Step 7: Commit**

```bash
git add app/controllers/api/v1/knowledge/sections_controller.rb app/controllers/api/v1/knowledge/topics_controller.rb test/integration/guilds_and_labs_test.rb
git commit -m "feat: add guild_id filtering to Knowledge API controllers"
```

---

### Task 10: Lab API endpoints

**Files:**
- Modify: `config/routes.rb`
- Modify: `app/controllers/api/v1/guilds_controller.rb` (add lab endpoints here, or create a separate labs controller)
- Modify: `test/integration/guilds_and_labs_test.rb`

- [ ] **Step 1: Write the failing test**

Append to `test/integration/guilds_and_labs_test.rb`:

```ruby
  test 'GET /api/v1/labs returns all labs' do
    Lab.delete_all
    Lab.create!(name: 'Wallonie-Bruxelles', slug: 'wallonie-bruxelles')
    Lab.create!(name: 'Île-de-France', slug: 'ile-de-france')

    get '/api/v1/labs', as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 2, body['labs'].size
  end

  test 'GET /api/v1/labs/:id returns lab with members and guilds' do
    lab = Lab.create!(name: 'Wallonie-Bruxelles', slug: 'wallonie-bruxelles')
    member = Member.first
    LabMembership.create!(lab: lab, member: member)
    Guild.create!(name: 'Design Local', color: 'green', guild_type: 'lab', lab: lab)

    get "/api/v1/labs/#{lab.id}", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 'Wallonie-Bruxelles', body['lab']['name']
    assert_equal 1, body['lab']['memberCount']
    assert_equal 1, body['lab']['guilds'].size
  end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb -n /labs/`
Expected: FAIL — routing error

- [ ] **Step 3: Create LabsController and routes**

Add to `config/routes.rb` inside the `api/v1` namespace, before the guilds routes:

```ruby
      # Labs
      get "labs", to: "labs#index"
      get "labs/:id", to: "labs#show"
      post "labs", to: "labs#create"
      patch "labs/:id", to: "labs#update"
      delete "labs/:id", to: "labs#destroy"
      post "labs/:lab_id/members", to: "labs#add_member"
      delete "labs/:lab_id/members/:member_id", to: "labs#remove_member"
```

Create `app/controllers/api/v1/labs_controller.rb`:

```ruby
# frozen_string_literal: true

module Api
  module V1
    class LabsController < BaseController
      before_action :require_effective_member
      before_action :set_lab, only: [:show, :update, :destroy, :add_member, :remove_member]

      def index
        labs = Lab.all.order(:name)
        render json: { labs: labs.map { |l| serialize_lab_brief(l) } }
      end

      def show
        render json: { lab: serialize_lab_full(@lab) }
      end

      def create
        lab = Lab.new(lab_params)
        if lab.save
          render json: { lab: serialize_lab_brief(lab) }, status: :created
        else
          render json: { errors: lab.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @lab.update(lab_params)
          render json: { lab: serialize_lab_brief(@lab) }
        else
          render json: { errors: @lab.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @lab.destroy!
        head :no_content
      end

      def add_member
        membership = @lab.lab_memberships.build(member_id: params[:member_id])
        if membership.save
          render json: { memberIds: @lab.lab_memberships.pluck(:member_id).map(&:to_s) }, status: :created
        else
          render json: { errors: membership.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def remove_member
        membership = @lab.lab_memberships.find_by!(member_id: params[:member_id])
        membership.destroy!
        head :no_content
      end

      private

      def set_lab
        @lab = Lab.find(params[:lab_id] || params[:id])
      end

      def lab_params
        params.permit(:name, :slug)
      end

      def serialize_lab_brief(lab)
        {
          id: lab.id.to_s,
          name: lab.name,
          slug: lab.slug,
          memberCount: lab.lab_memberships.count,
          guildCount: lab.guilds.count,
          createdAt: lab.created_at&.iso8601
        }
      end

      def serialize_lab_full(lab)
        serialize_lab_brief(lab).merge(
          memberIds: lab.lab_memberships.pluck(:member_id).map(&:to_s),
          guilds: lab.guilds.map do |g|
            {
              id: g.id.to_s,
              name: g.name,
              color: g.color,
              icon: g.icon,
              memberCount: g.guild_memberships.count
            }
          end
        )
      end
    end
  end
end
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bin/rails test test/integration/guilds_and_labs_test.rb`
Expected: 25 tests, 0 failures

- [ ] **Step 5: Run full test suite**

Run: `bin/rails test`
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add app/controllers/api/v1/labs_controller.rb config/routes.rb test/integration/guilds_and_labs_test.rb
git commit -m "feat: add Labs API controller with CRUD and member management"
```

---

### Task 11: Update seeds with Lab data

**Files:**
- Modify: `db/seeds.rb`

- [ ] **Step 1: Add Lab seed data**

At the top of `db/seeds.rb` (after existing setup code, before guild seeding), add:

```ruby
# === Labs ===
wallonie_lab = Lab.find_or_create_by!(slug: 'wallonie-bruxelles') do |lab|
  lab.name = 'Wallonie-Bruxelles'
end

puts "  Lab: #{wallonie_lab.name}"

# Assign all existing members to the first lab
Member.find_each do |member|
  LabMembership.find_or_create_by!(lab: wallonie_lab, member: member)
end
puts "  Assigned #{wallonie_lab.members.count} members to #{wallonie_lab.name}"
```

The migration already sets `guild_type` default to `"network"` with `null: false`, so existing guilds are automatically backfilled — no seed update needed for guild_type.

- [ ] **Step 2: Test seed runs**

Run: `bin/rails db:seed`
Expected: No errors, lab created and members assigned

- [ ] **Step 3: Commit**

```bash
git add db/seeds.rb
git commit -m "feat: seed Wallonie-Bruxelles lab and assign members"
```

---

### Task 12: Inertia page route + Guilds page component

**Files:**
- Modify: `config/routes.rb` (Inertia page route)
- Modify: `app/controllers/app_controller.rb` (Inertia action)
- Create: `app/frontend/pages/Guilds/Index.jsx`

This task uses the **@frontend-design** skill for the React UI.

- [ ] **Step 1: Add Inertia page route**

In `config/routes.rb`, in the Inertia pages section (around line 30-50), add:

```ruby
  get "guilds", to: "app#guilds"
  get "guilds/:id", to: "app#guilds"
```

- [ ] **Step 2: Add controller action**

In `app/controllers/app_controller.rb`, add:

```ruby
  def guilds
    render inertia: "Guilds/Index"
  end
```

- [ ] **Step 3: Create the Guilds page using @frontend-design skill**

Use the `frontend-design` skill to create `app/frontend/pages/Guilds/Index.jsx`.

The page needs to:
- Follow the existing AppShell pattern (auto-wrapped, uses `useShellNav`)
- Register nav sections: "Guildes Réseau" (network guilds) and "Guildes Lab" (lab guilds)
- Show a list of guilds for the active section with their name, color, icon, member count
- Click a guild → detail view showing 4 tabs: Documents, Tâches, Wiki, Credentials
- **Documents tab**: list files by tag, upload button, tag filter
- **Tâches tab**: task lists with draggable actions, add list/action buttons
- **Wiki tab**: embedded knowledge section/topic list for this guild
- **Credentials tab**: list services with show/hide password, add/edit/delete
- Use pole colors: accent `#5B5781` (lab pole color) for the guild interface
- Use lucide-react icons throughout
- Use `apiRequest()` from `app/frontend/lib/api.js` for all API calls

The guild detail component should be a side panel or full view (follow existing patterns from Lab/Index.jsx).

- [ ] **Step 4: Run dev server and verify**

Run: `bin/dev`
Navigate to `http://localhost:3000/guilds`
Expected: Page loads with guild list and navigation

- [ ] **Step 5: Commit**

```bash
git add app/frontend/pages/Guilds/ app/controllers/app_controller.rb config/routes.rb
git commit -m "feat: add Guilds Inertia page with guild management UI"
```

---

### Task 13: Update AppShell navigation

**Files:**
- Modify: `app/controllers/api/v1/foundation_controller.rb` (add guilds to shell nav)
- Modify: `app/frontend/components/shell/ContextSwitcher.jsx` or `MainNav.jsx` (if guilds need a top-level entry)

- [ ] **Step 1: Check how shell navigation is built**

Read `app/controllers/api/v1/foundation_controller.rb` to see how navigation items are defined and how they relate to the ContextSwitcher.

- [ ] **Step 2: Add Guilds entry to navigation**

In the foundation controller's shell data, add a guilds navigation entry:

```ruby
{
  id: 'guilds',
  label: 'Guildes',
  path: '/guilds',
  icon: 'users'
}
```

The exact location depends on how the shell nav is structured (check the controller).

- [ ] **Step 3: Verify navigation works**

Run: `bin/dev`
Expected: "Guildes" appears in the navigation, clicking it goes to `/guilds`

- [ ] **Step 4: Commit**

```bash
git add app/controllers/api/v1/foundation_controller.rb
git commit -m "feat: add Guildes to shell navigation"
```

---

### Task 14: Update API reference files

**Files:**
- Create/Modify: `~/.claude/skills/terranova-api/api-reference/guilds.md`
- Create/Modify: `~/.claude/skills/terranova-api/api-reference/labs.md`

Per CLAUDE.md convention: "When adding/modifying API endpoints in `app/controllers/api/v1/`, update the corresponding reference file."

- [ ] **Step 1: Create guilds API reference**

Create `~/.claude/skills/terranova-api/api-reference/guilds.md` documenting all guild endpoints:
- `GET /api/v1/guilds` — list guilds (optional filters: guild_type, lab_id)
- `GET /api/v1/guilds/:id` — show guild with all associations
- `POST /api/v1/guilds` — create guild
- `PATCH /api/v1/guilds/:id` — update guild
- `DELETE /api/v1/guilds/:id` — delete guild
- Document sub-resources: documents, task-lists, actions, credentials, members

- [ ] **Step 2: Create labs API reference**

Create `~/.claude/skills/terranova-api/api-reference/labs.md` documenting all lab endpoints.

- [ ] **Step 3: Commit**

```bash
git add ~/.claude/skills/terranova-api/api-reference/guilds.md ~/.claude/skills/terranova-api/api-reference/labs.md
git commit -m "docs: add API reference for guilds and labs endpoints"
```

---

### Task 15: Final verification

- [ ] **Step 1: Run full test suite**

Run: `bin/rails test`
Expected: All tests pass (existing + new)

- [ ] **Step 2: Run dev server and smoke test**

Run: `bin/dev`

Manual checks:
1. Navigate to `/guilds` — page loads
2. Create a network guild — appears in list
3. Open guild detail — 4 tabs visible
4. Upload a document with tags — appears in Documents tab
5. Create a task list with actions — appears in Tâches tab
6. Create a credential — password masked, can reveal
7. Navigate to `/lab` — existing guild display still works
8. Navigate to Knowledge Base — only global topics/sections appear (no guild content leaking)

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address smoke test findings"
```
