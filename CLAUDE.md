# Terranova

Digital infrastructure for the Semisto movement — transforming anthropized zones across Europe into food forests, forest gardens, and living territories. Open source.

> **📋 Project ISA — single source of truth for "what v1.0 means" + current-vs-ideal state: [`ISA.md`](ISA.md).** Feature status, scope, decisions, and the v1.0 criteria live there (the ISA is the living spec; this CLAUDE.md is the orientation/conventions layer). ⚠️ Some counts below are stale — actual is **~155 tables across ~13 domains, ~35 API controllers**. `MILESTONES.md` is outdated (contradicts the code); trust `ISA.md` for status.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Ruby on Rails 8.1, PostgreSQL, Puma |
| Frontend | React 18 via Inertia.js, Vite 5 |
| Styling | Tailwind CSS 4, CSS custom properties |
| JS deps | Yarn 1.22 (`yarn add`), key libs: lucide-react, @dnd-kit, @tiptap, leaflet/react-leaflet |
| Ruby deps | Bundler (`bundle add`), key gems: inertia_rails, vite_rails, bcrypt, aws-sdk-rails |
| Runtimes | Ruby 3.3.10, Node 22.13.1 (`.tool-versions`) |
| Auth | Session-based, bcrypt, `session[:member_id]` |
| Testing | Minitest (Rails default), integration tests in `test/integration/` |

## Architecture

### Inertia.js

Rails → Inertia responses (not JSON) for app pages. React pages in `app/frontend/pages/`. API under `api/v1/` serves JSON separately.

Entry point: `app/frontend/entrypoints/application.jsx`. All pages auto-wrapped in `AppShell` **except**: `Auth/Login`, `Auth/ForgotPassword`, `Auth/ResetPassword`, `Design/ClientPortal`.

### Shared Inertia Props

Via `inertia_share` in `ApplicationController`:
- `auth.member` — `{ id, firstName, lastName, email, avatar, isAdmin }` or `null`
- `flash` — `{ notice, alert }`

### Application Shell

Pole Focus pattern: `ContextSwitcher` (pole/lab/user dropdown) + `MainNav` (sub-sections).

Components in `app/frontend/components/shell/`: `AppShell`, `ShellContext`, `ContextSwitcher`, `MainNav`, `FeedbackButton`.

Pages register nav via `useShellNav({ sections, activeSection, onSectionChange })` from `ShellContext`.

### Pole Colors

| Pole | ID | Accent | Background |
|------|----|--------|------------|
| Gestion du Lab | `lab` | `#5B5781` | `#c8bfd2` |
| Design Studio | `design` | `#AFBD00` | `#e1e6d8` |
| Academy | `academy` | `#B01A19` | `#eac7b8` |
| Nursery | `nursery` | `#EF9B0D` | `#fbe6c3` |
| Mise en oeuvre | `implementation` | `#234766` | `#c9d1d9` |

### API Utility

`app/frontend/lib/api.js` → `apiRequest(path, options)`: auto-CSRF, 401→redirect `/login`, 204→`null`.

## Routes

### Pages (require auth)

| Path | Page Component |
|------|---------------|
| `GET /` | `Foundation/AppIndex` |
| `GET /lab` | `Lab/Index` |
| `GET /plants`, `/plants/*path` | `Plants/Index` |
| `GET /design`, `/design/:project_id` | `Design/Index` |
| `GET /academy`, `/academy/:training_id` | `Academy/Index` |
| `GET /academy/training-types/new\|:id/edit` | `Academy/TrainingTypeForm` |
| `GET /academy/locations/new\|:id/edit` | `Academy/LocationForm` |
| `GET /nursery` | `Nursery/Index` |
| `GET /profile` | `Profile/Index` |

### Auth (no auth required)

- `GET/POST /login`, `DELETE /logout`
- `GET/POST /forgot-password`, `GET/PATCH /reset-password`
- `GET /client/design/:project_id?token=X` — Client portal (token-based)

### API (`/api/v1/`)

11 controllers: `health`, `foundation`, `profile`, `lab_management`, `plants`, `design_studio`, `academy`, `nursery`, `website`, `placeholders`, `base_controller`.

## File Structure

