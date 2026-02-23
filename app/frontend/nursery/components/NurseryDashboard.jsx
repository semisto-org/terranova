export function NurseryDashboard({ alerts, lowStockCount, pendingOrdersCount, pendingTransfersCount, pendingValidationsCount, recentOrders, onViewStock, onViewOrders, onViewTransfers, onViewValidations }) {
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const sortedAlerts = [...alerts].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  const alertIcons = { 'low-stock': '📦', 'pending-order': '📋', 'pending-transfer': '🚚', 'pending-validation': '✅' }
  const priorityBadge = { high: 'bg-red-500', medium: 'bg-[#EF9B0D]', low: 'bg-stone-400' }
  const priorityBg = { high: 'bg-red-50 border-red-200', medium: 'bg-[#fbe6c3] border-[#EF9B0D]/30', low: 'bg-stone-50 border-stone-200' }

  const statusLabels = { new: 'Nouvelle', processing: 'En préparation', ready: 'Prête', 'picked-up': 'Retirée', cancelled: 'Annulée' }
  const statusBadge = { new: 'bg-blue-500', processing: 'bg-[#EF9B0D]', ready: 'bg-green-500', 'picked-up': 'bg-stone-400', cancelled: 'bg-red-500' }

  const counters = [
    { label: 'Stocks bas', count: lowStockCount, type: 'low-stock', onClick: onViewStock },
    { label: 'Commandes en attente', count: pendingOrdersCount, type: 'pending-order', onClick: onViewOrders },
    { label: 'Transferts à planifier', count: pendingTransfersCount, type: 'pending-transfer', onClick: onViewTransfers },
    { label: 'Validations en attente', count: pendingValidationsCount, type: 'pending-validation', onClick: onViewValidations },
  ]

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Tableau de bord Pépinières</h1>
          <p className="text-stone-600">Vue d'ensemble des actions prioritaires et de l'activité</p>
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Alertes en cours</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {counters.map((c) => (
              <button key={c.type} onClick={c.onClick} className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${c.count > 0 ? 'bg-[#fbe6c3] border-[#EF9B0D]/30' : 'bg-stone-50 border-stone-200'}`}>
                <div className="text-2xl">{alertIcons[c.type]}</div>
                <div className="flex-1">
                  <div className="text-3xl font-bold text-[#EF9B0D]">{c.count}</div>
                  <div className="text-xs text-stone-600 mt-1">{c.label}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {sortedAlerts.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Alertes détaillées</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedAlerts.map((alert) => (
                <div key={alert.id} className={`w-full text-left p-4 rounded-xl border ${priorityBg[alert.priority]}`}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">{alertIcons[alert.type]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{alert.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge[alert.priority]} text-white`}>
                          {alert.priority === 'high' ? 'Urgent' : alert.priority === 'medium' ? 'Moyen' : 'Faible'}
                        </span>
                      </div>
                      <p className="text-xs opacity-80">{alert.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900">Commandes récentes</h2>
              {onViewOrders && <button onClick={onViewOrders} className="text-sm text-[#EF9B0D] hover:text-[#EF9B0D]/80 font-medium">Voir tout →</button>}
            </div>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="w-full text-left p-4 rounded-xl border border-stone-200 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-stone-900">{order.orderNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[order.status]} text-white`}>{statusLabels[order.status]}</span>
                        </div>
                        <p className="text-xs text-stone-600">{order.customerName}</p>
                      </div>
                      <div className="text-sm font-bold text-stone-900">
                        {order.totalEuros > 0 && `${order.totalEuros.toFixed(2)}€`}
                        {order.totalSemos > 0 && ` + ${order.totalSemos}S`}
                      </div>
                    </div>
                    <div className="text-xs text-stone-500">{order.lines.length} article{order.lines.length > 1 ? 's' : ''} • Retrait: {order.pickupNurseryName}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl border border-stone-200 bg-white"><p className="text-stone-500 text-sm">Aucune commande récente</p></div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Actions rapides</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Gérer le stock', icon: '📦', onClick: onViewStock },
                { label: 'Commandes', icon: '📋', onClick: onViewOrders },
                { label: 'Transferts', icon: '🚚', onClick: onViewTransfers },
                { label: 'Validations', icon: '✅', onClick: onViewValidations },
                { label: 'Plants-mères', icon: '🌱' },
              ].map((action) => (
                <button key={action.label} onClick={action.onClick} className="p-4 rounded-xl border border-stone-200 bg-white hover:bg-[#fbe6c3] hover:border-[#EF9B0D]/30 transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]">
                  <div className="text-2xl mb-2">{action.icon}</div>
                  <div className="text-xs font-medium text-stone-700">{action.label}</div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
