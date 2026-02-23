import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

export type ProjectStatus = 'active' | 'pending' | 'completed' | 'archived'

const statusColors: Record<
  ProjectStatus,
  { dot: string; bg: string; text: string }
> = {
  active: {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  pending: {
    dot: 'bg-amber-400',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
  completed: {
    dot: 'bg-stone-400',
    bg: 'bg-stone-100',
    text: 'text-stone-600',
  },
  archived: {
    dot: 'bg-stone-300',
    bg: 'bg-stone-50',
    text: 'text-stone-500',
  },
}

const statusLabels: Record<ProjectStatus, string> = {
  active: 'En cours',
  pending: 'En attente',
  completed: 'Terminé',
  archived: 'Archivé',
}

const statusOrder: ProjectStatus[] = ['active', 'pending', 'completed', 'archived']

interface StatusIndicatorProps {
  status: ProjectStatus
  small?: boolean
  showLabel?: boolean
  className?: string
  onStatusChange?: (status: ProjectStatus) => void
}

export function StatusIndicator({
  status,
  small = false,
  showLabel = false,
  className = '',
  onStatusChange,
}: StatusIndicatorProps) {
  const colors = statusColors[status]
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({ top: rect.bottom + 4, left: rect.left })
    }
  }

  useEffect(() => {
    if (!open || !onStatusChange) return
    updatePosition()
    const handleScroll = () => updatePosition()
    const handleResize = () => updatePosition()
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [open, onStatusChange])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest('[data-status-dropdown]')
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const isEditable = Boolean(onStatusChange && showLabel)

  const handleSelect = (newStatus: ProjectStatus) => {
    if (newStatus !== status) {
      onStatusChange?.(newStatus)
    }
    setOpen(false)
  }

  if (showLabel) {
    const badge = (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${colors.bg} ${colors.text} ${className} ${
          isEditable ? 'cursor-pointer hover:ring-2 hover:ring-[#AFBD00]/40 hover:ring-offset-1' : ''
        }`}
      >
        <span className={`rounded-full ${colors.dot} ${small ? 'w-2 h-2' : 'w-2.5 h-2.5'}`} />
        {statusLabels[status]}
        {isEditable && <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />}
      </span>
    )

    if (isEditable) {
      return (
        <div className="relative inline-block">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#AFBD00] focus:ring-offset-1"
          >
            {badge}
          </button>
          {open &&
            createPortal(
              <div
                data-status-dropdown
                className="fixed z-[99999] min-w-[140px] rounded-xl border border-stone-200 bg-white shadow-xl py-1.5 animate-in fade-in-0 zoom-in-95 duration-150"
                style={{ top: menuPosition.top, left: menuPosition.left }}
              >
                {statusOrder.map((s) => {
                  const c = statusColors[s]
                  const isSelected = s === status
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSelect(s)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? `${c.bg} ${c.text} font-medium`
                          : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span className={`rounded-full ${c.dot} w-2 h-2 shrink-0`} />
                      {statusLabels[s]}
                    </button>
                  )
                })}
              </div>,
              document.body
            )}
        </div>
      )
    }

    return badge
  }

  return (
    <span
      className={`inline-block rounded-full ${colors.dot} ${small ? 'w-2 h-2' : 'w-2.5 h-2.5'} ${className}`}
      title={statusLabels[status]}
    />
  )
}

export { statusLabels, statusColors }
