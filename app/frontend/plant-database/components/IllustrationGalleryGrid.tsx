import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { ChevronLeft, ChevronRight, Sprout } from 'lucide-react'

export interface IllustrationItem {
  id: string
  latinName: string
  commonName: string | null
  thumbnailUrl: string | null
  fullUrl: string | null
  lastJobStatus: string | null
  totalJobs: number
}

interface ApiResponse {
  items: IllustrationItem[]
  totalPages: number
  total?: number
}

interface Props {
  filter: string
  onItemClick?: (item: IllustrationItem) => void
}

export function IllustrationGalleryGrid({ filter, onItemClick }: Props) {
  const [items, setItems] = useState<IllustrationItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [filter])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiRequest(`/api/v1/plants/illustrations?filter=${filter}&page=${page}&per_page=24`)
      .then((d: ApiResponse) => {
        if (cancelled) return
        setItems(d.items || [])
        setTotalPages(d.totalPages || 1)
        if (typeof d.total === 'number') setTotal(d.total)
      })
      .catch(() => {
        if (!cancelled) {
          setItems([])
          setTotalPages(1)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [filter, page])

  if (loading && items.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-stone-500 uppercase tracking-[0.22em]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5B5781] animate-pulse" />
          Chargement de l'herbier
        </div>
      </div>
    )
  }

  if (!loading && items.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-stone-300 rounded-md bg-white/40">
        <Sprout className="w-6 h-6 mx-auto text-stone-400 mb-3" strokeWidth={1.5} />
        <p
          className="text-stone-700 text-lg italic mb-1"
          style={{ fontFamily: "'Sole Serif Small', 'DM Serif Display', serif", fontWeight: 400 }}
        >
          Rien à voir ici.
        </p>
        <p className="text-xs text-stone-500">
          Aucune fiche ne correspond à ce filtre pour le moment.
        </p>
      </div>
    )
  }

  return (
    <section>
      {total !== null && (
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
            Planches
          </span>
          <span className="text-[11px] text-stone-500 font-mono tabular-nums">
            {total.toLocaleString('fr-FR')} résultat{total > 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onItemClick?.(item)}
            className="group relative aspect-[3/4] bg-[#fdfaf2] border border-stone-200 rounded-sm overflow-hidden text-left transition-all duration-200 hover:border-[#AFBD00] hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-10px_rgba(91,87,129,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B5781]"
            title={item.latinName}
          >
            {/* Status corner mark */}
            {item.lastJobStatus === 'failed' && (
              <span
                className="absolute top-1.5 right-1.5 z-10 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-white"
                aria-label="Dernière génération en échec"
              />
            )}
            {item.lastJobStatus === 'running' && (
              <span
                className="absolute top-1.5 right-1.5 z-10 w-1.5 h-1.5 rounded-full bg-[#EF9B0D] ring-2 ring-white animate-pulse"
                aria-label="Génération en cours"
              />
            )}

            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.latinName}
                className="w-full h-full object-contain p-2"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-[10px] uppercase tracking-[0.18em] px-2 text-center bg-[repeating-linear-gradient(135deg,#fdfaf2_0,#fdfaf2_8px,#f7f1e3_8px,#f7f1e3_9px)]">
                <Sprout className="w-5 h-5 mb-1.5" strokeWidth={1.5} />
                <span>Sans planche</span>
              </div>
            )}

            {/* Marginalia label — italic latin name slides up on hover */}
            <div className="absolute inset-x-0 bottom-0 px-2.5 py-1.5 bg-gradient-to-t from-stone-900/90 via-stone-900/60 to-transparent text-white opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition duration-200">
              <div
                className="text-[11px] italic leading-tight truncate"
                style={{ fontFamily: "'Sole Serif Small', 'DM Serif Display', serif" }}
              >
                {item.latinName}
              </div>
              {item.commonName && (
                <div className="text-[9px] uppercase tracking-[0.16em] text-white/70 truncate">
                  {item.commonName}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 text-sm" aria-label="Pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Page précédente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-xs font-mono tabular-nums text-stone-600">
            <span className="text-stone-900 font-semibold">{page}</span>
            <span className="mx-1 text-stone-400">/</span>
            <span>{totalPages}</span>
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Page suivante"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </section>
  )
}
