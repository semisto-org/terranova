# Plant Database

## Overview

Base de données végétale publique 100% compatible mobile. Recherche avancée par genres, espèces et variétés avec filtres détaillés. Fiches complètes avec galerie photos, notes collaboratives, carte des implantations, disponibilité en pépinières et résumé IA. Système de contribution modérée et palettes végétales organisées par strates.

## User Flows

- **Search & Filter**: Search by Latin/common name, filter by type/exposure/hardiness/advanced criteria
- **Species Detail**: View detailed page with 30+ properties, photos, notes, map, nursery stock, AI summary
- **Plant Palette**: Build palette by adding species/varieties organized by 6 strates
- **Contribute**: Add photos, notes, references to earn Semos
- **Activity Feed**: View community contributions in chronological feed
- **Contributor Profile**: View stats, activity history, Semos earned

## Design Decisions

- Standalone interface (no app shell) for public accessibility
- Mobile-first: optimized for field use
- Collapsible sections for managing information density
- AI summary on-demand (not auto-generated)

## Components Provided

- `SearchView` / `SearchResultItem` / `FilterPanel` — Search interface
- `SpeciesDetail` / `GenusDetail` / `VarietyDetail` — Detail pages
- `CharacteristicCard` / `CharacteristicIcons` / `PropertyBadge` — Property display
- `PhotoGallery` / `NoteCard` / `ReferenceList` — Content sections
- `CollapsibleSection` / `MonthsCalendar` — UI utilities
- `AISummaryCallout` — AI summary with on-demand generation
- `NurseryStockCard` / `PlantLocationMap` — Location and availability
- `AddToPaletteButton` / `PlantPalette` / `StrateSection` — Palette system
- `ActivityFeed` / `ContributorProfile` — Community features
- Breadcrumb components for navigation

## Callback Props

| Callback | Description |
|----------|-------------|
| `onSearchChange` | Update search query |
| `onFiltersChange` | Apply search filters |
| `onResultSelect` | Navigate to a species/genus/variety |
| `onAddToPalette` | Add item to plant palette |
| `onGenerateAISummary` | Request AI summary generation |
| `onAddPhoto` / `onAddNote` / `onAddReference` | Contribute content |
| `onContributorSelect` | View contributor profile |
