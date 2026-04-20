import { useRef, useState } from 'react'
import { FileText, Upload, ExternalLink, Trash2, X } from 'lucide-react'
import type { ProjectDocument } from '../../types'
import { EmptyState } from '../shared/EmptyState'

const CATEGORIES = [
  { value: 'plan', label: 'Plan' },
  { value: 'quote', label: 'Devis' },
  { value: 'analysis', label: 'Analyse' },
  { value: 'other', label: 'Autre' },
]

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`
}

interface DocumentsTabProps {
  documents: ProjectDocument[]
  onAddDocument: (values: {
    category: string
    name: string
    file: File
  }) => Promise<unknown> | unknown
  onDeleteDocument: (id: string) => void
}

export function DocumentsTab({
  documents,
  onAddDocument,
  onDeleteDocument,
}: DocumentsTabProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [category, setCategory] = useState('plan')
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setCategory('plan')
    setName('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const selectFile = (chosen: File | null) => {
    setFile(chosen)
    if (chosen && !name.trim()) {
      setName(chosen.name.replace(/\.[^.]+$/, '') || chosen.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setSubmitting(true)
    try {
      await onAddDocument({ category, name: name.trim(), file })
      resetForm()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#AFBD00]" />
          Ajouter un document
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onDragEnter={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragging(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
                setDragging(false)
              }
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragging(false)
              const dropped = e.dataTransfer.files?.[0]
              if (dropped) selectFile(dropped)
            }}
            className={`flex items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-6 transition-all cursor-pointer ${
              file
                ? 'border-[#AFBD00]/60 bg-[#AFBD00]/5'
                : dragging
                  ? 'border-[#AFBD00] bg-[#AFBD00]/10'
                  : 'border-stone-300 hover:border-stone-400 bg-stone-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
            />
            <Upload className="w-6 h-6 text-stone-400 shrink-0" />
            <div className="text-center min-w-0">
              {file ? (
                <>
                  <p className="font-medium text-stone-900 truncate">{file.name}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {formatFileSize(file.size)} · Cliquez pour changer
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-stone-700">Cliquez ou glissez un fichier</p>
                  <p className="text-xs text-stone-500 mt-0.5">PDF, images, vidéos, ZIP, etc.</p>
                </>
              )}
            </div>
            {file && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  selectFile(null)
                }}
                className="ml-2 p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                title="Retirer le fichier"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nom du document"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="lg:col-span-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={!file || !name.trim() || submitting}
              className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
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
              className="rounded-2xl border border-stone-200 bg-white p-4 flex items-center justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-900 truncate">
                  {doc.name}
                </p>
                <p className="text-xs text-stone-500">
                  {CATEGORIES.find((c) => c.value === doc.category)?.label ??
                    doc.category}
                  {doc.size > 0 && ` · ${formatFileSize(doc.size)}`}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-stone-500 hover:text-[#5B5781] rounded-lg transition-colors"
                    title="Ouvrir"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
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
