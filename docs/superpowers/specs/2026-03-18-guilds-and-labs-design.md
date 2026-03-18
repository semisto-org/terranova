# Guilds & Labs — Data Model Design

## Context

Semisto is evolving from a single Lab (Wallonie-Bruxelles) to a network of Labs across Europe. Each Lab operates autonomously but shares transversal services ("Guildes Transversales") managed at the network level. This design introduces the multi-Lab model and enriches guilds with collaboration tools: reference files, task lists, a wiki, and encrypted credentials.

## Prerequisites

**ActiveRecord::Encryption setup** (first-time in this project):
1. Run `bin/rails db:encryption:init` to generate encryption keys
2. Add the generated keys to `config/credentials.yml.enc` via `bin/rails credentials:edit`
3. Keys needed: `active_record_encryption.primary_key`, `deterministic_key`, `key_derivation_salt`

This must be completed before the `Credential` model can function.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multi-Lab membership | A member can belong to multiple Labs | Flexibility for cross-lab contributors |
| Guild structure | Unified model with `guild_type` field | Avoid duplication; Lab Guilds and Network Guilds share the same rich feature set |
| Approach | Evolve existing `Guild` model | Continuity, minimal disruption, progressive migration |
| Files | Upload in-app (ActiveStorage) | Full control, no external dependency |
| Wiki | Reuse existing Knowledge system | Avoid code duplication; proven feature set with revisions, tags, comments |
| Tasks | Reuse existing TaskList/Action | Already flexible with optional parent associations |
| Credentials | Encrypted via ActiveRecord::Encryption | Rails-native, transparent encrypt/decrypt, coffre-fort level security |
| Permissions | All guild members equal | Leader is a reference role only, no permission hierarchy |

## Data Model

### New Model: `Lab`

```
labs
├── id            (bigint, PK)
├── name          (string, required)
├── slug          (string, unique, required)
├── created_at
├── updated_at
```

**Model:** `app/models/lab.rb`
- `has_many :lab_memberships, dependent: :destroy`
- `has_many :members, through: :lab_memberships`
- `has_many :guilds` (where guild_type: "lab")
- `validates :name, :slug, presence: true`
- `validates :slug, uniqueness: true`

### New Join Table: `lab_memberships`

```
lab_memberships
├── id            (bigint, PK)
├── lab_id        (FK → labs, required, indexed)
├── member_id     (FK → members, required, indexed)
├── created_at
├── updated_at
└── unique index on (lab_id, member_id)
```

**Model:** `app/models/lab_membership.rb`
- `belongs_to :lab`
- `belongs_to :member`
- `validates :member_id, uniqueness: { scope: :lab_id }`

### Modified Model: `Guild`

**New columns on `guilds` table:**

