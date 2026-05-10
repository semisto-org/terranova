import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useShellNav } from '@/components/shell/ShellContext'
import { apiRequest } from '@/lib/api'
import { IllustrationStatsTile } from '@/plant-database/components/IllustrationStatsTile'
import { IllustrationFilterBar } from '@/plant-database/components/IllustrationFilterBar'
import { IllustrationGalleryGrid, type IllustrationItem } from '@/plant-database/components/IllustrationGalleryGrid'
import { IllustrationQueuePanel } from '@/plant-database/components/IllustrationQueuePanel'
import { ConfirmBulkGenerationModal } from '@/plant-database/components/ConfirmBulkGenerationModal'
import { IllustrationLightbox } from '@/plant-database/components/IllustrationLightbox'

type Filter = 'all' | 'with' | 'without' | 'running' | 'failed'

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
  { id: 'search', label: 'Recherche' },
  { id: 'palette', label: 'Palette' },
  { id: 'activity', label: 'Activité' },
  { id: 'illustrations', label: 'Illustrations' }
]

export default function PlantsIllustrations({ isAdmin }: Props) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [filter, setFilter] = useState<Filter>('without')
  const [showCardContext, setShowCardContext] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [lightboxItem, setLightboxItem] = useState<IllustrationItem | null>(null)

  useShellNav({
    sections: PLANT_SECTIONS,
    activeSection: 'illustrations',
    onSectionChange: (id: string) => {
      if (id === 'illustrations') return
      const path =
        id === 'palette'  ? '/plants/palette'  :
        id === 'activity' ? '/plants/activity' :
                            '/plants'
      window.location.href = path
    }
  })

  useEffect(() => {
    apiRequest('/api/v1/plants/illustrations/stats').then(setStats).catch(() => setStats(null))
  }, [])

  const handleRetry = async (jobId: number) => {
    await apiRequest(`/api/v1/plants/illustrations/jobs/${jobId}/retry`, { method: 'POST' })
  }

  const refreshStats = () => {
    apiRequest('/api/v1/plants/illustrations/stats').then(setStats).catch(() => {})
  }

  const handleLaunchBulk = async () => {
    if (!stats) return
    try {
      const data = await apiRequest('/api/v1/plants/illustrations?filter=without&per_page=1500')
      const ids = (data?.items || []).map((i: { id: string }) => parseInt(i.id, 10)).filter(Boolean)
      if (ids.length === 0) {
        setConfirmOpen(false)
        toast.info('Aucune espèce à générer — la base est complète.')
        return
      }
      await apiRequest('/api/v1/plants/illustrations/generate', {
        method: 'POST',
        body: JSON.stringify({ species_ids: ids })
      })
      setConfirmOpen(false)
      refreshStats()
      toast.success(`${ids.length} génération${ids.length > 1 ? 's' : ''} lancée${ids.length > 1 ? 's' : ''}.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Échec du rattrapage')
    }
  }

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

        {stats && (
          <IllustrationStatsTile
            stats={stats}
            isAdmin={isAdmin}
            onLaunchBulk={() => setConfirmOpen(true)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 lg:gap-8">
          <div className="min-w-0">
            <IllustrationFilterBar
              filter={filter}
              onFilterChange={setFilter}
              showCardContext={showCardContext}
              onShowCardContextChange={setShowCardContext}
            />

            <IllustrationGalleryGrid filter={filter} onItemClick={setLightboxItem} />
          </div>

          <IllustrationQueuePanel isAdmin={isAdmin} onRetry={handleRetry} />
        </div>
      </div>

      {stats && (
        <ConfirmBulkGenerationModal
          open={confirmOpen}
          count={stats.withoutIllustration}
          estimatedSeconds={Math.round((stats.withoutIllustration / 3) * 30)}
          onConfirm={handleLaunchBulk}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      <IllustrationLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
    </div>
  )
}
