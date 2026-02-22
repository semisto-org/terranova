import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { useShellNav } from '../../components/shell/ShellContext'
import {
  Dashboard,
  ShapeUpWorkboard,
  ContactList,
  ContactDetail,
  ContactForm,
  EventForm,
  AlbumList,
} from '../../lab-management/components'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'

const SECTION_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'shapeup', label: 'Shape Up' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'albums', label: 'Albums' },
]

const EVENT_TYPES = [
  'project_meeting',
  'stakeholder_meeting',
  'design_day',
  'guild_meeting',
  'betting',
  'semisto_day',
  'semos_fest',
  'training',
]

const APPETITES = ['2-weeks', '3-weeks', '6-weeks']

function toLocalDatetimeInput(date) {
  const d = new Date(date)
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

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

export default function LabIndex({ milestone, currentMemberId: initialMemberId }) {
  const [tab, setTab] = useState('dashboard')
  useShellNav({ sections: SECTION_TABS, activeSection: tab, onSectionChange: setTab })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const [formModal, setFormModal] = useState(null)
  const [detailModal, setDetailModal] = useState(null)
  const [contactDetailModal, setContactDetailModal] = useState(null)
  const [contactFormModal, setContactFormModal] = useState(null)
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
  const pitches = data?.pitches || []
  const events = data?.events || []
  const scopes = data?.scopes || []
  const contacts = data?.contacts || []

  const currentMemberId = useMemo(() => {
    if (initialMemberId && members.some((m) => m.id === initialMemberId)) return initialMemberId
    return members[0]?.id || ''
  }, [initialMemberId, members])

  const currentMember = useMemo(
    () => members.find((member) => member.id === currentMemberId),
    [members, currentMemberId]
  )

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

  const callbacks = useMemo(() => ({
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
        const activeCycle = (data?.cycles || []).find(
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

    onViewMember: (memberId) => showDetailFromApi('Détail membre', `/api/v1/lab/members/${memberId}`),

    onCreateContact: () => setContactFormModal({ contact: null }),
    onViewContact: async (contactId) => {
      setBusy(true)
      setError(null)
      try {
        const payload = await apiRequest(`/api/v1/lab/contacts/${contactId}`)
        setContactDetailModal({ contact: payload.contact, linkedActivities: payload.linkedActivities })
      } catch (err) {
        setError(err.message)
      } finally {
        setBusy(false)
      }
    },
    onEditContact: (contactId) => {
      const contact = contacts.find((c) => c.id === contactId)
      setContactFormModal({ contact: contact || null })
    },
    onDeleteContact: (contactId) => {
      const contact = contacts.find((c) => c.id === contactId)
      setDeleteConfirm({
        title: 'Supprimer ce contact ?',
        message: `Le contact « ${contact?.name || ''} » sera supprimé définitivement.`,
        action: () => runAndRefresh(() => apiRequest(`/api/v1/lab/contacts/${contactId}`, { method: 'DELETE' })),
      })
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
              start_date: new Date(values.start_date).toISOString(),
              end_date: new Date(values.end_date).toISOString(),
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
          location: event.location,
          description: event.description,
        },
        onSubmit: (values) =>
          apiRequest(`/api/v1/lab/events/${eventId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              title: values.title,
              event_type_id: values.event_type_id,
              start_date: new Date(values.start_date).toISOString(),
              end_date: new Date(values.end_date).toISOString(),
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
  }), [currentMemberId, contacts, data, events, members, openForm, pitches, runAndRefresh, scopes, setDeleteConfirm, showDetailFromApi])

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
      )}

      {tab === 'shapeup' && (
        <ShapeUpWorkboard
          members={data.members}
          cycles={data.cycles}
          pitches={data.pitches}
          bets={data.bets}
          scopes={data.scopes}
          chowderItems={data.chowderItems}
          ideaLists={data.ideaLists}
          hillChartSnapshots={data.hillChartSnapshots}
          currentMemberId={currentMemberId}
          onCreatePitch={callbacks.onCreatePitch}
          onViewPitch={callbacks.onViewPitch}
          onEditPitch={callbacks.onEditPitch}
          onDeletePitch={callbacks.onDeletePitch}
          onPlaceBet={callbacks.onPlaceBet}
          onRemoveBet={callbacks.onRemoveBet}
          onCreateScope={callbacks.onCreateScope}
          onUpdateHillPosition={callbacks.onUpdateHillPosition}
          onAddTask={callbacks.onAddTask}
          onToggleTask={callbacks.onToggleTask}
          onAddChowderItem={callbacks.onAddChowderItem}
          onMoveChowderToScope={callbacks.onMoveChowderToScope}
          onDeleteChowderItem={callbacks.onDeleteChowderItem}
          onViewScope={callbacks.onViewScope}
          onAddIdea={callbacks.onAddIdea}
          onVoteIdea={callbacks.onVoteIdea}
        />
      )}

      {tab === 'contacts' && (
        <ContactList
          contacts={contacts}
          onCreateContact={callbacks.onCreateContact}
          onViewContact={callbacks.onViewContact}
          onEditContact={callbacks.onEditContact}
          onDeleteContact={callbacks.onDeleteContact}
        />
      )}

      {tab === 'albums' && (
        <AlbumList
          albums={data?.albums ?? []}
          onRefresh={() => loadOverview(false)}
        />
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

      {contactDetailModal && (
        <ContactDetail
          contact={contactDetailModal.contact}
          linkedActivities={contactDetailModal.linkedActivities}
          onClose={() => setContactDetailModal(null)}
          onEdit={() => {
            setContactDetailModal(null)
            callbacks.onEditContact(contactDetailModal.contact.id)
          }}
        />
      )}

      {contactFormModal && (
        <ContactForm
          contact={contactFormModal.contact}
          organizations={contacts.filter((c) => c.contactType === 'organization')}
          onSubmit={async (values) => {
            const payload = {
              contact_type: values.contactType,
              name: values.name,
              email: values.email,
              phone: values.phone,
              address: values.address,
              organization_type: values.organizationType,
              organization_id: values.organizationId || null,
              notes: values.notes,
              notes_html: values.notesHtml,
              tag_names: values.tagNames,
            }
            setBusy(true)
            setError(null)
            try {
              if (contactFormModal.contact) {
                await apiRequest(`/api/v1/lab/contacts/${contactFormModal.contact.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify(payload),
                })
              } else {
                await apiRequest('/api/v1/lab/contacts', {
                  method: 'POST',
                  body: JSON.stringify(payload),
                })
              }
              setContactFormModal(null)
              await loadOverview()
            } catch (err) {
              setError(err.message)
            } finally {
              setBusy(false)
            }
          }}
          onCancel={() => setContactFormModal(null)}
          busy={busy}
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

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.42)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  zIndex: 80,
}

const modalStyle = {
  background: '#fff',
  width: 'min(680px, 100%)',
  maxHeight: '90vh',
  overflow: 'auto',
  borderRadius: '0.75rem',
  padding: '1rem',
  boxShadow: '0 20px 48px rgba(0,0,0,0.25)',
}

const inputStyle = {
  border: '1px solid #d6d3d1',
  borderRadius: '0.5rem',
  padding: '0.55rem 0.65rem',
  fontSize: '0.95rem',
}

const primaryButtonStyle = {
  border: '1px solid #5B5781',
  background: '#5B5781',
  color: '#fff',
  borderRadius: '0.5rem',
  padding: '0.5rem 0.75rem',
  fontWeight: 600,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  border: '1px solid #d6d3d1',
  background: '#fff',
  color: '#292524',
  borderRadius: '0.5rem',
  padding: '0.5rem 0.75rem',
  fontWeight: 500,
  cursor: 'pointer',
}

const detailStyle = {
  background: '#fafaf9',
  border: '1px solid #e7e5e4',
  borderRadius: '0.5rem',
  padding: '0.75rem',
  maxHeight: '58vh',
  overflow: 'auto',
}
