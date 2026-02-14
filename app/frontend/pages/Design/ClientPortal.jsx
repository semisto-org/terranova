import React, { useCallback, useEffect, useMemo, useState } from 'react'

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

  const projectId = useMemo(() => initialProjectId || window.location.pathname.split('/').at(-1), [initialProjectId])

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
    return () => {
      mounted = false
    }
  }, [loadPortal])

  const runMutation = useCallback(async (handler, successMessage) => {
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
  }, [loadPortal])

  if (!payload) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <p className="text-sm text-stone-600">{busy ? 'Chargement du portail client...' : 'Portail indisponible.'}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6">
      <section className="max-w-5xl mx-auto space-y-4">
        <header className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Portail client</p>
          <h1 className="text-2xl font-semibold text-stone-900 mt-1">{payload.project.name}</h1>
          <p className="text-sm text-stone-600">{payload.project.address}</p>
        </header>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 space-y-2">
          <h2 className="text-lg font-semibold text-stone-900">Devis</h2>
          {(payload.quotes || []).length === 0 ? (
            <p className="text-sm text-stone-500">Aucun devis pour le moment.</p>
          ) : (
            payload.quotes.map((quote) => (
              <div key={quote.id} className="rounded-xl border border-stone-200 p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{quote.title} · v{quote.version} · {quote.status} · {quote.total}€</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded border border-emerald-500 px-2 py-1 text-emerald-700"
                    onClick={() => runMutation(
                      () => apiRequest(`/api/v1/design/client/quotes/${quote.id}/approve`, { method: 'PATCH', body: JSON.stringify({ approved_by: 'client-portal' }) }),
                      'Devis approuvé.'
                    )}
                  >
                    Approuver
                  </button>
                  <button
                    type="button"
                    className="rounded border border-red-500 px-2 py-1 text-red-700"
                    onClick={() => {
                      const comment = window.prompt('Raison du refus ?')
                      if (!comment) return
                      runMutation(
                        () => apiRequest(`/api/v1/design/client/quotes/${quote.id}/reject`, { method: 'PATCH', body: JSON.stringify({ comment }) }),
                        'Devis rejeté.'
                      )
                    }}
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">Questionnaire terrain</h2>
          <form className="grid sm:grid-cols-2 gap-2" onSubmit={(event) => {
            event.preventDefault()
            runMutation(
              () => apiRequest(`/api/v1/design/${projectId}/client/questionnaire`, { method: 'PATCH', body: JSON.stringify(questionnaire) }),
              'Questionnaire envoyé.'
            )
          }}>
            <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Observations soleil" value={questionnaire.sun_observations} onChange={(event) => setQuestionnaire((prev) => ({ ...prev, sun_observations: event.target.value }))} />
            <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Zones humides" value={questionnaire.wet_areas} onChange={(event) => setQuestionnaire((prev) => ({ ...prev, wet_areas: event.target.value }))} />
            <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Vents dominants" value={questionnaire.wind_patterns} onChange={(event) => setQuestionnaire((prev) => ({ ...prev, wind_patterns: event.target.value }))} />
            <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Historique du sol" value={questionnaire.soil_history} onChange={(event) => setQuestionnaire((prev) => ({ ...prev, soil_history: event.target.value }))} />
            <input className="sm:col-span-2 rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Faune observée" value={questionnaire.existing_wildlife} onChange={(event) => setQuestionnaire((prev) => ({ ...prev, existing_wildlife: event.target.value }))} />
            <button className="sm:col-span-2 rounded bg-[#AFBD00] px-3 py-2 text-sm font-medium text-stone-900">Envoyer</button>
          </form>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">Wishlist plantes</h2>
          <form className="grid sm:grid-cols-4 gap-2" onSubmit={(event) => {
            event.preventDefault()
            runMutation(
              () => apiRequest(`/api/v1/design/${projectId}/client/wishlist`, { method: 'POST', body: JSON.stringify(wishlistItem) }),
              'Souhait ajouté.'
            )
            setWishlistItem({ item_type: 'plant', description: '' })
          }}>
            <select className="rounded border border-stone-300 px-2 py-1 text-sm" value={wishlistItem.item_type} onChange={(event) => setWishlistItem((prev) => ({ ...prev, item_type: event.target.value }))}>
              <option value="plant">Plant</option>
              <option value="feature">Feature</option>
              <option value="material">Material</option>
            </select>
            <input className="sm:col-span-2 rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Description" value={wishlistItem.description} onChange={(event) => setWishlistItem((prev) => ({ ...prev, description: event.target.value }))} required />
            <button className="rounded bg-[#AFBD00] px-3 py-2 text-sm font-medium text-stone-900">Ajouter</button>
          </form>
          <div className="space-y-1">
            {(payload.clientContributions?.wishlist || []).length === 0 ? (
              <p className="text-sm text-stone-500">Wishlist vide.</p>
            ) : (
              payload.clientContributions.wishlist.map((item) => (
                <p key={item.id} className="text-sm text-stone-700">{item.type}: {item.description}</p>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">Journal des plantes</h2>
          <form className="grid sm:grid-cols-4 gap-2" onSubmit={(event) => {
            event.preventDefault()
            runMutation(
              () => apiRequest(`/api/v1/design/${projectId}/client/journal`, { method: 'POST', body: JSON.stringify(journalEntry) }),
              'Entrée journal ajoutée.'
            )
            setJournalEntry({ plant_id: '', species_name: '', text: '' })
          }}>
            <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Plant ID" value={journalEntry.plant_id} onChange={(event) => setJournalEntry((prev) => ({ ...prev, plant_id: event.target.value }))} required />
            <input className="rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Espèce" value={journalEntry.species_name} onChange={(event) => setJournalEntry((prev) => ({ ...prev, species_name: event.target.value }))} />
            <input className="sm:col-span-2 rounded border border-stone-300 px-2 py-1 text-sm" placeholder="Observation" value={journalEntry.text} onChange={(event) => setJournalEntry((prev) => ({ ...prev, text: event.target.value }))} required />
            <button className="sm:col-span-4 rounded bg-[#AFBD00] px-3 py-2 text-sm font-medium text-stone-900">Ajouter au journal</button>
          </form>
          <div className="space-y-2">
            {(payload.clientContributions?.plantJournal || []).length === 0 ? (
              <p className="text-sm text-stone-500">Aucune entrée de journal.</p>
            ) : (
              payload.clientContributions.plantJournal.map((entry) => (
                <div key={entry.id} className="rounded border border-stone-200 p-2">
                  <p className="text-sm font-medium text-stone-800">{entry.speciesName || entry.plantId}</p>
                  {(entry.entries || []).map((detail) => (
                    <p key={detail.id} className="text-xs text-stone-600">{detail.date}: {detail.text}</p>
                  ))}
                </div>
              ))
            )}
          </div>
        </section>
      </section>

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
    </main>
  )
}
