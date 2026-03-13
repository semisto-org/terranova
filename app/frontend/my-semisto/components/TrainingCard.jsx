import React from 'react'
import { Link } from '@inertiajs/react'
import { Calendar, FileText, Clock } from 'lucide-react'

const STATUS_LABELS = {
  draft: 'Brouillon',
  planned: 'Planifiee',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  completed: 'Terminee',
  cancelled: 'Annulee',
  idea: 'Idee',
  to_organize: 'A organiser',
  in_preparation: 'En preparation',
  to_publish: 'A publier',
  published: 'Publiee',
  post_training: 'Post-formation',
}

const STATUS_COLORS = {
  draft: 'bg-stone-100 text-stone-600',
  planned: 'bg-blue-100 text-blue-700',
  registrations_open: 'bg-emerald-100 text-emerald-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  idea: 'bg-purple-100 text-purple-700',
  to_organize: 'bg-orange-100 text-orange-700',
  in_preparation: 'bg-cyan-100 text-cyan-700',
  to_publish: 'bg-indigo-100 text-indigo-700',
  published: 'bg-teal-100 text-teal-700',
  post_training: 'bg-stone-100 text-stone-600',
}

function formatDateRange(startDate, endDate) {
  if (!startDate) return 'Dates non definies'
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : null
  const opts = { day: 'numeric', month: 'short', year: 'numeric' }
  const startStr = start.toLocaleDateString('fr-FR', opts)
  if (!end || startStr === end.toLocaleDateString('fr-FR', opts)) return startStr
  return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('fr-FR', opts)}`
}

export default function TrainingCard({ training }) {
  const statusLabel = STATUS_LABELS[training.status] || training.status
  const statusColor = STATUS_COLORS[training.status] || 'bg-stone-100 text-stone-600'

  return (
    <Link
      href={`/my/academy/${training.id}`}
      className="block rounded-2xl bg-white border border-stone-200 p-5 hover:shadow-md hover:border-stone-300 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3
            className="text-base font-semibold text-stone-800 group-hover:text-[#2D6A4F] transition-colors truncate"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {training.title}
          </h3>
          {training.trainingType && (
            <p className="text-xs text-stone-500 mt-0.5">{training.trainingType}</p>
          )}
        </div>
        <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <Calendar size={14} />
          {formatDateRange(training.startDate, training.endDate)}
        </span>
        {training.sessionCount > 0 && (
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {training.sessionCount} session{training.sessionCount > 1 ? 's' : ''}
          </span>
        )}
        {training.documentCount > 0 && (
          <span className="flex items-center gap-1.5">
            <FileText size={14} />
            {training.documentCount} doc{training.documentCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </Link>
  )
}
