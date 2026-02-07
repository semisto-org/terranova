# Lab Management

## Overview

Lab Management est le centre opérationnel du Lab Semisto. Il implémente la méthodologie Shape Up avec ses trois modules (Shaping, Betting, Building), gère les membres et leurs rôles, administre le système financier Semos, et permet le suivi des prestations via timesheets. Un calendrier centralise la visualisation des cycles, réunions et événements collectifs.

## User Flows

- **Shape Up - Shaping**: Create Pitches with 5 ingredients, use Breadboarding and Fat Marker Sketches
- **Shape Up - Betting**: Review pitches during cooldown, place bets for the next cycle
- **Shape Up - Building**: Organize tasks into Scopes, update Hill Chart, manage Chowder List
- **Cycles & Calendar**: View cycles, create/manage events (meetings, design days, etc.)
- **Members**: Add members (admin), define roles, view directory
- **Semos**: View balances, transfer between members, admin emission and rates
- **Timesheets**: Log hours with category, link to projects/courses/guilds

## Components Provided

- `Dashboard` — Main overview with cycle progress and key metrics
- `ShapeUpWorkboard` — Combined Shape Up view
- `PitchCard` — Pitch display card
- `BettingTable` — Betting interface
- `BuildingView` — Building phase with scopes
- `HillChart` — Interactive hill chart
- `ScopeCard` / `TaskList` / `ChowderList` — Building components
- `IdeaLists` — Decentralized idea lists
- `MemberList` / `MemberCard` — Member directory
- `SemosDashboard` / `SemosWalletCard` / `SemosTransferForm` / `SemosAdminPanel` — Semos system
- `TimesheetList` / `TimesheetRow` / `TimesheetFilters` / `TimesheetStats` — Timesheet management
- `CalendarView` / `EventCard` / `CycleProgress` — Calendar and events

## Callback Props

| Callback | Description |
|----------|-------------|
| `onAddMember` | Admin adds a new member |
| `onViewMember` | View a member's profile |
| `onCreatePitch` | Create a new pitch |
| `onPlaceBet` | Place a bet on a pitch |
| `onUpdateHillPosition` | Update scope position on hill chart |
| `onTransferSemos` | Transfer Semos to another member |
| `onEmitSemos` | Admin emits new Semos |
| `onCreateTimesheet` | Create a new timesheet entry |
| `onCreateEvent` | Create a new event |
