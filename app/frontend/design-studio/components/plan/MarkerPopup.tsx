import { useEffect, useRef } from 'react'
import { Trash2, X } from 'lucide-react'
import { LAYER_COLORS, LAYER_LABELS } from '../../types'
import type { PlantMarker, PlantLayer } from '../../types'

interface MarkerPopupProps {
  marker: PlantMarker
  layer: PlantLayer | null
  position: { x: number; y: number }
  containerRect: DOMRect
  onRemove: (markerId: string) => void
  onClose: () => void
}

export function MarkerPopup({ marker, layer, position, containerRect, onRemove, onClose }: MarkerPopupProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClick, true)
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClick, true)
    }
  }, [onClose])

  // Position the popup to the right of the marker, flipping left if too close to right edge
  const pxX = position.x * containerRect.width
  const pxY = position.y * containerRect.height
  const flipX = pxX > containerRect.width * 0.7
  const flipY = pxY > containerRect.height * 0.7

  return (
    <div
      ref={ref}
      className="absolute z-30 w-56 rounded-xl bg-white border border-stone-200 shadow-xl p-3"
      style={{
        left: flipX ? undefined : `calc(${position.x * 100}% + 20px)`,
        right: flipX ? `calc(${(1 - position.x) * 100}% + 20px)` : undefined,
        top: flipY ? undefined : `calc(${position.y * 100}% - 8px)`,
        bottom: flipY ? `calc(${(1 - position.y) * 100}% - 8px)` : undefined,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-400">#{marker.number}</span>
          {layer && (
            <span
              className="w-3 h-3 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: LAYER_COLORS[layer] }}
              title={LAYER_LABELS[layer]}
            />
          )}
        </div>
        <button
          onClick={onClose}
          className="p-0.5 text-stone-400 hover:text-stone-600 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-sm font-semibold text-stone-900 leading-tight">{marker.speciesName}</p>
      {marker.varietyName && (
        <p className="text-xs text-stone-500 italic mt-0.5">{marker.varietyName}</p>
      )}
      {layer && (
        <p className="text-[10px] text-stone-400 mt-1">{LAYER_LABELS[layer]}</p>
      )}
      {marker.diameterCm && (
        <p className="text-[10px] text-stone-400">Diamètre : {marker.diameterCm} cm</p>
      )}

      <button
        onClick={() => onRemove(marker.id)}
        className="mt-3 flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Retirer du plan
      </button>
    </div>
  )
}
