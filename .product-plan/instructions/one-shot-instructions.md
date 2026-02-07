# Terranova — One-Shot Implementation Instructions

This document combines all milestone instructions into a single reference.
Work through each milestone in order. Each milestone builds on the previous one.

> **Tip:** Refer to `product-overview.md` for the full product context,
> and check each section's `README.md` and `tests.md` for detailed specs and test plans.

---


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

---


# Milestone 2: Lab Management

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete

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

Implement Lab Management — the operational hub with Shape Up methodology, member management, Semos currency system, timesheets, and calendar.

## Overview

Lab Management is the operational center of a Semisto Lab. It implements the Shape Up methodology with three modules (Shaping, Betting, Building), manages members and their roles, administers the Semos complementary currency system, and enables timesheet tracking for member contributions. A calendar centralizes the visualization of cycles, meetings, and collective events.

Key functionality:
- **Shape Up workflow**: create Pitches with the 5 ingredients (Problem, Appetite, Solution, Rabbit Holes, No-Gos), place Bets during cooldown periods, track Building with Scopes and Hill Charts
- **Member management**: manage members with roles (designer, shaper, formateur, comptable, coordination, communication, IT), profiles, and permissions
- **Semos dashboard**: view wallet balances with floor/ceiling, transfer between members, admin emission and rate configuration
- **Timesheet tracking**: log hours with date/category/payment type, link to projects/courses/guilds, mark kilometers, track invoiced status
- **Calendar**: monthly view with 6-week cycles + 2-week cooldowns, events (project meetings, stakeholder meetings, Design Days, guild meetings, betting sessions, Semisto Days, Semos Fest, trainings)

## Recommended Approach: Test-Driven Development

If a `tests.md` file is provided for this section, write your tests first following those instructions, then implement until all tests pass. This ensures complete coverage of user flows and edge cases.

## What to Implement

### Components

The following components are provided in `product-plan/sections/lab-management/components/`:

- `Dashboard` — Lab overview with key stats and quick access
- `ShapeUpWorkboard` — Main Shape Up interface with shaping/betting/building tracks
- `PitchCard` — Individual pitch display with status, appetite, and actions
- `BettingTable` — Betting session view for placing bets on pitches
- `BuildingView` — Active build tracking with scopes and progress
- `HillChart` — Hill chart visualization with draggable scope positions (0-50 uphill, 51-100 downhill)
- `ScopeCard` — Individual scope with tasks and hill position
- `TaskList` — Task list within a scope with must-have/nice-to-have distinction
- `ChowderList` — Unsorted tasks waiting to be assigned to scopes
- `IdeaLists` — Decentralized idea lists with voting (Requests, Bugs, Ideas)
- `MemberList` — Member directory grid
- `MemberCard` — Individual member card with roles, status, and guild membership
- `SemosDashboard` — Semos system overview with wallet summary and transactions
- `SemosWalletCard` — Individual wallet display with balance, floor, and ceiling
- `SemosTransactionRow` — Transaction history row
- `SemosTransferForm` — Form for transferring Semos between members
- `SemosAdminPanel` — Admin controls for emission, conversion, and rate management
- `TimesheetList` — Timesheet entries list view
- `TimesheetRow` — Individual timesheet entry row
- `TimesheetFilters` — Filter controls for timesheets (date range, category, member, invoiced status)
- `TimesheetStats` — Summary statistics for filtered timesheet data
- `CalendarView` — Monthly calendar with cycles, events, and meetings
- `EventCard` — Individual event display
- `CycleProgress` — Visual progress indicator for the current cycle

### Data Layer

Key types to wire up from `types.ts`:

- `Member` (id, firstName, lastName, email, avatar, roles, status, isAdmin, walletId, guildIds)
- `Guild` (id, name, description, leaderId, memberIds, color)
- `Cycle` (id, name, startDate, endDate, cooldownStart, cooldownEnd, status, betIds)
- `Pitch` (id, title, status, appetite, problem, solution, rabbitHoles, noGos, breadboard, fatMarkerSketch)
- `Bet` (id, pitchId, cycleId, teamMemberIds, status, placedAt, placedBy)
- `Scope` (id, pitchId, name, description, hillPosition, tasks)
- `Task` (id, title, isNiceToHave, completed)
- `HillChartSnapshot` (id, pitchId, createdAt, positions)
- `ChowderItem` (id, pitchId, title, createdAt, createdBy)
- `IdeaList` / `IdeaItem` (with voting)
- `Event` (id, title, type, startDate, endDate, location, description, attendeeIds, cycleId)
- `Wallet` (id, memberId, balance, floor, ceiling)
- `SemosTransaction` (id, fromWalletId, toWalletId, amount, description, type)
- `SemosEmission` (id, walletId, amount, reason, description)
- `SemosRate` (id, type, amount, description)
- `Timesheet` (id, memberId, date, hours, paymentType, description, category, invoiced, kilometers, projectId, courseId, guildId)

### Callbacks

The `LabManagementProps` interface defines all callbacks to wire up:

- **Member actions**: `onAddMember`, `onViewMember(memberId)`, `onEditMember(memberId)`
- **Pitch actions**: `onCreatePitch`, `onViewPitch(pitchId)`, `onEditPitch(pitchId)`, `onDeletePitch(pitchId)`
- **Betting actions**: `onPlaceBet(pitchId, teamMemberIds)`, `onRemoveBet(betId)`
- **Scope & Hill Chart**: `onCreateScope(pitchId)`, `onUpdateHillPosition(scopeId, position)`, `onAddTask(scopeId, title, isNiceToHave)`, `onToggleTask(scopeId, taskId)`, `onAddChowderItem(pitchId, title)`, `onMoveToScope(chowderItemId, scopeId)`
- **Idea actions**: `onAddIdea(listId, title)`, `onVoteIdea(listId, ideaId)`
- **Event actions**: `onCreateEvent`, `onViewEvent(eventId)`, `onEditEvent(eventId)`, `onDeleteEvent(eventId)`
- **Semos actions**: `onTransferSemos(toWalletId, amount, description)`, `onEmitSemos(walletId, amount, reason, description)`, `onUpdateRate(rateId, amount)`
- **Timesheet actions**: `onCreateTimesheet`, `onEditTimesheet(timesheetId)`, `onDeleteTimesheet(timesheetId)`, `onMarkInvoiced(timesheetId)`
- **Guild actions**: `onViewGuild(guildId)`

