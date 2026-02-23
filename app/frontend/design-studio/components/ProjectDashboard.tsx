import { useState, useMemo } from 'react'
import type { ProjectDashboardProps, Project, ProjectPhase, ProjectStatus } from '../types'
import { ProjectsMap } from './ProjectsMap'

const phaseLabels: Record<ProjectPhase, string> = {
  'offre': 'Offre',
  'pre-projet': 'Pré-projet',
  'projet-detaille': 'Projet détaillé',
  'mise-en-oeuvre': 'Mise en œuvre',
  'co-gestion': 'Co-gestion',
  'termine': 'Autonome',
}

const phaseColors: Record<ProjectPhase, { bg: string; text: string; dot: string; border: string }> = {
  'offre': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', border: 'border-amber-200' },
  'pre-projet': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400', border: 'border-orange-200' },
  'projet-detaille': { bg: 'bg-[#e1e6d8]', text: 'text-[#6B7A00]', dot: 'bg-[#AFBD00]', border: 'border-[#AFBD00]/30' },
  'mise-en-oeuvre': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  'co-gestion': { bg: 'bg-[#c8bfd2]/30', text: 'text-[#5B5781]', dot: 'bg-[#5B5781]', border: 'border-[#5B5781]/30' },
  'termine': { bg: 'bg-stone-100', text: 'text-stone-600', dot: 'bg-stone-400', border: 'border-stone-300' },
}

const phaseOrder: ProjectPhase[] = ['offre', 'pre-projet', 'projet-detaille', 'mise-en-oeuvre', 'co-gestion', 'termine']

