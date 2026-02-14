import { useState, useMemo } from 'react'
import type { ProjectDashboardProps, Project, ProjectPhase, ProjectStatus } from '../types'
import { ProjectCard } from './ProjectCard'
import { StatsCard } from './StatsCard'

// Design tokens: primary=#AFBD00 (design pole), secondary=#5B5781, neutral=stone
// Typography: Sole Serif Small (headings), Inter (body)

const phaseLabels: Record<ProjectPhase, string> = {
  'offre': 'Offre',
  'pre-projet': 'Pré-projet',
  'projet-detaille': 'Projet détaillé',
  'mise-en-oeuvre': 'Mise en œuvre',
  'co-gestion': 'Co-gestion'
}

const phaseOrder: ProjectPhase[] = ['offre', 'pre-projet', 'projet-detaille', 'mise-en-oeuvre', 'co-gestion']

type SortOption = 'name' | 'date' | 'budget' | 'area'

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
  // Filter state
  const [selectedPhases, setSelectedPhases] = useState<ProjectPhase[]>([])
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date')

  // Get unique project managers for filter
  const projectManagers = useMemo(() => {
    const pms = new Map<string, string>()
    projects.forEach(p => {
      // In real app, we'd have PM name from teamMembers
      pms.set(p.projectManagerId, p.projectManagerId)
    })
    return Array.from(pms.entries())
  }, [projects])

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = projects.filter(p => p.status !== 'archived')

    // Phase filter
    if (selectedPhases.length > 0) {
      result = result.filter(p => selectedPhases.includes(p.phase))
    }

    // Status filter
    if (selectedStatus !== 'all') {
      result = result.filter(p => p.status === selectedStatus)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.clientName.toLowerCase().includes(query) ||
        p.address.toLowerCase().includes(query)
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'budget':
          const aProgress = a.budget.hoursPlanned > 0 ? a.budget.hoursWorked / a.budget.hoursPlanned : 0
          const bProgress = b.budget.hoursPlanned > 0 ? b.budget.hoursWorked / b.budget.hoursPlanned : 0
          return bProgress - aProgress
        case 'area':
          return b.area - a.area
        default:
          return 0
      }
    })

    return result
  }, [projects, selectedPhases, selectedStatus, searchQuery, sortBy])

  const togglePhase = (phase: ProjectPhase) => {
    setSelectedPhases(prev =>
      prev.includes(phase)
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    )
  }

  const clearFilters = () => {
    setSelectedPhases([])
    setSelectedStatus('all')
    setSearchQuery('')
  }

  const hasActiveFilters = selectedPhases.length > 0 || selectedStatus !== 'all' || searchQuery.trim()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Header with organic gradient accent */}
      <header className="relative overflow-hidden border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        {/* Decorative gradient inspired by forest layers */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#AFBD00] via-transparent to-[#5B5781]" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#AFBD00]/20 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-8 rounded-full bg-[#AFBD00]" />
                <h1 className="text-3xl sm:text-4xl font-serif font-medium text-stone-900 dark:text-stone-100 tracking-tight">
                  Design Studio
                </h1>
              </div>
              <p className="text-stone-600 dark:text-stone-400 ml-5">
                {stats.totalProjects} projet{stats.totalProjects > 1 ? 's' : ''} · {stats.activeProjects} en cours
              </p>
            </div>

            {/* Create project dropdown */}
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

              {/* Template dropdown on hover */}
              {templates.length > 0 && (
                <div className="absolute right-0 mt-2 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                  <div className="bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                    <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-700">
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                        Depuis un template
                      </span>
                    </div>
                    {templates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => onCreateProject?.(template.id)}
                        className="w-full px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                      >
                        <div className="font-medium text-stone-900 dark:text-stone-100">
                          {template.name}
                        </div>
                        <div className="text-sm text-stone-500 dark:text-stone-400">
                          {template.description}
                        </div>
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
        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            label="Projets actifs"
            value={stats.activeProjects}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            }
            accent="primary"
          />
          <StatsCard
            label="Heures ce mois"
            value={stats.totalHoursThisMonth}
            suffix="h"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            label="CA annuel"
            value={formatCurrency(stats.totalRevenueThisYear)}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            }
            accent="secondary"
          />
          <StatsCard
            label="Taux conversion"
            value={`${Math.round(stats.quoteConversionRate * 100)}%`}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </section>

        {/* Upcoming meetings */}
        {stats.upcomingMeetings.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
              Prochaines réunions
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              {stats.upcomingMeetings.map(meeting => (
                <button
                  key={meeting.id}
                  onClick={() => onViewProject?.(meeting.projectId)}
                  className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-[#AFBD00] dark:hover:border-[#AFBD00] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#e1e6d8] dark:bg-[#AFBD00]/20 flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-[#7A8500] dark:text-[#AFBD00]">
                      {new Date(meeting.date).toLocaleDateString('fr-BE', { day: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-stone-600 dark:text-stone-400 uppercase">
                      {new Date(meeting.date).toLocaleDateString('fr-BE', { month: 'short' })}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-stone-900 dark:text-stone-100 group-hover:text-[#AFBD00] transition-colors">
                      {meeting.title}
                    </div>
                    <div className="text-sm text-stone-500 dark:text-stone-400">
                      {meeting.projectName} · {meeting.time}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Filters and Projects Grid */}
        <section>
          <div className="flex flex-col gap-4 mb-6">
            {/* Search and Sort row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher un projet, client, lieu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent transition-shadow"
                />
              </div>

              {/* Sort dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent cursor-pointer"
              >
                <option value="date">Activité récente</option>
                <option value="name">Nom A-Z</option>
                <option value="budget">Budget consommé</option>
                <option value="area">Surface</option>
              </select>
            </div>

            {/* Phase filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-stone-500 dark:text-stone-400 mr-1">Phase :</span>
              {phaseOrder.map(phase => (
                <button
                  key={phase}
                  onClick={() => togglePhase(phase)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedPhases.includes(phase)
                      ? 'bg-[#AFBD00] text-stone-900'
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-[#AFBD00] dark:hover:border-[#AFBD00]'
                  }`}
                >
                  <PhaseIndicator phase={phase} small />
                  {phaseLabels[phase]}
                </button>
              ))}

              {/* Status filter */}
              <div className="w-px h-6 bg-stone-200 dark:bg-stone-700 mx-2 hidden sm:block" />

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ProjectStatus | 'all')}
                className="px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full text-sm text-stone-600 dark:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent cursor-pointer"
              >
                <option value="all">Tous statuts</option>
                <option value="active">En cours</option>
                <option value="pending">En attente</option>
                <option value="completed">Terminés</option>
              </select>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Effacer filtres
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''}
              {hasActiveFilters && ` sur ${projects.filter(p => p.status !== 'archived').length}`}
            </p>
          </div>

          {/* Projects Grid */}
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onView={() => onViewProject?.(project.id)}
                  onEdit={() => onEditProject?.(project.id)}
                  onDelete={() => onDeleteProject?.(project.id)}
                  onDuplicate={() => onDuplicateProject?.(project.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-1">
                Aucun projet trouvé
              </h3>
              <p className="text-stone-500 dark:text-stone-400 mb-4">
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

// Phase indicator dot with color coding
function PhaseIndicator({ phase, small = false }: { phase: ProjectPhase; small?: boolean }) {
  const colors: Record<ProjectPhase, string> = {
    'offre': 'bg-amber-400',
    'pre-projet': 'bg-orange-400',
    'projet-detaille': 'bg-[#AFBD00]',
    'mise-en-oeuvre': 'bg-emerald-500',
    'co-gestion': 'bg-[#5B5781]'
  }

  return (
    <div className={`rounded-full ${colors[phase]} ${small ? 'w-2 h-2' : 'w-2.5 h-2.5'}`} />
  )
}
