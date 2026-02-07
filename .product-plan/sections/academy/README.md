# Academy

## Overview

Academy est l'interface de gestion des formations Semisto. Elle permet aux coordinateurs d'organiser, suivre et analyser leurs formations de manière fluide, depuis l'idée initiale jusqu'au reporting final. Vue Kanban comme écran principal.

## User Flows

- **Kanban Board**: View trainings organized by status columns
- **Create Training**: From a training type, with dates, location, price, checklist
- **Manage Registrations**: Add participants, track payments
- **Track Attendance**: Mark presence per session
- **Financial Tracking**: Expenses, revenue, profitability
- **Calendar**: Monthly and yearly views
- **Training Types & Locations**: Manage reusable templates and venues

## Components Provided

- `TrainingKanban` / `TrainingCard` — Kanban board and cards
- `TrainingDetail` — Tabbed detail view
- `TrainingInfoTab` / `TrainingSessionsTab` / `TrainingRegistrationsTab` — Tabs
- `TrainingAttendancesTab` / `TrainingDocumentsTab` / `TrainingChecklistTab` / `TrainingFinancesTab` — More tabs
- `TrainingCalendar` / `CalendarMonthView` / `CalendarYearView` — Calendar views
- `TrainingTypeList` / `TrainingTypeCard` — Training type management
- `TrainingLocationList` / `TrainingLocationCard` — Location management

## Callback Props

| Callback | Description |
|----------|-------------|
| `onCreateTraining` | Create a new training |
| `onViewTraining` | View training details |
| `onUpdateTrainingStatus` | Change training status |
| `onAddRegistration` | Add participant to training |
| `onUpdatePaymentStatus` | Update payment info |
| `onMarkAttendance` | Mark attendance for session |
| `onToggleChecklistItem` | Check/uncheck checklist item |
| `onAddExpense` | Add training expense |
