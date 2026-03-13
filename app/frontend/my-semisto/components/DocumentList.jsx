import React from 'react'
import { FileText, Download, Calendar } from 'lucide-react'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function DocumentItem({ doc }) {
  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-stone-200
                 hover:border-[#2D6A4F]/30 hover:shadow-sm transition-all group"
      aria-label={`Telecharger ${doc.name}`}
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#2D6A4F]/10 flex items-center justify-center">
        <FileText size={18} className="text-[#2D6A4F]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 truncate">{doc.name}</p>
        {doc.filename && (
          <p className="text-xs text-stone-400 truncate">{doc.filename}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {doc.uploadedAt && (
          <span className="hidden sm:flex items-center gap-1 text-xs text-stone-400">
            <Calendar size={12} />
            {formatDate(doc.uploadedAt)}
          </span>
        )}
        <Download size={16} className="text-stone-400 group-hover:text-[#2D6A4F] transition-colors" />
      </div>
    </a>
  )
}

export default function DocumentList({ documents, sessions }) {
  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8 text-stone-400 text-sm">
        Aucun document disponible pour le moment.
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

  return (
    <div className="space-y-6">
      {generalDocs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-stone-600 mb-3">Documents generaux</h4>
          <div className="space-y-2">
            {generalDocs.map((doc) => (
              <DocumentItem key={doc.id} doc={doc} />
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
              <DocumentItem key={doc.id} doc={doc} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
