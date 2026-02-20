import { useState, useMemo } from 'react'
import { Plus, Truck, MapPin, Clock, Route, CheckCircle2, PlayCircle } from 'lucide-react'

const statusLabels = { planned: 'Planifié', 'in-progress': 'En cours', completed: 'Terminé', cancelled: 'Annulé' }
const statusColors = {
  planned: 'bg-blue-50 border-blue-500 text-blue-600',
  'in-progress': 'bg-[#fbe6c3] border-[#EF9B0D] text-[#EF9B0D]',
  completed: 'bg-green-50 border-green-500 text-green-600',
  cancelled: 'bg-stone-100 border-stone-400 text-stone-600',
}

export function TransferManagement({ transfers, nurseries, onView, onCreate, onStart, onComplete, onCancel }) {
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredTransfers = useMemo(() => {
    if (statusFilter === 'all') return transfers
    return transfers.filter((t) => t.status === statusFilter)
  }, [transfers, statusFilter])

  const statusCounts = {
    planned: transfers.filter((t) => t.status === 'planned').length,
    'in-progress': transfers.filter((t) => t.status === 'in-progress').length,
    completed: transfers.filter((t) => t.status === 'completed').length,
    cancelled: transfers.filter((t) => t.status === 'cancelled').length,
  }

  const buttons = [
    { key: 'all', label: 'Tous', count: transfers.length },
    { key: 'planned', label: 'Planifiés', count: statusCounts.planned, color: 'text-blue-600' },
    { key: 'in-progress', label: 'En cours', count: statusCounts['in-progress'], color: 'text-[#EF9B0D]' },
    { key: 'completed', label: 'Terminés', count: statusCounts.completed, color: 'text-green-600' },
    { key: 'cancelled', label: 'Annulés', count: statusCounts.cancelled, color: 'text-stone-600' },
  ]

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 mb-2">Transferts inter-pépinières</h1>
            <p className="text-stone-600">Planifier et suivre les transferts de plants</p>
          </div>
          <button onClick={() => onCreate?.()} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md bg-[#EF9B0D] hover:bg-[#d88a0b] transition-colors">
            <Plus className="w-4 h-4" />Créer un transfert
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {buttons.map((btn) => (
            <button key={btn.key} onClick={() => setStatusFilter(btn.key)} className={`p-3 rounded-xl border transition-all text-left ${statusFilter === btn.key ? 'bg-[#fbe6c3] border-[#EF9B0D]' : 'bg-white border-stone-200 hover:border-[#EF9B0D]/50'}`}>
              <div className={`text-2xl font-bold ${btn.color || 'text-stone-900'}`}>{btn.count}</div>
              <div className="text-xs text-stone-600">{btn.label}</div>
            </button>
          ))}
        </div>

        {filteredTransfers.length > 0 ? (
          <div className="space-y-4">
            {filteredTransfers.map((transfer) => {
              const pickupStop = transfer.stops.find((s) => s.type === 'pickup')
              const dropoffStop = transfer.stops.find((s) => s.type === 'dropoff' || s.type === 'delivery')
              return (
                <div key={transfer.id} className="bg-white rounded-xl border border-stone-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Truck className="w-5 h-5 text-[#EF9B0D]" />
                            <h3 className="text-lg font-semibold text-stone-900">{transfer.orderNumber}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[transfer.status]}`}>{statusLabels[transfer.status]}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {transfer.status === 'planned' && (
                            <button onClick={() => onStart?.(transfer.id)} className="px-3 py-1.5 text-xs font-medium text-white bg-[#EF9B0D] rounded-md hover:bg-[#d88a0b] inline-flex items-center gap-1">
                              <PlayCircle className="w-3 h-3" />Démarrer
                            </button>
                          )}
                          {transfer.status === 'in-progress' && (
                            <button onClick={() => onComplete?.(transfer.id)} className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />Terminer
                            </button>
                          )}
                          {(transfer.status === 'planned' || transfer.status === 'in-progress') && (
                            <button onClick={() => onCancel?.(transfer.id)} className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 rounded-md hover:bg-stone-200">Annuler</button>
                          )}
                          <button onClick={() => onView?.(transfer.id)} className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 rounded-md hover:bg-stone-200">Voir détails</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pickupStop && (
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><MapPin className="w-5 h-5 text-blue-600" /></div>
                            <div>
                              <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Collecte</div>
                              <div className="font-medium text-stone-900">{pickupStop.nurseryName}</div>
                              <div className="text-sm text-stone-600">{pickupStop.address}</div>
                              {pickupStop.items?.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {pickupStop.items.map((item, idx) => <div key={idx} className="text-xs text-stone-600">• {item.quantity}x {item.speciesName}{item.varietyName ? ` - ${item.varietyName}` : ''}</div>)}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {dropoffStop && (
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><MapPin className="w-5 h-5 text-green-600" /></div>
                            <div>
                              <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Livraison</div>
                              <div className="font-medium text-stone-900">{dropoffStop.nurseryName}</div>
                              <div className="text-sm text-stone-600">{dropoffStop.address}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-stone-200">
                        <div className="flex items-center gap-2 text-sm text-stone-600"><Route className="w-4 h-4" />{transfer.totalDistanceKm} km</div>
                        <div className="flex items-center gap-2 text-sm text-stone-600"><Clock className="w-4 h-4" />{transfer.estimatedDuration}</div>
                        {transfer.driverName && <div className="text-sm text-stone-600">Chauffeur: {transfer.driverName}</div>}
                        <div className="text-sm text-stone-600">Date: {new Date(transfer.scheduledDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl border border-stone-200 bg-white">
            <Truck className="w-12 h-12 mx-auto mb-4 text-stone-400" />
            <p className="text-stone-600">Aucun transfert{statusFilter !== 'all' ? ` avec le statut "${statusLabels[statusFilter]}"` : ''}</p>
          </div>
        )}
      </div>
    </div>
  )
}
