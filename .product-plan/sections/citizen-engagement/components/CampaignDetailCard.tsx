import { useState } from 'react'
import type { Campaign } from '../types'
import { Calendar, Users, TrendingUp, Clock, CheckCircle2, AlertTriangle, Flame } from 'lucide-react'

interface CampaignDetailCardProps {
  campaign: Campaign
  featured?: boolean
  onDonate?: (amount: number) => void
}

const categoryLabels: Record<string, { label: string; icon: string }> = {
  poste: { label: 'Poste', icon: '👤' },
  projet: { label: 'Projet', icon: '🌳' },
  evenement: { label: 'Événement', icon: '🎉' },
  materiel: { label: 'Matériel', icon: '🔧' },
}

const presetAmounts = [10, 25, 50, 100]

export function CampaignDetailCard({
  campaign,
  featured = false,
  onDonate,
}: CampaignDetailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')

  const progress = Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)
  const isCompleted = campaign.status === 'completed'
  const isUrgent = campaign.urgencyLevel === 'high' && !isCompleted
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  const categoryInfo = categoryLabels[campaign.category] || { label: campaign.category, icon: '📋' }

  const handleDonate = () => {
    const amount = selectedAmount || (customAmount ? parseFloat(customAmount) : 0)
    if (amount > 0) {
      onDonate?.(amount)
      setSelectedAmount(null)
      setCustomAmount('')
      setIsExpanded(false)
    }
  }

  if (featured && !isCompleted) {
    // Featured card - large horizontal layout
    return (
      <article className="lg:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 to-stone-800 dark:from-stone-800 dark:to-stone-900">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={campaign.imageUrl}
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/95 via-stone-900/80 to-stone-900/40" />
        </div>

        {/* Urgency badge */}
        {isUrgent && (
          <div className="absolute top-6 left-6 z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white text-sm font-semibold animate-pulse">
              <Flame className="w-4 h-4" />
              Campagne urgente
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 p-8 sm:p-10 min-h-[400px] flex flex-col justify-end">
          {/* Category */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium w-fit mb-4">
            <span>{categoryInfo.icon}</span>
            {categoryInfo.label}
          </div>

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight max-w-2xl">
            {campaign.title}
          </h2>

          {/* Description */}
          <p className="text-white/70 text-base sm:text-lg mb-8 max-w-2xl leading-relaxed line-clamp-3">
            {campaign.description}
          </p>

          {/* Progress section */}
          <div className="mb-6">
            {/* Progress bar */}
            <div className="relative h-3 rounded-full bg-white/10 overflow-hidden mb-3">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
              {/* Animated shimmer */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div>
                <span className="text-2xl font-bold text-white tabular-nums">
                  {campaign.currentAmount.toLocaleString('fr-FR')}€
                </span>
                <span className="text-white/50 ml-2">
                  sur {campaign.goalAmount.toLocaleString('fr-FR')}€
                </span>
              </div>

              <div className="flex items-center gap-2 text-white/60">
                <Users className="w-4 h-4" />
                <span>{campaign.contributorsCount} contributeurs</span>
              </div>

              <div className="flex items-center gap-2 text-white/60">
                <Clock className="w-4 h-4" />
                <span>{daysLeft} jours restants</span>
              </div>
            </div>
          </div>

          {/* Donation section */}
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="
                inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl
                bg-white text-stone-900 font-bold text-base
                hover:bg-emerald-50 hover:scale-[1.02]
                shadow-xl shadow-black/20
                transition-all duration-200 w-fit
              "
            >
              <span>💚</span>
              Contribuer à cette campagne
            </button>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-lg">
              <p className="text-white font-medium mb-4">Choisissez un montant :</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount)
                      setCustomAmount('')
                    }}
                    className={`
                      px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200
                      ${selectedAmount === amount
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/20 text-white hover:bg-white/30'
                      }
                    `}
                  >
                    {amount}€
                  </button>
                ))}
                <input
                  type="number"
                  placeholder="Autre"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value)
                    setSelectedAmount(null)
                  }}
                  className="w-24 px-4 py-2 rounded-xl bg-white/20 text-white placeholder-white/50 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDonate}
                  disabled={!selectedAmount && !customAmount}
                  className="
                    flex-1 py-3 px-6 rounded-xl
                    bg-emerald-500 text-white font-semibold
                    hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                  "
                >
                  Confirmer le don
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="py-3 px-4 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </article>
    )
  }

  // Standard card layout
  return (
    <article className={`
      group relative overflow-hidden rounded-2xl
      bg-white dark:bg-stone-900
      border border-stone-200 dark:border-stone-700
      transition-all duration-300
      hover:shadow-xl hover:shadow-stone-200/50 dark:hover:shadow-stone-900/50
      hover:border-stone-300 dark:hover:border-stone-600
      ${isCompleted ? 'opacity-75' : ''}
    `}>
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={campaign.imageUrl}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Status badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {isCompleted && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Objectif atteint
            </div>
          )}
          {isUrgent && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              Urgent
            </div>
          )}
        </div>

        {/* Category badge */}
        <div className="absolute bottom-4 left-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm text-stone-700 dark:text-stone-300 text-xs font-medium">
            <span>{categoryInfo.icon}</span>
            {categoryInfo.label}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {campaign.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 line-clamp-2">
          {campaign.description}
        </p>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="relative h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div
              className={`
                absolute inset-y-0 left-0 rounded-full transition-all duration-500
                ${isCompleted
                  ? 'bg-emerald-500'
                  : isUrgent
                    ? 'bg-gradient-to-r from-red-500 to-orange-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                }
              `}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between items-center mt-2 text-sm">
            <span className="font-bold text-stone-900 dark:text-white tabular-nums">
              {campaign.currentAmount.toLocaleString('fr-FR')}€
              <span className="font-normal text-stone-500 dark:text-stone-400">
                {' '}/ {campaign.goalAmount.toLocaleString('fr-FR')}€
              </span>
            </span>
            <span className="text-stone-500 dark:text-stone-400">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400 mb-5">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{campaign.contributorsCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{daysLeft}j</span>
          </div>
        </div>

        {/* Action button */}
        {!isCompleted && (
          !isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="
                w-full py-3 px-4 rounded-xl
                bg-stone-900 dark:bg-white text-white dark:text-stone-900
                font-semibold text-sm
                hover:bg-stone-800 dark:hover:bg-stone-100
                transition-all duration-200
              "
            >
              Contribuer
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount)
                      setCustomAmount('')
                    }}
                    className={`
                      px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200
                      ${selectedAmount === amount
                        ? 'bg-emerald-500 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }
                    `}
                  >
                    {amount}€
                  </button>
                ))}
                <input
                  type="number"
                  placeholder="..."
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value)
                    setSelectedAmount(null)
                  }}
                  className="w-16 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDonate}
                  disabled={!selectedAmount && !customAmount}
                  className="
                    flex-1 py-2.5 px-4 rounded-xl
                    bg-emerald-500 text-white font-semibold text-sm
                    hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                  "
                >
                  Confirmer
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          )
        )}

        {isCompleted && (
          <div className="w-full py-3 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium text-sm text-center">
            Merci à tous les contributeurs !
          </div>
        )}
      </div>
    </article>
  )
}
