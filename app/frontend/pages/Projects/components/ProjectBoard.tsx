import { useState, useMemo, useEffect, useRef } from 'react'
import {
  FolderKanban,
  Search,
  Users,
  ListTodo,
  ArrowUpRight,
  Paintbrush,
  GraduationCap,
  FlaskConical,
  Shield,
  Plus,
  LayoutGrid,
  Rows3,
  Command,
} from 'lucide-react'
import { ProjectCreateModal } from '@/components/projects/ProjectCreateModal'

interface ProjectSummary {
  id: string
  name: string
  typeKey: string
  status: string | null
  description: string
  teamCount: number
  completedTasks: number
  totalTasks: number
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

type PoleConfig = {
  label: string
  short: string
  accent: string
  bg: string
  tint: string
  icon: typeof FolderKanban
  numeral: string
  motto: string
}

const TYPE_CONFIG: Record<string, PoleConfig> = {
  'design-project': {
    label: 'Design Studio',
    short: 'Design',
    accent: '#AFBD00',
    bg: '#e1e6d8',
    tint: 'rgba(175, 189, 0, 0.08)',
    icon: Paintbrush,
    numeral: 'I',
    motto: 'Concevoir le territoire',
  },
  training: {
    label: 'Academy',
    short: 'Academy',
    accent: '#B01A19',
    bg: '#eac7b8',
    tint: 'rgba(176, 26, 25, 0.06)',
    icon: GraduationCap,
    numeral: 'II',
    motto: 'Transmettre le savoir',
  },
  'lab-project': {
    label: 'Gestion du Lab',
    short: 'Lab',
    accent: '#5B5781',
    bg: '#c8bfd2',
    tint: 'rgba(91, 87, 129, 0.08)',
    icon: FlaskConical,
    numeral: 'III',
    motto: 'Expérimenter, prototyper',
  },
  guild: {
    label: 'Guildes',
    short: 'Guildes',
    accent: '#234766',
    bg: '#c9d1d9',
    tint: 'rgba(35, 71, 102, 0.06)',
    icon: Shield,
    numeral: 'IV',
    motto: 'Coopérer en communauté',
  },
}

const TYPE_ORDER = ['design-project', 'training', 'lab-project', 'guild']

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

function relativeDate(iso: string): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Date.now() - then
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days < 1) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} j`
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem`
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`
  return `il y a ${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? 's' : ''}`
}

export default function ProjectBoard({ projects, loading, error, onSelect, onRefresh }: ProjectBoardProps) {
  const [activePole, setActivePole] = useState<string>('design-project')
  const [statusFilter, setStatusFilter] = useState('active')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [createOpen, setCreateOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Cmd+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Count per pole, respecting the status filter
  const countsByPole = useMemo(() => {
    const base = projects.filter((p) => {
      if (statusFilter === 'active') return isActive(p.status)
      if (statusFilter === 'completed') return isCompleted(p.status)
      return true
    })
    const counts: Record<string, number> = { all: base.length }
    for (const tk of TYPE_ORDER) counts[tk] = 0
    for (const p of base) counts[p.typeKey] = (counts[p.typeKey] || 0) + 1
    return counts
  }, [projects, statusFilter])

  // Projects to display — only the active pole
  const filtered = useMemo(() => {
    let items = projects.filter((p) => p.typeKey === activePole)
    if (statusFilter === 'active') items = items.filter((p) => isActive(p.status))
    else if (statusFilter === 'completed') items = items.filter((p) => isCompleted(p.status))
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
    }
    return items
  }, [projects, activePole, statusFilter, search])

  const activeConfig = TYPE_CONFIG[activePole]!

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border border-stone-200" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#234766] animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50/70 border border-red-200/80 px-6 py-5 text-sm text-red-800">
        <div className="font-medium mb-1">Une erreur est survenue</div>
        <div className="text-red-700/80">{error}</div>
        <button onClick={onRefresh} className="mt-3 text-xs font-medium underline underline-offset-2 hover:no-underline">
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* ============ EDITORIAL HEADER ============ */}
      <header className="mb-8 pt-2">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div
              className="flex items-center gap-2 mb-3 text-[10px] tracking-[0.22em] uppercase text-stone-500 font-medium"
              style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
            >
              <span className="inline-block w-6 h-px bg-stone-400" />
              <span>Atlas du mouvement</span>
            </div>
            <h1
              className="text-[44px] sm:text-[52px] leading-[0.95] tracking-tight text-stone-900"
              style={{ fontFamily: "var(--font-heading, 'Sole Serif Small', serif)" }}
            >
              Projets <span className="italic text-stone-400">vivants</span>
            </h1>
            <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-stone-500">
              Chaque projet est un fragment du territoire en transformation —{' '}
              <span className="text-stone-700 tabular-nums font-medium">{projects.length}</span>{' '}
              à ce jour, répartis entre les pôles de Semisto.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="group inline-flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full bg-stone-900 text-white text-[13px] font-medium hover:bg-stone-800 transition-all shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_8px_24px_-12px_rgba(0,0,0,0.4)]"
          >
            <span>Nouveau projet</span>
            <span className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>
      </header>

      {/* ============ POLE TABS — the main navigation ============ */}
      <nav className="relative mb-8">
        {/* Baseline */}
        <div className="absolute left-0 right-0 bottom-0 h-px bg-stone-200" aria-hidden />

        <div className="relative flex items-end gap-1 overflow-x-auto -mx-1 px-1 scrollbar-none">
          {TYPE_ORDER.map((tk) => {
            const cfg = TYPE_CONFIG[tk]!
            const Icon = cfg.icon
            const active = activePole === tk
            const count = countsByPole[tk] || 0
            return (
              <button
                key={tk}
                onClick={() => setActivePole(tk)}
                className={`group relative flex items-center gap-2.5 px-4 sm:px-5 pt-3 pb-3.5 text-[13.5px] font-medium transition-all whitespace-nowrap ${
                  active ? 'text-stone-900' : 'text-stone-500 hover:text-stone-800'
                }`}
                aria-selected={active}
                role="tab"
              >
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: active ? 'white' : 'transparent',
                    border: active ? `1px solid ${cfg.accent}30` : '1px solid transparent',
                    boxShadow: active ? `0 2px 8px -4px ${cfg.accent}40` : 'none',
                  }}
                >
                  <Icon
                    className="w-3.5 h-3.5 transition-colors"
                    style={{ color: active ? cfg.accent : undefined }}
                  />
                </span>

                <span
                  className={active ? 'text-stone-900' : ''}
                  style={active ? { fontFamily: "var(--font-heading, 'Sole Serif Small', serif)", fontSize: '17px', fontWeight: 500 } : undefined}
                >
                  {cfg.short}
                </span>

                <span
                  className="tabular-nums text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
                  style={{
                    backgroundColor: active ? `${cfg.accent}18` : '#f5f5f4',
                    color: active ? cfg.accent : '#a8a29e',
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {count.toString().padStart(2, '0')}
                </span>

                {/* Active underline — colored by pole */}
                {active && (
                  <span
                    className="absolute left-2 right-2 -bottom-px h-[2px] rounded-full"
                    style={{ backgroundColor: cfg.accent }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* ============ ACTIVE POLE HERO ============ */}
      <section
        className="relative overflow-hidden rounded-2xl mb-6 px-6 py-5"
        style={{ background: `linear-gradient(135deg, ${activeConfig.tint} 0%, transparent 75%)` }}
      >
        {/* Giant numeral watermark */}
        <div
          aria-hidden
          className="absolute -right-2 -top-8 text-[160px] leading-none font-bold select-none pointer-events-none opacity-[0.08]"
          style={{
            fontFamily: "var(--font-heading, 'Sole Serif Small', serif)",
            color: activeConfig.accent,
            fontStyle: 'italic',
          }}
        >
          {activeConfig.numeral}
        </div>

        <div className="relative flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div
              className="text-[10px] tracking-[0.22em] uppercase text-stone-500 font-medium mb-1.5"
              style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
            >
              Pôle · {activeConfig.numeral}
            </div>
            <h2
              className="text-[26px] tracking-tight text-stone-900"
              style={{ fontFamily: "var(--font-heading, 'Sole Serif Small', serif)" }}
            >
              {activeConfig.label}
            </h2>
            <p className="mt-0.5 text-[13px] text-stone-500 italic">{activeConfig.motto}</p>
          </div>

          <div
            className="flex items-baseline gap-2"
            style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
          >
            <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
              {statusFilter === 'active' ? 'Actifs' : statusFilter === 'completed' ? 'Terminés' : 'Total'}
            </span>
            <span
              className="text-[40px] font-semibold tabular-nums leading-none"
              style={{ color: activeConfig.accent }}
            >
              {(countsByPole[activePole] || 0).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </section>

      {/* ============ TOOLBAR ============ */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Rechercher dans ${activeConfig.label}…`}
            className="w-full pl-10 pr-16 py-2.5 bg-white border border-stone-200 rounded-xl text-[13.5px] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-200/40 transition-all"
          />
          <kbd
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[10px] text-stone-500"
            style={{ fontFamily: "var(--font-mono, monospace)" }}
          >
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </div>

        {/* Status filter */}
        <div className="flex items-center bg-white border border-stone-200 rounded-xl p-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                statusFilter === f.id
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-white border border-stone-200 rounded-xl p-0.5">
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:text-stone-700'}`}
            title="Vue liste"
          >
            <Rows3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:text-stone-700'}`}
            title="Vue grille"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Result count */}
      <div
        className="flex items-center gap-2 text-[11px] text-stone-500 mb-4"
        style={{ fontFamily: "var(--font-mono, monospace)" }}
      >
        <span className="tabular-nums">{filtered.length.toString().padStart(3, '0')}</span>
        <span className="opacity-60">résultats</span>
        {(statusFilter !== 'active' || search) && (
          <button
            onClick={() => {
              setStatusFilter('active')
              setSearch('')
            }}
            className="ml-2 text-stone-700 hover:text-stone-900 underline underline-offset-2"
          >
            réinitialiser
          </button>
        )}
      </div>

      {/* ============ CONTENT ============ */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-stone-400 rounded-2xl border border-dashed border-stone-200 bg-white/40">
          <div className="relative mb-4">
            <FolderKanban className="w-14 h-14 opacity-20" strokeWidth={1.25} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: activeConfig.accent }}
              />
            </div>
          </div>
          <p className="text-sm font-medium text-stone-600">
            Aucun projet dans {activeConfig.label}
          </p>
          <p className="text-xs text-stone-400 mt-1">
            {search ? 'Modifiez votre recherche' : 'Créez le premier projet de ce pôle'}
          </p>
        </div>
      ) : view === 'list' ? (
        <div className="rounded-2xl bg-white border border-stone-200/70 overflow-hidden divide-y divide-stone-100">
          {filtered.map((p, idx) => (
            <ProjectRow
              key={`${p.typeKey}-${p.id}`}
              project={p}
              config={activeConfig}
              index={idx}
              onClick={() => onSelect(p.typeKey, p.id)}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard
              key={`${p.typeKey}-${p.id}`}
              project={p}
              config={activeConfig}
              onClick={() => onSelect(p.typeKey, p.id)}
            />
          ))}
        </div>
      )}

      {createOpen && (
        <ProjectCreateModal
          onClose={() => setCreateOpen(false)}
          onCreated={({ id, typeKey }) => {
            setCreateOpen(false)
            onRefresh()
            onSelect(typeKey, id)
          }}
        />
      )}
    </div>
  )
}

