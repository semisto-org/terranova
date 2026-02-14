# Terranova

Application Ruby on Rails 7.1 + Inertia.js (React) avec PostgreSQL.

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

## Developpement

### Prerequis

- Ruby 3.3.10
- Node.js 22.13.1
- Yarn 1.x
- PostgreSQL

Les versions Ruby et Node sont gerees via `.tool-versions` (asdf / mise).

### Installation

```bash
bin/setup
```

Ce script execute : `bundle install`, `yarn install`, creation de la base, migrations et seed.

### Lancement

```bash
bin/dev
```

Demarre Rails (port 3000) et Vite (port 3036) en parallele.

- Application : `http://localhost:3000/`
- Healthcheck : `GET /api/v1/health`

### Base de donnees

PostgreSQL configure via variables d'environnement :

| Variable     | Default     |
|--------------|-------------|
| `PGHOST`     | `localhost` |
| `PGPORT`     | `5432`      |
| `PGUSER`     | `postgres`  |
| `PGPASSWORD` | `postgres`  |

```bash
bin/rails db:migrate        # Appliquer les migrations
bin/rails db:seed            # Charger les donnees de seed
bin/rails db:reset           # Recreer la base depuis le schema
```

## Production

### Hebergement

L'application est deployee sur **Hatchbox**. Le deploiement est declenche automatiquement par un push sur la branche `main`.

### Processus

Le `Procfile` definit le processus web :

```
web: bundle exec puma -C config/puma.rb
```

### Assets

Les assets frontend (React/Vite) sont compilees lors du deploiement via `rake assets:precompile`, qui execute `yarn build` automatiquement.

### Variables d'environnement requises

| Variable            | Description                          |
|---------------------|--------------------------------------|
| `RAILS_ENV`         | `production`                         |
| `SECRET_KEY_BASE`   | Cle secrete Rails                    |
| `PGHOST`            | Hote PostgreSQL                      |
| `PGPORT`            | Port PostgreSQL                      |
| `PGUSER`            | Utilisateur PostgreSQL               |
| `PGPASSWORD`        | Mot de passe PostgreSQL              |
| `WEBSITE_ORIGIN`    | Origine CORS du site public          |

## API

### Endpoints publics

- `GET /api/v1/website/home`
- `GET /api/v1/website/articles`
- `GET /api/v1/website/events`
- `GET /api/v1/website/courses`

### Foundation (milestone 1)

- `GET /api/v1/foundation/milestone`
- `GET /api/v1/foundation/routes`
- `GET /api/v1/foundation/shell`
