import React, { useState, useCallback, useEffect } from 'react'
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Smartphone,
  Image as ImageIcon,
  Video,
} from 'lucide-react'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm'

/**
 * Reusable photo/video gallery with lightbox, optional group-by-device view, and upload.
 *
 * @param {Array}  items     - Media items: { id, mediaType, caption, takenAt, deviceDisplayName, fileUrl, thumbnailUrl, ... }
 * @param {Function} onUpload - (files: File[]) => Promise, called when user selects files
 * @param {Function} onDelete - (mediaId: string) => Promise, optional
 * @param {boolean} readOnly - Hide upload/delete controls
 */
export default function PhotoGallery({ items = [], onUpload, onDelete, readOnly = false }) {
  const [groupByDevice, setGroupByDevice] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = React.useRef(null)

  const flatItems = items
  const grouped = groupByDevice
    ? Object.entries(
        flatItems.reduce((acc, it) => {
          const key = it.deviceDisplayName || 'Unknown device'
          if (!acc[key]) acc[key] = []
          acc[key].push(it)
          return acc
        }, {})
      ).sort((a, b) => (a[0] > b[0] ? 1 : -1))
    : null

  const openLightbox = (index) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const goPrev = () => setLightboxIndex((i) => (i <= 0 ? flatItems.length - 1 : i - 1))
  const goNext = () => setLightboxIndex((i) => (i >= flatItems.length - 1 ? 0 : i + 1))

  useEffect(() => {
    const handleKey = (e) => {
      if (lightboxIndex == null) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxIndex])

  const handleFileSelect = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []).filter((f) => f && f.type)
      if (!files.length || !onUpload) return
      setUploading(true)
      try {
        await onUpload(files)
      } finally {
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [onUpload]
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect]
  )
  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }
  const handleDragLeave = () => setDragOver(false)

  const currentItem = lightboxIndex != null ? flatItems[lightboxIndex] : null

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={groupByDevice}
              onChange={(e) => setGroupByDevice(e.target.checked)}
              className="rounded border-stone-300 text-[var(--color-pole-lab)] focus:ring-[var(--color-pole-lab)]"
            />
            <span className="text-sm text-stone-600">Grouper par appareil</span>
          </label>
        </div>
      )}

      {grouped ? (
        <div className="space-y-6">
          {grouped.map(([deviceName, deviceItems]) => (
            <div key={deviceName}>
              <div className="flex items-center gap-2 mb-2 text-stone-600">
                <Smartphone className="w-4 h-4" />
                <span className="font-medium">{deviceName}</span>
                <span className="text-sm">({deviceItems.length})</span>
              </div>
              <MediaGrid
                items={deviceItems}
                onItemClick={(item) => openLightbox(flatItems.indexOf(item))}
                onDelete={!readOnly && onDelete ? onDelete : null}
              />
            </div>
          ))}
        </div>
      ) : (
        <MediaGrid
          items={flatItems}
          onItemClick={(_, index) => openLightbox(index)}
          onDelete={!readOnly && onDelete ? onDelete : null}
        />
      )}

      {!readOnly && onUpload && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragOver ? 'border-[var(--color-pole-lab)] bg-[var(--color-pole-lab-bg)]/30' : 'border-stone-300 bg-stone-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <Upload className="w-10 h-10 mx-auto text-stone-400 mb-2" />
          <p className="text-sm text-stone-600 mb-2">
            Glissez des photos ou vidéos ici, ou{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-[var(--color-pole-lab)] font-medium underline hover:no-underline"
            >
              parcourir
            </button>
          </p>
          {uploading && <p className="text-sm text-stone-500">Envoi en cours…</p>}
        </div>
      )}

      {currentItem && (
        <Lightbox
          item={currentItem}
          position={{ current: lightboxIndex + 1, total: flatItems.length }}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </div>
  )
}

function MediaGrid({ items, onItemClick, onDelete }) {
  if (!items.length) {
    return (
      <p className="text-sm text-stone-500 py-8 text-center">Aucun média dans cet album.</p>
    )
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((item, index) => (
        <MediaThumb
          key={item.id}
          item={item}
          onClick={() => onItemClick(item, index)}
          onDelete={onDelete ? () => onDelete(item.id) : null}
        />
      ))}
    </div>
  )
}

function MediaThumb({ item, onClick, onDelete }) {
  const isVideo = item.mediaType === 'video'
  return (
    <div className="relative group aspect-square rounded-lg overflow-hidden bg-stone-200">
      <button
        type="button"
        onClick={onClick}
        className="absolute inset-0 w-full h-full focus:outline-none focus:ring-2 ring-inset ring-[var(--color-pole-lab)] rounded-lg"
      >
        {isVideo ? (
          <video
            src={item.thumbnailUrl || item.fileUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={item.thumbnailUrl || item.fileUrl}
            alt={item.caption || ''}
            className="w-full h-full object-cover"
          />
        )}
      </button>
      {isVideo && (
        <div className="absolute bottom-1 right-1 rounded bg-black/60 p-1">
          <Video className="w-4 h-4 text-white" />
        </div>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity rounded bg-red-600 text-white p-1 hover:bg-red-700"
          aria-label="Supprimer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

function Lightbox({ item, position, onClose, onPrev, onNext }) {
  const isVideo = item.mediaType === 'video'
  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col bg-black/95"
      onClick={onClose}
    >
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <span className="text-white/80 text-sm">
          {position.current} / {position.total}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full text-white hover:bg-white/20"
          aria-label="Fermer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 min-h-0" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-white hover:bg-white/20 z-10"
          aria-label="Précédent"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <div className="max-w-full max-h-full flex items-center justify-center">
          {isVideo ? (
            <video
              src={item.fileUrl}
              controls
              autoPlay
              className="max-w-full max-h-[85vh] rounded"
            />
          ) : (
            <img
              src={item.fileUrl}
              alt={item.caption || ''}
              className="max-w-full max-h-[85vh] object-contain rounded"
            />
          )}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-white hover:bg-white/20 z-10"
          aria-label="Suivant"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
      <div className="p-4 bg-black/50 text-white text-sm space-y-1">
        {item.caption && <p>{item.caption}</p>}
        <p className="text-white/70">
          {item.deviceDisplayName && <span>{item.deviceDisplayName}</span>}
          {item.takenAt && (
            <span>
              {item.deviceDisplayName ? ' · ' : ''}
              {new Date(item.takenAt).toLocaleDateString('fr-FR', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          )}
          {item.width && item.height && (
            <span>
              {' · '}
              {item.width}×{item.height}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
