import { User, CheckCircle2, XCircle, Calendar } from 'lucide-react'
import type {
  TrainingRegistration,
  TrainingSession,
  TrainingAttendance
} from '../types'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TrainingAttendancesTabProps {
  registrations: TrainingRegistration[]
  sessions: TrainingSession[]
  attendances: TrainingAttendance[]
  onMarkAttendance?: (registrationId: string, sessionId: string, isPresent: boolean) => void
}

export function TrainingAttendancesTab({
  registrations,
  sessions,
  attendances,
  onMarkAttendance,
}: TrainingAttendancesTabProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    })
  }

  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  const getAttendance = (registrationId: string, sessionId: string) => {
    return attendances.find(
      att => att.registrationId === registrationId && att.sessionId === sessionId
    )
  }

  const getAttendanceStatus = (registrationId: string, sessionId: string) => {
    const attendance = getAttendance(registrationId, sessionId)
    if (!attendance) return 'unknown'
    return attendance.isPresent ? 'present' : 'absent'
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white dark:bg-stone-800/50 rounded-lg p-12 border border-stone-200 dark:border-stone-700 text-center">
        <Calendar className="size-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
        <p className="text-stone-500 dark:text-stone-400">
          Aucune session planifiée pour cette formation
        </p>
      </div>
    )
  }

  if (registrations.length === 0) {
    return (
      <div className="bg-white dark:bg-stone-800/50 rounded-lg p-12 border border-stone-200 dark:border-stone-700 text-center">
        <User className="size-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
        <p className="text-stone-500 dark:text-stone-400">
          Aucun participant inscrit pour cette formation
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          Présences
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Suivi des présences par session
        </p>
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px] sticky left-0 bg-white dark:bg-stone-800/50 z-10">
                  Participant
                </TableHead>
                {sortedSessions.map(session => (
                  <TableHead key={session.id} className="text-center min-w-[120px]">
                    <div className="flex flex-col items-center">
                      <Calendar className="size-4 mb-1" />
                      <span className="text-xs">{formatDate(session.startDate)}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map(registration => {
                const presentCount = sortedSessions.filter(session => {
                  const status = getAttendanceStatus(registration.id, session.id)
                  return status === 'present'
                }).length
                const absentCount = sortedSessions.filter(session => {
                  const status = getAttendanceStatus(registration.id, session.id)
                  return status === 'absent'
                }).length

                return (
                  <TableRow key={registration.id}>
                    <TableCell className="sticky left-0 bg-white dark:bg-stone-800/50 z-10">
                      <div>
                        <p className="font-medium text-stone-900 dark:text-stone-100">
                          {registration.contactName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">
                            {presentCount} présent{presentCount > 1 ? 's' : ''}
                          </span>
                          {absentCount > 0 && (
                            <span className="text-xs text-red-600 dark:text-red-400">
                              {absentCount} absent{absentCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    {sortedSessions.map(session => {
                      const status = getAttendanceStatus(registration.id, session.id)
                      const attendance = getAttendance(registration.id, session.id)

                      return (
                        <TableCell key={session.id} className="text-center">
                          <button
                            onClick={() => {
                              if (status === 'present') {
                                onMarkAttendance?.(registration.id, session.id, false)
                              } else if (status === 'absent') {
                                onMarkAttendance?.(registration.id, session.id, true)
                              } else {
                                onMarkAttendance?.(registration.id, session.id, true)
                              }
                            }}
                            className="mx-auto flex items-center justify-center"
                          >
                            {status === 'present' && (
                              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                            )}
                            {status === 'absent' && (
                              <XCircle className="size-5 text-red-600 dark:text-red-400" />
                            )}
                            {status === 'unknown' && (
                              <div className="size-5 rounded-full border-2 border-stone-300 dark:border-stone-600" />
                            )}
                          </button>
                          {attendance?.note && (
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-[100px] truncate mx-auto" title={attendance.note}>
                              {attendance.note}
                            </p>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

