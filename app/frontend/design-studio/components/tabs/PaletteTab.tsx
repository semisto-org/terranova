import { useState } from 'react'
import { ExternalLink, Palette, Sprout, Trash2 } from 'lucide-react'
import type { PlantPalette, PaletteItem, PlantLayer } from '../../types'
import { EmptyState } from '../shared/EmptyState'
import { SpeciesDrawer } from '../SpeciesDrawer'

const LAYERS: PlantLayer[] = [
  'canopy',
  'sub-canopy',
  'shrub',
  'herbaceous',
  'ground-cover',
  'vine',
  'root',
]

const layerLabels: Record<PlantLayer, string> = {
  canopy: 'Canopée',
  'sub-canopy': 'Sous-canopée',
  shrub: 'Arbustes',
  herbaceous: 'Herbacées',
  'ground-cover': 'Couvre-sol',
  vine: 'Lianes',
  root: 'Racines',
}

interface PaletteTabProps {
  plantPalette: PlantPalette | null
  onDeletePaletteItem: (id: string) => void
  onImportPlantPalette: (paletteId: string) => void
  onExportToPlantDB?: () => void
}

export function PaletteTab({
  plantPalette,
  onDeletePaletteItem,
  onImportPlantPalette,
  onExportToPlantDB,
}: PaletteTabProps) {
  const [speciesDrawerId, setSpeciesDrawerId] = useState<string | null>(null)
  const items = plantPalette?.items ?? []
  const totals = plantPalette?.totals

  const byLayer = LAYERS.reduce(
    (acc, layer) => {
      acc[layer] = items.filter((i) => i.layer === layer)
      return acc
    },
    {} as Record<PlantLayer, PaletteItem[]>
  )

  const showTotalsBlock =
    (totals && (totals.totalPlants > 0 || totals.totalCost > 0)) ||
    (onExportToPlantDB && items.length > 0)

  return (
    <div className="space-y-6">
      {showTotalsBlock && (
        <div className="rounded-2xl border border-stone-200 bg-[#e1e6d8]/50 p-4 flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap gap-6">
            {totals && (totals.totalPlants > 0 || totals.totalCost > 0) && (
              <>
                <span className="text-sm font-medium text-stone-800">
                  Total : <strong>{totals.totalPlants}</strong> plants
                </span>
                <span className="text-sm font-medium text-stone-800">
                  Coût total :{' '}
                  <strong>
                    {Number(totals.totalCost).toLocaleString('fr-BE')} €
                  </strong>
                </span>
              </>
            )}
          </div>
          {onExportToPlantDB && items.length > 0 && (
            <button
              type="button"
              onClick={onExportToPlantDB}
              className="inline-flex items-center gap-2 rounded-xl border border-[#AFBD00]/30 bg-[#AFBD00]/10 px-4 py-2 text-sm font-medium text-[#7a8200] hover:bg-[#AFBD00]/20 transition-colors shrink-0"
            >
              <Sprout className="w-4 h-4" />
              Enrichir dans Plant Database
            </button>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<Palette className="w-10 h-10 text-stone-400" />}
          title="Palette vide"
          description="Importez une palette depuis la base végétale."
        />
      ) : (
        <div className="space-y-6">
          {LAYERS.filter((layer) => byLayer[layer].length > 0).map((layer) => (
            <div
              key={layer}
              className="rounded-2xl border border-stone-200 overflow-hidden"
            >
              <div className="px-4 py-2 bg-stone-50 border-b border-stone-200">
                <h4 className="text-sm font-semibold text-stone-700">
                  {layerLabels[layer]}
                </h4>
              </div>
              <ul className="divide-y divide-stone-100">
                {byLayer[layer].map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-stone-50/50"
                  >
                    <div className="min-w-0 flex-1">
                      {item.linkedToSpecies ? (
                        <button
                          type="button"
                          onClick={() => setSpeciesDrawerId(item.speciesId)}
                          className="group inline-flex items-center gap-1.5 font-medium text-stone-900 hover:text-[#AFBD00] transition-colors text-left"
                        >
                          <span className="underline decoration-[#AFBD00]/40 decoration-dotted underline-offset-2 group-hover:decoration-[#AFBD00]">
                            {item.speciesName}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#AFBD00] flex-shrink-0" />
                        </button>
                      ) : (
                        <p className="font-medium text-stone-900">
                          {item.speciesName}
                        </p>
                      )}
                      {item.commonName && (
                        <p className="text-xs text-stone-500 mt-0.5">
                          {item.commonName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-stone-600">
                        x{item.quantity} · {Number(item.unitPrice).toLocaleString('fr-BE')} €
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeletePaletteItem(item.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <SpeciesDrawer
        speciesId={speciesDrawerId}
        onClose={() => setSpeciesDrawerId(null)}
        onSpeciesSelect={(id) => setSpeciesDrawerId(id)}
      />
    </div>
  )
}
