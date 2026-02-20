import { useState } from 'react'
import { Palette, Plus, Trash2, Download } from 'lucide-react'
import type { PlantPalette, PaletteItem, PlantLayer } from '../../types'
import { EmptyState } from '../shared/EmptyState'

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
  onAddPaletteItem: (values: {
    species_id: string
    species_name: string
    common_name?: string
    layer: PlantLayer
    quantity: number
    unit_price: number
    notes?: string
    harvest_months?: number[]
    harvest_products?: string[]
  }) => void
  onDeletePaletteItem: (id: string) => void
  onImportPlantPalette: (paletteId: string) => void
}

export function PaletteTab({
  plantPalette,
  onAddPaletteItem,
  onDeletePaletteItem,
  onImportPlantPalette,
}: PaletteTabProps) {
  const [form, setForm] = useState({
    species_id: '',
    species_name: '',
    common_name: '',
    layer: 'shrub' as PlantLayer,
    quantity: 1,
    unit_price: 0,
  })
  const [importId, setImportId] = useState('')

  const items = plantPalette?.items ?? []
  const totals = plantPalette?.totals

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddPaletteItem({
      species_id: form.species_id,
      species_name: form.species_name,
      common_name: form.common_name || undefined,
      layer: form.layer,
      quantity: form.quantity,
      unit_price: form.unit_price,
    })
    setForm((p) => ({ ...p, species_name: '', common_name: '' }))
  }

  const byLayer = LAYERS.reduce(
    (acc, layer) => {
      acc[layer] = items.filter((i) => i.layer === layer)
      return acc
    },
    {} as Record<PlantLayer, PaletteItem[]>
  )

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#AFBD00]" />
          Ajouter une espèce
        </h3>
        <form
          onSubmit={handleSubmit}
          className="grid sm:grid-cols-2 lg:grid-cols-7 gap-3"
        >
          <input
            type="text"
            placeholder="Species ID"
            value={form.species_id}
            onChange={(e) =>
              setForm((p) => ({ ...p, species_id: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            required
          />
          <input
            type="text"
            placeholder="Nom latin"
            value={form.species_name}
            onChange={(e) =>
              setForm((p) => ({ ...p, species_name: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            required
          />
          <input
            type="text"
            placeholder="Nom commun"
            value={form.common_name}
            onChange={(e) =>
              setForm((p) => ({ ...p, common_name: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <select
            value={form.layer}
            onChange={(e) =>
              setForm((p) => ({ ...p, layer: e.target.value as PlantLayer }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          >
            {LAYERS.map((l) => (
              <option key={l} value={l}>
                {layerLabels[l]}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            placeholder="Qté"
            value={form.quantity}
            onChange={(e) =>
              setForm((p) => ({ ...p, quantity: Number(e.target.value || 1) }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <input
            type="number"
            min={0}
            step={0.01}
            placeholder="Prix unitaire"
            value={form.unit_price || ''}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                unit_price: Number(e.target.value || 0),
              }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
          >
            Ajouter
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
          <input
            type="text"
            placeholder="ID palette Plant DB"
            value={importId}
            onChange={(e) => setImportId(e.target.value)}
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm w-48 focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => importId && onImportPlantPalette(importId)}
            disabled={!importId}
            className="rounded-xl border border-stone-300 dark:border-stone-600 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Importer depuis Plant DB
          </button>
        </div>
      </div>

      {totals && (totals.totalPlants > 0 || totals.totalCost > 0) && (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-[#e1e6d8]/50 dark:bg-[#AFBD00]/10 p-4 flex flex-wrap gap-6">
          <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
            Total : <strong>{totals.totalPlants}</strong> plants
          </span>
          <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
            Coût total :{' '}
            <strong>
              {Number(totals.totalCost).toLocaleString('fr-BE')} €
            </strong>
          </span>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<Palette className="w-10 h-10 text-stone-400" />}
          title="Palette vide"
          description="Ajoutez des espèces depuis le formulaire ou importez une palette depuis la base végétale."
        />
      ) : (
        <div className="space-y-6">
          {LAYERS.filter((layer) => byLayer[layer].length > 0).map((layer) => (
            <div
              key={layer}
              className="rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden"
            >
              <div className="px-4 py-2 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700">
                <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  {layerLabels[layer]}
                </h4>
              </div>
              <ul className="divide-y divide-stone-100 dark:divide-stone-700">
                {byLayer[layer].map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30"
                  >
                    <div>
                      <p className="font-medium text-stone-900 dark:text-stone-100">
                        {item.speciesName}
                      </p>
                      {item.commonName && (
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {item.commonName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-stone-600 dark:text-stone-400">
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
    </div>
  )
}
