import { Sun, Droplets, Leaf } from 'lucide-react'

const FOLIAGE_LABELS: Record<string, string> = {
  deciduous: 'Caduc',
  'semi-evergreen': 'Semi-persistant',
  evergreen: 'Persistant',
  marcescent: 'Marcescent',
}

const WATER_LABELS = ['Sec', 'Très sec', 'Faible', 'Modéré', 'Régulier', 'Humide']

function sunLabel(exposures: string[]): string {
  if (!exposures || exposures.length === 0) return '—'
  if (exposures.includes('sun') && exposures.includes('partial-shade')) return 'Plein soleil et mi-ombre'
  if (exposures.includes('sun')) return 'Plein soleil'
  if (exposures.includes('partial-shade')) return 'Mi-ombre'
  return 'Ombre'
}

export function ConditionsBlock({ species }: { species: any }) {
  const water = species.wateringNeed != null ? Number(species.wateringNeed) : null
  return (
    <section className="px-6 md:px-12 py-8 max-w-3xl mx-auto border-t border-stone-200">
      <h2 className="font-serif text-2xl text-stone-900 mb-4">Conditions de culture</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-stone-200">
          <Sun className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Soleil</div>
            <div className="font-semibold mt-0.5">{sunLabel(species.exposures || [])}</div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-stone-200">
          <Droplets className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Eau</div>
            <div className="font-semibold mt-0.5">
              {water != null ? `${WATER_LABELS[water] || '—'} (${water}/5)` : '—'}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-stone-200">
          <Leaf className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Feuillage</div>
            <div className="font-semibold mt-0.5">{FOLIAGE_LABELS[species.foliageType] || '—'}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
