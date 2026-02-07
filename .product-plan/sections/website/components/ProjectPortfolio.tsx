import { useState } from 'react'
import type { ProjectPortfolioProps, Project, ClientType, ProjectStatus } from '../types'

// =============================================================================
// Sub-Components
// =============================================================================

// Filter pill component
interface FilterPillProps {
  label: string
  isActive: boolean
  onClick: () => void
  count?: number
}

function FilterPill({ label, isActive, onClick, count }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300
        ${isActive
          ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-lg'
          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
        }
      `}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-2 text-xs ${isActive ? 'opacity-70' : 'opacity-50'}`}>
          ({count})
        </span>
      )}
    </button>
  )
}

// Client type badge with icon
interface ClientBadgeProps {
  type: ClientType
}

function ClientBadge({ type }: ClientBadgeProps) {
  const config: Record<ClientType, { label: string; icon: React.ReactNode; color: string }> = {
    'privé': {
      label: 'Particulier',
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    'entreprise': {
      label: 'Entreprise',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    'collectif': {
      label: 'Collectif',
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    'public': {
      label: 'Service Public',
      color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      )
    }
  }

  const { label, icon, color } = config[type]

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${color}`}>
      {icon}
      {label}
    </span>
  )
}

// Status indicator
interface StatusIndicatorProps {
  status: ProjectStatus
}

function StatusIndicator({ status }: StatusIndicatorProps) {
  const config: Record<ProjectStatus, { label: string; color: string; pulse: boolean }> = {
    'completed': { label: 'Réalisé', color: 'bg-emerald-500', pulse: false },
    'in-progress': { label: 'En cours', color: 'bg-amber-500', pulse: true },
    'funding': { label: 'Financement', color: 'bg-violet-500', pulse: true }
  }

  const { label, color, pulse } = config[status]

  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-400">
      <span className="relative flex h-2.5 w-2.5">
        {pulse && <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-75 animate-ping`} />}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
      </span>
      {label}
    </span>
  )
}

// Funding progress bar with tree icons
interface FundingProgressProps {
  raised: number
  goal: number
  currency?: string
}

function FundingProgress({ raised, goal, currency = '€' }: FundingProgressProps) {
  const percentage = Math.min((raised / goal) * 100, 100)
  const treesUnlocked = Math.floor(percentage / 10) // 10 trees total

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-2xl font-bold text-stone-900 dark:text-white" style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}>
            {raised.toLocaleString('fr-FR')}{currency}
          </span>
          <span className="text-stone-500 dark:text-stone-400 text-sm ml-1">
            / {goal.toLocaleString('fr-FR')}{currency}
          </span>
        </div>
        <span className="text-lg font-bold text-lime-600 dark:text-lime-400">
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Tree progress visualization */}
      <div className="flex justify-between items-end h-8">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={`transition-all duration-500 ${i < treesUnlocked ? 'opacity-100' : 'opacity-20'}`}
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            <svg
              className={`w-5 h-6 ${i < treesUnlocked ? 'text-lime-500' : 'text-stone-400'}`}
              viewBox="0 0 24 30"
              fill="currentColor"
            >
              <path d="M12 0L4 12h4v6H4l8 12 8-12h-4v-6h4L12 0z" />
            </svg>
          </div>
        ))}
      </div>

      {/* Actual progress bar */}
      <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-lime-500 to-emerald-500 rounded-full transition-all duration-1000"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Project Card - Magazine editorial style
interface ProjectCardProps {
  project: Project
  onView?: () => void
  onDonate?: () => void
  isFeature?: boolean
  index: number
}