```
app/
  controllers/
    application_controller.rb    # Auth, shared props, error handling
    app_controller.rb            # Inertia page actions
    sessions_controller.rb       # Login/logout
    password_resets_controller.rb # Password reset flow
    api/v1/                      # 11 JSON API controllers
  models/                        # 74+ ActiveRecord models
    design/    (22)              # Design Studio domain
    academy/   (9)               # Academy domain
    nursery/   (7)               # Nursery domain
    plant/     (14)              # Plant Database domain
  frontend/
    entrypoints/application.jsx  # Inertia bootstrap + AppShell
    pages/                       # 13 Inertia page components (.jsx)
    components/
      shell/                     # AppShell, ContextSwitcher, MainNav, ShellContext, FeedbackButton
      academy/                   # 13 modal components
      projects/                  # Unified projects: ProjectEditModal, ProjectCreateModal, CollaborativeEditor, ProjectDocuments
      tasks/                     # Shared task components (TaskRow, TaskListBlock, TaskForm, MyTasksDashboard) for all project types
      SimpleEditor.jsx           # TipTap rich text editor
    lab-management/components/   # Lab-specific feature components (.tsx) — Project* components migrated to components/projects/
    plant-database/components/   # 27 feature components (.tsx)
    design-studio/components/    # 6 feature components
    lib/api.js                   # API request utility
    styles/application.css       # Tailwind + design tokens (CSS custom properties)
config/
  routes.rb                      # All routes
  database.yml                   # PostgreSQL (ENV-based: PGHOST, PGPORT, PGUSER, PGPASSWORD)
db/
  schema.rb                      # ~155 tables (see ISA.md domain map)
  seeds.rb                       # Dev seed data
test/
  integration/                   # 7 integration test files (Minitest)
  models/                        # Model tests
.product-plan/                   # Product specs & build instructions
  product-overview.md            # Master overview
  instructions/incremental/      # Per-milestone instructions (01-09)
  sections/                      # Per-section specs, types, sample data, screenshots
  data-model/types.ts            # TypeScript type definitions
```

## Database

~155 tables across ~13 domains (full domain map in `ISA.md`):
- **Core**: members, wallets, contacts, timesheets, active_storage_*
- **Lab**: cycles, pitches, bets, scopes, guilds, events, event_types, semos_*, idea_*
- **Design**: design_projects, design_quotes, design_planting_plans, design_palettes, design_annotations, etc. (22 tables)
- **Academy**: academy_trainings, academy_training_sessions, academy_training_registrations, etc. (9 tables)
- **Nursery**: nursery_stock_batches, nursery_orders, nursery_mother_plants, etc. (7 tables)
- **Plants**: plant_genera, plant_species, plant_varieties, plant_palettes, etc. (14 tables)
- **Shop**: shop_products, shop_sales, shop_sale_items (3 tables) — comptoir avec stock simple, génère une Revenue par vente (`pole=shop`, `category='Ventes shop'`)
- **Caisse**: pas de table dédiée — utilise `BankConnection` avec `provider='cash'` (une par Organization), auto-créée par `Organization#ensure_cash_account!`. Les ventes cash Shop et dépenses cash alimentent la caisse via `Cash::Bookkeeper`.
- **Stripe**: BankConnection avec `provider='stripe'`, synchronisée par `BankSync::StripeImporter` (charges + payouts seulement, fees gérés via facture Stripe mensuelle). Le webhook crée désormais une Revenue par paiement (idempotence via `revenues.stripe_payment_intent_id`).
- **Matching rules**: table `bank_matching_rules` — patterns (counterpart_name/remittance_info/counterpart_iban) qui suggèrent contact/catégorie/type/TVA lors de la réconciliation. Créées via bouton "Mémoriser" sur le panel.

## Testing

```bash
bin/rails test                           # Run all tests
bin/rails test test/integration/         # Integration tests only
bin/rails test test/integration/academy_management_test.rb  # Single file
```

Minitest with `ActiveSupport::TestCase`. API base controller skips auth in test env.

### Refactoring: mandatory endpoint verification

When a refactoring removes or renames columns, tables, models, or associations, **every API endpoint that touches the affected models must be smoke-tested** before considering the work done. Automated tests do not cover all serializer paths — large controllers (e.g. `lab_management_controller` at 1600+ lines) have dozens of serializer methods that reference columns directly. A passing test suite is necessary but not sufficient.

Checklist after a destructive migration:
1. Grep for **every** removed column name, table name, model class, and association name across `app/`, `test/`, `db/seeds.rb`.
2. For each affected controller, identify **all actions** that serialize the changed models (not just the obvious CRUD actions — also `index`, `show`, `overview`, `reporting`, serializer helpers).
3. Hit each endpoint at least once via `curl` or the browser and confirm a 200 response — do not rely solely on `bin/rails test`.

## Dev Server

```bash
bin/dev    # Rails (port 4000) + Vite (port 30362)
```

## Conventions

