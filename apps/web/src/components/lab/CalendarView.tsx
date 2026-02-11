'use client'

import { useState } from 'react'
import type { Event, Cycle, Member } from '@terranova/types'
import { EventCard } from './EventCard'

interface CalendarViewProps {
  events: Event[]
  cycles: Cycle[]
  members: Member[]
  onCreateEvent?: () => void
  onViewEvent?: (eventId: string) => void
  onEditEvent?: (eventId: string) => void
}

export function CalendarView({
  events,
  cycles,
  members,
  onCreateEvent,
  onViewEvent,
  onEditEvent,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'list'>('month')

  // Get events for current month
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const monthEvents = events.filter((event) => {
    const eventDate = new Date(event.startDate)
    return (
      eventDate.getMonth() === currentMonth &&
      eventDate.getFullYear() === currentYear
    )
  })

  // Sort events by date
  const sortedEvents = [...monthEvents].sort(
    (a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  // Get current cycle
  const currentCycle = cycles.find(
    (c) => c.status === 'active' || c.status === 'cooldown'
  )

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    )
  }

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    )
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="flex gap-2">
          {onCreateEvent && (
            <button
              onClick={onCreateEvent}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              New Event
            </button>
          )}
        </div>
      </div>

      {/* Current Cycle Banner */}
      {currentCycle && (
        <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                {currentCycle.name}
              </h3>
              <p className="text-sm text-gray-600">
                {new Date(currentCycle.startDate).toLocaleDateString()} -{' '}
                {new Date(currentCycle.cooldownEnd).toLocaleDateString()}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {currentCycle.status}
            </span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex gap-2">
          <button
            onClick={goToPreviousMonth}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={goToToday}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Next
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setView('month')}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              view === 'month'
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView('list')}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              view === 'list'
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      {view === 'list' ? (
        <div className="space-y-4">
          {sortedEvents.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="text-sm text-gray-500">
                No events scheduled for this month
              </p>
            </div>
          ) : (
            sortedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                members={members}
                onViewEvent={onViewEvent}
              />
            ))
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="bg-gray-50 px-2 py-3 text-center text-xs font-medium text-gray-700"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {Array.from({ length: 35 }, (_, i) => {
              const firstDay = new Date(currentYear, currentMonth, 1).getDay()
              const daysInMonth = new Date(
                currentYear,
                currentMonth + 1,
                0
              ).getDate()
              const dayNumber = i - firstDay + 1

              const isCurrentMonth =
                dayNumber > 0 && dayNumber <= daysInMonth
              const dayEvents = isCurrentMonth
                ? sortedEvents.filter((event) => {
                    const eventDate = new Date(event.startDate)
                    return eventDate.getDate() === dayNumber
                  })
                : []

              return (
                <div
                  key={i}
                  className={`min-h-24 bg-white p-2 ${
                    !isCurrentMonth ? 'bg-gray-50' : ''
                  }`}
                >
                  {isCurrentMonth && (
                    <>
                      <div className="text-right text-sm text-gray-900">
                        {dayNumber}
                      </div>
                      <div className="mt-1 space-y-1">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="cursor-pointer truncate rounded bg-blue-100 px-1 py-0.5 text-xs text-blue-800 hover:bg-blue-200"
                            onClick={
                              onViewEvent
                                ? () => onViewEvent(event.id)
                                : undefined
                            }
                          >
                            {event.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Events Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Event Summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="text-2xl font-bold text-blue-900">
              {sortedEvents.length}
            </div>
            <div className="text-sm text-blue-700">Total Events</div>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <div className="text-2xl font-bold text-green-900">
              {sortedEvents.filter((e) => e.type === 'design_day').length}
            </div>
            <div className="text-sm text-green-700">Design Days</div>
          </div>
          <div className="rounded-lg bg-purple-50 p-4">
            <div className="text-2xl font-bold text-purple-900">
              {sortedEvents.filter((e) => e.type === 'guild_meeting').length}
            </div>
            <div className="text-sm text-purple-700">Guild Meetings</div>
          </div>
          <div className="rounded-lg bg-orange-50 p-4">
            <div className="text-2xl font-bold text-orange-900">
              {sortedEvents.filter((e) => e.type === 'training').length}
            </div>
            <div className="text-sm text-orange-700">Training Sessions</div>
          </div>
        </div>
      </div>
    </div>
  )
}
