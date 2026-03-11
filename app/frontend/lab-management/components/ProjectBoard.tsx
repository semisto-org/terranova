import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { apiRequest } from '@/lib/api'
import { FolderKanban, ChevronRight, Plus } from 'lucide-react'
import { ProjectDetail } from './ProjectDetail'
import { ProjectCreateModal } from './ProjectCreateModal'
import { MemberAvatarStack, type MemberOption } from './MemberPicker'

interface ProjectSummary {
  id: string
  name: string
  description: string | null
  pole: string | null
  status: string
  leadName: string
  teamNames: string[]
  needsReclassification: boolean
  totalActions: number
  completedActions: number
  inProgressActions: number
  createdAt: string
}

const POLE_CONFIG: Record<string, { label: string; accent: string }> = {
  academy: { label: 'Academy', accent: '#B01A19' },
  design: { label: 'Design', accent: '#AFBD00' },
  nursery: { label: 'Nursery', accent: '#EF9B0D' },
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

const STATUS_GROUP_ORDER = ['En cours', 'En attente', 'Idée', 'Standby', 'Terminé', 'Annulé', 'No go']

export function ProjectBoard() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('active')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [members, setMembers] = useState<MemberOption[]>([])

  useEffect(() => {
    apiRequest('/api/v1/lab/members').then(res => {
      setMembers(res.items.map((m: any) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        avatar: m.avatar,
      })))
    }).catch(() => {})
  }, [])

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
    return items
  }, [projects, statusFilter])

  const groupedByStatus = useMemo(() => {
    const groups: Record<string, ProjectSummary[]> = {}
    for (const p of filtered) {
      if (!groups[p.status]) groups[p.status] = []
      groups[p.status].push(p)
    }
    const ordered = STATUS_GROUP_ORDER.filter(status => (groups[status]?.length ?? 0) > 0)
    const rest = Object.keys(groups).filter(s => !STATUS_GROUP_ORDER.includes(s))
    return [...ordered, ...rest].map(status => ({ status, items: groups[status] ?? [] }))
  }, [filtered])

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
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center rounded-lg border border-stone-200 bg-white p-0.5 shrink-0">
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
        <button
          onClick={() => setCreateModalOpen(true)}
          className="ml-auto w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#5B5781] text-white text-sm font-semibold hover:bg-[#4a4670] active:scale-[0.97] transition-all duration-200 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nouveau projet
        </button>
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
          <p className="text-xs text-stone-400 mt-1">Les projets apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByStatus.map(({ status, items }) => {
            const sc = STATUS_CONFIG[status] || STATUS_CONFIG['Standby']
            return (
              <section key={status}>
                <h2 className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
                  <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                  {status}
                  <span className="font-normal normal-case tracking-normal text-stone-400">({items.length})</span>
                </h2>
                <div className="space-y-2">
                  {items.map(project => {
                    const psc = STATUS_CONFIG[project.status] || STATUS_CONFIG['Standby']

                    return (
                      <button
                        key={project.id}
                        onClick={() => setSelectedProjectId(project.id)}
                        className="w-full text-left bg-white rounded-xl border border-stone-200 px-5 py-4 hover:border-stone-300 hover:shadow-md transition-all duration-300 ease-out group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${psc.dot} opacity-70 group-hover:opacity-100 transition-opacity`} />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 mb-1.5">
                              <h3 className="text-[15px] font-semibold text-stone-900 truncate group-hover:text-[#5B5781] transition-colors">
                                {project.name}
                              </h3>
                              {project.pole && POLE_CONFIG[project.pole] && (
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: `${POLE_CONFIG[project.pole].accent}18`, color: POLE_CONFIG[project.pole].accent }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: POLE_CONFIG[project.pole].accent }} />
                                  {POLE_CONFIG[project.pole].label}
                                </span>
                              )}
                            </div>

                            {(() => {
                              const allNames: string[] = []
                              if (project.leadName) allNames.push(project.leadName)
                              for (const name of (project.teamNames || [])) {
                                if (name !== project.leadName) allNames.push(name)
                              }
                              return allNames.length > 0 ? (
                                <MemberAvatarStack names={allNames} members={members} size={26} max={5} />
                              ) : null
                            })()}
                          </div>

                          <div className="flex items-center flex-shrink-0">
                            <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-[#5B5781] group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {createModalOpen && (
        <ProjectCreateModal
          onCreated={() => { setCreateModalOpen(false); load() }}
          onClose={() => setCreateModalOpen(false)}
        />
      )}
    </div>
  )
}
