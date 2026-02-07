import type { Project } from '../types'

interface ProjectCardProps {
  project: Project
  onView?: () => void
  onDonate?: () => void
}

const clientTypeLabels: Record<string, { label: string; icon: string }> = {
  'privé': { label: 'Particulier', icon: '🏠' },
  'entreprise': { label: 'Entreprise', icon: '🏢' },
  'collectif': { label: 'Collectif', icon: '👥' },
  'public': { label: 'Service public', icon: '🏛️' }
}

const statusStyles: Record<string, { label: string; color: string; bgColor: string }> = {
  'completed': { label: 'Terminé', color: '#AFBD00', bgColor: '#e1e6d8' },
  'in-progress': { label: 'En cours', color: '#5B5781', bgColor: '#c8bfd2' },
  'funding': { label: 'En financement', color: '#EF9B0D', bgColor: '#fbe6c3' }
}

export function ProjectCard({ project, onView, onDonate }: ProjectCardProps) {
  const clientType = clientTypeLabels[project.clientType] || clientTypeLabels['privé']
  const status = statusStyles[project.status] || statusStyles['in-progress']
  
  const fundingPercentage = project.fundingGoal 
    ? Math.round((project.fundingRaised! / project.fundingGoal) * 100)
    : 0

  return (
    <div className="group relative flex flex-col bg-white dark:bg-stone-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
      {/* Image area */}
      <div className="relative h-56 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-700 dark:to-stone-600"
        />
        
        {/* Decorative pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 10c-10 16-30 24-30 45 0 12 13 15 30 15s30-3 30-15c0-21-20-29-30-45z' fill='%235B5781' fill-opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
          }}
        />
        
        {/* Status badge */}
        <div 
          className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: status.bgColor, color: status.color }}
        >
          {status.label}
        </div>
        
        {/* Client type badge */}
        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-medium bg-white/90 dark:bg-stone-800/90 text-stone-700 dark:text-stone-300">
          {clientType.icon} {clientType.label}
        </div>
        
        {/* Stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-center gap-6 text-white text-sm">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {project.surface.toLocaleString()} m²
            </span>
            {project.treesPlanted > 0 && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {project.treesPlanted} arbres
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400 mb-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          {project.location}
        </div>
        
        {/* Title */}
        <h3 
          className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-3 line-clamp-2"
          style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
        >
          {project.title}
        </h3>
        
        {/* Description */}
        <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed mb-4 line-clamp-3">
          {project.shortDescription}
        </p>
        
        {/* Funding progress (if applicable) */}
        {project.fundingStatus === 'active' && project.fundingGoal && (
          <div className="mb-4 p-4 rounded-2xl" style={{ backgroundColor: '#fbe6c3' }}>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold" style={{ color: '#EF9B0D' }}>
                {project.fundingRaised?.toLocaleString()}€ collectés
              </span>
              <span className="text-stone-600">
                sur {project.fundingGoal.toLocaleString()}€
              </span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(fundingPercentage, 100)}%`,
                  backgroundColor: '#EF9B0D'
                }}
              />
            </div>
            <div className="mt-2 text-xs text-stone-600 font-medium">
              {fundingPercentage}% de l'objectif
            </div>
          </div>
        )}
        
        {/* Testimonial (if available) */}
        {project.testimonial && (
          <blockquote className="mb-4 pl-4 border-l-2 border-[#AFBD00]">
            <p className="text-sm italic text-stone-600 dark:text-stone-400 line-clamp-2">
              "{project.testimonial.text}"
            </p>
            <cite className="text-xs text-stone-500 not-italic mt-1 block">
              — {project.testimonial.author}, {project.testimonial.role}
            </cite>
          </blockquote>
        )}
        
        {/* Actions */}
        <div className="mt-auto flex gap-3 pt-4">
          <button
            onClick={onView}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] text-white"
            style={{ backgroundColor: '#5B5781' }}
          >
            Voir le projet
          </button>
          
          {project.fundingStatus === 'active' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDonate?.()
              }}
              className="py-3 px-4 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] border-2"
              style={{ borderColor: '#EF9B0D', color: '#EF9B0D' }}
            >
              Soutenir
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

