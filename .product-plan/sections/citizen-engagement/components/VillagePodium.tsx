import type { Village, VillageBadge } from '../types'

interface VillagePodiumProps {
  first: Village
  second: Village
  third: Village
  onViewVillage?: (id: string) => void
}

const badgeConfig: Record<VillageBadge, { label: string; color: string; bgColor: string; icon: string }> = {
  eveil: {
    label: 'En éveil',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    icon: '🌱',
  },
  planteur: {
    label: 'Planteur',
    color: 'text-lime-600 dark:text-lime-400',
    bgColor: 'bg-lime-100 dark:bg-lime-900/40',
    icon: '🌿',
  },
  nourricier: {
    label: 'Nourricier',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/40',
    icon: '🌳',
  },
  resilient: {
    label: 'Résilient',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
    icon: '🏆',
  },
}

function PodiumPlace({
  village,
  position,
  onView,
}: {
  village: Village
  position: 1 | 2 | 3
  onView?: () => void
}) {
  const badge = badgeConfig[village.badge]

  const positionStyles = {
    1: {
      height: 'h-44',
      medal: '🥇',
      gradient: 'from-amber-400 via-yellow-300 to-amber-500',
      glow: 'shadow-[0_0_60px_rgba(251,191,36,0.4)]',
      delay: '200ms',
      scale: 'scale-110',
      zIndex: 'z-20',
    },
    2: {
      height: 'h-36',
      medal: '🥈',
      gradient: 'from-slate-300 via-gray-200 to-slate-400',
      glow: 'shadow-[0_0_40px_rgba(148,163,184,0.3)]',
      delay: '400ms',
      scale: 'scale-100',
      zIndex: 'z-10',
    },
    3: {
      height: 'h-28',
      medal: '🥉',
      gradient: 'from-amber-600 via-orange-400 to-amber-700',
      glow: 'shadow-[0_0_40px_rgba(217,119,6,0.3)]',
      delay: '600ms',
      scale: 'scale-100',
      zIndex: 'z-10',
    },
  }

  const style = positionStyles[position]

  return (
    <div
      className={`
        flex flex-col items-center
        ${position === 1 ? 'order-2' : position === 2 ? 'order-1' : 'order-3'}
        ${style.zIndex}
        animate-slideUp
      `}
      style={{ animationDelay: style.delay }}
    >
      {/* Village Card */}
      <button
        onClick={onView}
        className={`
          group relative mb-4 p-4 rounded-2xl bg-white dark:bg-stone-800
          border-2 border-stone-200 dark:border-stone-700
          hover:border-green-400 dark:hover:border-green-500
          transition-all duration-300
          ${style.glow}
          ${position === 1 ? style.scale : ''}
          hover:scale-105
        `}
      >
        {/* Medal */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-4xl animate-bounce-slow">
          {style.medal}
        </div>

        {/* Village Badge Icon */}
        <div className="text-4xl mb-2 text-center transition-transform group-hover:scale-110">
          {badge.icon}
        </div>

        {/* Village Name */}
        <h3 className="font-bold text-stone-900 dark:text-white text-lg text-center mb-1">
          {village.name}
        </h3>

        {/* Badge Label */}
        <div className={`text-xs font-medium ${badge.color} text-center mb-2`}>
          {badge.label}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-3 text-sm">
          <div className="text-center">
            <p className="font-bold text-green-600 dark:text-green-400">
              {village.hectaresPlanted.toFixed(1)}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">ha</p>
          </div>
          <div className="w-px h-6 bg-stone-200 dark:bg-stone-700" />
          <div className="text-center">
            <p className="font-bold text-stone-900 dark:text-white">
              {village.activeCitizens}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">citoyens</p>
          </div>
        </div>

        {/* Sparkle effect on hover */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute top-2 left-2 w-1 h-1 bg-yellow-400 rounded-full animate-sparkle-1" />
          <div className="absolute top-4 right-3 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-sparkle-2" />
          <div className="absolute bottom-3 left-4 w-1 h-1 bg-amber-400 rounded-full animate-sparkle-3" />
        </div>
      </button>

      {/* Podium Base */}
      <div
        className={`
          relative ${style.height} w-28 rounded-t-lg
          bg-gradient-to-b ${style.gradient}
          flex items-start justify-center pt-3
          shadow-lg
          transform-gpu
        `}
        style={{
          clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
        }}
      >
        <span className="text-3xl font-black text-white/90 drop-shadow-lg">
          {position}
        </span>

        {/* Shine effect */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{
            clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
          }}
        />
      </div>
    </div>
  )
}

export function VillagePodium({ first, second, third, onViewVillage }: VillagePodiumProps) {
  return (
    <div className="relative">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 rounded-full bg-gradient-to-br from-amber-200/30 via-yellow-100/20 to-transparent dark:from-amber-900/20 dark:via-yellow-900/10 blur-3xl" />
      </div>

      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`
              absolute w-2 h-2 rounded-full
              ${i % 3 === 0 ? 'bg-amber-400' : i % 3 === 1 ? 'bg-green-400' : 'bg-emerald-400'}
              animate-confetti
            `}
            style={{
              left: `${10 + (i * 7)}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      {/* Podium */}
      <div className="relative flex items-end justify-center gap-2 sm:gap-4 pt-16 pb-8">
        <PodiumPlace
          village={second}
          position={2}
          onView={() => onViewVillage?.(second.id)}
        />
        <PodiumPlace
          village={first}
          position={1}
          onView={() => onViewVillage?.(first.id)}
        />
        <PodiumPlace
          village={third}
          position={3}
          onView={() => onViewVillage?.(third.id)}
        />
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes sparkle-1 {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes sparkle-2 {
          0%, 100% { opacity: 0; transform: scale(0); }
          60% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes sparkle-3 {
          0%, 100% { opacity: 0; transform: scale(0); }
          40% { opacity: 1; transform: scale(0.8); }
        }
        @keyframes confetti {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
        }
        .animate-slideUp { animation: slideUp 0.8s ease-out forwards; opacity: 0; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-sparkle-1 { animation: sparkle-1 1.5s ease-in-out infinite; }
        .animate-sparkle-2 { animation: sparkle-2 1.8s ease-in-out infinite 0.3s; }
        .animate-sparkle-3 { animation: sparkle-3 1.3s ease-in-out infinite 0.6s; }
        .animate-confetti { animation: confetti 4s linear infinite; }
      `}</style>
    </div>
  )
}