### Empty States

Implement empty states for:
- No pitches yet (new lab, encourage first pitch creation)
- No bets placed for current cycle
- No scopes created for a pitch in building
- Empty chowder list
- No members (first-time lab setup)
- Empty wallet / no transactions
- No timesheet entries (for current filters)
- No events on calendar for current month
- Empty idea lists

## Files to Reference

- `product-plan/sections/lab-management/components/` — All React components listed above
- `product-plan/sections/lab-management/{components}/` — Component index
- `product-plan/data-model/types.ts` — Global type definitions
- `product/sections/lab-management/types.ts` — Section-specific types and props
- `product/sections/lab-management/data.json` — Sample data
- `product/sections/lab-management/spec.md` — Full specification
- `product/sections/lab-management/*.png` — Screenshots (dashboard, shapeup-workboard, building-view, calendar-view, member-list, semos-dashboard, timesheet-list)

## Expected User Flows

1. **Shape Up Cycle**: User creates a Pitch with problem/solution/appetite, Pitch is reviewed during cooldown, Bet is placed for next cycle with assigned team members, Team builds using Scopes and Hill Chart, tasks are tracked to completion
2. **Member Management**: Admin adds a new member, assigns roles (designer, shaper, etc.), member appears in directory with their guild memberships
3. **Semos Transfer**: User views their wallet balance (with floor and ceiling), initiates transfer to another member, confirms amount and description, transaction appears in both wallets' history
4. **Timesheet Entry**: User creates a timesheet entry with date/hours/category/payment type, links to a project or course, marks round-trip kilometers, entry appears in filtered list and can later be marked as invoiced

## Done When

- [ ] Tests written for key user flows
- [ ] All tests pass
- [ ] Shape Up workflow works end-to-end (Pitch creation through Building with Hill Chart)
- [ ] Members can be viewed, added, and edited with role assignment
- [ ] Guilds display with member associations
- [ ] Semos transfers work between members with transaction history
- [ ] Semos admin panel allows emission and rate management
- [ ] Timesheets can be created, filtered by category/date/member, and marked as invoiced
- [ ] Calendar shows cycles (6-week work + 2-week cooldown) and events
- [ ] Hill Chart positions are draggable and snapshots are recorded
- [ ] Idea lists support adding ideas and voting
- [ ] Empty states display properly for all views
- [ ] Responsive on mobile

---


# Milestone 3: Plant Database

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete

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

Implement the Plant Database — a standalone, mobile-first botanical database for browsing genera, species, and varieties with community contributions, AI summaries, and plant palette management.

## Overview

The Plant Database is a standalone, 100% mobile-compatible interface for searching and browsing plant information. Users search by Latin or common name, filter by detailed botanical criteria, and view comprehensive species pages with photos, contributor notes, geolocated plant locations, and nursery stock availability. Contributors can add content and earn Semos rewards. An AI summary feature synthesizes information asynchronously. A plant palette system lets designers organize selected plants by strate (layer) for forest garden design.

Key functionality:
- **Search**: by Latin or common name with autocompletion, filter by type/exposure/hardiness (primary filters) plus advanced filters (edible parts, interests, soil types, watering needs, and many more)
- **Detail pages**: genus, species, and variety views with collapsible sections for dozens of botanical properties, breadcrumb navigation between levels
- **Rich content**: photo gallery (swipeable), contributor notes with inline photos, multilingual common names, references (links + PDFs), months calendar for flowering/fruiting/harvest
- **Plant locations**: interactive map with markers distinguishing mother plants (available for propagation) from regular plantings
- **Nursery stock**: availability from partner nurseries with quantity, rootstock, age, and pricing
- **AI summary**: asynchronous generation that synthesizes contributor notes and plant properties into a readable summary
- **Plant palette**: organized by 6 strates (aquatic, ground-cover, herbaceous, climbers, shrubs, trees) with drag-and-drop, comparison view, PDF export, and send-to-Design-Studio
- **Community**: activity feed showing recent contributions (Basecamp-style timeline), contributor profiles with GitHub-style stats and Semos earned
- **Contributions**: validated contributors can add species, varieties, photos, notes, and references — each earning Semos

**Note:** This section is standalone (`shell: false`) — it has its own navigation and does not use the application shell.

## Recommended Approach: Test-Driven Development

If a `tests.md` file is provided for this section, write your tests first following those instructions, then implement until all tests pass. This ensures complete coverage of user flows and edge cases.

## What to Implement

### Components

The following components are provided in `product-plan/sections/plant-database/components/`:

- `SearchView` — Main search interface with prominent search bar and filter panel
- `SearchResultItem` — Individual search result row (Latin name + common name)
- `FilterPanel` — Primary filters (type, exposure, hardiness) and expandable advanced filters
- `SpeciesDetail` — Full species page with all properties in collapsible sections
- `GenusDetail` — Genus page with description and list of species
- `VarietyDetail` — Variety page with productivity, taste, storage, and disease resistance details
- `SpeciesBreadcrumb` — Breadcrumb navigation: Genus > Species
- `VarietyBreadcrumb` — Breadcrumb navigation: Genus > Species > Variety
- `CharacteristicCard` — Display card for a botanical characteristic
- `CharacteristicIcons` — Icon set for characteristic types
- `PropertyBadge` — Badge display for individual property values
- `PhotoGallery` — Swipeable photo gallery with captions and contributor attribution
- `NoteCard` — Contributor note display with author link and inline photos
- `CollapsibleSection` — Expandable/collapsible container for grouping properties
- `AISummaryCallout` — Callout box with "Generate AI Summary" button, loading state, and result display
- `NurseryStockCard` — Nursery availability card with quantity, rootstock, age, and price
- `PlantLocationMap` — Interactive map with bicolor markers (mother plant vs. regular)
- `ReferenceList` — List of references (links and PDFs) with source attribution
- `MonthsCalendar` — 12-month visual calendar for flowering, fruiting, and harvest periods
- `AddToPaletteButton` — Quick-add button with strate selection
- `PlantPalette` — Palette panel organized by 6 strates with drag-and-drop
- `StrateSection` — Individual strate section within the palette
- `ActivityFeed` — Chronological timeline of community contributions grouped by date
- `ContributorProfile` — Contributor page with stats, activity graph, and recent contributions

