import React, { useState, useRef, useEffect } from 'react'
import { Calendar, MapPin, User, Plus, Edit, Trash2, Mail, Star, ThumbsUp, MessageSquareHeart, ChevronDown } from 'lucide-react'
import SessionReminderModal from './SessionReminderModal'

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TrainingSessionsTab({
  sessions = [],
  locations = [],
  members = [],
  academyContacts = [],
  onAddSession,
  onEditSession,
  onDeleteSession,
}) {
  const getLocationName = (locationId) =>
    locations.find((loc) => loc.id === locationId)?.name || locationId
  const getTrainerName = (trainerId) => {
    const contact = academyContacts.find((c) => c.id === trainerId)
    return contact ? contact.name : trainerId
  }
  const getMemberName = (memberId) => {
    const member = members.find((m) => m.id === memberId)
    return member ? `${member.firstName} ${member.lastName}` : memberId
  }

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Sessions d'activité</h3>
          <p className="text-sm text-stone-500 mt-1">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} planifiée{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAddSession?.()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#B01A19] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1514] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouvelle session</span>
        </button>
      </div>

      {sortedSessions.length === 0 ? (
        <div className="bg-white rounded-lg p-12 border border-stone-200 text-center">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500">Aucune session planifiée</p>
          <button
            type="button"
            onClick={() => onAddSession?.()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <Plus className="w-4 h-4" />
            Ajouter une session
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map((session) => {
            const startDate = new Date(session.startDate)
            const endDate = new Date(session.endDate)
            const isSameDay = startDate.toDateString() === endDate.toDateString()

            return (
              <SessionCard
                key={session.id}
                session={session}
                isSameDay={isSameDay}
                formatDate={formatDate}
                formatTime={formatTime}
                getLocationName={getLocationName}
                getTrainerName={getTrainerName}
                getMemberName={getMemberName}
                onEdit={() => onEditSession?.(session.id)}
                onDelete={() => onDeleteSession?.(session.id)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function SessionCard({
  session,
  isSameDay,
  formatDate,
  formatTime,
  getLocationName,
  getTrainerName,
  getMemberName,
  onEdit,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [reminderOpen, setReminderOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const locationIds = session.locationIds || []
  const trainerIds = session.trainerIds || []
  const assistantIds = session.assistantIds || []

  return (
    <div className="bg-white rounded-lg p-5 border border-stone-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-[#B01A19] shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-stone-900">{formatDate(session.startDate)}</span>
              {!isSameDay && (
                <>
                  <span className="text-stone-400">→</span>
                  <span className="font-medium text-stone-900">{formatDate(session.endDate)}</span>
                </>
              )}
              {isSameDay && (
                <span className="text-sm text-stone-500">
                  {formatTime(session.startDate)} - {formatTime(session.endDate)}
                </span>
              )}
            </div>
          </div>

          {(session.topic || session.description) && (
            <p className="text-sm text-stone-600 mb-3">
              {session.topic?.trim() ? session.topic : session.description}
            </p>
          )}

          {locationIds.length > 0 && (
            <div className="flex items-start gap-2 mb-2">
              <MapPin className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
              <div className="flex flex-wrap gap-2">
                {locationIds.map((locationId) => (
                  <span
                    key={locationId}
                    className="rounded border border-stone-300 px-2 py-0.5 text-xs"
                  >
                    {getLocationName(locationId)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {trainerIds.length > 0 && (
            <div className="flex items-start gap-2 mb-2">
              <User className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
              <div className="flex flex-wrap gap-2">
                {trainerIds.map((trainerId) => (
                  <span
                    key={trainerId}
                    className="rounded border border-stone-300 px-2 py-0.5 text-xs"
                  >
                    {getTrainerName(trainerId)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {assistantIds.length > 0 && (
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
              <span className="text-xs text-stone-500 mr-1">Assistants :</span>
              <div className="flex flex-wrap gap-2">
                {assistantIds.map((assistantId) => (
                  <span
                    key={assistantId}
                    className="rounded border border-stone-300 px-2 py-0.5 text-xs"
                  >
                    {getMemberName(assistantId)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <SessionFeedbackSummary feedback={session.feedback} />
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            aria-label="Actions"
          >
            <Edit className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 py-1 w-40 bg-white rounded-lg border border-stone-200 shadow-lg z-20">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onEdit()
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setReminderOpen(true)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
              >
                <Mail className="w-4 h-4" />
                Envoyer le rappel
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onDelete()
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

      {reminderOpen && (
        <SessionReminderModal session={session} onClose={() => setReminderOpen(false)} />
      )}
    </div>
  )
}

// Avis « à chaud » des participant·es sur la session, côté admin : synthèse
// (nombre, note moyenne, recommandations) + détail nominatif dépliable.
function SessionFeedbackSummary({ feedback }) {
  const [open, setOpen] = useState(false)
  const count = feedback?.count || 0
  if (count === 0) return null

  const responses = feedback.responses || []

  return (
    <div className="mt-3 pt-3 border-t border-stone-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
      >
        <MessageSquareHeart className="w-4 h-4 text-[#B01A19] shrink-0" />
        <span className="font-medium">
          {count} avis{count > 1 ? '' : ''}
        </span>
        {feedback.averageRating != null && (
          <span className="inline-flex items-center gap-1 text-xs text-stone-500">
            <Star className="w-3.5 h-3.5 text-[#EF9B0D]" fill="#EF9B0D" />
            {feedback.averageRating.toFixed(1)}/5
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-xs text-stone-500">
          <ThumbsUp className="w-3.5 h-3.5 text-[#2D6A4F]" />
          {feedback.recommendCount}/{count} recommandent
        </span>
        <ChevronDown
          className="w-4 h-4 text-stone-400 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {responses.map((r) => (
            <div key={r.id} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-stone-800">
                  {r.contactName || 'Participant·e'}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center gap-0.5" aria-label={`${r.rating} sur 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className="w-3.5 h-3.5"
                        style={{ color: r.rating >= n ? '#EF9B0D' : '#d6d3d1' }}
                        fill={r.rating >= n ? '#EF9B0D' : 'none'}
                      />
                    ))}
                  </span>
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={r.wouldRecommend
                      ? { backgroundColor: '#2D6A4F18', color: '#2D6A4F' }
                      : { backgroundColor: '#f5f5f4', color: '#78716c' }}
                  >
                    {r.wouldRecommend ? 'Recommande' : 'Ne recommande pas'}
                  </span>
                </span>
              </div>
              {r.comment && (
                <p className="text-sm text-stone-600 mt-1 whitespace-pre-line">{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
