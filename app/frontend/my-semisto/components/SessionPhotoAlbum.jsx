import React, { useState } from 'react'
import { Images, ExternalLink, Pencil, Check, X, Loader2 } from 'lucide-react'
import { myApiRequest } from '../lib/api'
import { myApiPath } from '../lib/paths'

const ACCENT = '#B01A19'

/**
 * Per-session Google Photos album link on the My Semisto training page.
 * - Read view (everyone who can see the training): a clickable link when set.
 * - Edit affordance (only when canEdit, i.e. the contact is a trainer): set,
 *   change or clear the link in place. A blank value clears it.
 * - On success calls onSaved() so the parent refetches and stays in sync.
 */
export default function SessionPhotoAlbum({ trainingId, session, canEdit = false, onSaved }) {
  const current = session.photoAlbumUrl || ''
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(current)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function openEditor() {
    setValue(current)
    setError(null)
    setEditing(true)
  }

  function cancel() {
    setValue(current)
    setError(null)
    setEditing(false)
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await myApiRequest(
        `${myApiPath('/academy')}/${trainingId}/sessions/${session.id}/photo-album`,
        { method: 'PATCH', body: JSON.stringify({ photo_album_url: value.trim() }) }
      )
      setEditing(false)
      if (onSaved) onSaved()
    } catch (err) {
      setError(err.message || 'Échec de l’enregistrement. Réessayez.')
    } finally {
      setSaving(false)
    }
  }

  // ── Edit view ──
  if (editing) {
    return (
      <div className="mt-3 pt-3 border-t border-stone-100">
        <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Images size={11} />
          Album photo de la session
        </label>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={saving}
            placeholder="https://photos.app.goo.gl/…"
            className="flex-1 min-w-0 text-sm rounded-lg border border-stone-200 px-3 py-1.5
                       focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30"
          />
          <button
            type="button"
            onClick={save}
            disabled={saving}
            title="Enregistrer"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: ACCENT }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={saving}
            title="Annuler"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            <X size={15} />
          </button>
        </div>
        <p className="text-[11px] text-stone-400 mt-1">Laissez vide pour retirer le lien.</p>
        {error && (
          <p className="text-xs text-red-700 mt-1.5" role="alert">{error}</p>
        )}
      </div>
    )
  }

  // ── Read view, link present ──
  if (current) {
    return (
      <div className="mt-2.5 flex items-center gap-3">
        <a
          href={current}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:underline"
          style={{ color: ACCENT }}
        >
          <Images size={13} />
          Album photo de la session
          <ExternalLink size={11} />
        </a>
        {canEdit && (
          <button
            type="button"
            onClick={openEditor}
            className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-600 transition-colors"
          >
            <Pencil size={11} />
            Modifier
          </button>
        )}
      </div>
    )
  }

  // ── Read view, no link: trainers get an "add" affordance, others see nothing ──
  if (canEdit) {
    return (
      <button
        type="button"
        onClick={openEditor}
        className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-[#B01A19] transition-colors"
      >
        <Images size={13} />
        Ajouter l’album photo
      </button>
    )
  }

  return null
}
