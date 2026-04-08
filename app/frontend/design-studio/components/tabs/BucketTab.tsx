import { useState } from 'react'
import { usePage } from '@inertiajs/react'
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, Trash2, X } from 'lucide-react'
import { EmptyState } from '../shared/EmptyState'

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
  onDeleteTransaction: (id: string) => void
}

export function BucketTab({
  bucket,
  teamMembers,
  onCreateTransaction,
  onDeleteTransaction,
}: BucketTabProps) {
  const { auth } = usePage<{ auth: { member: { isAdmin: boolean } | null } }>().props
  const isAdmin = auth?.member?.isAdmin ?? false
  const [showForm, setShowForm] = useState(false)
  const [formKind, setFormKind] = useState<'credit' | 'debit'>('credit')
  const [formAmount, setFormAmount] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))
  const [formMemberId, setFormMemberId] = useState('')

  const data = bucket ?? { transactions: [], totalCredits: 0, totalDebits: 0, balance: 0 }

  const openForm = (kind: 'credit' | 'debit') => {
    setFormKind(kind)
    setFormAmount('')
    setFormDescription(kind === 'credit' ? 'Facturation client' : '')
    setFormDate(new Date().toISOString().slice(0, 10))
    setFormMemberId('')
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(formAmount)
    if (!amount || amount <= 0) return
    onCreateTransaction({
      kind: formKind,
      amount,
      description: formDescription,
      date: formDate,
      ...(formKind === 'debit' && formMemberId ? { member_id: formMemberId } : {}),
    })
    setShowForm(false)
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric' })

  const formatAmount = (val: number) =>
    val.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
            Crédits (facturé)
          </p>
          <p className="text-2xl font-semibold text-[#6B7A00] tracking-tight">
            {formatAmount(data.totalCredits)} €
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
            Débits (versé)
          </p>
          <p className="text-2xl font-semibold text-[#5B5781] tracking-tight">
            {formatAmount(data.totalDebits)} €
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
            Solde du bucket
          </p>
          <p className={`text-2xl font-semibold tracking-tight ${data.balance >= 0 ? 'text-stone-900' : 'text-red-600'}`}>
            {formatAmount(data.balance)} €
          </p>
        </div>
      </div>

      {/* Actions (admin only) */}
      {isAdmin && (
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
      )}

      {/* Form modal */}
      {showForm && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900">
              {formKind === 'credit' ? 'Nouveau crédit (facturation client)' : 'Nouveau paiement (versement designer)'}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 text-stone-400 hover:text-stone-600">
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
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
              >
                {formKind === 'credit' ? 'Ajouter le crédit' : 'Enregistrer le paiement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transaction list */}
      {data.transactions.length === 0 ? (
        <EmptyState
          icon={<Wallet className="w-10 h-10 text-stone-400" />}
          title="Aucun mouvement"
          description="Le bucket se remplit quand le client est facturé et se vide quand les designers sont payés."
          action={isAdmin ? (
            <button
              type="button"
              onClick={() => openForm('credit')}
              className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00]"
            >
              Ajouter un crédit
            </button>
          ) : undefined}
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
                  {isAdmin && <th className="px-4 py-3 w-12" />}
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
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(txn.id)}
                          className="p-1.5 text-stone-500 hover:text-red-600 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
