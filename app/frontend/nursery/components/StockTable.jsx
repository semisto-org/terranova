import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Edit, Trash2, AlertTriangle, ChevronDown, Check, MessageSquare, X } from 'lucide-react'
import { PlantDrawer } from '@/components/public/PlantDrawer'

/**
 * Stock spreadsheet — one row per batch, fully scannable left-to-right.
 *
 * Identity columns (sticky-left when scrolling horizontally on narrow screens):
 *   - Espèce  (italic serif, primary anchor)
 *   - Variété (regular sans, secondary)
 *
 * When two consecutive rows share the same species, the duplicated species
 * cell gets a "ditto" treatment (light grey ditto mark, full text still in
 * the DOM for screen readers and copy/paste). Same logic for the variety.
 * This avoids the readability problem of floating eyebrows above data rows
 * and matches the way printed plant catalogues handle long lists.
 *
 * All identity text now meets WCAG AA contrast on stone-50 background.
 */

const GROWTH_STAGES = [
  { value: 'seed',        label: 'Graine' },
  { value: 'seedling',    label: 'Semis' },
  { value: 'young',       label: 'Jeune' },
  { value: 'established', label: 'Établi' },
  { value: 'mature',      label: 'Mature' },
]

const STATUSES = [
  { value: 'available',     label: 'Disponible',    dot: 'bg-emerald-500',  text: 'text-emerald-700' },
  { value: 'in_production', label: 'En prod',       dot: 'bg-amber-500',    text: 'text-amber-700' },
  { value: 'sold_out',      label: 'Épuisé',        dot: 'bg-stone-400',    text: 'text-stone-500' },
  { value: 'archived',      label: 'Archivé',       dot: 'bg-stone-300',    text: 'text-stone-400' },
]

// Column templates — espèce / variété / [pépinière?] / pot / stock / prix / stade / statut / notes / actions
const COLS_WITH_NURSERY = '[grid-template-columns:minmax(160px,1.2fr)_minmax(120px,1fr)_minmax(120px,140px)_64px_136px_84px_104px_136px_minmax(140px,1fr)_48px]'
const COLS_NO_NURSERY   = '[grid-template-columns:minmax(160px,1.2fr)_minmax(120px,1fr)_64px_136px_84px_104px_136px_minmax(160px,1.2fr)_48px]'

