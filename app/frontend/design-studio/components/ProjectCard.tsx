import type { Project, ProjectPhase } from '../types'

interface ProjectCardProps {
  project: Project
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
}

const phaseLabels: Record<ProjectPhase, string> = {
  'offre': 'Offre',
  'pre-projet': 'Pré-projet',
  'projet-detaille': 'Projet détaillé',
  'mise-en-oeuvre': 'Mise en œuvre',
  'co-gestion': 'Co-gestion'
}

const phaseColors: Record<ProjectPhase, { bg: string; text: string; dot: string }> = {
  'offre': { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-400' },
  'pre-projet': { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-400' },
  'projet-detaille': { bg: 'bg-[#e1e6d8] dark:bg-[#AFBD00]/20', text: 'text-[#6B7A00] dark:text-[#AFBD00]', dot: 'bg-[#AFBD00]' },
  'mise-en-oeuvre': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'co-gestion': { bg: 'bg-[#c8bfd2] dark:bg-[#5B5781]/20', text: 'text-[#5B5781] dark:text-[#9B94BB]', dot: 'bg-[#5B5781]' }
}

export function ProjectCard({
  project,
  onView,
  onEdit,
  onDelete,
  onDuplicate
}: ProjectCardProps) {
  const budgetProgress = project.budget.hoursPlanned > 0
    ? Math.round((project.budget.hoursWorked / project.budget.hoursPlanned) * 100)
    : 0

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('fr-BE', {
      day: 'numeric',
      month: 'short'
    })
  }

  const colors = phaseColors[project.phase]

  return (
    <div
      onClick={onView}
      className="group bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden cursor-pointer hover:border-[#AFBD00] dark:hover:border-[#AFBD00] hover:shadow-lg transition-all duration-200"
    >
      {/* Phase color bar */}
      <div className={`h-1.5 ${colors.dot}`} />

      <div className="p-5">
        {/* Header with phase and status badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Phase badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {phaseLabels[project.phase]}
            </span>

            {/* Status indicator */}
            {project.status === 'pending' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400">
                En attente
              </span>
            )}
          </div>

          {/* Actions menu */}
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                // In real app, would open a dropdown menu
              }}
              className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Project name */}
        <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-1 group-hover:text-[#AFBD00] transition-colors line-clamp-2">
          {project.name}
        </h3>

        {/* Client */}
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 flex items-center gap-1.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="truncate">{project.clientName}</span>
        </p>

        {/* Quick stats */}
        <div className="flex items-center gap-4 text-sm text-stone-600 dark:text-stone-400 mb-4">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            <span>{project.area} m²</span>
          </div>

          {project.plantingDate && (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <span>{formatDate(project.plantingDate)}</span>
            </div>
          )}

          {project.startDate && !project.plantingDate && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>{formatDate(project.startDate)}</span>
            </div>
          )}
        </div>

        {/* Budget progress */}
        <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-stone-500 dark:text-stone-400">Budget heures</span>
            <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
              {project.budget.hoursWorked}h / {project.budget.hoursPlanned}h
            </span>
          </div>
          <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetProgress > 90 ? 'bg-red-500' :
                budgetProgress > 70 ? 'bg-amber-500' :
                'bg-[#AFBD00]'
              }`}
              style={{ width: `${Math.min(budgetProgress, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-stone-500 dark:text-stone-400">
            <span>{project.budget.hoursBilled}h facturées</span>
            <span>{project.budget.hoursSemos}h Semos</span>
          </div>
        </div>

        {/* Hover actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-100 dark:border-stone-700 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.() }}
            className="flex-1 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-[#AFBD00] dark:hover:text-[#AFBD00] py-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
          >
            Modifier
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate?.() }}
            className="flex-1 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-[#AFBD00] dark:hover:text-[#AFBD00] py-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
          >
            Dupliquer
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.() }}
            className="flex-1 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-red-500 dark:hover:text-red-400 py-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}
