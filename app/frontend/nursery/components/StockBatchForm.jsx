import { useState, useEffect, useMemo } from 'react'
import { X, FileText, Save, RotateCw, AlertTriangle, CalendarDays, Plus } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { SpeciesPicker, VarietyPicker } from './SpeciesPicker'
import { ContainerForm } from './ContainerForm'

const GROWTH_STAGES = [
  { value: 'seed', label: 'Graine' },
  { value: 'seedling', label: 'Semis' },
  { value: 'young', label: 'Jeune' },
  { value: 'established', label: 'Établi' },
  { value: 'mature', label: 'Mature' },
]

const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponible', tone: 'available', help: 'Le lot est en stock et peut être commandé.' },
  { value: 'in_production', label: 'En production', tone: 'production', help: 'Le lot grandit, indique quand il sera disponible.' },
  { value: 'sold_out', label: 'Épuisé', tone: 'sold-out', help: 'Stock écoulé, masqué du catalogue par défaut.' },
  { value: 'archived', label: 'Archivé', tone: 'archived', help: 'Conservé pour historique uniquement.' },
]

const TONE_CLASSES = {
  available:  { active: 'border-emerald-500 bg-emerald-50 text-emerald-900', dot: 'bg-emerald-500' },
  production: { active: 'border-amber-500 bg-amber-50 text-amber-900',       dot: 'bg-amber-500' },
  'sold-out': { active: 'border-stone-500 bg-stone-100 text-stone-800',      dot: 'bg-stone-500' },
  archived:   { active: 'border-stone-400 bg-stone-50 text-stone-600',       dot: 'bg-stone-400' },
}

function emptyForm({ batch, defaults } = {}) {
  return {
    nurseryId: batch?.nurseryId ?? defaults?.nurseryId ?? '',
    speciesId: batch?.speciesId ?? defaults?.speciesId ?? '',
    speciesName: batch?.speciesName ?? defaults?.speciesName ?? '',
    varietyId: batch?.varietyId ?? '',
    varietyName: batch?.varietyName ?? '',
    containerId: batch?.containerId ?? defaults?.containerId ?? '',
    quantity: batch?.quantity ?? 0,
    availableQuantity: batch?.availableQuantity ?? 0,
    reservedQuantity: batch?.reservedQuantity ?? 0,
    sowingDate: batch?.sowingDate ?? '',
    origin: batch?.origin ?? '',
    growthStage: batch?.growthStage ?? 'young',
    status: batch?.status ?? 'available',
    expectedAvailabilityOn: batch?.expectedAvailabilityOn ?? '',
    availabilityLabel: batch?.availabilityLabel ?? '',
    priceEuros: batch?.priceEuros ?? 0,
    acceptsSemos: batch?.acceptsSemos ?? false,
    priceSemos: batch?.priceSemos ?? 0,
    notes: batch?.notes ?? '',
  }
}

