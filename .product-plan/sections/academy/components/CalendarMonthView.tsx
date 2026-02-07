import { useState, useMemo, useEffect } from 'react'
import { Calendar, MapPin, Users, Home, ArrowRight, X, CheckSquare } from 'lucide-react'
import type {
  Training,
  TrainingSession,
  TrainingType,
  TrainingLocation,
  TrainingRegistration,
  Member
} from '../types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

interface CalendarMonthViewProps {
  currentDate: Date
  trainings: Training[]
  trainingSessions: TrainingSession[]
  trainingTypes: TrainingType[]
  trainingLocations: TrainingLocation[]
  trainingRegistrations: TrainingRegistration[]
  members: Member[]
  getTraining: (trainingId: string) => Training | undefined
  getTrainingType: (trainingTypeId: string) => TrainingType | undefined
  getLocationNames: (locationIds: string[]) => string[]
  onViewTraining?: (trainingId: string) => void
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  planned: 'Planifiée',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const statusColors: Record<string, string> = {
  draft: 'bg-stone-500',
  planned: 'bg-blue-500',
  registrations_open: 'bg-green-500',
  in_progress: 'bg-[#B01A19]',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
}

export function CalendarMonthView({
  currentDate,
  trainings,
  trainingSessions,
  trainingTypes,
  trainingLocations,
  trainingRegistrations,
  members,
  getTraining,
  getTrainingType,
  getLocationNames,
  onViewTraining,
}: CalendarMonthViewProps) {
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null)
  // Calculate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    // Monday = 0, Sunday = 6
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6
    
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = []
    
