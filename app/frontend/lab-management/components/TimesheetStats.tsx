import { useMemo } from 'react'
import type { Timesheet, Member, TimesheetCategory } from '../types'

export interface TimesheetStatsProps {
  timesheets: Timesheet[]
  members: Member[]
  currentMemberId: string
  isAdmin?: boolean
}

const categoryLabels: Record<TimesheetCategory, string> = {
  design: 'Design',
  formation: 'Formation',
  administratif: 'Administratif',
  coordination: 'Coordination',
  communication: 'Communication',
}

const categoryColors: Record<TimesheetCategory, string> = {
  design: 'bg-[#AFBD00]',
  formation: 'bg-[#B01A19]',
  administratif: 'bg-[#5B5781]',
  coordination: 'bg-[#234766]',
  communication: 'bg-[#EF9B0D]',
}

const formatNumber = (n: number, decimals = 1) => {
  return n.toFixed(decimals).replace('.', ',')
}

export function TimesheetStats({ timesheets }: TimesheetStatsProps) {
  const stats = useMemo(() => {
    const totalHours = timesheets.reduce((sum, ts) => sum + ts.hours, 0)
    const invoicedCount = timesheets.filter((ts) => ts.invoiced).length
    const pendingCount = timesheets.length - invoicedCount

    // Hours by category
    const hoursByCategory = timesheets.reduce(
      (acc, ts) => {
        acc[ts.category] = (acc[ts.category] || 0) + ts.hours
        return acc
      },
      {} as Record<TimesheetCategory, number>
    )

    // Hours by payment type
    const invoiceHours = timesheets
      .filter((ts) => ts.paymentType === 'invoice')
      .reduce((sum, ts) => sum + ts.hours, 0)
    const semosHours = timesheets
      .filter((ts) => ts.paymentType === 'semos')
      .reduce((sum, ts) => sum + ts.hours, 0)

    // Current month stats
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const currentMonthTimesheets = timesheets.filter((ts) => ts.date.startsWith(currentMonth))
    const currentMonthHours = currentMonthTimesheets.reduce((sum, ts) => sum + ts.hours, 0)

    return {
      totalHours,
      invoicedCount,
      pendingCount,
      hoursByCategory,
      invoiceHours,
      semosHours,
      currentMonthHours,
    }
  }, [timesheets])

  // Calculate category bar chart data
  const categoryData = useMemo(() => {
    return (Object.keys(categoryLabels) as TimesheetCategory[])
      .map((cat) => ({
        category: cat,
        hours: stats.hoursByCategory[cat] || 0,
      }))
      .filter((d) => d.hours > 0)
      .sort((a, b) => b.hours - a.hours)
  }, [stats.hoursByCategory])

  return (
    <div className="flex flex-col sm:flex-row gap-6 mb-6">
      {/* Main stats - horizontal bar */}
      <div className="flex-1 bg-white dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 p-5">
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-4xl font-bold text-stone-800 dark:text-stone-100 tabular-nums">
            {formatNumber(stats.totalHours)}
          </span>
          <span className="text-lg text-stone-400 dark:text-stone-500">heures au total</span>
        </div>

        {/* Stacked bar showing category distribution */}
        {categoryData.length > 0 && (
          <div className="space-y-3">
            <div className="h-3 w-full bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden flex">
              {categoryData.map(({ category, hours }) => (
                <div
                  key={category}
                  className={`h-full ${categoryColors[category]} first:rounded-l-full last:rounded-r-full`}
                  style={{ width: `${(hours / stats.totalHours) * 100}%` }}
                  title={`${categoryLabels[category]}: ${formatNumber(hours)}h`}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {categoryData.map(({ category, hours }) => (
                <div key={category} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${categoryColors[category]}`} />
                  <span className="text-sm text-stone-600 dark:text-stone-400">
                    {categoryLabels[category]}
                  </span>
                  <span className="text-sm font-medium text-stone-800 dark:text-stone-200 tabular-nums">
                    {formatNumber(hours)}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Side stats */}
      <div className="flex sm:flex-col gap-4 sm:w-48">
        {/* This month */}
        <div className="flex-1 bg-white dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 p-4">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">
            Ce mois
          </p>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100 tabular-nums">
            {formatNumber(stats.currentMonthHours)}
            <span className="text-sm font-normal text-stone-400 dark:text-stone-500 ml-1">h</span>
          </p>
        </div>

        {/* Pending */}
        <div className="flex-1 bg-white dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 p-4">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">
            À facturer
          </p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {stats.pendingCount}
            <span className="text-sm font-normal text-stone-400 dark:text-stone-500 ml-1">
              / {timesheets.length}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
