import React, { useEffect, useState, useCallback } from 'react'
import {
  BookOpen,
  Calendar,
  CalendarDays,
  UserPlus,
  CreditCard,
  Receipt,
  Gauge,
  RefreshCw,
  ChevronRight,
  MapPin,
  User,
  Euro,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  CircleDot,
} from 'lucide-react'
import { apiRequest } from '@/lib/api'

const STATUS_LABELS = {
  idea: 'Idee',
  in_construction: 'Construction',
  in_preparation: 'Preparation',
  registrations_open: 'Inscriptions',
  in_progress: 'En cours',
  post_production: 'Post-prod',
}

const STATUS_DOT_COLORS = {
  idea: 'bg-amber-400',
  in_construction: 'bg-violet-500',
  in_preparation: 'bg-blue-500',
  registrations_open: 'bg-green-500',
  in_progress: 'bg-[#B01A19]',
  post_production: 'bg-teal-500',
}

const EXPENSE_STATUS_LABELS = {
  planned: 'Prevue',
  processing: 'En traitement',
  ready_for_payment: 'A payer',
  paid: 'Payee',
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' \u20AC'
}

function CheckIcon({ ok }) {
  return ok
    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    : <XCircle className="w-4 h-4 text-stone-300" />
}

function DaysBadge({ days }) {
  const color = days < 30 ? 'bg-emerald-50 text-emerald-700' : days < 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{days}j</span>
}

function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0
  const color = pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-stone-300'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-stone-500 tabular-nums shrink-0">{current}/{total}</span>
    </div>
  )
}

function FillRateBar({ count, max }) {
  const pct = max > 0 ? Math.min((count / max) * 100, 100) : 0
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-stone-300'
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-stone-500 tabular-nums shrink-0">{count}/{max}</span>
    </div>
  )
}

// -- STAT CARD --
function StatCard({ icon: Icon, label, value, sub, accent, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative bg-white rounded-xl p-4 border border-stone-200/80 shadow-sm hover:shadow-md transition-all duration-300 text-left w-full overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundImage: `linear-gradient(to right, ${accent}, transparent)` }} />
      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1 rounded-lg" style={{ backgroundColor: `${accent}15` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider leading-none">{label}</span>
      </div>
      <div className="text-2xl font-bold text-stone-900 tracking-tight">{value}</div>
      {sub && <div className="text-xs text-stone-500 mt-0.5">{sub}</div>}
    </button>
  )
}

