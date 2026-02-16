import React from 'react'
import { Calendar, MapPin, User, Home, FileText } from 'lucide-react'

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function TrainingInfoTab({
  training,
  trainingType,
  sessions = [],
  locations = [],
  members = [],
  onUpdateStatus,
}) {
  const usedLocationIds = new Set(sessions.flatMap((s) => s.locationIds || []))
  const usedLocations = locations.filter((loc) => usedLocationIds.has(loc.id))

  const usedTrainerIds = new Set(sessions.flatMap((s) => s.trainerIds || []))
  const trainers = members.filter((m) => usedTrainerIds.has(m.id))

  const usedAssistantIds = new Set(sessions.flatMap((s) => s.assistantIds || []))
  const assistants = members.filter((m) => usedAssistantIds.has(m.id))

  const sessionDates = sessions
    .flatMap((s) => [s.startDate, s.endDate])
    .filter(Boolean)
    .sort()
  const firstDate = sessionDates[0]
  const lastDate = sessionDates[sessionDates.length - 1]

  const STATUS_LABELS = {
    draft: 'Brouillon',
    planned: 'Planifiée',
    registrations_open: 'Inscriptions ouvertes',
    in_progress: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée',
  }
  const STATUSES = Object.keys(STATUS_LABELS)

  return (
    <div className="space-y-6">
      {training.description && (
        <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#B01A19] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="pl-4">
            <h3 className="text-lg font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <div className="h-1 w-8 bg-[#B01A19] rounded-full" />
              Description
            </h3>
            <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">
              {training.description}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#eac7b8]/20 group-hover:bg-[#B01A19]/10 transition-colors duration-200">
              <Calendar className="w-5 h-5 text-[#B01A19]" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900">Dates</h3>
          </div>
          {firstDate && lastDate ? (
            <div className="space-y-2">
              <div>
                <span className="text-sm text-stone-500">Début :</span>
                <p className="text-stone-900 font-medium">{formatDate(firstDate)}</p>
              </div>
              {firstDate !== lastDate && (
                <div>
                  <span className="text-sm text-stone-500">Fin :</span>
                  <p className="text-stone-900 font-medium">{formatDate(lastDate)}</p>
                </div>
              )}
              <div className="pt-2 border-t border-stone-200">
                <span className="text-sm text-stone-500">
                  {sessions.length} session{sessions.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-stone-500 text-sm">Aucune session planifiée</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#eac7b8]/20 group-hover:bg-[#B01A19]/10 transition-colors duration-200">
              <FileText className="w-5 h-5 text-[#B01A19]" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900">Tarif et places</h3>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-stone-500">Tarif :</span>
              <p className="text-stone-900 font-medium text-lg">
                {Number(training.price || 0).toLocaleString('fr-FR')} €
              </p>
            </div>
            <div>
              <span className="text-sm text-stone-500">Places :</span>
              <p className="text-stone-900 font-medium">
                {training.maxParticipants || 0} participant{(training.maxParticipants || 0) > 1 ? 's' : ''} maximum
              </p>
            </div>
            {training.requiresAccommodation && (
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#eac7b8] px-2.5 py-1 text-sm font-medium text-[#B01A19]">
                  <Home className="w-3 h-3" />
                  Hébergement requis
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {usedLocations.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#eac7b8]/20">
              <MapPin className="w-5 h-5 text-[#B01A19]" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900">Lieux de formation</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {usedLocations.map((location) => (
              <div
                key={location.id}
                className="p-4 bg-stone-50 rounded-lg border border-stone-200"
              >
                <h4 className="font-medium text-stone-900 mb-1">{location.name}</h4>
                {location.address && (
                  <p className="text-sm text-stone-600">
                    {String(location.address).split(',').slice(-2).join(',').trim()}
                  </p>
                )}
                {location.hasAccommodation && (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs rounded border border-stone-300 px-2 py-1">
                    <Home className="w-3 h-3" />
                    Hébergement disponible
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {trainers.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#eac7b8]/20">
              <User className="w-5 h-5 text-[#B01A19]" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900">Formateurs</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {trainers.map((trainer) => (
              <div
                key={trainer.id}
                className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200"
              >
                {trainer.avatar ? (
                  <img
                    src={trainer.avatar}
                    alt={trainer.firstName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-sm font-medium text-stone-600">
                    {(trainer.firstName?.[0] || '') + (trainer.lastName?.[0] || '')}
                  </div>
                )}
                <span className="text-sm font-medium text-stone-900">
                  {trainer.firstName} {trainer.lastName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {assistants.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#eac7b8]/20">
              <User className="w-5 h-5 text-[#B01A19]" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900">Assistants</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {assistants.map((assistant) => (
              <div
                key={assistant.id}
                className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200"
              >
                {assistant.avatar ? (
                  <img
                    src={assistant.avatar}
                    alt={assistant.firstName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-sm font-medium text-stone-600">
                    {(assistant.firstName?.[0] || '') + (assistant.lastName?.[0] || '')}
                  </div>
                )}
                <span className="text-sm font-medium text-stone-900">
                  {assistant.firstName} {assistant.lastName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {training.coordinatorNote && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
          <div className="pt-2">
            <h3 className="text-lg font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <div className="h-1 w-8 bg-amber-500 rounded-full" />
              Note du coordinateur
            </h3>
            <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">
              {training.coordinatorNote}
            </p>
          </div>
        </div>
      )}

      {onUpdateStatus && (
        <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900 mb-3">Changer le statut</h3>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onUpdateStatus(status)}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:border-[#B01A19] hover:text-[#B01A19] hover:bg-[#B01A19]/5 transition-colors"
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
