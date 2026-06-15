import React, { useState, useEffect, useRef } from 'react'
import { Bell, Loader2, X, ChevronDown } from 'lucide-react'
import { myApiRequest } from '../lib/api'
import { myApiPath } from '../lib/paths'

const COLOR_ACADEMY = '#B01A19'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// A bell in the shell header that lists Academy announcements. The unread-style
// badge is simply the number of items (the API decides what's relevant).
export default function AnnouncementsBell() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    myApiRequest(myApiPath('/announcements'))
      .then((data) => setItems(data.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Close the panel when clicking outside it.
  useEffect(() => {
    if (!open) return
    function onClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const count = items.length

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors cursor-pointer"
        aria-label={count > 0 ? `Actualités (${count})` : 'Actualités'}
        aria-expanded={open}
      >
        <Bell size={18} />
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
            style={{ backgroundColor: COLOR_ACADEMY }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-y-auto rounded-2xl bg-white border border-stone-200 shadow-lg z-50"
          role="dialog"
          aria-label="Actualités"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 sticky top-0 bg-white">
            <span className="text-sm font-semibold text-stone-800" style={{ fontFamily: 'var(--font-heading)' }}>
              Actualités
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-stone-400" />
            </div>
          )}

          {error && (
            <div className="px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {!loading && !error && count === 0 && (
            <div className="px-4 py-10 text-center">
              <div
                className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3"
                style={{ backgroundColor: '#B01A190D' }}
              >
                <Bell size={20} style={{ color: COLOR_ACADEMY }} />
              </div>
              <p className="text-sm text-stone-500">Aucune actu</p>
            </div>
          )}

          {!loading && !error && count > 0 && (
            <div className="divide-y divide-stone-100">
              {items.map((item) => (
                <AnnouncementRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AnnouncementRow({ item }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="px-4 py-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: COLOR_ACADEMY }}>
              {item.trainingTitle}
            </p>
            {item.title && (
              <p className="text-sm font-semibold text-stone-800 mt-0.5">{item.title}</p>
            )}
          </div>
          <ChevronDown
            size={15}
            className="text-stone-400 flex-shrink-0 mt-0.5 transition-transform"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          />
        </div>

        {item.toConfirm && (
          <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full mt-1.5 bg-amber-100 text-amber-800 border border-amber-200">
            À confirmer
          </span>
        )}

        {item.body && (
          <p className={`text-sm text-stone-500 mt-1.5 whitespace-pre-line ${expanded ? '' : 'line-clamp-2'}`}>
            {item.body}
          </p>
        )}

        <p className="text-[11px] text-stone-400 mt-1.5">{formatDate(item.publishedAt)}</p>
      </button>
    </div>
  )
}
