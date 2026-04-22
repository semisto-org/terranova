import { ArrowUpRight, PiggyBank } from 'lucide-react'
import { fmtMoney } from './helpers'
import { CASH_ACCENT, CASH_SUPPORT, type CashAccount } from './types'

interface CashBalanceCardProps {
  account: CashAccount
  onRequestTransfer: () => void
}

export function CashBalanceCard({ account, onRequestTransfer }: CashBalanceCardProps) {
  const empty = account.balance <= 0

  return (
    <article
      className="relative overflow-hidden rounded-2xl border"
      style={{
        borderColor: `${CASH_ACCENT}22`,
        background: `linear-gradient(145deg, ${CASH_SUPPORT}14 0%, #FFF 60%)`,
      }}
    >
      {/* Decorative corner motif: engraved seal */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-[0.06] pointer-events-none"
        style={{ backgroundColor: CASH_ACCENT }}
      />
      <div
        className="absolute top-4 right-4 opacity-20 pointer-events-none"
        style={{ color: CASH_ACCENT }}
      >
        <PiggyBank className="w-16 h-16" strokeWidth={1.2} />
      </div>

      <div className="relative p-5">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full"
            style={{ backgroundColor: `${CASH_ACCENT}15` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CASH_ACCENT }} />
          </span>
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: CASH_ACCENT }}>
              Caisse
            </div>
            <div className="text-sm font-medium text-stone-700">{account.organizationName || '—'}</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[10px] uppercase tracking-[0.14em] text-stone-400 font-semibold">Solde en caisse</div>
          <div
            className={`mt-1 font-mono font-bold tracking-tight ${empty ? 'text-stone-400' : 'text-stone-900'}`}
            style={{
              fontSize: 'clamp(28px, 5vw, 44px)',
              lineHeight: 1,
            }}
          >
            {fmtMoney(account.balance)}
          </div>
          {account.balance < 0 && (
            <div className="mt-1 text-xs text-red-700 font-medium">
              ⚠ Solde négatif — vérifier les mouvements
            </div>
          )}
        </div>

        <button
          onClick={onRequestTransfer}
          disabled={empty}
          className="mt-6 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: CASH_ACCENT,
            border: `1px solid ${CASH_ACCENT}40`,
            backgroundColor: 'white',
          }}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          Enregistrer un apport
        </button>
      </div>
    </article>
  )
}
