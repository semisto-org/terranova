# Terranova

## What is Terranova?

Terranova is the digital infrastructure for the Semisto movement — a federated network of autonomous Labs and engaged citizens whose mission is to transform anthropized zones across Europe into living, nourishing territories: food forests, forest gardens, fruit hedges, and resource plant covers.

The platform orchestrates Shape Up-inspired work cycles, facilitates collaborative funding with per-project traceability, values contributions via an internal currency (Semos), and measures collective impact on hectares transformed. The code is open source.

## Tech Stack

- **Backend**: Ruby on Rails 7.1 with PostgreSQL
- **Frontend**: React 18 via Inertia.js, bundled with Vite 5
- **Styling**: Tailwind CSS 4 with CSS custom properties (design tokens)
- **Package Manager**: Yarn 1.x (JS), Bundler (Ruby)
- **Runtime versions**: Ruby 3.3.10, Node.js 22.13.1 (managed via `.tool-versions`)
- **Auth**: Session-based with bcrypt password hashing

## Architecture

### Inertia.js Pattern

Rails serves Inertia responses (not plain JSON) for application pages. React page components live in `app/frontend/pages/`. API endpoints under `api/v1/` serve JSON independently.

The entry point is `app/frontend/entrypoints/application.jsx`. Pages are automatically wrapped in the `AppShell` layout except `Auth/Login` and `Design/ClientPortal`.

### Application Shell

The app uses a "Pole Focus" pattern with a unified contextual selector:

- **Header**: Hamburger (mobile), search placeholder, notifications placeholder
- **Sidebar** (w-56): `ContextSwitcher` (pole/lab/user dropdown) + `MainNav` (sub-sections of the active pole)
- **Content**: Main scrollable area

Shell components are in `app/frontend/components/shell/`. Pages register their sidebar sections via `useShellNav()` from `ShellContext`.

### Pole Colors

| Pole | Accent | Background |
|------|--------|------------|
| Gestion du Lab | `#5B5781` | `#c8bfd2` |
| Design Studio | `#AFBD00` | `#e1e6d8` |
| Academy | `#B01A19` | `#eac7b8` |
| Nursery | `#EF9B0D` | `#fbe6c3` |
| Mise en oeuvre | `#234766` | `#c9d1d9` |

### Shared Props (Inertia)

All React pages receive via `inertia_share` in `ApplicationController`:

- `auth.member` — `{ id, firstName, lastName, email, avatar, isAdmin }` or `null`
- `flash` — `{ notice, alert }`

### API Utility

`app/frontend/lib/api.js` exports `apiRequest(path, options)` — auto-includes CSRF token, handles 401 redirects.

## File Structure

```
app/
  controllers/
    application_controller.rb    # Auth, shared props, error handling
    app_controller.rb            # Inertia page controller (one action per section)
    sessions_controller.rb       # Login/logout
    api/v1/                      # JSON API controllers (10 controllers)
  models/                        # 74 ActiveRecord models
    design/                      # Design Studio domain (22 models)
    academy/                     # Academy domain (9 models)
    nursery/                     # Nursery domain (7 models)
    plant/                       # Plant Database domain (14 models)
  frontend/
    entrypoints/application.jsx  # Inertia app bootstrap + AppShell layout
    pages/                       # Inertia page components
      Foundation/AppIndex.jsx    # Home dashboard
      Auth/Login.jsx             # Login page (no shell)
      Lab/Index.jsx              # Lab Management
      Plants/Index.jsx           # Plant Database
      Design/Index.jsx           # Design Studio
      Design/ClientPortal.jsx    # Client portal (no shell)
      Academy/Index.jsx          # Academy
      Nursery/Index.jsx          # Nursery
    components/
      shell/                     # AppShell, ContextSwitcher, MainNav, ShellContext
      UserMenu.jsx               # Legacy (replaced by ContextSwitcher)
    lab-management/components/   # Lab feature components (20+)
    plant-database/components/   # Plant feature components (20+)
    design-studio/components/    # Design feature components
    lib/api.js                   # API request utility
    styles/application.css       # Tailwind + design tokens
config/
  routes.rb                      # All routes (auth, Inertia pages, API v1)
  database.yml                   # PostgreSQL (ENV-based)
  vite.json                      # Vite Rails config
  initializers/inertia.rb        # Inertia config
db/
  schema.rb                      # 50+ tables
  seeds.rb                       # Dev seed data
.product-plan/                   # Product specification & instructions
  product-overview.md            # Master product overview
  shell/README.md                # Shell design spec
  instructions/incremental/      # Per-milestone build instructions (01-09)
  sections/                      # Per-section specs, types, sample data, screenshots
  data-model/types.ts            # TypeScript type definitions
  design-system/                 # Design tokens, fonts, colors
```

