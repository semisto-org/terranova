interface QuickActionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  color: 'green' | 'blue' | 'amber' | 'violet' | 'rose'
  onClick?: () => void
}

export function QuickActionCard({ title, description, icon, color, onClick }: QuickActionCardProps) {
  const colorClasses = {
    green: {
      bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      shadow: 'shadow-green-500/30 hover:shadow-green-500/40',
      iconBg: 'bg-white/20',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/30 hover:shadow-blue-500/40',
      iconBg: 'bg-white/20',
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-400 to-orange-500',
      shadow: 'shadow-amber-500/30 hover:shadow-amber-500/40',
      iconBg: 'bg-white/20',
    },
    violet: {
      bg: 'bg-gradient-to-br from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/30 hover:shadow-violet-500/40',
      iconBg: 'bg-white/20',
    },
    rose: {
      bg: 'bg-gradient-to-br from-rose-500 to-pink-600',
      shadow: 'shadow-rose-500/30 hover:shadow-rose-500/40',
      iconBg: 'bg-white/20',
    },
  }

  const classes = colorClasses[color]

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full p-5 rounded-2xl text-left text-white
        ${classes.bg}
        shadow-lg ${classes.shadow}
        transform transition-all duration-300
        hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl
        active:scale-[0.98]
        overflow-hidden
      `}
    >
      {/* Decorative circles */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
      <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/5" />

      {/* Content */}
      <div className="relative flex items-start gap-4">
        <div className={`p-3 rounded-xl ${classes.iconBg} backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-lg leading-tight mb-1">
            {title}
          </h4>
          <p className="text-sm text-white/80 leading-snug">
            {description}
          </p>
        </div>

        <svg
          className="w-5 h-5 text-white/60 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
