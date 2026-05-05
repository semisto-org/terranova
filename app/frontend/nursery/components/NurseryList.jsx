import { Plus, Edit, Trash2, MapPin, PackageCheck, Package } from 'lucide-react'

export function NurseryList({ nurseries, onCreate, onEdit, onDelete }) {
  const platformNurseries = nurseries.filter((n) => n.integration === 'platform')
  const manualNurseries = nurseries.filter((n) => n.integration === 'manual')
  const sorted = [...nurseries].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>Pépinières partenaires</h1>
          <p className="mt-1 text-sm text-stone-600">Gérez le réseau de pépinières Semisto et partenaires labellisées.</p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-md bg-[#EF9B0D] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#d88a0b] focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" /> Nouvelle pépinière
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-stone-200 p-4"><div className="text-2xl font-bold text-stone-900">{nurseries.length}</div><div className="text-sm text-stone-600">Pépinières totales</div></div>
        <div className="bg-white rounded-lg border border-stone-200 p-4"><div className="text-2xl font-bold text-emerald-600">{platformNurseries.length}</div><div className="text-sm text-stone-600">Avec plateforme</div></div>
        <div className="bg-white rounded-lg border border-stone-200 p-4"><div className="text-2xl font-bold text-amber-600">{manualNurseries.length}</div><div className="text-sm text-stone-600">Gestion manuelle</div></div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <Plus className="mx-auto mb-3 h-7 w-7 text-stone-400" />
          <p className="font-serif text-xl italic text-stone-500" style={{ fontFamily: 'Sole Serif Small, serif' }}>Aucune pépinière enregistrée</p>
          <p className="mt-1 text-sm text-stone-500">Ajoute la première pépinière du réseau Semisto.</p>
          <button onClick={onCreate} className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#EF9B0D] px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Première pépinière</button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-[#fbe6c3] border-b border-stone-200 text-xs font-semibold uppercase tracking-wide text-stone-700">
            <div className="col-span-3">Nom</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Intégration</div>
            <div className="col-span-3">Localisation</div>
            <div className="col-span-1">Retrait</div>
            <div className="col-span-1" />
          </div>
          <div className="divide-y divide-stone-200">
            {sorted.map((n) => (
              <NurseryRow key={n.id} nursery={n} onEdit={() => onEdit?.(n.id)} onDelete={() => onDelete?.(n.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NurseryRow({ nursery, onEdit, onDelete }) {
  const isSemisto = nursery.type === 'semisto'
  const hasPlatform = nursery.integration === 'platform'

  return (
    <div className="group">
      {/* Desktop row */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 items-center px-4 py-3 transition-colors hover:bg-stone-50">
        <div className="col-span-3 min-w-0">
          <div className="font-serif text-stone-900 truncate" style={{ fontFamily: 'Sole Serif Small, serif' }}>{nursery.name}</div>
          {nursery.description && <div className="text-xs text-stone-500 truncate">{nursery.description}</div>}
        </div>
        <div className="col-span-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isSemisto ? 'bg-[#EF9B0D]/10 text-[#EF9B0D]' : 'bg-stone-100 text-stone-700'}`}>
            {isSemisto ? 'Semisto' : 'Partenaire'}
          </span>
        </div>
        <div className="col-span-2">
          {hasPlatform ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
              <PackageCheck className="h-3.5 w-3.5" /> Plateforme
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
              <Package className="h-3.5 w-3.5" /> Manuel
            </span>
          )}
        </div>
        <div className="col-span-3 min-w-0 text-sm text-stone-700">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
            <span className="truncate">{nursery.city}{nursery.postalCode ? ` · ${nursery.postalCode}` : ''}</span>
          </div>
        </div>
        <div className="col-span-1 text-xs text-stone-600">
          {nursery.isPickupPoint ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#fbe6c3] text-[#7a4d05] font-medium">Oui</span>
          ) : (
            <span className="text-stone-300">—</span>
          )}
        </div>
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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-serif text-stone-900 truncate" style={{ fontFamily: 'Sole Serif Small, serif' }}>{nursery.name}</p>
            <p className="text-xs text-stone-500 truncate">{nursery.city}{nursery.postalCode ? ` · ${nursery.postalCode}` : ''}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onEdit} title="Modifier" className="rounded-md p-1.5 text-stone-500 hover:bg-[#fbe6c3]/60 hover:text-[#EF9B0D]"><Edit className="h-4 w-4" /></button>
            <button onClick={onDelete} title="Supprimer" className="rounded-md p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${isSemisto ? 'bg-[#EF9B0D]/10 text-[#EF9B0D]' : 'bg-stone-100 text-stone-700'}`}>
            {isSemisto ? 'Semisto' : 'Partenaire'}
          </span>
          {hasPlatform ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
              <PackageCheck className="h-3 w-3" /> Plateforme
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
              <Package className="h-3 w-3" /> Manuel
            </span>
          )}
          {nursery.isPickupPoint && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#fbe6c3] text-[#7a4d05] text-xs font-medium">Point de retrait</span>
          )}
        </div>
      </div>
    </div>
  )
}
