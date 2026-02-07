import { Calendar, MapPin, User, Home, FileText } from 'lucide-react'
import type {
  Training,
  TrainingType,
  TrainingSession,
  TrainingLocation,
  Member
} from '../types'
import { Badge } from '@/components/ui/badge'

interface TrainingInfoTabProps {
  training: Training
  trainingType: TrainingType
  sessions: TrainingSession[]
  locations: TrainingLocation[]
  members: Member[]
}

export function TrainingInfoTab({
  training,
  trainingType,
  sessions,
  locations,
  members,
}: TrainingInfoTabProps) {
  // Trouver les lieux uniques utilisés dans les sessions
  const usedLocationIds = new Set(
    sessions.flatMap(session => session.locationIds)
  )
  const usedLocations = locations.filter(loc => usedLocationIds.has(loc.id))

  // Trouver les formateurs uniques
  const usedTrainerIds = new Set(
    sessions.flatMap(session => session.trainerIds)
  )
  const trainers = members.filter(m => usedTrainerIds.has(m.id))

  // Trouver les assistants uniques
  const usedAssistantIds = new Set(
    sessions.flatMap(session => session.assistantIds)
  )
  const assistants = members.filter(m => usedAssistantIds.has(m.id))

  // Dates min et max des sessions
  const sessionDates = sessions
    .flatMap(s => [s.startDate, s.endDate])
    .sort()
  const firstDate = sessionDates[0]
  const lastDate = sessionDates[sessionDates.length - 1]

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Description */}
      {training.description && (
        <div className="bg-white dark:bg-stone-800/50 rounded-xl p-6 border border-stone-200 dark:border-stone-700 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#B01A19] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="pl-4">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
              <div className="h-1 w-8 bg-[#B01A19] rounded-full" />
              Description
            </h3>
            <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
              {training.description}
            </p>
          </div>
        </div>
      )}

      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dates */}
        <div className="bg-white dark:bg-stone-800/50 rounded-xl p-6 border border-stone-200 dark:border-stone-700 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#eac7b8]/20 group-hover:bg-[#B01A19]/10 transition-colors duration-200">
              <Calendar className="size-5 text-[#B01A19]" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Dates
            </h3>
          </div>
          {firstDate && lastDate ? (
            <div className="space-y-2">
              <div>
                <span className="text-sm text-stone-500 dark:text-stone-400">Début :</span>
                <p className="text-stone-900 dark:text-stone-100 font-medium">
                  {formatDate(firstDate)}
                </p>
              </div>
              {firstDate !== lastDate && (
                <div>
                  <span className="text-sm text-stone-500 dark:text-stone-400">Fin :</span>
                  <p className="text-stone-900 dark:text-stone-100 font-medium">
                    {formatDate(lastDate)}
                  </p>
                </div>
              )}
              <div className="pt-2 border-t border-stone-200 dark:border-stone-700">
                <span className="text-sm text-stone-500 dark:text-stone-400">
                  {sessions.length} session{sessions.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              Aucune session planifiée
            </p>
          )}
        </div>

        {/* Tarif et places */}
        <div className="bg-white dark:bg-stone-800/50 rounded-xl p-6 border border-stone-200 dark:border-stone-700 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#eac7b8]/20 group-hover:bg-[#B01A19]/10 transition-colors duration-200">
              <FileText className="size-5 text-[#B01A19]" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Tarif et places
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-stone-500 dark:text-stone-400">Tarif :</span>
              <p className="text-stone-900 dark:text-stone-100 font-medium text-lg">
                {training.price.toLocaleString('fr-FR')} €
              </p>
            </div>
            <div>
              <span className="text-sm text-stone-500 dark:text-stone-400">Places :</span>
              <p className="text-stone-900 dark:text-stone-100 font-medium">
                {training.maxParticipants} participant{training.maxParticipants > 1 ? 's' : ''} maximum
              </p>
            </div>
            {training.requiresAccommodation && (
              <div className="pt-2">
                <Badge variant="secondary" className="bg-[#eac7b8] text-[#B01A19]">
                  <Home className="size-3 mr-1" />
                  Hébergement requis
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lieux */}
      {usedLocations.length > 0 && (
        <div className="bg-white dark:bg-stone-800/50 rounded-xl p-6 border border-stone-200 dark:border-stone-700 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#eac7b8]/20">
              <MapPin className="size-5 text-[#B01A19]" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Lieux de formation
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {usedLocations.map(location => (
              <div
                key={location.id}
                className="p-4 bg-stone-50 dark:bg-stone-800/30 rounded-lg border border-stone-200 dark:border-stone-700"
              >
                <h4 className="font-medium text-stone-900 dark:text-stone-100 mb-1">
                  {location.name}
                </h4>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {location.address.split(',').slice(-2).join(',').trim()}
                </p>
                {location.hasAccommodation && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    <Home className="size-3 mr-1" />
                    Hébergement disponible
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formateurs */}
      {trainers.length > 0 && (
        <div className="bg-white dark:bg-stone-800/50 rounded-xl p-6 border border-stone-200 dark:border-stone-700 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#eac7b8]/20">
              <User className="size-5 text-[#B01A19]" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Formateurs
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {trainers.map(trainer => (
              <div
                key={trainer.id}
                className="flex items-center gap-2 p-3 bg-stone-50 dark:bg-stone-800/30 rounded-lg border border-stone-200 dark:border-stone-700"
              >
                <img
                  src={trainer.avatar}
                  alt={trainer.firstName}
                  className="size-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {trainer.firstName} {trainer.lastName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assistants */}
      {assistants.length > 0 && (
        <div className="bg-white dark:bg-stone-800/50 rounded-xl p-6 border border-stone-200 dark:border-stone-700 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#eac7b8]/20">
              <User className="size-5 text-[#B01A19]" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Assistants
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {assistants.map(assistant => (
              <div
                key={assistant.id}
                className="flex items-center gap-2 p-3 bg-stone-50 dark:bg-stone-800/30 rounded-lg border border-stone-200 dark:border-stone-700"
              >
                <img
                  src={assistant.avatar}
                  alt={assistant.firstName}
                  className="size-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {assistant.firstName} {assistant.lastName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note du coordinateur */}
      {training.coordinatorNote && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
          <div className="pt-2">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
              <div className="h-1 w-8 bg-amber-500 rounded-full" />
              Note du coordinateur
            </h3>
            <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
              {training.coordinatorNote}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

