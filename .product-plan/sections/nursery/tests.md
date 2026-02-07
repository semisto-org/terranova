# Test Instructions: Nursery

These test-writing instructions are **framework-agnostic**.

## Overview

The Nursery section manages plant stock, mother plants, orders, and a multi-nursery catalog. Test stock CRUD, order workflow, and mother plant validation.

---

## User Flow Tests

### Flow 1: Add a Stock Batch

#### Success Path

**Setup:** Nurseries, containers, and species data exist

**Steps:**
1. User navigates to Stock Management
2. User clicks "Ajouter un lot"
3. User selects: nursery, species, variety (optional), container, quantity
4. User sets price in euros, optionally enables Semos payment
5. User clicks "Enregistrer"

**Expected Results:**
- [ ] New batch appears in the stock list
- [ ] Available quantity equals total quantity
- [ ] Reserved quantity is 0
- [ ] Batch appears in the correct nursery filter

#### Failure Path: Missing Required Fields

**Steps:** User submits without selecting species or setting quantity

**Expected Results:**
- [ ] Validation errors on required fields
- [ ] Batch not created

### Flow 2: Process an Order

**Setup:** Orders with status "new" exist

**Steps:**
1. User views order list, clicks on a "new" order
2. User sees order lines (items from potentially multiple nurseries)
3. User clicks "Traiter" to start processing
4. Status changes to "processing"
5. User prepares items, clicks "Prêt"
6. Status changes to "ready"
7. Customer picks up, user clicks "Retiré"
8. Status changes to "picked-up"

**Expected Results:**
- [ ] Status progresses: new → processing → ready → picked-up
- [ ] Stock quantities update (reserved → sold)
- [ ] Order detail shows all line items with source nurseries
- [ ] Each status change persists

### Flow 3: Validate a Mother Plant

**Setup:** Pending mother plant proposals exist

**Steps:**
1. User navigates to Mother Plants
2. User filters by status "pending"
3. User clicks on a pending proposal
4. User reviews: species, location, date planted, source
5. User clicks "Valider" (or "Rejeter")

**Expected Results:**
- [ ] Mother plant status updates to "validated" (or "rejected")
- [ ] Validated plants appear in the validated filter
- [ ] Validation date and validator recorded

### Flow 4: Browse Catalog (Designer View)

**Steps:**
1. Designer navigates to the multi-nursery catalog
2. Searches for a species
3. Sees availability across multiple nurseries
4. Distinguishes platform-integrated nurseries (real-time stock) from manual ones

**Expected Results:**
- [ ] Catalog shows species with availability per nursery
- [ ] Platform nurseries show exact quantities
- [ ] Manual nurseries show "available" without quantities
- [ ] Filters work: by nursery, species, available only

---

## Empty State Tests

### No Stock Batches

**Expected Results:**
- [ ] Message: "Aucun lot en stock"
- [ ] CTA: "Ajouter un lot"

### No Orders

**Expected Results:**
- [ ] Message: "Aucune commande"

### No Mother Plants

**Expected Results:**
- [ ] Message: "Aucun plant-mère enregistré"
- [ ] Explanation of what mother plants are

### Empty Catalog

**Expected Results:**
- [ ] Message: "Aucun résultat"
- [ ] Suggestion to adjust filters

---

## Component Tests

### StockBatchRow
- [ ] Displays species name, variety (if any), container
- [ ] Shows quantities: total, available, reserved
- [ ] Shows price in euros (and Semos if enabled)
- [ ] Growth stage badge visible
- [ ] Click opens edit form

### MotherPlantRow
- [ ] Shows species, location, planting date
- [ ] Source badge: "Design Studio" or "Proposition membre"
- [ ] Status badge: pending (yellow), validated (green), rejected (red)
- [ ] Validate/Reject buttons visible for pending items

### CatalogItem
- [ ] Shows species name and availability
- [ ] Distinguishes nurseries by integration type
- [ ] Container and price visible

---

## Edge Cases

- [ ] Batch with 0 available quantity (all reserved)
- [ ] Order with items from 5+ nurseries
- [ ] Mother plant from a deleted project
- [ ] Stock batch with only Semos pricing (no euro price)
- [ ] Filter combinations returning no results

---

## Sample Test Data

```typescript
const mockBatch = {
  id: "batch-1",
  nurseryId: "nursery-1",
  speciesId: "species-1",
  speciesName: "Malus domestica",
  varietyId: "variety-1",
  varietyName: "Reine des Reinettes",
  containerId: "container-1",
  quantity: 50,
  availableQuantity: 45,
  reservedQuantity: 5,
  growthStage: "young",
  priceEuros: 12.50,
  acceptsSemos: true,
  priceSemos: 25,
  createdAt: "2024-01-10",
  updatedAt: "2024-01-10"
};

const mockOrder = {
  id: "order-1",
  orderNumber: "CMD-2024-001",
  customerName: "Pierre Martin",
  status: "new",
  totalEuros: 125.00,
  lines: [{ speciesName: "Malus domestica", nurseryName: "Pépinière Wallonie", quantity: 10 }]
};

const mockEmptyBatches = [];
```
