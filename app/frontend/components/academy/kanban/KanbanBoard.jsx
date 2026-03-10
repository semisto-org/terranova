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

const PHASES = [
  {
    id: 'conception',
    label: 'Conception',
    statuses: ['idea', 'to_organize', 'in_preparation'],
    defaultStatus: 'idea',
  },
  {
    id: 'publication',
    label: 'Publication',
    statuses: ['to_publish', 'published'],
    defaultStatus: 'to_publish',
  },
  {
    id: 'inscriptions',
    label: 'Inscriptions',
    statuses: ['registrations_open'],
    defaultStatus: 'registrations_open',
  },
  {
    id: 'en_cours',
    label: 'En cours',
    statuses: ['in_progress', 'post_training'],
    defaultStatus: 'in_progress',
  },
  {
    id: 'cloture',
    label: 'Cloture',
    statuses: ['completed', 'cancelled'],
    defaultStatus: 'completed',
  },
]

export { PHASES }

function getPhaseForStatus(status) {
  return PHASES.find((p) => p.statuses.includes(status)) || PHASES[0]
}

function getTrainingMetrics(training, sessions, registrations) {
  const now = new Date()
  const nextSession = sessions
    .filter((s) => new Date(s.startDate).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0]

  const checks = [
    { id: 'date', done: sessions.length > 0 },
    { id: 'location', done: sessions.length > 0 && sessions.every((s) => (s.locationIds || []).length > 0) },
    { id: 'trainers', done: sessions.length > 0 && sessions.every((s) => (s.trainerIds || []).length > 0) },
    { id: 'capacity', done: Number(training.maxParticipants) > 0 },
    {
      id: 'checklist',
      done: (training.checklistItems || []).length > 0 && (training.checkedItems || []).length === (training.checklistItems || []).length,
    },
  ]
  const doneChecks = checks.filter((c) => c.done).length
  const totalChecks = checks.length
  const completionRatio = totalChecks > 0 ? doneChecks / totalChecks : 0
  const registrationsCount = registrations.length

  const isUrgent =
    nextSession &&
    new Date(nextSession.startDate).getTime() - now.getTime() < 1000 * 60 * 60 * 24 * 14 &&
    completionRatio < 0.85

  return { nextSession, doneChecks, totalChecks, completionRatio, registrationsCount, isUrgent }
}

export default function KanbanBoard({
  trainings = [],
  trainingTypes = [],
  trainingSessions = [],
  trainingRegistrations = [],
  onUpdateTrainingStatus,
  onViewTraining,
  onEditTraining,
  onDeleteTraining,
  onCreateTraining,
  showClosed = false,
}) {
  const [activeId, setActiveId] = useState(null)

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

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id)
  }, [])

  const handleDragEnd = useCallback(
    (event) => {
      setActiveId(null)
      const { active, over } = event
      if (!over) return

      const trainingId = active.id
      const training = rowMap[trainingId]?.training
      if (!training) return

      const targetColumnId = over.id.toString().startsWith('column-')
        ? over.id.toString().replace('column-', '')
        : getPhaseForStatus(rowMap[over.id]?.training?.status || '')?.id

      if (!targetColumnId) return

      const sourcePhase = getPhaseForStatus(training.status)
      const targetPhase = PHASES.find((p) => p.id === targetColumnId)
      if (!targetPhase || sourcePhase.id === targetPhase.id) return

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
              onEditTraining={onEditTraining}
              onDeleteTraining={onDeleteTraining}
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
              maxParticipants={Number(activeRow.training.maxParticipants) || 0}
              doneChecks={activeRow.doneChecks}
              totalChecks={activeRow.totalChecks}
              completionRatio={activeRow.completionRatio}
              isUrgent={activeRow.isUrgent}
              isDragOverlay
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