/* ============================================================
 * LIST ROW
 * ============================================================ */

function ProjectRow({
  project,
  config,
  index,
  onClick,
}: {
  project: ProjectSummary
  config: PoleConfig
  index: number
  onClick: () => void
}) {
  const progress =
    project.totalTasks > 0
      ? Math.round((project.completedTasks / project.totalTasks) * 100)
      : null

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left flex items-center gap-4 px-4 sm:px-5 py-3.5 hover:bg-stone-50/80 transition-colors"
    >
      <span
        className="hidden sm:block w-7 text-[10px] tabular-nums text-stone-300 font-medium pt-0.5"
        style={{ fontFamily: "var(--font-mono, monospace)" }}
      >
        {(index + 1).toString().padStart(2, '0')}
      </span>

      <span
        aria-hidden
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full transition-all duration-300 group-hover:w-[4px]"
        style={{ backgroundColor: config.accent, opacity: 0.85 }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <h3
            className="text-[15.5px] leading-snug text-stone-900 truncate group-hover:text-stone-950 transition-colors"
            style={{ fontFamily: "var(--font-heading, 'Sole Serif Small', serif)", fontWeight: 500 }}
          >
            {project.name}
          </h3>
          {project.status && <StatusPill status={project.status} accent={config.accent} />}
        </div>
        {project.description && (
          <p className="mt-0.5 text-[12px] text-stone-500 truncate max-w-2xl">
            {project.description}
          </p>
        )}
      </div>

      <div className="hidden md:flex items-center gap-1.5 text-[12px] text-stone-500 tabular-nums w-12 justify-end">
        {project.teamCount > 0 && (
          <>
            <Users className="w-3 h-3 text-stone-400" strokeWidth={2} />
            <span>{project.teamCount}</span>
          </>
        )}
      </div>

      <div className="hidden md:flex items-center gap-2 w-32 justify-end">
        {project.totalTasks > 0 ? (
          <>
            <span
              className="text-[11px] tabular-nums text-stone-500"
              style={{ fontFamily: "var(--font-mono, monospace)" }}
            >
              {project.completedTasks}/{project.totalTasks}
            </span>
            <div className="w-16 h-1 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  backgroundColor: progress === 100 ? '#10b981' : config.accent,
                }}
              />
            </div>
          </>
        ) : (
          <span className="text-[11px] text-stone-300" style={{ fontFamily: "var(--font-mono, monospace)" }}>
            —
          </span>
        )}
      </div>

      <div
        className="hidden lg:block w-24 text-right text-[11px] text-stone-400"
        style={{ fontFamily: "var(--font-mono, monospace)" }}
      >
        {relativeDate(project.updatedAt)}
      </div>

      <span className="w-7 h-7 rounded-full flex items-center justify-center text-stone-300 group-hover:text-stone-900 group-hover:bg-stone-100 transition-all">
        <ArrowUpRight className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
      </span>
    </button>
  )
}