// -- SECTION WRAPPER --
function Section({ title, icon: Icon, children, action }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4.5 h-4.5 text-[#B01A19]" />
          <h2 className="text-sm font-semibold text-stone-800">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}


export default function AcademyDashboard({ onNavigateToTraining }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const payload = await apiRequest('/api/v1/academy/dashboard')
      setData(payload)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  if (loading && !data) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-1 bg-gradient-to-b from-[#B01A19] to-[#eac7b8] rounded-full shrink-0" />
          <div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Tableau de bord</h1>
            <p className="text-sm text-stone-500 mt-1">Vue operationnelle de l'Academy</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-stone-200/80 animate-pulse">
              <div className="h-3 w-16 bg-stone-100 rounded mb-3" />
              <div className="h-7 w-12 bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-16 px-6">
          <AlertTriangle className="w-10 h-10 text-stone-300 mb-3" />
          <p className="text-stone-600 font-medium">{error}</p>
          <button onClick={loadDashboard} className="mt-4 text-sm text-[#B01A19] hover:underline">Reessayer</button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { upcomingSessions = [], recentRegistrations = [], paymentAlerts = [], trainingReadiness = [], expenseUpdates = [], quickStats = {} } = data

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-1 bg-gradient-to-b from-[#B01A19] to-[#eac7b8] rounded-full shrink-0" />
          <div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Tableau de bord</h1>
            <p className="text-sm text-stone-500 mt-1">Vue operationnelle de l'Academy</p>
          </div>
        </div>
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={BookOpen} label="Formations" value={quickStats.activeTrainingsCount ?? 0} sub="actives" accent="#B01A19" />
        <StatCard icon={CalendarDays} label="Sessions" value={quickStats.upcomingSessionsCount ?? 0} sub="sous 60 jours" accent="#234766" />
        <StatCard icon={UserPlus} label="Inscriptions" value={quickStats.totalRegistrationsThisMonth ?? 0} sub="ce mois" accent="#5B5781" />
        <StatCard
          icon={CreditCard}
          label="Paiements"
          value={quickStats.pendingPaymentsCount ?? 0}
          sub={`${formatCurrency(quickStats.pendingPaymentsTotal)} en attente`}
          accent={quickStats.pendingPaymentsCount > 0 ? '#dc2626' : '#16a34a'}
        />
        <StatCard
          icon={Receipt}
          label="Depenses"
          value={quickStats.unpaidExpensesCount ?? 0}
          sub={`${formatCurrency(quickStats.unpaidExpensesTotal)} impayees`}
          accent={quickStats.unpaidExpensesCount > 0 ? '#ea580c' : '#16a34a'}
        />
        <StatCard icon={Gauge} label="Remplissage" value={`${quickStats.averageFillRate ?? 0}%`} sub="taux moyen" accent="#AFBD00" />
      </div>

      {/* Sessions + Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upcoming Sessions */}
        <div className="lg:col-span-3">
          <Section title="Sessions a venir" icon={CalendarDays}>
            {upcomingSessions.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-stone-400">Aucune session dans les 60 prochains jours</div>
            ) : (
              <div className="divide-y divide-stone-50">
                {upcomingSessions.map((s) => (
                  <button
                    key={s.sessionId}
                    type="button"
                    onClick={() => onNavigateToTraining?.(s.trainingId)}
                    className="w-full flex items-center gap-4 px-5 py-3 hover:bg-stone-50/60 transition-colors duration-150 text-left group"
                  >
                    {/* Date pill */}
                    <div className="shrink-0 w-14 text-center">
                      <div className="text-xs font-semibold text-[#B01A19] uppercase">
                        {new Date(s.startDate).toLocaleDateString('fr-FR', { month: 'short' })}
                      </div>
                      <div className="text-xl font-bold text-stone-900 leading-tight">
                        {new Date(s.startDate).getDate()}
                      </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-stone-800 truncate">{s.trainingTitle}</span>
                        {s.trainingTypeName && (
                          <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-500">{s.trainingTypeName}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500">
                        {s.locationNames?.[0] && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.locationNames[0]}</span>}
                        {s.trainerNames?.[0] && <span className="flex items-center gap-1"><User className="w-3 h-3" />{s.trainerNames[0]}</span>}
                      </div>
                    </div>
                    {/* Readiness + Fill */}
                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1">
                        {[
                          { icon: Calendar, ok: true },
                          { icon: MapPin, ok: s.readinessChecks?.hasLocation },
                          { icon: GraduationCap, ok: s.readinessChecks?.hasTrainer },
                          { icon: Euro, ok: s.readinessChecks?.hasPrice },
                        ].map(({ icon: Icon, ok }, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-center w-5 h-5 rounded-md ${
                              ok ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-400'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                          </div>
                        ))}
                      </div>
                      <FillRateBar count={s.registrationCount} max={s.maxParticipants} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Recent Registrations */}
        <div className="lg:col-span-2">
          <Section title="Dernieres inscriptions" icon={UserPlus}>
            {recentRegistrations.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-stone-400">Aucune inscription recente</div>
            ) : (
              <div className="divide-y divide-stone-50">
                {recentRegistrations.map((r) => (
                  <button
                    key={r.registrationId}
                    type="button"
                    onClick={() => onNavigateToTraining?.(r.trainingId)}
                    className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-stone-50/60 transition-colors duration-150 text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-800 truncate">{r.contactName}</div>
                      <div className="text-xs text-stone-500 truncate">{r.trainingTitle}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <PaymentBadge status={r.paymentStatus} />
                      <div className="text-[10px] text-stone-400 mt-0.5">{formatDate(r.registeredAt)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Training Readiness + Payment Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Training Readiness */}
        <div className="lg:col-span-3">
          <Section title="Preparation des formations" icon={BookOpen}>
            {trainingReadiness.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-stone-400">Aucune formation active</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                      <th className="px-5 py-2.5">Formation</th>
                      <th className="px-2 py-2.5 text-center">Lieu</th>
                      <th className="px-2 py-2.5 text-center">Form.</th>
                      <th className="px-2 py-2.5 text-center">Prix</th>
                      <th className="px-2 py-2.5 text-center">Sess.</th>
                      <th className="px-3 py-2.5">Checklist</th>
                      <th className="px-3 py-2.5 text-right">Prochaine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {trainingReadiness.map((t) => (
                      <tr
                        key={t.trainingId}
                        className="hover:bg-stone-50/60 transition-colors cursor-pointer"
                        onClick={() => onNavigateToTraining?.(t.trainingId)}
                      >
                        <td className="px-5 py-2.5 max-w-[200px]">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[t.status] || 'bg-stone-300'}`} />
                            <span className="font-medium text-stone-800 truncate">{t.title}</span>
                          </div>
                          {t.trainingTypeName && (
                            <div className="text-[10px] text-stone-400 ml-4 truncate">{t.trainingTypeName}</div>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-center"><CheckIcon ok={t.checks?.hasLocation} /></td>
                        <td className="px-2 py-2.5 text-center"><CheckIcon ok={t.checks?.hasTrainer} /></td>
                        <td className="px-2 py-2.5 text-center"><CheckIcon ok={t.checks?.hasPrice} /></td>
                        <td className="px-2 py-2.5 text-center"><CheckIcon ok={t.checks?.hasSessions} /></td>
                        <td className="px-3 py-2.5">
                          <ProgressBar current={t.checks?.checklistProgress?.[0] ?? 0} total={t.checks?.checklistProgress?.[1] ?? 0} />
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-stone-500 whitespace-nowrap">
                          {t.nextSessionDate ? formatDate(t.nextSessionDate) : <span className="text-stone-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        {/* Payment Alerts */}
        <div className="lg:col-span-2">
          <Section
            title="Alertes paiement"
            icon={CreditCard}
            action={paymentAlerts.length > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600">{paymentAlerts.length}</span>
            )}
          >
            {paymentAlerts.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-stone-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                Tous les paiements sont a jour
              </div>
            ) : (
              <div className="divide-y divide-stone-50 max-h-[360px] overflow-y-auto">
                {paymentAlerts.map((a) => (
                  <button
                    key={a.registrationId}
                    type="button"
                    onClick={() => onNavigateToTraining?.(a.trainingId)}
                    className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-stone-50/60 transition-colors duration-150 text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-800 truncate">{a.contactName}</div>
                      <div className="text-xs text-stone-500 truncate">{a.trainingTitle}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <DaysBadge days={a.daysSinceRegistration} />
                      <div className="text-xs text-stone-500 mt-0.5 tabular-nums">
                        {formatCurrency(a.amountPaid)} / {formatCurrency(a.expectedAmount)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Expense Updates */}
      {expenseUpdates.length > 0 && (
        <Section title="Mouvements de depenses" icon={Receipt}>
          <div className="divide-y divide-stone-50">
            {expenseUpdates.map((e) => (
              <button
                key={e.expenseId}
                type="button"
                onClick={() => onNavigateToTraining?.(e.trainingId)}
                className="w-full flex items-center gap-4 px-5 py-3 hover:bg-stone-50/60 transition-colors duration-150 text-left group"
              >
                {/* Timeline dot */}
                <div className="shrink-0 flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#B01A19]/20 ring-2 ring-[#B01A19]/10" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-stone-800 truncate">{e.supplier || 'Fournisseur inconnu'}</span>
                    <ExpenseStatusBadge status={e.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span className="truncate">{e.trainingTitle}</span>
                    {e.category && <span className="text-stone-400">· {e.category}</span>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-stone-800 tabular-nums">{formatCurrency(e.totalInclVat)}</div>
                  <div className="text-[10px] text-stone-400">{formatDate(e.updatedAt)}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function PaymentBadge({ status }) {
  const styles = {
    paid: 'bg-emerald-50 text-emerald-700',
    partial: 'bg-amber-50 text-amber-700',
    pending: 'bg-stone-100 text-stone-500',
  }
  const labels = { paid: 'Paye', partial: 'Partiel', pending: 'En attente' }
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  )
}

function ExpenseStatusBadge({ status }) {
  const styles = {
    planned: 'bg-stone-100 text-stone-500',
    processing: 'bg-blue-50 text-blue-600',
    ready_for_payment: 'bg-amber-50 text-amber-700',
    paid: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[status] || styles.planned}`}>
      {EXPENSE_STATUS_LABELS[status] || status}
    </span>
  )
}
