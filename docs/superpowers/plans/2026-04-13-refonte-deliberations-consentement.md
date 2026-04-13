# Refonte Délibérations Consentement — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le workflow de délibérations ad-hoc par un processus de consentement en phases temporelles (draft → open 15 j → voting 7 j extensible → outcome_pending → decided), restreint aux membres effectifs, avec historique de versions de proposition et transitions automatisées via rake task.

**Architecture:** Phase-based state machine sur `Strategy::Deliberation`. Nouveau modèle `Strategy::ProposalVersion` pour l'historique. Suppression de `decision_mode`, `abstain`, `amendment`. Garde `effective?` centralisée via `Member#can_access_strategy?`. Rake task déclenchée par cron Hatchbox toutes les 10 min. Frontend React refondu avec barre de phases, commentaires groupés par phase, panneau d'historique.

**Tech Stack:** Rails 8.1.2, PostgreSQL, Minitest, React 18 via Inertia.js, Tailwind CSS 4, lucide-react.

**Spec:** `docs/superpowers/specs/2026-04-13-refonte-deliberations-consentement-design.md`

---

## Carte des fichiers

### Fichiers créés
- `db/migrate/YYYYMMDDHHMMSS_refonte_strategy_deliberations.rb`
- `app/models/strategy/proposal_version.rb`
- `lib/tasks/strategy.rake`
- `test/models/strategy/deliberation_test.rb`
- `test/models/strategy/proposal_test.rb`
- `test/models/strategy/reaction_test.rb`
- `test/tasks/strategy_rake_test.rb`

### Fichiers modifiés
- `db/schema.rb` (auto-généré par la migration)
- `db/migrate/20260413112303_allow_multiple_amendment_reactions.rb` (supprimé)
- `app/models/member.rb`
- `app/models/strategy/deliberation.rb`
- `app/models/strategy/proposal.rb`
- `app/models/strategy/reaction.rb`
- `app/models/strategy/deliberation_comment.rb`
- `app/controllers/api/v1/base_controller.rb`
- `app/controllers/api/v1/strategy/deliberations_controller.rb`
- `app/controllers/app_controller.rb`
- `config/routes.rb`
- `app/frontend/components/shell/ContextSwitcher.jsx`
- `app/frontend/pages/Strategy/Index.jsx`
- `test/integration/strategy_test.rb`

---

### Task 1: Nettoyage du working tree

**Context:** Le working tree contient du travail en cours (migration `allow_multiple_amendment_reactions` + modifs dans le modèle Reaction/contrôleur/frontend) qui contredit la nouvelle refonte. On repart d'une base propre.

**Files:**
- Restaurer : `app/controllers/api/v1/strategy/deliberations_controller.rb`, `app/models/strategy/reaction.rb`, `app/frontend/pages/Strategy/Index.jsx`, `db/schema.rb`
- Supprimer : `db/migrate/20260413112303_allow_multiple_amendment_reactions.rb`

- [ ] **Step 1: Restaurer les fichiers modifiés liés à la refonte**

```bash
git restore app/controllers/api/v1/strategy/deliberations_controller.rb
git restore app/models/strategy/reaction.rb
git restore app/frontend/pages/Strategy/Index.jsx
git restore db/schema.rb
```

- [ ] **Step 2: Supprimer la migration non committée**

```bash
rm db/migrate/20260413112303_allow_multiple_amendment_reactions.rb
```

- [ ] **Step 3: Vérifier l'état**

```bash
git status --short | grep -E "strategy|schema|migrate/2026"
```

Expected : aucune sortie pour ces fichiers (le reste — `.a5c/*`, `public/vite/*` — est ignoré pour ce plan).

- [ ] **Step 4: Pas de commit à ce stade**

Le nettoyage est une préparation. On enchaîne directement sur la Task 2.

---

### Task 2: Migration DB — schémas de délibérations, propositions, versions, réactions, commentaires

**Context:** Une seule migration atomique pour toutes les modifications DB. Tous les statuts existants de délibérations sont basculés vers `draft`. Les réactions `abstain`/`amendment` sont supprimées. L'index unique sur les réactions revient à sa forme simple (sans exception pour amendment).

**Files:**
- Create: `db/migrate/YYYYMMDDHHMMSS_refonte_strategy_deliberations.rb`
- Modify: `db/schema.rb` (auto-généré)

- [ ] **Step 1: Générer le squelette de migration**

```bash
bin/rails generate migration RefonteStrategyDeliberations
```

Noter le chemin du fichier créé (avec timestamp). Pour la suite on l'appelle `<migration_file>`.

- [ ] **Step 2: Écrire le contenu de la migration**

Remplacer le contenu du fichier par :

```ruby
class RefonteStrategyDeliberations < ActiveRecord::Migration[8.1]
  def up
    # --- strategy_deliberations ---
    add_column :strategy_deliberations, :opened_at, :datetime
    add_column :strategy_deliberations, :voting_started_at, :datetime
    add_column :strategy_deliberations, :voting_deadline, :datetime

    change_column_default :strategy_deliberations, :status, from: "open", to: "draft"
    execute "UPDATE strategy_deliberations SET status = 'draft'"

    remove_column :strategy_deliberations, :decision_mode

    # --- strategy_proposals ---
    add_column :strategy_proposals, :version, :integer, default: 1, null: false
    remove_column :strategy_proposals, :status

    # Deduplicate proposals per deliberation (keep the oldest)
    execute <<~SQL
      DELETE FROM strategy_proposals
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
                 ROW_NUMBER() OVER (PARTITION BY deliberation_id ORDER BY created_at ASC, id ASC) AS rn
          FROM strategy_proposals
        ) ranked
        WHERE rn > 1
      )
    SQL

    if index_exists?(:strategy_proposals, :deliberation_id, name: "index_strategy_proposals_on_deliberation_id")
      remove_index :strategy_proposals, name: "index_strategy_proposals_on_deliberation_id"
    end
    add_index :strategy_proposals, :deliberation_id, unique: true,
      name: "index_strategy_proposals_on_deliberation_id_unique"

    # --- strategy_proposal_versions (new) ---
    create_table :strategy_proposal_versions do |t|
      t.references :proposal, null: false,
        foreign_key: { to_table: :strategy_proposals, on_delete: :cascade }
      t.integer :version, null: false
      t.text :content, null: false
      t.datetime :created_at, null: false
      t.index [:proposal_id, :version], unique: true,
        name: "index_strategy_proposal_versions_unique"
    end

    # Backfill: create v1 for every existing proposal
    execute <<~SQL
      INSERT INTO strategy_proposal_versions (proposal_id, version, content, created_at)
      SELECT id, 1, content, created_at FROM strategy_proposals
    SQL

    # --- strategy_reactions ---
    execute "DELETE FROM strategy_reactions WHERE position IN ('abstain', 'amendment')"

    # Revert to simple unique index on [proposal_id, member_id]
    if index_exists?(:strategy_reactions, [:proposal_id, :member_id], name: "index_strategy_reactions_unique_non_amendment")
      remove_index :strategy_reactions, name: "index_strategy_reactions_unique_non_amendment"
    end
    if index_exists?(:strategy_reactions, [:proposal_id, :member_id], name: "index_strategy_reactions_on_proposal_id_and_member_id")
      remove_index :strategy_reactions, name: "index_strategy_reactions_on_proposal_id_and_member_id"
    end
    add_index :strategy_reactions, [:proposal_id, :member_id], unique: true,
      name: "index_strategy_reactions_on_proposal_id_and_member_id"

    # --- strategy_deliberation_comments ---
    add_column :strategy_deliberation_comments, :phase_at_creation, :string,
      null: false, default: "draft"
  end

  def down
    remove_column :strategy_deliberation_comments, :phase_at_creation

    remove_index :strategy_reactions, name: "index_strategy_reactions_on_proposal_id_and_member_id"
    add_index :strategy_reactions, [:proposal_id, :member_id], unique: true,
      where: "position != 'amendment'",
      name: "index_strategy_reactions_unique_non_amendment"

    drop_table :strategy_proposal_versions

    remove_index :strategy_proposals, name: "index_strategy_proposals_on_deliberation_id_unique"
    add_index :strategy_proposals, :deliberation_id,
      name: "index_strategy_proposals_on_deliberation_id"

    add_column :strategy_proposals, :status, :string, default: "pending"
    remove_column :strategy_proposals, :version

    add_column :strategy_deliberations, :decision_mode, :string, default: "consent"
    change_column_default :strategy_deliberations, :status, from: "draft", to: "open"
    remove_column :strategy_deliberations, :voting_deadline
    remove_column :strategy_deliberations, :voting_started_at
    remove_column :strategy_deliberations, :opened_at
  end
end
```

- [ ] **Step 3: Exécuter la migration**

```bash
bin/rails db:migrate
```

Expected output: `== RefonteStrategyDeliberations: migrating` … `migrated`.

- [ ] **Step 4: Vérifier que `db/schema.rb` reflète les changements**

```bash
grep -A 20 'create_table "strategy_deliberations"' db/schema.rb
```

Expected : `opened_at`, `voting_started_at`, `voting_deadline` présents, `decision_mode` absent, `status` avec `default: "draft"`.

- [ ] **Step 5: Rollback + migrate à blanc pour valider la réversibilité**

```bash
bin/rails db:rollback && bin/rails db:migrate
```

Expected : les deux passes réussissent sans erreur.

- [ ] **Step 6: Commit**

```bash
git add db/migrate/*refonte_strategy_deliberations.rb db/schema.rb
git commit -m "feat(strategy): migration schéma pour workflow consentement en phases"
```

---

### Task 3: `Member#can_access_strategy?` helper

**Context:** Centralisation de la règle d'accès à Stratego (effective uniquement) dans le modèle Member pour éviter la duplication dans contrôleurs et frontend.

**Files:**
- Modify: `app/models/member.rb`
- Create ou Modify: `test/models/member_test.rb`

- [ ] **Step 1: Vérifier l'existence du test Member**

```bash
ls test/models/member_test.rb
```

Si absent, le créer avec :

```ruby
require "test_helper"

class MemberTest < ActiveSupport::TestCase
end
```

- [ ] **Step 2: Écrire le test qui échoue**

