import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { apiRequest } from '@/lib/api'
import { useShellNav } from '../../components/shell/ShellContext'
import { useUrlState } from '@/hooks/useUrlState'
import {
  CalendarView,
  EventForm,
  ShapeUpWorkboard,
  SemosDashboard,
  MyTasksDashboard,
  ProjectBoard,
  ImpactDashboard,
} from '../../lab-management/components'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'
import OpenActivities from '@/components/home/OpenActivities'

const SECTION_TABS = [
  { id: 'calendar', label: 'Tableau de bord' },
  { id: 'projects', label: 'Projets' },
  { id: 'shapeup', label: 'Shape Up' },
  { id: 'semos', label: 'Semos' },
  { id: 'impact', label: 'Impact' },
]

const APPETITES = ['2-weeks', '3-weeks', '6-weeks']

function FormModal({ title, fields, values, onChange, onSubmit, onClose, busy }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.42)' }} onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-xl border border-stone-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
          className="flex flex-col min-h-0 h-full"
        >
          <div className="shrink-0 px-4 pt-4 pb-3 border-b border-stone-200">
            <h2 className="text-xl font-bold text-stone-900 m-0">{title}</h2>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-3">
            {fields.map((field) => (
              <label key={field.name} className="block space-y-1">
                <span className="text-sm font-semibold text-stone-700">{field.label}</span>

                {field.type === 'textarea' && (
                  <textarea
                    rows={field.rows || 3}
                    value={values[field.name] ?? ''}
                    onChange={(event) => onChange(field.name, event.target.value)}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-stone-900"
                    required={field.required}
                  />
                )}

                {field.type === 'select' && (
                  <select
                    value={values[field.name] ?? ''}
                    onChange={(event) => onChange(field.name, event.target.value)}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-stone-900"
                    required={field.required}
                  >
                    {(field.options || []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'checkbox' && (
                  <input
                    type="checkbox"
                    checked={Boolean(values[field.name])}
                    onChange={(event) => onChange(field.name, event.target.checked)}
                    className="w-5 h-5"
                  />
                )}

                {(!field.type || ['text', 'email', 'number', 'date', 'datetime-local'].includes(field.type)) && (
                  <input
                    type={field.type || 'text'}
                    value={values[field.name] ?? ''}
                    onChange={(event) => onChange(field.name, event.target.value)}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-stone-900"
                    required={field.required}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="shrink-0 px-4 py-3 border-t border-stone-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm border border-stone-300 rounded-lg bg-white text-stone-700 font-medium">
              Annuler
            </button>
            <button type="submit" className="px-3 py-1.5 text-sm border border-[#5B5781] bg-[#5B5781] text-white rounded-lg font-semibold disabled:opacity-60" disabled={busy}>
              {busy ? 'En cours...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

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

export default function HomeIndex() {
  const { auth } = usePage().props
  const currentMemberId = auth?.member?.id ?? ''
  const firstName = auth?.member?.firstName

  const [tab, setTab] = useUrlState('tab', 'calendar')
  useShellNav({ sections: SECTION_TABS, activeSection: tab, onSectionChange: setTab })

  const [events, setEvents] = useState([])
  const [overviewData, setOverviewData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [eventForm, setEventForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [formModal, setFormModal] = useState(null)
  const [detailModal, setDetailModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const loadData = useCallback(async () => {
    try {
      const [eventsRes, overviewRes, academyCalendarRes] = await Promise.all([
        apiRequest('/api/v1/lab/events'),
        apiRequest('/api/v1/lab/overview'),
        apiRequest('/api/v1/academy/calendar').catch(() => []),
      ])
      const labEvents = eventsRes.items ?? eventsRes ?? []

      // Transform training sessions into calendar events
      const trainingEvents = (academyCalendarRes || []).flatMap((training) =>
        (training.sessions || []).map((session) => ({
          id: `training-session-${session.sessionId}`,
          title: training.title,
          type: 'Formation',
          eventTypeId: '',
          startDate: session.startDate,
          endDate: session.endDate,
          allDay: true,
          location: '',
          description: '',
          attendeeIds: [],
          cycleId: null,
          _isTrainingSession: true,
        }))
      )

      setEvents([...labEvents, ...trainingEvents])
      setOverviewData(overviewRes)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const members = overviewData?.members ?? []
  const cycles = overviewData?.cycles ?? []
  const cyclePeriods = overviewData?.cyclePeriods ?? []
  const pitches = overviewData?.pitches ?? []
  const scopes = overviewData?.scopes ?? []

  const runAndRefresh = useCallback(async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [loadData])

  const openForm = useCallback((config) => {
    setFormModal({ ...config, values: { ...(config.initialValues || {}) } })
  }, [])

  const updateFormValue = useCallback((name, value) => {
    setFormModal((previous) => ({ ...previous, values: { ...previous.values, [name]: value } }))
  }, [])

  const submitForm = useCallback(async () => {
    if (!formModal) return
    await runAndRefresh(() => formModal.onSubmit(formModal.values))
    setFormModal(null)
  }, [formModal, runAndRefresh])

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

  // Calendar callbacks
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

  // Shape Up callbacks
  const shapeUpCallbacks = useMemo(() => ({
    onCreatePitch: () =>
      openForm({
        title: 'Créer un pitch',
        fields: [
          { name: 'title', label: 'Titre', required: true },
          { name: 'problem', label: 'Problem', type: 'textarea', required: true },
          { name: 'solution', label: 'Solution', type: 'textarea', required: true },
          { name: 'appetite', label: 'Appetite', type: 'select', options: APPETITES },
        ],
        initialValues: { appetite: '6-weeks' },
        onSubmit: (values) =>
          apiRequest('/api/v1/lab/pitches', {
            method: 'POST',
            body: JSON.stringify({
              title: values.title,
              problem: values.problem,
              solution: values.solution,
              appetite: values.appetite,
              author_id: currentMemberId,
              status: 'raw',
              rabbit_holes: [],
              no_gos: [],
            }),
          }),
      }),

    onEditPitch: (pitchId) => {
      const pitch = pitches.find((item) => item.id === pitchId)
      if (!pitch) return
      openForm({
        title: 'Modifier le pitch',
        fields: [{ name: 'title', label: 'Titre', required: true }],
        initialValues: { title: pitch.title },
        onSubmit: (values) =>
          apiRequest(`/api/v1/lab/pitches/${pitchId}`, {
            method: 'PATCH',
            body: JSON.stringify({ title: values.title }),
          }),
      })
    },

    onDeletePitch: (pitchId) => {
      const pitch = pitches.find((item) => item.id === pitchId)
      setDeleteConfirm({
        title: 'Supprimer ce pitch ?',
        message: `Le pitch « ${pitch?.title || ''} » sera supprimé définitivement.`,
        action: () => runAndRefresh(() => apiRequest(`/api/v1/lab/pitches/${pitchId}`, { method: 'DELETE' })),
      })
    },

    onViewPitch: (pitchId) => showDetailFromApi('Détail pitch', `/api/v1/lab/pitches/${pitchId}`),

    onPlaceBet: (pitchId, teamMemberIds) =>
      runAndRefresh(async () => {
        const activeCycle = cycles.find(
          (cycle) => cycle.status === 'active' || cycle.status === 'cooldown'
        )
        if (!activeCycle) throw new Error('Aucun cycle actif/cooldown')

        await apiRequest('/api/v1/lab/bets', {
          method: 'POST',
          body: JSON.stringify({
            pitch_id: pitchId,
            cycle_id: activeCycle.id,
            team_member_ids: teamMemberIds,
            placed_by_id: currentMemberId,
            status: 'pending',
          }),
        })
      }),

    onRemoveBet: (betId) => {
      setDeleteConfirm({
        title: 'Retirer ce bet ?',
        message: 'Ce bet sera retiré définitivement.',
        action: () => runAndRefresh(() => apiRequest(`/api/v1/lab/bets/${betId}`, { method: 'DELETE' })),
      })
    },

    onCreateScope: (pitchId) =>
      openForm({
        title: 'Créer un scope',
        fields: [
          { name: 'name', label: 'Nom', required: true },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'hill_position', label: 'Position Hill (0-100)', type: 'number' },
        ],
        initialValues: { hill_position: 0 },
        onSubmit: (values) =>
          apiRequest(`/api/v1/lab/pitches/${pitchId}/scopes`, {
            method: 'POST',
            body: JSON.stringify({
              name: values.name,
              description: values.description || '',
              hill_position: Number(values.hill_position || 0),
            }),
          }),
      }),

    onUpdateHillPosition: (scopeId, position) =>
      runAndRefresh(() =>
        apiRequest(`/api/v1/lab/scopes/${scopeId}/hill-position`, {
          method: 'PATCH',
          body: JSON.stringify({ position }),
        })
      ),

    onAddTask: (scopeId) =>
      openForm({
        title: 'Ajouter une tâche',
        fields: [
          { name: 'title', label: 'Titre', required: true },
          { name: 'is_nice_to_have', label: 'Nice to have', type: 'checkbox' },
        ],
        initialValues: { is_nice_to_have: false },
        onSubmit: (values) =>
          apiRequest(`/api/v1/lab/scopes/${scopeId}/tasks`, {
            method: 'POST',
            body: JSON.stringify({
              title: values.title,
              is_nice_to_have: Boolean(values.is_nice_to_have),
              completed: false,
            }),
          }),
      }),

    onToggleTask: (_scopeId, taskId) =>
      runAndRefresh(() => apiRequest(`/api/v1/lab/tasks/${taskId}/toggle`, { method: 'PATCH' })),

    onAddChowderItem: (pitchId) =>
      openForm({
        title: 'Ajouter un chowder item',
        fields: [{ name: 'title', label: 'Titre', required: true }],
        onSubmit: (values) =>
          apiRequest(`/api/v1/lab/pitches/${pitchId}/chowder-items`, {
            method: 'POST',
            body: JSON.stringify({ title: values.title, created_by_id: currentMemberId }),
          }),
      }),

    onMoveChowderToScope: (chowderItemId, scopeId) =>
      runAndRefresh(() =>
        apiRequest('/api/v1/lab/chowder-items/move-to-scope', {
          method: 'POST',
          body: JSON.stringify({ chowder_item_id: chowderItemId, scope_id: scopeId }),
        })
      ),

    onDeleteChowderItem: (itemId) => {
      setDeleteConfirm({
        title: 'Supprimer cet item chowder ?',
        message: 'Cet item chowder sera supprimé définitivement.',
        action: () => runAndRefresh(() => apiRequest(`/api/v1/lab/chowder-items/${itemId}`, { method: 'DELETE' })),
      })
    },

    onViewScope: (scopeId) => {
      const scope = scopes.find((item) => item.id === scopeId)
      if (!scope) return
      setDetailModal({ title: 'Détail scope', data: scope })
    },

    onAddIdea: (listId, title) =>
      runAndRefresh(() =>
        apiRequest('/api/v1/lab/idea-items', {
          method: 'POST',
          body: JSON.stringify({ idea_list_id: listId, title }),
        })
      ),

    onVoteIdea: (_listId, ideaId) =>
      runAndRefresh(() =>
        apiRequest('/api/v1/lab/idea-items/vote', {
          method: 'POST',
          body: JSON.stringify({ idea_id: ideaId }),
        })
      ),
  }), [currentMemberId, cycles, openForm, pitches, runAndRefresh, scopes, showDetailFromApi])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-[#5B5781] rounded-full" />
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

      {tab === 'calendar' && (
        <>
          <CalendarView
            events={events}
            cycles={cycles}
            cyclePeriods={cyclePeriods}
            members={members}
            currentMemberId={currentMemberId}
            firstName={firstName}
            onCreateEvent={handleCreateEvent}
            onViewEvent={() => {}}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
          />

          <div className="mt-6">
            <MyTasksDashboard />
          </div>

          <div className="mt-6">
            <OpenActivities />
          </div>

          {eventForm && (
            <EventForm
              event={eventForm.event}
              onSubmit={handleEventFormSubmit}
              onCancel={() => setEventForm(null)}
              busy={busy}
            />
          )}
        </>
      )}

      {tab === 'projects' && (
        <ProjectBoard />
      )}

      {tab === 'shapeup' && overviewData && (
        <ShapeUpWorkboard
          members={members}
          cycles={cycles}
          pitches={overviewData.pitches}
          bets={overviewData.bets}
          scopes={overviewData.scopes}
          chowderItems={overviewData.chowderItems}
          ideaLists={overviewData.ideaLists}
          hillChartSnapshots={overviewData.hillChartSnapshots}
          currentMemberId={currentMemberId}
          onCreatePitch={shapeUpCallbacks.onCreatePitch}
          onViewPitch={shapeUpCallbacks.onViewPitch}
          onEditPitch={shapeUpCallbacks.onEditPitch}
          onDeletePitch={shapeUpCallbacks.onDeletePitch}
          onPlaceBet={shapeUpCallbacks.onPlaceBet}
          onRemoveBet={shapeUpCallbacks.onRemoveBet}
          onCreateScope={shapeUpCallbacks.onCreateScope}
          onUpdateHillPosition={shapeUpCallbacks.onUpdateHillPosition}
          onAddTask={shapeUpCallbacks.onAddTask}
          onToggleTask={shapeUpCallbacks.onToggleTask}
          onAddChowderItem={shapeUpCallbacks.onAddChowderItem}
          onMoveChowderToScope={shapeUpCallbacks.onMoveChowderToScope}
          onDeleteChowderItem={shapeUpCallbacks.onDeleteChowderItem}
          onViewScope={shapeUpCallbacks.onViewScope}
          onAddIdea={shapeUpCallbacks.onAddIdea}
          onVoteIdea={shapeUpCallbacks.onVoteIdea}
        />
      )}

      {tab === 'semos' && (
        <SemosDashboard
          members={overviewData?.members ?? []}
          wallets={overviewData?.wallets ?? []}
          transactions={overviewData?.semosTransactions ?? []}
          emissions={overviewData?.semosEmissions ?? []}
          rates={overviewData?.semosRates ?? []}
          currentMemberId={currentMemberId}
        />
      )}

      {tab === 'impact' && (
        <ImpactDashboard />
      )}

      {formModal && (
        <FormModal
          title={formModal.title}
          fields={formModal.fields}
          values={formModal.values}
          onChange={updateFormValue}
          onSubmit={submitForm}
          onClose={() => setFormModal(null)}
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
