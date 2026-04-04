import React, { useState, useEffect } from 'react'
import { X, MapPin, Mail, Phone, Sparkles, Calendar, Linkedin, Loader2 } from 'lucide-react'
import { myApiRequest } from '../lib/api'
import { myApiPath } from '../lib/paths'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  '#2D6A4F', '#5B5781', '#B01A19', '#234766', '#EF9B0D',
  '#1B4332', '#7a8500', '#b27308', '#6B4226', '#4A6741'
]

function hashColor(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateRange(startDate, endDate) {
  if (!startDate) return 'Dates non definies'
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : null
  const opts = { day: 'numeric', month: 'short', year: 'numeric' }
  const startStr = start.toLocaleDateString('fr-FR', opts)
  if (!end || startStr === end.toLocaleDateString('fr-FR', opts)) return startStr
  return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('fr-FR', opts)}`
}

export default function ContactDetailModal({ contact: initialContact, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!initialContact) return
    setLoading(true)
    myApiRequest(myApiPath(`/directory/${initialContact.id}`))
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [initialContact?.id])

  if (!initialContact) return null

  const contact = data?.contact || initialContact
  const trainings = data?.trainings || []
  const color = hashColor(contact.name)
  const initials = getInitials(contact.name)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto pointer-events-auto"
          role="dialog"
          aria-label={`Profil de ${contact.name}`}
        >
          {/* Header with colored banner */}
          <div
            className="relative rounded-t-2xl px-6 pt-8 pb-12"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Avatar overlapping banner */}
          <div className="relative px-6 -mt-10">
            {contact.avatarUrl ? (
              <img
                src={contact.avatarUrl}
                alt={contact.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center border-4 border-white shadow-md text-white text-2xl font-bold"
                style={{ backgroundColor: color }}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Contact info */}
          <div className="px-6 pt-3 pb-6">
            <h2
              className="text-xl text-stone-800 mb-1"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {contact.name}
            </h2>

            {contact.bio && (
              <p className="text-sm text-stone-600 mb-3">{contact.bio}</p>
            )}

            {/* Location & contact details */}
            <div className="flex flex-wrap gap-3 mb-4">
              {contact.city && (
                <span className="flex items-center gap-1.5 text-xs text-stone-500 bg-stone-50 px-2.5 py-1.5 rounded-lg">
                  <MapPin size={13} />
                  {contact.city}
                </span>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-1.5 text-xs text-stone-500 bg-stone-50 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <Mail size={13} />
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-1.5 text-xs text-stone-500 bg-stone-50 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <Phone size={13} />
                  {contact.phone}
                </a>
              )}
              {contact.linkedinUrl && (
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-stone-500 bg-stone-50 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <Linkedin size={13} />
                  LinkedIn
                </a>
              )}
            </div>

            {/* Expertise */}
            {(contact.expertise || []).length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Competences
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {contact.expertise.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ backgroundColor: '#2D6A4F12', color: '#2D6A4F' }}
                    >
                      <Sparkles size={10} className="opacity-50" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trainings/activities */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                Activites suivies
              </h3>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={18} className="animate-spin text-stone-300" />
                </div>
              ) : trainings.length === 0 ? (
                <p className="text-xs text-stone-400 py-3">
                  Aucune activite enregistree pour le moment.
                </p>
              ) : (
                <div className="space-y-2">
                  {trainings.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-100"
                    >
                      <div
                        className="w-1.5 h-8 rounded-full flex-shrink-0"
                        style={{ backgroundColor: t.trainingTypeColor || '#78716c' }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-stone-700 truncate">
                          {t.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                          {t.trainingType && (
                            <span>{t.trainingType}</span>
                          )}
                          {t.startDate && (
                            <>
                              <span className="text-stone-300">·</span>
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                {formatDateRange(t.startDate, t.endDate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
