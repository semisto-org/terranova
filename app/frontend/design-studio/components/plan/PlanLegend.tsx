import { LAYER_COLORS, LAYER_LABELS } from '../../types'
import type { PlantLayer } from '../../types'

const LAYERS: PlantLayer[] = ['canopy', 'sub-canopy', 'shrub', 'herbaceous', 'ground-cover', 'vine', 'root']

interface PlanLegendProps {
  visible: boolean
}

export function PlanLegend({ visible }: PlanLegendProps) {
  if (!visible) return null

  return (
    <div className="absolute bottom-4 left-4 z-20 rounded-xl bg-white/95 backdrop-blur-sm border border-stone-200 shadow-lg p-3">
      <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-2">
        Strates
      </p>
      <div className="space-y-1">
        {LAYERS.map((layer) => (
          <div key={layer} className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full border border-white shadow-sm shrink-0"
              style={{ backgroundColor: LAYER_COLORS[layer] }}
            />
            <span className="text-xs text-stone-700">{LAYER_LABELS[layer]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
