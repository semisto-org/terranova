import { useRef, useCallback } from 'react'
import { LAYER_COLORS } from '../../types'
import type { PlantMarker as PlantMarkerType, PlantLayer } from '../../types'

export type PlanMode = 'placement' | 'info' | 'measure' | 'dimensions'

interface PlanMarkerProps {
  marker: PlantMarkerType
  layer: PlantLayer | null
  mode: PlanMode
  zoom: number
  onDragEnd?: (markerId: string, dx: number, dy: number) => void
  onClick?: (marker: PlantMarkerType) => void
}

export function PlanMarker({ marker, layer, mode, zoom, onDragEnd, onClick }: PlanMarkerProps) {
  const dragRef = useRef<{ startX: number; startY: number; dragging: boolean } | null>(null)
  const elRef = useRef<HTMLDivElement>(null)

  const color = layer ? LAYER_COLORS[layer] : '#78716C'
  const isDraggable = mode === 'placement'
  const isClickable = mode === 'info' || mode === 'dimensions'

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggable) return
      e.stopPropagation()
      e.preventDefault()
      dragRef.current = { startX: e.clientX, startY: e.clientY, dragging: false }

      const handleMouseMove = (me: MouseEvent) => {
        if (!dragRef.current) return
        const dx = me.clientX - dragRef.current.startX
        const dy = me.clientY - dragRef.current.startY
        if (!dragRef.current.dragging && Math.hypot(dx, dy) > 3) {
          dragRef.current.dragging = true
        }
        if (dragRef.current.dragging && elRef.current) {
          elRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
        }
      }

      const handleMouseUp = (me: MouseEvent) => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        if (dragRef.current?.dragging && onDragEnd) {
          const dx = (me.clientX - dragRef.current.startX) / zoom
          const dy = (me.clientY - dragRef.current.startY) / zoom
          onDragEnd(marker.id, dx, dy)
        }
        if (elRef.current) {
          elRef.current.style.transform = 'translate(-50%, -50%)'
        }
        dragRef.current = null
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [isDraggable, marker.id, onDragEnd, zoom]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isClickable && onClick) {
        onClick(marker)
      }
    },
    [isClickable, onClick, marker]
  )

  return (
    <div
      ref={elRef}
      className="absolute z-10 select-none"
      style={{
        left: `${marker.x * 100}%`,
        top: `${marker.y * 100}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <div
        className="flex items-center justify-center rounded-full border-2 border-white shadow-md text-white font-bold"
        style={{
          width: 28,
          height: 28,
          backgroundColor: color,
          fontSize: 11,
          cursor: isDraggable ? 'grab' : isClickable ? 'pointer' : 'default',
        }}
      >
        {marker.number}
      </div>
    </div>
  )
}
