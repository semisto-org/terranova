import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Save } from 'lucide-react'

/**
 * ContainerForm — modal for creating/editing a Nursery::Container.
 * Rendered through a portal so it can be safely opened from inside another <form>
 * (e.g. StockBatchForm), avoiding nested-form bubbling issues.
 */
export function ContainerForm({ container, initialName = '', onSave, onCancel, busy }) {
  const isEdit = Boolean(container?.id)

  const [name, setName] = useState(container?.name ?? initialName)
  const [shortName, setShortName] = useState(container?.shortName ?? '')
  const [volumeLiters, setVolumeLiters] = useState(container?.volumeLiters != null ? String(container.volumeLiters) : '')
  const [description, setDescription] = useState(container?.description ?? '')
  const [sortOrder, setSortOrder] = useState(container?.sortOrder != null ? String(container.sortOrder) : '')
  const [error, setError] = useState(null)

  // Auto-derive a default short_name from the name on first input,
  // unless the user has already typed one.
  useEffect(() => {
    if (shortName || isEdit) return
    const derived = deriveShortName(name)
    if (derived) setShortName(derived)
  }, [name, shortName, isEdit])

  // Escape closes
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const submit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!name.trim() || !shortName.trim()) { setError('Nom et code court obligatoires.'); return }
    setError(null)
    onSave({
      name: name.trim(),
      short_name: shortName.trim(),
      volume_liters: volumeLiters.trim() ? Number(volumeLiters) : null,
      description: description.trim(), // schema requires NOT NULL with default ""
      sort_order: sortOrder.trim() ? Number(sortOrder) : 0,
    })
  }

  const inputClass = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 placeholder-stone-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]"

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#fffaf0] shadow-2xl">
        <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 rounded-full border border-[#EF9B0D]/40" aria-hidden />
        <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 rounded-full border border-[#EF9B0D]/40" aria-hidden />
        <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 rounded-full border border-[#EF9B0D]/40" aria-hidden />
        <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 rounded-full border border-[#EF9B0D]/40" aria-hidden />

        <div className="border-b border-[#EF9B0D]/20 px-7 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#EF9B0D]">Pépinière · Contenant</p>
          <h2 className="mt-1 font-serif text-2xl text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>
            {isEdit ? 'Modifier le contenant' : 'Nouveau contenant'}
          </h2>
          <button type="button" onClick={onCancel} className="absolute right-5 top-5 rounded-full p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 px-7 py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">Nom</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Godet 9cm, Pot 1 litre, Racines nues…"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">Code court</span>
              <input
                value={shortName}
                onChange={(e) => setShortName(e.target.value.toUpperCase())}
                placeholder="G9, P1, RN…"
                maxLength={6}
                className={`${inputClass} font-mono uppercase tracking-wider`}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Volume (L) <span className="font-normal normal-case text-stone-400">— optionnel</span>
              </span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={volumeLiters}
                onChange={(e) => setVolumeLiters(e.target.value)}
                placeholder="0.7, 1, 2, 5…"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Ordre d'affichage <span className="font-normal normal-case text-stone-400">— optionnel</span>
              </span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="1, 2, 3…"
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">
              Description <span className="font-normal normal-case text-stone-400">— optionnel</span>
            </span>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Plants à racines nues (saison hivernale)…"
              className={`${inputClass} resize-none`}
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-sm font-medium text-stone-600 transition hover:text-stone-900">
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md bg-[#EF9B0D] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#d88a0b] disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {busy ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le contenant'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

function deriveShortName(name) {
  const trimmed = (name || '').trim()
  if (!trimmed) return ''
  // "Godet 9cm" → G9, "Racines nues" → RN, "Pot 2 litres" → P2
  const tokens = trimmed.split(/\s+/)
  const first = tokens[0]?.[0]?.toUpperCase() || ''
  const numMatch = trimmed.match(/(\d+(?:[.,]\d+)?)/)
  if (numMatch) return (first + numMatch[1].replace('.', '').replace(',', '')).slice(0, 6)
  const second = tokens[1]?.[0]?.toUpperCase()
  return (first + (second || '')).slice(0, 6)
}
