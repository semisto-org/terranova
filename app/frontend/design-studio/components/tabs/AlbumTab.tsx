import { useState } from 'react'
import { Image as ImageIcon, Plus, ExternalLink, Trash2 } from 'lucide-react'
import type { MediaItem } from '../../types'
import { EmptyState } from '../shared/EmptyState'

interface AlbumTabProps {
  mediaItems: MediaItem[]
  onAddMedia: (values: {
    media_type: 'image' | 'video'
    url: string
    thumbnail_url?: string
    caption?: string
    uploaded_by?: string
  }) => void
  onDeleteMedia: (id: string) => void
}

export function AlbumTab({
  mediaItems,
  onAddMedia,
  onDeleteMedia,
}: AlbumTabProps) {
  const [form, setForm] = useState({
    media_type: 'image' as 'image' | 'video',
    url: '',
    thumbnail_url: '',
    caption: '',
    uploaded_by: 'team',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddMedia(form)
    setForm((p) => ({ ...p, url: '', thumbnail_url: '', caption: '' }))
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#AFBD00]" />
          Ajouter un média
        </h3>
        <form
          onSubmit={handleSubmit}
          className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3"
        >
          <select
            value={form.media_type}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                media_type: e.target.value as 'image' | 'video',
              }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          >
            <option value="image">Image</option>
            <option value="video">Vidéo</option>
          </select>
          <input
            type="url"
            placeholder="URL média"
            value={form.url}
            onChange={(e) =>
              setForm((p) => ({ ...p, url: e.target.value }))
            }
            className="sm:col-span-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            required
          />
          <input
            type="url"
            placeholder="URL miniature"
            value={form.thumbnail_url}
            onChange={(e) =>
              setForm((p) => ({ ...p, thumbnail_url: e.target.value }))
            }
            className="sm:col-span-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Légende"
            value={form.caption}
            onChange={(e) =>
              setForm((p) => ({ ...p, caption: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent lg:col-span-1"
          />
          <div className="sm:col-span-2 lg:col-span-6">
            <button
              type="submit"
              className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
            >
              Ajouter média
            </button>
          </div>
        </form>
      </div>

      {mediaItems.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="w-10 h-10 text-stone-400" />}
          title="Album vide"
          description="Ajoutez des photos ou vidéos du projet."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 overflow-hidden group"
            >
              <div className="aspect-video bg-stone-100 dark:bg-stone-800 relative">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.caption || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-stone-400" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-white/90 text-stone-900 hover:bg-white"
                    title="Ouvrir"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => onDeleteMedia(item.id)}
                    className="p-2 rounded-lg bg-white/90 text-stone-900 hover:bg-red-50 hover:text-red-600"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="p-2 text-xs text-stone-600 dark:text-stone-400 truncate">
                {item.caption || 'Sans légende'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
