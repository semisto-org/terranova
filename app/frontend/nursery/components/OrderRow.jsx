import { Eye, Package, CheckCircle2, XCircle, Clock, Truck, MapPin } from 'lucide-react'

const statusConfig = {
  new: { label: 'Nouvelle', color: 'text-blue-700', bgColor: 'bg-blue-100 dark:bg-blue-950/30', icon: <Clock className="w-3.5 h-3.5" /> },
  processing: { label: 'En préparation', color: 'text-[#EF9B0D]', bgColor: 'bg-[#fbe6c3] dark:bg-[#fbe6c3]/20', icon: <Package className="w-3.5 h-3.5" /> },
  ready: { label: 'Prête', color: 'text-green-700', bgColor: 'bg-green-100 dark:bg-green-950/30', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  'picked-up': { label: 'Retirée', color: 'text-stone-600', bgColor: 'bg-stone-100 dark:bg-stone-800', icon: <Truck className="w-3.5 h-3.5" /> },
  cancelled: { label: 'Annulée', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-950/30', icon: <XCircle className="w-3.5 h-3.5" /> },
}

const priceLevelConfig = {
  solidarity: { label: 'Solidaire', color: 'text-purple-700', bgColor: 'bg-purple-100 dark:bg-purple-950/30' },
  standard: { label: 'Standard', color: 'text-stone-700', bgColor: 'bg-stone-100 dark:bg-stone-800' },
  support: { label: 'Soutien', color: 'text-[#EF9B0D]', bgColor: 'bg-[#fbe6c3] dark:bg-[#fbe6c3]/20' },
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function OrderRow({ order, onView, onProcess, onMarkReady, onMarkPickedUp, onCancel }) {
  const status = statusConfig[order.status] || statusConfig.new
  const priceLevel = priceLevelConfig[order.priceLevel] || priceLevelConfig.standard
  const uniqueNurseries = new Set(order.lines.map((l) => l.nurseryId))
  const isMultiNursery = uniqueNurseries.size > 1

  return (
    <div className="group relative">
      {/* Desktop */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 items-center py-4 px-4 border-b border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <div className="font-mono text-sm font-medium text-stone-900 dark:text-stone-100">{order.orderNumber}</div>
            {isMultiNursery && <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700"><MapPin className="w-3 h-3" />Multi</div>}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">{formatDate(order.createdAt)}</div>
        </div>
        <div className="col-span-2">
          <div className="font-medium text-stone-900 dark:text-stone-100">{order.customerName}</div>
          {order.isMember && <div className="text-xs text-[#EF9B0D] mt-0.5">Membre</div>}
        </div>
        <div className="col-span-2">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${status.color} ${status.bgColor}`}>{status.icon}{status.label}</div>
        </div>
        <div className="col-span-1">
          <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${priceLevel.color} ${priceLevel.bgColor}`}>{priceLevel.label}</div>
        </div>
        <div className="col-span-2 text-sm text-stone-600">{order.pickupNurseryName}</div>
        <div className="col-span-2">
          <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
            {order.totalEuros > 0 && `${order.totalEuros.toFixed(2)} €`}
            {order.totalEuros > 0 && order.totalSemos > 0 && ' + '}
            {order.totalSemos > 0 && `${order.totalSemos} Semos`}
          </div>
          <div className="text-xs text-stone-500">{order.lines.length} article{order.lines.length > 1 ? 's' : ''}</div>
        </div>
        <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onView?.(order.id)} className="p-1.5 rounded-md text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"><Eye className="w-4 h-4" /></button>
          {order.status === 'new' && <button onClick={() => onProcess?.(order.id)} className="p-1.5 rounded-md text-[#EF9B0D] hover:bg-[#fbe6c3]/50 transition-colors" title="Traiter"><Package className="w-4 h-4" /></button>}
          {order.status === 'processing' && <button onClick={() => onMarkReady?.(order.id)} className="p-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors" title="Prêt"><CheckCircle2 className="w-4 h-4" /></button>}
          {order.status === 'ready' && <button onClick={() => onMarkPickedUp?.(order.id)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors" title="Retiré"><Truck className="w-4 h-4" /></button>}
          {(order.status === 'new' || order.status === 'processing') && <button onClick={() => onCancel?.(order.id)} className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors" title="Annuler"><XCircle className="w-4 h-4" /></button>}
        </div>
      </div>
      {/* Mobile */}
      <div className="md:hidden p-4 border border-stone-200 rounded-lg bg-white dark:bg-stone-900 hover:shadow-md transition-shadow mb-2">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-mono text-sm font-medium text-stone-900">{order.orderNumber}</div>
            <div className="text-xs text-stone-500 mb-1">{formatDate(order.createdAt)}</div>
            <div className="font-medium text-stone-900">{order.customerName}</div>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${status.color} ${status.bgColor}`}>{status.icon}{status.label}</div>
        </div>
        <div className="text-sm font-medium text-stone-900 mb-3">
          {order.totalEuros > 0 && `${order.totalEuros.toFixed(2)} €`}
          {order.totalSemos > 0 && ` + ${order.totalSemos} Semos`}
          <span className="text-xs text-stone-500 ml-2">{order.lines.length} article{order.lines.length > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
          <button onClick={() => onView?.(order.id)} className="px-3 py-1.5 text-sm rounded-md text-stone-600 hover:bg-stone-100">Voir</button>
          {order.status === 'new' && <button onClick={() => onProcess?.(order.id)} className="px-3 py-1.5 text-sm rounded-md text-[#EF9B0D] hover:bg-[#fbe6c3]/50">Traiter</button>}
          {order.status === 'processing' && <button onClick={() => onMarkReady?.(order.id)} className="px-3 py-1.5 text-sm rounded-md text-green-600 hover:bg-green-50">Prêt</button>}
          {order.status === 'ready' && <button onClick={() => onMarkPickedUp?.(order.id)} className="px-3 py-1.5 text-sm rounded-md text-blue-600 hover:bg-blue-50">Retiré</button>}
          {(order.status === 'new' || order.status === 'processing') && <button onClick={() => onCancel?.(order.id)} className="px-3 py-1.5 text-sm rounded-md text-red-600 hover:bg-red-50">Annuler</button>}
        </div>
      </div>
    </div>
  )
}
