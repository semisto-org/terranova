import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertTriangle } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { statusLabels, statusColors, type ProjectStatus } from './shared/StatusIndicator'

// Détail financier d'un projet (santé), tel que renvoyé par
// GET /api/v1/design_studio/reporting/projects/:id (Design::ProjectReportingService).
type ProjectReportingDetail = {
  header: {
    project_id: string
    name: string
    status: string
    client_name: string
    revenues: number
    expenses: number
    rebilled_expenses: number
    non_rebilled_expenses: number
    gross_margin: number
    gross_margin_pct: number
    total_hours: number
    billed_hours: number
    semos_hours: number
    expenses_budget: number
    over_budget: boolean
    negative_margin: boolean
  }
  revenues: Array<{
    id: string
    date: string | null
    label: string
    source: string | null
    amount_excl_vat: number
    status: string
  }>
  expenses: Array<{
    id: string
    date: string | null
    label: string
    supplier: string | null
    amount_excl_vat: number
    billable_to_client: boolean
    source: 'direct' | 'allocation'
    full_amount_excl_vat?: number
  }>
  hours: {
    billed: number
    semos: number
    total: number
    by_member: Array<{ member_id: string; member_name: string; billed: number; semos: number; total: number }>
  }
}

const euro = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const euro2 = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })
const number = new Intl.NumberFormat('fr-BE', { maximumFractionDigits: 1 })

const formatDate = (iso: string | null): string => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

