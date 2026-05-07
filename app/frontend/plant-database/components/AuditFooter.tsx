import { Sparkles } from 'lucide-react'

interface AuditFooterProps {
  auditedAt?: string | null
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffMs = Date.now() - then
  const diffSec = Math.max(0, Math.round(diffMs / 1000))
  const diffMin = Math.round(diffSec / 60)
  const diffHr = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHr / 24)
  const diffMonth = Math.round(diffDay / 30)
  const diffYear = Math.round(diffDay / 365)

  if (diffSec < 60) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`
  if (diffHr < 24) return `il y a ${diffHr} heure${diffHr > 1 ? 's' : ''}`
  if (diffDay < 30) return `il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`
  if (diffMonth < 12) return `il y a ${diffMonth} mois`
  return `il y a ${diffYear} an${diffYear > 1 ? 's' : ''}`
}

export function AuditFooter({ auditedAt }: AuditFooterProps) {
  if (!auditedAt) return null
  return (
    <div className="mt-8 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs text-stone-400">
      <Sparkles className="w-3.5 h-3.5" />
      <span>Dernière audit IA de cette fiche : {formatRelative(auditedAt)}</span>
    </div>
  )
}
