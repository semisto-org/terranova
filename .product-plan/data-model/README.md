# Terranova Data Model

## Overview

The Terranova data model operates at two levels:
- **Network data** (shared across all Labs): Botanical data (Genus, Species, Variety)
- **Lab data** (per Lab): Members, Projects, Courses, Stock, Orders, Events, etc.

## Core Entities

### Organization
- **Lab** — Autonomous local collective in the Semisto network
- **Member** — Active person in a Lab with roles (designer, trainer, accountant, etc.)
- **Cycle** — Shape Up work period (7-8 weeks) + cooldown (2 weeks)
- **Guild** — Cross-functional support group (IT, finance, communication, etc.)

### Botanical
- **Genus** → has many Species
- **Species** → belongs to Genus, has many Varieties
- **Variety** → belongs to Species

### Design
- **Project** → belongs to Lab, has many ProjectDocuments, Plants
- **Plant** → belongs to Species, optionally to Variety, Place, Project
- **Planting** → belongs to Lab, optionally to Project

### Training
- **Course** → belongs to Lab
- **Registration** → belongs to Course and Contact

### Nursery
- **Stock** → belongs to Lab, Species (optionally Variety)
- **Order** → belongs to Lab, has many line items

### Engagement
- **Contribution** → belongs to Contact or Member
- **Worksite** → belongs to Lab, has participants
- **Event** → belongs to Lab
- **Equipment** → belongs to Contact (owner)

### Partners
- **Partner** → has many Fundings
- **Funding** → optionally linked to Project

### Semos (Internal Currency)
- **Wallet** → belongs to Member or Lab
- **SemosTransaction** → links two Wallets
- **SemosEmission** → credits a Wallet
- **SemosRate** → configurable rate per Lab

### Cross-Cutting
- **Place** — Geolocated location
- **Contact** — External person (client, prospect, etc.)
- **Timesheet** — Time tracked by member

## Key Relationships

See `types.ts` for the complete TypeScript interface definitions and `sample-data.json` for example data.