export function ProjectReportingModal({
  projectId,
  open,
  onClose,
}: {
  projectId: string | null
  open: boolean
  onClose: () => void
}) {
  const [detail, setDetail] = useState<ProjectReportingDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fermeture clavier (Échap).
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open || !projectId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setDetail(null)
    apiRequest(`/api/v1/design_studio/reporting/projects/${projectId}`)
      .then((data: ProjectReportingDetail) => {
        if (!cancelled) setDetail(data)
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de charger la santé financière de ce projet.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, projectId])

  if (!open) return null

  const header = detail?.header
  const statusKey = (header?.status ?? '') as ProjectStatus
  const statusColor = statusColors[statusKey] ?? { dot: 'bg-stone-300', bg: 'bg-stone-50', text: 'text-stone-500' }
  const statusLabel = statusLabels[statusKey] ?? 'Autre'
  const marginNegative = !!header?.negative_margin

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Santé financière du projet"
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-start justify-between gap-4 p-5 border-b border-stone-200">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-serif text-stone-900 truncate">{header?.name ?? 'Projet'}</h2>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
                  <span className={`rounded-full ${statusColor.dot} w-2 h-2`} />
                  {statusLabel}
                </span>
              </div>
              {header?.client_name ? <p className="text-sm text-stone-500 mt-0.5">{header.client_name}</p> : null}
              <p className="text-xs text-stone-400 mt-1">Montants HTVA · vie entière du projet</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            {loading ? (
              <p className="text-stone-500 py-8 text-center">Chargement…</p>
            ) : error ? (
              <p className="text-red-600 py-8 text-center">{error}</p>
            ) : header ? (
              <>
                {/* Alertes */}
                {(marginNegative || header.over_budget) && (
                  <div className="space-y-2">
                    {marginNegative && (
                      <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                        <AlertTriangle className="w-4 h-4 shrink-0" /> Marge négative sur ce projet.
                      </div>
                    )}
                    {header.over_budget && (
                      <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700">
                        <AlertTriangle className="w-4 h-4 shrink-0" /> Dépassement du budget de dépenses ({euro.format(header.expenses_budget)}).
                      </div>
                    )}
                  </div>
                )}

                {/* En-tête santé */}
                <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    ['CA', euro.format(header.revenues), 'text-stone-900'],
                    ['Coûts', euro.format(header.expenses), 'text-stone-900'],
                    ['Marge', euro.format(header.gross_margin), marginNegative ? 'text-red-600' : 'text-emerald-700'],
                    ['Marge %', `${number.format(header.gross_margin_pct * 100)}%`, marginNegative ? 'text-red-600' : 'text-emerald-700'],
                    ['Heures', `${number.format(header.total_hours)} h`, 'text-stone-900'],
                  ].map(([label, value, color]) => (
                    <div key={label} className="rounded-xl border border-stone-200 p-3">
                      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
                      <p className={`text-lg font-semibold mt-1 ${color}`}>{value}</p>
                    </div>
                  ))}
                  <div className="rounded-xl border border-stone-200 p-3">
                    <p className="text-xs uppercase tracking-wider text-stone-500">Coûts détaillés</p>
                    <p className="text-sm mt-1 text-stone-700" title="Prestations / coûts non refacturés">Prestations {euro.format(header.non_rebilled_expenses)}</p>
                    <p className="text-sm text-stone-700" title="Coûts refacturés au client">Refacturés {euro.format(header.rebilled_expenses)}</p>
                  </div>
                </section>

                {/* Recettes */}
                <section>
                  <h3 className="font-medium text-stone-900 mb-2">Recettes</h3>
                  <div className="overflow-x-auto rounded-xl border border-stone-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-stone-500 border-b border-stone-200 bg-stone-50">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Libellé</th>
                          <th className="py-2 px-3">Source</th>
                          <th className="py-2 px-3 text-right">Montant HT</th>
                          <th className="py-2 px-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail!.revenues.length === 0 ? (
                          <tr><td colSpan={5} className="py-4 px-3 text-center text-stone-400">Aucune recette.</td></tr>
                        ) : detail!.revenues.map((row) => (
                          <tr key={row.id} className="border-b border-stone-100 last:border-0">
                            <td className="py-2 px-3 whitespace-nowrap">{formatDate(row.date)}</td>
                            <td className="py-2 px-3 text-stone-800">{row.label}</td>
                            <td className="py-2 px-3 text-stone-500">{row.source || '—'}</td>
                            <td className="py-2 px-3 text-right tabular-nums">{euro2.format(row.amount_excl_vat)}</td>
                            <td className="py-2 px-3 text-stone-500">{row.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Dépenses */}
                <section>
                  <h3 className="font-medium text-stone-900 mb-2">Dépenses</h3>
                  <div className="overflow-x-auto rounded-xl border border-stone-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-stone-500 border-b border-stone-200 bg-stone-50">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Libellé</th>
                          <th className="py-2 px-3">Fournisseur</th>
                          <th className="py-2 px-3 text-right">Montant HT</th>
                          <th className="py-2 px-3">Refacturé</th>
                          <th className="py-2 px-3">Origine</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail!.expenses.length === 0 ? (
                          <tr><td colSpan={6} className="py-4 px-3 text-center text-stone-400">Aucune dépense.</td></tr>
                        ) : detail!.expenses.map((row) => (
                          <tr key={row.id} className="border-b border-stone-100 last:border-0">
                            <td className="py-2 px-3 whitespace-nowrap">{formatDate(row.date)}</td>
                            <td className="py-2 px-3 text-stone-800">{row.label}</td>
                            <td className="py-2 px-3 text-stone-500">{row.supplier || '—'}</td>
                            <td className="py-2 px-3 text-right tabular-nums">
                              {euro2.format(row.amount_excl_vat)}
                              {row.source === 'allocation' && typeof row.full_amount_excl_vat === 'number' ? (
                                <span className="block text-[11px] text-stone-400">sur {euro2.format(row.full_amount_excl_vat)}</span>
                              ) : null}
                            </td>
                            <td className="py-2 px-3">{row.billable_to_client ? 'Oui' : 'Non'}</td>
                            <td className="py-2 px-3">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${row.source === 'allocation' ? 'bg-indigo-50 text-indigo-600' : 'bg-stone-100 text-stone-600'}`}>
                                {row.source === 'allocation' ? 'Ventilé' : 'Direct'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Heures */}
                <section>
                  <h3 className="font-medium text-stone-900 mb-2">Heures</h3>
                  <div className="grid sm:grid-cols-3 gap-3 mb-3">
                    <div className="rounded-xl border border-stone-200 p-3">
                      <p className="text-xs uppercase tracking-wider text-stone-500">Facturées</p>
                      <p className="text-lg font-semibold text-stone-900 mt-1">{number.format(detail!.hours.billed)} h</p>
                    </div>
                    <div className="rounded-xl border border-stone-200 p-3">
                      <p className="text-xs uppercase tracking-wider text-stone-500">Bénévoles (Semos)</p>
                      <p className="text-lg font-semibold text-stone-900 mt-1">{number.format(detail!.hours.semos)} h</p>
                    </div>
                    <div className="rounded-xl border border-stone-200 p-3">
                      <p className="text-xs uppercase tracking-wider text-stone-500">Total</p>
                      <p className="text-lg font-semibold text-stone-900 mt-1">{number.format(detail!.hours.total)} h</p>
                    </div>
                  </div>
                  {detail!.hours.by_member.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-stone-200">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-stone-500 border-b border-stone-200 bg-stone-50">
                            <th className="py-2 px-3">Membre</th>
                            <th className="py-2 px-3 text-right">Facturées</th>
                            <th className="py-2 px-3 text-right">Semos</th>
                            <th className="py-2 px-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail!.hours.by_member.map((m) => (
                            <tr key={m.member_id} className="border-b border-stone-100 last:border-0">
                              <td className="py-2 px-3 text-stone-800">{m.member_name}</td>
                              <td className="py-2 px-3 text-right tabular-nums">{number.format(m.billed)} h</td>
                              <td className="py-2 px-3 text-right tabular-nums">{number.format(m.semos)} h</td>
                              <td className="py-2 px-3 text-right tabular-nums font-medium">{number.format(m.total)} h</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
