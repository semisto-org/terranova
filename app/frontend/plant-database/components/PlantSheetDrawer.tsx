import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { GenusDetail } from './GenusDetail'
import { SpeciesDetail } from './SpeciesDetail'
import { VarietyDetail } from './VarietyDetail'
import type { FilterOptions } from '../types'

// TODO: design-studio/components/SpeciesDrawer.tsx duplicates a subset of
// this functionality. Consider migrating PaletteTab.tsx to use this component
// once it stabilises.

export type PlantKind = 'genus' | 'species' | 'variety'
export type StackEntry = { kind: PlantKind; id: string }

interface ExtraSection {
  /** Title rendered with the same eyebrow style as native sections. */
  title: string
  /** Content to render. Receives the resolved payload of the entry it sits on. */
  render: (payload: any, entry: StackEntry) => React.ReactNode
  /** Restrict the extra section to specific kinds. Defaults to all. */
  forKinds?: PlantKind[]
}

interface PlantSheetDrawerProps {
  stack: StackEntry[]
  onStackChange: (next: StackEntry[]) => void
  onClose: () => void
  /** Filter options used by the embedded fiche components. When omitted, the
   *  drawer fetches them lazily on first open. */
  filterOptions?: FilterOptions | null
  /** Set of palette item keys formatted as `${kind}:${id}` for highlighting "in palette" state. */
  paletteItemKeySet?: Set<string>
  onAddToPalette?: (id: string, kind: PlantKind, strate?: string) => void
  onRemoveFromPalette?: (id: string) => void
  onEdit?: (kind: PlantKind, payload: any) => void
  onAddPhoto?: (kind: PlantKind, id: string) => void
  onAddNote?: (kind: PlantKind, id: string) => void
  onAddReference?: (kind: PlantKind, id: string) => void
  onAddSpecies?: (genusId: string) => void
  onAddVariety?: (speciesId: string) => void
  onGenerateAISummary?: (kind: PlantKind, id: string) => void
  onContributorSelect?: (contributorId: string) => void
  /** Extra section injected above the native fiche body — used by the
   *  Nursery admin to surface "lots dans ce stock". */
  extraSection?: ExtraSection
  /** When true, the drawer assumes responsibility for resolving missing
   *  parents and pushing them to the stack so the user always sees the full
   *  taxonomy chain (genus → species → variety). */
  autoResolveParents?: boolean
  /** Bump this number to force the drawer to discard its cache and refetch
   *  every visible layer. Used by callers after a mutation that may have
   *  changed the rendered fiches (notes, photos, edits). */
  refreshSignal?: number
}

const PATH_BY_KIND: Record<PlantKind, (id: string) => string> = {
  genus: (id) => `/api/v1/plants/genera/${id}`,
  species: (id) => `/api/v1/plants/species/${id}`,
  variety: (id) => `/api/v1/plants/varieties/${id}`,
}

const EMPTY_FILTER_OPTIONS: FilterOptions = {
  types: [],
  exposures: [],
  hardinessZones: [],
  edibleParts: [],
  interests: [],
  ecosystemNeeds: [],
  propagationMethods: [],
  flowerColors: [],
  plantingSeasons: [],
  months: [],
  foliageTypes: [],
  europeanCountries: [],
  fertilityTypes: [],
  rootSystems: [],
  growthRates: [],
  forestGardenZones: [],
  pollinationTypes: [],
  soilTypes: [],
  soilMoistures: [],
  soilRichness: [],
  wateringNeeds: [],
  lifeCycles: [],
  foliageColors: [],
  fragranceLevels: [],
  transformations: [],
  fodderQualities: [],
  strates: [],
  successionalRoles: [],
  ecoServices: [],
  resourceCategories: [],
  plantParts: [],
  sensorySubtypes: [],
  animalSubtypes: [],
  toxicityTargets: [],
  specificPollinators: [],
  soilPhValues: [],
  soilTextures: [],
}

const ORDER: Record<PlantKind, number> = { genus: 0, species: 1, variety: 2 }

function entryKey(entry: StackEntry) {
  return `${entry.kind}:${entry.id}`
}

/**
 * PlantSheetDrawer — stacked side-panel viewer for plant taxonomy.
 *
 * The stack is ordered bottom→top (genus, species, variety). Layers below the
 * top peek out by ~44px to the left, scaled and dimmed. Clicking a back layer
 * pops everything above it. Closing the top pops a single layer; backdrop /
 * full close discards the whole stack.
 */
