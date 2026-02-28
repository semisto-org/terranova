import { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import type {
  Member,
  Wallet,
  SemosTransaction,
  SemosEmission,
  SemosRate,
  EmissionReason,
} from '../types'
import { SemosTransactionRow, createActivityItems } from './SemosTransactionRow'
import { SemosTransferForm } from './SemosTransferForm'
import { SemosAdminPanel } from './SemosAdminPanel'

interface SemosDashboardProps {
  // Data
  members: Member[]
  wallets: Wallet[]
  transactions: SemosTransaction[]
  emissions: SemosEmission[]
  rates: SemosRate[]

  // Current user context
  currentMemberId: string

  // Actions
  onTransferSemos?: (toWalletId: string, amount: number, description: string) => void
  onEmitSemos?: (
    walletId: string,
    amount: number,
    reason: EmissionReason,
    description: string
  ) => void
  onUpdateRate?: (rateId: string, amount: number) => void
  onViewTransaction?: (transactionId: string) => void
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount)
}

// --- Demo data for when no real data is available ---
function getDemoData() {
  const demoMembers: Member[] = [
    {
      id: 'demo-member-1',
      firstName: 'Sophie',
      lastName: 'Dubois',
      email: 'sophie@semisto.org',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
      roles: ['coordination'],
      status: 'active',
      isAdmin: true,
      memberKind: 'human',
      membershipType: 'effective',
      joinedAt: '2025-03-15',
      walletId: 'demo-wallet-1',
      guildIds: ['demo-guild-1'],
      slackUserId: null,
      lastActivityAt: '2026-02-25',
    },
    {
      id: 'demo-member-2',
      firstName: 'Marc',
      lastName: 'Lejeune',
      email: 'marc@semisto.org',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marc',
      roles: ['designer'],
      status: 'active',
      isAdmin: false,
      memberKind: 'human',
      membershipType: 'effective',
      joinedAt: '2025-05-20',
      walletId: 'demo-wallet-2',
      guildIds: [],
      slackUserId: null,
      lastActivityAt: '2026-02-24',
    },
    {
      id: 'demo-member-3',
      firstName: 'Lucie',
      lastName: 'Martin',
      email: 'lucie@semisto.org',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucie',
      roles: ['formateur'],
      status: 'active',
      isAdmin: false,
      memberKind: 'human',
      membershipType: 'adherent',
      joinedAt: '2025-09-01',
      walletId: 'demo-wallet-3',
      guildIds: [],
      slackUserId: null,
      lastActivityAt: '2026-02-23',
    },
  ]

  const demoWallets: Wallet[] = [
    { id: 'demo-wallet-1', memberId: 'demo-member-1', balance: 245.5, floor: -50, ceiling: 500 },
    { id: 'demo-wallet-2', memberId: 'demo-member-2', balance: 120, floor: -50, ceiling: 500 },
    { id: 'demo-wallet-3', memberId: 'demo-member-3', balance: 80, floor: -50, ceiling: 500 },
  ]

  const demoTransactions: SemosTransaction[] = [
    {
      id: 'demo-tx-1',
      fromWalletId: 'demo-wallet-2',
      toWalletId: 'demo-wallet-1',
      amount: 30,
      description: 'Design atelier permaculture',
      createdAt: '2026-02-24T14:30:00Z',
      type: 'transfer',
    },
    {
      id: 'demo-tx-2',
      fromWalletId: 'demo-wallet-1',
      toWalletId: 'demo-wallet-3',
      amount: 25,
      description: 'Participation formation taille',
      createdAt: '2026-02-22T10:00:00Z',
      type: 'payment',
    },
    {
      id: 'demo-tx-3',
      fromWalletId: 'demo-wallet-3',
      toWalletId: 'demo-wallet-1',
      amount: 20,
      description: 'Échange plants fruitiers',
      createdAt: '2026-02-18T16:45:00Z',
      type: 'exchange',
    },
    {
      id: 'demo-tx-4',
      fromWalletId: 'demo-wallet-1',
      toWalletId: 'demo-wallet-2',
      amount: 15,
      description: 'Contribution cartographie',
      createdAt: '2026-02-15T09:20:00Z',
      type: 'transfer',
    },
  ]

  const demoEmissions: SemosEmission[] = [
    {
      id: 'demo-em-1',
      walletId: 'demo-wallet-1',
      amount: 50,
      reason: 'volunteer_work',
      description: 'Animation journée design collectif',
      createdAt: '2026-02-20T12:00:00Z',
      createdBy: 'demo-member-1',
    },
    {
      id: 'demo-em-2',
      walletId: 'demo-wallet-1',
      amount: 25,
      reason: 'participation',
      description: 'Cotisation membre actif — février',
      createdAt: '2026-02-01T08:00:00Z',
      createdBy: 'demo-member-1',
    },
    {
      id: 'demo-em-3',
      walletId: 'demo-wallet-2',
      amount: 40,
      reason: 'volunteer_work',
      description: 'Bénévolat chantier participatif',
      createdAt: '2026-02-19T14:00:00Z',
      createdBy: 'demo-member-1',
    },
  ]

  const demoRates: SemosRate[] = [
    { id: 'demo-rate-1', type: 'cotisation_member_active', amount: 25, description: 'Cotisation mensuelle membre actif' },
    { id: 'demo-rate-2', type: 'cotisation_member_support', amount: 10, description: 'Cotisation mensuelle membre adhérent' },
    { id: 'demo-rate-3', type: 'volunteer_hourly', amount: 15, description: 'Taux horaire bénévolat' },
    { id: 'demo-rate-4', type: 'provider_fee_percentage', amount: 5, description: 'Commission prestataire (%)' },
    { id: 'demo-rate-5', type: 'peer_review', amount: 10, description: 'Évaluation par les pairs' },
  ]

  return {
    members: demoMembers,
    wallets: demoWallets,
    transactions: demoTransactions,
    emissions: demoEmissions,
    rates: demoRates,
    currentMemberId: 'demo-member-1',
  }
}

