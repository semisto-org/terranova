# Terranova Web Application

Application web pour la gestion de labs Semisto basée sur Next.js 16 et Prisma 6.

## Stack Technique

- **Framework**: Next.js 16 (App Router)
- **Base de données**: PostgreSQL via Prisma 6
- **Authentification**: NextAuth 5
- **Styling**: Tailwind CSS 4
- **Types**: TypeScript 5
- **Package Manager**: pnpm

## Installation

```bash
# Installer les dépendances
pnpm install

# Copier le fichier d'exemple de configuration
cp .env.example .env

# Éditer .env avec vos valeurs
# DATABASE_URL et NEXTAUTH_SECRET sont requis
```

## Configuration de la base de données

1. Créer une base de données PostgreSQL :

```bash
createdb terranova
```

2. Configurer l'URL dans `.env` :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/terranova"
```

3. Exécuter les migrations :

```bash
pnpm db:migrate
```

4. Peupler avec des données de test :

```bash
pnpm db:seed
```

## Scripts disponibles

```bash
# Développement
pnpm dev              # Démarrer le serveur de développement

# Base de données
pnpm db:migrate       # Exécuter les migrations
pnpm db:seed          # Peupler la base de données
pnpm db:reset         # Reset complet (migrations + seed)
pnpm db:studio        # Ouvrir Prisma Studio (interface graphique)

# Production
pnpm build            # Construire pour la production
pnpm start            # Démarrer en production

# Qualité de code
pnpm lint             # Linter le code
```

## Comptes de test

Après le seed, vous pouvez vous connecter avec :

- **alice@semisto-paris.fr** (Admin)
- **david@semisto-paris.fr** (Admin)
- **bob@semisto-paris.fr**
- **claire@semisto-paris.fr**
- **emma@semisto-paris.fr**

> Note: L'authentification nécessite un provider configuré dans NextAuth. Par défaut, aucun provider n'est configuré.

## Structure du projet

```
src/
├── app/[locale]/(shell)/lab/   # Pages Lab Management
│   ├── page.tsx                # Dashboard
│   ├── members/                # Annuaire des membres
│   ├── calendar/               # Calendrier
│   ├── timesheets/             # Feuilles de temps (TODO)
│   ├── semos/                  # Gestion Semos (TODO)
│   └── shape-up/               # Shape Up Workboard (TODO)
├── components/lab/             # Composants Lab Management
├── actions/                    # Server Actions
├── lib/
│   ├── dal/                    # Data Access Layer
│   ├── auth.ts                 # Configuration NextAuth
│   └── db.ts                   # Client Prisma
└── types/                      # Déclarations de types
```

## Fonctionnalités implémentées

### ✅ Phase 1: Modèle de données
- 14 nouveaux modèles Prisma
- Types TypeScript complets
- Data Access Layer

### ✅ Phase 2: Pages en lecture seule
- **Dashboard** (`/lab`) : Vue d'ensemble avec cycle actuel, projets actifs, wallet Semos
- **Membres** (`/lab/members`) : Annuaire avec filtres et recherche
- **Calendrier** (`/lab/calendar`) : Vue mensuelle et liste d'événements

### ✅ Phase 3: Server Actions
- 30+ actions pour toutes les opérations CRUD
- Validation avec Zod
- Gestion des autorisations

### ⏳ À venir
- Pages Timesheets et Semos avec mutations
- Shape Up Workboard (Shaping, Betting, Building)
- Panel d'administration Semos
- Tests automatisés

## Lab Management

L'application implémente la méthodologie **Shape Up** de Basecamp :

1. **Shaping Track** : Création et façonnage de pitches
2. **Betting Table** : Sélection des pitches pour le cycle
3. **Building Track** : Développement avec Hill Chart et Scopes

### Composants clés

- **HillChart** : Visualisation SVG de la progression (0-50 uphill, 51-100 downhill)
- **CycleProgress** : Indicateur de phase (Building/Cooldown)
- **SemosWalletCard** : Carte de portefeuille avec transactions
- **EventCard** : Carte d'événement avec participants

## Base de données

Le schéma inclut :
- **Organization** : Lab, Member, Guild, Cycle
- **Shape Up** : Pitch, Bet, Scope, Task, HillChartSnapshot, Chowder, IdeaList
- **Semos** : Wallet, Transaction, Emission, Rate
- **Cross-cutting** : Event, Timesheet, Contact, Place

## Problèmes connus

- ⚠️ Aucun provider d'authentification configuré par défaut
- ⚠️ Les migrations nécessitent une base de données configurée
- ⚠️ Certaines pages sont encore en développement

## Contribution

Le projet suit une approche de développement incrémentale en 7 phases. Consultez le plan d'implémentation pour plus de détails.

## Support

Pour toute question ou problème, créer une issue sur le dépôt GitHub.
