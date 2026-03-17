import React from 'react'
import { Link } from '@inertiajs/react'
import { Calendar, FileText, Clock, ArrowRight } from 'lucide-react'
import { myPath } from '../lib/paths'

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

const STATUS_STYLES = {
  idea:               { bg: '#d9770618', text: '#b45309', dot: '#d97706' },
  in_construction:    { bg: '#7c3aed18', text: '#6d28d9', dot: '#7c3aed' },
  in_preparation:     { bg: '#23476618', text: '#234766', dot: '#234766' },
  registrations_open: { bg: '#2D6A4F18', text: '#2D6A4F', dot: '#2D6A4F' },
  in_progress:        { bg: '#B01A1918', text: '#B01A19', dot: '#B01A19' },
  post_production:    { bg: '#0d948818', text: '#0f766e', dot: '#0d9488' },
  completed:          { bg: '#2D6A4F18', text: '#2D6A4F', dot: '#2D6A4F' },
  cancelled:          { bg: '#B01A1918', text: '#B01A19', dot: '#B01A19' },
}

const DEFAULT_STATUS_STYLE = { bg: '#78716c18', text: '#78716c', dot: '#78716c' }

function formatDateRange(startDate, endDate) {
  if (!startDate) return 'Dates non définies'
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : null
  const opts = { day: 'numeric', month: 'short', year: 'numeric' }
  const startStr = start.toLocaleDateString('fr-FR', opts)
  if (!end || startStr === end.toLocaleDateString('fr-FR', opts)) return startStr
  return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('fr-FR', opts)}`
}

export default function TrainingCard({ training }) {
  const statusLabel = STATUS_LABELS[training.status] || training.status
  const style = STATUS_STYLES[training.status] || DEFAULT_STATUS_STYLE

  return (
    <Link
      href={`${myPath('/academy')}/${training.id}`}
      className="block rounded-2xl bg-white border border-stone-200 p-5 transition-all group my-card-accent my-warm-glow"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3
            className="text-base font-semibold text-stone-800 group-hover:text-[#B01A19] transition-colors truncate"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {training.title}
          </h3>
          {training.trainingType && (
            <p className="text-xs text-stone-500 mt-0.5">{training.trainingType}</p>
          )}
        </div>
        <span
          className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5"
          style={{ backgroundColor: style.bg, color: style.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center justify-between">
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
        <ArrowRight size={16} className="text-stone-300 group-hover:text-[#B01A19] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </div>
    </Link>
  )
}
