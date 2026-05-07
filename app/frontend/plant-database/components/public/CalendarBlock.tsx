const MONTH_LETTERS = ['J','F','M','A','M','J','J','A','S','O','N','D']
const MONTH_IDS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']

export function CalendarBlock({ species }: { species: any }) {
  const flowMonths = species.floweringMonths || []
  const harvMonths = species.harvestMonths || []
  if (flowMonths.length === 0 && harvMonths.length === 0) {
    return null
  }
  const flow = new Set<string>(flowMonths)
  const harv = new Set<string>(harvMonths)

  return (
    <section className="px-6 md:px-12 py-8 max-w-3xl mx-auto border-t border-stone-200">
      <h2 className="font-serif text-2xl text-stone-900 mb-4">Calendrier</h2>
      <div className="grid grid-cols-12 gap-1">
        {MONTH_IDS.map((id, i) => {
          const isFlow = flow.has(id)
          const isHarv = harv.has(id)
          const both = isFlow && isHarv
          const bg = both ? 'bg-gradient-to-b from-[#AFBD00] from-50% to-[#EF9B0D] to-50%'
            : isFlow ? 'bg-[#AFBD00]'
            : isHarv ? 'bg-[#EF9B0D]'
            : 'bg-stone-100'
          const fg = (isFlow || isHarv) ? 'text-white' : 'text-stone-400'
          return (
            <div key={id} className={`h-8 rounded flex items-center justify-center text-sm font-bold ${bg} ${fg}`}>
              {MONTH_LETTERS[i]}
            </div>
          )
        })}
      </div>
      <div className="flex justify-end gap-4 text-xs text-stone-500 mt-2 uppercase tracking-wider">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#AFBD00]"></span> Floraison
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#EF9B0D]"></span> Récolte
        </span>
      </div>
    </section>
  )
}
