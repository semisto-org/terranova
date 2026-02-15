import React, { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { useShellNav } from '../../components/shell/ShellContext'
import { router } from '@inertiajs/react'

function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]')
  return meta ? meta.getAttribute('content') : ''
}

export default function ProfileIndex() {
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const fileInputRef = useRef(null)

  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })

  useShellNav({
    sections: [],
    activeSection: null,
    onSectionChange: () => {},
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/api/v1/profile')
      setMember(data)
      setAvatarPreview(data.avatar || null)
      setFields({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        password: '',
        passwordConfirmation: '',
      })
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement du profil')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image (JPG, PNG, GIF, WebP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5 Mo")
      return
    }

    setAvatarFile(file)
    setError(null)

    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)
  }, [])

  const handleRemoveAvatar = async () => {
    try {
      setSaving(true)
      setError(null)
      const response = await fetch('/api/v1/profile/avatar', {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': getCsrfToken() },
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur lors de la suppression')
      }
      const updatedMember = await response.json()
      setMember(updatedMember)
      setAvatarPreview(null)
      setAvatarFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      router.reload({ only: ['auth'] })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    if (fields.password) {
      if (fields.password !== fields.passwordConfirmation) {
        setError('Les mots de passe ne correspondent pas')
        setSaving(false)
        return
      }
      if (fields.password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères')
        setSaving(false)
        return
      }
    }

    try {
      const body = new FormData()
      body.append('first_name', fields.firstName)
      body.append('last_name', fields.lastName)
      body.append('email', fields.email)

      if (avatarFile) {
        body.append('avatar_image', avatarFile)
      }

      if (fields.password) {
        body.append('password', fields.password)
        body.append('password_confirmation', fields.passwordConfirmation)
      }

      const response = await fetch('/api/v1/profile', {
        method: 'PATCH',
        headers: { 'X-CSRF-Token': getCsrfToken() },
        body,
      })

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login'
          throw new Error('Session expirée')
        }
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `${response.status} ${response.statusText}`)
      }

      const updatedMember = await response.json()
      setMember(updatedMember)
      setAvatarPreview(updatedMember.avatar || null)
      setAvatarFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setSuccess(true)
      setFields((prev) => ({ ...prev, password: '', passwordConfirmation: '' }))

      router.reload({ only: ['auth'] })
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour du profil')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setFields((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-stone-500">Chargement...</div>
      </div>
    )
  }

  const initials = `${fields.firstName?.[0] || ''}${fields.lastName?.[0] || ''}`

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Mon profil</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
          Profil mis à jour avec succès
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar upload */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Photo de profil
          </label>
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-20 h-20 rounded-xl object-cover border-2 border-stone-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-stone-200 flex items-center justify-center text-stone-500 text-xl font-bold">
                  {initials || '?'}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-sm font-medium text-stone-700 rounded-lg border border-stone-300 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Choisir une image
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={saving}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-xs text-stone-500">
                JPG, PNG, GIF ou WebP. 5 Mo maximum.
              </p>
              {avatarFile && (
                <p className="text-xs text-emerald-600 font-medium">
                  {avatarFile.name} sélectionné
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Prénom */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Prénom
          </label>
          <input
            type="text"
            value={fields.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            required
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
          />
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Nom
          </label>
          <input
            type="text"
            value={fields.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            required
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={fields.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
          />
        </div>

        {/* Read-only info */}
        {member && (
          <div className="pt-4 border-t border-stone-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-stone-500">Statut</span>
                <p className="font-medium text-stone-900 capitalize">{member.status}</p>
              </div>
              <div>
                <span className="text-stone-500">Membre depuis</span>
                <p className="font-medium text-stone-900">
                  {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('fr-FR') : '-'}
                </p>
              </div>
              {member.roles && member.roles.length > 0 && (
                <div className="col-span-2">
                  <span className="text-stone-500">Rôles</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {member.roles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center px-2 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Password */}
        <div className="pt-4 border-t border-stone-200">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">
            Changer le mot de passe
          </h2>
          <p className="text-sm text-stone-500 mb-4">
            Laissez vide pour ne pas modifier le mot de passe
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={fields.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
                placeholder="Laissez vide pour ne pas modifier"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={fields.passwordConfirmation}
                onChange={(e) => handleChange('passwordConfirmation', e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
                placeholder="Confirmez le nouveau mot de passe"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.visit('/')}
            className="px-4 py-2 text-sm font-medium text-stone-700 rounded-xl border border-stone-300 hover:bg-stone-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white bg-stone-900 rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}