| Column | Type | Default | Index | Notes |
|--------|------|---------|-------|-------|
| `guild_type` | string | `"network"` | yes | `"lab"` or `"network"` (named `guild_type` to avoid conflict with ActiveRecord's `scope` class method) |
| `lab_id` | bigint (FK) | NULL | yes | Required when guild_type="lab", NULL when guild_type="network" |
| `icon` | string | NULL | — | Lucide-react icon identifier |

**Model changes** (`app/models/guild.rb`):
- Add `belongs_to :lab, optional: true`
- Add `has_many :documents, class_name: "GuildDocument", dependent: :destroy`
- Add `has_many :task_lists, dependent: :destroy`
- Add `has_many :knowledge_sections, class_name: "KnowledgeSection", dependent: :nullify`
- Add `has_many :credentials, dependent: :destroy`
- Add `GUILD_TYPES = %w[lab network].freeze`
- Add validation: `validates :guild_type, inclusion: { in: GUILD_TYPES }`
- Add validation: `validates :lab_id, presence: true, if: -> { guild_type == "lab" }`
- Add scopes: `scope :lab_guilds, -> { where(guild_type: "lab") }` and `scope :network_guilds, -> { where(guild_type: "network") }`

**`dependent: :nullify` rationale for knowledge:** When a guild is deleted, its wiki content is preserved as global entries (guild_id set to NULL) rather than destroyed. This prevents accidental knowledge loss if a guild is reorganized or dissolved.

**Migration of existing data:** All current guilds receive `guild_type = "network"`, `lab_id = NULL`.

### New Model: `GuildDocument`

```
guild_documents
├── id              (bigint, PK)
├── guild_id        (FK → guilds, required, indexed)
├── uploaded_by_id  (FK → members, indexed)
├── name            (string, required)
├── tags            (jsonb, default: [])
├── created_at
├── updated_at
└── ActiveStorage: has_one_attached :file
```

**Model:** `app/models/guild_document.rb`
- `belongs_to :guild`
- `belongs_to :uploader, class_name: "Member", foreign_key: :uploaded_by_id, optional: true`
- `has_one_attached :file`
- `validates :name, presence: true`
- `validates :file, presence: true`
- `scope :by_tag, ->(tag) { where("tags::text ILIKE ?", "%#{tag}%") if tag.present? }`

Tag pattern reused from `KnowledgeTopic`.

### Modified Model: `TaskList`

**New column on `task_lists` table:**

| Column | Type | Index | Notes |
|--------|------|-------|-------|
| `guild_id` | bigint (FK) | yes | Nullable, same pattern as existing `pole_project_id` and `training_id` |

**Model changes** (`app/models/task_list.rb`):
- Add `belongs_to :guild, optional: true`

### Modified Model: `Action`

**New column on `actions` table:**

| Column | Type | Index | Notes |
|--------|------|-------|-------|
| `guild_id` | bigint (FK) | yes | Nullable, same pattern as existing `pole_project_id` and `training_id` |

**Model changes** (`app/models/action.rb`):
- Add `belongs_to :guild, optional: true`

### Modified Model: `KnowledgeSection`

**New column on `knowledge_sections` table:**

| Column | Type | Index | Notes |
|--------|------|-------|-------|
| `guild_id` | bigint (FK) | yes | Nullable. NULL = global section (current behavior) |

**Database index:** `add_index :knowledge_sections, [:guild_id, :name], unique: true` — enforces name uniqueness per guild at the DB level (two guilds can have a section named "Ressources").

**Model changes** (`app/models/knowledge_section.rb`):
- Add `belongs_to :guild, optional: true`
- Change uniqueness validation: `validates :name, presence: true, uniqueness: { scope: :guild_id }`

### Modified Model: `KnowledgeTopic`

Knowledge topics inherit their guild association from their section. No direct `guild_id` column on `knowledge_topics` — the guild is determined via `topic.section.guild`. This avoids inconsistency between a topic's guild and its section's guild.

**Model changes** (`app/models/knowledge_topic.rb`):
- Add delegate: `delegate :guild, to: :section, allow_nil: true`
- Add scope: `scope :for_guild, ->(guild_id) { joins(:section).where(knowledge_sections: { guild_id: guild_id }) }`

### New Model: `Credential`

Named generically for future reuse beyond guilds.

```
credentials
├── id              (bigint, PK)
├── guild_id        (FK → guilds, required, indexed)
├── service_name    (string, required)        — e.g. "Canva", "Google Workspace"
├── username        (string, encrypted)       — ActiveRecord::Encryption
├── password        (string, encrypted)       — ActiveRecord::Encryption
├── url             (string)                  — login URL (not encrypted)
├── notes           (text, encrypted)         — ActiveRecord::Encryption
├── created_by_id   (FK → members, indexed)
├── created_at
├── updated_at
```

**Model:** `app/models/credential.rb`
- `belongs_to :guild`
- `belongs_to :creator, class_name: "Member", foreign_key: :created_by_id, optional: true`
- `encrypts :username, :password, :notes`
- `validates :service_name, presence: true`

### Modified Model: `Member`

**New associations:**
- `has_many :lab_memberships, dependent: :destroy`
- `has_many :labs, through: :lab_memberships`

## Entity Relationship Summary

```
Lab ──< lab_memberships >── Member
 |                            |
 └──< Guild (guild_type=lab)  └──< guild_memberships >── Guild (any type)
                                                          |
                                                          ├──< GuildDocument (files + tags)
                                                          ├──< TaskList ──< Action
                                                          ├──< KnowledgeSection ──< KnowledgeTopic
                                                          └──< Credential (encrypted)
```

All features (documents, tasks, wiki, credentials) are available to **both** Lab Guilds and Network Guilds.

## Files to Create

| File | Description |
|------|-------------|
| `app/models/lab.rb` | Lab model |
| `app/models/lab_membership.rb` | Lab-Member join model |
| `app/models/guild_document.rb` | Guild file reference model |
| `app/models/credential.rb` | Encrypted credential model |
| `db/migrate/XXX_create_labs.rb` | Labs + lab_memberships tables |
| `db/migrate/XXX_add_guild_type_and_lab_to_guilds.rb` | guild_type, lab_id, icon columns on guilds |
| `db/migrate/XXX_create_guild_documents.rb` | guild_documents table |
| `db/migrate/XXX_add_guild_id_to_task_lists_and_actions.rb` | guild_id on task_lists and actions |
| `db/migrate/XXX_add_guild_id_to_knowledge_sections.rb` | guild_id on knowledge_sections with composite unique index |
| `db/migrate/XXX_create_credentials.rb` | credentials table with encrypted columns |

## Files to Modify

| File | Change |
|------|--------|
| `app/models/guild.rb` | Add guild_type, lab, icon; new associations and validations |
| `app/models/member.rb` | Add lab associations |
| `app/models/task_list.rb` | Add `belongs_to :guild, optional: true` |
| `app/models/action.rb` | Add `belongs_to :guild, optional: true` |
| `app/models/knowledge_section.rb` | Add `belongs_to :guild, optional: true`; scope uniqueness by guild_id |
| `app/models/knowledge_topic.rb` | Add `delegate :guild` from section; add `for_guild` scope |
| `app/controllers/api/v1/knowledge/sections_controller.rb` | Add guild_id filtering: `where(guild_id: nil)` for global view, or accept `guild_id` param |
| `app/controllers/api/v1/knowledge/topics_controller.rb` | Add guild_id filtering to prevent guild topics leaking into global knowledge base |

## Verification

1. **Encryption setup:** Run `bin/rails db:encryption:init` and add keys to credentials
2. **Run migrations:** `bin/rails db:migrate`
3. **Verify in Rails console:**
   - Create a Lab, assign members via LabMembership
   - Create a Network Guild (`guild_type: "network"`) and a Lab Guild (`guild_type: "lab"`, with lab_id)
   - Add documents, task lists, knowledge sections, and credentials to a guild
   - Verify credential encryption: `Credential.last.password_before_type_cast` should show ciphertext
   - Verify knowledge scoping: `KnowledgeSection.where(guild_id: nil)` returns only global sections
4. **Run existing tests:** `bin/rails test` — all must pass (no breaking changes)
5. **Verify Knowledge uniqueness:** two guilds can each have a section named "Ressources"
