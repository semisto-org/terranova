import type { Package } from '../types'

interface PackageCardProps {
  pkg: Package
  onInterest?: () => void
  onView?: () => void
}

const typeIcons: Record<Package['type'], string> = {
  'citizen-project': 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  'team-building': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  'sponsorship': 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  'recurring-patronage': 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  'training': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  'ambassador': 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
}

export function PackageCard({ pkg, onInterest, onView }: PackageCardProps) {
  return (
    <div
      className={`
        group relative flex flex-col rounded-2xl overflow-hidden
        bg-white dark:bg-stone-900
        border transition-all duration-300
        hover:shadow-xl hover:shadow-stone-200/60 dark:hover:shadow-stone-950/60
        hover:-translate-y-1
        ${pkg.highlighted
          ? 'border-[#5B5781]/30 dark:border-[#5B5781]/40 ring-1 ring-[#5B5781]/10'
          : 'border-stone-200/80 dark:border-stone-800'
        }
      `}
    >
      {/* Highlighted badge */}
      {pkg.highlighted && (
        <div
          className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
          style={{ background: '#5B5781' }}
        >
          Recommandé
        </div>
      )}

      {/* Image area with overlay */}
      <div className="relative h-44 overflow-hidden">
        <div
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
          style={{
            background: pkg.highlighted
              ? 'linear-gradient(135deg, #5B5781 0%, #3d3a57 100%)'
              : 'linear-gradient(135deg, #f5f5f4 0%, #e7e5e4 100%)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`
              w-16 h-16 rounded-2xl flex items-center justify-center
              transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
              ${pkg.highlighted
                ? 'bg-white/20'
                : 'bg-stone-200/80 dark:bg-stone-700/80'
              }
            `}
          >
            <svg
              className={`w-8 h-8 ${pkg.highlighted ? 'text-white' : 'text-stone-500 dark:text-stone-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={typeIcons[pkg.type]} />
            </svg>
          </div>
        </div>

        {/* Decorative circles */}
        <div
          className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full ${
            pkg.highlighted ? 'bg-white/5' : 'bg-stone-300/10 dark:bg-stone-600/10'
          }`}
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2 leading-snug">
          {pkg.shortTitle}
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 line-clamp-3 flex-1">
          {pkg.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-4 text-xs text-stone-400 dark:text-stone-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {pkg.duration}
          </span>
          <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
          <span className="font-medium text-stone-600 dark:text-stone-300">{pkg.priceRange}</span>
        </div>

        {/* Includes preview */}
        <div className="mb-5">
          <ul className="space-y-1.5">
            {pkg.includes.slice(0, 3).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-stone-500 dark:text-stone-400">
                <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#AFBD00' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
            {pkg.includes.length > 3 && (
              <li className="text-xs text-stone-400 dark:text-stone-500 pl-5.5">
                + {pkg.includes.length - 3} autres avantages
              </li>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={onInterest}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97] shadow-sm"
            style={{ background: '#5B5781' }}
          >
            Marquer mon intérêt
          </button>
          <button
            onClick={onView}
            className="py-2.5 px-3 rounded-xl text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border border-stone-200 dark:border-stone-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
