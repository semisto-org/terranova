import { OrderLineGroup } from './OrderLineGroup'

const statusSteps = [
  { status: 'new', label: 'Nouvelle', icon: '📋' },
  { status: 'processing', label: 'En préparation', icon: '⚙️' },
  { status: 'ready', label: 'Prête', icon: '✓' },
  { status: 'picked-up', label: 'Retirée', icon: '📦' },
]

const statusConfig = {
  new: { badge: 'bg-blue-500', label: 'Nouvelle' },
  processing: { badge: 'bg-[#EF9B0D]', label: 'En préparation' },
  ready: { badge: 'bg-green-500', label: 'Prête' },
  'picked-up': { badge: 'bg-stone-400', label: 'Retirée' },
  cancelled: { badge: 'bg-red-500', label: 'Annulée' },
}

const priceLevelConfig = {
  solidarity: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Solidaire' },
  standard: { bg: 'bg-stone-100', text: 'text-stone-700', label: 'Standard' },
  support: { bg: 'bg-[#fbe6c3]', text: 'text-[#EF9B0D]', label: 'Soutien' },
}

const formatDateTime = (dateString) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function OrderDetail({ order, onProcess, onMarkReady, onMarkPickedUp, onCancel, onBack }) {
  const uniqueNurseries = new Set(order.lines.map((l) => l.nurseryId))
  const isMultiNursery = uniqueNurseries.size > 1

  const linesByNursery = order.lines.reduce((acc, line) => {
    if (!acc[line.nurseryId]) acc[line.nurseryId] = { nurseryId: line.nurseryId, nurseryName: line.nurseryName, lines: [] }
    acc[line.nurseryId].lines.push(line)
    return acc
  }, {})

  const currentStatusIndex = statusSteps.findIndex((s) => s.status === order.status)
  const statusStyle = statusConfig[order.status] || statusConfig.new
  const priceLevelStyle = priceLevelConfig[order.priceLevel] || priceLevelConfig.standard

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {onBack && (
          <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-stone-600 hover:text-[#EF9B0D] transition-colors">← Retour à la liste</button>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">{order.orderNumber}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyle.badge} text-white`}>{statusStyle.label}</span>
            <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${priceLevelStyle.bg} ${priceLevelStyle.text}`}>{priceLevelStyle.label}</span>
            {isMultiNursery && <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-500 text-white">🔗 Multi-pépinières</span>}
            {order.isMember && <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EF9B0D]/20 text-[#EF9B0D]">⭐ Membre</span>}
          </div>

          {order.status !== 'cancelled' && (
            <div className="relative mt-6">
              <div className="flex items-center justify-between mb-2">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStatusIndex
                  const isCurrent = index === currentStatusIndex
                  return (
                    <div key={step.status} className="flex-1 flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2 ${isCompleted ? 'bg-[#EF9B0D] text-white' : 'bg-stone-200 text-stone-500'} ${isCurrent ? 'ring-4 ring-[#EF9B0D]/30' : ''}`}>
                        {isCompleted ? step.icon : '○'}
                      </div>
                      <span className={`text-xs text-center ${isCompleted ? 'text-stone-900 font-medium' : 'text-stone-500'}`}>{step.label}</span>
                    </div>
                  )
                })}
              </div>
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-stone-200 -z-10">
                <div className="h-full bg-[#EF9B0D] transition-all duration-500" style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        <section className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">Informations client</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><p className="text-sm text-stone-500 mb-1">Nom</p><p className="font-medium text-stone-900">{order.customerName}</p></div>
            <div><p className="text-sm text-stone-500 mb-1">Email</p><p className="text-stone-900">{order.customerEmail}</p></div>
            {order.customerPhone && <div><p className="text-sm text-stone-500 mb-1">Téléphone</p><p className="text-stone-900">{order.customerPhone}</p></div>}
            <div><p className="text-sm text-stone-500 mb-1">Point de retrait</p><p className="font-medium text-stone-900">{order.pickupNurseryName}</p></div>
          </div>
        </section>

        <section className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Dates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><p className="text-stone-500 mb-1">Créée le</p><p className="text-stone-900">{formatDateTime(order.createdAt)}</p></div>
            {order.preparedAt && <div><p className="text-stone-500 mb-1">Préparation</p><p className="text-stone-900">{formatDateTime(order.preparedAt)}</p></div>}
            {order.readyAt && <div><p className="text-stone-500 mb-1">Prête</p><p className="text-stone-900">{formatDateTime(order.readyAt)}</p></div>}
            {order.pickedUpAt && <div><p className="text-stone-500 mb-1">Retirée</p><p className="text-stone-900">{formatDateTime(order.pickedUpAt)}</p></div>}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Articles</h2>
          <div className="space-y-4">
            {Object.values(linesByNursery).map((group) => (
              <OrderLineGroup key={group.nurseryId} nurseryId={group.nurseryId} nurseryName={group.nurseryName} lines={group.lines} />
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-6 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm text-stone-600">Sous-total euros</span><span className="font-medium text-stone-900">{order.subtotalEuros?.toFixed(2)}€</span></div>
            {order.subtotalSemos > 0 && <div className="flex justify-between"><span className="text-sm text-stone-600">Sous-total Semos</span><span className="font-medium text-stone-900">{order.subtotalSemos}S</span></div>}
            <div className="pt-2 border-t border-stone-200">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-stone-900">Total</span>
                <div className="text-lg font-bold text-stone-900">
                  {order.totalEuros > 0 && `${order.totalEuros.toFixed(2)}€`}
                  {order.totalEuros > 0 && order.totalSemos > 0 && ' + '}
                  {order.totalSemos > 0 && `${order.totalSemos}S`}
                </div>
              </div>
            </div>
          </div>
        </section>

        {order.notes && (
          <section className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-2">Notes</h2>
            <p className="text-sm text-stone-600">{order.notes}</p>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          {order.status === 'new' && <>
            <button onClick={onProcess} className="px-6 py-3 rounded-xl bg-[#EF9B0D] text-white font-medium hover:bg-[#EF9B0D]/90 transition-colors">Traiter la commande</button>
            <button onClick={onCancel} className="px-6 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors">Annuler</button>
          </>}
          {order.status === 'processing' && <button onClick={onMarkReady} className="px-6 py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-colors">Marquer comme prête</button>}
          {order.status === 'ready' && <button onClick={onMarkPickedUp} className="px-6 py-3 rounded-xl bg-stone-500 text-white font-medium hover:bg-stone-600 transition-colors">Marquer comme retirée</button>}
        </div>
      </div>
    </div>
  )
}