export function PlantSheetDrawer({
  stack,
  onStackChange,
  onClose,
  filterOptions: providedFilterOptions,
  paletteItemKeySet,
  onAddToPalette,
  onRemoveFromPalette,
  onEdit,
  onAddPhoto,
  onAddNote,
  onAddReference,
  onAddSpecies,
  onAddVariety,
  onGenerateAISummary,
  onContributorSelect,
  extraSection,
  autoResolveParents = true,
  refreshSignal = 0,
}: PlantSheetDrawerProps) {
  const [cache, setCache] = useState<Map<string, any>>(new Map())
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState<{ key: string; message: string } | null>(null)
  const [fetchedFilterOptions, setFetchedFilterOptions] = useState<FilterOptions | null>(null)
  const stackRef = useRef(stack)
  stackRef.current = stack

  const filterOptions: FilterOptions | null =
    providedFilterOptions ?? fetchedFilterOptions

  // Lazily fetch filter-options when the caller did not provide them.
  useEffect(() => {
    if (providedFilterOptions || fetchedFilterOptions) return
    if (stack.length === 0) return
    let cancelled = false
    apiRequest('/api/v1/plants/filter-options')
      .then((payload) => {
        if (!cancelled) setFetchedFilterOptions(payload as FilterOptions)
      })
      .catch(() => {
        // Filter options are nice-to-have for label translation, not critical.
      })
    return () => {
      cancelled = true
    }
  }, [providedFilterOptions, fetchedFilterOptions, stack.length])

  // Invalidate cache when refreshSignal bumps — typically after a mutation.
  useEffect(() => {
    if (refreshSignal === 0) return
    setCache(new Map())
    setErrorKey(null)
  }, [refreshSignal])

  // Lock body scroll while a drawer is open.
  useEffect(() => {
    if (stack.length === 0) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [stack.length])

  const popTop = useCallback(() => {
    const current = stackRef.current
    if (current.length === 0) return
    if (current.length === 1) {
      onClose()
      return
    }
    onStackChange(current.slice(0, -1))
  }, [onClose, onStackChange])

  // Escape pops the top.
  useEffect(() => {
    if (stack.length === 0) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        popTop()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [popTop, stack.length])

  // Fetch missing payloads, one entry at a time (top-most first so the user
  // sees their target as soon as possible).
  useEffect(() => {
    if (stack.length === 0) return

    let cancelled = false

    const next = [...stack]
      .reverse()
      .find((entry) => !cache.has(entryKey(entry)))

    if (!next) return

    const key = entryKey(next)
    setLoadingKey(key)
    setErrorKey(null)

    apiRequest(PATH_BY_KIND[next.kind](next.id))
      .then((payload) => {
        if (cancelled) return
        setCache((previous) => {
          const updated = new Map(previous)
          updated.set(key, payload)
          return updated
        })
      })
      .catch((err: Error) => {
        if (cancelled) return
        setErrorKey({ key, message: err?.message || 'Impossible de charger la fiche.' })
      })
      .finally(() => {
        if (cancelled) return
        setLoadingKey((current) => (current === key ? null : current))
      })

    return () => {
      cancelled = true
    }
  }, [stack, cache])

  // After a payload resolves, optionally pre-fill missing parent layers so the
  // user always sees the full taxonomy chain when they deep-link to a child.
  useEffect(() => {
    if (!autoResolveParents || stack.length === 0) return

    const top = stack[stack.length - 1]
    const payload = cache.get(entryKey(top))
    if (!payload) return

    const desired: StackEntry[] = []

    if (top.kind === 'variety') {
      const speciesId: string | undefined =
        payload.species?.id || payload.variety?.speciesId
      const genusId: string | undefined =
        payload.genus?.id || payload.species?.genusId
      if (genusId) desired.push({ kind: 'genus', id: genusId })
      if (speciesId) desired.push({ kind: 'species', id: speciesId })
      desired.push(top)
    } else if (top.kind === 'species') {
      const genusId: string | undefined =
        payload.genus?.id || payload.species?.genusId
      if (genusId) desired.push({ kind: 'genus', id: genusId })
      desired.push(top)
    } else {
      desired.push(top)
    }

    // Compare desired vs. current — only update if it actually grows the stack.
    const sameLength = desired.length === stack.length
    const sameContent =
      sameLength &&
      desired.every((entry, idx) => {
        const current = stack[idx]
        return current.kind === entry.kind && current.id === entry.id
      })

    if (!sameContent && desired.length > stack.length) {
      onStackChange(desired)
    }
  }, [autoResolveParents, cache, onStackChange, stack])

  const handleSelectGenus = useCallback(
    (genusId: string) => {
      const current = stackRef.current
      const existing = current.findIndex(
        (entry) => entry.kind === 'genus' && entry.id === genusId,
      )
      if (existing >= 0) {
        // Pop everything above the genus.
        onStackChange(current.slice(0, existing + 1))
      } else {
        // Replace the stack with just this genus.
        onStackChange([{ kind: 'genus', id: genusId }])
      }
    },
    [onStackChange],
  )

  const handleSelectSpecies = useCallback(
    (speciesId: string) => {
      const current = stackRef.current
      const existing = current.findIndex(
        (entry) => entry.kind === 'species' && entry.id === speciesId,
      )
      if (existing >= 0) {
        onStackChange(current.slice(0, existing + 1))
        return
      }
      // Keep the existing genus layer if any, drop variety/species above, push
      // the new species. The genus parent (if missing) will be back-filled by
      // autoResolveParents.
      const genus = current.find((entry) => entry.kind === 'genus')
      const base: StackEntry[] = genus ? [genus] : []
      onStackChange([...base, { kind: 'species', id: speciesId }])
    },
    [onStackChange],
  )

  const handleSelectVariety = useCallback(
    (varietyId: string) => {
      const current = stackRef.current
      const existing = current.findIndex(
        (entry) => entry.kind === 'variety' && entry.id === varietyId,
      )
      if (existing >= 0) {
        onStackChange(current.slice(0, existing + 1))
        return
      }
      const genus = current.find((entry) => entry.kind === 'genus')
      const species = current.find((entry) => entry.kind === 'species')
      const base: StackEntry[] = []
      if (genus) base.push(genus)
      if (species) base.push(species)
      onStackChange([...base, { kind: 'variety', id: varietyId }])
    },
    [onStackChange],
  )

  // Order the stack so genus < species < variety. Defensive in case the parent
  // pushed entries out of order.
  const orderedStack = useMemo(() => {
    return [...stack].sort((a, b) => ORDER[a.kind] - ORDER[b.kind])
  }, [stack])

  if (stack.length === 0) return null

  const topIndex = orderedStack.length - 1

  return (
    <div className="fixed inset-0 z-40">
      <style>{`
        @keyframes plant-drawer-slide-in {
          from { transform: translateX(100%); opacity: 0.6; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes plant-drawer-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Backdrop — clicking dismisses the entire stack. */}
      <button
        type="button"
        aria-label="Fermer le panneau"
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/35 backdrop-blur-[2px]"
        style={{ animation: 'plant-drawer-fade-in 200ms ease-out' }}
      />

      {orderedStack.map((entry, index) => {
        const key = entryKey(entry)
        const payload = cache.get(key)
        const isTop = index === topIndex
        const depthFromTop = topIndex - index

        // Back layers are scaled, dimmed, and offset so the top edge of each
        // peeks out on the left like a stack of cards.
        const offsetPx = depthFromTop * 44
        const scale = isTop ? 1 : Math.max(0.94, 1 - depthFromTop * 0.025)
        const opacity = isTop ? 1 : Math.max(0.4, 0.78 - depthFromTop * 0.18)

        const onClickBackPanel = isTop
          ? undefined
          : () => onStackChange(orderedStack.slice(0, index + 1))

        return (
          <aside
            key={key}
            role="dialog"
            aria-modal={isTop ? 'true' : 'false'}
            aria-hidden={!isTop}
            className="absolute right-0 top-0 h-full w-full max-w-[640px] bg-stone-50 shadow-[-8px_0_32px_-8px_rgba(0,0,0,0.18),-16px_0_48px_-16px_rgba(0,0,0,0.10)]"
            style={{
              transform: `translateX(-${offsetPx}px) scale(${scale})`,
              transformOrigin: 'left center',
              opacity,
              zIndex: 50 + index,
              animation: isTop
                ? 'plant-drawer-slide-in 280ms cubic-bezier(0.2, 0.7, 0.2, 1)'
                : undefined,
              transition:
                'transform 220ms cubic-bezier(0.2, 0.7, 0.2, 1), opacity 220ms ease-out',
              pointerEvents: 'auto',
            }}
          >
            {/* Click-catcher for back panels: covers the visible peek strip. */}
            {!isTop && onClickBackPanel && (
              <button
                type="button"
                aria-label={`Revenir à ${
                  entry.kind === 'genus'
                    ? 'la fiche genre'
                    : entry.kind === 'species'
                      ? "la fiche espèce"
                      : 'la fiche variété'
                }`}
                onClick={onClickBackPanel}
                className="absolute inset-0 cursor-pointer"
                style={{ background: 'transparent' }}
              />
            )}

            {/* Top-right close button (top panel only). */}
            {isTop && (
              <button
                type="button"
                aria-label="Fermer"
                onClick={popTop}
                className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-stone-600 shadow-sm transition hover:bg-white hover:text-stone-900"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Body — only fully scrollable on the top panel. */}
            <div
              className={`h-full ${isTop ? 'overflow-y-auto' : 'overflow-hidden'}`}
            >
              {!payload && loadingKey === key && (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#AFBD00]/30 border-t-[#AFBD00]" />
                    <p className="text-sm text-stone-500">Chargement de la fiche…</p>
                  </div>
                </div>
              )}

              {!payload && errorKey?.key === key && (
                <div className="p-6">
                  <div className="rounded-2xl border border-red-200 bg-red-50/80 p-5 text-center">
                    <p className="font-medium text-red-700">{errorKey.message}</p>
                    <button
                      type="button"
                      onClick={popTop}
                      className="mt-4 rounded-xl bg-red-100 px-4 py-2 text-sm font-medium text-red-800 transition hover:bg-red-200"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}

              {payload && (
                <FicheBody
                  entry={entry}
                  payload={payload}
                  filterOptions={filterOptions || EMPTY_FILTER_OPTIONS}
                  paletteItemKeySet={paletteItemKeySet}
                  extraSection={extraSection}
                  onAddToPalette={onAddToPalette}
                  onRemoveFromPalette={onRemoveFromPalette}
                  onEdit={onEdit}
                  onAddPhoto={onAddPhoto}
                  onAddNote={onAddNote}
                  onAddReference={onAddReference}
                  onAddSpecies={onAddSpecies}
                  onAddVariety={onAddVariety}
                  onGenerateAISummary={onGenerateAISummary}
                  onContributorSelect={onContributorSelect}
                  onSelectGenus={handleSelectGenus}
                  onSelectSpecies={handleSelectSpecies}
                  onSelectVariety={handleSelectVariety}
                />
              )}
            </div>
          </aside>
        )
      })}
    </div>
  )
}

interface FicheBodyProps {
  entry: StackEntry
  payload: any
  filterOptions: FilterOptions
  paletteItemKeySet?: Set<string>
  extraSection?: ExtraSection
  onAddToPalette?: (id: string, kind: PlantKind, strate?: string) => void
  onRemoveFromPalette?: (id: string) => void
  onEdit?: (kind: PlantKind, payload: any) => void
  onAddPhoto?: (kind: PlantKind, id: string) => void
  onAddNote?: (kind: PlantKind, id: string) => void
  onAddReference?: (kind: PlantKind, id: string) => void
  onAddSpecies?: (genusId: string) => void
  onAddVariety?: (speciesId: string) => void
  onGenerateAISummary?: (kind: PlantKind, id: string) => void
  onContributorSelect?: (contributorId: string) => void
  onSelectGenus: (id: string) => void
  onSelectSpecies: (id: string) => void
  onSelectVariety: (id: string) => void
}

function FicheBody({
  entry,
  payload,
  filterOptions,
  paletteItemKeySet,
  extraSection,
  onAddToPalette,
  onRemoveFromPalette,
  onEdit,
  onAddPhoto,
  onAddNote,
  onAddReference,
  onAddSpecies,
  onAddVariety,
  onGenerateAISummary,
  onContributorSelect,
  onSelectGenus,
  onSelectSpecies,
  onSelectVariety,
}: FicheBodyProps) {
  const showExtra =
    extraSection &&
    (!extraSection.forKinds || extraSection.forKinds.includes(entry.kind))

  return (
    <div>
      {showExtra && (
        <section className="border-b border-stone-200 bg-white/70 px-5 py-4">
          <h3
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5B5781]"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {extraSection!.title}
          </h3>
          {extraSection!.render(payload, entry)}
        </section>
      )}

      {entry.kind === 'genus' && (
        <GenusDetail
          embedded
          genus={payload.genus}
          species={payload.species || []}
          commonNames={payload.commonNames || []}
          references={payload.references || []}
          photos={payload.photos || []}
          notes={payload.notes || []}
          contributors={payload.contributors || []}
          aiSummary={payload.aiSummary}
          filterOptions={filterOptions}
          allCommonNames={[]}
          onSpeciesSelect={onSelectSpecies}
          onContributorSelect={onContributorSelect}
          onGenusSelect={onSelectGenus}
          onGenerateAISummary={
            onGenerateAISummary
              ? () => onGenerateAISummary('genus', payload.genus.id)
              : undefined
          }
          onAddPhoto={
            onAddPhoto ? () => onAddPhoto('genus', payload.genus.id) : undefined
          }
          onAddNote={
            onAddNote ? () => onAddNote('genus', payload.genus.id) : undefined
          }
          onAddReference={
            onAddReference
              ? () => onAddReference('genus', payload.genus.id)
              : undefined
          }
          onAddSpecies={
            onAddSpecies ? () => onAddSpecies(payload.genus.id) : undefined
          }
          onEdit={onEdit ? () => onEdit('genus', payload) : undefined}
        />
      )}

      {entry.kind === 'species' && (
        <SpeciesDetail
          embedded
          species={payload.species}
          genus={payload.genus}
          varieties={payload.varieties || []}
          commonNames={payload.commonNames || []}
          references={payload.references || []}
          photos={payload.photos || []}
          notes={payload.notes || []}
          plantLocations={payload.locations || []}
          nurseryStocks={payload.nurseryStock || []}
          contributors={payload.contributors || []}
          aiSummary={payload.aiSummary}
          filterOptions={filterOptions}
          siblingSpecies={payload.siblingSpecies || []}
          isInPalette={paletteItemKeySet?.has(`species:${payload.species.id}`)}
          onRemoveFromPalette={
            onRemoveFromPalette
              ? () => onRemoveFromPalette(payload.species.id)
              : undefined
          }
          onVarietySelect={onSelectVariety}
          onSpeciesSelect={onSelectSpecies}
          onGenusSelect={onSelectGenus}
          onContributorSelect={onContributorSelect}
          onAddToPalette={
            onAddToPalette
              ? (strate: string) =>
                  onAddToPalette(payload.species.id, 'species', strate)
              : undefined
          }
          onGenerateAISummary={
            onGenerateAISummary
              ? () => onGenerateAISummary('species', payload.species.id)
              : undefined
          }
          onAddPhoto={
            onAddPhoto
              ? () => onAddPhoto('species', payload.species.id)
              : undefined
          }
          onAddNote={
            onAddNote ? () => onAddNote('species', payload.species.id) : undefined
          }
          onAddReference={
            onAddReference
              ? () => onAddReference('species', payload.species.id)
              : undefined
          }
          onAddVariety={
            onAddVariety ? () => onAddVariety(payload.species.id) : undefined
          }
          onEdit={onEdit ? () => onEdit('species', payload) : undefined}
        />
      )}

      {entry.kind === 'variety' && (
        <VarietyDetail
          embedded
          variety={payload.variety}
          species={payload.species}
          genus={payload.genus}
          commonNames={payload.commonNames || []}
          references={payload.references || []}
          photos={payload.photos || []}
          notes={payload.notes || []}
          plantLocations={payload.locations || []}
          nurseryStocks={payload.nurseryStock || []}
          contributors={payload.contributors || []}
          aiSummary={payload.aiSummary}
          filterOptions={filterOptions}
          varieties={payload.siblingVarieties || []}
          isInPalette={paletteItemKeySet?.has(`variety:${payload.variety.id}`)}
          onRemoveFromPalette={
            onRemoveFromPalette
              ? () => onRemoveFromPalette(payload.variety.id)
              : undefined
          }
          onVarietySelect={onSelectVariety}
          onSpeciesSelect={onSelectSpecies}
          onContributorSelect={onContributorSelect}
          onAddToPalette={
            onAddToPalette
              ? (strate: string) =>
                  onAddToPalette(payload.variety.id, 'variety', strate)
              : undefined
          }
          onGenerateAISummary={
            onGenerateAISummary
              ? () => onGenerateAISummary('variety', payload.variety.id)
              : undefined
          }
          onAddPhoto={
            onAddPhoto
              ? () => onAddPhoto('variety', payload.variety.id)
              : undefined
          }
          onAddNote={
            onAddNote ? () => onAddNote('variety', payload.variety.id) : undefined
          }
          onAddReference={
            onAddReference
              ? () => onAddReference('variety', payload.variety.id)
              : undefined
          }
          onEdit={onEdit ? () => onEdit('variety', payload) : undefined}
        />
      )}
    </div>
  )
}
