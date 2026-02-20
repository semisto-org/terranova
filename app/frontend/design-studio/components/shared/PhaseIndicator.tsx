import type { ReactNode } from 'react'

export type ProjectPhase =
  | 'offre'
  | 'pre-projet'
  | 'projet-detaille'
  | 'mise-en-oeuvre'
  | 'co-gestion'

const phaseColors: Record<
  ProjectPhase,
  { dot: string; bg: string; text: string }
> = {
  offre: {
    dot: 'bg-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
  },
  'pre-projet': {
    dot: 'bg-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-400',
  },
  'projet-detaille': {
    dot: 'bg-[#AFBD00]',
    bg: 'bg-[#e1e6d8] dark:bg-[#AFBD00]/20',
    text: 'text-[#6B7A00] dark:text-[#AFBD00]',
  },
  'mise-en-oeuvre': {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  'co-gestion': {
    dot: 'bg-[#5B5781]',
    bg: 'bg-[#c8bfd2] dark:bg-[#5B5781]/20',
    text: 'text-[#5B5781] dark:text-[#9B94BB]',
  },
}

const phaseLabels: Record<ProjectPhase, string> = {
  offre: 'Offre',
  'pre-projet': 'Pré-projet',
  'projet-detaille': 'Projet détaillé',
  'mise-en-oeuvre': 'Mise en œuvre',
  'co-gestion': 'Co-gestion',
}

interface PhaseIndicatorProps {
  phase: ProjectPhase
  small?: boolean
  showLabel?: boolean
  className?: string
}

export function PhaseIndicator({
  phase,
  small = false,
  showLabel = false,
  className = '',
}: PhaseIndicatorProps) {
  const colors = phaseColors[phase]

  if (showLabel) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${colors.bg} ${colors.text} ${className}`}
      >
        <span
          className={`rounded-full ${colors.dot} ${small ? 'w-2 h-2' : 'w-2.5 h-2.5'}`}
        />
        {phaseLabels[phase]}
      </span>
    )
  }

  return (
    <span
      className={`inline-block rounded-full ${colors.dot} ${small ? 'w-2 h-2' : 'w-2.5 h-2.5'} ${className}`}
      title={phaseLabels[phase]}
    />
  )
}

export { phaseLabels, phaseColors }
