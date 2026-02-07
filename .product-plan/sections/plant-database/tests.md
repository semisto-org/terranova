# Test Instructions: Plant Database

These test-writing instructions are **framework-agnostic**.

## Overview

The Plant Database is a standalone botanical database with search, detailed pages, plant palettes, and community contributions. Mobile-first design.

---

## User Flow Tests

### Flow 1: Search for a Plant

#### Success Path

**Steps:**
1. User lands on the search page
2. User types "Malus" in the search bar
3. Results appear showing matching genera/species/varieties
4. User clicks on "Malus domestica"

**Expected Results:**
- [ ] Search results update as user types
- [ ] Results show Latin name and common name
- [ ] Clicking navigates to species detail page

#### Filtered Search

**Steps:**
1. User opens filter panel
2. User selects type: "tree" and exposure: "plein soleil"
3. Results filter to matching species

**Expected Results:**
- [ ] Active filter count shows "2 filtres"
- [ ] Results update to show only matching species
- [ ] "Réinitialiser" button clears all filters

#### No Results

**Steps:** User searches for "xyznonexistent"

**Expected Results:**
- [ ] Message: "Aucun résultat trouvé"
- [ ] Suggestion: "Essayez d'autres termes de recherche"

### Flow 2: View Species Detail

**Setup:** User navigates to a species detail page

**Expected Results:**
- [ ] Latin name displayed prominently
- [ ] Common names shown (in user's language first)
- [ ] Breadcrumb shows: Genus > Species
- [ ] Collapsible sections for properties (Type, Exposition, Rusticité, etc.)
- [ ] Photo gallery with swipe support
- [ ] Notes section with contributor names
- [ ] Nursery stock availability (if any)
- [ ] Plant location map (if locations exist)

### Flow 3: Generate AI Summary

**Steps:**
1. User views a species page
2. User sees the AI summary callout with explanation
3. User clicks "Générer un résumé IA"
4. Loading state appears

**Expected Results:**
- [ ] Button changes to loading state
- [ ] After async completion, summary text appears
- [ ] Generated date is displayed
- [ ] If error, error message shows with retry option

### Flow 4: Build Plant Palette

**Steps:**
1. User searches for species
2. User clicks "Ajouter à la palette" on a result
3. User selects the target strate (e.g., "Arbres")
4. User adds more species to different strates
5. User names the palette and saves

**Expected Results:**
- [ ] Species appears in the correct strate section
- [ ] Palette shows item count per strate
- [ ] Save button creates the palette
- [ ] Export PDF option available
- [ ] "Envoyer au Design Studio" option available

---

## Empty State Tests

### Empty Search (Initial State)

**Expected Results:**
- [ ] Search bar prominently displayed
- [ ] Placeholder text: "Rechercher par nom latin ou commun..."
- [ ] Primary filters visible below search bar

### Empty Palette

**Expected Results:**
- [ ] Message: "Votre palette est vide"
- [ ] Shows all 6 strate sections (empty)
- [ ] Instruction: "Ajoutez des espèces depuis la recherche"

### No Nursery Stock

**Setup:** Species has no nursery availability

**Expected Results:**
- [ ] Section shows: "Non disponible en pépinière actuellement"

### No Notes

**Setup:** Species has no contributor notes

**Expected Results:**
- [ ] Section shows: "Aucune note pour le moment"
- [ ] CTA: "Ajouter une note" (if contributor)

---

## Component Tests

### SearchResultItem
- [ ] Shows Latin name and common name
- [ ] Shows type badge (tree, shrub, etc.)
- [ ] "Add to palette" button visible
- [ ] Click calls onResultSelect

### FilterPanel
- [ ] Primary filters visible by default
- [ ] "Plus de filtres" expands advanced filters
- [ ] Active filter count displayed
- [ ] Reset clears all

### SpeciesDetail
- [ ] Renders all property sections
- [ ] Collapsible sections work
- [ ] Photo gallery renders and is swipeable

---

## Edge Cases

- [ ] Species with no genus (genusId: null)
- [ ] Very long Latin names truncate properly
- [ ] Species with all properties empty renders gracefully
- [ ] Palette with 50+ items remains performant
- [ ] Mobile: filter panel accessible via bottom sheet

---

## Sample Test Data

```typescript
const mockSpecies = {
  id: "species-1",
  genusId: "genus-1",
  latinName: "Malus domestica",
  type: "tree",
  edibleParts: ["fruit"],
  interests: ["comestible", "mellifère"],
  exposures: ["plein soleil", "mi-ombre"],
  hardiness: "H6",
  lifeCycle: "perennial",
  // ... other properties
};

const mockSearchResults = [
  { id: "species-1", type: "species", latinName: "Malus domestica", commonName: "Pommier" },
  { id: "variety-1", type: "variety", latinName: "Malus domestica 'Reine des Reinettes'", commonName: null }
];

const mockEmptyResults = [];
const mockEmptyPalette = { strates: { aquatic: [], groundCover: [], herbaceous: [], climbers: [], shrubs: [], trees: [] } };
```