### Data Layer

Key types to wire up from `types.ts`:

- `Genus` (id, latinName, description)
- `Species` (id, genusId, latinName, type, edibleParts, interests, ecosystemNeeds, propagationMethods, origin, flowerColors, plantingSeasons, harvestMonths, exposures, hardiness, fruitingMonths, floweringMonths, foliageType, nativeCountries, fertility, rootSystem, growthRate, forestGardenZone, pollinationType, soilTypes, soilMoisture, soilRichness, wateringNeed, toxicElements, isInvasive, therapeuticProperties, lifeCycle, foliageColor, fragrance, transformations, fodderQualities)
- `Variety` (id, speciesId, latinName, productivity, fruitSize, tasteRating, storageLife, maturity, diseaseResistance)
- `CommonName` (id, targetId, targetType, language, name)
- `Reference` (id, targetId, targetType, type, title, url, source)
- `Photo` (id, targetId, targetType, url, caption, contributorId, createdAt)
- `Note` (id, targetId, targetType, contributorId, content, language, photos, createdAt)
- `PlantLocation` (id, targetId, targetType, latitude, longitude, placeName, labId, isMotherPlant, plantedYear, isPublic)
- `NurseryStock` (id, targetId, targetType, nurseryId, nurseryName, quantity, rootstock, age, price)
- `Contributor` (id, name, avatarUrl, joinedAt, labId, stats, semosEarned, activityByMonth)
- `ActivityItem` (id, type, contributorId, targetId, targetType, targetName, timestamp)
- `PlantPalette` / `PaletteStrates` (aquatic, groundCover, herbaceous, climbers, shrubs, trees)
- `AISummary` (status: idle/loading/success/error, content, generatedAt, error)
- `SearchFilters` / `SearchResult`
- `FilterOptions` (types, exposures, hardinessZones, edibleParts, interests, ecosystemNeeds, and 20+ more filter categories)

### Callbacks

Multiple props interfaces define callbacks organized by view:

**SearchViewProps**: `onSearchChange(query)`, `onFiltersChange(filters)`, `onResultSelect(id, type)`, `onAddToPalette(id, type, strate)`

**GenusDetailProps**: `onGenerateAISummary`, `onAddPhoto`, `onAddNote(content)`, `onAddReference(reference)`, `onSpeciesSelect(speciesId)`, `onContributorSelect(contributorId)`

**SpeciesDetailProps**: `onGenerateAISummary`, `onAddPhoto`, `onAddNote(content)`, `onAddReference(reference)`, `onAddToPalette(strate)`, `onVarietySelect(varietyId)`, `onGenusSelect(genusId)`, `onContributorSelect(contributorId)`, `onNurserySelect(nurseryId)`

**VarietyDetailProps**: `onGenerateAISummary`, `onAddPhoto`, `onAddNote(content)`, `onAddReference(reference)`, `onAddToPalette(strate)`, `onSpeciesSelect(speciesId)`, `onContributorSelect(contributorId)`, `onNurserySelect(nurseryId)`

**PlantPaletteProps**: `onRemoveItem(id, strate)`, `onMoveItem(id, fromStrate, toStrate)`, `onSave(name, description)`, `onExportPDF`, `onSendToDesignStudio`, `onClear`

**ActivityFeedProps**: `onActivitySelect(targetId, targetType)`, `onContributorSelect(contributorId)`, `onLoadMore`, `hasMore`

**ContributorProfileProps**: `onActivitySelect(targetId, targetType)`

**PlantLocationMapProps**: `onLocationSelect(locationId)`

### Empty States

Implement empty states for:
- No search results for current query/filters
- Empty plant palette (no items added yet)
- No photos for a species/genus/variety
- No notes yet (encourage first contribution)
- No nursery stock available
- No plant locations mapped
- No references added
- AI summary not yet generated (idle state)
- No activities in the feed
- Empty contributor profile (new contributor)

## Files to Reference

- `product-plan/sections/plant-database/components/` — All React components listed above
- `product-plan/data-model/types.ts` — Global type definitions
- `product/sections/plant-database/types.ts` — Section-specific types and props (detailed filter options, all view props)
- `product/sections/plant-database/data.json` — Sample data
- `product/sections/plant-database/spec.md` — Full specification with property lists and UI requirements
- `product/sections/plant-database/*.png` — Screenshots (search-view, species-detail-preview, genus-detail, variety-detail, plant-palette-preview, activity-feed, contributor-profile)

## Expected User Flows

1. **Search & Browse**: User enters a plant name in the search bar, results appear as a scannable list (Latin + common name), user clicks a species, views the detailed page with all properties organized in collapsible sections, navigates via breadcrumbs to genus or down to varieties
2. **AI Summary**: User opens a species detail page, clicks "Generer un resume IA" in the callout box, loading state appears while the request is processed asynchronously, summary displays when ready with generation timestamp
3. **Build Palette**: User adds species to palette from search results (via AddToPaletteButton with strate selection) or from detail pages, organizes items across 6 strates using drag-and-drop, compares selected items side-by-side, exports to PDF or sends palette to Design Studio for a project
4. **Contribute**: Validated contributor adds a note with photos to a species page, or uploads a new photo to the gallery, contribution appears immediately in the activity feed timeline, contributor's profile stats and Semos earned update accordingly

## Done When

- [ ] Tests written for key user flows
- [ ] All tests pass
- [ ] Search works with autocompletion by Latin and common name
- [ ] Primary and advanced filters apply correctly to results
- [ ] Species detail page renders all properties in collapsible sections
- [ ] Genus detail page shows description and lists child species
- [ ] Variety detail page shows specific properties (productivity, taste, storage, etc.)
- [ ] Breadcrumb navigation works between genus, species, and variety levels
- [ ] Photo gallery is swipeable with contributor attribution
- [ ] AI summary generation works asynchronously with proper loading/error states
- [ ] Plant location map displays with bicolor markers (mother plant distinction)
- [ ] Nursery stock availability shows per species/variety
- [ ] Plant palette works with drag-and-drop organization by strate
- [ ] Palette export to PDF and send-to-Design-Studio are functional
- [ ] Activity feed shows community contributions in chronological order
- [ ] Contributor profiles display stats, activity graph, and Semos earned
- [ ] Empty states display for no search results, empty palette, no photos, etc.
- [ ] 100% mobile compatible with standalone navigation (no app shell)

