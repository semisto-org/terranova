import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
  onSearch?: (query: string) => void
}

export function SearchDialog({ isOpen, onClose, onSearch }: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch?.(query.trim())
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.2) inset',
        }}
      >
        {/* Search Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-3 px-5 py-4">
          <Search className="w-5 h-5 text-stone-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher..."
            className="flex-1 bg-transparent text-lg text-stone-900 placeholder:text-stone-400 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-stone-400 bg-stone-100 rounded-md">
            esc
          </kbd>
        </form>

        {/* Results area (placeholder for future implementation) */}
        {query && (
          <div className="border-t border-stone-200/50 px-5 py-4">
            <p className="text-sm text-stone-500">
              Recherche de "{query}"...
            </p>
          </div>
        )}

        {/* Quick actions when empty */}
        {!query && (
          <div className="border-t border-stone-200/50 px-5 py-3">
            <p className="text-xs text-stone-400 mb-2">Raccourcis</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setQuery('projets ')}
                className="px-3 py-1.5 text-sm text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              >
                Projets
              </button>
              <button
                type="button"
                onClick={() => setQuery('clients ')}
                className="px-3 py-1.5 text-sm text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              >
                Clients
              </button>
              <button
                type="button"
                onClick={() => setQuery('formations ')}
                className="px-3 py-1.5 text-sm text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              >
                Formations
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
