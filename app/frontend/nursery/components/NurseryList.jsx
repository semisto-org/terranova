import { Plus } from 'lucide-react'
import { NurseryCard } from './NurseryCard'

export function NurseryList({ nurseries, onView, onCreate, onEdit, onDelete }) {
  const platformNurseries = nurseries.filter((n) => n.integration === 'platform')
  const manualNurseries = nurseries.filter((n) => n.integration === 'manual')

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Pépinières partenaires</h1>
          <p className="text-stone-600">Gérez le réseau de pépinières Semisto et partenaires labellisées</p>
        </div>
        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#EF9B0D] hover:bg-[#EF9B0D]/90 rounded-lg transition-colors shadow-sm">
          <Plus className="w-4 h-4" />Ajouter une pépinière
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-stone-200 p-4"><div className="text-2xl font-bold text-stone-900">{nurseries.length}</div><div className="text-sm text-stone-600">Pépinières totales</div></div>
        <div className="bg-white rounded-lg border border-stone-200 p-4"><div className="text-2xl font-bold text-emerald-600">{platformNurseries.length}</div><div className="text-sm text-stone-600">Avec plateforme</div></div>
        <div className="bg-white rounded-lg border border-stone-200 p-4"><div className="text-2xl font-bold text-amber-600">{manualNurseries.length}</div><div className="text-sm text-stone-600">Gestion manuelle</div></div>
      </div>

      {platformNurseries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
            <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" />Plateforme ({platformNurseries.length})</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformNurseries.map((n) => <NurseryCard key={n.id} nursery={n} onView={() => onView?.(n.id)} onEdit={() => onEdit?.(n.id)} onDelete={() => onDelete?.(n.id)} />)}
          </div>
        </div>
      )}

      {manualNurseries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" />Manuel ({manualNurseries.length})</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {manualNurseries.map((n) => <NurseryCard key={n.id} nursery={n} onView={() => onView?.(n.id)} onEdit={() => onEdit?.(n.id)} onDelete={() => onDelete?.(n.id)} />)}
          </div>
        </div>
      )}

      {nurseries.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-stone-200">
          <Plus className="w-8 h-8 mx-auto text-stone-400 mb-4" />
          <h3 className="text-lg font-semibold text-stone-900 mb-2">Aucune pépinière</h3>
          <button onClick={onCreate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#EF9B0D] rounded-lg"><Plus className="w-4 h-4" />Ajouter</button>
        </div>
      )}
    </div>
  )
}
