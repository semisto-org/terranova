import { Plus, Edit, Trash2, Layers } from 'lucide-react'

export function ContainerList({ containers, onCreate, onEdit, onDelete }) {
  const sorted = [...containers].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>Contenants</h1>
          <p className="mt-1 text-sm text-stone-600">Référentiel des pots, godets, racines nues utilisés en pépinière. Ces formats sont sélectionnables pour chaque lot de stock.</p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-md bg-[#EF9B0D] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#d88a0b] focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" /> Nouveau contenant
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <Layers className="mx-auto mb-3 h-7 w-7 text-stone-400" />
          <p className="font-serif text-xl italic text-stone-500" style={{ fontFamily: 'Sole Serif Small, serif' }}>Aucun contenant enregistré</p>
          <p className="mt-1 text-sm text-stone-500">Ajoute par exemple "Godet 9cm" (G9), "Pot 1 L" (P1), "Racines nues" (RN)…</p>
          <button onClick={onCreate} className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#EF9B0D] px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Premier contenant</button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          {/* Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-[#fbe6c3] border-b border-stone-200 text-xs font-semibold uppercase tracking-wide text-stone-700">
            <div className="col-span-1">Code</div>
            <div className="col-span-3">Nom</div>
            <div className="col-span-2">Volume</div>
            <div className="col-span-1 text-right">Ordre</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-1" />
          </div>
          <div className="divide-y divide-stone-200">
            {sorted.map((c) => (
              <ContainerRow key={c.id} container={c} onEdit={() => onEdit?.(c)} onDelete={() => onDelete?.(c)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ContainerRow({ container, onEdit, onDelete }) {
  return (
    <div className="group">
      {/* Desktop row */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 items-center px-4 py-3 transition-colors hover:bg-stone-50">
        <div className="col-span-1">
          <span className="inline-flex items-center justify-center rounded-md bg-[#fbe6c3] px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#7a4d05]">
            {container.shortName}
          </span>
        </div>
        <div className="col-span-3 font-serif text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>{container.name}</div>
        <div className="col-span-2 text-sm text-stone-700">{formatVolume(container.volumeLiters)}</div>
        <div className="col-span-1 text-right text-sm text-stone-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{container.sortOrder ?? '—'}</div>
        <div className="col-span-4 truncate text-sm text-stone-600">{container.description || <span className="text-stone-300">—</span>}</div>
        <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onEdit} title="Modifier" className="rounded-md p-1.5 text-stone-500 transition hover:bg-[#fbe6c3]/60 hover:text-[#EF9B0D]">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={onDelete} title="Supprimer" className="rounded-md p-1.5 text-stone-500 transition hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile row */}
      <div className="md:hidden p-4 space-y-2">
        <div className="flex items-start gap-3">
          <span className="inline-flex shrink-0 items-center justify-center rounded-md bg-[#fbe6c3] px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#7a4d05]">
            {container.shortName}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>{container.name}</p>
            <p className="text-xs text-stone-500">{formatVolume(container.volumeLiters)}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onEdit} title="Modifier" className="rounded-md p-1.5 text-stone-500 hover:bg-[#fbe6c3]/60 hover:text-[#EF9B0D]"><Edit className="h-4 w-4" /></button>
            <button onClick={onDelete} title="Supprimer" className="rounded-md p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
        {container.description && <p className="text-xs text-stone-600">{container.description}</p>}
      </div>
    </div>
  )
}

function formatVolume(L) {
  if (L == null) return '—'
  if (L < 1) return `${Math.round(L * 1000)} mL`
  if (Number.isInteger(L)) return `${L} L`
  return `${L.toFixed(1)} L`
}
