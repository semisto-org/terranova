import React, { useState, useRef, useEffect } from 'react'
import { Calendar, Users, Home, MoreVertical, Pencil, Trash2 } from 'lucide-react'

const STATUS_LABELS = {
  draft: 'Brouillon',
  planned: 'Planifiée',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const STATUS_COLORS = {
  draft: 'bg-stone-100 text-stone-700',
  planned: 'bg-blue-100 text-blue-700',
  registrations_open: 'bg-green-100 text-green-700',
  in_progress: 'bg-[#B01A19]/10 text-[#B01A19]',
  completed: 'bg-stone-200 text-stone-800',
  cancelled: 'bg-red-100 text-red-700',
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function TrainingCard({
  training,
  trainingType,
  registrations = [],
  sessions = [],
  onView,
  onEdit,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const participantCount = registrations.length
  const maxParticipants = Number(training.maxParticipants) || 0
  const fillPercentage = maxParticipants > 0
    ? Math.round((participantCount / maxParticipants) * 100)
    : 0

  const nextSession = sessions
    .filter((s) => new Date(s.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0]

  const isActiveStatus = training.status === 'in_progress' || training.status === 'registrations_open'

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView?.(training.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onView?.(training.id)
        }
      }}
      className={`bg-white rounded-xl border-2 p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden ${
        isActiveStatus
          ? 'border-[#B01A19]/30 hover:border-[#B01A19]/50'
          : 'border-stone-200 hover:border-stone-300'
      } hover:-translate-y-0.5`}
    >
      {isActiveStatus && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#B01A19] to-[#eac7b8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-stone-900 text-sm mb-1.5 line-clamp-2 leading-snug">
            {training.title}
          </h3>
          {trainingType && (
            <p className="text-xs text-stone-500 truncate font-medium">{trainingType.name}</p>
          )}
        </div>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-stone-100 transition-all duration-200 hover:scale-110 text-stone-400 hover:text-[#B01A19]"
            aria-label="Actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 py-1 w-40 bg-white rounded-lg border border-stone-200 shadow-lg z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onEdit?.(training.id)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
              >
                <Pencil className="w-4 h-4" />
                Modifier
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onDelete?.(training.id)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm transition-all duration-200 group-hover:scale-105 ${STATUS_COLORS[training.status] || STATUS_COLORS.draft}`}
        >
          {STATUS_LABELS[training.status] || training.status}
        </span>
      </div>

      <div className="space-y-2.5 mb-4">
        {nextSession && (
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <div className="p-1 rounded bg-stone-100">
              <Calendar className="w-3 h-3" />
            </div>
            <span className="font-medium">{formatDate(nextSession.startDate)}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-stone-600">
          <div className="p-1 rounded bg-stone-100">
            <Users className="w-3 h-3" />
          </div>
          <span className="flex-1 font-medium">
            {participantCount} / {maxParticipants}
          </span>
          <div className="w-20 h-2 bg-stone-200 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                fillPercentage >= 60 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(fillPercentage, 100)}%` }}
            />
          </div>
        </div>

        {training.requiresAccommodation && (
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <div className="p-1 rounded bg-[#eac7b8]/20">
              <Home className="w-3 h-3 text-[#B01A19]" />
            </div>
            <span className="font-medium">Hébergement requis</span>
          </div>
        )}
      </div>
    </div>
  )
}
