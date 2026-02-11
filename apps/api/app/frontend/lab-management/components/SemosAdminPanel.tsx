import { useState } from 'react'
import type {
  Member,
  Wallet,
  SemosRate,
  EmissionReason,
} from '../types'

interface SemosAdminPanelProps {
  members: Member[]
  wallets: Wallet[]
  rates: SemosRate[]
  onEmitSemos?: (
    walletId: string,
    amount: number,
    reason: EmissionReason,
    description: string
  ) => void
  onUpdateRate?: (rateId: string, amount: number) => void
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount)
}

const EMISSION_REASONS: { value: EmissionReason; label: string; icon: string }[] = [
  { value: 'cotisation_member', label: 'Cotisation membre', icon: '🎫' },
  { value: 'volunteer_work', label: 'Travail bénévole', icon: '🌱' },
  { value: 'provider_fee', label: 'Fidélisation prestataire', icon: '🤝' },
  { value: 'peer_review', label: 'Peer Review', icon: '👁' },
  { value: 'loyalty', label: 'Fidélité', icon: '⭐' },
  { value: 'participation', label: 'Participation', icon: '🙋' },
]

function getRateIcon(type: string): string {
  switch (type) {
    case 'cotisation_member_active':
      return '🎫'
    case 'cotisation_member_support':
      return '💚'
    case 'volunteer_hourly':
      return '⏱'
    case 'provider_fee_percentage':
      return '%'
    case 'peer_review':
      return '👁'
    default:
      return '•'
  }
}

