import { AlertTriangle } from 'lucide-react'

const TOXICITY_TARGET_FR: Record<string, string> = {
  humans: 'humains', sheep: 'brebis', dogs: 'chiens',
  horses: 'chevaux', poultry: 'volaille', cattle: 'bovins',
}
const PART_FR: Record<string, string> = {
  fruit: 'fruit', flower: 'fleur', leaf: 'feuille', seed: 'graine',
  root: 'racine', bark: 'écorce', sap: 'sève', stem: 'tige',
}

export function CautionsBlock({ species }: { species: any }) {
  const items: string[] = []
  if (species.isDrageonnant) {
    items.push('Plante drageonnante (système racinaire traçant et envahissant)')
  }
  if (species.allelopathy) {
    items.push(`Allélopathique : ${species.allelopathy}`)
  }
  Object.entries(species.toxicity || {}).forEach(([target, parts]) => {
    if (Array.isArray(parts) && parts.length > 0) {
      const partsLabel = parts.map(p => PART_FR[p as string] || p).join(', ')
      items.push(`Toxique pour les ${TOXICITY_TARGET_FR[target] || target} (${partsLabel})`)
    }
  })

  if (items.length === 0) return null

  return (
    <section className="px-6 md:px-12 py-8 max-w-3xl mx-auto border-t border-stone-200">
      <h2 className="font-serif text-2xl text-stone-900 mb-4">Précautions</h2>
      <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-5">
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
