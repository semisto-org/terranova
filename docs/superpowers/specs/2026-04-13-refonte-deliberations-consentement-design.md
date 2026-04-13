# Refonte du workflow de délibérations par consentement

**Date** : 2026-04-13
**Statut** : Approuvé — prêt pour plan d'implémentation
**Module** : `Strategy` (Stratego)

## Contexte

Le module Stratego propose aujourd'hui des délibérations avec trois modes de décision (consent / vote / advisory), un statut unique (`open`, `in_progress`, `decided`, `archived`), et quatre types de réactions (`consent`, `objection`, `abstain`, `amendment`). L'absence de phases temporelles empêche d'appliquer un vrai processus sociocratique : pas de période de discussion isolée, pas de période de vote bornée, pas de mécanique d'extension sur objection.

Cette refonte remplace ce modèle ad-hoc par un workflow de **consentement en phases temporelles**, restreint aux **membres effectifs**, avec **historique de propositions** et **transitions automatisées**.

## Objectifs

- Processus de décision en quatre phases séquentielles : brouillon → discussion (15 j) → vote (7 j, extensible sur objection) → rédaction de décision.
- Visibilité des brouillons restreinte à leur auteur.
- Accès au module restreint aux membres effectifs (menu + page + API).
- Une seule proposition par délibération, amendable avec traçabilité des versions.
- Transitions automatiques entre phases via un rake task déclenché par Hatchbox.

## Workflow cible

```
[*] → draft
draft --publish--> open             (auteur, si proposition présente)
open --+15 j auto--> voting         (rake task)
voting --objection posée--> voting  (voting_deadline = now + 7 j)
voting --deadline atteinte--> outcome_pending  (rake task)
outcome_pending --decide--> decided (auteur rédige l'issue)
[draft|open|voting|outcome_pending] --cancel--> cancelled  (auteur)
```

Statuts : `draft`, `open`, `voting`, `outcome_pending`, `decided`, `cancelled`.

## Architecture de données

### Modifications `strategy_deliberations`

| Colonne              | Action                                                                        |
|----------------------|-------------------------------------------------------------------------------|
| `status`             | `default: 'draft'` (was `'open'`). Backfill de toutes les lignes vers `draft`.|
| `decision_mode`      | **Supprimée**.                                                                |
| `opened_at`          | **Ajoutée**, datetime nullable. Set à `publish!`.                             |
| `voting_started_at`  | **Ajoutée**, datetime nullable. Set à `transition_to_voting!`.                |
| `voting_deadline`    | **Ajoutée**, datetime nullable. Set à `transition_to_voting!` puis reset à chaque objection. |

Les lignes existantes (quel que soit leur statut courant) sont basculées en `draft`. `opened_at`, `voting_started_at`, `voting_deadline` restent `NULL` pour elles.

### Modifications `strategy_proposals`

| Colonne              | Action                                                                        |
|----------------------|-------------------------------------------------------------------------------|
| `version`            | **Ajoutée**, integer NOT NULL default 1.                                      |
| `status`             | **Supprimée** (plus de sémantique métier utile).                              |
| `deliberation_id`    | **Index unique** ajouté — une proposition max par délibération.               |

Backfill : sur les délibérations qui ont plusieurs propositions aujourd'hui (si ça existe), ne conserver que la plus ancienne. (Vérifier le volume au moment de la migration ; sinon, alerter dans la migration.)

### Nouvelle table `strategy_proposal_versions`

```ruby
create_table :strategy_proposal_versions do |t|
  t.references :proposal, null: false, foreign_key: { to_table: :strategy_proposals }
  t.integer :version, null: false
  t.text :content, null: false
  t.datetime :created_at, null: false
  t.index [:proposal_id, :version], unique: true
end
```

Une ligne est créée à la **création** de la proposition (v1) et à chaque **amendement** (v2, v3, …). L'auteur n'est pas tracé dans `ProposalVersion` parce qu'il est invariant (`= deliberation.created_by_id`).

### Modifications `strategy_reactions`

| Colonne              | Action                                                                        |
|----------------------|-------------------------------------------------------------------------------|
| `position`           | Lignes `abstain` / `amendment` supprimées. Seuls `consent` / `objection` restent. |
| `rationale`          | **Reste nullable au niveau DB.** Validation modèle exige la présence pour `objection` uniquement. |