export function StockTable({ batches, nurseries, containers, onPatch, onEdit, onDelete }) {
  const [drawer, setDrawer] = useState(null) // { kind, id }

  const distinctNurseryIds = useMemo(() => {
    const set = new Set()
    batches.forEach((b) => set.add(b.nurseryId))
    return set
  }, [batches])
  const showNursery = distinctNurseryIds.size > 1
  const cols = showNursery ? COLS_WITH_NURSERY : COLS_NO_NURSERY

  // Sort: species → variety so the eye can scan groupings naturally.
  const sorted = useMemo(() => {
    return [...batches].sort((a, b) => {
      const sn = (a.speciesName || '').localeCompare(b.speciesName || '')
      if (sn !== 0) return sn
      return (a.varietyName || '').localeCompare(b.varietyName || '')
    })
  }, [batches])

  // Batches relevant to the currently-open drawer — shown inside the drawer
  // as "available stock for this plant".
  const drawerBatches = useMemo(() => {
    if (!drawer) return []
    if (drawer.kind === 'variety') return batches.filter((b) => b.varietyId === drawer.id)
    return batches.filter((b) => b.speciesId === drawer.id && !b.varietyId)
  }, [drawer, batches])

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <style>{`
        @keyframes saveFlash {
          0%   { background-color: rgba(16, 185, 129, 0.18); }
          100% { background-color: transparent; }
        }
        .save-flash { animation: saveFlash 600ms ease-out; }
      `}</style>

      {/* Sticky column header */}
      <div className={`sticky top-0 z-20 hidden md:grid ${cols} border-b border-stone-200 bg-stone-50/85 backdrop-blur supports-[backdrop-filter]:bg-stone-50/75`}>
        <Th>Espèce</Th>
        <Th>Variété</Th>
        {showNursery && <Th>Pépinière</Th>}
        <Th>Pot</Th>
        <Th>Stock</Th>
        <Th align="right">Prix</Th>
        <Th>Stade</Th>
        <Th>Statut</Th>
        <Th>Notes</Th>
        <Th />
      </div>

      {sorted.length === 0 ? (
        <div className="px-6 py-16 text-center text-sm text-stone-400">Aucun lot ne correspond aux filtres.</div>
      ) : (
        sorted.map((batch, idx) => {
          // The first batch of a new species gets a slightly stronger top divider
          // so the eye can still parse groups, even though every row repeats names.
          const prev = sorted[idx - 1]
          const isFirstOfSpecies = !prev || prev.speciesName !== batch.speciesName
          return (
            <BatchRow
              key={batch.id}
              batch={batch}
              nurseries={nurseries}
              containers={containers}
              onPatch={onPatch}
              onEdit={onEdit}
              onDelete={onDelete}
              cols={cols}
              showNursery={showNursery}
              isFirstOfSpecies={isFirstOfSpecies}
              onOpenSpecies={(id) => setDrawer({ kind: 'species', id })}
              onOpenVariety={(id) => setDrawer({ kind: 'variety', id })}
            />
          )
        })
      )}

      {drawer && (
        <PlantDrawer
          kind={drawer.kind}
          id={drawer.id}
          batches={drawerBatches}
          allBatchesForSpecies={batches.filter((b) => b.speciesId === (drawer.kind === 'variety' ? batches.find((x) => x.varietyId === drawer.id)?.speciesId : drawer.id))}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  )
}

function Th({ children, align = 'left' }) {
  return (
    <div
      className={`px-3 py-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500 ${align === 'right' ? 'text-right' : ''}`}
    >
      {children}
    </div>
  )
}

function BatchRow({ batch, nurseries, containers, onPatch, onEdit, onDelete, cols, showNursery, isFirstOfSpecies, onOpenSpecies, onOpenVariety }) {
  const [notesOpen, setNotesOpen] = useState(false)
  const [flashKey, setFlashKey] = useState(0)
  const status = batch.status || 'available'
  const isLowStock = status === 'available' && batch.availableQuantity <= 10
  const nurseryName = nurseries.find((n) => n.id === batch.nurseryId)?.name || batch.nurseryId
  const container = containers.find((c) => c.id === batch.containerId)
  const containerLabel = container?.shortName || (batch.containerId ? batch.containerId : null)

  const patchAndFlash = async (id, partial) => {
    const r = await onPatch(id, partial)
    setFlashKey((k) => k + 1)
    return r
  }

  // The first row of a species group gets a thin top divider that's a touch
  // darker — gentler than a full banner but enough to read groups at a glance.
  const groupBoundaryClass = isFirstOfSpecies ? 'border-t border-stone-200' : 'border-t border-stone-100/60'

  // Very subtle row tint based on status. White for available so the dispo
  // rows stay the visual baseline; the others are slightly washed.
  const rowTintClass = (() => {
    switch (status) {
      case 'in_production': return 'bg-amber-50/40 hover:bg-amber-50/70'
      case 'sold_out':      return 'bg-stone-50/70 hover:bg-stone-100/60'
      case 'archived':      return 'bg-stone-50/50 text-stone-500 hover:bg-stone-100/50'
      default:              return 'hover:bg-stone-50/60'
    }
  })()

  return (
    <>
      <div
        key={flashKey}
        className={`group/row hidden md:grid ${cols} h-10 items-stretch ${groupBoundaryClass} ${rowTintClass} transition-colors ${flashKey > 0 ? 'save-flash' : ''}`}
      >
        {/* Espèce — clickable to open the plant DB drawer */}
        <Cell className="!pl-4">
          <SpeciesLabel name={batch.speciesName} onClick={batch.speciesId ? () => onOpenSpecies(batch.speciesId) : null} />
        </Cell>

        {/* Variété — clickable to open the variety drawer */}
        <Cell>
          <VarietyLabel name={batch.varietyName} onClick={batch.varietyId ? () => onOpenVariety(batch.varietyId) : null} />
        </Cell>

        {showNursery && (
          <Cell><span className="truncate text-[12px] text-stone-700">{nurseryName}</span></Cell>
        )}

        <Cell>
          {containerLabel ? (
            <span className="rounded bg-stone-100 px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wider text-stone-700">
              {containerLabel}
            </span>
          ) : (
            <span className="text-[11px] text-stone-300">—</span>
          )}
        </Cell>

        <StockCell batch={batch} onPatch={patchAndFlash} isLowStock={isLowStock} />
        <PriceCell batch={batch} onPatch={patchAndFlash} />
        <StageCell batch={batch} onPatch={patchAndFlash} />
        <StatusCell batch={batch} onPatch={patchAndFlash} />
        <NotesCell batch={batch} onClick={() => setNotesOpen((v) => !v)} active={notesOpen} />

        <Cell className="!px-1.5">
          <div className="flex h-full items-center justify-end gap-px opacity-0 transition-opacity group-hover/row:opacity-100">
            <button onClick={() => onEdit(batch)} title="Édition complète" className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"><Edit className="h-3 w-3" /></button>
            <button onClick={() => onDelete(batch.id)} title="Supprimer" className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
          </div>
        </Cell>
      </div>

      {notesOpen && <NotesEditor batch={batch} onPatch={patchAndFlash} onClose={() => setNotesOpen(false)} />}

      {/* Mobile fallback */}
      <div className={`md:hidden px-4 py-3 ${groupBoundaryClass}`}>
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-medium text-stone-900">{batch.speciesName}</span>
          {batch.varietyName && <span className="text-[13px] text-stone-700">· {batch.varietyName}</span>}
        </div>
        <div className="mt-1 text-[11px] text-stone-500">
          {nurseryName} {containerLabel && <>· <span className="font-mono">{containerLabel}</span></>} · <span className="font-mono tabular-nums">{batch.availableQuantity}/{batch.quantity}</span> · <span className="font-mono tabular-nums">{batch.priceEuros.toFixed(2)} €</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <StatusInline status={status} />
          <button onClick={() => onEdit(batch)} className="ml-auto rounded px-2 py-0.5 text-[11px] text-stone-700 hover:bg-stone-100">Éditer</button>
        </div>
      </div>
    </>
  )
}

function Cell({ children, className = '' }) {
  return (
    <div className={`flex min-w-0 items-center px-3 ${className}`}>
      {children}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// Identity labels — accessible, readable, with ditto pattern.
// ──────────────────────────────────────────────────────────────────

function SpeciesLabel({ name, onClick }) {
  if (!name) return <span className="text-[11px] text-stone-300">—</span>
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`Voir la fiche : ${name}`}
        className="min-w-0 truncate rounded px-1 -mx-1 text-left text-[13px] font-medium text-stone-900 transition hover:bg-stone-100 hover:text-[#7a4d05] focus:bg-stone-100 focus:outline-none"
      >
        {name}
      </button>
    )
  }
  return (
    <span className="truncate text-[13px] font-medium text-stone-900" title={name}>
      {name}
    </span>
  )
}

