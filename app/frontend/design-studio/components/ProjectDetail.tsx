import { useState } from 'react'
import {
  Search,
  LayoutDashboard,
  Settings,
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
  Pencil,
  Trash2,
} from 'lucide-react'
import { TabLayout, TabItem } from './shared/TabLayout'
import { PhaseIndicator } from './shared/PhaseIndicator'
import { StatusIndicator } from './shared/StatusIndicator'
import {
  OverviewTab,
  SettingsTab,
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
import type { ProjectStatus } from './shared/StatusIndicator'

export interface ProjectDetailPayload {
  project: {
    id: string
    name: string
    clientName: string
    clientEmail?: string
    clientPhone?: string
    street?: string
    number?: string
    city?: string
    postcode?: string
    countryName?: string
    address: string
    coordinates?: { lat: number; lng: number }
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
    memberAvatar?: string
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
  onOpenEditProject?: () => void
  onUpdatePhase?: (phase: ProjectPhase) => void
  onUpdateStatus?: (status: ProjectStatus) => void
  onDeleteProject?: (projectId: string) => void
  onUpdateAddress?: (v: {
    street: string
    number: string
    city: string
    postcode: string
    country_name: string
    latitude: number
    longitude: number
  }) => void | Promise<void>
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
  onUpdateTimesheet?: (
    id: string,
    v: { date: string; hours: number; phase: string; mode: string; travel_km: number; notes: string; details?: string; service_type_id?: string | null }
  ) => Promise<void>
  onDeleteTimesheet: (id: string) => void
  timesheetEditBusy?: boolean
  onOpenExpenseAdd: () => void
  onEditExpense: (expense: ProjectDetailPayload['expenses'][0]) => void
  onApproveExpense: (id: string) => void
  onDeleteExpense: (id: string) => void
  onSaveSiteAnalysis: (v: Record<string, unknown>) => Promise<void> | void
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
  { id: 'overview', label: "Vue d'ensemble", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'site-analysis', label: 'Analyse', icon: <Map className="w-4 h-4" /> },
  { id: 'palette', label: 'Palette', icon: <Palette className="w-4 h-4" /> },
  { id: 'planting-plan', label: 'Plan', icon: <MapPin className="w-4 h-4" /> },
  { id: 'timesheets', label: 'Timesheets', icon: <Clock className="w-4 h-4" /> },
  { id: 'expenses', label: 'Dépenses', icon: <Euro className="w-4 h-4" /> },
  { id: 'quotes', label: 'Offre', icon: <FileText className="w-4 h-4" /> },
  { id: 'documents', label: 'Documents', icon: <FileStack className="w-4 h-4" /> },
  { id: 'album', label: 'Album', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'meetings', label: 'Dates', icon: <Calendar className="w-4 h-4" /> },
  { id: 'co-gestion', label: 'Co-gestion', icon: <Leaf className="w-4 h-4" /> },
  { id: 'settings', label: 'Paramètres', icon: <Settings className="w-4 h-4" /> },
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
    <main className="min-h-screen bg-stone-50 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <header className="rounded-2xl border border-stone-200 bg-white p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <PhaseIndicator
                  phase={project.phase as ProjectPhase}
                  showLabel
                  onPhaseChange={a.onUpdatePhase}
                />
                <StatusIndicator
                  status={(project.status || 'pending') as ProjectStatus}
                  showLabel
                  onStatusChange={a.onUpdateStatus}
                />
                <button
                  type="button"
                  onClick={a.onOpenEditProject}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Modifier
                </button>
                {a.onDeleteProject && (
                  <button
                    type="button"
                    onClick={() => a.onDeleteProject?.(project.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer
                  </button>
                )}
              </div>
              <h1 className="text-2xl font-serif font-semibold text-stone-900 tracking-tight">
                {project.name}
              </h1>
              <p className="text-stone-600 mt-0.5">
                {project.clientName} · {project.address}
              </p>
            </div>
            {detail.teamMembers.length > 0 && (
              <div className="flex items-center shrink-0" title={detail.teamMembers.map((m) => m.memberName).join(', ')}>
                <div className="flex -space-x-2">
                  {detail.teamMembers.slice(0, 5).map((member) => (
                    <div
                      key={member.id}
                      className="w-10 h-10 rounded-full border-2 border-white bg-[#e1e6d8] flex items-center justify-center overflow-hidden shrink-0 shadow-sm ring-1 ring-stone-200"
                    >
                      {member.memberAvatar ? (
                        <img
                          src={member.memberAvatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-[#6B7A00]">
                          {(member.memberName || '?').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))}
                  {detail.teamMembers.length > 5 && (
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-stone-200 flex items-center justify-center shrink-0 shadow-sm ring-1 ring-stone-200 text-xs font-medium text-stone-600">
                      +{detail.teamMembers.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Rechercher dans le projet (devis, docs, annotations…)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Rechercher
            </button>
          </form>
          {searchResults.length > 0 && (
            <div className="mb-4 rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-1">
              {searchResults.map((item) => (
                <p
                  key={item.id}
                  className="text-xs text-stone-700"
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
            {activeTab === 'timesheets' && (
              <TimesheetsTab
                timesheets={detail.timesheets as any}
                onUpdateTimesheet={a.onUpdateTimesheet}
                onDeleteTimesheet={a.onDeleteTimesheet}
                timesheetEditBusy={a.timesheetEditBusy}
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
                siteAnalysis={detail.siteAnalysis as any}
                onSave={a.onSaveSiteAnalysis}
                busy={busy}
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
            {activeTab === 'settings' && (
              <SettingsTab
                project={{
                  street: project.street,
                  number: project.number,
                  city: project.city,
                  postcode: project.postcode,
                  countryName: project.countryName,
                  coordinates: project.coordinates,
                }}
                teamMembers={detail.teamMembers as any}
                projectPhase={project.phase}
                onUpdateAddress={a.onUpdateAddress ?? (async () => {})}
                onAddTeamMember={a.onAddTeamMember}
                onRemoveTeamMember={a.onRemoveTeamMember}
              />
            )}
            {activeTab === 'co-gestion' && (
              <CoGestionTab
                plantFollowUp={detail.plantFollowUp as any}
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
