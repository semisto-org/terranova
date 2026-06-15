import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { usePage, Link } from '@inertiajs/react'
import {
  ArrowLeft, Calendar, Clock, Loader2, MapPin, GraduationCap, FileText,
  Utensils, BedDouble, Backpack, ChevronDown, Car, CalendarClock,
  Users, Mail, Phone,
} from 'lucide-react'
import MySemistoShell from '../../my-semisto/components/MySemistoShell'
import DocumentList, { DocumentItem } from '../../my-semisto/components/DocumentList'
import DocumentUploadForm from '../../my-semisto/components/DocumentUploadForm'
import CarpoolingSection from '../../my-semisto/components/CarpoolingSection'
import SessionPhotoAlbum from '../../my-semisto/components/SessionPhotoAlbum'
import SupportThread from '../../my-semisto/components/SupportThread'
import SessionFeedbackForm from '../../my-semisto/components/SessionFeedbackForm'
import { myApiRequest } from '../../my-semisto/lib/api'
import { myPath, myApiPath } from '../../my-semisto/lib/paths'

const COLOR_PAST = '#5B5781'
const COLOR_UPCOMING = '#2D6A4F'
const COLOR_ACADEMY = '#B01A19'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function isSessionPast(session) {
  if (!session.endDate) return false
  return new Date(session.endDate) < new Date()
}

// A session is "ongoing" when today falls inside [startDate, endDate].
function isSessionOngoing(session) {
  if (!session.startDate || !session.endDate) return false
  const now = new Date()
  return new Date(session.startDate) <= now && now <= new Date(session.endDate)
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

function daysUntil(dateStr) {
  if (!dateStr) return null
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target - startOfToday()) / 86400000)
}

// Human countdown for the upcoming session, in French.
function countdownLabel(session) {
  if (isSessionOngoing(session)) return "C'est en cours"
  const days = daysUntil(session.startDate)
  if (days === null) return ''
  if (days <= 0) return "Aujourd'hui"
  if (days === 1) return 'Demain'
  if (days < 7) return `Dans ${days} jours`
  if (days < 14) return 'La semaine prochaine'
  if (days < 60) return `Dans ${Math.round(days / 7)} semaines`
  return `Dans ${Math.round(days / 30)} mois`
}

