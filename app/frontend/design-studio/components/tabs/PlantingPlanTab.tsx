import { useState } from 'react'
import { MapPin, Image as ImageIcon, Plus, Move, Trash2, Download } from 'lucide-react'
import type { PlantingPlan } from '../../types'
import { EmptyState } from '../shared/EmptyState'

interface PlantingPlanTabProps {
  plantingPlan: PlantingPlan | null
  onSavePlan: (values: { image_url: string; layout: string }) => void
  onExportPlan: (format: 'pdf' | 'image') => void
  onAddMarker: (values: {
    species_name: string
    x: number
    y: number
    palette_item_id?: string
  }) => void
  onMoveMarker: (markerId: string, values: { x: number; y: number }) => void
  onDeleteMarker: (markerId: string) => void
}

export function PlantingPlanTab({
  plantingPlan,
  onSavePlan,
  onExportPlan,
  onAddMarker,
  onMoveMarker,
  onDeleteMarker,
}: PlantingPlanTabProps) {
  const [planForm, setPlanForm] = useState({
    image_url: plantingPlan?.imageUrl ?? '',
    layout: plantingPlan?.layout ?? 'split-3-4-1-4',
  })
  const [markerForm, setMarkerForm] = useState({
    species_name: '',
    x: 0.5,
    y: 0.5,
    palette_item_id: '',
  })

  const markers = plantingPlan?.markers ?? []
  const imageUrl = plantingPlan?.imageUrl || planForm.image_url

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault()
    onSavePlan(planForm)
  }

  const handleAddMarker = (e: React.FormEvent) => {
    e.preventDefault()
    onAddMarker({
      species_name: markerForm.species_name,
      x: markerForm.x,
      y: markerForm.y,
      palette_item_id: markerForm.palette_item_id || undefined,
    })
    setMarkerForm({ species_name: '', x: 0.5, y: 0.5, palette_item_id: '' })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#AFBD00]" />
          Image du plan
        </h3>
        <form onSubmit={handleSavePlan} className="grid sm:grid-cols-3 gap-4">
          <input
            type="url"
            placeholder="URL de l’image (orthophoto, plan…)"
            value={planForm.image_url}
            onChange={(e) =>
              setPlanForm((p) => ({ ...p, image_url: e.target.value }))
            }
            className="sm:col-span-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <select
            value={planForm.layout}
            onChange={(e) =>
              setPlanForm((p) => ({ ...p, layout: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          >
            <option value="split-3-4-1-4">Split 3/4 - 1/4</option>
            <option value="full">Plein</option>
          </select>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
            >
              Sauvegarder le plan
            </button>
          </div>
        </form>
      </div>

      {imageUrl && (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden bg-stone-100 dark:bg-stone-800">
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="block p-4 text-sm text-[#5B5781] dark:text-[#9B94BB] hover:underline"
          >
            Voir l’image du plan →
          </a>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onExportPlan('pdf')}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300 dark:border-stone-600 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
        >
          <Download className="w-4 h-4" />
          Exporter PDF
        </button>
        <button
          type="button"
          onClick={() => onExportPlan('image')}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300 dark:border-stone-600 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
        >
          <Download className="w-4 h-4" />
          Exporter image
        </button>
      </div>

      <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#AFBD00]" />
          Ajouter un marqueur
        </h3>
        <form
          onSubmit={handleAddMarker}
          className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <input
            type="text"
            placeholder="Espèce"
            value={markerForm.species_name}
            onChange={(e) =>
              setMarkerForm((p) => ({ ...p, species_name: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            required
          />
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            placeholder="X (0-1)"
            value={markerForm.x}
            onChange={(e) =>
              setMarkerForm((p) => ({ ...p, x: Number(e.target.value || 0) }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            placeholder="Y (0-1)"
            value={markerForm.y}
            onChange={(e) =>
              setMarkerForm((p) => ({ ...p, y: Number(e.target.value || 0) }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Palette item ID (opt.)"
            value={markerForm.palette_item_id}
            onChange={(e) =>
              setMarkerForm((p) => ({ ...p, palette_item_id: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
          >
            Ajouter marqueur
          </button>
        </form>
      </div>

      {markers.length === 0 ? (
        <EmptyState
          icon={<MapPin className="w-10 h-10 text-stone-400" />}
          title="Aucun marqueur"
          description="Ajoutez des marqueurs pour positionner les plants sur le plan."
        />
      ) : (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
          <ul className="divide-y divide-stone-100 dark:divide-stone-700">
            {markers.map((marker) => (
              <li
                key={marker.id}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30"
              >
                <span className="font-medium text-stone-900 dark:text-stone-100">
                  #{marker.number} · {marker.speciesName}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  ({marker.x}, {marker.y})
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const x = window.prompt('X (0..1)', String(marker.x))
                      const y = window.prompt('Y (0..1)', String(marker.y))
                      if (x != null && y != null)
                        onMoveMarker(marker.id, {
                          x: Number(x),
                          y: Number(y),
                        })
                    }}
                    className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg transition-colors"
                    title="Déplacer"
                  >
                    <Move className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteMarker(marker.id)}
                    className="p-1.5 text-stone-500 hover:text-red-600 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
