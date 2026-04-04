import React, { useState, useEffect, useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { Users, Loader2, Search, MapPin } from 'lucide-react'
import MySemistoShell from '../../my-semisto/components/MySemistoShell'
import ContactCard from '../../my-semisto/components/ContactCard'
import ContactDetailModal from '../../my-semisto/components/ContactDetailModal'
import { myApiRequest } from '../../my-semisto/lib/api'
import { myPath, myApiPath } from '../../my-semisto/lib/paths'

export default function Directory() {
  const { contactId } = usePage().props
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedContact, setSelectedContact] = useState(null)

  useEffect(() => {
    myApiRequest(myApiPath('/directory'))
      .then((data) => {
        setContacts(data.contacts || [])
        // If URL has a contactId, auto-open that contact
        if (contactId) {
          const found = (data.contacts || []).find((c) => c.id === contactId)
          if (found) setSelectedContact(found)
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts
    const q = search.toLowerCase()
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.expertise || []).some((e) => e.toLowerCase().includes(q)) ||
      (c.bio || '').toLowerCase().includes(q)
    )
  }, [contacts, search])

  // Group contacts by first letter
  const grouped = useMemo(() => {
    const groups = {}
    filtered.forEach((c) => {
      const letter = (c.name || '?')[0].toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(c)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const cities = useMemo(() => {
    const set = new Set()
    contacts.forEach((c) => { if (c.city) set.add(c.city) })
    return set.size
  }, [contacts])

  return (
    <MySemistoShell activeNav={myPath('/directory')}>
      {/* Header */}
      <div className="mb-8 my-animate-section">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#2D6A4F15' }}
          >
            <Users size={18} style={{ color: '#2D6A4F' }} />
          </div>
          <div>
            <h1
              className="text-2xl text-stone-800"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Annuaire Semisto
            </h1>
          </div>
        </div>
        <p className="text-sm text-stone-500 ml-12">
          Decouvre les membres de la communaute, leurs competences et leurs activites
        </p>
        <hr className="my-section-divider mt-5" />
      </div>

      {/* Stats bar */}
      {!loading && !error && contacts.length > 0 && (
        <div className="flex items-center gap-4 mb-5 my-animate-section" style={{ animationDelay: '50ms' }}>
          <span className="text-xs text-stone-400">
            {contacts.length} membre{contacts.length > 1 ? 's' : ''}
          </span>
          {cities > 0 && (
            <>
              <span className="text-stone-200">·</span>
              <span className="flex items-center gap-1 text-xs text-stone-400">
                <MapPin size={11} />
                {cities} ville{cities > 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      )}

      {/* Search */}
      {!loading && !error && contacts.length > 0 && (
        <div className="mb-6 my-animate-section" style={{ animationDelay: '100ms' }}>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, ville ou competence..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-[#2D6A4F]/30 focus:ring-2 focus:ring-[#2D6A4F]/10 transition-all"
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: '#2D6A4F' }} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && contacts.length === 0 && (
        <div className="text-center py-16 my-animate-section">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: '#2D6A4F0D' }}
          >
            <Users size={28} style={{ color: '#2D6A4F' }} />
          </div>
          <p className="text-stone-600 text-sm font-medium mb-1">Aucun contact pour le moment</p>
          <p className="text-stone-400 text-xs">
            L'annuaire se remplira au fur et a mesure.
          </p>
        </div>
      )}

      {/* No results */}
      {!loading && !error && contacts.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 my-animate-section">
          <p className="text-stone-500 text-sm">Aucun resultat pour "{search}"</p>
        </div>
      )}

      {/* Contact grid - grouped by letter */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-6 my-animate-section" style={{ animationDelay: '150ms' }}>
          {grouped.map(([letter, groupContacts]) => (
            <div key={letter}>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: '#2D6A4F12', color: '#2D6A4F' }}
                >
                  {letter}
                </span>
                <div className="flex-1 h-px bg-stone-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onClick={setSelectedContact}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedContact && (
        <ContactDetailModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </MySemistoShell>
  )
}
