# Terranova App (Rails + Inertia)

Application Ruby on Rails avec frontend Inertia.js (React) et PostgreSQL.

## Prerequis

- Ruby 3.2+ recommande (Rails 7.1)
- Bundler
- PostgreSQL 14+
- Node.js 20+
- pnpm

## Demarrage

```bash
cd apps/api
bundle install
pnpm install
bin/setup
bin/dev
```

App Inertia disponible sur `http://localhost:3000/app`.
API disponible sur `http://localhost:3000/api/v1`.
Vue Inertia Milestone 2: `http://localhost:3000/app/lab`.

## Endpoints publics (website)

- `GET /api/v1/health`
- `GET /api/v1/website/home`
- `GET /api/v1/website/articles`
- `GET /api/v1/website/events`
- `GET /api/v1/website/courses`

Ces endpoints servent de base pour la couche Astro publique.

## Endpoints Lab Management (milestone 2)

- `GET /api/v1/lab/overview`
- `GET /api/v1/lab/cycles`
- `GET|POST|PATCH /api/v1/lab/members`
- `GET|POST|PATCH|DELETE /api/v1/lab/pitches`
- `POST|DELETE /api/v1/lab/bets`
- `POST|PATCH /api/v1/lab/pitches/:id/scopes`, `/api/v1/lab/scopes/:id/hill-position`
- `POST|PATCH /api/v1/lab/scopes/:id/tasks`, `/api/v1/lab/tasks/:id/toggle`
- `POST /api/v1/lab/semos/transfer`, `POST /api/v1/lab/semos/emissions`, `PATCH /api/v1/lab/semos/rates/:id`
- `GET|POST|PATCH|DELETE /api/v1/lab/timesheets`, `PATCH /api/v1/lab/timesheets/:id/mark-invoiced`
- `GET|POST|PATCH|DELETE /api/v1/lab/events`
- `GET /api/v1/lab/calendar`
