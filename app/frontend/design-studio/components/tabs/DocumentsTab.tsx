import { useState } from 'react'
import { FileText, Plus, ExternalLink, Trash2 } from 'lucide-react'
import type { ProjectDocument } from '../../types'
import { EmptyState } from '../shared/EmptyState'

const CATEGORIES = [
  { value: 'plan', label: 'Plan' },
  { value: 'quote', label: 'Devis' },
  { value: 'analysis', label: 'Analyse' },
  { value: 'other', label: 'Autre' },
]

interface DocumentsTabProps {
  documents: ProjectDocument[]
  onAddDocument: (values: {
    category: string
    name: string
    url: string
    size?: number
    uploaded_by?: string
  }) => void
  onDeleteDocument: (id: string) => void
}

export function DocumentsTab({
  documents,
  onAddDocument,
  onDeleteDocument,
}: DocumentsTabProps) {
  const [form, setForm] = useState({
    category: 'plan',
    name: '',
    url: '',
    size: 0,
    uploaded_by: 'team',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddDocument(form)
    setForm((p) => ({ ...p, name: '', url: '', size: 0 }))
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#AFBD00]" />
          Ajouter un document
        </h3>
        <form
          onSubmit={handleSubmit}
          className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3"
        >
          <select
            value={form.category}
            onChange={(e) =>
              setForm((p) => ({ ...p, category: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Nom"
            value={form.name}
            onChange={(e) =>
              setForm((p) => ({ ...p, name: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            required
          />
          <input
            type="url"
            placeholder="URL"
            value={form.url}
            onChange={(e) =>
              setForm((p) => ({ ...p, url: e.target.value }))
            }
            className="sm:col-span-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            required
          />
          <input
            type="number"
            min={0}
            placeholder="Taille (bytes)"
            value={form.size || ''}
            onChange={(e) =>
              setForm((p) => ({ ...p, size: Number(e.target.value || 0) }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
          >
            Ajouter
          </button>
        </form>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-10 h-10 text-stone-400" />}
          title="Aucun document"
          description="Ajoutez des plans, devis ou analyses au projet."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-4 flex items-center justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                  {doc.name}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {CATEGORIES.find((c) => c.value === doc.category)?.label ??
                    doc.category}
                  {doc.size > 0 &&
                    ` · ${(doc.size / 1024).toFixed(1)} Ko`}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-stone-500 hover:text-[#5B5781] dark:hover:text-[#9B94BB] rounded-lg transition-colors"
                  title="Ouvrir"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => onDeleteDocument(doc.id)}
                  className="p-2 text-stone-500 hover:text-red-600 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
