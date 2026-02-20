import React, { useMemo, useState, useRef, useEffect } from 'react'
import { MapPin, Users, ArrowRight } from 'lucide-react'

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const STATUS_CARD_COLORS = {
  draft: { bg: 'bg-stone-100', border: 'border-stone-300', text: 'text-stone-700' },
  planned: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
  registrations_open: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900' },
  in_progress: { bg: 'bg-[#eac7b8]/50', border: 'border-[#B01A19]', text: 'text-[#B01A19]' },
  completed: { bg: 'bg-stone-100', border: 'border-stone-300', text: 'text-stone-700' },
  cancelled: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900' },
}

function getSessionsForDate(date, trainingSessions) {
  const dateStr = date.toISOString().split('T')[0]
  return trainingSessions.filter((session) => {
    const start = new Date(session.startDate).toISOString().split('T')[0]
    const end = new Date(session.endDate).toISOString().split('T')[0]
    return dateStr >= start && dateStr <= end
  })
}

function isToday(date) {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

function formatSessionDate(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const isSameDay = start.toDateString() === end.toDateString()
  if (isSameDay) {
    return `${start.getDate()}/${String(start.getMonth() + 1).padStart(2, '0')}`
  }
  return `${start.getDate()}-${end.getDate()}/${String(start.getMonth() + 1).padStart(2, '0')}`
}

export default function CalendarMonthView({
  currentDate,
  trainings = [],
  trainingSessions = [],
  trainingLocations = [],
  trainingRegistrations = [],
  onViewTraining,
}) {
  const [selectedTrainingId, setSelectedTrainingId] = useState(null)
  const modalRef = useRef(null)

  const getTraining = (id) => trainings.find((t) => t.id === id)
  const getLocationNames = (locationIds) =>
    (locationIds || []).map(
      (lid) => trainingLocations.find((l) => l.id === lid)?.name || lid
    )
  const getRegistrationsCount = (trainingId) =>
    trainingRegistrations.filter((r) => r.trainingId === trainingId).length

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6
    const days = []
    const prevMonthLast = new Date(year, month - 1, 0).getDate()
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLast - i),
        isCurrentMonth: false,
      })
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      })
    }
    return days
  }, [currentDate])

  useEffect(() => {
    if (!selectedTrainingId) return
    function handleClickOutside(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setSelectedTrainingId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedTrainingId])

  const selectedTraining = selectedTrainingId ? getTraining(selectedTrainingId) : null
  const selectedSessions = selectedTraining
    ? trainingSessions.filter((s) => s.trainingId === selectedTraining.id).sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    : []
  const registrationsCount = selectedTraining
    ? getRegistrationsCount(selectedTraining.id)
    : 0
  const fillPercentage = selectedTraining?.maxParticipants
    ? Math.min(100, (registrationsCount / selectedTraining.maxParticipants) * 100)
    : 0

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-lg overflow-hidden">
      <div className="grid grid-cols-7 border-b-2 border-stone-200 bg-stone-50">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="p-3 sm:p-4 text-center font-bold text-sm uppercase tracking-wide text-stone-600"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 divide-x divide-y divide-stone-200">
        {calendarDays.map((day, index) => {
          const sessions = getSessionsForDate(day.date, trainingSessions)
          const today = isToday(day.date)
          const dateStr = day.date.toISOString().split('T')[0]
          const uniqueTrainingIds = new Set(
            sessions
              .filter((s) => {
                const multiDay = s.startDate !== s.endDate
                const isStart = s.startDate === dateStr
                return !multiDay || isStart
              })
              .map((s) => s.trainingId)
          )
          const trainingsToShow = Array.from(uniqueTrainingIds)
            .slice(0, 3)
            .map((tid) => ({
              training: getTraining(tid),
              sessions: sessions.filter((s) => s.trainingId === tid),
            }))
            .filter((x) => x.training)

          return (
            <div
              key={index}
              className={`min-h-[100px] sm:min-h-[120px] p-2 sm:p-3 relative transition-all duration-200 ${
                !day.isCurrentMonth ? 'opacity-40 bg-stone-50' : 'bg-white'
              } ${today ? 'ring-2 ring-[#B01A19] ring-inset' : ''}`}
            >
              <div
                className={`flex items-center justify-between mb-1.5 ${
                  today ? 'text-[#B01A19] font-bold' : day.isCurrentMonth ? 'text-stone-900' : 'text-stone-400'
                }`}
              >
                <span className="text-sm">{day.date.getDate()}</span>
                {today && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#B01A19] animate-pulse" />
                )}
              </div>
              <div className="space-y-1.5">
                {trainingsToShow.map(({ training: t, sessions: sess }) => {
                  const colors = STATUS_CARD_COLORS[t.status] || STATUS_CARD_COLORS.draft
                  const firstSess = sess[0]
                  const locationNames = firstSess
                    ? getLocationNames(firstSess.locationIds || [])
                    : []
                  const regCount = getRegistrationsCount(t.id)
                  const fill = t.maxParticipants
                    ? Math.min(100, (regCount / t.maxParticipants) * 100)
                    : 0
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTrainingId(t.id)
                      }}
                      className={`w-full text-left p-2 rounded-lg border-2 text-xs font-medium hover:shadow-md transition-all duration-200 ${colors.bg} ${colors.border} ${colors.text}`}
                    >
                      <div className="font-semibold truncate">{t.title}</div>
                      {locationNames.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] opacity-80">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{locationNames[0]}</span>
                        </div>
                      )}
                      <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full transition-all duration-500 ${
                            fill >= 60 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${fill}%` }}
                        />
                      </div>
                    </button>
                  )
                })}
                {uniqueTrainingIds.size > 3 && (
                  <div className="text-[10px] text-stone-500 font-medium px-1">
                    +{uniqueTrainingIds.size - 3} autre{(uniqueTrainingIds.size - 3) > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedTraining && (
        <div
          ref={modalRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setSelectedTrainingId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-stone-900 pr-8">{selectedTraining.title}</h2>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-white ${
                  selectedTraining.status === 'in_progress'
                    ? 'bg-[#B01A19]'
                    : selectedTraining.status === 'registrations_open'
                      ? 'bg-green-500'
                      : selectedTraining.status === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-stone-500'
                }`}
              >
                {selectedTraining.status === 'in_progress'
                  ? 'En cours'
                  : selectedTraining.status === 'registrations_open'
                    ? 'Inscriptions ouvertes'
                    : selectedTraining.status === 'completed'
                      ? 'Terminée'
                      : selectedTraining.status === 'planned'
                        ? 'Planifiée'
                        : selectedTraining.status === 'cancelled'
                          ? 'Annulée'
                          : 'Brouillon'}
              </span>
            </div>
            <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200 mb-4">
              <div className="p-2 rounded-lg bg-[#eac7b8]/20">
                <Users className="w-5 h-5 text-[#B01A19]" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">
                  Participants
                </div>
                <div className="text-sm font-semibold text-stone-900">
                  {registrationsCount} / {selectedTraining.maxParticipants || 0}
                </div>
                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all duration-500 ${
                      fillPercentage >= 60 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${fillPercentage}%` }}
                  />
                </div>
              </div>
            </div>
            {selectedSessions.length > 0 && (
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 mb-4">
                <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
                  Sessions
                </div>
                <div className="space-y-3">
                  {selectedSessions.map((session) => {
                    const locNames = getLocationNames(session.locationIds || [])
                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-medium text-stone-900">
                          {formatSessionDate(session.startDate, session.endDate)}
                        </span>
                        <span className="text-stone-600">
                          {locNames.length > 0 ? locNames.join(', ') : '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setSelectedTrainingId(null)}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  onViewTraining?.(selectedTraining.id)
                  setSelectedTrainingId(null)
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-[#B01A19] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1514] shadow-md"
              >
                Voir les détails
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
