import { useState, useMemo } from 'react'
import type { TransferManagementProps, TransferStatus } from '../types'
import { Plus, Truck, MapPin, Clock, Route, CheckCircle2, XCircle, PlayCircle } from 'lucide-react'

export function TransferManagement({
  transfers,
  nurseries,
  onView,
  onCreate,
  onOptimize,
  onStart,
  onComplete,
  onCancel,
}: TransferManagementProps) {
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'all'>('all')

  // Filter transfers by status
  const filteredTransfers = useMemo(() => {
    if (statusFilter === 'all') return transfers
    return transfers.filter((transfer) => transfer.status === statusFilter)
  }, [transfers, statusFilter])

  // Count transfers by status
  const statusCounts = {
    planned: transfers.filter((t) => t.status === 'planned').length,
    'in-progress': transfers.filter((t) => t.status === 'in-progress').length,
    completed: transfers.filter((t) => t.status === 'completed').length,
    cancelled: transfers.filter((t) => t.status === 'cancelled').length,
  }

  const statusLabels: Record<TransferStatus, string> = {
    planned: 'Planifié',
    'in-progress': 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
  }

  const statusColors: Record<TransferStatus, string> = {
    planned: 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 dark:border-blue-500 text-blue-600 dark:text-blue-400',
    'in-progress': 'bg-[#fbe6c3] dark:bg-[#EF9B0D]/20 border-[#EF9B0D] dark:border-[#EF9B0D] text-[#EF9B0D] dark:text-[#EF9B0D]',
    completed: 'bg-green-50 dark:bg-green-950/30 border-green-500 dark:border-green-500 text-green-600 dark:text-green-400',
    cancelled: 'bg-stone-100 dark:bg-stone-800 border-stone-400 dark:border-stone-500 text-stone-600 dark:text-stone-400',
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">
                Transferts inter-pépinières
              </h1>
              <p className="text-stone-600 dark:text-stone-400">
                Planifier et suivre les transferts de plants entre pépinières
              </p>
            </div>
            <button
              onClick={() => onCreate?.()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md bg-[#EF9B0D] hover:bg-[#d88a0b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2"
            >
              <Plus className="w-4 h-4" />
              Créer un transfert
            </button>
          </div>
        </div>

        {/* Compteurs de statut */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <button
            onClick={() => setStatusFilter('all')}
            className={`
              p-3 rounded-xl border transition-all text-left
              ${statusFilter === 'all' ? 'bg-[#fbe6c3] dark:bg-[#EF9B0D]/20 border-[#EF9B0D] dark:border-[#EF9B0D]' : 'bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-[#EF9B0D]/50'}
            `}
          >
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {transfers.length}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400">Tous</div>
          </button>
          <button
            onClick={() => setStatusFilter('planned')}
            className={`
              p-3 rounded-xl border transition-all text-left
              ${statusFilter === 'planned' ? statusColors.planned : 'bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-blue-300'}
            `}
          >
            <div className={`text-2xl font-bold ${statusFilter === 'planned' ? '' : 'text-blue-600 dark:text-blue-400'}`}>
              {statusCounts.planned}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400">Planifiés</div>
          </button>
          <button
            onClick={() => setStatusFilter('in-progress')}
            className={`
              p-3 rounded-xl border transition-all text-left
              ${statusFilter === 'in-progress' ? statusColors['in-progress'] : 'bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-[#EF9B0D]/50'}
            `}
          >
            <div className={`text-2xl font-bold ${statusFilter === 'in-progress' ? '' : 'text-[#EF9B0D] dark:text-[#EF9B0D]'}`}>
              {statusCounts['in-progress']}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400">En cours</div>
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`
              p-3 rounded-xl border transition-all text-left
              ${statusFilter === 'completed' ? statusColors.completed : 'bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-green-300'}
            `}
          >
            <div className={`text-2xl font-bold ${statusFilter === 'completed' ? '' : 'text-green-600 dark:text-green-400'}`}>
              {statusCounts.completed}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400">Terminés</div>
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`
              p-3 rounded-xl border transition-all text-left
              ${statusFilter === 'cancelled' ? statusColors.cancelled : 'bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-stone-300'}
            `}
          >
            <div className={`text-2xl font-bold ${statusFilter === 'cancelled' ? '' : 'text-stone-600 dark:text-stone-400'}`}>
              {statusCounts.cancelled}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400">Annulés</div>
          </button>
        </div>

        {/* Liste des transferts */}
        {filteredTransfers.length > 0 ? (
          <div className="space-y-4">
            {filteredTransfers.map((transfer) => {
              const pickupStop = transfer.stops.find((s) => s.type === 'pickup')
              const dropoffStop = transfer.stops.find((s) => s.type === 'dropoff')

              return (
                <div
                  key={transfer.id}
                  className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Informations principales */}
                    <div className="flex-1 space-y-4">
                      {/* En-tête */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Truck className="w-5 h-5 text-[#EF9B0D]" />
                            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                              {transfer.orderNumber}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[transfer.status]}`}
                            >
                              {statusLabels[transfer.status]}
                            </span>
                          </div>
                          <p className="text-sm text-stone-600 dark:text-stone-400">
                            Commande: {transfer.orderNumber}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {transfer.status === 'planned' && (
                            <>
                              <button
                                onClick={() => onOptimize?.(transfer.id)}
                                className="px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-700 rounded-md hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
                              >
                                Optimiser
                              </button>
                              <button
                                onClick={() => onStart?.(transfer.id)}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-[#EF9B0D] rounded-md hover:bg-[#d88a0b] transition-colors inline-flex items-center gap-1"
                              >
                                <PlayCircle className="w-3 h-3" />
                                Démarrer
                              </button>
                            </>
                          )}
                          {transfer.status === 'in-progress' && (
                            <button
                              onClick={() => onComplete?.(transfer.id)}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Terminer
                            </button>
                          )}
                          {(transfer.status === 'planned' || transfer.status === 'in-progress') && (
                            <button
                              onClick={() => onCancel?.(transfer.id)}
                              className="px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-700 rounded-md hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
                            >
                              Annuler
                            </button>
                          )}
                          <button
                            onClick={() => onView?.(transfer.id)}
                            className="px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-700 rounded-md hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
                          >
                            Voir détails
                          </button>
                        </div>
                      </div>

                      {/* Itinéraire */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Point de collecte */}
                        {pickupStop && (
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">
                                Collecte
                              </div>
                              <div className="font-medium text-stone-900 dark:text-stone-100">
                                {pickupStop.nurseryName}
                              </div>
                              <div className="text-sm text-stone-600 dark:text-stone-400">
                                {pickupStop.address}
                              </div>
                              {pickupStop.estimatedTime && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-stone-500 dark:text-stone-400">
                                  <Clock className="w-3 h-3" />
                                  {pickupStop.estimatedTime}
                                </div>
                              )}
                              {pickupStop.items.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {pickupStop.items.map((item, idx) => (
                                    <div key={idx} className="text-xs text-stone-600 dark:text-stone-400">
                                      • {item.quantity}x {item.speciesName}
                                      {item.varietyName && ` - ${item.varietyName}`}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Point de livraison */}
                        {dropoffStop && (
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">
                                Livraison
                              </div>
                              <div className="font-medium text-stone-900 dark:text-stone-100">
                                {dropoffStop.nurseryName}
                              </div>
                              <div className="text-sm text-stone-600 dark:text-stone-400">
                                {dropoffStop.address}
                              </div>
                              {dropoffStop.estimatedTime && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-stone-500 dark:text-stone-400">
                                  <Clock className="w-3 h-3" />
                                  {dropoffStop.estimatedTime}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Informations supplémentaires */}
                      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-stone-200 dark:border-stone-700">
                        <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                          <Route className="w-4 h-4" />
                          <span>{transfer.totalDistanceKm} km</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                          <Clock className="w-4 h-4" />
                          <span>{transfer.estimatedDuration}</span>
                        </div>
                        {transfer.driverName && (
                          <div className="text-sm text-stone-600 dark:text-stone-400">
                            Chauffeur: {transfer.driverName}
                          </div>
                        )}
                        {transfer.vehicleInfo && (
                          <div className="text-sm text-stone-600 dark:text-stone-400">
                            Véhicule: {transfer.vehicleInfo}
                          </div>
                        )}
                        <div className="text-sm text-stone-600 dark:text-stone-400">
                          Date prévue: {new Date(transfer.scheduledDate).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>

                      {transfer.notes && (
                        <div className="text-sm text-stone-600 dark:text-stone-400 italic">
                          Note: {transfer.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50">
            <Truck className="w-12 h-12 mx-auto mb-4 text-stone-400" />
            <p className="text-stone-600 dark:text-stone-400">
              {statusFilter === 'all'
                ? 'Aucun transfert enregistré pour le moment'
                : `Aucun transfert avec le statut "${statusLabels[statusFilter as TransferStatus]}"`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}


