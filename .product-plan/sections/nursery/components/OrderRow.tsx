import type { Order } from '../types'
import { Eye, Package, CheckCircle2, XCircle, Clock, Truck, MapPin } from 'lucide-react'

interface OrderRowProps {
  order: Order
  isMultiNursery: boolean
  onView?: () => void
  onProcess?: () => void
  onMarkReady?: () => void
  onMarkPickedUp?: () => void
  onCancel?: () => void
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  new: {
    label: 'Nouvelle',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-950/30',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  processing: {
    label: 'En préparation',
    color: 'text-[#EF9B0D] dark:text-[#EF9B0D]',
    bgColor: 'bg-[#fbe6c3] dark:bg-[#fbe6c3]/20',
    icon: <Package className="w-3.5 h-3.5" />,
  },
  ready: {
    label: 'Prête',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-950/30',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  'picked-up': {
    label: 'Retirée',
    color: 'text-stone-600 dark:text-stone-400',
    bgColor: 'bg-stone-100 dark:bg-stone-800',
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: 'Annulée',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-950/30',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
}

const priceLevelConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  solidarity: {
    label: 'Solidaire',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-950/30',
  },
  standard: {
    label: 'Standard',
    color: 'text-stone-700 dark:text-stone-400',
    bgColor: 'bg-stone-100 dark:bg-stone-800',
  },
  support: {
    label: 'Soutien',
    color: 'text-[#EF9B0D] dark:text-[#EF9B0D]',
    bgColor: 'bg-[#fbe6c3] dark:bg-[#fbe6c3]/20',
  },
}

export function OrderRow({
  order,
  isMultiNursery,
  onView,
  onProcess,
  onMarkReady,
  onMarkPickedUp,
  onCancel,
}: OrderRowProps) {
  const status = statusConfig[order.status] || statusConfig.new
  const priceLevel = priceLevelConfig[order.priceLevel] || priceLevelConfig.standard

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  return (
    <div className="group relative">
      {/* Desktop: Table row */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 items-center py-4 px-4 border-b border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors">
        {/* Numéro de commande */}
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <div className="font-mono text-sm font-medium text-stone-900 dark:text-stone-100">
              {order.orderNumber}
            </div>
            {isMultiNursery && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400" title="Commande multi-pépinières">
                <MapPin className="w-3 h-3" />
                Multi
              </div>
            )}
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-500 mt-0.5">
            {formatDate(order.createdAt)}
          </div>
        </div>

        {/* Client */}
        <div className="col-span-2">
          <div className="font-medium text-stone-900 dark:text-stone-100">
            {order.customerName}
          </div>
          <div className="text-sm text-stone-600 dark:text-stone-400">
            {order.customerEmail}
          </div>
          {order.isMember && (
            <div className="text-xs text-[#EF9B0D] dark:text-[#EF9B0D] mt-0.5">
              Membre
            </div>
          )}
        </div>

        {/* Statut */}
        <div className="col-span-2">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${status.color} ${status.bgColor} border border-current/20`}>
            {status.icon}
            {status.label}
          </div>
        </div>

        {/* Niveau de prix */}
        <div className="col-span-1">
          <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${priceLevel.color} ${priceLevel.bgColor}`}>
            {priceLevel.label}
          </div>
        </div>

        {/* Point de retrait */}
        <div className="col-span-2 text-sm text-stone-600 dark:text-stone-400">
          {order.pickupNurseryName}
        </div>

        {/* Montant */}
        <div className="col-span-2">
          <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
            {order.totalEuros > 0 && `${order.totalEuros.toFixed(2)} €`}
            {order.totalEuros > 0 && order.totalSemos > 0 && ' + '}
            {order.totalSemos > 0 && `${order.totalSemos} Semos`}
            {order.totalEuros === 0 && order.totalSemos === 0 && '-'}
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-500">
            {order.lines.length} article{order.lines.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Actions */}
        <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onView}
            className="p-1.5 rounded-md text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Voir les détails"
          >
            <Eye className="w-4 h-4" />
          </button>
          {order.status === 'new' && onProcess && (
            <button
              onClick={onProcess}
              className="p-1.5 rounded-md text-[#EF9B0D] hover:bg-[#fbe6c3]/50 dark:hover:bg-[#fbe6c3]/10 transition-colors"
              aria-label="Traiter"
              title="Traiter la commande"
            >
              <Package className="w-4 h-4" />
            </button>
          )}
          {order.status === 'processing' && onMarkReady && (
            <button
              onClick={onMarkReady}
              className="p-1.5 rounded-md text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
              aria-label="Marquer prêt"
              title="Marquer comme prêt"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
          {order.status === 'ready' && onMarkPickedUp && (
            <button
              onClick={onMarkPickedUp}
              className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
              aria-label="Marquer retiré"
              title="Marquer comme retiré"
            >
              <Truck className="w-4 h-4" />
            </button>
          )}
          {(order.status === 'new' || order.status === 'processing') && onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              aria-label="Annuler"
              title="Annuler la commande"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile: Card */}
      <div className="md:hidden p-4 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-mono text-sm font-medium text-stone-900 dark:text-stone-100">
                {order.orderNumber}
              </div>
              {isMultiNursery && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400">
                  <MapPin className="w-3 h-3" />
                  Multi
                </div>
              )}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-500 mb-2">
              {formatDate(order.createdAt)}
            </div>
            <div className="font-medium text-stone-900 dark:text-stone-100 mb-1">
              {order.customerName}
            </div>
            <div className="text-sm text-stone-600 dark:text-stone-400 mb-2">
              {order.customerEmail}
            </div>
            {order.isMember && (
              <div className="text-xs text-[#EF9B0D] dark:text-[#EF9B0D] mb-2">
                Membre
              </div>
            )}
          </div>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${status.color} ${status.bgColor} border border-current/20`}>
            {status.icon}
            {status.label}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-500 mb-1">Niveau de prix</div>
            <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${priceLevel.color} ${priceLevel.bgColor}`}>
              {priceLevel.label}
            </div>
          </div>
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-500 mb-1">Point de retrait</div>
            <div className="text-sm text-stone-600 dark:text-stone-400">
              {order.pickupNurseryName}
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="text-xs text-stone-500 dark:text-stone-500 mb-1">Montant</div>
          <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
            {order.totalEuros > 0 && `${order.totalEuros.toFixed(2)} €`}
            {order.totalEuros > 0 && order.totalSemos > 0 && ' + '}
            {order.totalSemos > 0 && `${order.totalSemos} Semos`}
            {order.totalEuros === 0 && order.totalSemos === 0 && '-'}
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-500 mt-0.5">
            {order.lines.length} article{order.lines.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
          <button
            onClick={onView}
            className="px-3 py-1.5 text-sm rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Voir
          </button>
          {order.status === 'new' && onProcess && (
            <button
              onClick={onProcess}
              className="px-3 py-1.5 text-sm rounded-md text-[#EF9B0D] hover:bg-[#fbe6c3]/50 dark:hover:bg-[#fbe6c3]/10 transition-colors"
            >
              Traiter
            </button>
          )}
          {order.status === 'processing' && onMarkReady && (
            <button
              onClick={onMarkReady}
              className="px-3 py-1.5 text-sm rounded-md text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
            >
              Prêt
            </button>
          )}
          {order.status === 'ready' && onMarkPickedUp && (
            <button
              onClick={onMarkPickedUp}
              className="px-3 py-1.5 text-sm rounded-md text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
            >
              Retiré
            </button>
          )}
          {(order.status === 'new' || order.status === 'processing') && onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              Annuler
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
