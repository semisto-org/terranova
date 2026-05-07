import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, ChevronDown, Check, SlidersHorizontal, Plus, Printer } from 'lucide-react'
import type { SearchViewProps, SearchResult, StrateKey } from '../types'
import { FilterPanel } from './FilterPanel'

type Kind = 'genus' | 'species' | 'variety'

const KIND_OPTIONS: { id: Kind; label: string; short: string; color: string }[] = [
  { id: 'genus', label: 'Genres', short: 'G', color: 'bg-[#5B5781] text-white' },
  { id: 'species', label: 'Espèces', short: 'E', color: 'bg-[#AFBD00] text-white' },
  { id: 'variety', label: 'Variétés', short: 'V', color: 'bg-amber-500 text-white' },
]

const STRATE_OPTIONS: { id: StrateKey; label: string }[] = [
  { id: 'trees', label: 'Arbres' },
  { id: 'shrubs', label: 'Arbustes' },
  { id: 'climbers', label: 'Grimpantes' },
  { id: 'herbaceous', label: 'Herbacées' },
  { id: 'groundCover', label: 'Couvre-sols' },
  { id: 'aquatic', label: 'Aquatique' },
]

export function SearchView({
  filterOptions,
  results,
  filters,
  paletteItemIds = [],
  isItemInPalette,
  onSearchChange,
  onFiltersChange,
  onResultSelect,
  onAddToPalette,
}: SearchViewProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advancedShowMore, setAdvancedShowMore] = useState(false)
  const [kindFilter, setKindFilter] = useState<Kind[]>([])
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [printSelection, setPrintSelection] = useState<Set<string>>(new Set())

  const togglePrintSelection = (id: string) => {
    setPrintSelection((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 12) {
        next.add(id)
      }
      return next
    })
  }
  const inputRef = useRef<HTMLInputElement>(null)
  const tableRef = useRef<HTMLTableSectionElement>(null)

  const advancedFilterCount = [
    filters.exposures.length,
    filters.hardinessZones.length,
    filters.edibleParts.length,
    filters.interests.length,
    filters.nativeCountries.length,
    filters.soilTypes.length,
    filters.soilMoisture.length,
    filters.wateringNeed.length,
  ].reduce((sum, count) => sum + count, 0)

  const visibleResults = useMemo(() => {
    if (kindFilter.length === 0) return results
    return results.filter((r) => kindFilter.includes(r.type))
  }, [results, kindFilter])

  const counts = useMemo(() => {
    const c = { genus: 0, species: 0, variety: 0 }
    results.forEach((r) => {
      c[r.type] += 1
    })
    return c
  }, [results])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex((prev) => Math.min(prev + 1, visibleResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex((prev) => Math.max(prev - 1, -1))
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault()
        const result = visibleResults[focusedIndex]
        if (result) onResultSelect?.(result.id, result.type)
      } else if (e.key === 'Escape') {
        inputRef.current?.blur()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedIndex, visibleResults, onResultSelect])

  useEffect(() => {
    setFocusedIndex(-1)
  }, [visibleResults])

  useEffect(() => {
    if (focusedIndex >= 0 && tableRef.current) {
      const rows = tableRef.current.querySelectorAll('[data-result-row]')
      rows[focusedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedIndex])

  const handleFilterChange = (key: keyof typeof filters, value: string[]) => {
    onFiltersChange?.({ ...filters, [key]: value })
  }

  const toggleKind = (kind: Kind) => {
    setKindFilter((prev) =>
      prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]
    )
  }

  const clearAll = () => {
    setKindFilter([])
    onFiltersChange?.({
      query: filters.query,
      types: [],
      exposures: [],
      hardinessZones: [],
      edibleParts: [],
      interests: [],
      nativeCountries: [],
      soilTypes: [],
      soilMoisture: [],
      wateringNeed: [],
    })
  }

  const totalActiveFilters =
    kindFilter.length + filters.types.length + advancedFilterCount

  return (
    <div className="px-4 py-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Title + count */}
        <div className="flex flex-col gap-1 pb-3 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="flex items-baseline gap-3">
            <h1
              className="font-serif text-[28px] leading-none text-stone-900"
              style={{ fontFamily: 'Sole Serif Small, serif' }}
            >
              Base de données végétale
            </h1>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">
              {visibleResults.length} résultat{visibleResults.length > 1 ? 's' : ''}
              {kindFilter.length > 0 && results.length !== visibleResults.length && (
                <span className="ml-1 normal-case tracking-normal text-stone-400">
                  / {results.length}
                </span>
              )}
            </span>
          </div>
          <p className="text-[12px] text-stone-500">
            Genres, espèces et variétés du réseau
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 border-y border-stone-200/70 bg-white/60 px-1 py-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <input
              ref={inputRef}
              type="text"
              value={filters.query}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Nom latin ou commun…"
              className="w-full rounded-md border border-transparent bg-stone-50 px-2.5 py-1 pl-8 pr-7 text-[12px] text-stone-800 placeholder-stone-400 transition focus:border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B5781]/15"
              aria-label="Rechercher des plantes"
            />
            {filters.query && (
              <button
                onClick={() => onSearchChange?.('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                aria-label="Effacer"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Kind filter (Genre / Espèce / Variété) */}
          <FilterPopover
            label="Type"
            value={
              kindFilter.length === 0
                ? 'Tous'
                : kindFilter.length === 1
                  ? KIND_OPTIONS.find((k) => k.id === kindFilter[0])!.label
                  : `${kindFilter.length} sélectionnés`
            }
            count={kindFilter.length}
          >
            {KIND_OPTIONS.map((opt) => (
              <FilterOption
                key={opt.id}
                active={kindFilter.includes(opt.id)}
                onClick={() => toggleKind(opt.id)}
              >
                <span
                  className={`mr-2 inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold ${opt.color}`}
                >
                  {opt.short}
                </span>
                <span className="flex-1">{opt.label}</span>
                <span className="ml-2 font-mono text-[10px] text-stone-400">
                  {counts[opt.id]}
                </span>
              </FilterOption>
            ))}
          </FilterPopover>

          {/* Plant type filter (tree / shrub / etc.) */}
          <FilterPopover
            label="Strate"
            value={
              filters.types.length === 0
                ? 'Toutes'
                : filters.types.length === 1
                  ? filterOptions.types.find((t) => t.id === filters.types[0])?.label
                  : `${filters.types.length} sélectionnés`
            }
            count={filters.types.length}
          >
            {filterOptions.types.map((opt) => (
              <FilterOption
                key={opt.id}
                active={filters.types.includes(opt.id)}
                onClick={() =>
                  handleFilterChange(
                    'types',
                    filters.types.includes(opt.id)
                      ? filters.types.filter((v) => v !== opt.id)
                      : [...filters.types, opt.id]
                  )
                }
              >
                {opt.label}
              </FilterOption>
            ))}
          </FilterPopover>

          {/* Advanced filters toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] transition ${
              showAdvanced || advancedFilterCount > 0
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
            }`}
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span className="font-medium">Filtres avancés</span>
            {advancedFilterCount > 0 && (
              <span className="ml-0.5 rounded bg-white/20 px-1 font-mono text-[10px]">
                {advancedFilterCount}
              </span>
            )}
          </button>

          {totalActiveFilters > 0 && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
              type="button"
            >
              <X className="h-3 w-3" /> Réinitialiser
            </button>
          )}
        </div>

        {/* Advanced filters panel — keep mounted only when open */}
        {showAdvanced && (
          <div className="mt-3">
            <FilterPanel
              filterOptions={filterOptions}
              filters={filters}
              showAdvanced={advancedShowMore}
              onShowAdvancedChange={setAdvancedShowMore}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}

        {/* Table */}
        <div className="pt-4">
          {visibleResults.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white px-6 py-16 text-center">
              <p
                className="font-serif text-lg italic text-stone-400"
                style={{ fontFamily: 'Sole Serif Small, serif' }}
              >
                Aucune plante ne correspond aux critères.
              </p>
              {totalActiveFilters > 0 && (
                <button
                  onClick={clearAll}
                  className="mt-3 text-[12px] text-[#5B5781] font-medium hover:underline"
                  type="button"
                >
                  Réinitialiser la recherche
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
              <table className="w-full text-[12px]">
                <thead className="border-b border-stone-200 bg-stone-50/60">
                  <tr className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">
                    <th className="w-[32px] px-3 py-2"></th>
                    <th className="w-[44px] px-3 py-2 text-center">Type</th>
                    <th className="px-3 py-2">Nom latin</th>
                    <th className="px-3 py-2">Nom commun</th>
                    <th className="px-3 py-2">Parent</th>
                    <th className="px-3 py-2">Strate</th>
                    <th className="px-3 py-2">Exposition</th>
                    <th className="px-3 py-2">Rusticité</th>
                    {onAddToPalette && <th className="w-[60px] px-3 py-2"></th>}
                  </tr>
                </thead>
                <tbody ref={tableRef}>
                  {visibleResults.map((result, index) => (
                    <ResultRow
                      key={`${result.type}:${result.id}`}
                      result={result}
                      filterOptions={filterOptions}
                      isFocused={index === focusedIndex}
                      isInPalette={
                        isItemInPalette && result.type !== 'genus'
                          ? isItemInPalette(result.id, result.type)
                          : paletteItemIds.includes(result.id)
                      }
                      onSelect={() => onResultSelect?.(result.id, result.type)}
                      selectable={result.type === 'species'}
                      selected={printSelection.has(result.id)}
                      selectionAtMax={printSelection.size >= 12}
                      onToggleSelect={() => togglePrintSelection(result.id)}
                      onAddToPalette={
                        onAddToPalette && result.type !== 'genus'
                          ? (strate) =>
                              onAddToPalette(
                                result.id,
                                result.type as 'species' | 'variety',
                                strate
                              )
                          : undefined
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="hidden lg:block fixed bottom-3 right-3 text-[10px] text-stone-400">
          <kbd className="px-1 py-0.5 bg-stone-100 rounded">↑↓</kbd> naviguer
          <span className="mx-1">·</span>
          <kbd className="px-1 py-0.5 bg-stone-100 rounded">↵</kbd> ouvrir
        </div>
      </div>

      {printSelection.size > 0 && (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-lg p-3 flex items-center justify-between gap-3 z-50">
          <button
            type="button"
            onClick={() => setPrintSelection(new Set())}
            className="text-sm text-stone-600 hover:text-stone-900"
          >
            Désélectionner ({printSelection.size})
          </button>
          <a
            href={`/plants/cards?ids=${Array.from(printSelection).join(',')}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-800 text-sm font-medium"
          >
            <Printer className="w-4 h-4" />
            Imprimer {printSelection.size} fiche{printSelection.size > 1 ? 's' : ''}
          </a>
        </div>
      )}
    </div>
  )
}

interface ResultRowProps {
  result: SearchResult
  filterOptions: SearchViewProps['filterOptions']
  isFocused: boolean
  isInPalette: boolean
  onSelect: () => void
  selectable?: boolean
  selected?: boolean
  selectionAtMax?: boolean
  onToggleSelect?: () => void
  onAddToPalette?: (strate: StrateKey) => void
}

function ResultRow({
  result,
  filterOptions,
  isFocused,
  isInPalette,
  onSelect,
  selectable,
  selected,
  selectionAtMax,
  onToggleSelect,
  onAddToPalette,
}: ResultRowProps) {
  const [showStrateMenu, setShowStrateMenu] = useState(false)

  const kindMeta = KIND_OPTIONS.find((k) => k.id === result.type)!
  const parent = result.genusName || result.speciesName || null
  const plantTypeLabel = result.plantType
    ? filterOptions.types.find((t) => t.id === result.plantType)?.label || result.plantType
    : null
  const exposureLabels = (result.exposures || []).map(
    (id) => filterOptions.exposures.find((e) => e.id === id)?.label || id
  )

  return (
    <tr
      data-result-row
      onClick={onSelect}
      className={`group cursor-pointer border-b border-stone-100 last:border-b-0 transition-colors ${
        isFocused
          ? 'bg-[#5B5781]/8'
          : isInPalette
            ? 'bg-[#AFBD00]/8'
            : 'hover:bg-stone-50/60'
      }`}
    >
      <td className="px-3 py-2 text-center w-[32px]">
        {selectable ? (
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={selected ?? false}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => { e.stopPropagation(); onToggleSelect?.() }}
            aria-label="Sélectionner pour impression"
            title={!selected && selectionAtMax ? 'Maximum 12 fiches par batch' : 'Sélectionner pour impression'}
          />
        ) : (
          <span />
        )}
      </td>
      <td className="px-3 py-2 text-center">
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${kindMeta.color}`}
        >
          {kindMeta.short}
        </span>
      </td>
      <td className="px-3 py-2">
        <span
          className={`italic font-medium ${isInPalette ? 'text-[#AFBD00]' : 'text-stone-900'}`}
        >
          {result.latinName}
        </span>
      </td>
      <td className="px-3 py-2 text-stone-600">
        {result.commonName || <span className="text-stone-300">—</span>}
      </td>
      <td className="px-3 py-2 italic text-stone-500">
        {parent || <span className="not-italic text-stone-300">—</span>}
      </td>
      <td className="px-3 py-2 text-stone-600">
        {plantTypeLabel || <span className="text-stone-300">—</span>}
      </td>
      <td className="px-3 py-2">
        {exposureLabels.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {exposureLabels.map((label) => (
              <span
                key={label}
                className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-600"
              >
                {label}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-stone-300">—</span>
        )}
      </td>
      <td className="px-3 py-2 font-mono text-[11px] text-stone-600">
        {result.hardiness || <span className="text-stone-300">—</span>}
      </td>
      {onAddToPalette && (
        <td className="relative px-3 py-2 text-right">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (!isInPalette) setShowStrateMenu((v) => !v)
            }}
            disabled={isInPalette}
            aria-label={isInPalette ? 'Dans la palette' : 'Ajouter à la palette'}
            className={`inline-flex h-6 w-6 items-center justify-center rounded transition ${
              isInPalette
                ? 'bg-[#AFBD00] text-white cursor-default'
                : showStrateMenu
                  ? 'bg-[#AFBD00] text-white'
                  : 'text-stone-400 hover:bg-[#AFBD00]/10 hover:text-[#AFBD00] opacity-0 group-hover:opacity-100'
            }`}
          >
            {isInPalette ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </button>

          {showStrateMenu && !isInPalette && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowStrateMenu(false)
                }}
              />
              <div className="absolute right-3 top-9 z-20 min-w-[140px] overflow-hidden rounded-lg border border-stone-200 bg-white py-0.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)]">
                {STRATE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToPalette(s.id)
                      setShowStrateMenu(false)
                    }}
                    className="block w-full px-3 py-1.5 text-left text-[12px] text-stone-700 transition hover:bg-stone-50"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </td>
      )}
    </tr>
  )
}

interface FilterPopoverProps {
  label: string
  value?: string
  count: number
  children: React.ReactNode
}

function FilterPopover({ label, value, count, children }: FilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const isActive = count > 0

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] transition ${
          isActive
            ? 'border-stone-900 bg-stone-900 text-white'
            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
        }`}
      >
        <span
          className={`font-mono text-[9px] uppercase tracking-[0.18em] ${isActive ? 'opacity-60' : 'opacity-40'}`}
        >
          {label}
        </span>
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

interface FilterOptionProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function FilterOption({ active, onClick, children }: FilterOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] transition ${
        active ? 'bg-stone-50 text-stone-900' : 'text-stone-700 hover:bg-stone-50'
      }`}
    >
      <span className="flex flex-1 items-center">{children}</span>
      {active && <Check className="h-3 w-3 text-stone-400" />}
    </button>
  )
}
