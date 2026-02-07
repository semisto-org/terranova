# Test Instructions: Partner Portal

These test-writing instructions are **framework-agnostic**.

## Overview

The Partner Portal is a standalone dashboard for institutions and enterprises to browse packages, fund projects, and track impact. One account per organization.

---

## User Flow Tests

### Flow 1: Browse Packages

**Steps:**
1. Partner logs into the portal
2. Sees available packages as visual cards
3. Reviews a package (includes, price range, duration)
4. Clicks "Marquer mon intérêt"

**Expected Results:**
- [ ] Package cards show: title, description, includes list, price range
- [ ] Highlighted packages are visually distinguished
- [ ] "Marquer mon intérêt" button calls onPackageInterest with package ID
- [ ] Confirmation feedback shown

### Flow 2: Fund a Project

**Steps:**
1. Partner navigates to funding proposals
2. Browses proposals from different Labs
3. Selects a proposal, reviews details
4. Enters funding amount
5. Confirms allocation

**Expected Results:**
- [ ] Proposals show: title, Lab name, target amount, raised percentage
- [ ] Progress bar reflects current funding level
- [ ] Allocation form accepts amount
- [ ] Impact metrics update after allocation
- [ ] Funding appears in partner's funding history

### Flow 3: View Engagement Details

**Setup:** Partner has active engagements

**Steps:**
1. Partner clicks on an active engagement card
2. Sees engagement timeline with events
3. Views documents and media

**Expected Results:**
- [ ] Timeline shows events in chronological order
- [ ] Completed events have checkmarks
- [ ] Documents downloadable
- [ ] Photo/video gallery viewable
- [ ] Progress indicator visible

### Flow 4: Export Impact Report

**Steps:**
1. Partner views the impact metrics section
2. Sees: total invested, hectares, trees, participants, CO2 offset
3. Sees monthly evolution chart
4. Clicks "Exporter en PDF"

**Expected Results:**
- [ ] All metric cards display with correct values
- [ ] Monthly history chart renders
- [ ] PDF export triggers download
- [ ] PDF includes all dashboard metrics

---

## Empty State Tests

### No Engagements

**Expected Results:**
- [ ] Dashboard shows: "Pas encore d'engagement"
- [ ] Package catalog is prominently displayed
- [ ] CTA: "Découvrez nos offres"

### No Funding Proposals

**Expected Results:**
- [ ] Message: "Aucune proposition de financement disponible"
- [ ] CTA: "Contactez Semisto pour proposer un projet"

### New Partner (No History)

**Expected Results:**
- [ ] Impact metrics show zeros
- [ ] Monthly chart is empty but renders
- [ ] Welcome message with guidance

---

## Component Tests

### PortalHeader
- [ ] Shows partner logo and name
- [ ] Navigation links work
- [ ] Contact Semisto button visible

### MetricCard
- [ ] Displays label, value, and icon
- [ ] Handles zero values
- [ ] Large numbers formatted properly (e.g., "12 450")

### PackageCard
- [ ] Shows package type, title, description
- [ ] Includes list displayed
- [ ] Price range and duration shown
- [ ] Highlighted variant has distinct styling
- [ ] CTA button calls correct callback

### FundingProposalCard
- [ ] Shows: title, Lab name, location, hectares, trees planned
- [ ] Progress bar with raised percentage
- [ ] Tags/categories visible
- [ ] Deadline displayed
- [ ] "Financer" button with amount input

### EngagementCard
- [ ] Shows: title, package type, Lab name, status
- [ ] Progress bar
- [ ] Next event preview
- [ ] Start/end dates

### EngagementTimeline
- [ ] Events in chronological order
- [ ] Different event types have distinct icons
- [ ] Completed vs upcoming distinction
- [ ] Dates formatted correctly

---

## Edge Cases

- [ ] Partner with 10+ engagements (list performance)
- [ ] Funding proposal at 100% (fully funded)
- [ ] Engagement with no events yet
- [ ] Very large metric values (millions)
- [ ] PDF export with no data (empty dashboard)

---

## Sample Test Data

```typescript
const mockPartner = {
  id: "partner-1",
  name: "BNP Paribas Fortis",
  type: "enterprise",
  logo: "",
  contactName: "Anne Vandenberghe",
  contactEmail: "anne@bnppf.be",
  contactRole: "RSE Director",
  joinedDate: "2024-01-15",
  description: "Programme RSE Forêts Comestibles"
};

const mockPackage = {
  id: "pkg-1",
  type: "team-building",
  title: "Team Building Plantation",
  shortTitle: "Team Building",
  description: "Journée de plantation avec vos équipes",
  includes: ["Coordination logistique", "Encadrement technique", "Matériel fourni", "Certificat de plantation"],
  priceRange: "1 500 € - 3 000 €",
  duration: "1 journée",
  highlighted: true
};

const mockImpactMetrics = {
  totalInvested: 25000,
  hectaresContributed: 3.5,
  treesPlanted: 420,
  treesPlanned: 150,
  participantsMobilized: 85,
  eventsSponsored: 4,
  co2OffsetTons: 12.3,
  projectsSupported: 3,
  labsReached: 2,
  history: []
};

const mockEmptyEngagements = [];
```
