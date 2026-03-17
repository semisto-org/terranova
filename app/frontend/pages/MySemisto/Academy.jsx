import React, { useState, useEffect } from 'react'
import { GraduationCap, Loader2, BookOpen, Zap, Clock } from 'lucide-react'
import MySemistoShell from '../../my-semisto/components/MySemistoShell'
import TrainingCard from '../../my-semisto/components/TrainingCard'
import { myApiRequest } from '../../my-semisto/lib/api'

const SECTION_CONFIG = {
  inProgress: { icon: Zap, color: '#EF9B0D', label: 'En cours' },
  upcoming: { icon: BookOpen, color: '#2D6A4F', label: 'À venir' },
  past: { icon: Clock, color: '#5B5781', label: 'Passées' },
}

function categorize(trainings) {
  const now = new Date()
  const upcoming = []
  const inProgress = []
  const past = []

  trainings.forEach((t) => {
    if (t.status === 'completed' || t.status === 'cancelled') {
      past.push(t)
    } else if (t.status === 'in_progress') {
      inProgress.push(t)
    } else if (t.endDate && new Date(t.endDate) < now) {
      past.push(t)
    } else {
      upcoming.push(t)
    }
  })

  return { upcoming, inProgress, past }
}

export default function Academy() {
  const [trainings, setTrainings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    myApiRequest('/api/v1/my/academy')
      .then((data) => {
        setTrainings(data.trainings || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const { upcoming, inProgress, past } = categorize(trainings)

  return (
    <MySemistoShell activeNav="/my/academy">
      {/* Header with Academy accent */}
      <div className="mb-8 my-animate-section">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#B01A1915' }}
          >
            <GraduationCap size={18} style={{ color: '#B01A19' }} />
          </div>
          <div>
            <h1
              className="text-2xl text-stone-800"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Semisto Academy
            </h1>
          </div>
        </div>
        <p className="text-sm text-stone-500 ml-12">
          Des ressources mises à ta disposition par l'équipe et les participants
        </p>
        <hr className="my-section-divider mt-5" />
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

      {!loading && !error && trainings.length === 0 && (
        <div className="text-center py-16 my-animate-section">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: '#B01A190D' }}
          >
            <GraduationCap size={28} style={{ color: '#B01A19' }} />
          </div>
          <p className="text-stone-600 text-sm font-medium mb-1">Aucune formation pour le moment</p>
          <p className="text-stone-400 text-xs">
            Vos formations et activités Academy apparaîtront ici.
          </p>
        </div>
      )}

      {!loading && !error && trainings.length > 0 && (
        <div className="space-y-8">
          {inProgress.length > 0 && (
            <Section sectionKey="inProgress" trainings={inProgress} delay={100} />
          )}
          {upcoming.length > 0 && (
            <Section sectionKey="upcoming" trainings={upcoming} delay={200} />
          )}
          {past.length > 0 && (
            <Section sectionKey="past" trainings={past} delay={300} />
          )}
        </div>
      )}
    </MySemistoShell>
  )
}

function Section({ sectionKey, trainings, delay }) {
  const config = SECTION_CONFIG[sectionKey]
  const Icon = config.icon

  return (
    <div className="my-animate-section" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: config.color,
            ...(sectionKey === 'inProgress' ? { animation: 'my-status-pulse 2s ease-in-out infinite' } : {}),
          }}
        />
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: config.color }}>
          {config.label}
        </h2>
        <span className="text-xs text-stone-400">({trainings.length})</span>
      </div>
      <div className="space-y-3">
        {trainings.map((t) => (
          <TrainingCard key={t.id} training={t} />
        ))}
      </div>
    </div>
  )
}
