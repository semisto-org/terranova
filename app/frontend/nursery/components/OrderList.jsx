import { useState, useMemo } from 'react'
import { OrderRow } from './OrderRow'

export function OrderList({ orders, nurseries, onView, onProcess, onMarkReady, onMarkPickedUp, onCancel }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [nurseryFilter, setNurseryFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false
      if (nurseryFilter !== 'all' && order.pickupNurseryId !== nurseryFilter) return false
      if (dateFrom && new Date(order.createdAt) < new Date(dateFrom)) return false
      if (dateTo && new Date(order.createdAt) > new Date(dateTo)) return false
      return true
    })
  }, [orders, statusFilter, nurseryFilter, dateFrom, dateTo])

  const statusCounts = {
    new: orders.filter((o) => o.status === 'new').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    'picked-up': orders.filter((o) => o.status === 'picked-up').length,
  }

  const statusButtons = [
    { key: 'all', label: 'Toutes', count: orders.length, active: 'bg-[#fbe6c3] border-[#EF9B0D]' },
    { key: 'new', label: 'Nouvelles', count: statusCounts.new, active: 'bg-blue-50 border-blue-500', color: 'text-blue-600' },
    { key: 'processing', label: 'En préparation', count: statusCounts.processing, active: 'bg-[#fbe6c3] border-[#EF9B0D]', color: 'text-[#EF9B0D]' },
    { key: 'ready', label: 'Prêtes', count: statusCounts.ready, active: 'bg-green-50 border-green-500', color: 'text-green-600' },
    { key: 'picked-up', label: 'Retirées', count: statusCounts['picked-up'], active: 'bg-stone-100 border-stone-400', color: 'text-stone-600' },
  ]

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">Commandes</h1>
          <p className="text-stone-600 dark:text-stone-400">Gérer et suivre toutes les commandes de plants</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {statusButtons.map((btn) => (
            <button key={btn.key} onClick={() => setStatusFilter(btn.key)} className={`p-3 rounded-xl border transition-all text-left ${statusFilter === btn.key ? btn.active : 'bg-white border-stone-200 hover:border-[#EF9B0D]/50'}`}>
              <div className={`text-2xl font-bold ${btn.color || 'text-stone-900'}`}>{btn.count}</div>
              <div className="text-xs text-stone-600">{btn.label}</div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Pépinière de retrait</label>
              <select value={nurseryFilter} onChange={(e) => setNurseryFilter(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent">
                <option value="all">Toutes les pépinières</option>
                {nurseries.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Date de début</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Date de fin</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent" />
            </div>
          </div>
        </div>

        {filteredOrders.length > 0 ? (
          <div className="space-y-3">
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 text-xs font-medium text-stone-500 uppercase tracking-wide">
              <div className="col-span-2">Numéro</div>
              <div className="col-span-2">Client</div>
              <div className="col-span-2">Statut</div>
              <div className="col-span-1">Prix</div>
              <div className="col-span-2">Retrait</div>
              <div className="col-span-2">Montant</div>
              <div className="col-span-1"></div>
            </div>
            {filteredOrders.map((order) => (
              <OrderRow key={order.id} order={order} onView={onView} onProcess={onProcess} onMarkReady={onMarkReady} onMarkPickedUp={onMarkPickedUp} onCancel={onCancel} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl border border-stone-200 bg-white">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-stone-600">Aucune commande ne correspond aux filtres sélectionnés</p>
          </div>
        )}
      </div>
    </div>
  )
}