export function SemosAdminPanel({
  members,
  wallets,
  rates,
  onEmitSemos,
  onUpdateRate,
}: SemosAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'emit' | 'rates'>('emit')

  // Emission form state
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [emissionAmount, setEmissionAmount] = useState('')
  const [emissionReason, setEmissionReason] = useState<EmissionReason>('cotisation_member')
  const [emissionDescription, setEmissionDescription] = useState('')

  // Rate editing state
  const [editingRateId, setEditingRateId] = useState<string | null>(null)
  const [editingRateValue, setEditingRateValue] = useState('')

  const activeMembers = members.filter((m) => m.status === 'active')
  const selectedMember = activeMembers.find((m) => m.id === selectedMemberId)
  const selectedWallet = selectedMember
    ? wallets.find((w) => w.memberId === selectedMember.id)
    : null

  const numAmount = parseFloat(emissionAmount) || 0
  const canEmit = selectedMemberId && numAmount > 0 && emissionDescription.trim()

  const handleEmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canEmit && selectedWallet) {
      onEmitSemos?.(
        selectedWallet.id,
        numAmount,
        emissionReason,
        emissionDescription.trim()
      )
      // Reset form
      setSelectedMemberId('')
      setEmissionAmount('')
      setEmissionDescription('')
    }
  }

  const handleSaveRate = (rateId: string) => {
    const newAmount = parseFloat(editingRateValue)
    if (!isNaN(newAmount) && newAmount >= 0) {
      onUpdateRate?.(rateId, newAmount)
    }
    setEditingRateId(null)
    setEditingRateValue('')
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
      {/* Header with tabs */}
      <div className="bg-gradient-to-r from-[#5B5781] to-[#4a4670] px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-xl">⚙</span>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Administration Semos</h3>
            <p className="text-white/70 text-sm">Émission et configuration des tarifs</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('emit')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                activeTab === 'emit'
                  ? 'bg-white text-[#5B5781]'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }
            `}
          >
            Émettre des Semos
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                activeTab === 'rates'
                  ? 'bg-white text-[#5B5781]'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }
            `}
          >
            Tarifs de référence
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'emit' ? (
          <form onSubmit={handleEmit} className="space-y-5">
            {/* Member selection */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Destinataire
              </label>
              <div className="relative">
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 appearance-none cursor-pointer hover:border-[#5B5781]/50 focus:border-[#5B5781] focus:ring-2 focus:ring-[#5B5781]/20 outline-none transition-all"
                >
                  <option value="">Sélectionner un membre...</option>
                  {activeMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                  ▼
                </div>
              </div>
              {selectedMember && selectedWallet && (
                <div className="mt-2 flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                  <img src={selectedMember.avatar} alt="" className="w-5 h-5 rounded-full" />
                  <span>Solde actuel: {formatAmount(selectedWallet.balance)}S</span>
                </div>
              )}
            </div>

            {/* Reason selection */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Motif d'émission
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EMISSION_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => setEmissionReason(reason.value)}
                    className={`
                      p-3 rounded-xl text-left transition-all border
                      ${
                        emissionReason === reason.value
                          ? 'bg-[#5B5781]/10 border-[#5B5781] text-[#5B5781]'
                          : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600'
                      }
                    `}
                  >
                    <span className="text-lg block mb-1">{reason.icon}</span>
                    <span className="text-xs font-medium">{reason.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Montant à émettre
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={emissionAmount}
                  onChange={(e) => setEmissionAmount(e.target.value)}
                  placeholder="0"
                  min="0.1"
                  step="0.1"
                  className="w-full px-4 py-3 pr-16 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-2xl font-bold tabular-nums placeholder:text-stone-300 dark:placeholder:text-stone-600 hover:border-[#5B5781]/50 focus:border-[#5B5781] focus:ring-2 focus:ring-[#5B5781]/20 outline-none transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 font-medium">
                  Semos
                </div>
              </div>
              {/* Suggested amounts based on rates */}
              <div className="flex gap-2 mt-2">
                {rates.slice(0, 4).map((rate) => (
                  <button
                    key={rate.id}
                    type="button"
                    onClick={() => setEmissionAmount(rate.amount.toString())}
                    className="px-3 py-1.5 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg text-xs hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
                  >
                    {rate.amount}{rate.type.includes('percentage') ? '%' : 'S'}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Description
              </label>
              <textarea
                value={emissionDescription}
                onChange={(e) => setEmissionDescription(e.target.value)}
                placeholder="Ex: Cotisation annuelle membre actif, Participation chantier..."
                rows={2}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 resize-none hover:border-[#5B5781]/50 focus:border-[#5B5781] focus:ring-2 focus:ring-[#5B5781]/20 outline-none transition-all"
              />
            </div>

            {/* Summary */}
            {canEmit && selectedMember && (
              <div className="bg-[#AFBD00]/10 rounded-xl p-4 border border-[#AFBD00]/20">
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  Création de <span className="font-bold text-[#AFBD00]">{formatAmount(numAmount)} Semos</span> pour{' '}
                  <span className="font-medium">{selectedMember.firstName} {selectedMember.lastName}</span>
                  <span className="text-stone-400"> ({EMISSION_REASONS.find(r => r.value === emissionReason)?.label})</span>
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canEmit}
              className={`
                w-full px-4 py-3 rounded-xl font-medium transition-all
                ${
                  canEmit
                    ? 'bg-gradient-to-r from-[#AFBD00] to-[#8a9600] text-white hover:shadow-lg hover:shadow-[#AFBD00]/25 active:scale-[0.98]'
                    : 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                }
              `}
            >
              ✦ Émettre des Semos
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
              Tarifs de référence pour les émissions automatiques et les calculs.
            </p>
            {rates.map((rate) => (
              <div
                key={rate.id}
                className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#5B5781]/10 flex items-center justify-center text-[#5B5781] font-medium">
                    {getRateIcon(rate.type)}
                  </div>
                  <div>
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {rate.description}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {rate.type.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                {editingRateId === rate.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editingRateValue}
                      onChange={(e) => setEditingRateValue(e.target.value)}
                      className="w-20 px-2 py-1 text-right font-bold text-[#5B5781] bg-white dark:bg-stone-800 border border-[#5B5781] rounded-lg outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRate(rate.id)}
                      className="p-2 bg-[#5B5781] text-white rounded-lg hover:bg-[#4a4670]"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingRateId(null)}
                      className="p-2 bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingRateId(rate.id)
                      setEditingRateValue(rate.amount.toString())
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:border-[#5B5781]/50 transition-colors group"
                  >
                    <span className="text-lg font-bold text-[#5B5781] tabular-nums">
                      {rate.amount}
                      <span className="text-sm font-normal ml-0.5">
                        {rate.type.includes('percentage') ? '%' : 'S'}
                      </span>
                    </span>
                    <span className="text-stone-300 dark:text-stone-600 group-hover:text-[#5B5781]">✎</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
