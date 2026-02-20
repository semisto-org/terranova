# Terranova

Digital infrastructure for the Semisto movement — transforming anthropized zones across Europe into food forests, forest gardens, and living territories. Open source.

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
      SimpleEditor.jsx           # TipTap rich text editor
    lab-management/components/   # 35 feature components (.tsx)
    plant-database/components/   # 27 feature components (.tsx)
    design-studio/components/    # 6 feature components
    lib/api.js                   # API request utility
    styles/application.css       # Tailwind + design tokens (CSS custom properties)
config/
  routes.rb                      # All routes
  database.yml                   # PostgreSQL (ENV-based: PGHOST, PGPORT, PGUSER, PGPASSWORD)
db/
  schema.rb                      # 60+ tables
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

60+ tables across 5 domains:
- **Core**: members, wallets, contacts, timesheets, active_storage_*
- **Lab**: cycles, pitches, bets, scopes, guilds, events, event_types, semos_*, idea_*
- **Design**: design_projects, design_quotes, design_planting_plans, design_palettes, design_annotations, etc. (22 tables)
- **Academy**: academy_trainings, academy_training_sessions, academy_training_registrations, etc. (9 tables)
- **Nursery**: nursery_stock_batches, nursery_orders, nursery_mother_plants, etc. (7 tables)
- **Plants**: plant_genera, plant_species, plant_varieties, plant_palettes, etc. (14 tables)

## Testing

```bash
bin/rails test                           # Run all tests
bin/rails test test/integration/         # Integration tests only
bin/rails test test/integration/academy_management_test.rb  # Single file
```

Minitest with `ActiveSupport::TestCase`. API base controller skips auth in test env.

## Dev Server

```bash
bin/dev    # Rails (port 3000) + Vite (port 3036)
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
