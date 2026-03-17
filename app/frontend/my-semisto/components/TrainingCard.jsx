import React from 'react'
import { Link } from '@inertiajs/react'
import { Calendar, FileText, Clock, ArrowRight } from 'lucide-react'
import { myPath } from '../lib/paths'

const STATUS_LABELS = {
  draft: 'Brouillon',
  planned: 'Planifiée',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
  idea: 'Idée',
  to_organize: 'À organiser',
  in_preparation: 'En préparation',
  to_publish: 'À publier',
  published: 'Publiée',
  post_training: 'Post-formation',
}

const STATUS_STYLES = {
  draft:              { bg: '#78716c18', text: '#78716c', dot: '#78716c' },
  planned:            { bg: '#23476618', text: '#234766', dot: '#234766' },
  registrations_open: { bg: '#2D6A4F18', text: '#2D6A4F', dot: '#2D6A4F' },
  in_progress:        { bg: '#EF9B0D18', text: '#b27308', dot: '#EF9B0D' },
  completed:          { bg: '#2D6A4F18', text: '#2D6A4F', dot: '#2D6A4F' },
  cancelled:          { bg: '#B01A1918', text: '#B01A19', dot: '#B01A19' },
  idea:               { bg: '#5B578118', text: '#5B5781', dot: '#5B5781' },
  to_organize:        { bg: '#EF9B0D18', text: '#b27308', dot: '#EF9B0D' },
  in_preparation:     { bg: '#23476618', text: '#234766', dot: '#234766' },
  to_publish:         { bg: '#5B578118', text: '#5B5781', dot: '#5B5781' },
  published:          { bg: '#AFBD0018', text: '#7a8500', dot: '#AFBD00' },
  post_training:      { bg: '#78716c18', text: '#78716c', dot: '#78716c' },
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
