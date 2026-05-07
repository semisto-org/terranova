const RESOURCE_FR: Record<string, string> = {
  edible: 'Comestible', aromatic: 'Aromatique', medicinal: 'Médicinale',
  fiber: 'Fibre', sensory: 'Sensorielle', animal: 'Animale',
}
const PART_FR: Record<string, string> = {
  fruit: 'fruit', flower: 'fleur', leaf: 'feuille', seed: 'graine',
  root: 'racine', bark: 'écorce', sap: 'sève', stem: 'tige',
  ornamental: 'ornementale', dye: 'tinctoriale', fragrant: 'odorante',
  pecked: 'picorée', browsed: 'broutée',
}
const ORDER = ['edible', 'aromatic', 'medicinal', 'fiber', 'sensory', 'animal']

export function ResourcesBlock({ species }: { species: any }) {
  const parts: Record<string, string[]> = species.resourceParts || {}
  const filled = ORDER.filter(cat => (parts[cat]?.length ?? 0) > 0)
  if (filled.length === 0) return null

  return (
    <section className="px-6 md:px-12 py-8 max-w-3xl mx-auto border-t border-stone-200">
      <h2 className="font-serif text-2xl text-stone-900 mb-4">Ressources</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filled.map(cat => (
          <div key={cat} className="p-4 bg-white rounded-lg border border-stone-200">
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold">{RESOURCE_FR[cat]}</div>
            <div className="mt-1 text-sm text-stone-700">
              {(parts[cat] || []).map(p => PART_FR[p] || p).join(', ')}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
