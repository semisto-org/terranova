import React, { useState, useRef, useEffect } from 'react'
import { SmilePlus } from 'lucide-react'

export const EMOJI_DEFS = [
  { key: 'thumbs_up', char: '👍', label: 'Soutien' },
  { key: 'bulb',      char: '💡', label: 'Bonne idée' },
  { key: 'question',  char: '❓', label: 'Question' },
  { key: 'heart',     char: '❤️', label: 'Coup de cœur' },
]

function formatNames(names) {
  if (!names || names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} et ${names[1]}`
  const rest = names.length - 2
  return `${names[0]}, ${names[1]} et ${rest} autre${rest > 1 ? 's' : ''}`
}

export default function EmojiReactions({ reactions = [], onToggle, compact = false }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const popoverRef = useRef(null)

  useEffect(() => {
    if (!pickerOpen) return
    const onDown = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [pickerOpen])

  const reactionsByEmoji = new Map(reactions.map(r => [r.emoji, r]))
  const active = reactions.filter(r => r.count > 0)

  const handleToggle = (emoji) => {
    onToggle?.(emoji)
    setPickerOpen(false)
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${compact ? 'mt-1.5' : 'mt-2'}`}>
      {active.map((r) => {
        const def = EMOJI_DEFS.find(d => d.key === r.emoji)
        if (!def) return null
        const tooltip = formatNames(r.memberNames)
        return (
          <button
            key={r.emoji}
            type="button"
            onClick={() => handleToggle(r.emoji)}
            title={tooltip}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
              r.reactedByMe
                ? 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="text-sm leading-none">{def.char}</span>
            <span className="font-medium tabular-nums">{r.count}</span>
          </button>
        )
      })}

      <div ref={popoverRef} className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen(o => !o)}
          title="Ajouter une réaction"
          className={`inline-flex items-center justify-center rounded-full border border-dashed border-stone-300 bg-white p-1 text-stone-400 transition-colors hover:border-stone-400 hover:text-stone-600 ${
            active.length === 0 ? '' : ''
          }`}
        >
          <SmilePlus className="h-3.5 w-3.5" />
        </button>
        {pickerOpen && (
          <div
            role="menu"
            className="absolute left-0 top-full z-20 mt-1 flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-1 shadow-lg"
          >
            {EMOJI_DEFS.map((def) => {
              const mine = reactionsByEmoji.get(def.key)?.reactedByMe
              return (
                <button
                  key={def.key}
                  type="button"
                  onClick={() => handleToggle(def.key)}
                  title={def.label}
                  className={`flex h-7 w-7 items-center justify-center rounded text-base transition-colors hover:bg-stone-100 ${
                    mine ? 'bg-blue-50 ring-1 ring-blue-200' : ''
                  }`}
                >
                  {def.char}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
