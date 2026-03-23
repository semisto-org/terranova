import { useState, useEffect } from 'react'
import { apiRequest } from '../../lib/api'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30 focus:border-[#B01A19]'

export function AcademySettingsPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [discountPerSpot, setDiscountPerSpot] = useState(10)
  const [discountMax, setDiscountMax] = useState(30)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiRequest('/api/v1/academy/settings')
      .then((data) => {
        setDiscountPerSpot(data.volumeDiscountPerSpot)
        setDiscountMax(data.volumeDiscountMax)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const result = await apiRequest('/api/v1/academy/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          volume_discount_per_spot: Number(discountPerSpot),
          volume_discount_max: Number(discountMax),
        }),
      })
      setDiscountPerSpot(result.volumeDiscountPerSpot)
      setDiscountMax(result.volumeDiscountMax)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const previewRows = Array.from({ length: 6 }, (_, i) => {
    const qty = i + 1
    const discount = qty <= 1 ? 0 : Math.min(discountPerSpot * (qty - 1), discountMax)
    return { qty, discount }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-stone-300 border-t-[#B01A19] rounded-full" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-stone-900 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
          Réduction volume
        </h3>
        <p className="text-sm text-stone-500 mb-6">
          Configurez la réduction appliquée automatiquement quand un participant réserve plusieurs places dans la même catégorie
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Réduction par place supplémentaire
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={discountPerSpot}
                onChange={(e) => setDiscountPerSpot(Number(e.target.value))}
                className={inputBase}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">%</span>
            </div>
            <p className="text-xs text-stone-500 mt-1.5">
              Chaque place au-delà de la première ajoute cette réduction
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Plafond de réduction
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={discountMax}
                onChange={(e) => setDiscountMax(Number(e.target.value))}
                className={inputBase}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">%</span>
            </div>
            <p className="text-xs text-stone-500 mt-1.5">
              La réduction ne dépassera jamais ce pourcentage
            </p>
          </div>
        </div>

        {/* Preview table */}
        <div className="rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">Places</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">Réduction</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Ex. pour 100 €</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {previewRows.map(({ qty, discount }) => (
                <tr key={qty} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-4 py-2.5 text-stone-700">
                    {qty} place{qty > 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {discount > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        -{discount}%
                      </span>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-stone-600 hidden sm:table-cell">
                    {(100 * qty * (1 - discount / 100)).toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl font-medium text-white bg-[#B01A19] hover:bg-[#8f1514] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium">
              Paramètres enregistrés
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
