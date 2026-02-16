import React, { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import SimpleEditor from '@/components/SimpleEditor'
import { useShellNav } from '@/components/shell/ShellContext'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'

const ACADEMY_SECTIONS = [
  { id: 'kanban', label: 'Formations' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'types', label: 'Types de formations' },
  { id: 'locations', label: 'Lieux' },
  { id: 'ideas', label: 'Bloc-notes' },
  { id: 'reporting', label: 'Reporting' },
]

export default function LocationForm({ locationId }) {
  const [loading, setLoading] = useState(!!locationId)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [capacity, setCapacity] = useState(20)
  const [hasAccommodation, setHasAccommodation] = useState(false)
  const [description, setDescription] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useShellNav({
    sections: ACADEMY_SECTIONS,
    activeSection: 'locations',
    onSectionChange: (id) => {
      if (id === 'locations') {
        window.location.href = '/academy?view=locations'
      } else {
        window.location.href = `/academy${id === 'kanban' ? '' : id === 'calendar' ? '/calendar' : `?view=${id}`}`
      }
    },
  })

  const isEditing = !!locationId

  useEffect(() => {
    if (locationId) {
      apiRequest('/api/v1/academy')
        .then((payload) => {
          const location = payload.trainingLocations.find((item) => item.id === locationId)
          if (location) {
            setName(location.name)
            setAddress(location.address || '')
            setCapacity(location.capacity ?? 20)
            setHasAccommodation(location.hasAccommodation || false)
            setDescription(location.description || '')
            setLatitude(location.latitude ? String(location.latitude) : '')
            setLongitude(location.longitude ? String(location.longitude) : '')
          }
          setLoading(false)
        })
        .catch((err) => {
          setError(err.message)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [locationId])

  const geocodeAddress = useCallback(async () => {
    if (!address.trim()) {
      setError('Saisissez une adresse avant de géolocaliser.')
      return
    }
    setGeocoding(true)
    setError(null)
    try {
      const query = encodeURIComponent(address.trim())
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&accept-language=fr`, {
        headers: { 'User-Agent': 'Terranova/1.0' },
      })
      const results = await response.json()
      if (results.length > 0) {
        setLatitude(String(parseFloat(results[0].lat).toFixed(6)))
        setLongitude(String(parseFloat(results[0].lon).toFixed(6)))
      } else {
        setError('Aucun résultat trouvé pour cette adresse.')
      }
    } catch {
      setError('Erreur lors de la géolocalisation.')
    } finally {
      setGeocoding(false)
    }
  }, [address])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      if (!name.trim()) {
        setError('Le nom du lieu est requis')
        return
      }

      setBusy(true)
      setError(null)

      try {
        const body = {
          name: name.trim(),
          address: address.trim(),
          description: description || '',
          capacity: Number(capacity) || 20,
          has_accommodation: hasAccommodation,
          latitude: parseFloat(latitude) || 0,
          longitude: parseFloat(longitude) || 0,
          photo_gallery: [],
          compatible_training_type_ids: [],
        }

        if (isEditing) {
          await apiRequest(`/api/v1/academy/locations/${locationId}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        } else {
          await apiRequest('/api/v1/academy/locations', {
            method: 'POST',
            body: JSON.stringify(body),
          })
        }
        window.location.href = '/academy?view=locations'
      } catch (err) {
        setError(err.message)
      } finally {
        setBusy(false)
      }
    },
    [name, address, description, capacity, hasAccommodation, latitude, longitude, isEditing, locationId]
  )

  const handleDelete = useCallback(() => {
    setDeleteConfirm({
      title: 'Supprimer ce lieu ?',
      message: `Le lieu « ${name || ''} » sera supprimé définitivement.`,
      action: async () => {
        setBusy(true)
        setError(null)
        try {
          await apiRequest(`/api/v1/academy/locations/${locationId}`, { method: 'DELETE' })
          window.location.href = '/academy?view=locations'
        } catch (err) {
          setError(err.message)
        } finally {
          setBusy(false)
        }
      },
    })
  }, [locationId, name])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-stone-500">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900 tracking-tight">
              {isEditing ? 'Modifier le lieu' : 'Nouveau lieu'}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {isEditing ? 'Modifiez les informations du lieu de formation' : 'Créez un nouveau lieu de formation'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => (window.location.href = '/academy?view=locations')}
            className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-all hover:bg-stone-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Annuler
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Nom du lieu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 placeholder-stone-400 transition-all focus:border-[#B01A19] focus:outline-none focus:ring-2 focus:ring-[#B01A19]/10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder=""
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">Adresse</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 placeholder-stone-400 transition-all focus:border-[#B01A19] focus:outline-none focus:ring-2 focus:ring-[#B01A19]/10"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">Description</label>
                <SimpleEditor
                  content={description}
                  onUpdate={setDescription}
                  minHeight="180px"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">Capacité</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 transition-all focus:border-[#B01A19] focus:outline-none focus:ring-2 focus:ring-[#B01A19]/10"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 bg-white p-3 px-4 text-sm transition-all hover:border-stone-400">
                    <input
                      type="checkbox"
                      checked={hasAccommodation}
                      onChange={(e) => setHasAccommodation(e.target.checked)}
                      className="h-4 w-4 rounded border-stone-300 text-[#B01A19] focus:ring-[#B01A19]"
                    />
                    <span className="text-stone-700">Hébergement</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-stone-700">
                    <svg className="h-4 w-4 text-[#B01A19]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Coordonnées GPS
                  </label>
                  <button
                    type="button"
                    disabled={geocoding || !address.trim()}
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
                    {geocoding ? 'Recherche...' : "Géolocaliser depuis l'adresse"}
                  </button>
                </div>
                {latitude && longitude ? (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    <svg className="h-3.5 w-3.5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>
                      {latitude}, {longitude}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLatitude('')
                        setLongitude('')
                      }}
                      className="ml-auto text-emerald-600 transition-colors hover:text-emerald-800"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500">
                    Saisissez une adresse puis cliquez sur « Géolocaliser » pour placer le lieu sur la carte.
                  </p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3 border-t border-stone-200 pt-6">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="rounded-lg border border-red-200 bg-red-50 px-6 py-3 text-sm font-medium text-red-700 transition-all hover:bg-red-100 active:scale-[0.98] disabled:opacity-50"
              >
                Supprimer
              </button>
            )}
            <button
              type="button"
              onClick={() => (window.location.href = '/academy?view=locations')}
              className="flex-1 rounded-lg border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-stone-700 transition-all hover:bg-stone-50 active:scale-[0.98]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="flex-1 rounded-lg bg-[#B01A19] px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#8f1514] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Créer le lieu'}
            </button>
          </div>
        </form>
      </div>
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
    </div>
  )
}