---


# Milestone 4: Design Studio

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete, Milestone 3 (Plant Database) recommended

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

Implement the Design Studio — forest garden project management from terrain analysis through post-plantation co-management, including a standalone client portal.

## Overview

The Design Studio is Semisto's core business tool for managing forest garden projects end-to-end. Designers create projects, analyze terrain following the permanence scale, build plant palettes by layer with species from the Plant Database, place plants visually on aerial plans, generate versioned quotes with client approval workflows, and share a client portal with interactive collaboration tools. The project workflow covers five phases: Offre, Pre-projet, Projet detaille, Mise en oeuvre, and Co-gestion.

Key functionality:
- **Project dashboard**: stats overview (active/pending/total projects, hours this month, revenue this year, quote conversion rate), filters, and project creation from templates
- **Project detail with tabs**: Overview, Team, Timesheets, Expenses, Site Analysis, Plans, Palette, Planting Plan, Quotes, Documents, Album, Meetings, Co-gestion
- **Team management**: assign Project Manager (1 per project), Designers (paid or volunteer), and Butineurs (volunteers)
- **Terrain analysis**: structured form following the permanence scale (climate, geomorphology, water, socio-economic, access, vegetation, microclimate, buildings, soil, client observations with geolocated photos and usage map)
- **Plant palette editor**: add species from Plant Database organized by layers (canopy, sub-canopy, shrub, herbaceous, ground-cover, vine, root) with quantities and unit prices, export to PDF
- **Planting plan**: upload aerial image, place numbered markers on a 3/4-1/4 split layout, export as PDF or image
- **Quote builder**: versioned quotes with line items, VAT calculation, send to client for approval/rejection with comments
- **Documents & media**: file uploads by category, photo/video album with captions
- **Meetings**: scheduling with attendees, notes, and AI-generated summaries
- **Annotated plans**: team and client can place annotations on uploaded plans/orthophotos
- **Co-gestion**: post-plantation plant status tracking (alive/dead/to-replace/replaced), health scores, follow-up visits, interventions (planting, mulching, pruning, watering, treatment, replacement)
- **Client portal** (standalone): terrain questionnaire, annotated plan viewing, plant wishlist, plant journal with photo entries, harvest calendar, maintenance calendar

**Note:** The client portal is standalone (`client-portal-shell: false`) — it has its own navigation and does not use the application shell.

## Recommended Approach: Test-Driven Development

If a `tests.md` file is provided for this section, write your tests first following those instructions, then implement until all tests pass. This ensures complete coverage of user flows and edge cases.

## What to Implement

### Components

The following components are provided in `product-plan/sections/design-studio/components/`:

- `ProjectDashboard` — Project list with stats, filters, and creation controls
- `ProjectCard` — Individual project card with phase, status, client, and budget summary
- `StatsCard` — Dashboard stat display card

**Note:** This is the initial component set. The Design Studio is the largest section and additional components for project detail tabs (site analysis form, palette editor, planting plan editor, quote builder, co-gestion view, client portal) will need to be built following the types and specifications provided. Use the extensive `ProjectDetailProps` and sub-view props interfaces as your implementation guide.

### Data Layer

Key types to wire up from `types.ts`:

- `Project` (id, name, clientId, clientName, address, coordinates, area, phase, status, startDate, plantingDate, projectManagerId, budget, templateId)
- `ProjectBudget` (hoursPlanned, hoursWorked, hoursBilled, hoursSemos, expensesBudget, expensesActual)
- `TeamMember` (id, projectId, memberId, memberName, role: project-manager/designer/butineur, isPaid)
- `Timesheet` (id, projectId, memberId, date, hours, phase, mode: billed/semos, travelKm, notes)
- `Expense` (id, projectId, date, amount, category, description, phase, receiptUrl, status: pending/approved/rejected)
- `SiteAnalysis` (climate, geomorphology, water, socioEconomic, access, vegetation, microclimate, buildings, soil, clientObservations, clientPhotos, clientUsageMap)
- `PlantPalette` / `PaletteItem` (speciesId, speciesName, commonName, varietyId, layer, quantity, unitPrice, harvestMonths, harvestProducts)
- `PlantingPlan` / `PlantMarker` (paletteItemId, number, x, y, speciesName)
- `Quote` / `QuoteLine` (version, status: draft/sent/approved/rejected/expired, lines with quantities and pricing, VAT, client comments)
- `ProjectDocument` (category, name, url, size)
- `MediaItem` (type: image/video, url, thumbnailUrl, caption)
- `Meeting` (title, date, time, duration, location, attendees, notes, aiSummary)
- `Annotation` (documentId, x, y, authorType: team/client, content, resolved)
- `PlantRecord` (paletteItemId, markerId, status: alive/dead/to-replace/replaced, healthScore)
- `FollowUpVisit` (date, type: follow-up/intervention/client-meeting, notes, photos)
- `Intervention` (date, type: planting/mulching/pruning/watering/treatment/replacement/other)
- `ClientContributions` (terrainQuestionnaire, wishlist, plantJournal)
- `HarvestCalendar` / `MaintenanceCalendar` (monthly entries with tasks and products)
- `ProjectTemplate` (name, description, defaultPhases, suggestedHours, suggestedBudget)

### Callbacks

The `ProjectDashboardProps` interface:
- `onViewProject(id)`, `onEditProject(id)`, `onDeleteProject(id)`, `onCreateProject(templateId?)`, `onDuplicateProject(id)`

