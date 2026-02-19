import React, { useState } from 'react'
import { X } from 'lucide-react'

const EMPTY = {
  name: '',
  nurseryType: 'partner',
  integration: 'manual',
  address: '',
  city: '',
  postalCode: '',
  country: 'Belgique',
  latitude: '',
  longitude: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  description: '',
  specialties: '',
  isPickupPoint: false,
}

export function NurseryForm({ nursery, onSave, onCancel }) {
  const editing = !!nursery
  const [form, setForm] = useState(() => {
    if (!nursery) return { ...EMPTY }
    return {
      name: nursery.name || '',
      nurseryType: nursery.type || 'partner',
      integration: nursery.integration || 'manual',
      address: nursery.address || '',
      city: nursery.city || '',
      postalCode: nursery.postalCode || '',
      country: nursery.country || 'Belgique',
      latitude: nursery.coordinates?.lat?.toString() || '',
      longitude: nursery.coordinates?.lng?.toString() || '',
      contactName: nursery.contactName || '',
      contactEmail: nursery.contactEmail || '',
      contactPhone: nursery.contactPhone || '',
      website: nursery.website || '',
      description: nursery.description || '',
      specialties: (nursery.specialties || []).join(', '),
      isPickupPoint: nursery.isPickupPoint || false,
    }
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      name: form.name,
      nursery_type: form.nurseryType,
      integration: form.integration,
      address: form.address,
      city: form.city,
      postal_code: form.postalCode,
      country: form.country,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      contact_name: form.contactName,
      contact_email: form.contactEmail,
      contact_phone: form.contactPhone,
      website: form.website,
      description: form.description,
      specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
      is_pickup_point: form.isPickupPoint,
    })
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]/50 focus:border-[#EF9B0D]'
  const labelCls = 'block text-sm font-medium text-stone-700 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#fbe6c3]/30">
          <h2 className="text-xl font-bold text-stone-900">{editing ? 'Modifier la pépinière' : 'Nouvelle pépinière'}</h2>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-stone-100"><X className="w-5 h-5 text-stone-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className={labelCls}>Nom *</label><input required className={inputCls} value={form.name} onChange={set('name')} /></div>
            <div>
              <label className={labelCls}>Type *</label>
              <select className={inputCls} value={form.nurseryType} onChange={set('nurseryType')}>
                <option value="semisto">Semisto</option>
                <option value="partner">Partenaire</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Intégration *</label>
              <select className={inputCls} value={form.integration} onChange={set('integration')}>
                <option value="platform">Plateforme</option>
                <option value="manual">Manuel</option>
              </select>
            </div>
            <div className="sm:col-span-2"><label className={labelCls}>Adresse</label><input className={inputCls} value={form.address} onChange={set('address')} /></div>
            <div><label className={labelCls}>Ville</label><input className={inputCls} value={form.city} onChange={set('city')} /></div>
            <div><label className={labelCls}>Code postal</label><input className={inputCls} value={form.postalCode} onChange={set('postalCode')} /></div>
            <div><label className={labelCls}>Pays</label><input className={inputCls} value={form.country} onChange={set('country')} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Latitude</label><input type="number" step="any" className={inputCls} value={form.latitude} onChange={set('latitude')} /></div>
              <div><label className={labelCls}>Longitude</label><input type="number" step="any" className={inputCls} value={form.longitude} onChange={set('longitude')} /></div>
            </div>
            <div><label className={labelCls}>Contact</label><input className={inputCls} value={form.contactName} onChange={set('contactName')} /></div>
            <div><label className={labelCls}>Email</label><input type="email" className={inputCls} value={form.contactEmail} onChange={set('contactEmail')} /></div>
            <div><label className={labelCls}>Téléphone</label><input className={inputCls} value={form.contactPhone} onChange={set('contactPhone')} /></div>
            <div><label className={labelCls}>Site web</label><input className={inputCls} value={form.website} onChange={set('website')} placeholder="https://" /></div>
            <div className="sm:col-span-2"><label className={labelCls}>Description</label><textarea rows={2} className={inputCls} value={form.description} onChange={set('description')} /></div>
            <div className="sm:col-span-2"><label className={labelCls}>Spécialités (séparées par des virgules)</label><input className={inputCls} value={form.specialties} onChange={set('specialties')} placeholder="Arbres fruitiers, Haies, Vivaces" /></div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="pickup" checked={form.isPickupPoint} onChange={set('isPickupPoint')} className="rounded border-stone-300 text-[#EF9B0D] focus:ring-[#EF9B0D]" />
              <label htmlFor="pickup" className="text-sm text-stone-700">Point de retrait</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200">Annuler</button>
            <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-[#EF9B0D] hover:bg-[#EF9B0D]/90 rounded-lg shadow-sm">{editing ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
