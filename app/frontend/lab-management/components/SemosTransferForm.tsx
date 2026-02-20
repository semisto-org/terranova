import { useState } from 'react'
import type { Member, Wallet } from '../types'

interface SemosTransferFormProps {
  currentWallet: Wallet
  currentMember: Member
  members: Member[]
  wallets: Wallet[]
  onTransfer?: (toWalletId: string, amount: number, description: string) => void
  onCancel?: () => void
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount)
}

export function SemosTransferForm({
  currentWallet,
  currentMember,
  members,
  wallets,
  onTransfer,
  onCancel,
}: SemosTransferFormProps) {
  const [recipientId, setRecipientId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  // Get available recipients (all members except current)
  const availableRecipients = members.filter(
    (m) => m.id !== currentMember.id && m.status === 'active'
  )

  const selectedRecipient = availableRecipients.find((m) => m.id === recipientId)
  const recipientWallet = selectedRecipient
    ? wallets.find((w) => w.memberId === selectedRecipient.id)
    : null

  const numAmount = parseFloat(amount) || 0
  const maxTransfer = currentWallet.balance - currentWallet.floor
  const isValidAmount = numAmount > 0 && numAmount <= maxTransfer
  const canSubmit = recipientId && isValidAmount && description.trim()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canSubmit && recipientWallet) {
      onTransfer?.(recipientWallet.id, numAmount, description.trim())
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5B5781] to-[#4a4670] px-6 py-5 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-xl">↑</span>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Transférer des Semos</h3>
            <p className="text-white/70 text-sm">
              Solde disponible: <span className="font-medium text-white">{formatAmount(maxTransfer)}S</span>
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Destinataire
          </label>
          <div className="relative">
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 appearance-none cursor-pointer hover:border-[#5B5781]/50 focus:border-[#5B5781] focus:ring-2 focus:ring-[#5B5781]/20 outline-none transition-all"
            >
              <option value="">Sélectionner un membre...</option>
              {availableRecipients.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
              ▼
            </div>
          </div>
          {selectedRecipient && (
            <div className="mt-2 flex items-center gap-2 text-sm text-stone-500">
              <img
                src={selectedRecipient.avatar}
                alt=""
                className="w-5 h-5 rounded-full"
              />
              <span>{selectedRecipient.roles.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Montant
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0.1"
              max={maxTransfer}
              step="0.1"
              className="w-full px-4 py-3 pr-16 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-2xl font-bold tabular-nums placeholder:text-stone-300 hover:border-[#5B5781]/50 focus:border-[#5B5781] focus:ring-2 focus:ring-[#5B5781]/20 outline-none transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">
              Semos
            </div>
          </div>
          {numAmount > 0 && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className={numAmount > maxTransfer ? 'text-rose-500' : 'text-stone-500'}>
                {numAmount > maxTransfer
                  ? `Insuffisant (max: ${formatAmount(maxTransfer)}S)`
                  : `Reste après transfert: ${formatAmount(currentWallet.balance - numAmount)}S`}
              </span>
              <button
                type="button"
                onClick={() => setAmount(maxTransfer.toString())}
                className="text-[#5B5781] hover:text-[#4a4670] font-medium"
              >
                Max
              </button>
            </div>
          )}
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2">
          {[5, 10, 25, 50].filter(v => v <= maxTransfer).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(value.toString())}
              className={`
                flex-1 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  parseFloat(amount) === value
                    ? 'bg-[#5B5781] text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }
              `}
            >
              {value}S
            </button>
          ))}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Motif
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Achat plants pépinière, Participation formation..."
            rows={2}
            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 resize-none hover:border-[#5B5781]/50 focus:border-[#5B5781] focus:ring-2 focus:ring-[#5B5781]/20 outline-none transition-all"
          />
        </div>

        {/* Summary */}
        {canSubmit && selectedRecipient && (
          <div className="bg-[#5B5781]/5 rounded-xl p-4 border border-[#5B5781]/10">
            <p className="text-sm text-stone-600">
              Vous allez transférer <span className="font-bold text-[#5B5781]">{formatAmount(numAmount)} Semos</span> à{' '}
              <span className="font-medium">{selectedRecipient.firstName} {selectedRecipient.lastName}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`
              flex-1 px-4 py-3 rounded-xl font-medium transition-all
              ${
                canSubmit
                  ? 'bg-gradient-to-r from-[#5B5781] to-[#4a4670] text-white hover:shadow-lg hover:shadow-[#5B5781]/25 active:scale-[0.98]'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }
            `}
          >
            Transférer
          </button>
        </div>
      </form>
    </div>
  )
}
