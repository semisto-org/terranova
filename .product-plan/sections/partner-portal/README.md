# Partner Portal

## Overview

Le Partner Portal est un espace dédié aux institutions, entreprises et collectivités partenaires du mouvement Semisto. Dashboard équilibré combinant actions possibles, métriques d'impact et suivi des engagements actifs. Portail standalone.

## User Flows

- **Browse Packages**: View pre-defined engagement packages, mark interest
- **Fund Projects**: Browse Lab proposals, allocate funds via collaborative flow
- **Track Engagements**: Timeline, events, documents, media gallery
- **Impact Reporting**: View metrics, export PDF for RSE

## Design Decisions

- Standalone portal (no app shell) — uses PortalHeader
- One account per partner organization
- Communication with Labs happens off-platform

## Components Provided

- `PartnerPortal` — Main portal layout
- `PortalHeader` — Partner-specific header
- `MetricCard` — Impact metric display
- `PackageCard` — Engagement package card
- `FundingProposalCard` — Project funding proposal
- `EngagementCard` — Active engagement summary
- `EngagementTimeline` — Event timeline

## Callback Props

| Callback | Description |
|----------|-------------|
| `onPackageInterest` | Mark interest in a package |
| `onFundProposal` | Allocate funds to a project |
| `onEngagementView` | View engagement details |
| `onDocumentDownload` | Download engagement document |
| `onExportPdf` | Export impact report as PDF |
| `onContactSemisto` | Contact Semisto |
