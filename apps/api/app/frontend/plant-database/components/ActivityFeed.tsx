import type { ActivityFeedProps, ActivityItem, Contributor, ActivityType, TargetType } from '../types'

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
function formatDate(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const todayStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const yesterdayStr = yesterday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  
  if (dateStr === todayStr) return "Aujourd'hui"
  if (dateStr === yesterdayStr) return "Hier"
  return dateStr
}

// Helper to group activities by date
function groupActivitiesByDate(activities: ActivityItem[]): Map<string, ActivityItem[]> {
  const groups = new Map<string, ActivityItem[]>()
  
  activities.forEach((activity) => {
    const date = new Date(activity.timestamp)
    const dateKey = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    
    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(activity)
  })
  
  return groups
}

interface ActivityItemComponentProps {
  activity: ActivityItem
  contributor: Contributor | undefined
  onActivitySelect?: (targetId: string, targetType: TargetType) => void
  onContributorSelect?: (contributorId: string) => void
}

function ActivityItemComponent({
  activity,
  contributor,
  onActivitySelect,
  onContributorSelect,
}: ActivityItemComponentProps) {
  const handleTargetClick = () => {
    onActivitySelect?.(activity.targetId, activity.targetType)
  }

  const handleContributorClick = () => {
    onContributorSelect?.(activity.contributorId)
  }

  return (
    <div className="flex gap-4 group">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <button
          onClick={handleContributorClick}
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-stone-200 dark:border-stone-700 hover:border-[#AFBD00] dark:hover:border-[#AFBD00] transition-colors cursor-pointer"
        >
          {contributor?.avatarUrl ? (
            <img
              src={contributor.avatarUrl}
              alt={contributor.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#AFBD00] to-[#5B5781] flex items-center justify-center text-white font-medium text-sm">
              {contributor?.name.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-6 border-l-2 border-stone-200 dark:border-stone-700 pl-4 relative">
        {/* Timeline dot */}
        <div className="absolute -left-[7px] top-2 w-3 h-3 rounded-full bg-[#AFBD00] border-2 border-white dark:border-stone-900" />

        {/* Activity content */}
        <div className="space-y-1">
          <div className="flex items-start gap-2 flex-wrap">
            <button
              onClick={handleContributorClick}
              className="font-medium text-stone-900 dark:text-stone-100 hover:text-[#5B5781] dark:hover:text-[#AFBD00] transition-colors cursor-pointer"
            >
              {contributor?.name || 'Contributeur inconnu'}
            </button>
            <span className="text-stone-600 dark:text-stone-400">
              {getActivityLabel(activity.type)}
            </span>
            <span className="text-2xl leading-none">{getActivityIcon(activity.type)}</span>
          </div>

          <button
            onClick={handleTargetClick}
            className="text-[#5B5781] dark:text-[#AFBD00] hover:text-[#AFBD00] dark:hover:text-[#5B5781] font-medium transition-colors cursor-pointer text-left"
          >
            {activity.targetName}
          </button>

          {/* Timestamp */}
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
            {new Date(activity.timestamp).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

export function ActivityFeed({
  activities,
  contributors,
  onActivitySelect,
  onContributorSelect,
  onLoadMore,
  hasMore,
}: ActivityFeedProps) {
  // Sort activities by timestamp (newest first)
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  // Group by date
  const groupedActivities = groupActivitiesByDate(sortedActivities)
  const sortedDates = Array.from(groupedActivities.keys()).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  // Get contributor by ID
  const getContributor = (id: string): Contributor | undefined => {
    return contributors.find((c) => c.id === id)
  }

  if (activities.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-12 text-center border border-stone-200 dark:border-stone-700">
          <div className="w-16 h-16 rounded-2xl bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-4xl mx-auto mb-4">
            🌿
          </div>
          <p className="text-stone-600 dark:text-stone-400 font-medium text-lg mb-2">
            Aucune activité récente
          </p>
          <p className="text-stone-400 dark:text-stone-500 text-sm">
            Les contributions de la communauté apparaîtront ici
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-2">
          Flux d'activité
        </h1>
        <p className="text-stone-500 dark:text-stone-400">
          Découvrez les dernières contributions de la communauté
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {sortedDates.map((dateKey) => {
          const dateActivities = groupedActivities.get(dateKey)!
          const date = new Date(dateActivities[0].timestamp)

          return (
            <div key={dateKey} className="space-y-6">
              {/* Date header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-stone-900 py-2 border-b-2 border-stone-200 dark:border-stone-700">
                <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
                  {formatDate(date)}
                </h2>
              </div>

              {/* Activities for this date */}
              <div className="space-y-0">
                {dateActivities.map((activity) => (
                  <ActivityItemComponent
                    key={activity.id}
                    activity={activity}
                    contributor={getContributor(activity.contributorId)}
                    onActivitySelect={onActivitySelect}
                    onContributorSelect={onContributorSelect}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={onLoadMore}
            className="px-6 py-3 bg-[#5B5781] hover:bg-[#4a4669] dark:bg-[#AFBD00] dark:hover:bg-[#8fa000] text-white font-medium rounded-lg transition-colors"
          >
            Charger plus d'activités
          </button>
        </div>
      )}
    </div>
  )
}

