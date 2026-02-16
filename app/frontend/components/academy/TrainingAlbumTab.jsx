import React, { useState, useCallback, useEffect } from 'react'
import { Camera, PlusCircle } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import PhotoGallery from '@/components/shared/PhotoGallery'

/**
 * Album tab for a training: create album if missing, then show gallery with upload/delete.
 */
export default function TrainingAlbumTab({ training, onRefresh }) {
  const album = training.album || null
  const albumId = album?.id
  const [mediaItems, setMediaItems] = useState([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [creating, setCreating] = useState(false)

  const fetchMedia = useCallback(async () => {
    if (!albumId) {
      setMediaItems([])
      return
    }
    setLoadingMedia(true)
    try {
      const res = await apiRequest(`/api/v1/lab/albums/${albumId}/media`)
      setMediaItems(res?.items ?? [])
    } catch (_) {
      setMediaItems([])
    } finally {
      setLoadingMedia(false)
    }
  }, [albumId])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  const handleCreateAlbum = async () => {
    setCreating(true)
    try {
      await apiRequest('/api/v1/lab/albums', {
        method: 'POST',
        body: JSON.stringify({
          title: training.title,
          albumable_type: 'Academy::Training',
          albumable_id: training.id,
        }),
      })
      await onRefresh()
    } finally {
      setCreating(false)
    }
  }

  const handleUpload = useCallback(
    async (files) => {
      if (!albumId || !files?.length) return
      const form = new FormData()
      form.append('uploaded_by', 'team')
      files.forEach((f) => form.append('files', f))
      await apiRequest(`/api/v1/lab/albums/${albumId}/media`, {
        method: 'POST',
        body: form,
      })
      await fetchMedia()
      await onRefresh()
    },
    [albumId, fetchMedia, onRefresh]
  )

  const handleDelete = useCallback(
    async (mediaId) => {
      if (!albumId) return
      await apiRequest(`/api/v1/lab/albums/${albumId}/media/${mediaId}`, { method: 'DELETE' })
      await fetchMedia()
      await onRefresh()
    },
    [albumId, fetchMedia, onRefresh]
  )

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-[#eac7b8]/30 mb-4">
          <Camera className="w-12 h-12 text-[#B01A19]" />
        </div>
        <h3 className="text-lg font-semibold text-stone-800 mb-2">Aucun album pour cette formation</h3>
        <p className="text-sm text-stone-600 mb-6 max-w-sm">
          Créez un album pour y ajouter des photos et vidéos (souvenirs de la formation, supports, etc.).
        </p>
        <button
          type="button"
          onClick={handleCreateAlbum}
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-lg bg-[#B01A19] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8f1515] disabled:opacity-50"
        >
          <PlusCircle className="w-4 h-4" />
          {creating ? 'Création…' : 'Créer l\'album'}
        </button>
      </div>
    )
  }

  if (loadingMedia && mediaItems.length === 0) {
    return (
      <div className="py-12 text-center text-stone-500">
        Chargement des médias…
      </div>
    )
  }

  return (
    <PhotoGallery
      items={mediaItems}
      onUpload={handleUpload}
      onDelete={handleDelete}
      readOnly={false}
    />
  )
}
