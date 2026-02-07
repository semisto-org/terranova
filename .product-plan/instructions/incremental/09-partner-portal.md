# Milestone 9: Partner Portal

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

Implement the Partner Portal — a standalone dashboard for institutions, enterprises, and municipalities to engage with and fund Semisto projects.

## Overview

The Partner Portal is a dedicated space for partner organizations. It combines an action-oriented dashboard with impact metrics and engagement tracking. Partners browse pre-defined packages, fund specific projects through a collaborative flow, and track the concrete impact of their contributions for RSE reporting.

**Key Functionality:**
- Dashboard with quick actions, impact metrics, and active engagement tracking
- Package catalog: Citizen Project, Team Building, Sponsorship, Recurring Patronage, Training, Ambassador
- Collaborative funding flow inspired by CoBudget (5 steps: governance → onboarding → proposals → allocation → accountability)
- Engagement detail: timeline, event calendar, documents, photo/video gallery
- Impact metrics dashboard with PDF export for RSE reporting
- Contact Semisto CTA for custom proposals

**Note:** This section is standalone (shell: false) — it has its own portal header, not the app shell. One account per partner organization (no multi-user).

## Recommended Approach: Test-Driven Development

See `product-plan/sections/partner-portal/tests.md` for detailed test-writing instructions.

## What to Implement

### Components

Copy from `product-plan/sections/partner-portal/components/`:

- `PartnerPortal` — Main portal layout with all sections
- `PortalHeader` — Partner-specific header
- `MetricCard` — Impact metric display
- `PackageCard` — Engagement package card
- `FundingProposalCard` — Project funding proposal
- `EngagementCard` — Active engagement summary
- `EngagementTimeline` — Engagement event timeline

### Data Layer

Key types: Partner, Package, Engagement, EngagementEvent, EngagementDocument, EngagementMedia, FundingProposal, Funding, ImpactMetrics

### Callbacks

Wire up: onPackageInterest, onPackageView, onFundProposal, onProposalView, onEngagementView, onDocumentDownload, onExportPdf, onContactSemisto

## Files to Reference

- `product-plan/sections/partner-portal/README.md`
- `product-plan/sections/partner-portal/tests.md`
- `product-plan/sections/partner-portal/components/`
- `product-plan/sections/partner-portal/types.ts`
- `product-plan/sections/partner-portal/sample-data.json`

## Expected User Flows

### Flow 1: Browse and Select a Package
1. Partner logs into their portal
2. Sees available packages as visual cards
3. Clicks "Marquer mon intérêt" on a package
4. Receives confirmation that Semisto will follow up
5. **Outcome:** Package interest is registered

### Flow 2: Fund a Project
1. Partner browses funding proposals from Labs
2. Selects a project, reviews details (location, trees planned, amount needed)
3. Allocates a specific amount to the project
4. **Outcome:** Funding is recorded, impact metrics update

### Flow 3: Export Impact Report
1. Partner views their impact dashboard (hectares, trees, participants, CO2)
2. Reviews monthly evolution charts
3. Clicks "Export PDF"
4. **Outcome:** PDF report generated for RSE reporting

## Done When

- [ ] Tests written for key flows
- [ ] Portal renders with partner info
- [ ] Package catalog with interest marking
- [ ] Funding proposal list with allocation flow
- [ ] Engagement detail with timeline and media
- [ ] Impact metrics dashboard with charts
- [ ] PDF export for RSE reporting
- [ ] Contact Semisto CTA works
- [ ] Empty states (no engagements yet, no funding proposals)
- [ ] Responsive on mobile
- [ ] Standalone navigation (portal header, not app shell)
