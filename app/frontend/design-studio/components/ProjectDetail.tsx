import { useState } from 'react'
import {
  ArrowLeft,
  RefreshCw,
  Search,
  LayoutDashboard,
  Users,
  Clock,
  Euro,
  Map,
  Palette,
  MapPin,
  FileText,
  FileStack,
  Image as ImageIcon,
  Calendar,
  Leaf,
} from 'lucide-react'
import { TabLayout, TabItem } from './shared/TabLayout'
import { PhaseIndicator } from './shared/PhaseIndicator'
import {
  OverviewTab,
  TeamTab,
  TimesheetsTab,
  ExpensesTab,
  SiteAnalysisTab,
  PaletteTab,
  PlantingPlanTab,
  QuotesTab,
  DocumentsTab,
  AlbumTab,
  MeetingsTab,
  CoGestionTab,
} from './tabs'
import type { ProjectPhase } from './shared/PhaseIndicator'

export interface ProjectDetailPayload {
  project: {
    id: string
    name: string
    clientName: string
    address: string
    phase: ProjectPhase
    status: string
    area: number
    budget: {
      hoursPlanned: number
      hoursWorked: number
      hoursBilled: number
      hoursSemos: number
      expensesBudget: number
      expensesActual: number
    }
    startDate: string | null
    plantingDate: string | null
    updatedAt: string
  }
  teamMembers: Array<{
    id: string
    memberName: string
    memberEmail: string
    role: string
    isPaid: boolean
    assignedAt: string
  }>
  timesheets: Array<{
    id: string
    date: string
    memberName: string
    hours: number
    phase: string
    mode: string
  }>
  expenses: Array<{
    id: string
    supplier?: string
    invoiceDate?: string
    date?: string
    totalInclVat?: number
    amount?: number
    expenseType?: string
    category?: string
    status?: string
  }>
  siteAnalysis: Record<string, unknown> | null
  plantPalette: {
    items: Array<{
      id: string
      speciesName: string
      commonName?: string
      layer: string
      quantity: number
      unitPrice: number
    }>
    totals?: { totalPlants: number; totalCost: number }
  } | null
  plantingPlan: {
    imageUrl?: string
    layout?: string
    markers: Array<{
      id: string
      number: number
      speciesName: string
      x: number
      y: number
    }>
  } | null
  quotes: Array<{
    id: string
    title: string
    version: number
    status: string
    total: number
    lines?: Array<{ id: string; description: string; quantity: number; unit: string; total: number }>
  }>
  documents: Array<{ id: string; category: string; name: string; url: string; size: number }>
  mediaItems: Array<{ id: string; type: string; url: string; thumbnailUrl?: string; caption: string }>
  meetings: Array<{ id: string; title: string; date: string; time: string; duration: number; location?: string }>
  annotations: Array<{ id: string; content: string; authorType: string; resolved: boolean }>
  plantFollowUp: {
    plantRecords?: Array<{ id: string; status: string; healthScore: number; notes?: string }>
    plants?: Array<{ id: string; status: string; healthScore: number; notes?: string }>
    followUpVisits?: Array<{ id: string; date: string; type: string; notes?: string }>
    visits?: Array<{ id: string; date: string; type: string; notes?: string }>
    interventions: Array<{ id: string; date: string; type: string; notes?: string }>
  } | null
  harvestCalendar: { months: Array<{ month: number; name: string; harvests?: unknown[] }> } | null
  maintenanceCalendar: { months: Array<{ month: number; name: string; tasks?: unknown[] }> } | null
}

