# Website

## Overview

Site web vitrine de Semisto avec architecture multi-sites : portail global (semisto.org) et mini-sites par Lab (sous-domaines). Inclut l'e-commerce mutualisé, la Transformation Map, et l'intégration de la Plant Database. Multilingue.

## User Flows

- **Global Homepage**: Discover movement, impact stats, choose local Lab
- **Lab Mini-Site**: Explore active poles, courses, events, projects
- **Design Studio Landing**: Choose client profile (privé, entreprise, collectif, public)
- **Academy Catalog**: Browse and register for courses/events
- **E-commerce**: Browse catalog, add to cart, checkout with nursery pickup
- **Project Portfolio**: View completed projects, donate to active ones
- **Semisto Roots**: Join Food Forest Heroes, register for worksites

## Design Decisions

- Standalone (no app shell) — uses website header
- Multi-site: each Lab has its own subdomain feel
- Country-based filtering for e-commerce (local nursery pickup)
- Newsletter CTA on every page

## Components Provided

- `LabHomepage` / `LabHero` / `PoleCard` — Lab mini-site
- `ArticleCard` / `ArticleDetail` — Blog
- `CourseCard` / `EventCard` — Academy catalog
- `DesignStudioLanding` — Profile selector
- `ProjectCard` / `ProjectPortfolio` — Projects
- `ProductCard` / `ProductCatalog` — E-commerce
- `SemistoRoots` — Volunteer engagement
- `NewsletterCta` — Newsletter subscription

## Callback Props

| Callback | Description |
|----------|-------------|
| `onLabSelect` | Navigate to Lab mini-site |
| `onCourseView` / `onCourseRegister` | View/register for course |
| `onEventView` / `onEventRegister` | View/register for event |
| `onProjectView` / `onDonate` | View project / make donation |
| `onAddToCart` / `onCartOpen` | E-commerce actions |
| `onNewsletterSubscribe` | Subscribe to newsletter |
