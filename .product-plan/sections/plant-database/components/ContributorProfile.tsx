import type { ContributorProfileProps, ActivityItem, ActivityType, TargetType } from '../types'

// Helper to format activity type labels
function getActivityLabel(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    species_created: 'a créé l\'espèce',
    species_updated: 'a modifié l\'espèce',
    variety_created: 'a créé la variété',
    variety_updated: 'a modifié la variété',
    photo_added: 'a ajouté une photo',
    note_added: 'a ajouté une note',
    reference_added: 'a ajouté une référence',
  }
  return labels[type]
}

// Helper to get activity icon
function getActivityIcon(type: ActivityType): string {
  const icons: Record<ActivityType, string> = {
    species_created: '🌱',
    species_updated: '✏️',
    variety_created: '🌿',
    variety_updated: '✏️',
    photo_added: '📷',
    note_added: '💬',
    reference_added: '📚',
  }
  return icons[type]
}

// Helper to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Helper to format relative date
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Hier"
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`
  return `Il y a ${Math.floor(diffDays / 365)} ans`
}

// Helper to get country flag from labId or name
function getCountryFlag(labId: string | null, name: string): string {
  // Map labId to country flags
  const labToCountry: Record<string, string> = {
    'lab-wallonie': '🇧🇪', // Belgique
    'lab-bruxelles': '🇧🇪', // Belgique
    'lab-bretagne': '🇫🇷', // France
    'lab-paris': '🇫🇷', // France
  }

  if (labId && labToCountry[labId]) {
    return labToCountry[labId]
  }

  // Fallback: try to infer from name patterns
  const nameLower = name.toLowerCase()
  if (nameLower.includes('dupont') || nameLower.includes('martin') || nameLower.includes('bernard') || nameLower.includes('petit')) {
    return '🇫🇷' // Common French names
  }
  if (nameLower.includes('williams') || nameLower.includes('smith') || nameLower.includes('jones')) {
    return '🇬🇧' // Common UK/US names
  }
  if (nameLower.includes('van ') || nameLower.includes('de ') || nameLower.includes('jansen')) {
    return '🇳🇱' // Common Dutch names
  }

  return '🌍' // Default globe emoji
}

// Circular progress component for stats
interface CircularStatProps {
  value: number
  max: number
  label: string
  icon: string
  color: string
}

function CircularStat({ value, max, label, icon, color }: CircularStatProps) {
  const percentage = Math.min((value / max) * 100, 100)
  const circumference = 2 * Math.PI * 36 // radius = 36
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative group">
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          <svg className="transform -rotate-90 w-24 h-24" viewBox="0 0 80 80">
            {/* Background circle */}
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-stone-200 dark:text-stone-700"
            />
            {/* Progress circle */}
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
        <div className="mt-3 text-center">
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {value}
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-tight">
            {label}
          </div>
        </div>
      </div>
    </div>
  )
}

// Organic activity heatmap with rounded shapes
interface ActivityHeatmapProps {
  activityByMonth: number[]
}

function ActivityHeatmap({ activityByMonth }: ActivityHeatmapProps) {
  const maxValue = Math.max(...activityByMonth, 1)

  const getIntensity = (value: number): number => {
    if (value === 0) return 0
    const ratio = value / maxValue
    if (ratio < 0.2) return 1
    if (ratio < 0.4) return 2
    if (ratio < 0.7) return 3
    return 4
  }

  const monthLabels = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
          Jardin d'activité
        </h3>
        <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
          <span>Moins</span>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`w-4 h-4 rounded-full transition-transform hover:scale-110 ${
                  level === 0
                    ? 'bg-stone-200 dark:bg-stone-700'
                    : level === 1
                      ? 'bg-[#AFBD00]/30 dark:bg-[#AFBD00]/20'
                      : level === 2
                        ? 'bg-[#AFBD00]/50 dark:bg-[#AFBD00]/40'
                        : level === 3
                          ? 'bg-[#AFBD00]/70 dark:bg-[#AFBD00]/60'
                          : 'bg-[#AFBD00] dark:bg-[#AFBD00]'
                }`}
              />
            ))}
          </div>
          <span>Plus</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {activityByMonth.map((value, index) => {
          const intensity = getIntensity(value)
          const size = intensity === 0 ? 'w-8 h-8' : intensity === 1 ? 'w-10 h-10' : intensity === 2 ? 'w-12 h-12' : intensity === 3 ? 'w-14 h-14' : 'w-16 h-16'
          
          return (
            <div key={index} className="flex flex-col items-center space-y-2">
              <div
                className={`${size} rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer flex items-center justify-center ${
                  intensity === 0
                    ? 'bg-stone-200 dark:bg-stone-700'
                    : intensity === 1
                      ? 'bg-gradient-to-br from-[#AFBD00]/30 to-[#AFBD00]/20 dark:from-[#AFBD00]/20 dark:to-[#AFBD00]/10'
                      : intensity === 2
                        ? 'bg-gradient-to-br from-[#AFBD00]/50 to-[#AFBD00]/40 dark:from-[#AFBD00]/40 dark:to-[#AFBD00]/30'
                        : intensity === 3
                          ? 'bg-gradient-to-br from-[#AFBD00]/70 to-[#AFBD00]/60 dark:from-[#AFBD00]/60 dark:to-[#AFBD00]/50'
                          : 'bg-gradient-to-br from-[#AFBD00] to-[#8fa000] dark:from-[#AFBD00] dark:to-[#8fa000] shadow-md'
                }`}
                title={`${monthLabels[index]}: ${value} contribution${value > 1 ? 's' : ''}`}
              >
                {intensity > 0 && (
                  <div className="w-2 h-2 rounded-full bg-white/40 dark:bg-white/20" />
                )}
              </div>
              <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
                {monthLabels[index]}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface RecentActivityItemProps {
  activity: ActivityItem
  index: number
  onActivitySelect?: (targetId: string, targetType: TargetType) => void
}

function RecentActivityItem({ activity, index, onActivitySelect }: RecentActivityItemProps) {
  const handleClick = () => {
    onActivitySelect?.(activity.targetId, activity.targetType)
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left p-4 rounded-xl hover:bg-gradient-to-r hover:from-stone-50 hover:to-transparent dark:hover:from-stone-800/50 dark:hover:to-transparent transition-all duration-200 group relative overflow-hidden"
    >
      {/* Connection line */}
      {index < 9 && (
        <div className="absolute left-8 top-full w-0.5 h-4 bg-gradient-to-b from-stone-200 to-transparent dark:from-stone-700 dark:to-transparent" />
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        {/* Icon with animated background */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#AFBD00]/20 to-[#5B5781]/20 dark:from-[#AFBD00]/10 dark:to-[#5B5781]/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200">
            {getActivityIcon(activity.type)}
          </div>
          {/* Pulse effect on hover */}
          <div className="absolute inset-0 rounded-full bg-[#AFBD00]/20 dark:bg-[#AFBD00]/10 scale-0 group-hover:scale-150 transition-transform duration-300 opacity-0 group-hover:opacity-100" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-stone-700 dark:text-stone-300 group-hover:text-[#5B5781] dark:group-hover:text-[#AFBD00] transition-colors">
            <span className="font-medium">{getActivityLabel(activity.type)}</span>{' '}
            <span className="text-[#5B5781] dark:text-[#AFBD00] font-semibold">{activity.targetName}</span>
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5 flex items-center gap-2">
            <span>{formatRelativeDate(activity.timestamp)}</span>
            <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
            <span>{new Date(activity.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>
        
        {/* Arrow indicator */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-5 h-5 text-[#AFBD00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  )
}

export function ContributorProfile({
  contributor,
  recentActivities,
  onActivitySelect,
}: ContributorProfileProps) {
  const totalContributions =
    contributor.stats.speciesCreated +
    contributor.stats.varietiesCreated +
    contributor.stats.photosAdded +
    contributor.stats.notesWritten

  // Calculate max value for circular stats
  const maxStat = Math.max(
    contributor.stats.speciesCreated,
    contributor.stats.varietiesCreated,
    contributor.stats.photosAdded,
    contributor.stats.notesWritten,
    1
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 dark:from-stone-900 dark:via-stone-950 dark:to-stone-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Compact Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#AFBD00]/5 via-[#5B5781]/3 to-[#AFBD00]/5 dark:from-[#AFBD00]/3 dark:via-[#5B5781]/3 dark:to-[#AFBD00]/3" />
          
          <div className="relative bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border border-stone-200/50 dark:border-stone-700/50 p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
              {/* Left side: Avatar + Name + Date */}
              <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                {/* Compact Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#AFBD00] via-[#8fa000] to-[#5B5781] rounded-full p-0.5">
                    <div className="w-full h-full bg-white dark:bg-stone-900 rounded-full" />
                  </div>
                  {contributor.avatarUrl ? (
                    <img
                      src={contributor.avatarUrl}
                      alt={contributor.name}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white dark:border-stone-900"
                    />
                  ) : (
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#AFBD00] to-[#5B5781] flex items-center justify-center text-white font-bold text-xl sm:text-2xl border-2 border-white dark:border-stone-900">
                      {contributor.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name + Date */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
                      {contributor.name}
                    </h1>
                    <span className="text-xl sm:text-2xl leading-none" title="Pays">
                      {getCountryFlag(contributor.labId, contributor.name)}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-stone-500 dark:text-stone-400">
                    Contributrice depuis le <span className="font-medium">{formatDate(contributor.joinedAt)}</span>
                  </p>
                </div>
              </div>

              {/* Right side: Compact Semos Badge (on large screens) */}
              <div className="lg:flex-shrink-0 lg:self-center">
                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-[#AFBD00] to-[#8fa000] dark:from-[#AFBD00] dark:to-[#8fa000] rounded-xl shadow-md shadow-[#AFBD00]/15 dark:shadow-[#AFBD00]/10">
                  <div className="text-xl sm:text-2xl">Ⓢ</div>
                  <div>
                    <div className="text-[10px] sm:text-xs font-medium text-white/80 uppercase tracking-wide leading-tight">
                      Semos
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white leading-tight">
                      {contributor.semosEarned.toLocaleString('fr-FR')}
                    </div>
                  </div>
                  <div className="ml-3 pl-3 border-l border-white/20">
                    <div className="text-[10px] sm:text-xs font-medium text-white/80 uppercase tracking-wide leading-tight">
                      Contributions
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white leading-tight">
                      {totalContributions}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Circular Stats Grid */}
        <div className="bg-white dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 mb-5 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <CircularStat
              value={contributor.stats.speciesCreated}
              max={maxStat}
              label="Espèces créées"
              icon="🌱"
              color="#5B5781"
            />
            <CircularStat
              value={contributor.stats.varietiesCreated}
              max={maxStat}
              label="Variétés créées"
              icon="🌿"
              color="#AFBD00"
            />
            <CircularStat
              value={contributor.stats.photosAdded}
              max={maxStat}
              label="Photos ajoutées"
              icon="📷"
              color="#5B5781"
            />
            <CircularStat
              value={contributor.stats.notesWritten}
              max={maxStat}
              label="Notes rédigées"
              icon="💬"
              color="#AFBD00"
            />
          </div>
        </div>

        {/* Organic Activity Heatmap */}
        <div className="bg-white dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 mb-5 shadow-sm">
          <ActivityHeatmap activityByMonth={contributor.activityByMonth} />
        </div>

        {/* Timeline of Recent Contributions */}
        <div className="bg-white dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 shadow-sm">
          <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-5">
            Chronologie des contributions
          </h2>

          {recentActivities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-3xl mx-auto mb-4">
                🌿
              </div>
              <p className="text-stone-500 dark:text-stone-400">
                Aucune contribution récente
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#AFBD00] via-stone-200 to-transparent dark:from-[#AFBD00] dark:via-stone-700 dark:to-transparent" />
              
              <div className="space-y-0">
                {recentActivities.map((activity, index) => (
                  <RecentActivityItem
                    key={activity.id}
                    activity={activity}
                    index={index}
                    onActivitySelect={onActivitySelect}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
