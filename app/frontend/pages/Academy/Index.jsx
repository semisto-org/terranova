import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { apiRequest, getCsrfToken } from '@/lib/api'
import { getCableConsumer } from '@/lib/cable'
import { applyAcademyRealtimeUpdate } from './realtime'
import { useShellNav } from '../../components/shell/ShellContext'
import { useUrlState } from '@/hooks/useUrlState'
import LocationsMap from '../../components/academy/LocationsMap'
import {
  AcademyDashboard,
  TrainingDetail,
  TrainingKanban,
  CalendarMonthView,
  CalendarYearView,
  IdeaNotesView,
  ReportingDashboard,
  AcademyTeamView,
  TeamMemberDetail,
  TrainingFormModal,
  RegistrationFormModal,
  PaymentStatusModal,
  SessionFormModal,
  DocumentFormModal,
  ChecklistItemModal,
  IdeaNoteFormModal,
  TeamMemberFormModal,
  AcademySettingsPanel,
} from '@/components/academy'
import { ExpenseFormModal } from '@/components/shared/ExpenseFormModal'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'

const ACADEMY_SECTIONS = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'kanban', label: 'Activités' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'team', label: 'Équipe' },
  { id: 'types', label: 'Types d\'activités' },
  { id: 'locations', label: 'Lieux' },
  { id: 'ideas', label: 'Bloc-notes' },
  { id: 'reporting', label: 'Reporting' },
  { id: 'settings', label: 'Paramètres' },
]