- **Model namespacing**: `Design::Project`, `Academy::Training`, `Plant::Species`, `Nursery::Order`
- **DB table naming**: `design_projects`, `academy_trainings`, `plant_species`, `nursery_orders`
- **API namespace**: `Api::V1::` controllers
- **Frontend domains**: `lab-management/`, `plant-database/`, `design-studio/` component dirs
- **File types**: Pages are `.jsx`, Lab/Plant feature components are `.tsx`, Shell/Academy are `.jsx`
- **API calls**: Always use `apiRequest()` from `app/frontend/lib/api.js`
- **Shell nav**: `useShellNav({ sections, activeSection, onSectionChange })`
- **Design tokens**: CSS custom properties (`--color-*`, `--font-*`) in `application.css`
- **Fonts**: Sole Serif (headings), Inter (body), JetBrains Mono (code)
- **Icons**: lucide-react
- **Drag & drop**: @dnd-kit
- **Rich text**: TipTap (@tiptap/react)
- **Maps**: Leaflet + react-leaflet
- **Inertia page render**: `render inertia: "PageName", props: { ... }` in controllers
- **Token verification**: `Rails.application.message_verifier(:purpose)` for client portal & password reset
- **API docs (OpenAPI)**: The API contract is auto-generated, not hand-written. `rspec-openapi` records request/response pairs from the Minitest integration suite. After adding/changing an endpoint, ensure it has an integration test, then regenerate: `OPENAPI=1 bin/rails test test/integration && bin/rails openapi:split`. Output: master `doc/openapi.yaml` + per-domain slices `doc/openapi/{domain}.json` + `index.json`, served publicly at `GET /api/v1/openapi` (index) and `/api/v1/openapi/:domain`. Commit the regenerated spec — CI fails on drift. An endpoint missing from the spec means it lacks a test.
- **Destructive actions**: Every delete/remove action in the UI must be guarded by a `window.confirm()` dialog before executing
- **Admin-only UI**: Elements restricted to admins (`isAdmin`) must be wrapped in a dashed amber callout with a `Lock` icon (lucide-react). Pattern: `<div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-3"><div className="flex items-center gap-4"><Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />{ /* admin content */ }</div></div>`

## Milestones

1. **Foundation** — Done
2. **Lab Management** — Done (UI + tests)
3. **Plant Database** — UI done, tests needed
4. **Design Studio** — UI done, tests needed
5. **Academy** — UI done, tests written
6. **Nursery** — UI done, tests needed
7. **Website** — Not started
8. **Citizen Engagement** — Not started
9. **Partner Portal** — Not started

Per-milestone build instructions in `.product-plan/instructions/incremental/`.

<!-- bm-design-system:start -->
## Design system (scaffolded, confined scope)

A design system reference lives at [`/design-system`](/design-system) (`app#design_system` → `pages/DesignSystem.tsx`). It previews and explains every primitive — colors, typography, structure, base styles, and elements — and shows the exact markup to use. The reusable primitives are under `app/frontend/components/ui/` and the section sources under `app/frontend/components/design-system/sections/`.

**Scope: confined, not global.** This was installed with `.bm-ds`-scoped base styles, so its typography resets and dark palette apply *only* on the `/design-system` page — the existing Terranova pages are untouched and the conventions above (pole colors, Sole Serif/Inter fonts, the admin amber-callout pattern, `window.confirm` guards) remain authoritative for all existing UI. The `@theme` tokens (`bg-page`, `bg-surface`, `text-ink-body`, `bg-accent`, …) and the `.btn`/`.form-control`/`.badge`/`.modal`/`.callout` component classes ARE registered globally and available anywhere, but nothing forces them onto existing markup.

When building **new** UI, prefer the design system:

1. **Check `/design-system` first** before writing fresh markup — reuse the existing tokens and primitives (`<Button>`, `<Input>`, `<Badge>`, `<Select>`, `<Checkbox>`, `<Radio>`, `<RichTextField>`, `<Dialog>`, `<ThemeToggle>` and friends) rather than ad-hoc styles or one-off variant systems.
2. **If you adopt the bare-element base styles** (auto-styled `<h1>`–`<h6>`, `<p>`, `<a>`, `<ul>`, etc.) you must render the markup inside a `.bm-ds` container — outside it, those elements are NOT auto-styled (that's the confinement). Within a `.bm-ds` subtree, don't re-apply `text-xl`/`font-semibold`/`text-ink-*` to those elements; they're already defined.
3. **If a needed primitive is missing**, propose adding it to the design system (`components/ui/x.tsx` + a new section on `/design-system`) before building a one-off.
4. **Re-running the `bm-design-system` skill** is the supported way to add sections or refresh tokens — it detects the existing setup and merges non-destructively.

Theme toggle: the header button on `/design-system` persists to `localStorage["bm-ds-theme"]`; a boot script in `application.html.erb` adds `.dark` to `<html>` pre-paint, but only `.bm-ds` subtrees respond to it.
<!-- bm-design-system:end -->

