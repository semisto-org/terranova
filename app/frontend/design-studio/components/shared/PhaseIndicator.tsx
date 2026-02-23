import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

export type ProjectPhase =
  | 'offre'
  | 'pre-projet'
  | 'projet-detaille'
  | 'mise-en-oeuvre'
  | 'co-gestion'
  | 'termine'

const phaseColors: Record<
  ProjectPhase,
  { dot: string; bg: string; text: string }
> = {
  offre: {
    dot: 'bg-amber-400',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
  'pre-projet': {
    dot: 'bg-orange-400',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
  },
  'projet-detaille': {
    dot: 'bg-[#AFBD00]',
    bg: 'bg-[#e1e6d8]',
    text: 'text-[#6B7A00]',
  },
  'mise-en-oeuvre': {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  'co-gestion': {
    dot: 'bg-[#5B5781]',
    bg: 'bg-[#c8bfd2]',
    text: 'text-[#5B5781]',
  },
  termine: {
    dot: 'bg-stone-400',
    bg: 'bg-stone-100',
    text: 'text-stone-600',
  },
}

const phaseLabels: Record<ProjectPhase, string> = {
  offre: 'Offre',
  'pre-projet': 'Pré-projet',
  'projet-detaille': 'Projet détaillé',
  'mise-en-oeuvre': 'Mise en œuvre',
  'co-gestion': 'Co-gestion',
  termine: 'Autonome',
}

const phaseOrder: ProjectPhase[] = [
  'offre',
  'pre-projet',
  'projet-detaille',
  'mise-en-oeuvre',
  'co-gestion',
  'termine',
]

interface PhaseIndicatorProps {
  phase: ProjectPhase
  small?: boolean
  showLabel?: boolean
  className?: string
  onPhaseChange?: (phase: ProjectPhase) => void
}

export function PhaseIndicator({
  phase,
  small = false,
  showLabel = false,
  className = '',
  onPhaseChange,
}: PhaseIndicatorProps) {
  const colors = phaseColors[phase]
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
    if (!open || !onPhaseChange) return
    updatePosition()
    const handleScroll = () => updatePosition()
    const handleResize = () => updatePosition()
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [open, onPhaseChange])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest('[data-phase-dropdown]')
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const isEditable = Boolean(onPhaseChange && showLabel)

  const handleSelect = (newPhase: ProjectPhase) => {
    if (newPhase !== phase) {
      onPhaseChange?.(newPhase)
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
        {phaseLabels[phase]}
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
                data-phase-dropdown
                className="fixed z-[99999] min-w-[160px] rounded-xl border border-stone-200 bg-white shadow-xl py-1.5 animate-in fade-in-0 zoom-in-95 duration-150"
                style={{ top: menuPosition.top, left: menuPosition.left }}
              >
                {phaseOrder.map((p) => {
                  const c = phaseColors[p]
                  const isSelected = p === phase
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleSelect(p)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? `${c.bg} ${c.text} font-medium`
                          : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span className={`rounded-full ${c.dot} w-2 h-2 shrink-0`} />
                      {phaseLabels[p]}
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
      title={phaseLabels[phase]}
    />
  )
}

export { phaseLabels, phaseColors }