/* ============================================================
 * GRID CARD
 * ============================================================ */

function ProjectCard({
  project,
  config,
  onClick,
}: {
  project: ProjectSummary
  config: PoleConfig
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
      className="group relative w-full text-left bg-white rounded-2xl border border-stone-200/70 p-5 hover:border-stone-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.15)] transition-all duration-300"
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-90 group-hover:h-[3px] transition-all"
        style={{ backgroundColor: config.accent }}
      />

      <div className="flex items-start justify-between gap-3 mb-3">
        <h3
          className="text-[16px] leading-snug text-stone-900 line-clamp-2"
          style={{ fontFamily: "var(--font-heading, 'Sole Serif Small', serif)", fontWeight: 500 }}
        >
          {project.name}
        </h3>
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-stone-300 group-hover:text-stone-900 group-hover:bg-stone-100 transition-all shrink-0">
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
        </span>
      </div>

      {project.status && <StatusPill status={project.status} accent={config.accent} />}

      {project.description && (
        <p className="mt-3 text-[12.5px] text-stone-500 line-clamp-2 leading-relaxed">
          {project.description}
        </p>
      )}

      <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-3.5 text-[11.5px] text-stone-500">
          {project.teamCount > 0 && (
            <span className="flex items-center gap-1 tabular-nums">
              <Users className="w-3 h-3 text-stone-400" />
              {project.teamCount}
            </span>
          )}
          {project.totalTasks > 0 && (
            <span className="flex items-center gap-1 tabular-nums">
              <ListTodo className="w-3 h-3 text-stone-400" />
              {project.completedTasks}/{project.totalTasks}
            </span>
          )}
        </div>
        <span
          className="text-[10.5px] text-stone-400"
          style={{ fontFamily: "var(--font-mono, monospace)" }}
        >
          {relativeDate(project.updatedAt)}
        </span>
      </div>

      {project.totalTasks > 0 && (
        <div className="mt-3 h-[3px] bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              backgroundColor: progress === 100 ? '#10b981' : config.accent,
            }}
          />
        </div>
      )}
    </button>
  )
}

/* ============================================================
 * STATUS PILL
 * ============================================================ */

function StatusPill({ status, accent }: { status: string; accent: string }) {
  const isDone = COMPLETED_STATUSES.has(status)
  const color = isDone ? '#10b981' : accent

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider"
      style={{
        backgroundColor: `${color}12`,
        color: color,
        fontFamily: "var(--font-mono, monospace)",
        letterSpacing: '0.05em',
      }}
    >
      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
      {status}
    </span>
  )
}
