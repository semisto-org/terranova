# Terranova

Application Ruby on Rails + Inertia.js (React) avec PostgreSQL.

La feuille de route est suivie via `MILESTONES.md`, basee sur `.product-plan/product-overview.md`.

## Structure

```text
app/
  controllers/   # Rails controllers (API v1 + Inertia)
  models/        # ActiveRecord models
  frontend/      # React (Inertia) pages & components
  views/         # Rails layouts
config/          # Rails configuration
db/              # Migrations & schema
```

## Demarrage local

```bash
bundle install
yarn install
bin/setup
bin/dev
```

Application Inertia: `http://localhost:3000/`

Healthcheck: `GET /api/v1/health`

## Endpoints publics (version initiale)

- `GET /api/v1/website/home`
- `GET /api/v1/website/articles`
- `GET /api/v1/website/events`
- `GET /api/v1/website/courses`

## Foundation APIs (milestone 1)

- `GET /api/v1/foundation/milestone`
- `GET /api/v1/foundation/routes`
- `GET /api/v1/foundation/shell`
