import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { useShellNav } from '../../components/shell/ShellContext'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'
import {
  ActivityFeed,
  ContributorProfile,
  GenusDetail,
  GenusFormModal,
  PlantPalette,
  SearchView,
  SpeciesDetail,
  SpeciesFormModal,
  VarietyDetail,
  VarietyFormModal,
} from '../../plant-database/components'

const EMPTY_FILTERS = {
  query: '',
  types: [],
  exposures: [],
  hardinessZones: [],
  edibleParts: [],
  interests: [],
  nativeCountries: [],
  soilTypes: [],
  soilMoisture: [],
  wateringNeed: [],
}

function routeFromPath(pathname) {
  const segments = pathname.replace(/^\/+/, '').split('/').filter(Boolean)
  if (segments.length === 0 || segments[0] !== 'plants') return { view: 'search' }
  if (segments.length === 1) return { view: 'search' }

  if (segments[1] === 'palette') return { view: 'palette' }
  if (segments[1] === 'activity') return { view: 'activity' }
  if (segments[1] === 'genera' && segments[2]) return { view: 'genus', id: segments[2] }
  if (segments[1] === 'species' && segments[2]) return { view: 'species', id: segments[2] }
  if (segments[1] === 'varieties' && segments[2]) return { view: 'variety', id: segments[2] }
  if (segments[1] === 'contributors' && segments[2]) return { view: 'contributor', id: segments[2] }

  return { view: 'search' }
}

function pathForView(view, id) {
  if (view === 'search') return '/plants'
  if (view === 'palette') return '/plants/palette'
  if (view === 'activity') return '/plants/activity'
  if (view === 'genus' && id) return `/plants/genera/${id}`
  if (view === 'species' && id) return `/plants/species/${id}`
  if (view === 'variety' && id) return `/plants/varieties/${id}`
  if (view === 'contributor' && id) return `/plants/contributors/${id}`
  return '/plants'
}

