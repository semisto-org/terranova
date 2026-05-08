type Filter = 'all' | 'with' | 'without' | 'running' | 'failed'

interface Props {
  filter: Filter
  onFilterChange: (f: Filter) => void
  showCardContext: boolean
  onShowCardContextChange: (b: boolean) => void
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'with', label: 'Avec illustration' },
  { value: 'without', label: 'Sans illustration' },
  { value: 'running', label: 'En cours' },
  { value: 'failed', label: 'Erreurs' }
]

export function IllustrationFilterBar({
  filter,
  onFilterChange,
  showCardContext,
  onShowCardContextChange
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      <span className="text-[10px] uppercase tracking-[0.22em] text-stone-500 mr-1 hidden md:inline">
        Filtrer
      </span>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => {
          const active = filter === f.value
          return (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              aria-pressed={active}
              className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border
                ${active
                  ? 'bg-[#AFBD00] border-[#7a8d3a] text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.12)]'
                  : 'bg-white/70 border-stone-300 text-stone-600 hover:bg-stone-50 hover:border-stone-400 hover:text-stone-900'
                }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <label className="ml-auto flex items-center gap-2 text-xs text-stone-600 cursor-pointer select-none group">
        <span className="relative inline-flex items-center">
          <input
            type="checkbox"
            checked={showCardContext}
            onChange={e => onShowCardContextChange(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="w-9 h-5 rounded-full bg-stone-300 peer-checked:bg-[#5B5781] transition-colors"
          />
          <span
            aria-hidden
            className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4"
          />
        </span>
        <span className="group-hover:text-stone-900 transition-colors">
          Voir en contexte fiche
        </span>
      </label>
    </div>
  )
}