function VarietyLabel({ name, onClick }) {
  if (!name) return <span className="text-[11px] text-stone-300">—</span>
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`Voir la fiche : ${name}`}
        className="min-w-0 truncate rounded px-1 -mx-1 text-left text-[13px] text-stone-700 transition hover:bg-stone-100 hover:text-[#7a4d05] focus:bg-stone-100 focus:outline-none"
      >
        {name}
      </button>
    )
  }
  return (
    <span className="truncate text-[13px] text-stone-700" title={name}>
      {name}
    </span>
  )
}

// ──────────────────────────────────────────────────────────────────
// Stock — dispo / total + a thin in-cell progress bar at the bottom.
// ──────────────────────────────────────────────────────────────────

function StockCell({ batch, onPatch, isLowStock }) {
  const [editing, setEditing] = useState(null) // 'avail' | 'total' | null
  return (
    <div className="flex min-w-0 items-center px-3">
      <div className="flex w-full items-center gap-1 font-mono text-[12px] tabular-nums text-stone-700">
        <InlineNumber
          editing={editing === 'avail'}
          onStart={() => setEditing('avail')}
          onCancel={() => setEditing(null)}
          value={batch.availableQuantity}
          max={batch.quantity}
          onCommit={async (v) => {
            const clamped = Math.max(0, Math.min(v, batch.quantity))
            await onPatch(batch.id, { available_quantity: clamped, reserved_quantity: batch.quantity - clamped })
            setEditing(null)
          }}
          className="font-semibold text-stone-900"
        />
        <span className="text-stone-300">/</span>
        <InlineNumber
          editing={editing === 'total'}
          onStart={() => setEditing('total')}
          onCancel={() => setEditing(null)}
          value={batch.quantity}
          onCommit={async (v) => {
            const total = Math.max(0, v)
            const avail = Math.min(batch.availableQuantity, total)
            await onPatch(batch.id, { quantity: total, available_quantity: avail, reserved_quantity: total - avail })
            setEditing(null)
          }}
          className="text-stone-500"
        />
        {isLowStock && (
          <span
            title={`Stock bas : ${batch.availableQuantity} disponible${batch.availableQuantity > 1 ? 's' : ''}, à réapprovisionner`}
            aria-label="Stock bas"
            className="ml-auto inline-flex shrink-0 items-center"
          >
            <AlertTriangle className="h-3 w-3 text-amber-500" aria-hidden />
          </span>
        )}
      </div>
    </div>
  )
}

