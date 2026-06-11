import { useCallback, useEffect, useMemo, useState } from 'react'
import { router } from '@inertiajs/react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Paintbrush,
  GraduationCap,
  FlaskConical,
  Shield,
  FolderKanban,
  Pin,
  PinOff,
  Users,
  ListTodo,
  ArrowRight,
  GripVertical,
} from 'lucide-react'
import { MyTasksDashboard } from '@/components/tasks'
import { apiRequest } from '@/lib/api'

interface BoardProject {
  id: string
  name: string
  typeKey: string
  status: string | null
  description: string
  teamCount: number
  totalTasks: number
  completedTasks: number
  updatedAt: string
  membershipId: string
  accent: string | null
  pinnedAt: string | null
  position: number | null
  lastVisitedAt: string | null
  hasActivity: boolean
}

type TypeConfig = { label: string; accent: string; icon: typeof Paintbrush }

const TYPE_CONFIG: Record<string, TypeConfig> = {
  'design-project': { label: 'Design Studio', accent: '#AFBD00', icon: Paintbrush },
  training: { label: 'Academy', accent: '#B01A19', icon: GraduationCap },
  'lab-project': { label: 'Gestion du Lab', accent: '#5B5781', icon: FlaskConical },
  guild: { label: 'Guildes', accent: '#234766', icon: Shield },
}

const configFor = (typeKey: string): TypeConfig =>
  TYPE_CONFIG[typeKey] || { label: typeKey, accent: '#78716C', icon: FolderKanban }

const projectKey = (p: BoardProject) => `${p.typeKey}:${p.id}`

export default function MyProjectsGrid() {
  const [projects, setProjects] = useState<BoardProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiRequest('/api/v1/my-projects/board')
      setProjects(res.projects || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const pinned = useMemo(() => projects.filter((p) => p.pinnedAt), [projects])
  const unpinned = useMemo(() => projects.filter((p) => !p.pinnedAt), [projects])

  // Persiste l'ordre + l'épinglage courants ; envoie épinglés puis non épinglés.
  const persist = useCallback(async (next: BoardProject[]) => {
    const ordered = [...next.filter((p) => p.pinnedAt), ...next.filter((p) => !p.pinnedAt)]
    try {
      await apiRequest('/api/v1/my-projects/reorder', {
        method: 'PATCH',
        body: JSON.stringify({
          items: ordered.map((p) => ({ type: p.typeKey, id: p.id, pinned: !!p.pinnedAt })),
        }),
      })
    } catch {
      // En cas d'échec réseau, on recharge l'état serveur faisant foi.
      load()
    }
  }, [load])

  // Réordonne une sous-liste (épinglés OU non épinglés) puis persiste.
  const handleDragEnd = useCallback((scope: 'pinned' | 'unpinned') => (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setProjects((prev) => {
      const sub = prev.filter((p) => (scope === 'pinned' ? p.pinnedAt : !p.pinnedAt))
      const others = prev.filter((p) => (scope === 'pinned' ? !p.pinnedAt : p.pinnedAt))
      const from = sub.findIndex((p) => projectKey(p) === active.id)
      const to = sub.findIndex((p) => projectKey(p) === over.id)
      if (from === -1 || to === -1) return prev
      const reordered = arrayMove(sub, from, to)
      const next = scope === 'pinned' ? [...reordered, ...others] : [...others, ...reordered]
      persist(next)
      return next
    })
  }, [persist])

  const togglePin = useCallback((target: BoardProject) => {
    setProjects((prev) => {
      const next = prev.map((p) =>
        projectKey(p) === projectKey(target)
          ? { ...p, pinnedAt: p.pinnedAt ? null : new Date().toISOString() }
          : p
      )
      persist(next)
      return next
    })
  }, [persist])

  const openProject = useCallback((p: BoardProject) => {
    router.visit(`/projects/${p.typeKey}/${p.id}`)
  }, [])

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto">
      {/* ============ HEADER ============ */}
      <header className="mb-8 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div
            className="flex items-center gap-2 mb-3 text-[10px] tracking-[0.22em] uppercase text-stone-500 font-medium"
            style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
          >
            <span className="inline-block w-6 h-px bg-stone-400" />
            <span>Mon accueil</span>
          </div>
          <h1
            className="text-[40px] sm:text-[48px] leading-[0.95] tracking-tight text-stone-900"
            style={{ fontFamily: "var(--font-heading, 'Sole Serif Small', serif)" }}
          >
            Mes <span className="italic text-stone-400">projets</span>
          </h1>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-stone-500">
            Les projets dont je fais partie, tous pôles confondus. Épinglez vos
            essentiels et réordonnez par glisser-déposer.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.visit('/projects')}
          className="group inline-flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full border border-stone-200 bg-white text-stone-700 text-[13px] font-medium hover:border-stone-300 hover:text-stone-900 transition-all"
        >
          <span>Voir tous les projets</span>
          <span className="w-6 h-6 rounded-full bg-stone-100 group-hover:bg-stone-200 flex items-center justify-center transition-colors">
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-[#5B5781] rounded-full" />
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-50/70 border border-red-200/80 px-6 py-5 text-sm text-red-800">
          <div className="font-medium mb-1">Une erreur est survenue</div>
          <div className="text-red-700/80">{error}</div>
          <button onClick={load} className="mt-3 text-xs font-medium underline underline-offset-2 hover:no-underline">
            Réessayer
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-stone-400 rounded-2xl border border-dashed border-stone-200 bg-white/40">
          <FolderKanban className="w-14 h-14 opacity-20 mb-4" strokeWidth={1.25} />
          <p className="text-sm font-medium text-stone-600">Vous n'êtes membre d'aucun projet</p>
          <button
            onClick={() => router.visit('/projects')}
            className="mt-3 text-xs font-medium text-stone-600 underline underline-offset-2 hover:text-stone-900"
          >
            Parcourir tous les projets
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {pinned.length > 0 && (
            <section>
              <GroupHeader label="Épinglés" count={pinned.length} />
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd('pinned')}>
                <SortableContext items={pinned.map(projectKey)} strategy={rectSortingStrategy}>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {pinned.map((p) => (
                      <SortableCard key={projectKey(p)} project={p} onOpen={openProject} onTogglePin={togglePin} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </section>
          )}

          <section>
            {pinned.length > 0 && <GroupHeader label="Mes projets" count={unpinned.length} />}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd('unpinned')}>
              <SortableContext items={unpinned.map(projectKey)} strategy={rectSortingStrategy}>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {unpinned.map((p) => (
                    <SortableCard key={projectKey(p)} project={p} onOpen={openProject} onTogglePin={togglePin} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </section>
        </div>
      )}

      {/* ============ APERÇUS — Mes assignations / Prochaines échéances ============ */}
      <section className="mt-12">
        <GroupHeader label="Mes tâches" />
        <MyTasksDashboard
          onNavigateToProject={(type, id) => router.visit(`/projects/${type}/${id}`)}
        />
      </section>
    </div>
  )
}

function GroupHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2
        className="text-[12px] font-semibold uppercase tracking-wider text-stone-700"
        style={{ fontFamily: "var(--font-mono, monospace)", letterSpacing: '0.08em' }}
      >
        {label}
      </h2>
      {count != null && (
        <span
          className="tabular-nums text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500"
          style={{ fontFamily: "var(--font-mono, monospace)" }}
        >
          {count.toString().padStart(2, '0')}
        </span>
      )}
      <span className="flex-1 h-px bg-stone-100" />
    </div>
  )
}

