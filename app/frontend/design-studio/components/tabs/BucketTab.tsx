import { useState } from 'react'
import { usePage } from '@inertiajs/react'
import { ArrowDownCircle, ArrowUpCircle, Pencil, Trash2, X, Lock } from 'lucide-react'
import { EmptyState } from '../shared/EmptyState'

const ACCENT = '#AFBD00'

function FillableBucket({ fillPercent, color }: { fillPercent: number; color: string }) {
  const waterColor = '#22c55e'
  const clamped = Math.max(0, Math.min(100, fillPercent))
  const bucketTop = 24
  const bucketBottom = 78
  const bucketHeight = bucketBottom - bucketTop
  const fillY = bucketTop + bucketHeight * (1 - clamped / 100)

  const wallLeft = (y: number) => {
    const t = (y - bucketTop) / bucketHeight
    return 6 + t * (12 - 6)
  }
  const wallRight = (y: number) => {
    const t = (y - bucketTop) / bucketHeight
    return 74 + t * (68 - 74)
  }
  const lf = wallLeft(fillY)
  const rf = wallRight(fillY)
  const fillRx = (rf - lf) / 2
  const fillCx = (lf + rf) / 2

  return (
    <svg viewBox="0 0 80 90" fill="none" className="w-[4.375rem] h-20">
      <defs>
        <clipPath id="bucket-clip-design">
          <path d="M6 24 L74 24 L68 72 A28 6 0 0 1 12 72 Z" />
        </clipPath>
      </defs>
      {clamped > 0 && (
        <path
          d={`M${lf} ${fillY} A${fillRx} 4 0 0 1 ${rf} ${fillY} L68 72 A28 6 0 0 1 12 72 Z`}
          fill={waterColor}
          opacity="0.3"
          clipPath="url(#bucket-clip-design)"
        />
      )}
      <path
        d="M6 24 Q6 2 40 2 Q74 2 74 24"
        stroke={color} strokeWidth="2.5" fill="none"
      />
      <ellipse
        cx="40" cy="24" rx="35" ry="6"
        stroke={color} strokeWidth="2.5" fill={`${color}10`}
      />
      <path
        d="M6 24 L12 72" stroke={color} strokeWidth="2.5"
      />
      <path
        d="M74 24 L68 72" stroke={color} strokeWidth="2.5"
      />
      <path
        d="M12 72 A28 6 0 0 0 68 72"
        stroke={color} strokeWidth="2.5" fill="none"
      />
      {clamped > 0 && (
        <ellipse
          cx={fillCx} cy={fillY}
          rx={fillRx} ry="4"
          fill={waterColor}
          opacity="0.5"
          clipPath="url(#bucket-clip-design)"
        />
      )}
    </svg>
  )
}

export interface BucketTransaction {
  id: string
  kind: 'credit' | 'debit'
  amount: number
  description: string
  date: string
  memberId?: string | null
  memberName?: string | null
  recordedById: string
  recordedByName: string
  createdAt: string
}

export interface BucketData {
  transactions: BucketTransaction[]
  totalCredits: number
  totalDebits: number
  balance: number
}

interface BucketTabProps {
  bucket: BucketData | null
  teamMembers: Array<{ id: string; memberName: string }>
  onCreateTransaction: (data: {
    kind: string
    amount: number
    description: string
    date: string
    member_id?: string
  }) => void
  onUpdateTransaction: (id: string, data: {
    kind: string
    amount: number
    description: string
    date: string
    member_id?: string | null
  }) => void
  onDeleteTransaction: (id: string) => void
}

