import type { Campaign } from '../types'

interface CampaignCardProps {
  campaign: Campaign
  onView?: () => void
  onDonate?: () => void
}

export function CampaignCard({ campaign, onView, onDonate }: CampaignCardProps) {
  const progress = Math.round((campaign.currentAmount / campaign.goalAmount) * 100)
  const isCompleted = campaign.status === 'completed'
  const isUrgent = campaign.urgencyLevel === 'high' && !isCompleted

  const categoryLabels: Record<string, string> = {
    poste: 'Poste',
    projet: 'Projet',
    evenement: 'Événement',
    materiel: 'Matériel',
  }

  const categoryColors: Record<string, string> = {
    poste: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    projet: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    evenement: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    materiel: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  }

  const daysLeft = Math.ceil(
    (new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl bg-white dark:bg-stone-900
        border border-stone-200 dark:border-stone-700
        hover:shadow-xl hover:shadow-green-500/10 dark:hover:shadow-green-500/5
        transition-all duration-300 hover:-translate-y-1
        ${isUrgent ? 'ring-2 ring-orange-400 ring-offset-2 dark:ring-offset-stone-950' : ''}
      `}
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={campaign.imageUrl}
          alt={campaign.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Urgent badge */}
        {isUrgent && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500 text-white text-xs font-semibold animate-pulse">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Urgent
          </div>
        )}

        {/* Completed badge */}
        {isCompleted && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500 text-white text-xs font-semibold">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Objectif atteint !
          </div>
        )}

        {/* Category tag */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[campaign.category]}`}>
            {categoryLabels[campaign.category]}
          </span>
        </div>

        {/* Days left */}
        {!isCompleted && daysLeft > 0 && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs">
            {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3
          className="font-semibold text-stone-900 dark:text-white text-lg leading-tight mb-2 line-clamp-2 cursor-pointer hover:text-green-600 dark:hover:text-green-400 transition-colors"
          onClick={onView}
        >
          {campaign.title}
        </h3>

        <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2 mb-4">
          {campaign.description}
        </p>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-semibold text-green-600 dark:text-green-400">
              {campaign.currentAmount.toLocaleString('fr-BE')} €
            </span>
            <span className="text-stone-500 dark:text-stone-400">
              sur {campaign.goalAmount.toLocaleString('fr-BE')} €
            </span>
          </div>

          <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className={`
                h-full rounded-full transition-all duration-1000 ease-out
                ${isCompleted
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                  : 'bg-gradient-to-r from-lime-400 to-green-500'
                }
              `}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center mt-2 text-xs text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {campaign.contributorsCount} contributeur{campaign.contributorsCount > 1 ? 's' : ''}
            </span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {progress}%
            </span>
          </div>
        </div>

        {/* Action button */}
        {!isCompleted && (
          <button
            onClick={onDonate}
            className="
              w-full py-2.5 px-4 rounded-xl font-semibold text-sm
              bg-gradient-to-r from-green-500 to-emerald-600
              hover:from-green-600 hover:to-emerald-700
              text-white shadow-lg shadow-green-500/25
              transform transition-all duration-200
              hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/30
              active:scale-[0.98]
            "
          >
            Je contribue
          </button>
        )}

        {isCompleted && (
          <button
            onClick={onView}
            className="
              w-full py-2.5 px-4 rounded-xl font-semibold text-sm
              bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300
              hover:bg-stone-200 dark:hover:bg-stone-700
              transition-colors
            "
          >
            Voir les détails
          </button>
        )}
      </div>
    </div>
  )
}
