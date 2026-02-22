import { useState, useMemo } from 'react'
import type { Timesheet, Member, Guild } from '../types'
import { TimesheetRow } from './TimesheetRow'
import { TimesheetFilters } from './TimesheetFilters'
import { TimesheetStats } from './TimesheetStats'

const formatNumber = (n: number, decimals = 1) => {
  return n.toFixed(decimals).replace('.', ',')
}

const getDefaultDateRange = () => {
  const today = new Date()
  const oneMonthAgo = new Date(today)
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  return {
    start: oneMonthAgo.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0],
  }
}

export interface TimesheetListProps {
  timesheets: Timesheet[]
  members: Member[]
  guilds: Guild[]
  currentMemberId: string
  isAdmin?: boolean
  onCreateTimesheet?: () => void
  onEditTimesheet?: (timesheetId: string) => void
  onDeleteTimesheet?: (timesheetId: string) => void
  onMarkInvoiced?: (timesheetId: string) => void
  onViewMember?: (memberId: string) => void
  onViewGuild?: (guildId: string) => void
}

export function TimesheetList({
  timesheets,
  members,
  guilds,
  currentMemberId,
  isAdmin = false,
  onCreateTimesheet,
  onEditTimesheet,
  onDeleteTimesheet,
  onMarkInvoiced,
  onViewMember,
}: TimesheetListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [modeFilter, setModeFilter] = useState<string>('all')
  const [billedFilter, setBilledFilter] = useState<'all' | 'billed' | 'pending'>('all')
  const [memberFilter, setMemberFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(getDefaultDateRange)

  const accessibleTimesheets = isAdmin
    ? timesheets
    : timesheets.filter((ts) => ts.memberId === currentMemberId)

  const dateFilteredTimesheets = useMemo(() => {
    return accessibleTimesheets.filter((ts) => {
      if (dateRange.start && ts.date < dateRange.start) return false
      if (dateRange.end && ts.date > dateRange.end) return false
      return true
    })
  }, [accessibleTimesheets, dateRange])

  const filteredTimesheets = useMemo(() => {
    return dateFilteredTimesheets.filter((ts) => {
      if (searchQuery && !ts.description.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (modeFilter !== 'all' && ts.mode !== modeFilter) return false
      if (billedFilter === 'billed' && !ts.billed) return false
      if (billedFilter === 'pending' && ts.billed) return false
      if (memberFilter !== 'all' && ts.memberId !== memberFilter) return false
      return true
    })
  }, [dateFilteredTimesheets, searchQuery, modeFilter, billedFilter, memberFilter])

  const sortedTimesheets = useMemo(() => {
    return [...filteredTimesheets].sort((a, b) => b.date.localeCompare(a.date))
  }, [filteredTimesheets])

  const groupedTimesheets = useMemo(() => {
    const groups: Record<string, Timesheet[]> = {}
    sortedTimesheets.forEach((ts) => {
      const monthKey = ts.date.substring(0, 7)
      if (!groups[monthKey]) groups[monthKey] = []
      groups[monthKey].push(ts)
    })
    return groups
  }, [sortedTimesheets])

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setModeFilter('all')
    setBilledFilter('all')
    setMemberFilter('all')
  }

  const hasActiveFilters = searchQuery || modeFilter !== 'all' || billedFilter !== 'all' || memberFilter !== 'all'

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with date range */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-800">Timesheets</h1>
              <p className="text-stone-500 mt-1">{isAdmin ? 'Gestion des prestations du Lab' : 'Mes prestations'}</p>
            </div>
            <button
              onClick={onCreateTimesheet}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#5B5781] hover:bg-[#4a4670] text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle prestation
            </button>
          </div>

          {/* Date range selector */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-stone-500">Période :</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] transition-colors"
              />
              <span className="text-stone-400">—</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              {[
                { label: '7 jours', days: 7 },
                { label: '30 jours', days: 30 },
                { label: '3 mois', days: 90 },
              ].map(({ label, days }) => (
                <button
                  key={label}
                  onClick={() => {
                    const today = new Date()
                    const past = new Date(today)
                    past.setDate(past.getDate() - days)
                    setDateRange({ start: past.toISOString().split('T')[0], end: today.toISOString().split('T')[0] })
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => {
                  const today = new Date()
                  const startOfYear = new Date(today.getFullYear(), 0, 1)
                  setDateRange({ start: startOfYear.toISOString().split('T')[0], end: today.toISOString().split('T')[0] })
                }}
                className="px-2.5 py-1 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
              >
                Cette année
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <TimesheetStats
          timesheets={dateFilteredTimesheets}
          members={members}
          currentMemberId={currentMemberId}
          isAdmin={isAdmin}
        />

        {/* Filters */}
        <TimesheetFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          modeFilter={modeFilter}
          onModeChange={setModeFilter}
          billedFilter={billedFilter}
          onBilledChange={setBilledFilter}
          memberFilter={memberFilter}
          onMemberChange={setMemberFilter}
          members={members}
          showMemberFilter={isAdmin}
          hasActiveFilters={!!hasActiveFilters}
          onClearFilters={clearFilters}
        />

        {/* Timesheets list */}
        <div className="mt-6">
          {sortedTimesheets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-stone-700 mb-2">
                {hasActiveFilters ? 'Aucun résultat' : 'Aucune prestation'}
              </h3>
              <p className="text-stone-500 mb-6 max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'Aucune prestation ne correspond à vos critères de recherche.'
                  : "Commencez par saisir votre première prestation pour suivre votre temps de travail."}
              </p>
              {hasActiveFilters ? (
                <button onClick={clearFilters} className="inline-flex items-center gap-2 px-4 py-2 text-[#5B5781] hover:text-[#4a4670] font-medium transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Effacer les filtres
                </button>
              ) : (
                <button onClick={onCreateTimesheet} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5B5781] hover:bg-[#4a4670] text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Saisir une prestation
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedTimesheets).map(([monthKey, monthTimesheets]) => {
                const monthHours = monthTimesheets.reduce((sum, ts) => sum + ts.hours, 0)
                const monthKm = monthTimesheets.reduce((sum, ts) => sum + (ts.travelKm || 0), 0)
                const billedCount = monthTimesheets.filter((ts) => ts.billed).length

                return (
                  <section key={monthKey}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-serif font-semibold text-stone-700 capitalize">
                        {formatMonthLabel(monthKey)}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-stone-500">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatNumber(monthHours)}h
                        </span>
                        {monthKm > 0 && (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            {monthKm} km
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                          {billedCount}/{monthTimesheets.length} facturées
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
                      {monthTimesheets.map((timesheet) => {
                        const member = members.find((m) => m.id === timesheet.memberId)
                        return (
                          <TimesheetRow
                            key={timesheet.id}
                            timesheet={timesheet}
                            member={member}
                            showMember={isAdmin}
                            onEdit={() => onEditTimesheet?.(timesheet.id)}
                            onDelete={() => onDeleteTimesheet?.(timesheet.id)}
                            onMarkBilled={() => onMarkInvoiced?.(timesheet.id)}
                            onViewMember={() => member && onViewMember?.(member.id)}
                          />
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>

        {sortedTimesheets.length > 0 && (
          <div className="mt-8 py-4 border-t border-stone-200">
            <p className="text-sm text-stone-500 text-center">
              {sortedTimesheets.length} prestation{sortedTimesheets.length > 1 ? 's' : ''} affichée
              {sortedTimesheets.length > 1 ? 's' : ''}
              {hasActiveFilters && (
                <span className="ml-1">(sur {accessibleTimesheets.length} au total)</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
