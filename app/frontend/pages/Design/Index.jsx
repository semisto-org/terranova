import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { useShellNav } from '../../components/shell/ShellContext'
import { ProjectDashboard, ProjectDetailView } from '../../design-studio/components'
import { ExpenseFormModal } from '../../components/shared/ExpenseFormModal'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'

function defaultProjectForm() {
  return {
    name: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    address: '',
    area: 500,
  }
}

function ProjectModal({ open, busy, templates, selectedTemplateId, values, onChange, onClose, onSubmit }) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl border border-stone-200 shadow-2xl">
          <div className="shrink-0 px-5 py-4 border-b border-stone-200">
            <h2 className="text-lg font-semibold text-stone-900">Nouveau projet Design Studio</h2>
          </div>

          <form
            className="flex flex-col min-h-0 h-full"
            onSubmit={(event) => {
              event.preventDefault()
              onSubmit()
            }}
          >
            <div className="flex-1 overflow-y-auto min-h-0 p-5 grid gap-3">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-stone-700">Template (optionnel)</span>
              <select
                value={selectedTemplateId || ''}
                onChange={(event) => onChange('template_id', event.target.value || null)}
                className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
              >
                <option value="">Sans template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-stone-700">Nom du projet</span>
              <input className="rounded-xl border border-stone-300 px-3 py-2 text-sm" value={values.name} onChange={(event) => onChange('name', event.target.value)} required />
            </label>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-stone-700">Client</span>
                <input className="rounded-xl border border-stone-300 px-3 py-2 text-sm" value={values.client_name} onChange={(event) => onChange('client_name', event.target.value)} required />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium text-stone-700">Surface (m²)</span>
                <input type="number" min="1" className="rounded-xl border border-stone-300 px-3 py-2 text-sm" value={values.area} onChange={(event) => onChange('area', Number(event.target.value || 0))} required />
              </label>
            </div>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-stone-700">Adresse</span>
              <input className="rounded-xl border border-stone-300 px-3 py-2 text-sm" value={values.address} onChange={(event) => onChange('address', event.target.value)} required />
            </label>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-stone-700">Email</span>
                <input type="email" className="rounded-xl border border-stone-300 px-3 py-2 text-sm" value={values.client_email} onChange={(event) => onChange('client_email', event.target.value)} />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium text-stone-700">Téléphone</span>
                <input className="rounded-xl border border-stone-300 px-3 py-2 text-sm" value={values.client_phone} onChange={(event) => onChange('client_phone', event.target.value)} />
              </label>
            </div>

            </div>
            <div className="shrink-0 px-5 py-4 border-t border-stone-200 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-stone-300 text-sm">Annuler</button>
              <button type="submit" disabled={busy} className="px-3 py-2 rounded-lg bg-[#AFBD00] text-stone-900 text-sm font-medium disabled:opacity-60">
                {busy ? 'Création...' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}


const DESIGN_SECTIONS = [
  { id: 'projects', label: 'Projets' },
]

