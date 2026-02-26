import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { useShellNav } from '../../components/shell/ShellContext'
import { useUrlState } from '@/hooks/useUrlState'
import {
  Dashboard,
  EventForm,
  ProjectBoard,
} from '../../lab-management/components'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'

const SECTION_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'projects', label: 'Projets' },
]

function DetailModal({ title, data, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.42)' }} onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-xl border border-stone-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-stone-200">
          <h2 className="text-xl font-bold text-stone-900 m-0">{title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4">
          <pre className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs overflow-auto max-h-full">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
        <div className="shrink-0 px-4 py-3 border-t border-stone-200 flex justify-end">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm border border-stone-300 rounded-lg bg-white text-stone-700 font-medium">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LabIndex({ milestone, currentMemberId: initialMemberId }) {
  const [tab, setTab] = useUrlState('tab', 'dashboard')
  useShellNav({ sections: SECTION_TABS, activeSection: tab, onSectionChange: setTab })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const [detailModal, setDetailModal] = useState(null)
  const [eventForm, setEventForm] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const loadOverview = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const payload = await apiRequest('/api/v1/lab/overview')
      setData(payload)
    } catch (err) {
      setError(err.message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  const members = data?.members || []
  const events = data?.events || []

  const currentMemberId = useMemo(() => {
    if (initialMemberId && members.some((m) => m.id === initialMemberId)) return initialMemberId
    return members[0]?.id || ''
  }, [initialMemberId, members])

  const runAndRefresh = useCallback(async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      await loadOverview()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [loadOverview])

  const showDetailFromApi = useCallback(async (title, path) => {
    setBusy(true)
    setError(null)
    try {
      const payload = await apiRequest(path)
      setDetailModal({ title, data: payload })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [])

  const callbacks = useMemo(() => ({
    onViewMember: (memberId) => showDetailFromApi('Détail membre', `/api/v1/lab/members/${memberId}`),

    onViewPitch: (pitchId) => showDetailFromApi('Détail pitch', `/api/v1/lab/pitches/${pitchId}`),

    onViewScope: (scopeId) => {
      const scopes = data?.scopes || []
      const scope = scopes.find((item) => item.id === scopeId)
      if (!scope) return
      setDetailModal({ title: 'Détail scope', data: scope })
    },

    onCreateEvent: () => {
      setEventForm({
        event: null,
        onSubmit: (values) =>
          apiRequest('/api/v1/lab/events', {
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
          }),
      })
    },

    onEditEvent: (eventId) => {
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
        onSubmit: (values) =>
          apiRequest(`/api/v1/lab/events/${eventId}`, {
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
          }),
      })
    },

    onDeleteEvent: (eventId) => {
      const event = events.find((item) => item.id === eventId)
      setDeleteConfirm({
        title: 'Supprimer cet événement ?',
        message: `L'événement « ${event?.title || ''} » sera supprimé définitivement.`,
        action: () => runAndRefresh(() => apiRequest(`/api/v1/lab/events/${eventId}`, { method: 'DELETE' })),
      })
    },

    onViewEvent: (eventId) => showDetailFromApi('Détail événement', `/api/v1/lab/events/${eventId}`),

    onViewCycle: (cycleId) => {
      const cycle = (data?.cycles || []).find((item) => item.id === cycleId)
      if (!cycle) return
      setDetailModal({ title: 'Détail cycle', data: cycle })
    },

    onViewGuild: (guildId) => {
      const guild = (data?.guilds || []).find((item) => item.id === guildId)
      if (!guild) return
      setDetailModal({ title: 'Détail guilde', data: guild })
    },
  }), [currentMemberId, data, events, runAndRefresh, setDeleteConfirm, showDetailFromApi])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-stone-500">Chargement...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <p className="text-red-700">Erreur: {error || 'Données indisponibles'}</p>
        <button type="button" onClick={loadOverview} className="mt-2 text-sm underline text-stone-600">Réessayer</button>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      {error && (
        <div style={{ padding: '0.75rem 1.25rem', background: '#fee2e2', color: '#7f1d1d', borderBottom: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {tab === 'dashboard' && (
        <>
          <Dashboard
            members={data.members}
            cycles={data.cycles}
            guilds={data.guilds}
            pitches={data.pitches}
            bets={data.bets}
            scopes={data.scopes}
            events={data.events}
            wallets={data.wallets}
            semosTransactions={data.semosTransactions}
            semosEmissions={data.semosEmissions}
            currentMemberId={currentMemberId}
            onViewPitch={callbacks.onViewPitch}
            onViewScope={callbacks.onViewScope}
            onViewEvent={callbacks.onViewEvent}
            onViewCycle={callbacks.onViewCycle}
            onCreateEvent={callbacks.onCreateEvent}
            onViewMember={callbacks.onViewMember}
          />
        </>
      )}

      {tab === 'projects' && (
        <ProjectBoard />
      )}

      {eventForm && (
        <EventForm
          event={eventForm.event}
          onSubmit={async (values) => {
            await runAndRefresh(async () => {
              await eventForm.onSubmit(values)
            })
            setEventForm(null)
          }}
          onCancel={() => setEventForm(null)}
          busy={busy}
        />
      )}

      {detailModal && (
        <DetailModal
          title={detailModal.title}
          data={detailModal.data}
          onClose={() => setDetailModal(null)}
        />
      )}



      {deleteConfirm && (
        <ConfirmDeleteModal
          title={deleteConfirm.title}
          message={deleteConfirm.message}
          onConfirm={() => {
            deleteConfirm.action()
            setDeleteConfirm(null)
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}



    </div>
  )
}

