import { useEffect, useState } from 'react'
import { useShellNav } from '@/components/shell/ShellContext'
import { apiRequest } from '@/lib/api'
import { IllustrationStatsTile } from '@/plant-database/components/IllustrationStatsTile'

interface Stats {
  total: number
  withIllustration: number
  withoutIllustration: number
  running: number
  failedRecently: number
  completionPct: number
}

interface Props {
  isAdmin: boolean
}

const PLANT_SECTIONS = [
  { id: 'list', label: 'Catalogue' },
  { id: 'illustrations', label: 'Atelier illustrations' }
]

export default function PlantsIllustrations({ isAdmin }: Props) {
  const [stats, setStats] = useState<Stats | null>(null)

  useShellNav({
    sections: PLANT_SECTIONS,
    activeSection: 'illustrations',
    onSectionChange: (id: string) => {
      if (id === 'list') window.location.href = '/plants'
    }
  })

  useEffect(() => {
    apiRequest('/api/v1/plants/illustrations/stats').then(setStats).catch(() => setStats(null))
  }, [])

  return (
    <div className="min-h-screen bg-[#fbf7ee]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="mb-10 border-b border-stone-300/70 pb-6">
          <p className="text-[10px] uppercase tracking-[0.32em] text-stone-500 mb-2">
            Plant Database · Sprint d'illustrations
          </p>
          <h1
            className="text-4xl md:text-5xl text-stone-900 leading-[1.05] tracking-tight"
            style={{ fontFamily: "'Sole Serif Small', 'DM Serif Display', serif", fontWeight: 400 }}
          >
            Atelier d'illustrations
          </h1>
          <p className="text-stone-600 text-sm mt-3 max-w-2xl">
            Pilotage du rattrapage des silhouettes pour les fiches imprimables.
            Chaque planche est composée à partir des données botaniques de l'espèce.
          </p>
        </header>

        {stats && <IllustrationStatsTile stats={stats} isAdmin={isAdmin} />}

        {/* Filter bar — Task 16 */}
        {/* Gallery — Task 17 */}
        {/* Queue panel — Task 18 */}
      </div>
    </div>
  )
}
