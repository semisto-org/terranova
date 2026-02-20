import { useState, useRef, useEffect, useCallback } from 'react'
import type { Photo, Contributor } from '../types'

interface PhotoGalleryProps {
  photos: Photo[]
  contributors: Contributor[]
  onContributorSelect?: (contributorId: string) => void
  onAddPhoto?: () => void
}

export function PhotoGallery({ photos, contributors, onContributorSelect, onAddPhoto }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchDelta, setTouchDelta] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSlides = photos.length

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current)
      autoplayRef.current = null
    }
  }, [])

  const goTo = useCallback((index: number, animate = true) => {
    stopAutoplay()
    if (animate) setIsTransitioning(true)
    setSelectedIndex(((index % totalSlides) + totalSlides) % totalSlides)
    if (animate) {
      setTimeout(() => setIsTransitioning(false), 400)
    }
  }, [totalSlides, stopAutoplay])

  const goNext = useCallback(() => {
    if (totalSlides <= 1) return
    goTo(selectedIndex + 1)
  }, [selectedIndex, totalSlides, goTo])

  const goPrev = useCallback(() => {
    if (totalSlides <= 1) return
    goTo(selectedIndex - 1)
  }, [selectedIndex, totalSlides, goTo])

  // Auto-advance every 6s when multiple photos
  useEffect(() => {
    if (totalSlides <= 1) return
    autoplayRef.current = setInterval(() => {
      setIsTransitioning(true)
      setSelectedIndex(prev => (prev + 1) % totalSlides)
      setTimeout(() => setIsTransitioning(false), 400)
    }, 6000)
    return stopAutoplay
  }, [totalSlides, stopAutoplay])

  // Touch handling for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    stopAutoplay()
    setTouchStart(e.touches[0].clientX)
    setTouchDelta(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return
    setTouchDelta(e.touches[0].clientX - touchStart)
  }

  const handleTouchEnd = () => {
    if (touchStart === null) return
    if (Math.abs(touchDelta) > 50) {
      touchDelta < 0 ? goNext() : goPrev()
    }
    setTouchStart(null)
    setTouchDelta(0)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev])

  if (photos.length === 0) {
    return (
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-stone-100 via-stone-50 to-stone-200">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full bg-stone-200/80 flex items-center justify-center">
            <svg className="w-10 h-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-stone-400 font-medium">Aucune photo</p>
          {onAddPhoto && (
            <button
              onClick={onAddPhoto}
              className="mt-1 flex items-center gap-2 px-4 py-2 bg-white/90 rounded-xl text-sm font-medium text-stone-600 hover:bg-white hover:text-[#5B5781] shadow-sm transition-all hover:shadow"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Ajouter une photo
            </button>
          )}
        </div>
      </div>
    )
  }

  const currentPhoto = photos[selectedIndex]
  const contributor = contributors.find(c => c.id === currentPhoto?.contributorId)

  return (
    <div className="space-y-3">
      {/* Carousel container */}
      <div
        className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-900 group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide track */}
        <div
          ref={trackRef}
          className="flex h-full"
          style={{
            transform: `translateX(calc(-${selectedIndex * 100}% + ${touchStart !== null ? touchDelta : 0}px))`,
            transition: touchStart !== null ? 'none' : isTransitioning ? 'transform 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
          }}
        >
          {photos.map((photo, index) => {
            const photoContributor = contributors.find(c => c.id === photo.contributorId)
            return (
              <div key={photo.id} className="flex-shrink-0 w-full h-full relative">
                <img
                  src={photo.url}
                  alt={photo.caption || `Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            )
          })}
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent h-28 pointer-events-none" />

        {/* Caption + contributor info */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              {currentPhoto?.caption && (
                <p className="text-white text-sm font-medium truncate">{currentPhoto.caption}</p>
              )}
              {contributor && (
                <button
                  onClick={() => onContributorSelect?.(contributor.id)}
                  className="flex items-center gap-2 mt-1.5 group/contrib"
                >
                  {contributor.avatarUrl ? (
                    <img src={contributor.avatarUrl} alt="" className="w-5 h-5 rounded-full ring-1 ring-white/30" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] text-white font-bold">
                      {contributor.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-white/70 text-xs group-hover/contrib:text-white transition-colors">
                    {contributor.name}
                  </span>
                </button>
              )}
            </div>

            {/* Upload button floating */}
            {onAddPhoto && (
              <button
                onClick={onAddPhoto}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-lg text-white/90 text-xs font-medium hover:bg-white/25 transition-all border border-white/10"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Photo
              </button>
            )}
          </div>
        </div>

        {/* Navigation arrows */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/50 border border-white/10"
              aria-label="Photo précédente"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/50 border border-white/10"
              aria-label="Photo suivante"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Slide counter */}
        {totalSlides > 1 && (
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full text-white/90 text-xs font-medium tabular-nums border border-white/10">
            {selectedIndex + 1} / {totalSlides}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {totalSlides > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          {photos.map((photo, index) => {
            const thumbContributor = contributors.find(c => c.id === photo.contributorId)
            const isActive = index === selectedIndex
            return (
              <button
                key={photo.id}
                onClick={() => goTo(index)}
                className={`group/thumb relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-200 ${
                  isActive
                    ? 'ring-2 ring-[#AFBD00] ring-offset-2 ring-offset-white scale-105'
                    : 'opacity-50 hover:opacity-90 hover:scale-[1.02]'
                }`}
              >
                <img src={photo.url} alt="" className="w-full h-full object-cover" draggable={false} />
                {/* Contributor initials on thumbnail */}
                {thumbContributor && (
                  <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/50 flex items-center justify-center text-[8px] text-white font-bold opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                    {thumbContributor.name.charAt(0)}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Dot indicators for mobile */}
      {totalSlides > 1 && totalSlides <= 8 && (
        <div className="flex justify-center gap-1.5 md:hidden">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === selectedIndex
                  ? 'bg-[#AFBD00] w-5'
                  : 'bg-stone-300 hover:bg-stone-400'
              }`}
              aria-label={`Photo ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
