import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { useShellNav } from '../../components/shell/ShellContext'

const STATUSES = ['draft', 'planned', 'registrations_open', 'in_progress', 'completed', 'cancelled']
const STATUS_LABELS = {
  draft: 'Brouillon',
  planned: 'Planifiée',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

function TrainingDetail({ training, data, busy, onBack, onRefresh, actions }) {
  const [tab, setTab] = useState('info')
  const sessions = data.trainingSessions.filter((item) => item.trainingId === training.id)
  const registrations = data.trainingRegistrations.filter((item) => item.trainingId === training.id)
  const documents = data.trainingDocuments.filter((item) => item.trainingId === training.id)
  const expenses = data.trainingExpenses.filter((item) => item.trainingId === training.id)
  const attendances = data.trainingAttendances
  const revenue = registrations.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0)
  const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <button className="rounded border border-stone-300 px-3 py-2 text-sm" onClick={onBack}>Retour Kanban</button>
          <button className="rounded border border-stone-300 px-3 py-2 text-sm" onClick={onRefresh}>Rafraîchir</button>
          {busy && <span className="text-xs text-stone-500">Synchronisation...</span>}
        </div>
        <header className="rounded-2xl border border-stone-200 bg-white p-5">
          <h1 className="text-2xl font-semibold text-stone-900">{training.title}</h1>
          <p className="text-stone-600 text-sm">{STATUS_LABELS[training.status]} · {training.price}€ · max {training.maxParticipants}</p>
        </header>
        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {['info', 'sessions', 'registrations', 'attendances', 'documents', 'checklist', 'finances'].map((item) => (
              <button key={item} className={`rounded px-3 py-2 text-sm ${tab === item ? 'bg-[#B01A19] text-white' : 'bg-stone-100 text-stone-700'}`} onClick={() => setTab(item)}>
                {item}
              </button>
            ))}
          </div>
          {tab === 'info' && (
            <div className="space-y-2 text-sm text-stone-700">
              <p>{training.description || 'Aucune description.'}</p>
              <p>Note coordination: {training.coordinatorNote || '-'}</p>
              <div className="flex gap-2">
                {STATUSES.map((status) => (
                  <button key={status} className="rounded border border-stone-300 px-2 py-1 text-xs" onClick={() => actions.updateTrainingStatus(training.id, status)}>
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>
          )}
          {tab === 'sessions' && (
            <div className="space-y-2">
              <button className="rounded bg-[#AFBD00] px-3 py-2 text-sm" onClick={() => actions.addSession(training.id)}>Ajouter session</button>
              {sessions.length === 0 ? <p className="text-sm text-stone-500">Aucune session.</p> : sessions.map((item) => (
                <div key={item.id} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between">
                  <span>{item.startDate} → {item.endDate}</span>
                  <div className="flex items-center gap-2">
                    <button className="text-stone-700" onClick={() => actions.editSession(item.id)}>Modifier</button>
                    <button className="text-red-600" onClick={() => actions.deleteSession(item.id)}>Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'registrations' && (
            <div className="space-y-2">
              <button className="rounded bg-[#AFBD00] px-3 py-2 text-sm" onClick={() => actions.addRegistration(training.id)}>Ajouter participant</button>
              {registrations.length === 0 ? <p className="text-sm text-stone-500">Aucune inscription.</p> : registrations.map((item) => (
                <div key={item.id} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between">
                  <span>{item.contactName} · {item.paymentStatus} · {item.amountPaid}€</span>
                  <div className="flex gap-2">
                    <button className="text-stone-700" onClick={() => actions.editRegistration(item.id)}>Modifier</button>
                    <button className="text-indigo-700" onClick={() => actions.updatePaymentStatus(item.id)}>Paiement</button>
                    <button className="text-red-600" onClick={() => actions.deleteRegistration(item.id)}>Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'attendances' && (
            <div className="space-y-2">
              {registrations.length === 0 || sessions.length === 0 ? (
                <p className="text-sm text-stone-500">Pas de grille présence (sessions ou inscriptions manquantes).</p>
              ) : registrations.map((registration) => (
                <div key={registration.id} className="rounded border border-stone-200 p-2 text-sm">
                  <p className="font-medium">{registration.contactName}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {sessions.map((session) => {
                      const row = attendances.find((item) => item.registrationId === registration.id && item.sessionId === session.id)
                      return (
                        <button key={session.id} className={`rounded border px-2 py-1 text-xs ${row?.isPresent ? 'border-emerald-500 text-emerald-700' : 'border-stone-300 text-stone-700'}`} onClick={() => actions.markAttendance(registration.id, session.id, !row?.isPresent)}>
                          {session.startDate}: {row?.isPresent ? 'présent' : 'absent'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'documents' && (
            <div className="space-y-2">
              <button className="rounded bg-[#AFBD00] px-3 py-2 text-sm" onClick={() => actions.addDocument(training.id)}>Ajouter document</button>
              {documents.length === 0 ? <p className="text-sm text-stone-500">Aucun document.</p> : documents.map((item) => (
                <div key={item.id} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between">
                  <span>{item.name} · {item.type}</span>
                  <button className="text-red-600" onClick={() => actions.deleteDocument(item.id)}>Supprimer</button>
                </div>
              ))}
            </div>
          )}
          {tab === 'checklist' && (
            <div className="space-y-2">
              <button className="rounded bg-[#AFBD00] px-3 py-2 text-sm" onClick={() => actions.addChecklistItem(training.id)}>Ajouter item</button>
              {(training.checklistItems || []).length === 0 ? <p className="text-sm text-stone-500">Checklist vide.</p> : training.checklistItems.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between">
                  <button className={(training.checkedItems || []).includes(index) ? 'line-through text-stone-500' : ''} onClick={() => actions.toggleChecklistItem(training.id, index)}>{item}</button>
                  <button className="text-red-600" onClick={() => actions.removeChecklistItem(training.id, index)}>Supprimer</button>
                </div>
              ))}
            </div>
          )}
          {tab === 'finances' && (
            <div className="space-y-2 text-sm">
              <p>Recettes: {revenue}€</p>
              <p>Dépenses: {expenseTotal}€</p>
              <p>Rentabilité: {revenue - expenseTotal}€</p>
              <button className="rounded bg-[#AFBD00] px-3 py-2 text-sm" onClick={() => actions.addExpense(training.id)}>Ajouter dépense</button>
              {expenses.map((item) => (
                <div key={item.id} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between">
                  <span>{item.date} · {item.category} · {item.amount}€</span>
                  <div className="flex items-center gap-2">
                    <button className="text-stone-700" onClick={() => actions.editExpense(item.id)}>Modifier</button>
                    <button className="text-red-600" onClick={() => actions.deleteExpense(item.id)}>Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

const ACADEMY_SECTIONS = [
  { id: 'kanban', label: 'Kanban' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'types', label: 'Training Types' },
  { id: 'locations', label: 'Locations' },
  { id: 'ideas', label: 'Idea Notebook' },
  { id: 'reporting', label: 'Reporting' },
]

export default function AcademyIndex({ initialTrainingId }) {
  const initialPath = window.location.pathname
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [view, setView] = useState(initialPath.includes('/academy/calendar') ? 'calendar' : 'kanban')
  const handleViewChange = useCallback((id) => {
    if (id === 'reporting') {
      apiRequest('/api/v1/academy/reporting').then((payload) => setReporting(payload))
    }
    setView(id)
  }, [])
  useShellNav({ sections: ACADEMY_SECTIONS, activeSection: view, onSectionChange: handleViewChange })
  const [data, setData] = useState({
    trainingTypes: [],
    trainings: [],
    trainingSessions: [],
    trainingLocations: [],
    trainingRegistrations: [],
    trainingAttendances: [],
    trainingDocuments: [],
    trainingExpenses: [],
    ideaNotes: [],
    members: [],
    stats: { byStatus: {}, total: 0 },
  })
  const [selectedTrainingId, setSelectedTrainingId] = useState(initialTrainingId || null)
  const [reporting, setReporting] = useState(null)
  const [calendarView, setCalendarView] = useState('month')
  const [calendarDate, setCalendarDate] = useState(() => new Date())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const loadAcademy = useCallback(async () => {
    const payload = await apiRequest('/api/v1/academy')
    setData(payload)
  }, [])

  useEffect(() => {
    let mounted = true
    async function boot() {
      setLoading(true)
      try {
        await loadAcademy()
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    boot()
    return () => {
      mounted = false
    }
  }, [loadAcademy])

  const runMutation = useCallback(async (handler, options = { refresh: true }) => {
    setBusy(true)
    setError(null)
    try {
      await handler()
      if (options.refresh) await loadAcademy()
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }, [loadAcademy])

  const actions = useMemo(() => ({
    createTrainingType: () => {
      const name = window.prompt('Nom du type de formation')
      if (!name) return
      runMutation(() => apiRequest('/api/v1/academy/training-types', { method: 'POST', body: JSON.stringify({ name, description: '', checklist_template: ['Définir contenu'], photo_gallery: [], trainer_ids: [] }) }))
    },
    deleteTrainingType: (id) => runMutation(() => apiRequest(`/api/v1/academy/training-types/${id}`, { method: 'DELETE' })),
    editTrainingType: (id) => {
      const current = data.trainingTypes.find((item) => item.id === id)
      if (!current) return
      const name = window.prompt('Nom du type', current.name)
      if (!name) return
      const description = window.prompt('Description', current.description || '') || ''
      runMutation(() => apiRequest(`/api/v1/academy/training-types/${id}`, { method: 'PATCH', body: JSON.stringify({ name, description }) }))
    },
    createLocation: () => {
      const name = window.prompt('Nom du lieu')
      if (!name) return
      runMutation(() => apiRequest('/api/v1/academy/locations', { method: 'POST', body: JSON.stringify({ name, address: '', description: '', capacity: 20, has_accommodation: false, photo_gallery: [], compatible_training_type_ids: [] }) }))
    },
    deleteLocation: (id) => runMutation(() => apiRequest(`/api/v1/academy/locations/${id}`, { method: 'DELETE' })),
    editLocation: (id) => {
      const current = data.trainingLocations.find((item) => item.id === id)
      if (!current) return
      const name = window.prompt('Nom du lieu', current.name)
      if (!name) return
      const address = window.prompt('Adresse', current.address || '') || ''
      const capacity = Number(window.prompt('Capacité', String(current.capacity || 0)) || current.capacity || 0)
      runMutation(() => apiRequest(`/api/v1/academy/locations/${id}`, { method: 'PATCH', body: JSON.stringify({ name, address, capacity }) }))
    },
    createTraining: () => {
      if (data.trainingTypes.length === 0) {
        setError('Créez d’abord un type de formation.')
        return
      }
      const trainingTypeId = window.prompt(`Type ID (${data.trainingTypes.map((item) => item.id).join(', ')})`, data.trainingTypes[0].id)
      const title = window.prompt('Titre de la formation')
      if (!trainingTypeId || !title) return
      runMutation(() => apiRequest('/api/v1/academy/trainings', { method: 'POST', body: JSON.stringify({ training_type_id: trainingTypeId, title, price: 180, max_participants: 20, requires_accommodation: false, description: '', coordinator_note: '' }) }))
    },
    deleteTraining: (id) => runMutation(() => apiRequest(`/api/v1/academy/trainings/${id}`, { method: 'DELETE' })),
    editTraining: (id) => {
      const current = data.trainings.find((item) => item.id === id)
      if (!current) return
      const title = window.prompt('Titre', current.title)
      if (!title) return
      const price = Number(window.prompt('Prix', String(current.price || 0)) || current.price || 0)
      const maxParticipants = Number(window.prompt('Participants max', String(current.maxParticipants || 0)) || current.maxParticipants || 0)
      runMutation(() => apiRequest(`/api/v1/academy/trainings/${id}`, { method: 'PATCH', body: JSON.stringify({ title, price, max_participants: maxParticipants }) }))
    },
    updateTrainingStatus: (id, status) => runMutation(() => apiRequest(`/api/v1/academy/trainings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })),
    addSession: (trainingId) => runMutation(() => apiRequest(`/api/v1/academy/trainings/${trainingId}/sessions`, { method: 'POST', body: JSON.stringify({ start_date: new Date().toISOString().slice(0, 10), end_date: new Date().toISOString().slice(0, 10), description: '', location_ids: [], trainer_ids: [], assistant_ids: [] }) })),
    editSession: (sessionId) => {
      const current = data.trainingSessions.find((item) => item.id === sessionId)
      if (!current) return
      const startDate = window.prompt('Date début (YYYY-MM-DD)', current.startDate)
      const endDate = window.prompt('Date fin (YYYY-MM-DD)', current.endDate)
      if (!startDate || !endDate) return
      runMutation(() => apiRequest(`/api/v1/academy/sessions/${sessionId}`, { method: 'PATCH', body: JSON.stringify({ start_date: startDate, end_date: endDate, description: current.description, location_ids: current.locationIds || [], trainer_ids: current.trainerIds || [], assistant_ids: current.assistantIds || [] }) }))
    },
    deleteSession: (sessionId) => runMutation(() => apiRequest(`/api/v1/academy/sessions/${sessionId}`, { method: 'DELETE' })),
    addRegistration: (trainingId) => {
      const contactName = window.prompt('Nom du participant')
      if (!contactName) return
      runMutation(() => apiRequest(`/api/v1/academy/trainings/${trainingId}/registrations`, { method: 'POST', body: JSON.stringify({ contact_name: contactName, contact_email: '', amount_paid: 0, payment_status: 'pending', internal_note: '' }) }))
    },
    deleteRegistration: (registrationId) => runMutation(() => apiRequest(`/api/v1/academy/registrations/${registrationId}`, { method: 'DELETE' })),
    editRegistration: (registrationId) => {
      const current = data.trainingRegistrations.find((item) => item.id === registrationId)
      if (!current) return
      const contactName = window.prompt('Nom participant', current.contactName)
      if (!contactName) return
      const contactEmail = window.prompt('Email', current.contactEmail || '') || ''
      runMutation(() => apiRequest(`/api/v1/academy/registrations/${registrationId}`, { method: 'PATCH', body: JSON.stringify({ contact_name: contactName, contact_email: contactEmail, amount_paid: current.amountPaid, payment_status: current.paymentStatus, internal_note: current.internalNote || '' }) }))
    },
    updatePaymentStatus: (registrationId) => {
      const status = window.prompt('Status paiement (pending/partial/paid)', 'partial')
      const amountPaid = Number(window.prompt('Montant payé', '90') || 0)
      if (!status) return
      runMutation(() => apiRequest(`/api/v1/academy/registrations/${registrationId}/payment-status`, { method: 'PATCH', body: JSON.stringify({ status, amount_paid: amountPaid }) }))
    },
    markAttendance: (registrationId, sessionId, isPresent) => runMutation(() => apiRequest('/api/v1/academy/attendance', { method: 'POST', body: JSON.stringify({ registration_id: registrationId, session_id: sessionId, is_present: isPresent, note: '' }) })),
    addDocument: (trainingId) => {
      const name = window.prompt('Nom du document')
      const url = window.prompt('URL du document')
      if (!name || !url) return
      runMutation(() => apiRequest(`/api/v1/academy/trainings/${trainingId}/documents`, { method: 'POST', body: JSON.stringify({ name, document_type: 'link', url }) }))
    },
    deleteDocument: (id) => runMutation(() => apiRequest(`/api/v1/academy/documents/${id}`, { method: 'DELETE' })),
    toggleChecklistItem: (trainingId, itemIndex) => runMutation(() => apiRequest(`/api/v1/academy/trainings/${trainingId}/checklist/toggle/${itemIndex}`, { method: 'PATCH' })),
    addChecklistItem: (trainingId) => {
      const item = window.prompt('Nouvel item checklist')
      if (!item) return
      runMutation(() => apiRequest(`/api/v1/academy/trainings/${trainingId}/checklist`, { method: 'POST', body: JSON.stringify({ item }) }))
    },
    removeChecklistItem: (trainingId, itemIndex) => runMutation(() => apiRequest(`/api/v1/academy/trainings/${trainingId}/checklist/${itemIndex}`, { method: 'DELETE' })),
    addExpense: (trainingId) => {
      const description = window.prompt('Description dépense', 'Location salle')
      const amount = Number(window.prompt('Montant', '120') || 0)
      runMutation(() => apiRequest(`/api/v1/academy/trainings/${trainingId}/expenses`, { method: 'POST', body: JSON.stringify({ category: 'location', description, amount, date: new Date().toISOString().slice(0, 10) }) }))
    },
    editExpense: (expenseId) => {
      const current = data.trainingExpenses.find((item) => item.id === expenseId)
      if (!current) return
      const description = window.prompt('Description dépense', current.description || '') || ''
      const amount = Number(window.prompt('Montant', String(current.amount || 0)) || current.amount || 0)
      runMutation(() => apiRequest(`/api/v1/academy/expenses/${expenseId}`, { method: 'PATCH', body: JSON.stringify({ category: current.category, description, amount, date: current.date }) }))
    },
    deleteExpense: (expenseId) => runMutation(() => apiRequest(`/api/v1/academy/expenses/${expenseId}`, { method: 'DELETE' })),
    createIdeaNote: () => {
      const title = window.prompt('Titre de la note idée')
      if (!title) return
      runMutation(() => apiRequest('/api/v1/academy/idea-notes', { method: 'POST', body: JSON.stringify({ category: 'subject', title, content: '', tags: [] }) }))
    },
    editIdeaNote: (id) => {
      const current = data.ideaNotes.find((item) => item.id === id)
      if (!current) return
      const title = window.prompt('Titre', current.title)
      if (!title) return
      const content = window.prompt('Contenu', current.content || '') || ''
      const tags = (window.prompt('Tags séparés par virgule', (current.tags || []).join(', ')) || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      runMutation(() => apiRequest(`/api/v1/academy/idea-notes/${id}`, { method: 'PATCH', body: JSON.stringify({ category: current.category, title, content, tags }) }))
    },
    deleteIdeaNote: (id) => runMutation(() => apiRequest(`/api/v1/academy/idea-notes/${id}`, { method: 'DELETE' })),
    viewReporting: async () => {
      const payload = await apiRequest('/api/v1/academy/reporting')
      setReporting(payload)
      setView('reporting')
    },
  }), [data, runMutation])

  const selectedTraining = data.trainings.find((item) => item.id === selectedTrainingId)
  const filteredTrainings = useMemo(() => data.trainings.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (typeFilter !== 'all' && item.trainingTypeId !== typeFilter) return false
    if (search.trim() !== '') {
      const query = search.trim().toLowerCase()
      const typeName = data.trainingTypes.find((type) => type.id === item.trainingTypeId)?.name?.toLowerCase() || ''
      const text = `${item.title} ${item.description || ''} ${item.coordinatorNote || ''} ${typeName}`.toLowerCase()
      if (!text.includes(query)) return false
    }
    return true
  }), [data.trainingTypes, data.trainings, search, statusFilter, typeFilter])
  const trainingsByStatus = useMemo(() => STATUSES.map((status) => ({ status, items: filteredTrainings.filter((item) => item.status === status) })), [filteredTrainings])
  const calendarItems = useMemo(() => data.trainingSessions.map((session) => {
    const training = data.trainings.find((item) => item.id === session.trainingId)
    return { ...session, training }
  }), [data.trainingSessions, data.trainings])
  const monthItems = useMemo(() => calendarItems.filter((item) => {
    const date = new Date(item.startDate)
    return date.getFullYear() === calendarDate.getFullYear() && date.getMonth() === calendarDate.getMonth()
  }), [calendarDate, calendarItems])
  const yearItems = useMemo(() => {
    const year = calendarDate.getFullYear()
    const buckets = Array.from({ length: 12 }, (_, index) => ({ month: index, items: [] }))
    calendarItems.forEach((item) => {
      const date = new Date(item.startDate)
      if (date.getFullYear() === year) buckets[date.getMonth()].items.push(item)
    })
    return buckets
  }, [calendarDate, calendarItems])

  if (loading) return <div className="flex items-center justify-center h-full p-8"><p className="text-stone-500">Chargement Academy...</p></div>

  if (selectedTraining) {
    return (
      <TrainingDetail
        training={selectedTraining}
        data={data}
        busy={busy}
        onBack={() => {
          setSelectedTrainingId(null)
          window.history.pushState({}, '', '/academy')
        }}
        onRefresh={loadAcademy}
        actions={actions}
      />
    )
  }

  return (
    <div className="px-4 py-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {view === 'kanban' && (
          <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="mb-4 flex flex-wrap gap-2">
              <button className="rounded bg-[#AFBD00] px-3 py-2 text-sm" onClick={actions.createTraining}>Nouvelle formation</button>
              <input className="min-w-[220px] rounded border border-stone-300 px-3 py-2 text-sm" placeholder="Rechercher une formation..." value={search} onChange={(event) => setSearch(event.target.value)} />
              <select className="rounded border border-stone-300 px-3 py-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Tous les statuts</option>
                {STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
              </select>
              <select className="rounded border border-stone-300 px-3 py-2 text-sm" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="all">Tous les types</option>
                {data.trainingTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </div>
            {filteredTrainings.length === 0 ? (
              <p className="text-sm text-stone-500">Aucune formation pour le moment.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {trainingsByStatus.map((column) => (
                  <div key={column.status} className="rounded-xl border border-stone-200 p-3 bg-stone-50">
                    <p className="font-medium text-sm">{STATUS_LABELS[column.status]} ({column.items.length})</p>
                    <div className="mt-2 space-y-2">
                      {column.items.length === 0 ? <p className="text-xs text-stone-500">Aucune formation</p> : column.items.map((item) => (
                        <div key={item.id} className="rounded border border-stone-200 bg-white p-2 text-sm">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-stone-500">{item.price}€ · max {item.maxParticipants}</p>
                          <div className="mt-2 flex gap-2">
                            <button className="text-indigo-700 text-xs" onClick={() => {
                              setSelectedTrainingId(item.id)
                              window.history.pushState({}, '', `/academy/${item.id}`)
                            }}>Ouvrir</button>
                            <button className="text-stone-700 text-xs" onClick={() => actions.editTraining(item.id)}>Modifier</button>
                            <button className="text-red-600 text-xs" onClick={() => actions.deleteTraining(item.id)}>Supprimer</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {view === 'calendar' && (
          <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-stone-800">Calendrier formations</p>
              <button className={`rounded border px-2 py-1 text-xs ${calendarView === 'month' ? 'border-[#B01A19] text-[#B01A19]' : 'border-stone-300 text-stone-700'}`} onClick={() => setCalendarView('month')}>Mois</button>
              <button className={`rounded border px-2 py-1 text-xs ${calendarView === 'year' ? 'border-[#B01A19] text-[#B01A19]' : 'border-stone-300 text-stone-700'}`} onClick={() => setCalendarView('year')}>Année</button>
              <button className="rounded border border-stone-300 px-2 py-1 text-xs" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}>Précédent</button>
              <button className="rounded border border-stone-300 px-2 py-1 text-xs" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}>Suivant</button>
              <span className="text-xs text-stone-600">{calendarDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}</span>
            </div>
            {calendarItems.length === 0 ? <p className="text-sm text-stone-500">Aucune session planifiée.</p> : (
              calendarView === 'month' ? (
                <div className="space-y-2">
                  {monthItems.length === 0 ? <p className="text-sm text-stone-500">Aucune session ce mois-ci.</p> : monthItems.map((item) => (
                    <div key={item.id} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between">
                      <span>{item.startDate} → {item.endDate} · {item.training?.title || 'Formation'}</span>
                      {item.training && <button className="text-indigo-700 text-xs" onClick={() => {
                        setSelectedTrainingId(item.training.id)
                        window.history.pushState({}, '', `/academy/${item.training.id}`)
                      }}>Ouvrir</button>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {yearItems.map((bucket) => (
                    <div key={bucket.month} className="rounded border border-stone-200 p-2 text-sm">
                      <p className="font-medium">{new Date(calendarDate.getFullYear(), bucket.month, 1).toLocaleDateString('fr-FR', { month: 'long' })}</p>
                      <p className="text-xs text-stone-500">{bucket.items.length} session(s)</p>
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
        )}

        {view === 'types' && (
          <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="mb-3">
              <button className="rounded bg-[#AFBD00] px-3 py-2 text-sm" onClick={actions.createTrainingType}>Nouveau type</button>
            </div>
            {data.trainingTypes.length === 0 ? <p className="text-sm text-stone-500">Aucun type de formation.</p> : data.trainingTypes.map((item) => (
              <div key={item.id} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between mb-2">
                <span>{item.name} · checklist {item.checklistTemplate.length}</span>
                <div className="flex items-center gap-2">
                  <button className="text-stone-700" onClick={() => actions.editTrainingType(item.id)}>Modifier</button>
                  <button className="text-red-600" onClick={() => actions.deleteTrainingType(item.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </section>
        )}

        {view === 'locations' && (
          <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="mb-3">
              <button className="rounded bg-[#AFBD00] px-3 py-2 text-sm" onClick={actions.createLocation}>Nouveau lieu</button>
            </div>
            {data.trainingLocations.length === 0 ? <p className="text-sm text-stone-500">Aucun lieu de formation.</p> : data.trainingLocations.map((item) => (
              <div key={item.id} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between mb-2">
                <span>{item.name} · cap. {item.capacity}</span>
                <div className="flex items-center gap-2">
                  <button className="text-stone-700" onClick={() => actions.editLocation(item.id)}>Modifier</button>
                  <button className="text-red-600" onClick={() => actions.deleteLocation(item.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </section>
        )}

        {view === 'ideas' && (
          <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="mb-3">
              <button className="rounded bg-[#AFBD00] px-3 py-2 text-sm" onClick={actions.createIdeaNote}>Nouvelle idée</button>
            </div>
            {data.ideaNotes.length === 0 ? <p className="text-sm text-stone-500">Aucune idée.</p> : data.ideaNotes.map((item) => (
              <div key={item.id} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between mb-2">
                <span>{item.category} · {item.title}</span>
                <div className="flex items-center gap-2">
                  <button className="text-stone-700" onClick={() => actions.editIdeaNote(item.id)}>Modifier</button>
                  <button className="text-red-600" onClick={() => actions.deleteIdeaNote(item.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </section>
        )}

        {view === 'reporting' && (
          <section className="rounded-2xl border border-stone-200 bg-white p-4">
            {!reporting ? <p className="text-sm text-stone-500">Aucune donnée reporting.</p> : (
              <div className="text-sm space-y-1">
                <p>Formations: {reporting.trainingsCount}</p>
                <p>Formations terminées: {reporting.completedTrainings}</p>
                <p>Recettes totales: {reporting.totalRevenue}€</p>
                <p>Dépenses totales: {reporting.totalExpenses}€</p>
                <p>Rentabilité: {reporting.profitability}€</p>
              </div>
            )}
          </section>
        )}

        {(busy || error || notice) && (
          <div className="fixed bottom-4 right-4 z-40 space-y-2">
            {busy && <div className="rounded bg-stone-900 px-3 py-2 text-xs text-white">Synchronisation...</div>}
            {error && <div className="rounded bg-red-600 px-3 py-2 text-sm text-white">{error}</div>}
            {notice && (
              <div className="rounded bg-emerald-600 px-3 py-2 text-sm text-white">
                {notice}
                <button className="ml-2 underline" onClick={() => setNotice(null)}>Fermer</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
