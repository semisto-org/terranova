import React, { useState, useEffect, useCallback } from 'react'
import { MessageCircle } from 'lucide-react'

const MIN_SELECTION_LENGTH = 3

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildQuotedHtml(text) {
  const paragraphs = text
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('')

  const body = paragraphs || `<p>${escapeHtml(text)}</p>`
  return `<blockquote>${body}</blockquote><p></p>`
}

/**
 * Detects text selection inside `containerRef` and exposes a floating popover
 * anchored above the selection that calls onQuote(text) when clicked.
 */
export default function SelectionToBlockquote({ containerRef, onQuote }) {
  const [popover, setPopover] = useState(null) // { top, left, text }

  const hide = useCallback(() => setPopover(null), [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseUp = () => {
      // Small delay lets the browser finalize the selection
      setTimeout(() => {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
          hide()
          return
        }

        const range = selection.getRangeAt(0)
        const text = selection.toString().trim()
        if (text.length < MIN_SELECTION_LENGTH) {
          hide()
          return
        }

        // Ensure the selection is inside our container
        if (!container.contains(range.commonAncestorContainer)) {
          hide()
          return
        }

        const rect = range.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) {
          hide()
          return
        }

        setPopover({
          top: rect.top + window.scrollY - 42,
          left: rect.left + window.scrollX + rect.width / 2,
          text,
        })
      }, 10)
    }

    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) hide()
    }

    const handleScroll = () => hide()

    container.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('selectionchange', handleSelectionChange)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      container.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('selectionchange', handleSelectionChange)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [containerRef, hide])

  if (!popover) return null

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onQuote?.(popover.text)
    hide()
    // Clear browser selection so the popover doesn't linger
    window.getSelection()?.removeAllRanges()
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: popover.top,
        left: popover.left,
        transform: 'translateX(-50%)',
        zIndex: 40,
      }}
      className="pointer-events-auto"
    >
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg ring-1 ring-stone-900/20 hover:bg-stone-800 transition-colors"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        Commenter ce passage
      </button>
    </div>
  )
}
