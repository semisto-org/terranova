import React from 'react'
import { User, CheckCircle2, XCircle, Calendar } from 'lucide-react'

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

export default function TrainingAttendancesTab({
  registrations = [],
  sessions = [],
  attendances = [],
  onMarkAttendance,
}) {
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  const getAttendance = (registrationId, sessionId) =>
    attendances.find(
      (att) => att.registrationId === registrationId && att.sessionId === sessionId
    )

  const getAttendanceStatus = (registrationId, sessionId) => {
    const attendance = getAttendance(registrationId, sessionId)
    if (!attendance) return 'unknown'
    return attendance.isPresent ? 'present' : 'absent'
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 border border-stone-200 text-center">
        <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
        <p className="text-stone-500">Aucune session planifiée pour cette formation</p>
      </div>
    )
  }

  if (registrations.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 border border-stone-200 text-center">
        <User className="w-12 h-12 text-stone-300 mx-auto mb-4" />
        <p className="text-stone-500">Aucun participant inscrit pour cette formation</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-stone-900">Présences</h3>
        <p className="text-sm text-stone-500 mt-1">Suivi des présences par session</p>
      </div>

      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wide min-w-[200px] sticky left-0 bg-stone-50 z-10">
                  Participant
                </th>
                {sortedSessions.map((session) => (
                  <th
                    key={session.id}
                    className="px-4 py-3 text-center min-w-[100px] text-xs font-semibold text-stone-600 uppercase tracking-wide"
                  >
                    <div className="flex flex-col items-center">
                      <Calendar className="w-4 h-4 mb-1 text-stone-400" />
                      <span>{formatDate(session.startDate)}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration) => {
                const presentCount = sortedSessions.filter(
                  (session) => getAttendanceStatus(registration.id, session.id) === 'present'
                ).length
                const absentCount = sortedSessions.filter(
                  (session) => getAttendanceStatus(registration.id, session.id) === 'absent'
                ).length

                return (
                  <tr key={registration.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                    <td className="px-4 py-3 sticky left-0 bg-white z-10">
                      <p className="font-medium text-stone-900">{registration.contactName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-emerald-600">
                          {presentCount} présent{presentCount !== 1 ? 's' : ''}
                        </span>
                        {absentCount > 0 && (
                          <span className="text-xs text-red-600">
                            {absentCount} absent{absentCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    {sortedSessions.map((session) => {
                      const status = getAttendanceStatus(registration.id, session.id)
                      const attendance = getAttendance(registration.id, session.id)

                      return (
                        <td key={session.id} className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (status === 'present') {
                                onMarkAttendance?.(registration.id, session.id, false)
                              } else {
                                onMarkAttendance?.(registration.id, session.id, true)
                              }
                            }}
                            className="mx-auto flex items-center justify-center p-1 rounded hover:bg-stone-100"
                            aria-label={
                              status === 'present'
                                ? 'Présent - cliquer pour marquer absent'
                                : status === 'absent'
                                  ? 'Absent - cliquer pour marquer présent'
                                  : 'Non renseigné - cliquer pour marquer présent'
                            }
                          >
                            {status === 'present' && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            )}
                            {status === 'absent' && (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            {status === 'unknown' && (
                              <div className="w-5 h-5 rounded-full border-2 border-stone-300" />
                            )}
                          </button>
                          {attendance?.note && (
                            <p
                              className="text-xs text-stone-500 mt-1 max-w-[100px] truncate mx-auto"
                              title={attendance.note}
                            >
                              {attendance.note}
                            </p>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
