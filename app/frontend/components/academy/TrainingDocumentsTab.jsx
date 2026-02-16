import React, { useState, useRef, useEffect } from 'react'
import {
  FileText,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react'

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function TrainingDocumentsTab({
  documents = [],
  onUploadDocument,
  onDeleteDocument,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Documents</h3>
          <p className="text-sm text-stone-500 mt-1">
            {documents.length} document{documents.length !== 1 ? 's' : ''} disponible{documents.length !== 1 ? 's' : ''} pour les participants
          </p>
        </div>
        <button
          type="button"
          onClick={() => onUploadDocument?.()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#B01A19] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1514]"
        >
          <Plus className="w-4 h-4" />
          Ajouter un document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-lg p-12 border border-stone-200 text-center">
          <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 mb-4">Aucun document ajouté pour le moment</p>
          <button
            type="button"
            onClick={() => onUploadDocument?.()}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <Plus className="w-4 h-4" />
            Ajouter un document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                formatDate={formatDate}
                onDelete={() => onDeleteDocument?.(document.id)}
              />
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentCard({ document: doc, formatDate, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div className="bg-white rounded-lg p-5 border border-stone-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 bg-stone-100 rounded-lg shrink-0">
            <FileText className="w-5 h-5 text-stone-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-stone-900 mb-1 break-words">{doc.name}</h4>
            <span className="text-xs text-stone-500">
              Ajouté le {doc.uploadedAt ? formatDate(doc.uploadedAt) : '—'}
            </span>
            {doc.url && (
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 mt-2 text-sm text-[#B01A19] hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                {doc.filename ? 'Télécharger' : 'Ouvrir'}
              </a>
            )}
          </div>
        </div>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 py-1 w-32 bg-white rounded-lg border border-stone-200 shadow-lg z-20">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onDelete()
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
