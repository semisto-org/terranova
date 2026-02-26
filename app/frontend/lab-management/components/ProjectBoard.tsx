import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { apiRequest } from '@/lib/api'
import { Search, FolderKanban, ChevronRight, Users, CheckCircle2, Circle } from 'lucide-react'
import { ProjectDetail } from './ProjectDetail'

interface ProjectSummary {
  id: string
  name: string
  status: string
  leadName: string
  teamNames: string[]
  needsReclassification: boolean
  totalActions: number
  completedActions: number
  createdAt: string
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  'Idée': { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-400' },
  'En attente': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  'En cours': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Standby': { bg: 'bg-stone-100', text: 'text-stone-600', dot: 'bg-stone-400' },
  'Terminé': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Annulé': { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
  'No go': { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
}

const FILTER_TABS = [
  { id: 'active', label: 'Actifs' },
  { id: 'all', label: 'Tous' },
  { id: 'Terminé', label: 'Terminés' },
  { id: 'Standby', label: 'Standby' },
]

export function ProjectBoard() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiRequest('/api/v1/lab/projects')
      setProjects(res.items)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    let items = projects
    if (statusFilter === 'active') {
      items = items.filter(p => ['En cours', 'En attente', 'Idée'].includes(p.status))
    } else if (statusFilter !== 'all') {
      items = items.filter(p => p.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.leadName?.toLowerCase().includes(q)
      )
    }
    return items
  }, [projects, statusFilter, search])

  const stats = useMemo(() => {
    const active = projects.filter(p => ['En cours', 'En attente', 'Idée'].includes(p.status)).length
    return { active, total: projects.length }
  }, [projects])

  if (selectedProjectId) {
    return (
      <ProjectDetail
        projectId={selectedProjectId}
        onBack={() => { setSelectedProjectId(null); load() }}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          Projets
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          {stats.active} projet{stats.active !== 1 ? 's' : ''} actif{stats.active !== 1 ? 's' : ''} sur {stats.total}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]"
          />
        </div>
        <div className="flex items-center rounded-lg border border-stone-200 bg-white p-0.5">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                statusFilter === tab.id
                  ? 'bg-[#5B5781] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-7 h-7 border-2 border-stone-200 border-t-[#5B5781] rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400">
          <FolderKanban className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium text-stone-500">Aucun projet trouvé</p>
          <p className="text-xs text-stone-400 mt-1">
            {search ? 'Essayez un autre terme de recherche' : 'Les projets apparaîtront ici'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(project => {
            const sc = STATUS_CONFIG[project.status] || STATUS_CONFIG['Standby']
            const progress = project.totalActions > 0
              ? Math.round((project.completedActions / project.totalActions) * 100)
              : null

            return (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className="w-full text-left bg-white rounded-xl border border-stone-200 px-5 py-4 hover:border-stone-300 hover:shadow-md transition-all duration-300 ease-out group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${sc.dot} opacity-70 group-hover:opacity-100 transition-opacity`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <h3 className="text-[15px] font-semibold text-stone-900 truncate group-hover:text-[#5B5781] transition-colors">
                        {project.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {project.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-stone-500">
                      {project.leadName && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {project.leadName}
                        </span>
                      )}
                      {project.teamNames?.length > 0 && (
                        <span className="truncate max-w-[200px]">{project.teamNames.join(', ')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {project.totalActions > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-stone-500">
                          {progress === 100 ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Circle className="w-3.5 h-3.5" />
                          )}
                          <span className="tabular-nums">
                            {project.completedActions}/{project.totalActions}
                          </span>
                        </div>
                        <div className="w-16 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: progress === 100 ? '#10b981' : '#5B5781',
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-[#5B5781] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
