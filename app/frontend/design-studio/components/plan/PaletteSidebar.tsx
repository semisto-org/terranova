import { useMemo } from 'react'
import { Check, Minus, AlertTriangle, X } from 'lucide-react'
import { LAYER_COLORS, LAYER_LABELS } from '../../types'
import type { PlantPalette, PaletteItem, PlantMarker, PlantLayer } from '../../types'

const LAYERS: PlantLayer[] = ['canopy', 'sub-canopy', 'shrub', 'herbaceous', 'ground-cover', 'vine', 'root']

interface PaletteSidebarProps {
  palette: PlantPalette | null
  markers: PlantMarker[]
  activePaletteItemId: string | null
  onSelectItem: (itemId: string | null) => void
}

function PlacementBadge({ placed, total }: { placed: number; total: number }) {
  if (placed === 0) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-stone-400">
        <Minus className="w-3 h-3" />
        0/{total}
      </span>
    )
  }
  if (placed >= total) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-green-600">
        <Check className="w-3 h-3" />
        {placed}/{total}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-[10px] text-amber-600">
      <AlertTriangle className="w-3 h-3" />
      {placed}/{total}
    </span>
  )
}

export function PaletteSidebar({ palette, markers, activePaletteItemId, onSelectItem }: PaletteSidebarProps) {
  const items = palette?.items ?? []

  const placedCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const m of markers) {
      if (m.paletteItemId) {
        counts[m.paletteItemId] = (counts[m.paletteItemId] || 0) + 1
      }
    }
    return counts
  }, [markers])

  const byLayer = useMemo(() => {
    const grouped: Partial<Record<PlantLayer, PaletteItem[]>> = {}
    for (const item of items) {
      if (!grouped[item.layer]) grouped[item.layer] = []
      grouped[item.layer]!.push(item)
    }
    return grouped
  }, [items])

  const totalPlants = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPlaced = Object.values(placedCounts).reduce((sum, c) => sum + c, 0)

  return (
    <div className="flex flex-col h-full border-l border-stone-200 bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">Palette</h3>
          <span className="text-xs text-stone-500">{totalPlaced}/{totalPlants}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#AFBD00] transition-all"
            style={{ width: totalPlants > 0 ? `${Math.min((totalPlaced / totalPlants) * 100, 100)}%` : '0%' }}
          />
        </div>
      </div>

      {/* Active selection indicator */}
      {activePaletteItemId && (
        <div className="px-4 py-2 bg-[#AFBD00]/10 border-b border-[#AFBD00]/20 flex items-center justify-between">
          <span className="text-xs font-medium text-stone-700">
            Placement actif
          </span>
          <button
            onClick={() => onSelectItem(null)}
            className="p-0.5 text-stone-500 hover:text-stone-700 rounded transition-colors"
            title="Annuler la sélection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Plant list by layer */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-stone-400">Palette vide</p>
            <p className="text-[10px] text-stone-400 mt-1">Ajoutez des plantes dans l'onglet Palette</p>
          </div>
        ) : (
          LAYERS.filter((l) => byLayer[l]?.length).map((layer) => (
            <div key={layer}>
              <div className="px-4 py-1.5 bg-stone-50 border-b border-stone-100 flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: LAYER_COLORS[layer] }}
                />
                <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                  {LAYER_LABELS[layer]}
                </span>
              </div>
              {byLayer[layer]!.map((item) => {
                const placed = placedCounts[item.id] || 0
                const isActive = activePaletteItemId === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectItem(isActive ? null : item.id)}
                    className={`w-full text-left px-4 py-2 flex items-center gap-2 text-sm transition-colors border-b border-stone-50 ${
                      isActive
                        ? 'bg-[#AFBD00]/10 ring-1 ring-inset ring-[#AFBD00]/30'
                        : 'hover:bg-stone-50'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: LAYER_COLORS[item.layer] }}
                    />
                    <span className="flex-1 min-w-0 truncate text-xs text-stone-700">
                      {item.commonName || item.speciesName}
                    </span>
                    <PlacementBadge placed={placed} total={item.quantity} />
                  </button>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
