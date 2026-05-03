import { useEffect, useMemo, useRef, useState } from 'react'
import { Edit, Trash2, AlertTriangle, ChevronDown, Check, MessageSquare, X } from 'lucide-react'

/**
 * Slick spreadsheet for stock batches — Linear-meets-Airtable density.
 *
 *  Visual rules:
 *   - One signature font: italic serif for latin names. System sans for everything else.
 *     Numbers in tabular-nums. No mixed fonts within a cell.
 *   - Status reduced to a colored dot + label (no chip), except "in_production"
 *     which keeps a soft amber pill because it carries a deferred-action
 *     meaning the eye must catch.
 *   - Group headers are thin lines, not banners.
 *   - Hover/focus uses inset borders (1px), no jumpy rings.
 *   - Save flash: 220ms emerald wash on the just-mutated cell.
 *
 *  Editing UX:
 *   - Single click on numeric cell = focus (auto-select). Enter / blur = commit.
 *     Esc = cancel. Tab moves to the next editable column.
 *   - Status / Stage = popover.
 *   - Notes = expand inline.
 *   - Species / variety / container / nursery = read-only (these define batch identity).
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

// Column template — narrow index gutter on the left, then nursery, pot, stock,
// price, stage, status, notes, actions.
const COLS = '[grid-template-columns:36px_minmax(140px,1fr)_72px_140px_92px_120px_140px_minmax(180px,1.2fr)_56px]'

export function StockTable({ batches, nurseries, containers, onPatch, onEdit, onDelete }) {
  const groups = useMemo(() => {
    const map = new Map()
    for (const b of batches) {
      const key = `${b.speciesId}::${b.varietyId || ''}`
      if (!map.has(key)) {
        map.set(key, { key, speciesId: b.speciesId, speciesName: b.speciesName, varietyId: b.varietyId, varietyName: b.varietyName, batches: [] })
      }
      map.get(key).batches.push(b)
    }
    return Array.from(map.values()).sort((a, b) => {
      const sn = (a.speciesName || '').localeCompare(b.speciesName || '')
      return sn !== 0 ? sn : (a.varietyName || '').localeCompare(b.varietyName || '')
    })
  }, [batches])

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
      <div className={`sticky top-0 z-20 hidden md:grid ${COLS} border-b border-stone-200 bg-stone-50/80 backdrop-blur supports-[backdrop-filter]:bg-stone-50/70`}>
        <Th />
        <Th>Pépinière</Th>
        <Th>Pot</Th>
        <Th>Stock</Th>
        <Th align="right">Prix</Th>
        <Th>Stade</Th>
        <Th>Statut</Th>
        <Th>Notes</Th>
        <Th />
      </div>

      {groups.length === 0 ? (
        <div className="px-6 py-16 text-center text-sm text-stone-400">Aucun lot ne correspond aux filtres.</div>
      ) : (
        groups.map((g) => (
          <GroupBlock key={g.key} group={g} nurseries={nurseries} containers={containers} onPatch={onPatch} onEdit={onEdit} onDelete={onDelete} />
        ))
      )}
    </div>
  )
}

function Th({ children, align = 'left' }) {
  return (
    <div
      className={`px-3 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400 ${align === 'right' ? 'text-right' : ''}`}
      style={{ fontFeatureSettings: '"cv11"' }}
    >
      {children}
    </div>
  )
}

function GroupBlock({ group, nurseries, containers, onPatch, onEdit, onDelete }) {
  return (
    <div className="border-t border-stone-100/80 first:border-t-0">
      {group.batches.map((batch, idx) => (
        <BatchRow
          key={batch.id}
          batch={batch}
          index={idx + 1}
          nurseries={nurseries}
          containers={containers}
          onPatch={onPatch}
          onEdit={onEdit}
          onDelete={onDelete}
          showGroupHeader={idx === 0}
          group={group}
        />
      ))}
    </div>
  )
}

function BatchRow({ batch, index, nurseries, containers, onPatch, onEdit, onDelete, showGroupHeader, group }) {
  const [notesOpen, setNotesOpen] = useState(false)
  const [flashKey, setFlashKey] = useState(0)
  const status = batch.status || 'available'
  const isLowStock = status === 'available' && batch.availableQuantity <= 10
  const nurseryName = nurseries.find((n) => n.id === batch.nurseryId)?.name || batch.nurseryId
  const container = containers.find((c) => c.id === batch.containerId)
  const containerLabel = container?.shortName || batch.containerId

  const patchAndFlash = async (id, partial) => {
    const r = await onPatch(id, partial)
    setFlashKey((k) => k + 1)
    return r
  }

  return (
    <>
      {/* Group eyebrow — appears above the first row of each species/variety group.
          The serif italic name is the anchor; subsequent rows of the same group
          stay anonymous so the eye doesn't read the same name twice in a row. */}
      {showGroupHeader && (
        <div className="hidden md:flex items-baseline gap-2 px-3 pt-5 pb-1.5">
          <span className="font-serif text-[15px] italic leading-none text-[#1d2e23]" style={{ fontFamily: 'Sole Serif Small, serif' }}>
            {group.speciesName}
          </span>
          {group.varietyName && (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
              · {group.varietyName}
            </span>
          )}
        </div>
      )}

      <div
        key={flashKey}
        className={`group/row hidden md:grid ${COLS} h-9 items-stretch border-b border-stone-100/60 transition-colors hover:bg-stone-50/60 ${flashKey > 0 ? 'save-flash' : ''}`}
      >
        {/* Index gutter — Airtable-style row number. Anchors the eye and reinforces
            the group/lot relationship without repeating the species name. */}
        <Cell className="!px-2">
          <span className="font-mono text-[10px] tabular-nums text-stone-300">
            {String(index).padStart(2, '0')}
          </span>
        </Cell>

        <Cell><span className="truncate text-[12px] text-stone-600">{nurseryName}</span></Cell>

        <Cell>
          <span className="rounded bg-stone-100 px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wider text-stone-600">
            {containerLabel}
          </span>
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

      {/* Mobile fallback — denser */}
      <div className="md:hidden border-b border-stone-100 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-sm italic text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>{batch.speciesName}</span>
          {batch.varietyName && <span className="text-xs text-stone-400">· {batch.varietyName}</span>}
        </div>
        <div className="mt-1 text-[11px] text-stone-500">
          {nurseryName} · <span className="font-mono">{containerLabel}</span> · <span className="font-mono tabular-nums">{batch.availableQuantity}/{batch.quantity}</span> · <span className="font-mono tabular-nums">{batch.priceEuros.toFixed(2)} €</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <StatusInline status={status} />
          <button onClick={() => onEdit(batch)} className="ml-auto rounded px-2 py-0.5 text-[11px] text-stone-600 hover:bg-stone-100">Éditer</button>
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
// Stock — dispo / total + a thin in-cell progress bar at the bottom.
// ──────────────────────────────────────────────────────────────────