export default function TrainingDetail() {
  const { trainingId } = usePage().props
  const [training, setTraining] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // The J+1 feedback email links to ?feedback=<sessionId>. Capture it once so
  // we can auto-open and scroll to that session's feedback form.
  const feedbackSessionId = useMemo(() => {
    const raw = new URLSearchParams(window.location.search).get('feedback')
    return raw ? String(raw) : null
  }, [])

  // Refetches the training detail without a full page reload — used after the
  // initial load and after every upload/delete so the list stays in sync.
  const loadTraining = useCallback(
    ({ initial = false } = {}) => {
      if (initial) setLoading(true)
      return myApiRequest(`${myApiPath('/academy')}/${trainingId}`)
        .then((data) => {
          setTraining(data)
          setError(null)
        })
        .catch((err) => setError(err.message))
        .finally(() => {
          if (initial) setLoading(false)
        })
    },
    [trainingId]
  )

  useEffect(() => {
    loadTraining({ initial: true })
  }, [loadTraining])

  async function handleDelete(doc) {
    if (!window.confirm(`Supprimer « ${doc.name} » ?`)) return
    try {
      await myApiRequest(`${myApiPath('/academy')}/${trainingId}/documents/${doc.id}`, {
        method: 'DELETE',
      })
      await loadTraining()
    } catch (err) {
      setError(err.message)
    }
  }

  const sessions = training?.sessions || []
  const documents = training?.documents || []

  // Documents keyed by session for inline rendering.
  const sessionDocMap = useMemo(() => {
    const map = {}
    documents.forEach((d) => {
      if (d.sessionId) (map[d.sessionId] ||= []).push(d)
    })
    return map
  }, [documents])

  const generalDocs = useMemo(() => documents.filter((d) => !d.sessionId), [documents])

  // The next session = the first not-yet-finished session in chronological order.
  // (Sessions arrive sorted by start_date asc from the API.)
  const nextSession = useMemo(
    () => sessions.find((s) => !isSessionPast(s)) || null,
    [sessions]
  )

  const pastCount = useMemo(() => sessions.filter(isSessionPast).length, [sessions])

  const singleSession = sessions.length === 1
  const activityPast = sessions.length > 0 && !nextSession
  const featuredSession = singleSession ? sessions[0] : nextSession

  const canDelete = training?.canUpload ? handleDelete : null

  return (
    <MySemistoShell activeNav={myPath('/academy')}>
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={myPath('/academy')}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-[#B01A19] transition-colors"
        >
          <ArrowLeft size={16} />
          Retour aux activités
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: COLOR_ACADEMY }} />
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {training && (
        <div className="space-y-8 my-animate-section">
          {/* Header with colored accent + progress strip */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-stone-200 p-6">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #B01A19, #EF9B0D, #2D6A4F)' }} />
            <div className="flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: '#B01A1912' }}
              >
                <GraduationCap size={20} style={{ color: COLOR_ACADEMY }} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl text-stone-800" style={{ fontFamily: 'var(--font-heading)' }}>
                  {training.title}
                </h1>
                {training.trainingType && (
                  <p className="text-sm text-stone-500 mt-1">{training.trainingType}</p>
                )}
                {sessions.length > 1 && (
                  <ProgressStrip pastCount={pastCount} total={sessions.length} />
                )}
              </div>
            </div>
          </div>

          {/* Hero — featured session, front and center.
              Multi-session: the next upcoming session.
              Single session: that one session (even if past). */}
          {featuredSession ? (
            <NextSessionHero
              session={featuredSession}
              index={sessions.indexOf(featuredSession)}
              docs={sessionDocMap[featuredSession.id] || []}
              hideCarpoolLink={activityPast}
              trainingId={trainingId}
              canEdit={training.canUpload}
              onChanged={() => loadTraining()}
            />
          ) : null}

          {/* Upload zone — only for contacts with the upload right */}
          {training.canUpload && (
            <div className="my-animate-section" style={{ animationDelay: '50ms' }}>
              <DocumentUploadForm
                trainingId={trainingId}
                sessions={sessions}
                onUploaded={() => loadTraining()}
              />
            </div>
          )}

          {/* All sessions — collapsible timeline (only when 2+ sessions) */}
          {sessions.length > 1 && (
            <SessionsTimeline
              sessions={sessions}
              nextSessionId={nextSession?.id}
              sessionDocMap={sessionDocMap}
              trainingId={trainingId}
              canEdit={training.canUpload}
              onDelete={canDelete}
              onChanged={() => loadTraining()}
            />
          )}

          {/* General documents — collapsed by default (secondary) */}
          {generalDocs.length > 0 && (
            <GeneralDocuments docs={generalDocs} onDelete={canDelete} />
          )}

          {documents.length === 0 && sessions.length === 0 && (
            <DocumentList documents={[]} sessions={[]} />
          )}

          {/* Participant directory — only when the activity opts in (admin toggle) */}
          {training.participants?.length > 0 && (
            <ParticipantsDirectory participants={training.participants} />
          )}

          {/* Carpooling — hidden when the whole activity is past */}
          {!activityPast && (
            <div id="covoiturage">
              <CarpoolingSection trainingId={trainingId} />
            </div>
          )}

          {/* Feedback — one form per past session */}
          <PastSessionsFeedback
            sessions={sessions}
            trainingId={trainingId}
            feedbackSessionId={feedbackSessionId}
          />

          {/* Support thread — always available */}
          <SupportThread trainingId={trainingId} />
        </div>
      )}
    </MySemistoShell>
  )
}

