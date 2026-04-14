import { useMemo, useState } from 'react'
import { FileText, Plus, Search, Trash2 } from 'lucide-react'
import { ExpenseNoteStatusBadge, EXPENSE_NOTE_STATUS_LABELS, type ExpenseNoteStatus } from './ExpenseNoteStatusBadge'

export interface ExpenseNoteSummary {
  id: string
  number: string
  subject: string
  noteDate: string
  status: ExpenseNoteStatus
  contactId: string
  contactName: string
  organizationId: string
  organizationName: string
  totalAmount: number
  createdAt: string
}

export interface ExpenseNoteListProps {
  notes: ExpenseNoteSummary[]
  loading?: boolean
  onCreate: () => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

const fmtMoney = (value: number) =>
  `${Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

const STATUS_ORDER: ExpenseNoteStatus[] = ['draft', 'to_send', 'sent', 'paid']

export function ExpenseNoteList({ notes, loading = false, onCreate, onOpen, onDelete }: ExpenseNoteListProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ExpenseNoteStatus>('all')

  const filtered = useMemo(() => {
    return notes.filter((note) => {
      if (statusFilter !== 'all' && note.status !== statusFilter) return false
      if (query) {
        const q = query.toLowerCase()
        return (
          note.number.toLowerCase().includes(q) ||
          note.subject.toLowerCase().includes(q) ||
          note.contactName.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [notes, query, statusFilter])

  const totals = useMemo(() => {
    const map: Record<ExpenseNoteStatus | 'all', { count: number; sum: number }> = {
      all: { count: notes.length, sum: 0 },
      draft: { count: 0, sum: 0 },
      to_send: { count: 0, sum: 0 },
      sent: { count: 0, sum: 0 },
      paid: { count: 0, sum: 0 },
    }
    for (const note of notes) {
      map.all.sum += note.totalAmount
      map[note.status].count += 1
      map[note.status].sum += note.totalAmount
    }
    return map
  }, [notes])

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#5B5781] font-semibold">Administration</p>
            <h1 className="mt-1 text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight">Notes de frais</h1>
            <p className="mt-2 text-stone-600">Documents émis aux contacts pour remboursement.</p>
          </div>
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B5781] text-white font-medium shadow-lg shadow-[#5B5781]/20 hover:bg-[#4a4669] hover:shadow-xl hover:shadow-[#5B5781]/30 active:scale-[0.98] transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Nouvelle note
          </button>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`text-left p-4 rounded-2xl bg-white border transition-all ${
              statusFilter === 'all' ? 'border-[#5B5781] shadow-md shadow-[#5B5781]/10' : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Toutes</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900 tabular-nums">{totals.all.count}</span>
            </div>
            <div className="text-xs text-stone-500 mt-0.5 tabular-nums">{fmtMoney(totals.all.sum)}</div>
          </button>
          {STATUS_ORDER.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-left p-4 rounded-2xl bg-white border transition-all ${
                statusFilter === s ? 'border-[#5B5781] shadow-md shadow-[#5B5781]/10' : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">{EXPENSE_NOTE_STATUS_LABELS[s]}</div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-stone-900 tabular-nums">{totals[s].count}</span>
              </div>
              <div className="text-xs text-stone-500 mt-0.5 tabular-nums">{fmtMoney(totals[s].sum)}</div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6 p-3 rounded-2xl bg-white border border-stone-200 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par numéro, sujet ou contact…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-[#5B5781] focus:ring-2 focus:ring-[#5B5781]/15 transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="rounded-2xl bg-white border border-stone-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center text-stone-500">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <FileText className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="mt-3 text-stone-600 font-medium">Aucune note de frais</p>
              <p className="text-sm text-stone-400 mt-1">
                {notes.length === 0 ? 'Créez votre première note pour commencer.' : 'Aucun résultat pour ces filtres.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-stone-500 border-b border-stone-200">
                  <th className="text-left font-semibold px-5 py-3">Numéro</th>
                  <th className="text-left font-semibold px-5 py-3">Date</th>
                  <th className="text-left font-semibold px-5 py-3">Sujet</th>
                  <th className="text-left font-semibold px-5 py-3">Contact</th>
                  <th className="text-left font-semibold px-5 py-3">Émetteur</th>
                  <th className="text-left font-semibold px-5 py-3">Statut</th>
                  <th className="text-right font-semibold px-5 py-3">Total</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((note) => (
                  <tr
                    key={note.id}
                    className="border-b border-stone-100 last:border-0 hover:bg-stone-50/60 cursor-pointer transition-colors group"
                    onClick={() => onOpen(note.id)}
                  >
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-[#5B5781] tabular-nums">{note.number}</td>
                    <td className="px-5 py-4 text-stone-600 tabular-nums">{fmtDate(note.noteDate)}</td>
                    <td className="px-5 py-4 text-stone-900 font-medium max-w-xs truncate">{note.subject}</td>
                    <td className="px-5 py-4 text-stone-700">{note.contactName}</td>
                    <td className="px-5 py-4 text-stone-500 text-xs">{note.organizationName}</td>
                    <td className="px-5 py-4">
                      <ExpenseNoteStatusBadge status={note.status} />
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-stone-900 tabular-nums">{fmtMoney(note.totalAmount)}</td>
                    <td className="px-2 py-4">
                      {note.status === 'draft' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(note.id)
                          }}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
