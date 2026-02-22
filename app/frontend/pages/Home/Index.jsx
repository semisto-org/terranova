import React, { useEffect, useState, useCallback } from 'react'
import { usePage } from '@inertiajs/react'
import { apiRequest } from '@/lib/api'
import { CalendarView } from '../../lab-management/components'

export default function HomeIndex() {
  const { auth } = usePage().props
  const currentMemberId = auth?.member?.id ?? ''

  const [events, setEvents] = useState([])
  const [cycles, setCycles] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [eventsRes, overviewRes] = await Promise.all([
        apiRequest('/api/v1/lab/events'),
        apiRequest('/api/v1/lab/overview'),
      ])
      setEvents(eventsRes.items ?? eventsRes ?? [])
      setCycles(overviewRes.cycles ?? [])
      setMembers(overviewRes.members ?? [])
    } catch (err) {
      console.error('Failed to load calendar data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-[#5B5781] rounded-full" />
      </div>
    )
  }

  return (
    <CalendarView
      events={events}
      cycles={cycles}
      members={members}
      currentMemberId={currentMemberId}
      onCreateEvent={() => {}}
      onViewEvent={() => {}}
      onEditEvent={() => {}}
      onDeleteEvent={() => {}}
    />
  )
}
