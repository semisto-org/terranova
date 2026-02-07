import { useState, useEffect } from 'react'
import type { StockBatch, Nursery, Container, GrowthStage } from '../types'
import { X } from 'lucide-react'

interface StockBatchFormProps {
  batch?: StockBatch | null
  nurseries: Nursery[]
  containers: Container[]
  onSave: (data: Omit<StockBatch, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

const growthStages: { value: GrowthStage; label: string }[] = [
  { value: 'seed', label: 'Graine' },
  { value: 'seedling', label: 'Semis' },
  { value: 'young', label: 'Jeune' },
  { value: 'established', label: 'Établi' },
  { value: 'mature', label: 'Mature' },
]

export function StockBatchForm({
  batch,
  nurseries,
  containers,
  onSave,
  onCancel,
}: StockBatchFormProps) {
  const [formData, setFormData] = useState({
    nurseryId: batch?.nurseryId || '',
    speciesId: batch?.speciesId || '',
    speciesName: batch?.speciesName || '',
    varietyId: batch?.varietyId || '',
    varietyName: batch?.varietyName || '',
    containerId: batch?.containerId || '',
    quantity: batch?.quantity || 0,
    availableQuantity: batch?.availableQuantity || 0,
    reservedQuantity: batch?.reservedQuantity || 0,
    sowingDate: batch?.sowingDate || '',
    origin: batch?.origin || '',
    growthStage: batch?.growthStage || '' as GrowthStage | '',
    priceEuros: batch?.priceEuros || 0,
    acceptsSemos: batch?.acceptsSemos || false,
    priceSemos: batch?.priceSemos || 0,
    notes: batch?.notes || '',
  })

  useEffect(() => {
    if (batch) {
      setFormData({
        nurseryId: batch.nurseryId,
        speciesId: batch.speciesId,
        speciesName: batch.speciesName,
        varietyId: batch.varietyId || '',
        varietyName: batch.varietyName || '',
        containerId: batch.containerId,
        quantity: batch.quantity,
        availableQuantity: batch.availableQuantity,
        reservedQuantity: batch.reservedQuantity,
        sowingDate: batch.sowingDate || '',
        origin: batch.origin || '',
        growthStage: batch.growthStage || '' as GrowthStage | '',
        priceEuros: batch.priceEuros,
        acceptsSemos: batch.acceptsSemos,
        priceSemos: batch.priceSemos || 0,
        notes: batch.notes || '',
      })
    }
  }, [batch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      growthStage: formData.growthStage || undefined,
      varietyId: formData.varietyId || undefined,
      varietyName: formData.varietyName || undefined,
      sowingDate: formData.sowingDate || undefined,
      origin: formData.origin || undefined,
      priceSemos: formData.acceptsSemos ? formData.priceSemos : undefined,
      notes: formData.notes || undefined,
    } as Omit<StockBatch, 'id' | 'createdAt' | 'updatedAt'>)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-900 rounded-lg shadow-xl border border-stone-200 dark:border-stone-800">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'Sole Serif Small, serif' }}>
            {batch ? 'Modifier le lot' : 'Créer un nouveau lot'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-md text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
              Informations de base
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nurseryId" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Pépinière <span className="text-red-500">*</span>
                </label>
                <select
                  id="nurseryId"
                  required
                  value={formData.nurseryId}
                  onChange={(e) => setFormData({ ...formData, nurseryId: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
                >
                  <option value="">Sélectionner une pépinière</option>
                  {nurseries.map((nursery) => (
                    <option key={nursery.id} value={nursery.id}>
                      {nursery.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="containerId" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Contenant <span className="text-red-500">*</span>
                </label>
                <select
                  id="containerId"
                  required
                  value={formData.containerId}
                  onChange={(e) => setFormData({ ...formData, containerId: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
                >
                  <option value="">Sélectionner un contenant</option>
                  {containers.map((container) => (
                    <option key={container.id} value={container.id}>
                      {container.name} ({container.shortName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="speciesName" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Espèce <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="speciesName"
                  required
                  value={formData.speciesName}
                  onChange={(e) => setFormData({ ...formData, speciesName: e.target.value })}
                  placeholder="Ex: Allium ursinum"
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="varietyName" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Variété <span className="text-xs text-stone-500">(optionnel)</span>
                </label>
                <input
                  type="text"
                  id="varietyName"
                  value={formData.varietyName}
                  onChange={(e) => setFormData({ ...formData, varietyName: e.target.value })}
                  placeholder="Ex: Alexandria"
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Quantités */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
              Quantités
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Quantité totale <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="quantity"
                  required
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value) || 0
                    setFormData({
                      ...formData,
                      quantity: qty,
                      availableQuantity: Math.min(formData.availableQuantity, qty),
                    })
                  }}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="availableQuantity" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Disponible <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="availableQuantity"
                  required
                  min="0"
                  max={formData.quantity}
                  value={formData.availableQuantity}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value) || 0
                    setFormData({
                      ...formData,
                      availableQuantity: Math.min(qty, formData.quantity),
                      reservedQuantity: formData.quantity - Math.min(qty, formData.quantity),
                    })
                  }}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="reservedQuantity" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Réservé
                </label>
                <input
                  type="number"
                  id="reservedQuantity"
                  min="0"
                  value={formData.reservedQuantity}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value) || 0
                    setFormData({
                      ...formData,
                      reservedQuantity: Math.min(qty, formData.quantity),
                      availableQuantity: formData.quantity - Math.min(qty, formData.quantity),
                    })
                  }}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Informations optionnelles */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
              Informations optionnelles <span className="text-xs font-normal text-stone-500">(pour débutants)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sowingDate" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Date de semis <span className="text-xs text-stone-500">(optionnel)</span>
                </label>
                <input
                  type="date"
                  id="sowingDate"
                  value={formData.sowingDate}
                  onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="growthStage" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Stade de développement <span className="text-xs text-stone-500">(optionnel)</span>
                </label>
                <select
                  id="growthStage"
                  value={formData.growthStage}
                  onChange={(e) => setFormData({ ...formData, growthStage: e.target.value as GrowthStage | '' })}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
                >
                  <option value="">Non spécifié</option>
                  {growthStages.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="origin" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Origine <span className="text-xs text-stone-500">(optionnel)</span>
              </label>
              <input
                type="text"
                id="origin"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="Ex: Semis maison, Division, Bouturage..."
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
              />
            </div>
          </div>

          {/* Prix */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
              Prix
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="priceEuros" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Prix (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="priceEuros"
                  required
                  min="0"
                  step="0.01"
                  value={formData.priceEuros}
                  onChange={(e) => setFormData({ ...formData, priceEuros: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptsSemos}
                    onChange={(e) => setFormData({ ...formData, acceptsSemos: e.target.checked })}
                    className="w-4 h-4 text-[#EF9B0D] border-stone-300 dark:border-stone-700 rounded focus:ring-[#EF9B0D]"
                  />
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    Accepte les Semos
                  </span>
                </label>
                {formData.acceptsSemos && (
                  <input
                    type="number"
                    id="priceSemos"
                    min="0"
                    value={formData.priceSemos}
                    onChange={(e) => setFormData({ ...formData, priceSemos: parseInt(e.target.value) || 0 })}
                    placeholder="Prix en Semos"
                    className="w-full mt-2 px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Notes <span className="text-xs text-stone-500">(optionnel)</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes additionnelles..."
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white rounded-md bg-[#EF9B0D] hover:bg-[#d88a0b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2"
            >
              {batch ? 'Enregistrer les modifications' : 'Créer le lot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

