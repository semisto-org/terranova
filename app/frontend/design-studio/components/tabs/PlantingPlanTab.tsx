import { PlanEditor } from '../plan'
import type { PlantingPlan, PlantPalette, ScaleData } from '../../types'

interface PlantingPlanTabProps {
  plantingPlan: PlantingPlan | null
  palette: PlantPalette | null
  projectId: string
  onUploadPlanImage: (file: File) => void
  onSavePlanScaleData: (scaleData: ScaleData) => void
  onSavePlan: (values: { image_url: string; layout: string }) => void
  onExportPlan: (format: 'pdf' | 'image') => void
  onAddMarker: (values: {
    species_name: string
    x: number
    y: number
    palette_item_id?: string
  }) => void
  onMoveMarker: (markerId: string, values: { x: number; y: number }) => void
  onUpdateMarker: (markerId: string, values: { diameter_cm?: number | null }) => void
  onDeleteMarker: (markerId: string) => void
}

export function PlantingPlanTab({
  plantingPlan,
  palette,
  projectId,
  onUploadPlanImage,
  onSavePlanScaleData,
  onExportPlan,
  onAddMarker,
  onMoveMarker,
  onUpdateMarker,
  onDeleteMarker,
}: PlantingPlanTabProps) {
  return (
    <div className="h-[calc(100vh-12rem)]">
      <PlanEditor
        plan={plantingPlan}
        palette={palette}
        projectId={projectId}
        onUploadImage={onUploadPlanImage}
        onSaveScaleData={onSavePlanScaleData}
        onPlaceMarker={(x, y, paletteItemId) => {
          // Look up species name from palette
          const item = palette?.items.find((i) => i.id === paletteItemId)
          onAddMarker({
            species_name: item?.speciesName || 'Unknown',
            x,
            y,
            palette_item_id: paletteItemId,
          })
        }}
        onMoveMarker={(markerId, x, y) => onMoveMarker(markerId, { x, y })}
        onUpdateMarker={onUpdateMarker}
        onRemoveMarker={onDeleteMarker}
        onExportPlan={onExportPlan}
      />
    </div>
  )
}
