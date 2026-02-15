import type { Contact } from '../types'

interface ContactCardProps {
  contact: Contact
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

function getInitials(contact: Contact): string {
  if (contact.contactType === 'organization') {
    return contact.name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  const parts = contact.name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return contact.name.slice(0, 2).toUpperCase()
}

const tagColors = [
  'bg-[#5B5781]/15 text-[#5B5781] dark:bg-[#5B5781]/25 dark:text-[#a9a3c7]',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
]

export function ContactCard({ contact, onView, onEdit, onDelete }: ContactCardProps) {
  const initials = getInitials(contact)
  const isPerson = contact.contactType === 'person'

  return (
    <div
      className="
        group relative overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-700
        bg-white dark:bg-stone-800/50 backdrop-blur-sm
        transition-all duration-300 ease-out
        hover:border-[#5B5781]/40 hover:shadow-lg hover:shadow-[#5B5781]/5
        dark:hover:border-[#5B5781]/60 dark:hover:shadow-[#5B5781]/10
      "
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5B5781] via-[#5B5781]/60 to-[#AFBD00] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[#5B5781]/15 dark:bg-[#5B5781]/25 text-[#5B5781] dark:text-[#a9a3c7] font-semibold text-lg ring-2 ring-stone-100 dark:ring-stone-700 group-hover:ring-[#5B5781]/30 transition-all duration-300">
              {isPerson ? (
                initials
              ) : (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              )}
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-stone-800 bg-stone-300 dark:bg-stone-600 flex items-center justify-center"
              title={isPerson ? 'Personne' : 'Organisation'}
            >
              {isPerson ? (
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 truncate">{contact.name}</h3>
            {contact.email && (
              <p className="text-sm text-stone-500 dark:text-stone-400 truncate">{contact.email}</p>
            )}
            {isPerson && contact.organization && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                {contact.organization.name}
              </p>
            )}
            {!isPerson && contact.organizationType && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{contact.organizationType}</p>
            )}
          </div>
        </div>

        {contact.tagNames.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {contact.tagNames.map((tag, i) => (
              <span
                key={tag}
                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${tagColors[i % tagColors.length]}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700/50 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={onView}
            className="flex-1 px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-700 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
          >
            Voir la fiche
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-2 text-sm font-medium text-[#5B5781] dark:text-[#a9a3c7] bg-[#5B5781]/10 dark:bg-[#5B5781]/20 rounded-lg hover:bg-[#5B5781]/20 dark:hover:bg-[#5B5781]/30 transition-colors"
            >
              Modifier
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
