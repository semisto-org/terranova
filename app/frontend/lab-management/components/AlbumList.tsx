import { useState, useCallback, useEffect } from 'react'
import { Plus, Camera, Image as ImageIcon } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { AlbumDetail } from './AlbumDetail'

export interface AlbumItem {
  id: string
  title: string
  description: string
  status: string
  albumableType: string | null
  albumableId: string | null
  mediaCount: number
  coverUrl: string | null
  createdAt: string
  updatedAt: string
}

const ALBUMABLE_TYPE_LABELS: Record<string, string> = {
  'Academy::Training': 'Formation',
  'Design::Project': 'Projet Design',
  Event: 'Événement',
}

type FilterType = 'all' | 'Academy::Training' | 'Design::Project' | 'Event' | 'standalone'

export interface AlbumListProps {
  /** When provided, albums are taken from parent (e.g. Lab overview); no fetch. */
  albums?: AlbumItem[]
  /** Called after create/update so parent can refetch (e.g. loadOverview). */
  onRefresh?: () => void | Promise<void>
}

export function AlbumList({ albums: albumsFromProps, onRefresh }: AlbumListProps = {}) {
  const [fetchedItems, setFetchedItems] = useState<AlbumItem[]>([])
  const [loading, setLoading] = useState(!albumsFromProps)
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumItem | null>(null)
  const [createModal, setCreateModal] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const items = albumsFromProps !== undefined ? albumsFromProps : fetchedItems

  const loadAlbums = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiRequest<{ items: AlbumItem[] }>('/api/v1/lab/albums')
      setFetchedItems(res?.items ?? [])
    } catch {
      setFetchedItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    if (onRefresh) {
      return Promise.resolve(onRefresh())
    }
    return loadAlbums()
  }, [onRefresh, loadAlbums])

  useEffect(() => {
    if (albumsFromProps === undefined) loadAlbums()
  }, [albumsFromProps, loadAlbums])

  const filtered = items.filter((a) => {
    if (filter === 'all') return true
    if (filter === 'standalone') return !a.albumableType && !a.albumableId
    return a.albumableType === filter
  })

  const handleCreateAlbum = async () => {
    if (!createTitle.trim()) return
    setCreating(true)
    try {
      await apiRequest('/api/v1/lab/albums', {
        method: 'POST',
        body: JSON.stringify({
          title: createTitle.trim(),
          description: createDescription.trim(),
        }),
      })
      setCreateModal(false)
      setCreateTitle('')
      setCreateDescription('')
      await refresh()
    } finally {
      setCreating(false)
    }
  }

  const albumableLabel = (a: AlbumItem) => {
    if (!a.albumableType) return 'Album seul'
    return ALBUMABLE_TYPE_LABELS[a.albumableType] ?? a.albumableType
  }

  if (selectedAlbum) {
    return (
      <AlbumDetail
        album={selectedAlbum}
        onBack={() => setSelectedAlbum(null)}
        onRefresh={refresh}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white text-stone-800"
          >
            <option value="all">Tous les albums</option>
            <option value="standalone">Albums seuls</option>
            <option value="Academy::Training">Formations</option>
            <option value="Design::Project">Projets Design</option>
            <option value="Event">Événements</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => setCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-pole-lab)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Nouvel album
        </button>
      </div>

      {loading && albumsFromProps === undefined ? (
        <p className="text-stone-500 py-8">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="text-stone-500 py-8">Aucun album.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((album) => (
            <button
              key={album.id}
              type="button"
              onClick={() => setSelectedAlbum(album)}
              className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden text-left hover:shadow-md hover:border-stone-300 transition-all"
            >
              <div className="aspect-square bg-stone-100 relative">
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-stone-400">
                    <Camera className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute bottom-1 left-1 right-1 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-white text-xs">
                  <ImageIcon className="w-3 h-3 shrink-0" />
                  <span>{album.mediaCount}</span>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-stone-900 truncate">{album.title}</h3>
                <p className="text-xs text-stone-500 mt-0.5">{albumableLabel(album)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {createModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setCreateModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-stone-900 mb-4">Nouvel album</h2>
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Titre</span>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                  placeholder="Ex. Retraite 2025"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Description (optionnel)</span>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCreateAlbum}
                disabled={creating || !createTitle.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-pole-lab)] rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {creating ? 'Création…' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
