// =============================================================================
// Data Types
// =============================================================================

export interface Coordinates {
  lat: number
  lng: number
}

export interface SocialLinks {
  facebook?: string
  instagram?: string
  youtube?: string
  twitter?: string
  linkedin?: string
}

export type PoleId = 'design-studio' | 'academy' | 'nursery' | 'roots'

export interface Lab {
  id: string
  name: string
  slug: string
  country: string
  region: string
  subdomain: string
  description: string
  shortDescription: string
  activePoles: PoleId[]
  heroImage: string
  contactEmail: string
  address: string
  coordinates: Coordinates
  newsletterSubscribers: number
  socialLinks: SocialLinks
}

export type CourseFormat = 'présentiel' | 'presencial' | 'Präsenz' | 'en ligne'
export type CourseLevel = 'débutant' | 'intermédiaire' | 'avancé' | 'principiant' | 'intermedi' | 'Anfänger'
export type CourseCategory = 'design' | 'pépinière' | 'technique'

export interface Course {
  id: string
  labId: string
  title: string
  slug: string
  shortDescription: string
  description: string
  duration: string
  format: CourseFormat
  price: number
  currency: string
  level: CourseLevel
  category: CourseCategory
  nextSession: string
  spotsAvailable: number
  spotsTotal: number
  location: string | null
  image: string
  instructors: string[]
  isFeatured: boolean
}

export type EventType = 'conférence' | 'visite' | 'atelier'

export interface Event {
  id: string
  labId: string
  type: EventType
  title: string
  slug: string
  description: string
  date: string
  time: string
  duration: string
  location: string
  address: string
  price: number
  currency: string
  spotsAvailable: number
  spotsTotal: number
  image: string
  speakers: string[]
}

export type ClientType = 'privé' | 'entreprise' | 'collectif' | 'public'
export type ProjectStatus = 'completed' | 'in-progress' | 'funding'
export type FundingStatus = 'active' | 'completed' | null

export interface Testimonial {
  text: string
  author: string
  role: string
}

export interface Project {
  id: string
  labId: string
  title: string
  slug: string
  clientType: ClientType
  description: string
  shortDescription: string
  location: string
  coordinates: Coordinates
  surface: number
  treesPlanted: number
  status: ProjectStatus
  completedDate: string | null
  images: string[]
  testimonial: Testimonial | null
  fundingStatus: FundingStatus
  fundingGoal: number | null
  fundingRaised: number | null
}

export type WorksiteDifficulty = 'facile' | 'modéré' | 'difficile' | 'leicht' | 'mittel' | 'schwer'

export interface Worksite {
  id: string
  labId: string
  title: string
  description: string
  date: string
  time: string
  duration: string
  location: string
  address: string
  spotsAvailable: number
  spotsTotal: number
  difficulty: WorksiteDifficulty
  requirements: string[]
  providedTools: boolean
  image: string
}

export type ProductType = 'plant' | 'book' | 'tool' | 'educational'

export interface Product {
  id: string
  type: ProductType
  name: string
  description: string
  price: number
  currency: string
  category: string
  subcategory: string
  stock: number
  countries: string[]
  image: string
  specs: Record<string, string>
}

export type ArticleCategory = 'technique' | 'retour-experience' | 'témoignage' | 'actualité'

export interface Article {
  id: string
  labId: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  authorRole: string
  publishedAt: string
  readingTime: number
  category: ArticleCategory
  tags: string[]
  image: string
  isFeatured: boolean
}

export type PressType = 'tv' | 'article' | 'podcast' | 'radio'

export interface PressItem {
  id: string
  outlet: string
  type: PressType
  title: string
  description: string
  date: string
  url: string
  image: string
}

export type ResourceCategory = 'bases' | 'design' | 'technique' | 'pratique'
export type ResourceFormat = 'pdf' | 'video' | 'infographie'

export interface Resource {
  id: string
  title: string
  description: string
  category: ResourceCategory
  format: ResourceFormat
  fileSize: string
  downloadUrl: string
  image: string
  languages: string[]
}

export interface DesignProfileService {
  name: string
  description: string
  price: string
}

export interface DesignProfile {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  icon: string
  benefits: string[]
  services: DesignProfileService[]
  exampleProjects: string[]
  ctaText: string
}

export interface ImpactStats {
  treesPlanted: number
  hectaresTransformed: number
  projectsCompleted: number
  projectsInProgress: number
  activeLabs: number
  countriesPresent: number
  volunteersActive: number
  trainingParticipants: number
  co2Sequestered: number
  speciesPlanted: number
}

export interface MapProject {
  id: string
  coordinates: Coordinates
  status: ProjectStatus
}

export interface PotentialZone {
  id: string
  name: string
  description: string
  coordinates: Coordinates
  radius: number
  addedBy: string
  addedAt: string
}

export interface CartItem {
  productId: string
  quantity: number
}

// =============================================================================
// Component Props
// =============================================================================

/** Props for the global homepage */
export interface HomepageProps {
  labs: Lab[]
  featuredCourses: Course[]
  featuredProjects: Project[]
  featuredArticles: Article[]
  impactStats: ImpactStats
  onLabSelect?: (labId: string) => void
  onCourseView?: (courseId: string) => void
  onProjectView?: (projectId: string) => void
  onArticleView?: (articleId: string) => void
}

/** Props for a Lab mini-site homepage */
export interface LabHomepageProps {
  lab: Lab
  upcomingCourses: Course[]
  upcomingEvents: Event[]
  recentProjects: Project[]
  recentArticles: Article[]
  onCourseView?: (courseId: string) => void
  onEventView?: (eventId: string) => void
  onProjectView?: (projectId: string) => void
  onArticleView?: (articleId: string) => void
  onNewsletterSubscribe?: (email: string) => void
}

