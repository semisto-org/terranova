import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { useShellNav } from '../../components/shell/ShellContext'
import LocationsMap from '../../components/academy/LocationsMap'
import {
  TrainingFormModal,
  RegistrationFormModal,
  PaymentStatusModal,
  SessionFormModal,
  ExpenseFormModal,
  DocumentFormModal,
  ChecklistItemModal,
  IdeaNoteFormModal
} from '@/components/academy'

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
  { id: 'kanban', label: 'Formations' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'types', label: 'Types de formations' },
  { id: 'locations', label: 'Lieux' },
  { id: 'ideas', label: 'Bloc-notes' },
  { id: 'reporting', label: 'Reporting' },
]

export default function AcademyIndex({ initialTrainingId }) {
  const initialPath = window.location.pathname
  const urlParams = new URLSearchParams(window.location.search)
  const initialView = urlParams.get('view') || (initialPath.includes('/academy/calendar') ? 'calendar' : 'kanban')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [view, setView] = useState(initialView)
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
  const [activeModal, setActiveModal] = useState(null)
  const [modalData, setModalData] = useState(null)
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

  // Modal submission handlers
  const handleTrainingSubmit = useCallback(async (values) => {
    const success = await runMutation(() =>
      apiRequest(
        modalData.isEdit ? `/api/v1/academy/trainings/${modalData.training.id}` : '/api/v1/academy/trainings',
        {
          method: modalData.isEdit ? 'PATCH' : 'POST',
          body: JSON.stringify(values)
        }
      )
    )
    if (success) {
      setActiveModal(null)
      setModalData(null)
    }
  }, [modalData, runMutation])

  const handleSessionSubmit = useCallback(async (values) => {
    const success = await runMutation(() =>
      apiRequest(
        modalData.isEdit ? `/api/v1/academy/sessions/${modalData.session.id}` : `/api/v1/academy/trainings/${modalData.trainingId}/sessions`,
        {
          method: modalData.isEdit ? 'PATCH' : 'POST',
          body: JSON.stringify(values)
        }
      )
    )
    if (success) {
      setActiveModal(null)
      setModalData(null)
    }
  }, [modalData, runMutation])

  const handleRegistrationSubmit = useCallback(async (values) => {
    const success = await runMutation(() =>
      apiRequest(
        modalData.isEdit ? `/api/v1/academy/registrations/${modalData.registration.id}` : `/api/v1/academy/trainings/${modalData.trainingId}/registrations`,
        {
          method: modalData.isEdit ? 'PATCH' : 'POST',
          body: JSON.stringify(values)
        }
      )
    )
    if (success) {
      setActiveModal(null)
      setModalData(null)
    }
  }, [modalData, runMutation])

  const handlePaymentStatusSubmit = useCallback(async (status, amountPaid) => {
    const success = await runMutation(() =>
      apiRequest(`/api/v1/academy/registrations/${modalData.registrationId}/payment-status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, amount_paid: amountPaid })
      })
    )
    if (success) {
      setActiveModal(null)
      setModalData(null)
    }
  }, [modalData, runMutation])

  const handleDocumentSubmit = useCallback(async (values) => {
    const success = await runMutation(() =>
      apiRequest(`/api/v1/academy/trainings/${modalData.trainingId}/documents`, {
        method: 'POST',
        body: JSON.stringify(values)
      })
    )
    if (success) {
      setActiveModal(null)
      setModalData(null)
    }
  }, [modalData, runMutation])

  const handleChecklistItemSubmit = useCallback(async (item) => {
    const success = await runMutation(() =>
      apiRequest(`/api/v1/academy/trainings/${modalData.trainingId}/checklist`, {
        method: 'POST',
        body: JSON.stringify({ item })
      })
    )
    if (success) {
      setActiveModal(null)
      setModalData(null)
    }
  }, [modalData, runMutation])

  const handleExpenseSubmit = useCallback(async (values) => {
    const success = await runMutation(() =>
      apiRequest(
        modalData.isEdit ? `/api/v1/academy/expenses/${modalData.expense.id}` : `/api/v1/academy/trainings/${modalData.trainingId}/expenses`,
        {
          method: modalData.isEdit ? 'PATCH' : 'POST',
          body: JSON.stringify(values)
        }
      )
    )
    if (success) {
      setActiveModal(null)
      setModalData(null)
    }
  }, [modalData, runMutation])

  const handleIdeaNoteSubmit = useCallback(async (values) => {
    const success = await runMutation(() =>
      apiRequest(
        modalData.isEdit ? `/api/v1/academy/idea-notes/${modalData.note.id}` : '/api/v1/academy/idea-notes',
        {
          method: modalData.isEdit ? 'PATCH' : 'POST',
          body: JSON.stringify(values)
        }
      )
    )
    if (success) {
      setActiveModal(null)
      setModalData(null)
    }
  }, [modalData, runMutation])

  const actions = useMemo(() => ({
    createTrainingType: () => {
      window.location.href = '/academy/training-types/new'
    },
    deleteTrainingType: (id) => {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce type de formation ?')) {
        runMutation(() => apiRequest(`/api/v1/academy/training-types/${id}`, { method: 'DELETE' }))
      }
    },
    editTrainingType: (id) => {
      window.location.href = `/academy/training-types/${id}/edit`
    },
    createLocation: () => {
      window.location.href = '/academy/locations/new'
    },
    deleteLocation: (id) => {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce lieu ?')) {
        runMutation(() => apiRequest(`/api/v1/academy/locations/${id}`, { method: 'DELETE' }))
      }
    },
    editLocation: (id) => {
      window.location.href = `/academy/locations/${id}/edit`
    },
    createTraining: () => {
      if (data.trainingTypes.length === 0) {
        setError('Créez d\'abord un type de formation.')
        return
      }
      setModalData({ isEdit: false })
      setActiveModal('training')
    },
    deleteTraining: (id) => runMutation(() => apiRequest(`/api/v1/academy/trainings/${id}`, { method: 'DELETE' })),
    editTraining: (id) => {
      const current = data.trainings.find((item) => item.id === id)
      if (!current) return
      setModalData({ isEdit: true, training: current })
      setActiveModal('training')
    },
    updateTrainingStatus: (id, status) => runMutation(() => apiRequest(`/api/v1/academy/trainings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })),
    addSession: (trainingId) => {
      setModalData({ isEdit: false, trainingId })
      setActiveModal('session')
    },
    editSession: (sessionId) => {
      const current = data.trainingSessions.find((item) => item.id === sessionId)
      if (!current) return
      setModalData({ isEdit: true, session: current })
      setActiveModal('session')
    },
    deleteSession: (sessionId) => runMutation(() => apiRequest(`/api/v1/academy/sessions/${sessionId}`, { method: 'DELETE' })),
    addRegistration: (trainingId) => {
      const training = data.trainings.find((item) => item.id === trainingId)
      setModalData({ isEdit: false, trainingId, trainingPrice: training?.price || 0 })
      setActiveModal('registration')
    },
    deleteRegistration: (registrationId) => runMutation(() => apiRequest(`/api/v1/academy/registrations/${registrationId}`, { method: 'DELETE' })),
    editRegistration: (registrationId) => {
      const current = data.trainingRegistrations.find((item) => item.id === registrationId)
      if (!current) return
      const training = data.trainings.find((item) => item.id === current.trainingId)
      setModalData({ isEdit: true, registration: current, trainingPrice: training?.price || 0 })
      setActiveModal('registration')
    },
    updatePaymentStatus: (registrationId) => {
      const current = data.trainingRegistrations.find((item) => item.id === registrationId)
      if (!current) return
      const training = data.trainings.find((item) => item.id === current.trainingId)
      setModalData({ registrationId, registration: current, trainingPrice: training?.price || 0 })
      setActiveModal('paymentStatus')
    },
    markAttendance: (registrationId, sessionId, isPresent) => runMutation(() => apiRequest('/api/v1/academy/attendance', { method: 'POST', body: JSON.stringify({ registration_id: registrationId, session_id: sessionId, is_present: isPresent, note: '' }) })),
    addDocument: (trainingId) => {
      setModalData({ trainingId })
      setActiveModal('document')
    },
    deleteDocument: (id) => runMutation(() => apiRequest(`/api/v1/academy/documents/${id}`, { method: 'DELETE' })),
    toggleChecklistItem: (trainingId, itemIndex) => runMutation(() => apiRequest(`/api/v1/academy/trainings/${trainingId}/checklist/toggle/${itemIndex}`, { method: 'PATCH' })),
    addChecklistItem: (trainingId) => {
      setModalData({ trainingId })
      setActiveModal('checklistItem')
    },
    removeChecklistItem: (trainingId, itemIndex) => runMutation(() => apiRequest(`/api/v1/academy/trainings/${trainingId}/checklist/${itemIndex}`, { method: 'DELETE' })),
    addExpense: (trainingId) => {
      setModalData({ isEdit: false, trainingId })
      setActiveModal('expense')
    },
    editExpense: (expenseId) => {
      const current = data.trainingExpenses.find((item) => item.id === expenseId)
      if (!current) return
      setModalData({ isEdit: true, expense: current })
      setActiveModal('expense')
    },
    deleteExpense: (expenseId) => runMutation(() => apiRequest(`/api/v1/academy/expenses/${expenseId}`, { method: 'DELETE' })),
    createIdeaNote: () => {
      setModalData({ isEdit: false })
      setActiveModal('ideaNote')
    },
    editIdeaNote: (id) => {
      const current = data.ideaNotes.find((item) => item.id === id)
      if (!current) return
      setModalData({ isEdit: true, note: current })
      setActiveModal('ideaNote')
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

  const renderModals = () => (
    <>
      {activeModal === 'training' && (
        <TrainingFormModal
          training={modalData?.isEdit ? modalData.training : null}
          trainingTypes={data.trainingTypes}
          onSubmit={handleTrainingSubmit}
          onCancel={() => {
            setActiveModal(null)
            setModalData(null)
          }}
          busy={busy}
        />
      )}

      {activeModal === 'session' && (
        <SessionFormModal
          session={modalData?.isEdit ? modalData.session : null}
          locations={data.trainingLocations}
          members={data.members}
          onSubmit={handleSessionSubmit}
          onCancel={() => {
            setActiveModal(null)
            setModalData(null)
          }}
          busy={busy}
        />
      )}

      {activeModal === 'registration' && (
        <RegistrationFormModal
          registration={modalData?.isEdit ? modalData.registration : null}
          trainingPrice={modalData?.trainingPrice || 0}
          onSubmit={handleRegistrationSubmit}
          onCancel={() => {
            setActiveModal(null)
            setModalData(null)
          }}
          busy={busy}
        />
      )}

      {activeModal === 'paymentStatus' && modalData?.registration && (
        <PaymentStatusModal
          registration={modalData.registration}
          trainingPrice={modalData.trainingPrice}
          onSubmit={handlePaymentStatusSubmit}
          onCancel={() => {
            setActiveModal(null)
            setModalData(null)
          }}
          busy={busy}
        />
      )}

      {activeModal === 'document' && (
        <DocumentFormModal
          onSubmit={handleDocumentSubmit}
          onCancel={() => {
            setActiveModal(null)
            setModalData(null)
          }}
          busy={busy}
        />
      )}

      {activeModal === 'checklistItem' && (
        <ChecklistItemModal
          onSubmit={handleChecklistItemSubmit}
          onCancel={() => {
            setActiveModal(null)
            setModalData(null)
          }}
          busy={busy}
        />
      )}

      {activeModal === 'expense' && (
        <ExpenseFormModal
          expense={modalData?.isEdit ? modalData.expense : null}
          onSubmit={handleExpenseSubmit}
          onCancel={() => {
            setActiveModal(null)
            setModalData(null)
          }}
          busy={busy}
        />
      )}

      {activeModal === 'ideaNote' && (
        <IdeaNoteFormModal
          note={modalData?.isEdit ? modalData.note : null}
          onSubmit={handleIdeaNoteSubmit}
          onCancel={() => {
            setActiveModal(null)
            setModalData(null)
          }}
          busy={busy}
        />
      )}
    </>
  )

  if (selectedTraining) {
    return (
      <>
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
        {renderModals()}
      </>
    )
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
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
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-stone-900 tracking-tight">Types de formations</h2>
                <p className="text-sm text-stone-500 mt-1">{data.trainingTypes.length} type{data.trainingTypes.length !== 1 ? 's' : ''} disponible{data.trainingTypes.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                className="group relative overflow-hidden rounded-xl bg-[#B01A19] px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#8f1514] hover:shadow-lg hover:shadow-[#B01A19]/20 active:scale-[0.98]"
                onClick={actions.createTrainingType}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nouveau type
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#B01A19] to-[#8f1514] opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </div>

            {data.trainingTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-16 px-6">
                <div className="mb-4 rounded-full bg-stone-100 p-4">
                  <svg className="h-8 w-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-base font-medium text-stone-700">Aucun type de formation</p>
                <p className="mt-1 text-sm text-stone-500">Commencez par créer votre premier type de formation</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.trainingTypes.map((item, index) => {
                  const trainingsCount = data.trainings.filter((t) => t.trainingTypeId === item.id).length
                  return (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation: 'fadeInUp 0.5s ease-out forwards',
                        opacity: 0,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-stone-50/0 via-stone-50/0 to-stone-50/50 opacity-0 transition-opacity group-hover:opacity-100" />
                      
                      <div className="relative z-10">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-stone-900 leading-tight">{item.name}</h3>
                          </div>
                          <div className="ml-3 flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => actions.editTrainingType(item.id)}
                              className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-[#B01A19]"
                              title="Modifier"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => actions.deleteTrainingType(item.id)}
                              className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Supprimer"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-1.5 text-sm">
                            <svg className="h-4 w-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="font-medium text-stone-700">{item.checklistTemplate?.length || 0}</span>
                            <span className="text-stone-500">étape{item.checklistTemplate?.length !== 1 ? 's' : ''}</span>
                          </div>

                          {trainingsCount > 0 && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-[#B01A19]/10 px-3 py-1.5 text-sm">
                              <svg className="h-4 w-4 text-[#B01A19]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <span className="font-medium text-[#B01A19]">{trainingsCount}</span>
                              <span className="text-[#B01A19]/70">formation{trainingsCount !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {view === 'locations' && (
          <LocationsMap
            locations={data.trainingLocations}
            actions={actions}
            onCreateLocation={actions.createLocation}
          />
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

    {renderModals()}
    </>
  )
}
