import { useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'
import type { IllustrationItem } from './IllustrationGalleryGrid'

interface Props {
  item: IllustrationItem | null
  onClose: () => void
}

export function IllustrationLightbox({ item, onClose }: Props) {
  // Close on ESC
  useEffect(() => {
    if (!item) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [item, onClose])

  if (!item) return null

  const speciesPath = `/plants/species/${item.id}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 backdrop-blur-sm p-6 sm:p-10"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Illustration de ${item.latinName}`}
    >
      {/* Close button — fixed top-right */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-5 right-5 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        aria-label="Fermer"
      >
        <X className="w-5 h-5" strokeWidth={1.75} />
      </button>

      {/* Content area — stops propagation so click-on-image doesn't close */}
      <div
        className="relative max-w-5xl w-full max-h-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="bg-white rounded-md shadow-2xl overflow-hidden max-h-[78vh] flex items-center justify-center">
          {item.fullUrl ? (
            <img
              src={item.fullUrl}
              alt={item.latinName}
              className="max-w-full max-h-[78vh] object-contain"
            />
          ) : (
            <div className="w-[400px] h-[500px] bg-stone-100 flex items-center justify-center text-stone-400 text-sm italic">
              Sans illustration
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="mt-4 flex items-baseline justify-between gap-4 w-full px-2">
          <div className="min-w-0">
            {item.commonName && (
              <div
                className="text-white text-lg sm:text-xl"
                style={{ fontFamily: "'Sole Serif Small', 'DM Serif Display', serif", fontWeight: 500 }}
              >
                {item.commonName}
              </div>
            )}
            <div
              className="italic text-white/80 text-sm sm:text-base truncate"
              style={{ fontFamily: "'Sole Serif Small', 'DM Serif Display', serif" }}
            >
              {item.latinName}
            </div>
          </div>
          <a
            href={speciesPath}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-white/80 hover:text-white border border-white/30 hover:border-white/60 rounded-full px-3 py-1.5 transition"
          >
            Voir la fiche
            <ExternalLink className="w-3 h-3" strokeWidth={2} />
          </a>
        </div>
      </div>
    </div>
  )
}
