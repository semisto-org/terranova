import React, { useState, useEffect, useMemo } from 'react'
import { usePage, Link } from '@inertiajs/react'
import { ArrowLeft, Calendar, Clock, Loader2, MapPin, GraduationCap, FileText } from 'lucide-react'
import MySemistoShell from '../../my-semisto/components/MySemistoShell'
import DocumentList, { DocumentItem } from '../../my-semisto/components/DocumentList'
import { myApiRequest } from '../../my-semisto/lib/api'

const SESSION_COLOR_PAST = '#5B5781'
const SESSION_COLOR_UPCOMING = '#2D6A4F'

function isSessionPast(session) {
  if (!session.endDate) return false
  return new Date(session.endDate) < new Date()
}

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
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-[#B01A19] transition-colors"
        >
          <ArrowLeft size={16} />
          Retour aux activités
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: '#B01A19' }} />
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {training && (
        <div className="space-y-8 my-animate-section">
          {/* Header with colored accent */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-stone-200 p-6">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #B01A19, #EF9B0D, #2D6A4F)' }} />
            <div className="flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: '#B01A1912' }}
              >
                <GraduationCap size={20} style={{ color: '#B01A19' }} />
              </div>
              <div className="min-w-0">
                <h1
                  className="text-2xl text-stone-800"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {training.title}
                </h1>
                {training.trainingType && (
                  <p className="text-sm text-stone-500 mt-1">{training.trainingType}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sessions timeline with inline documents */}
          <SessionsAndDocuments training={training} />
        </div>
      )}
    </MySemistoShell>
  )
}

function SessionsAndDocuments({ training }) {
  const documents = training.documents || []
  const sessions = training.sessions || []

  const sessionDocMap = useMemo(() => {
    const map = {}
    documents.forEach((d) => {
      if (d.sessionId) {
        if (!map[d.sessionId]) map[d.sessionId] = []
        map[d.sessionId].push(d)
      }
    })
    return map
  }, [documents])

  const generalDocs = useMemo(
    () => documents.filter((d) => !d.sessionId),
    [documents]
  )

  const hasSessions = sessions.length > 0
  let docColorCounter = 0

  return (
    <>
      {hasSessions && (
        <div className="my-animate-section" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#EF9B0D' }} />
            <h2
              className="text-lg text-stone-800"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Sessions
            </h2>
          </div>
          <div className="space-y-3">
            {sessions.map((session, index) => {
              const past = isSessionPast(session)
              const color = past ? SESSION_COLOR_PAST : SESSION_COLOR_UPCOMING
              const sessionDocs = sessionDocMap[session.id] || []

              return (
                <div
                  key={session.id}
                  className="flex gap-4 px-4 py-3 rounded-xl bg-white border border-stone-200 transition-all hover:shadow-sm"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {index + 1}
                    </div>
                    {index < sessions.length - 1 && (
                      <div
                        className="w-px h-full mt-1"
                        style={{ background: `linear-gradient(to bottom, ${color}40, transparent)` }}
                      />
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

                    {sessionDocs.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-stone-100 space-y-2">
                        <p className="text-xs font-medium text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText size={11} />
                          {sessionDocs.length} document{sessionDocs.length > 1 ? 's' : ''}
                        </p>
                        {sessionDocs.map((doc) => (
                          <DocumentItem key={doc.id} doc={doc} colorIndex={docColorCounter++} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* General documents (not tied to a session) */}
      {generalDocs.length > 0 && (
        <div className="my-animate-section" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#5B5781' }} />
            <h2
              className="text-lg text-stone-800"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Documents généraux
            </h2>
          </div>
          <div className="space-y-2">
            {generalDocs.map((doc) => (
              <DocumentItem key={doc.id} doc={doc} colorIndex={docColorCounter++} />
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && !hasSessions && (
        <DocumentList documents={[]} sessions={[]} />
      )}
    </>
  )
}
