import React, { useMemo, useState } from 'react'
import {
  Plus,
  Eye,
  Pencil,
  Users,
  X,
  Calendar as CalendarIcon,
  MapPin,
  GraduationCap,
  Euro,
} from 'lucide-react'
import KanbanBoard, { PHASES } from './kanban/KanbanBoard'
import KanbanFilters from './kanban/KanbanFilters'
import KanbanTrainingCard from './kanban/KanbanTrainingCard'

const STATUS_LABELS = {
  idea: 'Idée',
  in_construction: 'En construction',
  in_preparation: 'En préparation',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  post_production: 'En post-prod',
  completed: 'Clôturée',
  cancelled: 'Annulée',
}

const STATUS_TONE = {
  idea: 'bg-amber-50 text-amber-700 border-amber-200',
  in_construction: 'bg-violet-50 text-violet-700 border-violet-200',
  in_preparation: 'bg-blue-50 text-blue-700 border-blue-200',
  registrations_open: 'bg-green-50 text-green-700 border-green-200',
  in_progress: 'bg-[#B01A19]/10 text-[#8f1514] border-[#B01A19]/30',
  post_production: 'bg-teal-50 text-teal-700 border-teal-200',
  completed: 'bg-stone-200 text-stone-800 border-stone-300',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
}

const STATUS_LEFT_BORDER = {
  idea: 'border-l-amber-400',
  in_construction: 'border-l-violet-400',
  in_preparation: 'border-l-blue-400',
  registrations_open: 'border-l-green-500',
  in_progress: 'border-l-[#B01A19]',
  post_production: 'border-l-teal-400',
  completed: 'border-l-stone-400',
  cancelled: 'border-l-rose-400',
}

const STATUS_ORDER = ['idea', 'in_construction', 'in_preparation', 'registrations_open', 'in_progress', 'post_production', 'completed', 'cancelled']

function formatDate(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' })
}

const READINESS_ICON_MAP = {
  date: CalendarIcon,
  location: MapPin,
  trainer: GraduationCap,
  price: Euro,
}

const PREPARATION_STATUSES = ['in_construction', 'in_preparation']

function getReadinessChecks(training, sessions) {
  return [
    { id: 'date', label: 'Date(s)', done: sessions.length > 0 },
    { id: 'location', label: 'Lieu', done: sessions.length > 0 && sessions.every((s) => (s.locationIds || []).length > 0) },
    { id: 'trainer', label: 'Formateur', done: sessions.length > 0 && sessions.every((s) => (s.trainerIds || []).length > 0) },
    { id: 'price', label: 'Prix', done: Number(training.price) > 0 },
  ]
}