## Database

PostgreSQL with ENV-based config (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`).

Databases: `terranova_development`, `terranova_test`, `terranova_production`.

50+ tables organized by domain: core (members, wallets), lab management (cycles, pitches, bets, scopes, semos, timesheets, events, guilds), design studio (projects, quotes, palettes, planting plans, etc.), plant database (genera, species, varieties, palettes), academy (trainings, sessions, registrations, attendances), nursery (nurseries, stock batches, orders, transfers, mother plants).

## Routes

### Inertia Pages (require auth)

- `GET /` — Foundation dashboard
- `GET /lab` — Lab Management
- `GET /plants`, `GET /plants/*path` — Plant Database
- `GET /design`, `GET /design/:project_id` — Design Studio
- `GET /academy`, `GET /academy/:training_id` — Academy
- `GET /nursery` — Nursery

### Auth

- `GET /login`, `POST /login`, `DELETE /logout`

### Client Portal (token-based, no auth)

- `GET /client/design/:project_id?token=X`

### API (`/api/v1/`)

- `health` — Health check
- `foundation/*` — Shell, routes, milestone
- `lab/*` — Lab management (members, cycles, pitches, bets, scopes, semos, timesheets, events)
- `plants/*` — Plant database (search, genera, species, varieties, palettes, contributions)
- `design/*` — Design studio (projects, teams, timesheets, expenses, palettes, quotes, documents, meetings, annotations, planting plans, client portal)
- `academy/*` — Academy (trainings, sessions, registrations, attendance, documents, expenses, idea notes)
- `nursery/*` — Nursery (stock batches, orders, mother plants, catalog, dashboard)
- `website/*` — Public website (home, articles, events, courses)

## Dev Server

```bash
bin/dev          # Starts Rails (port 3000) + Vite (port 3036)
```

- Application: `http://localhost:3000/`
- API: `http://localhost:3000/api/v1/`
- Health check: `GET /api/v1/health`

## Milestones

Build sequence defined in `.product-plan/product-overview.md`, tracked in `MILESTONES.md`:

1. **Foundation** — Done. Design tokens, routing, app shell, data model types
2. **Lab Management** — Done. Shape Up cycles, members, guilds, Semos, timesheets, events
3. **Plant Database** — UI done, awaiting tests. Botanical search, species pages, palettes
4. **Design Studio** — UI done, awaiting tests. Forest garden project management, client portal
5. **Academy** — UI done, awaiting tests. Training management, Kanban, calendar, registrations
6. **Nursery** — UI done, awaiting tests. Stock, orders, mother plants, catalog, transfers
7. **Website** — Not started. Public multi-site, e-commerce, transformation map
8. **Citizen Engagement** — Not started. Contributions, village mapping, gamification
9. **Partner Portal** — Not started. Partner dashboard, funding, impact reporting

Each milestone has a dedicated instruction file in `.product-plan/instructions/incremental/`.

## Conventions

- Models are namespaced by domain (`Design::Project`, `Academy::Training`, `Plant::Species`, `Nursery::Order`)
- API controllers are in `Api::V1::` namespace
- Frontend feature components are organized in domain directories (`lab-management/`, `plant-database/`, `design-studio/`)
- Pages use `apiRequest()` for all API calls
- Pages register sidebar sections via `useShellNav({ sections, activeSection, onSectionChange })`
- Design tokens are CSS custom properties in `app/frontend/styles/application.css`
- Fonts: Sole Serif (headings), Inter (body), JetBrains Mono (code)
