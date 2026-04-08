import { useState } from 'react'
import { AlertTriangle, CheckCircle, Link2, Plus, RefreshCw, Trash2, Unlink, X } from 'lucide-react'
import type { BankConnection, BankSummaryResponse } from './BankSection'
import { SCOPE_LABELS } from './BankSection'

const AVAILABLE_INSTITUTIONS = [
  { id: 'TRIODOS_TRIOBEBB', name: 'Triodos', defaultScope: 'general' },
  { id: 'VDK_VDSPBE22', name: 'VDK', defaultScope: 'nursery' },
]

interface ConnectionStatusProps {
  summary: BankSummaryResponse | null
  connections: BankConnection[]
  syncing: boolean
  onConnect: (institutionId: string, accountingScope: string) => void
  onDisconnect: (id: string) => void
  onSync: (connectionId?: string) => Promise<unknown>
}

const fmtMoney = (v: number | null) =>
  v != null ? `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '—'
const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleDateString('fr-FR') : '—')
const fmtDatetime = (v: string | null) =>
  v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export function ConnectionStatus({ summary, connections, syncing, onConnect, onDisconnect, onSync }: ConnectionStatusProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedInstitution, setSelectedInstitution] = useState(AVAILABLE_INSTITUTIONS[0].id)
  const [selectedScope, setSelectedScope] = useState(AVAILABLE_INSTITUTIONS[0].defaultScope)
  const accounts = summary?.accounts ?? []
  const hasAccounts = accounts.length > 0

  const handleAddConnection = () => {
    onConnect(selectedInstitution, selectedScope)
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Account summary cards */}
      {hasAccounts && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <div key={account.connectionId} className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-900">{account.bankName}</span>
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-stone-100 text-stone-600 uppercase tracking-wider">
                    {SCOPE_LABELS[account.scope] || account.scope}
                  </span>
                </div>
                {account.consentExpiringSoon && (
                  <AlertTriangle className="w-4 h-4 text-amber-500" title="Consentement expire bientôt" />
                )}
              </div>
              <div className="text-xs text-stone-400">{account.iban || '—'}</div>
              <div className="text-2xl font-bold text-stone-900">{fmtMoney(account.balance)}</div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-amber-600 font-medium">{account.unmatchedCount} non rapprochées</span>
                <span className="text-emerald-600 font-medium">{account.matchedCount} rapprochées</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <span className="text-xs text-stone-400">Sync : {fmtDatetime(account.lastSyncedAt)}</span>
                <button
                  onClick={() => onSync(account.connectionId)}
                  disabled={syncing}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#5B5781] hover:underline disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                  Sync
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Consent warnings */}
      {accounts.filter((a) => a.consentExpiringSoon).map((account) => (
        <div key={`warn-${account.connectionId}`} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">{account.bankName}</span> — consentement expire le {fmtDate(account.consentExpiresAt)}.
          </div>
          <button
            onClick={() => {
              const inst = AVAILABLE_INSTITUTIONS.find((i) => i.name === account.bankName)
              if (inst) onConnect(inst.id, account.scope)
            }}
            className="ml-auto text-xs font-semibold text-amber-700 hover:underline whitespace-nowrap"
          >
            Renouveler
          </button>
        </div>
      ))}

      {/* Add connection button / form */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm"
          style={{ backgroundColor: '#5B5781' }}
        >
          <Plus className="w-4 h-4" />
          Connecter un compte
        </button>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 p-5 max-w-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900">Connecter un nouveau compte</h3>
            <button onClick={() => setShowAddForm(false)} className="p-1 text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-stone-600">Banque</span>
              <select
                value={selectedInstitution}
                onChange={(e) => {
                  setSelectedInstitution(e.target.value)
                  const inst = AVAILABLE_INSTITUTIONS.find((i) => i.id === e.target.value)
                  if (inst) setSelectedScope(inst.defaultScope)
                }}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
              >
                {AVAILABLE_INSTITUTIONS.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-stone-600">Périmètre comptable</span>
              <select
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
              >
                <option value="general">Général (tous les pôles)</option>
                <option value="nursery">Pépinière (nursery uniquement)</option>
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddConnection}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg"
              style={{ backgroundColor: '#5B5781' }}
            >
              <Link2 className="w-4 h-4" />
              Connecter
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700"
            >
              Annuler
            </button>
          </div>
          <p className="text-xs text-stone-400">
            Connexion sécurisée via GoCardless (PSD2). Le consentement est valable 90 jours.
          </p>
        </div>
      )}

      {/* No accounts empty state */}
      {!hasAccounts && !showAddForm && (
        <div className="text-center py-8 text-stone-400 text-sm">
          Aucun compte bancaire connecté. Cliquez sur « Connecter un compte » pour commencer.
        </div>
      )}

      {/* Connection details */}
      {connections.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-3">Détail des connexions</h3>
          <div className="space-y-2">
            {connections.map((conn) => (
              <div key={conn.id} className="flex items-center gap-4 bg-white rounded-lg border border-stone-200 px-4 py-3">
                <div className={`w-2.5 h-2.5 rounded-full ${conn.status === 'linked' ? 'bg-emerald-400' : conn.status === 'expired' ? 'bg-red-400' : 'bg-stone-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-stone-900">{conn.bankName}</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-stone-100 text-stone-500 uppercase">
                      {SCOPE_LABELS[conn.accountingScope] || conn.accountingScope}
                    </span>
                    {conn.iban && <span className="text-xs text-stone-400">{conn.iban}</span>}
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
      )}
    </div>
  )
}
