import React from 'react'
import { ClipboardCheck, Check, CalendarClock } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import type { Member } from '../types'
import { groupPendingByMeeting, removePendingItem } from './pendingValidation'

// Vue « tâches en attente de validation » (#47, AC4) — transversale aux réunions.
// Le coordinateur retrouve ici tous les points d'action « proposés » (issus des
// comptes-rendus, cf. MeetingActionItems), regroupés par réunion source pour la
// traçabilité « vient de la réunion X » ; il assigne puis valide chaque point,
// ce qui crée la tâche assignée et le retire de la file d'attente.
interface PendingItem {
  id: string
  eventId: string
  eventTitle: string
  description: string
  status: 'proposed' | 'validated'
  assigneeId: string | null
  taskId: string | null
  position: number
}

export function PendingActionItems({ members }: { members: Member[] }) {
  const [items, setItems] = React.useState<PendingItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    apiRequest('/api/v1/event-action-items/pending')
      .then((r) => { if (active) setItems(r.items || []) })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : String(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const validate = async (item: PendingItem, assigneeId: string) => {
    setBusyId(item.id); setError(null)
    try {
      await apiRequest(`/api/v1/event-action-items/${item.id}/validate`, {
        method: 'PATCH',
        body: JSON.stringify({ assignee_id: assigneeId || null }),
      })
      // Validé → devenu une tâche : il quitte la file d'attente.
      setItems((prev) => removePendingItem(prev, item.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId(null)
    }
  }

  const groups = groupPendingByMeeting(items)

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4">
      <header className="flex items-center gap-2 mb-3">
        <ClipboardCheck className="w-4 h-4 text-[#5B5781]" />
        <h2 className="text-sm font-semibold text-stone-800">
          Tâches en attente de validation{items.length > 0 ? ` (${items.length})` : ''}
        </h2>
      </header>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {loading ? (
        <p className="text-sm text-stone-400">Chargement…</p>
      ) : groups.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-stone-400">
          <Check className="w-4 h-4 text-emerald-500" />
          Aucun point en attente de validation.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.eventId} className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
                <CalendarClock className="w-3.5 h-3.5" />
                {group.eventTitle}
              </p>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <PendingRow
                    key={item.id}
                    item={item as PendingItem}
                    members={members}
                    busy={busyId === item.id}
                    onValidate={validate}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function PendingRow({ item, members, busy, onValidate }: {
  item: PendingItem
  members: Member[]
  busy: boolean
  onValidate: (item: PendingItem, assigneeId: string) => void
}) {
  const [assigneeId, setAssigneeId] = React.useState(item.assigneeId || '')
  return (
    <li className="rounded-lg border border-stone-200 px-3 py-2 space-y-2">
      <div className="flex items-start gap-2.5">
        <span className="mt-1.5 w-2 h-2 rounded-full bg-amber-400 shrink-0" />
        <p className="text-sm text-stone-800 min-w-0 flex-1">{item.description}</p>
      </div>
      <div className="flex items-center gap-2 pl-4">
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="flex-1 rounded-lg border border-stone-200 px-2 py-1 text-xs"
        >
          <option value="">Assigner à…</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{`${m.firstName} ${m.lastName}`.trim()}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onValidate(item, assigneeId)}
          disabled={busy || !assigneeId}
          className="px-2.5 py-1 rounded-lg bg-[#AFBD00] text-stone-900 text-xs font-medium disabled:opacity-50 hover:bg-[#9BAA00] transition-colors whitespace-nowrap"
        >
          Valider → tâche
        </button>
      </div>
    </li>
  )
}