// Renders a feedback form for every past session. When the URL carries
// ?feedback=<sessionId>, that session's form is highlighted and scrolled into
// view (the J+1 email deep-links here).
function PastSessionsFeedback({ sessions, trainingId, feedbackSessionId }) {
  const pastSessions = useMemo(() => sessions.filter(isSessionPast), [sessions])

  useEffect(() => {
    if (!feedbackSessionId) return
    // Defer to let the section render before scrolling.
    const el = document.getElementById(`feedback-${feedbackSessionId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [feedbackSessionId, pastSessions.length])

  if (pastSessions.length === 0) return null

  return (
    <div className="my-animate-section" style={{ animationDelay: '160ms' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLOR_ACADEMY }} />
        <h2 className="text-lg text-stone-800" style={{ fontFamily: 'var(--font-heading)' }}>
          {pastSessions.length > 1 ? 'Tes retours' : 'Ton retour'}
        </h2>
      </div>

      <div className="space-y-4">
        {pastSessions.map((session, i) => {
          const isTarget = feedbackSessionId === String(session.id)
          return (
            <div key={session.id} id={`feedback-${session.id}`}>
              {pastSessions.length > 1 && (
                <p className="text-xs font-medium text-stone-500 mb-1.5">
                  {session.topic || `Session ${i + 1}`} · {formatDateShort(session.startDate)}
                </p>
              )}
              <SessionFeedbackForm
                trainingId={trainingId}
                session={session}
                autoFocus={isTarget}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// "X / N sessions passées" with a thin progress bar.
function ProgressStrip({ pastCount, total }) {
  const pct = total > 0 ? Math.round((pastCount / total) * 100) : 0
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
        <span>{pastCount} / {total} sessions passées</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${COLOR_PAST}, ${COLOR_UPCOMING})` }}
        />
      </div>
    </div>
  )
}

