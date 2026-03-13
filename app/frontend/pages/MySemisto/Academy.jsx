import React, { useState, useEffect } from 'react'
import { GraduationCap, Loader2 } from 'lucide-react'
import MySemistoShell from '../../my-semisto/components/MySemistoShell'
import TrainingCard from '../../my-semisto/components/TrainingCard'
import { myApiRequest } from '../../my-semisto/lib/api'

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
      <div className="mb-8 my-animate-section">
        <h1
          className="text-2xl text-stone-800 mb-1"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Mes Formations
        </h1>
        <p className="text-sm text-stone-500">
          Consultez vos formations et telechargez les documents associes.
        </p>
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

      {!loading && !error && trainings.length === 0 && (
        <div className="text-center py-16 my-animate-section">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
            <GraduationCap size={28} className="text-stone-400" />
          </div>
          <p className="text-stone-500 text-sm">Aucune formation enregistree pour le moment.</p>
        </div>
      )}

      {!loading && !error && trainings.length > 0 && (
        <div className="space-y-8">
          {inProgress.length > 0 && (
            <Section title="En cours" trainings={inProgress} delay={100} />
          )}
          {upcoming.length > 0 && (
            <Section title="A venir" trainings={upcoming} delay={200} />
          )}
          {past.length > 0 && (
            <Section title="Passees" trainings={past} delay={300} />
          )}
        </div>
      )}
    </MySemistoShell>
  )
}

function Section({ title, trainings, delay }) {
  return (
    <div className="my-animate-section" style={{ animationDelay: `${delay}ms` }}>
      <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wider mb-3">
        {title} ({trainings.length})
      </h2>
      <div className="space-y-3">
        {trainings.map((t) => (
          <TrainingCard key={t.id} training={t} />
        ))}
      </div>
    </div>
  )
}