The `ProjectDetailProps` interface defines extensive callbacks:
- **Project**: `onEditProject(id)`, `onChangePhase(id, phase)`
- **Team**: `onAssignMember(projectId, memberId, role)`, `onRemoveMember(projectId, memberId)`
- **Timesheets**: `onAddTimesheet(timesheet)`, `onEditTimesheet(id)`, `onDeleteTimesheet(id)`
- **Expenses**: `onAddExpense(expense)`, `onEditExpense(id)`, `onDeleteExpense(id)`, `onApproveExpense(id)`
- **Site Analysis**: `onUpdateSiteAnalysis(analysis)`
- **Palette**: `onAddPaletteItem(item)`, `onEditPaletteItem(id)`, `onRemovePaletteItem(id)`, `onExportPalette`
- **Planting Plan**: `onUploadPlanImage(file)`, `onPlaceMarker(x, y, paletteItemId)`, `onMoveMarker(markerId, x, y)`, `onRemoveMarker(markerId)`, `onExportPlan(format)`
- **Quotes**: `onCreateQuote`, `onEditQuote(id)`, `onDeleteQuote(id)`, `onSendQuote(id)`
- **Documents**: `onUploadDocument(file, category)`, `onDeleteDocument(id)`
- **Media**: `onUploadMedia(file)`, `onDeleteMedia(id)`
- **Meetings**: `onCreateMeeting`, `onEditMeeting(id)`, `onDeleteMeeting(id)`
- **Annotations**: `onAddAnnotation(annotation)`, `onResolveAnnotation(id)`, `onDeleteAnnotation(id)`
- **Co-gestion**: `onUpdatePlantStatus(plantId, status)`, `onAddVisit(visit)`, `onAddIntervention(intervention)`
- **Maintenance**: `onEditMaintenanceCalendar(month, tasks)`
- **Search**: `onSearch(query)` — search across all project content

The `ClientPortalProps` interface:
- `onApproveQuote(quoteId, comment?)`, `onRejectQuote(quoteId, comment)`, `onAddAnnotation(documentId, x, y, content)`, `onSubmitQuestionnaire(responses)`, `onUploadPhoto(file, caption, coordinates?)`, `onAddUsageMapItem(item)`, `onAddWishlistItem(item)`, `onAddJournalEntry(plantId, text, photos?)`

### Empty States

Implement empty states for:
- No projects yet (new Design Studio, encourage first project creation)
- New project with no team members assigned
- No timesheets or expenses for a project
- Site analysis not yet started
- Empty plant palette (no species added)
- No planting plan uploaded
- No quotes created
- No documents uploaded / empty media album
- No meetings scheduled
- No annotations on plans
- Co-gestion with no plant records (pre-plantation)
- Client portal with no contributions yet
- Empty harvest and maintenance calendars

## Files to Reference

- `product-plan/sections/design-studio/components/` — React components (ProjectDashboard, ProjectCard, StatsCard)
- `product-plan/data-model/types.ts` — Global type definitions
- `product/sections/design-studio/types.ts` — Section-specific types and props (extensive — 700+ lines covering all sub-views)
- `product/sections/design-studio/data.json` — Sample data
- `product/sections/design-studio/spec.md` — Full specification with phase descriptions, team roles, and detailed user flows

## Expected User Flows

1. **Create Project**: User clicks "New Project" on the dashboard, selects a template (or starts from scratch), fills in client info and terrain details, assigns a Project Manager, project appears in dashboard with "Offre" phase
2. **Build Plant Palette**: User opens a project's Palette tab, searches the Plant Database for species, adds species with quantities and unit prices organized by layer (canopy, shrub, herbaceous, etc.), exports the palette as PDF for the client
3. **Generate Quote**: User creates a quote from palette data, adds custom line items (labor, materials, travel), sets VAT rate, sends to client via the portal, client reviews and approves or rejects with comments, quote status updates accordingly
4. **Client Contribution**: Client accesses the standalone portal, fills out the terrain questionnaire (sun observations, wet areas, wind patterns, soil history, wildlife), uploads geolocated photos of the site, adds items to their plant wishlist, and later maintains a plant journal with photo entries during co-gestion

## Done When

- [ ] Tests written for key user flows
- [ ] All tests pass
- [ ] Project dashboard lists projects with stats and filters
- [ ] Project creation works from templates with client info and phase assignment
- [ ] All project detail tabs are functional (Overview, Team, Timesheets, Expenses, Site Analysis, Plans, Palette, Planting Plan, Quotes, Documents, Album, Meetings, Co-gestion)
- [ ] Team assignment with roles (Project Manager, Designer, Butineur)
- [ ] Site analysis form covers all permanence-scale categories
- [ ] Plant palette integrates with Plant Database for species selection
- [ ] Planting plan supports image upload and numbered marker placement
- [ ] Quote builder with versioning and VAT calculation
- [ ] Client portal accessible as standalone with terrain questionnaire, wishlist, and plant journal
- [ ] Co-gestion tracks plant status, visits, and interventions
- [ ] Harvest and maintenance calendars render monthly entries
- [ ] Empty states for new projects with no data in each tab
- [ ] Responsive on mobile

---


# Milestone 5: Academy

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete

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

Implement the Academy — training management for Semisto's forest garden and edible forest courses, from initial idea through scheduling, registration, delivery, and financial reporting.

## Overview

Academy is the training management interface for Semisto coordinators. It enables organizing, tracking, and analyzing trainings from the initial idea to final reporting. The main view is a Kanban board with training cards flowing through statuses (Draft, Planned, Registrations Open, In Progress, Completed, plus Cancelled). Each training inherits a checklist template from its training type and can be customized. The system tracks registrations with payment status, attendance per session, documents for participants, and full financial data including expenses and revenue calculation.

Key functionality:
- **Kanban board** as the main view, organized by training status columns (Draft, Planned, Registrations Open, In Progress, Completed, Cancelled)
- **Training creation** from training types with inherited checklist templates, pricing, participant limits, and accommodation options
- **Training types management**: reusable types with checklist templates, photo galleries, and associated trainers
- **Training locations management**: venues with descriptions, photo galleries, compatible training types, capacity, and accommodation info
- **Registration management**: add participants with contact info, track payment status (pending/partial/paid) and amounts paid
- **Session scheduling**: multiple sessions per training with date ranges, location assignment, trainer and assistant assignment
- **Attendance tracking**: mark each participant as present/absent per session with notes
- **Document management**: upload PDFs, links, images, and videos for participant materials
- **Checklist tracking**: inherited from training type, customizable per training (add/remove items), visual progress indicator
- **Financial tracking**: expenses by category (location, material, food, accommodation, transport, other), automatic revenue calculation from registrations, profitability analysis
- **Calendar views**: monthly and yearly views showing all trainings with dates and status-based colors
- **Idea notebook**: categorized notes (subject, trainer, location, other) with tags for capturing future training concepts
- **Reporting**: KPIs, profitability metrics, and training statistics