Ajouter dans `test/models/member_test.rb` (à l'intérieur de la classe `MemberTest`) :

```ruby
  test "can_access_strategy? returns true for effective members" do
    m = Member.new(membership_type: "effective")
    assert m.can_access_strategy?
  end

  test "can_access_strategy? returns false for adherent members" do
    m = Member.new(membership_type: "adherent")
    assert_not m.can_access_strategy?
  end

  test "can_access_strategy? returns false for non_member" do
    m = Member.new(membership_type: "non_member")
    assert_not m.can_access_strategy?
  end
```

- [ ] **Step 3: Exécuter le test et vérifier qu'il échoue**

```bash
bin/rails test test/models/member_test.rb -v
```

Expected: FAIL avec `NoMethodError: undefined method 'can_access_strategy?'`.

- [ ] **Step 4: Implémenter la méthode dans `app/models/member.rb`**

Ajouter après la méthode `non_member?` :

```ruby
  def can_access_strategy?
    effective?
  end
```

- [ ] **Step 5: Exécuter le test et vérifier qu'il passe**

```bash
bin/rails test test/models/member_test.rb -v
```

Expected: 3 tests, 3 assertions, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add app/models/member.rb test/models/member_test.rb
git commit -m "feat(member): add can_access_strategy? helper"
```

---

### Task 4: Surcharge de `test_member` dans `Api::V1::BaseController`

**Context:** Les tests d'intégration Strategy vont devoir alterner entre membres `effective`, `adherent` et `non_member` pour valider la garde. Comme `test_member` utilise actuellement `Member.find_by(is_admin: true) || Member.first`, on ajoute une surcharge via `Thread.current` qui reste rétrocompatible.

**Files:**
- Modify: `app/controllers/api/v1/base_controller.rb`
- Create: `test/integration/base_controller_test_member_override_test.rb`

- [ ] **Step 1: Écrire un test qui échoue**

Créer `test/integration/base_controller_test_member_override_test.rb` :

```ruby
require "test_helper"

class BaseControllerTestMemberOverrideTest < ActionDispatch::IntegrationTest
  test "test_member picks up Thread.current override" do
    original = Member.find_by(is_admin: true) || Member.first
    other = Member.where.not(id: original.id).first
    skip "need at least 2 members" unless other

    Thread.current[:test_member] = other
    begin
      get "/api/v1/profile", as: :json
      assert_response :success
      body = JSON.parse(response.body)
      assert_equal other.id, body.dig("profile", "id").to_i
    ensure
      Thread.current[:test_member] = nil
    end
  end
end
```

- [ ] **Step 2: Exécuter le test et vérifier qu'il échoue**

```bash
bin/rails test test/integration/base_controller_test_member_override_test.rb -v
```

Expected: FAIL (le test renvoie l'id du premier admin, pas celui de `other`).

- [ ] **Step 3: Modifier `test_member` dans `app/controllers/api/v1/base_controller.rb`**

Remplacer la méthode `test_member` par :

```ruby
      def test_member
        return nil unless Rails.env.test?

        Thread.current[:test_member] || Member.find_by(is_admin: true) || Member.first
      end
```

- [ ] **Step 4: Vérifier que le test passe**

```bash
bin/rails test test/integration/base_controller_test_member_override_test.rb -v
```

Expected: PASS.

- [ ] **Step 5: Non-régression globale sur l'intégration**

```bash
bin/rails test test/integration/
```

Expected: aucun test ne régresse.

- [ ] **Step 6: Commit**

```bash
git add app/controllers/api/v1/base_controller.rb test/integration/base_controller_test_member_override_test.rb
git commit -m "test: allow Thread.current[:test_member] override in BaseController"
```

---

### Task 5: Modèle `Strategy::ProposalVersion`

**Context:** Nouveau modèle read-only pour l'historique des versions de proposition.

**Files:**
- Create: `app/models/strategy/proposal_version.rb`

- [ ] **Step 1: Créer le fichier modèle**

Créer `app/models/strategy/proposal_version.rb` :

```ruby
# frozen_string_literal: true

module Strategy
  class ProposalVersion < ApplicationRecord
    self.table_name = "strategy_proposal_versions"

    belongs_to :proposal, class_name: "Strategy::Proposal"

    validates :version, presence: true, numericality: { only_integer: true, greater_than: 0 }
    validates :content, presence: true

    scope :chronological, -> { order(:version) }

    def as_json_brief
      {
        id: id,
        proposalId: proposal_id,
        version: version,
        content: content,
        createdAt: created_at&.iso8601
      }
    end
  end
end
```

- [ ] **Step 2: Vérifier le chargement du modèle**

```bash
bin/rails runner 'puts Strategy::ProposalVersion.count'
```

Expected: un entier (0 ou plus, selon le backfill de la Task 2).

- [ ] **Step 3: Commit**

```bash
git add app/models/strategy/proposal_version.rb
git commit -m "feat(strategy): add ProposalVersion model"
```

---

### Task 6: `Strategy::Deliberation` — nouveaux statuts et transitions

**Context:** Migration du modèle vers le nouveau workflow.

**Files:**
- Create: `test/models/strategy/deliberation_test.rb`
- Modify: `app/models/strategy/deliberation.rb`

- [ ] **Step 1: Créer le répertoire de tests**

```bash
mkdir -p test/models/strategy
```

- [ ] **Step 2: Écrire les tests de transitions**

Créer `test/models/strategy/deliberation_test.rb` :

```ruby
require "test_helper"

class Strategy::DeliberationTest < ActiveSupport::TestCase
  setup do
    Strategy::Reaction.delete_all
    Strategy::ProposalVersion.delete_all
    Strategy::Proposal.delete_all
    Strategy::DeliberationComment.delete_all
    Strategy::Deliberation.delete_all
    @member = Member.first || Member.create!(
      first_name: "Test", last_name: "User", email: "test@semisto.org",
      status: "active", joined_at: Date.today, password: "terranova2026"
    )
  end

  test "default status is draft" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id)
    assert_equal "draft", delib.status
  end

  test "STATUSES contains the six phase values" do
    assert_equal %w[draft open voting outcome_pending decided cancelled], Strategy::Deliberation::STATUSES
  end

  test "publish! sets status to open and opened_at" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id)
    delib.proposals.create!(content: "<p>Proposition</p>", author: @member)
    freeze_time = Time.zone.parse("2026-04-13 10:00:00")
    travel_to(freeze_time) do
      delib.publish!
    end
    assert_equal "open", delib.status
    assert_equal freeze_time, delib.opened_at
  end

  test "publish! raises when no proposal exists" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id)
    assert_raises(RuntimeError) { delib.publish! }
  end

  test "transition_to_voting! sets status, voting_started_at and voting_deadline" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id, status: "open")
    freeze_time = Time.zone.parse("2026-04-28 10:00:00")
    travel_to(freeze_time) do
      delib.transition_to_voting!
    end
    assert_equal "voting", delib.status
    assert_equal freeze_time, delib.voting_started_at
    assert_equal freeze_time + 7.days, delib.voting_deadline
  end

  test "transition_to_outcome_pending! sets status" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id, status: "voting")
    delib.transition_to_outcome_pending!
    assert_equal "outcome_pending", delib.status
  end

  test "extend_voting! resets voting_deadline to now + 7 days" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id, status: "voting")
    freeze_time = Time.zone.parse("2026-05-01 10:00:00")
    travel_to(freeze_time) do
      delib.extend_voting!
    end
    assert_equal freeze_time + 7.days, delib.voting_deadline
  end

  test "cancel! sets status to cancelled" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id, status: "open")
    delib.cancel!
    assert_equal "cancelled", delib.status
  end

  test "cancel! raises when deliberation is already decided" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id, status: "decided")
    assert_raises(RuntimeError) { delib.cancel! }
  end

  test "visible_to hides other members' drafts" do
    other = Member.create!(
      first_name: "Other", last_name: "User", email: "other@semisto.org",
      status: "active", joined_at: Date.today, password: "terranova2026"
    )
    mine = Strategy::Deliberation.create!(title: "Mine draft", created_by_id: @member.id, status: "draft")
    theirs = Strategy::Deliberation.create!(title: "Theirs draft", created_by_id: other.id, status: "draft")
    shared = Strategy::Deliberation.create!(title: "Open to all", created_by_id: other.id, status: "open")

    visible = Strategy::Deliberation.visible_to(@member).pluck(:id)
    assert_includes visible, mine.id
    assert_not_includes visible, theirs.id
    assert_includes visible, shared.id
  end

  test "discussion_deadline is opened_at + 15 days" do
    opened = Time.zone.parse("2026-04-13 10:00:00")
    delib = Strategy::Deliberation.create!(
      title: "Sujet", created_by_id: @member.id, status: "open", opened_at: opened
    )
    assert_equal opened + 15.days, delib.discussion_deadline
  end
end
```

- [ ] **Step 3: Exécuter les tests et vérifier qu'ils échouent**

```bash
bin/rails test test/models/strategy/deliberation_test.rb -v
```

Expected: `STATUSES` contient les anciennes valeurs, pas de méthodes `publish!`, etc. → plusieurs échecs.

- [ ] **Step 4: Réécrire `app/models/strategy/deliberation.rb`**

Remplacer le contenu du fichier par :

```ruby
# frozen_string_literal: true

module Strategy
  class Deliberation < ApplicationRecord
    self.table_name = "strategy_deliberations"

    STATUSES = %w[draft open voting outcome_pending decided cancelled].freeze

    belongs_to :creator, class_name: "Member", foreign_key: :created_by_id, optional: true

    has_many :proposals, class_name: "Strategy::Proposal", foreign_key: :deliberation_id, dependent: :destroy
    has_many :comments, class_name: "Strategy::DeliberationComment", foreign_key: :deliberation_id, dependent: :destroy

    validates :title, presence: true
    validates :status, presence: true, inclusion: { in: STATUSES }

    scope :by_status, ->(status) { where(status: status) if status.present? }
    scope :search, ->(query) {
      where("title ILIKE :q OR context ILIKE :q", q: "%#{query}%") if query.present?
    }
    scope :visible_to, ->(member) {
      member_id = member&.id
      where("status != 'draft' OR created_by_id = ?", member_id)
    }

    def publish!
      raise "Cannot publish without a proposal" unless can_publish?
      update!(status: "open", opened_at: Time.current)
    end

    def transition_to_voting!
      now = Time.current
      update!(status: "voting", voting_started_at: now, voting_deadline: now + 7.days)
    end

    def transition_to_outcome_pending!
      update!(status: "outcome_pending")
    end

    def extend_voting!
      update!(voting_deadline: Time.current + 7.days)
    end

    def cancel!
      raise "Cannot cancel a decided deliberation" if status == "decided"
      update!(status: "cancelled")
    end

    def can_publish?
      status == "draft" && proposals.any?
    end

    def discussion_deadline
      raise "opened_at is not set" unless opened_at
      opened_at + 15.days
    end

    def as_json_brief
      {
        id: id,
        title: title,
        status: status,
        proposalCount: proposals.count,
        commentCount: comments.count,
        reactionsSummary: reactions_summary,
        createdById: created_by_id,
        creatorName: creator ? "#{creator.first_name} #{creator.last_name}" : nil,
        creatorAvatar: creator&.avatar_url,
        openedAt: opened_at&.iso8601,
        votingStartedAt: voting_started_at&.iso8601,
        votingDeadline: voting_deadline&.iso8601,
        decidedAt: decided_at&.iso8601,
        createdAt: created_at&.iso8601,
        updatedAt: updated_at&.iso8601
      }
    end

    def as_json_full
      as_json_brief.merge(
        context: context,
        outcome: outcome,
        proposals: proposals.includes(:author, reactions: :member).order(:created_at).map(&:as_json_full),
        commentsByPhase: comments_grouped_by_phase
      )
    end

    private

    def reactions_summary
      counts = Strategy::Reaction
        .where(proposal_id: proposals.select(:id))
        .group(:position)
        .count
      { consent: counts["consent"] || 0, objection: counts["objection"] || 0 }
    end

    def comments_grouped_by_phase
      grouped = comments.includes(:author).order(:created_at).group_by(&:phase_at_creation)
      STATUSES.each_with_object({}) do |phase, acc|
        acc[phase] = (grouped[phase] || []).map(&:as_json_brief)
      end
    end
  end
end
```

- [ ] **Step 5: Exécuter les tests et vérifier qu'ils passent**

```bash
bin/rails test test/models/strategy/deliberation_test.rb -v
```

Expected: 11 runs, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add app/models/strategy/deliberation.rb test/models/strategy/deliberation_test.rb
git commit -m "feat(strategy): phase-based state machine for Deliberation"
```

---

### Task 7: `Strategy::Proposal` — versionning + unicité par délibération

**Context:** Ajoute le suivi de version et le callback de création de `ProposalVersion` v1. La méthode `record_new_version!` est atomique.

**Files:**
- Create: `test/models/strategy/proposal_test.rb`
- Modify: `app/models/strategy/proposal.rb`

- [ ] **Step 1: Écrire les tests du modèle Proposal**

Créer `test/models/strategy/proposal_test.rb` :

```ruby
require "test_helper"

class Strategy::ProposalTest < ActiveSupport::TestCase
  setup do
    Strategy::Reaction.delete_all
    Strategy::ProposalVersion.delete_all
    Strategy::Proposal.delete_all
    Strategy::Deliberation.delete_all
    @member = Member.first || Member.create!(
      first_name: "Test", last_name: "User", email: "test@semisto.org",
      status: "active", joined_at: Date.today, password: "terranova2026"
    )
    @delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id)
  end

  test "creating a proposal records version 1 automatically" do
    proposal = @delib.proposals.create!(content: "<p>Version 1 content</p>", author: @member)
    assert_equal 1, proposal.version
    assert_equal 1, proposal.versions.count
    v1 = proposal.versions.first
    assert_equal 1, v1.version
    assert_equal "<p>Version 1 content</p>", v1.content
  end

  test "record_new_version! increments version, creates ProposalVersion, updates content" do
    proposal = @delib.proposals.create!(content: "<p>Version 1</p>", author: @member)
    proposal.record_new_version!("<p>Version 2</p>")

    proposal.reload
    assert_equal 2, proposal.version
    assert_equal "<p>Version 2</p>", proposal.content
    assert_equal 2, proposal.versions.count
    assert_equal ["<p>Version 1</p>", "<p>Version 2</p>"], proposal.versions.chronological.map(&:content)
  end

  test "only one proposal allowed per deliberation" do
    @delib.proposals.create!(content: "<p>Première</p>", author: @member)
    duplicate = @delib.proposals.build(content: "<p>Deuxième</p>", author: @member)
    assert_not duplicate.save
    assert_includes duplicate.errors.full_messages.to_s.downcase, "deliberation"
  end

  test "record_new_version! rolls back on uniqueness conflict" do
    proposal = @delib.proposals.create!(content: "<p>Initial</p>", author: @member)
    Strategy::ProposalVersion.create!(proposal: proposal, version: 2, content: "<p>Conflict</p>")

    assert_raises(ActiveRecord::RecordNotUnique) { proposal.record_new_version!("<p>New</p>") }

    proposal.reload
    assert_equal 1, proposal.version
    assert_equal "<p>Initial</p>", proposal.content
  end
end
```

- [ ] **Step 2: Exécuter les tests et vérifier qu'ils échouent**

```bash
bin/rails test test/models/strategy/proposal_test.rb -v
```

Expected: échecs — pas de callback version 1, pas de méthode `record_new_version!`, pas d'unicité.

- [ ] **Step 3: Réécrire `app/models/strategy/proposal.rb`**

Remplacer le contenu par :

