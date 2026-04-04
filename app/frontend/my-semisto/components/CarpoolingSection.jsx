import React, { useState, useEffect } from 'react'
import { Car, MapPin, Phone, Mail, Pencil, Check, X, Loader2, Users } from 'lucide-react'
import { myApiRequest } from '../lib/api'
import { myApiPath } from '../lib/paths'

const CARPOOLING_LABELS = {
  none: 'Pas de covoiturage',
  seeking: 'Je cherche un covoiturage',
  offering: 'Je peux prendre des passagers',
}

const COUNTRY_LABELS = {
  BE: 'Belgique',
  FR: 'France',
  LU: 'Luxembourg',
  NL: 'Pays-Bas',
  DE: 'Allemagne',
  CH: 'Suisse',
}

const COUNTRY_OPTIONS = Object.entries(COUNTRY_LABELS)

function formatLocation(city, postalCode, country) {
  const parts = []
  if (city) parts.push(city)
  if (postalCode) parts.push(`(${postalCode})`)
  if (country && country !== 'BE') parts.push(`— ${COUNTRY_LABELS[country] || country}`)
  return parts.join(' ') || 'Non renseigné'
}

export default function CarpoolingSection({ trainingId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => {
    myApiRequest(`${myApiPath('/academy')}/${trainingId}/carpooling`)
      .then((result) => {
        setData(result)
        setForm({
          carpooling: result.myRegistration.carpooling,
          departure_city: result.myRegistration.departureCity,
          departure_postal_code: result.myRegistration.departurePostalCode,
          departure_country: result.myRegistration.departureCountry || 'BE',
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [trainingId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await myApiRequest(`${myApiPath('/academy')}/${trainingId}/carpooling`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      })
      setData((prev) => ({
        ...prev,
        myRegistration: updated,
      }))
      setEditing(false)
      // Refresh full data to get updated driver/seeker lists
      const refreshed = await myApiRequest(`${myApiPath('/academy')}/${trainingId}/carpooling`)
      setData(refreshed)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm({
      carpooling: data.myRegistration.carpooling,
      departure_city: data.myRegistration.departureCity,
      departure_postal_code: data.myRegistration.departurePostalCode,
      departure_country: data.myRegistration.departureCountry || 'BE',
    })
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-stone-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (!data) return null

  const { myRegistration, drivers, seekers } = data
  const hasParticipants = drivers.length > 0 || seekers.length > 0

  return (
    <div className="my-animate-section" style={{ animationDelay: '150ms' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#2D6A4F' }} />
        <h2
          className="text-lg text-stone-800"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Covoiturage
        </h2>
      </div>

      {/* My registration info */}
      <div className="rounded-xl bg-white border border-stone-200 p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-stone-700 flex items-center gap-2">
            <Car size={15} className="text-stone-400" />
            Mon trajet
          </h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-stone-400 hover:text-[#B01A19] transition-colors flex items-center gap-1"
            >
              <Pencil size={12} />
              Modifier
            </button>
          )}
        </div>

        {editing ? (
          <EditForm
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
          />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <MapPin size={14} className="text-stone-400 flex-shrink-0" />
              <span>
                {formatLocation(
                  myRegistration.departureCity,
                  myRegistration.departurePostalCode,
                  myRegistration.departureCountry
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <StatusBadge status={myRegistration.carpooling} />
            </div>
          </div>
        )}
      </div>

      {/* Other participants */}
      {hasParticipants && (
        <div className="space-y-3">
          {drivers.length > 0 && (
            <ParticipantList
              title={`Conducteur${drivers.length > 1 ? 's' : ''} disponible${drivers.length > 1 ? 's' : ''}`}
              count={drivers.length}
              participants={drivers}
              showContact
            />
          )}
          {seekers.length > 0 && (
            <ParticipantList
              title={`Cherche${seekers.length > 1 ? 'nt' : ''} un covoiturage`}
              count={seekers.length}
              participants={seekers}
              showContact={false}
            />
          )}
        </div>
      )}

      {!hasParticipants && myRegistration.carpooling !== 'none' && (
        <div className="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3 text-sm text-stone-500 text-center">
          Aucun autre participant n'a encore renseigné ses infos de covoiturage.
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    none: { bg: '#f5f5f4', text: '#78716c', border: '#e7e5e4' },
    seeking: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    offering: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
  }
  const c = config[status] || config.none

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {CARPOOLING_LABELS[status] || status}
    </span>
  )
}

function ParticipantList({ title, count, participants, showContact }) {
  return (
    <div className="rounded-xl bg-white border border-stone-200 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-stone-100 flex items-center gap-2">
        <Users size={14} className="text-stone-400" />
        <span className="text-xs font-medium text-stone-600">
          {title} ({count})
        </span>
      </div>
      <div className="divide-y divide-stone-100">
        {participants.map((p, i) => (
          <div key={i} className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-stone-700">
              <MapPin size={13} className="text-stone-400 flex-shrink-0" />
              <span className="font-medium">{p.firstName}</span>
              <span className="text-stone-400">—</span>
              <span className="text-stone-500">
                {formatLocation(p.departureCity, p.departurePostalCode, p.departureCountry)}
              </span>
            </div>
            {showContact && p.contactValue && (
              <ContactBadge method={p.contactMethod} value={p.contactValue} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ContactBadge({ method, value }) {
  const Icon = method === 'phone' ? Phone : Mail

  return (
    <a
      href={method === 'phone' ? `tel:${value}` : `mailto:${value}`}
      className="inline-flex items-center gap-1.5 text-xs text-[#B01A19] hover:underline flex-shrink-0"
    >
      <Icon size={12} />
      {value}
    </a>
  )
}

function EditForm({ form, setForm, onSave, onCancel, saving }) {
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Ville de départ</label>
          <input
            type="text"
            value={form.departure_city}
            onChange={(e) => update('departure_city', e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/20 focus:border-[#B01A19]"
            placeholder="ex: Namur"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Code postal</label>
          <input
            type="text"
            value={form.departure_postal_code}
            onChange={(e) => update('departure_postal_code', e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/20 focus:border-[#B01A19]"
            placeholder="ex: 5000"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Pays</label>
        <select
          value={form.departure_country}
          onChange={(e) => update('departure_country', e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/20 focus:border-[#B01A19]"
        >
          {COUNTRY_OPTIONS.map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Covoiturage</label>
        <div className="space-y-2">
          {Object.entries(CARPOOLING_LABELS).map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-2.5 cursor-pointer rounded-lg border px-3 py-2 transition-colors"
              style={{
                borderColor: form.carpooling === value ? '#B01A19' : '#e7e5e4',
                backgroundColor: form.carpooling === value ? '#fef2f2' : 'white',
              }}
            >
              <input
                type="radio"
                name="carpooling"
                value={value}
                checked={form.carpooling === value}
                onChange={(e) => update('carpooling', e.target.value)}
                className="sr-only"
              />
              <div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: form.carpooling === value ? '#B01A19' : '#d6d3d1',
                }}
              >
                {form.carpooling === value && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#B01A19' }} />
                )}
              </div>
              <span className="text-sm text-stone-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white px-3 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: '#B01A19' }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Enregistrer
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-lg border border-stone-300 transition-colors"
        >
          <X size={14} />
          Annuler
        </button>
      </div>
    </div>
  )
}
