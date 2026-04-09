import React, { useEffect, useState } from 'react'
import { CalendarDays, Users, ExternalLink } from 'lucide-react'
import { apiRequest } from '@/lib/api'

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatPrice(price) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}

function ActivityCard({ training }) {
  const spotsRemaining = training.spotsRemaining
  const totalCapacity = training.totalCapacity
  const fillPercentage = totalCapacity > 0
    ? Math.round(((totalCapacity - spotsRemaining) / totalCapacity) * 100)
    : 0

  return (
    <div className="bg-white rounded-xl border-2 border-[#B01A19]/20 hover:border-[#B01A19]/40 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#B01A19] to-[#eac7b8]" />

      <div className="mb-3">
        {training.trainingTypeName && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide mb-2"
            style={{
              backgroundColor: training.trainingTypeColor ? `${training.trainingTypeColor}18` : '#eac7b8',
              color: training.trainingTypeColor || '#B01A19',
            }}
          >
            {training.trainingTypeName}
          </span>
        )}
        <h3 className="font-bold text-stone-900 text-base leading-snug line-clamp-2">
          {training.title}
        </h3>
      </div>

      {training.description && (
        <p className="text-sm text-stone-500 line-clamp-2 mb-4">{training.description}</p>
      )}

      <div className="space-y-2.5 mb-4">
        {training.nextSession && (
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <div className="p-1 rounded bg-[#eac7b8]/30">
              <CalendarDays className="w-3.5 h-3.5 text-[#B01A19]" />
            </div>
            <span className="font-medium">{formatDate(training.nextSession.startDate)}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-stone-600">
          <div className="p-1 rounded bg-[#eac7b8]/30">
            <Users className="w-3.5 h-3.5 text-[#B01A19]" />
          </div>
          <span className="font-medium">
            {spotsRemaining > 0
              ? `${spotsRemaining} place${spotsRemaining > 1 ? 's' : ''} disponible${spotsRemaining > 1 ? 's' : ''}`
              : 'Complet'}
          </span>
          <div className="flex-1" />
          <div className="w-16 h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-[#B01A19]"
              style={{ width: `${Math.min(fillPercentage, 100)}%` }}
            />
          </div>
        </div>

        {training.price > 0 && (
          <div className="text-sm font-semibold text-stone-700">
            {formatPrice(training.price)}
            {training.vatRate > 0 && <span className="text-xs font-normal text-stone-400 ml-1">TTC</span>}
          </div>
        )}
      </div>

      <a
        href={`/academy/${training.id}/register`}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#B01A19] hover:bg-[#8e1514] transition-colors duration-200 w-full justify-center"
      >
        S'inscrire
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  )
}

export default function OpenActivities() {
  const [trainings, setTrainings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/api/v1/foundation/open-activities')
      .then((data) => setTrainings(data.trainings || []))
      .catch(() => setTrainings([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-stone-400 py-4">
        <div className="animate-spin w-4 h-4 border-2 border-stone-300 border-t-[#B01A19] rounded-full" />
        Chargement des activités...
      </div>
    )
  }

  if (trainings.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-5 rounded-full bg-[#B01A19]" />
        <h2 className="text-lg font-bold text-stone-900">Inscriptions ouvertes</h2>
        <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#B01A19]/10 text-[#B01A19]">
          {trainings.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trainings.map((training) => (
          <ActivityCard key={training.id} training={training} />
        ))}
      </div>
    </div>
  )
}