## Recommended Approach: Test-Driven Development

If a `tests.md` file is provided for this section, write your tests first following those instructions, then implement until all tests pass. This ensures complete coverage of user flows and edge cases.

## What to Implement

### Components

The following components are provided in `product-plan/sections/academy/components/`:

- `TrainingKanban` — Main Kanban board with columns by training status
- `TrainingCard` — Individual training card showing title, dates, registration fill rate, and status
- `TrainingDetail` — Training detail view container with tabbed navigation
- `TrainingInfoTab` — General training information (type, dates, price, description, coordinator notes)
- `TrainingSessionsTab` — Session list with dates, locations, trainers, and assistants
- `TrainingRegistrationsTab` — Registration list with participant info and payment tracking
- `TrainingAttendancesTab` — Attendance grid (participants x sessions) with present/absent marking
- `TrainingDocumentsTab` — Document list with upload and type indicators (PDF, link, image, video)
- `TrainingChecklistTab` — Checklist with progress bar, inherited items, and custom additions
- `TrainingFinancesTab` — Financial overview with expenses, revenue, and profitability calculation
- `TrainingCalendar` — Calendar wrapper with view toggle
- `CalendarMonthView` — Monthly calendar grid with training blocks color-coded by status
- `CalendarYearView` — Yearly overview showing training distribution across months
- `TrainingTypeList` — List of training types with checklist templates and photo galleries
- `TrainingTypeCard` — Individual training type card with associated trainers
- `TrainingLocationList` — List of training locations with capacity and amenity info
- `TrainingLocationCard` — Individual location card with photos and compatible training types

### Data Layer

Key types to wire up from `types.ts`:

- `TrainingType` (id, name, description, checklistTemplate, photoGallery, trainerIds, createdAt)
- `TrainingLocation` (id, name, address, description, photoGallery, compatibleTrainingTypeIds, capacity, hasAccommodation)
- `Training` (id, trainingTypeId, title, status, price, maxParticipants, requiresAccommodation, description, coordinatorNote)
- `TrainingStatus`: `'draft' | 'planned' | 'registrations_open' | 'in_progress' | 'completed' | 'cancelled'`
- `TrainingSession` (id, trainingId, startDate, endDate, locationIds, trainerIds, assistantIds, description)
- `TrainingRegistration` (id, trainingId, contactId, contactName, contactEmail, amountPaid, paymentStatus: pending/partial/paid, internalNote)
- `TrainingAttendance` (id, registrationId, sessionId, isPresent, note)
- `TrainingDocument` (id, trainingId, name, type: pdf/link/image/video, url)
- `TrainingExpense` (id, trainingId, category: location/material/food/accommodation/transport/other, description, amount, date)
- `IdeaNote` (id, category: subject/trainer/location/other, title, content, tags)
- `Member` (id, firstName, lastName, email, avatar)

### Callbacks

The `AcademyProps` interface defines all callbacks:

- **Training Type actions**: `onCreateTrainingType`, `onViewTrainingType(id)`, `onEditTrainingType(id)`, `onDeleteTrainingType(id)`
- **Training actions**: `onCreateTraining`, `onViewTraining(id)`, `onEditTraining(id)`, `onDeleteTraining(id)`, `onUpdateTrainingStatus(id, status)`
- **Session actions**: `onAddSession(trainingId)`, `onEditSession(sessionId)`, `onDeleteSession(sessionId)`
- **Location actions**: `onCreateLocation`, `onViewLocation(id)`, `onEditLocation(id)`, `onDeleteLocation(id)`
- **Registration actions**: `onAddRegistration(trainingId)`, `onEditRegistration(id)`, `onDeleteRegistration(id)`, `onUpdatePaymentStatus(registrationId, status, amountPaid)`
- **Attendance actions**: `onMarkAttendance(registrationId, sessionId, isPresent)`
- **Checklist actions**: `onToggleChecklistItem(trainingId, itemIndex)`, `onAddChecklistItem(trainingId, item)`, `onRemoveChecklistItem(trainingId, itemIndex)`
- **Document actions**: `onUploadDocument(trainingId, file)`, `onDeleteDocument(documentId)`
- **Expense actions**: `onAddExpense(trainingId)`, `onEditExpense(expenseId)`, `onDeleteExpense(expenseId)`
- **Calendar actions**: `onViewCalendar(view: 'month' | 'year')`
- **Idea Notes actions**: `onCreateIdeaNote`, `onEditIdeaNote(noteId)`, `onDeleteIdeaNote(noteId)`
- **Reporting**: `onViewReporting`

### Empty States

Implement empty states for:
- No trainings yet (empty Kanban board, encourage first training creation)
- No training types defined (needed before creating trainings)
- No training locations added
- Training with no sessions scheduled
- Training with no registrations
- Empty attendance grid (no sessions or no registrations)
- No documents uploaded for a training
- Empty checklist (no items inherited or added)
- No expenses recorded
- Empty calendar (no trainings in current month/year)
- No idea notes in the notebook
- No data for reporting

## Files to Reference

- `product-plan/sections/academy/components/` — All React components listed above
- `product-plan/data-model/types.ts` — Global type definitions
- `product/sections/academy/types.ts` — Section-specific types and props
- `product/sections/academy/data.json` — Sample data
- `product/sections/academy/spec.md` — Full specification
- `product/sections/academy/*.png` — Screenshots (training-kanban, training-detail, training-calendar, training-type-list, training-location-list)

## Expected User Flows

1. **Create Training**: User selects a training type from the type list, fills in dates/location/price/max participants, training appears as "Draft" in the Kanban board, checklist is inherited from the training type and can be customized with additional items
2. **Manage Registrations**: User opens a training's Registrations tab, adds participants with contact info and payment details, tracks payment status progression (pending to partial to paid), registration count updates on the Kanban card
3. **Track Attendance**: During or after sessions, user opens the Attendances tab, sees a grid of participants vs. sessions, marks each participant as present or absent with optional notes, attendance statistics update automatically
4. **View Calendar**: User switches between monthly and yearly calendar views, sees all trainings displayed with status-based color coding, clicks a training to navigate to its detail view