// The centerpiece: a featured session (next upcoming, ongoing, or — for
// single-session activities — that one session even if past), fully expanded.
function NextSessionHero({ session, index, docs, hideCarpoolLink = false, trainingId, canEdit, onChanged }) {
  const ongoing = isSessionOngoing(session)
  const past = isSessionPast(session)
  const accent = past ? COLOR_PAST : COLOR_UPCOMING
  const eyebrow = past ? 'Session passée' : ongoing ? 'Session en cours' : 'Prochaine session'
  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-white my-animate-section"
      style={{ borderColor: `${accent}40`, animationDelay: '30ms' }}
    >
      <div className="absolute top-0 left-0 bottom-0 w-1.5" style={{ backgroundColor: accent }} />
      <div className="p-6 pl-7">
        {/* Eyebrow + countdown */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>
            <CalendarClock size={14} />
            {eyebrow}
          </span>
          {!past && (
            <span
              className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full text-white whitespace-nowrap"
              style={{ backgroundColor: accent }}
            >
              {countdownLabel(session)}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-sm font-bold" style={{ color: accent }}>#{index + 1}</span>
          <h2 className="text-xl text-stone-800" style={{ fontFamily: 'var(--font-heading)' }}>
            {session.topic || `Session ${index + 1}`}
          </h2>
        </div>

        {/* Date + RDV */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-stone-600 mb-1">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-stone-400" />
            {formatDate(session.startDate)}
            {session.endDate && session.endDate.slice(0, 10) !== session.startDate.slice(0, 10) && (
              <> → {formatDate(session.endDate)}</>
            )}
          </span>
          {(session.meetingTime || session.meetingPoint) && (
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-stone-400" />
              RDV{session.meetingTime ? ` ${session.meetingTime}` : ''}{session.meetingPoint ? ` · ${session.meetingPoint}` : ''}
            </span>
          )}
        </div>

        {session.description && (
          <p className="text-sm text-stone-500 mt-2">{session.description}</p>
        )}

        {/* Practical info */}
        <SessionPractical session={session} />

        {/* Google Photos album — link + trainer edit affordance */}
        <SessionPhotoAlbum
          trainingId={trainingId}
          session={session}
          canEdit={canEdit}
          onSaved={onChanged}
        />

        {/* Session documents */}
        {docs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <FileText size={11} />
              {docs.length} document{docs.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-2">
              {docs.map((doc, i) => (
                <DocumentItem key={doc.id} doc={doc} colorIndex={i} />
              ))}
            </div>
          </div>
        )}

        {/* Jump to carpooling — hidden when the carpooling section itself is hidden */}
        {!hideCarpoolLink && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <a
              href="#covoiturage"
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
              style={{ color: accent }}
            >
              <Car size={15} />
              Organiser mon covoiturage
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// Collapsible timeline of every session. Collapsed by default; the next
// session is highlighted but not auto-expanded (it already lives in the hero).
function SessionsTimeline({ sessions, nextSessionId, sessionDocMap, trainingId, canEdit, onDelete, onChanged }) {
  const [openIds, setOpenIds] = useState(() => new Set())

  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div className="my-animate-section" style={{ animationDelay: '100ms' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#EF9B0D' }} />
        <h2 className="text-lg text-stone-800" style={{ fontFamily: 'var(--font-heading)' }}>
          Toutes les sessions
        </h2>
        <span className="text-sm text-stone-400">({sessions.length})</span>
      </div>

      <div className="space-y-2">
        {sessions.map((session, index) => (
          <SessionRow
            key={session.id}
            session={session}
            index={index}
            isLast={index === sessions.length - 1}
            isNext={session.id === nextSessionId}
            open={openIds.has(session.id)}
            onToggle={() => toggle(session.id)}
            docs={sessionDocMap[session.id] || []}
            trainingId={trainingId}
            canEdit={canEdit}
            onDelete={onDelete}
            onChanged={onChanged}
          />
        ))}
      </div>
    </div>
  )
}

function SessionRow({ session, index, isLast, isNext, open, onToggle, docs, trainingId, canEdit, onDelete, onChanged }) {
  const past = isSessionPast(session)
  const color = past ? COLOR_PAST : COLOR_UPCOMING
  const docCount = docs.length

  const statusPill = past
    ? { label: 'Passée', bg: '#f5f5f4', text: '#78716c' }
    : isNext
      ? { label: 'Prochaine', bg: `${COLOR_UPCOMING}18`, text: COLOR_UPCOMING }
      : { label: 'À venir', bg: '#f0fdf4', text: COLOR_UPCOMING }

  return (
    <div
      className="rounded-xl bg-white border transition-all"
      style={{
        borderColor: isNext ? `${COLOR_UPCOMING}80` : '#e7e5e4',
        boxShadow: isNext ? `0 0 0 3px ${COLOR_UPCOMING}1a` : 'none',
        opacity: past && !open ? 0.85 : 1,
      }}
    >
      {/* Collapsed header — clickable */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-800 truncate">
            {session.topic || `Session ${index + 1}`}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500 mt-0.5">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatDateShort(session.startDate)} — {formatDateShort(session.endDate)}
            </span>
            {docCount > 0 && (
              <span className="flex items-center gap-1">
                <FileText size={11} />
                {docCount} doc{docCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
          style={{ backgroundColor: statusPill.bg, color: statusPill.text }}
        >
          {statusPill.label}
        </span>

        <ChevronDown
          size={16}
          className="text-stone-400 flex-shrink-0 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {/* Expanded body */}
      {open && (
        <div className="px-4 pb-4 pl-[60px]">
          {session.description && (
            <p className="text-sm text-stone-500">{session.description}</p>
          )}

          <SessionPractical session={session} />

          <SessionPhotoAlbum
            trainingId={trainingId}
            session={session}
            canEdit={canEdit}
            onSaved={onChanged}
          />

          {docCount > 0 && (
            <div className="mt-3 pt-3 border-t border-stone-100 space-y-2">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={11} />
                {docCount} document{docCount > 1 ? 's' : ''}
              </p>
              {docs.map((doc, i) => (
                <DocumentItem key={doc.id} doc={doc} colorIndex={i} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Participant directory — names, emails and phones of everyone registered.
// Shown only when the activity's admin opted in. Email/phone are intentionally
// revealed here (unlike carpooling), so this section appears solely on demand.
function ParticipantsDirectory({ participants }) {
  return (
    <div className="my-animate-section" style={{ animationDelay: '150ms' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLOR_ACADEMY }} />
        <h2 className="text-lg text-stone-800" style={{ fontFamily: 'var(--font-heading)' }}>
          Participants
        </h2>
        <span className="text-sm text-stone-400">({participants.length})</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400">
              <th className="px-4 py-3 font-medium">
                <span className="inline-flex items-center gap-1.5"><Users size={13} /> Nom</span>
              </th>
              <th className="px-4 py-3 font-medium">
                <span className="inline-flex items-center gap-1.5"><Mail size={13} /> Email</span>
              </th>
              <th className="px-4 py-3 font-medium">
                <span className="inline-flex items-center gap-1.5"><Phone size={13} /> Téléphone</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p, i) => (
              <tr key={i} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 text-stone-800">{p.name}</td>
                <td className="px-4 py-3">
                  {p.email ? (
                    <a href={`mailto:${p.email}`} className="text-[#B01A19] hover:underline break-all">
                      {p.email}
                    </a>
                  ) : (
                    <span className="text-stone-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.phone ? (
                    <a href={`tel:${p.phone}`} className="text-stone-700 hover:underline whitespace-nowrap">
                      {p.phone}
                    </a>
                  ) : (
                    <span className="text-stone-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// General documents (not tied to a session) — collapsed by default.
function GeneralDocuments({ docs, onDelete }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="my-animate-section" style={{ animationDelay: '200ms' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 mb-2 text-left"
      >
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#5B5781' }} />
        <h2 className="text-lg text-stone-800" style={{ fontFamily: 'var(--font-heading)' }}>
          Documents généraux
        </h2>
        <span className="text-sm text-stone-400">({docs.length})</span>
        <ChevronDown
          size={16}
          className="text-stone-400 ml-auto transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div className="space-y-2">
          {docs.map((doc, i) => (
            <DocumentItem key={doc.id} doc={doc} colorIndex={i} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

// Practical info for a session: lieux & adresses, repas, hébergement, à prévoir.
// Each block renders only when its field is filled, so an empty session stays clean.
function SessionPractical({ session }) {
  const locations = session.locations || []
  const packing = session.packingList || []
  const hasAny =
    locations.length > 0 ||
    session.mealsInfo ||
    session.accommodationInfo ||
    packing.length > 0

  if (!hasAny) return null

  return (
    <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {locations.length > 0 && (
        <PracticalBlock icon={MapPin} label="Où ça se passe">
          {locations.map((loc) => (
            <div key={loc.id} className="mb-1 last:mb-0">
              <span className="font-medium text-stone-700">{loc.name}</span>
              {loc.address && <span className="text-stone-500"> — {loc.address}</span>}
            </div>
          ))}
        </PracticalBlock>
      )}

      {session.mealsInfo && (
        <PracticalBlock icon={Utensils} label="Repas">
          <p className="whitespace-pre-line">{session.mealsInfo}</p>
        </PracticalBlock>
      )}

      {session.accommodationInfo && (
        <PracticalBlock icon={BedDouble} label="Hébergement">
          <p className="whitespace-pre-line">{session.accommodationInfo}</p>
        </PracticalBlock>
      )}

      {packing.length > 0 && (
        <PracticalBlock icon={Backpack} label="Dans ton sac">
          <ul className="space-y-0.5">
            {packing.map((entry, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-stone-400 mt-px">·</span>
                <span>{entry}</span>
              </li>
            ))}
          </ul>
        </PracticalBlock>
      )}
    </div>
  )
}

function PracticalBlock({ icon: Icon, label, children }) {
  return (
    <div className="text-xs text-stone-600">
      <p className="flex items-center gap-1.5 font-medium text-stone-400 uppercase tracking-wider mb-1">
        <Icon size={11} />
        {label}
      </p>
      <div className="pl-[18px] leading-relaxed">{children}</div>
    </div>
  )
}
