import { useState, useEffect, useRef, useCallback } from 'react'
import { UserCheck, AlertTriangle, X } from 'lucide-react'
import SimpleEditor from '@/components/SimpleEditor'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30 focus:border-[#B01A19]'

export function TeamMemberFormModal({ member, onSubmit, onCancel, onCheckEmail, busy = false }) {
  const isEdit = Boolean(member)
  const nameRef = useRef(null)

  const [name, setName] = useState(member?.name ?? '')
  const [email, setEmail] = useState(member?.email ?? '')
  const [phone, setPhone] = useState(member?.phone ?? '')
  const [expertise, setExpertise] = useState(member?.expertise ?? [])
  const [expertiseInput, setExpertiseInput] = useState('')
  const [notesHtml, setNotesHtml] = useState(member?.notesHtml ?? '')
  const [error, setError] = useState(null)
  const [emailCheck, setEmailCheck] = useState(null)
  const [checkingEmail, setCheckingEmail] = useState(false)

  useEffect(() => {
    if (nameRef.current) {
      const timer = setTimeout(() => nameRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  const handleEmailBlur = useCallback(async () => {
    if (isEdit || !onCheckEmail) return
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setEmailCheck(null)
      return
    }
    setCheckingEmail(true)
    try {
      const result = await onCheckEmail(trimmed)
      setEmailCheck(result)
      if (result?.exists && result?.contact?.name && !name.trim()) {
        setName(result.contact.name)
      }
    } catch {
      setEmailCheck(null)
    } finally {
      setCheckingEmail(false)
    }
  }, [email, isEdit, name, onCheckEmail])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Le nom est requis')
      return
    }
    if (!email.trim()) {
      setError('L\'adresse email est requise')
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        expertise,
        notes_html: notesHtml === '<p></p>' ? '' : notesHtml,
      })
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'enregistrement')
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 px-6 py-5 border-b border-stone-200 bg-gradient-to-br from-red-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading)' }}>
                  {isEdit ? 'Modifier le formateur' : 'Ajouter un formateur'}
                </h3>
                <p className="text-sm text-stone-500 mt-1">
                  {isEdit
                    ? 'Mettez à jour les informations du formateur'
                    : 'Ajoutez une personne à l\'équipe de formation'}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="ml-4 p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 h-full">
            <div className="flex-1 overflow-y-auto min-h-0 p-6">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in slide-in-from-top-2 duration-200">
                  {error}
                </div>
              )}

              {/* Email check banners */}
              {emailCheck?.exists && !emailCheck.hasAcademyTag && (
                <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm animate-in slide-in-from-top-2 duration-200 flex items-start gap-2.5">
                  <UserCheck className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
                  <div>
                    <p className="font-medium">Contact existant trouvé</p>
                    <p className="mt-0.5 text-blue-700">
                      « {emailCheck.contact.name} » existe déjà dans les contacts.
                      Le tag « academy » sera automatiquement ajouté.
                    </p>
                  </div>
                </div>
              )}

              {emailCheck?.exists && emailCheck.hasAcademyTag && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm animate-in slide-in-from-top-2 duration-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <p className="font-medium">Déjà dans l'équipe</p>
                    <p className="mt-0.5 text-amber-700">
                      « {emailCheck.contact.name} » fait déjà partie de l'équipe de formation.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Email */}
                <div>
                  <label htmlFor="team-email" className="block text-sm font-semibold text-stone-700 mb-2">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="team-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setEmailCheck(null)
                      }}
                      onBlur={handleEmailBlur}
                      required
                      disabled={isEdit}
                      className={`${inputBase} ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                      placeholder="prenom.nom@example.com"
                    />
                    {checkingEmail && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {!isEdit && (
                    <p className="text-xs text-stone-400 mt-1">
                      Si cette personne est déjà un contact, le tag « academy » sera ajouté automatiquement
                    </p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="team-name" className="block text-sm font-semibold text-stone-700 mb-2">
                    Nom complet <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={nameRef}
                    id="team-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={inputBase}
                    placeholder="Prénom Nom"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="team-phone" className="block text-sm font-semibold text-stone-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    id="team-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputBase}
                    placeholder="+32 470 00 00 00"
                  />
                </div>

                {/* Expertise */}
                <div>
                  <label htmlFor="team-expertise" className="block text-sm font-semibold text-stone-700 mb-2">
                    Compétences
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {expertise.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-[#B01A19]/10 px-3 py-1 text-sm font-medium text-[#B01A19]"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setExpertise((prev) => prev.filter((t) => t !== tag))}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-[#B01A19]/20 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    id="team-expertise"
                    type="text"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const val = expertiseInput.trim()
                        if (val && !expertise.includes(val)) {
                          setExpertise((prev) => [...prev, val])
                        }
                        setExpertiseInput('')
                      }
                    }}
                    className={inputBase}
                    placeholder="Tapez une compétence et appuyez Entrée"
                  />
                  <p className="text-xs text-stone-400 mt-1">
                    ex : permaculture, taille fruitière, design...
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Notes
                  </label>
                  <SimpleEditor
                    content={notesHtml}
                    onUpdate={setNotesHtml}
                    minHeight="120px"
                  />
                  <p className="text-xs text-stone-400 mt-1">
                    Compétences, disponibilités, remarques internes...
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="px-4 py-2 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy || !name.trim() || !email.trim() || (emailCheck?.exists && emailCheck?.hasAcademyTag)}
                className="px-5 py-2 rounded-xl font-medium text-white bg-[#B01A19] hover:bg-[#8f1514] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
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
                ) : emailCheck?.exists && !emailCheck?.hasAcademyTag ? (
                  'Ajouter à l\'équipe'
                ) : (
                  'Créer le formateur'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
