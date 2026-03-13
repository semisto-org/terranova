import React, { useState, useEffect } from 'react'
import { usePage, Link } from '@inertiajs/react'
import { ArrowLeft, Calendar, Clock, Loader2, MapPin } from 'lucide-react'
import MySemistoShell from '../../my-semisto/components/MySemistoShell'
import DocumentList from '../../my-semisto/components/DocumentList'
import { myApiRequest } from '../../my-semisto/lib/api'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

export default function TrainingDetail() {
  const { trainingId } = usePage().props
  const [training, setTraining] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    myApiRequest(`/api/v1/my/academy/${trainingId}`)
      .then((data) => setTraining(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [trainingId])

  return (
    <MySemistoShell activeNav="/my/academy">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/my/academy"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-[#2D6A4F] transition-colors"
        >
          <ArrowLeft size={16} />
          Retour aux formations
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#2D6A4F]" />
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {training && (
        <div className="space-y-8 my-animate-section">
          {/* Header */}
          <div>
            <div className="flex items-start gap-3 mb-2">
              <h1
                className="text-2xl text-stone-800 flex-1"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {training.title}
              </h1>
            </div>
            {training.trainingType && (
              <p className="text-sm text-stone-500">{training.trainingType}</p>
            )}
            {training.description && (
              <p className="text-sm text-stone-600 mt-3 leading-relaxed">{training.description}</p>
            )}
          </div>

          {/* Sessions timeline */}
          {training.sessions && training.sessions.length > 0 && (
            <div className="my-animate-section" style={{ animationDelay: '100ms' }}>
              <h2
                className="text-lg text-stone-800 mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Sessions
              </h2>
              <div className="space-y-3">
                {training.sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="flex gap-4 px-4 py-3 rounded-xl bg-white border border-stone-200"
                  >
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center text-xs font-semibold text-[#2D6A4F]">
                        {index + 1}
                      </div>
                      {index < training.sessions.length - 1 && (
                        <div className="w-px h-full bg-stone-200 mt-1" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {session.topic && (
                        <p className="text-sm font-medium text-stone-800 mb-1">{session.topic}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDateShort(session.startDate)} — {formatDateShort(session.endDate)}
                        </span>
                      </div>
                      {session.description && (
                        <p className="text-xs text-stone-500 mt-1.5">{session.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="my-animate-section" style={{ animationDelay: '200ms' }}>
            <h2
              className="text-lg text-stone-800 mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Documents
            </h2>
            <DocumentList
              documents={training.documents}
              sessions={training.sessions}
            />
          </div>
        </div>
      )}
    </MySemistoShell>
  )
}