function SortableCard({
  project,
  onOpen,
  onTogglePin,
}: {
  project: BoardProject
  onOpen: (p: BoardProject) => void
  onTogglePin: (p: BoardProject) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: projectKey(project),
  })
  const cfg = configFor(project.typeKey)
  const Icon = cfg.icon
  const accent = project.accent || cfg.accent
  const progress = project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-white rounded-2xl border border-stone-200/70 p-5 hover:border-stone-300 hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.15)] transition-all"
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-90"
        style={{ backgroundColor: accent }}
      />

      {/* Top row: type badge + activity dot + pin + drag handle */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider"
          style={{ backgroundColor: `${accent}12`, color: accent, fontFamily: "var(--font-mono, monospace)" }}
        >
          <Icon className="w-3 h-3" />
          {cfg.label}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {project.hasActivity && (
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: accent }}
              title="Activité depuis votre dernière visite"
              aria-label="Activité depuis votre dernière visite"
            />
          )}
          <button
            type="button"
            onClick={() => onTogglePin(project)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              project.pinnedAt ? 'text-[#5B5781]' : 'text-stone-300 hover:text-stone-600'
            }`}
            title={project.pinnedAt ? 'Désépingler' : 'Épingler'}
            aria-label={project.pinnedAt ? 'Désépingler' : 'Épingler'}
          >
            {project.pinnedAt ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            className="w-6 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-stone-600 cursor-grab active:cursor-grabbing touch-none"
            title="Réordonner"
            aria-label="Réordonner"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Clickable body → ouvre le projet */}
      <button type="button" onClick={() => onOpen(project)} className="block w-full text-left">
        <h3
          className="text-[16px] leading-snug text-stone-900 line-clamp-2"
          style={{ fontFamily: "var(--font-heading, 'Sole Serif Small', serif)", fontWeight: 500 }}
        >
          {project.name}
        </h3>

        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-3.5 text-[11.5px] text-stone-500">
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

        {project.totalTasks > 0 && (
          <div className="mt-3 h-[3px] bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#10b981' : accent }}
            />
          </div>
        )}
      </button>
    </div>
  )
}
