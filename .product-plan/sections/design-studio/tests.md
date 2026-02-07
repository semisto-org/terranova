# Test Instructions: Design Studio

These test-writing instructions are **framework-agnostic**.

## Overview

The Design Studio manages forest garden projects through their full lifecycle. Currently provides the project dashboard with stats. More components expected as the section expands.

---

## User Flow Tests

### Flow 1: View Project Dashboard

**Setup:** Multiple projects exist in various phases

**Steps:**
1. User navigates to Design Studio
2. Dashboard loads with project list and statistics

**Expected Results:**
- [ ] Stats cards show: active projects, pending, total, hours this month, revenue this year, quote conversion rate
- [ ] Project cards show: name, client, phase, status
- [ ] Projects can be filtered by phase and status
- [ ] Upcoming meetings displayed

### Flow 2: Create a New Project

**Steps:**
1. User clicks "Nouveau projet"
2. User optionally selects a template
3. User fills in: project name, client info, address, area
4. User clicks "Créer"

**Expected Results:**
- [ ] New project appears in the dashboard
- [ ] Project starts in "offre" phase
- [ ] Default template values applied (if template selected)
- [ ] User can navigate to the new project

### Flow 3: Delete a Project

**Steps:**
1. User clicks delete icon on a project card
2. Confirmation dialog appears
3. User confirms deletion

**Expected Results:**
- [ ] Project removed from dashboard
- [ ] Stats update (project count decreases)
- [ ] If last project, empty state appears

---

## Empty State Tests

### No Projects

**Expected Results:**
- [ ] Message: "Aucun projet pour le moment"
- [ ] CTA: "Créer un projet"
- [ ] Stats show zeros

### No Upcoming Meetings

**Expected Results:**
- [ ] Meeting section shows: "Aucune réunion prévue"

---

## Component Tests

### ProjectCard
- [ ] Shows project name and client name
- [ ] Shows phase badge with appropriate color
- [ ] Shows status indicator
- [ ] Click calls onViewProject
- [ ] Action menu with Edit, Delete, Duplicate

### StatsCard
- [ ] Displays label and value
- [ ] Handles zero values gracefully
- [ ] Formats numbers appropriately (e.g., "12 500 €")

---

## Sample Test Data

```typescript
const mockProject = {
  id: "project-1",
  name: "Jardin-forêt Dupont",
  clientName: "Jean Dupont",
  phase: "projet-detaille",
  status: "active",
  area: 2500,
  startDate: "2024-03-15"
};

const mockStats = {
  activeProjects: 5,
  pendingProjects: 2,
  totalProjects: 12,
  totalHoursThisMonth: 87,
  totalRevenueThisYear: 45000,
  quoteConversionRate: 0.73,
  upcomingMeetings: []
};

const mockEmptyProjects = [];
```
