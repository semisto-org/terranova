import { useState, useCallback, useEffect, useRef } from 'react'
import {
  MousePointer2, Info, Ruler, Move, ZoomIn, ZoomOut, Maximize2,
  Undo2, Redo2, Map as MapIcon, Circle,
} from 'lucide-react'
import { PlanSetupView } from './PlanSetupView'
import { PlanCanvas } from './PlanCanvas'
import { PaletteSidebar } from './PaletteSidebar'
import type { PlantingPlan, PlantPalette, ScaleData, PlantMarker } from '../../types'
import type { PlanMode } from './PlanMarker'

interface UndoAction {
  type: 'place' | 'move' | 'delete' | 'diameter'
  markerId: string
  // For move: previous position
  prevX?: number
  prevY?: number
  newX?: number
  newY?: number
  // For place: the marker data (to be able to delete on undo)
  marker?: PlantMarker
  // For delete: the marker data (to be able to re-create on undo)
  deletedMarker?: PlantMarker
  // For diameter: previous value
  prevDiameterCm?: number | null
  newDiameterCm?: number | null
}

interface PlanEditorProps {
  plan: PlantingPlan | null
  palette: PlantPalette | null
  projectId: string
  onUploadImage: (file: File) => void
  onSaveScaleData: (scaleData: ScaleData) => void
  onPlaceMarker: (x: number, y: number, paletteItemId: string) => void
  onMoveMarker: (markerId: string, x: number, y: number) => void
  onUpdateMarker: (markerId: string, values: { diameter_cm?: number | null }) => void
  onRemoveMarker: (markerId: string) => void
  onExportPlan: (format: 'pdf' | 'image') => void
}

