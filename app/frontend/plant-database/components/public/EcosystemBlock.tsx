const ECO_LABELS: Record<string, string> = {
  windbreak: 'Brise-vent',
  mellifere: 'Mellifère',
  birds: 'Attire les oiseaux',
  'beneficial-insects': 'Insectes auxiliaires',
  'erosion-control': 'Anti-érosion',
  'light-shade': 'Ombre légère',
  nitrogen: 'Azote',
  'ground-cover': 'Tapissant',
  'cross-pollination': 'Pollinisation croisée',
  'organic-matter': 'Matière organique',
  minerals: 'Minéraux',
  'weed-suppression': 'Suppression des herbes',
}

const ECO_ORDER = [
  'windbreak', 'mellifere', 'birds', 'beneficial-insects', 'erosion-control',
  'light-shade', 'nitrogen', 'ground-cover', 'cross-pollination',
  'organic-matter', 'minerals', 'weed-suppression',
]

export function EcosystemBlock({ species }: { species: any }) {
  const provided = new Set<string>(species.ecoServicesProvided || [])
  const needed = new Set<string>(species.ecoServicesNeeded || [])

  if (provided.size === 0 && needed.size === 0) return null

  return (
    <section className="px-6 md:px-12 py-8 max-w-3xl mx-auto border-t border-stone-200">
      <h2 className="font-serif text-2xl text-stone-900 mb-4">Système écosystémique</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-3">Services rendus</h3>
          <ul className="space-y-1.5 text-sm">
            {ECO_ORDER.filter(id => provided.has(id)).map(id => (
              <li key={id} className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">●</span>
                <span>{ECO_LABELS[id]}</span>
              </li>
            ))}
            {provided.size === 0 && <li className="text-stone-400 italic">—</li>}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-violet-700 uppercase tracking-wider mb-3">Besoins</h3>
          <ul className="space-y-1.5 text-sm">
            {ECO_ORDER.filter(id => needed.has(id)).map(id => (
              <li key={id} className="flex items-start gap-2">
                <span className="text-violet-600 mt-0.5">●</span>
                <span>{ECO_LABELS[id]}</span>
              </li>
            ))}
            {needed.size === 0 && <li className="text-stone-400 italic">—</li>}
          </ul>
        </div>
      </div>
    </section>
  )
}
