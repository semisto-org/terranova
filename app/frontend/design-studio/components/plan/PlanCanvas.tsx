import { useRef, useCallback, useState, useEffect } from 'react'
import { PlanMarker } from './PlanMarker'
import { MarkerPopup } from './MarkerPopup'
import { ScaleCalibrator } from './ScaleCalibrator'
import { MeasureTool, computePixelsPerCm } from './MeasureTool'
import { PlanLegend } from './PlanLegend'
import { LAYER_COLORS } from '../../types'
import type {
  PlantingPlan,
  PlantPalette,
  PlantMarker as PlantMarkerType,
  ScaleData,
  PlantLayer,
  PaletteItem,
} from '../../types'
import type { PlanMode } from './PlanMarker'

interface PlanCanvasProps {
  plan: PlantingPlan
  palette: PlantPalette | null
  mode: PlanMode
  activePaletteItemId: string | null
  zoom: number
  panOffset: { x: number; y: number }
  showLegend: boolean
  showCalibration: boolean
  onZoomChange: (zoom: number) => void
  onPanChange: (offset: { x: number; y: number }) => void
  onSaveScaleData: (scaleData: ScaleData) => void
  onSkipCalibration: () => void
  onPlaceMarker: (x: number, y: number, paletteItemId: string) => void
  onMoveMarker: (markerId: string, x: number, y: number) => void
  onUpdateMarker: (markerId: string, values: { diameter_cm?: number | null }) => void
  onRemoveMarker: (markerId: string) => void
}

