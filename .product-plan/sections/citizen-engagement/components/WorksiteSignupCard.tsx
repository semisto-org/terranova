import type { Worksite } from '../types'
import { Calendar, Clock, MapPin, Users, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'

interface WorksiteSignupCardProps {
  worksite: Worksite
  isJoined: boolean
  onJoin?: () => void
  onLeave?: () => void
}

export function WorksiteSignupCard({
  worksite,
  isJoined,
  onJoin,
  onLeave,
}: WorksiteSignupCardProps) {
  const isFull = worksite.status === 'full'
  const spotsLeft = worksite.maxParticipants - worksite.currentParticipants
  const occupancyPercent = (worksite.currentParticipants / worksite.maxParticipants) * 100

  // Format date nicely
  const date = new Date(worksite.date)
  const day = date.getDate()
  const month = date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()
  const weekday = date.toLocaleDateString('fr-FR', { weekday: 'long' })

  // Determine urgency styling based on spots left
  const isAlmostFull = spotsLeft <= 3 && spotsLeft > 0

  return (
    <article className={`
      group relative overflow-hidden rounded-2xl
      bg-white dark:bg-stone-900
      border border-stone-200 dark:border-stone-700
      transition-all duration-300
      ${isJoined
        ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-stone-50 dark:ring-offset-stone-950'
        : 'hover:shadow-xl hover:shadow-stone-200/50 dark:hover:shadow-stone-900/50'
      }
    `}>
      {/* Image header */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={worksite.imageUrl}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Date badge - editorial style */}
        <div className="absolute top-4 left-4">
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-white dark:bg-stone-900 shadow-lg">
            <span className="text-2xl font-bold text-stone-900 dark:text-white leading-none">{day}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide">{month}</span>
          </div>
        </div>

        {/* Status badge */}
        {isJoined && (
          <div className="absolute top-4 right-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              Inscrit
            </div>
          </div>
        )}
        {isFull && !isJoined && (
          <div className="absolute top-4 right-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-700 text-white text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              Complet
            </div>
          </div>
        )}

        {/* Title on image */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">
            {worksite.title}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Meta info */}
        <div className="flex flex-col gap-2 mb-4 text-sm">
          <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
            <Calendar className="w-4 h-4 text-stone-400" />
            <span className="capitalize">{weekday}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
            <Clock className="w-4 h-4 text-stone-400" />
            <span>{worksite.startTime} - {worksite.endTime}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
            <MapPin className="w-4 h-4 text-stone-400" />
            <span className="line-clamp-1">{worksite.location}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 line-clamp-2">
          {worksite.description}
        </p>

        {/* Participants gauge */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
              <Users className="w-4 h-4" />
              <span>{worksite.currentParticipants} / {worksite.maxParticipants} inscrits</span>
            </div>
            {isAlmostFull && !isFull && (
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Plus que {spotsLeft} places !
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFull
                  ? 'bg-stone-400 dark:bg-stone-600'
                  : isAlmostFull
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                    : 'bg-gradient-to-r from-emerald-400 to-teal-500'
              }`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>

        {/* What's provided */}
        {worksite.provided.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
              Ce qui est fourni :
            </p>
            <div className="flex flex-wrap gap-1.5">
              {worksite.provided.slice(0, 4).map((item, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium"
                >
                  {item}
                </span>
              ))}
              {worksite.provided.length > 4 && (
                <span className="px-2 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-medium">
                  +{worksite.provided.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action button */}
        {isJoined ? (
          <div className="flex gap-2">
            <button
              onClick={onLeave}
              className="
                flex-1 py-3 px-4 rounded-xl
                bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300
                font-medium text-sm
                hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400
                transition-colors
              "
            >
              Se désinscrire
            </button>
            <button
              className="
                py-3 px-4 rounded-xl
                bg-emerald-500 text-white
                font-semibold text-sm
                hover:bg-emerald-400
                transition-colors flex items-center gap-1
              "
            >
              Voir les détails
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : isFull ? (
          <button
            className="
              w-full py-3 px-4 rounded-xl
              bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400
              font-medium text-sm
              cursor-not-allowed
            "
            disabled
          >
            Complet - Liste d'attente
          </button>
        ) : (
          <button
            onClick={onJoin}
            className={`
              w-full py-3 px-4 rounded-xl
              font-semibold text-sm
              transition-all duration-200 hover:scale-[1.02]
              flex items-center justify-center gap-2
              ${isAlmostFull
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-orange-400'
                : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400'
              }
            `}
          >
            <span>🌱</span>
            {isAlmostFull ? 'Vite, je m\'inscris !' : 'Je m\'inscris'}
          </button>
        )}
      </div>

      {/* Requirements tooltip/expandable - shown on hover */}
      {worksite.requirements.length > 0 && (
        <div className="
          absolute bottom-0 left-0 right-0
          bg-amber-50 dark:bg-amber-900/30
          border-t border-amber-200/50 dark:border-amber-700/50
          px-5 py-3
          opacity-0 group-hover:opacity-100
          transform translate-y-full group-hover:translate-y-0
          transition-all duration-300
        ">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">
            À apporter :
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {worksite.requirements.join(' • ')}
          </p>
        </div>
      )}
    </article>
  )
}
