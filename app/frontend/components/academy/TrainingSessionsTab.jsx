import React, { useState, useRef, useEffect } from 'react'
import { Calendar, MapPin, User, Plus, Edit, Trash2 } from 'lucide-react'

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
  onAddSession,
  onEditSession,
  onDeleteSession,
}) {
  const getLocationName = (locationId) =>
    locations.find((loc) => loc.id === locationId)?.name || locationId
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
          <h3 className="text-lg font-semibold text-stone-900">Sessions de formation</h3>
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
  getMemberName,
  onEdit,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
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

          {session.description && (
            <p className="text-sm text-stone-600 mb-3">{session.description}</p>
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
                    {getMemberName(trainerId)}
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
    </div>
  )
}