export interface ProjectDetailActions {
  onBack: () => void
  onRefresh: () => void
  onUpdateName: () => void
  onAddTeamMember: (v: {
    member_name: string
    member_email: string
    role: string
    is_paid: boolean
  }) => void
  onRemoveTeamMember: (id: string) => void
  onAddTimesheet: (v: {
    member_name: string
    date?: string
    hours: number
    phase: string
    mode: string
    travel_km?: number
    notes?: string
  }) => void
  onDeleteTimesheet: (id: string) => void
  onOpenExpenseAdd: () => void
  onEditExpense: (expense: ProjectDetailPayload['expenses'][0]) => void
  onApproveExpense: (id: string) => void
  onDeleteExpense: (id: string) => void
  onSaveSiteAnalysis: (v: Record<string, unknown>) => void
  onAddPaletteItem: (v: Record<string, unknown>) => void
  onDeletePaletteItem: (id: string) => void
  onImportPlantPalette: (paletteId: string) => void
  onSavePlantingPlan: (v: { image_url: string; layout: string }) => void
  onExportPlan: (format: 'pdf' | 'image') => void
  onAddPlantMarker: (v: { species_name: string; x: number; y: number; palette_item_id?: string }) => void
  onMovePlantMarker: (markerId: string, v: { x: number; y: number }) => void
  onDeletePlantMarker: (markerId: string) => void
  onCreateQuote: () => void
  onSendQuote: (quoteId: string) => void
  onDeleteQuote: (quoteId: string) => void
  onAddQuoteLine: (quoteId: string, v: { description: string; quantity: number; unit: string; unit_price: number }) => void
  onDeleteQuoteLine: (lineId: string) => void
  onAddDocument: (v: Record<string, unknown>) => void
  onDeleteDocument: (id: string) => void
  onAddMedia: (v: Record<string, unknown>) => void
  onDeleteMedia: (id: string) => void
  onAddMeeting: (v: Record<string, unknown>) => void
  onDeleteMeeting: (id: string) => void
  onAddAnnotation: (v: Record<string, unknown>) => void
  onResolveAnnotation: (id: string) => void
  onDeleteAnnotation: (id: string) => void
  onAddPlantRecord: (v: Record<string, unknown>) => void
  onUpdatePlantRecord: (recordId: string, v: Record<string, unknown>) => void
  onAddFollowUpVisit: (v: Record<string, unknown>) => void
  onAddIntervention: (v: Record<string, unknown>) => void
  onUpdateHarvestCalendar: (month: number, items: unknown[]) => void
  onUpdateMaintenanceCalendar: (month: number, items: unknown[]) => void
  onSearch: (query: string) => void
}

const DETAIL_TABS: TabItem[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'team', label: 'Team', icon: <Users className="w-4 h-4" /> },
  { id: 'timesheets', label: 'Timesheets', icon: <Clock className="w-4 h-4" /> },
  { id: 'expenses', label: 'Expenses', icon: <Euro className="w-4 h-4" /> },
  { id: 'site-analysis', label: 'Site Analysis', icon: <Map className="w-4 h-4" /> },
  { id: 'palette', label: 'Palette', icon: <Palette className="w-4 h-4" /> },
  { id: 'planting-plan', label: 'Planting Plan', icon: <MapPin className="w-4 h-4" /> },
  { id: 'quotes', label: 'Quotes', icon: <FileText className="w-4 h-4" /> },
  { id: 'documents', label: 'Documents', icon: <FileStack className="w-4 h-4" /> },
  { id: 'album', label: 'Album', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'meetings', label: 'Meetings', icon: <Calendar className="w-4 h-4" /> },
  { id: 'co-gestion', label: 'Co-gestion', icon: <Leaf className="w-4 h-4" /> },
]

interface ProjectDetailViewProps {
  detail: ProjectDetailPayload
  busy: boolean
  actions: ProjectDetailActions
  searchResults: Array<{ id: string; kind: string; excerpt: string }>
}