function PlantTopNav({ currentView, onNavigate, onReload }) {
  const tabs = [
    { key: 'search', label: 'Recherche' },
    { key: 'palette', label: 'Palette' },
    { key: 'activity', label: 'Activité' },
  ]

  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
        {tabs.map((tab) => {
          const active = currentView === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => onNavigate(tab.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-[#5B5781] text-white' : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          )
        })}

        <div className="ml-auto">
          <button
            onClick={onReload}
            className="px-3 py-2 rounded-lg text-sm font-medium text-stone-700 border border-stone-300 hover:bg-stone-100"
          >
            Rafraîchir
          </button>
        </div>
      </div>
    </div>
  )
}

function ContributionModal({ modal, busy, onClose, onChange, onSubmit }) {
  const [touched, setTouched] = useState({})
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const panelRef = useRef(null)
  const firstInputRef = useRef(null)
  const isOpen = Boolean(modal)
  const isNote = modal?.kind === 'note'
  const isPhoto = modal?.kind === 'photo'
  const isReference = modal?.kind === 'reference'

  useEffect(() => {
    if (!isOpen) return
    setTouched({})
    setAttemptedSubmit(false)
    const id = window.requestAnimationFrame(() => {
      firstInputRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(id)
  }, [isOpen, modal?.kind, modal?.targetId, modal?.targetType])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusables.length) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  const isValidUrl = (value) => {
    if (!value) return false
    try {
      const url = new URL(value)
      return ['http:', 'https:'].includes(url.protocol)
    } catch (_) {
      return false
    }
  }

  const errors = {}
  if (isNote && !(modal?.values?.content || '').trim()) {
    errors.content = 'La note est obligatoire.'
  }
  if (isPhoto && !isValidUrl(modal?.values?.url || '')) {
    errors.url = 'URL invalide (http/https).'
  }
  if (isReference && !(modal?.values?.title || '').trim()) {
    errors.title = 'Le titre est obligatoire.'
  }
  if (isReference && !isValidUrl(modal?.values?.url || '')) {
    errors.url = 'URL invalide (http/https).'
  }

  const canSubmit = !busy && Object.keys(errors).length === 0
  const showError = (field) => (attemptedSubmit || touched[field]) && errors[field]
  const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }))

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div ref={panelRef} className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-2xl bg-white border border-stone-200 shadow-2xl">
          <div className="shrink-0 px-5 py-4 border-b border-stone-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900">{modal.title}</h2>
            <button onClick={onClose} className="text-stone-500 hover:text-stone-900">
              Fermer
            </button>
          </div>

          <form
            className="flex flex-col min-h-0 h-full"
            onSubmit={(event) => {
              event.preventDefault()
              setAttemptedSubmit(true)
              if (!canSubmit) return
              onSubmit()
            }}
          >
            <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-4">
            {isNote && (
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Note</span>
                <textarea
                  ref={firstInputRef}
                  className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${showError('content') ? 'border-red-400' : 'border-stone-300'}`}
                  rows={5}
                  value={modal.values.content || ''}
                  onChange={(event) => onChange('content', event.target.value)}
                  onBlur={() => markTouched('content')}
                  required
                />
                {showError('content') && <p className="mt-1 text-xs text-red-600">{errors.content}</p>}
              </label>
            )}

            {isPhoto && (
              <>
                <label className="block">
                  <span className="text-sm font-medium text-stone-700">URL photo</span>
                  <input
                    ref={firstInputRef}
                    className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${showError('url') ? 'border-red-400' : 'border-stone-300'}`}
                    type="url"
                    value={modal.values.url || ''}
                    onChange={(event) => onChange('url', event.target.value)}
                    onBlur={() => markTouched('url')}
                    required
                  />
                  {showError('url') && <p className="mt-1 text-xs text-red-600">{errors.url}</p>}
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-stone-700">Légende</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                    type="text"
                    value={modal.values.caption || ''}
                    onChange={(event) => onChange('caption', event.target.value)}
                  />
                </label>
              </>
            )}

            {isReference && (
              <>
                <label className="block">
                  <span className="text-sm font-medium text-stone-700">Titre</span>
                  <input
                    ref={firstInputRef}
                    className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${showError('title') ? 'border-red-400' : 'border-stone-300'}`}
                    type="text"
                    value={modal.values.title || ''}
                    onChange={(event) => onChange('title', event.target.value)}
                    onBlur={() => markTouched('title')}
                    required
                  />
                  {showError('title') && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-stone-700">URL</span>
                  <input
                    className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${showError('url') ? 'border-red-400' : 'border-stone-300'}`}
                    type="url"
                    value={modal.values.url || ''}
                    onChange={(event) => onChange('url', event.target.value)}
                    onBlur={() => markTouched('url')}
                    required
                  />
                  {showError('url') && <p className="mt-1 text-xs text-red-600">{errors.url}</p>}
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-stone-700">Source</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                    type="text"
                    value={modal.values.source || ''}
                    onChange={(event) => onChange('source', event.target.value)}
                  />
                </label>
              </>
            )}

            </div>
            <div className="shrink-0 px-5 py-4 border-t border-stone-200 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-stone-300 text-sm">
                Annuler
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-3 py-2 rounded-lg bg-[#5B5781] text-white text-sm disabled:opacity-60"
              >
                {busy ? 'Envoi...' : 'Publier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

function AddPlantMenu({ onAddGenus, onAddSpecies, onAddVariety }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const items = [
    {
      label: 'Nouveau genre',
      description: 'Groupe taxonomique',
      color: '#059669',
      bgColor: '#ecfdf5',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      action: onAddGenus,
    },
    {
      label: 'Nouvelle espèce',
      description: 'Avec caractéristiques botaniques',
      color: '#5B5781',
      bgColor: '#f3f0ff',
      icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
      action: onAddSpecies,
    },
    {
      label: 'Nouvelle variété',
      description: 'Cultivar d\'une espèce',
      color: '#d97706',
      bgColor: '#fffbeb',
      icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
      action: onAddVariety,
    },
  ]

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-20">
      {/* Menu */}
      {open && (
        <div
          className="absolute bottom-16 right-0 w-64 bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden"
          style={{ animation: 'menuSlideUp 200ms ease-out' }}
        >
          <div className="px-4 py-3 border-b border-stone-100">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Ajouter à la base</p>
          </div>
          <div className="py-1">
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setOpen(false)
                  item.action()
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-stone-50 transition-colors text-left"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: item.bgColor }}
                >
                  <svg className="w-4.5 h-4.5" style={{ color: item.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-stone-900">{item.label}</span>
                  <p className="text-xs text-stone-500">{item.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          open
            ? 'bg-stone-700 rotate-45 shadow-xl'
            : 'bg-[#5B5781] hover:bg-[#4a4770] hover:shadow-xl hover:scale-105'
        }`}
        aria-label="Ajouter une plante"
      >
        <svg className="w-6 h-6 text-white transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <style>{`
        @keyframes menuSlideUp {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

const PLANT_SECTIONS = [
  { id: 'search', label: 'Recherche' },
  { id: 'palette', label: 'Palette' },
  { id: 'activity', label: 'Activité' },
]

export default function PlantsIndex({ currentContributorId, initialPaletteId }) {
  const [route, setRoute] = useState(() => routeFromPath(window.location.pathname))
  const shellSection = ['genus', 'species', 'variety', 'contributor'].includes(route.view) ? 'search' : route.view
  const handleShellNav = useCallback((id) => {
    const path = pathForView(id)
    window.history.pushState({}, '', path)
    setRoute({ view: id })
  }, [])
  useShellNav({ sections: PLANT_SECTIONS, activeSection: shellSection, onSectionChange: handleShellNav })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const [filterOptions, setFilterOptions] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [results, setResults] = useState([])

  const [palette, setPalette] = useState(null)
  const [activities, setActivities] = useState([])
  const [contributors, setContributors] = useState([])

  const [genusPayload, setGenusPayload] = useState(null)
  const [speciesPayload, setSpeciesPayload] = useState(null)
  const [varietyPayload, setVarietyPayload] = useState(null)
  const [contributorPayload, setContributorPayload] = useState(null)
  const [contributionModal, setContributionModal] = useState(null)
  const [notice, setNotice] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [genusFormModal, setGenusFormModal] = useState(null) // null | { genus?, commonNames? }
  const [speciesFormModal, setSpeciesFormModal] = useState(null) // null | { species?, defaultGenusId?, commonNames? }
  const [varietyFormModal, setVarietyFormModal] = useState(null) // null | { variety?, defaultSpeciesId?, commonNames? }

  const catalogSpecies = useMemo(() => {
    const items = []

    if (speciesPayload?.species) items.push(speciesPayload.species)
    if (genusPayload?.species?.length) items.push(...genusPayload.species)
    if (varietyPayload?.species) items.push(varietyPayload.species)

    results
      .filter((item) => item.type === 'species')
      .forEach((item) => {
        items.push({
          id: item.id,
          genusId: null,
          latinName: item.latinName,
          type: item.plantType || 'tree',
          exposures: item.exposures || [],
        })
      })

    const dedup = new Map()
    items.forEach((item) => {
      if (!dedup.has(item.id)) dedup.set(item.id, item)
    })

    return Array.from(dedup.values())
  }, [genusPayload, results, speciesPayload, varietyPayload])

  const catalogVarieties = useMemo(() => {
    const items = []
    if (speciesPayload?.varieties?.length) items.push(...speciesPayload.varieties)
    if (varietyPayload?.variety) items.push(varietyPayload.variety)

    const dedup = new Map()
    items.forEach((item) => {
      if (!dedup.has(item.id)) dedup.set(item.id, item)
    })

    return Array.from(dedup.values())
  }, [speciesPayload, varietyPayload])

  const paletteItemIds = useMemo(() => {
    if (!palette?.strates) return []
    return Object.values(palette.strates).flat().map((item) => item.id)
  }, [palette])

  const syncContributors = useCallback((items = []) => {
    setContributors((previous) => {
      const map = new Map(previous.map((item) => [item.id, item]))
      items.forEach((item) => {
        if (item?.id) map.set(item.id, item)
      })
      return Array.from(map.values())
    })
  }, [])

  const loadFilterOptions = useCallback(async () => {
    const payload = await apiRequest('/api/v1/plants/filter-options')
    setFilterOptions(payload)
  }, [])

  const loadSearchResults = useCallback(async (nextFilters) => {
    const params = new URLSearchParams()

    if (nextFilters.query) params.set('query', nextFilters.query)

    ;[
      'types',
      'exposures',
      'hardinessZones',
      'edibleParts',
      'interests',
      'nativeCountries',
      'soilTypes',
      'soilMoisture',
      'wateringNeed',
    ].forEach((key) => {
      const values = nextFilters[key] || []
      values.forEach((value) => params.append(`${key}[]`, value))
    })

    const queryString = params.toString()
    const payload = await apiRequest(`/api/v1/plants/search${queryString ? `?${queryString}` : ''}`)
    setResults(payload.items || [])
  }, [])

  const loadActivity = useCallback(async () => {
    const payload = await apiRequest('/api/v1/plants/activity')
    setActivities(payload.items || [])
  }, [])

  const loadPalette = useCallback(async (paletteId) => {
    if (!paletteId) {
      setPalette(null)
      return
    }

    const payload = await apiRequest(`/api/v1/plants/palettes/${paletteId}`)
    setPalette(payload)
  }, [])

  const ensurePalette = useCallback(async () => {
    if (palette?.id) return palette

    const created = await apiRequest('/api/v1/plants/palettes', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Palette rapide',
        description: 'Créée automatiquement depuis la recherche',
        created_by: currentContributorId || 'anonymous',
      }),
    })

    setPalette(created)
    return created
  }, [currentContributorId, palette])

  const loadGenus = useCallback(async (id) => {
    const payload = await apiRequest(`/api/v1/plants/genera/${id}`)
    setGenusPayload(payload)
    syncContributors(payload.contributors || [])
  }, [syncContributors])

  const loadSpecies = useCallback(async (id) => {
    const payload = await apiRequest(`/api/v1/plants/species/${id}`)
    setSpeciesPayload(payload)
    syncContributors(payload.contributors || [])
  }, [syncContributors])

  const loadVariety = useCallback(async (id) => {
    const payload = await apiRequest(`/api/v1/plants/varieties/${id}`)
    setVarietyPayload(payload)
    syncContributors(payload.contributors || [])
  }, [syncContributors])

  const loadContributor = useCallback(async (id) => {
    const payload = await apiRequest(`/api/v1/plants/contributors/${id}`)
    setContributorPayload(payload)
    syncContributors([payload.contributor])
  }, [syncContributors])

  const navigateTo = useCallback((view, id, replace = false) => {
    const path = pathForView(view, id)
    if (replace) {
      window.history.replaceState({}, '', path)
    } else {
      window.history.pushState({}, '', path)
    }
    setRoute({ view, id })
  }, [])

  const refreshCurrentView = useCallback(async () => {
    setBusy(true)
    setError(null)

    try {
      await Promise.all([loadSearchResults(filters), loadActivity()])

      if (route.view === 'genus' && route.id) await loadGenus(route.id)
      if (route.view === 'species' && route.id) await loadSpecies(route.id)
      if (route.view === 'variety' && route.id) await loadVariety(route.id)
      if (route.view === 'contributor' && route.id) await loadContributor(route.id)
      if (route.view === 'palette' && palette?.id) await loadPalette(palette.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [filters, loadActivity, loadContributor, loadGenus, loadPalette, loadSearchResults, loadSpecies, loadVariety, palette, route.id, route.view])

  useEffect(() => {
    let mounted = true

    async function boot() {
      setLoading(true)
      setError(null)

      try {
        await Promise.all([
          loadFilterOptions(),
          loadSearchResults(EMPTY_FILTERS),
          loadActivity(),
          initialPaletteId ? loadPalette(initialPaletteId) : Promise.resolve(),
        ])

        const initialRoute = routeFromPath(window.location.pathname)
        if (mounted) {
          setRoute(initialRoute)

          if (initialRoute.view === 'genus' && initialRoute.id) await loadGenus(initialRoute.id)
          if (initialRoute.view === 'species' && initialRoute.id) await loadSpecies(initialRoute.id)
          if (initialRoute.view === 'variety' && initialRoute.id) await loadVariety(initialRoute.id)
          if (initialRoute.view === 'contributor' && initialRoute.id) await loadContributor(initialRoute.id)
        }
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    boot()

    const onPopState = () => {
      const nextRoute = routeFromPath(window.location.pathname)
      setRoute(nextRoute)
    }

    window.addEventListener('popstate', onPopState)

    return () => {
      mounted = false
      window.removeEventListener('popstate', onPopState)
    }
  }, [initialPaletteId, loadActivity, loadContributor, loadFilterOptions, loadGenus, loadPalette, loadSearchResults, loadSpecies, loadVariety])

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        await loadSearchResults(filters)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [filters, loadSearchResults])

  useEffect(() => {
    async function loadByRoute() {
      setError(null)
      try {
        if (route.view === 'genus' && route.id) await loadGenus(route.id)
        if (route.view === 'species' && route.id) await loadSpecies(route.id)
        if (route.view === 'variety' && route.id) await loadVariety(route.id)
        if (route.view === 'contributor' && route.id) await loadContributor(route.id)
      } catch (err) {
        setError(err.message)
      }
    }

    loadByRoute()
  }, [loadContributor, loadGenus, loadSpecies, loadVariety, route.id, route.view])

  const mutateAndRefresh = useCallback(async (mutation) => {
    setBusy(true)
    setError(null)

    try {
      await mutation()
      await Promise.all([loadActivity(), loadSearchResults(filters)])

      if (route.view === 'genus' && route.id) await loadGenus(route.id)
      if (route.view === 'species' && route.id) await loadSpecies(route.id)
      if (route.view === 'variety' && route.id) await loadVariety(route.id)
      if (route.view === 'contributor' && route.id) await loadContributor(route.id)
      if (palette?.id) await loadPalette(palette.id)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }, [filters, loadActivity, loadContributor, loadGenus, loadPalette, loadSearchResults, loadSpecies, loadVariety, palette, route.id, route.view])

  const openNoteModal = useCallback((targetType, targetId) => {
    setNotice(null)
    setContributionModal({
      kind: 'note',
      title: 'Ajouter une note',
      targetType,
      targetId,
      values: { content: '' },
    })
  }, [])

  const openPhotoModal = useCallback((targetType, targetId) => {
    setNotice(null)
    setContributionModal({
      kind: 'photo',
      title: 'Ajouter une photo',
      targetType,
      targetId,
      values: { url: '', caption: '' },
    })
  }, [])

  const openReferenceModal = useCallback((targetType, targetId) => {
    setNotice(null)
    setContributionModal({
      kind: 'reference',
      title: 'Ajouter une référence',
      targetType,
      targetId,
      values: { title: '', url: '', source: 'Contributeur' },
    })
  }, [])

  const updateContributionValue = useCallback((field, value) => {
    setContributionModal((previous) => {
      if (!previous) return previous
      return { ...previous, values: { ...previous.values, [field]: value } }
    })
  }, [])

  const submitContributionModal = useCallback(async () => {
    if (!contributionModal) return

    const { kind, targetType, targetId, values } = contributionModal

    const success = await mutateAndRefresh(async () => {
      if (kind === 'note') {
        await apiRequest('/api/v1/plants/notes', {
          method: 'POST',
          body: JSON.stringify({
            target_type: targetType,
            target_id: targetId,
            contributor_id: currentContributorId,
            content: values.content,
            language: 'fr',
            photos: [],
          }),
        })
      }

      if (kind === 'photo') {
        await apiRequest('/api/v1/plants/photos', {
          method: 'POST',
          body: JSON.stringify({
            target_type: targetType,
            target_id: targetId,
            contributor_id: currentContributorId,
            url: values.url,
            caption: values.caption || '',
          }),
        })
      }

      if (kind === 'reference') {
        await apiRequest('/api/v1/plants/references', {
          method: 'POST',
          body: JSON.stringify({
            target_type: targetType,
            target_id: targetId,
            reference_type: 'link',
            title: values.title,
            url: values.url,
            source: values.source || 'Contributeur',
            contributor_id: currentContributorId,
          }),
        })
      }
    })

    if (success) {
      setContributionModal(null)
      setNotice('Contribution publiée.')
    }
  }, [contributionModal, currentContributorId, mutateAndRefresh])

  const generateAiSummary = useCallback((targetType, targetId) => {
    mutateAndRefresh(async () => {
      await apiRequest('/api/v1/plants/ai-summary', {
        method: 'POST',
        body: JSON.stringify({ target_type: targetType, target_id: targetId }),
      })
    })
  }, [mutateAndRefresh])

  const addToPalette = useCallback((targetId, targetType, strateKey) => {
    mutateAndRefresh(async () => {
      const ensuredPalette = await ensurePalette()

      await apiRequest(`/api/v1/plants/palettes/${ensuredPalette.id}/items`, {
        method: 'POST',
        body: JSON.stringify({
          item_type: targetType,
          item_id: targetId,
          strate_key: strateKey,
          position: 0,
        }),
      })
    })
  }, [ensurePalette, mutateAndRefresh])

  const removePaletteItem = useCallback((targetId, strate) => {
    if (!palette?.strates?.[strate]) return

    const item = palette.strates[strate].find(
      (entry) => entry.id === targetId || entry.paletteItemId === targetId
    )
    if (!item) return

    setDeleteConfirm({
      title: 'Retirer cette plante ?',
      message: `« ${item.latinName || ''} » sera retirée de la palette.`,
      action: () => mutateAndRefresh(async () => {
        await apiRequest(`/api/v1/plants/palette-items/${item.paletteItemId || item.id}`, {
          method: 'DELETE',
        })
      }),
    })
  }, [mutateAndRefresh, palette])

  const movePaletteItem = useCallback((itemId, fromStrate, toStrate) => {
    if (fromStrate === toStrate || !palette?.strates?.[fromStrate]) return

    const item = palette.strates[fromStrate].find(
      (entry) => entry.paletteItemId === itemId || entry.id === itemId
    )
    if (!item) return

    mutateAndRefresh(async () => {
      await apiRequest(`/api/v1/plants/palette-items/${item.paletteItemId || item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          strate_key: toStrate,
          position: 0,
        }),
      })
    })
  }, [mutateAndRefresh, palette])

  const savePalette = useCallback((name, description) => {
    mutateAndRefresh(async () => {
      if (palette?.id) {
        await apiRequest(`/api/v1/plants/palettes/${palette.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name, description }),
        })
        return
      }

      const created = await apiRequest('/api/v1/plants/palettes', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          created_by: currentContributorId || 'anonymous',
        }),
      })
      setPalette(created)
    })
  }, [currentContributorId, mutateAndRefresh, palette])

  const clearPalette = useCallback(() => {
    if (!palette?.strates) return

    const items = Object.values(palette.strates).flat()
    if (items.length === 0) return

    setDeleteConfirm({
      title: 'Vider la palette ?',
      message: `Les ${items.length} plante(s) seront retirées de la palette.`,
      action: () => mutateAndRefresh(async () => {
        await Promise.all(
          items.map((item) =>
            apiRequest(`/api/v1/plants/palette-items/${item.paletteItemId || item.id}`, { method: 'DELETE' })
          )
        )
      }),
    })
  }, [mutateAndRefresh, palette])

  const activitiesForContributor = useMemo(() => {
    if (!contributorPayload) return []
    return contributorPayload.recentActivity || []
  }, [contributorPayload])

  // Genera list for species form
  const allGenera = useMemo(() => {
    return results
      .filter((item) => item.type === 'genus')
      .map((item) => ({ id: item.id, latinName: item.latinName, description: '' }))
  }, [results])

  // All species list for variety form
  const allSpeciesList = useMemo(() => {
    return results
      .filter((item) => item.type === 'species')
      .map((item) => ({ id: item.id, latinName: item.latinName }))
  }, [results])

  // Open form modals
  const openGenusForm = useCallback((genus = null, commonNames = []) => {
    setNotice(null)
    setGenusFormModal({ genus, commonNames })
  }, [])

  const openSpeciesForm = useCallback((species = null, defaultGenusId = null, commonNames = []) => {
    setNotice(null)
    setSpeciesFormModal({ species, defaultGenusId, commonNames })
  }, [])

  const openVarietyForm = useCallback((variety = null, defaultSpeciesId = null, commonNames = []) => {
    setNotice(null)
    setVarietyFormModal({ variety, defaultSpeciesId, commonNames })
  }, [])

  // Submit genus form
  const submitGenusForm = useCallback(async (data) => {
    const success = await mutateAndRefresh(async () => {
      const body = { ...data, contributor_id: currentContributorId }
      if (genusFormModal?.genus?.id) {
        await apiRequest(`/api/v1/plants/genera/${genusFormModal.genus.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      } else {
        const result = await apiRequest('/api/v1/plants/genera', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        navigateTo('genus', result.id)
      }
    })
    if (success) {
      setGenusFormModal(null)
      setNotice(genusFormModal?.genus ? 'Genre mis à jour.' : 'Genre créé avec succès.')
    }
  }, [currentContributorId, genusFormModal, mutateAndRefresh, navigateTo])

  // Submit species form
  const submitSpeciesForm = useCallback(async (data) => {
    const success = await mutateAndRefresh(async () => {
      const body = { ...data, contributor_id: currentContributorId }
      if (speciesFormModal?.species?.id) {
        await apiRequest(`/api/v1/plants/species/${speciesFormModal.species.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      } else {
        const result = await apiRequest('/api/v1/plants/species', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        navigateTo('species', result.id)
      }
    })
    if (success) {
      setSpeciesFormModal(null)
      setNotice(speciesFormModal?.species ? 'Espèce mise à jour.' : 'Espèce créée avec succès.')
    }
  }, [currentContributorId, mutateAndRefresh, navigateTo, speciesFormModal])

  // Submit variety form
  const submitVarietyForm = useCallback(async (data) => {
    const success = await mutateAndRefresh(async () => {
      const body = { ...data, contributor_id: currentContributorId }
      if (varietyFormModal?.variety?.id) {
        await apiRequest(`/api/v1/plants/varieties/${varietyFormModal.variety.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      } else {
        const result = await apiRequest('/api/v1/plants/varieties', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        navigateTo('variety', result.id)
      }
    })
    if (success) {
      setVarietyFormModal(null)
      setNotice(varietyFormModal?.variety ? 'Variété mise à jour.' : 'Variété créée avec succès.')
    }
  }, [currentContributorId, mutateAndRefresh, navigateTo, varietyFormModal])

  const exportPalettePdf = useCallback(() => {
    if (!palette?.id) {
      setNotice('Sauvegardez la palette avant export PDF.')
      return
    }
    window.open(`/api/v1/plants/palettes/${palette.id}/export`, '_blank', 'noopener,noreferrer')
  }, [palette?.id])

  const sendPaletteToDesignStudio = useCallback(async () => {
    if (!palette?.id) {
      setNotice('Sauvegardez la palette avant envoi au Design Studio.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const payload = await apiRequest(`/api/v1/plants/palettes/${palette.id}/send-to-design-studio`, {
        method: 'POST',
      })
      setNotice(payload.message || 'Palette envoyée.')
      window.location.href = payload.designStudioUrl
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [palette?.id])

  if (loading || !filterOptions) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-stone-500">Chargement Bases de données végétales...</p>
      </div>
    )
  }

  return (
    <div className="text-stone-900">

      {error && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
        </div>
      )}

      {busy && (
        <div className="max-w-5xl mx-auto px-4 pt-2 text-xs text-stone-500">Synchronisation en cours...</div>
      )}

      {route.view === 'search' && (
        <>
          <SearchView
            filterOptions={filterOptions}
            filters={filters}
            results={results}
            paletteItemIds={paletteItemIds}
            onSearchChange={(query) => setFilters((previous) => ({ ...previous, query }))}
            onFiltersChange={setFilters}
            onResultSelect={(id, type) => navigateTo(type === 'genus' ? 'genus' : type, id)}
            onAddToPalette={addToPalette}
          />
          {/* Floating Add Button */}
          <AddPlantMenu
            onAddGenus={() => openGenusForm()}
            onAddSpecies={() => openSpeciesForm()}
            onAddVariety={() => openVarietyForm()}
          />
        </>
      )}

      {route.view === 'genus' && genusPayload && (
        <GenusDetail
          genus={genusPayload.genus}
          species={genusPayload.species || []}
          commonNames={genusPayload.commonNames || []}
          references={genusPayload.references || []}
          photos={genusPayload.photos || []}
          notes={genusPayload.notes || []}
          contributors={genusPayload.contributors || []}
          aiSummary={genusPayload.aiSummary}
          filterOptions={filterOptions}
          allGenera={results.filter((item) => item.type === 'genus').map((item) => ({ id: item.id, latinName: item.latinName, description: '' }))}
          allCommonNames={[]}
          onSpeciesSelect={(id) => navigateTo('species', id)}
          onContributorSelect={(id) => navigateTo('contributor', id)}
          onGenusSelect={(id) => navigateTo('genus', id)}
          onGenerateAISummary={() => generateAiSummary('genus', genusPayload.genus.id)}
          onAddPhoto={() => openPhotoModal('genus', genusPayload.genus.id)}
          onAddNote={() => openNoteModal('genus', genusPayload.genus.id)}
          onAddReference={() => openReferenceModal('genus', genusPayload.genus.id)}
          onAddSpecies={() => openSpeciesForm(null, genusPayload.genus.id)}
          onEdit={() => openGenusForm(genusPayload.genus, genusPayload.commonNames || [])}
        />
      )}

      {route.view === 'species' && speciesPayload && (
        <SpeciesDetail
          species={speciesPayload.species}
          genus={speciesPayload.genus}
          varieties={speciesPayload.varieties || []}
          commonNames={speciesPayload.commonNames || []}
          references={speciesPayload.references || []}
          photos={speciesPayload.photos || []}
          notes={speciesPayload.notes || []}
          plantLocations={speciesPayload.locations || []}
          nurseryStocks={speciesPayload.nurseryStock || []}
          contributors={speciesPayload.contributors || []}
          aiSummary={speciesPayload.aiSummary}
          filterOptions={filterOptions}
          siblingSpecies={speciesPayload.siblingSpecies || []}
          onVarietySelect={(id) => navigateTo('variety', id)}
          onGenusSelect={(id) => navigateTo('genus', id)}
          onContributorSelect={(id) => navigateTo('contributor', id)}
          onAddToPalette={(strate) => addToPalette(speciesPayload.species.id, 'species', strate)}
          onGenerateAISummary={() => generateAiSummary('species', speciesPayload.species.id)}
          onAddPhoto={() => openPhotoModal('species', speciesPayload.species.id)}
          onAddNote={() => openNoteModal('species', speciesPayload.species.id)}
          onAddReference={() => openReferenceModal('species', speciesPayload.species.id)}
          onAddVariety={() => openVarietyForm(null, speciesPayload.species.id)}
          onEdit={() => openSpeciesForm(speciesPayload.species, speciesPayload.species.genusId, speciesPayload.commonNames || [])}
        />
      )}

      {route.view === 'variety' && varietyPayload && (
        <VarietyDetail
          variety={varietyPayload.variety}
          species={varietyPayload.species}
          genus={varietyPayload.genus}
          commonNames={varietyPayload.commonNames || []}
          references={varietyPayload.references || []}
          photos={varietyPayload.photos || []}
          notes={varietyPayload.notes || []}
          plantLocations={varietyPayload.locations || []}
          nurseryStocks={varietyPayload.nurseryStock || []}
          contributors={varietyPayload.contributors || []}
          aiSummary={varietyPayload.aiSummary}
          filterOptions={filterOptions}
          varieties={varietyPayload.siblingVarieties || []}
          onVarietySelect={(id) => navigateTo('variety', id)}
          onSpeciesSelect={(id) => navigateTo('species', id)}
          onContributorSelect={(id) => navigateTo('contributor', id)}
          onAddToPalette={(strate) => addToPalette(varietyPayload.variety.id, 'variety', strate)}
          onGenerateAISummary={() => generateAiSummary('variety', varietyPayload.variety.id)}
          onAddPhoto={() => openPhotoModal('variety', varietyPayload.variety.id)}
          onAddNote={() => openNoteModal('variety', varietyPayload.variety.id)}
          onAddReference={() => openReferenceModal('variety', varietyPayload.variety.id)}
          onEdit={() => openVarietyForm(varietyPayload.variety, varietyPayload.variety.speciesId)}
        />
      )}

      {route.view === 'palette' && (
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white">
            <PlantPalette
              palette={palette}
              species={catalogSpecies}
              varieties={catalogVarieties}
              onRemoveItem={removePaletteItem}
              onMoveItem={movePaletteItem}
              onSave={savePalette}
              onClear={clearPalette}
              onExportPDF={exportPalettePdf}
              onSendToDesignStudio={sendPaletteToDesignStudio}
            />
          </div>
        </div>
      )}

      {route.view === 'activity' && (
        <ActivityFeed
          activities={activities}
          contributors={contributors}
          onActivitySelect={(targetId, targetType) => navigateTo(targetType, targetId)}
          onContributorSelect={(id) => navigateTo('contributor', id)}
          hasMore={false}
        />
      )}

      {route.view === 'contributor' && contributorPayload?.contributor && (
        <ContributorProfile
          contributor={contributorPayload.contributor}
          recentActivities={activitiesForContributor}
          onActivitySelect={(targetId, targetType) => navigateTo(targetType, targetId)}
        />
      )}

      {notice && (
        <div className="fixed bottom-4 right-4 z-30">
          <div className="rounded-xl bg-stone-900 text-white text-sm px-3 py-2 shadow-lg">
            {notice}
            <button className="ml-3 underline" onClick={() => setNotice(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}

      <ContributionModal
        modal={contributionModal}
        busy={busy}
        onClose={() => setContributionModal(null)}
        onChange={updateContributionValue}
        onSubmit={submitContributionModal}
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

      {/* Genus Form Modal */}
      {genusFormModal && (
        <GenusFormModal
          genus={genusFormModal.genus}
          existingCommonNames={genusFormModal.commonNames || []}
          onSubmit={submitGenusForm}
          onCancel={() => setGenusFormModal(null)}
          busy={busy}
        />
      )}

      {/* Species Form Modal */}
      {speciesFormModal && (
        <SpeciesFormModal
          species={speciesFormModal.species}
          genera={allGenera}
          filterOptions={filterOptions}
          existingCommonNames={speciesFormModal.commonNames || []}
          defaultGenusId={speciesFormModal.defaultGenusId}
          onSubmit={submitSpeciesForm}
          onCancel={() => setSpeciesFormModal(null)}
          busy={busy}
        />
      )}

      {/* Variety Form Modal */}
      {varietyFormModal && (
        <VarietyFormModal
          variety={varietyFormModal.variety}
          availableSpecies={allSpeciesList}
          defaultSpeciesId={varietyFormModal.defaultSpeciesId}
          onSubmit={submitVarietyForm}
          onCancel={() => setVarietyFormModal(null)}
          busy={busy}
        />
      )}
    </div>
  )
}
