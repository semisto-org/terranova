import React, { useState, useEffect } from 'react'
import { ArrowLeft, Mail, Phone, Pencil, Calendar, Users, GraduationCap } from 'lucide-react'
import { apiRequest } from '@/lib/api'

const STATUS_COLORS = {
  draft: 'bg-stone-100 text-stone-500',
  planned: 'bg-blue-50 text-blue-500',
  registrations_open: 'bg-green-50 text-green-500',
  in_progress: 'bg-[#B01A19]/10 text-[#B01A19]',
  completed: 'bg-emerald-50 text-emerald-500',
  cancelled: 'bg-red-50 text-red-500',
}

const STATUS_LABELS = {
  draft: 'Brouillon',
  planned: 'Planifiée',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateShort(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function TeamMemberDetail({ contactId, onBack, onEdit, refreshKey }) {
  const [contact, setContact] = useState(null)
  const [trainings, setTrainings] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const data = await apiRequest(`/api/v1/academy/team/${contactId}`)
        if (!cancelled) {
          setContact(data.contact)
          setTrainings(data.trainings || [])
          setStats(data.stats || {})
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Erreur lors du chargement')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [contactId, refreshKey])

  if (loading) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'équipe
        </button>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[#B01A19]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'équipe
        </button>
        <div className="bg-white rounded-2xl p-12 border border-stone-200 text-center">
          <p className="text-stone-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!contact) return null

  return (
    <div className="space-y-6">
      {/* Back button + Header */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'équipe
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-stone-900"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {contact.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-[#B01A19] transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-[#B01A19] transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {contact.phone}
                </a>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEdit?.(contact)}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Modifier
          </button>
        </div>
      </div>

      {/* Expertise badges */}
      {contact.expertise && contact.expertise.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {contact.expertise.map((item) => (
            <span
              key={item}
              className="inline-flex items-center rounded-full bg-[#B01A19]/10 px-3 py-1 text-sm font-medium text-[#B01A19]"
            >
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#eac7b8]/20 group-hover:bg-[#B01A19]/10 transition-colors duration-200">
                <Calendar className="w-5 h-5 text-[#B01A19]" />
              </div>
              <span className="text-sm text-stone-500">Sessions totales</span>
            </div>
            <p className="text-2xl font-bold text-stone-900">{stats.totalSessions ?? 0}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#eac7b8]/20 group-hover:bg-[#B01A19]/10 transition-colors duration-200">
                <GraduationCap className="w-5 h-5 text-[#B01A19]" />
              </div>
              <span className="text-sm text-stone-500">Activités</span>
            </div>
            <p className="text-2xl font-bold text-stone-900">{stats.totalTrainings ?? 0}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#eac7b8]/20 group-hover:bg-[#B01A19]/10 transition-colors duration-200">
                <Users className="w-5 h-5 text-[#B01A19]" />
              </div>
              <span className="text-sm text-stone-500">Prochaine session</span>
            </div>
            <p className="text-lg font-semibold text-stone-900">
              {stats.nextSession ? formatDate(stats.nextSession.date) : 'Aucune'}
            </p>
          </div>
        </div>
      )}

      {/* Notes section — content is server-sanitized HTML from TipTap editor, same pattern as TrainingInfoTab */}
      {contact.notesHtml && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#B01A19] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="pl-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                <div className="h-1 w-8 bg-[#B01A19] rounded-full" />
                Notes
              </h3>
              <button
                type="button"
                onClick={() => onEdit?.(contact)}
                className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-[#B01A19] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modifier
              </button>
            </div>
            <div
              className="text-stone-700 leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1"
              dangerouslySetInnerHTML={{ __html: contact.notesHtml }}
            />
          </div>
        </div>
      )}

      {/* Activity history */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <div className="h-1 w-8 bg-[#B01A19] rounded-full" />
            Historique des activités
          </h3>
        </div>

        {trainings.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">Aucune activité associée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50">
                  <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    Activité
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    Type
                  </th>
                  <th className="text-center text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    Sessions
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    Dates
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {trainings.map((training) => (
                  <tr
                    key={training.id}
                    className="hover:bg-stone-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-stone-900">
                        {training.title}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-500">
                        {training.typeName || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-stone-700">
                        {training.sessionCount ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-500">
                        {training.firstDate && training.lastDate
                          ? training.firstDate === training.lastDate
                            ? formatDateShort(training.firstDate)
                            : `${formatDateShort(training.firstDate)} — ${formatDateShort(training.lastDate)}`
                          : training.firstDate
                            ? formatDateShort(training.firstDate)
                            : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[training.status] || 'bg-stone-100 text-stone-500'}`}
                      >
                        {STATUS_LABELS[training.status] || training.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
