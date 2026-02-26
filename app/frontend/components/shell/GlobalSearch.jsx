import React, { useState, useEffect, useRef, useCallback } from 'react'
import { router } from '@inertiajs/react'
import { apiRequest } from '@/lib/api'
import {
  Search, X, User, Contact, Calendar, Palette, GraduationCap,
  BookOpen, Leaf, Sprout, Folder, ArrowRight, Command, Loader2
} from 'lucide-react'

const ICON_MAP = {
  user: User,
  contact: Contact,
  calendar: Calendar,
  palette: Palette,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  leaf: Leaf,
  sprout: Sprout,
  folder: Folder,
}

const TYPE_LABELS = {
  member: 'Membres',
  contact: 'Contacts',
  event: 'Événements',
  design_project: 'Projets Design',
  training: 'Formations',
  knowledge: 'Connaissances',
  plant_genus: 'Genres',
  plant_species: 'Espèces',
  project: 'Projets',
}

const TYPE_COLORS = {
  member: '#5B5781',
  contact: '#5B5781',
  event: '#5B5781',
  design_project: '#AFBD00',
  training: '#B01A19',
  knowledge: '#234766',
  plant_genus: '#EF9B0D',
  plant_species: '#EF9B0D',
  project: '#5B5781',
}

export default function GlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const debounceRef = useRef(null)

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Debounced search
  const search = useCallback(async (q) => {
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await apiRequest(`/api/v1/search?q=${encodeURIComponent(q)}`)
      setResults(data.results || [])
      setActiveIndex(0)
    } catch (e) {
      console.error('Search failed:', e)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => search(query), 250)
    return () => clearTimeout(debounceRef.current)
  }, [query, search])

  // Navigate to result
  const navigateTo = useCallback((result) => {
    onClose()
    router.visit(result.url)
  }, [onClose])

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault()
      navigateTo(results[activeIndex])
    }
  }, [results, activeIndex, navigateTo, onClose])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.querySelector(`[data-index="${activeIndex}"]`)
    activeEl?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!open) return null

  // Group results by type
  const grouped = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = []
    acc[result.type].push(result)
    return acc
  }, {})

  // Flat index mapping for keyboard nav
  let flatIndex = 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 search-backdrop-enter"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
        <div
          className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200/80 overflow-hidden pointer-events-auto search-modal-enter"
          role="dialog"
          aria-label="Recherche globale"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100">
            <Search className="w-5 h-5 text-stone-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher membres, projets, plantes, formations..."
              className="flex-1 text-base text-stone-800 placeholder:text-stone-400 outline-none bg-transparent"
              autoComplete="off"
              spellCheck={false}
            />
            {loading && <Loader2 className="w-4 h-4 text-stone-400 animate-spin shrink-0" />}
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto overscroll-contain">
            {query.length < 2 && (
              <div className="px-4 py-10 text-center">
                <Search className="w-10 h-10 text-stone-200 mx-auto mb-3" />
                <p className="text-sm text-stone-400">
                  Tapez au moins 2 caractères pour rechercher
                </p>
              </div>
            )}

            {query.length >= 2 && !loading && results.length === 0 && (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-stone-500 font-medium">Aucun résultat</p>
                <p className="text-xs text-stone-400 mt-1">
                  Essayez avec d'autres mots-clés
                </p>
              </div>
            )}

            {Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <div className="px-4 pt-3 pb-1">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: TYPE_COLORS[type] || '#78716c' }}
                  >
                    {TYPE_LABELS[type] || type}
                  </span>
                </div>
                {items.map((result) => {
                  const currentIndex = flatIndex++
                  const IconComponent = ICON_MAP[result.icon] || Search
                  const isActive = currentIndex === activeIndex

                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      data-index={currentIndex}
                      onClick={() => navigateTo(result)}
                      onMouseEnter={() => setActiveIndex(currentIndex)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isActive
                          ? 'bg-stone-100'
                          : 'hover:bg-stone-50'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${TYPE_COLORS[result.type] || '#78716c'}15`,
                          color: TYPE_COLORS[result.type] || '#78716c'
                        }}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-stone-800 truncate">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-stone-500 truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      {isActive && (
                        <ArrowRight className="w-4 h-4 text-stone-400 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-stone-100 bg-stone-50/50 flex items-center gap-4 text-[11px] text-stone-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-200/80 text-stone-500 font-mono text-[10px]">↑↓</kbd>
              naviguer
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-200/80 text-stone-500 font-mono text-[10px]">↵</kbd>
              ouvrir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-200/80 text-stone-500 font-mono text-[10px]">esc</kbd>
              fermer
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