```ruby
# frozen_string_literal: true

module Strategy
  class Proposal < ApplicationRecord
    self.table_name = "strategy_proposals"

    belongs_to :deliberation, class_name: "Strategy::Deliberation"
    belongs_to :author, class_name: "Member", optional: true

    has_many :reactions, class_name: "Strategy::Reaction", foreign_key: :proposal_id, dependent: :destroy
    has_many :versions, class_name: "Strategy::ProposalVersion", foreign_key: :proposal_id, dependent: :destroy

    validates :content, presence: true
    validates :version, presence: true, numericality: { only_integer: true, greater_than: 0 }
    validates :deliberation_id, uniqueness: { message: "a déjà une proposition" }

    after_create :record_initial_version

    def record_new_version!(new_content)
      transaction do
        self.version += 1
        versions.create!(version: self.version, content: new_content)
        update!(content: new_content)
      end
    end

    def as_json_brief
      {
        id: id,
        deliberationId: deliberation_id,
        authorId: author_id,
        authorName: author ? "#{author.first_name} #{author.last_name}" : nil,
        authorAvatar: author&.avatar_url,
        version: version,
        versionsCount: versions.count,
        reactionCounts: reaction_counts,
        createdAt: created_at&.iso8601,
        updatedAt: updated_at&.iso8601
      }
    end

    def as_json_full
      as_json_brief.merge(
        content: content,
        reactions: reactions.includes(:member).map(&:as_json_brief)
      )
    end

    private

    def record_initial_version
      versions.create!(version: version, content: content)
    end

    def reaction_counts
      reactions.group(:position).count
    end
  end
end
```

- [ ] **Step 4: Exécuter les tests et vérifier qu'ils passent**

```bash
bin/rails test test/models/strategy/proposal_test.rb -v
```

Expected: 4 runs, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add app/models/strategy/proposal.rb test/models/strategy/proposal_test.rb
git commit -m "feat(strategy): proposal versioning with atomic record_new_version!"
```

---

### Task 8: `Strategy::Reaction` — positions restreintes + extension de vote sur objection

**Context:** Supprime `abstain`/`amendment`, rend `rationale` obligatoire pour les objections uniquement, et déclenche `extend_voting!` après la création d'une objection en phase `voting`.

**Files:**
- Create: `test/models/strategy/reaction_test.rb`
- Modify: `app/models/strategy/reaction.rb`

- [ ] **Step 1: Écrire les tests du modèle Reaction**

Créer `test/models/strategy/reaction_test.rb` :

```ruby
require "test_helper"

class Strategy::ReactionTest < ActiveSupport::TestCase
  setup do
    Strategy::Reaction.delete_all
    Strategy::ProposalVersion.delete_all
    Strategy::Proposal.delete_all
    Strategy::Deliberation.delete_all
    @member = Member.first || Member.create!(
      first_name: "Test", last_name: "User", email: "test@semisto.org",
      status: "active", joined_at: Date.today, password: "terranova2026"
    )
    @other = Member.where.not(id: @member.id).first || Member.create!(
      first_name: "Other", last_name: "User", email: "other@semisto.org",
      status: "active", joined_at: Date.today, password: "terranova2026"
    )
    @delib = Strategy::Deliberation.create!(
      title: "Sujet", created_by_id: @member.id, status: "voting",
      voting_started_at: 1.day.ago, voting_deadline: 6.days.from_now
    )
    @proposal = @delib.proposals.create!(content: "<p>Initial</p>", author: @member)
  end

  test "POSITIONS only allows consent and objection" do
    assert_equal %w[consent objection], Strategy::Reaction::POSITIONS
  end

  test "objection requires a rationale" do
    reaction = @proposal.reactions.build(member: @other, position: "objection", rationale: "")
    assert_not reaction.valid?
    assert_not_empty reaction.errors[:rationale]
  end

  test "consent does not require a rationale" do
    reaction = @proposal.reactions.build(member: @other, position: "consent", rationale: nil)
    assert reaction.valid?
  end

  test "creating an objection in voting phase extends voting_deadline" do
    frozen = Time.zone.parse("2026-05-01 12:00:00")
    travel_to(frozen) do
      @proposal.reactions.create!(member: @other, position: "objection", rationale: "Non, je ne suis pas d'accord.")
    end
    @delib.reload
    assert_equal frozen + 7.days, @delib.voting_deadline
  end

  test "creating a consent in voting phase does NOT extend voting_deadline" do
    original_deadline = @delib.voting_deadline
    @proposal.reactions.create!(member: @other, position: "consent", rationale: nil)
    @delib.reload
    assert_equal original_deadline.to_i, @delib.voting_deadline.to_i
  end

  test "only one reaction per member per proposal" do
    @proposal.reactions.create!(member: @other, position: "consent")
    duplicate = @proposal.reactions.build(member: @other, position: "objection", rationale: "Changed my mind")
    assert_not duplicate.save
  end
end
```

- [ ] **Step 2: Exécuter les tests et vérifier qu'ils échouent**

```bash
bin/rails test test/models/strategy/reaction_test.rb -v
```

Expected: échecs sur `POSITIONS`, validation rationale conditionnelle, hook `extend_voting!`.

- [ ] **Step 3: Réécrire `app/models/strategy/reaction.rb`**

Remplacer le contenu par :

```ruby
# frozen_string_literal: true

module Strategy
  class Reaction < ApplicationRecord
    self.table_name = "strategy_reactions"

    POSITIONS = %w[consent objection].freeze

    belongs_to :proposal, class_name: "Strategy::Proposal"
    belongs_to :member, class_name: "Member", optional: true

    validates :position, presence: true, inclusion: { in: POSITIONS }
    validates :rationale, presence: true, if: -> { position == "objection" }
    validates :member_id, uniqueness: {
      scope: :proposal_id,
      message: "a déjà réagi à cette proposition"
    }

    after_create :extend_voting_on_objection

    def as_json_brief
      {
        id: id,
        proposalId: proposal_id,
        memberId: member_id,
        memberName: member ? "#{member.first_name} #{member.last_name}" : nil,
        memberAvatar: member&.avatar_url,
        position: position,
        rationale: rationale,
        createdAt: created_at&.iso8601
      }
    end

    private

    def extend_voting_on_objection
      return unless position == "objection"
      deliberation = proposal&.deliberation
      return unless deliberation&.status == "voting"
      deliberation.extend_voting!
    end
  end
end
```

- [ ] **Step 4: Exécuter les tests et vérifier qu'ils passent**

```bash
bin/rails test test/models/strategy/reaction_test.rb -v
```

Expected: 6 runs, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add app/models/strategy/reaction.rb test/models/strategy/reaction_test.rb
git commit -m "feat(strategy): restrict reactions to consent/objection + extend voting hook"
```

---

### Task 9: `Strategy::DeliberationComment` — `phase_at_creation`

**Context:** Le commentaire stocke la phase dans laquelle il a été créé pour permettre le groupage UI.

**Files:**
- Modify: `app/models/strategy/deliberation_comment.rb`
- Modify: `test/models/strategy/deliberation_test.rb` (ajout de tests)

- [ ] **Step 1: Ajouter deux tests à `test/models/strategy/deliberation_test.rb`**

Ajouter dans le fichier (dans la classe `Strategy::DeliberationTest`) :

```ruby
  test "comment records phase_at_creation from deliberation status" do
    delib = Strategy::Deliberation.create!(title: "Sujet", created_by_id: @member.id, status: "open", opened_at: Time.current)
    comment = delib.comments.create!(content: "Remarque", author: @member)
    assert_equal "open", comment.phase_at_creation
  end

  test "comment phase_at_creation explicit set wins" do
    delib = Strategy::Deliberation.create!(
      title: "Sujet", created_by_id: @member.id, status: "voting",
      voting_started_at: Time.current, voting_deadline: 7.days.from_now
    )
    comment = delib.comments.create!(content: "Forced", author: @member, phase_at_creation: "draft")
    assert_equal "draft", comment.phase_at_creation
  end
```

- [ ] **Step 2: Exécuter ces tests et vérifier qu'ils échouent**

```bash
bin/rails test test/models/strategy/deliberation_test.rb -v -n "/phase_at_creation/"
```

Expected: échec — soit `phase_at_creation` n'est pas auto-rempli, soit la logique d'assignation explicite ne marche pas.

- [ ] **Step 3: Lire le contenu actuel du modèle**

```bash
cat app/models/strategy/deliberation_comment.rb
```

- [ ] **Step 4: Ajouter le callback dans `app/models/strategy/deliberation_comment.rb`**

Dans la classe, ajouter :

```ruby
    before_create :set_phase_at_creation

    private

    def set_phase_at_creation
      self.phase_at_creation ||= deliberation&.status || "draft"
    end
```

Si une section `private` existe déjà, fusionner la méthode `set_phase_at_creation` avec les méthodes privées existantes.

- [ ] **Step 5: Vérifier que les tests phase passent**

```bash
bin/rails test test/models/strategy/deliberation_test.rb -v -n "/phase_at_creation/"
```

Expected: PASS.

- [ ] **Step 6: Vérifier la suite Deliberation au complet**

```bash
bin/rails test test/models/strategy/deliberation_test.rb -v
```

Expected: tous les tests passent.

- [ ] **Step 7: Commit**

```bash
git add app/models/strategy/deliberation_comment.rb test/models/strategy/deliberation_test.rb
git commit -m "feat(strategy): DeliberationComment stores phase_at_creation"
```

---

### Task 10: Rake task `strategy:advance_deliberations`

**Context:** Déplacement automatique de phase : `open → voting` après 15 jours, `voting → outcome_pending` quand la deadline est atteinte.

**Files:**
- Create: `lib/tasks/strategy.rake`
- Create: `test/tasks/strategy_rake_test.rb`

- [ ] **Step 1: Créer le répertoire de tests de rake**

```bash
mkdir -p test/tasks
```

- [ ] **Step 2: Écrire les tests de la rake task**

Créer `test/tasks/strategy_rake_test.rb` :

```ruby
require "test_helper"
require "rake"

class StrategyRakeTest < ActiveSupport::TestCase
  setup do
    Rails.application.load_tasks if Rake::Task.tasks.empty?
    Rake::Task["strategy:advance_deliberations"].reenable

    Strategy::Reaction.delete_all
    Strategy::ProposalVersion.delete_all
    Strategy::Proposal.delete_all
    Strategy::DeliberationComment.delete_all
    Strategy::Deliberation.delete_all
    @member = Member.first
  end

  test "advances open deliberation to voting after 15 days" do
    delib = Strategy::Deliberation.create!(
      title: "Discussion en cours", created_by_id: @member.id,
      status: "open", opened_at: 16.days.ago
    )
    Rake::Task["strategy:advance_deliberations"].invoke
    delib.reload
    assert_equal "voting", delib.status
    assert_not_nil delib.voting_started_at
    assert_not_nil delib.voting_deadline
  end

  test "does not advance open deliberation before 15 days" do
    delib = Strategy::Deliberation.create!(
      title: "Discussion fraîche", created_by_id: @member.id,
      status: "open", opened_at: 10.days.ago
    )
    Rake::Task["strategy:advance_deliberations"].invoke
    delib.reload
    assert_equal "open", delib.status
  end

  test "advances voting deliberation to outcome_pending when deadline reached" do
    delib = Strategy::Deliberation.create!(
      title: "Vote terminé", created_by_id: @member.id,
      status: "voting", voting_started_at: 8.days.ago, voting_deadline: 1.minute.ago
    )
    Rake::Task["strategy:advance_deliberations"].invoke
    delib.reload
    assert_equal "outcome_pending", delib.status
  end

  test "does not advance voting deliberation before deadline" do
    delib = Strategy::Deliberation.create!(
      title: "Vote en cours", created_by_id: @member.id,
      status: "voting", voting_started_at: 2.days.ago, voting_deadline: 5.days.from_now
    )
    Rake::Task["strategy:advance_deliberations"].invoke
    delib.reload
    assert_equal "voting", delib.status
  end

  test "is idempotent when re-run" do
    delib = Strategy::Deliberation.create!(
      title: "Idempotence", created_by_id: @member.id,
      status: "open", opened_at: 16.days.ago
    )
    Rake::Task["strategy:advance_deliberations"].invoke
    Rake::Task["strategy:advance_deliberations"].reenable
    Rake::Task["strategy:advance_deliberations"].invoke
    delib.reload
    assert_equal "voting", delib.status
  end
end
```

- [ ] **Step 3: Exécuter les tests et vérifier qu'ils échouent**

```bash
bin/rails test test/tasks/strategy_rake_test.rb -v
```

Expected: `Don't know how to build task 'strategy:advance_deliberations'`.

- [ ] **Step 4: Créer la rake task**

Créer `lib/tasks/strategy.rake` :

```ruby
# frozen_string_literal: true

namespace :strategy do
  desc "Advance deliberations past their phase deadline"
  task advance_deliberations: :environment do
    open_count = 0
    Strategy::Deliberation
      .where(status: "open")
      .where("opened_at <= ?", 15.days.ago)
      .find_each do |delib|
        delib.transition_to_voting!
        open_count += 1
      end

    voting_count = 0
    Strategy::Deliberation
      .where(status: "voting")
      .where("voting_deadline <= ?", Time.current)
      .find_each do |delib|
        delib.transition_to_outcome_pending!
        voting_count += 1
      end

    Rails.logger.info(
      "[strategy:advance_deliberations] open->voting=#{open_count} voting->outcome_pending=#{voting_count}"
    )
  end
end
```

