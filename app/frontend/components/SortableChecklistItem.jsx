import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function SortableChecklistItem({ id, index, value, onUpdate, onRemove, isDragging }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-3 rounded-lg border bg-white p-3 transition-all ${
        isSortableDragging
          ? 'border-[#B01A19] shadow-lg shadow-[#B01A19]/20 scale-[1.02] z-50'
          : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'
      }`}
    >
      {/* Drag Handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex h-8 w-8 shrink-0 cursor-grab active:cursor-grabbing items-center justify-center rounded-lg border border-stone-300 bg-stone-50 text-stone-500 transition-all hover:border-stone-400 hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/20"
        aria-label={`Réorganiser l'étape ${index + 1}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </button>

      {/* Index Badge */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-gradient-to-br from-stone-50 to-stone-100 font-semibold text-stone-700 shadow-sm">
        {index + 1}
      </div>

      {/* Input */}
      <input
        type="text"
        className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 transition-all focus:border-[#B01A19] focus:outline-none focus:ring-2 focus:ring-[#B01A19]/10"
        value={value}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder={`Étape ${index + 1}`}
      />

      {/* Delete Button */}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-lg p-2 text-stone-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500/20"
        title="Supprimer"
        aria-label={`Supprimer l'étape ${index + 1}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  )
}
