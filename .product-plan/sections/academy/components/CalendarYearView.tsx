import { useMemo, useState, useEffect, useRef } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import type {
  Training,
  TrainingSession,
  TrainingType,
  TrainingStatus
} from '../types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface CalendarYearViewProps {
  currentDate: Date
  trainings: Training[]
  trainingSessions: TrainingSession[]
  trainingTypes: TrainingType[]
  getTraining: (trainingId: string) => Training | undefined
  getTrainingType: (trainingTypeId: string) => TrainingType | undefined
  onViewTraining?: (trainingId: string) => void
}

const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const statusColors: Record<TrainingStatus, string> = {
  draft: 'bg-stone-400',
  planned: 'bg-blue-500',
  registrations_open: 'bg-green-500',
  in_progress: 'bg-[#B01A19]',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
}

// Get all weeks of the year
const getAllWeeksOfYear = (year: number) => {
  const weeks: Array<Array<{ date: Date; month: number; isCurrentYear: boolean }>> = []
  
  // Find the first Monday of the year (or the Monday of the week containing Jan 1)
  const jan1 = new Date(year, 0, 1)
  let firstMonday = new Date(jan1)
  const dayOfWeek = jan1.getDay()
  // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  firstMonday.setDate(jan1.getDate() - mondayOffset)
  
  // Generate 53 weeks (some years have 53 weeks)
  let currentDate = new Date(firstMonday)
  for (let week = 0; week < 53; week++) {
    const weekDays: Array<{ date: Date; month: number; isCurrentYear: boolean }> = []
    for (let day = 0; day < 7; day++) {
      const date = new Date(currentDate)
      const month = date.getMonth()
      const isCurrentYear = date.getFullYear() === year
      weekDays.push({ date, month, isCurrentYear })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weeks.push(weekDays)
    
    // Stop if we've passed the year
    if (currentDate.getFullYear() > year) {
      break
    }
  }
  
  return weeks
}

export function CalendarYearView({
  currentDate,
  trainings,
  trainingSessions,
  trainingTypes,
  getTraining,
  getTrainingType,
  onViewTraining,
}: CalendarYearViewProps) {
  const year = currentDate.getFullYear()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  
  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setSelectedDate(null)
      }
    }
    
    if (selectedDate) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [selectedDate])

  // Get trainings for a specific date
  const getTrainingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const sessions = trainingSessions.filter(session => {
      const startDate = new Date(session.startDate).toISOString().split('T')[0]
      const endDate = new Date(session.endDate).toISOString().split('T')[0]
      return dateStr >= startDate && dateStr <= endDate
    })
    
    const trainingIds = new Set(sessions.map(s => s.trainingId))
    return Array.from(trainingIds)
      .map(id => getTraining(id))
      .filter(Boolean) as Training[]
  }

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Get all weeks of the year
  const allWeeks = useMemo(() => getAllWeeksOfYear(year), [year])
  
  // Track which month each week starts in for visual separation
  const getMonthForWeek = (week: Array<{ date: Date; month: number; isCurrentYear: boolean }>) => {
    return week[0].month
  }
  
  // Check if it's the first day of a month
  const isFirstDayOfMonth = (date: Date) => {
    return date.getDate() === 1
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide mb-4">
          Légende des statuts
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-stone-400" />
            <span className="text-sm text-stone-600 dark:text-stone-400">Brouillon</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-stone-600 dark:text-stone-400">Planifiée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-stone-600 dark:text-stone-400">Inscriptions ouvertes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#B01A19]" />
            <span className="text-sm text-stone-600 dark:text-stone-400 font-semibold">En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-stone-600 dark:text-stone-400">Terminée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-stone-600 dark:text-stone-400">Annulée</span>
          </div>
        </div>
      </div>

      {/* Continuous Calendar */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-lg overflow-visible">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b-2 border-stone-200 dark:border-stone-800 sticky top-0 bg-white dark:bg-stone-900 z-10">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center font-bold text-sm uppercase tracking-wide text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-950"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar weeks - continuous */}
        <div className="divide-y divide-stone-200 dark:divide-stone-800 overflow-visible">
          {allWeeks.map((week, weekIndex) => {
            const weekMonth = getMonthForWeek(week)
            const prevWeekMonth = weekIndex > 0 ? getMonthForWeek(allWeeks[weekIndex - 1]) : null
            const showMonthLabel = prevWeekMonth === null || weekMonth !== prevWeekMonth
            
            return (
              <div key={weekIndex}>
                {/* Month separator */}
                {showMonthLabel && (
                  <div className="px-4 py-2 bg-stone-100 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800">
                    <h3 className="text-sm font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
                      {monthNames[weekMonth]}
                    </h3>
                  </div>
                )}
                
                {/* Week row */}
                <div className="grid grid-cols-7 divide-x divide-stone-200 dark:divide-stone-800 overflow-visible">
                  {week.map((day, dayIndex) => {
                    const trainingsForDate = getTrainingsForDate(day.date)
                    const today = isToday(day.date)
                    const dateStr = day.date.toISOString().split('T')[0]
                    const isSelected = selectedDate === dateStr
                    const isFirstDay = isFirstDayOfMonth(day.date)
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`relative p-3 sm:p-4 min-h-[80px] sm:min-h-[100px] transition-all duration-200 ${
                          !day.isCurrentYear
                            ? 'opacity-30 bg-stone-50 dark:bg-stone-950'
                            : today
                              ? 'bg-[#B01A19]/10 dark:bg-[#B01A19]/20 ring-2 ring-[#B01A19] ring-inset'
                              : isSelected && trainingsForDate.length > 0
                                ? 'bg-stone-100 dark:bg-stone-800'
                                : 'hover:bg-stone-50 dark:hover:bg-stone-950 bg-white dark:bg-stone-900'
                        } ${trainingsForDate.length > 0 ? 'cursor-pointer' : 'cursor-default'} ${
                          isFirstDay && day.isCurrentYear ? 'border-l-2 border-stone-300 dark:border-stone-700' : ''
                        }`}
                        onClick={() => {
                          if (trainingsForDate.length > 0) {
                            setSelectedDate(isSelected ? null : dateStr)
                          }
                        }}
                      >
                        {/* Date number */}
                        <div className={`text-xs sm:text-sm font-medium mb-2 ${
                          today
                            ? 'text-[#B01A19] font-bold'
                            : day.isCurrentYear
                              ? 'text-stone-900 dark:text-stone-100'
                              : 'text-stone-400 dark:text-stone-600'
                        }`}>
                          {day.date.getDate()}
                        </div>

                        {/* Status dots */}
                        {trainingsForDate.length > 0 && (
                          <div className="flex items-center justify-center gap-0.5 flex-wrap">
                            {(() => {
                              const statusPriority: TrainingStatus[] = [
                                'in_progress',
                                'registrations_open',
                                'planned',
                                'completed',
                                'draft',
                                'cancelled'
                              ]
                              
                              const uniqueStatuses = Array.from(
                                new Set(trainingsForDate.map(t => t.status))
                              ).sort((a, b) => {
                                const idxA = statusPriority.indexOf(a)
                                const idxB = statusPriority.indexOf(b)
                                return idxA - idxB
                              }).slice(0, 3)
                              
                              return uniqueStatuses.map((stat, idx) => (
                                <div
                                  key={stat}
                                  className={`w-2 h-2 rounded-full ${statusColors[stat]} transition-all duration-200 ${
                                    isSelected ? 'scale-125' : ''
                                  }`}
                                />
                              ))
                            })()}
                            {trainingsForDate.length > 3 && (
                              <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                            )}
                          </div>
                        )}

                        {/* Popup on click */}
                        {isSelected && trainingsForDate.length > 0 && (
                          <div 
                            ref={popupRef}
                            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2.5 bg-stone-900 dark:bg-stone-800 text-white text-xs rounded-lg shadow-lg min-w-[220px] max-w-[280px] pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="font-semibold mb-2 text-center border-b border-stone-700 pb-1.5">
                              {trainingsForDate.length} formation{trainingsForDate.length > 1 ? 's' : ''} le {day.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                            </div>
                            <div className="space-y-2 max-h-[250px] overflow-y-auto">
                              {trainingsForDate.slice(0, 5).map((training) => (
                                <button
                                  key={training.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedDate(null)
                                    onViewTraining?.(training.id)
                                  }}
                                  className="w-full text-left flex items-start gap-2 p-1.5 rounded hover:bg-stone-800 dark:hover:bg-stone-700 transition-colors group"
                                >
                                  <div className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${statusColors[training.status]}`} />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate group-hover:text-lime-400 dark:group-hover:text-lime-300 transition-colors underline decoration-transparent group-hover:decoration-lime-400 dark:group-hover:decoration-lime-300">
                                      {training.title}
                                    </div>
                                    <div className="text-[10px] text-stone-400 mt-0.5">
                                      {(() => {
                                        const statusLabels: Record<TrainingStatus, string> = {
                                          draft: 'Brouillon',
                                          planned: 'Planifiée',
                                          registrations_open: 'Inscriptions ouvertes',
                                          in_progress: 'En cours',
                                          completed: 'Terminée',
                                          cancelled: 'Annulée',
                                        }
                                        return statusLabels[training.status]
                                      })()}
                                    </div>
                                  </div>
                                </button>
                              ))}
                              {trainingsForDate.length > 5 && (
                                <div className="text-stone-400 text-center pt-1 border-t border-stone-700">
                                  +{trainingsForDate.length - 5} autre{trainingsForDate.length - 5 > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-stone-900 dark:bg-stone-800 rotate-45" />
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

