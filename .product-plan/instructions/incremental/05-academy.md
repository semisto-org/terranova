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
