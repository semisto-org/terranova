import { useState } from 'react'
import type { OrderListProps, OrderStatus } from '../types'
import { OrderRow } from './OrderRow'

export function OrderList({
  orders,
  nurseries,
  onView,
  onProcess,
  onMarkReady,
  onMarkPickedUp,
  onCancel,
  onFilter,
}: OrderListProps) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [nurseryFilter, setNurseryFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  // Appliquer les filtres
  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false
    if (nurseryFilter !== 'all' && order.pickupNurseryId !== nurseryFilter) return false
    if (dateFrom && new Date(order.createdAt) < new Date(dateFrom)) return false
    if (dateTo && new Date(order.createdAt) > new Date(dateTo)) return false
    return true
  })

  const handleFilterChange = () => {
    onFilter?.({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      nurseryId: nurseryFilter !== 'all' ? nurseryFilter : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
  }

  // Compter les commandes par statut
  const statusCounts = {
    new: orders.filter((o) => o.status === 'new').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    'picked-up': orders.filter((o) => o.status === 'picked-up').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            Commandes
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            Gérer et suivre toutes les commandes de plants
          </p>
        </div>

        {/* Compteurs de statut */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <button
            onClick={() => {
              setStatusFilter('all')
              handleFilterChange()
            }}
            className={`
              p-3 rounded-xl border transition-all text-left
              ${statusFilter === 'all' ? 'bg-[#fbe6c3] dark:bg-[#EF9B0D]/20 border-[#EF9B0D] dark:border-[#EF9B0D]' : 'bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-[#EF9B0D]/50'}
            `}
          >
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {orders.length}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400">Toutes</div>
          </button>
          <button
            onClick={() => {
              setStatusFilter('new')
              handleFilterChange()
            }}
            className={`
              p-3 rounded-xl border transition-all text-left
              ${statusFilter === 'new' ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 dark:border-blue-500' : 'bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-blue-300'}
            `}
          >
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {statusCounts.new}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400">Nouvelles</div>
          </button>
          <button
            onClick={() => {
              setStatusFilter('processing')
              handleFilterChange()
            }}
            className={`
              p-3 rounded-xl border transition-all text-left
              ${statusFilter === 'processing' ? 'bg-[#fbe6c3] dark:bg-[#EF9B0D]/20 border-[#EF9B0D] dark:border-[#EF9B0D]' : 'bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-[#EF9B0D]/50'}
            `}
          >
            <div className="text-2xl font-bold text-[#EF9B0D] dark:text-[#EF9B0D]">
              {statusCounts.processing}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400">En préparation</div>
          </button>
          <button
            onClick={() => {
              setStatusFilter('ready')
              handleFilterChange()
            }}
            className={`
              p-3 rounded-xl border transition-all text-left
              ${statusFilter === 'ready' ? 'bg-green-50 dark:bg-green-950/30 border-green-500 dark:border-green-500' : 'bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-green-300'}
            `}
          >
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {statusCounts.ready}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400">Prêtes</div>
          </button>
          <button
            onClick={() => {
              setStatusFilter('picked-up')
              handleFilterChange()
            }}
            className={`
              p-3 rounded-xl border transition-all text-left
              ${statusFilter === 'picked-up' ? 'bg-stone-100 dark:bg-stone-800 border-stone-400 dark:border-stone-500' : 'bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-stone-300'}
            `}
          >
            <div className="text-2xl font-bold text-stone-600 dark:text-stone-400">
              {statusCounts['picked-up']}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400">Retirées</div>
          </button>
        </div>

        {/* Filtres avancés */}
        <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Pépinière de retrait
              </label>
              <select
                value={nurseryFilter}
                onChange={(e) => {
                  setNurseryFilter(e.target.value)
                  handleFilterChange()
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
              >
                <option value="all">Toutes les pépinières</option>
                {nurseries.map((nursery) => (
                  <option key={nursery.id} value={nursery.id}>
                    {nursery.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  handleFilterChange()
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  handleFilterChange()
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Liste des commandes */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-3">
            {/* En-têtes desktop */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
              <div className="col-span-2">Numéro</div>
              <div className="col-span-2">Client</div>
              <div className="col-span-2">Statut</div>
              <div className="col-span-2">Niveau prix</div>
              <div className="col-span-2">Point de retrait</div>
              <div className="col-span-2">Montant</div>
            </div>

            {filteredOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onView={onView}
                onProcess={onProcess}
                onMarkReady={onMarkReady}
                onMarkPickedUp={onMarkPickedUp}
                onCancel={onCancel}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-stone-600 dark:text-stone-400">
              Aucune commande ne correspond aux filtres sélectionnés
            </p>
          </div>
        )}
      </div>
    </div>
  )
}


