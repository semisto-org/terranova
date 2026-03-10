import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Calendar } from 'lucide-react'
import KanbanTrainingCard from './KanbanTrainingCard'

const COLUMN_STYLES = {
  conception: {
    bg: 'bg-stone-50/60',
    border: 'border-stone-200',
    headerBg: 'bg-stone-100',
    headerText: 'text-stone-700',
    countBg: 'bg-stone-200 text-stone-700',
    dropBorder: 'border-stone-300',
  },
  publication: {
    bg: 'bg-indigo-50/30',
    border: 'border-indigo-200/60',
    headerBg: 'bg-indigo-100/70',
    headerText: 'text-indigo-800',
    countBg: 'bg-indigo-200 text-indigo-800',
    dropBorder: 'border-indigo-300',
  },
  inscriptions: {
    bg: 'bg-green-50/30',
    border: 'border-green-200/60',
    headerBg: 'bg-green-100/70',
    headerText: 'text-green-800',
    countBg: 'bg-green-200 text-green-800',
    dropBorder: 'border-green-300',
    pulse: true,
  },
  en_cours: {
    bg: 'bg-[#B01A19]/[0.03]',
    border: 'border-[#B01A19]/20',
    headerBg: 'bg-[#B01A19]/10',
    headerText: 'text-[#8f1514]',
    countBg: 'bg-[#B01A19] text-white',
    dropBorder: 'border-[#B01A19]/40',
    pulse: true,
  },
  cloture: {
    bg: 'bg-stone-50/40',
    border: 'border-stone-200/60',
    headerBg: 'bg-stone-100/60',
    headerText: 'text-stone-500',
    countBg: 'bg-stone-200 text-stone-600',
    dropBorder: 'border-stone-300',
  },
}

export default function KanbanColumn({
  phase,
  label,
  cards,
  index,
  onViewTraining,
  onEditTraining,
  onDeleteTraining,
  onCreateTraining,
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${phase}`,
    data: { phase },
  })

  const styles = COLUMN_STYLES[phase] || COLUMN_STYLES.conception
  const count = cards.length

  return (
    <div
      className="flex-shrink-0 w-72 flex flex-col"
      style={{
        animation: 'kanbanFadeInUp 0.4s ease-out forwards',
        animationDelay: `${index * 60}ms`,
        opacity: 0,
      }}
    >
      {/* Column header */}
      <div className={`flex items-center gap-2.5 rounded-t-xl px-4 py-3 ${styles.headerBg}`}>
        {styles.pulse && count > 0 && (
          <span className="h-2 w-2 rounded-full bg-[#B01A19] animate-pulse shrink-0" />
        )}
        <h2 className={`text-xs font-bold uppercase tracking-wider ${styles.headerText}`}>
          {label}
        </h2>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${styles.countBg}`}>
          {count}
        </span>
      </div>

      {/* Droppable card area */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 rounded-b-xl border-2 border-t-0 p-2.5 space-y-2.5
          transition-all duration-200 min-h-[220px]
          ${styles.bg}
          ${isOver ? `${styles.dropBorder} border-dashed bg-white/80` : `${styles.border} border-solid`}
        `}
      >
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 rounded-full bg-stone-100 p-3">
              <Calendar className="w-5 h-5 text-stone-300" />
            </div>
            <p className="text-xs text-stone-400 font-medium">Aucune formation</p>
            {phase === 'conception' && onCreateTraining && (
              <button
                type="button"
                onClick={onCreateTraining}
                className="mt-3 text-xs text-[#B01A19] font-semibold hover:underline"
              >
                + Creer une formation
              </button>
            )}
          </div>
        ) : (
          cards.map((row, cardIndex) => (
            <div
              key={row.training.id}
              style={{
                animation: 'kanbanCardIn 0.3s ease-out forwards',
                animationDelay: `${index * 60 + cardIndex * 40}ms`,
                opacity: 0,
              }}
            >
              <KanbanTrainingCard
                training={row.training}
                trainingType={row.trainingType}
                nextSession={row.nextSession}
                registrationsCount={row.registrationsCount}
                maxParticipants={Number(row.training.maxParticipants) || 0}
                doneChecks={row.doneChecks}
                totalChecks={row.totalChecks}
                completionRatio={row.completionRatio}
                isUrgent={row.isUrgent}
                onView={onViewTraining}
                onEdit={onEditTraining}
                onDelete={onDeleteTraining}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
