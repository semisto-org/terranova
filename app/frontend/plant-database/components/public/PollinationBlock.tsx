const FERTILITY_LABELS: Record<string, string> = {
  'self-fertile': 'Auto-fertile',
  'self-sterile': 'Pollinisation croisée',
  'partially-self-fertile': 'Partiellement auto-fertile',
  dioecious: 'Dioïque (♂♀ séparés)',
}

const POLLINATOR_LABELS: Record<string, string> = {
  bees: 'abeilles',
  bumblebees: 'bourdons',
  butterflies: 'papillons',
  hoverflies: 'syrphes',
  beetles: 'coléoptères',
  wind: 'vent',
  birds: 'oiseaux',
}

export function PollinationBlock({ species }: { species: any }) {
  const fertilityLabel = species.fertility ? FERTILITY_LABELS[species.fertility] : null
  const pollinators = species.specificPollinators || []
  const distance = species.pollinationDistanceM

  if (!fertilityLabel && !distance && pollinators.length === 0) {
    return null
  }

  const pollList = pollinators.map((p: string) => POLLINATOR_LABELS[p] || p).join(', ')

  return (
    <section className="px-6 md:px-12 py-8 max-w-3xl mx-auto border-t border-stone-200">
      <h2 className="font-serif text-2xl text-stone-900 mb-4">Pollinisation</h2>
      <div className="bg-pink-50 border-l-4 border-pink-500 rounded-r-lg p-5 space-y-3">
        {fertilityLabel && (
          <div>
            <div className="text-xs uppercase tracking-wider text-pink-700 font-bold">Statut</div>
            <div className="text-lg font-semibold mt-1">{fertilityLabel}</div>
          </div>
        )}
        {pollList && (
          <div className="text-sm text-stone-700">
            <strong>Pollinisateurs :</strong> {pollList}
          </div>
        )}
        {distance && (
          <div className="text-sm text-stone-700">
            <strong>Distance bénéfique :</strong> &lt; {distance} m
          </div>
        )}
      </div>
    </section>
  )
}