export function ProjectDashboard({
  projects,
  stats,
  templates,
  onViewProject,
  onEditProject,
  onDeleteProject,
  onCreateProject,
  onDuplicateProject
}: ProjectDashboardProps) {
  const [selectedStatuses, setSelectedStatuses] = useState<Set<ProjectStatus>>(new Set(['active', 'pending']))
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedPhases, setCollapsedPhases] = useState<Set<ProjectPhase>>(() => new Set(phaseOrder))

  const filteredProjects = useMemo(() => {
    let result = projects.filter(p => p.status !== 'archived')

    if (selectedStatuses.size > 0) {
      result = result.filter(p => selectedStatuses.has(p.status))
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.clientName.toLowerCase().includes(query) ||
        p.address.toLowerCase().includes(query)
      )
    }

    result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return result
  }, [projects, selectedStatuses, searchQuery])

  const projectsByPhase = useMemo(() => {
    const grouped = new Map<ProjectPhase, Project[]>()
    for (const phase of phaseOrder) {
      const phaseProjects = filteredProjects.filter(p => p.phase === phase)
      if (phaseProjects.length > 0) {
        grouped.set(phase, phaseProjects)
      }
    }
    return grouped
  }, [filteredProjects])

  const toggleCollapse = (phase: ProjectPhase) => {
    setCollapsedPhases(prev => {
      const next = new Set(prev)
      if (next.has(phase)) {
        next.delete(phase)
      } else {
        next.add(phase)
      }
      return next
    })
  }

  const clearFilters = () => {
    setSelectedStatuses(new Set(['active', 'pending']))
    setSearchQuery('')
  }

  const toggleStatus = (status: ProjectStatus) => {
    setSelectedStatuses(prev => {
      const next = new Set(prev)
      if (next.has(status)) {
        next.delete(status)
      } else {
        next.add(status)
      }
      return next
    })
  }

  const selectAllStatuses = () => {
    setSelectedStatuses(new Set(['active', 'pending', 'completed']))
  }

  const hasActiveFilters = selectedStatuses.size !== 2 || !selectedStatuses.has('active') || !selectedStatuses.has('pending') || searchQuery.trim()

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-BE', {
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-stone-200 bg-white">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#AFBD00] via-transparent to-[#5B5781]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-8 rounded-full bg-[#AFBD00]" />
                <h1 className="text-3xl sm:text-4xl font-serif font-medium text-stone-900 tracking-tight">
                  Design Studio
                </h1>
              </div>
              <p className="text-stone-600 ml-5">
                {stats.totalProjects} projet{stats.totalProjects > 1 ? 's' : ''} · {stats.activeProjects} en cours
              </p>
            </div>

            <div className="relative group">
              <button
                onClick={() => onCreateProject?.()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#AFBD00] hover:bg-[#9BAA00] text-stone-900 font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nouveau projet
              </button>

              {templates.length > 0 && (
                <div className="absolute right-0 mt-2 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                  <div className="bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                        Depuis un template
                      </span>
                    </div>
                    {templates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => onCreateProject?.(template.id)}
                        className="w-full px-4 py-3 text-left hover:bg-stone-50 transition-colors"
                      >
                        <div className="font-medium text-stone-900">{template.name}</div>
                        <div className="text-sm text-stone-500">{template.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upcoming meetings */}
        {stats.upcomingMeetings.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">
              Prochaines réunions
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              {stats.upcomingMeetings.map(meeting => (
                <button
                  key={meeting.id}
                  onClick={() => onViewProject?.(meeting.projectId)}
                  className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-stone-200 hover:border-[#AFBD00] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#e1e6d8] flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-[#7A8500]">
                      {new Date(meeting.date).toLocaleDateString('fr-BE', { day: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-stone-600 uppercase">
                      {new Date(meeting.date).toLocaleDateString('fr-BE', { month: 'short' })}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-stone-900 group-hover:text-[#AFBD00] transition-colors">
                      {meeting.title}
                    </div>
                    <div className="text-sm text-stone-500">
                      {meeting.projectName} · {meeting.time}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher un projet, client, lieu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-stone-400 uppercase tracking-wider mr-1">Statut</span>
                {[
                  { id: 'active' as ProjectStatus, label: 'En cours', color: 'emerald' },
                  { id: 'pending' as ProjectStatus, label: 'En attente', color: 'amber' },
                  { id: 'completed' as ProjectStatus, label: 'Terminés', color: 'stone' },
                ].map(({ id, label, color }) => {
                  const isSelected = selectedStatuses.has(id)
                  const colorStyles = {
                    emerald: isSelected ? 'bg-emerald-500/15 text-emerald-700 border-emerald-300' : 'border-stone-200 text-stone-600 hover:border-emerald-300',
                    amber: isSelected ? 'bg-amber-500/15 text-amber-700 border-amber-300' : 'border-stone-200 text-stone-600 hover:border-amber-300',
                    stone: isSelected ? 'bg-stone-200 text-stone-700 border-stone-300' : 'border-stone-200 text-stone-600 hover:border-stone-300',
                  }
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleStatus(id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${colorStyles[color]}`}
                    >
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                      )}
                      {label}
                    </button>
                  )
                })}
                {selectedStatuses.size < 3 && (
                  <button
                    type="button"
                    onClick={selectAllStatuses}
                    className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  >
                    Tous
                  </button>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Effacer filtres
                </button>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="mb-6">
            <ProjectsMap
              projects={filteredProjects}
              onViewProject={onViewProject}
            />
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-stone-500">
              {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''}
              {hasActiveFilters && ` sur ${projects.filter(p => p.status !== 'archived').length}`}
            </p>
          </div>

          {/* Table grouped by phase */}
          {filteredProjects.length > 0 ? (
            <div className="space-y-4">
              {Array.from(projectsByPhase.entries()).map(([phase, phaseProjects]) => {
                const colors = phaseColors[phase]
                const isCollapsed = collapsedPhases.has(phase)

                return (
                  <div key={phase} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                    {/* Phase group header */}
                    <button
                      onClick={() => toggleCollapse(phase)}
                      className={`w-full flex items-center gap-3 px-5 py-3 ${colors.bg} border-b ${colors.border} hover:brightness-95 transition-all`}
                    >
                      <svg
                        className={`w-4 h-4 ${colors.text} transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                      <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                      <span className={`font-medium ${colors.text}`}>
                        {phaseLabels[phase]}
                      </span>
                      <span className={`text-sm opacity-70 ${colors.text}`}>
                        ({phaseProjects.length})
                      </span>
                    </button>

                    {/* Table */}
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-stone-100">
                              <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wider px-5 py-2.5 w-[28%]">Projet</th>
                              <th className="text-center text-xs font-medium text-stone-400 uppercase tracking-wider px-3 py-2.5 w-[10%]">Équipe</th>
                              <th className="text-right text-xs font-medium text-stone-400 uppercase tracking-wider px-3 py-2.5 w-[8%]">Surface</th>
                              <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wider px-3 py-2.5 w-[18%]">Budget heures</th>
                              <th className="text-right text-xs font-medium text-stone-400 uppercase tracking-wider px-5 py-2.5 w-[6%]"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {phaseProjects.map((project, idx) => {
                              const budgetProgress = project.budget.hoursPlanned > 0
                                ? Math.round((project.budget.hoursWorked / project.budget.hoursPlanned) * 100)
                                : 0
                              const isLast = idx === phaseProjects.length - 1

                              return (
                                <tr
                                  key={project.id}
                                  onClick={() => onViewProject?.(project.id)}
                                  className={`group cursor-pointer hover:bg-stone-50 transition-colors ${!isLast ? 'border-b border-stone-50' : ''}`}
                                >
                                  {/* Project name + address */}
                                  <td className="px-5 py-3">
                                    <div className="font-medium text-stone-900 group-hover:text-[#AFBD00] transition-colors truncate">
                                      {project.name}
                                    </div>
                                    {project.address && (
                                      <div className="text-xs text-stone-400 truncate mt-0.5" title={project.address}>
                                        {project.address.length > 30 ? `${project.address.slice(0, 30)}…` : project.address}
                                      </div>
                                    )}
                                  </td>

                                  {/* Team avatars stack */}
                                  <td className="px-3 py-3">
                                    <div className="flex justify-center">
                                      {(project.teamMembers?.length ?? 0) > 0 ? (
                                        <div className="flex -space-x-2" title={(project.teamMembers ?? []).map((m) => m.memberName).filter(Boolean).join(', ')}>
                                          {(project.teamMembers ?? []).slice(0, 4).map((member) => (
                                            <div
                                              key={member.id}
                                              className="w-8 h-8 rounded-full border-2 border-white bg-[#e1e6d8] flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-stone-200"
                                            >
                                              {member.memberAvatar ? (
                                                <img
                                                  src={member.memberAvatar}
                                                  alt=""
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <span className="text-xs font-semibold text-[#6B7A00]">
                                                  {(member.memberName || '?').charAt(0).toUpperCase()}
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                          {(project.teamMembers?.length ?? 0) > 4 && (
                                            <div className="w-8 h-8 rounded-full border-2 border-white bg-stone-200 flex items-center justify-center shrink-0 ring-1 ring-stone-200 text-xs font-medium text-stone-600">
                                              +{(project.teamMembers?.length ?? 0) - 4}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-xs text-stone-300">—</span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Area */}
                                  <td className="px-3 py-3 text-right">
                                    <span className="text-sm text-stone-600 tabular-nums">
                                      {project.area > 0 ? `${project.area} m²` : '—'}
                                    </span>
                                  </td>

                                  {/* Budget hours with progress bar */}
                                  <td className="px-3 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                              budgetProgress > 90 ? 'bg-red-500' :
                                              budgetProgress > 70 ? 'bg-amber-500' :
                                              'bg-[#AFBD00]'
                                            }`}
                                            style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                                          />
                                        </div>
                                      </div>
                                      <span className="text-xs text-stone-500 tabular-nums whitespace-nowrap">
                                        {project.budget.hoursWorked}h / {project.budget.hoursPlanned}h
                                      </span>
                                    </div>
                                  </td>

                                  {/* Actions */}
                                  <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); onDuplicateProject?.(project.id) }}
                                        title="Dupliquer"
                                        className="p-1.5 text-stone-400 hover:text-[#AFBD00] rounded-lg hover:bg-stone-100 transition-colors"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteProject?.(project.id) }}
                                        title="Supprimer"
                                        className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-stone-100 transition-colors"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-stone-900 mb-1">
                Aucun projet trouvé
              </h3>
              <p className="text-stone-500 mb-4">
                Essayez de modifier vos filtres ou votre recherche
              </p>
              <button
                onClick={clearFilters}
                className="text-[#AFBD00] hover:text-[#8A9A00] font-medium transition-colors"
              >
                Effacer tous les filtres
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
