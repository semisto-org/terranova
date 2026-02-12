import { useState } from 'react'
import type { Photo, Contributor } from '../types'

interface PhotoGalleryProps {
  photos: Photo[]
  contributors: Contributor[]
  onContributorSelect?: (contributorId: string) => void
}

export function PhotoGallery({ photos, contributors, onContributorSelect }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (photos.length === 0) {
    return (
      <div className="aspect-[4/3] bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 rounded-2xl flex items-center justify-center">
        <div className="text-center text-stone-400 dark:text-stone-600">
          <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Aucune photo</p>
        </div>
      </div>
    )
  }

  const currentPhoto = photos[selectedIndex]
  const contributor = contributors.find(c => c.id === currentPhoto.contributorId)

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-[4/3] bg-stone-100 dark:bg-stone-800 rounded-2xl overflow-hidden group">
        <img
          src={currentPhoto.url}
          alt={currentPhoto.caption}
          className="w-full h-full object-cover"
        />

        {/* Caption overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 pt-12">
          <p className="text-white text-sm font-medium">{currentPhoto.caption}</p>
          {contributor && (
            <button
              onClick={() => onContributorSelect?.(contributor.id)}
              className="text-white/70 text-xs hover:text-white transition-colors mt-1"
            >
              Photo par {contributor.name}
            </button>
          )}
        </div>

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setSelectedIndex(i => (i - 1 + photos.length) % photos.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-stone-900/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white dark:hover:bg-stone-900"
            >
              <svg className="w-5 h-5 text-stone-700 dark:text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedIndex(i => (i + 1) % photos.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-stone-900/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white dark:hover:bg-stone-900"
            >
              <svg className="w-5 h-5 text-stone-700 dark:text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                index === selectedIndex
                  ? 'ring-2 ring-[#AFBD00] ring-offset-2 ring-offset-white dark:ring-offset-stone-900'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
