import { useState, useEffect } from 'react'
import { Clock, Loader2 } from 'lucide-react'
import { apiRequest } from '../../../lib/api'

// Visualisation consolidée des volumes d'activité du bureau d'études (délibération #20) :
// par designer, heures rémunérées (mode "billed") vs non-rémunérées (mode "semos").
interface ActivityVolumes {
  members: Array<{
    memberId: string
    memberName: string
    paidHours: number
    unpaidHours: number
    totalHours: number
    paidShare: number
  }>
  totals: { paidHours: number; unpaidHours: number; totalHours: number }
}

export function ActivityVolumesView() {
  const [data, setData] = useState<ActivityVolumes | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    apiRequest('/api/v1/design/activity-volumes')
      .then((payload) => { if (active) setData(payload) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const fmt = (val: number) =>
    val.toLocaleString('fr-BE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const pct = (val: number) =>
    (val * 100).toLocaleString('fr-BE', { maximumFractionDigits: 0 })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    )
  }

  if (!data) return null

  const { members, totals } = data
  const globalShare = totals.totalHours > 0 ? totals.paidHours / totals.totalHours : 0

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-500">
        Heures saisies par designer, rémunérées (facturées) vs non-rémunérées (Semos), tous projets confondus.
      </p>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Heures rémunérées</p>
          <p className="text-lg font-semibold text-[#6B7A00]">{fmt(totals.paidHours)} h</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Heures non-rémunérées</p>
          <p className="text-lg font-semibold text-[#5B5781]">{fmt(totals.unpaidHours)} h</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Total</p>
          <p className="text-lg font-semibold text-stone-900">{fmt(totals.totalHours)} h</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Part rémunérée</p>
          <p className="text-lg font-semibold text-stone-900">{pct(globalShare)} %</p>
        </div>
      </div>

      {/* Per-member breakdown */}
      <div className="rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-50">
          <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#AFBD00]" />
            Par designer
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50">
                <th className="px-4 py-3 font-semibold text-stone-600">Designer</th>
                <th className="px-4 py-3 font-semibold text-stone-600 text-right">Rémunéré</th>
                <th className="px-4 py-3 font-semibold text-stone-600 text-right">Non-rémunéré</th>
                <th className="px-4 py-3 font-semibold text-stone-600 text-right">Total</th>
                <th className="px-4 py-3 font-semibold text-stone-600 w-40">Répartition</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-400">Aucune heure saisie</td></tr>
              ) : members.map((m) => (
                <tr key={m.memberId} className="border-b border-stone-100 hover:bg-stone-50/50">
                  <td className="px-4 py-3 font-medium text-stone-900">{m.memberName}</td>
                  <td className="px-4 py-3 text-right text-[#6B7A00] font-medium">{fmt(m.paidHours)} h</td>
                  <td className="px-4 py-3 text-right text-[#5B5781] font-medium">{fmt(m.unpaidHours)} h</td>
                  <td className="px-4 py-3 text-right text-stone-700">{fmt(m.totalHours)} h</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-[#5B5781]/20 overflow-hidden">
                        <div className="h-full bg-[#6B7A00]" style={{ width: `${m.paidShare * 100}%` }} />
                      </div>
                      <span className="text-xs text-stone-500 tabular-nums w-9 text-right">{pct(m.paidShare)} %</span>
                    </div>
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
