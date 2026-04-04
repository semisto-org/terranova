import React, { useState, useEffect, useRef } from 'react'
import { usePage, router } from '@inertiajs/react'
import { User, Camera, Trash2, Save, Loader2, MapPin, Mail, Phone, Sparkles, Check, LocateFixed, BookUser } from 'lucide-react'
import MySemistoShell from '../../my-semisto/components/MySemistoShell'
import { myApiRequest } from '../../my-semisto/lib/api'
import { myPath, myApiPath } from '../../my-semisto/lib/paths'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  '#2D6A4F', '#5B5781', '#B01A19', '#234766', '#EF9B0D',
]

function hashColor(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function Profile() {
  const { auth } = usePage().props
  const contact = auth?.contact

  const [form, setForm] = useState({
    email: contact?.email || '',
    phone: contact?.phone || '',
    city: contact?.city || '',
    bio: contact?.bio || '',
    latitude: contact?.latitude || null,
    longitude: contact?.longitude || null,
    visibleInDirectory: contact?.visibleInDirectory || false,
  })
  const [expertise, setExpertise] = useState(contact?.expertise || [])
  const [newTag, setNewTag] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(contact?.avatarUrl || null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState(null)
  const fileInputRef = useRef(null)

  const color = hashColor(contact?.name)
  const initials = getInitials(contact?.name)

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setSaved(false)
  }

  function handleRemoveAvatar() {
    myApiRequest(myApiPath('/profile/avatar'), { method: 'DELETE' })
      .then(() => {
        setAvatarPreview(null)
        setAvatarFile(null)
        router.reload({ only: ['auth'] })
      })
      .catch(() => {})
  }

  async function handleGeocode() {
    const city = form.city.trim()
    if (!city) return
    setGeocoding(true)
    setGeocodeError(null)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1&accept-language=fr`,
        { headers: { 'User-Agent': 'Semisto/1.0' } }
      )
      const data = await res.json()
      if (data.length > 0) {
        setForm((prev) => ({
          ...prev,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        }))
        setSaved(false)
      } else {
        setGeocodeError('Localisation introuvable. Verifie le nom de ta ville.')
      }
    } catch {
      setGeocodeError('Erreur de geolocalisation. Reessaie plus tard.')
    } finally {
      setGeocoding(false)
    }
  }

  function handleAddTag(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = newTag.trim().replace(/,$/,'')
      if (tag && !expertise.includes(tag)) {
        setExpertise((prev) => [...prev, tag])
        setSaved(false)
      }
      setNewTag('')
    }
  }

  function handleRemoveTag(tag) {
    setExpertise((prev) => prev.filter((t) => t !== tag))
    setSaved(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('email', form.email)
      formData.append('phone', form.phone)
      formData.append('city', form.city)
      formData.append('bio', form.bio)
      formData.append('visible_in_directory', form.visibleInDirectory ? '1' : '0')
      if (form.latitude != null) formData.append('latitude', form.latitude)
      if (form.longitude != null) formData.append('longitude', form.longitude)
      expertise.forEach((tag) => formData.append('expertise[]', tag))
      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      await myApiRequest(myApiPath('/profile'), {
        method: 'PATCH',
        body: formData,
        headers: {}, // let browser set content-type for FormData
      })

      setSaved(true)
      setAvatarFile(null)
      router.reload({ only: ['auth'] })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <MySemistoShell activeNav={myPath('/profile')}>
      {/* Header */}
      <div className="mb-8 my-animate-section">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#5B578115' }}
          >
            <User size={18} style={{ color: '#5B5781' }} />
          </div>
          <div>
            <h1
              className="text-2xl text-stone-800"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Mon Profil
            </h1>
          </div>
        </div>
        <p className="text-sm text-stone-500 ml-12">
          Gere tes informations et ta visibilite dans l'annuaire
        </p>
        <hr className="my-section-divider mt-5" />
      </div>

      <form onSubmit={handleSave} className="max-w-xl">
        {/* Directory visibility toggle */}
        <div className="mb-8 my-animate-section" style={{ animationDelay: '80ms' }}>
          <button
            type="button"
            onClick={() => {
              setForm((prev) => ({ ...prev, visibleInDirectory: !prev.visibleInDirectory }))
              setSaved(false)
            }}
            className="w-full group cursor-pointer"
          >
            <div
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all"
              style={{
                borderColor: form.visibleInDirectory ? '#2D6A4F40' : '#e7e5e4',
                backgroundColor: form.visibleInDirectory ? '#2D6A4F08' : '#fafaf9',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                style={{
                  backgroundColor: form.visibleInDirectory ? '#2D6A4F18' : '#a8a29e20',
                }}
              >
                <BookUser
                  size={18}
                  style={{ color: form.visibleInDirectory ? '#2D6A4F' : '#a8a29e' }}
                  className="transition-colors"
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-stone-700">
                  Visible dans l'annuaire
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {form.visibleInDirectory
                    ? 'Ton profil apparait dans l\'annuaire Semisto'
                    : 'Ton profil n\'est pas visible dans l\'annuaire'}
                </p>
              </div>
              <div
                className="relative w-11 h-6 rounded-full shrink-0 transition-colors"
                style={{ backgroundColor: form.visibleInDirectory ? '#2D6A4F' : '#d6d3d1' }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                  style={{ left: form.visibleInDirectory ? '22px' : '2px' }}
                />
              </div>
            </div>
          </button>
        </div>

        {/* Avatar section */}
        <div className="mb-8 my-animate-section" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-5">
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={contact?.name}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: color }}
                >
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              >
                <Camera size={20} className="text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <p
                className="text-lg font-semibold text-stone-800"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {contact?.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-[#5B5781] hover:underline cursor-pointer"
                >
                  Changer la photo
                </button>
                {avatarPreview && (
                  <>
                    <span className="text-stone-300">·</span>
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="text-xs text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={11} />
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-5 my-animate-section" style={{ animationDelay: '200ms' }}>
          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Presente-toi en quelques mots..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-[#5B5781]/30 focus:ring-2 focus:ring-[#5B5781]/10 transition-all resize-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Mail size={14} className="text-stone-400" />
                Adresse e-mail
              </span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="ton@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-[#5B5781]/30 focus:ring-2 focus:ring-[#5B5781]/10 transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Phone size={14} className="text-stone-400" />
                Telephone
              </span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+32 xxx xx xx xx"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-[#5B5781]/30 focus:ring-2 focus:ring-[#5B5781]/10 transition-all"
            />
          </div>

          {/* City/Location */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-stone-400" />
                Localisation
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.city}
                onChange={(e) => {
                  handleChange('city', e.target.value)
                  // Clear coordinates when city changes
                  setForm((prev) => ({ ...prev, city: e.target.value, latitude: null, longitude: null }))
                }}
                placeholder="Bruxelles, Namur, Liege..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-[#5B5781]/30 focus:ring-2 focus:ring-[#5B5781]/10 transition-all"
              />
              <button
                type="button"
                onClick={handleGeocode}
                disabled={geocoding || !form.city.trim()}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-600 hover:bg-stone-50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-default whitespace-nowrap"
                title="Geolocaliser pour apparaitre sur la carte"
              >
                {geocoding ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <LocateFixed size={14} />
                )}
                Geolocaliser
              </button>
            </div>
            {form.latitude && form.longitude && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 text-xs text-[#2D6A4F] bg-[#2D6A4F]/10 px-2 py-0.5 rounded-full font-medium">
                  <MapPin size={10} />
                  Position enregistree
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, latitude: null, longitude: null }))
                    setSaved(false)
                  }}
                  className="text-xs text-stone-400 hover:text-red-500 cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}
            {geocodeError && (
              <p className="text-xs text-amber-600 mt-1.5">{geocodeError}</p>
            )}
            <p className="text-xs text-stone-400 mt-1">
              Geolocalise ta ville pour apparaitre sur la carte de l'annuaire
            </p>
          </div>

          {/* Expertise tags */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-stone-400" />
                Competences
              </span>
            </label>
            <div className="border border-stone-200 rounded-xl bg-white p-3 focus-within:border-[#5B5781]/30 focus-within:ring-2 focus-within:ring-[#5B5781]/10 transition-all">
              {expertise.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {expertise.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ backgroundColor: '#2D6A4F12', color: '#2D6A4F' }}
                    >
                      <Sparkles size={10} className="opacity-50" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-0.5 hover:text-red-600 cursor-pointer"
                        aria-label={`Retirer ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Ajoute une competence et appuie sur Entree..."
                className="w-full text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none bg-transparent"
              />
            </div>
            <p className="text-xs text-stone-400 mt-1.5">
              Ex : greffe de fruitiers, permaculture, design, animation...
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {/* Save button */}
        <div className="mt-8 my-animate-section" style={{ animationDelay: '300ms' }}>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all cursor-pointer disabled:opacity-60"
            style={{ backgroundColor: saved ? '#2D6A4F' : '#5B5781' }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enregistrement...
              </>
            ) : saved ? (
              <>
                <Check size={16} />
                Enregistre !
              </>
            ) : (
              <>
                <Save size={16} />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </form>
    </MySemistoShell>
  )
}
