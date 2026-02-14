// =============================================================================
// Data Types
// =============================================================================

// --- Members & Organization ---

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
  guildIds: string[]
}

export interface Guild {
  id: string
  name: string
  description: string
  leaderId: string
  memberIds: string[]
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red'
}

// --- Shape Up: Cycles ---

export type CycleStatus = 'upcoming' | 'active' | 'cooldown' | 'completed'

export interface Cycle {
  id: string
  name: string
  startDate: string
  endDate: string
  cooldownStart: string
  cooldownEnd: string
  status: CycleStatus
  betIds: string[]
}

// --- Shape Up: Shaping Track ---

export type PitchStatus = 'raw' | 'shaped' | 'betting' | 'building' | 'completed' | 'cancelled'
export type Appetite = '2-weeks' | '3-weeks' | '6-weeks'

export interface BreadboardConnection {
  from: string
  to: string
  via: string
}

export interface Breadboard {
  places: string[]
  affordances: string[]
  connections: BreadboardConnection[]
}

export interface Pitch {
  id: string
  title: string
  status: PitchStatus
  appetite: Appetite
  authorId: string
  createdAt: string
  problem: string
  solution: string
  rabbitHoles: string[]
  noGos: string[]
  breadboard: Breadboard | null
  fatMarkerSketch: string | null
}

// --- Shape Up: Betting Table ---

export type BetStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface Bet {
  id: string
  pitchId: string
  cycleId: string
  teamMemberIds: string[]
  status: BetStatus
  placedAt: string
  placedBy: string
}

// --- Shape Up: Building Track ---

export interface Task {
  id: string
  title: string
  isNiceToHave: boolean
  completed: boolean
}

export interface Scope {
  id: string
  pitchId: string
  name: string
  description: string
  hillPosition: number // 0-100, 0-50 = uphill (figuring out), 51-100 = downhill (making it happen)
  tasks: Task[]
}

export interface ScopePosition {
  scopeId: string
  position: number
}

export interface HillChartSnapshot {
  id: string
  pitchId: string
  createdAt: string
  positions: ScopePosition[]
}

export interface ChowderItem {
  id: string
  pitchId: string
  title: string
  createdAt: string
  createdBy: string
}

// --- Shape Up: Idea Lists ---

export interface IdeaItem {
  id: string
  title: string
  createdAt: string
  votes: number
}

export interface IdeaList {
  id: string
  name: string
  description: string
  items: IdeaItem[]
}

// --- Calendar & Events ---

export type EventType =
  | 'project_meeting'
  | 'stakeholder_meeting'
  | 'design_day'
  | 'guild_meeting'
  | 'betting'
  | 'semisto_day'
  | 'semos_fest'
  | 'training'

export interface Event {
  id: string
  title: string
  type: EventType
  startDate: string
  endDate: string
  location: string
  description: string
  attendeeIds: string[]
  cycleId: string | null
}

// --- Semos System ---

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

export type EmissionReason =
  | 'cotisation_member'
  | 'volunteer_work'
  | 'provider_fee'
  | 'peer_review'
  | 'loyalty'
  | 'participation'

export interface SemosEmission {
  id: string
  walletId: string
  amount: number
  reason: EmissionReason
  description: string
  createdAt: string
  createdBy: string
}

export type RateType =
  | 'cotisation_member_active'
  | 'cotisation_member_support'
  | 'volunteer_hourly'
  | 'provider_fee_percentage'
  | 'peer_review'

export interface SemosRate {
  id: string
  type: RateType
  amount: number
  description: string
}

// --- Timesheets ---

export type PaymentType = 'invoice' | 'semos'

export type TimesheetCategory =
  | 'design'
  | 'formation'
  | 'administratif'
  | 'coordination'
  | 'communication'

export interface Timesheet {
  id: string
  memberId: string
  date: string
  hours: number
  paymentType: PaymentType
  description: string
  category: TimesheetCategory
  invoiced: boolean
  kilometers: number
  projectId: string | null
  courseId: string | null
  guildId: string | null
}