Side-effect de cette refonte : l'index unique partiel introduit par la migration non committée `20260413112303_allow_multiple_amendment_reactions.rb` devient redondant. Il faut revenir à l'index unique simple `[proposal_id, member_id]` (plus d'exception pour `amendment`).

### Modifications `strategy_deliberation_comments`

| Colonne              | Action                                                                        |
|----------------------|-------------------------------------------------------------------------------|
| `phase_at_creation`  | **Ajoutée**, string NOT NULL, default `'draft'`. Set au `before_create`.     |

Permet de grouper les commentaires par phase dans l'UI. Les commentaires existants sont backfillés à `'draft'` (valeur par défaut neutre, puisqu'on ignore la phase historique).

## Modèles Ruby

### `Strategy::Deliberation`

```ruby
STATUSES = %w[draft open voting outcome_pending decided cancelled].freeze
```

- Suppression totale de `decision_mode` / `DECISION_MODES`.
- Scope `visible_to(member)` : renvoie les délibérations non-`draft` + les `draft` dont `created_by_id == member.id`.
- `has_one :proposal` (au lieu de `has_many`).
- `can_publish?` → `draft? && proposal.present?`
- `discussion_deadline` → `opened_at + 15.days` (raises si `opened_at` nil).
- `publish!` → `update!(status: 'open', opened_at: Time.current)`.
- `transition_to_voting!` → `update!(status: 'voting', voting_started_at: Time.current, voting_deadline: Time.current + 7.days)`.
- `transition_to_outcome_pending!` → `update!(status: 'outcome_pending')`.
- `cancel!` → `update!(status: 'cancelled')` (caller vérifie que `status != decided`).
- `extend_voting!` → `update!(voting_deadline: Time.current + 7.days)` (reset au lieu d'additif).

### `Strategy::Proposal`

- `belongs_to :deliberation` avec unicité au niveau du `deliberation_id`.
- `belongs_to :author, class_name: 'Member'` : le champ `author_id` reste en DB, invariant `author_id == deliberation.created_by_id` à enforcer côté contrôleur (à la création uniquement — on ne réassigne jamais).
- `has_many :versions, class_name: 'Strategy::ProposalVersion'`.
- Callback `after_create :record_initial_version` (crée v1 avec `content` courant).
- `record_new_version!(new_content)` (appelé depuis `update_proposal`) — atomique dans un `transaction do` :
  1. `self.version += 1`
  2. `versions.create!(version: self.version, content: new_content)`
  3. `update!(content: new_content)`
- Suppression de la constante `STATUSES` et du champ `status` (colonne supprimée en migration).

### `Strategy::ProposalVersion` (nouveau)

- `belongs_to :proposal, class_name: 'Strategy::Proposal'`.
- Read-only après création (aucune méthode d'update exposée).
- `scope :chronological, -> { order(:version) }`.

### `Strategy::Reaction`

```ruby
POSITIONS = %w[consent objection].freeze
```

- `validates :rationale, presence: true, if: -> { position == 'objection' }`
- Callback `after_create :extend_voting_on_objection` : si `position == 'objection'` et que la délibération parent est en `voting`, appelle `proposal.deliberation.extend_voting!`.
- L'unicité `[proposal_id, member_id]` redevient simple (sans exception).
- Sérialiseur (`as_json_brief`) : retourne `rationale` tel quel si présent, sinon `'Pas d'argumentaire fourni'` **pour l'affichage**. Alternative propre : retourner `null` et laisser le frontend gérer la valeur de fallback. **Décision** : le fallback reste côté frontend, l'API retourne `null` pour rester honnête.

### `Strategy::DeliberationComment`

- `before_create { self.phase_at_creation ||= deliberation.status }`
- Ajout `scope :grouped_by_phase` pour faciliter l'affichage côté API.

## API

Fichier : `app/controllers/api/v1/strategy/deliberations_controller.rb`.

### Garde globale

```ruby
before_action :ensure_effective_member
```

Retourne 403 `{ error: 'Accès réservé aux membres effectifs' }` si `current_member&.effective?` est faux. Cette garde couvre toutes les actions du contrôleur.

### Actions

| Action              | Méthode + route                                                | Contraintes de phase / autorisation                                                                         |
|---------------------|----------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| `index`             | `GET /api/v1/strategy/deliberations`                           | Filtre via `visible_to(current_member)`.                                                                    |
| `show`              | `GET /api/v1/strategy/deliberations/:id`                        | Vérifie `visible_to` → 404 sinon.                                                                           |
| `create`            | `POST /api/v1/strategy/deliberations`                           | Toujours créée en `draft`, `created_by_id = current_member.id`.                                             |
| `update`            | `PATCH /api/v1/strategy/deliberations/:id`                      | Permis uniquement si `draft?` **et** `author == current_member`. Permit : `title`, `context`.               |
| `publish`           | `PATCH /api/v1/strategy/deliberations/:id/publish`              | `can_publish?` + `author == current_member`.                                                                |
| `cancel`            | `PATCH /api/v1/strategy/deliberations/:id/cancel`               | `status != decided` + `author == current_member`.                                                           |
| `decide`            | `PATCH /api/v1/strategy/deliberations/:id/decide`               | `outcome_pending?` + `author == current_member`. Set `status = 'decided'`, `outcome`, `decided_at`.         |
| `create_proposal`   | `POST /api/v1/strategy/deliberations/:id/proposals`             | `draft?` + `author == current_member` + aucune proposition existante.                                       |
| `update_proposal`   | `PATCH /api/v1/strategy/proposals/:id`                          | `draft? || open?` + `author == current_member`. Appelle `record_new_version!`.                              |
| `proposal_versions` | `GET /api/v1/strategy/proposals/:id/versions`                   | Authentifié, accessible dès que la délibération est `visible_to`.                                           |
| `create_reaction`   | `POST /api/v1/strategy/proposals/:id/reactions`                 | `voting?` + `voting_deadline > Time.current`. Rationale obligatoire si `position == 'objection'`.           |
| `comments`          | `GET /api/v1/strategy/deliberations/:id/comments`               | Retourne les commentaires groupés par phase (`{ draft: […], open: […], voting: […], … }`).                  |
| `create_comment`    | `POST /api/v1/strategy/deliberations/:id/comments`              | Autorisé pour toutes les phases **sauf** `cancelled` et `decided`.                                          |
| `destroy_comment`   | `DELETE /api/v1/strategy/deliberation-comments/:id`             | Inchangé — auteur du commentaire uniquement.                                                                |

### Suppressions

- `destroy` (délibération) : **supprimé**. La suppression se fait via `cancel`.
- `destroy_proposal` : **supprimé**. Une proposition est indissociable de sa délibération.

### Sérialisation

`Deliberation#as_json_brief` expose en plus :
- `openedAt`, `votingStartedAt`, `votingDeadline`
- `discussionDeadline` (calculé si applicable)
- `canPublish`, `canCancel`, `canDecide` (booléens dépendant du current_member)
- `daysRemaining` (int ou null selon la phase)

`Deliberation#as_json_full` expose en plus :
- `proposal` (objet unique, pas un tableau) avec `versionsCount`
- `commentsByPhase` (hash `{ draft: [...], open: [...], … }`)

`Proposal#as_json_full` expose :
- `version` (courante)
- `reactions` (nettoyées de `abstain`/`amendment`)

Suppression de toute référence à `decisionMode`, `abstain`, `amendment` dans les sérialiseurs.

## Routes

Fichier : `config/routes.rb`.

Ajouts :
```ruby
patch "strategy/deliberations/:id/publish", to: "strategy/deliberations#publish"
patch "strategy/deliberations/:id/cancel",  to: "strategy/deliberations#cancel"
get   "strategy/proposals/:id/versions",    to: "strategy/deliberations#proposal_versions"
```

Suppressions :
```ruby
delete "strategy/deliberations/:id", to: "strategy/deliberations#destroy"
delete "strategy/proposals/:id",     to: "strategy/deliberations#destroy_proposal"
```

## Rake task

Nouveau fichier : `lib/tasks/strategy.rake`.

```ruby
namespace :strategy do
  desc "Advance deliberations that have reached their phase deadline"
  task advance_deliberations: :environment do
    # open → voting
    Strategy::Deliberation.where(status: 'open')
      .where('opened_at <= ?', 15.days.ago)
      .find_each(&:transition_to_voting!)

    # voting → outcome_pending
    Strategy::Deliberation.where(status: 'voting')
      .where('voting_deadline <= ?', Time.current)
      .find_each(&:transition_to_outcome_pending!)
  end
end
```

Déclenché par un cron Hatchbox toutes les 10 minutes : `bin/rails strategy:advance_deliberations`.

**Note race condition** : comme `extend_voting!` met `voting_deadline = Time.current + 7.days`, une objection posée juste avant l'exécution du cron repousse automatiquement la deadline au-delà de `Time.current`, et le `where('voting_deadline <= ?', Time.current)` ne la sélectionnera pas. Pas de verrouillage nécessaire.

## Autorisation d'accès à Stratego

### Helper centralisé

Dans `Member` :
```ruby
def can_access_strategy?
  effective?
end
```

### Côté API

`Api::V1::Strategy::DeliberationsController#ensure_effective_member` (private) rend 403 sinon. (Les autres contrôleurs Strategy — `resources`, `frameworks`, `axes` — sont hors scope de cette refonte et restent ouverts.)

### Côté page Inertia

`AppController#strategy` :
```ruby
before_action :require_effective_member_for_strategy, only: [:strategy]

def require_effective_member_for_strategy
  redirect_to root_path, alert: "Accès réservé aux membres effectifs" unless current_member&.can_access_strategy?
end
```

### Côté frontend

`ContextSwitcher.jsx` : le lien `/strategy` est rendu conditionnellement :

```jsx
{auth?.member?.membershipType === 'effective' && (
  <Link href="/strategy">…</Link>
)}
```

## Frontend

Fichier : `app/frontend/pages/Strategy/Index.jsx` (~1515 lignes).

### Constantes à mettre à jour

```js
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

const REACTION_CONFIG = [
  { position: 'consent',   label: 'Consentement', icon: Check,   color: 'text-green-600 hover:bg-green-50' },
  { position: 'objection', label: 'Objection',    icon: XCircle, color: 'text-red-600 hover:bg-red-50' },
]
```

Suppression des constantes `DECISION_MODE_LABELS`, entrées `abstain` et `amendment`.

### `DeliberationsList`

- Filtre par défaut : `open` (déjà fait).
- Section **"Mes brouillons"** affichée en haut (si la liste `draft` de l'utilisateur courant n'est pas vide), encadrée par un bandeau clair `"Visible uniquement par vous"`.
- Chaque carte : badge de statut + compte à rebours (`daysRemaining` transmis par l'API) du type `"Discussion : 12 jours restants"` ou `"Vote : 5 jours restants"`.

### `DeliberationDetail`

- **Barre de phases** en en-tête, 4 étapes (Brouillon / Discussion / Vote / Décision). L'étape courante est mise en évidence avec la couleur d'accent. Compteur visible de jours restants pour la phase active.
- **Phase `draft`** :
  - Bandeau : `"Brouillon — Visible uniquement par vous"`.
  - Formulaire de proposition inline (une seule permise).
  - Bouton **"Publier la délibération"** (désactivé si `!canPublish`).
- **Phase `open`** :
  - Proposition affichée, bouton **"Amender la proposition"** (auteur uniquement) → crée une nouvelle version.
  - Bouton **"Voir l'historique des versions"** (panneau latéral).
  - Commentaires actifs, réactions désactivées.
- **Phase `voting`** :
  - Commentaires actifs (toujours).
  - Boutons **Consentement** / **Objection** avec champ d'argumentaire. Message d'avertissement sur objection : `"Poser une objection rallonge la phase de vote de 7 jours"`.
  - Argumentaire obligatoire pour objection (validation côté UI + côté serveur).
- **Phase `outcome_pending`** :
  - Champ **Décision** accessible à l'auteur uniquement.
  - Réactions désactivées, commentaires toujours actifs.
- **Phase `decided`** :
  - Tout en lecture seule, décision affichée dans un bandeau vert.
  - Commentaires désactivés.
- **Phase `cancelled`** :
  - Tout en lecture seule, bandeau `"Délibération annulée"`.
- **Bouton "Annuler la délibération"** visible **pour l'auteur uniquement** tant que `status !== 'decided'`.

### Commentaires groupés par phase

Au lieu d'une liste plate, les commentaires sont groupés par `phase_at_creation` avec un séparateur visuel :

```
─── Commentaires pendant la discussion ───
[commentaires phase `open`]

─── Commentaires pendant le vote ───
[commentaires phase `voting`]

─── Commentaires pendant la rédaction de décision ───
[commentaires phase `outcome_pending`]
```

L'ordre chronologique est conservé à l'intérieur de chaque groupe. L'API renvoie déjà un hash groupé (`commentsByPhase`).

### Historique des versions

Nouveau composant `ProposalVersionsPanel` (panneau latéral ou modal) affichant la liste des versions avec leur date et contenu. Pas de diff visuel pour le MVP — chaque version est affichée in extenso, l'une sous l'autre, avec un en-tête `"v1 · créée le 12 avril"`.

### `DeliberationForm`

Formulaire de création — champs :
- Titre (obligatoire)
- Contexte (éditeur riche)

**Suppression** des selects `decision_mode` et `status`. Plus de mode d'édition de statut via le formulaire : les transitions passent par des boutons d'action (`publish`, `cancel`, `decide`).

## Tests — Approche TDD

Les tests sont **écrits en premier**, pour chaque capability, avant l'implémentation. L'ordre d'exécution du plan suit donc, pour chaque étape, la séquence "test → implémentation → refactor".

### `test/models/strategy/deliberation_test.rb` (nouveau)

- `visible_to` filtre correctement brouillons / non-brouillons selon le membre
- `publish!` refuse sans proposition
- `publish!` set `opened_at`
- `transition_to_voting!` set `voting_started_at` et `voting_deadline`
- `extend_voting!` reset `voting_deadline = Time.current + 7 jours`
- `cancel!` interdit si `decided`

### `test/models/strategy/proposal_test.rb` (nouveau)

- Création crée `ProposalVersion` v1 automatiquement
- `record_new_version!` incrémente `version`, crée une `ProposalVersion`, update `content`
- Une seule proposition par délibération (unicité)

### `test/models/strategy/reaction_test.rb` (nouveau)

- Seules `consent` / `objection` sont valides
- Objection : rationale obligatoire
- Consent : rationale optionnel
- Après création d'objection en phase `voting` : la deadline de la délibération est repoussée

### `test/integration/strategy_test.rb` (réécriture)

Nouveaux scénarios couverts :
1. `effective?` check : un adherent reçoit 403 sur toutes les routes délibération.
2. Un `non_member` reçoit 403.
3. Flux complet : create → add proposal → publish → commentaires en open → rake task avance en voting → consentements/objections → rake task avance en outcome_pending → decide.
4. Objection déclenche extension.
5. `cancel` fonctionne en toutes phases non-`decided`.
6. `update` titre/contexte : autorisé en `draft`, 422 en `open`.
7. `update_proposal` : autorisé en `draft` et en `open`, crée une `ProposalVersion` à chaque fois.
8. `update_proposal` interdit à quelqu'un d'autre que l'auteur.
9. `visible_to` : un membre effectif ne voit pas les brouillons d'un autre.
10. `proposal_versions` retourne l'historique complet.
11. Commentaires : permis à toutes les phases sauf `cancelled` et `decided`.
12. `destroy` n'existe plus (404 ou 405).

### `test/tasks/strategy_rake_test.rb` (nouveau)

- `strategy:advance_deliberations` bascule `open` → `voting` quand 15 jours sont écoulés
- `strategy:advance_deliberations` bascule `voting` → `outcome_pending` quand `voting_deadline` est atteinte
- `strategy:advance_deliberations` n'avance pas une délibération dont la deadline a été repoussée par une objection récente
- Idempotence : lancer la task deux fois de suite ne casse rien

### Fixtures

- Ajouter un membre `adherent` dédié aux tests de refus d'accès.
- Ajouter un membre `non_member` idem.
- S'assurer qu'il y a un membre `effective` par défaut pour les tests "happy path".

## Travail en cours à jeter

Avant d'attaquer l'implémentation :

1. `git restore app/controllers/api/v1/strategy/deliberations_controller.rb`
2. `git restore app/models/strategy/reaction.rb`
3. `git restore app/frontend/pages/Strategy/Index.jsx`
4. `git restore db/schema.rb`
5. `rm db/migrate/20260413112303_allow_multiple_amendment_reactions.rb`

(Le reste — `.a5c/*` et `public/vite/*` — est du bruit de working tree, à ignorer ou à committer séparément.)

## Ordre d'implémentation

Suggéré pour le plan d'implémentation (à détailler dans le plan suivant) :

1. Cleanup working tree (cf. ci-dessus).
2. Migration DB + backfill + `db/schema.rb`.
3. Modèles + tests modèles (TDD).
4. Helper `Member#can_access_strategy?` + test modèle.
5. Rake task + test.
6. Contrôleur + routes + tests d'intégration (TDD).
7. `AppController#strategy` garde serveur + test.
8. Frontend `ContextSwitcher` + vérif manuelle.
9. Frontend `DeliberationsList` + vérif manuelle.
10. Frontend `DeliberationDetail` (barre de phase, boutons par phase, commentaires groupés, historique de versions) + vérif manuelle dans le navigateur.
11. Nettoyage des constantes et références `decision_mode` / `abstain` / `amendment` dans le frontend.
12. Smoke test complet de toutes les routes `Strategy::` (conformément aux règles CLAUDE.md pour les refactorings destructifs).

## Points explicitement hors scope

- Diff visuel entre versions de proposition (MVP : affichage simple).
- Notifications email/Slack sur changement de phase.
- Historisation des changements de statut de la délibération (pourquoi un brouillon a été annulé, etc.).
- Modération / règles d'ordre du jour / quorum.
- Refonte des autres sous-sections Stratego (`resources`, `frameworks`, `axes`).
