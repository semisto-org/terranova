import React, { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface MuteProjectToggleProps {
  projectType: string
  projectId: string
}

export default function MuteProjectToggle({ projectType, projectId }: MuteProjectToggleProps) {
  const [muted, setMuted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const base = `/api/v1/projects/${projectType}/${projectId}/mute`

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setMuted(false)
    apiRequest(base)
      .then((res: { muted: boolean } | null) => { if (!cancelled) setMuted(!!res?.muted) })
      .catch((err) => {
        if (cancelled) return
        // Non bloquant : l'en-tête projet doit rester utilisable si l'état de notification échoue.
        console.error('Impossible de charger les notifications du projet.', err)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [base])

  const toggle = async () => {
    if (loading || saving) return
    setSaving(true)
    try {
      if (muted) {
        const res = await apiRequest(base, { method: 'DELETE' }) as { muted: boolean } | null
        setMuted(res?.muted ?? false)
      } else {
        const res = await apiRequest(base, { method: 'POST' }) as { muted: boolean }
        setMuted(!!res.muted)
      }
    } catch (err) {
      // Non bloquant : une erreur de notification ne doit pas casser l'écran projet.
      console.error('Impossible de modifier les notifications du projet.', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || saving}
      title="Coupe les notifications de ce projet (sauf les objets que tu suis explicitement)"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        muted
          ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
          : 'text-stone-500 hover:bg-stone-100 border border-stone-200/70 bg-white/70'
      }`}
    >
      {muted ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
      {muted ? 'Notifications coupées' : 'Couper les notifications du projet'}
    </button>
  )
}