export function PlanEditor({
  plan,
  palette,
  projectId,
  onUploadImage,
  onSaveScaleData,
  onPlaceMarker,
  onMoveMarker,
  onUpdateMarker,
  onRemoveMarker,
  onExportPlan,
}: PlanEditorProps) {
  const [mode, setMode] = useState<PlanMode>('placement')
  const [activePaletteItemId, setActivePaletteItemId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [showLegend, setShowLegend] = useState(false)
  const [showCalibration, setShowCalibration] = useState(false)
  const [undoStack, setUndoStack] = useState<UndoAction[]>([])
  const [redoStack, setRedoStack] = useState<UndoAction[]>([])
  const markersRef = useRef<PlantMarker[]>([])

  // Keep markers ref in sync for undo lookups
  useEffect(() => {
    if (plan?.markers) markersRef.current = plan.markers
  }, [plan?.markers])

  // Show calibration if image exists but no scaleData
  useEffect(() => {
    if (plan?.imageUrl && !plan.scaleData) {
      setShowCalibration(true)
    }
  }, [plan?.imageUrl, plan?.scaleData])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      // Ctrl+Z / Cmd+Z: Undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
      // Ctrl+Shift+Z / Cmd+Shift+Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        handleRedo()
      }
      // Escape: deselect active item
      if (e.key === 'Escape') {
        setActivePaletteItemId(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undoStack, redoStack])

  // Wrapped callbacks that track undo
  const handlePlaceMarker = useCallback(
    (x: number, y: number, paletteItemId: string) => {
      onPlaceMarker(x, y, paletteItemId)
      // We'll track the undo after the markers update via effect
      // For simplicity, push a "place" action with just the coordinates
      // The marker ID will be the newest marker after refresh
      setUndoStack((prev) => [...prev, { type: 'place', markerId: '__pending__' }])
      setRedoStack([])
    },
    [onPlaceMarker]
  )

  // Update pending undo marker ID when markers change after placement
  useEffect(() => {
    setUndoStack((prev) => {
      const last = prev[prev.length - 1]
      if (last?.type === 'place' && last.markerId === '__pending__' && plan?.markers.length) {
        const newest = plan.markers[plan.markers.length - 1]
        if (newest) {
          return [...prev.slice(0, -1), { ...last, markerId: newest.id, marker: newest }]
        }
      }
      return prev
    })
  }, [plan?.markers])

  const handleMoveMarker = useCallback(
    (markerId: string, newX: number, newY: number) => {
      const prev = markersRef.current.find((m) => m.id === markerId)
      if (prev) {
        setUndoStack((s) => [
          ...s,
          { type: 'move', markerId, prevX: prev.x, prevY: prev.y, newX, newY },
        ])
        setRedoStack([])
      }
      onMoveMarker(markerId, newX, newY)
    },
    [onMoveMarker]
  )

  const handleUpdateMarker = useCallback(
    (markerId: string, values: { diameter_cm?: number | null }) => {
      const prev = markersRef.current.find((m) => m.id === markerId)
      if (prev) {
        setUndoStack((s) => [
          ...s,
          { type: 'diameter', markerId, prevDiameterCm: prev.diameterCm, newDiameterCm: values.diameter_cm ?? null },
        ])
        setRedoStack([])
      }
      onUpdateMarker(markerId, values)
    },
    [onUpdateMarker]
  )

  const handleRemoveMarker = useCallback(
    (markerId: string) => {
      const marker = markersRef.current.find((m) => m.id === markerId)
      if (marker) {
        setUndoStack((s) => [...s, { type: 'delete', markerId, deletedMarker: { ...marker } }])
        setRedoStack([])
      }
      onRemoveMarker(markerId)
    },
    [onRemoveMarker]
  )

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev
      const action = prev[prev.length - 1]
      const rest = prev.slice(0, -1)

      switch (action.type) {
        case 'move':
          if (action.prevX != null && action.prevY != null) {
            onMoveMarker(action.markerId, action.prevX, action.prevY)
          }
          break
        case 'place':
          onRemoveMarker(action.markerId)
          break
        case 'delete':
          if (action.deletedMarker) {
            onPlaceMarker(
              action.deletedMarker.x,
              action.deletedMarker.y,
              action.deletedMarker.paletteItemId || ''
            )
          }
          break
        case 'diameter':
          onUpdateMarker(action.markerId, { diameter_cm: action.prevDiameterCm })
          break
      }

      setRedoStack((r) => [...r, action])
      return rest
    })
  }, [onMoveMarker, onRemoveMarker, onPlaceMarker, onUpdateMarker])

  const handleRedo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev
      const action = prev[prev.length - 1]
      const rest = prev.slice(0, -1)

      switch (action.type) {
        case 'move':
          if (action.newX != null && action.newY != null) {
            onMoveMarker(action.markerId, action.newX, action.newY)
          }
          break
        case 'place':
          if (action.marker) {
            onPlaceMarker(action.marker.x, action.marker.y, action.marker.paletteItemId || '')
          }
          break
        case 'delete':
          onRemoveMarker(action.markerId)
          break
        case 'diameter':
          onUpdateMarker(action.markerId, { diameter_cm: action.newDiameterCm })
          break
      }

      setUndoStack((u) => [...u, action])
      return rest
    })
  }, [onMoveMarker, onRemoveMarker, onPlaceMarker, onUpdateMarker])

  const handleSaveScaleData = useCallback(
    (scaleData: ScaleData) => {
      onSaveScaleData(scaleData)
      setShowCalibration(false)
    },
    [onSaveScaleData]
  )

  const handleFitToView = useCallback(() => {
    setZoom(1)
    setPanOffset({ x: 0, y: 0 })
  }, [])

  // If no plan or no image, show setup
  if (!plan?.imageUrl) {
    return (
      <div className="p-6">
        <PlanSetupView onUploadImage={onUploadImage} />
      </div>
    )
  }

  const modes: Array<{ id: PlanMode; label: string; icon: typeof Move; disabled?: boolean }> = [
    { id: 'placement', label: 'Placement', icon: Move },
    { id: 'info', label: 'Info', icon: Info },
    { id: 'dimensions', label: 'Dimensions', icon: Circle, disabled: !plan.scaleData },
    { id: 'measure', label: 'Mesure', icon: Ruler, disabled: !plan.scaleData },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-stone-200 bg-white">
        {/* Mode buttons */}
        <div className="flex items-center gap-0.5 rounded-lg bg-stone-100 p-0.5">
          {modes.map(({ id, label, icon: Icon, disabled }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              disabled={disabled}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === id
                  ? 'bg-white text-stone-900 shadow-sm'
                  : disabled
                    ? 'text-stone-300 cursor-not-allowed'
                    : 'text-stone-600 hover:text-stone-900'
              }`}
              title={label}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-stone-200 mx-2" />

        {/* Zoom controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="p-1.5 text-stone-500 hover:text-stone-900 rounded-md hover:bg-stone-100 transition-colors"
            title="Dézoomer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-stone-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(6, zoom + 0.25))}
            className="p-1.5 text-stone-500 hover:text-stone-900 rounded-md hover:bg-stone-100 transition-colors"
            title="Zoomer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitToView}
            className="p-1.5 text-stone-500 hover:text-stone-900 rounded-md hover:bg-stone-100 transition-colors"
            title="Voir tout"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-stone-200 mx-2" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="p-1.5 text-stone-500 hover:text-stone-900 rounded-md hover:bg-stone-100 disabled:text-stone-300 disabled:cursor-not-allowed transition-colors"
            title="Annuler (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-1.5 text-stone-500 hover:text-stone-900 rounded-md hover:bg-stone-100 disabled:text-stone-300 disabled:cursor-not-allowed transition-colors"
            title="Refaire (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-stone-200 mx-2" />

        {/* Legend toggle */}
        <button
          onClick={() => setShowLegend(!showLegend)}
          className={`p-1.5 rounded-md transition-colors ${
            showLegend
              ? 'text-[#AFBD00] bg-[#AFBD00]/10'
              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
          }`}
          title="Légende"
        >
          <MapIcon className="w-4 h-4" />
        </button>

        {/* Re-calibrate scale */}
        <button
          onClick={() => setShowCalibration(true)}
          className="p-1.5 text-stone-500 hover:text-stone-900 rounded-md hover:bg-stone-100 transition-colors"
          title="Recalibrer l'échelle"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        {/* Marker count */}
        <span className="text-xs text-stone-400">
          {plan.markers.length} marqueur{plan.markers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Main area: Canvas + Sidebar */}
      <div className="flex flex-1 min-h-0">
        <PlanCanvas
          plan={plan}
          palette={palette}
          mode={mode}
          activePaletteItemId={activePaletteItemId}
          zoom={zoom}
          panOffset={panOffset}
          showLegend={showLegend}
          showCalibration={showCalibration}
          onZoomChange={setZoom}
          onPanChange={setPanOffset}
          onSaveScaleData={handleSaveScaleData}
          onSkipCalibration={() => setShowCalibration(false)}
          onPlaceMarker={handlePlaceMarker}
          onMoveMarker={handleMoveMarker}
          onUpdateMarker={handleUpdateMarker}
          onRemoveMarker={handleRemoveMarker}
        />
        <div className="w-72 shrink-0">
          <PaletteSidebar
            palette={palette}
            markers={plan.markers}
            activePaletteItemId={activePaletteItemId}
            onSelectItem={setActivePaletteItemId}
          />
        </div>
      </div>
    </div>
  )
}
