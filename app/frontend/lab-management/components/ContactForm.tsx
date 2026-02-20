import { useState } from 'react'
import type { Contact } from '../types'

export interface ContactFormValues {
  contactType: 'person' | 'organization'
  name: string
  email: string
  phone: string
  address: string
  organizationType: string
  organizationId: string
  notes: string
  tagNames: string[]
}

const ORGANIZATION_TYPES = ['Entreprise', 'Association', 'Collectivité', 'Collectif', 'Autre']
const SUGGESTED_TAGS = ['client', 'fournisseur', 'partenaire', 'bénévole', 'prestataire']

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]'

export interface ContactFormProps {
  contact?: Contact | null
  organizations: Contact[]
  onSubmit: (values: ContactFormValues) => Promise<void>
  onCancel: () => void
  busy?: boolean
}

export function ContactForm({
  contact,
  organizations,
  onSubmit,
  onCancel,
  busy = false,
}: ContactFormProps) {
  const [values, setValues] = useState<ContactFormValues>({
    contactType: contact?.contactType ?? 'person',
    name: contact?.name ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    address: contact?.address ?? '',
    organizationType: contact?.organizationType ?? '',
    organizationId: contact?.organizationId ?? '',
    notes: contact?.notes ?? '',
    tagNames: contact?.tagNames ?? [],
  })

  const [tagInput, setTagInput] = useState('')

  const update = (key: keyof ContactFormValues, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase()
    if (t && !values.tagNames.includes(t)) {
      update('tagNames', [...values.tagNames, t])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    update('tagNames', values.tagNames.filter((t) => t !== tag))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }

  const orgOptions = organizations.filter((c) => c.contactType === 'organization')
  const availableSuggestedTags = SUGGESTED_TAGS.filter((t) => !values.tagNames.includes(t))

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 transition-opacity duration-200"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl border border-stone-200 shadow-2xl shadow-stone-900/20"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 h-full">
          {/* Header */}
          <div className="shrink-0 px-6 pt-6 pb-4 border-b border-stone-100">
            <h2
              className="text-xl font-bold text-stone-900 tracking-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {contact ? 'Modifier le contact' : 'Nouveau contact'}
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">
              {contact ? 'Mettez à jour les informations du contact' : 'Ajoutez une personne ou une organisation'}
            </p>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-6">
            {/* Type toggle */}
            <div>
              <span className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                Type
              </span>
              <div
                role="group"
                aria-label="Type de contact"
                className="inline-flex p-1 rounded-xl bg-stone-100 border border-stone-200/60"
              >
                {(['person', 'organization'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => update('contactType', type)}
                    className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      values.contactType === type
                        ? 'text-white shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                    style={
                      values.contactType === type
                        ? { backgroundColor: '#5B5781' }
                        : {}
                    }
                  >
                    {type === 'person' ? 'Personne' : 'Organisation'}
                  </button>
                ))}
              </div>
            </div>

            {/* Identity section */}
            <div className="space-y-4">
              <span className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Identité
              </span>
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-stone-700 mb-1.5">
                  {values.contactType === 'person' ? 'Nom complet' : 'Raison sociale'} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={values.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                  className={inputBase}
                  placeholder={values.contactType === 'person' ? 'Jean Dupont' : 'Association Semisto'}
                  autoFocus
                />
              </div>
              {values.contactType === 'organization' && (
                <div className="transition-all duration-200">
                  <label htmlFor="org-type" className="block text-sm font-medium text-stone-700 mb-1.5">
                    Type d&apos;organisation
                  </label>
                  <select
                    id="org-type"
                    value={values.organizationType}
                    onChange={(e) => update('organizationType', e.target.value)}
                    className={inputBase}
                  >
                    <option value="">— Sélectionner —</option>
                    {ORGANIZATION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {values.contactType === 'person' && orgOptions.length > 0 && (
                <div className="transition-all duration-200">
                  <label htmlFor="org-link" className="block text-sm font-medium text-stone-700 mb-1.5">
                    Organisation rattachée
                  </label>
                  <select
                    id="org-link"
                    value={values.organizationId}
                    onChange={(e) => update('organizationId', e.target.value)}
                    className={inputBase}
                  >
                    <option value="">— Aucune —</option>
                    {orgOptions.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Contact details section */}
            <div className="space-y-4">
              <span className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Coordonnées
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-stone-700 mb-1.5">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={values.email}
                    onChange={(e) => update('email', e.target.value)}
                    className={inputBase}
                    placeholder="email@exemple.org"
                  />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-stone-700 mb-1.5">
                    Téléphone
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={values.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    className={inputBase}
                    placeholder="+32 470 00 00 00"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="contact-address" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Adresse
                </label>
                <textarea
                  id="contact-address"
                  value={values.address}
                  onChange={(e) => update('address', e.target.value)}
                  rows={2}
                  className={`${inputBase} resize-none`}
                  placeholder="Rue, numéro, code postal, ville"
                />
              </div>
            </div>

            {/* Tags section */}
            <div className="space-y-3">
              <span className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Catégorisation
              </span>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag(tagInput)
                    }
                  }}
                  placeholder="Nouveau tag..."
                  className={`flex-1 min-w-[140px] ${inputBase}`}
                />
                <button
                  type="button"
                  onClick={() => addTag(tagInput)}
                  className="px-4 py-2.5 rounded-xl font-medium text-[#5B5781] bg-[#5B5781]/10 hover:bg-[#5B5781]/20 transition-colors shrink-0"
                >
                  Ajouter
                </button>
              </div>
              {availableSuggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-stone-400 mr-1 self-center">Suggestions :</span>
                  {availableSuggestedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-600 hover:bg-[#5B5781]/15 hover:text-[#5B5781] transition-colors border border-transparent hover:border-[#5B5781]/30"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              )}
              {values.tagNames.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {values.tagNames.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg text-sm font-medium bg-[#5B5781]/15 text-[#5B5781] border border-[#5B5781]/20"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="p-0.5 rounded hover:bg-[#5B5781]/20 transition-colors"
                        aria-label={`Retirer ${tag}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes section */}
            <div>
              <label htmlFor="contact-notes" className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                Notes
              </label>
              <textarea
                id="contact-notes"
                value={values.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={3}
                className={`${inputBase} resize-none`}
                placeholder="Commentaires, contexte, historique des échanges..."
              />
            </div>
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 rounded-xl font-medium text-white bg-[#5B5781] hover:bg-[#4a4669] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-[#5B5781]/20 transition-all duration-200 hover:shadow-[#5B5781]/30 active:scale-[0.99]"
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enregistrement...
                </span>
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
