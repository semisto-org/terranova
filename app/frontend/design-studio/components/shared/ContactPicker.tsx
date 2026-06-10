import { useState, useEffect, useRef } from 'react'
import { Search, UserPlus, Loader2, Check } from 'lucide-react'
import { apiRequest } from '@/lib/api'

export interface ContactOption {
  id: string
  name: string
  email: string
  phone: string
}

export interface ContactPickerSelection {
  contact_id?: string
  name?: string
  email?: string
  phone?: string
}

interface ContactPickerProps {
  // Appelé quand l'utilisateur choisit un contact existant ou en crée un inline.
  onSelect: (payload: ContactPickerSelection) => void | Promise<void>
  // Ids de contacts déjà liés (masqués des résultats).
  excludeContactIds?: string[]
  busy?: boolean
  placeholder?: string
}

const inputClass =
  'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-[#5B5781] focus:border-transparent'

// Sélecteur de contact réutilisable : recherche dans les contacts existants
// (GET /api/v1/lab/contacts) et permet la création inline (nom/email/téléphone).
export function ContactPicker({
  onSelect,
  excludeContactIds = [],
  busy = false,
  placeholder = 'Rechercher un contact…',
}: ContactPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ContactOption[]>([])
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ name: '', email: '', phone: '' })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await apiRequest(
          `/api/v1/lab/contacts?q=${encodeURIComponent(query.trim())}`,
        )
        const items: ContactOption[] = (data?.items || []).map((c: ContactOption) => ({
          id: String(c.id),
          name: c.name || '',
          email: c.email || '',
          phone: c.phone || '',
        }))
        setResults(items.filter((c) => !excludeContactIds.includes(c.id)))
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, excludeContactIds])

  const handleSelectExisting = async (contact: ContactOption) => {
    await onSelect({ contact_id: contact.id })
    setQuery('')
    setResults([])
  }

  const handleCreate = async () => {
    if (!draft.name.trim() && !draft.email.trim()) return
    await onSelect({
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
    })
    setDraft({ name: '', email: '', phone: '' })
    setCreating(false)
  }

  return (
    <div className="space-y-3">
      {!creating && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className={`${inputClass} pl-9`}
              disabled={busy}
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 animate-spin" />
            )}
          </div>

          {results.length > 0 && (
            <ul className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100 max-h-56 overflow-auto">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleSelectExisting(c)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-stone-50 transition-colors disabled:opacity-50"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-stone-900 truncate">
                        {c.name || '(sans nom)'}
                      </span>
                      <span className="block text-xs text-stone-500 truncate">
                        {[c.email, c.phone].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <Check className="w-4 h-4 text-[#5B5781] opacity-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim().length >= 2 && !searching && results.length === 0 && (
            <p className="text-xs text-stone-500 px-1">Aucun contact trouvé.</p>
          )}

          <button
            type="button"
            onClick={() => {
              setCreating(true)
              setDraft((d) => ({ ...d, name: query.trim() }))
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#5B5781] hover:underline"
          >
            <UserPlus className="w-4 h-4" />
            Créer un nouveau contact
          </button>
        </>
      )}

      {creating && (
        <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3 space-y-2">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Nom et prénom"
            className={inputClass}
          />
          <input
            type="email"
            value={draft.email}
            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
            placeholder="Adresse e-mail"
            className={inputClass}
          />
          <input
            type="tel"
            value={draft.phone}
            onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
            placeholder="Téléphone (optionnel)"
            className={inputClass}
          />
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={busy || (!draft.name.trim() && !draft.email.trim())}
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#5B5781] px-4 py-2 text-sm font-medium text-white hover:bg-[#4a4669] disabled:opacity-50 transition-colors"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
