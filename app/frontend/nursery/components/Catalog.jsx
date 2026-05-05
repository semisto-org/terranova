import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, ChevronDown, Check } from 'lucide-react'
import { StockTable } from './StockTable'

const GROWTH_STAGE_LABELS = {
  seed: 'Graine', seedling: 'Semis', young: 'Jeune', established: 'Établi', mature: 'Mature',
}

/**
 * Catalogue multi-pépinières — vue lecture seule du stock disponible dans
 * tout le réseau. Réutilise StockTable en mode readOnly pour scaler sur des
 * centaines d'espèces (vs. l'ancienne grille de cartes qui devenait illisible).
 */
export function Catalog({ nurseries, batches, containers }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ availableOnly: true })

  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      const status = batch.status || 'available'
      // Le catalogue ne montre jamais les lots archivés.
      if (status === 'archived') return false

      if (filters.availableOnly && batch.availableQuantity <= 0) return false
      if (filters.nurseryId && batch.nurseryId !== filters.nurseryId) return false
      if (filters.containerId && batch.containerId !== filters.containerId) return false
      if (filters.stage && batch.growthStage !== filters.stage) return false

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const match =
          batch.speciesName?.toLowerCase().includes(q) ||
          batch.varietyName?.toLowerCase().includes(q) ||
          batch.notes?.toLowerCase().includes(q) ||
          batch.availabilityLabel?.toLowerCase().includes(q) ||
          containers.find((c) => c.id === batch.containerId)?.name.toLowerCase().includes(q) ||
          nurseries.find((n) => n.id === batch.nurseryId)?.name.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [batches, searchQuery, filters, containers, nurseries])

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value || undefined }))
  const clearFilters = () => { setFilters({ availableOnly: true }); setSearchQuery('') }

  const activeFilterCount =
    Number(Boolean(filters.nurseryId)) +
    Number(Boolean(filters.containerId)) +
    Number(Boolean(filters.stage)) +
    Number(!filters.availableOnly ? 1 : 0)

  const totalSpecies = useMemo(() => {
    const set = new Set()
    filteredBatches.forEach((b) => set.add(b.varietyId ? `${b.speciesId}-${b.varietyId}` : b.speciesId))
    return set.size
  }, [filteredBatches])

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-col gap-1 pb-3 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-[28px] leading-none text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>
            Catalogue
          </h1>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">
            {totalSpecies} espèce{totalSpecies > 1 ? 's' : ''} · {filteredBatches.length} lot{filteredBatches.length > 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-[12px] text-stone-500">Disponibilité dans toutes les pépinières du réseau</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-y border-stone-200/70 bg-white/60 px-1 py-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Espèce, variété, pépinière, note…"
            className="w-full rounded-md border border-transparent bg-stone-50 px-2.5 py-1 pl-8 text-[12px] text-stone-800 placeholder-stone-400 transition focus:border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]/15"
          />
        </div>

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

        <label className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-[12px] text-stone-700 transition hover:border-stone-300 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.availableOnly}
            onChange={(e) => setFilters((prev) => ({ ...prev, availableOnly: e.target.checked }))}
            className="h-3 w-3 rounded border-stone-300 text-[#EF9B0D] focus:ring-[#EF9B0D]"
          />
          En stock uniquement
        </label>

        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-stone-500 transition hover:bg-stone-100 hover:text-stone-700">
            <X className="h-3 w-3" /> Réinitialiser
          </button>
        )}
      </div>

      <div className="pt-4">
        {filteredBatches.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white px-6 py-16 text-center">
            <p className="font-serif text-lg italic text-stone-400" style={{ fontFamily: 'Sole Serif Small, serif' }}>
              Aucun lot ne correspond aux filtres.
            </p>
          </div>
        ) : (
          <StockTable
            batches={filteredBatches}
            nurseries={nurseries}
            containers={containers}
            readOnly
          />
        )}
      </div>
    </div>
  )
}

function FilterPopover({ label, value, count, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const isActive = count > 0 && value

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

function nurseryLabel(id, nurseries) {
  if (!id) return 'Toutes'
  return nurseries.find((n) => n.id === id)?.name
}

function containerLabel(id, containers) {
  if (!id) return 'Tous'
  return containers.find((c) => c.id === id)?.shortName
}
