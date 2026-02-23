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

| Variable                    | Description                              |
|-----------------------------|------------------------------------------|
| `RAILS_ENV`                 | `production`                             |
| `SECRET_KEY_BASE`           | Cle secrete Rails                        |
| `PGHOST`                    | Hote PostgreSQL                          |
| `PGPORT`                    | Port PostgreSQL                          |
| `PGUSER`                    | Utilisateur PostgreSQL                   |
| `PGPASSWORD`                | Mot de passe PostgreSQL                  |
| `WEBSITE_ORIGIN`            | Origine CORS du site public              |
| `AWS_SES_ACCESS_KEY_ID`     | Cle d'acces IAM pour Amazon SES          |
| `AWS_SES_SECRET_ACCESS_KEY` | Cle secrete IAM pour Amazon SES          |
| `AWS_SES_REGION`            | Region SES (defaut : `eu-west-1`)        |
| `APP_HOST`                  | Hostname pour les liens dans les emails  |
| `MAILER_FROM`               | Adresse d'expedition (defaut : `noreply@terranova.semisto.org`) |
| `GOOGLE_MAPS_API_KEY`       | Cle API Google pour la geolocalisation (Design Studio, Academy) |

### Obtenir une cle API Google Geocoding

1. Creer un projet dans [Google Cloud Console](https://console.cloud.google.com/)
2. Activer la facturation (Google Maps Platform exige un compte de facturation)
3. Activer l'API Geocoding : APIs & Services > Library > rechercher "Geocoding API" > Enable
4. Creer une cle API : APIs & Services > Credentials > Create Credentials > API key
5. (Recommandé) Restreindre la cle : Applications > IP addresses, ajouter l'IP de votre serveur (la requete part du backend, pas du navigateur). En dev local : `127.0.0.1` ou laisser sans restriction.
6. Copier la cle et l'ajouter dans `.env` : `GOOGLE_MAPS_API_KEY=votre_cle`

Sans cette variable, le bouton « Geolocaliser » affichera une erreur « Geocoding not configured ».

## API

### Endpoints publics

- `GET /api/v1/website/home`
- `GET /api/v1/website/articles`
- `GET /api/v1/website/events`
- `GET /api/v1/website/courses`

### Geocoding (authentifie)

- `GET /api/v1/geocoding?address=...` — Geocodage via Google (proxy serveur)

### Foundation (milestone 1)

- `GET /api/v1/foundation/milestone`
- `GET /api/v1/foundation/routes`
- `GET /api/v1/foundation/shell`