/** Props for the website header */
export interface WebsiteHeaderProps {
  labs: Lab[]
  currentLabId: string | null
  currentLanguage: string
  availableLanguages: string[]
  onLabChange?: (labId: string) => void
  onLanguageChange?: (language: string) => void
  onSearch?: () => void
  onLogin?: () => void
}

/** Props for the course catalog */
export interface CourseCatalogProps {
  courses: Course[]
  labId?: string
  onCourseView?: (courseId: string) => void
  onCourseRegister?: (courseId: string) => void
  onFilter?: (filters: { category?: string; level?: string; format?: string }) => void
}

/** Props for a course detail page */
export interface CourseDetailProps {
  course: Course
  lab: Lab
  relatedCourses: Course[]
  onRegister?: () => void
  onBack?: () => void
}

/** Props for the event catalog */
export interface EventCatalogProps {
  events: Event[]
  labId?: string
  onEventView?: (eventId: string) => void
  onEventRegister?: (eventId: string) => void
  onFilter?: (filters: { type?: EventType }) => void
}

/** Props for an event detail page */
export interface EventDetailProps {
  event: Event
  lab: Lab
  onRegister?: () => void
  onBack?: () => void
}

/** Props for the Design Studio landing page */
export interface DesignStudioLandingProps {
  lab: Lab
  profiles: DesignProfile[]
  onProfileSelect?: (profileSlug: string) => void
}

/** Props for a Design Studio profile page */
export interface DesignStudioProfileProps {
  lab: Lab
  profile: DesignProfile
  exampleProjects: Project[]
  onContactRequest?: () => void
  onProjectView?: (projectId: string) => void
  onBack?: () => void
}

/** Props for the project portfolio */
export interface ProjectPortfolioProps {
  projects: Project[]
  labId?: string
  onProjectView?: (projectId: string) => void
  onDonate?: (projectId: string) => void
  onFilter?: (filters: { clientType?: ClientType; status?: ProjectStatus }) => void
}

/** Props for a project detail page */
export interface ProjectDetailProps {
  project: Project
  lab: Lab
  relatedProjects: Project[]
  onDonate?: () => void
  onBack?: () => void
}

/** Props for the Semisto Roots page */
export interface SemistoRootsProps {
  lab: Lab
  upcomingWorksites: Worksite[]
  impactStats: Pick<ImpactStats, 'volunteersActive' | 'treesPlanted'>
  onWorksiteView?: (worksiteId: string) => void
  onWorksiteRegister?: (worksiteId: string) => void
  onJoinHeroes?: () => void
}

/** Props for the e-commerce product catalog */
export interface ProductCatalogProps {
  products: Product[]
  currentCountry: string
  availableCountries: string[]
  cartItemCount: number
  onProductView?: (productId: string) => void
  onAddToCart?: (productId: string, quantity: number) => void
  onCartOpen?: () => void
  onCountryChange?: (country: string) => void
  onFilter?: (filters: { type?: ProductType; category?: string }) => void
}

/** Props for a product detail page */
export interface ProductDetailProps {
  product: Product
  relatedProducts: Product[]
  onAddToCart?: (quantity: number) => void
  onBack?: () => void
}

/** Props for the shopping cart */
export interface CartProps {
  items: Array<{ product: Product; quantity: number }>
  total: number
  currency: string
  onUpdateQuantity?: (productId: string, quantity: number) => void
  onRemove?: (productId: string) => void
  onCheckout?: () => void
  onContinueShopping?: () => void
}

/** Props for the checkout flow */
export interface CheckoutProps {
  items: Array<{ product: Product; quantity: number }>
  total: number
  currency: string
  pickupLocations: Array<{ labId: string; name: string; address: string }>
  onSubmitOrder?: (data: {
    pickupLocationId: string
    customerInfo: { name: string; email: string; phone: string }
  }) => void
  onBack?: () => void
}

/** Props for the Transformation Map */
export interface TransformationMapProps {
  projects: MapProject[]
  potentialZones: PotentialZone[]
  onProjectClick?: (projectId: string) => void
  onZoneClick?: (zoneId: string) => void
  onAddZone?: () => void
}

/** Props for the resources page */
export interface ResourcesPageProps {
  resources: Resource[]
  onDownload?: (resourceId: string) => void
  onFilter?: (filters: { category?: ResourceCategory; language?: string }) => void
}

/** Props for the article list */
export interface ArticleListProps {
  articles: Article[]
  labId?: string
  onArticleView?: (articleId: string) => void
  onFilter?: (filters: { category?: ArticleCategory }) => void
}

/** Props for an article detail page */
export interface ArticleDetailProps {
  article: Article
  lab: Lab
  relatedArticles: Article[]
  onBack?: () => void
}

/** Props for the press page */
export interface PressPageProps {
  pressItems: PressItem[]
  onItemView?: (itemId: string) => void
}

/** Props for the donation form */
export interface DonationFormProps {
  lab?: Lab
  project?: Project
  suggestedAmounts: number[]
  currency: string
  onDonate?: (amount: number, isRecurring: boolean) => void
  onBack?: () => void
}

/** Props for the newsletter subscription CTA */
export interface NewsletterCtaProps {
  lab: Lab
  onSubscribe?: (email: string) => void
}

/** Props for the contact page */
export interface ContactPageProps {
  labs: Lab[]
  onSubmit?: (data: {
    labId?: string
    name: string
    email: string
    subject: string
    message: string
  }) => void
}


