import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, Loader2, UserCircle } from 'lucide-react'
import { useShellNav } from '@/components/shell/ShellContext'
import { apiRequest } from '@/lib/api'

const SUBJECT_TYPES = [
  { value: '', label: 'Tous' },
  { value: 'Task', label: 'Tâches' },
  { value: 'Comment', label: 'Commentaires' },
  { value: 'Event', label: 'Événements' },
  { value: 'Strategy::Deliberation', label: 'Délibérations' },
]

const ACTION_PHRASES = {
  task_assigned: { withActor: 'a assigné', withoutActor: 'Tâche assignée' },
  task_pinged: { withActor: 'a envoyé un coucou sur', withoutActor: 'Coucou envoyé sur' },
  comment_created: { withActor: 'a commenté', withoutActor: 'Commentaire ajouté sur' },
  task_due_soon: { withActor: 'a une échéance proche sur', withoutActor: 'Échéance proche pour' },
}

function initialsFor(actor) {
  if (!actor?.name) return ''
  return actor.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function actionPhrase(event) {
  const phrase = ACTION_PHRASES[event.action]
  if (phrase) return event.actor ? phrase.withActor : phrase.withoutActor
  const generic = event.action.replaceAll('_', ' ')
  return event.actor ? `a déclenché ${generic}` : generic
}

function groupLabel(date) {
  const value = new Date(date)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (value.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (value.toDateString() === yesterday.toDateString()) return 'Hier'

  return new Intl.DateTimeFormat('fr-BE', { dateStyle: 'long' }).format(value)
}

function relativeTime(date) {
  const value = new Date(date).getTime()
  const seconds = Math.round((value - Date.now()) / 1000)
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]

  for (const [unit, amount] of units) {
    if (Math.abs(seconds) >= amount) {
      return new Intl.RelativeTimeFormat('fr', { numeric: 'auto' }).format(Math.round(seconds / amount), unit)
    }
  }

  return 'à l’instant'
}

function Avatar({ actor }) {
  if (!actor) {
    return (
      <div className="h-9 w-9 shrink-0 rounded-full border border-stone-200 bg-stone-100 text-stone-500 flex items-center justify-center">
        <Activity className="h-4 w-4" />
      </div>
    )
  }

  if (actor.avatar) {
    return <img src={actor.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover border border-stone-200" />
  }

  const initials = initialsFor(actor)
  return (
    <div className="h-9 w-9 shrink-0 rounded-full border border-stone-200 bg-white text-stone-700 flex items-center justify-center text-xs font-semibold">
      {initials || <UserCircle className="h-5 w-5 text-stone-400" />}
    </div>
  )
}

function ActivityRow({ event }) {
  return (
    <li className="flex gap-3 py-3">
      <Avatar actor={event.actor} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          {event.actor && <span className="font-semibold text-stone-900">{event.actor.name}</span>}
          <span className="text-stone-600">{actionPhrase(event)}</span>
          <a href={event.url} className="font-medium text-stone-900 hover:text-[#5B5781] hover:underline">
            {event.subject.label}
          </a>
          {event.project && (
            <span className="inline-flex max-w-full items-center rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-xs font-medium text-stone-500">
              <span className="truncate">{event.project.name}</span>
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-stone-500">{relativeTime(event.createdAt)}</div>
      </div>
    </li>
  )
}

export default function ActivityIndex() {
  useShellNav({ sections: [], activeSection: 'activity' })

  const [projectOptions, setProjectOptions] = useState([])
  const [project, setProject] = useState('')
  const [subjectType, setSubjectType] = useState('')
  const [scope, setScope] = useState('')
  const [events, setEvents] = useState([])
  const [nextBefore, setNextBefore] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiRequest('/api/v1/my-projects')
      .then((data) => setProjectOptions(data.projects || []))
      .catch(() => setProjectOptions([]))
  }, [])

  const buildPath = useCallback((before) => {
    const params = new URLSearchParams()
    if (project) params.set('project', project)
    if (subjectType) params.set('subject_type', subjectType)
    if (scope) params.set('scope', scope)
    if (before) params.set('before', before)

    const query = params.toString()
    return `/api/v1/activity${query ? `?${query}` : ''}`
  }, [project, scope, subjectType])

  const loadActivity = useCallback(async ({ append = false, before = null } = {}) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const data = await apiRequest(buildPath(before))
      setEvents((current) => (append ? [...current, ...(data.events || [])] : (data.events || [])))
      setHasMore(Boolean(data.hasMore))
      setNextBefore(data.nextBefore || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [buildPath])

  useEffect(() => {
    loadActivity()
  }, [loadActivity])

  const groupedEvents = useMemo(() => {
    return events.reduce((groups, event) => {
      const label = groupLabel(event.createdAt)
      if (!groups[label]) groups[label] = []
      groups[label].push(event)
      return groups
    }, {})
  }, [events])

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-950">Activité</h1>
        <p className="mt-1 text-sm text-stone-500">
          Tout ce qui bouge dans tes projets — à consulter quand tu veux, rien à traiter.
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-3 sm:flex-row sm:items-center">
        <select
          value={project}
          onChange={(event) => setProject(event.target.value)}
          className="h-9 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-800"
        >
          <option value="">Tous les projets</option>
          {projectOptions.map((option) => (
            <option key={`${option.projectType}:${option.projectId}`} value={`${option.projectType}:${option.projectId}`}>
              {option.projectName}
            </option>
          ))}
        </select>

        <select
          value={subjectType}
          onChange={(event) => setSubjectType(event.target.value)}
          className="h-9 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-800"
        >
          {SUBJECT_TYPES.map((option) => (
            <option key={option.value || 'all'} value={option.value}>{option.label}</option>
          ))}
        </select>

        <div className="inline-flex h-9 rounded-md border border-stone-300 bg-stone-50 p-0.5">
          <button
            type="button"
            onClick={() => setScope('')}
            className={`rounded px-3 text-sm font-medium transition-colors ${scope === '' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
          >
            Tout le monde
          </button>
          <button
            type="button"
            onClick={() => setScope('mine')}
            className={`rounded px-3 text-sm font-medium transition-colors ${scope === 'mine' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
          >
            Moi
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement...
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm text-stone-500">
          Rien à afficher pour ces filtres.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([label, items]) => (
            <section key={label}>
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</h2>
              <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white px-4">
                {items.map((event) => <ActivityRow key={event.id} event={event} />)}
              </ul>
            </section>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => loadActivity({ append: true, before: nextBefore })}
            disabled={loadingMore}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-60"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            Charger plus
          </button>
        </div>
      )}
    </div>
  )
}