export function StockBatchForm({ batch, nurseries, containers, onSave, onCancel, onCreateContainer }) {
  const [formData, setFormData] = useState(() => emptyForm({ batch }))
  const [seriesPrefill, setSeriesPrefill] = useState(null) // when user clicks "save + new", we keep some fields
  const [showContainerForm, setShowContainerForm] = useState(false)
  const [containerBusy, setContainerBusy] = useState(false)

  // ── Variety note (lives on Plant::Variety, not on the batch)
  const [varietyNote, setVarietyNote] = useState('')
  const [varietyNoteOriginal, setVarietyNoteOriginal] = useState('')
  const [varietyNoteEditing, setVarietyNoteEditing] = useState(false)
  const [varietyNoteBusy, setVarietyNoteBusy] = useState(false)

  useEffect(() => {
    setFormData(emptyForm({ batch, defaults: seriesPrefill }))
  }, [batch, seriesPrefill])

  // Load the variety's persistent note whenever the selected variety changes.
  useEffect(() => {
    let cancelled = false
    if (!formData.varietyId) {
      setVarietyNote(''); setVarietyNoteOriginal(''); setVarietyNoteEditing(false)
      return
    }
    apiRequest(`/api/v1/plants/varieties/${formData.varietyId}`)
      .then((res) => {
        if (cancelled) return
        const note = res?.variety?.additionalNotes || res?.variety?.additional_notes || ''
        setVarietyNote(note)
        setVarietyNoteOriginal(note)
      })
      .catch(() => { if (!cancelled) { setVarietyNote(''); setVarietyNoteOriginal('') } })
    return () => { cancelled = true }
  }, [formData.varietyId])

  const inputClass = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 placeholder-stone-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]"

  const statusInvalid = useMemo(() => {
    if (formData.status !== 'in_production') return false
    return !formData.expectedAvailabilityOn && !formData.availabilityLabel.trim()
  }, [formData.status, formData.expectedAvailabilityOn, formData.availabilityLabel])

  const speciesValue = formData.speciesId ? { id: formData.speciesId, latinName: formData.speciesName } : null
  const varietyValue = formData.varietyId ? { id: formData.varietyId, latinName: formData.varietyName } : null

  const handleSpeciesChange = (next) => {
    setFormData((prev) => ({
      ...prev,
      speciesId: next?.id || '',
      speciesName: next?.latinName || '',
      // Clear variety when species changes
      varietyId: '',
      varietyName: '',
    }))
  }

  const handleVarietyChange = (next) => {
    setFormData((prev) => ({
      ...prev,
      varietyId: next?.id || '',
      varietyName: next?.latinName || '',
    }))
  }

  const saveVarietyNote = async () => {
    if (!formData.varietyId) return
    setVarietyNoteBusy(true)
    try {
      await apiRequest(`/api/v1/plants/varieties/${formData.varietyId}`, {
        method: 'PATCH',
        body: JSON.stringify({ additional_notes: varietyNote }),
      })
      setVarietyNoteOriginal(varietyNote)
      setVarietyNoteEditing(false)
    } catch (e) {
      alert(`Impossible d'enregistrer la note: ${e.message}`)
    } finally { setVarietyNoteBusy(false) }
  }

  const submit = (e, { andContinue = false } = {}) => {
    e.preventDefault()
    if (statusInvalid) return
    if (!formData.speciesId) { alert('Sélectionne une espèce.'); return }
    onSave({
      ...formData,
      growthStage: formData.growthStage || undefined,
      varietyId: formData.varietyId || undefined,
      varietyName: formData.varietyName || undefined,
      sowingDate: formData.sowingDate || undefined,
      origin: formData.origin || undefined,
      priceSemos: formData.acceptsSemos ? formData.priceSemos : undefined,
      notes: formData.notes || undefined,
      status: formData.status,
      expectedAvailabilityOn: formData.expectedAvailabilityOn || undefined,
      availabilityLabel: formData.availabilityLabel || undefined,
    })
    if (andContinue) {
      // Keep nursery + container + species so the next batch is fast to enter
      setSeriesPrefill({
        nurseryId: formData.nurseryId,
        containerId: formData.containerId,
        speciesId: formData.speciesId,
        speciesName: formData.speciesName,
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white/90 px-7 py-5 backdrop-blur">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#EF9B0D]">Pépinière · Lot</p>
            <h2 className="mt-0.5 font-serif text-2xl text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>
              {batch ? 'Modifier le lot' : 'Nouveau lot'}
            </h2>
          </div>
          <button onClick={onCancel} className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => submit(e)} className="space-y-7 px-7 py-6">

          {/* ── Botanique ───────────────────────────────────── */}
          <section>
            <SectionTitle>Botanique</SectionTitle>
            <div className="space-y-4">
              <Field label="Espèce" required>
                <SpeciesPicker value={speciesValue} onChange={handleSpeciesChange} autoFocus={!batch} />
              </Field>
              <Field label="Variété">
                <VarietyPicker
                  speciesId={formData.speciesId}
                  speciesLatinName={formData.speciesName}
                  value={varietyValue}
                  onChange={handleVarietyChange}
                />
              </Field>

              {formData.varietyId && (
                <div className="rounded-lg border border-dashed border-[#EF9B0D]/40 bg-[#fffaf0] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-[#EF9B0D]" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-700">Note sur la variété</span>
                    <span className="text-xs text-stone-500">— sauvegardée sur la fiche, suit la variété</span>
                  </div>
                  {varietyNoteEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={varietyNote}
                        onChange={(e) => setVarietyNote(e.target.value)}
                        rows={2}
                        placeholder="Ex: floraison plus généreuse que le Molly, fruit acidulé…"
                        className={`${inputClass} resize-none bg-white`}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => { setVarietyNote(varietyNoteOriginal); setVarietyNoteEditing(false) }} className="rounded-md px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:text-stone-900">Annuler</button>
                        <button type="button" onClick={saveVarietyNote} disabled={varietyNoteBusy} className="rounded-md bg-[#EF9B0D] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#d88a0b] disabled:opacity-60">
                          {varietyNoteBusy ? 'Enregistrement…' : 'Enregistrer la note'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <p className="flex-1 text-sm text-stone-700">{varietyNote ? <span className="italic">"{varietyNote}"</span> : <span className="text-stone-400">Aucune note pour le moment.</span>}</p>
                      <button type="button" onClick={() => setVarietyNoteEditing(true)} className="shrink-0 rounded-md border border-[#EF9B0D]/40 bg-white px-3 py-1.5 text-xs font-medium text-[#7a4d05] transition hover:bg-[#fbe6c3]/60">
                        {varietyNote ? 'Modifier' : 'Ajouter une note'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── Localisation ───────────────────────────────── */}
          <section>
            <SectionTitle>Localisation</SectionTitle>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Pépinière" required>
                <select required value={formData.nurseryId} onChange={(e) => setFormData({ ...formData, nurseryId: e.target.value })} className={inputClass}>
                  <option value="">Sélectionner</option>
                  {nurseries.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </Field>
              <Field label="Contenant" hint="optionnel">
                <div className="flex gap-2">
                  <select value={formData.containerId} onChange={(e) => setFormData({ ...formData, containerId: e.target.value })} className={`${inputClass} flex-1`}>
                    <option value="">Non précisé</option>
                    {containers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.shortName})</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowContainerForm(true)}
                    title="Créer un nouveau contenant"
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#EF9B0D]/40 bg-[#fff8eb] px-3 text-sm font-medium text-[#7a4d05] transition hover:bg-[#fbe6c3]"
                  >
                    <Plus className="h-4 w-4" /> Nouveau
                  </button>
                </div>
              </Field>
            </div>
          </section>

          {/* ── Statut ─────────────────────────────────────── */}
          <section>
            <SectionTitle>Statut & disponibilité</SectionTitle>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {STATUS_OPTIONS.map((opt) => {
                const active = formData.status === opt.value
                const tone = TONE_CLASSES[opt.tone]
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: opt.value })}
                    className={`flex items-start gap-2 rounded-lg border p-3 text-left transition ${active ? tone.active : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'}`}
                  >
                    <span className={`mt-1 h-2 w-2 rounded-full ${tone.dot}`} aria-hidden />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{opt.label}</div>
                      <div className="mt-0.5 text-[11px] leading-tight opacity-80">{opt.help}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {formData.status === 'in_production' && (
              <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg bg-amber-50/50 p-4 md:grid-cols-2">
                <Field label="Date prévisionnelle" hint="Si tu connais le mois exact">
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input type="date" value={formData.expectedAvailabilityOn} onChange={(e) => setFormData({ ...formData, expectedAvailabilityOn: e.target.value })} className={`${inputClass} pl-10`} />
                  </div>
                </Field>
                <Field label="Libellé approximatif" hint="Ou alors un texte libre">
                  <input type="text" value={formData.availabilityLabel} onChange={(e) => setFormData({ ...formData, availabilityLabel: e.target.value })} placeholder="septembre 2026, printemps…" className={inputClass} />
                </Field>
                {statusInvalid && (
                  <div className="md:col-span-2 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-100/60 px-3 py-2 text-xs text-amber-900">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Renseigne au moins une date OU un libellé pour les lots en production.
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── Quantités ──────────────────────────────────── */}
          <section>
            <SectionTitle>Quantités</SectionTitle>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Total" required>
                <input type="number" required min="0" value={formData.quantity} onChange={(e) => { const qty = parseInt(e.target.value) || 0; setFormData({ ...formData, quantity: qty, availableQuantity: Math.min(formData.availableQuantity, qty) }) }} className={inputClass} />
              </Field>
              <Field label="Disponible" required>
                <input type="number" required min="0" max={formData.quantity} value={formData.availableQuantity} onChange={(e) => { const qty = parseInt(e.target.value) || 0; const clamped = Math.min(qty, formData.quantity); setFormData({ ...formData, availableQuantity: clamped, reservedQuantity: formData.quantity - clamped }) }} className={inputClass} />
              </Field>
              <Field label="Réservé">
                <input type="number" min="0" value={formData.reservedQuantity} readOnly className={`${inputClass} bg-stone-50 text-stone-500`} />
              </Field>
            </div>
          </section>

          {/* ── Détails culture ─────────────────────────────── */}
          <section>
            <SectionTitle>Culture & origine</SectionTitle>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Date de semis">
                <input type="date" value={formData.sowingDate} onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Stade de développement">
                <select value={formData.growthStage} onChange={(e) => setFormData({ ...formData, growthStage: e.target.value })} className={inputClass}>
                  {GROWTH_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Origine">
                <input type="text" value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} placeholder="Semis maison, bouturage, marcottage…" className={inputClass} />
              </Field>
            </div>
          </section>

          {/* ── Prix ───────────────────────────────────────── */}
          <section>
            <SectionTitle>Prix</SectionTitle>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Prix (€)" required>
                <input type="number" required min="0" step="0.01" value={formData.priceEuros} onChange={(e) => setFormData({ ...formData, priceEuros: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </Field>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.acceptsSemos} onChange={(e) => setFormData({ ...formData, acceptsSemos: e.target.checked })} className="h-4 w-4 rounded border-stone-300 text-[#EF9B0D] focus:ring-[#EF9B0D]" />
                  <span className="text-sm font-medium text-stone-700">Accepte les Semos</span>
                </label>
                {formData.acceptsSemos && (
                  <input type="number" min="0" value={formData.priceSemos} onChange={(e) => setFormData({ ...formData, priceSemos: parseInt(e.target.value) || 0 })} placeholder="Prix en Semos" className={`${inputClass} mt-2`} />
                )}
              </div>
            </div>
          </section>

          {/* ── Notes lot ──────────────────────────────────── */}
          <section>
            <SectionTitle>Notes du lot</SectionTitle>
            <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Notes spécifiques à ce lot (greffés sur M9, attaque pucerons en juin, etc.)" className={`${inputClass} resize-none`} />
          </section>

          {/* ── Footer actions ─────────────────────────────── */}
          <div className="sticky bottom-0 -mx-7 -mb-6 flex flex-col-reverse items-stretch gap-3 border-t border-stone-200 bg-white/95 px-7 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={onCancel} className="rounded-md px-4 py-2.5 text-sm font-medium text-stone-600 transition hover:text-stone-900">
              Annuler
            </button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {!batch && (
                <button
                  type="button"
                  onClick={(e) => submit(e, { andContinue: true })}
                  disabled={statusInvalid}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-[#EF9B0D] bg-white px-4 py-2.5 text-sm font-semibold text-[#7a4d05] transition hover:bg-[#fbe6c3]/60 disabled:opacity-50"
                  title="Garde la pépinière, le contenant et l'espèce pour le lot suivant"
                >
                  <RotateCw className="h-4 w-4" />
                  Enregistrer + nouveau lot même espèce
                </button>
              )}
              <button
                type="submit"
                disabled={statusInvalid}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#EF9B0D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d88a0b] disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {batch ? 'Enregistrer' : 'Créer le lot'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showContainerForm && (
        <ContainerForm
          busy={containerBusy}
          onCancel={() => setShowContainerForm(false)}
          onSave={async (payload) => {
            if (!onCreateContainer) { setShowContainerForm(false); return }
            setContainerBusy(true)
            try {
              const created = await onCreateContainer(payload)
              if (created?.id) {
                setFormData((prev) => ({ ...prev, containerId: String(created.id) }))
              }
              setShowContainerForm(false)
            } finally { setContainerBusy(false) }
          }}
        />
      )}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
      <span className="h-px flex-1 bg-stone-200" aria-hidden />
      <span>{children}</span>
      <span className="h-px flex-1 bg-stone-200" aria-hidden />
    </h3>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-700">
        {label} {required && <span className="text-[#EF9B0D]">*</span>}
        {hint && <span className="ml-2 text-xs font-normal text-stone-500">— {hint}</span>}
      </span>
      {children}
    </label>
  )
}
