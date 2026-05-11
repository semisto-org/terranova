import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Play, Pause, ExternalLink } from 'lucide-react'
import type { Photo, Contributor } from '../types'

interface PhotoLightboxProps {
  photos: Photo[]
  initialIndex: number
  contributors: Contributor[]
  onClose: () => void
}

export function PhotoLightbox({ photos, initialIndex, contributors, onClose }: PhotoLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = photos.length
  const photo = photos[index]
  const contributor = contributors.find(c => c.id === photo?.contributorId)

  const goNext = useCallback(() => setIndex(i => (i + 1) % total), [total])
  const goPrev = useCallback(() => setIndex(i => (i - 1 + total) % total), [total])

  useEffect(() => {
    if (!isPlaying || total <= 1) return
    autoplayRef.current = setInterval(goNext, 4000)
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current)
    }
  }, [isPlaying, goNext, total])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === ' ') {
        e.preventDefault()
        setIsPlaying(p => !p)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, goNext, goPrev])

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [])

  if (!photo) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
        aria-label="Fermer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Slideshow toggle */}
      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsPlaying(p => !p) }}
          className="absolute top-4 left-4 z-10 px-3 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 text-sm backdrop-blur-sm transition-colors"
          aria-label={isPlaying ? 'Pause slideshow' : 'Lancer slideshow'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Slideshow'}</span>
        </button>
      )}

      {/* Counter */}
      {total > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 h-10 rounded-full bg-white/10 text-white text-sm flex items-center backdrop-blur-sm tabular-nums">
          {index + 1} / {total}
        </div>
      )}

      {/* Prev / Next */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            aria-label="Photo précédente"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            aria-label="Photo suivante"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Image */}
      <img
        src={photo.url}
        alt={photo.caption || `Photo ${index + 1}`}
        className="max-w-[90vw] max-h-[85vh] object-contain"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* Caption + attribution panel */}
      <div
        className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-6 px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-3xl mx-auto space-y-2 text-white">
          {photo.caption && <p className="text-base font-medium">{photo.caption}</p>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
            {photo.attributionAuthor && (
              <span>© {photo.attributionAuthor}</span>
            )}
            {photo.license && (
              <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-mono">{photo.license}</span>
            )}
            {photo.sourcePlatform && (
              <span className="text-xs">{photo.sourcePlatform}</span>
            )}
            <a
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Source
            </a>
            {contributor && (
              <span className="text-xs text-white/60">— Posté par {contributor.name}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
