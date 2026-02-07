# Test Instructions: Citizen Engagement

These test-writing instructions are **framework-agnostic**.

## Overview

Citizen Engagement is a gamified platform for citizen participation: mapping spots, contributing resources, joining worksites, and competing in village leaderboards.

---

## User Flow Tests

### Flow 1: Explore the Hub

**Steps:**
1. User navigates to the Citizen Engagement hub
2. Sees animated impact counters
3. Sees urgent campaign needs
4. Sees recent activity feed
5. Clicks a quick action card

**Expected Results:**
- [ ] Impact counters animate on page load (trees, hectares, villages, citizens)
- [ ] Active campaigns with progress bars displayed
- [ ] Activity feed shows recent community actions
- [ ] Quick action cards navigate to: Map, Contribute, Worksites

### Flow 2: Donate to a Campaign

**Steps:**
1. User navigates to Contribute page
2. Browses active campaigns with progress bars
3. Clicks "Contribuer" on a campaign
4. Enters donation amount
5. Completes payment

**Expected Results:**
- [ ] Campaign progress bar updates
- [ ] Contributors count increases
- [ ] Contribution appears in activity feed
- [ ] Thank you message displayed

### Flow 3: Join a Worksite

**Steps:**
1. User browses upcoming worksites
2. Sees details: date, time, location, spots available, requirements
3. Clicks "S'inscrire"
4. Receives confirmation with practical info

**Expected Results:**
- [ ] Participant count increases
- [ ] User appears in participant list
- [ ] If full, shows "Complet" instead of register button
- [ ] Confirmation includes: what to bring, meeting point

### Flow 4: View Leaderboard

**Steps:**
1. User navigates to the leaderboard
2. Sees top 3 villages on podium
3. Sees full village ranking with badges
4. Sees seasonal challenges

**Expected Results:**
- [ ] Podium shows top 3 villages with names and scores
- [ ] Each village shows: badge (éveil/planteur/nourricier/résilient), progress
- [ ] Seasonal challenge cards show: title, deadline, rankings
- [ ] Top contributors section visible

---

## Empty State Tests

### No Campaigns

**Expected Results:**
- [ ] Contribute page shows: "Aucune campagne active"
- [ ] Other contribution options still visible (wishlist, worksites)

### No Worksites

**Expected Results:**
- [ ] Message: "Aucun chantier prévu prochainement"
- [ ] CTA to check back later or subscribe for notifications

### No Activity

**Expected Results:**
- [ ] Activity feed shows: "Pas encore d'activité"
- [ ] Encouraging message to be the first contributor

### New Village (No Spots)

**Expected Results:**
- [ ] Village detail shows 0 spots
- [ ] CTA: "Identifiez le premier spot !"
- [ ] Map area visible but empty

---

## Component Tests

### ImpactCounter
- [ ] Animates from 0 to target value on load
- [ ] Shows label and unit (e.g., "hectares cartographiés")
- [ ] Handles large numbers with formatting (e.g., "12 450")

### CampaignCard
- [ ] Shows title, description, image
- [ ] Progress bar with percentage
- [ ] Amount raised / goal displayed
- [ ] Deadline visible
- [ ] Urgency indicator for high-urgency campaigns

### WorksiteCard
- [ ] Shows: title, date, time, location
- [ ] Spots: "8/15 participants"
- [ ] Difficulty badge
- [ ] Requirements list
- [ ] Register button (or "Complet" if full)

### VillagePodium
- [ ] Shows top 3 villages in podium layout (2nd, 1st, 3rd)
- [ ] Badge icon for each village
- [ ] Score/points visible
- [ ] Click navigates to village detail

### VillageRankingRow
- [ ] Shows rank number, village name, region
- [ ] Badge with color coding
- [ ] Progress bar toward next badge
- [ ] Key stats: spots, hectares, citizens

---

## Edge Cases

- [ ] Campaign at 100% funded (completed state)
- [ ] Worksite at full capacity
- [ ] Village with no ambassador
- [ ] Contribution by anonymous user
- [ ] Challenge ending today (countdown)
- [ ] Very long village name

---

## Sample Test Data

```typescript
const mockVillage = {
  id: "village-1",
  name: "Ottignies-Louvain-la-Neuve",
  region: "Brabant Wallon",
  country: "Belgique",
  badge: "planteur",
  badgeProgress: 72,
  hectaresPotential: 15,
  hectaresPlanted: 4.2,
  spotsIdentified: 28,
  spotsPlanted: 12,
  activeCitizens: 45,
  ambassadorName: "Sophie Lambert"
};

const mockCampaign = {
  id: "campaign-1",
  title: "Financer un coordinateur terrain",
  category: "poste",
  goalAmount: 5000,
  currentAmount: 3200,
  contributorsCount: 47,
  deadline: "2024-06-30",
  status: "active",
  urgencyLevel: "high"
};

const mockWorksite = {
  id: "worksite-1",
  title: "Plantation de la haie du Bois Joli",
  date: "2024-03-20",
  startTime: "09:00",
  endTime: "16:00",
  location: "Bois Joli, Ottignies",
  maxParticipants: 20,
  currentParticipants: 14,
  status: "upcoming"
};

const mockEmptyCampaigns = [];
```
