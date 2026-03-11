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
  'co-gestion': 'Co-gestion',
  'termine': 'Autonome',
}

const phaseColors: Record<ProjectPhase, { bg: string; text: string; dot: string }> = {
  'offre': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  'pre-projet': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  'projet-detaille': { bg: 'bg-[#e1e6d8]', text: 'text-[#6B7A00]', dot: 'bg-[#AFBD00]' },
  'mise-en-oeuvre': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'co-gestion': { bg: 'bg-[#c8bfd2]', text: 'text-[#5B5781]', dot: 'bg-[#5B5781]' },
  termine: { bg: 'bg-stone-100', text: 'text-stone-600', dot: 'bg-stone-400' },
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

  const colors = phaseColors[project.phase]

  // Get unique team members (avoid duplicates)
  const uniqueTeamMembers = project.teamMembers 
    ? Array.from(new Map(project.teamMembers.map(m => [m.memberName, m])).values()).slice(0, 2)
    : []

  return (
    <div
      onClick={onView}
      className="group bg-white rounded-2xl border border-stone-200 overflow-hidden cursor-pointer hover:border-[#AFBD00] hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
    >
      {/* Phase color bar */}
      <div className={`h-2 md:h-1.5 ${colors.dot}`} />

      <div className="p-4 md:p-5">
        {/* Header with phase badge only */}
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Phase badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            {phaseLabels[project.phase]}
          </span>

          {/* Actions menu - desktop only */}
          <div className="hidden md:block relative opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                // In real app, would open a dropdown menu
              }}
              className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Project name - full display on mobile, no truncation */}
        <h3 className="text-base md:text-lg font-semibold text-stone-900 mb-3 leading-snug group-hover:text-[#AFBD00] transition-colors">
          {project.name}
        </h3>

        {/* Team members - simplified, unique names only */}
        {uniqueTeamMembers.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 flex-shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span className="text-sm text-stone-600 truncate">
              {uniqueTeamMembers.map(m => m.memberName).join(', ')}
            </span>
          </div>
        )}

        {/* Budget progress - simplified */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500">Progression</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-stone-200 text-xs font-medium text-stone-700">
                {project.budget.hoursWorked}/{project.budget.hoursPlanned}
              </span>
            </div>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
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

        {/* Hover actions - desktop only */}
        <div className="hidden md:flex items-center gap-2 mt-4 pt-3 border-t border-stone-100 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.() }}
            className="flex-1 text-xs font-medium text-stone-600 hover:text-[#AFBD00] py-2 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Modifier
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate?.() }}
            className="flex-1 text-xs font-medium text-stone-600 hover:text-[#AFBD00] py-2 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Dupliquer
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.() }}
            className="flex-1 text-xs font-medium text-stone-600 hover:text-red-500 py-2 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}
