import { Calendar, MapPin, User, Plus, Edit, Trash2 } from 'lucide-react'
import type {
  TrainingSession,
  TrainingLocation,
  Member
} from '../types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface TrainingSessionsTabProps {
  sessions: TrainingSession[]
  locations: TrainingLocation[]
  members: Member[]
  onAddSession?: () => void
  onEditSession?: (sessionId: string) => void
  onDeleteSession?: (sessionId: string) => void
}

export function TrainingSessionsTab({
  sessions,
  locations,
  members,
  onAddSession,
  onEditSession,
  onDeleteSession,
}: TrainingSessionsTabProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getLocationName = (locationId: string) => {
    return locations.find(loc => loc.id === locationId)?.name || locationId
  }

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    return member ? `${member.firstName} ${member.lastName}` : memberId
  }

  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Sessions de formation
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {sessions.length} session{sessions.length > 1 ? 's' : ''} planifiée{sessions.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => onAddSession?.()} size="sm">
          <Plus className="size-4" />
          <span className="hidden sm:inline ml-2">Nouvelle session</span>
        </Button>
      </div>

      {/* Sessions List */}
      {sortedSessions.length === 0 ? (
        <div className="bg-white dark:bg-stone-800/50 rounded-lg p-12 border border-stone-200 dark:border-stone-700 text-center">
          <Calendar className="size-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
          <p className="text-stone-500 dark:text-stone-400">
            Aucune session planifiée
          </p>
          <Button
            onClick={() => onAddSession?.()}
            variant="outline"
            className="mt-4"
            size="sm"
          >
            <Plus className="size-4" />
            Ajouter une session
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map((session, index) => {
            const startDate = new Date(session.startDate)
            const endDate = new Date(session.endDate)
            const isSameDay = startDate.toDateString() === endDate.toDateString()

            return (
              <div
                key={session.id}
                className="bg-white dark:bg-stone-800/50 rounded-lg p-5 border border-stone-200 dark:border-stone-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Date */}
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="size-4 text-[#B01A19] shrink-0" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-stone-900 dark:text-stone-100">
                          {formatDate(session.startDate)}
                        </span>
                        {!isSameDay && (
                          <>
                            <span className="text-stone-400">→</span>
                            <span className="font-medium text-stone-900 dark:text-stone-100">
                              {formatDate(session.endDate)}
                            </span>
                          </>
                        )}
                        {isSameDay && (
                          <span className="text-sm text-stone-500 dark:text-stone-400">
                            {formatTime(session.startDate)} - {formatTime(session.endDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {session.description && (
                      <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                        {session.description}
                      </p>
                    )}

                    {/* Lieux */}
                    {session.locationIds.length > 0 && (
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="size-4 text-stone-400 mt-0.5 shrink-0" />
                        <div className="flex flex-wrap gap-2">
                          {session.locationIds.map(locationId => (
                            <Badge key={locationId} variant="outline" className="text-xs">
                              {getLocationName(locationId)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Formateurs */}
                    {session.trainerIds.length > 0 && (
                      <div className="flex items-start gap-2 mb-2">
                        <User className="size-4 text-stone-400 mt-0.5 shrink-0" />
                        <div className="flex flex-wrap gap-2">
                          {session.trainerIds.map(trainerId => (
                            <Badge key={trainerId} variant="outline" className="text-xs">
                              {getMemberName(trainerId)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assistants */}
                    {session.assistantIds.length > 0 && (
                      <div className="flex items-start gap-2">
                        <User className="size-4 text-stone-400 mt-0.5 shrink-0" />
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-stone-500 dark:text-stone-400 mr-1">
                            Assistants :
                          </span>
                          {session.assistantIds.map(assistantId => (
                            <Badge key={assistantId} variant="outline" className="text-xs">
                              {getMemberName(assistantId)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <Edit className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditSession?.(session.id)}>
                        <Edit className="size-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDeleteSession?.(session.id)}
                      >
                        <Trash2 className="size-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