function PriceCell({ batch, onPatch }) {
  const [editing, setEditing] = useState(false)
  return (
    <div className="flex min-w-0 items-center justify-end px-3">
      <InlineNumber
        editing={editing}
        onStart={() => setEditing(true)}
        onCancel={() => setEditing(false)}
        value={batch.priceEuros}
        step="0.01"
        onCommit={async (v) => {
          await onPatch(batch.id, { price_euros: v })
          setEditing(false)
        }}
        format={(v) => `${Number(v).toFixed(2)} €`}
        className="font-mono text-[12px] tabular-nums text-stone-900"
      />
    </div>
  )
}

function StageCell({ batch, onPatch }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const opt = GROWTH_STAGES.find((s) => s.value === batch.growthStage)
  return (
    <div className="flex min-w-0 items-center px-2">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className="group/btn inline-flex w-full items-center justify-between gap-1 rounded-md px-1.5 py-0.5 text-[12px] text-stone-700 transition hover:bg-stone-100"
      >
        <span>{opt?.label || '—'}</span>
        <ChevronDown className="h-3 w-3 text-stone-400 transition group-hover/btn:text-stone-600" />
      </button>
      {open && (
        <PopoverMenu anchorRef={triggerRef} onClose={() => setOpen(false)}>
          {GROWTH_STAGES.map((o) => {
            const active = o.value === batch.growthStage
            return (
              <button
                key={o.value}
                onClick={async () => { setOpen(false); if (!active) await onPatch(batch.id, { growth_stage: o.value }) }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-[12px] transition ${active ? 'bg-stone-50 text-stone-500' : 'text-stone-800 hover:bg-stone-50'}`}
              >
                {o.label}
                {active && <Check className="ml-auto h-3 w-3 text-stone-400" />}
              </button>
            )
          })}
        </PopoverMenu>
      )}
    </div>
  )
}

function StatusCell({ batch, onPatch }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const status = batch.status || 'available'
  return (
    <div className="flex min-w-0 flex-col justify-center px-2">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className="group/btn inline-flex w-full items-center justify-between gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-stone-100"
      >
        <StatusInline status={status} />
        <ChevronDown className="h-3 w-3 text-stone-400 transition group-hover/btn:text-stone-600" />
      </button>
      {status === 'in_production' && (batch.availabilityLabel || batch.expectedAvailabilityOn) && (
        <span className="ml-1.5 truncate text-[10px] italic text-amber-700">→ {batch.availabilityLabel || formatDate(batch.expectedAvailabilityOn)}</span>
      )}
      {open && (
        <PopoverMenu anchorRef={triggerRef} onClose={() => setOpen(false)}>
          {STATUSES.map((o) => {
            const active = o.value === status
            return (
              <button
                key={o.value}
                onClick={async () => {
                  setOpen(false)
                  if (active) return
                  if (o.value === 'in_production' && !batch.expectedAvailabilityOn && !batch.availabilityLabel) {
                    const label = window.prompt('Disponibilité prévisionnelle (ex: "septembre 2026")') || ''
                    if (!label.trim()) return
                    await onPatch(batch.id, { status: 'in_production', availability_label: label.trim() })
                  } else {
                    await onPatch(batch.id, { status: o.value })
                  }
                }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-[12px] transition ${active ? 'bg-stone-50 text-stone-500' : 'text-stone-800 hover:bg-stone-50'}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${o.dot}`} />
                {o.label}
                {active && <Check className="ml-auto h-3 w-3 text-stone-400" />}
              </button>
            )
          })}
        </PopoverMenu>
      )}
    </div>
  )
}

function StatusInline({ status }) {
  const meta = STATUSES.find((s) => s.value === status) || STATUSES[0]
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] whitespace-nowrap">
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      <span className={meta.text}>{meta.label}</span>
    </span>
  )
}

