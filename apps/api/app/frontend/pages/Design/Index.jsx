import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ProjectDashboard } from '../../design-studio/components'

const DETAIL_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'team', label: 'Team' },
  { id: 'timesheets', label: 'Timesheets' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'site-analysis', label: 'Site Analysis' },
  { id: 'palette', label: 'Palette' },
]

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`
    try {
      const data = await response.json()
      if (data?.error) message = data.error
    } catch (_) {
      // no-op
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

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
        <div className="w-full max-w-xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-200">
            <h2 className="text-lg font-semibold text-stone-900">Nouveau projet Design Studio</h2>
          </div>

          <form
            className="p-5 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              onSubmit()
            }}
          >
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

            <div className="mt-2 flex justify-end gap-2">
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

function ProjectDetail({ detail, busy, onBack, onRefresh, onUpdateName, onAddTeamMember, onRemoveTeamMember, onAddTimesheet, onDeleteTimesheet, onAddExpense, onApproveExpense, onDeleteExpense, onSaveSiteAnalysis, onAddPaletteItem, onDeletePaletteItem, onImportPlantPalette }) {
  const [tab, setTab] = useState('overview')
  const [teamForm, setTeamForm] = useState({ member_name: '', member_email: '', role: 'designer', is_paid: true })
  const [timesheetForm, setTimesheetForm] = useState({ member_name: '', hours: 2, phase: detail.project.phase, mode: 'billed', travel_km: 0, notes: '' })
  const [expenseForm, setExpenseForm] = useState({ amount: 50, category: 'plants', description: '', phase: detail.project.phase, member_name: '' })
  const [analysisForm, setAnalysisForm] = useState({ hardinessZone: detail.siteAnalysis?.climate?.hardinessZone || '', soilType: detail.siteAnalysis?.soil?.type || '', notes: detail.siteAnalysis?.climate?.notes || '' })
  const [paletteForm, setPaletteForm] = useState({ species_id: '', species_name: '', common_name: '', layer: 'shrub', quantity: 1, unit_price: 0 })
  const [importPaletteId, setImportPaletteId] = useState('')

  const project = detail.project

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={onBack} className="px-3 py-2 rounded-lg border border-stone-300 text-sm text-stone-700 hover:bg-stone-100">Retour dashboard</button>
          <button onClick={onRefresh} className="px-3 py-2 rounded-lg border border-stone-300 text-sm text-stone-700 hover:bg-stone-100">Rafraîchir</button>
          {busy && <span className="text-xs text-stone-500">Mise à jour...</span>}
        </div>

        <header className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Milestone 4</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <h1 className="text-2xl font-semibold text-stone-900">{project.name}</h1>
            <button onClick={onUpdateName} className="px-2 py-1 text-xs rounded border border-stone-300">Renommer</button>
          </div>
          <p className="text-stone-600">{project.clientName} · {project.address}</p>
        </header>

        <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {DETAIL_TABS.map((item) => (
              <button key={item.id} onClick={() => setTab(item.id)} className={`px-3 py-2 rounded-lg text-sm ${tab === item.id ? 'bg-[#AFBD00] text-stone-900 font-medium' : 'bg-stone-100 text-stone-700'}`}>
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="grid sm:grid-cols-2 gap-3 text-sm text-stone-700">
              <div className="rounded-xl bg-stone-100 p-3">Phase: {project.phase}</div>
              <div className="rounded-xl bg-stone-100 p-3">Status: {project.status}</div>
              <div className="rounded-xl bg-stone-100 p-3">Surface: {project.area} m²</div>
              <div className="rounded-xl bg-stone-100 p-3">Budget heures: {project.budget.hoursWorked}/{project.budget.hoursPlanned}</div>
            </div>
          )}

          {tab === 'team' && (
            <div className="space-y-3">
              <form className="grid sm:grid-cols-5 gap-2" onSubmit={(event) => { event.preventDefault(); onAddTeamMember(teamForm); setTeamForm({ member_name: '', member_email: '', role: 'designer', is_paid: true }) }}>
                <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Nom" value={teamForm.member_name} onChange={(e) => setTeamForm((p) => ({ ...p, member_name: e.target.value }))} required />
                <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Email" value={teamForm.member_email} onChange={(e) => setTeamForm((p) => ({ ...p, member_email: e.target.value }))} />
                <select className="rounded border border-stone-300 px-2 py-1 text-sm" value={teamForm.role} onChange={(e) => setTeamForm((p) => ({ ...p, role: e.target.value }))}>
                  <option value="project-manager">project-manager</option>
                  <option value="designer">designer</option>
                  <option value="butineur">butineur</option>
                </select>
                <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={teamForm.is_paid} onChange={(e) => setTeamForm((p) => ({ ...p, is_paid: e.target.checked }))} /> Payé</label>
                <button className="rounded bg-[#AFBD00] px-2 py-1 text-sm font-medium">Ajouter</button>
              </form>

              {detail.teamMembers.length === 0 ? <p className="text-sm text-stone-500">Aucun membre assigné.</p> : detail.teamMembers.map((member) => (
                <div key={member.id} className="rounded border border-stone-200 p-2 flex items-center justify-between text-sm">
                  <span>{member.memberName} · {member.role} · {member.isPaid ? 'payé' : 'bénévole'}</span>
                  <button className="text-red-600" onClick={() => onRemoveTeamMember(member.id)}>Retirer</button>
                </div>
              ))}
            </div>
          )}

          {tab === 'timesheets' && (
            <div className="space-y-3">
              <form className="grid sm:grid-cols-6 gap-2" onSubmit={(event) => { event.preventDefault(); onAddTimesheet(timesheetForm); setTimesheetForm((p) => ({ ...p, notes: '' })) }}>
                <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Membre" value={timesheetForm.member_name} onChange={(e) => setTimesheetForm((p) => ({ ...p, member_name: e.target.value }))} required />
                <input type="number" step="0.5" min="0.5" className="rounded border border-stone-300 px-2 py-1 text-sm" value={timesheetForm.hours} onChange={(e) => setTimesheetForm((p) => ({ ...p, hours: Number(e.target.value || 0) }))} />
                <select className="rounded border border-stone-300 px-2 py-1 text-sm" value={timesheetForm.phase} onChange={(e) => setTimesheetForm((p) => ({ ...p, phase: e.target.value }))}>
                  <option>offre</option><option>pre-projet</option><option>projet-detaille</option><option>mise-en-oeuvre</option><option>co-gestion</option>
                </select>
                <select className="rounded border border-stone-300 px-2 py-1 text-sm" value={timesheetForm.mode} onChange={(e) => setTimesheetForm((p) => ({ ...p, mode: e.target.value }))}>
                  <option value="billed">billed</option><option value="semos">semos</option>
                </select>
                <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Notes" value={timesheetForm.notes} onChange={(e) => setTimesheetForm((p) => ({ ...p, notes: e.target.value }))} />
                <button className="rounded bg-[#AFBD00] px-2 py-1 text-sm font-medium">Ajouter</button>
              </form>

              {detail.timesheets.length === 0 ? <p className="text-sm text-stone-500">Aucun timesheet.</p> : detail.timesheets.map((item) => (
                <div key={item.id} className="rounded border border-stone-200 p-2 flex items-center justify-between text-sm">
                  <span>{item.date} · {item.memberName} · {item.hours}h · {item.mode}</span>
                  <button className="text-red-600" onClick={() => onDeleteTimesheet(item.id)}>Supprimer</button>
                </div>
              ))}
            </div>
          )}

          {tab === 'expenses' && (
            <div className="space-y-3">
              <form className="grid sm:grid-cols-6 gap-2" onSubmit={(event) => { event.preventDefault(); onAddExpense(expenseForm); setExpenseForm((p) => ({ ...p, description: '' })) }}>
                <input type="number" min="0" step="0.01" className="rounded border border-stone-300 px-2 py-1 text-sm" value={expenseForm.amount} onChange={(e) => setExpenseForm((p) => ({ ...p, amount: Number(e.target.value || 0) }))} />
                <select className="rounded border border-stone-300 px-2 py-1 text-sm" value={expenseForm.category} onChange={(e) => setExpenseForm((p) => ({ ...p, category: e.target.value }))}>
                  <option value="plants">plants</option><option value="material">material</option><option value="travel">travel</option><option value="services">services</option><option value="other">other</option>
                </select>
                <select className="rounded border border-stone-300 px-2 py-1 text-sm" value={expenseForm.phase} onChange={(e) => setExpenseForm((p) => ({ ...p, phase: e.target.value }))}>
                  <option>offre</option><option>pre-projet</option><option>projet-detaille</option><option>mise-en-oeuvre</option><option>co-gestion</option>
                </select>
                <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Membre" value={expenseForm.member_name} onChange={(e) => setExpenseForm((p) => ({ ...p, member_name: e.target.value }))} />
                <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Description" value={expenseForm.description} onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))} required />
                <button className="rounded bg-[#AFBD00] px-2 py-1 text-sm font-medium">Ajouter</button>
              </form>

              {detail.expenses.length === 0 ? <p className="text-sm text-stone-500">Aucune dépense.</p> : detail.expenses.map((item) => (
                <div key={item.id} className="rounded border border-stone-200 p-2 flex items-center justify-between text-sm gap-2">
                  <span>{item.date} · {item.amount}€ · {item.category} · {item.status}</span>
                  <div className="flex items-center gap-2">
                    {item.status !== 'approved' && <button className="text-emerald-700" onClick={() => onApproveExpense(item.id)}>Approuver</button>}
                    <button className="text-red-600" onClick={() => onDeleteExpense(item.id)}>Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'site-analysis' && (
            <form className="grid sm:grid-cols-3 gap-2" onSubmit={(event) => { event.preventDefault(); onSaveSiteAnalysis(analysisForm) }}>
              <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Zone rusticité" value={analysisForm.hardinessZone} onChange={(e) => setAnalysisForm((p) => ({ ...p, hardinessZone: e.target.value }))} />
              <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Type sol" value={analysisForm.soilType} onChange={(e) => setAnalysisForm((p) => ({ ...p, soilType: e.target.value }))} />
              <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Notes" value={analysisForm.notes} onChange={(e) => setAnalysisForm((p) => ({ ...p, notes: e.target.value }))} />
              <button className="sm:col-span-3 rounded bg-[#AFBD00] px-3 py-2 text-sm font-medium">Sauvegarder analyse</button>
            </form>
          )}

          {tab === 'palette' && (
            <div className="space-y-3">
              <form className="grid sm:grid-cols-7 gap-2" onSubmit={(event) => { event.preventDefault(); onAddPaletteItem(paletteForm); setPaletteForm((p) => ({ ...p, species_name: '', common_name: '' })) }}>
                <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Species ID" value={paletteForm.species_id} onChange={(e) => setPaletteForm((p) => ({ ...p, species_id: e.target.value }))} required />
                <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Nom latin" value={paletteForm.species_name} onChange={(e) => setPaletteForm((p) => ({ ...p, species_name: e.target.value }))} required />
                <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Nom commun" value={paletteForm.common_name} onChange={(e) => setPaletteForm((p) => ({ ...p, common_name: e.target.value }))} />
                <select className="rounded border border-stone-300 px-2 py-1 text-sm" value={paletteForm.layer} onChange={(e) => setPaletteForm((p) => ({ ...p, layer: e.target.value }))}>
                  <option value="canopy">canopy</option><option value="sub-canopy">sub-canopy</option><option value="shrub">shrub</option><option value="herbaceous">herbaceous</option><option value="ground-cover">ground-cover</option><option value="vine">vine</option><option value="root">root</option>
                </select>
                <input type="number" min="1" className="rounded border border-stone-300 px-2 py-1 text-sm" value={paletteForm.quantity} onChange={(e) => setPaletteForm((p) => ({ ...p, quantity: Number(e.target.value || 1) }))} />
                <input type="number" min="0" step="0.01" className="rounded border border-stone-300 px-2 py-1 text-sm" value={paletteForm.unit_price} onChange={(e) => setPaletteForm((p) => ({ ...p, unit_price: Number(e.target.value || 0) }))} />
                <button className="rounded bg-[#AFBD00] px-2 py-1 text-sm font-medium">Ajouter</button>
              </form>

              <div className="flex gap-2">
                <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Plant Palette ID" value={importPaletteId} onChange={(e) => setImportPaletteId(e.target.value)} />
                <button className="rounded border border-stone-300 px-2 py-1 text-sm" onClick={() => onImportPlantPalette(importPaletteId)} type="button">Importer depuis Plant DB</button>
              </div>

              {detail.plantPalette?.items?.length ? detail.plantPalette.items.map((item) => (
                <div key={item.id} className="rounded border border-stone-200 p-2 flex items-center justify-between text-sm">
                  <span>{item.speciesName} · {item.layer} · x{item.quantity} · {item.unitPrice}€</span>
                  <button className="text-red-600" onClick={() => onDeletePaletteItem(item.id)}>Supprimer</button>
                </div>
              )) : <p className="text-sm text-stone-500">Palette vide.</p>}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default function DesignIndex({ initialProjectId }) {
  const paletteIdFromQuery = new URLSearchParams(window.location.search).get('palette_id')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState(null)
  const [templates, setTemplates] = useState([])

  const [projectDetail, setProjectDetail] = useState(null)

  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [projectForm, setProjectForm] = useState(defaultProjectForm)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)

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
          window.history.replaceState({}, '', `/app/design/${initialProjectId}`)
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
      window.history.pushState({}, '', `/app/design/${created.id}`)
      setNotice('Projet créé.')
    })

    if (success) setProjectModalOpen(false)
  }, [projectForm, runMutation, selectedTemplateId, loadProject])

  const viewProject = useCallback(async (projectId) => {
    const success = await runMutation(async () => {
      await loadProject(projectId)
      window.history.pushState({}, '', `/app/design/${projectId}`)
    }, { refreshDashboard: false })

    if (!success) return
  }, [loadProject, runMutation])

  const deleteProject = useCallback((projectId) => {
    if (!window.confirm('Supprimer ce projet ?')) return

    runMutation(async () => {
      await apiRequest(`/api/v1/design/${projectId}`, { method: 'DELETE' })
      if (projectDetail?.project?.id === projectId) {
        setProjectDetail(null)
        window.history.pushState({}, '', '/app/design')
      }
      setNotice('Projet supprimé.')
    })
  }, [projectDetail?.project?.id, runMutation])

  const duplicateProject = useCallback((projectId) => {
    runMutation(async () => {
      const created = await apiRequest(`/api/v1/design/${projectId}/duplicate`, { method: 'POST' })
      await loadProject(created.id)
      window.history.pushState({}, '', `/app/design/${created.id}`)
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
      removeTeamMember: (id) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/team-members/${id}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
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
      deleteTimesheet: (id) => runMutation(() => apiRequest(`/api/v1/design/timesheets/${id}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
      addExpense: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/expenses`, { method: 'POST', body: JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        amount: values.amount,
        category: values.category,
        description: values.description,
        phase: values.phase,
        member_id: `member-${Math.random().toString(36).slice(2, 8)}`,
        member_name: values.member_name,
        status: 'pending',
      }) }), { refreshProjectId: currentProjectId }),
      approveExpense: (id) => runMutation(() => apiRequest(`/api/v1/design/expenses/${id}/approve`, { method: 'PATCH' }), { refreshProjectId: currentProjectId }),
      deleteExpense: (id) => runMutation(() => apiRequest(`/api/v1/design/expenses/${id}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
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
      deletePaletteItem: (id) => runMutation(() => apiRequest(`/api/v1/design/palette-items/${id}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
      importPlantPalette: (paletteId) => {
        if (!paletteId) return
        return runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/palette/import/${paletteId}`, { method: 'POST' }), { refreshProjectId: currentProjectId })
      },
    }
  }, [currentProjectId, editProject, runMutation, loadProject])

  useEffect(() => {
    if (!paletteIdFromQuery || !currentProjectId || !detailActions) return
    detailActions.importPlantPalette(paletteIdFromQuery)
  }, [currentProjectId, detailActions, paletteIdFromQuery])

  if (loading || !stats) {
    return <main className="min-h-screen bg-stone-50 flex items-center justify-center">Chargement Design Studio...</main>
  }

  return (
    <>
      {projectDetail ? (
        <ProjectDetail
          detail={projectDetail}
          busy={busy}
          onBack={() => {
            setProjectDetail(null)
            window.history.pushState({}, '', '/app/design')
          }}
          onRefresh={detailActions?.refresh || (() => {})}
          onUpdateName={detailActions?.updateName || (() => {})}
          onAddTeamMember={detailActions?.addTeamMember || (() => {})}
          onRemoveTeamMember={detailActions?.removeTeamMember || (() => {})}
          onAddTimesheet={detailActions?.addTimesheet || (() => {})}
          onDeleteTimesheet={detailActions?.deleteTimesheet || (() => {})}
          onAddExpense={detailActions?.addExpense || (() => {})}
          onApproveExpense={detailActions?.approveExpense || (() => {})}
          onDeleteExpense={detailActions?.deleteExpense || (() => {})}
          onSaveSiteAnalysis={detailActions?.saveSiteAnalysis || (() => {})}
          onAddPaletteItem={detailActions?.addPaletteItem || (() => {})}
          onDeletePaletteItem={detailActions?.deletePaletteItem || (() => {})}
          onImportPlantPalette={detailActions?.importPlantPalette || (() => {})}
        />
      ) : (
        <ProjectDashboard {...dashboardProps} />
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
    </>
  )
}
