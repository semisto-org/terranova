import React from 'react'
import { ClipboardList, Check } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import type { Member } from '../types'

// Compte-rendu → tâches (#47) : on saisit/colle des points d'action (un par
// ligne) à l'état « proposé » ; le coordinateur valide → chaque point devient
// une tâche assignée rattachée à la réunion et au projet (substrat #47).
interface ActionItem {
  id: string
  description: string
  status: 'proposed' | 'validated'
  assigneeId: string | null
  taskId: string | null
}

export function MeetingActionItems({ eventId, members }: { eventId: string; members: Member[] }) {
  const [items, setItems] = React.useState<ActionItem[]>([])
  const [draft, setDraft] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    apiRequest(`/api/v1/events/${eventId}/action-items`)
      .then((r) => { if (active) setItems(r.items || []) })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : String(e)) })
    return () => { active = false }
  }, [eventId])

  const addItems = async () => {
    const lines = draft.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    setBusy(true); setError(null)
    try {
      const r = await apiRequest(`/api/v1/events/${eventId}/action-items`, {
        method: 'POST',
        body: JSON.stringify({ items: lines.map((description) => ({ description })) }),
      })
      setItems((prev) => [...prev, ...(r.items || [])])
      setDraft('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const validate = async (item: ActionItem, assigneeId: string) => {
    setBusy(true); setError(null)
    try {
      const r = await apiRequest(`/api/v1/event-action-items/${item.id}/validate`, {
        method: 'PATCH',
        body: JSON.stringify({ assignee_id: assigneeId || null }),
      })
      setItems((prev) => prev.map((i) => (i.id === item.id ? r.item : i)))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const proposed = items.filter((i) => i.status === 'proposed')
  const validated = items.filter((i) => i.status === 'validated')

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
        <ClipboardList className="w-3.5 h-3.5" />
        Compte-rendu → tâches{items.length > 0 ? ` (${items.length})` : ''}
      </span>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="space-y-1.5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Colle les points d'action du compte-rendu, un par ligne…"
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]"
        />
        <button
          type="button"
          onClick={addItems}
          disabled={busy || !draft.trim()}
          className="px-3 py-1.5 rounded-lg bg-[#5B5781] text-white text-xs font-medium disabled:opacity-50 hover:bg-[#4a4670] transition-colors"
        >
          Ajouter les points
        </button>
      </div>

      {proposed.length > 0 && (
        <ul className="space-y-1.5 pt-1">
          {proposed.map((item) => (
            <ProposedRow key={item.id} item={item} members={members} busy={busy} onValidate={validate} />
          ))}
        </ul>
      )}

      {validated.length > 0 && (
        <ul className="space-y-1.5 pt-1">
          {validated.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2">
              <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-stone-700">{item.description}</p>
                <p className="text-xs text-emerald-700">Validé · tâche créée</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ProposedRow({ item, members, busy, onValidate }: {
  item: ActionItem
  members: Member[]
  busy: boolean
  onValidate: (item: ActionItem, assigneeId: string) => void
}) {
  const [assigneeId, setAssigneeId] = React.useState('')
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
