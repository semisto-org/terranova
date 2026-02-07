import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Grid3x3 } from 'lucide-react'
import type {
  Training,
  TrainingSession,
  TrainingType,
  TrainingLocation,
  TrainingRegistration,
  Member
} from '../types'
import { Button } from '@/components/ui/button'
import { CalendarMonthView } from './CalendarMonthView'
import { CalendarYearView } from './CalendarYearView'

interface TrainingCalendarProps {
  trainings: Training[]
  trainingSessions: TrainingSession[]
  trainingTypes: TrainingType[]
  trainingLocations: TrainingLocation[]
  trainingRegistrations: TrainingRegistration[]
  members: Member[]
  onViewTraining?: (trainingId: string) => void
}

type ViewMode = 'month' | 'year'

export function TrainingCalendar({
  trainings,
  trainingSessions,
  trainingTypes,
  trainingLocations,
  trainingRegistrations,
  members,
  onViewTraining,
}: TrainingCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Get training for a session
  const getTraining = (trainingId: string) => {
    return trainings.find(t => t.id === trainingId)
  }

  // Get training type for a training
  const getTrainingType = (trainingTypeId: string) => {
    return trainingTypes.find(tt => tt.id === trainingTypeId)
  }

  // Get location names
  const getLocationNames = (locationIds: string[]) => {
    return locationIds
      .map(id => trainingLocations.find(loc => loc.id === id)?.name)
      .filter(Boolean) as string[]
  }

  // Navigate months/years
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    } else {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Format date for display
  const formatDateHeader = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    } else {
      return currentDate.getFullYear().toString()
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Academy accent */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-1 bg-gradient-to-b from-[#B01A19] to-[#eac7b8] rounded-full shrink-0" />
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 tracking-tight mb-2">
              Calendrier des formations
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 font-medium">
              Visualisez toutes vos formations dans le temps
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 rounded-xl p-4 border border-stone-200 dark:border-stone-800 shadow-sm">
          {/* View mode toggle */}
          <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'month'
                  ? 'bg-[#B01A19] text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Mensuel
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'year'
                  ? 'bg-[#B01A19] text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              Annuel
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="transition-all duration-200 hover:border-[#B01A19] hover:text-[#B01A19]"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="transition-all duration-200 hover:border-[#B01A19] hover:text-[#B01A19] font-medium"
            >
              Aujourd'hui
            </Button>
            <div className="text-lg font-bold text-stone-900 dark:text-stone-100 min-w-[200px] text-center capitalize">
              {formatDateHeader()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              className="transition-all duration-200 hover:border-[#B01A19] hover:text-[#B01A19]"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        {viewMode === 'month' ? (
          <CalendarMonthView
            currentDate={currentDate}
            trainings={trainings}
            trainingSessions={trainingSessions}
            trainingTypes={trainingTypes}
            trainingLocations={trainingLocations}
            trainingRegistrations={trainingRegistrations}
            members={members}
            getTraining={getTraining}
            getTrainingType={getTrainingType}
            getLocationNames={getLocationNames}
            onViewTraining={onViewTraining}
          />
        ) : (
          <CalendarYearView
            currentDate={currentDate}
            trainings={trainings}
            trainingSessions={trainingSessions}
            trainingTypes={trainingTypes}
            getTraining={getTraining}
            getTrainingType={getTrainingType}
            onViewTraining={onViewTraining}
          />
        )}
      </div>
    </div>
  )
}

