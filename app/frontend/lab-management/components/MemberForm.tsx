import { useState, useEffect, useRef, useCallback } from 'react'
import type { Member } from '../types'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]'

const AVAILABLE_ROLES = [
  { value: 'designer', label: 'Designer', description: 'Design de forêts-jardins' },
  { value: 'formateur', label: 'Formateur·ice', description: 'Formation Academy' },
  { value: 'coordination', label: 'Coordination', description: 'Coordination de pôle' },
  { value: 'comptable', label: 'Comptable', description: 'Gestion financière' },
  { value: 'shaper', label: 'Shaper', description: 'Shape Up - définition produits' },
  { value: 'communication', label: 'Communication', description: 'Communication et marketing' },
  { value: 'IT', label: 'IT', description: 'Développement et maintenance outils' },
]

export interface MemberFormProps {
  member?: Member | null
  onSubmit: (values: {
    first_name: string
    last_name: string
    email: string
    roles: string[]
    is_admin: boolean
    avatar_file?: File | null
    remove_avatar?: boolean
  }) => Promise<void>
  onCancel: () => void
  busy?: boolean
}

export function MemberForm({ member, onSubmit, onCancel, busy = false }: MemberFormProps) {
  const isEdit = Boolean(member)
  const firstNameRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [firstName, setFirstName] = useState(member?.firstName ?? '')
  const [lastName, setLastName] = useState(member?.lastName ?? '')
  const [email, setEmail] = useState(member?.email ?? '')
  const [selectedRoles, setSelectedRoles] = useState<string[]>(member?.roles ?? [])
  const [isAdmin, setIsAdmin] = useState(member?.isAdmin ?? false)
  const [error, setError] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(member?.avatar ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)

  // Focus first input when modal opens
  useEffect(() => {
    if (firstNameRef.current) {
      const timer = setTimeout(() => {
        firstNameRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
    setRemoveAvatar(false)
    setError(null)

    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleRemoveAvatar = useCallback(() => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const toggleRole = (roleValue: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleValue) ? prev.filter((r) => r !== roleValue) : [...prev, roleValue]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (selectedRoles.length === 0) {
      setError('Veuillez sélectionner au moins un rôle')
      return
    }

    try {
      await onSubmit({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        roles: selectedRoles,
        is_admin: isAdmin,
        avatar_file: avatarFile,
        remove_avatar: removeAvatar,
      })
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement')
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 px-6 py-5 border-b border-stone-200 dark:border-stone-700 bg-gradient-to-br from-stone-50 to-white dark:from-stone-800 dark:to-stone-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'var(--font-heading)' }}>
                  {isEdit ? 'Modifier le membre' : 'Nouveau membre'}
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  {isEdit
                    ? 'Mettez à jour les informations du membre'
                    : 'Ajoutez un nouveau membre à l\'équipe'}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="ml-4 p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 h-full">
            <div className="flex-1 overflow-y-auto min-h-0 p-6">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm animate-in slide-in-from-top-2 duration-200">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Avatar upload */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
                    Photo de profil
                  </label>
                  <div className="flex items-center gap-5">
                    <div className="relative flex-shrink-0">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar"
                          className="w-20 h-20 rounded-xl object-cover border-2 border-stone-200 dark:border-stone-600 ring-2 ring-stone-100 dark:ring-stone-700"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#5B5781]/20 to-[#5B5781]/5 dark:from-[#5B5781]/30 dark:to-[#5B5781]/10 border-2 border-dashed border-stone-300 dark:border-stone-600 flex items-center justify-center text-stone-400 dark:text-stone-500">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 text-sm font-medium text-stone-700 dark:text-stone-300 rounded-lg border border-stone-300 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                          {avatarPreview ? 'Changer l\'image' : 'Choisir une image'}
                        </button>
                        {avatarPreview && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
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
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        JPG, PNG, GIF ou WebP. 5 Mo maximum.
                      </p>
                      {avatarFile && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          {avatarFile.name} sélectionné
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name fields - side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="member-first-name"
                      className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2"
                    >
                      Prénom <span className="text-rose-500">*</span>
                    </label>
                    <input
                      ref={firstNameRef}
                      id="member-first-name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className={inputBase}
                      placeholder="ex: Sophie"
                      autoComplete="given-name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="member-last-name"
                      className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2"
                    >
                      Nom <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="member-last-name"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className={inputBase}
                      placeholder="ex: Dubois"
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="member-email"
                    className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2"
                  >
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="member-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputBase}
                    placeholder="ex: sophie.dubois@semisto.org"
                    autoComplete="email"
                    disabled={isEdit}
                  />
                  {isEdit && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      L'email ne peut pas être modifié après création
                    </p>
                  )}
                </div>

                {/* Roles */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
                    Rôles <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AVAILABLE_ROLES.map((role) => {
                      const isSelected = selectedRoles.includes(role.value)
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => toggleRole(role.value)}
                          className={`
                            relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                            ${
                              isSelected
                                ? 'border-[#5B5781] bg-[#5B5781]/5 dark:bg-[#5B5781]/20 shadow-sm'
                                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600'
                            }
                          `}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div
                                  className={`
                                    w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                                    ${
                                      isSelected
                                        ? 'border-[#5B5781] bg-[#5B5781]'
                                        : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800'
                                    }
                                  `}
                                >
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span
                                  className={`font-medium text-sm ${
                                    isSelected
                                      ? 'text-stone-900 dark:text-stone-100'
                                      : 'text-stone-700 dark:text-stone-300'
                                  }`}
                                >
                                  {role.label}
                                </span>
                              </div>
                              <p className="text-xs text-stone-500 dark:text-stone-400 ml-7">
                                {role.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {selectedRoles.length === 0 && (
                    <p className="text-xs text-rose-500 dark:text-rose-400 mt-2">
                      Veuillez sélectionner au moins un rôle
                    </p>
                  )}
                </div>

                {/* Admin checkbox */}
                <div className="pt-2 border-t border-stone-200 dark:border-stone-700">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={isAdmin}
                        onChange={(e) => setIsAdmin(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`
                          w-11 h-6 rounded-full transition-colors duration-200 flex items-center
                          ${isAdmin ? 'bg-[#5B5781]' : 'bg-stone-300 dark:bg-stone-600'}
                        `}
                      >
                        <div
                          className={`
                            w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200
                            ${isAdmin ? 'translate-x-5' : 'translate-x-0.5'}
                          `}
                        />
                      </div>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="font-medium text-sm text-stone-900 dark:text-stone-100">
                        Administrateur
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        Accès complet à toutes les fonctionnalités et paramètres
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="px-4 py-2 rounded-xl font-medium text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy || !firstName.trim() || !lastName.trim() || !email.trim() || selectedRoles.length === 0}
                className="px-5 py-2 rounded-xl font-medium text-white bg-[#5B5781] hover:bg-[#4a4669] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enregistrement...
                  </span>
                ) : isEdit ? (
                  'Enregistrer les modifications'
                ) : (
                  'Créer le membre'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
