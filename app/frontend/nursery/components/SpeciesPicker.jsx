import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiRequest } from '@/lib/api'
import { Search, Sprout, Leaf, BookmarkPlus, X, Check } from 'lucide-react'

/**
 * SpeciesPicker — type-first autocomplete for the plant DB.
 *
 * Lets a pépiniériste pick a Plant::Species by latin/common name. When no result
 * matches the typed query, offers a "Créer cette espèce" CTA that opens an
 * inline QuickCreateSpeciesModal. The modal itself can chain a QuickCreateGenusModal.
 *
 * Props:
 *   value:    { id, latinName } | null
 *   onChange: (next) => void
 *   placeholder, autoFocus
 */
export function SpeciesPicker({ value, onChange, placeholder = 'Tape un nom (Allium ursinum, ail des ours...)', autoFocus = false }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const handle = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await apiRequest(`/api/v1/plants/search?query=${encodeURIComponent(query.trim())}`)
        const onlySpecies = (res.items || []).filter((it) => it.type === 'species')
        setResults(onlySpecies)
      } catch (e) {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 220)
    return () => clearTimeout(handle)
  }, [query])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { if (autoFocus) inputRef.current?.focus() }, [autoFocus])

  const selectResult = (item) => {
    onChange({ id: item.id, latinName: item.latinName, commonName: item.commonName })
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const clear = () => {
    onChange(null)
    setQuery('')
    inputRef.current?.focus()
  }

  const handleCreated = (created) => {
    onChange({ id: String(created.id), latinName: created.latinName || created.latin_name })
    setShowCreate(false)
    setQuery('')
    setResults([])
  }

  // ── Display when a species is already selected
  if (value?.id) {
    return (
      <div className="group/selected flex items-center gap-3 rounded-lg border-2 border-emerald-400 bg-emerald-50 px-3 py-2.5 shadow-sm transition" style={{ animation: 'speciesPickerPop 220ms cubic-bezier(0.2, 0.7, 0.2, 1)' }}>
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="truncate font-serif text-base italic text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>{value.latinName}</span>
          {value.commonName && <span className="truncate text-xs text-stone-600">— {value.commonName}</span>}
        </div>
        <button type="button" onClick={clear} className="rounded-md p-1 text-emerald-700 transition hover:bg-emerald-100 hover:text-emerald-900" aria-label="Changer d'espèce" title="Changer d'espèce">
          <X className="h-4 w-4" />
        </button>
        <style>{`@keyframes speciesPickerPop { from { transform: scale(0.97); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 pl-10 text-stone-900 placeholder-stone-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]"
        />
      </div>

      {open && (query.trim() || loading) && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl">
          <div className="max-h-72 overflow-y-auto">
            {loading && (
              <div className="px-4 py-3 text-sm text-stone-500">Recherche…</div>
            )}
            {!loading && results.length === 0 && query.trim() && (
              <div className="px-4 py-3 text-sm text-stone-500">Aucune espèce ne correspond.</div>
            )}
            {!loading && results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectResult(item)}
                className="flex w-full items-baseline gap-3 border-b border-stone-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-[#fbe6c3]/60"
              >
                <Leaf className="h-3.5 w-3.5 shrink-0 translate-y-[2px] text-[#EF9B0D]/70" aria-hidden />
                <span className="font-serif italic text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>{item.latinName}</span>
                {item.commonName && <span className="text-xs text-stone-500">— {item.commonName}</span>}
              </button>
            ))}
          </div>
          {query.trim() && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex w-full items-center gap-2 border-t border-stone-200 bg-[#fff8eb] px-4 py-3 text-left text-sm font-medium text-[#7a4d05] transition hover:bg-[#fbe6c3]"
            >
              <BookmarkPlus className="h-4 w-4" aria-hidden />
              <span>Créer l'espèce <em className="font-serif italic" style={{ fontFamily: 'Sole Serif Small, serif' }}>{query.trim()}</em></span>
            </button>
          )}
        </div>
      )}

      {showCreate && (
        <QuickCreateSpeciesModal
          initialLatinName={query.trim()}
          onCreated={handleCreated}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}

/**
 * VarietyPicker — lighter cousin of SpeciesPicker, scoped to a given species.
 * Pulls the variety list from the species detail endpoint and offers create-inline.
 */
export function VarietyPicker({ speciesId, speciesLatinName, value, onChange, placeholder = 'Variété (optionnel)' }) {
  const [varieties, setVarieties] = useState([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  // Load variety list when the species changes
  useEffect(() => {
    if (!speciesId) { setVarieties([]); return }
    let cancelled = false
    setLoading(true)
    apiRequest(`/api/v1/plants/species/${speciesId}`)
      .then((res) => { if (!cancelled) setVarieties(res.varieties || []) })
      .catch(() => { if (!cancelled) setVarieties([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [speciesId])

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return varieties
    return varieties.filter((v) => (v.latinName || '').toLowerCase().includes(q) || (v.commonName || '').toLowerCase().includes(q))
  }, [varieties, query])

  if (!speciesId) {
    return <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-2.5 text-sm text-stone-500">Sélectionne d'abord une espèce.</div>
  }

  if (value?.id) {
    return (
      <div className="flex items-center gap-3 rounded-lg border-2 border-emerald-400 bg-emerald-50 px-3 py-2.5 shadow-sm" style={{ animation: 'speciesPickerPop 220ms cubic-bezier(0.2, 0.7, 0.2, 1)' }}>
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
        </span>
        <span className="truncate font-serif italic text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>{value.latinName}</span>
        <button type="button" onClick={() => onChange(null)} className="ml-auto rounded-md p-1 text-emerald-700 transition hover:bg-emerald-100 hover:text-emerald-900" aria-label="Retirer la variété" title="Retirer la variété">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Sprout className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 pl-10 text-stone-900 placeholder-stone-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]"
        />
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl">
          <div className="max-h-64 overflow-y-auto">
            {loading && <div className="px-4 py-3 text-sm text-stone-500">Chargement…</div>}
            {!loading && filtered.length === 0 && (
              <div className="px-4 py-3 text-sm text-stone-500">{varieties.length === 0 ? 'Aucune variété enregistrée pour cette espèce.' : 'Aucun résultat.'}</div>
            )}
            {!loading && filtered.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => { onChange({ id: v.id, latinName: v.latinName }); setQuery(''); setOpen(false) }}
                className="flex w-full items-baseline gap-3 border-b border-stone-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-[#fbe6c3]/60"
              >
                <Sprout className="h-3.5 w-3.5 shrink-0 translate-y-[2px] text-[#EF9B0D]/70" aria-hidden />
                <span className="font-serif italic text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>{v.latinName}</span>
                {v.commonName && <span className="text-xs text-stone-500">— {v.commonName}</span>}
              </button>
            ))}
          </div>
          {query.trim() && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex w-full items-center gap-2 border-t border-stone-200 bg-[#fff8eb] px-4 py-3 text-left text-sm font-medium text-[#7a4d05] transition hover:bg-[#fbe6c3]"
            >
              <BookmarkPlus className="h-4 w-4" aria-hidden />
              <span>Créer la variété <em className="font-serif italic" style={{ fontFamily: 'Sole Serif Small, serif' }}>{query.trim()}</em></span>
            </button>
          )}
        </div>
      )}

      {showCreate && (
        <QuickCreateVarietyModal
          speciesId={speciesId}
          speciesLatinName={speciesLatinName}
          initialLatinName={query.trim()}
          onCreated={(v) => { onChange({ id: String(v.id), latinName: v.latinName || v.latin_name }); setShowCreate(false); setVarieties((prev) => [...prev, { id: String(v.id), latinName: v.latinName || v.latin_name }]) }}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Quick-create modals: minimal botanical entry — latin name + a
// genus (and a plant_type for species). Designed to feel like
// pinning an index card to a herbarium board.
// ─────────────────────────────────────────────────────────────

const PLANT_TYPES = [
  { value: 'tree', label: 'Arbre' },
  { value: 'shrub', label: 'Arbuste' },
  { value: 'small-shrub', label: 'Petit arbuste' },
  { value: 'climber', label: 'Grimpante' },
  { value: 'herbaceous', label: 'Herbacée' },
  { value: 'ground-cover', label: 'Couvre-sol' },
]

function ModalShell({ title, eyebrow, children, onCancel }) {
  // Render to body so the modal escapes any wrapping <form> in the parent UI.
  // Without this we get nested <form> elements (HTML5 disallows that), which
  // causes inner submits to bubble up to the outer batch form.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#fffaf0] shadow-2xl">
        {/* corner decorations evoke an herbarium card */}
        <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 rounded-full border border-[#EF9B0D]/40" aria-hidden />
        <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 rounded-full border border-[#EF9B0D]/40" aria-hidden />
        <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 rounded-full border border-[#EF9B0D]/40" aria-hidden />
        <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 rounded-full border border-[#EF9B0D]/40" aria-hidden />

        <div className="border-b border-[#EF9B0D]/20 px-7 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#EF9B0D]">{eyebrow}</p>
          <h2 className="mt-1 font-serif text-2xl text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>{title}</h2>
          <button type="button" onClick={onCancel} className="absolute right-5 top-5 rounded-full p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}

function QuickCreateGenusModal({ initialLatinName = '', onCreated, onCancel }) {
  const [latinName, setLatinName] = useState(initialLatinName)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!latinName.trim()) return
    setBusy(true); setErr(null)
    try {
      const res = await apiRequest('/api/v1/plants/genera', { method: 'POST', body: JSON.stringify({ latin_name: latinName.trim() }) })
      onCreated(res)
    } catch (e2) { setErr(e2.message || 'Erreur') } finally { setBusy(false) }
  }

  return (
    <ModalShell eyebrow="Plante » Genre" title="Nouveau genre" onCancel={onCancel}>
      <form onSubmit={submit} className="space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">Nom latin du genre</span>
          <input
            autoFocus
            value={latinName}
            onChange={(e) => setLatinName(e.target.value)}
            placeholder="Allium, Malus, Quercus…"
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 font-serif italic text-stone-900 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]"
            style={{ fontFamily: 'Sole Serif Small, serif' }}
          />
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-sm font-medium text-stone-600 transition hover:text-stone-900">Annuler</button>
          <button disabled={busy} type="submit" className="rounded-md bg-[#EF9B0D] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#d88a0b] disabled:opacity-60">
            {busy ? 'Création…' : 'Créer le genre'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

function QuickCreateSpeciesModal({ initialLatinName = '', onCreated, onCancel }) {
  const [latinName, setLatinName] = useState(initialLatinName)
  const [plantType, setPlantType] = useState('herbaceous')
  const [genus, setGenus] = useState(null) // { id, latinName }
  const [genera, setGenera] = useState([])
  const [genusQuery, setGenusQuery] = useState('')
  const [genusOpen, setGenusOpen] = useState(false)
  const [showGenusCreate, setShowGenusCreate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  // Pre-fill genus from latin name (first word)
  useEffect(() => {
    const first = initialLatinName.trim().split(/\s+/)[0]
    if (first) setGenusQuery(first)
  }, [initialLatinName])

  // Lazy-load genera list
  useEffect(() => {
    apiRequest('/api/v1/plants/genera').then((res) => setGenera(res.items || [])).catch(() => setGenera([]))
  }, [])

  const filteredGenera = useMemo(() => {
    const q = genusQuery.trim().toLowerCase()
    if (!q) return genera.slice(0, 30)
    return genera.filter((g) => (g.latinName || '').toLowerCase().includes(q)).slice(0, 30)
  }, [genera, genusQuery])

  const submit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!latinName.trim() || !genus?.id) { setErr('Nom latin et genre obligatoires.'); return }
    setBusy(true); setErr(null)
    try {
      const body = { latin_name: latinName.trim(), plant_type: plantType, genus_id: genus.id }
      const res = await apiRequest('/api/v1/plants/species', { method: 'POST', body: JSON.stringify(body) })
      onCreated(res)
    } catch (e2) { setErr(e2.message || 'Erreur') } finally { setBusy(false) }
  }

  return (
    <ModalShell eyebrow="Plante » Espèce" title="Nouvelle espèce" onCancel={onCancel}>
      <form onSubmit={submit} className="space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">Nom latin</span>
          <input
            autoFocus
            value={latinName}
            onChange={(e) => setLatinName(e.target.value)}
            placeholder="Allium ursinum"
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 font-serif italic text-stone-900 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]"
            style={{ fontFamily: 'Sole Serif Small, serif' }}
          />
        </label>

        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">Genre <span className="text-[#EF9B0D]">*</span></span>
          {genus ? (
            <div className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2.5">
              <span className="font-serif italic text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>{genus.latinName}</span>
              <button type="button" onClick={() => setGenus(null)} className="ml-auto rounded p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="relative">
              <input
                value={genusQuery}
                onChange={(e) => { setGenusQuery(e.target.value); setGenusOpen(true) }}
                onFocus={() => setGenusOpen(true)}
                placeholder="Allium, Malus…"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]"
              />
              {genusOpen && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg">
                  <div className="max-h-48 overflow-y-auto">
                    {filteredGenera.length === 0 && <div className="px-4 py-3 text-sm text-stone-500">Aucun genre.</div>}
                    {filteredGenera.map((g) => (
                      <button key={g.id} type="button" onClick={() => { setGenus({ id: g.id, latinName: g.latinName }); setGenusOpen(false) }} className="block w-full border-b border-stone-100 px-4 py-2.5 text-left transition last:border-b-0 hover:bg-[#fbe6c3]/60">
                        <span className="font-serif italic text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>{g.latinName}</span>
                      </button>
                    ))}
                  </div>
                  {genusQuery.trim() && (
                    <button type="button" onClick={() => { setGenusOpen(false); setShowGenusCreate(true) }} className="flex w-full items-center gap-2 border-t border-stone-200 bg-[#fff8eb] px-4 py-2.5 text-left text-sm font-medium text-[#7a4d05] transition hover:bg-[#fbe6c3]">
                      <BookmarkPlus className="h-4 w-4" /> Créer le genre <em className="font-serif italic" style={{ fontFamily: 'Sole Serif Small, serif' }}>{genusQuery.trim()}</em>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">Type de plante</span>
          <select
            value={plantType}
            onChange={(e) => setPlantType(e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]"
          >
            {PLANT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>

        <p className="text-xs text-stone-500">Tu peux compléter les autres caractéristiques plus tard depuis la fiche plante.</p>

        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-sm font-medium text-stone-600 transition hover:text-stone-900">Annuler</button>
          <button disabled={busy} type="submit" className="rounded-md bg-[#EF9B0D] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#d88a0b] disabled:opacity-60">
            {busy ? 'Création…' : 'Créer l\'espèce'}
          </button>
        </div>
      </form>

      {showGenusCreate && (
        <QuickCreateGenusModal
          initialLatinName={genusQuery.trim()}
          onCreated={(g) => {
            const item = { id: String(g.id), latinName: g.latinName || g.latin_name }
            setGenus(item)
            setGenera((prev) => [...prev, item])
            setShowGenusCreate(false)
          }}
          onCancel={() => setShowGenusCreate(false)}
        />
      )}
    </ModalShell>
  )
}

function QuickCreateVarietyModal({ speciesId, speciesLatinName, initialLatinName = '', onCreated, onCancel }) {
  const [latinName, setLatinName] = useState(initialLatinName)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!latinName.trim()) return
    setBusy(true); setErr(null)
    try {
      const res = await apiRequest('/api/v1/plants/varieties', { method: 'POST', body: JSON.stringify({ species_id: speciesId, latin_name: latinName.trim() }) })
      onCreated(res)
    } catch (e2) { setErr(e2.message || 'Erreur') } finally { setBusy(false) }
  }

  return (
    <ModalShell eyebrow="Plante » Variété" title="Nouvelle variété" onCancel={onCancel}>
      <form onSubmit={submit} className="space-y-5">
        {speciesLatinName && (
          <p className="text-sm text-stone-600">Espèce parente : <em className="font-serif italic text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>{speciesLatinName}</em></p>
        )}
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">Nom de la variété</span>
          <input
            autoFocus
            value={latinName}
            onChange={(e) => setLatinName(e.target.value)}
            placeholder="Purple tree, Hidcote, Reinette…"
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 font-serif italic text-stone-900 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]"
            style={{ fontFamily: 'Sole Serif Small, serif' }}
          />
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-sm font-medium text-stone-600 transition hover:text-stone-900">Annuler</button>
          <button disabled={busy} type="submit" className="rounded-md bg-[#EF9B0D] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#d88a0b] disabled:opacity-60">
            {busy ? 'Création…' : 'Créer la variété'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
