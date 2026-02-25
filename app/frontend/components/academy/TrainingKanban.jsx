import React, { useMemo, useState } from 'react'
import {
  Plus,
  Calendar,
  BarChart3,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Circle,
  AlertCircle,
  Eye,
  Pencil,
  CheckSquare,
  X,
} from 'lucide-react'

const STATUS_LABELS = {
  idea: 'Idée',
  to_organize: 'À organiser',
  in_preparation: 'En préparation',
  to_publish: 'À publier',
  published: 'Publiée',
  in_progress: 'En cours',
  post_training: 'Post-formation',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const STATUS_TONE = {
  idea: 'bg-amber-50 text-amber-700 border-amber-200',
  to_organize: 'bg-orange-50 text-orange-700 border-orange-200',
  in_preparation: 'bg-blue-50 text-blue-700 border-blue-200',
  to_publish: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  in_progress: 'bg-[#B01A19]/10 text-[#8f1514] border-[#B01A19]/30',
  post_training: 'bg-teal-50 text-teal-700 border-teal-200',
  completed: 'bg-stone-200 text-stone-800 border-stone-300',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
}

const PERIOD_OPTIONS = [
  { id: 'all', label: 'Toutes périodes' },
  { id: 'next30', label: '30 prochains jours' },
  { id: 'next90', label: '90 prochains jours' },
  { id: 'past', label: 'Passées' },
  { id: 'undated', label: 'Sans date' },
]

const COMPLETENESS_OPTIONS = [
  { id: 'all', label: 'Toute complétude' },
  { id: 'needs_work', label: 'À compléter' },
  { id: 'almost_ready', label: 'Presque prêt' },
  { id: 'ready', label: 'Prêtes' },
]

const SORT_OPTIONS = [
  { id: 'date_asc', label: 'Date (proche → loin)' },
  { id: 'date_desc', label: 'Date (loin → proche)' },
  { id: 'priority', label: 'Priorité opérationnelle' },
  { id: 'completeness_desc', label: 'Complétude (haute → basse)' },
  { id: 'completeness_asc', label: 'Complétude (basse → haute)' },
  { id: 'updated_desc', label: 'Dernière mise à jour' },
]

function formatDate(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getTrainingMetrics(training, sessions, registrations) {
  const now = new Date()
  const nextSession = sessions
    .filter((s) => new Date(s.startDate).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0]

  const checks = [
    {
      id: 'date',
      label: 'Date définie',
      done: sessions.length > 0,
      type: 'computed',
    },
    {
      id: 'location',
      label: 'Lieu défini',
      done: sessions.length > 0 && sessions.every((s) => (s.locationIds || []).length > 0),
      type: 'computed',
    },
    {
      id: 'trainers',
      label: 'Formateur(s)',
      done: sessions.length > 0 && sessions.every((s) => (s.trainerIds || []).length > 0),
      type: 'computed',
    },
    {
      id: 'website',
      label: 'Actif site web',
      done: ['published', 'in_progress', 'completed'].includes(training.status),
      type: 'computed',
    },
    {
      id: 'capacity',
      label: 'Capacité définie',
      done: Number(training.maxParticipants) > 0,
      type: 'computed',
    },
    {
      id: 'checklist',
      label: 'Checklist interne',
      done: (training.checklistItems || []).length > 0 && (training.checkedItems || []).length === (training.checklistItems || []).length,
      type: 'checklist',
    },
  ]

  const doneChecks = checks.filter((c) => c.done).length
  const totalChecks = checks.length
  const completionRatio = totalChecks > 0 ? doneChecks / totalChecks : 0

  const openSpots = Math.max(0, (Number(training.maxParticipants) || 0) - registrations.length)
  const priorityScore =
    (checks[0].done ? 0 : 3) +
    (checks[1].done ? 0 : 3) +
    (checks[2].done ? 0 : 3) +
    (checks[3].done ? 0 : 2) +
    (nextSession ? (new Date(nextSession.startDate).getTime() - now.getTime() < 1000 * 60 * 60 * 24 * 14 ? 2 : 0) : 1) +
    (training.status === 'cancelled' || training.status === 'completed' ? -3 : 0)

  return {
    nextSession,
    checks,
    doneChecks,
    totalChecks,
    completionRatio,
    registrationsCount: registrations.length,
    openSpots,
    priorityScore,
  }
}

export default function TrainingKanban({
  trainings = [],
  trainingTypes = [],
  trainingSessions = [],
  trainingRegistrations = [],
  search,
  onSearchChange,
  onCreateTraining,
  onViewTraining,
  onEditTraining,
  onViewCalendar,
  onViewReporting,
  onToggleChecklistItem,
}) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [completenessFilter, setCompletenessFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('priority')

  const typeMap = useMemo(() => Object.fromEntries(trainingTypes.map((t) => [t.id, t])), [trainingTypes])

  const rows = useMemo(() => {
    return trainings.map((training) => {
      const sessions = trainingSessions.filter((s) => s.trainingId === training.id)
      const registrations = trainingRegistrations.filter((r) => r.trainingId === training.id)
      const metrics = getTrainingMetrics(training, sessions, registrations)
      return {
        training,
        trainingType: typeMap[training.trainingTypeId],
        sessions,
        registrations,
        ...metrics,
      }
    })
  }, [trainings, trainingSessions, trainingRegistrations, typeMap])

  const filteredRows = useMemo(() => {
    const now = new Date()
    const plus30 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30)
    const plus90 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 90)

    let list = rows.filter((row) => {
      const { training, trainingType, nextSession, completionRatio } = row

      if (search?.trim()) {
        const q = search.trim().toLowerCase()
        const haystack = `${training.title} ${training.description || ''} ${training.coordinatorNote || ''} ${trainingType?.name || ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }

      if (statusFilter !== 'all' && training.status !== statusFilter) return false
      if (typeFilter !== 'all' && training.trainingTypeId !== typeFilter) return false

      if (periodFilter !== 'all') {
        if (periodFilter === 'undated' && row.sessions.length > 0) return false
        if (periodFilter !== 'undated') {
          if (!nextSession) return false
          const d = new Date(nextSession.startDate)
          if (periodFilter === 'next30' && (d < now || d > plus30)) return false
          if (periodFilter === 'next90' && (d < now || d > plus90)) return false
          if (periodFilter === 'past' && d >= now) return false
        }
      }

      if (completenessFilter === 'needs_work' && completionRatio >= 0.5) return false
      if (completenessFilter === 'almost_ready' && (completionRatio < 0.5 || completionRatio >= 0.85)) return false
      if (completenessFilter === 'ready' && completionRatio < 0.85) return false

      return true
    })

    list = [...list].sort((a, b) => {
      if (sortBy === 'priority') return b.priorityScore - a.priorityScore
      if (sortBy === 'completeness_desc') return b.completionRatio - a.completionRatio
      if (sortBy === 'completeness_asc') return a.completionRatio - b.completionRatio
      if (sortBy === 'updated_desc') return new Date(b.training.updatedAt) - new Date(a.training.updatedAt)

      const ad = a.nextSession ? new Date(a.nextSession.startDate).getTime() : Number.POSITIVE_INFINITY
      const bd = b.nextSession ? new Date(b.nextSession.startDate).getTime() : Number.POSITIVE_INFINITY
      if (sortBy === 'date_desc') return bd - ad
      return ad - bd
    })

    return list
  }, [rows, search, statusFilter, typeFilter, periodFilter, completenessFilter, sortBy])

  const missingLabel = (row) => row.checks.find((c) => !c.done)?.label || null

  const completionTone = (ratio) => {
    if (ratio >= 0.85) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
    if (ratio >= 0.5) return 'text-amber-700 bg-amber-50 border-amber-200'
    return 'text-rose-700 bg-rose-50 border-rose-200'
  }

  return (
    <section className="mx-auto max-w-[1500px] space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900">Opérations Formations</h1>
            <p className="mt-1 text-sm text-stone-600">Vue liste intelligente pour piloter des dizaines de formations en un coup d’œil.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => onViewCalendar?.('month')} className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-[#B01A19] hover:text-[#B01A19]"><Calendar className="h-4 w-4" />Calendrier</button>
            <button type="button" onClick={() => onViewReporting?.()} className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-[#B01A19] hover:text-[#B01A19]"><BarChart3 className="h-4 w-4" />Reporting</button>
            <button type="button" onClick={() => onCreateTraining?.()} className="inline-flex items-center gap-2 rounded-xl bg-[#B01A19] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8f1514]"><Plus className="h-4 w-4" />Nouvelle formation</button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-6">
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Recherche titre, type, note…"
            className="xl:col-span-2 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#B01A19]"
          />

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm">
            <option value="all">Tous statuts</option>
            {Object.entries(STATUS_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>

          <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm">
            {PERIOD_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>

          <select value={completenessFilter} onChange={(e) => setCompletenessFilter(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm">
            {COMPLETENESS_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm">
            <option value="all">Tous types</option>
            {trainingTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
          </select>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
          <span className="inline-flex items-center gap-1"><Filter className="h-3.5 w-3.5" /> {filteredRows.length} résultat{filteredRows.length !== 1 ? 's' : ''}</span>
          <label className="inline-flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>Trier par</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-700">
              {SORT_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-stone-200 bg-white lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 text-left">Formation</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Prochaine date</th>
                <th className="px-4 py-3 text-left">Checks</th>
                <th className="px-4 py-3 text-left">Participants</th>
                <th className="px-4 py-3 text-left">Actions rapides</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.training.id} className="border-t border-stone-100 align-top hover:bg-stone-50/60">
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => onViewTraining?.(row.training.id)} className="font-medium text-stone-900 text-left hover:text-[#B01A19] underline-offset-2 hover:underline">{row.training.title}</button>
                    <p className="text-xs text-stone-500">{row.trainingType?.name || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_TONE[row.training.status] || 'bg-stone-100 text-stone-700 border-stone-200'}`}>
                      {STATUS_LABELS[row.training.status] || row.training.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-700">{formatDate(row.nextSession?.startDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${completionTone(row.completionRatio)}`}>
                        {row.doneChecks}/{row.totalChecks}
                      </span>
                      {row.checks.map((check) => (
                        <span key={`${row.training.id}-${check.id}`} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] ${check.done ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                          {check.done ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />} {check.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-700">{row.registrationsCount}/{Number(row.training.maxParticipants) || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" onClick={() => onViewTraining?.(row.training.id)} className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-700 hover:border-stone-400"><Eye className="h-3.5 w-3.5" />Ouvrir</button>
                      <button type="button" onClick={() => onEditTraining?.(row.training.id)} className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-700 hover:border-stone-400"><Pencil className="h-3.5 w-3.5" />Éditer</button>
                      {!!missingLabel(row) && (
                        <button
                          type="button"
                          onClick={() => {
                            const firstMissingChecklist = (row.training.checklistItems || []).findIndex((_, idx) => !(row.training.checkedItems || []).includes(idx))
                            if (firstMissingChecklist >= 0) onToggleChecklistItem?.(row.training.id, firstMissingChecklist)
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#B01A19]/30 bg-[#B01A19]/5 px-2.5 py-1.5 text-xs text-[#8f1514] hover:bg-[#B01A19]/10"
                        >
                          <CheckSquare className="h-3.5 w-3.5" />
                          Marquer check
                        </button>
                      )}
                    </div>
                    {!!missingLabel(row) && <p className="mt-1.5 text-[11px] text-stone-500">À compléter: {missingLabel(row)}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 lg:hidden pb-20">
        {filteredRows.map((row) => (
          <article key={row.training.id} className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3><button type="button" onClick={() => onViewTraining?.(row.training.id)} className="text-sm font-semibold text-stone-900 hover:text-[#B01A19] underline-offset-2 hover:underline">{row.training.title}</button></h3>
                <p className="text-xs text-stone-500">{row.trainingType?.name || '—'} · {formatDate(row.nextSession?.startDate)}</p>
              </div>
              <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${STATUS_TONE[row.training.status] || 'bg-stone-100 text-stone-700 border-stone-200'}`}>
                {STATUS_LABELS[row.training.status] || row.training.status}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className={`inline-flex items-center rounded-full border px-2 py-1 font-semibold ${completionTone(row.completionRatio)}`}>
                {row.doneChecks}/{row.totalChecks}
              </span>
              <span className="text-stone-600">Participants: {row.registrationsCount}/{Number(row.training.maxParticipants) || 0}</span>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {row.checks.slice(0, 4).map((check) => (
                <span key={`${row.training.id}-mobile-${check.id}`} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] ${check.done ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                  {check.done ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />} {check.label}
                </span>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => onViewTraining?.(row.training.id)} className="flex-1 rounded-lg border border-stone-300 bg-white px-2 py-2 text-xs font-medium text-stone-700"><Eye className="mr-1 inline h-3.5 w-3.5" />Ouvrir</button>
              <button type="button" onClick={() => onEditTraining?.(row.training.id)} className="flex-1 rounded-lg border border-stone-300 bg-white px-2 py-2 text-xs font-medium text-stone-700"><Pencil className="mr-1 inline h-3.5 w-3.5" />Éditer</button>
            </div>
          </article>
        ))}
      </div>

      {filteredRows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <p className="text-sm font-medium text-stone-700">Aucune formation ne correspond aux filtres.</p>
          <button type="button" onClick={() => { setStatusFilter('all'); setPeriodFilter('all'); setCompletenessFilter('all'); setTypeFilter('all'); onSearchChange?.('') }} className="mt-2 inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-700"><X className="h-3.5 w-3.5" />Réinitialiser les filtres</button>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 p-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2">
          <button type="button" onClick={() => setCompletenessFilter(completenessFilter === 'needs_work' ? 'all' : 'needs_work')} className={`rounded-lg px-3 py-2 text-xs font-medium ${completenessFilter === 'needs_work' ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-700'}`}>À compléter</button>
          <button type="button" onClick={() => setPeriodFilter(periodFilter === 'next30' ? 'all' : 'next30')} className={`rounded-lg px-3 py-2 text-xs font-medium ${periodFilter === 'next30' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-700'}`}>30 jours</button>
          <button type="button" onClick={() => onCreateTraining?.()} className="inline-flex items-center gap-1 rounded-lg bg-[#B01A19] px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" />Nouvelle</button>
        </div>
      </div>
    </section>
  )
}
