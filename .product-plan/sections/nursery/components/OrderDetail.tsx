import type { OrderDetailProps, OrderStatus } from '../types'
import { OrderLineGroup } from './OrderLineGroup'

export function OrderDetail({
  order,
  onProcess,
  onMarkReady,
  onMarkPickedUp,
  onCancel,
  onCreateTransfer,
  onBack,
}: OrderDetailProps) {
  // Vérifier si commande multi-pépinières
  const uniqueNurseries = new Set(order.lines.map((line) => line.nurseryId))
  const isMultiNursery = uniqueNurseries.size > 1

  // Grouper les lignes par pépinière
  const linesByNursery = order.lines.reduce(
    (acc, line) => {
      if (!acc[line.nurseryId]) {
        acc[line.nurseryId] = {
          nurseryId: line.nurseryId,
          nurseryName: line.nurseryName,
          lines: [],
        }
      }
      acc[line.nurseryId].lines.push(line)
      return acc
    },
    {} as Record<string, { nurseryId: string; nurseryName: string; lines: typeof order.lines }>
  )

  // Configuration des statuts pour la timeline
  const statusSteps: { status: OrderStatus; label: string; icon: string }[] = [
    { status: 'new', label: 'Nouvelle', icon: '📋' },
    { status: 'processing', label: 'En préparation', icon: '⚙️' },
    { status: 'ready', label: 'Prête', icon: '✓' },
    { status: 'picked-up', label: 'Retirée', icon: '📦' },
  ]

  const currentStatusIndex = statusSteps.findIndex((s) => s.status === order.status)

  // Styles de statut
  const statusConfig = {
    new: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-900/50',
      badge: 'bg-blue-500 dark:bg-blue-600',
      label: 'Nouvelle',
    },
    processing: {
      bg: 'bg-[#fbe6c3] dark:bg-[#EF9B0D]/20',
      border: 'border-[#EF9B0D]/30 dark:border-[#EF9B0D]/50',
      badge: 'bg-[#EF9B0D] dark:bg-[#EF9B0D]',
      label: 'En préparation',
    },
    ready: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-900/50',
      badge: 'bg-green-500 dark:bg-green-600',
      label: 'Prête',
    },
    'picked-up': {
      bg: 'bg-stone-50 dark:bg-stone-800/50',
      border: 'border-stone-200 dark:border-stone-700',
      badge: 'bg-stone-400 dark:bg-stone-500',
      label: 'Retirée',
    },
    cancelled: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-900/50',
      badge: 'bg-red-500 dark:bg-red-600',
      label: 'Annulée',
    },
  }

  const statusStyle = statusConfig[order.status]

  // Styles de niveau de prix
  const priceLevelConfig = {
    solidarity: {
      bg: 'bg-purple-100 dark:bg-purple-950/30',
      text: 'text-purple-700 dark:text-purple-300',
      label: 'Solidaire',
    },
    standard: {
      bg: 'bg-stone-100 dark:bg-stone-800/50',
      text: 'text-stone-700 dark:text-stone-300',
      label: 'Standard',
    },
    support: {
      bg: 'bg-[#fbe6c3] dark:bg-[#EF9B0D]/20',
      text: 'text-[#EF9B0D] dark:text-[#EF9B0D]',
      label: 'Soutien',
    },
  }

  const priceLevelStyle = priceLevelConfig[order.priceLevel]

  // Formater les dates
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleString('fr-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bouton retour */}
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 hover:text-[#EF9B0D] dark:hover:text-[#EF9B0D] transition-colors"
          >
            ← Retour à la liste
          </button>
        )}

        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">
                {order.orderNumber}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`
                    inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                    ${statusStyle.badge} text-white
                  `}
                >
                  {statusStyle.label}
                </span>
                <span
                  className={`
                    inline-flex items-center px-3 py-1 rounded text-sm font-medium
                    ${priceLevelStyle.bg} ${priceLevelStyle.text}
                  `}
                >
                  {priceLevelStyle.label}
                </span>
                {isMultiNursery && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-500 text-white">
                    🔗 Commande multi-pépinières
                  </span>
                )}
                {order.isMember && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EF9B0D]/20 text-[#EF9B0D] dark:text-[#EF9B0D]">
                    ⭐ Membre
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          {order.status !== 'cancelled' && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStatusIndex
                  const isCurrent = index === currentStatusIndex

                  return (
                    <div key={step.status} className="flex-1 flex flex-col items-center">
                      <div
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2
                          ${isCompleted ? 'bg-[#EF9B0D] text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400'}
                          ${isCurrent ? 'ring-4 ring-[#EF9B0D]/30' : ''}
                        `}
                      >
                        {isCompleted ? step.icon : '○'}
                      </div>
                      <span
                        className={`
                          text-xs text-center
                          ${isCompleted ? 'text-stone-900 dark:text-stone-100 font-medium' : 'text-stone-500 dark:text-stone-400'}
                        `}
                      >
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-stone-200 dark:bg-stone-700 -z-10">
                <div
                  className="h-full bg-[#EF9B0D] transition-all duration-500"
                  style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Informations client */}
        <section className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Informations client
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">Nom</p>
              <p className="text-base font-medium text-stone-900 dark:text-stone-100">
                {order.customerName}
              </p>
            </div>
            <div>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">Email</p>
              <p className="text-base text-stone-900 dark:text-stone-100">{order.customerEmail}</p>
            </div>
            {order.customerPhone && (
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">Téléphone</p>
                <p className="text-base text-stone-900 dark:text-stone-100">{order.customerPhone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">Point de retrait</p>
              <p className="text-base font-medium text-stone-900 dark:text-stone-100">
                {order.pickupNurseryName}
              </p>
            </div>
          </div>
        </section>

        {/* Dates importantes */}
        <section className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Dates importantes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-stone-500 dark:text-stone-400 mb-1">Créée le</p>
              <p className="text-stone-900 dark:text-stone-100">{formatDateTime(order.createdAt)}</p>
            </div>
            {order.preparedAt && (
              <div>
                <p className="text-stone-500 dark:text-stone-400 mb-1">Préparation démarrée</p>
                <p className="text-stone-900 dark:text-stone-100">{formatDateTime(order.preparedAt)}</p>
              </div>
            )}
            {order.readyAt && (
              <div>
                <p className="text-stone-500 dark:text-stone-400 mb-1">Marquée prête</p>
                <p className="text-stone-900 dark:text-stone-100">{formatDateTime(order.readyAt)}</p>
              </div>
            )}
            {order.pickedUpAt && (
              <div>
                <p className="text-stone-500 dark:text-stone-400 mb-1">Retirée le</p>
                <p className="text-stone-900 dark:text-stone-100">{formatDateTime(order.pickedUpAt)}</p>
              </div>
            )}
          </div>
        </section>

        {/* Lignes de commande groupées par pépinière */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Articles de la commande
          </h2>
          <div className="space-y-4">
            {Object.values(linesByNursery).map((group) => (
              <OrderLineGroup
                key={group.nurseryId}
                nurseryId={group.nurseryId}
                nurseryName={group.nurseryName}
                lines={group.lines}
              />
            ))}
          </div>
        </section>

        {/* Totaux */}
        <section className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-6 mb-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600 dark:text-stone-400">Sous-total euros</span>
              <span className="text-base font-medium text-stone-900 dark:text-stone-100">
                {order.subtotalEuros.toFixed(2)}€
              </span>
            </div>
            {order.subtotalSemos > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600 dark:text-stone-400">Sous-total Semos</span>
                <span className="text-base font-medium text-stone-900 dark:text-stone-100">
                  {order.subtotalSemos}S
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-stone-200 dark:border-stone-700">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-stone-900 dark:text-stone-100">Total</span>
                <div className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {order.totalEuros > 0 && `${order.totalEuros.toFixed(2)}€`}
                  {order.totalEuros > 0 && order.totalSemos > 0 && ' + '}
                  {order.totalSemos > 0 && `${order.totalSemos}S`}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Notes */}
        {order.notes && (
          <section className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">Notes</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">{order.notes}</p>
          </section>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {order.status === 'new' && (
            <>
              <button
                onClick={onProcess}
                className="px-6 py-3 rounded-xl bg-[#EF9B0D] text-white font-medium hover:bg-[#EF9B0D]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2"
              >
                Traiter la commande
              </button>
              <button
                onClick={onCancel}
                className="px-6 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Annuler
              </button>
            </>
          )}
          {order.status === 'processing' && (
            <>
              <button
                onClick={onMarkReady}
                className="px-6 py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Marquer comme prête
              </button>
              {isMultiNursery && onCreateTransfer && (
                <button
                  onClick={onCreateTransfer}
                  className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Créer un transfert
                </button>
              )}
            </>
          )}
          {order.status === 'ready' && (
            <button
              onClick={onMarkPickedUp}
              className="px-6 py-3 rounded-xl bg-stone-500 text-white font-medium hover:bg-stone-600 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
            >
              Marquer comme retirée
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


