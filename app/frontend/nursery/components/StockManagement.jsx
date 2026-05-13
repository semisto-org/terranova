import { useState, useMemo, useRef, useEffect } from 'react'
import { StockBatchForm } from './StockBatchForm'
import { StockTable } from './StockTable'
import { Plus, Search, X, SlidersHorizontal, ChevronDown, Check, Printer } from 'lucide-react'

const GROWTH_STAGE_LABELS = {
  seed: 'Graine', seedling: 'Semis', young: 'Jeune', established: 'Établi', mature: 'Mature',
}

const STATUS_LABELS = {
  available: 'Disponible',
  in_production: 'En production',
  sold_out: 'Épuisé',
  archived: 'Archivé',
}

export function StockManagement({ batches, nurseries, containers, onSaveBatch, onDeleteBatch, onPatchBatch, onCreateContainer }) {
  const [showForm, setShowForm] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ status: 'active' })

  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const match = batch.speciesName.toLowerCase().includes(q) ||
          batch.varietyName?.toLowerCase().includes(q) ||
          batch.notes?.toLowerCase().includes(q) ||
          batch.availabilityLabel?.toLowerCase().includes(q) ||
          batch.origin?.toLowerCase().includes(q) ||
          containers.find((c) => c.id === batch.containerId)?.name.toLowerCase().includes(q) ||
          nurseries.find((n) => n.id === batch.nurseryId)?.name.toLowerCase().includes(q)
        if (!match) return false
      }
      if (filters.nurseryId && batch.nurseryId !== filters.nurseryId) return false
      if (filters.containerId && batch.containerId !== filters.containerId) return false
      if (filters.stage && batch.growthStage !== filters.stage) return false
      const batchStatus = batch.status || 'available'
      if (filters.status === 'active' && batchStatus === 'archived') return false
      if (filters.status && filters.status !== 'active' && filters.status !== 'all' && batchStatus !== filters.status) return false
      return true
    })
  }, [batches, searchQuery, filters, containers, nurseries])

  const handleCreate = () => { setEditingBatch(null); setShowForm(true) }
  const handleEdit = (batch) => { setEditingBatch(batch); setShowForm(true) }
  const handleSave = (data) => {
    onSaveBatch(data, editingBatch?.id)
    setShowForm(false)
    setEditingBatch(null)
  }
  const handleCancel = () => { setShowForm(false); setEditingBatch(null) }
  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value || undefined }))
  const clearFilters = () => { setFilters({ status: 'active' }); setSearchQuery('') }

  const activeFilterCount =
    Number(Boolean(filters.nurseryId)) +
    Number(Boolean(filters.containerId)) +
    Number(Boolean(filters.stage)) +
    Number(filters.status && filters.status !== 'active' ? 1 : 0)

  const total = batches.length
  const available = batches.filter((b) => (b.status || 'available') === 'available').length
  const inProd = batches.filter((b) => b.status === 'in_production').length

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Page header — compact, editorial */}
      <div className="flex flex-col gap-1 pb-3 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-[28px] leading-none text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>
            Stock
          </h1>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">
            {filteredBatches.length}/{total}
            {filteredBatches.length !== total && ' filtrés'}
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-stone-400">
          <span><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />{available} dispo</span>
          <span><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle" />{inProd} en prod</span>
        </div>
      </div>

      {/* Toolbar — slim & dense, Linear-style */}
      <div className="flex flex-wrap items-center gap-2 border-y border-stone-200/70 bg-white/60 px-1 py-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Espèce, variété, note, origine…"
            className="w-full rounded-md border border-transparent bg-stone-50 px-2.5 py-1 pl-8 text-[12px] text-stone-800 placeholder-stone-400 transition focus:border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]/15"
          />
        </div>

        <FilterPopover label="Statut" value={statusLabel(filters.status)} count={filters.status && filters.status !== 'active' ? 1 : 0}>
          {[
            ['active', 'Actifs (sauf archivés)'],
            ['all', 'Tous'],
            ...Object.entries(STATUS_LABELS),
          ].map(([v, l]) => (
            <FilterOption key={v} active={filters.status === v} onClick={() => setFilter('status', v)}>{l}</FilterOption>
          ))}
        </FilterPopover>

        {nurseries.length > 1 && (
          <FilterPopover label="Pépinière" value={nurseryLabel(filters.nurseryId, nurseries)} count={filters.nurseryId ? 1 : 0}>
            <FilterOption active={!filters.nurseryId} onClick={() => setFilter('nurseryId', '')}>Toutes</FilterOption>
            {nurseries.map((n) => (
              <FilterOption key={n.id} active={filters.nurseryId === n.id} onClick={() => setFilter('nurseryId', n.id)}>{n.name}</FilterOption>
            ))}
          </FilterPopover>
        )}

        <FilterPopover label="Pot" value={containerLabel(filters.containerId, containers)} count={filters.containerId ? 1 : 0}>
          <FilterOption active={!filters.containerId} onClick={() => setFilter('containerId', '')}>Tous</FilterOption>
          {containers.map((c) => (
            <FilterOption key={c.id} active={filters.containerId === c.id} onClick={() => setFilter('containerId', c.id)}>
              <span className="font-mono text-[10px] mr-2 rounded bg-stone-100 px-1 text-stone-600">{c.shortName}</span>
              {c.name}
            </FilterOption>
          ))}
        </FilterPopover>

        <FilterPopover label="Stade" value={GROWTH_STAGE_LABELS[filters.stage]} count={filters.stage ? 1 : 0}>
          <FilterOption active={!filters.stage} onClick={() => setFilter('stage', '')}>Tous</FilterOption>
          {Object.entries(GROWTH_STAGE_LABELS).map(([v, l]) => (
            <FilterOption key={v} active={filters.stage === v} onClick={() => setFilter('stage', v)}>{l}</FilterOption>
          ))}
        </FilterPopover>

        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-stone-500 transition hover:bg-stone-100 hover:text-stone-700">
            <X className="h-3 w-3" /> Réinitialiser
          </button>
        )}

        <div className="ml-auto flex items-center gap-1">
          {(() => {
            const semistoNurseries = nurseries.filter((n) => n.type === 'semisto')
            if (semistoNurseries.length === 0) return null
            const filteredIsSemisto =
              filters.nurseryId && semistoNurseries.some((n) => n.id === filters.nurseryId)
            const targetNurseryId =
              (filteredIsSemisto && filters.nurseryId) ||
              (semistoNurseries.length === 1 ? semistoNurseries[0].id : null)
            const disabled = !targetNurseryId
            return (
              <a
                href={targetNurseryId ? `/plants/cards/nursery/${targetNurseryId}` : undefined}
                target="_blank"
                rel="noopener"
                aria-disabled={disabled}
                title={disabled ? 'Filtre une pépinière Semisto pour imprimer ses fiches' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] transition ${
                  disabled
                    ? 'border-stone-200 bg-white text-stone-400 cursor-not-allowed pointer-events-none'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <Printer className="h-3.5 w-3.5" /> Fiches du stock
              </a>
            )
          })()}
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-3 py-1.5 text-[12px] font-medium text-white shadow-sm transition hover:bg-stone-800"
          >
            <Plus className="h-3.5 w-3.5" /> Nouveau lot
          </button>
        </div>
      </div>

      <div className="pt-4">
        {filteredBatches.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white px-6 py-16 text-center">
            <p className="font-serif text-lg italic text-stone-400" style={{ fontFamily: 'Sole Serif Small, serif' }}>
              {activeFilterCount + (searchQuery ? 1 : 0) > 0 ? 'Aucun lot ne correspond aux filtres.' : 'Aucun lot en stock.'}
            </p>
          </div>
        ) : (
          <StockTable
            batches={filteredBatches}
            nurseries={nurseries}
            containers={containers}
            onPatch={onPatchBatch}
            onEdit={handleEdit}
            onDelete={onDeleteBatch}
          />
        )}
      </div>

      {showForm && (
        <StockBatchForm
          batch={editingBatch}
          nurseries={nurseries}
          containers={containers}
          onSave={handleSave}
          onCancel={handleCancel}
          onCreateContainer={onCreateContainer}
        />
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Slim popover-based filter chips
// ──────────────────────────────────────────────────────────────

function FilterPopover({ label, value, count, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const isActive = count > 0 && value && value !== 'Actifs (sauf archivés)'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] transition ${
          isActive
            ? 'border-stone-900 bg-stone-900 text-white'
            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
        }`}
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] opacity-40">{label}</span>
        {value && <span className="font-medium">{value}</span>}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-[220px] overflow-hidden rounded-lg border border-stone-200 bg-white py-0.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)]">
          {children}
        </div>
      )}
    </div>
  )
}

function FilterOption({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] transition ${active ? 'bg-stone-50 text-stone-900' : 'text-stone-700 hover:bg-stone-50'}`}
    >
      <span className="flex-1">{children}</span>
      {active && <Check className="h-3 w-3 text-stone-400" />}
    </button>
  )
}

function statusLabel(value) {
  if (!value || value === 'active') return 'Actifs'
  if (value === 'all') return 'Tous'
  return STATUS_LABELS[value] || value
}

function nurseryLabel(id, nurseries) {
  if (!id) return 'Toutes'
  return nurseries.find((n) => n.id === id)?.name
}

function containerLabel(id, containers) {
  if (!id) return 'Tous'
  return containers.find((c) => c.id === id)?.shortName
}
