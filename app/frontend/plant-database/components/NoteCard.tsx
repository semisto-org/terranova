import type { Note, Contributor } from '../types'

interface NoteCardProps {
  note: Note
  contributor: Contributor | undefined
  onContributorSelect?: (contributorId: string) => void
}

export function NoteCard({ note, contributor, onContributorSelect }: NoteCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const languageFlags: Record<string, string> = {
    fr: '🇫🇷',
    en: '🇬🇧',
    nl: '🇳🇱',
    de: '🇩🇪',
    es: '🇪🇸',
    it: '🇮🇹'
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-stone-200">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {contributor && (
          <button
            onClick={() => onContributorSelect?.(contributor.id)}
            className="flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B5781] to-[#7a7299] flex items-center justify-center text-white font-medium text-sm">
              {contributor.name.split(' ').map(n => n[0]).join('')}
            </div>
          </button>
        )}
        <div className="flex-1 min-w-0">
          {contributor && (
            <button
              onClick={() => onContributorSelect?.(contributor.id)}
              className="font-medium text-stone-900 hover:text-[#5B5781] transition-colors text-left"
            >
              {contributor.name}
            </button>
          )}
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <span>{formatDate(note.createdAt)}</span>
            <span className="text-xs">{languageFlags[note.language] || note.language}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">
        {note.content}
      </p>

      {/* Inline photos */}
      {note.photos.length > 0 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {note.photos.map((photoUrl, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-stone-100"
            >
              <img src={photoUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
