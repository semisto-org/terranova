interface Props {
  hasIllustration: boolean
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Tiny status dot rendered next to a species name to signal whether it
 * already has a silhouette illustration attached.
 *
 * - filled olive disc → illustrated
 * - dashed empty ring → still missing
 *
 * Tooltip via the native `title` attribute. Keeps the markup ultra-light so it
 * can be inlined inside table rows without disrupting baseline alignment.
 */
export function IllustrationStatusBadge({ hasIllustration, size = 'sm', className = '' }: Props) {
  const dim = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
  const cls = hasIllustration
    ? 'bg-[#AFBD00] border-[#AFBD00]'
    : 'bg-transparent border-stone-300 border-dashed'
  const label = hasIllustration ? 'Illustrée' : 'Sans illustration'

  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-block shrink-0 rounded-full border-2 align-middle ${dim} ${cls} ${className}`}
    />
  )
}