- [ ] **Step 5: Exécuter les tests et vérifier qu'ils passent**

```bash
bin/rails test test/tasks/strategy_rake_test.rb -v
```

Expected: 5 runs, 0 failures.

- [ ] **Step 6: Smoke test de la task**

```bash
bin/rails strategy:advance_deliberations
```

Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add lib/tasks/strategy.rake test/tasks/strategy_rake_test.rb
git commit -m "feat(strategy): advance_deliberations rake task for phase transitions"
```

---

### Task 11: Routes — nouveaux endpoints + suppression de `destroy`

**Context:** Ajoute `publish`, `cancel`, `versions` ; retire `destroy` sur délibération et proposal.

**Files:**
- Modify: `config/routes.rb`

- [ ] **Step 1: Lire la section Strategy actuelle**

```bash
sed -n '580,595p' config/routes.rb
```

- [ ] **Step 2: Remplacer le bloc des routes délibérations**

Dans `config/routes.rb`, remplacer le bloc qui liste les routes `strategy/deliberations` et `strategy/proposals` (14 lignes) par :

```ruby
      get    "strategy/deliberations",               to: "strategy/deliberations#index"
      get    "strategy/deliberations/:id",           to: "strategy/deliberations#show"
      post   "strategy/deliberations",               to: "strategy/deliberations#create"
      patch  "strategy/deliberations/:id",           to: "strategy/deliberations#update"
      patch  "strategy/deliberations/:id/publish",   to: "strategy/deliberations#publish"
      patch  "strategy/deliberations/:id/cancel",    to: "strategy/deliberations#cancel"
      patch  "strategy/deliberations/:id/decide",    to: "strategy/deliberations#decide"
      post   "strategy/deliberations/:id/proposals", to: "strategy/deliberations#create_proposal"
      patch  "strategy/proposals/:id",               to: "strategy/deliberations#update_proposal"
      get    "strategy/proposals/:id/versions",      to: "strategy/deliberations#proposal_versions"
      post   "strategy/proposals/:id/reactions",     to: "strategy/deliberations#create_reaction"
      get    "strategy/deliberations/:id/comments",  to: "strategy/deliberations#comments"
      post   "strategy/deliberations/:id/comments",  to: "strategy/deliberations#create_comment"
      delete "strategy/deliberation-comments/:id",   to: "strategy/deliberations#destroy_comment"
```

(Routes supprimées : `DELETE strategy/deliberations/:id`, `DELETE strategy/proposals/:id`.)

- [ ] **Step 3: Vérifier que les routes sont bien enregistrées**

```bash
bin/rails routes | grep strategy/deliberations
```

Expected : `publish`, `cancel`, pas de `DELETE` sur `/strategy/deliberations/:id`.

```bash
bin/rails routes | grep "strategy/proposals"
```

Expected : voir `versions`, voir `PATCH strategy/proposals/:id`, pas de `DELETE`.

- [ ] **Step 4: Commit**

```bash
git add config/routes.rb
git commit -m "feat(strategy): new phase transition routes + remove destroy"
```

---

### Task 12: Contrôleur délibérations — garde `effective?` + refonte des actions

**Context:** Réécriture complète du contrôleur. Garde globale `ensure_effective_member`. Contraintes de phase + autorisation par auteur.

**Files:**
- Modify: `app/controllers/api/v1/strategy/deliberations_controller.rb`

- [ ] **Step 1: Réécrire le contrôleur**

Remplacer intégralement le contenu de `app/controllers/api/v1/strategy/deliberations_controller.rb` par :

```ruby
# frozen_string_literal: true

