// =============================================================================
// Data Types
// =============================================================================

// --- Training Types ---

export interface TrainingType {
  id: string
  name: string
  description: string
  checklistTemplate: string[]
  photoGallery: string[]
  trainerIds: string[]
  createdAt: string
}

// --- Training Locations ---

export interface TrainingLocation {
  id: string
  name: string
  address: string
  description: string
  photoGallery: string[]
  compatibleTrainingTypeIds: string[]
  capacity: number
  hasAccommodation: boolean
  createdAt: string
}

// --- Trainings ---

export type TrainingStatus =
  | 'draft'
  | 'planned'
  | 'registrations_open'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface Training {
  id: string
  trainingTypeId: string
  title: string
  status: TrainingStatus
  price: number
  maxParticipants: number
  requiresAccommodation: boolean
  description: string
  coordinatorNote: string
  createdAt: string
  updatedAt: string
}

// --- Training Sessions ---

export interface TrainingSession {
  id: string
  trainingId: string
  startDate: string
  endDate: string
  locationIds: string[]
  trainerIds: string[]
  assistantIds: string[]
  description: string
}

// --- Training Registrations ---

export type PaymentStatus = 'pending' | 'partial' | 'paid'

export interface TrainingRegistration {
  id: string
  trainingId: string
  contactId: string
  contactName: string
  contactEmail: string
  amountPaid: number
  paymentStatus: PaymentStatus
  internalNote: string
  registeredAt: string
}

// --- Training Attendances ---

export interface TrainingAttendance {
  id: string
  registrationId: string
  sessionId: string
  isPresent: boolean
  note: string
}

// --- Training Documents ---

export type DocumentType = 'pdf' | 'link' | 'image' | 'video'

export interface TrainingDocument {
  id: string
  trainingId: string
  name: string
  type: DocumentType
  url: string
  uploadedAt: string
  uploadedBy: string
}

// --- Training Expenses ---

export type ExpenseCategory =
  | 'location'
  | 'material'
  | 'food'
  | 'accommodation'
  | 'transport'
  | 'other'

export interface TrainingExpense {
  id: string
  trainingId: string
  category: ExpenseCategory
  description: string
  amount: number
  date: string
  createdAt: string
}

// --- Idea Notes ---

export type IdeaNoteCategory = 'subject' | 'trainer' | 'location' | 'other'

export interface IdeaNote {
  id: string
  category: IdeaNoteCategory
  title: string
  content: string
  createdAt: string
  tags: string[]
}

// =============================================================================
// Component Props
// =============================================================================

export interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar: string
}

export interface AcademyProps {
  // Data
  trainingTypes: TrainingType[]
  trainings: Training[]
  trainingSessions: TrainingSession[]
  trainingLocations: TrainingLocation[]
  trainingRegistrations: TrainingRegistration[]
  trainingAttendances: TrainingAttendance[]
  trainingDocuments: TrainingDocument[]
  trainingExpenses: TrainingExpense[]
  ideaNotes: IdeaNote[]
  members: Member[]

  // Current user context
  currentMemberId: string

  // --- Training Type actions ---
  /** Called when user wants to create a new training type */
  onCreateTrainingType?: () => void
  /** Called when user wants to view a training type's details */
  onViewTrainingType?: (trainingTypeId: string) => void
  /** Called when user wants to edit a training type */
  onEditTrainingType?: (trainingTypeId: string) => void
  /** Called when user wants to delete a training type */
  onDeleteTrainingType?: (trainingTypeId: string) => void

  // --- Training actions ---
  /** Called when user wants to create a new training */
  onCreateTraining?: () => void
  /** Called when user wants to view a training's details */
  onViewTraining?: (trainingId: string) => void
  /** Called when user wants to edit a training */
  onEditTraining?: (trainingId: string) => void
  /** Called when user wants to delete a training */
  onDeleteTraining?: (trainingId: string) => void
  /** Called when user wants to change a training's status */
  onUpdateTrainingStatus?: (trainingId: string, status: TrainingStatus) => void

  // --- Training Session actions ---
  /** Called when user wants to add a session to a training */
  onAddSession?: (trainingId: string) => void
  /** Called when user wants to edit a session */
  onEditSession?: (sessionId: string) => void
  /** Called when user wants to delete a session */
  onDeleteSession?: (sessionId: string) => void

  // --- Training Location actions ---
  /** Called when user wants to create a new training location */
  onCreateLocation?: () => void
  /** Called when user wants to view a location's details */
  onViewLocation?: (locationId: string) => void
  /** Called when user wants to edit a location */
  onEditLocation?: (locationId: string) => void
  /** Called when user wants to delete a location */
  onDeleteLocation?: (locationId: string) => void

  // --- Registration actions ---
  /** Called when user wants to add a registration to a training */
  onAddRegistration?: (trainingId: string) => void
  /** Called when user wants to edit a registration */
  onEditRegistration?: (registrationId: string) => void
  /** Called when user wants to delete a registration */
  onDeleteRegistration?: (registrationId: string) => void
  /** Called when user updates payment status */
  onUpdatePaymentStatus?: (
    registrationId: string,
    status: PaymentStatus,
    amountPaid: number
  ) => void

  // --- Attendance actions ---
  /** Called when user marks attendance for a participant */
  onMarkAttendance?: (
    registrationId: string,
    sessionId: string,
    isPresent: boolean
  ) => void

  // --- Checklist actions ---
  /** Called when user checks/unchecks a checklist item */
  onToggleChecklistItem?: (trainingId: string, itemIndex: number) => void
  /** Called when user adds a custom checklist item */
  onAddChecklistItem?: (trainingId: string, item: string) => void
  /** Called when user removes a checklist item */
  onRemoveChecklistItem?: (trainingId: string, itemIndex: number) => void

  // --- Document actions ---
  /** Called when user wants to upload a document */
  onUploadDocument?: (trainingId: string, file: File) => void
  /** Called when user wants to delete a document */
  onDeleteDocument?: (documentId: string) => void

  // --- Expense actions ---
  /** Called when user wants to add an expense */
  onAddExpense?: (trainingId: string) => void
  /** Called when user wants to edit an expense */
  onEditExpense?: (expenseId: string) => void
  /** Called when user wants to delete an expense */
  onDeleteExpense?: (expenseId: string) => void

  // --- Calendar actions ---
  /** Called when user wants to view calendar (monthly or yearly) */
  onViewCalendar?: (view: 'month' | 'year') => void

  // --- Idea Notes actions ---
  /** Called when user wants to create a new idea note */
  onCreateIdeaNote?: () => void
  /** Called when user wants to edit an idea note */
  onEditIdeaNote?: (noteId: string) => void
  /** Called when user wants to delete an idea note */
  onDeleteIdeaNote?: (noteId: string) => void

  // --- Reporting actions ---
  /** Called when user wants to view reporting dashboard */
  onViewReporting?: () => void
}

