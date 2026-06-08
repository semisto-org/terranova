import React, { useState, useEffect, useCallback } from 'react'
import {
  Megaphone,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { apiRequest } from '@/lib/api'

const STATUS_META = {
  confirmed: {
    label: 'Confirmé',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    icon: CheckCircle2,
  },
  to_confirm: {
    label: 'À confirmer',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: Clock,
  },
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TrainingAnnouncementsTab({ trainingId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState('confirmed')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiRequest(`/api/v1/academy/trainings/${trainingId}/announcements`)
      setItems(data?.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [trainingId])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(e) {
    e.preventDefault()
    if (!body.trim()) return
    setSaving(true)
    setError(null)
    try {
      await apiRequest(`/api/v1/academy/trainings/${trainingId}/announcements`, {
        method: 'POST',
        body: JSON.stringify({ title: title.trim() || null, body: body.trim(), status }),
      })
      setTitle('')
      setBody('')
      setStatus('confirmed')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(announcement) {
    const next = announcement.status === 'confirmed' ? 'to_confirm' : 'confirmed'
    setError(null)
    try {
      await apiRequest(`/api/v1/academy/announcements/${announcement.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(announcement) {
    if (!window.confirm('Supprimer cette actu ? Cette action est irréversible.')) return
    setError(null)
    try {
      await apiRequest(`/api/v1/academy/announcements/${announcement.id}`, {
        method: 'DELETE',
      })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Actus</h3>
          <p className="text-sm text-stone-500 mt-1">
            {items.length} actu{items.length !== 1 ? 's' : ''} publiée{items.length !== 1 ? 's' : ''} pour les participants
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Création */}
      <form onSubmit={handleCreate} className="bg-white rounded-xl p-5 border border-stone-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Titre (optionnel)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Changement de salle"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-[#B01A19] focus:outline-none focus:ring-1 focus:ring-[#B01A19]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            required
            placeholder="Votre message aux participants…"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-[#B01A19] focus:outline-none focus:ring-1 focus:ring-[#B01A19]"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-[#B01A19] focus:outline-none focus:ring-1 focus:ring-[#B01A19]"
            >
              <option value="confirmed">Confirmé</option>
              <option value="to_confirm">À confirmer</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving || !body.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#B01A19] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1514] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Publication…' : 'Publier'}
          </button>
        </div>
      </form>

      {/* Liste */}
      {loading && items.length === 0 ? (
        <div className="bg-white rounded-lg p-12 border border-stone-200 text-center text-stone-500">
          Chargement…
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg p-12 border border-stone-200 text-center">
          <Megaphone className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500">Aucune actu publiée pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const meta = STATUS_META[item.status] || STATUS_META.confirmed
            const StatusIcon = meta.icon
            return (
              <div key={item.id} className="bg-white rounded-lg p-5 border border-stone-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-stone-100 rounded-lg shrink-0">
                      <Megaphone className="w-5 h-5 text-stone-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.title && (
                        <h4 className="font-medium text-stone-900 mb-1 break-words">{item.title}</h4>
                      )}
                      <p className="text-sm text-stone-700 whitespace-pre-wrap break-words">{item.body}</p>
                      <span className="block text-xs text-stone-500 mt-2">
                        {item.publishedAt
                          ? `Publiée le ${formatDateTime(item.publishedAt)}`
                          : `Créée le ${formatDateTime(item.createdAt)}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors hover:opacity-80 ${meta.badge}`}
                      title="Basculer le statut"
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {meta.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-2 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
