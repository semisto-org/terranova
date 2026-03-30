import React from 'react'
import { FileText, Download, Calendar, FolderOpen } from 'lucide-react'

const DOC_COLORS = ['#5B5781', '#2D6A4F', '#234766', '#B01A19', '#EF9B0D']

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function formatFileType(contentType) {
  if (!contentType) return ''
  const map = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/msword': 'DOC',
    'application/vnd.ms-excel': 'XLS',
    'text/plain': 'TXT',
  }
  return map[contentType] || contentType.split('/').pop().toUpperCase()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function DocumentItem({ doc, colorIndex = 0 }) {
  const color = DOC_COLORS[colorIndex % DOC_COLORS.length]

  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-stone-200
                 hover:shadow-sm transition-all group my-card-accent"
      aria-label={`Télécharger ${doc.name}`}
    >
      <div
        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}12` }}
      >
        <FileText size={18} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 truncate">{doc.name}</p>
        {(doc.byteSize || doc.contentType) && (
          <p className="text-xs text-stone-400 truncate">
            {doc.contentType ? formatFileType(doc.contentType) : ''}
            {doc.byteSize && doc.contentType ? ' · ' : ''}
            {doc.byteSize ? formatFileSize(doc.byteSize) : ''}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {doc.uploadedAt && (
          <span className="hidden sm:flex items-center gap-1 text-xs text-stone-400">
            <Calendar size={12} />
            {formatDate(doc.uploadedAt)}
          </span>
        )}
        <Download
          size={16}
          className="text-stone-400 transition-colors"
          style={{ '--hover-color': color }}
        />
      </div>
    </a>
  )
}

export default function DocumentList({ documents, sessions }) {
  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8">
        <div
          className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3"
          style={{ backgroundColor: '#5B578110' }}
        >
          <FolderOpen size={22} style={{ color: '#5B5781' }} />
        </div>
        <p className="text-stone-500 text-sm">Aucun document disponible pour le moment.</p>
      </div>
    )
  }

  const generalDocs = documents.filter((d) => !d.sessionId)
  const sessionMap = {}
  documents.forEach((d) => {
    if (d.sessionId) {
      if (!sessionMap[d.sessionId]) sessionMap[d.sessionId] = []
      sessionMap[d.sessionId].push(d)
    }
  })

  const sessionsWithDocs = (sessions || []).filter((s) => sessionMap[s.id])
  let colorCounter = 0

  return (
    <div className="space-y-6">
      {generalDocs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-stone-600 mb-3">Documents généraux</h4>
          <div className="space-y-2">
            {generalDocs.map((doc) => (
              <DocumentItem key={doc.id} doc={doc} colorIndex={colorCounter++} />
            ))}
          </div>
        </div>
      )}

      {sessionsWithDocs.map((session) => (
        <div key={session.id}>
          <h4 className="text-sm font-medium text-stone-600 mb-3">
            {session.topic || `Session du ${formatDate(session.startDate)}`}
          </h4>
          <div className="space-y-2">
            {sessionMap[session.id].map((doc) => (
              <DocumentItem key={doc.id} doc={doc} colorIndex={colorCounter++} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
