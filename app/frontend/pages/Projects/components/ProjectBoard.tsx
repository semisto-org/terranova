import { useState, useMemo } from 'react'
import {
  FolderKanban,
  Search,
  Users,
  CheckCircle2,
  ListTodo,
  ChevronRight,
  Paintbrush,
  GraduationCap,
  FlaskConical,
  Shield,
} from 'lucide-react'

interface ProjectSummary {
  id: string
  name: string
  typeKey: string
  status: string | null
  description: string
  leadId: string | null
  leadName: string | null
  teamCount: number
  totalTasks: number
  completedTasks: number
  createdAt: string
  updatedAt: string
}

interface ProjectBoardProps {
  projects: ProjectSummary[]
  loading: boolean
  error: string | null
  onSelect: (typeKey: string, id: string) => void
  onRefresh: () => void
}

const TYPE_CONFIG: Record<string, { label: string; accent: string; bg: string; icon: typeof FolderKanban }> = {
  'design-project': { label: 'Design', accent: '#AFBD00', bg: '#f4f6ec', icon: Paintbrush },
  training: { label: 'Academy', accent: '#B01A19', bg: '#f9ece8', icon: GraduationCap },
  'lab-project': { label: 'Lab', accent: '#5B5781', bg: '#eeedf2', icon: FlaskConical },
  guild: { label: 'Guilde', accent: '#234766', bg: '#e8edf1', icon: Shield },
}

const TYPE_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'design-project', label: 'Design' },
  { id: 'training', label: 'Academy' },
  { id: 'lab-project', label: 'Lab' },
  { id: 'guild', label: 'Guildes' },
]

const STATUS_FILTERS = [
  { id: 'active', label: 'Actifs' },
  { id: 'all', label: 'Tous' },
  { id: 'completed', label: 'Terminés' },
]

const ACTIVE_STATUSES = new Set([
  'active', 'pending', 'En cours', 'En attente', 'Standby',
  'idea', 'in_construction', 'in_preparation', 'registrations_open', 'in_progress', 'post_production',
  'Idée',
])

const COMPLETED_STATUSES = new Set([
  'completed', 'archived', 'Terminé', 'Annulé', 'No go', 'cancelled',
])

function isActive(status: string | null): boolean {
  if (!status) return true
  return ACTIVE_STATUSES.has(status) || (!COMPLETED_STATUSES.has(status))
}

function isCompleted(status: string | null): boolean {
  if (!status) return false
  return COMPLETED_STATUSES.has(status)
}

export default function ProjectBoard({ projects, loading, error, onSelect, onRefresh }: ProjectBoardProps) {
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let items = projects

    if (typeFilter !== 'all') {
      items = items.filter((p) => p.typeKey === typeFilter)
    }

    if (statusFilter === 'active') {
      items = items.filter((p) => isActive(p.status))
    } else if (statusFilter === 'completed') {
      items = items.filter((p) => isCompleted(p.status))
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.leadName?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
    }

    return items
  }, [projects, typeFilter, statusFilter, search])

  // Group by type
  const grouped = useMemo(() => {
    const groups: Record<string, ProjectSummary[]> = {}
    for (const p of filtered) {
      const key = p.typeKey || 'unknown'
      if (!groups[key]) groups[key] = []
      groups[key].push(p)
    }
    return groups
  }, [filtered])

  const typeOrder = ['design-project', 'training', 'lab-project', 'guild']

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-7 h-7 rounded-full border-2 border-stone-200 border-t-[#234766]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
        {error}
        <button onClick={onRefresh} className="ml-3 underline hover:no-underline">
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold tracking-tight text-stone-900"
          style={{ fontFamily: "var(--font-heading, 'Sole Serif Small', serif)" }}
        >
          Projets
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {projects.length} projet{projects.length !== 1 ? 's' : ''} au total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Type pills */}
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === f.id
                  ? 'bg-[#234766] text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Status pills */}
        <div className="flex gap-1.5 sm:ml-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.id
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un projet…"
          className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#234766]/20 focus:border-[#234766]/40 transition-all"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400">
          <FolderKanban className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">Aucun projet trouvé</p>
        </div>
      )}

      {/* Project groups */}
      <div className="space-y-8">
        {typeOrder
          .filter((tk) => grouped[tk]?.length > 0)
          .map((tk) => {
            const config = TYPE_CONFIG[tk] || { label: tk, accent: '#78716C', bg: '#f5f5f4', icon: FolderKanban }
            const Icon = config.icon
            const items = grouped[tk]!

            return (
              <section key={tk}>
                {/* Section header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: config.bg }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: config.accent }} />
                  </span>
                  <h2 className="text-sm font-semibold text-stone-700 tracking-wide uppercase">
                    {config.label}
                  </h2>
                  <span className="text-xs text-stone-400 ml-1">
                    {items.length}
                  </span>
                </div>

                {/* Cards grid */}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((p) => (
                    <ProjectCard
                      key={`${p.typeKey}-${p.id}`}
                      project={p}
                      config={config}
                      onClick={() => onSelect(p.typeKey, p.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
      </div>
    </div>
  )
}

function ProjectCard({
  project,
  config,
  onClick,
}: {
  project: ProjectSummary
  config: { label: string; accent: string; bg: string }
  onClick: () => void
}) {
  const progress =
    project.totalTasks > 0
      ? Math.round((project.completedTasks / project.totalTasks) * 100)
      : 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left bg-white rounded-xl border border-stone-200/80 p-4 hover:border-stone-300 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* Accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ backgroundColor: config.accent }}
      />

      <div className="pl-3">
        {/* Name + arrow */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-stone-900 leading-snug line-clamp-2 group-hover:text-[#234766] transition-colors">
            {project.name}
          </h3>
          <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 shrink-0 mt-0.5 transition-colors" />
        </div>

        {/* Status badge */}
        {project.status && (
          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-500">
            {project.status}
          </span>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-3 text-xs text-stone-400">
          {project.leadName && (
            <span className="flex items-center gap-1 truncate">
              <Users className="w-3 h-3" />
              {project.leadName}
            </span>
          )}
          {project.teamCount > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {project.teamCount}
            </span>
          )}
          {project.totalTasks > 0 && (
            <span className="flex items-center gap-1">
              <ListTodo className="w-3 h-3" />
              {project.completedTasks}/{project.totalTasks}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {project.totalTasks > 0 && (
          <div className="mt-3 h-1 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: progress === 100 ? '#10b981' : config.accent,
              }}
            />
          </div>
        )}
      </div>
    </button>
  )
}
