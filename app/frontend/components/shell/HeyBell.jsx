import React, { useEffect, useMemo, useState } from 'react'
import { router } from '@inertiajs/react'
import { Bell, CheckCheck, X } from 'lucide-react'
import { apiRequest } from '@/lib/api'

// Boîte « Hey! » (#105) — cloche + panneau directed-at-me.
// Doctrine : ce panneau ne montre QUE ce qui m'est adressé (assignations,
// mentions, commentaires sur ce que je suis…). Le flux ambiant vit sur la
// page Activité (#110), SANS compteur — ne jamais fusionner les deux.

const KIND_PHRASES = {
  assignment: "t'a assigné",
  ping: "t'a fait coucou sur",
  mention: "t'a mentionné sur",
  comment: 'a commenté',
  due_soon: 'échéance demain pour',
}

const relativeTime = (iso) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 7) return `il y a ${days} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const initials = (name) =>
  (name || '?').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

function NotificationRow({ notification, onOpen }) {
  const unread = !notification.readAt
  const phrase = KIND_PHRASES[notification.kind] || notification.kind

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={`w-full text-left px-4 py-3 flex items-start gap-2.5 transition-colors hover:bg-stone-100 ${
        unread ? 'bg-white' : 'bg-stone-50 opacity-70'
      }`}
    >
      {notification.actor?.avatar ? (
        <img src={notification.actor.avatar} alt="" className="w-7 h-7 rounded-full bg-stone-200 shrink-0 mt-0.5" />
      ) : (
        <span className="w-7 h-7 rounded-full bg-stone-200 text-stone-600 text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
          {notification.actor ? initials(notification.actor.name) : '·'}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-stone-700 leading-snug">
          {notification.actor && <strong className="font-medium text-stone-900">{notification.actor.name}</strong>}{' '}
          {phrase}{' '}
          <strong className="font-medium text-stone-900">{notification.subject?.label}</strong>
        </span>
        <span className="block text-xs text-stone-400 mt-0.5">{relativeTime(notification.createdAt)}</span>
      </span>
      {unread && <span className="w-2 h-2 rounded-full bg-[#B01A19] shrink-0 mt-2" aria-label="non lu" />}
    </button>
  )
}

export default function HeyBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const refreshCount = () => {
    apiRequest('/api/v1/notifications/unread-count')
      .then((res) => setUnreadCount(res?.count ?? 0))
      .catch(() => {}) // cloche silencieuse plutôt que cassée
  }

  useEffect(refreshCount, [])

  const openPanel = () => {
    setOpen(true)
    setLoading(true)
    apiRequest('/api/v1/notifications')
      .then((res) => {
        setNotifications(res?.notifications || [])
        setUnreadCount(res?.unreadCount ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const openNotification = async (notification) => {
    try {
      if (!notification.readAt) {
        await apiRequest(`/api/v1/notifications/${notification.id}/read`, { method: 'PATCH' })
        setUnreadCount((c) => Math.max(0, c - 1))
      }
    } catch {
      // la navigation prime sur le marquage
    }
    setOpen(false)
    router.visit(notification.url || '/')
  }

  const markAllRead = async () => {
    try {
      await apiRequest('/api/v1/notifications/read-all', { method: 'PATCH' })
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })))
      setUnreadCount(0)
    } catch {
      // non bloquant
    }
  }

  // Regroupement lisible par projet (le CONTENU reste directed-at-me).
  const groups = useMemo(() => {
    const byProject = new Map()
    notifications.forEach((n) => {
      const key = n.project?.name || 'Collectif'
      if (!byProject.has(key)) byProject.set(key, [])
      byProject.get(key).push(n)
    })
    return Array.from(byProject.entries())
  }, [notifications])

  return (
    <>
      <button
        onClick={openPanel}
        className="relative p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
        aria-label="Hey ! — mes notifications"
        title="Hey !"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#B01A19] text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-stone-50 border-l border-stone-200 shadow-2xl flex flex-col safe-top safe-bottom safe-right">
            <div className="h-13 border-b border-stone-200 bg-white flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2 text-stone-800 font-semibold text-sm">
                <Bell className="w-4 h-4 text-[#B01A19]" />
                Hey !
                {unreadCount > 0 && <span className="text-xs font-normal text-stone-400">{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span>}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-stone-500 hover:bg-stone-100 transition-colors"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Tout lu
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors" aria-label="Fermer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-6 text-sm text-stone-400">Chargement…</p>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <Bell className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                  <p className="text-sm text-stone-500">Rien de neuf, tout est calme.</p>
                </div>
              ) : (
                groups.map(([projectName, items]) => (
                  <div key={projectName}>
                    <div className="px-4 pt-4 pb-1 text-xs font-medium text-stone-400 uppercase tracking-wider">{projectName}</div>
                    <div className="divide-y divide-stone-100">
                      {items.map((n) => (
                        <NotificationRow key={n.id} notification={n} onOpen={openNotification} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </>
      )}
    </>
  )
}