export function PlanCanvas({
  plan,
  palette,
  mode,
  activePaletteItemId,
  zoom,
  panOffset,
  showLegend,
  showCalibration,
  onZoomChange,
  onPanChange,
  onSaveScaleData,
  onSkipCalibration,
  onPlaceMarker,
  onMoveMarker,
  onUpdateMarker,
  onRemoveMarker,
}: PlanCanvasProps) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const panDragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number; moved: boolean } | null>(null)
  const didPanRef = useRef(false)
  const [popupMarker, setPopupMarker] = useState<PlantMarkerType | null>(null)
  const [diameterEditMarker, setDiameterEditMarker] = useState<PlantMarkerType | null>(null)
  const [diameterValue, setDiameterValue] = useState('')
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  // Build a lookup from palette item ID to item
  const paletteItemMap = new Map<string, PaletteItem>()
  if (palette?.items) {
    for (const item of palette.items) {
      paletteItemMap.set(item.id, item)
    }
  }

  const getLayerForMarker = useCallback(
    (marker: PlantMarkerType): PlantLayer | null => {
      if (!marker.paletteItemId) return null
      return paletteItemMap.get(marker.paletteItemId)?.layer ?? null
    },
    [paletteItemMap]
  )

  // Track container size for measure tool
  useEffect(() => {
    if (!innerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    observer.observe(innerRef.current)
    return () => observer.disconnect()
  }, [])

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (showCalibration || mode === 'measure') return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.15 : 0.15
      onZoomChange(Math.max(0.5, Math.min(6, zoom + delta)))
    },
    [zoom, onZoomChange, showCalibration, mode]
  )

  // Double-click zoom
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (showCalibration || mode === 'measure') return
      e.preventDefault()
      if (zoom >= 5.5) {
        onZoomChange(1)
        onPanChange({ x: 0, y: 0 })
      } else {
        onZoomChange(Math.min(6, zoom * 2))
      }
    },
    [zoom, onZoomChange, onPanChange, showCalibration, mode]
  )

  // Pan (mouse drag on background) — works in all modes except calibration and measure
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (showCalibration || mode === 'measure') return
      if (e.button !== 0) return
      panDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
        moved: false,
      }

      const handleMouseMove = (me: MouseEvent) => {
        if (!panDragRef.current) return
        const dx = me.clientX - panDragRef.current.startX
        const dy = me.clientY - panDragRef.current.startY
        if (!panDragRef.current.moved && Math.hypot(dx, dy) > 5) {
          panDragRef.current.moved = true
        }
        if (panDragRef.current.moved) {
          onPanChange({
            x: panDragRef.current.startPanX + dx,
            y: panDragRef.current.startPanY + dy,
          })
        }
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        didPanRef.current = panDragRef.current?.moved ?? false
        panDragRef.current = null
        // Reset the flag after the click event fires (click comes after mouseup)
        requestAnimationFrame(() => { didPanRef.current = false })
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [mode, panOffset, onPanChange, showCalibration]
  )

  // Click on canvas to place marker
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (showCalibration) return
      if (mode !== 'placement' || !activePaletteItemId) return
      if (didPanRef.current) return

      const rect = innerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        onPlaceMarker(x, y, activePaletteItemId)
      }
    },
    [mode, activePaletteItemId, onPlaceMarker, showCalibration]
  )

  // Marker drag end: compute normalized delta
  const handleMarkerDragEnd = useCallback(
    (markerId: string, dxPx: number, dyPx: number) => {
      if (!innerRef.current) return
      const rect = innerRef.current.getBoundingClientRect()
      const marker = plan.markers.find((m) => m.id === markerId)
      if (!marker) return
      const newX = Math.max(0, Math.min(1, marker.x + dxPx / rect.width))
      const newY = Math.max(0, Math.min(1, marker.y + dyPx / rect.height))
      onMoveMarker(markerId, newX, newY)
    },
    [plan.markers, onMoveMarker]
  )

  // Marker click
  const handleMarkerClick = useCallback(
    (marker: PlantMarkerType) => {
      if (mode === 'info') {
        setPopupMarker(marker)
        setDiameterEditMarker(null)
      } else if (mode === 'dimensions') {
        setDiameterEditMarker(marker)
        setDiameterValue(marker.diameterCm ? String(marker.diameterCm) : '')
        setPopupMarker(null)
      }
    },
    [mode]
  )

  const handleDiameterSave = useCallback(() => {
    if (!diameterEditMarker) return
    const cm = diameterValue ? Math.max(0, Number(diameterValue)) : null
    onUpdateMarker(diameterEditMarker.id, { diameter_cm: cm || null })
    setDiameterEditMarker(null)
  }, [diameterEditMarker, diameterValue, onUpdateMarker])

  const containerRect = innerRef.current?.getBoundingClientRect()

  // Compute pixels per cm for diameter circles
  const pixelsPerCm = plan.scaleData && containerSize.width > 0
    ? computePixelsPerCm(plan.scaleData, containerSize.width, containerSize.height)
    : null

  return (
    <div
      ref={outerRef}
      className="relative flex-1 overflow-hidden bg-stone-900 rounded-xl"
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onClick={handleCanvasClick}
      style={{
        cursor: showCalibration
          ? 'default'
          : mode === 'measure'
            ? 'crosshair'
            : mode === 'placement' && activePaletteItemId
              ? 'crosshair'
              : zoom > 1 ? 'grab' : 'default',
      }}
    >
      {/* Zoomable/pannable inner container */}
      <div
        ref={innerRef}
        className="relative origin-top-left"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Background image */}
        <img
          src={plan.imageUrl}
          alt="Plan de plantation"
          className="block w-full select-none pointer-events-none"
          draggable={false}
        />

        {/* Diameter circles (SVG overlay, always visible) */}
        {pixelsPerCm && pixelsPerCm > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            {plan.markers
              .filter((m) => m.diameterCm && m.diameterCm > 0)
              .map((marker) => {
                const radiusCm = marker.diameterCm! / 2
                const radiusPx = radiusCm * pixelsPerCm
                // Convert to percentage of container
                const radiusPct = containerSize.width > 0 ? (radiusPx / containerSize.width) * 100 : 0
                const layer = getLayerForMarker(marker)
                const color = layer ? LAYER_COLORS[layer] : '#78716C'
                return (
                  <circle
                    key={`dim-${marker.id}`}
                    cx={`${marker.x * 100}%`}
                    cy={`${marker.y * 100}%`}
                    r={`${radiusPct}%`}
                    fill={color}
                    fillOpacity={0.25}
                    stroke={color}
                    strokeOpacity={0.6}
                    strokeWidth={2}
                    strokeDasharray="6 3"
                  />
                )
              })}
          </svg>
        )}

        {/* Scale line (always visible if scaleData exists) */}
        {plan.scaleData && !showCalibration && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line
              x1={`${plan.scaleData.point1.x * 100}%`}
              y1={`${plan.scaleData.point1.y * 100}%`}
              x2={`${plan.scaleData.point2.x * 100}%`}
              y2={`${plan.scaleData.point2.y * 100}%`}
              stroke="#AFBD00"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              strokeOpacity={0.5}
            />
          </svg>
        )}

        {/* Plant markers */}
        {plan.markers.map((marker) => (
          <PlanMarker
            key={marker.id}
            marker={marker}
            layer={getLayerForMarker(marker)}
            mode={mode}
            zoom={zoom}
            onDragEnd={handleMarkerDragEnd}
            onClick={handleMarkerClick}
          />
        ))}

        {/* Info popup */}
        {popupMarker && mode === 'info' && containerRect && (
          <MarkerPopup
            marker={popupMarker}
            layer={getLayerForMarker(popupMarker)}
            position={{ x: popupMarker.x, y: popupMarker.y }}
            containerRect={containerRect}
            onRemove={(id) => {
              onRemoveMarker(id)
              setPopupMarker(null)
            }}
            onClose={() => setPopupMarker(null)}
          />
        )}

        {/* Diameter edit popover */}
        {diameterEditMarker && mode === 'dimensions' && (
          <div
            className="absolute z-30 rounded-xl bg-white border border-stone-200 shadow-xl p-3"
            style={{
              left: `calc(${diameterEditMarker.x * 100}% + 20px)`,
              top: `calc(${diameterEditMarker.y * 100}% - 8px)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-medium text-stone-700 mb-2">
              #{diameterEditMarker.number} · {diameterEditMarker.speciesName}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={diameterValue}
                onChange={(e) => setDiameterValue(e.target.value)}
                placeholder="Diamètre"
                className="w-20 rounded-lg border border-stone-300 px-2 py-1 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleDiameterSave()
                  if (e.key === 'Escape') setDiameterEditMarker(null)
                }}
              />
              <span className="text-xs text-stone-500">cm</span>
              <button
                onClick={handleDiameterSave}
                className="rounded-lg bg-[#AFBD00] px-2 py-1 text-xs font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Scale calibrator overlay */}
        {showCalibration && (
          <ScaleCalibrator onSave={onSaveScaleData} onSkip={onSkipCalibration} />
        )}

        {/* Measure tool overlay */}
        {mode === 'measure' && plan.scaleData && containerSize.width > 0 && (
          <MeasureTool
            scaleData={plan.scaleData}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
          />
        )}
      </div>

      {/* Legend (positioned in outer container so it doesn't move with zoom/pan) */}
      <PlanLegend visible={showLegend} />
    </div>
  )
}
