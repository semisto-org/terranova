import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Bell, Calendar, Users, FileText, ShoppingCart } from 'lucide-react'

export interface Notification {
  id: string
  type: 'project' | 'formation' | 'member' | 'order' | 'system'
  title: string
  description: string
  timestamp: Date
  read: boolean
  href?: string
}

interface NotificationsDrawerProps {
  isOpen: boolean
  onClose: () => void
  notifications: Notification[]
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onNotificationClick?: (notification: Notification) => void
}

const typeIcons = {
  project: FileText,
  formation: Calendar,
  member: Users,
  order: ShoppingCart,
  system: Bell,
}

const typeColors = {
  project: 'text-lime-600 bg-lime-100',
  formation: 'text-red-600 bg-red-100',
  member: 'text-blue-600 bg-blue-100',
  order: 'text-amber-600 bg-amber-100',
  system: 'text-stone-600 bg-stone-100',
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function groupNotificationsByDate(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {}
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  notifications.forEach(notif => {
    const notifDate = new Date(notif.timestamp)
    const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate())

    let group: string
    if (notifDay.getTime() >= today.getTime()) {
      group = "Aujourd'hui"
    } else if (notifDay.getTime() >= yesterday.getTime()) {
      group = 'Hier'
    } else if (notifDay.getTime() >= weekAgo.getTime()) {
      group = 'Cette semaine'
    } else {
      group = 'Plus ancien'
    }

    if (!groups[group]) groups[group] = []
    groups[group].push(notif)
  })

  return groups
}

export function NotificationsDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
}: NotificationsDrawerProps) {
  const unreadCount = notifications.filter(n => !n.read).length
  const groupedNotifications = groupNotificationsByDate(notifications)
  const groupOrder = ["Aujourd'hui", 'Hier', 'Cette semaine', 'Plus ancien']

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-stone-900 shadow-2xl flex flex-col animate-slide-in-right"
        style={{
          animation: 'slideInRight 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Tout marquer comme lu</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-5 py-12">
              <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-stone-400" />
              </div>
              <p className="text-stone-600 dark:text-stone-400 font-medium">
                Aucune notification
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">
                Vous êtes à jour !
              </p>
            </div>
          ) : (
            groupOrder.map(groupName => {
              const groupNotifs = groupedNotifications[groupName]
              if (!groupNotifs || groupNotifs.length === 0) return null

              return (
                <div key={groupName}>
                  <div className="px-5 py-2 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      {groupName}
                    </span>
                  </div>
                  {groupNotifs.map(notification => {
                    const Icon = typeIcons[notification.type]
                    const colorClass = typeColors[notification.type]

                    return (
                      <button
                        key={notification.id}
                        onClick={() => {
                          onMarkAsRead?.(notification.id)
                          onNotificationClick?.(notification)
                        }}
                        className={`w-full flex items-start gap-3 px-5 py-4 text-left border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors ${
                          !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${!notification.read ? 'font-semibold text-stone-900 dark:text-stone-100' : 'text-stone-700 dark:text-stone-300'}`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">
                            {notification.description}
                          </p>
                          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                            {formatRelativeTime(notification.timestamp)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>,
    document.body
  )
}