function StockCell({ batch, onPatch, isLowStock }) {
  const [editing, setEditing] = useState(null) // 'avail' | 'total' | null
  const ratio = batch.quantity > 0 ? batch.availableQuantity / batch.quantity : 0
  const barColor = ratio === 0 ? 'bg-stone-300' : ratio < 0.2 ? 'bg-rose-500' : ratio < 0.5 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div className="relative flex min-w-0 items-center px-3">
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
          className="text-stone-400"
        />
        {isLowStock && <AlertTriangle className="ml-auto h-3 w-3 shrink-0 text-amber-500" />}
      </div>
      {/* hairline progress bar at the bottom of the cell — 1px rail, 1.5px fill */}
      <div className="pointer-events-none absolute inset-x-3 bottom-0.5 h-[2px] overflow-hidden rounded-full bg-stone-100/70">
        <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// Price
// ──────────────────────────────────────────────────────────────────

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
        format={(v) => `${Number(v).toFixed(2)} €`}
        className="font-mono text-[12px] tabular-nums text-stone-900"
      />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// Stage — minimal label-only with a popover. No chip, just text.
// ──────────────────────────────────────────────────────────────────

function StageCell({ batch, onPatch }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useOutsideClick(ref, () => setOpen(false))
  const opt = GROWTH_STAGES.find((s) => s.value === batch.growthStage)
  return (
    <div ref={ref} className="relative flex min-w-0 items-center px-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="group/btn inline-flex w-full items-center justify-between gap-1 rounded-md px-1.5 py-0.5 text-[12px] text-stone-600 transition hover:bg-stone-100"
      >
        <span>{opt?.label || '—'}</span>
        <ChevronDown className="h-3 w-3 text-stone-300 transition group-hover/btn:text-stone-500" />
      </button>
      {open && (
        <PopoverMenu>
          {GROWTH_STAGES.map((o) => {
            const active = o.value === batch.growthStage
            return (
              <button
                key={o.value}
                onClick={async () => { setOpen(false); if (!active) await onPatch(batch.id, { growth_stage: o.value }) }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-[12px] transition ${active ? 'bg-stone-50 text-stone-400' : 'text-stone-700 hover:bg-stone-50'}`}
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

// ──────────────────────────────────────────────────────────────────
// Status — dot + label, with a soft amber pill only for in_production.
// ──────────────────────────────────────────────────────────────────

function StatusCell({ batch, onPatch }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useOutsideClick(ref, () => setOpen(false))
  const status = batch.status || 'available'
  return (
    <div ref={ref} className="relative flex min-w-0 flex-col justify-center px-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="group/btn inline-flex w-full items-center justify-between gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-stone-100"
      >
        <StatusInline status={status} />
        <ChevronDown className="h-3 w-3 text-stone-300 transition group-hover/btn:text-stone-500" />
      </button>
      {status === 'in_production' && (batch.availabilityLabel || batch.expectedAvailabilityOn) && (
        <span className="ml-1.5 truncate text-[10px] italic text-amber-600">→ {batch.availabilityLabel || formatDate(batch.expectedAvailabilityOn)}</span>
      )}
      {open && (
        <PopoverMenu>
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
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-[12px] transition ${active ? 'bg-stone-50 text-stone-400' : 'text-stone-700 hover:bg-stone-50'}`}
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

// ──────────────────────────────────────────────────────────────────
// Notes
// ──────────────────────────────────────────────────────────────────

function NotesCell({ batch, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex min-w-0 items-center gap-1.5 px-3 text-left text-[12px] transition ${active ? 'bg-amber-50/40' : 'hover:bg-stone-50'}`}
    >
      {batch.notes ? (
        <span className="truncate italic text-stone-600">{batch.notes}</span>
      ) : (
        <span className="inline-flex items-center gap-1 text-stone-300">
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
    <div className="border-b border-stone-100 bg-amber-50/20 pl-12 pr-4 py-2">
      <div className="flex items-start gap-3">
        <span className="mt-2 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400">Note</span>
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
          <button onClick={onClose} title="Annuler (Esc)" className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"><X className="h-3.5 w-3.5" /></button>
          <button onClick={commit} disabled={saving} className="rounded-md bg-[#EF9B0D] px-2.5 py-1 text-[11px] font-medium text-white disabled:opacity-50">
            {saving ? '…' : 'Enregistrer'}
          </button>
        </div>
      </div>
      <div className="mt-1 pl-[60px] text-[10px] text-stone-400">
        <span className="font-mono">⌘ ↵</span> pour enregistrer · <span className="font-mono">esc</span> pour fermer
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// Inline number editor — value as text → input on click
// ──────────────────────────────────────────────────────────────────

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

function PopoverMenu({ children }) {
  return (
    <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-stone-200 bg-white py-0.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)]">
      {children}
    </div>
  )
}

function useOutsideClick(ref, fn) {
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) fn() }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [ref, fn])
}

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('fr-BE', { month: 'short', year: 'numeric' }) } catch { return iso }
}
