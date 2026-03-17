import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Calendar } from 'lucide-react'
import KanbanTrainingCard from './KanbanTrainingCard'

const COLUMN_STYLES = {
  idea: {
    bg: 'bg-amber-50/30',
    border: 'border-amber-200/60',
    headerBg: 'bg-amber-100/70',
    headerText: 'text-amber-800',
    countBg: 'bg-amber-200 text-amber-800',
    dropBorder: 'border-amber-300',
  },
  in_construction: {
    bg: 'bg-violet-50/30',
    border: 'border-violet-200/60',
    headerBg: 'bg-violet-100/70',
    headerText: 'text-violet-800',
    countBg: 'bg-violet-200 text-violet-800',
    dropBorder: 'border-violet-300',
  },
  in_preparation: {
    bg: 'bg-blue-50/30',
    border: 'border-blue-200/60',
    headerBg: 'bg-blue-100/70',
    headerText: 'text-blue-800',
    countBg: 'bg-blue-200 text-blue-800',
    dropBorder: 'border-blue-300',
  },
  registrations_open: {
    bg: 'bg-green-50/30',
    border: 'border-green-200/60',
    headerBg: 'bg-green-100/70',
    headerText: 'text-green-800',
    countBg: 'bg-green-200 text-green-800',
    dropBorder: 'border-green-300',
    pulse: true,
  },
  in_progress: {
    bg: 'bg-[#B01A19]/[0.03]',
    border: 'border-[#B01A19]/20',
    headerBg: 'bg-[#B01A19]/10',
    headerText: 'text-[#8f1514]',
    countBg: 'bg-[#B01A19] text-white',
    dropBorder: 'border-[#B01A19]/40',
    pulse: true,
  },
  post_production: {
    bg: 'bg-teal-50/30',
    border: 'border-teal-200/60',
    headerBg: 'bg-teal-100/70',
    headerText: 'text-teal-800',
    countBg: 'bg-teal-200 text-teal-800',
    dropBorder: 'border-teal-300',
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
  onCreateTraining,
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${phase}`,
    data: { phase },
  })

  const styles = COLUMN_STYLES[phase] || COLUMN_STYLES.idea
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
            <p className="text-xs text-stone-400 font-medium">Aucune activité</p>
            {phase === 'idea' && onCreateTraining && (
              <button
                type="button"
                onClick={onCreateTraining}
                className="mt-3 text-xs text-[#B01A19] font-semibold hover:underline"
              >
                + Creer une activité
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
                readinessChecks={row.readinessChecks}
                allReady={row.allReady}
                isUrgent={row.isUrgent}
                onView={onViewTraining}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