export function BucketTab({
  bucket,
  teamMembers,
  onCreateTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
}: BucketTabProps) {
  const { auth } = usePage<{ auth: { member: { isAdmin: boolean } | null } }>().props
  const isAdmin = auth?.member?.isAdmin ?? false
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formKind, setFormKind] = useState<'credit' | 'debit'>('credit')
  const [formAmount, setFormAmount] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))
  const [formMemberId, setFormMemberId] = useState('')

  const data = bucket ?? { transactions: [], totalCredits: 0, totalDebits: 0, balance: 0 }

  const openForm = (kind: 'credit' | 'debit') => {
    setEditingId(null)
    setFormKind(kind)
    setFormAmount('')
    setFormDescription(kind === 'credit' ? 'Facturation client' : '')
    setFormDate(new Date().toISOString().slice(0, 10))
    setFormMemberId('')
    setShowForm(true)
  }

  const openEdit = (txn: BucketTransaction) => {
    setEditingId(txn.id)
    setFormKind(txn.kind)
    setFormAmount(txn.amount.toString())
    setFormDescription(txn.description)
    setFormDate(txn.date.slice(0, 10))
    setFormMemberId(txn.memberId ?? '')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(formAmount)
    if (!amount || amount <= 0) return
    const memberIdValue = formKind === 'debit' ? (formMemberId || null) : null
    if (editingId) {
      onUpdateTransaction(editingId, {
        kind: formKind,
        amount,
        description: formDescription,
        date: formDate,
        member_id: memberIdValue,
      })
    } else {
      onCreateTransaction({
        kind: formKind,
        amount,
        description: formDescription,
        date: formDate,
        ...(formKind === 'debit' && formMemberId ? { member_id: formMemberId } : {}),
      })
    }
    closeForm()
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric' })

  const formatAmount = (val: number) =>
    val.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className="rounded-2xl border-2 p-5 relative overflow-hidden flex items-center justify-between"
          style={{
            borderColor: ACCENT,
            background: `linear-gradient(135deg, ${ACCENT}08 0%, ${ACCENT}18 100%)`,
          }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: ACCENT }}>
              Solde disponible
            </p>
            <p
              className="text-3xl font-bold tracking-tight"
              style={{ color: data.balance >= 0 ? ACCENT : '#dc2626' }}
            >
              {formatAmount(data.balance)} €
            </p>
          </div>
          <FillableBucket
            fillPercent={data.totalCredits > 0 ? (data.balance / data.totalCredits) * 100 : 0}
            color={ACCENT}
          />
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
              Budget total
            </p>
            <p className="text-2xl font-semibold tracking-tight" style={{ color: ACCENT }}>
              {formatAmount(data.totalCredits)} €
            </p>
          </div>
          <div className="border-l border-stone-200 pl-5 ml-5">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
              Utilisé
            </p>
            <p className="text-2xl font-semibold text-stone-700 tracking-tight">
              {formatAmount(data.totalDebits)} €
            </p>
          </div>
        </div>
      </div>

      {/* Actions (admin only) */}
      {isAdmin && (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-3">
          <div className="flex items-center gap-4">
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => openForm('credit')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
              >
                <ArrowDownCircle className="w-4 h-4" />
                Ajouter un crédit
              </button>
              <button
                type="button"
                onClick={() => openForm('debit')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#5B5781]/10 px-4 py-2 text-sm font-medium text-[#5B5781] hover:bg-[#5B5781]/20 transition-colors"
              >
                <ArrowUpCircle className="w-4 h-4" />
                Enregistrer un paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900">
              {editingId
                ? (formKind === 'credit' ? 'Modifier le crédit' : 'Modifier le paiement')
                : (formKind === 'credit' ? 'Nouveau crédit (facturation client)' : 'Nouveau paiement (versement designer)')}
            </h3>
            <button type="button" onClick={closeForm} className="p-1 text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Montant (€)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Date</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-600 mb-1">Description</label>
              <input
                type="text"
                required
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
                placeholder={formKind === 'credit' ? 'Ex: Facturation 10h design' : 'Ex: Paiement designer'}
              />
            </div>
            {formKind === 'debit' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-600 mb-1">Designer</label>
                <select
                  required
                  value={formMemberId}
                  onChange={(e) => setFormMemberId(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
                >
                  <option value="">Sélectionner un designer</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.memberName}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
              >
                {editingId
                  ? 'Enregistrer les modifications'
                  : (formKind === 'credit' ? 'Ajouter le crédit' : 'Enregistrer le paiement')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transaction list */}
      {data.transactions.length === 0 ? (
        <EmptyState
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-stone-400"><path d="M5 9h14l-1.5 10a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7L5 9z" /><path d="M3.5 9a1 1 0 0 1-.2-2l3-1.5a1 1 0 0 1 .5-.1h10.4a1 1 0 0 1 .5.1l3 1.5a1 1 0 0 1-.2 2H3.5z" /></svg>}
          title="Aucun mouvement"
        />
      ) : (
        <div className="rounded-2xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-4 py-3 font-semibold text-stone-600">Date</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Type</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Description</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Designer</th>
                  <th className="px-4 py-3 font-semibold text-stone-600 text-right">Montant</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Enregistré par</th>
                  {isAdmin && <th className="px-4 py-3 w-20" />}
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                    <td className="px-4 py-3 text-stone-600">
                      {formatDate(txn.date)}
                    </td>
                    <td className="px-4 py-3">
                      {txn.kind === 'credit' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#AFBD00]/15 px-2.5 py-0.5 text-xs font-medium text-[#6B7A00]">
                          <ArrowDownCircle className="w-3 h-3" />
                          Crédit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#5B5781]/10 px-2.5 py-0.5 text-xs font-medium text-[#5B5781]">
                          <ArrowUpCircle className="w-3 h-3" />
                          Débit
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {txn.description}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {txn.memberName || '—'}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${txn.kind === 'credit' ? 'text-[#6B7A00]' : 'text-[#5B5781]'}`}>
                      {txn.kind === 'credit' ? '+' : '−'}{formatAmount(txn.amount)} €
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs">
                      {txn.recordedByName}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(txn)}
                            className="p-1.5 text-stone-500 hover:text-[#5B5781] rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
                                onDeleteTransaction(txn.id)
                              }
                            }}
                            className="p-1.5 text-stone-500 hover:text-red-600 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
