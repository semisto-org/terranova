# Terranova — Product Overview

## Summary

Terranova est l'infrastructure numérique qui permet l'avènement de l'agroforesterie en Europe. C'est la plateforme du mouvement Semisto — un réseau fédératif de Labs autonomes et de citoyens engagés dont la mission est de transformer les zones anthropisées d'Europe en territoires vivants et nourriciers : forêts comestibles, jardins-forêts, haies fruitières, couverts de plantes-ressources comestibles, médicinales et utiles pour les humains et la biodiversité.

La plateforme orchestre des cycles de travail inspirés de Shape Up, facilite le financement collaboratif avec traçabilité par projet, valorise les contributions via une monnaie interne (le Semos), et mesure l'impact collectif sur les hectares transformés. Le code est open source.

## Planned Sections

1. **Lab Management** — Opérations du Lab : cycles Shape Up, membres, rôles, guildes, financement collaboratif, système Semos, timesheets et reporting interne.
2. **Plant Database** — Base de données végétale publique : genres, espèces, variétés, caractéristiques détaillées et recherche par critères.
3. **Design Studio** — Gestion de projets de jardins-forêts : fiches projets, sélections végétales, budgétisation, offres, pages client et reporting interne.
4. **Academy** — Formations Semisto : catalogue, inscriptions, contenus pédagogiques, syllabus participatifs, e-learning et reporting interne.
5. **Nursery** — Pépinières-écoles : gestion des stocks, ventes internes entre Labs et reporting interne.
6. **Website** — Site web mutualisé entre Labs en mode CMS, incluant la Transformation Map, la boutique e-commerce, le catalogue des formations, le portfolio des projets et les pages publiques.
7. **Citizen Engagement** — Contributions (temps/argent/matériel), Food Forest Heroes et chantiers participatifs, matériothèque et événements.
8. **Partner Portal** — Espace dédié aux institutions, entreprises et collectivités : visualisation de projets, allocation de fonds, reporting RSE et intégration aux politiques publiques.

## Data Model

Core entities: Lab, Member, Cycle, Guild, Genus, Species, Variety, Project, ProjectDocument, Planting, Plant, Course, Registration, Stock, Order, Contribution, Worksite, Event, Equipment, Partner, Funding, Wallet, SemosTransaction, SemosEmission, SemosRate, Place, Contact, Timesheet.

## Design System

**Colors:**
- Primary: #5B5781 (purple)
- Secondary: #AFBD00 (lime-green)
- Neutral: stone (Tailwind)
- Poles: Design Studio (#AFBD00), Academy (#B01A19), Nursery (#EF9B0D), Implementation (#234766), Lab (#5B5781)

**Typography:**
- Heading: Sole Serif Small
- Body: Inter
- Mono: JetBrains Mono

## Implementation Sequence

Build this product in milestones:

1. **Foundation** — Set up design tokens, data model types, routing structure, and application shell
2. **Lab Management** — Shape Up cycles, members, Semos, timesheets, calendar
3. **Plant Database** — Botanical database with search, detailed species pages, plant palettes
4. **Design Studio** — Forest garden project management with client portal
5. **Academy** — Training management with Kanban, calendar, registrations
6. **Nursery** — Stock management, orders, mother plants, catalog
7. **Website** — Public-facing multi-site with e-commerce, transformation map
8. **Citizen Engagement** — Citizen contributions, village mapping, gamification
9. **Partner Portal** — Partner dashboard with packages, funding, impact reporting

Each milestone has a dedicated instruction document in `product-plan/instructions/`.
