import { useState, useMemo, useRef, useEffect } from 'react'
import type { Event, Cycle, Member, EventType } from '../types'

export interface CalendarViewProps {
  events: Event[]
  cycles: Cycle[]
  members: Member[]
  currentMemberId: string
  onCreateEvent?: () => void
  onViewEvent?: (eventId: string) => void
  onEditEvent?: (eventId: string) => void
  onDeleteEvent?: (eventId: string) => void
}

type ViewMode = 'month' | 'week'

// Helper function to get event type label (fallback for unknown types)
function getEventTypeLabel(type: string): string {
  return type || 'Événement'
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAYS_FR_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const MONTHS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

// Helper to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Helper to get Monday of the week containing the given date
function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Helper to check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

// Helper to get date string for comparison (YYYY-MM-DD)
function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Type for event instance on a specific day (used for single-day events)
interface SingleDayEvent {
  event: Event
  isMultiDay: false
}

// Type for spanning multi-day events within a week
interface SpanningEvent {
  event: Event
  isMultiDay: true
  startCol: number // 0-indexed column (0 = Monday, 6 = Sunday)
  endCol: number // 0-indexed column (inclusive)
  spanDays: number // number of days it spans in this week
  continuesFromPrevWeek: boolean
  continuesToNextWeek: boolean
}

export function CalendarView({
  events,
  cycles,
  members,
  currentMemberId,
  onCreateEvent,
  onViewEvent,
  onEditEvent,
  onDeleteEvent,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [filterTypes, setFilterTypes] = useState<EventType[]>([])

  // Current member
  const currentMember = members.find((m) => m.id === currentMemberId)

  // Get first and last day of the current month view
  const { firstDay, lastDay, daysInMonth, startOffset } = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)

    // Monday = 0, Sunday = 6 (adjust from JS where Sunday = 0)
    let offset = first.getDay() - 1
    if (offset < 0) offset = 6

    return {
      firstDay: first,
      lastDay: last,
      daysInMonth: last.getDate(),
      startOffset: offset,
    }
  }, [currentDate])

  // Get week days for week view
  const weekDays = useMemo(() => {
    const monday = getMonday(currentDate)
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      days.push(d)
    }
    return days
  }, [currentDate])

  // Get cycle phase for a specific date
  const getCyclePhase = (date: Date): 'work' | 'cooldown' | null => {
    for (const cycle of cycles) {
      const startDate = new Date(cycle.startDate)
      const endDate = new Date(cycle.endDate)
      const cooldownStart = new Date(cycle.cooldownStart)
      const cooldownEnd = new Date(cycle.cooldownEnd)

      // Set times to midnight for comparison
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
      cooldownStart.setHours(0, 0, 0, 0)
      cooldownEnd.setHours(23, 59, 59, 999)

      const checkDate = new Date(date)
      checkDate.setHours(12, 0, 0, 0)

      if (checkDate >= startDate && checkDate <= endDate) {
        return 'work'
      }
      if (checkDate >= cooldownStart && checkDate <= cooldownEnd) {
        return 'cooldown'
      }
    }
    return null
  }

  // Get single-day events for a specific date (excludes multi-day events)
  const getSingleDayEventsForDate = (date: Date): SingleDayEvent[] => {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)

    const result: SingleDayEvent[] = []

    for (const event of events) {
      // Apply filter
      if (filterTypes.length > 0 && !filterTypes.includes(event.type)) {
        continue
      }

      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)

      // Normalize to start of day for comparison
      const eventStartDay = new Date(eventStart)
      eventStartDay.setHours(0, 0, 0, 0)
      const eventEndDay = new Date(eventEnd)
      eventEndDay.setHours(0, 0, 0, 0)

      // Only include single-day events
      const isSameDay = eventStartDay.getTime() === eventEndDay.getTime()
      if (isSameDay && checkDate.getTime() === eventStartDay.getTime()) {
        result.push({ event, isMultiDay: false })
      }
    }

    return result
  }

  // Get spanning multi-day events for a week (given week's Monday) - used by WeekView
  const getSpanningEventsForWeek = (weekMonday: Date): SpanningEvent[] => {
    const weekDates: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekMonday)
      d.setDate(weekMonday.getDate() + i)
      weekDates.push(d)
    }
    return getSpanningEventsForWeekDates(weekDates)
  }

  // Get spanning multi-day events for a week given the 7 dates in that row - used by MonthView
  const getSpanningEventsForWeekDates = (weekDates: Date[]): SpanningEvent[] => {
    const weekStart = new Date(weekDates[0])
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekDates[6])
    weekEnd.setHours(23, 59, 59, 999)

    const result: SpanningEvent[] = []

    for (const event of events) {
      // Apply filter
      if (filterTypes.length > 0 && !filterTypes.includes(event.type)) {
        continue
      }

      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)

      // Normalize to start/end of day for comparison
      const eventStartDay = new Date(eventStart)
      eventStartDay.setHours(0, 0, 0, 0)
      const eventEndDay = new Date(eventEnd)
      eventEndDay.setHours(0, 0, 0, 0)

      // Check if this is a multi-day event
      const isMultiDay = eventStartDay.getTime() !== eventEndDay.getTime()

      if (!isMultiDay) continue

      // Check if event overlaps with this week
      const eventEndDayEnd = new Date(eventEndDay)
      eventEndDayEnd.setHours(23, 59, 59, 999)
      if (eventEndDayEnd < weekStart || eventStartDay > weekEnd) continue

      // Find which column indices the event spans
      let startCol = -1
      let endCol = -1

      for (let i = 0; i < weekDates.length; i++) {
        const dayDate = new Date(weekDates[i])
        dayDate.setHours(0, 0, 0, 0)

        // Check if this day is within the event range
        if (dayDate >= eventStartDay && dayDate <= eventEndDay) {
          if (startCol === -1) startCol = i
          endCol = i
        }
      }

      if (startCol === -1) continue // Event doesn't fall in this week

      result.push({
        event,
        isMultiDay: true,
        startCol,
        endCol,
        spanDays: endCol - startCol + 1,
        continuesFromPrevWeek: eventStartDay < weekStart,
        continuesToNextWeek: eventEndDay > weekEnd,
      })
    }

    // Sort by start column, then by span length (longer spans first)
    return result.sort((a, b) => {
      if (a.startCol !== b.startCol) return a.startCol - b.startCol
      return b.spanDays - a.spanDays
    })
  }

  // Navigation - Month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Navigation - Week
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Toggle filter
  const toggleFilter = (type: EventType) => {
    setFilterTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  // Selected event
  const selectedEvent = selectedEventId ? events.find((e) => e.id === selectedEventId) : null

  // Generate calendar days for month view
  const calendarDays = useMemo(() => {
    const days: { date: Date; isCurrentMonth: boolean }[] = []

    // Previous month days
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - i),
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
        isCurrentMonth: true,
      })
    }

    // Next month days (fill to complete the grid - 6 rows)
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i),
        isCurrentMonth: false,
      })
    }

    return days
  }, [currentDate, daysInMonth, startOffset])

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Format week range for header
  const weekRangeText = useMemo(() => {
    const monday = weekDays[0]
    const sunday = weekDays[6]
    const sameMonth = monday.getMonth() === sunday.getMonth()
    const sameYear = monday.getFullYear() === sunday.getFullYear()

    if (sameMonth && sameYear) {
      return `${monday.getDate()} - ${sunday.getDate()} ${MONTHS_FR[monday.getMonth()]} ${monday.getFullYear()}`
    } else if (sameYear) {
      return `${monday.getDate()} ${MONTHS_FR[monday.getMonth()]} - ${sunday.getDate()} ${MONTHS_FR[sunday.getMonth()]} ${monday.getFullYear()}`
    } else {
      return `${monday.getDate()} ${MONTHS_FR[monday.getMonth()]} ${monday.getFullYear()} - ${sunday.getDate()} ${MONTHS_FR[sunday.getMonth()]} ${sunday.getFullYear()}`
    }
  }, [weekDays])

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-800">
              Calendrier
            </h1>
            <p className="text-stone-500 mt-1">
              Cycles, réunions et événements du Lab
            </p>
          </div>

          <button
            onClick={onCreateEvent}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B5781] hover:bg-[#4a4670] text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvel événement
          </button>
        </div>

        {/* Calendar navigation */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          {/* Month/Week navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-stone-200 gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={viewMode === 'month' ? goToPreviousMonth : goToPreviousWeek}
                className="p-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={viewMode === 'month' ? goToNextMonth : goToNextWeek}
                className="p-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-stone-800 ml-2">
                {viewMode === 'month'
                  ? `${MONTHS_FR[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                  : `Semaine ${getWeekNumber(currentDate)}`
                }
              </h2>
              {viewMode === 'week' && (
                <span className="text-sm text-stone-500 ml-2 hidden md:inline">
                  {weekRangeText}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* View mode toggle */}
              <div className="flex bg-stone-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('month')}
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-md transition-all
                    ${viewMode === 'month'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                    }
                  `}
                >
                  Mois
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-md transition-all
                    ${viewMode === 'week'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                    }
                  `}
                >
                  Semaine
                </button>
              </div>

              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                Aujourd'hui
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 p-4 border-b border-stone-200 bg-stone-50">
            <span className="text-xs text-stone-500 self-center mr-2">Filtres:</span>
            {/* Note: Filter by event types from events list */}
            {Array.from(new Set(events.map(e => e.type))).map((type) => {
              const isActive = filterTypes.length === 0 || filterTypes.includes(type as EventType)
              return (
                <button
                  key={type}
                  onClick={() => toggleFilter(type as EventType)}
                  className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                    ${
                      isActive
                        ? 'bg-stone-100 text-stone-700'
                        : 'bg-stone-200 text-stone-400 opacity-50'
                    }
                  `}
                >
                  <span className="hidden sm:inline">{getEventTypeLabel(type)}</span>
                </button>
              )
            })}
            {filterTypes.length > 0 && (
              <button
                onClick={() => setFilterTypes([])}
                className="text-xs text-stone-500 hover:text-stone-700 underline ml-2"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-2 border-b border-stone-200 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#c8bfd2]/40"></span>
              <span className="text-stone-500">Cycle travail</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-200"></span>
              <span className="text-stone-500">Cooldown</span>
            </div>
          </div>

          {/* Calendar content */}
          <div className="p-4">
            {viewMode === 'month' ? (
              <MonthView
                calendarDays={calendarDays}
                getSingleDayEventsForDate={getSingleDayEventsForDate}
                getSpanningEventsForWeekDates={getSpanningEventsForWeekDates}
                getCyclePhase={getCyclePhase}
                isToday={isToday}
                onSelectEvent={setSelectedEventId}
              />
            ) : (
              <WeekView
                weekDays={weekDays}
                getSingleDayEventsForDate={getSingleDayEventsForDate}
                getSpanningEventsForWeekDates={getSpanningEventsForWeekDates}
                getCyclePhase={getCyclePhase}
                isToday={isToday}
                onSelectEvent={setSelectedEventId}
                members={members}
              />
            )}
          </div>
        </div>

        {/* Event detail modal */}
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            members={members}
            onClose={() => setSelectedEventId(null)}
            onEdit={() => {
              onEditEvent?.(selectedEvent.id)
              setSelectedEventId(null)
            }}
            onDelete={() => {
              onDeleteEvent?.(selectedEvent.id)
              setSelectedEventId(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Month View Component
// =============================================================================

interface MonthViewProps {
  calendarDays: { date: Date; isCurrentMonth: boolean }[]
  getSingleDayEventsForDate: (date: Date) => SingleDayEvent[]
  getSpanningEventsForWeekDates: (weekDates: Date[]) => SpanningEvent[]
  getCyclePhase: (date: Date) => 'work' | 'cooldown' | null
  isToday: (date: Date) => boolean
  onSelectEvent: (eventId: string) => void
}

function MonthView({
  calendarDays,
  getSingleDayEventsForDate,
  getSpanningEventsForWeekDates,
  getCyclePhase,
  isToday,
  onSelectEvent,
}: MonthViewProps) {
  // Determine background color based on cycle phase
  const getBgClass = (date: Date, isCurrentMonth: boolean) => {
    const cyclePhase = getCyclePhase(date)
    if (cyclePhase === 'work') {
      return 'bg-[#c8bfd2]/20'
    }
    if (cyclePhase === 'cooldown') {
      return 'bg-amber-100'
    }
    if (isCurrentMonth) {
      return 'bg-white'
    }
    return 'bg-stone-50'
  }

  // Group calendar days into weeks (each week is 7 days)
  const weeks: { date: Date; isCurrentMonth: boolean }[][] = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }

  // Height of the day number area (to position spanning events below it)
  const DAY_NUMBER_HEIGHT = 32 // h-7 (28px) + mb-1 (4px)

  return (
    <>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_FR.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-stone-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="bg-stone-200 rounded-lg overflow-hidden">
        {weeks.map((week, weekIndex) => {
          const weekDates = week.map(d => d.date)
          const spanningEvents = getSpanningEventsForWeekDates(weekDates)

          return (
            <div key={weekIndex} className="relative grid grid-cols-7 gap-px">
              {/* Spanning events layer - positioned absolutely over the grid */}
              {spanningEvents.map((spanEvent, eventIndex) => {
                // Calculate left position and width based on columns
                // Each column is 1/7 of the width (14.2857%)
                const colWidth = 100 / 7
                const leftPercent = spanEvent.startCol * colWidth
                const widthPercent = spanEvent.spanDays * colWidth

                return (
                  <button
                    key={spanEvent.event.id}
                    onClick={() => onSelectEvent(spanEvent.event.id)}
                    className={`
                      absolute z-10 text-left px-1.5 py-0.5 text-[10px] font-medium truncate
                      transition-opacity hover:opacity-80
                      bg-stone-100 text-stone-700
                      ${!spanEvent.continuesFromPrevWeek ? 'rounded-l' : 'rounded-l-none'}
                      ${!spanEvent.continuesToNextWeek ? 'rounded-r' : 'rounded-r-none'}
                    `}
                    style={{
                      top: `${DAY_NUMBER_HEIGHT + eventIndex * 20}px`,
                      left: `calc(${leftPercent}% + 6px)`,
                      width: `calc(${widthPercent}% - 12px)`,
                      height: '18px',
                    }}
                    title={spanEvent.event.title}
                  >
                    <span className="hidden lg:inline">{spanEvent.event.title}</span>
                  </button>
                )
              })}

              {/* Day cells */}
              {week.map((dayInfo, dayIndex) => {
                const singleDayEvents = getSingleDayEventsForDate(dayInfo.date)
                const isTodayDate = isToday(dayInfo.date)

                // Count spanning events that affect this day to add top padding
                const spanningCount = spanningEvents.filter(
                  (e) => dayIndex >= e.startCol && dayIndex <= e.endCol
                ).length

                return (
                  <div
                    key={dayIndex}
                    className={`min-h-[100px] p-1.5 transition-colors ${getBgClass(dayInfo.date, dayInfo.isCurrentMonth)}`}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`
                          w-7 h-7 flex items-center justify-center text-sm rounded-full
                          ${isTodayDate ? 'bg-[#5B5781] text-white font-bold' : ''}
                          ${!isTodayDate && dayInfo.isCurrentMonth ? 'text-stone-700' : ''}
                          ${!isTodayDate && !dayInfo.isCurrentMonth ? 'text-stone-400' : ''}
                        `}
                      >
                        {dayInfo.date.getDate()}
                      </span>
                    </div>

                    {/* Spacer for spanning events */}
                    {spanningCount > 0 && (
                      <div style={{ height: `${spanningCount * 20}px` }} />
                    )}

                    {/* Single-day events */}
                    <div className="space-y-0.5">
                      {singleDayEvents.slice(0, 3).map((singleEvent) => {
                        return (
                          <button
                            key={singleEvent.event.id}
                            onClick={() => onSelectEvent(singleEvent.event.id)}
                            className={`
                              w-full text-left px-1.5 py-0.5 text-[10px] font-medium truncate
                              transition-opacity hover:opacity-80 rounded
                              bg-stone-100 text-stone-700
                            `}
                            title={singleEvent.event.title}
                          >
                            <span className="hidden lg:inline">{singleEvent.event.title}</span>
                          </button>
                        )
                      })}
                      {singleDayEvents.length > 3 && (
                        <p className="text-[10px] text-stone-400 px-1">
                          +{singleDayEvents.length - 3} autres
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </>
  )
}

// =============================================================================
// Week View Component
// =============================================================================

interface WeekViewProps {
  weekDays: Date[]
  getSingleDayEventsForDate: (date: Date) => SingleDayEvent[]
  getSpanningEventsForWeekDates: (weekDates: Date[]) => SpanningEvent[]
  getCyclePhase: (date: Date) => 'work' | 'cooldown' | null
  isToday: (date: Date) => boolean
  onSelectEvent: (eventId: string) => void
  members: Member[]
}

function WeekView({
  weekDays,
  getSingleDayEventsForDate,
  getSpanningEventsForWeekDates,
  getCyclePhase,
  isToday,
  onSelectEvent,
  members,
}: WeekViewProps) {
  const spanningEvents = getSpanningEventsForWeekDates(weekDays)
  const dayRowRefs = useRef<(HTMLDivElement | null)[]>([])
  const [dayRowHeights, setDayRowHeights] = useState<number[]>([])

  // Measure day row heights after render
  useEffect(() => {
    const heights: number[] = []
    dayRowRefs.current.forEach((ref) => {
      if (ref) {
        heights.push(ref.offsetHeight)
      }
    })
    if (heights.length === 7) {
      setDayRowHeights(heights)
    }
  }, [weekDays, getSingleDayEventsForDate])

  // Calculate top offset and height for spanning event
  const calculateSpanPosition = (spanEvent: SpanningEvent) => {
    if (dayRowHeights.length < 7) {
      // Fallback to estimates if heights not yet measured
      const estimatedRowHeight = 76
      const gap = 12
      return {
        top: spanEvent.startCol * (estimatedRowHeight + gap),
        height: spanEvent.spanDays * estimatedRowHeight + (spanEvent.spanDays - 1) * gap,
      }
    }

    // Calculate top: sum of heights of rows before startCol + gaps
    let top = 0
    for (let i = 0; i < spanEvent.startCol; i++) {
      top += dayRowHeights[i] + 12 // 12px is space-y-3
    }

    // Calculate height: sum of heights of rows from startCol to endCol + gaps between them
    let height = 0
    for (let i = spanEvent.startCol; i <= spanEvent.endCol; i++) {
      height += dayRowHeights[i]
      if (i < spanEvent.endCol) {
        height += 12 // gap between rows
      }
    }

    return { top, height }
  }

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  // Determine background color based on cycle phase
  const getBgClass = (date: Date) => {
    const cyclePhase = getCyclePhase(date)
    if (cyclePhase === 'work') {
      return 'bg-[#c8bfd2]/10'
    }
    if (cyclePhase === 'cooldown') {
      return 'bg-amber-50'
    }
    return 'bg-white'
  }

  // Check if a day has a spanning event (for indentation)
  const dayHasSpanningEvent = (dayIndex: number): boolean => {
    return spanningEvents.some(
      (e) => dayIndex >= e.startCol && dayIndex <= e.endCol
    )
  }

  return (
    <div className="relative">
      {/* Spanning events - single vertical bars */}
      {spanningEvents.map((spanEvent, eventIndex) => {
        const { top, height } = calculateSpanPosition(spanEvent)

        return (
          <button
            key={spanEvent.event.id}
            onClick={() => onSelectEvent(spanEvent.event.id)}
            className={`
              absolute left-[108px] w-8 z-10 transition-all hover:opacity-80 hover:scale-[1.02]
              bg-stone-100
              ${!spanEvent.continuesFromPrevWeek ? 'rounded-t-lg' : 'rounded-t-none'}
              ${!spanEvent.continuesToNextWeek ? 'rounded-b-lg' : 'rounded-b-none'}
            `}
            style={{
              top: `${top}px`,
              height: `${height}px`,
              left: `calc(96px + 12px + ${eventIndex * 36}px)`, // day header width + gap + stacking offset
            }}
            title={spanEvent.event.title}
          >
            <div
              className="h-full flex items-center justify-center text-stone-700"
            >
              <span
                className="text-[11px] font-semibold whitespace-nowrap px-1"
                style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  transform: 'rotate(180deg)',
                }}
              >
                {spanEvent.event.title}
              </span>
            </div>
          </button>
        )
      })}

      {/* Day rows */}
      <div className="space-y-3">
        {weekDays.map((date, dayIndex) => {
          const isTodayDate = isToday(date)
          const cyclePhase = getCyclePhase(date)
          const singleDayEvents = getSingleDayEventsForDate(date)
          const hasSpanning = dayHasSpanningEvent(dayIndex)
          // Calculate left margin based on number of spanning events active for this day
          const spanningCount = spanningEvents.filter(
            (e) => dayIndex >= e.startCol && dayIndex <= e.endCol
          ).length

          return (
            <div
              key={dayIndex}
              ref={(el) => { dayRowRefs.current[dayIndex] = el }}
              className="flex flex-col sm:flex-row gap-3"
            >
              {/* Day header */}
              <div
                className={`
                  shrink-0 sm:w-24 p-3 rounded-xl transition-colors flex sm:flex-col items-center sm:items-center gap-3 sm:gap-1
                  ${isTodayDate
                    ? 'bg-[#5B5781] text-white'
                    : cyclePhase === 'work'
                      ? 'bg-[#c8bfd2]/30'
                      : cyclePhase === 'cooldown'
                        ? 'bg-amber-100'
                        : 'bg-stone-100'
                  }
                `}
              >
                <p className={`text-xs font-medium ${isTodayDate ? 'text-white/70' : 'text-stone-500'}`}>
                  {DAYS_FR_FULL[dayIndex]}
                </p>
                <p className={`text-2xl font-bold ${isTodayDate ? 'text-white' : 'text-stone-800'}`}>
                  {date.getDate()}
                </p>
                <p className={`text-xs ${isTodayDate ? 'text-white/70' : 'text-stone-400'}`}>
                  {MONTHS_FR[date.getMonth()].slice(0, 3)}
                </p>
              </div>

              {/* Single-day events - with left margin to accommodate spanning bars */}
              <div
                className={`flex-1 min-h-[60px] rounded-xl p-2 transition-colors ${getBgClass(date)}`}
                style={{ marginLeft: hasSpanning ? `${spanningCount * 36 + 8}px` : undefined }}
              >
                {singleDayEvents.length === 0 ? (
                  <div className="h-full" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {singleDayEvents.map((singleEvent) => {
                      const attendees = singleEvent.event.attendeeIds
                        .map((id) => members.find((m) => m.id === id))
                        .filter(Boolean) as Member[]

                      return (
                        <button
                          key={singleEvent.event.id}
                          onClick={() => onSelectEvent(singleEvent.event.id)}
                          className="relative overflow-hidden text-left p-3 rounded-lg transition-all hover:shadow-md hover:scale-[1.02] w-full sm:w-auto sm:min-w-[200px] sm:max-w-[280px] bg-stone-100 border border-transparent hover:border-stone-200"
                        >
                          <div>
                            <p className="text-[10px] font-medium text-stone-500 opacity-70">
                              {formatTime(singleEvent.event.startDate)}
                            </p>
                            <div className="flex items-start gap-1.5 mt-1">
                              <p className="text-xs font-semibold text-stone-700 line-clamp-2">
                                {singleEvent.event.title}
                              </p>
                            </div>
                            <p className="text-[10px] text-stone-500 mt-1.5 truncate">
                              {singleEvent.event.location}
                            </p>
                            {attendees.length > 0 && (
                              <div className="flex items-center gap-1 mt-2">
                                <div className="flex -space-x-1.5">
                                  {attendees.slice(0, 3).map((member) => (
                                    <img
                                      key={member.id}
                                      src={member.avatar}
                                      alt={member.firstName}
                                      className="w-5 h-5 rounded-full border-2 border-white"
                                      title={`${member.firstName} ${member.lastName}`}
                                    />
                                  ))}
                                </div>
                                {attendees.length > 3 && (
                                  <span className="text-[10px] text-stone-400">
                                    +{attendees.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// Event Detail Modal
// =============================================================================

interface EventDetailModalProps {
  event: Event
  members: Member[]
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
}

function EventDetailModal({ event, members, onClose, onEdit, onDelete }: EventDetailModalProps) {
  const attendees = event.attendeeIds
    .map((id) => members.find((m) => m.id === id))
    .filter(Boolean) as Member[]

  const startDate = new Date(event.startDate)
  const endDate = new Date(event.endDate)

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // Check if multi-day event
  const isMultiDay = startDate.toDateString() !== endDate.toDateString()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 bg-stone-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
                  {getEventTypeLabel(event.type)}
                </span>
                <h2 className="text-lg font-semibold text-stone-800 mt-0.5">
                  {event.title}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-black/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-stone-800 capitalize">
                {formatDate(startDate)}
              </p>
              <p className="text-sm text-stone-500">
                {isMultiDay ? (
                  <>
                    {formatTime(startDate)} → {formatDate(endDate)} {formatTime(endDate)}
                  </>
                ) : (
                  <>
                    {formatTime(startDate)} - {formatTime(endDate)}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-stone-800">{event.location}</p>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <p className="text-stone-600 text-sm">{event.description}</p>
            </div>
          )}

          {/* Attendees */}
          {attendees.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-stone-500 mb-2">
                  {attendees.length} participant{attendees.length > 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  {attendees.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 px-2 py-1 bg-stone-100 rounded-full"
                    >
                      <img
                        src={member.avatar}
                        alt={`${member.firstName} ${member.lastName}`}
                        className="w-5 h-5 rounded-full bg-stone-200"
                      />
                      <span className="text-xs text-stone-600">
                        {member.firstName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2">
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Supprimer
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-1.5 text-sm bg-[#5B5781] hover:bg-[#4a4670] text-white rounded-lg font-medium transition-colors"
            >
              Modifier
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
