import { AlertTriangle, CheckCircle, Link2, RefreshCw, Trash2, Unlink } from 'lucide-react'
import type { BankConnection, BankSummary } from './BankSection'

interface ConnectionStatusProps {
  summary: BankSummary | null
  connections: BankConnection[]
  syncing: boolean
  onConnect: () => void
  onDisconnect: (id: string) => void
  onSync: () => Promise<unknown>
}

const fmtMoney = (v: number | null) =>
  v != null ? `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '—'
const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleDateString('fr-FR') : '—')
const fmtDatetime = (v: string | null) =>
  v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export function ConnectionStatus({ summary, connections, syncing, onConnect, onDisconnect, onSync }: ConnectionStatusProps) {
  if (!summary?.connected) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 flex items-center justify-center">
          <Link2 className="w-8 h-8 text-stone-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Connecter votre compte Triodos</h3>
          <p className="text-sm text-stone-500 mt-1">
            Liez votre compte bancaire Triodos pour importer automatiquement les transactions et faciliter la réconciliation.
          </p>
        </div>
        <button
          onClick={onConnect}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm"
          style={{ backgroundColor: '#5B5781' }}
        >
          <Link2 className="w-4 h-4" />
          Connecter Triodos
        </button>
        <p className="text-xs text-stone-400">
          Connexion sécurisée via GoCardless (PSD2). Le consentement est valable 90 jours.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Solde</div>
          <div className="text-2xl font-bold text-stone-900 mt-1">{fmtMoney(summary.balance)}</div>
          <div className="text-xs text-stone-400 mt-1">{summary.iban}</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Non rapprochées</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{summary.unmatchedCount}</div>
          <div className="text-xs text-stone-400 mt-1">transactions à traiter</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Rapprochées</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{summary.matchedCount}</div>
          <div className="text-xs text-stone-400 mt-1">transactions matchées</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Dernière sync</div>
          <div className="text-sm font-semibold text-stone-900 mt-2">{fmtDatetime(summary.lastSyncedAt)}</div>
          <button
            onClick={onSync}
            disabled={syncing}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#5B5781] hover:underline disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchronisation...' : 'Synchroniser'}
          </button>
        </div>
      </div>

      {/* Consent warning */}
      {summary.consentExpiringSoon && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">Consentement expire bientôt</span> — le {fmtDate(summary.consentExpiresAt)}.
            Veuillez reconnecter le compte pour renouveler l'accès.
          </div>
          <button
            onClick={onConnect}
            className="ml-auto text-xs font-semibold text-amber-700 hover:underline whitespace-nowrap"
          >
            Renouveler
          </button>
        </div>
      )}

      {/* Connection details */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3">Connexions actives</h3>
        <div className="space-y-2">
          {connections.map((conn) => (
            <div key={conn.id} className="flex items-center gap-4 bg-white rounded-lg border border-stone-200 px-4 py-3">
              <div className={`w-2.5 h-2.5 rounded-full ${conn.status === 'linked' ? 'bg-emerald-400' : conn.status === 'expired' ? 'bg-red-400' : 'bg-stone-300'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-stone-900">
                  {conn.bankName} {conn.iban && <span className="text-stone-400 font-normal">— {conn.iban}</span>}
                </div>
                <div className="text-xs text-stone-400">
                  Connecté par {conn.connectedBy?.name || '—'} le {fmtDate(conn.createdAt)}
                  {conn.consentExpiresAt && <> · Expire le {fmtDate(conn.consentExpiresAt)}</>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {conn.status === 'linked' && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Actif
                  </span>
                )}
                {conn.status === 'expired' && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                    <Unlink className="w-3 h-3" /> Expiré
                  </span>
                )}
                <button
                  onClick={() => onDisconnect(conn.id)}
                  className="p-1.5 text-stone-400 hover:text-red-500 rounded transition-colors"
                  title="Déconnecter"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
