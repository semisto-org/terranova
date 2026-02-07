# Milestone 8: Citizen Engagement

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

Implement the Citizen Engagement section — a gamified platform for citizen participation in territory transformation.

## Overview

Citizen Engagement is a ludique, colorful platform enabling citizens to map potential planting spots (Villages Nourriciers), contribute to Semisto's needs (donations, volunteering, equipment), and participate in a gamified community with badges, challenges, and village rankings.

**Key Functionality:**
- Engagement hub with impact counters, urgent needs, recent activity
- Interactive map with villages and spots (points/lines/polygons)
- Contribution system: campaigns with progress bars, material wishlist
- Worksite registration for volunteer planting events
- Village leaderboards with progressive badges (éveil → planteur → nourricier → résilient)
- Seasonal challenges between villages
- Spot sponsorship with site logs and maturity tracking
- Local marketplace for surplus exchange (fruit, cuttings, seeds)
- Skills directory for knowledge transmission (grafting, pruning, etc.)

## Recommended Approach: Test-Driven Development

See `product-plan/sections/citizen-engagement/tests.md` for detailed test-writing instructions.

## What to Implement

### Components

Copy from `product-plan/sections/citizen-engagement/components/`:

- `CitizenEngagementHub` — Main hub page
- `ImpactCounter` — Animated impact metrics
- `QuickActionCard` — Quick action cards (map, contribute, worksites)
- `ActivityFeed` — Recent community activity
- `CampaignCard` / `CampaignDetailCard` — Funding campaigns
- `WishlistItemCard` — Material wishlist items
- `WorksiteCard` — Volunteer worksite cards
- `SeasonalChallengeCard` — Seasonal challenges
- `TopContributorCard` — Top contributor display
- `VillagePodium` — Top 3 villages podium
- `VillageRankingRow` — Village ranking row
- `LeaderboardView` — Complete leaderboard page
- `ContributeView` — Contribution page (campaigns, wishlist, worksites)

### Data Layer

Key types: Village, Spot, Citizen, Campaign, WishlistItem, Worksite, Event, SeasonalChallenge, Contribution, RecentActivity, ImpactStats, Badge, Surplus, Skill, SiteLogEntry

### Callbacks

Wire up: onNavigateToMap, onNavigateToContribute, onViewCampaign, onJoinWorksite, onViewEvent, onDonateToCampaign, onFundWishlistItem, onJoinVillage, onViewSpot, onValidateSpot, onSponsor, onAddLogEntry, onReportIssue, onContactSeller, onReserveSurplus, onAddSurplus, onContactGardener, onAddSkill

## Files to Reference

- `product-plan/sections/citizen-engagement/README.md`
- `product-plan/sections/citizen-engagement/tests.md`
- `product-plan/sections/citizen-engagement/components/`
- `product-plan/sections/citizen-engagement/types.ts`
- `product-plan/sections/citizen-engagement/sample-data.json`

## Expected User Flows

### Flow 1: Report a Planting Spot
1. Citizen opens the map
2. Draws a point/line/polygon on a potential spot
3. Fills in details (soil type, exposure, ownership, photos)
4. Submits for community validation
5. **Outcome:** Spot appears on map as "identified", awaiting validation

### Flow 2: Contribute to a Campaign
1. Citizen browses active campaigns on the Contribute page
2. Selects a campaign, sees progress bar and details
3. Makes a donation via integrated payment
4. **Outcome:** Campaign progress updates, contribution appears in activity feed

### Flow 3: Join a Worksite
1. Citizen browses upcoming worksites
2. Clicks "Join" on a worksite
3. Receives practical information (location, time, what to bring)
4. Attends and participation is validated
5. **Outcome:** Citizen earns Semos, badge progress updates

## Done When

- [ ] Tests written for key flows
- [ ] Hub page with impact counters and activity feed
- [ ] Interactive map with villages and spots
- [ ] Campaign donation and wishlist funding
- [ ] Worksite listing and registration
- [ ] Village leaderboards with badges
- [ ] Seasonal challenges display
- [ ] Empty states (no spots in village, no campaigns, etc.)
- [ ] Responsive on mobile