    // Previous month days
    const prevMonth = new Date(year, month - 1, 0)
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
      })
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      })
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      })
    }
    
    return days
  }, [currentDate])

  // Get sessions for a specific date
  const getSessionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return trainingSessions.filter(session => {
      const startDate = new Date(session.startDate).toISOString().split('T')[0]
      const endDate = new Date(session.endDate).toISOString().split('T')[0]
      return dateStr >= startDate && dateStr <= endDate
    })
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

  // Get sessions for a training
  const getSessionsForTraining = (trainingId: string) => {
    return trainingSessions.filter(s => s.trainingId === trainingId)
  }

  // Get registrations for a training
  const getRegistrationsForTraining = (trainingId: string) => {
    // We don't have access to registrations here, so we'll skip this
    return []
  }

  // Format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const isSameDay = start.toDateString() === end.toDateString()
    
    if (isSameDay) {
      return start.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }
    
    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
  }

  const selectedTraining = selectedTrainingId ? getTraining(selectedTrainingId) : null
  const selectedTrainingType = selectedTraining ? getTrainingType(selectedTraining.trainingTypeId) : undefined
  const selectedSessions = selectedTraining ? getSessionsForTraining(selectedTraining.id) : []
  const firstSession = selectedSessions.length > 0 ? selectedSessions[0] : null
  const lastSession = selectedSessions.length > 0 ? selectedSessions[selectedSessions.length - 1] : null
  
  // Get registrations count for selected training
  const getRegistrationsCount = (trainingId: string) => {
    return trainingRegistrations.filter(r => r.trainingId === trainingId).length
  }
  
  const registrationsCount = selectedTraining ? getRegistrationsCount(selectedTraining.id) : 0
  const fillPercentage = selectedTraining 
    ? Math.min(100, (registrationsCount / selectedTraining.maxParticipants) * 100)
    : 0
  
  // Checklist state - initialize from template
  const [checklistItems, setChecklistItems] = useState<Record<string, boolean>>({})
  
  // Initialize checklist when training changes
  useEffect(() => {
    if (selectedTraining && selectedTrainingType) {
      const initial: Record<string, boolean> = {}
      selectedTrainingType.checklistTemplate.forEach((item, index) => {
        initial[index.toString()] = false // Default: unchecked
      })
      setChecklistItems(initial)
    }
  }, [selectedTraining?.id, selectedTrainingType?.id])
  
  // Get member by ID
  const getMember = (memberId: string) => {
    return members.find(m => m.id === memberId)
  }
  
  // Format date for session
  const formatSessionDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const isSameDay = start.toDateString() === end.toDateString()
    
    if (isSameDay) {
      const day = start.getDate().toString()
      const month = (start.getMonth() + 1).toString().padStart(2, '0')
      return `${day}/${month}`
    }
    
    const startDay = start.getDate().toString()
    const endDay = end.getDate().toString()
    const month = (start.getMonth() + 1).toString().padStart(2, '0')
    return `${startDay}-${endDay}/${month}`
  }
  
  // Toggle checklist item
  const toggleChecklistItem = (index: number) => {
    setChecklistItems(prev => ({
      ...prev,
      [index.toString()]: !prev[index.toString()]
    }))
  }

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-lg overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b-2 border-stone-200 dark:border-stone-800">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-4 text-center font-bold text-sm uppercase tracking-wide text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-950"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-stone-200 dark:divide-stone-800">
        {calendarDays.map((day, index) => {
          const sessions = getSessionsForDate(day.date)
          const today = isToday(day.date)
          
          return (
            <div
              key={index}
              className={`min-h-[120px] sm:min-h-[140px] p-2 sm:p-3 relative transition-all duration-200 hover:bg-stone-50 dark:hover:bg-stone-950/50 ${
                !day.isCurrentMonth ? 'opacity-40 bg-stone-50 dark:bg-stone-950' : 'bg-white dark:bg-stone-900'
              } ${today ? 'ring-2 ring-[#B01A19] ring-inset' : ''}`}
            >
              {/* Date number */}
              <div className={`flex items-center justify-between mb-2 ${
                today 
                  ? 'text-[#B01A19] font-bold' 
                  : day.isCurrentMonth 
                    ? 'text-stone-900 dark:text-stone-100' 
                    : 'text-stone-400 dark:text-stone-600'
              }`}>
                <span className={`text-sm ${today ? 'text-lg' : ''}`}>
                  {day.date.getDate()}
                </span>
                {today && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#B01A19] animate-pulse" />
                )}
              </div>

              {/* Sessions - Group by training to avoid duplicates */}
              <div className="space-y-1.5">
                {(() => {
                  // Get unique trainings for this date (one card per training, not per session)
                  const uniqueTrainingIds = new Set(
                    sessions
                      .filter(session => {
                        const isMultiDay = session.startDate !== session.endDate
                        const isStart = session.startDate === day.date.toISOString().split('T')[0]
                        return !isMultiDay || isStart // Only show on start date for multi-day sessions
                      })
                      .map(s => s.trainingId)
                  )
                  
                  const trainingsToShow = Array.from(uniqueTrainingIds)
                    .slice(0, 3)
                    .map(id => {
                      const training = getTraining(id)
                      const trainingSessions = sessions.filter(s => s.trainingId === id)
                      return { training, sessions: trainingSessions }
                    })
                    .filter(item => item.training)

                  return trainingsToShow.map(({ training, sessions: trainingSessions }) => {
                    const firstSession = trainingSessions[0]
                    const locationNames = firstSession ? getLocationNames(firstSession.locationIds) : []
                    const isMultiDay = firstSession && firstSession.startDate !== firstSession.endDate
                    const trainingRegistrationsCount = getRegistrationsCount(training!.id)
                    const trainingFillPercentage = Math.min(100, (trainingRegistrationsCount / training!.maxParticipants) * 100)
                    
                    const statusColors: Record<string, { bg: string; border: string; text: string }> = {
                      draft: {
                        bg: 'bg-stone-100 dark:bg-stone-800',
                        border: 'border-stone-300 dark:border-stone-700',
                        text: 'text-stone-700 dark:text-stone-300'
                      },
                      planned: {
                        bg: 'bg-blue-50 dark:bg-blue-900/20',
                        border: 'border-blue-200 dark:border-blue-800',
                        text: 'text-blue-900 dark:text-blue-200'
                      },
                      registrations_open: {
                        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                        border: 'border-emerald-200 dark:border-emerald-800',
                        text: 'text-emerald-900 dark:text-emerald-200'
                      },
                      in_progress: {
                        bg: 'bg-[#eac7b8] dark:bg-[#B01A19]/20',
                        border: 'border-[#B01A19] dark:border-[#B01A19]/50',
                        text: 'text-[#B01A19] dark:text-[#B01A19]'
                      },
                      completed: {
                        bg: 'bg-stone-100 dark:bg-stone-800',
                        border: 'border-stone-300 dark:border-stone-700',
                        text: 'text-stone-700 dark:text-stone-300'
                      },
                      cancelled: {
                        bg: 'bg-red-50 dark:bg-red-900/20',
                        border: 'border-red-200 dark:border-red-800',
                        text: 'text-red-900 dark:text-red-200'
                      },
                    }
                    
                    const colors = statusColors[training!.status] || statusColors.draft

                    return (
                      <button
                        key={training!.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTrainingId(training!.id)
                        }}
                        className={`w-full text-left p-2 rounded-lg border-2 ${colors.bg} ${colors.border} ${colors.text} text-xs font-medium hover:shadow-md hover:scale-105 transition-all duration-200 group relative overflow-hidden`}
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#B01A19] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        <div className="relative">
                          <div className="font-semibold truncate mb-0.5">
                            {training!.title}
                          </div>
                          {locationNames.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 text-[10px] opacity-60">
                              <MapPin className="w-2.5 h-2.5" />
                              <span className="truncate">{locationNames[0]}</span>
                            </div>
                          )}
                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden mt-1.5">
                            <div
                              className={`h-full transition-all duration-500 ${
                                trainingFillPercentage >= 60 ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${trainingFillPercentage}%` }}
                            />
                          </div>
                          {isMultiDay && trainingSessions.length > 1 && (
                            <div className="text-[10px] opacity-60 mt-0.5">
                              {trainingSessions.length} session{trainingSessions.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })
                })()}
                {(() => {
                  const uniqueTrainingIds = new Set(
                    sessions
                      .filter(session => {
                        const isMultiDay = session.startDate !== session.endDate
                        const isStart = session.startDate === day.date.toISOString().split('T')[0]
                        return !isMultiDay || isStart
                      })
                      .map(s => s.trainingId)
                  )
                  const totalTrainings = uniqueTrainingIds.size
                  return totalTrainings > 3 && (
                    <div className="text-xs text-stone-500 dark:text-stone-400 font-medium px-1.5 py-1">
                      +{totalTrainings - 3} autre{totalTrainings - 3 > 1 ? 's' : ''}
                    </div>
                  )
                })()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Training Detail Modal */}
      <Dialog open={!!selectedTrainingId} onOpenChange={(open) => !open && setSelectedTrainingId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTraining && (
            <>
              <DialogHeader className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2 pr-8">
                      {selectedTraining.title}
                    </DialogTitle>
                  </div>
                  <Badge className={`${statusColors[selectedTraining.status]} text-white`}>
                    {statusLabels[selectedTraining.status]}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Participants with Progress */}
                <div className="flex items-start gap-3 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700">
                  <div className="p-2 rounded-lg bg-[#eac7b8]/20">
                    <Users className="w-5 h-5 text-[#B01A19]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                        Participants
                      </div>
                      <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {registrationsCount} / {selectedTraining.maxParticipants}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          fillPercentage >= 60 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sessions List */}
                {selectedSessions.length > 0 && (
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700">
                    <div className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
                      Sessions
                    </div>
                    <div className="space-y-4">
                      {selectedSessions.map((session, index) => {
                        const sessionTrainers = session.trainerIds.map(id => getMember(id)).filter(Boolean) as Member[]
                        const sessionAssistants = session.assistantIds.map(id => getMember(id)).filter(Boolean) as Member[]
                        const allStaff = [...sessionTrainers, ...sessionAssistants]
                        const sessionLocations = session.locationIds
                          .map(id => trainingLocations.find(loc => loc.id === id))
                          .filter(Boolean) as TrainingLocation[]
                        
                        return (
                          <div key={session.id} className={`${index < selectedSessions.length - 1 ? 'border-b border-stone-200 dark:border-stone-700 pb-4' : ''}`}>
                            {/* Ligne 1: Date à gauche, Lieu à droite */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-stone-900 dark:text-stone-100">
                                {formatSessionDate(session.startDate, session.endDate)}
                              </div>
                              <div className="text-stone-700 dark:text-stone-300 text-sm">
                                {sessionLocations.length > 0 ? (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{sessionLocations.map(l => l.name).join(', ')}</span>
                                  </div>
                                ) : (
                                  <span className="text-stone-400 dark:text-stone-500">-</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Ligne 2: Sujet à gauche, Avatars à droite */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0 text-stone-700 dark:text-stone-300 text-sm break-words">
                                {session.description || 'Session'}
                              </div>
                              <div className="shrink-0">
                                {allStaff.length > 0 ? (
                                  <div className="flex -space-x-2">
                                    {allStaff.slice(0, 4).map((person) => (
                                      <img
                                        key={person.id}
                                        src={person.avatar}
                                        alt={`${person.firstName} ${person.lastName}`}
                                        className="w-7 h-7 rounded-full border-2 border-white dark:border-stone-900 bg-stone-100"
                                        title={`${person.firstName} ${person.lastName}`}
                                      />
                                    ))}
                                    {allStaff.length > 4 && (
                                      <div className="w-7 h-7 rounded-full border-2 border-white dark:border-stone-900 bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-medium text-stone-600 dark:text-stone-300">
                                        +{allStaff.length - 4}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-stone-400 dark:text-stone-500">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Checklist */}
                {selectedTrainingType && selectedTrainingType.checklistTemplate.length > 0 && (
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-[#eac7b8]/20">
                        <CheckSquare className="w-4 h-4 text-[#B01A19]" />
                      </div>
                      <div className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                        Checklist
                      </div>
                    </div>
                    <div className="space-y-2">
                      {selectedTrainingType.checklistTemplate.map((item, index) => {
                        const isChecked = checklistItems[index.toString()] || false
                        return (
                          <label
                            key={index}
                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800/50 cursor-pointer transition-colors group"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleChecklistItem(index)}
                              className="mt-0.5 w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-[#B01A19] focus:ring-[#B01A19] focus:ring-offset-0 cursor-pointer"
                            />
                            <span className={`flex-1 text-sm ${
                              isChecked 
                                ? 'text-stone-500 dark:text-stone-400 line-through' 
                                : 'text-stone-900 dark:text-stone-100'
                            } group-hover:text-[#B01A19] transition-colors`}>
                              {item}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-stone-200 dark:border-stone-700">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTrainingId(null)}
                  className="transition-all duration-200 hover:border-stone-300"
                >
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    onViewTraining?.(selectedTraining.id)
                    setSelectedTrainingId(null)
                  }}
                  className="bg-[#B01A19] hover:bg-[#B01A19]/90 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Voir les détails
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

