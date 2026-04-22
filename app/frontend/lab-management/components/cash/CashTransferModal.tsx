import { useEffect, useState } from 'react'
import { ArrowUpRight, Banknote, X } from 'lucide-react'
import { fmtMoney } from './helpers'
import { CASH_ACCENT, CASH_SUPPORT, type CashAccount } from './types'

interface CashTransferModalProps {
  account: CashAccount
  onConfirm: (payload: { amount: number; date: string; note: string }) => Promise<void>
  onCancel: () => void
}

const todayIso = () => new Date().toISOString().slice(0, 10)

export function CashTransferModal({ account, onConfirm, onCancel }: CashTransferModalProps) {
  const maxAmount = account.balance
  const [amount, setAmount] = useState(String(account.balance.toFixed(2)))
  const [date, setDate] = useState(todayIso())
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const parsedAmount = parseFloat(amount.replace(',', '.')) || 0
  const invalid = parsedAmount <= 0 || parsedAmount > maxAmount + 0.01

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (invalid) {
      setError(parsedAmount <= 0 ? 'Montant invalide.' : 'Le montant dépasse le solde de la caisse.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onConfirm({ amount: parsedAmount, date, note: note.trim() })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-[2px] px-4"
      onClick={onCancel}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ borderTop: `4px solid ${CASH_ACCENT}` }}
      >
        {/* Paper-like background tint */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${CASH_ACCENT} 1px, transparent 1px)`,
            backgroundSize: '12px 12px',
          }}
        />

        <header className="relative px-5 pt-5 pb-4 border-b border-stone-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: CASH_ACCENT }}>
              Apport de caisse
            </p>
            <h2 className="mt-1 text-xl font-bold text-stone-900 tracking-tight inline-flex items-center gap-2">
              <Banknote className="w-5 h-5" style={{ color: CASH_ACCENT }} />
              Cash → {account.organizationName}
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Enregistre la sortie de caisse. Une transaction bancaire en attente sera créée côté Triodos.
            </p>
          </div>
          <button onClick={onCancel} className="p-2 text-stone-400 hover:text-stone-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </header>

        <form onSubmit={submit} className="relative px-5 py-4 space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
              Montant à sortir
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-3 pr-10 py-3 text-2xl font-mono font-semibold bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
                style={{ color: CASH_ACCENT }}
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-stone-400 font-mono">€</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500">
              <span>Solde caisse actuel : <span className="font-mono text-stone-700">{fmtMoney(maxAmount)}</span></span>
              <button
                type="button"
                onClick={() => setAmount(maxAmount.toFixed(2))}
                className="font-medium hover:underline"
                style={{ color: CASH_ACCENT }}
              >
                Tout
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
              Note (optionnelle)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
              placeholder="Ex. Apport Q1 2026"
            />
          </div>

          {/* Flow illustration */}
          <div
            className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-xs"
            style={{ backgroundColor: `${CASH_SUPPORT}18`, color: CASH_ACCENT }}
          >
            <span className="font-medium">Caisse</span>
            <ArrowUpRight className="w-3 h-3" />
            <span className="font-mono font-semibold">{fmtMoney(parsedAmount)}</span>
            <ArrowUpRight className="w-3 h-3" />
            <span className="font-medium">Compte bancaire (en attente)</span>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy || invalid}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
              style={{ backgroundColor: CASH_ACCENT }}
            >
              {busy ? 'Enregistrement…' : 'Confirmer l\'apport'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
