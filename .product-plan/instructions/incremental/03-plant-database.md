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
