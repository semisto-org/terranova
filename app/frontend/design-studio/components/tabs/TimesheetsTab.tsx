import { useState, useMemo } from 'react'
import { Clock, Trash2 } from 'lucide-react'
import type { Timesheet, ProjectPhase } from '../../types'
import { EmptyState } from '../shared/EmptyState'
import { ActivityChart } from './ActivityChart'
import { TimesheetEditModal } from './TimesheetEditModal'

function HoursSummaryCard({
  totalHours,
  billedHours,
  semosHours,
}: {
  totalHours: number
  billedHours: number
  semosHours: number
}) {
  const billedPct = totalHours > 0 ? (billedHours / totalHours) * 100 : 0
  const semosPct = totalHours > 0 ? (semosHours / totalHours) * 100 : 0

  return (
    <div className="rounded-2xl border border-stone-200 overflow-hidden bg-gradient-to-br from-[#e1e6d8]/60 via-white to-[#e1e6d8]/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-stone-900 tabular-nums">
              {totalHours}h
            </span>
            <span className="text-sm text-stone-500 font-medium">total</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: '#5B5781' }}
              />
              <span className="text-stone-600">
                <span className="font-semibold text-stone-900 tabular-nums">
                  {billedHours}h
                </span>
                <span className="font-medium text-stone-500 ml-1">
                  facturées
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: '#EF9B0D' }}
              />
              <span className="text-stone-600">
                <span className="font-semibold text-stone-900 tabular-nums">
                  {semosHours}h
                </span>
                <span className="font-medium text-stone-500 ml-1">Semos</span>
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 h-2.5 rounded-full bg-stone-100 overflow-hidden flex">
          {billedPct > 0 && (
            <div
              className={`h-full transition-all duration-500 ease-out ${
                semosPct > 0 ? 'rounded-l-full' : 'rounded-full'
              }`}
              style={{
                width: `${billedPct}%`,
                backgroundColor: '#5B5781',
                minWidth: billedPct > 0 ? '6px' : 0,
              }}
            />
          )}
          {semosPct > 0 && (
            <div
              className={`h-full transition-all duration-500 ease-out ${
                billedPct > 0 ? 'rounded-r-full' : 'rounded-full'
              }`}
              style={{
                width: `${semosPct}%`,
                backgroundColor: '#EF9B0D',
                minWidth: semosPct > 0 ? '6px' : 0,
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

interface TimesheetsTabProps {
  timesheets: Timesheet[]
  onUpdateTimesheet?: (
    id: string,
    values: {
      date: string
      hours: number
      phase: ProjectPhase
      mode: 'billed' | 'semos'
      travel_km: number
      notes: string
      details?: string
      service_type_id?: string | null
    }
  ) => Promise<void>
  onDeleteTimesheet: (id: string) => void
  timesheetEditBusy?: boolean
}

export function TimesheetsTab({
  timesheets,
  onUpdateTimesheet,
  onDeleteTimesheet,
  timesheetEditBusy = false,
}: TimesheetsTabProps) {
  const [editModalTimesheet, setEditModalTimesheet] = useState<Timesheet | null>(null)

  const totalHours = useMemo(
    () => timesheets.reduce((sum, t) => sum + Number(t.hours || 0), 0),
    [timesheets]
  )
  const totalBilled = useMemo(
    () =>
      timesheets
        .filter((t) => t.mode === 'billed')
        .reduce((sum, t) => sum + Number(t.hours || 0), 0),
    [timesheets]
  )
  const totalSemos = useMemo(
    () =>
      timesheets
        .filter((t) => t.mode === 'semos')
        .reduce((sum, t) => sum + Number(t.hours || 0), 0),
    [timesheets]
  )

  return (
    <div className="space-y-6">
      {totalHours > 0 && (
        <HoursSummaryCard
          totalHours={totalHours}
          billedHours={totalBilled}
          semosHours={totalSemos}
        />
      )}

      {totalHours > 0 && <ActivityChart timesheets={timesheets} />}

      {timesheets.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-10 h-10 text-stone-400" />}
          title="Aucune prestation"
          description="Les heures passées sur le projet apparaîtront ici."
        />
      ) : (
        <div className="rounded-2xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-4 py-3 font-semibold text-stone-600">
                    Date
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-600">
                    Membre
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-600 text-right">
                    Heures
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-600">
                    Phase
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-600">
                    Mode
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-600">
                    Type
                  </th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {timesheets.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-stone-100 hover:bg-stone-50/50 ${
                      onUpdateTimesheet ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => {
                      if (onUpdateTimesheet) {
                        const ts = timesheets.find((t) => t.id === item.id)
                        if (ts) setEditModalTimesheet(ts)
                      }
                    }}
                  >
                    <td className="px-4 py-3 text-stone-600">
                      {new Date(item.date).toLocaleDateString('fr-BE')}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {item.memberName}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {Number(item.hours)}h
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {item.phase}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          item.mode === 'billed'
                            ? 'text-[#5B5781]'
                            : 'text-stone-500'
                        }
                      >
                        {item.mode === 'billed' ? 'Facturé' : 'Semos'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {item.serviceTypeLabel || '—'}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onDeleteTimesheet(item.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {onUpdateTimesheet && (
        <TimesheetEditModal
          timesheet={editModalTimesheet}
          open={Boolean(editModalTimesheet)}
          busy={timesheetEditBusy}
          onSave={async (values) => {
            if (editModalTimesheet) {
              await onUpdateTimesheet(editModalTimesheet.id, values)
            }
          }}
          onClose={() => setEditModalTimesheet(null)}
        />
      )}
    </div>
  )
}
