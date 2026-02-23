import React, { useEffect, useState, useCallback } from 'react'
import { usePage } from '@inertiajs/react'
import { apiRequest } from '@/lib/api'
import { CalendarView, EventForm } from '../../lab-management/components'

export default function HomeIndex() {
  const { auth } = usePage().props
  const currentMemberId = auth?.member?.id ?? ''
  const firstName = auth?.member?.firstName

  const [events, setEvents] = useState([])
  const [cycles, setCycles] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [eventForm, setEventForm] = useState(null)
  const [busy, setBusy] = useState(false)

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

  const handleCreateEvent = useCallback(() => {
    setEventForm({
      event: null,
      onSubmit: async (values) => {
        await apiRequest('/api/v1/lab/events', {
          method: 'POST',
          body: JSON.stringify({
            title: values.title,
            event_type_id: values.event_type_id,
            start_date: values.start_date,
            end_date: values.end_date,
            all_day: values.all_day,
            location: values.location || '',
            description: values.description || '',
            attendee_ids: [currentMemberId],
          }),
        })
      },
    })
  }, [currentMemberId])

  const handleEditEvent = useCallback((eventId) => {
    const event = events.find((item) => item.id === eventId)
    if (!event) return
    setEventForm({
      event: {
        id: event.id,
        title: event.title,
        type: event.type,
        eventTypeId: event.eventTypeId,
        startDate: event.startDate,
        endDate: event.endDate,
        allDay: event.allDay,
        location: event.location,
        description: event.description,
      },
      onSubmit: async (values) => {
        await apiRequest(`/api/v1/lab/events/${eventId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: values.title,
            event_type_id: values.event_type_id,
            start_date: values.start_date,
            end_date: values.end_date,
            all_day: values.all_day,
            location: values.location || '',
            description: values.description || '',
          }),
        })
      },
    })
  }, [events])

  const handleDeleteEvent = useCallback(async (eventId) => {
    setBusy(true)
    try {
      await apiRequest(`/api/v1/lab/events/${eventId}`, { method: 'DELETE' })
      await loadData()
    } catch (err) {
      console.error('Failed to delete event:', err)
      alert('Erreur lors de la suppression de l\'événement')
    } finally {
      setBusy(false)
    }
  }, [loadData])

  const handleEventFormSubmit = useCallback(async (values) => {
    setBusy(true)
    try {
      await eventForm.onSubmit(values)
      setEventForm(null)
      await loadData()
    } catch (err) {
      console.error('Failed to save event:', err)
      alert('Erreur lors de la sauvegarde de l\'événement')
    } finally {
      setBusy(false)
    }
  }, [eventForm, loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-[#5B5781] rounded-full" />
      </div>
    )
  }

  return (
    <>
      <CalendarView
        events={events}
        cycles={cycles}
        members={members}
        currentMemberId={currentMemberId}
        firstName={firstName}
        onCreateEvent={handleCreateEvent}
        onViewEvent={() => {}}
        onEditEvent={handleEditEvent}
        onDeleteEvent={handleDeleteEvent}
      />

      {eventForm && (
        <EventForm
          event={eventForm.event}
          onSubmit={handleEventFormSubmit}
          onCancel={() => setEventForm(null)}
          busy={busy}
        />
      )}
    </>
  )
}
