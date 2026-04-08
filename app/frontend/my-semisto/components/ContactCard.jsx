import React from 'react'
import { MapPin, Sparkles } from 'lucide-react'

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

export default function ContactCard({ contact, onClick }) {
  const initials = getInitials(contact.name)
  const color = hashColor(contact.name)
  const maxTags = 3
  const visibleTags = (contact.expertise || []).slice(0, maxTags)
  const remaining = (contact.expertise || []).length - maxTags

  return (
    <button
      onClick={() => onClick(contact)}
      className="w-full text-left rounded-2xl bg-white border border-stone-200 p-5 transition-all group my-card-accent my-warm-glow cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {contact.avatarUrl ? (
          <img
            src={contact.avatarUrl}
            alt={contact.name}
            className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white text-lg font-semibold"
            style={{ backgroundColor: color }}
          >
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3
            className="text-base font-semibold text-stone-800 group-hover:text-[#2D6A4F] transition-colors truncate"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {contact.name}
          </h3>

          {contact.bio && (
            <p className="text-sm text-stone-500 mt-0.5 line-clamp-1">
              {contact.bio}
            </p>
          )}

          {contact.city && (
            <div className="flex items-center gap-1 mt-1 text-xs text-stone-400">
              <MapPin size={12} />
              <span>{contact.city}</span>
            </div>
          )}

          {/* Expertise tags */}
          {visibleTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#2D6A4F12', color: '#2D6A4F' }}
                >
                  <Sparkles size={10} className="opacity-50" />
                  {tag}
                </span>
              ))}
              {remaining > 0 && (
                <span className="text-xs text-stone-400 px-1 py-0.5">
                  +{remaining}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
