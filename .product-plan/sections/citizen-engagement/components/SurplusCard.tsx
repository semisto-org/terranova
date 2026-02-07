import type { Surplus, Citizen, ExchangeMode, SurplusCategory } from '../types'

interface SurplusCardProps {
  surplus: Surplus
  citizen: Citizen | undefined
  onContact?: () => void
  onReserve?: () => void
  delay?: number
}

const exchangeModeConfig: Record<ExchangeMode, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  don: {
    label: 'Don',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/40',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  troc: {
    label: 'Troc',
    color: 'text-violet-700 dark:text-violet-300',
    bgColor: 'bg-violet-100 dark:bg-violet-900/40',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  vente: {
    label: 'Vente',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
}

const categoryLabels: Record<SurplusCategory, string> = {
  fruits: 'Fruits',
  greffons: 'Greffons',
  boutures: 'Boutures',
  semences: 'Semences',
  transforme: 'Transformé',
}

export function SurplusCard({
  surplus,
  citizen,
  onContact,
  onReserve,
  delay = 0,
}: SurplusCardProps) {
  const modeConfig = exchangeModeConfig[surplus.exchangeMode]

  // Format dates
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-BE', {
      day: 'numeric',
      month: 'short',
    })
  }

  // Check if available
  const now = new Date()
  const availableFrom = new Date(surplus.availableFrom)
  const availableUntil = new Date(surplus.availableUntil)
  const isAvailable = now >= availableFrom && now <= availableUntil
  const isUpcoming = now < availableFrom

  return (
    <article
      className="group relative rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-stone-200/50 dark:hover:shadow-stone-900/50 hover:border-amber-300/50 dark:hover:border-amber-600/30 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Image section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-stone-800">
        <img
          src={surplus.imageUrl}
          alt={surplus.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />

        {/* Exchange mode badge */}
        <div className={`
          absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
          ${modeConfig.bgColor} ${modeConfig.color} backdrop-blur-sm
          text-xs font-semibold
        `}>
          {modeConfig.icon}
          {modeConfig.label}
        </div>

        {/* Price (if vente) */}
        {surplus.exchangeMode === 'vente' && surplus.price && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-stone-900/80 backdrop-blur-sm text-white text-sm font-bold">
            {surplus.price} €
          </div>
        )}

        {/* Availability status */}
        {isUpcoming && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/90 backdrop-blur-sm text-white text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Dès le {formatDate(surplus.availableFrom)}
          </div>
        )}

        {/* Citizen avatar (bottom right) */}
        {citizen && (
          <div className="absolute bottom-3 right-3">
            <img
              src={citizen.avatarUrl}
              alt={`${citizen.firstName} ${citizen.lastName}`}
              className="w-10 h-10 rounded-full border-2 border-white shadow-lg object-cover"
            />
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="p-4">
        {/* Category tag */}
        <span className="inline-block px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-xs font-medium mb-2">
          {categoryLabels[surplus.category]}
        </span>

        {/* Title */}
        <h3 className="font-semibold text-stone-900 dark:text-white mb-1 line-clamp-1">
          {surplus.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-3 leading-relaxed">
          {surplus.description}
        </p>

        {/* Quantity and seller */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-300">
              <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              {surplus.quantity}
            </span>
          </div>

          {citizen && (
            <span className="text-stone-400 dark:text-stone-500 truncate max-w-[100px]">
              par {citizen.firstName}
            </span>
          )}
        </div>

        {/* Availability period */}
        <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            {formatDate(surplus.availableFrom)} - {formatDate(surplus.availableUntil)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onContact}
            className="
              flex-1 px-4 py-2.5 rounded-xl font-medium text-sm
              bg-stone-900 dark:bg-white text-white dark:text-stone-900
              hover:bg-stone-800 dark:hover:bg-stone-100
              transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Contacter
          </button>

          {surplus.status === 'available' && (
            <button
              onClick={onReserve}
              className="
                px-4 py-2.5 rounded-xl font-medium text-sm
                border border-stone-200 dark:border-stone-700
                text-stone-700 dark:text-stone-300
                hover:border-amber-400 dark:hover:border-amber-500
                hover:text-amber-600 dark:hover:text-amber-400
                hover:bg-amber-50 dark:hover:bg-amber-900/20
                transition-all duration-200
              "
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none ring-1 ring-amber-400/30 dark:ring-amber-500/20" />
    </article>
  )
}
