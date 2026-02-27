import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { SpeciesDetail } from '@/plant-database/components'
import type { FilterOptions } from '@/plant-database/types'

interface SpeciesDrawerProps {
  speciesId: string | null
  onClose: () => void
  /** When provided, clicking a sibling species opens it in the drawer */
  onSpeciesSelect?: (speciesId: string) => void
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
}

export function SpeciesDrawer({ speciesId, onClose, onSpeciesSelect }: SpeciesDrawerProps) {
  const [payload, setPayload] = useState<{
    species: any
    genus: any
    varieties: any[]
    commonNames: any[]
    references: any[]
    photos: any[]
    notes: any[]
    locations: any[]
    nurseryStock: any[]
    contributors: any[]
    aiSummary: any
    siblingSpecies: any[]
  } | null>(null)
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!speciesId) {
      setPayload(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const load = async () => {
      try {
        const [speciesRes, filterRes] = await Promise.all([
          apiRequest(`/api/v1/plants/species/${speciesId}`),
          apiRequest('/api/v1/plants/filter-options').catch(() => null),
        ])

        if (cancelled) return

        setFilterOptions(filterRes || EMPTY_FILTER_OPTIONS)
        setPayload({
          species: speciesRes.species,
          genus: speciesRes.genus,
          varieties: speciesRes.varieties || [],
          commonNames: speciesRes.commonNames || [],
          references: speciesRes.references || [],
          photos: speciesRes.photos || [],
          notes: speciesRes.notes || [],
          locations: speciesRes.locations || [],
          nurseryStock: speciesRes.nurseryStock || [],
          contributors: speciesRes.contributors || [],
          aiSummary: speciesRes.aiSummary,
          siblingSpecies: speciesRes.siblingSpecies || [],
        })
      } catch (err: any) {
        if (cancelled) return
        setError(err?.message || 'Impossible de charger l\'espèce.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [speciesId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  if (!speciesId) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-stone-900/20 backdrop-blur-[2px] transition-opacity duration-300 ease-out"
        style={{ animation: 'nova-fade-in 0.2s ease-out both' }}
        onClick={onClose}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Fermer"
      />

      {/* Drawer panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col"
        style={{
          boxShadow: '-8px 0 32px -8px rgba(0,0,0,0.12), -16px 0 48px -16px rgba(0,0,0,0.08)',
          animation: 'species-drawer-slide 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="species-drawer-title"
      >
        <style>{`
          @keyframes species-drawer-slide {
            from { transform: translateX(100%); opacity: 0.8; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between gap-4 px-5 py-4 border-b border-stone-200 bg-stone-50/80">
          <h2 id="species-drawer-title" className="text-lg font-semibold text-stone-900 truncate">
            {payload?.species?.latinName || 'Fiche espèce'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors focus:outline-none focus:ring-2 focus:ring-[#AFBD00] focus:ring-offset-2"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-[#AFBD00]/30 border-t-[#AFBD00] rounded-full animate-spin" />
                <p className="text-sm text-stone-500">Chargement de la fiche…</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="rounded-2xl border border-red-200 bg-red-50/80 p-5 text-center">
                <p className="text-red-700 font-medium">{error}</p>
                <p className="text-sm text-red-600 mt-1">
                  L'espèce n'existe peut-être pas dans la base végétale.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 px-4 py-2 rounded-xl bg-red-100 text-red-800 text-sm font-medium hover:bg-red-200 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {!loading && !error && payload && (
            <div className="p-5 pb-8">
              <SpeciesDetail
                species={payload.species}
                genus={payload.genus}
                varieties={payload.varieties}
                commonNames={payload.commonNames}
                references={payload.references}
                photos={payload.photos}
                notes={payload.notes}
                plantLocations={payload.locations}
                nurseryStocks={payload.nurseryStock}
                contributors={payload.contributors}
                aiSummary={payload.aiSummary}
                filterOptions={filterOptions || EMPTY_FILTER_OPTIONS}
                siblingSpecies={payload.siblingSpecies}
                onSpeciesSelect={(id) => {
                  if (onSpeciesSelect) {
                    onSpeciesSelect(id)
                  } else {
                    onClose()
                  }
                }}
                onVarietySelect={() => onClose()}
                onGenusSelect={() => onClose()}
                onContributorSelect={() => onClose()}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