## Done When

- [ ] Tests written for key user flows
- [ ] All tests pass
- [ ] Kanban board displays trainings organized by status columns
- [ ] Training cards show title, dates, registration fill rate, and can be moved between statuses
- [ ] Training creation from types works with checklist template inheritance
- [ ] Training types can be created, edited, and deleted with checklist templates and photo galleries
- [ ] Training locations can be managed with capacity, accommodation info, and compatible types
- [ ] Registration management with add/edit/delete and payment status tracking (pending/partial/paid)
- [ ] Session scheduling with location, trainer, and assistant assignment
- [ ] Attendance marking works per participant per session
- [ ] Checklist items inherited from type, customizable per training with progress indicator
- [ ] Document upload and management functional
- [ ] Financial calculations accurate (expenses by category, revenue from registrations, profitability)
- [ ] Monthly calendar view renders trainings with status colors
- [ ] Yearly calendar view shows training distribution across months
- [ ] Idea notebook supports categorized notes with tags
- [ ] Empty states for no trainings, no registrations, empty calendar, etc.
- [ ] Responsive on mobile

---


# Milestone 6: Nursery

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete, Milestone 3 (Plant Database) recommended

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

Implement the Nursery section — nursery management for Semisto's network of nurseries, covering stock, orders, mother plants, and a multi-nursery catalog.

## Overview

The Nursery section manages Semisto's plant nurseries and partner nurseries. It handles stock tracking with batch-level detail, mother plant management, order processing with multi-nursery fulfillment, inter-nursery transfers, and a designer-facing catalog.

**Key Functionality:**
- Stock management: batches with species, variety, container, growth stage, pricing (euros + Semos)
- Mother plant tracking: validated sources from Design Studio projects or member proposals
- Order processing workflow: new → processing → ready → picked-up
- Multi-nursery order fulfillment with transfer optimization
- Team scheduling: weekly calendar for employees, interns, volunteers
- Multi-nursery catalog for Design Studio designers (read-only view with availability)
- Partner nursery management: platform-integrated vs manual catalog

## Recommended Approach: Test-Driven Development

Before implementing this section, **write tests first** based on the test specifications provided.

See `product-plan/sections/nursery/tests.md` for detailed test-writing instructions.

## What to Implement

### Components

Copy from `product-plan/sections/nursery/components/`:

- `StockManagement` — Stock batch list with filters
- `StockBatchForm` — Create/edit stock batch
- `StockBatchRow` — Individual batch display
- `Catalog` — Multi-nursery catalog view
- `CatalogItem` — Individual catalog entry
- `MotherPlantList` — Mother plant tracker
- `MotherPlantRow` — Individual mother plant entry

### Data Layer

Key types from `types.ts`: Nursery, Container, StockBatch, MotherPlant, Order, OrderLine, Transfer, TeamMember, ScheduleSlot, DocumentationEntry, TimesheetEntry, DashboardAlert

### Callbacks

Wire up: onViewStock, onViewOrders, onViewTransfers, onViewValidations, onCreate (stock), onEdit, onDelete, onFilter (stock by nursery/species/container/stage), onProcess (order), onMarkReady, onMarkPickedUp, onCancel, onValidate/onReject (mother plants)

### Empty States

- No stock batches: prompt to add first batch
- No orders: message about no pending orders
- No mother plants: explain what mother plants are and how to propose one

## Files to Reference

- `product-plan/sections/nursery/README.md` — Feature overview
- `product-plan/sections/nursery/tests.md` — Test-writing instructions
- `product-plan/sections/nursery/components/` — React components
- `product-plan/sections/nursery/types.ts` — TypeScript interfaces
- `product-plan/sections/nursery/sample-data.json` — Test data

## Expected User Flows

### Flow 1: Add Stock Batch
1. User navigates to Stock Management
2. User clicks "Add Batch"
3. User selects species, variety, container, quantity, price
4. User clicks "Save"
5. **Outcome:** New batch appears in the stock list with availability

### Flow 2: Process an Order
1. User views the order list, sees a "new" order
2. User clicks on the order to see detail (items from multiple nurseries)
3. User clicks "Process" to start preparing
4. User marks individual items as prepared
5. User clicks "Ready" when all items are prepared
6. Customer picks up, user marks "Picked Up"
7. **Outcome:** Order status progresses through workflow

### Flow 3: Validate a Mother Plant
1. A member proposes a plant as a mother plant
2. Nursery manager sees it in the pending validations
3. Manager reviews details (location, species, health)
4. Manager validates or rejects with notes
5. **Outcome:** Validated mother plant appears in the catalog for propagation reference

## Done When

- [ ] Tests written for key user flows
- [ ] All tests pass
- [ ] Stock management with batch CRUD and filtering
- [ ] Mother plant list with validation workflow
- [ ] Order processing through full workflow
- [ ] Catalog shows availability across nurseries
- [ ] Empty states display properly
- [ ] Responsive on mobile

---


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

---


# Milestone 8: Citizen Engagement

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete

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

Implement the Citizen Engagement section — a gamified platform for citizen participation in territory transformation.

## Overview

Citizen Engagement is a ludique, colorful platform enabling citizens to map potential planting spots (Villages Nourriciers), contribute to Semisto's needs (donations, volunteering, equipment), and participate in a gamified community with badges, challenges, and village rankings.

**Key Functionality:**
- Engagement hub with impact counters, urgent needs, recent activity
- Interactive map with villages and spots (points/lines/polygons)
- Contribution system: campaigns with progress bars, material wishlist
- Worksite registration for volunteer planting events
- Village leaderboards with progressive badges (éveil → planteur → nourricier → résilient)
- Seasonal challenges between villages
- Spot sponsorship with site logs and maturity tracking
- Local marketplace for surplus exchange (fruit, cuttings, seeds)
- Skills directory for knowledge transmission (grafting, pruning, etc.)

## Recommended Approach: Test-Driven Development

See `product-plan/sections/citizen-engagement/tests.md` for detailed test-writing instructions.

## What to Implement

### Components

Copy from `product-plan/sections/citizen-engagement/components/`:

- `CitizenEngagementHub` — Main hub page
- `ImpactCounter` — Animated impact metrics
- `QuickActionCard` — Quick action cards (map, contribute, worksites)
- `ActivityFeed` — Recent community activity
- `CampaignCard` / `CampaignDetailCard` — Funding campaigns
- `WishlistItemCard` — Material wishlist items
- `WorksiteCard` — Volunteer worksite cards
- `SeasonalChallengeCard` — Seasonal challenges
- `TopContributorCard` — Top contributor display
- `VillagePodium` — Top 3 villages podium
- `VillageRankingRow` — Village ranking row
- `LeaderboardView` — Complete leaderboard page
- `ContributeView` — Contribution page (campaigns, wishlist, worksites)

### Data Layer

Key types: Village, Spot, Citizen, Campaign, WishlistItem, Worksite, Event, SeasonalChallenge, Contribution, RecentActivity, ImpactStats, Badge, Surplus, Skill, SiteLogEntry

### Callbacks

Wire up: onNavigateToMap, onNavigateToContribute, onViewCampaign, onJoinWorksite, onViewEvent, onDonateToCampaign, onFundWishlistItem, onJoinVillage, onViewSpot, onValidateSpot, onSponsor, onAddLogEntry, onReportIssue, onContactSeller, onReserveSurplus, onAddSurplus, onContactGardener, onAddSkill

## Files to Reference

- `product-plan/sections/citizen-engagement/README.md`
- `product-plan/sections/citizen-engagement/tests.md`
- `product-plan/sections/citizen-engagement/components/`
- `product-plan/sections/citizen-engagement/types.ts`
- `product-plan/sections/citizen-engagement/sample-data.json`

## Expected User Flows

### Flow 1: Report a Planting Spot
1. Citizen opens the map
2. Draws a point/line/polygon on a potential spot
3. Fills in details (soil type, exposure, ownership, photos)
4. Submits for community validation
5. **Outcome:** Spot appears on map as "identified", awaiting validation

### Flow 2: Contribute to a Campaign
1. Citizen browses active campaigns on the Contribute page
2. Selects a campaign, sees progress bar and details
3. Makes a donation via integrated payment
4. **Outcome:** Campaign progress updates, contribution appears in activity feed

### Flow 3: Join a Worksite
1. Citizen browses upcoming worksites
2. Clicks "Join" on a worksite
3. Receives practical information (location, time, what to bring)
4. Attends and participation is validated
5. **Outcome:** Citizen earns Semos, badge progress updates

## Done When

- [ ] Tests written for key flows
- [ ] Hub page with impact counters and activity feed
- [ ] Interactive map with villages and spots
- [ ] Campaign donation and wishlist funding
- [ ] Worksite listing and registration
- [ ] Village leaderboards with badges
- [ ] Seasonal challenges display
- [ ] Empty states (no spots in village, no campaigns, etc.)
- [ ] Responsive on mobile

---


# Milestone 9: Partner Portal

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete

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

Implement the Partner Portal — a standalone dashboard for institutions, enterprises, and municipalities to engage with and fund Semisto projects.

## Overview

The Partner Portal is a dedicated space for partner organizations. It combines an action-oriented dashboard with impact metrics and engagement tracking. Partners browse pre-defined packages, fund specific projects through a collaborative flow, and track the concrete impact of their contributions for RSE reporting.

**Key Functionality:**
- Dashboard with quick actions, impact metrics, and active engagement tracking
- Package catalog: Citizen Project, Team Building, Sponsorship, Recurring Patronage, Training, Ambassador
- Collaborative funding flow inspired by CoBudget (5 steps: governance → onboarding → proposals → allocation → accountability)
- Engagement detail: timeline, event calendar, documents, photo/video gallery
- Impact metrics dashboard with PDF export for RSE reporting
- Contact Semisto CTA for custom proposals

**Note:** This section is standalone (shell: false) — it has its own portal header, not the app shell. One account per partner organization (no multi-user).

## Recommended Approach: Test-Driven Development

See `product-plan/sections/partner-portal/tests.md` for detailed test-writing instructions.

## What to Implement

### Components

Copy from `product-plan/sections/partner-portal/components/`:

- `PartnerPortal` — Main portal layout with all sections
- `PortalHeader` — Partner-specific header
- `MetricCard` — Impact metric display
- `PackageCard` — Engagement package card
- `FundingProposalCard` — Project funding proposal
- `EngagementCard` — Active engagement summary
- `EngagementTimeline` — Engagement event timeline

### Data Layer

Key types: Partner, Package, Engagement, EngagementEvent, EngagementDocument, EngagementMedia, FundingProposal, Funding, ImpactMetrics

### Callbacks

Wire up: onPackageInterest, onPackageView, onFundProposal, onProposalView, onEngagementView, onDocumentDownload, onExportPdf, onContactSemisto

## Files to Reference

- `product-plan/sections/partner-portal/README.md`
- `product-plan/sections/partner-portal/tests.md`
- `product-plan/sections/partner-portal/components/`
- `product-plan/sections/partner-portal/types.ts`
- `product-plan/sections/partner-portal/sample-data.json`

## Expected User Flows

### Flow 1: Browse and Select a Package
1. Partner logs into their portal
2. Sees available packages as visual cards
3. Clicks "Marquer mon intérêt" on a package
4. Receives confirmation that Semisto will follow up
5. **Outcome:** Package interest is registered

### Flow 2: Fund a Project
1. Partner browses funding proposals from Labs
2. Selects a project, reviews details (location, trees planned, amount needed)
3. Allocates a specific amount to the project
4. **Outcome:** Funding is recorded, impact metrics update

### Flow 3: Export Impact Report
1. Partner views their impact dashboard (hectares, trees, participants, CO2)
2. Reviews monthly evolution charts
3. Clicks "Export PDF"
4. **Outcome:** PDF report generated for RSE reporting

## Done When

- [ ] Tests written for key flows
- [ ] Portal renders with partner info
- [ ] Package catalog with interest marking
- [ ] Funding proposal list with allocation flow
- [ ] Engagement detail with timeline and media
- [ ] Impact metrics dashboard with charts
- [ ] PDF export for RSE reporting
- [ ] Contact Semisto CTA works
- [ ] Empty states (no engagements yet, no funding proposals)
- [ ] Responsive on mobile
- [ ] Standalone navigation (portal header, not app shell)

---