module Api
  module V1
    module Strategy
      class DeliberationsController < BaseController
        before_action :ensure_effective_member

        def index
          deliberations = ::Strategy::Deliberation.visible_to(current_member)
          deliberations = deliberations.by_status(params[:status])
          deliberations = deliberations.search(params[:search])
          deliberations = deliberations.order(created_at: :desc)
          render json: { deliberations: deliberations.map(&:as_json_brief) }
        end

        def show
          deliberation = ::Strategy::Deliberation.visible_to(current_member).find(params[:id])
          render json: { deliberation: deliberation.as_json_full }
        end

        def create
          deliberation = ::Strategy::Deliberation.new(deliberation_params)
          deliberation.status = "draft"
          deliberation.created_by_id = current_member.id

          if deliberation.save
            render json: { deliberation: deliberation.as_json_full }, status: :created
          else
            render json: { errors: deliberation.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          deliberation = ::Strategy::Deliberation.find(params[:id])
          return forbid("Seul l'auteur peut modifier") unless owner?(deliberation)
          return forbid("Modification autorisée uniquement en brouillon") unless deliberation.status == "draft"

          if deliberation.update(deliberation_params)
            render json: { deliberation: deliberation.as_json_full }
          else
            render json: { errors: deliberation.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def publish
          deliberation = ::Strategy::Deliberation.find(params[:id])
          return forbid("Seul l'auteur peut publier") unless owner?(deliberation)
          unless deliberation.can_publish?
            return render json: { error: "Une proposition est requise pour publier" }, status: :unprocessable_entity
          end

          deliberation.publish!
          render json: { deliberation: deliberation.as_json_full }
        end

        def cancel
          deliberation = ::Strategy::Deliberation.find(params[:id])
          return forbid("Seul l'auteur peut annuler") unless owner?(deliberation)
          if deliberation.status == "decided"
            return render json: { error: "Une délibération décidée ne peut pas être annulée" }, status: :unprocessable_entity
          end

          deliberation.cancel!
          render json: { deliberation: deliberation.as_json_full }
        end

        def decide
          deliberation = ::Strategy::Deliberation.find(params[:id])
          return forbid("Seul l'auteur peut rédiger la décision") unless owner?(deliberation)
          unless deliberation.status == "outcome_pending"
            return render json: { error: "La délibération n'est pas en attente de décision" }, status: :unprocessable_entity
          end

          deliberation.update!(
            status: "decided",
            outcome: params[:outcome],
            decided_at: Time.current
          )
          render json: { deliberation: deliberation.as_json_full }
        end

        # Proposals
        def create_proposal
          deliberation = ::Strategy::Deliberation.find(params[:id])
          return forbid("Seul l'auteur peut ajouter la proposition") unless owner?(deliberation)
          unless deliberation.status == "draft"
            return render json: { error: "La proposition ne peut être créée qu'en brouillon" }, status: :unprocessable_entity
          end
          if deliberation.proposals.any?
            return render json: { error: "Une proposition existe déjà pour cette délibération" }, status: :unprocessable_entity
          end

          proposal = deliberation.proposals.build(proposal_params)
          proposal.author = current_member

          if proposal.save
            render json: { proposal: proposal.as_json_full }, status: :created
          else
            render json: { errors: proposal.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update_proposal
          proposal = ::Strategy::Proposal.find(params[:id])
          deliberation = proposal.deliberation
          return forbid("Seul l'auteur peut amender la proposition") unless owner?(deliberation)
          unless %w[draft open].include?(deliberation.status)
            return render json: { error: "La proposition ne peut plus être modifiée" }, status: :unprocessable_entity
          end

          new_content = params[:content]
          if new_content.blank?
            return render json: { errors: ["Le contenu est obligatoire"] }, status: :unprocessable_entity
          end

          proposal.record_new_version!(new_content)
          render json: { proposal: proposal.as_json_full }
        end

        def proposal_versions
          proposal = ::Strategy::Proposal.find(params[:id])
          ::Strategy::Deliberation.visible_to(current_member).find(proposal.deliberation_id)
          versions = proposal.versions.chronological.map(&:as_json_brief)
          render json: { versions: versions }
        end

        # Reactions
        def create_reaction
          proposal = ::Strategy::Proposal.find(params[:id])
          deliberation = proposal.deliberation
          unless deliberation.status == "voting"
            return render json: { error: "Les réactions ne sont acceptées qu'en phase de vote" }, status: :unprocessable_entity
          end
          if deliberation.voting_deadline && deliberation.voting_deadline <= Time.current
            return render json: { error: "La phase de vote est terminée" }, status: :unprocessable_entity
          end

          reaction = proposal.reactions.find_or_initialize_by(member: current_member)
          reaction.assign_attributes(reaction_params)

          if reaction.save
            render json: { reaction: reaction.as_json_brief }, status: :created
          else
            render json: { errors: reaction.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # Comments
        def comments
          deliberation = ::Strategy::Deliberation.visible_to(current_member).find(params[:id])
          by_phase = deliberation.comments.includes(:author).order(:created_at).group_by(&:phase_at_creation)
          payload = ::Strategy::Deliberation::STATUSES.each_with_object({}) do |phase, acc|
            acc[phase] = (by_phase[phase] || []).map(&:as_json_brief)
          end
          render json: { commentsByPhase: payload }
        end

        def create_comment
          deliberation = ::Strategy::Deliberation.find(params[:id])
          if %w[cancelled decided].include?(deliberation.status)
            return render json: { error: "Les commentaires sont fermés pour cette phase" }, status: :unprocessable_entity
          end

          comment = deliberation.comments.build(comment_params)
          comment.author = current_member

          if comment.save
            render json: { comment: comment.as_json_brief }, status: :created
          else
            render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy_comment
          comment = ::Strategy::DeliberationComment.find(params[:id])
          comment.destroy!
          head :no_content
        end

        private

        def ensure_effective_member
          return if current_member&.can_access_strategy?
          render json: { error: "Accès réservé aux membres effectifs" }, status: :forbidden
        end

        def owner?(deliberation)
          deliberation.created_by_id == current_member&.id
        end

        def forbid(message)
          render json: { error: message }, status: :forbidden
        end

        def deliberation_params
          params.permit(:title, :context)
        end

        def proposal_params
          params.permit(:content)
        end

        def reaction_params
          params.permit(:position, :rationale)
        end

        def comment_params
          params.permit(:content)
        end
      end
    end
  end
end
```

- [ ] **Step 2: Vérifier que le contrôleur se charge**

```bash
bin/rails runner 'puts Api::V1::Strategy::DeliberationsController.action_methods.sort'
```

Expected : voir `index`, `show`, `create`, `update`, `publish`, `cancel`, `decide`, `create_proposal`, `update_proposal`, `proposal_versions`, `create_reaction`, `comments`, `create_comment`, `destroy_comment`.

- [ ] **Step 3: Commit**

```bash
git add app/controllers/api/v1/strategy/deliberations_controller.rb
git commit -m "feat(strategy): phase-gated deliberations controller with effective check"
```

---

### Task 13: Protection de la page Inertia `/strategy`

**Context:** Un membre non-effective qui tape `/strategy` dans l'URL atterrit sur `AppController#strategy`. On ajoute un `before_action` dédié.

**Files:**
- Modify: `app/controllers/app_controller.rb`

- [ ] **Step 1: Lire le contrôleur actuel**

```bash
sed -n '1,20p' app/controllers/app_controller.rb
```

- [ ] **Step 2: Ajouter le before_action**

Dans `app/controllers/app_controller.rb`, ajouter en tête de classe (après les `before_action` existants ou tout en haut si aucun) :

```ruby
  before_action :require_effective_for_strategy, only: [:strategy]
```

Ajouter la méthode privée à la fin du fichier (avant le `end` final de la classe) :

```ruby
  private

  def require_effective_for_strategy
    return if current_member&.can_access_strategy?
    redirect_to root_path, alert: "Accès réservé aux membres effectifs"
  end
```

Si une section `private` existe déjà dans le fichier, y ajouter la méthode `require_effective_for_strategy` sans dupliquer le mot-clé `private`.

- [ ] **Step 3: Smoke check du chargement**

```bash
bin/rails runner 'puts AppController.new.respond_to?(:require_effective_for_strategy, true)'
```

Expected : `true`.

- [ ] **Step 4: Commit**

```bash
git add app/controllers/app_controller.rb
git commit -m "feat(strategy): guard Inertia /strategy page for non-effective members"
```

---

### Task 14: Réécriture du test d'intégration Strategy — partie délibérations

**Context:** Le test existant `test/integration/strategy_test.rb` contient l'ancien workflow. On remplace **uniquement** le bloc `deliberation with proposals reactions and comments` par des scénarios couvrant le nouveau workflow. On conserve les tests Resources, Frameworks, Axes.

**Files:**
- Modify: `test/integration/strategy_test.rb`

- [ ] **Step 1: Localiser la section à remplacer**

```bash
sed -n '93,195p' test/integration/strategy_test.rb
```

- [ ] **Step 2: Mettre à jour le `setup` initial pour nettoyer aussi `ProposalVersion`**

Localiser le bloc `setup do ... end` en tête de `StrategyTest` (lignes ~4-15) et y ajouter `Strategy::ProposalVersion` :

```ruby
  setup do
    [
      Strategy::KeyResult,
      Strategy::Axis,
      Strategy::Framework,
      Strategy::DeliberationComment,
      Strategy::Reaction,
      Strategy::ProposalVersion,
      Strategy::Proposal,
      Strategy::Deliberation,
      Strategy::Resource
    ].each(&:delete_all)
  end
```

- [ ] **Step 3: Ajouter les helpers `ensure_member`, `login_as`, `logout!` et un `teardown`**

Juste après le `setup`, ajouter :

```ruby
  teardown do
    Thread.current[:test_member] = nil
  end

  def ensure_member(email:, membership_type:, admin: false)
    Member.find_or_create_by!(email: email) do |m|
      m.first_name = "Test"
      m.last_name  = "User"
      m.status     = "active"
      m.joined_at  = Date.today
      m.password   = "terranova2026"
      m.membership_type = membership_type
      m.is_admin   = admin
    end.tap { |m| m.update!(membership_type: membership_type, is_admin: admin) }
  end

  def login_as(member)
    Thread.current[:test_member] = member
  end
```

- [ ] **Step 4: Remplacer le test `deliberation with proposals reactions and comments`**

Remplacer intégralement le bloc `test 'deliberation with proposals reactions and comments' do ... end` par les tests suivants :

```ruby
  test 'effective member can create draft deliberation' do
    effective = ensure_member(email: "effective@test.local", membership_type: "effective", admin: true)
    login_as(effective)

    post '/api/v1/strategy/deliberations', params: { title: 'Sujet' }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 'draft', body['deliberation']['status']
    assert_nil body['deliberation']['openedAt']
  end

  test 'adherent member receives 403 on deliberations index' do
    adherent = ensure_member(email: "adherent@test.local", membership_type: "adherent")
    login_as(adherent)

    get '/api/v1/strategy/deliberations', as: :json
    assert_response :forbidden
  end

  test 'non_member receives 403 on deliberations create' do
    non_member = ensure_member(email: "non@test.local", membership_type: "non_member")
    login_as(non_member)

    post '/api/v1/strategy/deliberations', params: { title: 'Test' }, as: :json
    assert_response :forbidden
  end

  test 'draft is visible only to its author' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    other  = ensure_member(email: "other@test.local",  membership_type: "effective")

    login_as(author)
    post '/api/v1/strategy/deliberations', params: { title: 'Mon brouillon' }, as: :json
    my_id = JSON.parse(response.body)['deliberation']['id']

    login_as(other)
    get '/api/v1/strategy/deliberations', as: :json
    ids = JSON.parse(response.body)['deliberations'].map { |d| d['id'] }
    assert_not_includes ids, my_id

    get "/api/v1/strategy/deliberations/#{my_id}", as: :json
    assert_response :not_found
  end

  test 'publish requires a proposal' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    login_as(author)

    post '/api/v1/strategy/deliberations', params: { title: 'Sujet' }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']

    patch "/api/v1/strategy/deliberations/#{delib_id}/publish", as: :json
    assert_response :unprocessable_entity
  end

  test 'full phase progression: draft to decided' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    voter  = ensure_member(email: "voter@test.local",  membership_type: "effective")

    login_as(author)
    post '/api/v1/strategy/deliberations', params: { title: 'Protocole de membrane' }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']

    post "/api/v1/strategy/deliberations/#{delib_id}/proposals",
      params: { content: '<p>Seuil local 5000 euros</p>' }, as: :json
    assert_response :created

    patch "/api/v1/strategy/deliberations/#{delib_id}/publish", as: :json
    assert_response :success
    assert_equal 'open', JSON.parse(response.body)['deliberation']['status']

    ::Strategy::Deliberation.find(delib_id).update!(opened_at: 16.days.ago)
    Rails.application.load_tasks if Rake::Task.tasks.empty?
    Rake::Task["strategy:advance_deliberations"].reenable
    Rake::Task["strategy:advance_deliberations"].invoke
    get "/api/v1/strategy/deliberations/#{delib_id}", as: :json
    assert_equal 'voting', JSON.parse(response.body)['deliberation']['status']

    proposal_id = JSON.parse(response.body)['deliberation']['proposals'][0]['id']
    login_as(voter)
    post "/api/v1/strategy/proposals/#{proposal_id}/reactions",
      params: { position: 'objection', rationale: 'Seuil trop bas pour IDF' }, as: :json
    assert_response :created

    delib_row = ::Strategy::Deliberation.find(delib_id)
    assert delib_row.voting_deadline > Time.current + 6.days

    delib_row.update!(voting_deadline: 1.minute.ago)
    Rake::Task["strategy:advance_deliberations"].reenable
    Rake::Task["strategy:advance_deliberations"].invoke
    get "/api/v1/strategy/deliberations/#{delib_id}", as: :json
    assert_equal 'outcome_pending', JSON.parse(response.body)['deliberation']['status']

    login_as(author)
    patch "/api/v1/strategy/deliberations/#{delib_id}/decide",
      params: { outcome: '<p>Seuil adopte a 5000 euros avec exception IDF.</p>' }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'decided', body['deliberation']['status']
    assert body['deliberation']['decidedAt'].present?
  end

  test 'update deliberation title allowed in draft, forbidden in open' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    login_as(author)

    post '/api/v1/strategy/deliberations', params: { title: 'v1' }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']

    patch "/api/v1/strategy/deliberations/#{delib_id}", params: { title: 'v2' }, as: :json
    assert_response :success

    post "/api/v1/strategy/deliberations/#{delib_id}/proposals",
      params: { content: '<p>proposition</p>' }, as: :json
    patch "/api/v1/strategy/deliberations/#{delib_id}/publish", as: :json

    patch "/api/v1/strategy/deliberations/#{delib_id}", params: { title: 'v3' }, as: :json
    assert_response :forbidden
  end

  test 'update_proposal allowed in draft and open, creates versions' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    login_as(author)

    post '/api/v1/strategy/deliberations', params: { title: 'Sujet' }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']

    post "/api/v1/strategy/deliberations/#{delib_id}/proposals",
      params: { content: '<p>v1</p>' }, as: :json
    proposal_id = JSON.parse(response.body)['proposal']['id']

    patch "/api/v1/strategy/proposals/#{proposal_id}",
      params: { content: '<p>v2</p>' }, as: :json
    assert_response :success
    assert_equal 2, JSON.parse(response.body)['proposal']['version']

    patch "/api/v1/strategy/deliberations/#{delib_id}/publish", as: :json
    patch "/api/v1/strategy/proposals/#{proposal_id}",
      params: { content: '<p>v3</p>' }, as: :json
    assert_response :success
    assert_equal 3, JSON.parse(response.body)['proposal']['version']

    get "/api/v1/strategy/proposals/#{proposal_id}/versions", as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal [1, 2, 3], body['versions'].map { |v| v['version'] }
  end

  test 'update_proposal forbidden for non-author' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    other  = ensure_member(email: "other@test.local",  membership_type: "effective")

    login_as(author)
    post '/api/v1/strategy/deliberations', params: { title: 'Sujet' }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']
    post "/api/v1/strategy/deliberations/#{delib_id}/proposals",
      params: { content: '<p>v1</p>' }, as: :json
    proposal_id = JSON.parse(response.body)['proposal']['id']

    login_as(other)
    patch "/api/v1/strategy/proposals/#{proposal_id}",
      params: { content: '<p>hijack</p>' }, as: :json
    assert_response :forbidden
  end

  test 'cancel works in any non-decided phase' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    login_as(author)

    post '/api/v1/strategy/deliberations', params: { title: 'Sujet' }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']

    patch "/api/v1/strategy/deliberations/#{delib_id}/cancel", as: :json
    assert_response :success
    assert_equal 'cancelled', JSON.parse(response.body)['deliberation']['status']
  end

  test 'cancel rejected when deliberation is decided' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    login_as(author)

    delib = Strategy::Deliberation.create!(title: 'Already decided', created_by_id: author.id, status: 'decided')
    patch "/api/v1/strategy/deliberations/#{delib.id}/cancel", as: :json
    assert_response :unprocessable_entity
  end

  test 'comments grouped by phase' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    login_as(author)

    post '/api/v1/strategy/deliberations', params: { title: 'Sujet' }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']

    post "/api/v1/strategy/deliberations/#{delib_id}/comments", params: { content: 'Draft remark' }, as: :json

    post "/api/v1/strategy/deliberations/#{delib_id}/proposals",
      params: { content: '<p>v1</p>' }, as: :json
    patch "/api/v1/strategy/deliberations/#{delib_id}/publish", as: :json
    post "/api/v1/strategy/deliberations/#{delib_id}/comments", params: { content: 'Open remark' }, as: :json

    get "/api/v1/strategy/deliberations/#{delib_id}/comments", as: :json
    assert_response :success
    payload = JSON.parse(response.body)['commentsByPhase']
    assert_equal 1, payload['draft'].size
    assert_equal 1, payload['open'].size
    assert_equal 'Draft remark', payload['draft'][0]['content']
    assert_equal 'Open remark',  payload['open'][0]['content']
  end

  test 'deliberation destroy route no longer exists' do
    author = ensure_member(email: "author@test.local", membership_type: "effective", admin: true)
    login_as(author)

    post '/api/v1/strategy/deliberations', params: { title: 'Sujet' }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']

    assert_raises(ActionController::RoutingError) do
      delete "/api/v1/strategy/deliberations/#{delib_id}", as: :json
    end
  end
```

- [ ] **Step 5: Mettre à jour `frameworks CRUD with deliberation link`**

Dans ce test, remplacer le début qui crée une délibération avec `decision_mode` et appelle `decide` directement :

```ruby
    post '/api/v1/strategy/deliberations', params: {
      title: 'Charte des valeurs',
      decision_mode: 'consent'
    }, as: :json
    delib_id = JSON.parse(response.body)['deliberation']['id']
    patch "/api/v1/strategy/deliberations/#{delib_id}/decide", params: {
      outcome: 'Valeurs adoptées.'
    }, as: :json
```

par :

```ruby
    author = ensure_member(email: "framework-author@test.local", membership_type: "effective", admin: true)
    login_as(author)

    delib = Strategy::Deliberation.create!(title: 'Charte des valeurs', created_by_id: author.id, status: 'outcome_pending')
    delib_id = delib.id
    patch "/api/v1/strategy/deliberations/#{delib_id}/decide", params: {
      outcome: 'Valeurs adoptées.'
    }, as: :json
    assert_response :success
```

Le reste du test (création framework, list, filter, show, update, delete) reste inchangé.

- [ ] **Step 6: Exécuter la suite d'intégration Strategy**

```bash
bin/rails test test/integration/strategy_test.rb -v
```

Expected: tous les tests passent.

- [ ] **Step 7: Commit**

```bash
git add test/integration/strategy_test.rb
git commit -m "test(strategy): rewrite deliberation integration tests for phase workflow"
```

---

### Task 15: Suite complète + corrections de non-régression

**Context:** Filet de sécurité avant le frontend.

- [ ] **Step 1: Lancer toute la suite**

```bash
bin/rails test
```

Expected : tous les tests passent.

- [ ] **Step 2: Si des tests cassent, les corriger**

Les candidats probables sont des tests qui référencent encore `decision_mode`, `abstain`, `amendment`, statuts `in_progress`/`archived`, ou routes `DELETE strategy/deliberations/:id`. Les corriger en alignant sur le nouveau workflow.

- [ ] **Step 3: Commit si corrections faites**

```bash
git add -u
git commit -m "test: align remaining strategy references with phase workflow"
```

(Skip si rien n'a changé.)

---

### Task 16: `ContextSwitcher` — masquer Stratego pour les non-effectifs

**Context:** Garde côté navigation. Le back-end bloque déjà, mais on masque aussi le lien pour ne pas induire en erreur.

**Files:**
- Modify: `app/frontend/components/shell/ContextSwitcher.jsx`

- [ ] **Step 1: Localiser le lien Stratego**

```bash
sed -n '155,170p' app/frontend/components/shell/ContextSwitcher.jsx
```

Expected : voir le `<Link href="/strategy">`.

- [ ] **Step 2: Wrapper le lien dans un conditionnel**

Dans `app/frontend/components/shell/ContextSwitcher.jsx`, entourer le bloc `<Link href="/strategy"> ... </Link>` (lignes ~157-168) par :

```jsx
            {auth?.member?.membershipType === 'effective' && (
              <Link
                href="/strategy"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  currentPole.id === 'strategy'
                    ? 'bg-stone-50 text-stone-900 font-medium'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span className="w-5 h-5 rounded flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold shrink-0">S</span>
                Stratego
              </Link>
            )}
```

- [ ] **Step 3: Smoke check navigateur**

```bash
bin/dev
```

Naviguer vers `http://localhost:3000/`, ouvrir le ContextSwitcher : Stratego visible (Sophie est `effective`). `Ctrl+C` dans le terminal.

- [ ] **Step 4: Commit**

```bash
git add app/frontend/components/shell/ContextSwitcher.jsx
git commit -m "feat(shell): hide Stratego link for non-effective members"
```

---

### Task 17: Frontend — constantes et nettoyage global de `Strategy/Index.jsx`

**Context:** Avant de refondre les composants, on met à jour les constantes au top du fichier et on supprime `DECISION_MODE_LABELS` ainsi que les entrées `abstain`/`amendment` de `REACTION_CONFIG`.

**Files:**
- Modify: `app/frontend/pages/Strategy/Index.jsx`

- [ ] **Step 1: Remplacer `DELIB_STATUSES`, `DELIB_STATUS_COLORS`, `DELIB_STATUS_LABELS`**

Localiser et remplacer le bloc (lignes ~22-37) :

```jsx
const DELIB_STATUSES = [
  { value: '', label: 'Toutes' },
  { value: 'open', label: 'Ouvertes' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'decided', label: 'Décidées' },
  { value: 'archived', label: 'Archivées' },
]

const DELIB_STATUS_COLORS = {
  open: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  decided: 'bg-green-50 text-green-700',
  archived: 'bg-stone-100 text-stone-500',
}

const DELIB_STATUS_LABELS = { open: 'Ouverte', in_progress: 'En cours', decided: 'Décidée', archived: 'Archivée' }
```

par :

```jsx
const DELIB_STATUSES = [
  { value: '',                label: 'Toutes' },
  { value: 'draft',           label: 'Brouillons' },
  { value: 'open',            label: 'Discussion' },
  { value: 'voting',          label: 'Vote en cours' },
  { value: 'outcome_pending', label: 'Décision à rédiger' },
  { value: 'decided',         label: 'Décidées' },
  { value: 'cancelled',       label: 'Annulées' },
]

const DELIB_STATUS_COLORS = {
  draft:           'bg-stone-100 text-stone-600',
  open:            'bg-blue-50 text-blue-700',
  voting:          'bg-amber-50 text-amber-700',
  outcome_pending: 'bg-purple-50 text-purple-700',
  decided:         'bg-green-50 text-green-700',
  cancelled:       'bg-stone-100 text-stone-500',
}

const DELIB_STATUS_LABELS = {
  draft:           'Brouillon',
  open:            'Discussion',
  voting:          'Vote en cours',
  outcome_pending: 'Décision à rédiger',
  decided:         'Décidée',
  cancelled:       'Annulée',
}

const PHASE_SECTION_LABELS = {
  draft:           'Commentaires pendant la préparation',
  open:            'Commentaires pendant la discussion',
  voting:          'Commentaires pendant le vote',
  outcome_pending: 'Commentaires pendant la rédaction de décision',
  decided:         'Commentaires après la décision',
  cancelled:       'Commentaires avant annulation',
}
```

- [ ] **Step 2: Supprimer `DECISION_MODE_LABELS` et nettoyer `REACTION_CONFIG`**

Localiser et remplacer (lignes ~61-68) :

```jsx
const DECISION_MODE_LABELS = { consent: 'Consentement', vote: 'Vote', advisory: 'Consultatif' }

const REACTION_CONFIG = [
  { position: 'consent', label: 'Consentement', icon: Check, color: 'text-green-600 hover:bg-green-50' },
  { position: 'objection', label: 'Objection', icon: XCircle, color: 'text-red-600 hover:bg-red-50' },
  { position: 'abstain', label: 'Abstention', icon: MinusCircle, color: 'text-stone-500 hover:bg-stone-50' },
  { position: 'amendment', label: 'Amendement', icon: PenLine, color: 'text-amber-600 hover:bg-amber-50' },
]
```

par :

```jsx
const REACTION_CONFIG = [
  { position: 'consent',   label: 'Consentement', icon: Check,   color: 'text-green-600 hover:bg-green-50' },
  { position: 'objection', label: 'Objection',    icon: XCircle, color: 'text-red-600 hover:bg-red-50' },
]
```

- [ ] **Step 3: Nettoyer les imports `lucide-react`**

Remplacer la ligne d'import lucide en haut de fichier :

```jsx
import {
  BookOpen, Plus, Search, Pin, Edit3, Trash2, ChevronLeft, X,
  MessageCircle, FileText, Target, ExternalLink, Paperclip,
  Send, Check, XCircle, MinusCircle, PenLine, ChevronDown, ChevronRight
} from 'lucide-react'
```

par :

```jsx
import {
  BookOpen, Plus, Search, Pin, Edit3, Trash2, ChevronLeft, X,
  MessageCircle, FileText, Target, ExternalLink, Paperclip,
  Send, Check, XCircle, ChevronDown, ChevronRight
} from 'lucide-react'
```

- [ ] **Step 4: Commit**

```bash
git add app/frontend/pages/Strategy/Index.jsx
git commit -m "refactor(strategy): update frontend constants for phase workflow"
```

---

### Task 18: Frontend — `DeliberationsList` : brouillons + countdown

**Context:** Affiche une section "Mes brouillons" en tête et un compte à rebours sur chaque carte.

**Files:**
- Modify: `app/frontend/pages/Strategy/Index.jsx`

- [ ] **Step 1: Ajouter les helpers de countdown près de `stripHtml`**

Localiser la fonction `stripHtml` (ligne ~53) et ajouter juste en dessous :

```jsx
function daysRemaining(deadlineIso) {
  if (!deadlineIso) return null
  const diffMs = new Date(deadlineIso).getTime() - Date.now()
  if (diffMs <= 0) return 0
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function phaseCountdownLabel(delib) {
  if (delib.status === 'open' && delib.openedAt) {
    const discussionEnd = new Date(delib.openedAt)
    discussionEnd.setDate(discussionEnd.getDate() + 15)
    const n = daysRemaining(discussionEnd.toISOString())
    return n !== null ? `Discussion : ${n} j restants` : null
  }
  if (delib.status === 'voting' && delib.votingDeadline) {
    const n = daysRemaining(delib.votingDeadline)
    return n !== null ? `Vote : ${n} j restants` : null
  }
  return null
}
```

- [ ] **Step 2: Importer `usePage` depuis Inertia**

Ajouter ou fusionner dans les imports en tête de fichier :

```jsx
import { usePage } from '@inertiajs/react'
```

- [ ] **Step 3: Remplacer la fonction `DeliberationsList`**

Localiser la définition de `DeliberationsList` et remplacer tout son corps par :

```jsx
function DeliberationsList({ onSelect, onNew, authMemberId }) {
  const [deliberations, setDeliberations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('open')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterStatus) params.set('status', filterStatus)
    const data = await apiRequest(`/api/v1/strategy/deliberations?${params}`)
    if (data) setDeliberations(data.deliberations || [])
    setLoading(false)
  }, [search, filterStatus])

  useEffect(() => { fetchData() }, [fetchData])

  const myDrafts = deliberations.filter(d => d.status === 'draft' && String(d.createdById) === String(authMemberId))
  const otherDelibs = deliberations.filter(d => !(d.status === 'draft' && String(d.createdById) === String(authMemberId)))

  const renderCard = (d) => {
    const countdown = phaseCountdownLabel(d)
    return (
      <button
        key={d.id}
        onClick={() => onSelect(d.id)}
        className={`text-left rounded-xl p-4 hover:shadow-sm transition-all cursor-pointer ${d.status === 'decided' ? 'bg-green-50 border border-green-300 hover:border-green-400' : 'bg-white border border-stone-200 hover:border-blue-300'}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-sm font-semibold text-stone-900 truncate">{d.title}</h3>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${DELIB_STATUS_COLORS[d.status]}`}>
                {DELIB_STATUS_LABELS[d.status]}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-stone-400 flex-wrap">
              <span>{d.proposalCount} proposition{d.proposalCount !== 1 ? 's' : ''}</span>
              {d.reactionsSummary && (
                <>
                  <span className="text-green-600">v {d.reactionsSummary.consent}</span>
                  <span className="text-red-600">x {d.reactionsSummary.objection}</span>
                </>
              )}
              <span>{d.commentCount} commentaire{d.commentCount !== 1 ? 's' : ''}</span>
              {countdown && <span className="text-amber-600 font-medium">{countdown}</span>}
            </div>
          </div>
          <span className="text-[10px] text-stone-400 shrink-0">
            {new Date(d.createdAt).toLocaleDateString('fr-BE')}
          </span>
        </div>
        {d.creatorName && (
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-stone-500">
            <span>Sujet amene par</span>
            {d.creatorAvatar ? (
              <img src={d.creatorAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-stone-300 flex items-center justify-center text-[8px] text-white font-medium">{d.creatorName.charAt(0)}</span>
            )}
            <span className="font-medium text-stone-600">{d.creatorName}</span>
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input type="text" placeholder="Rechercher une delibération..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
        </div>
        <button onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: ACCENT }}>
          <Plus className="w-4 h-4" /> Nouvelle delibération
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {DELIB_STATUSES.map(s => (
          <button key={s.value} onClick={() => setFilterStatus(filterStatus === s.value ? '' : s.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${filterStatus === s.value ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-stone-400 text-sm">Chargement...</div>
      ) : deliberations.length === 0 ? (
        <div className="py-12 text-center text-stone-400 text-sm">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 text-stone-300" />
          Aucune delibération trouvée
        </div>
      ) : (
        <div className="space-y-4">
          {myDrafts.length > 0 && (
            <div className="space-y-2">
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                Mes brouillons — visibles uniquement par vous
              </div>
              <div className="grid gap-3">{myDrafts.map(renderCard)}</div>
            </div>
          )}
          {otherDelibs.length > 0 && (
            <div className="grid gap-3">{otherDelibs.map(renderCard)}</div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Passer `authMemberId` depuis `StrategyIndex`**

Localiser `export default function StrategyIndex() {` (près de la fin du fichier) et ajouter au début du corps de la fonction :

```jsx
  const { auth } = usePage().props
  const authMemberId = auth?.member?.id
```

Puis remplacer l'appel à `<DeliberationsList>` par :

```jsx
<DeliberationsList onSelect={handleSelect} onNew={handleNew} authMemberId={authMemberId} />
```

- [ ] **Step 5: Smoke test navigateur**

Lancer `bin/dev`, se connecter, aller sur `/strategy?tab=deliberations`. Créer une délibération → voir le badge `Brouillon` et le bandeau "Mes brouillons".

- [ ] **Step 6: Commit**

```bash
git add app/frontend/pages/Strategy/Index.jsx
git commit -m "feat(strategy-ui): draft section + countdown in deliberations list"
```

---

### Task 19: Frontend — `DeliberationDetail` : barre de phase + publish/cancel

**Context:** Ajoute la barre visuelle des phases, le bouton Publier en draft et le bouton Annuler (auteur uniquement).

**Files:**
- Modify: `app/frontend/pages/Strategy/Index.jsx`

- [ ] **Step 1: Ajouter le composant `PhaseBar` juste avant `DeliberationDetail`**

Insérer juste avant la définition de `DeliberationDetail` :

```jsx
const PHASES = [
  { id: 'draft',           label: 'Brouillon' },
  { id: 'open',            label: 'Discussion' },
  { id: 'voting',          label: 'Vote' },
  { id: 'outcome_pending', label: 'Décision' },
]

function PhaseBar({ delib }) {
  const currentIdx = PHASES.findIndex(p => p.id === delib.status)
  const countdown = phaseCountdownLabel(delib)
  const isTerminal = delib.status === 'decided' || delib.status === 'cancelled'

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <div className="flex items-center gap-2">
        {PHASES.map((phase, idx) => {
          const reached = currentIdx >= idx && !isTerminal
          const active = currentIdx === idx && !isTerminal
          const pillClass = active
            ? 'bg-blue-100 text-blue-800 border border-blue-400'
            : reached
              ? 'bg-stone-100 text-stone-700'
              : 'bg-stone-50 text-stone-400'
          return (
            <React.Fragment key={phase.id}>
              <div className={`flex-1 text-center py-2 rounded-lg text-xs font-medium transition-colors ${pillClass}`}>
                {phase.label}
              </div>
              {idx < PHASES.length - 1 && <span className="text-stone-300">→</span>}
            </React.Fragment>
          )
        })}
      </div>
      {countdown && !isTerminal && (
        <div className="mt-2 text-center text-xs text-amber-700 font-medium">{countdown}</div>
      )}
      {delib.status === 'decided' && (
        <div className="mt-2 text-center text-xs text-green-700 font-medium">Décidée</div>
      )}
      {delib.status === 'cancelled' && (
        <div className="mt-2 text-center text-xs text-stone-500 font-medium">Annulée</div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Ajouter la prop `authMemberId` à `DeliberationDetail` et les handlers**

Modifier la signature de `DeliberationDetail` :

```jsx
function DeliberationDetail({ deliberationId, onBack, onEdit, authMemberId }) {
```

Remplacer `handleDelete` par :

```jsx
  const handleCancel = async () => {
    if (!confirm('Annuler cette délibération ? Cette action est irréversible.')) return
    await apiRequest(`/api/v1/strategy/deliberations/${deliberationId}/cancel`, { method: 'PATCH' })
    load()
  }

  const handlePublish = async () => {
    if (!confirm('Publier cette délibération ? Elle deviendra visible par tous les membres effectifs et le compteur de discussion démarrera.')) return
    await apiRequest(`/api/v1/strategy/deliberations/${deliberationId}/publish`, { method: 'PATCH' })
    load()
  }
```

- [ ] **Step 3: Insérer `<PhaseBar delib={delib} />` en haut du rendu**

Dans le `return (` de `DeliberationDetail`, insérer juste après le bouton `<button onClick={onBack}>... Retour</button>` :

```jsx
      <PhaseBar delib={delib} />
```

- [ ] **Step 4: Retirer l'affichage de `decisionMode` dans le header**

Localiser dans le header du détail le bloc qui affiche `DECISION_MODE_LABELS[delib.decisionMode]` et supprimer ce `<span>` entièrement.

- [ ] **Step 5: Remplacer les boutons d'action du header (edit / delete)**

Localiser le bloc `<div className="flex items-center gap-1 shrink-0">` contenant les boutons `Edit3` et `Trash2` dans le header et le remplacer par :

```jsx
          <div className="flex items-center gap-1 shrink-0">
            {delib.status === 'draft' && String(delib.createdById) === String(authMemberId) && (
              <button onClick={() => onEdit(delib)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors" title="Modifier">
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {delib.status !== 'decided' && String(delib.createdById) === String(authMemberId) && (
              <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-red-600 transition-colors" title="Annuler la délibération">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
```

- [ ] **Step 6: Ajouter le bandeau draft + bouton publier**

Juste avant le bloc `{/* Proposals */}`, insérer :

```jsx
      {delib.status === 'draft' && String(delib.createdById) === String(authMemberId) && (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-amber-800">
              Brouillon — visible uniquement par vous.
              {!delib.proposals?.length && <span className="block text-xs text-amber-600 mt-1">Ajoutez une proposition pour pouvoir publier.</span>}
            </div>
            <button
              onClick={handlePublish}
              disabled={!delib.proposals?.length}
              className="px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
            >
              Publier la délibération
            </button>
          </div>
        </div>
      )}
```

- [ ] **Step 7: Passer `authMemberId` à `DeliberationDetail` depuis `StrategyIndex`**

Localiser dans `StrategyIndex` le rendu conditionnel Délibérations et remplacer par :

```jsx
      {activeSection === 'deliberations' && (
        view === 'form' ? <DeliberationForm deliberation={editingItem} onSave={handleSaved} onCancel={handleBack} /> :
        view === 'detail' ? <DeliberationDetail deliberationId={selectedId} onBack={handleBack} onEdit={handleEdit} authMemberId={authMemberId} /> :
        <DeliberationsList onSelect={handleSelect} onNew={handleNew} authMemberId={authMemberId} />
      )}
```

- [ ] **Step 8: Smoke test navigateur**

`bin/dev`, créer une délibération → `PhaseBar` avec `Brouillon` actif. Ajouter une proposition → bouton Publier s'active. Publier → `open`.

- [ ] **Step 9: Commit**

```bash
git add app/frontend/pages/Strategy/Index.jsx
git commit -m "feat(strategy-ui): phase bar, publish and cancel buttons in detail view"
```

---

### Task 20: Frontend — réactions phase-gated + commentaires groupés par phase

**Context:** Les boutons de réaction n'apparaissent qu'en phase `voting`. Les commentaires sont groupés par phase dans le rendu.

**Files:**
- Modify: `app/frontend/pages/Strategy/Index.jsx`

- [ ] **Step 1: Gate le bouton `Ajouter` une proposition à draft + auteur**

Dans le header du bloc Proposals, localiser le bouton `Ajouter` (actuellement conditionné à `delib.status !== 'decided' && delib.status !== 'archived'`) et remplacer sa condition par :

```jsx
          {delib.status === 'draft' && String(delib.createdById) === String(authMemberId) && !delib.proposals?.length && (
            <button onClick={() => setShowProposalForm(true)}
              className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-colors" style={{ color: ACCENT }}>
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          )}
```

- [ ] **Step 2: Gate les boutons de réaction à la phase `voting`**

Localiser le bloc `{/* Reaction buttons */}` et remplacer toute la condition existante (`delib.status !== 'decided' && delib.status !== 'archived'`) ainsi que son contenu interne par :

```jsx
            {delib.status === 'voting' && (
              <div className="ml-10">
                {reactionForm?.proposalId === p.id ? (
                  <ReactionFormInline
                    position={reactionForm.position}
                    requireRationale={reactionForm.position === 'objection'}
                    onSubmit={(rationale) => handleReaction(p.id, reactionForm.position, rationale)}
                    onCancel={() => setReactionForm(null)}
                  />
                ) : (
                  <div className="flex gap-1.5">
                    {REACTION_CONFIG.map(rc => (
                      <button key={rc.position} onClick={() => setReactionForm({ proposalId: p.id, position: rc.position })}
                        className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-stone-200 transition-colors ${rc.color}`}>
                        <rc.icon className="w-3 h-3" /> {rc.label}
                      </button>
                    ))}
                  </div>
                )}
                {reactionForm?.proposalId === p.id && reactionForm.position === 'objection' && (
                  <p className="text-[10px] text-red-600 mt-1">
                    Poser une objection rallonge la phase de vote de 7 jours.
                  </p>
                )}
              </div>
            )}
```

- [ ] **Step 3: Mettre à jour `ReactionFormInline` pour rendre le rationale obligatoire sur objection**

Remplacer la fonction `ReactionFormInline` par :

```jsx
function ReactionFormInline({ position, requireRationale, onSubmit, onCancel }) {
  const [rationale, setRationale] = useState('')
  const config = REACTION_CONFIG.find(r => r.position === position)
  const canSubmit = requireRationale ? rationale.trim().length > 0 : true

  return (
    <div className="flex items-center gap-2 mt-1">
      <span className={`text-xs font-medium ${config.color.split(' ')[0]}`}>{config.label} :</span>
      <input type="text" value={rationale} onChange={e => setRationale(e.target.value)}
        placeholder={requireRationale ? 'Argumentaire obligatoire' : 'Argumentaire (optionnel)...'}
        className="flex-1 px-2 py-1 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/30"
        onKeyDown={e => { if (e.key === 'Enter' && canSubmit) { e.preventDefault(); onSubmit(rationale) } }} />
      <button onClick={() => canSubmit && onSubmit(rationale)} disabled={!canSubmit}
        className="text-xs px-2 py-1 rounded-lg text-white hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: ACCENT }}>
        OK
      </button>
      <button onClick={onCancel} className="text-xs text-stone-400 hover:text-stone-600">
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Gate le bouton "Marquer comme décidée" à `outcome_pending` + auteur**

Localiser le bloc `{/* Decide button */}` et remplacer son conteneur conditionnel par :

```jsx
      {delib.status === 'outcome_pending' && String(delib.createdById) === String(authMemberId) && (
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          {showDecideForm ? (
            <form onSubmit={handleDecide}>
              <label className="block text-xs font-medium text-stone-600 mb-1">Résultat de la décision</label>
              <SimpleEditor content={outcomeText} onUpdate={setOutcomeText} placeholder="Décrivez la décision prise..." minHeight="120px" />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowDecideForm(false)} className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg">Annuler</button>
                <button type="submit" disabled={!outcomeText.trim()} className="px-3 py-1.5 text-xs font-medium text-white rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50">Confirmer la décision</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowDecideForm(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800 transition-colors">
              <Check className="w-4 h-4" /> Rédiger la décision
            </button>
          )}
        </div>
      )}
```

- [ ] **Step 5: Remplacer la section commentaires par un rendu groupé par phase**

Localiser le bloc `{/* Comments */}` et remplacer intégralement son contenu par :

```jsx
      {/* Comments grouped by phase */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" /> Discussion ({delib.commentCount || 0})
        </h3>

        {(() => {
          const byPhase = delib.commentsByPhase || {}
          const phases = ['draft', 'open', 'voting', 'outcome_pending', 'decided', 'cancelled']
          const hasAny = phases.some(p => (byPhase[p] || []).length > 0)
          if (!hasAny) {
            return <p className="text-sm text-stone-400 mb-3">Aucun commentaire pour le moment.</p>
          }
          return phases.map(phase => {
            const phaseComments = byPhase[phase] || []
            if (!phaseComments.length) return null
            return (
              <div key={phase} className="mb-5 last:mb-0">
                <div className="text-[10px] uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-1 mb-3">
                  {PHASE_SECTION_LABELS[phase]}
                </div>
                <div className="space-y-3">
                  {phaseComments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {c.authorAvatar ? <img src={c.authorAvatar} className="w-7 h-7 rounded-full" alt="" /> : c.authorName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-stone-700">{c.authorName}</span>
                          <span className="text-[10px] text-stone-400">{new Date(c.createdAt).toLocaleString('fr-BE')}</span>
                        </div>
                        <p className="text-sm text-stone-600 mt-0.5">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        })()}

        {delib.status !== 'cancelled' && delib.status !== 'decided' && (
          <form onSubmit={handleAddComment} className="flex gap-2 mt-4 pt-4 border-t border-stone-100">
            <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            <button type="submit" disabled={!newComment.trim()} className="p-2 rounded-lg text-white disabled:opacity-50 transition-colors hover:opacity-90" style={{ backgroundColor: ACCENT }}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
```

- [ ] **Step 6: Smoke test navigateur**

Vérifier qu'en phase `voting` on voit les boutons Consent/Objection, et que les commentaires sont regroupés par phase avec les en-têtes "Commentaires pendant la …". En `decided`/`cancelled`, le formulaire de commentaire est caché.

- [ ] **Step 7: Commit**

```bash
git add app/frontend/pages/Strategy/Index.jsx
git commit -m "feat(strategy-ui): phase-gated reactions + comments grouped by phase"
```

---

### Task 21: Frontend — Panneau d'historique des versions + amendement

**Context:** Modal qui affiche les versions successives de la proposition. Bouton d'amendement en phases draft/open.

**Files:**
- Modify: `app/frontend/pages/Strategy/Index.jsx`

- [ ] **Step 1: Ajouter le composant `ProposalVersionsPanel`**

Insérer juste après `ReactionFormInline` :

```jsx
function ProposalVersionsPanel({ proposalId, onClose }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await apiRequest(`/api/v1/strategy/proposals/${proposalId}/versions`)
      if (data) setVersions(data.versions || [])
      setLoading(false)
    }
    load()
  }, [proposalId])

  return (
    <div className="fixed inset-0 bg-stone-900/40 flex items-start justify-end z-50" onClick={onClose}>
      <div className="w-full max-w-lg h-full bg-white border-l border-stone-200 overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-stone-200 px-5 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-900">Historique des versions</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-stone-100"><X className="w-4 h-4 text-stone-500" /></button>
        </div>
        <div className="px-5 py-4 space-y-5">
          {loading && <p className="text-sm text-stone-400">Chargement...</p>}
          {!loading && versions.length === 0 && <p className="text-sm text-stone-400">Aucune version.</p>}
          {!loading && versions.map(v => (
            <div key={v.id} className="border border-stone-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-700">v{v.version}</span>
                <span className="text-[10px] text-stone-400">{new Date(v.createdAt).toLocaleString('fr-BE')}</span>
              </div>
              <div
                className="prose prose-stone prose-sm max-w-none text-sm text-stone-700"
                dangerouslySetInnerHTML={{ __html: v.content }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Ajouter le state du panneau et de l'amendement dans `DeliberationDetail`**

Dans `DeliberationDetail`, ajouter en tête (près des autres `useState`) :

```jsx
  const [showVersionsFor, setShowVersionsFor] = useState(null)
  const [editingProposalId, setEditingProposalId] = useState(null)
  const [editingProposalContent, setEditingProposalContent] = useState('')

  const handleAmendProposal = async (e) => {
    e.preventDefault()
    if (!editingProposalContent.trim()) return
    await apiRequest(`/api/v1/strategy/proposals/${editingProposalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editingProposalContent })
    })
    setEditingProposalId(null)
    setEditingProposalContent('')
    load()
  }
```

- [ ] **Step 3: Afficher le bouton "Voir l'historique" et le bouton "Amender"**

Dans le bloc de rendu d'une proposition (dans `(delib.proposals || []).map(p => ...)`), après le bloc du contenu de la proposition, ajouter :

```jsx
                <div className="flex items-center gap-3 mt-1">
                  {(delib.status === 'draft' || delib.status === 'open') && String(delib.createdById) === String(authMemberId) && (
                    <button
                      onClick={() => { setEditingProposalId(p.id); setEditingProposalContent(p.content) }}
                      className="text-[11px] text-amber-600 hover:underline"
                    >
                      Amender la proposition
                    </button>
                  )}
                  {p.versionsCount > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowVersionsFor(p.id) }}
                      className="text-[11px] text-blue-600 hover:underline"
                    >
                      Voir l'historique des {p.versionsCount} versions
                    </button>
                  )}
                </div>
```

- [ ] **Step 4: Rendre les modals juste avant le `</div>` final du composant**

Juste avant le `</div>` qui ferme le `return` de `DeliberationDetail`, insérer :

```jsx
      {showVersionsFor && (
        <ProposalVersionsPanel proposalId={showVersionsFor} onClose={() => setShowVersionsFor(null)} />
      )}

      {editingProposalId && (
        <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-50">
          <div className="w-full max-w-xl bg-white rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-stone-900 mb-3">Amender la proposition</h2>
            <form onSubmit={handleAmendProposal}>
              <SimpleEditor
                content={editingProposalContent}
                onUpdate={setEditingProposalContent}
                placeholder="Nouvelle version de la proposition..."
                minHeight="200px"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button type="button" onClick={() => { setEditingProposalId(null); setEditingProposalContent('') }}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg">Annuler</button>
                <button type="submit" disabled={!editingProposalContent.trim()}
                  className="px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50 hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}>Enregistrer la nouvelle version</button>
              </div>
            </form>
          </div>
        </div>
      )}
```

- [ ] **Step 5: Smoke test navigateur**

Amender en `draft` → version passe à 2 → bouton "Voir l'historique des 2 versions" apparaît → le panneau liste v1 et v2.

- [ ] **Step 6: Commit**

```bash
git add app/frontend/pages/Strategy/Index.jsx
git commit -m "feat(strategy-ui): proposal amendment + version history panel"
```

---

### Task 22: Frontend — `DeliberationForm` : retirer `decision_mode` et `status`

**Context:** Le formulaire de création ne prend plus que `title` + `context`.

**Files:**
- Modify: `app/frontend/pages/Strategy/Index.jsx`

- [ ] **Step 1: Remplacer `DeliberationForm`**

Remplacer intégralement la fonction `DeliberationForm` par :

```jsx
function DeliberationForm({ deliberation, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: deliberation?.title || '',
    context: deliberation?.context || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const url = deliberation?.id ? `/api/v1/strategy/deliberations/${deliberation.id}` : '/api/v1/strategy/deliberations'
    const method = deliberation?.id ? 'PATCH' : 'POST'
    const data = await apiRequest(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setSaving(false)
    if (data?.deliberation) onSave()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">
          {deliberation?.id ? 'Modifier la delibération' : 'Nouvelle delibération'}
        </h2>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Titre *</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            placeholder="Sujet de la delibération" />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Contexte</label>
          <SimpleEditor content={form.context} onUpdate={(html) => setForm(f => ({ ...f, context: html }))}
            placeholder="Pourquoi cette delibération est-elle nécessaire ?" minHeight="150px" />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">Annuler</button>
        <button type="submit" disabled={saving || !form.title}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: ACCENT }}>
          {saving ? 'Enregistrement...' : (deliberation?.id ? 'Mettre à jour' : 'Créer')}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Smoke test navigateur**

Créer une nouvelle délibération : plus de select `decision_mode`/`status`. Enregistrer → délibération en `draft`.

- [ ] **Step 3: Commit**

```bash
git add app/frontend/pages/Strategy/Index.jsx
git commit -m "refactor(strategy-ui): simplify DeliberationForm (title + context only)"
```

---

### Task 23: Smoke test manuel complet des routes Strategy

**Context:** Suivant la règle CLAUDE.md (vérification d'endpoints après refactoring destructif).

- [ ] **Step 1: Démarrer le dev server**

```bash
bin/dev
```

- [ ] **Step 2: Authentification curl**

```bash
curl -c /tmp/terranova-cookies.txt -b /tmp/terranova-cookies.txt \
  -X POST \
  -d 'email=sophie.dubois@semisto.org&password=terranova2026' \
  http://localhost:3000/login
```

- [ ] **Step 3: Frapper chaque endpoint**

```bash
curl -sS -b /tmp/terranova-cookies.txt http://localhost:3000/api/v1/strategy/deliberations | head -c 200; echo

curl -sS -b /tmp/terranova-cookies.txt -X POST -H "Content-Type: application/json" \
  -d '{"title":"Smoke test","context":"<p>test</p>"}' \
  http://localhost:3000/api/v1/strategy/deliberations
```

Noter l'`id` de la délibération créée (variable `$DELIB_ID`) et répéter pour :

- `POST /api/v1/strategy/deliberations/$DELIB_ID/proposals`
- `PATCH /api/v1/strategy/deliberations/$DELIB_ID/publish`
- `PATCH /api/v1/strategy/deliberations/$DELIB_ID/cancel`
- `GET /api/v1/strategy/deliberations/$DELIB_ID/comments`
- `POST /api/v1/strategy/deliberations/$DELIB_ID/comments`
- `PATCH /api/v1/strategy/proposals/$PROPOSAL_ID` (pour amendement)
- `GET /api/v1/strategy/proposals/$PROPOSAL_ID/versions`
- `POST /api/v1/strategy/proposals/$PROPOSAL_ID/reactions` (en phase voting uniquement)

Expected : pas de 500 sur ces appels. Les refus métier (409/422) sont OK.

- [ ] **Step 4: Parcours UI complet**

Navigateur connecté en Sophie :
1. `/strategy?tab=deliberations` → liste vide ou avec données existantes.
2. Créer une délibération → badge `Brouillon`, barre de phase active sur `Brouillon`.
3. Ajouter une proposition → bouton Publier s'active.
4. Amender la proposition → compteur version passe à 2.
5. "Voir l'historique des 2 versions" → panneau latéral.
6. Publier → passage à `Discussion`, countdown visible.
7. Ajouter un commentaire → apparaît sous "Commentaires pendant la discussion".
8. Simuler l'avancement au vote :

```bash
bin/rails runner 'Strategy::Deliberation.last.update!(opened_at: 16.days.ago)'
bin/rails strategy:advance_deliberations
```

Recharger la page → `Vote en cours`, boutons Consentement/Objection visibles.
9. Poser une objection → countdown remonte à 7 j.
10. Simuler la fin du vote :

```bash
bin/rails runner 'Strategy::Deliberation.last.update!(voting_deadline: 1.minute.ago)'
bin/rails strategy:advance_deliberations
```

Recharger → `Décision`.
11. Rédiger la décision → phase `decided`, formulaire commentaire caché.
12. Nouvelle délibération → l'annuler → badge `Annulée`.

- [ ] **Step 5: Vérifier la garde `effective?`**

```bash
bin/rails runner 'Member.find_by(email: "sophie.dubois@semisto.org").update!(membership_type: "adherent")'
```

Recharger `http://localhost:3000/` → Stratego disparaît du menu. Aller à `/strategy` → redirection vers `/` avec alerte. Curl `GET /api/v1/strategy/deliberations` → 403.

Restaurer :

```bash
bin/rails runner 'Member.find_by(email: "sophie.dubois@semisto.org").update!(membership_type: "effective")'
```

- [ ] **Step 6: Stopper le dev server**

`Ctrl+C` dans le terminal `bin/dev`.

- [ ] **Step 7: Pas de commit** (vérification manuelle)

---

### Task 24: Synchronisation du skill `terranova-api`

**Context:** CLAUDE.md impose de mettre à jour les références du skill `terranova-api` quand des endpoints API changent. Ce fichier vit en dehors du repo (dans `~/.claude/skills/`).

**Files:**
- Modify: `~/.claude/skills/terranova-api/api-reference/strategy-deliberations.md` (ou équivalent)

- [ ] **Step 1: Localiser le fichier de référence**

```bash
ls ~/.claude/skills/terranova-api/api-reference/ | grep -i strategy
```

- [ ] **Step 2: Lire le fichier existant**

```bash
cat ~/.claude/skills/terranova-api/api-reference/strategy-deliberations.md
```

(Adapter le nom du fichier si nécessaire.)

- [ ] **Step 3: Mettre à jour le contenu**

Supprimer toute mention de :
- `decision_mode`
- positions `abstain`, `amendment`
- statuts `in_progress`, `archived`
- routes `DELETE strategy/deliberations/:id`, `DELETE strategy/proposals/:id`

Ajouter :
- `PATCH strategy/deliberations/:id/publish`
- `PATCH strategy/deliberations/:id/cancel`
- `GET strategy/proposals/:id/versions`
- Nouveaux statuts : `draft`, `open`, `voting`, `outcome_pending`, `decided`, `cancelled`
- Comportement `create_reaction` : uniquement en `voting`, rationale obligatoire pour `objection`
- Comportement `create_comment` : actif sauf `decided`/`cancelled`, réponse groupée par phase via `commentsByPhase`
- Garde globale `effective?` : toutes les actions renvoient 403 pour non-effective

Si le fichier n'existe pas, le créer avec la structure suivante :

```markdown
# Strategy — Délibérations

## Auth
All routes require authentication and `membership_type = effective`. Otherwise 403.

## Routes
- GET  /api/v1/strategy/deliberations
- GET  /api/v1/strategy/deliberations/:id
- POST /api/v1/strategy/deliberations
- PATCH /api/v1/strategy/deliberations/:id (draft only, author only)
- PATCH /api/v1/strategy/deliberations/:id/publish (author, requires proposal)
- PATCH /api/v1/strategy/deliberations/:id/cancel (author, any phase except decided)
- PATCH /api/v1/strategy/deliberations/:id/decide (author, outcome_pending only)
- POST /api/v1/strategy/deliberations/:id/proposals (author, draft only)
- PATCH /api/v1/strategy/proposals/:id (author, draft|open, creates new version)
- GET /api/v1/strategy/proposals/:id/versions
- POST /api/v1/strategy/proposals/:id/reactions (voting only, rationale required for objection)
- GET /api/v1/strategy/deliberations/:id/comments (returns commentsByPhase hash)
- POST /api/v1/strategy/deliberations/:id/comments (except in decided/cancelled)
- DELETE /api/v1/strategy/deliberation-comments/:id

## Statuses
draft → open → voting → outcome_pending → decided
(any non-decided) → cancelled

## Reaction positions
consent | objection

## Notes
- An objection in voting phase resets voting_deadline to `now + 7 days`.
- The rake task `strategy:advance_deliberations` advances `open → voting` after 15 days and `voting → outcome_pending` when the deadline is reached. Scheduled every 10 minutes by Hatchbox.
```

- [ ] **Step 4: Pas de commit dans le repo terranova**

Le fichier vit hors repo. Signaler la mise à jour dans le message du dernier commit terranova si pertinent.

---

## Self-review checklist

**1. Spec coverage**
- Cleanup working tree → Task 1
- Migration DB (delibérations + proposals + versions + réactions + comments) → Task 2
- `Member#can_access_strategy?` → Task 3
- `test_member` override → Task 4
- `Strategy::ProposalVersion` modèle → Task 5
- `Strategy::Deliberation` statuts/transitions/visible_to → Task 6
- `Strategy::Proposal` versionning + unicité → Task 7
- `Strategy::Reaction` positions + rationale conditionnel + hook → Task 8
- `Strategy::DeliberationComment` phase_at_creation → Task 9
- Rake task `advance_deliberations` → Task 10
- Routes (add publish/cancel/versions, remove destroy) → Task 11
- Contrôleur API refonte complète → Task 12
- Garde page Inertia → Task 13
- Tests d'intégration (réécriture) → Task 14
- Non-régression suite complète → Task 15
- ContextSwitcher → Task 16
- Frontend constantes + nettoyage → Task 17
- Frontend DeliberationsList (brouillons + countdown) → Task 18
- Frontend DeliberationDetail (PhaseBar + publish/cancel) → Task 19
- Frontend réactions gated + commentaires groupés → Task 20
- Frontend versions panel + amendement → Task 21
- Frontend DeliberationForm simplifié → Task 22
- Smoke tests manuels → Task 23
- Skill terranova-api sync → Task 24

Toutes les sections de la spec ont au moins une task.

**2. Placeholder scan**
Aucun TBD/TODO/« à compléter ». Chaque step contient soit du code complet, soit une commande shell exacte.

**3. Cohérence des types**
- `Strategy::Deliberation::STATUSES` = `%w[draft open voting outcome_pending decided cancelled]` — utilisé partout dans le même ordre (Task 6 définition, Tasks 10/12/14/17/20 utilisation).
- `can_publish?`, `publish!`, `transition_to_voting!`, `transition_to_outcome_pending!`, `extend_voting!`, `cancel!`, `discussion_deadline`, `visible_to` définis dans Task 6, référencés par Tasks 7 (via create), 10 (rake), 12 (controller), 14 (tests).
- `record_new_version!` défini Task 7, référencé Task 12 dans `update_proposal`.
- `can_access_strategy?` défini Task 3, référencé Tasks 12 (`ensure_effective_member`) et 13 (`require_effective_for_strategy`).
- `ensure_effective_member` défini Task 12, garde toutes les actions du contrôleur.
- `commentsByPhase` produit par Task 12 (`comments` action + `as_json_full`), consommé par Task 20 (frontend).
- `phaseCountdownLabel`, `daysRemaining` définis Task 18, utilisés aussi dans `PhaseBar` de Task 19.
- `PHASE_SECTION_LABELS` défini Task 17, utilisé Task 20.
- `authMemberId` propagé depuis `StrategyIndex` (Task 18) à `DeliberationsList` (Task 18) et `DeliberationDetail` (Task 19).
- `PHASES` constante déclarée Task 19, utilisée uniquement dans `PhaseBar`.