// =============================================================================
// Component Props
// =============================================================================

export interface LabManagementProps {
  // Data
  members: Member[]
  cycles: Cycle[]
  guilds: Guild[]
  pitches: Pitch[]
  bets: Bet[]
  scopes: Scope[]
  hillChartSnapshots: HillChartSnapshot[]
  chowderItems: ChowderItem[]
  ideaLists: IdeaList[]
  events: Event[]
  wallets: Wallet[]
  semosTransactions: SemosTransaction[]
  semosEmissions: SemosEmission[]
  semosRates: SemosRate[]
  timesheets: Timesheet[]

  // Current user context
  currentMemberId: string

  // --- Member actions ---
  /** Called when admin wants to add a new member */
  onAddMember?: () => void
  /** Called when user wants to view a member's profile */
  onViewMember?: (memberId: string) => void
  /** Called when admin wants to edit a member */
  onEditMember?: (memberId: string) => void

  // --- Pitch actions ---
  /** Called when user wants to create a new pitch */
  onCreatePitch?: () => void
  /** Called when user wants to view a pitch's details */
  onViewPitch?: (pitchId: string) => void
  /** Called when user wants to edit a pitch */
  onEditPitch?: (pitchId: string) => void
  /** Called when user wants to delete a pitch */
  onDeletePitch?: (pitchId: string) => void

  // --- Betting actions ---
  /** Called when user places a bet on a pitch */
  onPlaceBet?: (pitchId: string, teamMemberIds: string[]) => void
  /** Called when user removes a bet */
  onRemoveBet?: (betId: string) => void

  // --- Scope & Hill Chart actions ---
  /** Called when user creates a new scope for a pitch */
  onCreateScope?: (pitchId: string) => void
  /** Called when user updates a scope's hill position */
  onUpdateHillPosition?: (scopeId: string, position: number) => void
  /** Called when user adds a task to a scope */
  onAddTask?: (scopeId: string, title: string, isNiceToHave: boolean) => void
  /** Called when user toggles task completion */
  onToggleTask?: (scopeId: string, taskId: string) => void
  /** Called when user adds an item to the chowder list */
  onAddChowderItem?: (pitchId: string, title: string) => void
  /** Called when user moves chowder item to a scope */
  onMoveToScope?: (chowderItemId: string, scopeId: string) => void

  // --- Idea List actions ---
  /** Called when user adds an idea to a list */
  onAddIdea?: (listId: string, title: string) => void
  /** Called when user votes for an idea */
  onVoteIdea?: (listId: string, ideaId: string) => void

  // --- Event actions ---
  /** Called when user wants to create a new event */
  onCreateEvent?: () => void
  /** Called when user wants to view an event */
  onViewEvent?: (eventId: string) => void
  /** Called when user wants to edit an event */
  onEditEvent?: (eventId: string) => void
  /** Called when user wants to delete an event */
  onDeleteEvent?: (eventId: string) => void

  // --- Semos actions ---
  /** Called when user wants to transfer Semos to another member */
  onTransferSemos?: (toWalletId: string, amount: number, description: string) => void
  /** Called when admin wants to emit new Semos */
  onEmitSemos?: (walletId: string, amount: number, reason: EmissionReason, description: string) => void
  /** Called when admin wants to update Semos rates */
  onUpdateRate?: (rateId: string, amount: number) => void

  // --- Timesheet actions ---
  /** Called when user wants to create a new timesheet entry */
  onCreateTimesheet?: () => void
  /** Called when user wants to edit a timesheet entry */
  onEditTimesheet?: (timesheetId: string) => void
  /** Called when user wants to delete a timesheet entry */
  onDeleteTimesheet?: (timesheetId: string) => void
  /** Called when user marks a timesheet as invoiced */
  onMarkInvoiced?: (timesheetId: string) => void

  // --- Guild actions ---
  /** Called when user wants to view a guild */
  onViewGuild?: (guildId: string) => void
}
