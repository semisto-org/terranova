import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { useShellNav } from '../../components/shell/ShellContext'
import { ProjectDashboard } from '../../design-studio/components'

const DETAIL_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'team', label: 'Team' },
  { id: 'timesheets', label: 'Timesheets' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'site-analysis', label: 'Site Analysis' },
  { id: 'palette', label: 'Palette' },
  { id: 'planting-plan', label: 'Planting Plan' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'documents', label: 'Documents' },
  { id: 'album', label: 'Album' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'co-gestion', label: 'Co-gestion' },
]

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

function ProjectDetail({
  detail,
  busy,
  onBack,
  onRefresh,
  onUpdateName,
  onAddTeamMember,
  onRemoveTeamMember,
  onAddTimesheet,
  onDeleteTimesheet,
  onAddExpense,
  onApproveExpense,
  onDeleteExpense,
  onSaveSiteAnalysis,
  onAddPaletteItem,
  onDeletePaletteItem,
  onImportPlantPalette,
  onSavePlantingPlan,
  onExportPlan,
  onAddPlantMarker,
  onMovePlantMarker,
  onDeletePlantMarker,
  onCreateQuote,
  onSendQuote,
  onDeleteQuote,
  onAddQuoteLine,
  onDeleteQuoteLine,
  onAddDocument,
  onDeleteDocument,
  onAddMedia,
  onDeleteMedia,
  onAddMeeting,
  onDeleteMeeting,
  onAddAnnotation,
  onResolveAnnotation,
  onDeleteAnnotation,
  onAddPlantRecord,
  onUpdatePlantRecord,
  onAddFollowUpVisit,
  onAddIntervention,
  onUpdateHarvestCalendar,
  onUpdateMaintenanceCalendar,
  onSearch,
  searchResults,
}) {
  const [tab, setTab] = useState('overview')
  const [teamForm, setTeamForm] = useState({ member_name: '', member_email: '', role: 'designer', is_paid: true })
  const [timesheetForm, setTimesheetForm] = useState({ member_name: '', hours: 2, phase: detail.project.phase, mode: 'billed', travel_km: 0, notes: '' })
  const [expenseForm, setExpenseForm] = useState({ amount: 50, category: 'plants', description: '', phase: detail.project.phase, member_name: '' })
  const [analysisForm, setAnalysisForm] = useState({ hardinessZone: detail.siteAnalysis?.climate?.hardinessZone || '', soilType: detail.siteAnalysis?.soil?.type || '', notes: detail.siteAnalysis?.climate?.notes || '' })
  const [paletteForm, setPaletteForm] = useState({ species_id: '', species_name: '', common_name: '', layer: 'shrub', quantity: 1, unit_price: 0 })
  const [quoteLineForm, setQuoteLineForm] = useState({ description: '', quantity: 1, unit: 'u', unit_price: 0 })
  const [documentForm, setDocumentForm] = useState({ category: 'plan', name: '', url: '', size: 0, uploaded_by: 'team' })
  const [mediaForm, setMediaForm] = useState({ media_type: 'image', url: '', thumbnail_url: '', caption: '', uploaded_by: 'team' })
  const [meetingForm, setMeetingForm] = useState({ title: '', date: new Date().toISOString().slice(0, 10), time: '10:00', duration: 60, location: '' })
  const [annotationForm, setAnnotationForm] = useState({ document_id: '', x: 0.5, y: 0.5, author_name: 'Team', author_type: 'team', content: '' })
  const [planForm, setPlanForm] = useState({ image_url: detail.plantingPlan?.imageUrl || '', layout: detail.plantingPlan?.layout || 'split-3-4-1-4' })
  const [markerForm, setMarkerForm] = useState({ species_name: '', x: 0.5, y: 0.5, palette_item_id: '' })
  const [plantRecordForm, setPlantRecordForm] = useState({ marker_id: '', palette_item_id: '', status: 'alive', health_score: 100, notes: '' })
  const [visitForm, setVisitForm] = useState({ date: new Date().toISOString().slice(0, 10), visit_type: 'follow-up', notes: '' })
  const [interventionForm, setInterventionForm] = useState({ date: new Date().toISOString().slice(0, 10), intervention_type: 'mulching', notes: '', plant_record_id: '' })
  const [searchQuery, setSearchQuery] = useState('')
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
          <form
            className="mb-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              onSearch(searchQuery)
            }}
          >
            <input className="w-full rounded border border-stone-300 px-3 py-2 text-sm" placeholder="Rechercher dans le projet (devis, docs, annotations, co-gestion...)" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
            <button className="rounded border border-stone-300 px-3 py-2 text-sm">Rechercher</button>
          </form>

          {searchResults?.length > 0 && (
            <div className="mb-4 rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-1">
              {searchResults.map((item) => (
                <p key={item.id} className="text-xs text-stone-700">[{item.kind}] {item.excerpt}</p>
              ))}
            </div>
          )}

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

          {tab === 'planting-plan' && (
            <div className="space-y-3">
              <form className="grid sm:grid-cols-3 gap-2" onSubmit={(event) => {
                event.preventDefault()
                onSavePlantingPlan(planForm)
              }}>
                <input className="sm:col-span-2 rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Image plan URL" value={planForm.image_url} onChange={(event) => setPlanForm((prev) => ({ ...prev, image_url: event.target.value }))} />
                <select className="rounded border border-stone-300 px-2 py-1 text-sm" value={planForm.layout} onChange={(event) => setPlanForm((prev) => ({ ...prev, layout: event.target.value }))}>
                  <option value="split-3-4-1-4">split-3-4-1-4</option>
                  <option value="full">full</option>
                </select>
                <button className="sm:col-span-3 rounded bg-[#AFBD00] px-3 py-2 text-sm font-medium">Sauvegarder plan</button>
              </form>

              {detail.plantingPlan?.imageUrl ? (
                <a className="text-sm text-indigo-700 underline" href={detail.plantingPlan.imageUrl} target="_blank" rel="noreferrer">Voir image plan</a>
              ) : (
                <p className="text-sm text-stone-500">Aucune image plan.</p>
              )}

              <div className="flex gap-2">
                <button className="rounded border border-stone-300 px-3 py-2 text-sm" type="button" onClick={() => onExportPlan('pdf')}>Exporter PDF</button>
                <button className="rounded border border-stone-300 px-3 py-2 text-sm" type="button" onClick={() => onExportPlan('image')}>Exporter image</button>
              </div>

              <form className="grid sm:grid-cols-5 gap-2" onSubmit={(event) => {
                event.preventDefault()
                onAddPlantMarker(markerForm)
                setMarkerForm({ species_name: '', x: 0.5, y: 0.5, palette_item_id: '' })
              }}>
                <input className="sm:col-span-2 rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Espèce" value={markerForm.species_name} onChange={(event) => setMarkerForm((prev) => ({ ...prev, species_name: event.target.value }))} required />
                <input type="number" min="0" max="1" step="0.01" className="rounded border border-stone-300 px-2 py-1 text-sm" value={markerForm.x} onChange={(event) => setMarkerForm((prev) => ({ ...prev, x: Number(event.target.value || 0) }))} />
                <input type="number" min="0" max="1" step="0.01" className="rounded border border-stone-300 px-2 py-1 text-sm" value={markerForm.y} onChange={(event) => setMarkerForm((prev) => ({ ...prev, y: Number(event.target.value || 0) }))} />
                <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Palette item ID (optionnel)" value={markerForm.palette_item_id} onChange={(event) => setMarkerForm((prev) => ({ ...prev, palette_item_id: event.target.value }))} />
                <button className="sm:col-span-5 rounded border border-stone-300 px-3 py-2 text-sm">Ajouter marqueur</button>
              </form>

              {(detail.plantingPlan?.markers || []).length === 0 ? (
                <p className="text-sm text-stone-500">Aucun marqueur.</p>
              ) : (
                detail.plantingPlan.markers.map((marker) => (
                  <div key={marker.id} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between gap-2">
                    <span>#{marker.number} · {marker.speciesName} · ({marker.x}, {marker.y})</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-indigo-700"
                        onClick={() => {
                          const x = window.prompt('Nouvelle coordonnée x (0..1)', String(marker.x))
                          const y = window.prompt('Nouvelle coordonnée y (0..1)', String(marker.y))
                          if (x == null || y == null) return
                          onMovePlantMarker(marker.id, { x: Number(x), y: Number(y) })
                        }}
                      >
                        Déplacer
                      </button>
                      <button className="text-red-600" onClick={() => onDeletePlantMarker(marker.id)}>Supprimer</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'quotes' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button className="rounded bg-[#AFBD00] px-3 py-2 text-sm font-medium" onClick={onCreateQuote}>Nouveau devis</button>
                <a className="rounded border border-stone-300 px-3 py-2 text-sm" href={`/client/design/${project.id}`} target="_blank" rel="noreferrer">Ouvrir portail client</a>
              </div>

              {detail.quotes.length === 0 ? (
                <p className="text-sm text-stone-500">Aucun devis.</p>
              ) : (
                detail.quotes.map((quote) => (
                  <div key={quote.id} className="rounded-xl border border-stone-200 p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span>{quote.title} · v{quote.version} · {quote.status} · {quote.total}€</span>
                      <div className="flex gap-2">
                        {quote.status === 'draft' && <button className="text-indigo-700" onClick={() => onSendQuote(quote.id)}>Envoyer</button>}
                        <button className="text-red-600" onClick={() => onDeleteQuote(quote.id)}>Supprimer</button>
                      </div>
                    </div>

                    <form className="grid sm:grid-cols-5 gap-2" onSubmit={(event) => {
                      event.preventDefault()
                      onAddQuoteLine(quote.id, quoteLineForm)
                      setQuoteLineForm({ description: '', quantity: 1, unit: 'u', unit_price: 0 })
                    }}>
                      <input className="sm:col-span-2 rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Description" value={quoteLineForm.description} onChange={(event) => setQuoteLineForm((prev) => ({ ...prev, description: event.target.value }))} required />
                      <input type="number" min="0.01" step="0.01" className="rounded border border-stone-300 px-2 py-1 text-sm" value={quoteLineForm.quantity} onChange={(event) => setQuoteLineForm((prev) => ({ ...prev, quantity: Number(event.target.value || 0) }))} />
                      <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Unité" value={quoteLineForm.unit} onChange={(event) => setQuoteLineForm((prev) => ({ ...prev, unit: event.target.value }))} />
                      <input type="number" min="0" step="0.01" className="rounded border border-stone-300 px-2 py-1 text-sm" value={quoteLineForm.unit_price} onChange={(event) => setQuoteLineForm((prev) => ({ ...prev, unit_price: Number(event.target.value || 0) }))} />
                      <button className="sm:col-span-5 rounded border border-stone-300 px-2 py-1 text-sm">Ajouter ligne</button>
                    </form>

                    {(quote.lines || []).length === 0 ? (
                      <p className="text-sm text-stone-500">Aucune ligne.</p>
                    ) : (
                      quote.lines.map((line) => (
                        <div key={line.id} className="rounded border border-stone-200 px-2 py-1 text-sm flex items-center justify-between">
                          <span>{line.description} · {line.quantity} {line.unit} · {line.total}€</span>
                          <button className="text-red-600" onClick={() => onDeleteQuoteLine(line.id)}>Supprimer</button>
                        </div>
                      ))
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'documents' && (
            <div className="space-y-3">
              <form className="grid sm:grid-cols-6 gap-2" onSubmit={(event) => {
                event.preventDefault()
                onAddDocument(documentForm)
                setDocumentForm((prev) => ({ ...prev, name: '', url: '', size: 0 }))
              }}>
                <select className="rounded border border-stone-300 px-2 py-1 text-sm" value={documentForm.category} onChange={(event) => setDocumentForm((prev) => ({ ...prev, category: event.target.value }))}>
                  <option value="plan">plan</option>
                  <option value="quote">quote</option>
                  <option value="analysis">analysis</option>
                  <option value="other">other</option>
                </select>
                <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Nom" value={documentForm.name} onChange={(event) => setDocumentForm((prev) => ({ ...prev, name: event.target.value }))} required />
                <input className="sm:col-span-2 rounded border border-stone-300 px-2 py-1 text-sm" placeholder="URL" value={documentForm.url} onChange={(event) => setDocumentForm((prev) => ({ ...prev, url: event.target.value }))} required />
                <input type="number" min="0" className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Taille (bytes)" value={documentForm.size} onChange={(event) => setDocumentForm((prev) => ({ ...prev, size: Number(event.target.value || 0) }))} />
                <button className="rounded bg-[#AFBD00] px-2 py-1 text-sm font-medium">Ajouter</button>
              </form>

              {detail.documents.length === 0 ? (
                <p className="text-sm text-stone-500">Aucun document.</p>
              ) : (
                detail.documents.map((item) => (
                  <div key={item.id} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between gap-2">
                    <span>{item.category} · {item.name}</span>
                    <div className="flex items-center gap-2">
                      <a href={item.url} target="_blank" rel="noreferrer" className="text-indigo-700">Ouvrir</a>
                      <button className="text-red-600" onClick={() => onDeleteDocument(item.id)}>Supprimer</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'album' && (
            <div className="space-y-3">
              <form className="grid sm:grid-cols-6 gap-2" onSubmit={(event) => {
                event.preventDefault()
                onAddMedia(mediaForm)
                setMediaForm((prev) => ({ ...prev, url: '', thumbnail_url: '', caption: '' }))
              }}>
                <select className="rounded border border-stone-300 px-2 py-1 text-sm" value={mediaForm.media_type} onChange={(event) => setMediaForm((prev) => ({ ...prev, media_type: event.target.value }))}>
                  <option value="image">image</option>
                  <option value="video">video</option>
                </select>
                <input className="sm:col-span-2 rounded border border-stone-300 px-2 py-1 text-sm" placeholder="URL média" value={mediaForm.url} onChange={(event) => setMediaForm((prev) => ({ ...prev, url: event.target.value }))} required />
                <input className="sm:col-span-2 rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Thumbnail URL" value={mediaForm.thumbnail_url} onChange={(event) => setMediaForm((prev) => ({ ...prev, thumbnail_url: event.target.value }))} />
                <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Caption" value={mediaForm.caption} onChange={(event) => setMediaForm((prev) => ({ ...prev, caption: event.target.value }))} />
                <button className="sm:col-span-6 rounded bg-[#AFBD00] px-2 py-1 text-sm font-medium">Ajouter média</button>
              </form>

              {detail.mediaItems.length === 0 ? (
                <p className="text-sm text-stone-500">Album vide.</p>
              ) : (
                detail.mediaItems.map((item) => (
                  <div key={item.id} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between gap-2">
                    <span>{item.type} · {item.caption || 'sans légende'}</span>
                    <div className="flex items-center gap-2">
                      <a href={item.url} target="_blank" rel="noreferrer" className="text-indigo-700">Ouvrir</a>
                      <button className="text-red-600" onClick={() => onDeleteMedia(item.id)}>Supprimer</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'meetings' && (
            <div className="space-y-3">
              <form className="grid sm:grid-cols-5 gap-2" onSubmit={(event) => {
                event.preventDefault()
                onAddMeeting(meetingForm)
                setMeetingForm((prev) => ({ ...prev, title: '', location: '' }))
              }}>
                <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Titre" value={meetingForm.title} onChange={(event) => setMeetingForm((prev) => ({ ...prev, title: event.target.value }))} required />
                <input type="date" className="rounded border border-stone-300 px-2 py-1 text-sm" value={meetingForm.date} onChange={(event) => setMeetingForm((prev) => ({ ...prev, date: event.target.value }))} required />
                <input type="time" className="rounded border border-stone-300 px-2 py-1 text-sm" value={meetingForm.time} onChange={(event) => setMeetingForm((prev) => ({ ...prev, time: event.target.value }))} required />
                <input type="number" min="15" step="15" className="rounded border border-stone-300 px-2 py-1 text-sm" value={meetingForm.duration} onChange={(event) => setMeetingForm((prev) => ({ ...prev, duration: Number(event.target.value || 60) }))} />
                <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Lieu" value={meetingForm.location} onChange={(event) => setMeetingForm((prev) => ({ ...prev, location: event.target.value }))} />
                <button className="sm:col-span-5 rounded bg-[#AFBD00] px-2 py-1 text-sm font-medium">Planifier</button>
              </form>

              {detail.meetings.length === 0 ? (
                <p className="text-sm text-stone-500">Aucune réunion planifiée.</p>
              ) : (
                detail.meetings.map((item) => (
                  <div key={item.id} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between gap-2">
                    <span>{item.date} {item.time} · {item.title} · {item.location || 'sans lieu'}</span>
                    <button className="text-red-600" onClick={() => onDeleteMeeting(item.id)}>Supprimer</button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'co-gestion' && (
            <div className="space-y-4">
              <div className="rounded border border-stone-200 p-3">
                <p className="text-sm font-medium text-stone-800 mb-2">Suivi plantes</p>
                <form className="grid sm:grid-cols-5 gap-2" onSubmit={(event) => {
                  event.preventDefault()
                  onAddPlantRecord(plantRecordForm)
                  setPlantRecordForm({ marker_id: '', palette_item_id: '', status: 'alive', health_score: 100, notes: '' })
                }}>
                  <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Marker ID (optionnel)" value={plantRecordForm.marker_id} onChange={(event) => setPlantRecordForm((prev) => ({ ...prev, marker_id: event.target.value }))} />
                  <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Palette item ID (optionnel)" value={plantRecordForm.palette_item_id} onChange={(event) => setPlantRecordForm((prev) => ({ ...prev, palette_item_id: event.target.value }))} />
                  <select className="rounded border border-stone-300 px-2 py-1 text-sm" value={plantRecordForm.status} onChange={(event) => setPlantRecordForm((prev) => ({ ...prev, status: event.target.value }))}>
                    <option value="alive">alive</option>
                    <option value="dead">dead</option>
                    <option value="to-replace">to-replace</option>
                    <option value="replaced">replaced</option>
                  </select>
                  <input type="number" min="0" max="100" className="rounded border border-stone-300 px-2 py-1 text-sm" value={plantRecordForm.health_score} onChange={(event) => setPlantRecordForm((prev) => ({ ...prev, health_score: Number(event.target.value || 0) }))} />
                  <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Notes" value={plantRecordForm.notes} onChange={(event) => setPlantRecordForm((prev) => ({ ...prev, notes: event.target.value }))} />
                  <button className="sm:col-span-5 rounded border border-stone-300 px-3 py-2 text-sm">Ajouter plant record</button>
                </form>

                <div className="mt-3 space-y-2">
                  {(detail.plantFollowUp?.plantRecords || []).length === 0 ? (
                    <p className="text-sm text-stone-500">Aucun plant record.</p>
                  ) : (
                    detail.plantFollowUp.plantRecords.map((item) => (
                      <div key={item.id} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between gap-2">
                        <span>{item.status} · santé {item.healthScore}/100 · {item.notes || 'sans note'}</span>
                        <button
                          className="text-indigo-700"
                          onClick={() => {
                            const status = window.prompt('Nouveau status (alive/dead/to-replace/replaced)', item.status)
                            if (!status) return
                            onUpdatePlantRecord(item.id, { status })
                          }}
                        >
                          Changer status
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded border border-stone-200 p-3 space-y-2">
                  <p className="text-sm font-medium text-stone-800">Visites</p>
                  <form className="grid gap-2" onSubmit={(event) => {
                    event.preventDefault()
                    onAddFollowUpVisit(visitForm)
                    setVisitForm((prev) => ({ ...prev, notes: '' }))
                  }}>
                    <input type="date" className="rounded border border-stone-300 px-2 py-1 text-sm" value={visitForm.date} onChange={(event) => setVisitForm((prev) => ({ ...prev, date: event.target.value }))} required />
                    <select className="rounded border border-stone-300 px-2 py-1 text-sm" value={visitForm.visit_type} onChange={(event) => setVisitForm((prev) => ({ ...prev, visit_type: event.target.value }))}>
                      <option value="follow-up">follow-up</option>
                      <option value="intervention">intervention</option>
                      <option value="client-meeting">client-meeting</option>
                    </select>
                    <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Notes" value={visitForm.notes} onChange={(event) => setVisitForm((prev) => ({ ...prev, notes: event.target.value }))} />
                    <button className="rounded border border-stone-300 px-3 py-2 text-sm">Ajouter visite</button>
                  </form>
                  {(detail.plantFollowUp?.followUpVisits || []).map((item) => (
                    <p key={item.id} className="text-sm text-stone-700">{item.date} · {item.type} · {item.notes || '-'}</p>
                  ))}
                </div>

                <div className="rounded border border-stone-200 p-3 space-y-2">
                  <p className="text-sm font-medium text-stone-800">Interventions</p>
                  <form className="grid gap-2" onSubmit={(event) => {
                    event.preventDefault()
                    onAddIntervention(interventionForm)
                    setInterventionForm((prev) => ({ ...prev, notes: '' }))
                  }}>
                    <input type="date" className="rounded border border-stone-300 px-2 py-1 text-sm" value={interventionForm.date} onChange={(event) => setInterventionForm((prev) => ({ ...prev, date: event.target.value }))} required />
                    <select className="rounded border border-stone-300 px-2 py-1 text-sm" value={interventionForm.intervention_type} onChange={(event) => setInterventionForm((prev) => ({ ...prev, intervention_type: event.target.value }))}>
                      <option value="planting">planting</option>
                      <option value="mulching">mulching</option>
                      <option value="pruning">pruning</option>
                      <option value="watering">watering</option>
                      <option value="treatment">treatment</option>
                      <option value="replacement">replacement</option>
                      <option value="other">other</option>
                    </select>
                    <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Plant record ID (optionnel)" value={interventionForm.plant_record_id} onChange={(event) => setInterventionForm((prev) => ({ ...prev, plant_record_id: event.target.value }))} />
                    <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Notes" value={interventionForm.notes} onChange={(event) => setInterventionForm((prev) => ({ ...prev, notes: event.target.value }))} />
                    <button className="rounded border border-stone-300 px-3 py-2 text-sm">Ajouter intervention</button>
                  </form>
                  {(detail.plantFollowUp?.interventions || []).map((item) => (
                    <p key={item.id} className="text-sm text-stone-700">{item.date} · {item.type} · {item.notes || '-'}</p>
                  ))}
                </div>
              </div>

              <div className="rounded border border-stone-200 p-3">
                <p className="text-sm font-medium text-stone-800 mb-2">Annotations plan</p>
                <form className="grid sm:grid-cols-6 gap-2" onSubmit={(event) => {
                  event.preventDefault()
                  onAddAnnotation(annotationForm)
                  setAnnotationForm((prev) => ({ ...prev, content: '' }))
                }}>
                  <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Document ID" value={annotationForm.document_id} onChange={(event) => setAnnotationForm((prev) => ({ ...prev, document_id: event.target.value }))} required />
                  <input type="number" min="0" max="1" step="0.01" className="rounded border border-stone-300 px-2 py-1 text-sm" value={annotationForm.x} onChange={(event) => setAnnotationForm((prev) => ({ ...prev, x: Number(event.target.value || 0) }))} />
                  <input type="number" min="0" max="1" step="0.01" className="rounded border border-stone-300 px-2 py-1 text-sm" value={annotationForm.y} onChange={(event) => setAnnotationForm((prev) => ({ ...prev, y: Number(event.target.value || 0) }))} />
                  <select className="rounded border border-stone-300 px-2 py-1 text-sm" value={annotationForm.author_type} onChange={(event) => setAnnotationForm((prev) => ({ ...prev, author_type: event.target.value }))}>
                    <option value="team">team</option>
                    <option value="client">client</option>
                  </select>
                  <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Auteur" value={annotationForm.author_name} onChange={(event) => setAnnotationForm((prev) => ({ ...prev, author_name: event.target.value }))} />
                  <input className="sm:col-span-6 rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Contenu" value={annotationForm.content} onChange={(event) => setAnnotationForm((prev) => ({ ...prev, content: event.target.value }))} required />
                  <button className="sm:col-span-6 rounded bg-[#AFBD00] px-2 py-1 text-sm font-medium">Ajouter annotation</button>
                </form>

                <div className="mt-3 space-y-2">
                  {detail.annotations.length === 0 ? (
                    <p className="text-sm text-stone-500">Aucune annotation.</p>
                  ) : (
                    detail.annotations.map((item) => (
                      <div key={item.id} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between gap-2">
                        <span>{item.authorType} · {item.content} · {item.resolved ? 'résolue' : 'ouverte'}</span>
                        <div className="flex gap-2">
                          {!item.resolved && <button className="text-emerald-700" onClick={() => onResolveAnnotation(item.id)}>Résoudre</button>}
                          <button className="text-red-600" onClick={() => onDeleteAnnotation(item.id)}>Supprimer</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded border border-stone-200 p-3">
                  <p className="text-sm font-medium text-stone-800 mb-2">Harvest calendar</p>
                  {(detail.harvestCalendar?.months || []).length === 0 ? (
                    <p className="text-sm text-stone-500">Calendrier vide.</p>
                  ) : (
                    detail.harvestCalendar.months.slice(0, 6).map((month) => (
                      <div key={month.month} className="flex items-center justify-between gap-2">
                        <p className="text-sm text-stone-700">{month.name}: {month.harvests?.length || 0} récoltes</p>
                        <button
                          className="text-xs text-indigo-700"
                          onClick={() => {
                            const product = window.prompt('Produit récolté (ex: fruits)', 'fruits')
                            const species = window.prompt('Espèce', '')
                            if (!product || !species) return
                            const items = [...(month.harvests || []), { product, species, commonName: '', notes: '' }]
                            onUpdateHarvestCalendar(month.month, items)
                          }}
                        >
                          Ajouter
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="rounded border border-stone-200 p-3">
                  <p className="text-sm font-medium text-stone-800 mb-2">Maintenance calendar</p>
                  {(detail.maintenanceCalendar?.months || []).length === 0 ? (
                    <p className="text-sm text-stone-500">Calendrier vide.</p>
                  ) : (
                    detail.maintenanceCalendar.months.slice(0, 6).map((month) => (
                      <div key={month.month} className="flex items-center justify-between gap-2">
                        <p className="text-sm text-stone-700">{month.name}: {month.tasks?.length || 0} tâches</p>
                        <button
                          className="text-xs text-indigo-700"
                          onClick={() => {
                            const title = window.prompt('Nouvelle tâche', '')
                            if (!title) return
                            const items = [...(month.tasks || []), { title, description: '', videoUrl: null, photos: [] }]
                            onUpdateMaintenanceCalendar(month.month, items)
                          }}
                        >
                          Ajouter
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
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
    if (!window.confirm('Supprimer ce projet ?')) return

    runMutation(async () => {
      await apiRequest(`/api/v1/design/${projectId}`, { method: 'DELETE' })
      if (projectDetail?.project?.id === projectId) {
        setProjectDetail(null)
        window.history.pushState({}, '', '/design')
      }
      setNotice('Projet supprimé.')
    })
  }, [projectDetail?.project?.id, runMutation])

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
      savePlantingPlan: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/planting-plan`, { method: 'PATCH', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
      exportPlan: (format) => runMutation(async () => {
        const payload = await apiRequest(`/api/v1/design/${currentProjectId}/planting-plan/export`, { method: 'POST', body: JSON.stringify({ format }) })
        if (payload?.exportUrl) window.open(payload.exportUrl, '_blank', 'noopener,noreferrer')
      }, { refreshDashboard: false, refreshProjectId: null }),
      addPlantMarker: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/planting-plan/markers`, { method: 'POST', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
      movePlantMarker: (markerId, values) => runMutation(() => apiRequest(`/api/v1/design/planting-plan/markers/${markerId}`, { method: 'PATCH', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
      deletePlantMarker: (markerId) => runMutation(() => apiRequest(`/api/v1/design/planting-plan/markers/${markerId}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
      createQuote: () => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/quotes`, { method: 'POST' }), { refreshProjectId: currentProjectId }),
      sendQuote: (quoteId) => runMutation(() => apiRequest(`/api/v1/design/quotes/${quoteId}/send`, { method: 'PATCH' }), { refreshProjectId: currentProjectId }),
      deleteQuote: (quoteId) => runMutation(() => apiRequest(`/api/v1/design/quotes/${quoteId}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
      addQuoteLine: (quoteId, values) => runMutation(() => apiRequest(`/api/v1/design/quotes/${quoteId}/lines`, { method: 'POST', body: JSON.stringify({
        description: values.description,
        quantity: values.quantity,
        unit: values.unit,
        unit_price: values.unit_price,
      }) }), { refreshProjectId: currentProjectId }),
      deleteQuoteLine: (lineId) => runMutation(() => apiRequest(`/api/v1/design/quote-lines/${lineId}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
      addDocument: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/documents`, { method: 'POST', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
      deleteDocument: (documentId) => runMutation(() => apiRequest(`/api/v1/design/documents/${documentId}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
      addMedia: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/media`, { method: 'POST', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
      deleteMedia: (mediaId) => runMutation(() => apiRequest(`/api/v1/design/media/${mediaId}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
      addMeeting: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/meetings`, { method: 'POST', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
      deleteMeeting: (meetingId) => runMutation(() => apiRequest(`/api/v1/design/meetings/${meetingId}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
      addAnnotation: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/annotations`, { method: 'POST', body: JSON.stringify({
        ...values,
        author_id: `member-${Math.random().toString(36).slice(2, 8)}`,
      }) }), { refreshProjectId: currentProjectId }),
      resolveAnnotation: (annotationId) => runMutation(() => apiRequest(`/api/v1/design/annotations/${annotationId}/resolve`, { method: 'PATCH' }), { refreshProjectId: currentProjectId }),
      deleteAnnotation: (annotationId) => runMutation(() => apiRequest(`/api/v1/design/annotations/${annotationId}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
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
  }, [currentProjectId, editProject, runMutation, loadProject])

  useEffect(() => {
    if (!paletteIdFromQuery || !currentProjectId || !detailActions) return
    detailActions.importPlantPalette(paletteIdFromQuery)
  }, [currentProjectId, detailActions, paletteIdFromQuery])

  if (loading || !stats) {
    return <div className="flex items-center justify-center h-full p-8"><p className="text-stone-500">Chargement Design Studio...</p></div>
  }

  return (
    <>
      {projectDetail ? (
        <ProjectDetail
          detail={projectDetail}
          busy={busy}
          onBack={() => {
            setProjectDetail(null)
            window.history.pushState({}, '', '/design')
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
          onSavePlantingPlan={detailActions?.savePlantingPlan || (() => {})}
          onExportPlan={detailActions?.exportPlan || (() => {})}
          onAddPlantMarker={detailActions?.addPlantMarker || (() => {})}
          onMovePlantMarker={detailActions?.movePlantMarker || (() => {})}
          onDeletePlantMarker={detailActions?.deletePlantMarker || (() => {})}
          onCreateQuote={detailActions?.createQuote || (() => {})}
          onSendQuote={detailActions?.sendQuote || (() => {})}
          onDeleteQuote={detailActions?.deleteQuote || (() => {})}
          onAddQuoteLine={detailActions?.addQuoteLine || (() => {})}
          onDeleteQuoteLine={detailActions?.deleteQuoteLine || (() => {})}
          onAddDocument={detailActions?.addDocument || (() => {})}
          onDeleteDocument={detailActions?.deleteDocument || (() => {})}
          onAddMedia={detailActions?.addMedia || (() => {})}
          onDeleteMedia={detailActions?.deleteMedia || (() => {})}
          onAddMeeting={detailActions?.addMeeting || (() => {})}
          onDeleteMeeting={detailActions?.deleteMeeting || (() => {})}
          onAddAnnotation={detailActions?.addAnnotation || (() => {})}
          onResolveAnnotation={detailActions?.resolveAnnotation || (() => {})}
          onDeleteAnnotation={detailActions?.deleteAnnotation || (() => {})}
          onAddPlantRecord={detailActions?.addPlantRecord || (() => {})}
          onUpdatePlantRecord={detailActions?.updatePlantRecord || (() => {})}
          onAddFollowUpVisit={detailActions?.addFollowUpVisit || (() => {})}
          onAddIntervention={detailActions?.addIntervention || (() => {})}
          onUpdateHarvestCalendar={detailActions?.updateHarvestCalendar || (() => {})}
          onUpdateMaintenanceCalendar={detailActions?.updateMaintenanceCalendar || (() => {})}
          onSearch={detailActions?.search || (() => {})}
          searchResults={searchResults}
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
