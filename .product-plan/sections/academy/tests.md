# Test Instructions: Academy

These test-writing instructions are **framework-agnostic**.

## Overview

Academy manages training courses with a Kanban board, registrations, attendance, finances, and calendar. Test the full lifecycle of a training.

---

## User Flow Tests

### Flow 1: Create a Training

#### Success Path

**Setup:** Training types exist with checklist templates

**Steps:**
1. User navigates to the Kanban board
2. User clicks "Nouvelle formation"
3. User selects a training type
4. User fills in: title, dates, location, price, max participants
5. User clicks "Créer"

**Expected Results:**
- [ ] New training appears in "Brouillon" column of Kanban
- [ ] Training card shows title, dates, participant count "0/N"
- [ ] Checklist is inherited from the training type
- [ ] Success notification appears

#### Failure Path: Missing Required Fields

**Expected Results:**
- [ ] Validation errors on empty required fields
- [ ] Training not created

### Flow 2: Manage Registrations

**Steps:**
1. User opens a training detail
2. User clicks "Inscriptions" tab
3. User clicks "Ajouter un participant"
4. User enters: contact name, email, amount paid
5. User saves

**Expected Results:**
- [ ] Participant appears in the registrations list
- [ ] Payment status shows correctly (pending/partial/paid)
- [ ] Participant count on training card updates
- [ ] If max reached, warning indicator appears

### Flow 3: Track Attendance

**Setup:** Training has sessions and registered participants

**Steps:**
1. User opens "Présences" tab
2. User sees a grid: sessions as columns, participants as rows
3. User checks/unchecks attendance for each participant-session combination

**Expected Results:**
- [ ] Checkbox state persists
- [ ] Attendance percentage updates per participant and per session
- [ ] Visual indicator for fully attended vs. partially attended

### Flow 4: View Calendar

**Steps:**
1. User clicks "Calendrier" navigation
2. Monthly view shows trainings as colored blocks
3. User switches to yearly view

**Expected Results:**
- [ ] Monthly view shows training sessions on correct dates
- [ ] Status color-coding visible (draft=gray, planned=blue, etc.)
- [ ] Yearly view shows training distribution across months
- [ ] Clicking a training navigates to its detail

---

## Empty State Tests

### No Trainings (Empty Kanban)

**Expected Results:**
- [ ] All Kanban columns are empty
- [ ] Message: "Aucune formation"
- [ ] CTA: "Créer une formation"

### No Registrations

**Setup:** Training exists but has no registrations

**Expected Results:**
- [ ] Registrations tab shows: "Aucun participant inscrit"
- [ ] CTA: "Ajouter un participant"
- [ ] Training card shows "0/N" participants

### No Sessions

**Setup:** Training has no scheduled sessions

**Expected Results:**
- [ ] Sessions tab shows: "Aucune session planifiée"
- [ ] CTA: "Ajouter une session"

### Empty Calendar

**Expected Results:**
- [ ] Calendar renders with no events
- [ ] Month/year navigation still works

---

## Component Tests

### TrainingCard
- [ ] Shows title and status badge
- [ ] Shows date range
- [ ] Shows participant count with fill indicator
- [ ] Checklist progress bar visible
- [ ] Click calls onViewTraining

### TrainingKanban
- [ ] Renders 6 columns (Draft, Planned, Registrations Open, In Progress, Completed, Cancelled)
- [ ] Cards appear in correct columns
- [ ] Column counts match card counts

### CalendarMonthView
- [ ] Shows correct number of days for the month
- [ ] Training blocks span correct date ranges
- [ ] Navigation between months works

---

## Edge Cases

- [ ] Training with 0 price (free training)
- [ ] Training spanning multiple months in calendar
- [ ] Very long training titles truncate
- [ ] Participant removed after marking attendance
- [ ] Checklist with 20+ items scrolls properly

---

## Sample Test Data

```typescript
const mockTraining = {
  id: "training-1",
  trainingTypeId: "type-1",
  title: "Design de Jardin-Forêt - Niveau 1",
  status: "registrations_open",
  price: 450,
  maxParticipants: 15,
  requiresAccommodation: true,
  description: "Formation complète sur le design permaculturel",
  coordinatorNote: "",
  createdAt: "2024-01-10",
  updatedAt: "2024-01-10"
};

const mockRegistration = {
  id: "reg-1",
  trainingId: "training-1",
  contactId: "contact-1",
  contactName: "Pierre Martin",
  contactEmail: "pierre@example.com",
  amountPaid: 225,
  paymentStatus: "partial",
  internalNote: "Paie en 2 fois",
  registeredAt: "2024-01-15"
};

const mockEmptyTrainings = [];
```
