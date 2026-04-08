import { useState, useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import { TrendingUp, Settings, Loader2 } from 'lucide-react'
import { apiRequest } from '../../../lib/api'

interface BillingOverview {
  config: { hourlyRate: number; asblSupportRate: number }
  totals: {
    theoreticalRevenue: number
    theoreticalAsbl: number
    bucketCredits: number
    bucketDebits: number
    bucketBalance: number
    generalExpenses: number
    designRevenue: number
    actualOverheadRate: number
  }
  projects: Array<{
    projectId: string
    projectName: string
    clientName: string
    phase: string
    hoursBilled: number
    theoreticalRevenue: number
    theoreticalAsbl: number
    bucketCredits: number
    bucketDebits: number
    bucketBalance: number
  }>
}

export function AsblRateDashboard() {
  const { auth } = usePage<{ auth: { member: { isAdmin: boolean } | null } }>().props
  const isAdmin = auth?.member?.isAdmin ?? false
  const [data, setData] = useState<BillingOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingConfig, setEditingConfig] = useState(false)
  const [hourlyRate, setHourlyRate] = useState('')
  const [asblRate, setAsblRate] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const payload = await apiRequest('/api/v1/design/billing-overview')
      setData(payload)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    const updates: Record<string, number> = {}
    if (hourlyRate) updates.hourly_rate = parseFloat(hourlyRate)
    if (asblRate) updates.asbl_support_rate = parseFloat(asblRate) / 100
    await apiRequest('/api/v1/billing-config', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    setEditingConfig(false)
    loadData()
  }

  const fmt = (val: number) =>
    val.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const pct = (val: number) =>
    (val * 100).toLocaleString('fr-BE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    )
  }

  if (!data) return null

  const { config, totals, projects } = data
  const rateMatch = totals.actualOverheadRate > 0
    ? totals.actualOverheadRate <= config.asblSupportRate
    : true

  return (
    <div className="space-y-6">
      {/* Config summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
            Taux horaire
          </p>
          <p className="text-2xl font-semibold text-stone-900 tracking-tight">
            {fmt(config.hourlyRate)} €/h
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
            Taux ASBL cible
          </p>
          <p className="text-2xl font-semibold text-[#AFBD00] tracking-tight">
            {pct(config.asblSupportRate)} %
          </p>
        </div>
        <div className={`rounded-2xl border p-5 ${rateMatch ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
            Taux réel (frais généraux / revenus)
          </p>
          <p className={`text-2xl font-semibold tracking-tight ${rateMatch ? 'text-emerald-700' : 'text-amber-700'}`}>
            {pct(totals.actualOverheadRate)} %
          </p>
          <p className="text-xs text-stone-500 mt-1">
            {fmt(totals.generalExpenses)} € frais / {fmt(totals.designRevenue)} € revenus
          </p>
        </div>
      </div>

      {/* Config edit (admin) */}
      {isAdmin && (
        <div>
          {editingConfig ? (
            <form onSubmit={handleSaveConfig} className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
              <h3 className="text-sm font-semibold text-stone-900">Configuration facturation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Taux horaire (€/h)</label>
                  <input
                    type="number" step="0.01" min="0.01"
                    defaultValue={config.hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Taux ASBL (%)</label>
                  <input
                    type="number" step="0.1" min="0" max="99"
                    defaultValue={(config.asblSupportRate * 100).toFixed(1)}
                    onChange={(e) => setAsblRate(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00]">
                  Enregistrer
                </button>
                <button type="button" onClick={() => setEditingConfig(false)} className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setEditingConfig(true)}
              className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700"
            >
              <Settings className="w-4 h-4" />
              Modifier la configuration
            </button>
          )}
        </div>
      )}

      {/* Bucket totals */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Revenus théoriques</p>
          <p className="text-lg font-semibold text-stone-900">{fmt(totals.theoreticalRevenue)} €</p>
          <p className="text-xs text-stone-500 mt-0.5">heures facturées x {fmt(config.hourlyRate)} €</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Total crédité (buckets)</p>
          <p className="text-lg font-semibold text-[#6B7A00]">{fmt(totals.bucketCredits)} €</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Total versé (designers)</p>
          <p className="text-lg font-semibold text-[#5B5781]">{fmt(totals.bucketDebits)} €</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Solde global</p>
          <p className={`text-lg font-semibold ${totals.bucketBalance >= 0 ? 'text-stone-900' : 'text-red-600'}`}>
            {fmt(totals.bucketBalance)} €
          </p>
        </div>
      </div>

      {/* Per-project breakdown */}
      <div className="rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-50">
          <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#AFBD00]" />
            Détail par projet
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50">
                <th className="px-4 py-3 font-semibold text-stone-600">Projet</th>
                <th className="px-4 py-3 font-semibold text-stone-600">Client</th>
                <th className="px-4 py-3 font-semibold text-stone-600 text-right">Heures</th>
                <th className="px-4 py-3 font-semibold text-stone-600 text-right">Revenus théor.</th>
                <th className="px-4 py-3 font-semibold text-stone-600 text-right">Bucket crédité</th>
                <th className="px-4 py-3 font-semibold text-stone-600 text-right">Versé</th>
                <th className="px-4 py-3 font-semibold text-stone-600 text-right">Solde</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-stone-400">Aucun projet</td></tr>
              ) : projects.map((p) => (
                <tr key={p.projectId} className="border-b border-stone-100 hover:bg-stone-50/50">
                  <td className="px-4 py-3 font-medium text-stone-900">{p.projectName}</td>
                  <td className="px-4 py-3 text-stone-600">{p.clientName}</td>
                  <td className="px-4 py-3 text-right text-stone-700">{p.hoursBilled}h</td>
                  <td className="px-4 py-3 text-right text-stone-700">{fmt(p.theoreticalRevenue)} €</td>
                  <td className="px-4 py-3 text-right text-[#6B7A00] font-medium">{fmt(p.bucketCredits)} €</td>
                  <td className="px-4 py-3 text-right text-[#5B5781] font-medium">{fmt(p.bucketDebits)} €</td>
                  <td className={`px-4 py-3 text-right font-medium ${p.bucketBalance >= 0 ? 'text-stone-900' : 'text-red-600'}`}>
                    {fmt(p.bucketBalance)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
