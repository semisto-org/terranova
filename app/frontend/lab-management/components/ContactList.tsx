import { useState, useMemo } from 'react'
import type { Contact } from '../types'

export interface ContactListProps {
  contacts: Contact[]
  onCreateContact?: () => void
  onViewContact?: (contactId: string) => void
  onEditContact?: (contactId: string) => void
  onDeleteContact?: (contactId: string) => void
}

export function ContactList({
  contacts,
  onCreateContact,
  onViewContact,
  onEditContact,
  onDeleteContact,
}: ContactListProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'person' | 'organization'>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')

  const allTags = useMemo(() => {
    const set = new Set<string>()
    contacts.forEach((c) => c.tagNames.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [contacts])

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const searchLower = search.toLowerCase()
      const matchesSearch =
        !search ||
        contact.name.toLowerCase().includes(searchLower) ||
        contact.email.toLowerCase().includes(searchLower)

      const matchesType = typeFilter === 'all' || contact.contactType === typeFilter
      const matchesTag = tagFilter === 'all' || contact.tagNames.includes(tagFilter)

      return matchesSearch && matchesType && matchesTag
    })
  }, [contacts, search, typeFilter, tagFilter])

  const personCount = contacts.filter((c) => c.contactType === 'person').length
  const orgCount = contacts.filter((c) => c.contactType === 'organization').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight">
                CRM Contacts
              </h1>
              <p className="mt-2 text-stone-600">
                Personnes et organisations
              </p>
            </div>

            {onCreateContact && (
              <button
                onClick={onCreateContact}
                className="
                  inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                  bg-[#5B5781] text-white font-medium
                  shadow-lg shadow-[#5B5781]/20
                  hover:bg-[#4a4669] hover:shadow-xl hover:shadow-[#5B5781]/30
                  active:scale-[0.98]
                  transition-all duration-200
                "
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouveau contact
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 shadow-sm">
              <span className="text-sm font-medium text-stone-900">{personCount}</span>
              <span className="text-sm text-stone-500">personnes</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 shadow-sm">
              <span className="text-sm font-medium text-stone-900">{orgCount}</span>
              <span className="text-sm text-stone-500">organisations</span>
            </div>
          </div>
        </div>

        <div className="mb-8 p-4 rounded-2xl bg-white border border-stone-200 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="
                    w-full pl-10 pr-4 py-2.5 rounded-xl
                    bg-stone-50
                    border border-stone-200
                    text-stone-900
                    placeholder:text-stone-400
                    focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]
                    transition-colors
                  "
                />
              </div>
            </div>

            <div className="sm:w-44">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'person' | 'organization')}
                className="
                  w-full px-4 py-2.5 rounded-xl appearance-none
                  bg-stone-50
                  border border-stone-200
                  text-stone-900
                  focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]
                  transition-colors cursor-pointer
                "
              >
                <option value="all">Tous les types</option>
                <option value="person">Personnes</option>
                <option value="organization">Organisations</option>
              </select>
            </div>

            {allTags.length > 0 && (
              <div className="sm:w-44">
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="
                    w-full px-4 py-2.5 rounded-xl appearance-none
                    bg-stone-50
                    border border-stone-200
                    text-stone-900
                    focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]
                    transition-colors cursor-pointer
                  "
                >
                  <option value="all">Tous les tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {(search || typeFilter !== 'all' || tagFilter !== 'all') && (
            <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-stone-500">Filtres actifs:</span>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5B5781]/10 text-[#5B5781] text-xs font-medium hover:bg-[#5B5781]/20 transition-colors"
                >
                  &quot;{search}&quot;
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {typeFilter !== 'all' && (
                <button
                  onClick={() => setTypeFilter('all')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5B5781]/10 text-[#5B5781] text-xs font-medium hover:bg-[#5B5781]/20 transition-colors"
                >
                  {typeFilter === 'person' ? 'Personnes' : 'Organisations'}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {tagFilter !== 'all' && (
                <button
                  onClick={() => setTagFilter('all')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5B5781]/10 text-[#5B5781] text-xs font-medium hover:bg-[#5B5781]/20 transition-colors"
                >
                  {tagFilter}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => {
                  setSearch('')
                  setTypeFilter('all')
                  setTagFilter('all')
                }}
                className="text-xs text-stone-500 hover:text-stone-700 underline underline-offset-2"
              >
                Tout effacer
              </button>
            </div>
          )}
        </div>

        <div className="mb-4 text-sm text-stone-500">
          {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} trouvé
          {filteredContacts.length !== 1 ? 's' : ''}
        </div>

        {filteredContacts.length > 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">
                      Nom
                    </th>
                    <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 w-28">
                      Type
                    </th>
                    <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                      Email
                    </th>
                    <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 hidden xl:table-cell">
                      Téléphone
                    </th>
                    <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                      Tags
                    </th>
                    <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 hidden xl:table-cell">
                      Organisation
                    </th>
                    <th className="text-right text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 w-28">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="group border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onViewContact?.(contact.id)}
                          className="text-left font-medium text-stone-900 hover:text-[#5B5781] transition-colors"
                        >
                          {contact.name}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-600">
                          {contact.contactType === 'person' ? 'Personne' : 'Organisation'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-stone-600 truncate max-w-[200px] block">
                          {contact.email || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-sm text-stone-600">
                        {contact.phone || '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {contact.tagNames.length > 0 ? (
                            contact.tagNames.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#5B5781]/10 text-[#5B5781]"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-stone-400 text-sm">—</span>
                          )}
                          {contact.tagNames.length > 3 && (
                            <span className="text-xs text-stone-400">
                              +{contact.tagNames.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-sm text-stone-600">
                        {contact.organization?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            onClick={() => onViewContact?.(contact.id)}
                            className="p-2 rounded-lg text-stone-400 hover:text-[#5B5781] hover:bg-[#5B5781]/10 transition-colors"
                            title="Voir la fiche"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onEditContact?.(contact.id)}
                            className="p-2 rounded-lg text-stone-400 hover:text-[#5B5781] hover:bg-[#5B5781]/10 transition-colors"
                            title="Modifier"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDeleteContact?.(contact.id)}
                            className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Supprimer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-stone-900 mb-1">
              Aucun contact trouvé
            </h3>
            <p className="text-stone-500 max-w-sm">
              Aucun contact ne correspond aux critères. Essayez de modifier vos filtres ou créez un nouveau contact.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
