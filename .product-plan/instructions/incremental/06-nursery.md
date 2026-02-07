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
