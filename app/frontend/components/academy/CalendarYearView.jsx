import React, { useMemo, useState, useEffect, useRef } from 'react'

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const STATUS_COLORS = {
  draft: 'bg-stone-400',
  planned: 'bg-blue-500',
  registrations_open: 'bg-green-500',
  in_progress: 'bg-[#B01A19]',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
}

const STATUS_LABELS = {
  draft: 'Brouillon',
  planned: 'Planifiée',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

function getAllWeeksOfYear(year) {
  const weeks = []
  const jan1 = new Date(year, 0, 1)
  const dayOfWeek = jan1.getDay()
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const firstMonday = new Date(jan1)
  firstMonday.setDate(jan1.getDate() - mondayOffset)
  let current = new Date(firstMonday)
  for (let week = 0; week < 53; week++) {
    const weekDays = []
    for (let day = 0; day < 7; day++) {
      const date = new Date(current)
      weekDays.push({
        date,
        month: date.getMonth(),
        isCurrentYear: date.getFullYear() === year,
      })
      current.setDate(current.getDate() + 1)
    }
    weeks.push(weekDays)
    if (current.getFullYear() > year) break
  }
  return weeks
}

function getTrainingsForDate(date, trainingSessions, getTraining) {
  const dateStr = date.toISOString().split('T')[0]
  const sessions = trainingSessions.filter((session) => {
    const start = new Date(session.startDate).toISOString().split('T')[0]
    const end = new Date(session.endDate).toISOString().split('T')[0]
    return dateStr >= start && dateStr <= end
  })
  const ids = new Set(sessions.map((s) => s.trainingId))
  return Array.from(ids)
    .map((id) => getTraining(id))
    .filter(Boolean)
}

function isToday(date) {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export default function CalendarYearView({
  currentDate,
  trainings = [],
  trainingSessions = [],
  onViewTraining,
}) {
  const year = currentDate.getFullYear()
  const [selectedDate, setSelectedDate] = useState(null)
  const popupRef = useRef(null)

  const getTraining = (id) => trainings.find((t) => t.id === id)
  const allWeeks = useMemo(() => getAllWeeksOfYear(year), [year])

  useEffect(() => {
    if (!selectedDate) return
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setSelectedDate(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedDate])

  const getMonthForWeek = (week) => week[0].month
  const isFirstDayOfMonth = (date) => date.getDate() === 1
  const STATUS_PRIORITY = [
    'in_progress',
    'registrations_open',
    'planned',
    'completed',
    'draft',
    'cancelled',
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide mb-4">
          Légende des statuts
        </h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <span className="text-sm text-stone-600">{STATUS_LABELS[status]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-lg overflow-visible">
        <div className="grid grid-cols-7 border-b-2 border-stone-200 sticky top-0 bg-white z-10">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="p-3 text-center font-bold text-sm uppercase tracking-wide text-stone-600 bg-stone-50"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="divide-y divide-stone-200">
          {allWeeks.map((week, weekIndex) => {
            const weekMonth = getMonthForWeek(week)
            const prevWeekMonth =
              weekIndex > 0 ? getMonthForWeek(allWeeks[weekIndex - 1]) : null
            const showMonthLabel = prevWeekMonth === null || weekMonth !== prevWeekMonth

            return (
              <div key={weekIndex}>
                {showMonthLabel && (
                  <div className="px-4 py-2 bg-stone-100 border-b border-stone-200">
                    <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide">
                      {MONTH_NAMES[weekMonth]}
                    </h3>
                  </div>
                )}
                <div className="grid grid-cols-7 divide-x divide-stone-200">
                  {week.map((day, dayIndex) => {
                    const trainingsForDate = getTrainingsForDate(
                      day.date,
                      trainingSessions,
                      getTraining
                    )
                    const today = isToday(day.date)
                    const dateStr = day.date.toISOString().split('T')[0]
                    const isSelected = selectedDate === dateStr
                    const isFirstDay = isFirstDayOfMonth(day.date)

                    return (
                      <div
                        key={dayIndex}
                        className={`relative p-3 sm:p-4 min-h-[80px] sm:min-h-[100px] transition-all duration-200 ${
                          !day.isCurrentYear
                            ? 'opacity-30 bg-stone-50'
                            : today
                              ? 'bg-[#B01A19]/10 ring-2 ring-[#B01A19] ring-inset'
                              : isSelected && trainingsForDate.length > 0
                                ? 'bg-stone-100'
                                : 'hover:bg-stone-50/50 bg-white'
                        } ${trainingsForDate.length > 0 ? 'cursor-pointer' : ''} ${
                          isFirstDay && day.isCurrentYear
                            ? 'border-l-2 border-stone-300'
                            : ''
                        }`}
                        onClick={() => {
                          if (trainingsForDate.length > 0) {
                            setSelectedDate(isSelected ? null : dateStr)
                          }
                        }}
                      >
                        <div
                          className={`text-xs sm:text-sm font-medium mb-2 ${
                            today
                              ? 'text-[#B01A19] font-bold'
                              : day.isCurrentYear
                                ? 'text-stone-900'
                                : 'text-stone-400'
                          }`}
                        >
                          {day.date.getDate()}
                        </div>
                        {trainingsForDate.length > 0 && (
                          <div className="flex items-center justify-center gap-0.5 flex-wrap">
                            {Array.from(
                              new Set(trainingsForDate.map((t) => t.status))
                            )
                              .sort(
                                (a, b) =>
                                  STATUS_PRIORITY.indexOf(a) -
                                  STATUS_PRIORITY.indexOf(b)
                              )
                              .slice(0, 3)
                              .map((status) => (
                                <div
                                  key={status}
                                  className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]} transition-all duration-200 ${
                                    isSelected ? 'scale-125' : ''
                                  }`}
                                />
                              ))}
                            {trainingsForDate.length > 3 && (
                              <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                            )}
                          </div>
                        )}
                        {isSelected && trainingsForDate.length > 0 && (
                          <div
                            ref={popupRef}
                            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2.5 bg-stone-900 text-white text-xs rounded-lg shadow-lg min-w-[220px] max-w-[280px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="font-semibold mb-2 text-center border-b border-stone-700 pb-1.5">
                              {trainingsForDate.length} formation{trainingsForDate.length > 1 ? 's' : ''} le{' '}
                              {day.date.toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                              })}
                            </div>
                            <div className="space-y-2 max-h-[250px] overflow-y-auto">
                              {trainingsForDate.slice(0, 5).map((training) => (
                                <button
                                  key={training.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedDate(null)
                                    onViewTraining?.(training.id)
                                  }}
                                  className="w-full text-left flex items-start gap-2 p-1.5 rounded hover:bg-stone-800 transition-colors group"
                                >
                                  <div
                                    className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${STATUS_COLORS[training.status]}`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate group-hover:text-lime-300">
                                      {training.title}
                                    </div>
                                    <div className="text-[10px] text-stone-400 mt-0.5">
                                      {STATUS_LABELS[training.status]}
                                    </div>
                                  </div>
                                </button>
                              ))}
                              {trainingsForDate.length > 5 && (
                                <div className="text-stone-400 text-center pt-1 border-t border-stone-700">
                                  +{trainingsForDate.length - 5} autre
                                  {trainingsForDate.length - 5 > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-stone-900 rotate-45" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