type FilterType = 'all' | 'incoming' | 'outgoing' | 'emissions'

export function SemosDashboard({
  members: propMembers,
  wallets: propWallets,
  transactions: propTransactions,
  emissions: propEmissions,
  rates: propRates,
  currentMemberId: propCurrentMemberId,
  onTransferSemos,
  onEmitSemos,
  onUpdateRate,
  onViewTransaction,
}: SemosDashboardProps) {
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')

  // Use demo data if no real member/wallet can be resolved
  const needsDemo = useMemo(() => {
    const member = propMembers.find((m) => m.id === propCurrentMemberId)
    if (!member) return true
    const wallet = propWallets.find((w) => w.memberId === member.id)
    return !wallet
  }, [propMembers, propWallets, propCurrentMemberId])

  const demo = useMemo(() => (needsDemo ? getDemoData() : null), [needsDemo])

  const members = demo ? demo.members : propMembers
  const wallets = demo ? demo.wallets : propWallets
  const transactions = demo ? demo.transactions : propTransactions
  const emissions = demo ? demo.emissions : propEmissions
  const rates = demo ? demo.rates : propRates
  const currentMemberId = demo ? demo.currentMemberId : propCurrentMemberId

  // Get current member and wallet
  const currentMember = members.find((m) => m.id === currentMemberId)!
  const currentWallet = wallets.find((w) => w.memberId === currentMember.id)!

  // Create activity items for the current wallet
  const allActivity = createActivityItems(
    currentWallet.id,
    transactions,
    emissions,
    members,
    wallets
  )

  // Apply filter
  const filteredActivity = allActivity.filter((activity) => {
    switch (filter) {
      case 'incoming':
        return activity.type === 'transaction' && activity.isIncoming
      case 'outgoing':
        return activity.type === 'transaction' && !activity.isIncoming
      case 'emissions':
        return activity.type === 'emission'
      default:
        return true
    }
  })

  // Calculate stats
  const totalReceived = allActivity
    .filter((a) => a.type === 'transaction' && a.isIncoming)
    .reduce((sum, a) => sum + a.amount, 0)
  const totalSent = allActivity
    .filter((a) => a.type === 'transaction' && !a.isIncoming)
    .reduce((sum, a) => sum + Math.abs(a.amount), 0)
  const totalEmissions = allActivity
    .filter((a) => a.type === 'emission')
    .reduce((sum, a) => sum + a.amount, 0)

  // Calculate balance percentage for visual indicator
  const balanceRange = currentWallet.ceiling - currentWallet.floor
  const balancePercent = ((currentWallet.balance - currentWallet.floor) / balanceRange) * 100

  const handleTransfer = (toWalletId: string, amount: number, description: string) => {
    onTransferSemos?.(toWalletId, amount, description)
    setShowTransferForm(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5B5781] to-[#4a4670] flex items-center justify-center text-white text-2xl shadow-lg shadow-[#5B5781]/20">
            Ⓢ
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              Mon Portefeuille Semos
            </h1>
            <p className="text-stone-500">
              Gérez vos Semos et consultez votre historique
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200/80">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Les Semos ne sont pas encore actifs. Les données affichées sont fictives et servent uniquement à prévisualiser l’interface.
          </p>
        </div>
      </div>

      {/* Main wallet card */}
      <div className="relative mb-8 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#5B5781] via-[#5B5781] to-[#4a4670] rounded-3xl" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative p-6 sm:p-8 text-white">
          {/* User info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <img
                src={currentMember.avatar}
                alt=""
                className="w-14 h-14 rounded-2xl border-2 border-white/20"
              />
              <div>
                <p className="text-white/60 text-sm">Portefeuille de</p>
                <p className="font-semibold text-lg">
                  {currentMember.firstName} {currentMember.lastName}{currentMember.memberKind === 'ai' ? ' 🤖' : ''}
                </p>
              </div>
            </div>
            {currentMember.isAdmin && (
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2
                  ${showAdminPanel
                    ? 'bg-white text-[#5B5781]'
                    : 'bg-white/20 text-white hover:bg-white/30'
                  }
                `}
              >
                <span>⚙</span>
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>

          {/* Balance display */}
          <div className="mb-6">
            <p className="text-white/60 text-sm mb-1">Solde actuel</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-bold tracking-tight">
                {formatAmount(currentWallet.balance)}
              </span>
              <span className="text-2xl text-white/70 font-light">Semos</span>
            </div>
          </div>

          {/* Balance bar */}
          <div className="mb-6">
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#AFBD00] to-[#c8d630] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, balancePercent))}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/50 mt-2">
              <span>Plancher: {currentWallet.floor}S</span>
              <span>Plafond: {currentWallet.ceiling}S</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-emerald-300 font-bold text-lg">+{formatAmount(totalReceived)}S</p>
              <p className="text-white/50 text-xs">Reçus</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-rose-300 font-bold text-lg">-{formatAmount(totalSent)}S</p>
              <p className="text-white/50 text-xs">Envoyés</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-[#AFBD00] font-bold text-lg">+{formatAmount(totalEmissions)}S</p>
              <p className="text-white/50 text-xs">Émis</p>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={() => setShowTransferForm(!showTransferForm)}
            className={`
              w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2
              ${showTransferForm
                ? 'bg-white/20 text-white'
                : 'bg-white text-[#5B5781] hover:shadow-xl hover:shadow-black/20 active:scale-[0.98]'
              }
            `}
          >
            <span className="text-xl">↑</span>
            {showTransferForm ? 'Annuler' : 'Transférer des Semos'}
          </button>
        </div>
      </div>

      {/* Transfer form */}
      {showTransferForm && (
        <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
          <SemosTransferForm
            currentWallet={currentWallet}
            currentMember={currentMember}
            members={members}
            wallets={wallets}
            onTransfer={handleTransfer}
            onCancel={() => setShowTransferForm(false)}
          />
        </div>
      )}

      {/* Admin panel */}
      {showAdminPanel && currentMember.isAdmin && (
        <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
          <SemosAdminPanel
            members={members}
            wallets={wallets}
            rates={rates}
            onEmitSemos={onEmitSemos}
            onUpdateRate={onUpdateRate}
          />
        </div>
      )}

      {/* Transaction history */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-stone-900">
            Historique des transactions
          </h2>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { key: 'all', label: 'Tout', count: allActivity.length },
              { key: 'incoming', label: 'Reçus', count: allActivity.filter(a => a.type === 'transaction' && a.isIncoming).length },
              { key: 'outgoing', label: 'Envoyés', count: allActivity.filter(a => a.type === 'transaction' && !a.isIncoming).length },
              { key: 'emissions', label: 'Émissions', count: allActivity.filter(a => a.type === 'emission').length },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as FilterType)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${
                    filter === key
                      ? 'bg-[#5B5781] text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }
                `}
              >
                {label}
                <span className={`ml-1.5 text-xs ${filter === key ? 'text-white/70' : 'text-stone-400'}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Transaction list */}
        {filteredActivity.length === 0 ? (
          <div className="bg-stone-50 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-stone-200 flex items-center justify-center text-3xl mx-auto mb-4">
              {filter === 'emissions' ? '✦' : filter === 'incoming' ? '↓' : filter === 'outgoing' ? '↑' : 'Ⓢ'}
            </div>
            <p className="text-stone-500 font-medium">
              {filter === 'all'
                ? 'Aucune transaction pour le moment'
                : filter === 'emissions'
                  ? 'Aucune émission reçue'
                  : filter === 'incoming'
                    ? 'Aucun transfert reçu'
                    : 'Aucun transfert envoyé'}
            </p>
            <p className="text-stone-400 text-sm mt-1">
              Les transactions apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivity.map((activity) => (
              <SemosTransactionRow
                key={activity.id}
                activity={activity}
                onClick={() => onViewTransaction?.(activity.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="mt-12 p-6 bg-gradient-to-br from-stone-50 to-stone-100 rounded-2xl border border-stone-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#AFBD00]/20 flex items-center justify-center text-[#AFBD00] text-xl shrink-0">
            ✦
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-1">
              Qu'est-ce que le Semos ?
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Le Semos est la monnaie interne du Lab Semisto. Elle permet de valoriser les contributions
              bénévoles, de faciliter les échanges entre membres, et de renforcer les liens de coopération.
              Chaque membre dispose d'un plancher et d'un plafond personnalisés.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