export function ProjectDetailView({
  detail,
  busy,
  actions: a,
  searchResults,
}: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const project = detail.project

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    a.onSearch(searchQuery)
  }

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-950 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            type="button"
            onClick={a.onBack}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-600 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour dashboard
          </button>
          <button
            type="button"
            onClick={a.onRefresh}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-600 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
          {busy && (
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Mise à jour…
            </span>
          )}
        </div>

        <header className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-5 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <PhaseIndicator
                  phase={project.phase as ProjectPhase}
                  showLabel
                />
                <button
                  type="button"
                  onClick={a.onUpdateName}
                  className="text-xs text-stone-500 dark:text-stone-400 hover:text-[#AFBD00] dark:hover:text-[#AFBD00] underline"
                >
                  Renommer
                </button>
              </div>
              <h1 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
                {project.name}
              </h1>
              <p className="text-stone-600 dark:text-stone-400 mt-0.5">
                {project.clientName} · {project.address}
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-5 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Rechercher dans le projet (devis, docs, annotations…)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl border border-stone-300 dark:border-stone-600 px-4 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              Rechercher
            </button>
          </form>
          {searchResults.length > 0 && (
            <div className="mb-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-3 space-y-1">
              {searchResults.map((item) => (
                <p
                  key={item.id}
                  className="text-xs text-stone-700 dark:text-stone-300"
                >
                  [{item.kind}] {item.excerpt}
                </p>
              ))}
            </div>
          )}

          <TabLayout
            tabs={DETAIL_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {activeTab === 'overview' && (
              <OverviewTab project={project as import('../types').Project} />
            )}
            {activeTab === 'team' && (
              <TeamTab
                teamMembers={detail.teamMembers}
                projectPhase={project.phase}
                onAddTeamMember={a.onAddTeamMember}
                onRemoveTeamMember={a.onRemoveTeamMember}
              />
            )}
            {activeTab === 'timesheets' && (
              <TimesheetsTab
                timesheets={detail.timesheets}
                projectPhase={project.phase as ProjectPhase}
                onAddTimesheet={a.onAddTimesheet}
                onDeleteTimesheet={a.onDeleteTimesheet}
              />
            )}
            {activeTab === 'expenses' && (
              <ExpensesTab
                expenses={detail.expenses}
                onOpenAdd={a.onOpenExpenseAdd}
                onEdit={a.onEditExpense}
                onApprove={a.onApproveExpense}
                onDelete={a.onDeleteExpense}
              />
            )}
            {activeTab === 'site-analysis' && (
              <SiteAnalysisTab
                siteAnalysis={detail.siteAnalysis as import('../types').SiteAnalysis | null}
                onSave={a.onSaveSiteAnalysis}
              />
            )}
            {activeTab === 'palette' && (
              <PaletteTab
                plantPalette={detail.plantPalette as import('../types').PlantPalette | null}
                onAddPaletteItem={a.onAddPaletteItem}
                onDeletePaletteItem={a.onDeletePaletteItem}
                onImportPlantPalette={a.onImportPlantPalette}
              />
            )}
            {activeTab === 'planting-plan' && (
              <PlantingPlanTab
                plantingPlan={detail.plantingPlan as import('../types').PlantingPlan | null}
                onSavePlan={a.onSavePlantingPlan}
                onExportPlan={a.onExportPlan}
                onAddMarker={a.onAddPlantMarker}
                onMoveMarker={a.onMovePlantMarker}
                onDeleteMarker={a.onDeletePlantMarker}
              />
            )}
            {activeTab === 'quotes' && (
              <QuotesTab
                projectId={project.id}
                quotes={detail.quotes as import('../types').Quote[]}
                onCreateQuote={a.onCreateQuote}
                onSendQuote={a.onSendQuote}
                onDeleteQuote={a.onDeleteQuote}
                onAddQuoteLine={a.onAddQuoteLine}
                onDeleteQuoteLine={a.onDeleteQuoteLine}
              />
            )}
            {activeTab === 'documents' && (
              <DocumentsTab
                documents={detail.documents as import('../types').ProjectDocument[]}
                onAddDocument={a.onAddDocument}
                onDeleteDocument={a.onDeleteDocument}
              />
            )}
            {activeTab === 'album' && (
              <AlbumTab
                mediaItems={detail.mediaItems as import('../types').MediaItem[]}
                onAddMedia={a.onAddMedia}
                onDeleteMedia={a.onDeleteMedia}
              />
            )}
            {activeTab === 'meetings' && (
              <MeetingsTab
                meetings={detail.meetings as import('../types').Meeting[]}
                onAddMeeting={a.onAddMeeting}
                onDeleteMeeting={a.onDeleteMeeting}
              />
            )}
            {activeTab === 'co-gestion' && (
              <CoGestionTab
                plantFollowUp={detail.plantFollowUp}
                annotations={detail.annotations as import('../types').Annotation[]}
                harvestCalendar={detail.harvestCalendar as import('../types').HarvestCalendar | null}
                maintenanceCalendar={detail.maintenanceCalendar as import('../types').MaintenanceCalendar | null}
                onAddPlantRecord={a.onAddPlantRecord}
                onUpdatePlantRecord={a.onUpdatePlantRecord}
                onAddFollowUpVisit={a.onAddFollowUpVisit}
                onAddIntervention={a.onAddIntervention}
                onAddAnnotation={a.onAddAnnotation}
                onResolveAnnotation={a.onResolveAnnotation}
                onDeleteAnnotation={a.onDeleteAnnotation}
                onUpdateHarvestCalendar={a.onUpdateHarvestCalendar}
                onUpdateMaintenanceCalendar={a.onUpdateMaintenanceCalendar}
              />
            )}
          </TabLayout>
        </section>
      </div>
    </main>
  )
}
