import React, { useMemo, useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import KanbanColumn from './KanbanColumn'
import KanbanTrainingCard from './KanbanTrainingCard'

// Séance 2 : « en construction » fusionné dans « en préparation » ; « en cours »
// n'est plus une colonne (il sort du Kanban dans un bandeau en haut) mais reste
// un statut. Les colonnes du Kanban couvrent donc la phase de conception →
// inscriptions → post-prod → clôture.
const PHASES = [
  { id: 'idea', label: 'Idée', statuses: ['idea'], defaultStatus: 'idea' },
  { id: 'in_preparation', label: 'En préparation', statuses: ['in_preparation'], defaultStatus: 'in_preparation' },
  { id: 'registrations_open', label: 'Inscriptions ouvertes', statuses: ['registrations_open'], defaultStatus: 'registrations_open' },
  { id: 'post_production', label: 'En post-prod', statuses: ['post_production'], defaultStatus: 'post_production' },
  { id: 'cloture', label: 'Clôture', statuses: ['completed', 'cancelled'], defaultStatus: 'completed' },
]

export { PHASES }

function getPhaseForStatus(status) {
  return PHASES.find((p) => p.statuses.includes(status)) || PHASES[0]
}

function hasPrice(training) {
  if (Number(training.price) > 0) return true
  if ((training.participantCategories || []).some((c) => Number(c.price) > 0)) return true
  if ((training.packs || []).some((p) => Number(p.price) > 0)) return true
  return false
}

function getReadinessChecks(training, sessions) {
  return [
    { id: 'date', label: 'Date(s)', done: sessions.length > 0 },
    { id: 'location', label: 'Lieu', done: sessions.length > 0 && sessions.every((s) => (s.locationIds || []).length > 0) },
    { id: 'trainer', label: 'Formateur', done: sessions.length > 0 && sessions.every((s) => (s.trainerIds || []).length > 0) },
    { id: 'price', label: 'Prix', done: hasPrice(training) },
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
  const registrationsCount = Number(training.totalSpotsTaken) || 0

  const isUrgent =
    nextSession &&
    new Date(nextSession.startDate).getTime() - now.getTime() < 1000 * 60 * 60 * 24 * 14 &&
    completionRatio < 0.85

  return { nextSession, readinessChecks, allReady, doneChecks, totalChecks, completionRatio, registrationsCount, isUrgent }
}

export default function KanbanBoard({
  trainings = [],
  trainingTypes = [],
  trainingSessions = [],
  trainingRegistrations = [],
  onUpdateTrainingStatus,
  onViewTraining,
  onCreateTraining,
  showClosed = false,
}) {
  const [activeId, setActiveId] = useState(null)
  const [blockedMessage, setBlockedMessage] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const typeMap = useMemo(
    () => Object.fromEntries(trainingTypes.map((t) => [t.id, t])),
    [trainingTypes]
  )

  const rows = useMemo(() => {
    return trainings.map((training) => {
      const sessions = trainingSessions.filter((s) => s.trainingId === training.id)
      const registrations = trainingRegistrations.filter((r) => r.trainingId === training.id)
      const metrics = getTrainingMetrics(training, sessions, registrations)
      return {
        training,
        trainingType: typeMap[training.trainingTypeId],
        ...metrics,
      }
    })
  }, [trainings, trainingSessions, trainingRegistrations, typeMap])

  const rowMap = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.training.id, r])),
    [rows]
  )

  const columns = useMemo(() => {
    const visiblePhases = showClosed ? PHASES : PHASES.filter((p) => p.id !== 'cloture')
    return visiblePhases.map((phase) => ({
      ...phase,
      cards: rows.filter((r) => phase.statuses.includes(r.training.status)),
    }))
  }, [rows, showClosed])

  // « En cours » sort du Kanban : on l'affiche dans un bandeau au-dessus.
  const inProgressRows = useMemo(
    () => rows.filter((r) => r.training.status === 'in_progress'),
    [rows]
  )

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id)
  }, [])

  const handleDragEnd = useCallback(
    (event) => {
      setActiveId(null)
      const { active, over } = event
      if (!over) return

      const trainingId = active.id
      const row = rowMap[trainingId]
      if (!row) return

      const targetColumnId = over.id.toString().startsWith('column-')
        ? over.id.toString().replace('column-', '')
        : getPhaseForStatus(rowMap[over.id]?.training?.status || '')?.id

      if (!targetColumnId) return

      const sourcePhase = getPhaseForStatus(row.training.status)
      const targetPhase = PHASES.find((p) => p.id === targetColumnId)
      if (!targetPhase || sourcePhase.id === targetPhase.id) return

      // Block drop to registrations_open if not all ready
      if (targetPhase.defaultStatus === 'registrations_open' && !row.allReady) {
        const missing = row.readinessChecks.filter((c) => !c.done).map((c) => c.label)
        setBlockedMessage(`Avant d'ouvrir les inscriptions : ${missing.join(', ')}`)
        setTimeout(() => setBlockedMessage(null), 4000)
        return
      }

      // Clôture (#48) : avertir (sans bloquer) si les critères ne sont pas remplis.
      if (targetPhase.defaultStatus === 'completed') {
        const cr = row.training.closureReadiness
        if (cr && !cr.ready) {
          const missing = []
          if (!cr.allPaid && cr.unpaidCount > 0) missing.push(`${cr.unpaidCount} paiement(s) à encaisser`)
          if (!cr.documentsSent) missing.push('documents non envoyés')
          if (!cr.expensesReceived) missing.push('factures/dépenses non confirmées')
          if (missing.length && !window.confirm(`Critères de clôture non remplis :\n— ${missing.join('\n— ')}\n\nClôturer quand même ?`)) return
        }
      }

      onUpdateTrainingStatus?.(trainingId, targetPhase.defaultStatus)
    },
    [rowMap, onUpdateTrainingStatus]
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

  const activeRow = activeId ? rowMap[activeId] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Bandeau « En cours » — au-dessus du Kanban, hors colonnes */}
      {inProgressRows.length > 0 && (
        <div className="mb-4 rounded-xl border border-[#B01A19]/20 bg-[#B01A19]/[0.04] px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#B01A19] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wide text-[#8f1514]">En cours</span>
            <span className="text-[11px] text-stone-400 font-medium">{inProgressRows.length}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {inProgressRows.map((row) => (
              <button
                key={row.training.id}
                type="button"
                onClick={() => onViewTraining?.(row.training.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#B01A19]/20 bg-white px-3 py-2 text-left shadow-sm hover:border-[#B01A19]/40 hover:shadow transition-all"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: row.trainingType?.color || '#B01A19' }}
                />
                <span className="text-sm font-medium text-stone-800">{row.training.title}</span>
                {row.nextSession && (
                  <span className="text-xs text-stone-400">
                    {new Date(row.nextSession.startDate).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short' })}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4 min-w-max">
          {columns.map((col, index) => (
            <KanbanColumn
              key={col.id}
              phase={col.id}
              label={col.label}
              cards={col.cards}
              index={index}
              onViewTraining={onViewTraining}
              onCreateTraining={onCreateTraining}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeRow && (
          <div className="w-72">
            <KanbanTrainingCard
              training={activeRow.training}
              trainingType={activeRow.trainingType}
              nextSession={activeRow.nextSession}
              registrationsCount={activeRow.registrationsCount}
              maxParticipants={Number(activeRow.training.totalCapacity) || Number(activeRow.training.maxParticipants) || 0}
              readinessChecks={activeRow.readinessChecks}
              allReady={activeRow.allReady}
              isUrgent={activeRow.isUrgent}
              isDragOverlay
            />
          </div>
        )}
      </DragOverlay>

      {/* Toast for blocked drop */}
      {blockedMessage && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md"
          style={{ animation: 'toastSlideUp 0.3s ease-out' }}
        >
          <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-white px-5 py-3.5 shadow-2xl">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-stone-800">{blockedMessage}</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes toastSlideUp {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </DndContext>
  )
}
