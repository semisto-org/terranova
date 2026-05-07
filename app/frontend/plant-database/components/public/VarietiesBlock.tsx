type Variety = { id: string; latinName: string; additionalNotes?: string | null }

export function VarietiesBlock({ varieties }: { varieties: Variety[] }) {
  if (!varieties || varieties.length === 0) return null
  return (
    <section className="px-6 md:px-12 py-8 max-w-3xl mx-auto border-t border-stone-200">
      <h2 className="font-serif text-2xl text-stone-900 mb-4">Variétés</h2>
      <ul className="space-y-2">
        {varieties.map(v => (
          <li key={v.id} className="p-3 bg-white rounded border border-stone-200">
            <div className="italic font-semibold">{v.latinName}</div>
            {v.additionalNotes && <div className="text-sm text-stone-600 mt-1">{v.additionalNotes}</div>}
          </li>
        ))}
      </ul>
    </section>
  )
}
