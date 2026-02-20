import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const growthStages = [
  { value: 'seed', label: 'Graine' },
  { value: 'seedling', label: 'Semis' },
  { value: 'young', label: 'Jeune' },
  { value: 'established', label: 'Établi' },
  { value: 'mature', label: 'Mature' },
]

export function StockBatchForm({ batch, nurseries, containers, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nurseryId: '', speciesId: '', speciesName: '', varietyId: '', varietyName: '',
    containerId: '', quantity: 0, availableQuantity: 0, reservedQuantity: 0,
    sowingDate: '', origin: '', growthStage: '', priceEuros: 0,
    acceptsSemos: false, priceSemos: 0, notes: '',
  })

  useEffect(() => {
    if (batch) {
      setFormData({
        nurseryId: batch.nurseryId, speciesId: batch.speciesId, speciesName: batch.speciesName,
        varietyId: batch.varietyId || '', varietyName: batch.varietyName || '',
        containerId: batch.containerId, quantity: batch.quantity,
        availableQuantity: batch.availableQuantity, reservedQuantity: batch.reservedQuantity,
        sowingDate: batch.sowingDate || '', origin: batch.origin || '',
        growthStage: batch.growthStage || '', priceEuros: batch.priceEuros,
        acceptsSemos: batch.acceptsSemos, priceSemos: batch.priceSemos || 0,
        notes: batch.notes || '',
      })
    }
  }, [batch])

  const handleSubmit = (e) => {
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
    })
  }

  const inputClass = "w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-900 rounded-lg shadow-xl border border-stone-200 dark:border-stone-800">
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'Sole Serif Small, serif' }}>
            {batch ? 'Modifier le lot' : 'Créer un nouveau lot'}
          </h2>
          <button onClick={onCancel} className="p-2 rounded-md text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">Informations de base</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Pépinière <span className="text-red-500">*</span></label>
                <select required value={formData.nurseryId} onChange={(e) => setFormData({ ...formData, nurseryId: e.target.value })} className={inputClass}>
                  <option value="">Sélectionner une pépinière</option>
                  {nurseries.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Contenant <span className="text-red-500">*</span></label>
                <select required value={formData.containerId} onChange={(e) => setFormData({ ...formData, containerId: e.target.value })} className={inputClass}>
                  <option value="">Sélectionner un contenant</option>
                  {containers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.shortName})</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Espèce <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.speciesName} onChange={(e) => setFormData({ ...formData, speciesName: e.target.value })} placeholder="Ex: Allium ursinum" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Variété <span className="text-xs text-stone-500">(optionnel)</span></label>
                <input type="text" value={formData.varietyName} onChange={(e) => setFormData({ ...formData, varietyName: e.target.value })} placeholder="Ex: Alexandria" className={inputClass} />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">Quantités</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Quantité totale <span className="text-red-500">*</span></label>
                <input type="number" required min="0" value={formData.quantity} onChange={(e) => { const qty = parseInt(e.target.value) || 0; setFormData({ ...formData, quantity: qty, availableQuantity: Math.min(formData.availableQuantity, qty) }) }} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Disponible <span className="text-red-500">*</span></label>
                <input type="number" required min="0" max={formData.quantity} value={formData.availableQuantity} onChange={(e) => { const qty = parseInt(e.target.value) || 0; setFormData({ ...formData, availableQuantity: Math.min(qty, formData.quantity), reservedQuantity: formData.quantity - Math.min(qty, formData.quantity) }) }} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Réservé</label>
                <input type="number" min="0" value={formData.reservedQuantity} readOnly className={`${inputClass} bg-stone-50`} />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">Détails</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Date de semis</label>
                <input type="date" value={formData.sowingDate} onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Stade de développement</label>
                <select value={formData.growthStage} onChange={(e) => setFormData({ ...formData, growthStage: e.target.value })} className={inputClass}>
                  <option value="">Non spécifié</option>
                  {growthStages.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Origine</label>
              <input type="text" value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} placeholder="Ex: Semis maison, Bouturage..." className={inputClass} />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">Prix</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Prix (€) <span className="text-red-500">*</span></label>
                <input type="number" required min="0" step="0.01" value={formData.priceEuros} onChange={(e) => setFormData({ ...formData, priceEuros: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox" checked={formData.acceptsSemos} onChange={(e) => setFormData({ ...formData, acceptsSemos: e.target.checked })} className="w-4 h-4 text-[#EF9B0D] border-stone-300 rounded focus:ring-[#EF9B0D]" />
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Accepte les Semos</span>
                </label>
                {formData.acceptsSemos && (
                  <input type="number" min="0" value={formData.priceSemos} onChange={(e) => setFormData({ ...formData, priceSemos: parseInt(e.target.value) || 0 })} placeholder="Prix en Semos" className={inputClass} />
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Notes</label>
            <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Notes additionnelles..." className={`${inputClass} resize-none`} />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-stone-700 rounded-md hover:bg-stone-100 transition-colors">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white rounded-md bg-[#EF9B0D] hover:bg-[#d88a0b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2">
              {batch ? 'Enregistrer les modifications' : 'Créer le lot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
