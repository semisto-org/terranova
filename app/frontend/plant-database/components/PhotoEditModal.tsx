import { useEffect, useState } from 'react'
import { Trash2, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'
import type { Photo } from '../types'

interface Props {
  open: boolean
  photo: Photo
  onClose: () => void
  onSaved?: (updated: Photo) => void
  onDeleted?: (deletedId: string) => void
}

const ROLE_OPTIONS = [
  { value: '', label: '—' },
  { value: 'flower', label: 'Fleur' },
  { value: 'fruit', label: 'Fruit' },
  { value: 'foliage', label: 'Feuillage' },
  { value: 'habit', label: 'Port' },
  { value: 'general', label: 'Général' },
]

const LICENSE_SUGGESTIONS = [
  'CC0',
  'Public Domain',
  'CC BY',
  'CC BY 2.0',
  'CC BY 3.0',
  'CC BY 4.0',
  'CC BY-SA',
  'CC BY-SA 2.0',
  'CC BY-SA 3.0',
  'CC BY-SA 4.0',
  'CC BY-NC',
  'CC BY-NC 2.0',
  'CC BY-NC 4.0',
  'CC BY-NC-SA',
  'CC BY-NC-SA 4.0',
  'CC BY-ND',
  'CC BY-NC-ND',
  'All rights reserved',
]

const PLATFORM_SUGGESTIONS = [
  'Wikimedia Commons',
  'iNaturalist',
  'GBIF',
  'Flickr',
  'USDA Plants',
  'Terranova',
  'Pacific Bulb Society',
  'NC State Extension',
  'PFAF',
]

export function PhotoEditModal({ open, photo, onClose, onSaved, onDeleted }: Props) {
  const [url, setUrl] = useState(photo.url)
  const [caption, setCaption] = useState(photo.caption || '')
  const [role, setRole] = useState(photo.role || '')
  const [license, setLicense] = useState(photo.license || '')
  const [attributionAuthor, setAttributionAuthor] = useState(photo.attributionAuthor || '')
  const [sourcePlatform, setSourcePlatform] = useState(photo.sourcePlatform || '')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setUrl(photo.url)
    setCaption(photo.caption || '')
    setRole(photo.role || '')
    setLicense(photo.license || '')
    setAttributionAuthor(photo.attributionAuthor || '')
    setSourcePlatform(photo.sourcePlatform || '')
    setError(null)
  }, [open, photo])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting && !deleting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, submitting, deleting, onClose])

  if (!open) return null

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const updated = await apiRequest<Photo>(`/api/v1/plants/photos/${photo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          url,
          caption,
          role: role || null,
          license: license || null,
          attribution_author: attributionAuthor || null,
          source_platform: sourcePlatform || null,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      toast.success('Photo mise à jour')
      onSaved?.(updated)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de la mise à jour')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette photo ?')) return
    setDeleting(true)
    setError(null)
    try {
      await apiRequest(`/api/v1/plants/photos/${photo.id}`, { method: 'DELETE' })
      toast.success('Photo supprimée')
      onDeleted?.(photo.id)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#5B5781] focus:ring-2 focus:ring-[#5B5781]/15 disabled:opacity-60'
  const labelClass = 'block text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 mb-1.5'

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-900/40 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting && !deleting) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-xl w-full overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-stone-100">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(91, 87, 129, 0.10)' }}>
              <ImageIcon className="w-4 h-4" style={{ color: '#5B5781' }} />
            </div>
            <div>
              <h2 className="text-xl text-stone-900 leading-tight" style={{ fontFamily: "'Sole Serif Small', 'DM Serif Display', serif" }}>
                Éditer la photo
              </h2>
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400 mt-0.5">
                Plant Database · Photo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting || deleting}
            aria-label="Fermer"
            className="shrink-0 -mr-2 -mt-1 p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {url && (
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-2 flex items-center justify-center">
              <img src={url} alt="" className="max-h-48 object-contain" />
            </div>
          )}

          <div>
            <label htmlFor="photo-url" className={labelClass}>URL</label>
            <input
              id="photo-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={submitting || deleting}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="photo-caption" className={labelClass}>Légende</label>
            <input
              id="photo-caption"
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={submitting || deleting}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="photo-role" className={labelClass}>Rôle</label>
              <select
                id="photo-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={submitting || deleting}
                className={inputClass}
              >
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="photo-license" className={labelClass}>Licence</label>
              <input
                id="photo-license"
                type="text"
                list="photo-license-suggestions"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                disabled={submitting || deleting}
                className={inputClass}
                placeholder="CC BY-SA 4.0"
              />
              <datalist id="photo-license-suggestions">
                {LICENSE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="photo-author" className={labelClass}>Auteur·trice</label>
              <input
                id="photo-author"
                type="text"
                value={attributionAuthor}
                onChange={(e) => setAttributionAuthor(e.target.value)}
                disabled={submitting || deleting}
                className={inputClass}
                placeholder="H. Zell"
              />
            </div>
            <div>
              <label htmlFor="photo-platform" className={labelClass}>Plateforme source</label>
              <input
                id="photo-platform"
                type="text"
                list="photo-platform-suggestions"
                value={sourcePlatform}
                onChange={(e) => setSourcePlatform(e.target.value)}
                disabled={submitting || deleting}
                className={inputClass}
                placeholder="Wikimedia Commons"
              />
              <datalist id="photo-platform-suggestions">
                {PLATFORM_SUGGESTIONS.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-6 py-4 bg-stone-50/60 border-t border-stone-100">
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting || deleting}
            className="inline-flex items-center gap-2 px-3 py-2 border border-red-200 text-red-700 rounded-lg text-sm hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || deleting}
              className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 text-sm hover:bg-white disabled:opacity-60"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting || deleting || !url}
              className="px-4 py-2 bg-[#5B5781] text-white rounded-lg text-sm font-medium hover:bg-[#4a4770] disabled:opacity-60"
            >
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
