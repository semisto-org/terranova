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
