// =============================================================================
// Data Types
// =============================================================================

export interface Partner {
  id: string
  name: string
  type: 'enterprise' | 'institution' | 'municipality'
  logo: string
  contactName: string
  contactEmail: string
  contactRole: string
  joinedDate: string
  description: string
}

export interface Package {
  id: string
  type: 'citizen-project' | 'team-building' | 'sponsorship' | 'recurring-patronage' | 'training' | 'ambassador'
  title: string
  shortTitle: string
  description: string
  includes: string[]
  priceRange: string
  duration: string
  imageUrl: string
  highlighted: boolean
}

export interface EngagementEvent {
  id: string
  title: string
  date: string
  type: 'milestone' | 'workshop' | 'planting' | 'team-building' | 'reporting'
  status: 'completed' | 'upcoming'
  description: string
}

export interface EngagementDocument {
  id: string
  title: string
  type: 'report' | 'design' | 'certificate'
  date: string
  url: string
  fileSize: string
}

export interface EngagementMedia {
  id: string
  type: 'photo' | 'video'
  title: string
  date: string
  url: string
  thumbnailUrl: string
  duration?: string
}

export interface Engagement {
  id: string
  packageId: string
  packageType: Package['type']
  title: string
  status: 'active' | 'completed' | 'pending'
  startDate: string
  endDate: string
  labName: string
  labContact: string
  totalBudget: number
  location: string | null
  progress: number
  nextEvent: {
    title: string
    date: string
    location: string
  } | null
  events: EngagementEvent[]
  documents: EngagementDocument[]
  media: EngagementMedia[]
}

export interface FundingProposal {
  id: string
  title: string
  labName: string
  description: string
  targetAmount: number
  raisedAmount: number
  raisedPercent: number
  contributorsCount: number
  status: 'new' | 'open' | 'funded' | 'closed'
  deadline: string
  location: string
  hectares: number
  treesPlanned: number
  imageUrl: string
  tags: string[]
}

export interface Funding {
  id: string
  proposalId: string
  proposalTitle: string
  amount: number
  date: string
  status: 'allocated' | 'spent' | 'pending'
  labName: string
}

export interface ImpactMonthly {
  month: string
  invested: number
  trees: number
  hectares: number
}

export interface ImpactMetrics {
  totalInvested: number
  hectaresContributed: number
  treesPlanted: number
  treesPlanned: number
  participantsMobilized: number
  eventsSponsored: number
  co2OffsetTons: number
  projectsSupported: number
  labsReached: number
  history: ImpactMonthly[]
}

// =============================================================================
// Component Props
// =============================================================================

export interface PartnerPortalProps {
  /** The connected partner organization */
  partner: Partner
  /** Available packages to browse */
  packages: Package[]
  /** Partner's active and completed engagements */
  engagements: Engagement[]
  /** Funding proposals published by Labs */
  fundingProposals: FundingProposal[]
  /** Partner's fund allocations */
  fundings: Funding[]
  /** Aggregated impact metrics for the dashboard */
  impactMetrics: ImpactMetrics
  /** Called when the partner marks interest in a package */
  onPackageInterest?: (packageId: string) => void
  /** Called when the partner wants to view a package's details */
  onPackageView?: (packageId: string) => void
  /** Called when the partner allocates funds to a proposal */
  onFundProposal?: (proposalId: string, amount: number) => void
  /** Called when the partner wants to view a proposal's details */
  onProposalView?: (proposalId: string) => void
  /** Called when the partner wants to view an engagement's details */
  onEngagementView?: (engagementId: string) => void
  /** Called when the partner wants to download a document */
  onDocumentDownload?: (documentId: string) => void
  /** Called when the partner wants to export their impact report as PDF */
  onExportPdf?: () => void
  /** Called when the partner wants to contact Semisto */
  onContactSemisto?: () => void
}
