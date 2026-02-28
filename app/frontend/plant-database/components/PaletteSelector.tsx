import { useState, useEffect, useMemo } from 'react'
import {
  BookOpen,
  Check,
  Clock,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { apiRequest } from '../../lib/api'

interface PaletteSummary {
  id: string
  name: string
  description: string
  createdBy: string
  createdAt: string
  updatedAt: string
  itemsCount: number
}

interface PaletteSelectorProps {
  activePaletteId?: string
  onSelectPalette: (paletteId: string) => void
  onNewPalette: () => void
}

const STRATE_COLORS = [
  '#234766', // trees
  '#3d7a4a', // shrubs
  '#7a8200', // climbers
  '#AFBD00', // herbaceous
  '#6b9a3d', // groundCover
  '#2563eb', // aquatic
]

function timeAgo(iso: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 1000
  )
  if (seconds < 60) return "à l'instant"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `il y a ${days}j`
  const months = Math.floor(days / 30)
  return `il y a ${months} mois`
}

export function PaletteSelector({
  activePaletteId,
  onSelectPalette,
  onNewPalette,
}: PaletteSelectorProps) {
  const [palettes, setPalettes] = useState<PaletteSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchPalettes = () => {
    setLoading(true)
    apiRequest('/api/v1/plants/palettes')
      .then((data) => setPalettes(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPalettes()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return palettes
    const q = search.toLowerCase()
    return palettes.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    )
  }, [palettes, search])

  const activePalette = palettes.find((p) => p.id === activePaletteId)

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      await apiRequest(`/api/v1/plants/palettes/${id}`, { method: 'DELETE' })
      setPalettes((prev) => prev.filter((p) => p.id !== id))
      setDeleteConfirmId(null)
    } catch {
      // silently fail
    } finally {
      setDeleting(false)
    }
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-stone-200 bg-white hover:border-[#AFBD00]/40 transition-all group text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-[#AFBD00]/10 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-[#7a8200]" />
        </div>
        <div className="flex-1 min-w-0">
          {activePalette ? (
            <>
              <p className="text-sm font-medium text-stone-900 truncate">
                {activePalette.name}
              </p>
              <p className="text-xs text-stone-400">
                {activePalette.itemsCount} plante{activePalette.itemsCount !== 1 ? 's' : ''}
                {' · '}
                {timeAgo(activePalette.updatedAt)}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-stone-500">
                Mes palettes
              </p>
              <p className="text-xs text-stone-400">
                {palettes.length} palette{palettes.length !== 1 ? 's' : ''} enregistrée{palettes.length !== 1 ? 's' : ''}
              </p>
            </>
          )}
        </div>
        <span className="text-xs font-medium text-stone-400 group-hover:text-[#7a8200] transition-colors">
          Changer
        </span>
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-[#7a8200]" />
          <h3 className="font-serif text-base text-stone-900">
            Mes palettes
          </h3>
          {!loading && (
            <span className="text-xs text-stone-400 tabular-nums">
              ({palettes.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onNewPalette}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7a8200] bg-[#AFBD00]/10 hover:bg-[#AFBD00]/20 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouvelle
          </button>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search — only show if more than 5 palettes */}
      {palettes.length > 5 && (
        <div className="px-4 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40 focus:border-[#AFBD00]/40 focus:bg-white transition-colors"
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="max-h-72 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-stone-400">
              {search ? 'Aucune palette trouvée.' : 'Aucune palette enregistrée.'}
            </p>
          </div>
        ) : (
          <ul className="py-1.5">
            {filtered.map((palette, idx) => {
              const isActive = palette.id === activePaletteId

              return (
                <li key={palette.id}>
                  {deleteConfirmId === palette.id ? (
                    /* Inline delete confirmation */
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50">
                      <p className="flex-1 text-xs text-red-700">
                        Supprimer « {palette.name} » ?
                      </p>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        disabled={deleting}
                        className="px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(palette.id)}
                        disabled={deleting}
                        className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors disabled:opacity-50"
                      >
                        {deleting ? 'Suppression…' : 'Supprimer'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPalette(palette.id)
                        setExpanded(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all group ${
                        isActive
                          ? 'bg-[#AFBD00]/[0.07]'
                          : 'hover:bg-stone-50'
                      }`}
                    >
                      {/* Strate fingerprint — visual identity for the palette */}
                      <div className="flex-shrink-0 flex flex-col gap-px" title={`${palette.itemsCount} plantes`}>
                        {STRATE_COLORS.map((color, i) => (
                          <div
                            key={i}
                            className="rounded-full transition-all"
                            style={{
                              width: 14,
                              height: 3,
                              backgroundColor: palette.itemsCount > 0 ? color : '#d6d3d1',
                              opacity: palette.itemsCount > 0 ? 0.25 + (((idx + i) % 3) * 0.25) : 0.2,
                            }}
                          />
                        ))}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm truncate ${
                            isActive ? 'font-semibold text-[#5a6800]' : 'font-medium text-stone-800'
                          }`}>
                            {palette.name}
                          </p>
                          {isActive && (
                            <Check className="w-3.5 h-3.5 text-[#7a8200] flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-stone-400 tabular-nums">
                            {palette.itemsCount} plante{palette.itemsCount !== 1 ? 's' : ''}
                          </span>
                          <span className="text-stone-300">·</span>
                          <span className="inline-flex items-center gap-1 text-xs text-stone-400">
                            <Clock className="w-3 h-3" />
                            {timeAgo(palette.updatedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Delete button — only show on hover, not for active palette */}
                      {!isActive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirmId(palette.id)
                          }}
                          className="flex-shrink-0 p-1.5 text-stone-300 opacity-0 group-hover:opacity-100 hover:text-red-500 rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