export default function DesignIndex({ initialProjectId }) {
  useShellNav({ sections: DESIGN_SECTIONS, activeSection: 'projects', onSectionChange: () => {} })
  const paletteIdFromQuery = new URLSearchParams(window.location.search).get('palette_id')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState(null)
  const [templates, setTemplates] = useState([])

  const [projectDetail, setProjectDetail] = useState(null)
  const [searchResults, setSearchResults] = useState([])

  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [projectForm, setProjectForm] = useState(defaultProjectForm)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [expenseModal, setExpenseModal] = useState(null)

  const loadDashboard = useCallback(async () => {
    const payload = await apiRequest('/api/v1/design')
    setProjects(payload.projects || [])
    setStats(payload.stats || {
      activeProjects: 0,
      pendingProjects: 0,
      totalProjects: 0,
      totalHoursThisMonth: 0,
      totalRevenueThisYear: 0,
      quoteConversionRate: 0,
      upcomingMeetings: [],
    })
    setTemplates(payload.templates || [])
  }, [])

  const loadProject = useCallback(async (projectId) => {
    const payload = await apiRequest(`/api/v1/design/${projectId}`)
    setProjectDetail(payload)
    setSearchResults([])
  }, [])

  useEffect(() => {
    let active = true

    async function boot() {
      setLoading(true)
      setError(null)
      try {
        await loadDashboard()

        if (initialProjectId) {
          await loadProject(initialProjectId)
          window.history.replaceState({}, '', `/design/${initialProjectId}`)
        } else if (paletteIdFromQuery && active) {
          setNotice(`Palette ${paletteIdFromQuery} reçue depuis Plant Database.`)
        }
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    boot()
    return () => {
      active = false
    }
  }, [initialProjectId, loadDashboard, loadProject, paletteIdFromQuery])

  const runMutation = useCallback(async (mutation, opts = {}) => {
    setBusy(true)
    setError(null)
    try {
      await mutation()
      if (opts.refreshDashboard !== false) await loadDashboard()
      if (opts.refreshProjectId) await loadProject(opts.refreshProjectId)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }, [loadDashboard, loadProject])

  const openCreateModal = useCallback((templateId) => {
    setSelectedTemplateId(templateId || null)
    setProjectForm(defaultProjectForm())
    setProjectModalOpen(true)
  }, [])

  const updateForm = useCallback((field, value) => {
    if (field === 'template_id') {
      setSelectedTemplateId(value)
      return
    }

    setProjectForm((previous) => ({ ...previous, [field]: value }))
  }, [])

  const submitCreate = useCallback(async () => {
    const success = await runMutation(async () => {
      const created = await apiRequest('/api/v1/design', {
        method: 'POST',
        body: JSON.stringify({
          template_id: selectedTemplateId,
          name: projectForm.name,
          client_name: projectForm.client_name,
          client_email: projectForm.client_email,
          client_phone: projectForm.client_phone,
          address: projectForm.address,
          area: Number(projectForm.area || 0),
        }),
      })

      await loadProject(created.id)
      window.history.pushState({}, '', `/design/${created.id}`)
      setNotice('Projet créé.')
    })

    if (success) setProjectModalOpen(false)
  }, [projectForm, runMutation, selectedTemplateId, loadProject])

  const viewProject = useCallback(async (projectId) => {
    const success = await runMutation(async () => {
      await loadProject(projectId)
      window.history.pushState({}, '', `/design/${projectId}`)
    }, { refreshDashboard: false })

    if (!success) return
  }, [loadProject, runMutation])

  const deleteProject = useCallback((projectId) => {
    const project = projects.find((p) => p.id === projectId)
    setDeleteConfirm({
      title: 'Supprimer ce projet ?',
      message: `Le projet « ${project?.name || ''} » sera supprimé définitivement.`,
      action: () => runMutation(async () => {
        await apiRequest(`/api/v1/design/${projectId}`, { method: 'DELETE' })
        if (projectDetail?.project?.id === projectId) {
          setProjectDetail(null)
          window.history.pushState({}, '', '/design')
        }
        setNotice('Projet supprimé.')
      }),
    })
  }, [projects, projectDetail?.project?.id, runMutation])

  const duplicateProject = useCallback((projectId) => {
    runMutation(async () => {
      const created = await apiRequest(`/api/v1/design/${projectId}/duplicate`, { method: 'POST' })
      await loadProject(created.id)
      window.history.pushState({}, '', `/design/${created.id}`)
      setNotice('Projet dupliqué.')
    })
  }, [loadProject, runMutation])

  const editProject = useCallback((projectId) => {
    const current = projects.find((project) => project.id === projectId)
    if (!current) return

    const nextName = window.prompt('Nouveau nom du projet', current.name)
    if (!nextName || nextName.trim() === '') return

    runMutation(async () => {
      await apiRequest(`/api/v1/design/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: nextName.trim() }),
      })

      if (projectDetail?.project?.id === projectId) {
        await loadProject(projectId)
      }

      setNotice('Projet mis à jour.')
    })
  }, [loadProject, projectDetail?.project?.id, projects, runMutation])

  const dashboardProps = useMemo(() => ({
    projects,
    stats,
    templates,
    onViewProject: viewProject,
    onEditProject: editProject,
    onDeleteProject: deleteProject,
    onCreateProject: openCreateModal,
    onDuplicateProject: duplicateProject,
  }), [deleteProject, duplicateProject, editProject, openCreateModal, projects, stats, templates, viewProject])

  const currentProjectId = projectDetail?.project?.id

  const detailActions = useMemo(() => {
    if (!currentProjectId) return null

    return {
      refresh: () => loadProject(currentProjectId),
      updateName: () => editProject(currentProjectId),
      addTeamMember: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/team-members`, { method: 'POST', body: JSON.stringify({
        member_id: `member-${Math.random().toString(36).slice(2, 8)}`,
        member_name: values.member_name,
        member_email: values.member_email,
        role: values.role,
        is_paid: values.is_paid,
      }) }), { refreshProjectId: currentProjectId }),
      removeTeamMember: (id) => {
        const member = projectDetail?.teamMembers?.find((m) => m.id === id)
        setDeleteConfirm({
          title: 'Supprimer ce membre d\u2019équipe ?',
          message: `« ${member?.memberName || ''} » sera retiré de l\u2019équipe définitivement.`,
          action: () => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/team-members/${id}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
        })
      },
      addTimesheet: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/timesheets`, { method: 'POST', body: JSON.stringify({
        member_id: `member-${Math.random().toString(36).slice(2, 8)}`,
        member_name: values.member_name,
        date: new Date().toISOString().slice(0, 10),
        hours: values.hours,
        phase: values.phase,
        mode: values.mode,
        travel_km: values.travel_km,
        notes: values.notes,
      }) }), { refreshProjectId: currentProjectId }),
      deleteTimesheet: (id) => {
        const ts = projectDetail?.timesheets?.find((t) => t.id === id)
        setDeleteConfirm({
          title: 'Supprimer cette prestation ?',
          message: `La prestation de « ${ts?.memberName || ''} » sera supprimée définitivement.`,
          action: () => runMutation(() => apiRequest(`/api/v1/design/timesheets/${id}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
        })
      },
      addExpense: () => {},
      expenseSubmit: async (payload) => {
        const isEdit = Boolean(payload.id)
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
          training_id: payload.training_id || null,
          design_project_id: payload.design_project_id || currentProjectId || null,
        }
        const url = isEdit
          ? `/api/v1/design/expenses/${payload.id}`
          : `/api/v1/design/${currentProjectId}/expenses`
        if (documentFile) {
          const formData = new FormData()
          Object.entries(body).forEach(([k, v]) => {
            if (v === null || v === undefined) return
            if (Array.isArray(v)) v.forEach((x) => formData.append(`${k}[]`, x))
            else formData.append(k, v)
          })
          if (documentFile instanceof File) formData.append('document', documentFile)
          await runMutation(() => apiRequest(url, { method: isEdit ? 'PATCH' : 'POST', body: formData }), { refreshProjectId: currentProjectId })
        } else {
          await runMutation(() => apiRequest(url, { method: isEdit ? 'PATCH' : 'POST', body: JSON.stringify(body) }), { refreshProjectId: currentProjectId })
        }
      },
      approveExpense: (id) => runMutation(() => apiRequest(`/api/v1/design/expenses/${id}/approve`, { method: 'PATCH' }), { refreshProjectId: currentProjectId }),
      deleteExpense: (id) => {
        const expense = projectDetail?.expenses?.find((e) => e.id === id)
        setDeleteConfirm({
          title: 'Supprimer cette dépense ?',
          message: `La dépense « ${expense?.supplier || ''} » sera supprimée définitivement.`,
          action: () => runMutation(() => apiRequest(`/api/v1/design/expenses/${id}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
        })
      },
      saveSiteAnalysis: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/site-analysis`, { method: 'PATCH', body: JSON.stringify({
        climate: { hardinessZone: values.hardinessZone, notes: values.notes },
        soil: { type: values.soilType },
      }) }), { refreshProjectId: currentProjectId }),
      addPaletteItem: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/palette-items`, { method: 'POST', body: JSON.stringify({
        species_id: values.species_id,
        species_name: values.species_name,
        common_name: values.common_name,
        layer: values.layer,
        quantity: values.quantity,
        unit_price: values.unit_price,
        notes: '',
        harvest_months: [],
        harvest_products: [],
      }) }), { refreshProjectId: currentProjectId }),
      deletePaletteItem: (id) => {
        const item = projectDetail?.plantPalette?.items?.find((i) => i.id === id)
        setDeleteConfirm({
          title: 'Supprimer cet élément de palette ?',
          message: `« ${item?.speciesName || ''} » sera supprimé définitivement.`,
          action: () => runMutation(() => apiRequest(`/api/v1/design/palette-items/${id}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
        })
      },
      importPlantPalette: (paletteId) => {
        if (!paletteId) return
        return runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/palette/import/${paletteId}`, { method: 'POST' }), { refreshProjectId: currentProjectId })
      },
      savePlantingPlan: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/planting-plan`, { method: 'PATCH', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
      exportPlan: (format) => runMutation(async () => {
        const payload = await apiRequest(`/api/v1/design/${currentProjectId}/planting-plan/export`, { method: 'POST', body: JSON.stringify({ format }) })
        if (payload?.exportUrl) window.open(payload.exportUrl, '_blank', 'noopener,noreferrer')
      }, { refreshDashboard: false, refreshProjectId: null }),
      addPlantMarker: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/planting-plan/markers`, { method: 'POST', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
      movePlantMarker: (markerId, values) => runMutation(() => apiRequest(`/api/v1/design/planting-plan/markers/${markerId}`, { method: 'PATCH', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
      deletePlantMarker: (markerId) => {
        const marker = (projectDetail?.plantingPlan?.markers || []).find((m) => m.id === markerId)
        setDeleteConfirm({
          title: 'Supprimer ce marqueur ?',
          message: `Le marqueur « ${marker?.speciesName || ''} » sera supprimé définitivement.`,
          action: () => runMutation(() => apiRequest(`/api/v1/design/planting-plan/markers/${markerId}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
        })
      },
      createQuote: () => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/quotes`, { method: 'POST' }), { refreshProjectId: currentProjectId }),
      sendQuote: (quoteId) => runMutation(() => apiRequest(`/api/v1/design/quotes/${quoteId}/send`, { method: 'PATCH' }), { refreshProjectId: currentProjectId }),
      deleteQuote: (quoteId) => {
        const quote = projectDetail?.quotes?.find((q) => q.id === quoteId)
        setDeleteConfirm({
          title: 'Supprimer ce devis ?',
          message: `Le devis « ${quote?.title || ''} » sera supprimé définitivement.`,
          action: () => runMutation(() => apiRequest(`/api/v1/design/quotes/${quoteId}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
        })
      },
      addQuoteLine: (quoteId, values) => runMutation(() => apiRequest(`/api/v1/design/quotes/${quoteId}/lines`, { method: 'POST', body: JSON.stringify({
        description: values.description,
        quantity: values.quantity,
        unit: values.unit,
        unit_price: values.unit_price,
      }) }), { refreshProjectId: currentProjectId }),
      deleteQuoteLine: (lineId) => {
        setDeleteConfirm({
          title: 'Supprimer cette ligne de devis ?',
          message: 'Cette ligne de devis sera supprimée définitivement.',
          action: () => runMutation(() => apiRequest(`/api/v1/design/quote-lines/${lineId}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
        })
      },
      addDocument: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/documents`, { method: 'POST', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
      deleteDocument: (documentId) => {
        const doc = projectDetail?.documents?.find((d) => d.id === documentId)
        setDeleteConfirm({
          title: 'Supprimer ce document ?',
          message: `Le document « ${doc?.name || ''} » sera supprimé définitivement.`,
          action: () => runMutation(() => apiRequest(`/api/v1/design/documents/${documentId}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
        })
      },
      addMedia: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/media`, { method: 'POST', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
      deleteMedia: (mediaId) => {
        const media = projectDetail?.mediaItems?.find((m) => m.id === mediaId)
        setDeleteConfirm({
          title: 'Supprimer ce média ?',
          message: `Le média « ${media?.caption || ''} » sera supprimé définitivement.`,
          action: () => runMutation(() => apiRequest(`/api/v1/design/media/${mediaId}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
        })
      },
      addMeeting: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/meetings`, { method: 'POST', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
      deleteMeeting: (meetingId) => {
        const meeting = projectDetail?.meetings?.find((m) => m.id === meetingId)
        setDeleteConfirm({
          title: 'Supprimer cette réunion ?',
          message: `La réunion « ${meeting?.title || ''} » sera supprimée définitivement.`,
          action: () => runMutation(() => apiRequest(`/api/v1/design/meetings/${meetingId}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
        })
      },
      addAnnotation: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/annotations`, { method: 'POST', body: JSON.stringify({
        ...values,
        author_id: `member-${Math.random().toString(36).slice(2, 8)}`,
      }) }), { refreshProjectId: currentProjectId }),
      resolveAnnotation: (annotationId) => runMutation(() => apiRequest(`/api/v1/design/annotations/${annotationId}/resolve`, { method: 'PATCH' }), { refreshProjectId: currentProjectId }),
      deleteAnnotation: (annotationId) => {
        const annotation = projectDetail?.annotations?.find((a) => a.id === annotationId)
        setDeleteConfirm({
          title: 'Supprimer cette annotation ?',
          message: `L\u2019annotation « ${annotation?.content?.slice(0, 40) || ''} » sera supprimée définitivement.`,
          action: () => runMutation(() => apiRequest(`/api/v1/design/annotations/${annotationId}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
        })
      },
      addPlantRecord: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/plant-records`, { method: 'POST', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
      updatePlantRecord: (recordId, values) => runMutation(() => apiRequest(`/api/v1/design/plant-records/${recordId}`, { method: 'PATCH', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
      addFollowUpVisit: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/follow-up-visits`, { method: 'POST', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
      addIntervention: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/interventions`, { method: 'POST', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
      updateHarvestCalendar: (month, items) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/harvest-calendar`, { method: 'PATCH', body: JSON.stringify({ month, items }) }), { refreshProjectId: currentProjectId }),
      updateMaintenanceCalendar: (month, items) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/maintenance-calendar`, { method: 'PATCH', body: JSON.stringify({ month, items }) }), { refreshProjectId: currentProjectId }),
      search: async (query) => {
        if (!query || !query.trim()) {
          setSearchResults([])
          return
        }
        const payload = await apiRequest(`/api/v1/design/${currentProjectId}/search?q=${encodeURIComponent(query)}`)
        setSearchResults(payload.results || [])
      },
    }
  }, [currentProjectId, editProject, projectDetail, runMutation, loadProject])

  useEffect(() => {
    if (!paletteIdFromQuery || !currentProjectId || !detailActions) return
    detailActions.importPlantPalette(paletteIdFromQuery)
  }, [currentProjectId, detailActions, paletteIdFromQuery])

  const projectDetailActions = useMemo(() => {
    if (!detailActions) return null
    const noop = () => {}
    const noopAsync = async () => {}
    return {
      onBack: () => {
        setProjectDetail(null)
        window.history.pushState({}, '', '/design')
      },
      onRefresh: detailActions.refresh || noop,
      onUpdateName: detailActions.updateName || noop,
      onAddTeamMember: detailActions.addTeamMember || noop,
      onRemoveTeamMember: detailActions.removeTeamMember || noop,
      onAddTimesheet: detailActions.addTimesheet || noop,
      onDeleteTimesheet: detailActions.deleteTimesheet || noop,
      onOpenExpenseAdd: () => setExpenseModal({ expense: null }),
      onEditExpense: (expense) => setExpenseModal({ expense }),
      onApproveExpense: detailActions.approveExpense || noop,
      onDeleteExpense: detailActions.deleteExpense || noop,
      onSaveSiteAnalysis: detailActions.saveSiteAnalysis || noop,
      onAddPaletteItem: detailActions.addPaletteItem || noop,
      onDeletePaletteItem: detailActions.deletePaletteItem || noop,
      onImportPlantPalette: detailActions.importPlantPalette || noop,
      onSavePlantingPlan: detailActions.savePlantingPlan || noop,
      onExportPlan: detailActions.exportPlan || noop,
      onAddPlantMarker: detailActions.addPlantMarker || noop,
      onMovePlantMarker: detailActions.movePlantMarker || noop,
      onDeletePlantMarker: detailActions.deletePlantMarker || noop,
      onCreateQuote: detailActions.createQuote || noop,
      onSendQuote: detailActions.sendQuote || noop,
      onDeleteQuote: detailActions.deleteQuote || noop,
      onAddQuoteLine: detailActions.addQuoteLine || noop,
      onDeleteQuoteLine: detailActions.deleteQuoteLine || noop,
      onAddDocument: detailActions.addDocument || noop,
      onDeleteDocument: detailActions.deleteDocument || noop,
      onAddMedia: detailActions.addMedia || noop,
      onDeleteMedia: detailActions.deleteMedia || noop,
      onAddMeeting: detailActions.addMeeting || noop,
      onDeleteMeeting: detailActions.deleteMeeting || noop,
      onAddAnnotation: detailActions.addAnnotation || noop,
      onResolveAnnotation: detailActions.resolveAnnotation || noop,
      onDeleteAnnotation: detailActions.deleteAnnotation || noop,
      onAddPlantRecord: detailActions.addPlantRecord || noop,
      onUpdatePlantRecord: detailActions.updatePlantRecord || noop,
      onAddFollowUpVisit: detailActions.addFollowUpVisit || noop,
      onAddIntervention: detailActions.addIntervention || noop,
      onUpdateHarvestCalendar: detailActions.updateHarvestCalendar || noop,
      onUpdateMaintenanceCalendar: detailActions.updateMaintenanceCalendar || noop,
      onSearch: detailActions.search || noopAsync,
    }
  }, [detailActions])

  if (loading || !stats) {
    return <div className="flex items-center justify-center h-full p-8"><p className="text-stone-500">Chargement Design Studio...</p></div>
  }

  return (
    <>
      {projectDetail ? (
        projectDetailActions && (
          <ProjectDetailView
            detail={projectDetail}
            busy={busy}
            actions={projectDetailActions}
            searchResults={searchResults}
          />
        )
      ) : (
        <ProjectDashboard {...dashboardProps} />
      )}

      {expenseModal && (
        <ExpenseFormModal
          expense={expenseModal.expense}
          defaultDesignProjectId={projectDetail?.project?.id}
          fetchContacts={() => apiRequest('/api/v1/lab/contacts')}
          onCreateContact={async ({ name, contact_type }) => {
            const contact = await apiRequest('/api/v1/lab/contacts', {
              method: 'POST',
              body: JSON.stringify({ name, contact_type }),
            })
            return { id: contact.id, name: contact.name, contactType: contact.contactType }
          }}
          trainingOptions={[]}
          designProjectOptions={[]}
          showTrainingLink={true}
          showDesignProjectLink={true}
          accentColor="#AFBD00"
          onSubmit={async (payload) => {
            if (detailActions?.expenseSubmit) await detailActions.expenseSubmit(payload)
            setExpenseModal(null)
          }}
          onCancel={() => setExpenseModal(null)}
          busy={busy}
        />
      )}

      {(error || notice || busy) && (
        <div className="fixed bottom-4 right-4 z-40 space-y-2">
          {busy && <div className="rounded-lg bg-stone-900 text-white text-xs px-3 py-2">Synchronisation...</div>}
          {error && <div className="rounded-lg bg-red-600 text-white text-sm px-3 py-2">{error}</div>}
          {notice && (
            <div className="rounded-lg bg-emerald-600 text-white text-sm px-3 py-2">
              {notice}
              <button className="ml-3 underline" onClick={() => setNotice(null)}>Fermer</button>
            </div>
          )}
        </div>
      )}

      <ProjectModal
        open={projectModalOpen}
        busy={busy}
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        values={projectForm}
        onChange={updateForm}
        onClose={() => setProjectModalOpen(false)}
        onSubmit={submitCreate}
      />

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
