# Test Instructions: Lab Management

These test-writing instructions are **framework-agnostic**. Adapt them to your testing setup.

## Overview

Lab Management covers Shape Up methodology, member management, Semos currency, timesheets, and calendar. Test each module independently.

---

## User Flow Tests

### Flow 1: Create a Pitch

**Scenario:** User creates a new Shape Up pitch

#### Success Path

**Setup:** User is logged in as a shaper/admin

**Steps:**
1. User navigates to the Shape Up workboard
2. User clicks "Nouveau Pitch" button
3. User fills in: title, problem, solution, appetite (2-weeks/3-weeks/6-weeks)
4. User adds rabbit holes and no-gos
5. User clicks "Créer"

**Expected Results:**
- [ ] New pitch appears in the pitch list with status "raw"
- [ ] Pitch displays all 5 ingredients (Problem, Solution, Appetite, Rabbit Holes, No-Gos)
- [ ] Success notification appears
- [ ] User can click to view the pitch detail

#### Failure Path: Missing Required Fields

**Steps:** User submits without filling in problem or solution

**Expected Results:**
- [ ] Validation errors appear on required fields
- [ ] Pitch is not created
- [ ] Form data is preserved

### Flow 2: Place a Bet

**Scenario:** During cooldown, user places a bet on a pitch

#### Success Path

**Setup:** A cycle is in cooldown status, pitches with status "shaped" exist

**Steps:**
1. User navigates to the Betting Table
2. User sees available shaped pitches
3. User selects team members for a pitch
4. User clicks "Parier"

**Expected Results:**
- [ ] Bet is recorded with the selected team
- [ ] Pitch status updates to "betting"
- [ ] Bet appears in the cycle's bet list

### Flow 3: Update Hill Chart

**Scenario:** Team member moves a scope on the hill chart

**Steps:**
1. User navigates to the Building view for an active bet
2. User sees scopes plotted on the hill chart
3. User drags a scope from uphill (0-50) to downhill (51-100)
4. Hill chart snapshot is saved

**Expected Results:**
- [ ] Scope position updates visually
- [ ] New snapshot appears in hill chart history
- [ ] Position persists on page reload

### Flow 4: Transfer Semos

**Scenario:** Member transfers Semos to another member

#### Success Path

**Setup:** User has a wallet with balance > 0

**Steps:**
1. User navigates to Semos dashboard
2. User sees current balance in wallet card
3. User clicks "Transférer"
4. User selects recipient, enters amount (e.g., 50) and description
5. User confirms transfer

**Expected Results:**
- [ ] Sender's balance decreases by 50
- [ ] Transaction appears in sender's history
- [ ] Success message appears: "Transfert effectué"

#### Failure Path: Insufficient Balance

**Setup:** User tries to transfer more than their balance

**Expected Results:**
- [ ] Error message: "Solde insuffisant"
- [ ] Transfer is not executed
- [ ] Balance remains unchanged

### Flow 5: Create Timesheet Entry

**Scenario:** Member logs hours worked

**Steps:**
1. User navigates to Timesheets
2. User clicks "Nouvelle prestation"
3. User fills in: date, hours, category, description
4. User optionally links to a project/course/guild
5. User enters kilometers
6. User clicks "Enregistrer"

**Expected Results:**
- [ ] Entry appears in the timesheet list
- [ ] Statistics update (total hours, etc.)
- [ ] Entry shows as "non facturé"

---

## Empty State Tests

### No Pitches

**Setup:** No pitches exist

**Expected Results:**
- [ ] Message like "Aucun pitch pour le moment"
- [ ] CTA button "Créer un pitch" is visible and functional

### No Members

**Setup:** Member list is empty

**Expected Results:**
- [ ] Empty state message displayed
- [ ] Admin sees "Ajouter un membre" button

### No Timesheet Entries

**Setup:** No timesheets exist for the current user

**Expected Results:**
- [ ] Message like "Aucune prestation enregistrée"
- [ ] CTA "Nouvelle prestation" is visible

### No Semos Transactions

**Setup:** Wallet exists but no transactions

**Expected Results:**
- [ ] Balance shows correctly (may be 0)
- [ ] Transaction history shows empty message

---

## Component Interaction Tests

### Dashboard
- [ ] Displays current cycle progress
- [ ] Shows next events
- [ ] Shows wallet balance summary

### HillChart
- [ ] Renders scopes at correct positions
- [ ] Drag updates position value
- [ ] Shows uphill/downhill sections clearly

### MemberCard
- [ ] Displays name, avatar, roles
- [ ] Shows active/inactive status
- [ ] Click calls onViewMember with correct ID

### TimesheetFilters
- [ ] Filters by date range
- [ ] Filters by category
- [ ] Filters by invoiced status
- [ ] Reset clears all filters

---

## Edge Cases

- [ ] Handles member with no roles assigned
- [ ] Long pitch titles truncate properly
- [ ] Hill chart works with 1 scope and 20+ scopes
- [ ] Semos transfer to self is prevented
- [ ] Calendar handles months with no events
- [ ] Timesheet with 0 hours is rejected

---

## Sample Test Data

```typescript
const mockMember = {
  id: "member-1",
  firstName: "Marie",
  lastName: "Dupont",
  email: "marie@semisto.org",
  avatar: "",
  roles: ["designer", "coordination"],
  status: "active",
  isAdmin: true,
  joinedAt: "2023-01-15",
  walletId: "wallet-1",
  guildIds: ["guild-1"]
};

const mockPitch = {
  id: "pitch-1",
  title: "Améliorer la recherche de plantes",
  status: "raw",
  appetite: "6-weeks",
  authorId: "member-1",
  createdAt: "2024-01-15",
  problem: "La recherche est trop lente",
  solution: "Ajouter des filtres avancés",
  rabbitHoles: ["Ne pas refaire le moteur de recherche"],
  noGos: ["Pas d'IA pour le moment"],
  breadboard: null,
  fatMarkerSketch: null
};

const mockWallet = {
  id: "wallet-1",
  memberId: "member-1",
  balance: 250,
  floor: -50,
  ceiling: 1000
};

const mockEmptyList = [];
```
