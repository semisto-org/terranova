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
