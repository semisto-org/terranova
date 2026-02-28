import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { useShellNav } from '../../components/shell/ShellContext'
import { ProjectDashboard, ProjectDetailView, ReportingDashboard } from '../../design-studio/components'
import { EconomicsSection } from '../../design-studio/components/economics'
import { ExpenseFormModal } from '../../components/shared/ExpenseFormModal'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'

function defaultProjectForm() {
  return {
    name: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    street: '',
    number: '',
    city: '',
    postcode: '',
    country_name: '',
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

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-stone-700">Rue</span>
                <input className="rounded-xl border border-stone-300 px-3 py-2 text-sm" value={values.street} onChange={(e) => onChange('street', e.target.value)} required />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium text-stone-700">Numéro</span>
                <input className="rounded-xl border border-stone-300 px-3 py-2 text-sm" value={values.number} onChange={(e) => onChange('number', e.target.value)} />
              </label>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-stone-700">Code postal</span>
                <input className="rounded-xl border border-stone-300 px-3 py-2 text-sm" value={values.postcode} onChange={(e) => onChange('postcode', e.target.value)} required />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium text-stone-700">Localité</span>
                <input className="rounded-xl border border-stone-300 px-3 py-2 text-sm" value={values.city} onChange={(e) => onChange('city', e.target.value)} required />
              </label>
            </div>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-stone-700">Pays</span>
              <input className="rounded-xl border border-stone-300 px-3 py-2 text-sm" value={values.country_name} onChange={(e) => onChange('country_name', e.target.value)} required />
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

function ProjectEditModal({ open, busy, project, values, onChange, onClose, onSubmit }) {
  const [geocoding, setGeocoding] = React.useState(false)
  const [geocodeError, setGeocodeError] = React.useState(null)

  if (!open || !project) return null

  const buildAddress = () => {
    const parts = [values.street, values.number, values.postcode, values.city, values.country_name].filter(Boolean)
    return parts.join(', ')
  }

  const geocodeAddress = async () => {
    const address = buildAddress()
    if (!address.trim()) {
      setGeocodeError('Saisissez une adresse avant de géolocaliser.')
      return
    }
    setGeocoding(true)
    setGeocodeError(null)
    try {
      const data = await apiRequest(`/api/v1/geocoding?address=${encodeURIComponent(address.trim())}`)
      const results = data?.results || []
      if (results.length > 0) {
        onChange('latitude', parseFloat(results[0].lat).toFixed(6))
        onChange('longitude', parseFloat(results[0].lng).toFixed(6))
      } else {
        setGeocodeError('Aucun résultat trouvé pour cette adresse.')
      }
    } catch (err) {
      setGeocodeError(err.message || 'Erreur lors de la géolocalisation.')
    } finally {
      setGeocoding(false)
    }
  }

  const inputClass = 'rounded-lg border border-stone-300 px-3 py-2.5 text-sm bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40 focus:border-[#AFBD00] transition-shadow'
  const labelClass = 'text-xs font-medium text-stone-500 uppercase tracking-wider'

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl border border-stone-200 shadow-2xl shadow-stone-900/10">
          <div className="shrink-0 px-6 py-5 border-b border-stone-100">
            <h2 className="text-lg font-semibold text-stone-900 tracking-tight">Modifier le projet</h2>
            <p className="text-sm text-stone-500 mt-0.5">Mettez à jour les informations du projet</p>
          </div>

          <form
            className="flex flex-col min-h-0 h-full"
            data-1p-ignore
            onSubmit={(e) => { e.preventDefault(); onSubmit() }}
          >
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 min-w-0 p-6 space-y-8">
              {/* Projet */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-[#AFBD00]" />
                  <h3 className="text-sm font-semibold text-stone-800">Projet</h3>
                </div>
                <div className="space-y-4 pl-3">
                  <label className="grid gap-1.5">
                    <span className={labelClass}>Nom du projet</span>
                    <input
                      className={inputClass}
                      value={values.name}
                      onChange={(e) => onChange('name', e.target.value)}
                      placeholder="Ex. Jardin-forêt Dupont"
                      required
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className={labelClass}>Surface (m²)</span>
                    <input
                      type="number"
                      min="1"
                      className={inputClass}
                      value={values.area}
                      onChange={(e) => onChange('area', Number(e.target.value || 0))}
                      required
                    />
                  </label>
                </div>
              </section>

              {/* Client */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-[#AFBD00]" />
                  <h3 className="text-sm font-semibold text-stone-800">Client</h3>
                </div>
                <div className="space-y-4 pl-3">
                  <label className="grid gap-1.5">
                    <span className={labelClass}>Nom</span>
                    <input
                      className={inputClass}
                      value={values.client_name}
                      onChange={(e) => onChange('client_name', e.target.value)}
                      placeholder="Nom du client"
                      required
                    />
                  </label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="grid gap-1.5">
                      <span className={labelClass}>Email</span>
                      <input
                        type="email"
                        className={inputClass}
                        value={values.client_email}
                        onChange={(e) => onChange('client_email', e.target.value)}
                        placeholder="client@exemple.be"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className={labelClass}>Téléphone</span>
                      <input
                        className={inputClass}
                        value={values.client_phone}
                        onChange={(e) => onChange('client_phone', e.target.value)}
                        placeholder="+32 470 00 00 00"
                      />
                    </label>
                  </div>
                </div>
              </section>

              {/* Adresse */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-[#AFBD00]" />
                  <h3 className="text-sm font-semibold text-stone-800">Adresse du site</h3>
                </div>
                <div className="space-y-4 pl-3 min-w-0">
                  <div className="grid grid-cols-[1fr_5rem] gap-4">
                    <label className="grid gap-1.5 min-w-0">
                      <span className={labelClass}>Rue</span>
                      <input
                        className={`${inputClass} min-w-0`}
                        value={values.street}
                        onChange={(e) => onChange('street', e.target.value)}
                        placeholder="Rue de la Forêt"
                        required
                      />
                    </label>
                    <label className="grid gap-1.5 min-w-0">
                      <span className={labelClass}>N°</span>
                      <input
                        className={`${inputClass} min-w-0 w-full`}
                        value={values.number}
                        onChange={(e) => onChange('number', e.target.value)}
                        placeholder="12"
                      />
                    </label>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="grid gap-1.5">
                      <span className={labelClass}>Code postal</span>
                      <input
                        className={inputClass}
                        value={values.postcode}
                        onChange={(e) => onChange('postcode', e.target.value)}
                        placeholder="5000"
                        required
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className={labelClass}>Localité</span>
                      <input
                        className={inputClass}
                        value={values.city}
                        onChange={(e) => onChange('city', e.target.value)}
                        placeholder="Namur"
                        required
                      />
                    </label>
                  </div>
                  <label className="grid gap-1.5">
                    <span className={labelClass}>Pays</span>
                    <input
                      className={inputClass}
                      value={values.country_name}
                      onChange={(e) => onChange('country_name', e.target.value)}
                      placeholder="Belgique"
                      required
                    />
                  </label>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`${labelClass} flex items-center gap-1.5`}>
                        <svg className="h-4 w-4 text-[#AFBD00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Coordonnées GPS
                      </span>
                      <button
                        type="button"
                        disabled={geocoding || !buildAddress().trim()}
                        onClick={geocodeAddress}
                        className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-all hover:border-stone-400 hover:bg-stone-50 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                      >
                        {geocoding ? (
                          <svg className="h-3.5 w-3.5 animate-spin text-stone-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        )}
                        {geocoding ? 'Recherche...' : "Géolocaliser l'adresse"}
                      </button>
                    </div>
                    <p className="mb-3 text-xs text-stone-500">
                      Cliquez sur « Géolocaliser » pour remplir automatiquement, ou saisissez les coordonnées manuellement.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1.5">
                        <span className={labelClass}>Latitude</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={inputClass}
                          value={values.latitude}
                          onChange={(e) => { onChange('latitude', e.target.value); setGeocodeError(null) }}
                          placeholder="50.467388"
                        />
                      </label>
                      <label className="grid gap-1.5">
                        <span className={labelClass}>Longitude</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={inputClass}
                          value={values.longitude}
                          onChange={(e) => { onChange('longitude', e.target.value); setGeocodeError(null) }}
                          placeholder="4.871985"
                        />
                      </label>
                    </div>
                    {geocodeError && (
                      <p className="mt-2 text-xs text-red-600">{geocodeError}</p>
                    )}
                  </div>
                </div>
              </section>
            </div>
            <div className="shrink-0 px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-lg bg-[#AFBD00] text-stone-900 text-sm font-semibold hover:bg-[#9aa800] disabled:opacity-60 transition-colors">
                {busy ? 'Enregistrement…' : 'Enregistrer'}
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
  { id: 'locations', label: 'Lieux' },
  { id: 'economics', label: 'Données économiques' },
  { id: 'reporting', label: 'Reporting' },
]

export default function DesignIndex({ initialProjectId }) {
  const [projectDetail, setProjectDetail] = useState(null)
  const [activeSection, setActiveSection] = useState('projects')
  useShellNav({
    sections: DESIGN_SECTIONS,
    activeSection,
    onSectionChange: (id) => {
      setActiveSection(id)
      if (id === 'projects' && projectDetail) {
        setProjectDetail(null)
        window.history.pushState({}, '', '/design')
      }
    },
  })
  const paletteIdFromQuery = new URLSearchParams(window.location.search).get('palette_id')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState(null)
  const [templates, setTemplates] = useState([])
  const [reporting, setReporting] = useState(null)
  const [reportingLoading, setReportingLoading] = useState(false)
  const [reportingError, setReportingError] = useState(null)
  const [reportingFilters, setReportingFilters] = useState({ period: '12m', projectId: '', client: '', memberId: '', groupBy: 'month' })

  const [economics, setEconomics] = useState({ dashboard: null, inputs: [], outputs: [] })
  const [economicsLoading, setEconomicsLoading] = useState(false)
  const [economicsFilters, setEconomicsFilters] = useState({ from: '', to: '', design_project_id: '' })

  const [searchResults, setSearchResults] = useState([])
  const [academyTrainingOptions, setAcademyTrainingOptions] = useState([])

  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [projectForm, setProjectForm] = useState(defaultProjectForm)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [expenseModal, setExpenseModal] = useState(null)
  const [projectEditModal, setProjectEditModal] = useState(null)
  const [editProjectForm, setEditProjectForm] = useState({ name: '', client_name: '', client_email: '', client_phone: '', street: '', number: '', city: '', postcode: '', country_name: '', latitude: '', longitude: '', area: 500 })

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

  const loadAcademyTrainingOptions = useCallback(async () => {
    try {
      const payload = await apiRequest('/api/v1/academy')
      const options = (payload?.trainings || []).map((t) => ({ value: t.id, label: t.title }))
      setAcademyTrainingOptions(options)
    } catch {
      setAcademyTrainingOptions([])
    }
  }, [])

  const loadReporting = useCallback(async (filters = reportingFilters) => {
    setReportingLoading(true)
    setReportingError(null)
    try {
      const params = new URLSearchParams()
      if (filters.period) params.set('period', filters.period)
      if (filters.projectId) params.set('project_id', filters.projectId)
      if (filters.client) params.set('client', filters.client)
      if (filters.memberId) params.set('member_id', filters.memberId)
      if (filters.groupBy) params.set('group_by', filters.groupBy)
      const payload = await apiRequest(`/api/v1/design_studio/reporting?${params.toString()}`)
      setReporting(payload)
    } catch (err) {
      setReportingError(err.message)
    } finally {
      setReportingLoading(false)
    }
  }, [reportingFilters])

  const economicsFiltersRef = React.useRef(economicsFilters)
  useEffect(() => { economicsFiltersRef.current = economicsFilters }, [economicsFilters])

  const loadEconomics = useCallback(async (filters) => {
    const f = filters ?? economicsFiltersRef.current
    setEconomicsLoading(true)
    try {
      const params = new URLSearchParams()
      if (f.from) params.set('from', f.from)
      if (f.to) params.set('to', f.to)
      if (f.design_project_id) params.set('design_project_id', f.design_project_id)
      const qs = params.toString()
      const [dashboardData, inputsData, outputsData] = await Promise.all([
        apiRequest(`/api/v1/economics/dashboard${qs ? '?' + qs : ''}`),
        apiRequest(`/api/v1/economics/inputs${qs ? '?' + qs : ''}`),
        apiRequest(`/api/v1/economics/outputs${qs ? '?' + qs : ''}`),
      ])
      setEconomics({ dashboard: dashboardData, inputs: inputsData.inputs || [], outputs: outputsData.outputs || [] })
    } catch (err) {
      setError(err.message)
    } finally {
      setEconomicsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function boot() {
      setLoading(true)
      setError(null)
      try {
        await Promise.all([loadDashboard(), loadAcademyTrainingOptions()])

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
  }, [initialProjectId, loadDashboard, loadAcademyTrainingOptions, loadProject, paletteIdFromQuery])

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

  const economicsActions = useMemo(() => ({
    onFilterChange: (key, value) => setEconomicsFilters((prev) => ({ ...prev, [key]: value })),
    onCreateInput: async (values) => {
      await runMutation(
        () => apiRequest('/api/v1/economics/inputs', { method: 'POST', body: JSON.stringify({ economic_input: values }) }),
        { refreshDashboard: false }
      )
      await loadEconomics()
    },
    onUpdateInput: async (id, values) => {
      await runMutation(
        () => apiRequest(`/api/v1/economics/inputs/${id}`, { method: 'PATCH', body: JSON.stringify({ economic_input: values }) }),
        { refreshDashboard: false }
      )
      await loadEconomics()
    },
    onDeleteInput: (id) => {
      setDeleteConfirm({
        title: 'Supprimer ce coût ?',
        message: 'Ce coût sera supprimé définitivement.',
        action: async () => {
          await runMutation(
            () => apiRequest(`/api/v1/economics/inputs/${id}`, { method: 'DELETE' }),
            { refreshDashboard: false }
          )
          await loadEconomics()
        },
      })
    },
    onCreateOutput: async (values) => {
      await runMutation(
        () => apiRequest('/api/v1/economics/outputs', { method: 'POST', body: JSON.stringify({ economic_output: values }) }),
        { refreshDashboard: false }
      )
      await loadEconomics()
    },
    onUpdateOutput: async (id, values) => {
      await runMutation(
        () => apiRequest(`/api/v1/economics/outputs/${id}`, { method: 'PATCH', body: JSON.stringify({ economic_output: values }) }),
        { refreshDashboard: false }
      )
      await loadEconomics()
    },
    onDeleteOutput: (id) => {
      setDeleteConfirm({
        title: 'Supprimer ce revenu ?',
        message: 'Ce revenu sera supprimé définitivement.',
        action: async () => {
          await runMutation(
            () => apiRequest(`/api/v1/economics/outputs/${id}`, { method: 'DELETE' }),
            { refreshDashboard: false }
          )
          await loadEconomics()
        },
      })
    },
    onSearchSpecies: async (query) => {
      if (!query?.trim()) return []
      const data = await apiRequest(`/api/v1/plants/search?query=${encodeURIComponent(query)}`)
      return data?.items || []
    },
  }), [runMutation, loadEconomics])

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
          street: projectForm.street,
          number: projectForm.number,
          city: projectForm.city,
          postcode: projectForm.postcode,
          country_name: projectForm.country_name,
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
      setActiveSection('projects')
      window.history.pushState({}, '', `/design/${projectId}`)
    }, { refreshDashboard: false })

    if (!success) return
  }, [loadProject, runMutation])

  const deleteProject = useCallback((projectId) => {
    const project = projects.find((p) => p.id === projectId) || projectDetail?.project
    const projectName = project?.name || 'ce projet'
    setDeleteConfirm({
      title: 'Supprimer ce projet ?',
      message: `Le projet « ${projectName} » sera supprimé définitivement.`,
      action: () => runMutation(async () => {
        await apiRequest(`/api/v1/design/${projectId}`, { method: 'DELETE' })
        if (projectDetail?.project?.id === projectId) {
          setProjectDetail(null)
          window.history.pushState({}, '', '/design')
        }
        setNotice('Projet supprimé.')
      }),
    })
  }, [projects, projectDetail?.project, runMutation])

  const updateEditProjectForm = useCallback((field, value) => {
    setEditProjectForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const submitEditProject = useCallback(async () => {
    const projectId = projectEditModal?.project?.id
    if (!projectId) return
    const success = await runMutation(() => apiRequest(`/api/v1/design/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: editProjectForm.name,
        client_name: editProjectForm.client_name,
        client_email: editProjectForm.client_email,
        client_phone: editProjectForm.client_phone,
        street: editProjectForm.street,
        number: editProjectForm.number,
        city: editProjectForm.city,
        postcode: editProjectForm.postcode,
        country_name: editProjectForm.country_name,
        latitude: parseFloat(editProjectForm.latitude) || 0,
        longitude: parseFloat(editProjectForm.longitude) || 0,
        area: Number(editProjectForm.area || 0),
      }),
    }), { refreshProjectId: projectId })
    if (success) {
      setProjectEditModal(null)
      setNotice('Projet mis à jour.')
    }
  }, [editProjectForm, projectEditModal?.project?.id, runMutation])

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
      openEditProject: () => {
        const p = projectDetail?.project
        if (!p) return
        setEditProjectForm({
          name: p.name || '',
          client_name: p.clientName || '',
          client_email: p.clientEmail || '',
          client_phone: p.clientPhone || '',
          street: p.street || '',
          number: p.number || '',
          city: p.city || '',
          postcode: p.postcode || '',
          country_name: p.countryName || '',
          latitude: p.coordinates?.lat != null ? String(p.coordinates.lat) : '',
          longitude: p.coordinates?.lng != null ? String(p.coordinates.lng) : '',
          area: p.area || 500,
        })
        setProjectEditModal({ project: p })
      },
      updatePhase: async (phase) => {
        const success = await runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}`, {
          method: 'PATCH',
          body: JSON.stringify({ phase }),
        }), { refreshProjectId: currentProjectId })
        if (success) setNotice('Phase mise à jour.')
      },
      updateStatus: async (status) => {
        const success = await runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }), { refreshProjectId: currentProjectId })
        if (success) setNotice('Statut mis à jour.')
      },
      addTeamMember: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/team-members`, { method: 'POST', body: JSON.stringify({
        member_id: values.member_id,
        role: values.role,
        is_paid: values.is_paid,
      }) }), { refreshProjectId: currentProjectId }),
      updateAddress: async (values) => {
        const success = await runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            street: values.street,
            number: values.number,
            city: values.city,
            postcode: values.postcode,
            country_name: values.country_name,
            latitude: values.latitude,
            longitude: values.longitude,
          }),
        }), { refreshProjectId: currentProjectId })
        if (success) setNotice('Adresse mise à jour.')
      },
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
      updateTimesheet: async (id, values) => {
        await runMutation(() => apiRequest(`/api/v1/design/timesheets/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            date: values.date,
            hours: values.hours,
            phase: values.phase,
            mode: values.mode,
            travel_km: values.travel_km,
            notes: values.notes,
            details: values.details,
            service_type_id: values.service_type_id,
          }),
        }), { refreshProjectId: currentProjectId })
      },
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
      saveSiteAnalysis: (values) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/site-analysis`, {
        method: 'PATCH',
        body: JSON.stringify(values),
      }), { refreshProjectId: currentProjectId }),
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
      uploadPlanImage: (file) => {
        const form = new FormData()
        form.append('image', file)
        return runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/planting-plan/upload`, { method: 'POST', body: form }), { refreshProjectId: currentProjectId })
      },
      savePlanScaleData: (scaleData) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/planting-plan`, { method: 'PATCH', body: JSON.stringify({ scale_data: scaleData }) }), { refreshProjectId: currentProjectId }),
      updatePlantMarker: (markerId, values) => runMutation(() => apiRequest(`/api/v1/design/planting-plan/markers/${markerId}`, { method: 'PATCH', body: JSON.stringify(values) }), { refreshProjectId: currentProjectId }),
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
      createDesignTaskList: (name) => runMutation(() => apiRequest(`/api/v1/design/${currentProjectId}/task-lists`, { method: 'POST', body: JSON.stringify({ name }) }), { refreshProjectId: currentProjectId }),
      updateDesignTaskList: (id, name) => runMutation(() => apiRequest(`/api/v1/design/task-lists/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }), { refreshProjectId: currentProjectId }),
      deleteDesignTaskList: (id) => {
        setDeleteConfirm({
          title: 'Supprimer cette liste ?',
          message: 'La liste et toutes ses tâches seront supprimées définitivement.',
          action: () => runMutation(() => apiRequest(`/api/v1/design/task-lists/${id}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
        })
      },
      createDesignTask: (taskListId, data) => runMutation(() => apiRequest(`/api/v1/design/task-lists/${taskListId}/tasks`, { method: 'POST', body: JSON.stringify(data) }), { refreshProjectId: currentProjectId }),
      updateDesignTask: (id, data) => runMutation(() => apiRequest(`/api/v1/design/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }), { refreshProjectId: currentProjectId }),
      toggleDesignTask: (id) => runMutation(() => apiRequest(`/api/v1/design/tasks/${id}/toggle`, { method: 'PATCH' }), { refreshProjectId: currentProjectId }),
      deleteDesignTask: (id) => {
        setDeleteConfirm({
          title: 'Supprimer cette tâche ?',
          message: 'Cette tâche sera supprimée définitivement.',
          action: () => runMutation(() => apiRequest(`/api/v1/design/tasks/${id}`, { method: 'DELETE' }), { refreshProjectId: currentProjectId }),
        })
      },
    }
  }, [currentProjectId, editProject, projectDetail, runMutation, loadProject])

  useEffect(() => {
    if (!paletteIdFromQuery || !currentProjectId || !detailActions) return
    detailActions.importPlantPalette(paletteIdFromQuery)
  }, [currentProjectId, detailActions, paletteIdFromQuery])

  useEffect(() => {
    if (activeSection !== 'reporting') return
    loadReporting(reportingFilters)
  }, [activeSection, loadReporting, reportingFilters])

  useEffect(() => {
    if (activeSection !== 'economics') return
    loadEconomics(economicsFilters)
  }, [activeSection, economicsFilters, loadEconomics])

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
      onOpenEditProject: detailActions.openEditProject || noop,
      onUpdatePhase: detailActions.updatePhase || undefined,
      onUpdateStatus: detailActions.updateStatus || undefined,
      onDeleteProject: deleteProject,
      onUpdateAddress: detailActions.updateAddress || noopAsync,
      onAddTeamMember: detailActions.addTeamMember || noop,
      onRemoveTeamMember: detailActions.removeTeamMember || noop,
      onAddTimesheet: detailActions.addTimesheet || noop,
      onUpdateTimesheet: detailActions.updateTimesheet || undefined,
      onDeleteTimesheet: detailActions.deleteTimesheet || noop,
      timesheetEditBusy: busy,
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
      onUploadPlanImage: detailActions.uploadPlanImage || noop,
      onSavePlanScaleData: detailActions.savePlanScaleData || noop,
      onAddPlantMarker: detailActions.addPlantMarker || noop,
      onMovePlantMarker: detailActions.movePlantMarker || noop,
      onUpdatePlantMarker: detailActions.updatePlantMarker || noop,
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
      onCreateDesignTaskList: detailActions.createDesignTaskList || noop,
      onUpdateDesignTaskList: detailActions.updateDesignTaskList || noop,
      onDeleteDesignTaskList: detailActions.deleteDesignTaskList || noop,
      onCreateDesignTask: detailActions.createDesignTask || noop,
      onUpdateDesignTask: detailActions.updateDesignTask || noop,
      onToggleDesignTask: detailActions.toggleDesignTask || noop,
      onDeleteDesignTask: detailActions.deleteDesignTask || noop,
    }
  }, [deleteProject, detailActions])

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
      ) : activeSection === 'locations' ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-stone-900 tracking-tight">Lieux</h2>
            <p className="text-sm text-stone-500 mt-1">Configure les lieux des projets Design Studio.</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 border-b border-stone-200 bg-stone-50">
              <div className="col-span-4">Projet</div>
              <div className="col-span-4">Lieu</div>
              <div className="col-span-2">Coordonnées</div>
              <div className="col-span-2 text-right">Action</div>
            </div>
            {projects.map((p) => (
              <div key={p.id} className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-stone-100 last:border-b-0 items-center">
                <div className="col-span-4">
                  <p className="font-medium text-stone-900">{p.name}</p>
                  <p className="text-xs text-stone-500">{p.clientName || '—'}</p>
                </div>
                <div className="col-span-4 text-sm text-stone-700">
                  {p.locationAddress || 'Lieu non défini'}
                </div>
                <div className="col-span-2 text-xs text-stone-500">
                  {p.coordinates ? `${p.coordinates.lat}, ${p.coordinates.lng}` : '—'}
                </div>
                <div className="col-span-2 text-right">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg border border-stone-200 text-sm text-stone-700 hover:bg-stone-100"
                    onClick={() => {
                      setEditProjectForm({
                        name: p.name || '',
                        client_name: p.clientName || '',
                        client_email: p.clientEmail || '',
                        client_phone: p.clientPhone || '',
                        street: p.street || '',
                        number: p.number || '',
                        city: p.city || '',
                        postcode: p.postcode || '',
                        country_name: p.countryName || '',
                        latitude: p.coordinates?.lat != null ? String(p.coordinates.lat) : '',
                        longitude: p.coordinates?.lng != null ? String(p.coordinates.lng) : '',
                        area: p.area || 500,
                      })
                      setProjectEditModal({ project: p })
                    }}
                  >
                    Configurer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : activeSection === 'economics' ? (
        economicsLoading && !economics.dashboard ? (
          <div className="flex items-center justify-center h-full p-8"><p className="text-stone-500">Chargement des données économiques…</p></div>
        ) : (
          <EconomicsSection
            dashboard={economics.dashboard}
            inputs={economics.inputs}
            outputs={economics.outputs}
            filters={economicsFilters}
            projects={projects.map((p) => ({ id: String(p.id), name: p.name }))}
            busy={busy}
            actions={economicsActions}
          />
        )
      ) : activeSection === 'reporting' ? (
        reportingLoading ? (
          <div className="flex items-center justify-center h-full p-8"><p className="text-stone-500">Chargement du reporting…</p></div>
        ) : reportingError ? (
          <div className="flex items-center justify-center h-full p-8"><p className="text-red-600">{reportingError}</p></div>
        ) : reporting ? (
          <ReportingDashboard
            data={reporting}
            filters={reportingFilters}
            onFilterChange={(key, value) => setReportingFilters((prev) => ({ ...prev, [key]: value }))}
            onExportCsv={() => {
              if (!reporting?.projectProfitability?.length) return
              const header = ['Projet', 'Client', 'CA', 'Coûts', 'Marge', 'Marge %', 'Heures', 'Revenu/h', 'Coût/h', 'Tendance']
              const rows = reporting.projectProfitability.map((r) => [r.projectName, r.clientName, r.revenue, r.costs, r.margin, r.marginPct, r.hours, r.revenuePerHour, r.costPerHour, r.trend])
              const csv = [header, ...rows].map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `design-reporting-${new Date().toISOString().slice(0, 10)}.csv`
              a.click()
              URL.revokeObjectURL(url)
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full p-8"><p className="text-stone-500">Aucune donnée disponible.</p></div>
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
          trainingOptions={academyTrainingOptions}
          designProjectOptions={projects.map((p) => ({ value: p.id, label: p.name }))}
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

      <ProjectEditModal
        open={Boolean(projectEditModal)}
        busy={busy}
        project={projectEditModal?.project}
        values={editProjectForm}
        onChange={updateEditProjectForm}
        onClose={() => setProjectEditModal(null)}
        onSubmit={submitEditProject}
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
