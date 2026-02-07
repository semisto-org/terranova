# Milestone 7: Website

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete, other sections recommended for content

---

## About These Instructions

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Data model definitions (TypeScript types and sample data)
- UI/UX specifications (user flows, requirements, screenshots)
- Design system tokens (colors, typography, spacing)
- Test-writing instructions for each section (for TDD approach)

**What you need to build:**
- Backend API endpoints and database schema
- Authentication and authorization
- Data fetching and state management
- Business logic and validation
- Integration of the provided UI components with real data

**Important guidelines:**
- **DO NOT** redesign or restyle the provided components — use them as-is
- **DO** wire up the callback props to your routing and API calls
- **DO** replace sample data with real data from your backend
- **DO** implement proper error handling and loading states
- **DO** implement empty states when no records exist (first-time users, after deletions)
- **DO** use test-driven development — write tests first using `tests.md` instructions
- The components are props-based and ready to integrate — focus on the backend and data layer

---

## Goal

Implement the Website — Semisto's public-facing multi-site with global portal, Lab mini-sites, e-commerce, and the Transformation Map.

## Overview

The Website is a multi-site architecture: a global portal (semisto.org) and Lab mini-sites (wallonie.semisto.org). It includes the e-commerce shop, Transformation Map, Design Studio landing pages, Academy catalog, project portfolio, articles, and Semisto Roots (volunteer engagement). The site is multilingual.

**Key Functionality:**
- Global homepage: movement presentation, impact stats, featured content, Lab directory
- Lab mini-site: Lab presentation with active poles, courses, events, projects, articles
- Design Studio landing: client profile selection (privé, entreprise, collectif, public)
- Academy catalog: courses and events with registration
- E-commerce: product catalog filtered by country, cart, checkout with nursery pickup
- Project portfolio with funding CTAs
- Transformation Map: interactive map of all European projects
- Semisto Roots: Food Forest Heroes, volunteer worksites
- Newsletter subscription CTAs throughout

**Note:** This section is standalone (shell: false) — uses its own website header/navigation.

## Recommended Approach: Test-Driven Development

See `product-plan/sections/website/tests.md` for detailed test-writing instructions.

## What to Implement

### Components

Copy from `product-plan/sections/website/components/`:

- `LabHomepage` — Lab mini-site homepage
- `LabHero` — Hero section with Lab info
- `PoleCard` — Card for each active pole
- `ArticleCard` / `ArticleDetail` — Blog articles
- `CourseCard` — Training course card
- `EventCard` — Event card
- `DesignStudioLanding` — Profile selector for Design Studio
- `ProjectCard` / `ProjectPortfolio` — Project showcase
- `ProductCard` / `ProductCatalog` — E-commerce catalog
- `NewsletterCta` — Newsletter subscription
- `SemistoRoots` — Volunteer engagement page

### Data Layer

Key types: Lab, Course, Event, Project, Product, Article, Worksite, ImpactStats, MapProject, CartItem, DesignProfile

### Callbacks

Wire up: onLabSelect, onCourseView, onCourseRegister, onEventView, onEventRegister, onProjectView, onDonate, onProductView, onAddToCart, onCartOpen, onCountryChange, onNewsletterSubscribe, onArticleView, onWorksiteRegister, onJoinHeroes, onLanguageChange

## Files to Reference

- `product-plan/sections/website/README.md`
- `product-plan/sections/website/tests.md`
- `product-plan/sections/website/components/`
- `product-plan/sections/website/types.ts`
- `product-plan/sections/website/sample-data.json`

## Expected User Flows

### Flow 1: Discover and Navigate to a Lab
1. Visitor arrives at semisto.org
2. Sees impact stats, featured content
3. Selects their local Lab from the directory
4. Enters the Lab mini-site with its active poles
5. **Outcome:** Visitor feels "on the site of their Lab"

### Flow 2: Register for a Training
1. Visitor navigates to Academy section of a Lab
2. Browses course catalog with filters (category, level, format)
3. Clicks on a course to see details
4. Clicks "Register" and fills in info
5. **Outcome:** Registration submitted

### Flow 3: Purchase Plants Online
1. Visitor browses the e-commerce catalog (filtered by country)
2. Adds products to cart
3. Proceeds to checkout, selects pickup nursery
4. Completes payment
5. **Outcome:** Order placed, to be picked up at local nursery

## Done When

- [ ] Tests written for key flows
- [ ] Global homepage with impact stats and Lab directory
- [ ] Lab mini-sites with active poles
- [ ] Course and event catalogs with registration
- [ ] E-commerce: catalog, cart, checkout
- [ ] Project portfolio with donation CTAs
- [ ] Design Studio landing with profile selection
- [ ] Newsletter subscription works
- [ ] Multilingual support (language selector)
- [ ] Responsive on mobile
- [ ] Standalone navigation (website header, not app shell)