export default function AcademyIndex({ initialTrainingId }) {
  const initialPath = window.location.pathname
  const calendarDefault = initialPath.includes('/academy/calendar') ? 'calendar' : 'dashboard'
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [view, setView] = useUrlState('tab', calendarDefault)
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
    academyContacts: [],
    stats: { byStatus: {}, total: 0 },
    academySettings: null,
  })
  const [selectedTrainingId, setSelectedTrainingId] = useState(initialTrainingId || null)
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState(null)
  const [teamDetailRefreshKey, setTeamDetailRefreshKey] = useState(0)
  const [reporting, setReporting] = useState(null)
  const [calendarView, setCalendarView] = useState('month')
  const [calendarDate, setCalendarDate] = useState(() => new Date())
  const [calendarLinks, setCalendarLinks] = useState(null)
  const [search, setSearch] = useState('')
  const [activeModal, setActiveModal] = useState(null)
  const [modalData, setModalData] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [designProjectOptions, setDesignProjectOptions] = useState([])
  const loadAcademy = useCallback(async () => {
    const payload = await apiRequest('/api/v1/academy')
    setData(payload)
  }, [])

  useEffect(() => {
    let mounted = true
    async function boot() {
      setLoading(true)
      try {
        await Promise.all([
          loadAcademy(),
          apiRequest('/api/v1/design').then((payload) => {
            if (!mounted) return
            setDesignProjectOptions((payload?.projects || []).map((p) => ({ value: p.id, label: p.name })))
          }).catch(() => {
            if (mounted) setDesignProjectOptions([])
          }),
        ])
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

  useEffect(() => {
    const consumer = getCableConsumer()
    const subscription = consumer.subscriptions.create(
      { channel: 'Academy::TrainingsChannel' },
      {
        received: (payload) => {
          setData((prev) => applyAcademyRealtimeUpdate(prev, payload))
        },
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const runMutation = useCallback(async (handler, options = { refresh: true }) => {
    setBusy(true)
    setError(null)
    try {
      const result = await handler()
      if (options.refresh) await loadAcademy()
      return result !== undefined ? result : true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }, [loadAcademy])

  const handleToggleHoliday = (dateStr) => runMutation(() =>
    apiRequest('/api/v1/academy/holidays/toggle', {
      method: 'POST',
      body: JSON.stringify({ date: dateStr }),
    })
  )

  const fetchCalendarLinks = useCallback(async () => {
    try {
      const payload = await apiRequest('/api/v1/academy/calendar-links')
      setCalendarLinks(payload)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  const copyText = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setNotice('Lien copié ✅')
      setTimeout(() => setNotice(null), 2500)
    } catch {
      setError('Impossible de copier automatiquement le lien')
    }
  }, [])

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
    const session = await runMutation(() =>
      apiRequest(
        modalData.isEdit ? `/api/v1/academy/sessions/${modalData.session.id}` : `/api/v1/academy/trainings/${modalData.trainingId}/sessions`,
        {
          method: modalData.isEdit ? 'PATCH' : 'POST',
          body: JSON.stringify(values)
        }
      )
    )
    if (session) {
      setData((prev) => {
        const exists = prev.trainingSessions.some((s) => s.id === session.id)
        return {
          ...prev,
          trainingSessions: exists
            ? prev.trainingSessions.map((s) => (s.id === session.id ? { ...s, ...session } : s))
            : [...prev.trainingSessions, session],
        }
      })
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

  const handleDocumentSubmit = useCallback(async (values, { onProgress, getXhrRef } = {}) => {
    const formData = new FormData()
    formData.append('name', values.name)
    formData.append('document_type', values.document_type)
    formData.append('file', values.file)
    if (values.sessionId) formData.append('session_id', values.sessionId)
    if (values.uploaded_by) formData.append('uploaded_by', values.uploaded_by)

    const url = `/api/v1/academy/trainings/${modalData.trainingId}/documents`

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      if (getXhrRef) getXhrRef(xhr)

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({ loaded: e.loaded, total: e.total, percent: (e.loaded / e.total) * 100 })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else if (xhr.status === 401) {
          window.location.href = '/login'
          reject(new Error('Session expirée'))
        } else {
          let message = `${xhr.status} ${xhr.statusText}`
          try {
            const data = JSON.parse(xhr.responseText)
            if (data?.error) message = data.error
          } catch (_) {}
          reject(new Error(message))
        }
      })

      xhr.addEventListener('error', () => reject(new Error('Erreur réseau')))
      xhr.addEventListener('abort', () => reject(new Error('Upload annulé')))

      xhr.open('POST', url)
      xhr.setRequestHeader('X-CSRF-Token', getCsrfToken())
      xhr.send(formData)
    })

    await loadAcademy()
  }, [modalData, loadAcademy])

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

  const handleExpenseSubmit = useCallback(async (payload) => {
    const isEdit = Boolean(modalData?.isEdit && modalData?.expense?.id)
    const trainingId = modalData?.trainingId || modalData?.expense?.trainingId
    const documentFile = payload.document
    const body = {
      supplier: payload.supplier,
      supplier_contact_id: payload.supplier_contact_id,
      status: payload.status,
      invoice_date: payload.invoice_date,
      category: payload.category,
      expense_type: payload.expense_type,
      billing_zone: payload.billing_zone,
      payment_date: payload.payment_date || null,
      payment_type: payload.payment_type || null,
      amount_excl_vat: payload.amount_excl_vat,
      vat_rate: payload.vat_rate || null,
      vat_6: payload.vat_6,
      vat_12: payload.vat_12,
      vat_21: payload.vat_21,
      total_incl_vat: payload.total_incl_vat,
      eu_vat_rate: payload.eu_vat_rate || null,
      eu_vat_amount: payload.eu_vat_amount,
      paid_by: payload.paid_by || null,
      reimbursed: payload.reimbursed,
      reimbursement_date: payload.reimbursement_date || null,
      billable_to_client: payload.billable_to_client,
      rebilling_status: payload.rebilling_status || null,
      description: payload.description || '',
      notes: payload.notes || '',
      poles: payload.poles || [],
      training_id: payload.training_id || trainingId || null,
      design_project_id: payload.design_project_id || null,
    }
    const url = isEdit ? `/api/v1/academy/expenses/${modalData.expense.id}` : `/api/v1/academy/trainings/${trainingId}/expenses`
    let success = false
    if (documentFile) {
      const formData = new FormData()
      Object.entries(body).forEach(([k, v]) => {
        if (v === null || v === undefined) return
        if (Array.isArray(v)) v.forEach((x) => formData.append(`${k}[]`, x))
        else formData.append(k, v)
      })
      if (documentFile instanceof File) formData.append('document', documentFile)
      success = await runMutation(() => apiRequest(url, { method: isEdit ? 'PATCH' : 'POST', body: formData }))
    } else {
      success = await runMutation(() => apiRequest(url, { method: isEdit ? 'PATCH' : 'POST', body: JSON.stringify(body) }))
    }
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

  const handleTeamMemberSubmit = useCallback(async (values) => {
    const url = modalData?.isEdit
      ? `/api/v1/academy/team/${modalData.member.id}`
      : '/api/v1/academy/team'
    const success = await runMutation(() =>
      apiRequest(url, {
        method: modalData?.isEdit ? 'PATCH' : 'POST',
        body: JSON.stringify(values),
      })
    )
    if (success) {
      setActiveModal(null)
      setModalData(null)
      setTeamDetailRefreshKey((k) => k + 1)
    }
  }, [modalData, runMutation])

  const handleCheckTeamEmail = useCallback(async (email) => {
    return apiRequest(`/api/v1/academy/team/check-email?email=${encodeURIComponent(email)}`)
  }, [])

  const actions = useMemo(() => ({
    createTrainingType: () => {
      window.location.href = '/academy/training-types/new'
    },
    deleteTrainingType: (id) => {
      const trainingType = data.trainingTypes.find(t => t.id === id)
      setDeleteConfirm({
        title: 'Supprimer ce type d\'activité ?',
        message: `Le type « ${trainingType?.name || ''} » sera supprimé définitivement.`,
        action: () => runMutation(() => apiRequest(`/api/v1/academy/training-types/${id}`, { method: 'DELETE' })),
      })
    },
    editTrainingType: (id) => {
      window.location.href = `/academy/training-types/${id}/edit`
    },
    createLocation: () => {
      window.location.href = '/academy/locations/new'
    },
    deleteLocation: (id) => {
      const location = data.trainingLocations.find(l => l.id === id)
      setDeleteConfirm({
        title: 'Supprimer ce lieu ?',
        message: `Le lieu « ${location?.name || ''} » sera supprimé définitivement.`,
        action: () => runMutation(() => apiRequest(`/api/v1/academy/locations/${id}`, { method: 'DELETE' })),
      })
    },
    editLocation: (id) => {
      window.location.href = `/academy/locations/${id}/edit`
    },
    createTraining: () => {
      if (data.trainingTypes.length === 0) {
        setError('Créez d\'abord un type d\'activité.')
        return
      }
      setModalData({ isEdit: false })
      setActiveModal('training')
    },
    deleteTraining: (id) => {
      const training = data.trainings.find(t => t.id === id)
      setDeleteConfirm({
        title: 'Supprimer cette activité ?',
        message: `L'activité « ${training?.title || ''} » sera supprimée définitivement.`,
        action: () => runMutation(() => apiRequest(`/api/v1/academy/trainings/${id}`, { method: 'DELETE' })),
      })
    },
    editTraining: (id) => {
      const current = data.trainings.find((item) => item.id === id)
      if (!current) return
      setModalData({ isEdit: true, training: current })
      setActiveModal('training')
    },
    updateTrainingStatus: (id, status) => runMutation(async () => {
      const updated = await apiRequest(`/api/v1/academy/trainings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })

      setData((prev) => ({
        ...prev,
        trainings: prev.trainings.map((item) =>
          item.id === id ? { ...item, ...updated } : item
        ),
      }))
    }, { refresh: true }),
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
    deleteSession: (sessionId) => {
      const session = data.trainingSessions.find(s => s.id === sessionId)
      const sessionDate = session?.date ? new Date(session.date).toLocaleDateString('fr-FR') : ''
      setDeleteConfirm({
        title: 'Supprimer cette session ?',
        message: `La session${sessionDate ? ` du ${sessionDate}` : ''} sera supprimée définitivement.`,
        action: () => runMutation(() => apiRequest(`/api/v1/academy/sessions/${sessionId}`, { method: 'DELETE' })),
      })
    },
    addRegistration: (trainingId) => {
      const training = data.trainings.find((item) => item.id === trainingId)
      setModalData({ isEdit: false, trainingId, trainingPrice: training?.price || 0, participantCategories: training?.participantCategories || [] })
      setActiveModal('registration')
    },
    deleteRegistration: (registrationId) => {
      const registration = data.trainingRegistrations.find(r => r.id === registrationId)
      setDeleteConfirm({
        title: 'Supprimer cette inscription ?',
        message: `L'inscription de « ${registration?.participantName || ''} » sera supprimée définitivement.`,
        action: () => runMutation(() => apiRequest(`/api/v1/academy/registrations/${registrationId}`, { method: 'DELETE' })),
      })
    },
    editRegistration: (registrationId) => {
      const current = data.trainingRegistrations.find((item) => item.id === registrationId)
      if (!current) return
      const training = data.trainings.find((item) => item.id === current.trainingId)
      setModalData({ isEdit: true, registration: current, trainingPrice: training?.price || 0, participantCategories: training?.participantCategories || [] })
      setActiveModal('registration')
    },
    updatePaymentStatus: (registrationId, status, amountPaid) => {
      if (status !== undefined && amountPaid !== undefined) {
        runMutation(() =>
          apiRequest(`/api/v1/academy/registrations/${registrationId}/payment-status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, amount_paid: amountPaid }),
          })
        )
        return
      }
      const current = data.trainingRegistrations.find((item) => item.id === registrationId)
      if (!current) return
      const training = data.trainings.find((item) => item.id === current.trainingId)
      setModalData({ registrationId, registration: current, trainingPrice: training?.price || 0 })
      setActiveModal('paymentStatus')
    },
    markAttendance: (registrationId, sessionId, status) => runMutation(() => apiRequest('/api/v1/academy/attendance', { method: 'POST', body: JSON.stringify({ registration_id: registrationId, session_id: sessionId, status, note: '' }) })),
    addDocument: (trainingId) => {
      setModalData({ trainingId })
      setActiveModal('document')
    },
    deleteDocument: (id) => {
      const doc = data.trainingDocuments.find(d => d.id === id)
      setDeleteConfirm({
        title: 'Supprimer ce document ?',
        message: `Le document « ${doc?.name || ''} » sera supprimé définitivement.`,
        action: () => runMutation(() => apiRequest(`/api/v1/academy/documents/${id}`, { method: 'DELETE' })),
      })
    },
    toggleChecklistItem: (trainingId, itemIndex) => runMutation(() => apiRequest(`/api/v1/academy/trainings/${trainingId}/checklist/toggle/${itemIndex}`, { method: 'PATCH' })),
    addChecklistItem: (trainingId, item) => {
      if (item !== undefined && item !== null && item !== '') {
        runMutation(() =>
          apiRequest(`/api/v1/academy/trainings/${trainingId}/checklist`, {
            method: 'POST',
            body: JSON.stringify({ item }),
          })
        )
        return
      }
      setModalData({ trainingId })
      setActiveModal('checklistItem')
    },
    removeChecklistItem: (trainingId, itemIndex) => runMutation(() => apiRequest(`/api/v1/academy/trainings/${trainingId}/checklist/${itemIndex}`, { method: 'DELETE' })),
    reorderChecklist: (trainingId, checklistItems, checkedItems) =>
      runMutation(() =>
        apiRequest(`/api/v1/academy/trainings/${trainingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ checklist_items: checklistItems, checked_items: checkedItems }),
        })
      ),
    addExpense: (trainingId) => {
      setModalData({ isEdit: false, trainingId })
      setActiveModal('expense')
    },
    editExpense: (expenseId) => {
      const current = data.trainingExpenses.find((item) => item.id === expenseId)
      if (!current) return
      setModalData({ isEdit: true, expense: current, trainingId: current.trainingId })
      setActiveModal('expense')
    },
    deleteExpense: (expenseId) => {
      const expense = data.trainingExpenses.find(e => e.id === expenseId)
      setDeleteConfirm({
        title: 'Supprimer cette dépense ?',
        message: `La dépense « ${expense?.supplier || ''} » sera supprimée définitivement.`,
        action: () => runMutation(() => apiRequest(`/api/v1/academy/expenses/${expenseId}`, { method: 'DELETE' })),
      })
    },
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
    deleteIdeaNote: (id) => {
      const note = data.ideaNotes.find(n => n.id === id)
      setDeleteConfirm({
        title: 'Supprimer cette note ?',
        message: `La note « ${note?.title || ''} » sera supprimée définitivement.`,
        action: () => runMutation(() => apiRequest(`/api/v1/academy/idea-notes/${id}`, { method: 'DELETE' })),
      })
    },
    addTeamMember: () => {
      setModalData({ isEdit: false })
      setActiveModal('teamMember')
    },
    editTeamMember: (member) => {
      setModalData({ isEdit: true, member })
      setActiveModal('teamMember')
    },
    removeTeamMember: (id) => {
      const member = data.academyContacts.find(m => m.id === id)
      setDeleteConfirm({
        title: 'Retirer de l\'équipe ?',
        message: `« ${member?.name || ''} » sera retiré de l'équipe de formation. Le contact sera conservé.`,
        action: () => runMutation(() => apiRequest(`/api/v1/academy/team/${id}`, { method: 'DELETE' })),
      })
    },
  }), [data, runMutation, setDeleteConfirm])

  const selectedTraining = data.trainings.find((item) => item.id === selectedTrainingId)
  useEffect(() => {
    if (!selectedTrainingId || loading) return
    if (!selectedTraining) setSelectedTrainingId(null)
  }, [loading, selectedTraining, selectedTrainingId])

  const filteredTrainings = useMemo(() => data.trainings.filter((item) => {
    if (search.trim() !== '') {
      const query = search.trim().toLowerCase()
      const typeName = data.trainingTypes.find((type) => type.id === item.trainingTypeId)?.name?.toLowerCase() || ''
      const text = `${item.title} ${item.description || ''} ${item.coordinatorNote || ''} ${typeName}`.toLowerCase()
      if (!text.includes(query)) return false
    }
    return true
  }), [data.trainingTypes, data.trainings, search])
  const drawerTrainings = filteredTrainings.length > 0 ? filteredTrainings : data.trainings
  const selectedTrainingIndex = selectedTraining ? drawerTrainings.findIndex((item) => item.id === selectedTraining.id) : -1
  const hasPreviousTraining = selectedTrainingIndex > 0
  const hasNextTraining = selectedTrainingIndex >= 0 && selectedTrainingIndex < drawerTrainings.length - 1

  const openTrainingDrawer = useCallback((id) => {
    setSelectedTrainingId(id)
  }, [])

  const closeTrainingDrawer = useCallback(() => {
    setSelectedTrainingId(null)
  }, [])

  useEffect(() => {
    if (!selectedTrainingId) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeTrainingDrawer()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeTrainingDrawer, selectedTrainingId])

  const openPreviousTraining = useCallback(() => {
    if (!hasPreviousTraining) return
    setSelectedTrainingId(drawerTrainings[selectedTrainingIndex - 1].id)
  }, [drawerTrainings, hasPreviousTraining, selectedTrainingIndex])

  const openNextTraining = useCallback(() => {
    if (!hasNextTraining) return
    setSelectedTrainingId(drawerTrainings[selectedTrainingIndex + 1].id)
  }, [drawerTrainings, hasNextTraining, selectedTrainingIndex])
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
          academyContacts={data.academyContacts}
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
          participantCategories={modalData?.participantCategories || []}
          academySettings={data.academySettings}
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
          sessions={(data.trainingSessions || [])
            .filter((s) => s.trainingId === modalData?.trainingId)
            .sort((a, b) => a.startDate.localeCompare(b.startDate))}
          members={data.members || []}
          academyContacts={data.academyContacts || []}
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
          defaultTrainingId={modalData?.trainingId}
          fetchContacts={() => apiRequest('/api/v1/lab/contacts')}
          onCreateContact={async ({ name, contact_type }) => {
            const contact = await apiRequest('/api/v1/lab/contacts', {
              method: 'POST',
              body: JSON.stringify({ name, contact_type }),
            })
            return { id: contact.id, name: contact.name, contactType: contact.contactType }
          }}
          trainingOptions={data.trainings.map((t) => ({ value: t.id, label: t.title }))}
          designProjectOptions={designProjectOptions}
          showTrainingLink={true}
          showDesignProjectLink={true}
          accentColor="#B01A19"
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
          existingTags={[...new Set(data.ideaNotes.flatMap(n => n.tags || []))].sort()}
          onSubmit={handleIdeaNoteSubmit}
          onCancel={() => {
            setActiveModal(null)
            setModalData(null)
          }}
          busy={busy}
        />
      )}

      {activeModal === 'teamMember' && (
        <TeamMemberFormModal
          member={modalData?.isEdit ? modalData.member : null}
          onSubmit={handleTeamMemberSubmit}
          onCheckEmail={handleCheckTeamEmail}
          onCancel={() => {
            setActiveModal(null)
            setModalData(null)
          }}
          busy={busy}
        />
      )}
    </>
  )


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
      <div className={`${view === 'kanban' ? 'max-w-[1600px]' : 'max-w-7xl'} mx-auto space-y-4`}>
        {view === 'dashboard' && (
          <AcademyDashboard
            onNavigateToTraining={(trainingId) => {
              setSelectedTrainingId(trainingId)
              setView('kanban')
            }}
          />
        )}

        {view === 'kanban' && (
          <TrainingKanban
            trainings={filteredTrainings}
            trainingTypes={data.trainingTypes}
            trainingSessions={data.trainingSessions}
            trainingRegistrations={data.trainingRegistrations}
            search={search}
            onSearchChange={setSearch}
            onCreateTraining={actions.createTraining}
            onViewTraining={openTrainingDrawer}
            onEditTraining={actions.editTraining}
            onDeleteTraining={actions.deleteTraining}
            onUpdateTrainingStatus={actions.updateTrainingStatus}
            onToggleChecklistItem={actions.toggleChecklistItem}
          />
        )}

        {view === 'calendar' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
                  <button
                    type="button"
                    className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${calendarView === 'month' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-700'}`}
                    onClick={() => setCalendarView('month')}
                  >
                    Mois
                  </button>
                  <button
                    type="button"
                    className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${calendarView === 'year' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-700'}`}
                    onClick={() => setCalendarView('year')}
                  >
                    Année
                  </button>
                </div>

                <div className="h-5 w-px bg-stone-200 mx-1 hidden sm:block" />

                <button
                  type="button"
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-600 transition-all duration-200 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900 active:scale-[0.97]"
                  onClick={() => setCalendarDate(new Date())}
                >
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Aujourd'hui
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 bg-white text-stone-500 transition-all duration-200 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900 active:scale-[0.93]"
                  onClick={() =>
                    setCalendarDate(
                      calendarView === 'year'
                        ? new Date(calendarDate.getFullYear() - 1, calendarDate.getMonth(), 1)
                        : new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)
                    )
                  }
                  title={calendarView === 'year' ? 'Année précédente' : 'Mois précédent'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="min-w-[140px] text-center text-sm font-semibold text-stone-800 capitalize select-none">
                  {calendarView === 'year'
                    ? calendarDate.getFullYear()
                    : calendarDate.toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                      })
                  }
                </span>

                <button
                  type="button"
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 bg-white text-stone-500 transition-all duration-200 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900 active:scale-[0.93]"
                  onClick={() =>
                    setCalendarDate(
                      calendarView === 'year'
                        ? new Date(calendarDate.getFullYear() + 1, calendarDate.getMonth(), 1)
                        : new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1)
                    )
                  }
                  title={calendarView === 'year' ? 'Année suivante' : 'Mois suivant'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">Ajouter à Google Agenda</p>
                  <p className="text-xs text-stone-500">Export iCal en lecture seule (Semisto + Activités)</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
                  onClick={fetchCalendarLinks}
                >
                  Générer les liens iCal
                </button>
              </div>

              {calendarLinks && (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-stone-700">Semisto:</span>
                    <button type="button" className="text-[#B01A19] underline" onClick={() => copyText(calendarLinks.semisto.url)}>Copier le lien</button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-stone-700">Activités:</span>
                    <button type="button" className="text-[#B01A19] underline" onClick={() => copyText(calendarLinks.trainings.url)}>Copier le lien</button>
                  </div>
                  <ol className="mt-2 list-decimal pl-5 text-xs text-stone-600">
                    {(calendarLinks.instructions || []).map((step) => <li key={step}>{step}</li>)}
                  </ol>
                </div>
              )}
            </div>
            {calendarView === 'month' ? (
              <CalendarMonthView
                currentDate={calendarDate}
                trainings={data.trainings}
                trainingSessions={data.trainingSessions}
                trainingLocations={data.trainingLocations}
                trainingRegistrations={data.trainingRegistrations}
                trainingTypes={data.trainingTypes}
                holidays={data.holidays || []}
                onViewTraining={openTrainingDrawer}
              />
            ) : (
              <CalendarYearView
                currentDate={calendarDate}
                trainings={data.trainings}
                trainingSessions={data.trainingSessions}
                holidays={data.holidays || []}
                onViewTraining={openTrainingDrawer}
                onToggleHoliday={handleToggleHoliday}
              />
            )}
          </section>
        )}

        {view === 'team' && (
          selectedTeamMemberId ? (
            <TeamMemberDetail
              contactId={selectedTeamMemberId}
              refreshKey={teamDetailRefreshKey}
              onBack={() => setSelectedTeamMemberId(null)}
              onEdit={(contact) => {
                actions.editTeamMember(contact)
              }}
            />
          ) : (
            <AcademyTeamView
              team={data.academyContacts}
              onAddMember={actions.addTeamMember}
              onEditMember={actions.editTeamMember}
              onRemoveMember={actions.removeTeamMember}
              onViewMember={(contact) => setSelectedTeamMemberId(contact.id)}
            />
          )
        )}

        {view === 'types' && (
          <section className="max-w-5xl mx-auto space-y-6">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-3">
                <div className="h-12 w-1 bg-gradient-to-b from-[#B01A19] to-[#eac7b8] rounded-full shrink-0" />
                <div>
                  <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Types d'activités</h1>
                  <p className="text-sm text-stone-600 mt-2 font-medium">{data.trainingTypes.length} type{data.trainingTypes.length !== 1 ? 's' : ''} disponible{data.trainingTypes.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-[#B01A19] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8f1514] shadow-md active:scale-[0.98] transition-all"
                  onClick={actions.createTrainingType}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nouveau type
                </button>
              </div>
            </div>

            {data.trainingTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-16 px-6">
                <div className="mb-4 rounded-full bg-stone-100 p-4">
                  <svg className="h-8 w-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-base font-medium text-stone-700">Aucun type d'activité</p>
                <p className="mt-1 text-sm text-stone-500">Commencez par créer votre premier type d'activité</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50">
                        <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wide min-w-[200px]">
                          Nom
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wide">
                          Checklist
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wide">
                          Activités
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wide w-12" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.trainingTypes.map((item) => {
                        const trainingsCount = data.trainings.filter((t) => t.trainingTypeId === item.id).length
                        return (
                          <tr key={item.id} className="border-b border-stone-100 hover:bg-stone-50/50 group">
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => actions.editTrainingType(item.id)}
                                className="flex items-center gap-2 text-sm font-medium text-stone-900 hover:text-[#B01A19] transition-colors text-left"
                              >
                                <span
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: item.color || '#6B7280' }}
                                />
                                {item.name}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-stone-600">
                                {item.checklistTemplate?.length || 0} étape{(item.checklistTemplate?.length || 0) !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {trainingsCount > 0 ? (
                                <span className="inline-flex items-center rounded-full bg-[#B01A19]/10 px-2.5 py-0.5 text-xs font-medium text-[#B01A19]">
                                  {trainingsCount} activité{trainingsCount !== 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="text-xs text-stone-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
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
          <IdeaNotesView
            ideaNotes={data.ideaNotes}
            onCreateIdeaNote={actions.createIdeaNote}
            onEditIdeaNote={actions.editIdeaNote}
            onDeleteIdeaNote={actions.deleteIdeaNote}
          />
        )}

        {view === 'reporting' && (
          <ReportingDashboard data={reporting} />
        )}

        {view === 'settings' && (
          <AcademySettingsPanel />
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

    {selectedTraining && (
      <>
        <div
          className="fixed inset-0 z-40 bg-stone-900/25 backdrop-blur-[1px] transition-opacity"
          onClick={closeTrainingDrawer}
          aria-hidden="true"
        />
        <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl border-l border-stone-200 bg-white shadow-2xl transition-transform duration-300">
          <TrainingDetail
            training={selectedTraining}
            data={data}
            busy={busy}
            onRefresh={loadAcademy}
            actions={actions}
            layout="drawer"
            onClose={closeTrainingDrawer}
            onPrevious={openPreviousTraining}
            onNext={openNextTraining}
            hasPrevious={hasPreviousTraining}
            hasNext={hasNextTraining}
          />
        </aside>
      </>
    )}

    {renderModals()}
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
    </>
  )
}
