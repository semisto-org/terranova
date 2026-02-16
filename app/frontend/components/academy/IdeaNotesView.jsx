import React, { useState, useMemo } from 'react'
import { BookOpen, User, MapPin, MessageSquare, Plus, Pencil, Trash2 } from 'lucide-react'

const CATEGORIES = [
  { id: 'subject', label: 'Sujet', icon: BookOpen, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  { id: 'trainer', label: 'Formateur', icon: User, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'location', label: 'Lieu', icon: MapPin, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { id: 'other', label: 'Autre', icon: MessageSquare, color: 'text-stone-600', bg: 'bg-stone-100', border: 'border-stone-300' },
]

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function IdeaNotesView({
  ideaNotes = [],
  onCreateIdeaNote,
  onEditIdeaNote,
  onDeleteIdeaNote,
}) {
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filteredNotes = useMemo(() => {
    if (categoryFilter === 'all') return ideaNotes
    return ideaNotes.filter((n) => n.category === categoryFilter)
  }, [ideaNotes, categoryFilter])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="h-12 w-1 bg-gradient-to-b from-[#B01A19] to-[#eac7b8] rounded-full shrink-0" />
          <div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
              Bloc-notes
            </h1>
            <p className="text-sm text-stone-600 mt-2 font-medium">
              Idées, contacts et pistes pour vos futures formations
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                categoryFilter === 'all'
                  ? 'bg-[#B01A19] text-white shadow-sm'
                  : 'bg-white border border-stone-300 text-stone-700 hover:border-[#B01A19] hover:text-[#B01A19]'
              }`}
            >
              Toutes
            </button>
            {CATEGORIES.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategoryFilter(id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  categoryFilter === id
                    ? 'bg-[#B01A19] text-white shadow-sm'
                    : 'bg-white border border-stone-300 text-stone-700 hover:border-[#B01A19] hover:text-[#B01A19]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onCreateIdeaNote?.()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#B01A19] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8f1514] shadow-md active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouvelle idée
          </button>
        </div>
        <p className="text-sm text-stone-500 mt-3">
          {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-16 px-6">
          <div className="mb-4 rounded-full bg-stone-100 p-4">
            <MessageSquare className="w-8 h-8 text-stone-400" />
          </div>
          <p className="text-base font-medium text-stone-700">
            {categoryFilter === 'all'
              ? 'Aucune idée pour le moment'
              : `Aucune note dans la catégorie "${CATEGORIES.find((c) => c.id === categoryFilter)?.label}"`}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            {categoryFilter === 'all'
              ? 'Ajoutez des idées de sujets, formateurs, lieux ou autres pistes'
              : 'Changez de filtre ou créez une nouvelle note'}
          </p>
          <button
            type="button"
            onClick={() => onCreateIdeaNote?.()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#B01A19] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8f1514]"
          >
            <Plus className="w-4 h-4" />
            Nouvelle idée
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note, index) => {
            const config = CATEGORIES.find((c) => c.id === note.category) || CATEGORIES[3]
            const Icon = config.icon
            const tags = Array.isArray(note.tags) ? note.tags : []
            const excerpt = (note.content || '')
              .replace(/\n/g, ' ')
              .slice(0, 120)
            const hasMore = (note.content || '').length > 120

            return (
              <div
                key={note.id}
                className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-stone-300 hover:shadow-lg"
                style={{
                  animation: 'fadeInUp 0.5s ease-out forwards',
                  animationDelay: `${index * 50}ms`,
                  opacity: 0,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-stone-50/50 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
                <div className="relative z-10">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div
                      className={`flex items-center gap-2 rounded-lg ${config.bg} ${config.color} px-3 py-1.5 text-sm font-medium`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {config.label}
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onEditIdeaNote?.(note.id)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-[#B01A19] transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Supprimer cette note ?')) {
                            onDeleteIdeaNote?.(note.id)
                          }
                        }}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 leading-tight mb-2 line-clamp-2">
                    {note.title}
                  </h3>
                  {excerpt && (
                    <p className="text-sm text-stone-600 leading-relaxed mb-3 line-clamp-3">
                      {excerpt}
                      {hasMore ? '…' : ''}
                    </p>
                  )}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {tags.slice(0, 5).map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600"
                        >
                          {tag}
                        </span>
                      ))}
                      {tags.length > 5 && (
                        <span className="text-xs text-stone-400">+{tags.length - 5}</span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-stone-400">
                    {formatDate(note.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
