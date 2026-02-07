# Citizen Engagement

## Overview

Plateforme d'engagement citoyen permettant de cartographier le potentiel de plantations comestibles (Villages Nourriciers), de contribuer aux besoins de Semisto, et de participer à une communauté gamifiée avec badges, défis saisonniers et classements inter-villages.

## User Flows

- **Hub**: View impact counters, urgent needs, recent activity
- **Map**: Interactive map with villages and spots (points/lines/polygons)
- **Contribute**: Donate to campaigns, fund wishlist items, join worksites
- **Leaderboard**: Village rankings with progressive badges
- **Spot Sponsorship**: Adopt a spot, maintain site log with photos
- **Marketplace**: Exchange surplus (fruits, cuttings, seeds)
- **Skills Directory**: Find local experts (grafting, pruning, etc.)

## Components Provided

- `CitizenEngagementHub` / `ImpactCounter` / `QuickActionCard` — Hub page
- `ActivityFeed` — Community activity stream
- `CampaignCard` / `CampaignDetailCard` / `WishlistItemCard` — Contribution
- `WorksiteCard` — Volunteer worksites
- `LeaderboardView` / `VillagePodium` / `VillageRankingRow` — Rankings
- `SeasonalChallengeCard` / `TopContributorCard` — Gamification
- `ContributeView` — Contribution page

## Callback Props

| Callback | Description |
|----------|-------------|
| `onNavigateToMap` | Open interactive map |
| `onNavigateToContribute` | Go to contribution page |
| `onViewCampaign` | View campaign details |
| `onDonateToCampaign` | Make a donation |
| `onFundWishlistItem` | Fund a material need |
| `onJoinWorksite` | Register for a worksite |
| `onViewVillage` / `onViewChallenge` | View rankings |
