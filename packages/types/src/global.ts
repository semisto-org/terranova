// =============================================================================
// Terranova — Global Data Model Types
// =============================================================================

// --- Organization ---

export interface Lab {
  id: string
  name: string
  slug: string
  country: string
  region: string
  description: string
  contactEmail: string
  address: string
  coordinates: { lat: number; lng: number }
}

export type MemberRole =
  | 'designer'
  | 'shaper'
  | 'formateur'
  | 'comptable'
  | 'coordination'
  | 'communication'
  | 'IT'

export type MemberStatus = 'active' | 'inactive'

export interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar: string
  roles: MemberRole[]
  status: MemberStatus
  isAdmin: boolean
  joinedAt: string
  walletId: string
  labId: string
}

export type CycleStatus = 'upcoming' | 'active' | 'cooldown' | 'completed'

export interface Cycle {
  id: string
  name: string
  labId: string
  startDate: string
  endDate: string
  cooldownStart: string
  cooldownEnd: string
  status: CycleStatus
}

export interface Guild {
  id: string
  name: string
  description: string
  labId: string
  leaderId: string
  memberIds: string[]
}

// --- Botanical ---

export interface Genus {
  id: string
  latinName: string
  description: string
}

export interface Species {
  id: string
  genusId: string | null
  latinName: string
  type: 'tree' | 'shrub' | 'small-shrub' | 'climber' | 'herbaceous' | 'ground-cover'
  edibleParts: string[]
  interests: string[]
  exposures: string[]
  hardiness: string
  lifeCycle: 'annual' | 'biennial' | 'perennial'
}

export interface Variety {
  id: string
  speciesId: string
  latinName: string
  productivity: string
  tasteRating: 1 | 2 | 3 | 4 | 5
}

// --- Design ---

export type ProjectPhase = 'offre' | 'pre-projet' | 'projet-detaille' | 'mise-en-oeuvre' | 'co-gestion'
export type ProjectStatus = 'active' | 'pending' | 'completed' | 'archived'

export interface Project {
  id: string
  name: string
  labId: string
  clientId: string
  clientName: string
  phase: ProjectPhase
  status: ProjectStatus
  startDate: string | null
  area: number
}

// --- Training ---

export type TrainingStatus = 'draft' | 'planned' | 'registrations_open' | 'in_progress' | 'completed' | 'cancelled'

export interface Course {
  id: string
  labId: string
  title: string
  status: TrainingStatus
  price: number
  maxParticipants: number
}

export interface Registration {
  id: string
  courseId: string
  contactId: string
  contactName: string
  amountPaid: number
  paymentStatus: 'pending' | 'partial' | 'paid'
}

// --- Nursery ---

export interface Stock {
  id: string
  labId: string
  speciesId: string
  varietyId: string | null
  quantity: number
  priceEuros: number
}

export interface Order {
  id: string
  labId: string
  customerId: string
  customerName: string
  status: 'new' | 'processing' | 'ready' | 'picked-up' | 'cancelled'
  totalEuros: number
}

// --- Engagement ---

export type ContributionType = 'don' | 'benevolat' | 'materiel'

export interface Contribution {
  id: string
  citizenId: string | null
  type: ContributionType
  amount?: number
  hours?: number
  date: string
}

export interface Worksite {
  id: string
  labId: string
  title: string
  date: string
  location: string
  maxParticipants: number
  currentParticipants: number
}

export interface Event {
  id: string
  labId: string
  title: string
  date: string
  location: string
  type: string
}

export interface Equipment {
  id: string
  labId: string
  name: string
  category: string
  status: 'available' | 'in-use' | 'maintenance'
}

// --- Partners ---

export interface Partner {
  id: string
  name: string
  type: 'enterprise' | 'institution' | 'municipality'
  contactName: string
  contactEmail: string
}

export interface Funding {
  id: string
  partnerId: string
  projectId: string | null
  amount: number
  status: 'allocated' | 'spent' | 'pending'
}

// --- Semos ---

export interface Wallet {
  id: string
  memberId: string
  balance: number
  floor: number
  ceiling: number
}

export type TransactionType = 'payment' | 'transfer' | 'exchange'

export interface SemosTransaction {
  id: string
  fromWalletId: string
  toWalletId: string
  amount: number
  description: string
  createdAt: string
  type: TransactionType
}

export interface SemosEmission {
  id: string
  labId: string
  amount: number
  date: string
  reason: string
}

export interface SemosRate {
  id: string
  labId: string
  euroToSemos: number
  effectiveDate: string
}

// --- Cross-cutting ---

export interface Place {
  id: string
  name: string
  address: string
  coordinates: { lat: number; lng: number }
  labId: string | null
}

export interface Contact {
  id: string
  labId: string
  firstName: string
  lastName: string
  email: string
  type: 'client' | 'prospect' | 'partner' | 'donor'
}

export interface Timesheet {
  id: string
  memberId: string
  date: string
  hours: number
  description: string
  projectId: string | null
  courseId: string | null
  guildId: string | null
}

// --- Planting ---

export interface Plant {
  id: string
  speciesId: string
  varietyId: string | null
  projectId: string
  plantedDate: string
  status: 'planned' | 'planted' | 'growing' | 'dead'
}

export interface Planting {
  id: string
  projectId: string
  name: string
  area: number
  plantCount: number
}
