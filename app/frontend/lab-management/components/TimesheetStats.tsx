import { useMemo } from 'react'
import type { Timesheet, Member } from '../types'

export interface TimesheetStatsProps {
  timesheets: Timesheet[]
  members: Member[]
  currentMemberId: string
  isAdmin?: boolean
}

const modeColorsBg: Record<string, string> = {
  Design: 'bg-[#AFBD00]',
  Formation: 'bg-[#B01A19]',
  Administratif: 'bg-[#5B5781]',
  Coordination: 'bg-[#234766]',
  Communication: 'bg-[#EF9B0D]',
}

const formatNumber = (n: number, decimals = 1) => {
  return n.toFixed(decimals).replace('.', ',')
}

export function TimesheetStats({ timesheets }: TimesheetStatsProps) {
  const stats = useMemo(() => {
    const totalHours = timesheets.reduce((sum, ts) => sum + ts.hours, 0)
    const billedCount = timesheets.filter((ts) => ts.billed).length
    const pendingCount = timesheets.length - billedCount

    // Hours by mode
    const hoursByMode = timesheets.reduce(
      (acc, ts) => {
        const key = ts.mode || 'Autre'
        acc[key] = (acc[key] || 0) + ts.hours
        return acc
      },
      {} as Record<string, number>
    )

    // Current month stats
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const currentMonthTimesheets = timesheets.filter((ts) => ts.date.startsWith(currentMonth))
    const currentMonthHours = currentMonthTimesheets.reduce((sum, ts) => sum + ts.hours, 0)

    return { totalHours, billedCount, pendingCount, hoursByMode, currentMonthHours }
  }, [timesheets])

  const modeData = useMemo(() => {
    return Object.entries(stats.hoursByMode)
      .map(([mode, hours]) => ({ mode, hours }))
      .filter((d) => d.hours > 0)
      .sort((a, b) => b.hours - a.hours)
  }, [stats.hoursByMode])

  return (
    <div className="flex flex-col sm:flex-row gap-6 mb-6">
      <div className="flex-1 bg-white rounded-2xl border border-stone-200 p-5">
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-4xl font-bold text-stone-800 tabular-nums">
            {formatNumber(stats.totalHours)}
          </span>
          <span className="text-lg text-stone-400">heures au total</span>
        </div>

        {modeData.length > 0 && (
          <div className="space-y-3">
            <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden flex">
              {modeData.map(({ mode, hours }) => (
                <div
                  key={mode}
                  className={`h-full ${modeColorsBg[mode] || 'bg-stone-400'} first:rounded-l-full last:rounded-r-full`}
                  style={{ width: `${(hours / stats.totalHours) * 100}%` }}
                  title={`${mode}: ${formatNumber(hours)}h`}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {modeData.map(({ mode, hours }) => (
                <div key={mode} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${modeColorsBg[mode] || 'bg-stone-400'}`} />
                  <span className="text-sm text-stone-600">{mode}</span>
                  <span className="text-sm font-medium text-stone-800 tabular-nums">
                    {formatNumber(hours)}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex sm:flex-col gap-4 sm:w-48">
        <div className="flex-1 bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Ce mois</p>
          <p className="text-2xl font-bold text-stone-800 tabular-nums">
            {formatNumber(stats.currentMonthHours)}
            <span className="text-sm font-normal text-stone-400 ml-1">h</span>
          </p>
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">À facturer</p>
          <p className="text-2xl font-bold text-amber-600 tabular-nums">
            {stats.pendingCount}
            <span className="text-sm font-normal text-stone-400 ml-1">/ {timesheets.length}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
