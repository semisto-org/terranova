# Design Studio

## Overview

Le Design Studio est le cœur de métier de Semisto : la gestion complète des projets de jardins-forêts, de l'analyse terrain jusqu'à la co-gestion post-plantation. Les designers créent des projets, analysent le terrain, construisent des palettes végétales, placent les plantes sur des plans, génèrent des devis versionnés, et partagent un portail client interactif.

## User Flows

- **Project Management**: Create from template, assign team, track phases
- **Terrain Analysis**: Structured form following the permanence scale
- **Plant Palette**: Add species from Plant Database, organize by layer, set quantities/prices
- **Planting Plan**: Upload aerial image, place numbered plant markers
- **Quotes**: Generate versioned quotes, client approval via portal
- **Client Portal**: Terrain questionnaire, annotated plans, plant wishlist, harvest calendar
- **Co-gestion**: Post-plantation tracking, plant status, follow-up visits

## Components Provided

- `ProjectDashboard` — Project list with stats and filters
- `ProjectCard` — Individual project card
- `StatsCard` — Dashboard statistics card

## Callback Props

| Callback | Description |
|----------|-------------|
| `onViewProject` | Navigate to project detail |
| `onCreateProject` | Create new project (optionally from template) |
| `onEditProject` | Edit project details |
| `onDeleteProject` | Delete a project |
| `onDuplicateProject` | Duplicate existing project |
