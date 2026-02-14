# Terranova

Monorepo recentre sur:

- `apps/api`: application Ruby on Rails + Inertia.js (React) avec PostgreSQL
- `apps/website`: site public Astro connecte a l'API Rails
- `apps/website/src/components/shell`: composants shell copies depuis le product plan (Foundation)
- `.product-plan/`: specification produit et roadmap

La feuille de route imposee est suivie strictement via `/Users/michael/code/terranova/MILESTONES.md`, basee sur `/Users/michael/code/terranova/.product-plan/product-overview.md`.

## Structure

```text
apps/
  api/       # Rails app (Inertia frontend + API publique)
  website/   # Astro public website
packages/
  tokens/    # Design tokens partages
```

## Demarrage local

### 1) App Rails + Inertia + PostgreSQL

```bash
cd apps/api
bundle install
pnpm install
bin/setup
bin/dev
```

Application Inertia: `http://localhost:3000/app`

Healthcheck: `GET /api/v1/health`

### 2) Website Astro

```bash
cd apps/website
cp .env.example .env
pnpm install
pnpm dev
```

Site: `http://localhost:4321`

La variable `PUBLIC_API_BASE_URL` pointe vers l'API Rails.

## Endpoints publics exposes (version initiale)

- `GET /api/v1/website/home`
- `GET /api/v1/website/articles`
- `GET /api/v1/website/events`
- `GET /api/v1/website/courses`

## Foundation APIs (milestone 1)

- `GET /api/v1/foundation/milestone`
- `GET /api/v1/foundation/routes`
- `GET /api/v1/foundation/shell`

Placeholders de routes milestone:

- `GET /api/v1/lab`, `/api/v1/lab/cycles`, `/api/v1/lab/members`, `/api/v1/lab/semos`, `/api/v1/lab/timesheets`, `/api/v1/lab/calendar`
- `GET /api/v1/plants`, `/api/v1/plants/:species_id`
- `GET /api/v1/design`, `/api/v1/design/:project_id`
- `GET /api/v1/academy`, `/api/v1/academy/:training_id`, `/api/v1/academy/calendar`
- `GET /api/v1/nursery`, `/api/v1/nursery/orders`, `/api/v1/nursery/catalog`
- `GET /api/v1/engagement`, `/api/v1/engagement/map`
- `GET /api/v1/partner`

## Note environnement

Dans cet environnement Codex, l'installation des gems depuis `rubygems.org` est bloquee (pas d'acces reseau). Le squelette Rails est donc prepare, mais `bundle install` devra etre execute dans un environnement avec acces reseau.
