import React, { useEffect, useRef, useState } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import { apiRequest } from '@/lib/api'

type SubscriptionState = 'auto' | 'explicit' | 'unsubscribed' | null

interface FollowButtonProps {
  parentType: 'tasks' | 'events'
  parentId: string
  accentColor?: string
}

export default function FollowButton({ parentType, parentId, accentColor = '#5B5781' }: FollowButtonProps) {
  const [subscribed, setSubscribed] = useState(false)
  const [state, setState] = useState<SubscriptionState>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hovered, setHovered] = useState(false)

  const base = `/api/v1/${parentType}/${parentId}/subscription`

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setSubscribed(false)
    setState(null)
    apiRequest(base)
      .then((res: { subscribed: boolean; state: SubscriptionState } | null) => {
        if (!cancelled) {
          setSubscribed(!!res?.subscribed)
          setState(res?.state || null)
        }
      })
      .catch((err) => {
        if (cancelled) return
        // Non bloquant : le modal hôte doit rester utilisable si l'état de suivi échoue.
        console.error('Impossible de charger le suivi.', err)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [base])

  // Garde synchrone : `saving` (état React) est asynchrone — deux clics dans
  // la même frame le voient tous deux à false (cause du double POST vu en
  // vérification live, 11/06).
  const busyRef = useRef(false)

  const toggle = async () => {
    if (loading || busyRef.current) return
    busyRef.current = true
    setSaving(true)
    try {
      if (subscribed) {
        const res = await apiRequest(base, { method: 'DELETE' }) as { subscribed: boolean; state: SubscriptionState } | null
        setSubscribed(res?.subscribed ?? false)
        setState(res?.state ?? 'unsubscribed')
      } else {
        const res = await apiRequest(base, { method: 'POST' }) as { subscribed: boolean; state: SubscriptionState }
        setSubscribed(!!res.subscribed)
        setState(res.state)
      }
    } catch (err) {
      // Non bloquant : une erreur de suivi ne doit pas casser le modal hôte.
      console.error('Impossible de modifier le suivi.', err)
    } finally {
      busyRef.current = false
      setSaving(false)
    }
  }

  const disabled = loading || saving
  const showUnfollow = subscribed && hovered && !disabled
  const Icon = subscribed ? (showUnfollow ? BellOff : BellRing) : Bell
  const label = subscribed ? (showUnfollow ? 'Ne plus suivre' : 'Suivi') : 'Suivre'
  const title = state === 'auto'
    ? 'Suivi automatique (assignation, commentaire ou mention)'
    : subscribed
      ? 'Ne plus suivre'
      : 'Suivre cet élément'

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        subscribed ? '' : 'text-stone-500 hover:bg-stone-100'
      }`}
      style={subscribed ? { color: accentColor, backgroundColor: `${accentColor}14` } : undefined}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}
