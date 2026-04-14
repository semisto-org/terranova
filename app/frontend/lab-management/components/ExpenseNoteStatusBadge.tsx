import { Circle, Clock, Send, CheckCircle2 } from 'lucide-react'

export type ExpenseNoteStatus = 'draft' | 'to_send' | 'sent' | 'paid'

export const EXPENSE_NOTE_STATUS_LABELS: Record<ExpenseNoteStatus, string> = {
  draft: 'En préparation',
  to_send: 'À envoyer',
  sent: 'Envoyée',
  paid: 'Payée',
}

const STYLES: Record<ExpenseNoteStatus, { bg: string; text: string; ring: string; Icon: typeof Circle }> = {
  draft:   { bg: 'bg-stone-100',   text: 'text-stone-700',   ring: 'ring-stone-200',   Icon: Circle },
  to_send: { bg: 'bg-amber-50',    text: 'text-amber-800',   ring: 'ring-amber-200',   Icon: Clock },
  sent:    { bg: 'bg-sky-50',      text: 'text-sky-800',     ring: 'ring-sky-200',     Icon: Send },
  paid:    { bg: 'bg-emerald-50',  text: 'text-emerald-800', ring: 'ring-emerald-200', Icon: CheckCircle2 },
}

export function ExpenseNoteStatusBadge({ status, size = 'sm' }: { status: ExpenseNoteStatus; size?: 'xs' | 'sm' }) {
  const style = STYLES[status]
  const { Icon } = style
  const padding = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
  const iconSize = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'
  return (
    <span className={`inline-flex items-center gap-1.5 ${padding} font-medium rounded-full ring-1 ring-inset ${style.bg} ${style.text} ${style.ring}`}>
      <Icon className={iconSize} strokeWidth={2.25} />
      {EXPENSE_NOTE_STATUS_LABELS[status]}
    </span>
  )
}
