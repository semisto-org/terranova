import type {
  NurseryDashboardProps,
  DashboardAlert,
  ScheduleSlot,
  Order,
  AlertType,
} from '../types'

// Composant pour un widget d'alerte
interface AlertWidgetProps {
  alert: DashboardAlert
  onClick?: (alertId: string, type: AlertType) => void
}

function AlertWidget({ alert, onClick }: AlertWidgetProps) {
  const priorityColors = {
    high: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-900/50',
      badge: 'bg-red-500 dark:bg-red-600',
      text: 'text-red-900 dark:text-red-100',
    },
    medium: {
      bg: 'bg-[#fbe6c3] dark:bg-[#EF9B0D]/20',
      border: 'border-[#EF9B0D]/30 dark:border-[#EF9B0D]/50',
      badge: 'bg-[#EF9B0D] dark:bg-[#EF9B0D]',
      text: 'text-[#EF9B0D] dark:text-[#EF9B0D]',
    },
    low: {
      bg: 'bg-stone-50 dark:bg-stone-800/50',
      border: 'border-stone-200 dark:border-stone-700',
      badge: 'bg-stone-400 dark:bg-stone-500',
      text: 'text-stone-700 dark:text-stone-300',
    },
  }

  const colors = priorityColors[alert.priority]

  const alertIcons = {
    'low-stock': '📦',
    'pending-order': '📋',
    'pending-transfer': '🚚',
    'pending-validation': '✅',
  }

  return (
    <button
      onClick={() => onClick?.(alert.id, alert.type)}
      className={`
        w-full text-left p-4 rounded-xl border transition-all
        ${colors.bg} ${colors.border} ${colors.text}
        hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
        focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2
      `}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{alertIcons[alert.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm leading-tight">{alert.title}</h3>
            <span
              className={`
                inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                ${colors.badge} text-white
              `}
            >
              {alert.priority === 'high' ? 'Urgent' : alert.priority === 'medium' ? 'Moyen' : 'Faible'}
            </span>
          </div>
          <p className="text-xs opacity-80 leading-relaxed">{alert.description}</p>
        </div>
      </div>
    </button>
  )
}

// Composant pour un compteur d'alertes
interface AlertCounterProps {
  label: string
  count: number
  type: AlertType
  priority?: 'high' | 'medium' | 'low'
  onClick?: () => void
}

function AlertCounter({ label, count, type, priority, onClick }: AlertCounterProps) {
  const iconMap = {
    'low-stock': '📦',
    'pending-order': '📋',
    'pending-transfer': '🚚',
    'pending-validation': '✅',
  }

  const priorityStyles = {
    high: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50',
    medium: 'bg-[#fbe6c3] dark:bg-[#EF9B0D]/20 border-[#EF9B0D]/30 dark:border-[#EF9B0D]/50',
    low: 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700',
  }

  const style = priority ? priorityStyles[priority] : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700'

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 p-4 rounded-xl border transition-all
        ${style}
        hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
        focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2
      `}
    >
      <div className="text-2xl">{iconMap[type]}</div>
      <div className="flex-1">
        <div className="text-3xl font-bold text-[#EF9B0D] dark:text-[#EF9B0D]">{count}</div>
        <div className="text-xs text-stone-600 dark:text-stone-400 mt-1">{label}</div>
      </div>
    </button>
  )
}

// Composant pour un créneau de planning
interface ScheduleSlotCardProps {
  slot: ScheduleSlot
  onClick?: () => void
}

function ScheduleSlotCard({ slot, onClick }: ScheduleSlotCardProps) {
  const roleColors = {
    manager: 'bg-[#EF9B0D]/10 dark:bg-[#EF9B0D]/20 border-[#EF9B0D]/30',
    employee: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50',
    intern: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50',
    volunteer: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50',
  }

  const roleLabels = {
    manager: 'Manager',
    employee: 'Employé',
    intern: 'Stagiaire',
    volunteer: 'Bénévole',
  }

  return (
    <div
      onClick={onClick}
      className={`
        p-3 rounded-lg border transition-all cursor-pointer
        ${roleColors[slot.memberRole]}
        hover:shadow-sm hover:scale-[1.01]
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-stone-900 dark:text-stone-100">
              {slot.memberName}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
              {roleLabels[slot.memberRole]}
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400">{slot.nurseryName}</p>
          {slot.activity && (
            <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">{slot.activity}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs font-medium text-stone-700 dark:text-stone-300">
            {slot.startTime} - {slot.endTime}
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant pour une carte de commande récente
interface OrderCardProps {
  order: Order
  onClick?: () => void
}

function OrderCard({ order, onClick }: OrderCardProps) {
  const statusColors = {
    new: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50',
    processing: 'bg-[#fbe6c3] dark:bg-[#EF9B0D]/20 border-[#EF9B0D]/30 dark:border-[#EF9B0D]/50',
    ready: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50',
    'picked-up': 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700',
    cancelled: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50',
  }

  const statusLabels = {
    new: 'Nouvelle',
    processing: 'En préparation',
    ready: 'Prête',
    'picked-up': 'Retirée',
    cancelled: 'Annulée',
  }

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-xl border transition-all
        ${statusColors[order.status]}
        hover:shadow-md hover:scale-[1.01] active:scale-[0.99]
        focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2
      `}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-stone-900 dark:text-stone-100">
              {order.orderNumber}
            </span>
            <span
              className={`
                inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                ${order.status === 'new' ? 'bg-blue-500' : order.status === 'processing' ? 'bg-[#EF9B0D]' : order.status === 'ready' ? 'bg-green-500' : order.status === 'picked-up' ? 'bg-stone-400' : 'bg-red-500'}
                text-white
              `}
            >
              {statusLabels[order.status]}
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400">{order.customerName}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
            {order.totalEuros > 0 && `${order.totalEuros.toFixed(2)}€`}
            {order.totalEuros > 0 && order.totalSemos > 0 && ' + '}
            {order.totalSemos > 0 && `${order.totalSemos}S`}
          </div>
        </div>
      </div>
      <div className="text-xs text-stone-500 dark:text-stone-500">
        {order.lines.length} article{order.lines.length > 1 ? 's' : ''} • Retrait: {order.pickupNurseryName}
      </div>
    </button>
  )
}

// Composant principal
export function NurseryDashboard({
  alerts,
  lowStockCount,
  pendingOrdersCount,
  pendingTransfersCount,
  pendingValidationsCount,
  todaySchedule,
  recentOrders,
  onViewStock,
  onViewOrders,
  onViewTransfers,
  onViewValidations,
  onViewSchedule,
  onAlertClick,
}: NurseryDashboardProps) {
  // Trier les alertes par priorité (high d'abord)
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const sortedAlerts = [...alerts].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            Tableau de bord Pépinières
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            Vue d'ensemble des actions prioritaires et de l'activité du jour
          </p>
        </div>

        {/* Compteurs d'alertes */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Alertes en cours
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AlertCounter
              label="Stocks bas"
              count={lowStockCount}
              type="low-stock"
              priority={lowStockCount > 0 ? 'high' : 'low'}
              onClick={onViewStock}
            />
            <AlertCounter
              label="Commandes en attente"
              count={pendingOrdersCount}
              type="pending-order"
              priority={pendingOrdersCount > 0 ? 'high' : 'low'}
              onClick={onViewOrders}
            />
            <AlertCounter
              label="Transferts à planifier"
              count={pendingTransfersCount}
              type="pending-transfer"
              priority={pendingTransfersCount > 0 ? 'medium' : 'low'}
              onClick={onViewTransfers}
            />
            <AlertCounter
              label="Validations en attente"
              count={pendingValidationsCount}
              type="pending-validation"
              priority={pendingValidationsCount > 0 ? 'low' : 'low'}
              onClick={onViewValidations}
            />
          </div>
        </section>

        {/* Widgets d'alertes détaillées */}
        {sortedAlerts.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
              Alertes détaillées
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedAlerts.map((alert) => (
                <AlertWidget key={alert.id} alert={alert} onClick={onAlertClick} />
              ))}
            </div>
          </section>
        )}

        {/* Planning du jour et commandes récentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Planning du jour */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                Planning du jour
              </h2>
              {onViewSchedule && (
                <button
                  onClick={onViewSchedule}
                  className="text-sm text-[#EF9B0D] hover:text-[#EF9B0D]/80 font-medium transition-colors"
                >
                  Voir tout →
                </button>
              )}
            </div>
            {todaySchedule.length > 0 ? (
              <div className="space-y-2">
                {todaySchedule.map((slot) => (
                  <ScheduleSlotCard key={slot.id} slot={slot} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50">
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  Aucun créneau prévu aujourd'hui
                </p>
              </div>
            )}
          </section>

          {/* Commandes récentes */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                Commandes récentes
              </h2>
              {onViewOrders && (
                <button
                  onClick={onViewOrders}
                  className="text-sm text-[#EF9B0D] hover:text-[#EF9B0D]/80 font-medium transition-colors"
                >
                  Voir tout →
                </button>
              )}
            </div>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50">
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  Aucune commande récente
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Actions rapides */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Actions rapides
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <button
              onClick={onViewStock}
              className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 hover:bg-[#fbe6c3] dark:hover:bg-[#EF9B0D]/20 hover:border-[#EF9B0D]/30 dark:hover:border-[#EF9B0D]/50 transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2"
            >
              <div className="text-2xl mb-2">📦</div>
              <div className="text-xs font-medium text-stone-700 dark:text-stone-300">Gérer le stock</div>
            </button>
            <button
              onClick={onViewOrders}
              className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 hover:bg-[#fbe6c3] dark:hover:bg-[#EF9B0D]/20 hover:border-[#EF9B0D]/30 dark:hover:border-[#EF9B0D]/50 transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="text-xs font-medium text-stone-700 dark:text-stone-300">Commandes</div>
            </button>
            <button
              onClick={onViewTransfers}
              className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 hover:bg-[#fbe6c3] dark:hover:bg-[#EF9B0D]/20 hover:border-[#EF9B0D]/30 dark:hover:border-[#EF9B0D]/50 transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2"
            >
              <div className="text-2xl mb-2">🚚</div>
              <div className="text-xs font-medium text-stone-700 dark:text-stone-300">Transferts</div>
            </button>
            <button
              onClick={onViewValidations}
              className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 hover:bg-[#fbe6c3] dark:hover:bg-[#EF9B0D]/20 hover:border-[#EF9B0D]/30 dark:hover:border-[#EF9B0D]/50 transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2"
            >
              <div className="text-2xl mb-2">✅</div>
              <div className="text-xs font-medium text-stone-700 dark:text-stone-300">Validations</div>
            </button>
            <button
              onClick={onViewSchedule}
              className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 hover:bg-[#fbe6c3] dark:hover:bg-[#EF9B0D]/20 hover:border-[#EF9B0D]/30 dark:hover:border-[#EF9B0D]/50 transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2"
            >
              <div className="text-2xl mb-2">📅</div>
              <div className="text-xs font-medium text-stone-700 dark:text-stone-300">Planning</div>
            </button>
            <button
              className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 hover:bg-[#fbe6c3] dark:hover:bg-[#EF9B0D]/20 hover:border-[#EF9B0D]/30 dark:hover:border-[#EF9B0D]/50 transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2"
            >
              <div className="text-2xl mb-2">🌱</div>
              <div className="text-xs font-medium text-stone-700 dark:text-stone-300">Plants-mères</div>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