function NotesCell({ batch, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex min-w-0 items-center gap-1.5 px-3 text-left text-[12px] transition ${active ? 'bg-amber-50/40' : 'hover:bg-stone-50'}`}
    >
      {batch.notes ? (
        <span className="truncate italic text-stone-700">{batch.notes}</span>
      ) : (
        <span className="inline-flex items-center gap-1 text-stone-400">
          <MessageSquare className="h-3 w-3" />
          <span>Note</span>
        </span>
      )}
    </button>
  )
}

function NotesEditor({ batch, onPatch, onClose }) {
  const [value, setValue] = useState(batch.notes || '')
  const [saving, setSaving] = useState(false)
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])

  const commit = async () => {
    if (value === (batch.notes || '')) { onClose(); return }
    setSaving(true)
    await onPatch(batch.id, { notes: value })
    setSaving(false)
    onClose()
  }

  return (
    <div className="border-y border-stone-100 bg-amber-50/20 px-4 py-2">
      <div className="flex items-start gap-3">
        <span className="mt-2 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">Note</span>
        <textarea
          ref={ref}
          rows={2}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setValue(batch.notes || ''); onClose() }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); commit() }
          }}
          placeholder="Greffés sur M9 · attaque pucerons en juin · …"
          className="flex-1 resize-none rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-[12px] text-stone-800 focus:border-[#EF9B0D] focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]/15"
        />
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={onClose} title="Annuler (Esc)" className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-700"><X className="h-3.5 w-3.5" /></button>
          <button onClick={commit} disabled={saving} className="rounded-md bg-[#EF9B0D] px-2.5 py-1 text-[11px] font-medium text-white disabled:opacity-50">
            {saving ? '…' : 'Enregistrer'}
          </button>
        </div>
      </div>
      <div className="mt-1 pl-[60px] text-[10px] text-stone-500">
        <span className="font-mono">⌘ ↵</span> pour enregistrer · <span className="font-mono">esc</span> pour fermer
      </div>
    </div>
  )
}

function InlineNumber({ value, onCommit, onCancel, onStart, editing, max, step, format, className = '' }) {
  const [draft, setDraft] = useState(String(value ?? 0))
  const ref = useRef(null)

  useEffect(() => {
    if (editing) {
      setDraft(String(value ?? 0))
      requestAnimationFrame(() => { ref.current?.focus(); ref.current?.select() })
    }
  }, [editing, value])

  if (!editing) {
    return (
      <button
        type="button"
        onClick={onStart}
        className={`min-w-[2ch] rounded px-1 text-left transition hover:bg-stone-100 focus:bg-amber-50 focus:outline-none ${className}`}
      >
        {format ? format(value) : value}
      </button>
    )
  }

  const commit = () => {
    const num = Number(draft)
    if (Number.isFinite(num)) onCommit(num)
    else onCancel()
  }

  return (
    <input
      ref={ref}
      type="number"
      step={step}
      min={0}
      max={max}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit() }
        else if (e.key === 'Escape') { e.preventDefault(); onCancel() }
      }}
      className={`w-14 rounded bg-amber-50 px-1 py-px tabular-nums shadow-[inset_0_0_0_1px_rgb(239,155,13)] focus:outline-none ${className}`}
    />
  )
}

/**
 * PopoverMenu — portal-based, anchored to a trigger element.
 *
 * Renders into document.body to escape any `overflow:hidden` ancestor (e.g. the
 * rounded-xl wrapper around the stock table). Position is computed from the
 * anchor's bounding rect; the menu flips above the anchor when it would
 * otherwise overflow the viewport bottom, and aligns to the right edge of the
 * anchor when it would overflow the right side.
 */
function PopoverMenu({ anchorRef, onClose, children, minWidth = 160 }) {
  const menuRef = useRef(null)
  const [pos, setPos] = useState(null) // { top, left, width, openUpward }

  useLayoutEffect(() => {
    const place = () => {
      const a = anchorRef.current
      const m = menuRef.current
      if (!a) return
      const rect = a.getBoundingClientRect()
      const menuHeight = m?.offsetHeight ?? 200
      const menuWidth = Math.max(rect.width, minWidth)
      const vh = window.innerHeight
      const vw = window.innerWidth
      const gap = 4

      const spaceBelow = vh - rect.bottom
      const openUpward = spaceBelow < menuHeight + 16 && rect.top > menuHeight + 16

      let left = rect.left
      if (left + menuWidth > vw - 8) left = Math.max(8, vw - 8 - menuWidth)

      const top = openUpward ? rect.top - menuHeight - gap : rect.bottom + gap
      setPos({ top, left, width: menuWidth, openUpward })
    }

    place()
    // Re-place on scroll / resize so the menu tracks its trigger.
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [anchorRef, minWidth])

  // Close on outside click / Escape
  useEffect(() => {
    const onMouseDown = (e) => {
      if (menuRef.current?.contains(e.target)) return
      if (anchorRef.current?.contains(e.target)) return
      onClose()
    }
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [anchorRef, onClose])

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        width: pos?.width,
        visibility: pos ? 'visible' : 'hidden',
      }}
      className="z-[60] overflow-hidden rounded-lg border border-stone-200 bg-white py-0.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)]"
    >
      {children}
    </div>,
    document.body
  )
}

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('fr-BE', { month: 'short', year: 'numeric' }) } catch { return iso }
}