function getTrainingMetrics(training, sessions, registrations) {
  const now = new Date()
  const nextSession = sessions
    .filter((s) => new Date(s.startDate).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0]

  const readinessChecks = getReadinessChecks(training, sessions)
  const allReady = readinessChecks.every((c) => c.done)
  const doneChecks = readinessChecks.filter((c) => c.done).length
  const totalChecks = readinessChecks.length
  const completionRatio = totalChecks > 0 ? doneChecks / totalChecks : 0
  const registrationsCount = registrations.length

  const priorityScore =
    (readinessChecks[0].done ? 0 : 3) +
    (readinessChecks[1].done ? 0 : 3) +
    (readinessChecks[2].done ? 0 : 3) +
    (readinessChecks[3].done ? 0 : 2) +
    (nextSession ? (new Date(nextSession.startDate).getTime() - now.getTime() < 1000 * 60 * 60 * 24 * 14 ? 2 : 0) : 1) +
    (training.status === 'cancelled' || training.status === 'completed' ? -3 : 0)

  const isUrgent =
    nextSession &&
    new Date(nextSession.startDate).getTime() - now.getTime() < 1000 * 60 * 60 * 24 * 14 &&
    completionRatio < 0.85

  return { nextSession, readinessChecks, allReady, doneChecks, totalChecks, completionRatio, registrationsCount, priorityScore, isUrgent }
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
  onDeleteTraining,
  onUpdateTrainingStatus,
  onToggleChecklistItem,
}) {
  const [statusFilters, setStatusFilters] = useState([])
  const [periodFilter, setPeriodFilter] = useState('all')
  const [completenessFilter, setCompletenessFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('priority')
  const [viewMode, setViewMode] = useState('kanban')
  const [showClosed, setShowClosed] = useState(false)
  const [mobilePhase, setMobilePhase] = useState('conception')

  const typeMap = useMemo(() => Object.fromEntries(trainingTypes.map((t) => [t.id, t])), [trainingTypes])

  const rows = useMemo(() => {
    return trainings.map((training) => {
      const sessions = trainingSessions.filter((s) => s.trainingId === training.id)
      const registrations = trainingRegistrations.filter((r) => r.trainingId === training.id)
      const metrics = getTrainingMetrics(training, sessions, registrations)
      return { training, trainingType: typeMap[training.trainingTypeId], sessions, registrations, ...metrics }
    })
  }, [trainings, trainingSessions, trainingRegistrations, typeMap])

  const filteredRows = useMemo(() => {
    const now = new Date()
    const plus30 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30)
    const plus90 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 90)

    const CLOSED_STATUSES = ['completed', 'cancelled']

    let list = rows.filter((row) => {
      const { training, trainingType, nextSession, completionRatio } = row

      if (!showClosed && CLOSED_STATUSES.includes(training.status)) return false

      if (search?.trim()) {
        const q = search.trim().toLowerCase()
        const haystack = `${training.title} ${training.description || ''} ${training.coordinatorNote || ''} ${trainingType?.name || ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }

      if (statusFilters.length > 0 && !statusFilters.includes(training.status)) return false
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
  }, [rows, search, statusFilters, typeFilter, periodFilter, completenessFilter, sortBy, showClosed])

  // For kanban: use filtered trainings (mapped back to just the training objects)
  const filteredTrainingIds = useMemo(() => new Set(filteredRows.map((r) => r.training.id)), [filteredRows])
  const kanbanTrainings = useMemo(
    () => trainings.filter((t) => filteredTrainingIds.has(t.id)),
    [trainings, filteredTrainingIds]
  )

  // List view: group filtered rows by status
  const groupedRows = useMemo(() => {
    return STATUS_ORDER
      .map((status) => ({
        status,
        label: STATUS_LABELS[status],
        rows: filteredRows.filter((r) => r.training.status === status),
      }))
      .filter((g) => g.rows.length > 0)
  }, [filteredRows])

  // Mobile: group filtered rows by phase
  const mobileColumns = useMemo(() => {
    return PHASES.map((phase) => ({
      ...phase,
      cards: filteredRows.filter((r) => phase.statuses.includes(r.training.status)),
    }))
  }, [filteredRows])

  const hasAnyFilter = statusFilters.length > 0 || periodFilter !== 'all' || completenessFilter !== 'all' || typeFilter !== 'all' || (search?.trim())

  return (
    <section className="mx-auto max-w-[1600px] space-y-5">
      <style>{`
        @keyframes kanbanFadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes kanbanCardIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes kanbanFilterSlideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header — matches design reference with red accent bar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight" style={{ fontFamily: 'var(--font-heading, "Sole Serif", serif)' }}>
              Semisto Academy
            </h1>
            <p className="text-sm text-stone-500 mt-1 font-medium">
              Inspirer, initier et former autour du concept du jardin-forêt
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onCreateTraining?.()}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#B01A19] hover:bg-[#8f1514] rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Nouvelle activité
          </button>
        </div>
      </div>

      {/* Filters toolbar */}
      <KanbanFilters
        search={search}
        onSearchChange={onSearchChange}
        statusFilters={statusFilters}
        onStatusFiltersChange={setStatusFilters}
        periodFilter={periodFilter}
        onPeriodFilterChange={setPeriodFilter}
        completenessFilter={completenessFilter}
        onCompletenessFilterChange={setCompletenessFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        trainingTypes={trainingTypes}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showClosed={showClosed}
        onShowClosedChange={setShowClosed}
        resultCount={filteredRows.length}
      />

      {/* Desktop: Kanban or List view */}
      <div className="hidden lg:block">
        {viewMode === 'kanban' ? (
          <KanbanBoard
            trainings={kanbanTrainings}
            trainingTypes={trainingTypes}
            trainingSessions={trainingSessions}
            trainingRegistrations={trainingRegistrations}
            onUpdateTrainingStatus={onUpdateTrainingStatus}
            onViewTraining={onViewTraining}
            onCreateTraining={onCreateTraining}
            showClosed={showClosed}
          />
        ) : (
          /* Improved list view */
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="w-1" />
                    <th className="px-4 py-3 text-left">Activité</th>
                    <th className="px-4 py-3 text-left">Prochaine date</th>
                    <th className="px-4 py-3 text-left">Checks</th>
                    <th className="px-4 py-3 text-left">Participants</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                {groupedRows.map((group) => (
                  <tbody key={group.status}>
                    <tr className="bg-stone-50/80">
                      <td className={`w-1 border-l-[3px] ${STATUS_LEFT_BORDER[group.status] || 'border-l-stone-200'}`} />
                      <td colSpan={5} className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[group.status] || 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                            {group.label}
                          </span>
                          <span className="text-[11px] text-stone-400 font-medium">{group.rows.length} activité{group.rows.length > 1 ? 's' : ''}</span>
                        </div>
                      </td>
                    </tr>
                    {group.rows.map((row) => {
                      const maxP = Number(row.training.maxParticipants) || 0
                      const fillPct = maxP > 0 ? Math.round((row.registrationsCount / maxP) * 100) : 0
                      const fillColor = fillPct >= 60 ? 'bg-emerald-500' : fillPct >= 30 ? 'bg-amber-500' : 'bg-rose-500'
                      return (
                        <tr key={row.training.id} className="border-t border-stone-100 align-middle hover:bg-stone-50/60 group/row transition-colors">
                          <td className={`w-1 border-l-[3px] ${STATUS_LEFT_BORDER[row.training.status] || 'border-l-stone-200'}`} />
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => onViewTraining?.(row.training.id)} className="font-semibold text-stone-900 text-left hover:text-[#B01A19] underline-offset-2 hover:underline">
                              {row.training.title}
                            </button>
                            <p className="text-xs text-stone-500">{row.trainingType?.name || '—'}</p>
                          </td>
                          <td className="px-4 py-3 text-stone-700 text-xs">{formatDate(row.nextSession?.startDate)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {row.readinessChecks.map((check) => {
                                const Icon = READINESS_ICON_MAP[check.id]
                                if (!Icon) return null
                                return (
                                  <div
                                    key={check.id}
                                    className={`flex items-center justify-center w-6 h-6 rounded-md ${
                                      check.done
                                        ? 'bg-emerald-50 text-emerald-500'
                                        : 'bg-rose-50 text-rose-400'
                                    }`}
                                    title={`${check.label} : ${check.done ? 'OK' : 'Manquant'}`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>
                                )
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-xs text-stone-700">
                              <span className="tabular-nums font-medium">{row.registrationsCount}/{maxP || '—'}</span>
                              {maxP > 0 && (
                                <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${fillColor}`} style={{ width: `${Math.min(fillPct, 100)}%` }} />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5 opacity-60 group-hover/row:opacity-100 transition-opacity">
                              <button type="button" onClick={() => onViewTraining?.(row.training.id)} className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 hover:border-stone-400">
                                <Eye className="h-3.5 w-3.5" /> Ouvrir
                              </button>
                              <button type="button" onClick={() => onEditTraining?.(row.training.id)} className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 hover:border-stone-400">
                                <Pencil className="h-3.5 w-3.5" /> Editer
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                ))}
              </table>
            </div>
            {filteredRows.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-stone-500">Aucune activité ne correspond aux filtres.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile: Phase tabs + card list */}
      <div className="lg:hidden space-y-3">
        {/* Phase tab pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {mobileColumns.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => setMobilePhase(col.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                mobilePhase === col.id
                  ? 'bg-[#B01A19] text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {col.label}
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                mobilePhase === col.id ? 'bg-white/20' : 'bg-stone-200'
              }`}>
                {col.cards.length}
              </span>
            </button>
          ))}
        </div>

        {/* Cards for selected phase */}
        <div className="space-y-2.5 pb-20">
          {mobileColumns.find((c) => c.id === mobilePhase)?.cards.map((row) => (
            <KanbanTrainingCard
              key={row.training.id}
              training={row.training}
              trainingType={row.trainingType}
              nextSession={row.nextSession}
              registrationsCount={row.registrationsCount}
              maxParticipants={Number(row.training.maxParticipants) || 0}
              readinessChecks={row.readinessChecks}
              allReady={row.allReady}
              isUrgent={row.isUrgent}
              onView={onViewTraining}
            />
          ))}
          {mobileColumns.find((c) => c.id === mobilePhase)?.cards.length === 0 && (
            <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 py-10 text-center">
              <p className="text-sm text-stone-400">Aucune activité dans cette phase</p>
            </div>
          )}
        </div>

        {/* Mobile bottom bar */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 p-2 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setCompletenessFilter(completenessFilter === 'needs_work' ? 'all' : 'needs_work')}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${completenessFilter === 'needs_work' ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-700'}`}
            >
              A completer
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter(periodFilter === 'next30' ? 'all' : 'next30')}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${periodFilter === 'next30' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-700'}`}
            >
              30 jours
            </button>
            <button
              type="button"
              onClick={() => onCreateTraining?.()}
              className="inline-flex items-center gap-1 rounded-lg bg-[#B01A19] px-3 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Nouvelle
            </button>
          </div>
        </div>
      </div>

      {/* Global empty state */}
      {trainings.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-16 px-6">
          <div className="mb-4 rounded-full bg-stone-100 p-4">
            <Calendar className="h-8 w-8 text-stone-400" />
          </div>
          <p className="text-base font-medium text-stone-700">Aucune activité</p>
          <p className="mt-1 text-sm text-stone-500">Commencez par creer votre premiere activité</p>
          <button
            type="button"
            onClick={() => onCreateTraining?.()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#B01A19] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8f1514]"
          >
            <Plus className="w-4 h-4" /> Nouvelle activité
          </button>
        </div>
      )}
    </section>
  )
}
