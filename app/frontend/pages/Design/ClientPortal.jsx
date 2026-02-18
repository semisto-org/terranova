import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FileText,
  ClipboardList,
  Heart,
  BookOpen,
  Calendar,
  Check,
  X,
  Loader2,
  ChevronRight,
  Leaf,
  MapPin,
} from 'lucide-react'

function getClientToken() {
  return new URLSearchParams(window.location.search).get('token') || ''
}

function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]')
  return meta ? meta.getAttribute('content') : ''
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCsrfToken(),
      'X-Client-Token': getClientToken(),
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

const SECTIONS = [
  { id: 'quotes', label: 'Devis', icon: FileText },
  { id: 'questionnaire', label: 'Questionnaire terrain', icon: ClipboardList },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'journal', label: 'Journal des plantes', icon: BookOpen },
  { id: 'calendars', label: 'Calendriers', icon: Calendar },
]

export default function ClientPortal({ initialProjectId }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [payload, setPayload] = useState(null)
  const [questionnaire, setQuestionnaire] = useState({
    sun_observations: '',
    wet_areas: '',
    wind_patterns: '',
    soil_history: '',
    existing_wildlife: '',
  })
  const [wishlistItem, setWishlistItem] = useState({ item_type: 'plant', description: '' })
  const [journalEntry, setJournalEntry] = useState({ plant_id: '', species_name: '', text: '' })
  const [activeSection, setActiveSection] = useState('quotes')

  const projectId = useMemo(
    () => initialProjectId || window.location.pathname.split('/').at(-1),
    [initialProjectId]
  )

  const loadPortal = useCallback(async () => {
    const data = await apiRequest(`/api/v1/design/${projectId}/client-portal`)
    setPayload(data)
  }, [projectId])

  useEffect(() => {
    let mounted = true
    async function boot() {
      setBusy(true)
      setError(null)
      try {
        await loadPortal()
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setBusy(false)
      }
    }
    boot()
    return () => { mounted = false }
  }, [loadPortal])

  const runMutation = useCallback(
    async (handler, successMessage) => {
      setBusy(true)
      setError(null)
      try {
        await handler()
        await loadPortal()
        if (successMessage) setNotice(successMessage)
      } catch (err) {
        setError(err.message)
      } finally {
        setBusy(false)
      }
    },
    [loadPortal]
  )

  const handleApproveQuote = (quote) => {
    runMutation(
      () =>
        apiRequest(`/api/v1/design/client/quotes/${quote.id}/approve`, {
          method: 'PATCH',
          body: JSON.stringify({ approved_by: 'client-portal' }),
        }),
      'Devis approuvé.'
    )
  }

  const handleRejectQuote = (quote) => {
    const comment = window.prompt('Raison du refus ?')
    if (!comment) return
    runMutation(
      () =>
        apiRequest(`/api/v1/design/client/quotes/${quote.id}/reject`, {
          method: 'PATCH',
          body: JSON.stringify({ comment }),
        }),
      'Devis rejeté.'
    )
  }

  if (!payload) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--color-pole-design-bg, #e1e6d8)' }}
      >
        <div className="flex flex-col items-center gap-3 text-stone-700">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
          <p className="text-sm font-medium">
            {busy ? 'Chargement du portail client...' : 'Portail indisponible.'}
          </p>
        </div>
      </main>
    )
  }

  const quotes = payload.quotes || []
  const wishlist = payload.clientContributions?.wishlist || []
  const plantJournal = payload.clientContributions?.plantJournal || []
  const harvestCalendar = payload.harvestCalendar
  const maintenanceCalendar = payload.maintenanceCalendar
  const hasCalendars =
    (harvestCalendar?.months?.length > 0) || (maintenanceCalendar?.months?.length > 0)

  return (
    <main
      className="min-h-screen"
      style={{ background: 'var(--color-pole-design-bg, #e1e6d8)' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="rounded-2xl border-2 border-[#AFBD00]/30 bg-white/90 backdrop-blur-sm p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500 mb-1">
                Portail client
              </p>
              <h1
                className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {payload.project.name}
              </h1>
              {payload.project.address && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-600">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                  {payload.project.address}
                </p>
              )}
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sticky nav */}
          <nav
            className="lg:w-56 shrink-0 lg:sticky lg:top-6 self-start"
            aria-label="Sections du portail"
          >
            <div className="rounded-2xl border border-stone-200/80 bg-white/80 p-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 px-2 py-1 mb-1">
                Navigation
              </p>
              <ul className="space-y-0.5">
                {SECTIONS.map(({ id, label, icon: Icon }) => {
                  const isActive = activeSection === id
                  return (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        onClick={(e) => {
                          e.preventDefault()
                          setActiveSection(id)
                          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
                        }}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#AFBD00]/20 text-stone-900'
                            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        {label}
                        <ChevronRight className="h-4 w-4 ml-auto opacity-50" aria-hidden />
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Devis */}
            <section
              id="quotes"
              className="scroll-mt-6"
              onFocus={() => setActiveSection('quotes')}
            >
              <div className="rounded-2xl border-2 border-stone-200/80 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-900 mb-4">
                  <FileText className="h-5 w-5 text-[#AFBD00]" aria-hidden />
                  Devis
                </h2>
                {quotes.length === 0 ? (
                  <p className="text-sm text-stone-500 py-2">Aucun devis pour le moment.</p>
                ) : (
                  <ul className="space-y-3">
                    {quotes.map((quote) => (
                      <li
                        key={quote.id}
                        className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="text-sm text-stone-700">
                          <span className="font-medium">{quote.title}</span>
                          <span className="text-stone-500 mx-1">·</span>
                          <span>v{quote.version}</span>
                          <span className="mx-1 text-stone-400">·</span>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              quote.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : quote.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {quote.status}
                          </span>
                          <span className="ml-1 font-medium text-stone-900">{quote.total} €</span>
                        </div>
                        {quote.status !== 'approved' && quote.status !== 'rejected' && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-emerald-500 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                              onClick={() => handleApproveQuote(quote)}
                            >
                              <Check className="h-4 w-4" aria-hidden />
                              Approuver
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-red-400 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                              onClick={() => handleRejectQuote(quote)}
                            >
                              <X className="h-4 w-4" aria-hidden />
                              Rejeter
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Questionnaire terrain */}
            <section
              id="questionnaire"
              className="scroll-mt-6"
              onFocus={() => setActiveSection('questionnaire')}
            >
              <div className="rounded-2xl border-2 border-stone-200/80 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-900 mb-4">
                  <ClipboardList className="h-5 w-5 text-[#AFBD00]" aria-hidden />
                  Questionnaire terrain
                </h2>
                <form
                  className="grid sm:grid-cols-2 gap-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    runMutation(
                      () =>
                        apiRequest(`/api/v1/design/${projectId}/client/questionnaire`, {
                          method: 'PATCH',
                          body: JSON.stringify(questionnaire),
                        }),
                      'Questionnaire envoyé.'
                    )
                  }}
                >
                  <label className="sm:col-span-2 text-sm font-medium text-stone-700">
                    <span className="block mb-1">Observations soleil</span>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-[#AFBD00] focus:ring-2 focus:ring-[#AFBD00]/20 outline-none transition"
                      placeholder="Exposition, zones ensoleillées..."
                      value={questionnaire.sun_observations}
                      onChange={(e) =>
                        setQuestionnaire((prev) => ({ ...prev, sun_observations: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-sm font-medium text-stone-700">
                    <span className="block mb-1">Zones humides</span>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-[#AFBD00] focus:ring-2 focus:ring-[#AFBD00]/20 outline-none transition"
                      placeholder="Zones humides"
                      value={questionnaire.wet_areas}
                      onChange={(e) =>
                        setQuestionnaire((prev) => ({ ...prev, wet_areas: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-sm font-medium text-stone-700">
                    <span className="block mb-1">Vents dominants</span>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-[#AFBD00] focus:ring-2 focus:ring-[#AFBD00]/20 outline-none transition"
                      placeholder="Direction, force..."
                      value={questionnaire.wind_patterns}
                      onChange={(e) =>
                        setQuestionnaire((prev) => ({ ...prev, wind_patterns: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-sm font-medium text-stone-700">
                    <span className="block mb-1">Historique du sol</span>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-[#AFBD00] focus:ring-2 focus:ring-[#AFBD00]/20 outline-none transition"
                      placeholder="Ancien usage, amendements..."
                      value={questionnaire.soil_history}
                      onChange={(e) =>
                        setQuestionnaire((prev) => ({ ...prev, soil_history: e.target.value }))
                      }
                    />
                  </label>
                  <label className="sm:col-span-2 text-sm font-medium text-stone-700">
                    <span className="block mb-1">Faune observée</span>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-[#AFBD00] focus:ring-2 focus:ring-[#AFBD00]/20 outline-none transition"
                      placeholder="Oiseaux, insectes, mammifères..."
                      value={questionnaire.existing_wildlife}
                      onChange={(e) =>
                        setQuestionnaire((prev) => ({
                          ...prev,
                          existing_wildlife: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="rounded-xl bg-[#AFBD00] px-4 py-2.5 text-sm font-semibold text-stone-900 hover:bg-[#9aa800] transition-colors shadow-sm"
                    >
                      Envoyer le questionnaire
                    </button>
                  </div>
                </form>
              </div>
            </section>

            {/* Wishlist */}
            <section
              id="wishlist"
              className="scroll-mt-6"
              onFocus={() => setActiveSection('wishlist')}
            >
              <div className="rounded-2xl border-2 border-stone-200/80 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-900 mb-4">
                  <Heart className="h-5 w-5 text-[#AFBD00]" aria-hidden />
                  Wishlist plantes
                </h2>
                <form
                  className="grid sm:grid-cols-4 gap-3 mb-6"
                  onSubmit={(e) => {
                    e.preventDefault()
                    runMutation(
                      () =>
                        apiRequest(`/api/v1/design/${projectId}/client/wishlist`, {
                          method: 'POST',
                          body: JSON.stringify(wishlistItem),
                        }),
                      'Souhait ajouté.'
                    )
                    setWishlistItem({ item_type: 'plant', description: '' })
                  }}
                >
                  <select
                    className="rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-[#AFBD00] focus:ring-2 focus:ring-[#AFBD00]/20 outline-none transition"
                    value={wishlistItem.item_type}
                    onChange={(e) =>
                      setWishlistItem((prev) => ({ ...prev, item_type: e.target.value }))
                    }
                  >
                    <option value="plant">Plant</option>
                    <option value="feature">Feature</option>
                    <option value="material">Material</option>
                  </select>
                  <input
                    type="text"
                    className="sm:col-span-2 rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-[#AFBD00] focus:ring-2 focus:ring-[#AFBD00]/20 outline-none transition"
                    placeholder="Description du souhait"
                    value={wishlistItem.description}
                    onChange={(e) =>
                      setWishlistItem((prev) => ({ ...prev, description: e.target.value }))
                    }
                    required
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-[#9aa800] transition-colors shadow-sm"
                  >
                    Ajouter
                  </button>
                </form>
                {wishlist.length === 0 ? (
                  <p className="text-sm text-stone-500 py-2">Wishlist vide.</p>
                ) : (
                  <ul className="space-y-2">
                    {wishlist.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2 text-sm"
                      >
                        <Leaf className="h-4 w-4 text-stone-400 shrink-0" aria-hidden />
                        <span className="font-medium text-stone-600 capitalize">{item.type}</span>
                        <span className="text-stone-500">—</span>
                        <span className="text-stone-800">{item.description}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Journal des plantes */}
            <section
              id="journal"
              className="scroll-mt-6"
              onFocus={() => setActiveSection('journal')}
            >
              <div className="rounded-2xl border-2 border-stone-200/80 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-900 mb-4">
                  <BookOpen className="h-5 w-5 text-[#AFBD00]" aria-hidden />
                  Journal des plantes
                </h2>
                <form
                  className="grid sm:grid-cols-4 gap-3 mb-6"
                  onSubmit={(e) => {
                    e.preventDefault()
                    runMutation(
                      () =>
                        apiRequest(`/api/v1/design/${projectId}/client/journal`, {
                          method: 'POST',
                          body: JSON.stringify(journalEntry),
                        }),
                      'Entrée journal ajoutée.'
                    )
                    setJournalEntry({ plant_id: '', species_name: '', text: '' })
                  }}
                >
                  <input
                    type="text"
                    className="rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-[#AFBD00] focus:ring-2 focus:ring-[#AFBD00]/20 outline-none transition"
                    placeholder="Plant ID"
                    value={journalEntry.plant_id}
                    onChange={(e) =>
                      setJournalEntry((prev) => ({ ...prev, plant_id: e.target.value }))
                    }
                    required
                  />
                  <input
                    type="text"
                    className="rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-[#AFBD00] focus:ring-2 focus:ring-[#AFBD00]/20 outline-none transition"
                    placeholder="Espèce"
                    value={journalEntry.species_name}
                    onChange={(e) =>
                      setJournalEntry((prev) => ({ ...prev, species_name: e.target.value }))
                    }
                  />
                  <input
                    type="text"
                    className="sm:col-span-2 rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-[#AFBD00] focus:ring-2 focus:ring-[#AFBD00]/20 outline-none transition"
                    placeholder="Observation"
                    value={journalEntry.text}
                    onChange={(e) =>
                      setJournalEntry((prev) => ({ ...prev, text: e.target.value }))
                    }
                    required
                  />
                  <div className="sm:col-span-4">
                    <button
                      type="submit"
                      className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-[#9aa800] transition-colors shadow-sm"
                    >
                      Ajouter au journal
                    </button>
                  </div>
                </form>
                {plantJournal.length === 0 ? (
                  <p className="text-sm text-stone-500 py-2">Aucune entrée de journal.</p>
                ) : (
                  <ul className="space-y-4">
                    {plantJournal.map((entry) => (
                      <li
                        key={entry.id}
                        className="rounded-xl border border-stone-200 bg-stone-50/80 p-4"
                      >
                        <p className="text-sm font-medium text-stone-800 mb-2">
                          {entry.speciesName || entry.plantId || 'Plant'}
                        </p>
                        <ul className="space-y-1">
                          {(entry.entries || []).map((detail) => (
                            <li key={detail.id} className="text-xs text-stone-600 pl-2 border-l-2 border-[#AFBD00]/40">
                              <span className="text-stone-500">{detail.date}</span>
                              <span className="ml-2">{detail.text}</span>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Calendriers */}
            {(harvestCalendar || maintenanceCalendar) && (
              <section
                id="calendars"
                className="scroll-mt-6"
                onFocus={() => setActiveSection('calendars')}
              >
                <div className="rounded-2xl border-2 border-stone-200/80 bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-900 mb-4">
                    <Calendar className="h-5 w-5 text-[#AFBD00]" aria-hidden />
                    Calendriers
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {harvestCalendar?.months?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-stone-700 mb-2">
                          Récoltes
                        </h3>
                        <ul className="space-y-2 text-sm text-stone-600">
                          {harvestCalendar.months.slice(0, 6).map((month) => (
                            <li key={month.month} className="flex justify-between gap-2">
                              <span className="font-medium text-stone-700">{month.name}</span>
                              <span>
                                {(month.harvests || []).length} récolte(s)
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {maintenanceCalendar?.months?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-stone-700 mb-2">
                          Maintenance
                        </h3>
                        <ul className="space-y-2 text-sm text-stone-600">
                          {maintenanceCalendar.months.slice(0, 6).map((month) => (
                            <li key={month.month} className="flex justify-between gap-2">
                              <span className="font-medium text-stone-700">{month.name}</span>
                              <span>
                                {(month.tasks || []).length} tâche(s)
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Calendriers (empty state when no data) */}
            {!hasCalendars && (
              <section id="calendars" className="scroll-mt-6">
                <div className="rounded-2xl border-2 border-stone-200/80 bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-900 mb-4">
                    <Calendar className="h-5 w-5 text-[#AFBD00]" aria-hidden />
                    Calendriers
                  </h2>
                  <p className="text-sm text-stone-500 py-2">
                    Les calendriers de récolte et de maintenance seront affichés ici lorsqu’ils seront renseignés.
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 max-w-sm" aria-live="polite">
        {busy && (
          <div className="rounded-xl bg-stone-800 text-white text-sm px-4 py-3 flex items-center gap-2 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
            Synchronisation...
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-red-600 text-white text-sm px-4 py-3 shadow-lg flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              className="shrink-0 p-1 rounded-lg hover:bg-red-500 transition-colors"
              onClick={() => setError(null)}
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {notice && (
          <div className="rounded-xl bg-emerald-600 text-white text-sm px-4 py-3 shadow-lg flex items-center justify-between gap-3">
            <span>{notice}</span>
            <button
              type="button"
              className="shrink-0 underline font-medium hover:no-underline"
              onClick={() => setNotice(null)}
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