function ProjectCard({ project, onView, onDonate, isFeature = false, index }: ProjectCardProps) {
  const formatSurface = (m2: number) => {
    if (m2 >= 10000) return `${(m2 / 10000).toFixed(1)} ha`
    return `${m2.toLocaleString('fr-FR')} m²`
  }

  if (isFeature) {
    // Large featured card - horizontal layout
    return (
      <article
        className="group relative bg-white dark:bg-stone-900 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 animate-fade-in-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="grid lg:grid-cols-2">
          {/* Image side */}
          <div className="relative h-64 lg:h-auto lg:min-h-[400px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-900">
              {/* Placeholder with organic pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id={`leaves-${project.id}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                    <circle cx="5" cy="5" r="2" fill="currentColor" opacity="0.3" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill={`url(#leaves-${project.id})`} />
              </svg>
            </div>

            {/* Status badge */}
            <div className="absolute top-4 left-4 z-10">
              <StatusIndicator status={project.status} />
            </div>

            {/* Surface overlay */}
            <div className="absolute bottom-4 left-4 z-10">
              <div className="px-4 py-2 bg-black/60 backdrop-blur-sm rounded-xl text-white">
                <span className="text-2xl font-bold" style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}>
                  {formatSurface(project.surface)}
                </span>
              </div>
            </div>

            {/* Trees planted badge */}
            {project.treesPlanted > 0 && (
              <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-4 py-2 bg-lime-500/90 backdrop-blur-sm rounded-xl text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 30">
                  <path d="M12 0L4 12h4v6H4l8 12 8-12h-4v-6h4L12 0z" />
                </svg>
                <span className="font-bold">{project.treesPlanted}</span>
              </div>
            )}
          </div>

          {/* Content side */}
          <div className="p-8 lg:p-10 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <ClientBadge type={project.clientType} />
              <span className="text-stone-400 text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {project.location}
              </span>
            </div>

            <h3
              className="text-3xl lg:text-4xl font-bold text-stone-900 dark:text-white mb-4 leading-tight group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors cursor-pointer"
              style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
              onClick={onView}
            >
              {project.title}
            </h3>

            <p className="text-stone-600 dark:text-stone-400 leading-relaxed mb-6 flex-grow">
              {project.description}
            </p>

            {/* Funding section for funding projects */}
            {project.status === 'funding' && project.fundingGoal && project.fundingRaised !== null && (
              <div className="mb-6 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl">
                <FundingProgress
                  raised={project.fundingRaised}
                  goal={project.fundingGoal}
                />
              </div>
            )}

            {/* Testimonial */}
            {project.testimonial && (
              <blockquote className="mb-6 pl-4 border-l-4 border-lime-500">
                <p className="text-stone-600 dark:text-stone-400 italic mb-2">
                  "{project.testimonial.text}"
                </p>
                <cite className="text-sm text-stone-500 not-italic">
                  — {project.testimonial.author}, {project.testimonial.role}
                </cite>
              </blockquote>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-auto">
              <button
                onClick={onView}
                className="flex-1 px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-medium rounded-xl hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors"
              >
                Découvrir le projet
              </button>
              {project.status === 'funding' && (
                <button
                  onClick={onDonate}
                  className="px-6 py-3 bg-lime-500 hover:bg-lime-400 text-stone-900 font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Soutenir
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    )
  }

  // Regular card - vertical layout
  return (
    <article
      className="group relative bg-white dark:bg-stone-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 animate-fade-in-up hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-700 to-stone-800">
          {/* Organic pattern placeholder */}
          <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id={`grid-${project.id}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="4" cy="4" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill={`url(#grid-${project.id})`} />
          </svg>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Status */}
        <div className="absolute top-3 left-3">
          <StatusIndicator status={project.status} />
        </div>

        {/* Surface */}
        <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-white text-sm font-medium">
          {formatSurface(project.surface)}
        </div>

        {/* Trees */}
        {project.treesPlanted > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1 bg-lime-500/90 backdrop-blur-sm rounded-lg text-white text-sm font-bold">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 30">
              <path d="M12 0L4 12h4v6H4l8 12 8-12h-4v-6h4L12 0z" />
            </svg>
            {project.treesPlanted}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <ClientBadge type={project.clientType} />
        </div>

        <h3
          className="text-xl font-bold text-stone-900 dark:text-white mb-2 leading-snug group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors cursor-pointer line-clamp-2"
          style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
          onClick={onView}
        >
          {project.title}
        </h3>

        <p className="text-sm text-stone-500 dark:text-stone-400 flex items-center gap-1 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {project.location}
        </p>

        <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed mb-4 line-clamp-2">
          {project.shortDescription}
        </p>

        {/* Mini funding bar for funding projects */}
        {project.status === 'funding' && project.fundingGoal && project.fundingRaised !== null && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-stone-900 dark:text-white">
                {project.fundingRaised.toLocaleString('fr-FR')}€
              </span>
              <span className="text-lime-600 dark:text-lime-400 font-bold">
                {Math.round((project.fundingRaised / project.fundingGoal) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-lime-500 to-emerald-500 rounded-full"
                style={{ width: `${Math.min((project.fundingRaised / project.fundingGoal) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="flex-1 px-4 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium text-sm rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            En savoir plus
          </button>
          {project.status === 'funding' && (
            <button
              onClick={onDonate}
              className="px-4 py-2.5 bg-lime-500 hover:bg-lime-400 text-stone-900 font-bold text-sm rounded-xl transition-colors"
            >
              Soutenir
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function ProjectPortfolio({
  projects,
  labId,
  onProjectView,
  onDonate,
  onFilter
}: ProjectPortfolioProps) {
  const [activeClientType, setActiveClientType] = useState<ClientType | 'all'>('all')
  const [activeStatus, setActiveStatus] = useState<ProjectStatus | 'all'>('all')

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    if (labId && project.labId !== labId) return false
    if (activeClientType !== 'all' && project.clientType !== activeClientType) return false
    if (activeStatus !== 'all' && project.status !== activeStatus) return false
    return true
  })

  // Separate funding projects (to feature them)
  const fundingProjects = filteredProjects.filter(p => p.status === 'funding')
  const otherProjects = filteredProjects.filter(p => p.status !== 'funding')

  // Stats
  const stats = {
    total: projects.length,
    completed: projects.filter(p => p.status === 'completed').length,
    inProgress: projects.filter(p => p.status === 'in-progress').length,
    funding: projects.filter(p => p.status === 'funding').length,
    totalSurface: projects.reduce((acc, p) => acc + p.surface, 0),
    totalTrees: projects.reduce((acc, p) => acc + p.treesPlanted, 0)
  }

  const handleFilter = (type: 'clientType' | 'status', value: string) => {
    if (type === 'clientType') {
      setActiveClientType(value as ClientType | 'all')
    } else {
      setActiveStatus(value as ProjectStatus | 'all')
    }
    onFilter?.({
      clientType: type === 'clientType' ? (value === 'all' ? undefined : value as ClientType) : (activeClientType === 'all' ? undefined : activeClientType),
      status: type === 'status' ? (value === 'all' ? undefined : value as ProjectStatus) : (activeStatus === 'all' ? undefined : activeStatus)
    })
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 py-20 md:py-32">
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="hero-grid" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
                <circle cx="2.5" cy="2.5" r="0.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#hero-grid)" />
          </svg>
        </div>

        {/* Organic shape accents */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20">
          <svg className="w-full h-full" viewBox="0 0 500 600" fill="none" preserveAspectRatio="xMaxYMid slice">
            <circle cx="400" cy="100" r="200" fill="#84cc16" opacity="0.3" />
            <circle cx="350" cy="400" r="150" fill="#22c55e" opacity="0.2" />
            <circle cx="500" cy="300" r="180" fill="#65a30d" opacity="0.25" />
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-stone-400 text-sm mb-8">
            <span>Semisto</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-lime-400">Portfolio Projets</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.9] mb-6"
                style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
              >
                Transformer les
                <span className="block text-lime-400">territoires</span>
              </h1>
              <p className="text-xl text-stone-300 leading-relaxed max-w-xl">
                Chaque projet est une histoire de régénération. Découvrez comment nous transformons des espaces en écosystèmes nourriciers.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="text-4xl font-black text-white mb-1" style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}>
                  {stats.total}
                </div>
                <div className="text-stone-400 text-sm">Projets totaux</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="text-4xl font-black text-lime-400 mb-1" style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}>
                  {stats.totalTrees.toLocaleString('fr-FR')}
                </div>
                <div className="text-stone-400 text-sm">Arbres plantés</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="text-4xl font-black text-white mb-1" style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}>
                  {(stats.totalSurface / 10000).toFixed(1)}
                </div>
                <div className="text-stone-400 text-sm">Hectares transformés</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="text-4xl font-black text-emerald-400 mb-1" style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}>
                  {stats.completed}
                </div>
                <div className="text-stone-400 text-sm">Projets réalisés</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="sticky top-0 z-40 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Status filters */}
            <div className="flex flex-wrap gap-2">
              <FilterPill
                label="Tous"
                isActive={activeStatus === 'all'}
                onClick={() => handleFilter('status', 'all')}
                count={projects.length}
              />
              <FilterPill
                label="Réalisés"
                isActive={activeStatus === 'completed'}
                onClick={() => handleFilter('status', 'completed')}
                count={stats.completed}
              />
              <FilterPill
                label="En cours"
                isActive={activeStatus === 'in-progress'}
                onClick={() => handleFilter('status', 'in-progress')}
                count={stats.inProgress}
              />
              <FilterPill
                label="À financer"
                isActive={activeStatus === 'funding'}
                onClick={() => handleFilter('status', 'funding')}
                count={stats.funding}
              />
            </div>

            {/* Client type filters */}
            <div className="flex flex-wrap gap-2">
              {(['all', 'privé', 'entreprise', 'collectif', 'public'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleFilter('clientType', type)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${activeClientType === type
                      ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                      : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                    }
                  `}
                >
                  {type === 'all' ? 'Tous types' :
                   type === 'privé' ? 'Particuliers' :
                   type === 'entreprise' ? 'Entreprises' :
                   type === 'collectif' ? 'Collectifs' : 'Public'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Funding Projects - Featured */}
      {fundingProjects.length > 0 && activeStatus !== 'completed' && activeStatus !== 'in-progress' && (
        <section className="py-16 bg-gradient-to-b from-lime-50 to-stone-50 dark:from-stone-900 dark:to-stone-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-500 to-emerald-500 flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h2
                  className="text-3xl font-bold text-stone-900 dark:text-white"
                  style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
                >
                  Projets à soutenir
                </h2>
                <p className="text-stone-600 dark:text-stone-400">
                  Ces projets ont besoin de votre aide pour voir le jour
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {fundingProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  isFeature={true}
                  onView={() => onProjectView?.(project.id)}
                  onDonate={() => onDonate?.(project.id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Projects Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          {activeStatus !== 'funding' && (
            <div className="mb-12">
              <h2
                className="text-3xl font-bold text-stone-900 dark:text-white mb-2"
                style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
              >
                {activeStatus === 'completed' ? 'Projets réalisés' :
                 activeStatus === 'in-progress' ? 'Projets en cours' :
                 'Tous les projets'}
              </h2>
              <p className="text-stone-600 dark:text-stone-400">
                {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''} trouvé{filteredProjects.length > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {otherProjects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {otherProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  onView={() => onProjectView?.(project.id)}
                  onDonate={() => onDonate?.(project.id)}
                />
              ))}
            </div>
          ) : (
            activeStatus !== 'all' && fundingProjects.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-stone-700 dark:text-stone-300 mb-2">
                  Aucun projet trouvé
                </h3>
                <p className="text-stone-500 dark:text-stone-400">
                  Essayez de modifier vos filtres pour voir plus de projets.
                </p>
              </div>
            )
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-stone-900 dark:bg-black">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2
            className="text-4xl md:text-5xl font-black text-white mb-6"
            style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
          >
            Vous avez un projet ?
          </h2>
          <p className="text-xl text-stone-300 mb-10 max-w-2xl mx-auto">
            Que vous soyez particulier, entreprise, collectif ou collectivité, nous pouvons vous accompagner dans la création de votre jardin-forêt.
          </p>
          <button className="group px-10 py-5 bg-lime-500 hover:bg-lime-400 text-stone-900 font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-lime-500/20">
            <span className="flex items-center gap-3">
              Contactez-nous
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>
      </section>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
