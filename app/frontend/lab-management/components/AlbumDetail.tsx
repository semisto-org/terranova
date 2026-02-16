import { useState, useCallback, useEffect, useRef } from 'react'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import PhotoGallery from '@/components/shared/PhotoGallery'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'
import type { AlbumItem } from './AlbumList'

interface AlbumDetailProps {
  album: AlbumItem
  onBack: () => void
  onRefresh: () => void
}

export function AlbumDetail({ album, onBack, onRefresh }: AlbumDetailProps) {
  const [mediaItems, setMediaItems] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const deletingRef = useRef(false)

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiRequest<{ items: Record<string, unknown>[] }>(
        `/api/v1/lab/albums/${album.id}/media`
      )
      setMediaItems(res?.items ?? [])
    } catch {
      setMediaItems([])
    } finally {
      setLoading(false)
    }
  }, [album.id])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (!files?.length) return
      const form = new FormData()
      form.append('uploaded_by', 'team')
      files.forEach((f) => form.append('files', f))
      await apiRequest(`/api/v1/lab/albums/${album.id}/media`, {
        method: 'POST',
        body: form,
      })
      await fetchMedia()
      await onRefresh()
    },
    [album.id, fetchMedia, onRefresh]
  )

  const handleDelete = useCallback(
    async (mediaId: string) => {
      await apiRequest(`/api/v1/lab/albums/${album.id}/media/${mediaId}`, {
        method: 'DELETE',
      })
      await fetchMedia()
      await onRefresh()
    },
    [album.id, fetchMedia, onRefresh]
  )

  const entityLink =
    album.albumableType && album.albumableId
      ? getEntityPath(album.albumableType, album.albumableId)
      : null

  const handleDeleteAlbum = useCallback(async () => {
    if (deletingRef.current) return
    deletingRef.current = true
    setDeleting(true)
    try {
      await apiRequest(`/api/v1/lab/albums/${album.id}`, { method: 'DELETE' })
      setDeleteConfirm(false)
      await onRefresh()
      onBack()
    } finally {
      deletingRef.current = false
      setDeleting(false)
    }
  }, [album.id, onRefresh, onBack])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux albums
        </button>
      </div>

      <header className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-stone-900">{album.title}</h1>
            {album.description && (
              <p className="text-sm text-stone-600 mt-1">{album.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-stone-500">
              <span>{album.mediaCount} média{album.mediaCount !== 1 ? 's' : ''}</span>
              {entityLink && (
                <a
                  href={entityLink.href}
                  className="text-[var(--color-pole-lab)] hover:underline"
                >
                  {entityLink.label}
                </a>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer l'album
          </button>
        </div>
      </header>

      {deleteConfirm && (
        <ConfirmDeleteModal
          title="Supprimer cet album ?"
          message="Toutes les photos et vidéos de l'album seront supprimées. Cette action est irréversible."
          confirmLabel="Supprimer l'album"
          onConfirm={handleDeleteAlbum}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}

      {loading && mediaItems.length === 0 ? (
        <p className="text-stone-500 py-8">Chargement des médias…</p>
      ) : (
        <PhotoGallery
          items={mediaItems}
          onUpload={handleUpload}
          onDelete={handleDelete}
          readOnly={false}
        />
      )}
    </div>
  )
}

function getEntityPath(
  albumableType: string,
  albumableId: string
): { href: string; label: string } | null {
  switch (albumableType) {
    case 'Academy::Training':
      return { href: `/academy/${albumableId}`, label: 'Voir la formation' }
    case 'Design::Project':
      return { href: `/design/${albumableId}`, label: 'Voir le projet' }
    case 'Event':
      return { href: '/lab', label: 'Voir l’événement' }
    default:
      return null
  }
}
