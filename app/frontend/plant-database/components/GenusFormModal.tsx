import { useState, useEffect, useRef, useCallback } from 'react'
import { apiRequest } from '@/lib/api'
import SimpleEditor from '@/components/SimpleEditor'
import type { Genus } from '../types'

interface CommonNameEntry {
  language: string
  name: string
}

interface GenusFormModalProps {
  genus?: Genus | null
  existingCommonNames?: CommonNameEntry[]
  onSubmit: (data: {
    latin_name: string
    description: string
    common_names: CommonNameEntry[]
  }) => Promise<void>
  onCancel: () => void
  busy?: boolean
}

interface DuplicateMatch {
  id: string
  latinName: string
  commonName?: string | null
}

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
]

const inputBase =
  'w-full px-4 py-3 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/25 focus:border-[#5B5781]'

const labelBase = 'block text-sm font-semibold text-stone-700 mb-2'

export function GenusFormModal({
  genus,
  existingCommonNames = [],
  onSubmit,
  onCancel,
  busy = false,
}: GenusFormModalProps) {
  const isEdit = Boolean(genus)
  const panelRef = useRef<HTMLDivElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  const [latinName, setLatinName] = useState(genus?.latinName ?? '')
  const [description, setDescription] = useState(genus?.description ?? '')
  const [commonNames, setCommonNames] = useState<CommonNameEntry[]>(
    existingCommonNames.length > 0
      ? existingCommonNames
      : [{ language: 'fr', name: '' }]
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check for duplicate genus name
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = latinName.trim()
    if (!trimmed || trimmed.length < 2 || (isEdit && trimmed === genus?.latinName)) {
      setDuplicateMatch(null)
      setCheckingDuplicate(false)
      return
    }

    setCheckingDuplicate(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await apiRequest(`/api/v1/plants/search?query=${encodeURIComponent(trimmed)}`)
        const items = result?.items || []
        const match = items.find(
          (item: { type: string; latinName: string }) =>
            item.type === 'genus' && item.latinName.toLowerCase() === trimmed.toLowerCase()
        )
        setDuplicateMatch(match ? { id: match.id, latinName: match.latinName, commonName: match.commonName } : null)
      } catch {
        setDuplicateMatch(null)
      } finally {
        setCheckingDuplicate(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [latinName, isEdit, genus?.latinName])

  // Focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => firstInputRef.current?.focus(), 120)
    return () => clearTimeout(timer)
  }, [])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  // Focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const validate = useCallback(() => {
    const next: Record<string, string> = {}
    if (!latinName.trim()) next.latinName = 'Le nom latin est obligatoire'
    else if (!/^[A-Z][a-z]+$/.test(latinName.trim())) {
      next.latinName = 'Le nom latin doit commencer par une majuscule (ex: Malus)'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }, [latinName])

  useEffect(() => {
    if (Object.keys(touched).length > 0) validate()
  }, [latinName, touched, validate])

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }))

  const showError = (field: string) => touched[field] && errors[field]

  const addCommonName = () => {
    const usedLangs = commonNames.map((cn) => cn.language)
    const nextLang = LANGUAGES.find((l) => !usedLangs.includes(l.code))?.code || 'fr'
    setCommonNames([...commonNames, { language: nextLang, name: '' }])
  }

  const removeCommonName = (index: number) => {
    setCommonNames(commonNames.filter((_, i) => i !== index))
  }

  const updateCommonName = (index: number, field: keyof CommonNameEntry, value: string) => {
    setCommonNames(
      commonNames.map((cn, i) => (i === index ? { ...cn, [field]: value } : cn))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ latinName: true })
    if (!validate()) return

    const filteredNames = commonNames.filter((cn) => cn.name.trim())

    await onSubmit({
      latin_name: latinName.trim(),
      description: description === '<p></p>' ? '' : description,
      common_names: filteredNames,
    })
  }

  const canSubmit = !busy && latinName.trim() && Object.keys(errors).length === 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        style={{ animation: 'fadeIn 200ms ease-out' }}
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          ref={panelRef}
          className="w-full max-w-xl bg-white rounded-2xl border border-stone-200 shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col"
          style={{ animation: 'modalSlideIn 250ms ease-out' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 px-6 py-5 border-b border-stone-100 bg-gradient-to-br from-emerald-50/80 via-stone-50/50 to-white relative overflow-hidden">
            {/* Decorative leaf pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04]">
              <svg viewBox="0 0 100 100" fill="currentColor" className="text-emerald-900 w-full h-full">
                <path d="M50 5C50 5 20 25 15 55C10 85 40 95 50 95C60 95 90 85 85 55C80 25 50 5 50 5ZM50 20C50 20 35 35 32 55C29 75 45 85 50 85C55 85 71 75 68 55C65 35 50 20 50 20Z" />
              </svg>
            </div>

            <div className="flex items-center justify-between relative">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <svg className="w-4.5 h-4.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3
                    className="text-xl font-bold text-stone-900"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {isEdit ? 'Modifier le genre' : 'Nouveau genre'}
                  </h3>
                </div>
                <p className="text-sm text-stone-500 ml-[42px]">
                  {isEdit
                    ? 'Mettez à jour les informations taxonomiques'
                    : 'Ajoutez un nouveau genre botanique à la base'}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
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
            <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
              {/* Latin Name */}
              <div>
                <label htmlFor="genus-latin" className={labelBase}>
                  Nom latin <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={firstInputRef}
                    id="genus-latin"
                    type="text"
                    value={latinName}
                    onChange={(e) => setLatinName(e.target.value)}
                    onBlur={() => markTouched('latinName')}
                    className={`${inputBase} italic font-medium ${
                      showError('latinName') ? '!border-red-400 !ring-red-200' : ''
                    }`}
                    placeholder="ex: Malus, Prunus, Quercus..."
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {/* Status indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingDuplicate && (
                      <svg className="w-5 h-5 text-stone-300 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {!checkingDuplicate && latinName.trim() && !errors.latinName && !duplicateMatch && (
                      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {!checkingDuplicate && duplicateMatch && (
                      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    )}
                  </div>
                </div>
                {showError('latinName') && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {errors.latinName}
                  </p>
                )}
                {/* Duplicate warning */}
                {!errors.latinName && duplicateMatch && (
                  <div className="mt-2 flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200/80">
                    <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs leading-relaxed">
                      <p className="font-semibold text-amber-800">
                        Le genre <span className="italic">{duplicateMatch.latinName}</span> existe déjà
                        {duplicateMatch.commonName && (
                          <span className="font-normal text-amber-700"> ({duplicateMatch.commonName})</span>
                        )}
                      </p>
                      <p className="text-amber-700 mt-0.5">
                        Vérifiez qu'il ne s'agit pas d'un doublon avant de continuer.
                      </p>
                    </div>
                  </div>
                )}
                {!errors.latinName && !duplicateMatch && (
                  <p className="mt-1.5 text-xs text-stone-400">
                    Le nom du genre commence par une majuscule, sans espace
                  </p>
                )}
              </div>

              {/* Common Names */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelBase + ' !mb-0'}>
                    Noms communs
                  </label>
                  {commonNames.length < LANGUAGES.length && (
                    <button
                      type="button"
                      onClick={addCommonName}
                      className="text-xs font-medium text-[#5B5781] hover:text-[#4a4770] flex items-center gap-1 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Ajouter une langue
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {commonNames.map((cn, index) => (
                    <div key={index} className="flex items-center gap-2 group">
                      <select
                        value={cn.language}
                        onChange={(e) => updateCommonName(index, 'language', e.target.value)}
                        className="w-[120px] shrink-0 px-3 py-3 rounded-xl bg-white border border-stone-200 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/25 focus:border-[#5B5781] transition-all"
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={cn.name}
                        onChange={(e) => updateCommonName(index, 'name', e.target.value)}
                        className={inputBase}
                        placeholder={`Nom en ${LANGUAGES.find((l) => l.code === cn.language)?.label || cn.language}`}
                      />
                      {commonNames.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCommonName(index)}
                          className="p-2 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelBase}>
                  Description
                </label>
                <SimpleEditor
                  content={description}
                  onUpdate={setDescription}
                  placeholder="Description générale du genre, caractéristiques communes des espèces..."
                  minHeight="120px"
                  toolbar={['bold', 'italic', 'strike', '|', 'bulletList', 'orderedList']}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
              <p className="text-xs text-stone-400 hidden sm:block">
                <span className="text-rose-500">*</span> Champ obligatoire
              </p>
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={busy}
                  className="px-4 py-2.5 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="px-5 py-2.5 rounded-xl font-medium text-white bg-[#5B5781] hover:bg-[#4a4770] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none flex items-center gap-2"
                >
                  {busy ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Enregistrement...
                    </>
                  ) : isEdit ? (
                    'Enregistrer'
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Créer le genre
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}
