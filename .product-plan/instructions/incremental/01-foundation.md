# Milestone 1: Foundation

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** None

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

Set up the foundational elements: design tokens, data model types, routing structure, and application shell.

## What to Implement

### 1. Design Tokens

Configure your styling system with these tokens:

- See `product-plan/design-system/tokens.css` for CSS custom properties
- See `product-plan/design-system/tailwind-colors.md` for Tailwind configuration
- See `product-plan/design-system/fonts.md` for Google Fonts setup

Key colors:
- Primary: `#5B5781` (purple) — Lab branding, primary actions
- Secondary: `#AFBD00` (lime) — Design Studio, accents
- Neutral: `stone` (Tailwind) — Backgrounds, text, borders
- Pole-specific colors for each functional area (see design-system docs)

Fonts:
- Heading: Sole Serif Small (commercial, fallback: DM Serif Display)
- Body: Inter
- Mono: JetBrains Mono

### 2. Data Model Types

Create TypeScript interfaces for your core entities:

- See `product-plan/data-model/types.ts` for global interface definitions
- See `product-plan/data-model/README.md` for entity relationships

Key entities to define:
- **Organization**: Lab, Member, Cycle, Guild
- **Botanical**: Genus, Species, Variety
- **Design**: Project, Planting, Plant
- **Training**: Course, Registration
- **Nursery**: Stock, Order
- **Engagement**: Contribution, Worksite, Event, Equipment
- **Partners**: Partner, Funding
- **Semos**: Wallet, SemosTransaction, SemosEmission, SemosRate
- **Cross-cutting**: Place, Contact, Timesheet

### 3. Routing Structure

Create placeholder routes for each section:

| Route | Section |
|-------|---------|
| `/lab` | Lab Management (default landing) |
| `/lab/cycles` | Shape Up cycles |
| `/lab/members` | Member directory |
| `/lab/semos` | Semos dashboard |
| `/lab/timesheets` | Timesheet list |
| `/lab/calendar` | Calendar view |
| `/plants` | Plant Database (standalone, no shell) |
| `/plants/:speciesId` | Species detail |
| `/design` | Design Studio projects |
| `/design/:projectId` | Project detail |
| `/academy` | Academy Kanban |
| `/academy/:trainingId` | Training detail |
| `/academy/calendar` | Training calendar |
| `/nursery` | Nursery stock management |
| `/nursery/orders` | Order list |
| `/nursery/catalog` | Multi-nursery catalog |
| `/` | Website homepage (public, no shell) |
| `/:labSlug` | Lab mini-site |
| `/engagement` | Citizen Engagement hub |
| `/engagement/map` | Transformation map |
| `/partner` | Partner Portal (standalone, no shell) |

### 4. Application Shell

Copy the shell components from `product-plan/shell/components/` to your project:

- `AppShell.tsx` — Main layout wrapper with header, sidebar, content area
- `ContextSwitcher.tsx` — Pole/Lab/User selector dropdown
- `MainNav.tsx` — Sidebar navigation per pole
- `SearchDialog.tsx` — Global search overlay
- `NotificationsDrawer.tsx` — Notifications panel

**Wire Up Navigation:**

The shell uses a "Pôle Focus" pattern where the sidebar shows sub-sections of the active pole:

- **Design Studio**: Projets, Clients, Offres, Plantations
- **Academy**: Formations, Inscriptions, Contenus, Participants
- **Nursery**: Stocks, Commandes, Catalogue
- **Mise en oeuvre**: Chantiers, Heroes, Événements, Matériothèque
- **Gestion du Lab**: Cycles, Membres, Guildes, Semos, Finance, Reporting
- **Website**: Pages, Transformation Map, Boutique, Portfolio, Formations

**Note:** Some sections are standalone (no shell): Plant Database, Website public pages, Partner Portal. These have their own navigation.

**User Menu:**

The ContextSwitcher expects:
- User name, email, avatar
- List of poles with active/inactive state
- List of Labs (if multi-Lab user)
- Settings and logout callbacks

## Internationalization

Terranova is multilingual. Set up i18n infrastructure from the start:
- French as the default language
- Support for other European languages
- Each Lab can set its primary language
- Each user can override with their preferred language

## Files to Reference

- `product-plan/design-system/` — Design tokens (colors, fonts, CSS variables)
- `product-plan/data-model/` — Type definitions and sample data
- `product-plan/shell/README.md` — Shell design intent
- `product-plan/shell/components/` — Shell React components

## Done When

- [ ] Design tokens are configured (colors, fonts, CSS variables)
- [ ] Data model types are defined
- [ ] Routes exist for all sections (can be placeholder pages)
- [ ] Shell renders with header and sidebar
- [ ] ContextSwitcher shows poles and user info
- [ ] Sidebar navigation updates based on active pole
- [ ] Navigation links to correct routes
- [ ] Responsive on mobile (drawer sidebar, simplified header)
- [ ] i18n infrastructure is in place
- [ ] Dark mode support is configured
