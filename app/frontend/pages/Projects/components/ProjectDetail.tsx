import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { apiRequest } from '@/lib/api'
import { BucketSection } from '@/components/shared/BucketSection'
import {
  ArrowLeft,
  Users,
  ListTodo,
  Clock,
  Receipt,
  Calendar,
  BookOpen,
  Wallet,
  ChevronRight,
  Paintbrush,
  GraduationCap,
  FlaskConical,
  Shield,
  Loader2,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'

interface ProjectDetailProps {
  typeKey: string
  projectId: string
  onBack: () => void
  onRefreshList: () => void
}

const TYPE_CONFIG: Record<string, { label: string; accent: string; bg: string; icon: typeof Paintbrush }> = {
  'design-project': { label: 'Design', accent: '#AFBD00', bg: '#f4f6ec', icon: Paintbrush },
  training: { label: 'Academy', accent: '#B01A19', bg: '#f9ece8', icon: GraduationCap },
  'lab-project': { label: 'Lab', accent: '#5B5781', bg: '#eeedf2', icon: FlaskConical },
  guild: { label: 'Guilde', accent: '#234766', bg: '#e8edf1', icon: Shield },
}

const TABS = [
  { id: 'overview', label: 'Aperçu', icon: ListTodo },
  { id: 'timesheets', label: 'Temps', icon: Clock },
  { id: 'expenses', label: 'Dépenses', icon: Receipt },
  { id: 'revenues', label: 'Recettes', icon: Receipt },
  { id: 'events', label: 'Événements', icon: Calendar },
  { id: 'wiki', label: 'Wiki', icon: BookOpen },
  { id: 'bucket', label: 'Bucket', icon: Wallet },
]

const fmtDate = (v: string) => {
  if (!v) return '–'
  return new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const fmtMoney = (v: number) =>
  `${Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

export default function ProjectDetail({ typeKey, projectId, onBack, onRefreshList }: ProjectDetailProps) {
  const { auth } = usePage().props as any
  const isAdmin = auth?.member?.isAdmin

  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const config = TYPE_CONFIG[typeKey] || { label: typeKey, accent: '#78716C', bg: '#f5f5f4', icon: ListTodo }
  const Icon = config.icon

  const loadProject = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiRequest(`/api/v1/projects/${typeKey}/${projectId}`)
      setProject(res)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [typeKey, projectId])

  useEffect(() => { loadProject() }, [loadProject])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-7 h-7 rounded-full border-2 border-stone-200 border-t-[#234766]" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="px-4 py-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
          {error || 'Projet introuvable'}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-5 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Tous les projets
      </button>

      {/* Header card */}
      <div
        className="rounded-2xl border border-stone-200/80 overflow-hidden mb-6"
        style={{ background: `linear-gradient(135deg, ${config.bg} 0%, white 60%)` }}
      >
        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex items-start gap-4">
            {/* Type icon */}
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: config.accent }}
            >
              <Icon className="w-5 h-5 text-white" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider text-white"
                  style={{ backgroundColor: config.accent }}
                >
                  {config.label}
                </span>
                {project.status && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-200/70 text-stone-600">
                    {project.status}
                  </span>
                )}
              </div>

              <h1
                className="text-xl sm:text-2xl font-semibold text-stone-900 tracking-tight"
                style={{ fontFamily: "var(--font-heading, 'Sole Serif Small', serif)" }}
              >
                {project.name}
              </h1>

              {project.description && (
                <p className="mt-1.5 text-sm text-stone-500 line-clamp-2">{project.description}</p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 text-xs text-stone-500">
            {project.leadName && (
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Lead : <strong className="text-stone-700">{project.leadName}</strong>
              </span>
            )}
            {project.members?.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> {project.members.length} membre{project.members.length > 1 ? 's' : ''}
              </span>
            )}
            {project.totalTasks > 0 && (
              <span className="flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5" /> {project.completedTasks}/{project.totalTasks} tâches
              </span>
            )}
            {project.timesheetsCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {project.timesheetsCount} entrées temps
              </span>
            )}
          </div>

          {/* Type-specific info */}
          {project.typeSpecific && <TypeSpecificHeader typeKey={typeKey} data={project.typeSpecific} accent={config.accent} />}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 -mx-1 px-1">
        {TABS.map((t) => {
          const TabIcon = t.icon
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
              style={isActive ? { backgroundColor: config.accent } : undefined}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-[300px]">
        {activeTab === 'overview' && (
          <OverviewTab project={project} typeKey={typeKey} config={config} isAdmin={isAdmin} />
        )}
        {activeTab === 'timesheets' && (
          <ResourceTab
            typeKey={typeKey}
            projectId={projectId}
            resource="timesheets"
            columns={[
              { key: 'memberName', label: 'Membre' },
              { key: 'date', label: 'Date', format: fmtDate },
              { key: 'hours', label: 'Heures', format: (v: number) => `${v}h` },
              { key: 'description', label: 'Description' },
              { key: 'phase', label: 'Phase' },
            ]}
            emptyLabel="Aucun timesheet enregistré"
          />
        )}
        {activeTab === 'expenses' && (
          <ResourceTab
            typeKey={typeKey}
            projectId={projectId}
            resource="expenses"
            columns={[
              { key: 'name', label: 'Libellé' },
              { key: 'supplier', label: 'Fournisseur' },
              { key: 'invoiceDate', label: 'Date', format: fmtDate },
              { key: 'status', label: 'Statut' },
              { key: 'totalInclVat', label: 'Montant TTC', format: fmtMoney, align: 'right' },
            ]}
            emptyLabel="Aucune dépense"
          />
        )}
        {activeTab === 'revenues' && (
          <ResourceTab
            typeKey={typeKey}
            projectId={projectId}
            resource="revenues"
            columns={[
              { key: 'description', label: 'Description' },
              { key: 'contactName', label: 'Contact' },
              { key: 'date', label: 'Date', format: fmtDate },
              { key: 'status', label: 'Statut' },
              { key: 'amount', label: 'Montant', format: fmtMoney, align: 'right' },
            ]}
            emptyLabel="Aucune recette"
          />
        )}
        {activeTab === 'events' && (
          <ResourceTab
            typeKey={typeKey}
            projectId={projectId}
            resource="events"
            columns={[
              { key: 'title', label: 'Titre' },
              { key: 'eventTypeLabel', label: 'Type' },
              { key: 'startDate', label: 'Début', format: fmtDate },
              { key: 'endDate', label: 'Fin', format: fmtDate },
              { key: 'location', label: 'Lieu' },
            ]}
            emptyLabel="Aucun événement"
          />
        )}
        {activeTab === 'wiki' && (
          <WikiTab typeKey={typeKey} projectId={projectId} />
        )}
        {activeTab === 'bucket' && (
          <BucketSection projectType={typeKey} projectId={projectId} />
        )}
      </div>
    </div>
  )
}

/* ─── Overview Tab ─── */

function OverviewTab({ project, typeKey, config, isAdmin }: any) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Members */}
      <div className="rounded-xl border border-stone-200/80 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: config.accent }} />
          Équipe
        </h3>
        {project.members?.length > 0 ? (
          <div className="space-y-2.5">
            {project.members.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3">
                {m.avatar ? (
                  <img src={m.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-semibold text-stone-600">
                    {m.firstName?.[0]}{m.lastName?.[0]}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{m.firstName} {m.lastName}</p>
                  {m.role && <p className="text-[11px] text-stone-400">{m.role}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-400">Aucun membre</p>
        )}
      </div>

      {/* Quick stats */}
      <div className="rounded-xl border border-stone-200/80 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
          <ListTodo className="w-4 h-4" style={{ color: config.accent }} />
          Résumé
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Tâches" value={`${project.completedTasks}/${project.totalTasks}`} accent={config.accent} />
          <StatCard label="Timesheets" value={project.timesheetsCount} accent={config.accent} />
          <StatCard label="Dépenses" value={project.expensesCount} accent={config.accent} />
          <StatCard label="Recettes" value={project.revenuesCount} accent={config.accent} />
          <StatCard label="Événements" value={project.eventsCount} accent={config.accent} />
          <StatCard label="Wiki" value={project.knowledgeSectionsCount} accent={config.accent} />
        </div>
      </div>

      {/* Type-specific details */}
      {project.typeSpecific && (
        <div className="lg:col-span-2 rounded-xl border border-stone-200/80 bg-white p-5">
          <TypeSpecificDetails typeKey={typeKey} data={project.typeSpecific} accent={config.accent} />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-lg bg-stone-50 px-3 py-2.5">
      <p className="text-lg font-semibold text-stone-800">{value}</p>
      <p className="text-[11px] text-stone-400">{label}</p>
    </div>
  )
}

/* ─── Type-Specific Header ─── */

function TypeSpecificHeader({ typeKey, data, accent }: { typeKey: string; data: any; accent: string }) {
  if (!data) return null

  const pills: { label: string; value: string }[] = []

  if (typeKey === 'design-project') {
    if (data.phase) pills.push({ label: 'Phase', value: data.phase })
    if (data.clientName) pills.push({ label: 'Client', value: data.clientName })
    if (data.city) pills.push({ label: 'Ville', value: data.city })
    if (data.area) pills.push({ label: 'Surface', value: `${data.area} m²` })
  } else if (typeKey === 'training') {
    if (data.trainingTypeName) pills.push({ label: 'Type', value: data.trainingTypeName })
    if (data.totalCapacity) pills.push({ label: 'Places', value: `${data.totalSpotsTaken}/${data.totalCapacity}` })
    if (data.price) pills.push({ label: 'Prix', value: fmtMoney(data.price) })
  } else if (typeKey === 'guild') {
    if (data.guildType) pills.push({ label: 'Type', value: data.guildType })
    if (data.leaderName) pills.push({ label: 'Leader', value: data.leaderName })
  } else if (typeKey === 'lab-project') {
    if (data.pole) pills.push({ label: 'Pôle', value: data.pole })
  }

  if (pills.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {pills.map((p) => (
        <span key={p.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 border border-stone-200/60 text-xs text-stone-600">
          <span className="font-medium text-stone-400">{p.label}</span>
          {p.value}
        </span>
      ))}
    </div>
  )
}

/* ─── Type-Specific Details (full section in overview) ─── */

function TypeSpecificDetails({ typeKey, data, accent }: { typeKey: string; data: any; accent: string }) {
  if (typeKey === 'design-project') {
    return (
      <>
        <h3 className="text-sm font-semibold text-stone-700 mb-3" style={{ color: accent }}>
          Détails Design
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Detail label="Phase" value={data.phase} />
          <Detail label="Type projet" value={data.projectType} />
          <Detail label="Client" value={data.clientName} />
          <Detail label="Email client" value={data.clientEmail} />
          <Detail label="Ville" value={data.city} />
          <Detail label="Surface" value={data.area ? `${data.area} m²` : null} />
          <Detail label="Budget dépenses" value={data.expensesBudget ? fmtMoney(data.expensesBudget) : null} />
          <Detail label="Dépenses réelles" value={data.expensesActual ? fmtMoney(data.expensesActual) : null} />
          <Detail label="Heures planifiées" value={data.hoursPlanned ? `${data.hoursPlanned}h` : null} />
          <Detail label="Heures travaillées" value={data.hoursWorked ? `${data.hoursWorked}h` : null} />
        </div>
      </>
    )
  }

  if (typeKey === 'training') {
    return (
      <>
        <h3 className="text-sm font-semibold text-stone-700 mb-3" style={{ color: accent }}>
          Détails Formation
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Detail label="Type" value={data.trainingTypeName} />
          <Detail label="Mode inscription" value={data.registrationMode} />
          <Detail label="Prix" value={data.price ? fmtMoney(data.price) : null} />
          <Detail label="Max participants" value={data.maxParticipants} />
          <Detail label="Capacité totale" value={data.totalCapacity} />
          <Detail label="Places prises" value={data.totalSpotsTaken} />
          <Detail label="Sessions" value={data.sessionsCount} />
          <Detail label="Inscriptions" value={data.registrationsCount} />
        </div>
      </>
    )
  }

  if (typeKey === 'guild') {
    return (
      <>
        <h3 className="text-sm font-semibold text-stone-700 mb-3" style={{ color: accent }}>
          Détails Guilde
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Detail label="Type" value={data.guildType} />
          <Detail label="Leader" value={data.leaderName} />
          <Detail label="Couleur" value={data.color} />
          <Detail label="Credentials" value={data.credentialsCount} />
        </div>
      </>
    )
  }

  if (typeKey === 'lab-project') {
    return (
      <>
        <h3 className="text-sm font-semibold text-stone-700 mb-3" style={{ color: accent }}>
          Détails Projet Lab
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Detail label="Pôle" value={data.pole} />
          <Detail label="Actions" value={data.actionsCount} />
          <Detail label="Notes" value={data.notesCount} />
        </div>
      </>
    )
  }

  return null
}

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-[11px] text-stone-400 mb-0.5">{label}</p>
      <p className="text-stone-700 font-medium">{value ?? '–'}</p>
    </div>
  )
}

/* ─── Resource Tab (generic table for timesheets/expenses/revenues/events) ─── */

interface ColumnDef {
  key: string
  label: string
  format?: (v: any) => string
  align?: 'left' | 'right'
}

function ResourceTab({
  typeKey,
  projectId,
  resource,
  columns,
  emptyLabel,
}: {
  typeKey: string
  projectId: string
  resource: string
  columns: ColumnDef[]
  emptyLabel: string
}) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiRequest(`/api/v1/projects/${typeKey}/${projectId}/${resource}`)
      setItems(res.items || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [typeKey, projectId, resource])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-stone-400">
        <Receipt className="w-10 h-10 mb-2 opacity-30" />
        <p className="text-sm">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wider ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((item: any, i: number) => (
              <tr key={item.id || i} className="hover:bg-stone-50/50 transition-colors">
                {columns.map((col) => {
                  const val = item[col.key]
                  const display = col.format ? col.format(val) : (val ?? '–')
                  return (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-stone-700 ${
                        col.align === 'right' ? 'text-right tabular-nums font-medium' : ''
                      }`}
                    >
                      {display}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-200/80 text-xs text-stone-400">
        {items.length} enregistrement{items.length > 1 ? 's' : ''}
      </div>
    </div>
  )
}

/* ─── Wiki Tab ─── */

function WikiTab({ typeKey, projectId }: { typeKey: string; projectId: string }) {
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiRequest(`/api/v1/projects/${typeKey}/${projectId}/knowledge-sections`)
      setSections(res.items || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [typeKey, projectId])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
      </div>
    )
  }

  if (error) {
    return <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">{error}</div>
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-stone-400">
        <BookOpen className="w-10 h-10 mb-2 opacity-30" />
        <p className="text-sm">Aucune section wiki</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sections.map((s: any) => (
        <div key={s.id} className="rounded-xl border border-stone-200/80 bg-white px-5 py-4 hover:border-stone-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-stone-800">{s.name}</h4>
              {s.description && <p className="text-xs text-stone-400 mt-0.5">{s.description}</p>}
            </div>
            <span className="text-xs text-stone-400">
              {s.topicsCount} sujet{s.topicsCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
