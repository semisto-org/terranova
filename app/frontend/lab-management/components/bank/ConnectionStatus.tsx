import { useRef, useState } from 'react'
import { Check, CheckCircle, FileUp, Pencil, Plus, Trash2, Unlink, Upload, X } from 'lucide-react'
import type { BankConnection, BankSummaryResponse } from './BankSection'
import { SCOPE_LABELS } from './BankSection'

const AVAILABLE_BANKS = [
  { name: 'Triodos', defaultScope: 'general' },
  { name: 'VDK', defaultScope: 'nursery' },
]

interface ConnectionStatusProps {
  summary: BankSummaryResponse | null
  connections: BankConnection[]
  organizations?: { id: string; name: string; vatSubject: boolean; isDefault: boolean }[]
  onCreateConnection: (bankName: string, iban: string, accountingScope: string, organizationId?: string | null) => Promise<void>
  onUploadCoda: (connectionId: string, file: File) => Promise<{ imported: number; skipped: number; total: number }>
  onDisconnect: (id: string) => void
  onUpdateConnection: (id: string, updates: { bankName?: string; iban?: string; accountingScope?: string; organizationId?: string | null }) => Promise<void>
}

const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleDateString('fr-FR') : '—')
const fmtDatetime = (v: string | null) =>
  v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'jamais'

export function ConnectionStatus({ summary, connections, organizations = [], onCreateConnection, onUploadCoda, onDisconnect, onUpdateConnection }: ConnectionStatusProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedBank, setSelectedBank] = useState(AVAILABLE_BANKS[0].name)
  const [iban, setIban] = useState('')
  const [selectedScope, setSelectedScope] = useState(AVAILABLE_BANKS[0].defaultScope)
  const defaultOrgId = organizations.find((o) => o.isDefault)?.id || organizations[0]?.id || ''
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>(defaultOrgId)
  const [creating, setCreating] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<{ imported: number; skipped: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{ bankName: string; iban: string; accountingScope: string; organizationId: string }>({
    bankName: '',
    iban: '',
    accountingScope: 'general',
    organizationId: '',
  })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const startEdit = (conn: BankConnection) => {
    setEditingId(conn.id)
    setEditError(null)
    setEditDraft({
      bankName: conn.bankName || '',
      iban: conn.iban || '',
      accountingScope: conn.accountingScope || 'general',
      organizationId: conn.organizationId || '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditError(null)
  }

  const saveEdit = async (conn: BankConnection) => {
    if (!editDraft.bankName.trim()) {
      setEditError('Le nom de la banque est requis.')
      return
    }
    setSavingEdit(true)
    setEditError(null)
    try {
      await onUpdateConnection(conn.id, {
        bankName: editDraft.bankName.trim(),
        iban: editDraft.iban.trim() || null,
        accountingScope: editDraft.accountingScope,
        organizationId: editDraft.organizationId || null,
      })
      setEditingId(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Impossible de sauvegarder.')
    } finally {
      setSavingEdit(false)
    }
  }

  const accounts = summary?.accounts ?? []

  const handleCreate = async () => {
    setCreating(true)
    try {
      await onCreateConnection(selectedBank, iban, selectedScope, selectedOrganizationId || null)
      setShowAddForm(false)
      setIban('')
    } finally {
      setCreating(false)
    }
  }

  const handleUpload = async (connectionId: string, file: File) => {
    setUploadingId(connectionId)
    setUploadResult(null)
    try {
      const result = await onUploadCoda(connectionId, file)
      setUploadResult({ imported: result.imported, skipped: result.skipped })
    } finally {
      setUploadingId(null)
    }
  }

  const triggerFileUpload = (connectionId: string) => {
    const input = fileInputRef.current
    if (!input) return
    input.dataset.connectionId = connectionId
    input.click()
  }

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const connectionId = e.target.dataset.connectionId
    if (file && connectionId) {
      handleUpload(connectionId, file)
    }
    e.target.value = ''
  }

  const stripeConnection = connections.find((c) => c.provider === 'stripe' && c.status === 'linked')
  const [stripeBusy, setStripeBusy] = useState(false)
  const [stripeMessage, setStripeMessage] = useState<string | null>(null)

  const handleConnectStripe = async () => {
    setStripeBusy(true)
    setStripeMessage(null)
    try {
      await fetch('/api/v1/bank/connections/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({}),
      })
      window.location.reload()
    } finally {
      setStripeBusy(false)
    }
  }

  const handleSyncStripe = async (id: string) => {
    setStripeBusy(true)
    setStripeMessage(null)
    try {
      const res = await fetch(`/api/v1/bank/connections/${id}/sync_stripe`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      })
      const data = await res.json()
      if (!res.ok) {
        setStripeMessage(data.error || 'Erreur lors de la synchro Stripe')
      } else {
        setStripeMessage(`${data.imported} transactions importées${data.skipped > 0 ? ` (${data.skipped} déjà connues)` : ''}`)
      }
    } finally {
      setStripeBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input for CODA upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".cod,.coda,.txt"
        onChange={onFileSelected}
        className="hidden"
      />

      {/* Upload success message */}
      {uploadResult && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="text-sm text-emerald-800">
            <span className="font-semibold">{uploadResult.imported} transactions importées</span>
            {uploadResult.skipped > 0 && <span className="text-emerald-600"> · {uploadResult.skipped} déjà existantes (ignorées)</span>}
          </div>
          <button onClick={() => setUploadResult(null)} className="ml-auto p-1 text-emerald-400 hover:text-emerald-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Account cards */}
      {accounts.length > 0 && (
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
              </div>
              <div className="text-xs text-stone-400">{account.iban || '—'}</div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-amber-600 font-medium">{account.unmatchedCount} non rapprochées</span>
                <span className="text-emerald-600 font-medium">{account.matchedCount} rapprochées</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <span className="text-xs text-stone-400">Dernier import : {fmtDatetime(account.lastSyncedAt)}</span>
                <button
                  onClick={() => triggerFileUpload(account.connectionId)}
                  disabled={uploadingId === account.connectionId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: '#5B5781' }}
                >
                  <Upload className={`w-3.5 h-3.5 ${uploadingId === account.connectionId ? 'animate-pulse' : ''}`} />
                  {uploadingId === account.connectionId ? 'Import...' : 'Importer CODA'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stripe section */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-4 flex-wrap">
        <div
          className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, #635BFF 0%, #4F46E5 100%)' }}
        >
          S
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-stone-900">Stripe</div>
          {stripeConnection ? (
            <div className="text-xs text-stone-500">
              Connecté · dernière synchro : {stripeConnection.lastSyncedAt ? new Date(stripeConnection.lastSyncedAt).toLocaleString('fr-FR') : 'jamais'}
            </div>
          ) : (
            <div className="text-xs text-stone-500">
              Importe les charges et payouts Stripe comme des transactions bancaires.
            </div>
          )}
        </div>
        {stripeMessage && (
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1">
            {stripeMessage}
          </span>
        )}
        {stripeConnection ? (
          <button
            onClick={() => handleSyncStripe(stripeConnection.id)}
            disabled={stripeBusy}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white rounded-lg disabled:opacity-50"
            style={{ backgroundColor: '#635BFF' }}
          >
            {stripeBusy ? 'Synchro…' : 'Synchroniser maintenant'}
          </button>
        ) : (
          <button
            onClick={handleConnectStripe}
            disabled={stripeBusy}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white rounded-lg disabled:opacity-50"
            style={{ backgroundColor: '#635BFF' }}
          >
            {stripeBusy ? 'Connexion…' : 'Connecter Stripe'}
          </button>
        )}
      </div>

      {/* Add connection */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm"
          style={{ backgroundColor: '#5B5781' }}
        >
          <Plus className="w-4 h-4" />
          Ajouter un compte
        </button>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 p-5 max-w-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900">Ajouter un compte bancaire</h3>
            <button onClick={() => setShowAddForm(false)} className="p-1 text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-stone-600">Banque</span>
              <select
                value={selectedBank}
                onChange={(e) => {
                  setSelectedBank(e.target.value)
                  const bank = AVAILABLE_BANKS.find((b) => b.name === e.target.value)
                  if (bank) setSelectedScope(bank.defaultScope)
                }}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
              >
                {AVAILABLE_BANKS.map((bank) => (
                  <option key={bank.name} value={bank.name}>{bank.name}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-stone-600">IBAN</span>
              <input
                type="text"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="BE12 5230 8000 1234"
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white font-mono"
              />
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
            {organizations.length > 0 && (
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-stone-600">Structure (régime TVA)</span>
                <select
                  value={selectedOrganizationId}
                  onChange={(e) => setSelectedOrganizationId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
                >
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}{!o.vatSubject ? ' · franchise TVA' : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !iban.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
              style={{ backgroundColor: '#5B5781' }}
            >
              <Plus className="w-4 h-4" />
              {creating ? 'Création...' : 'Créer'}
            </button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700">
              Annuler
            </button>
          </div>
          <p className="text-xs text-stone-400">
            Créez le compte, puis importez vos relevés CODA téléchargés depuis votre e-banking.
          </p>
        </div>
      )}

      {/* No accounts empty state */}
      {accounts.length === 0 && !showAddForm && (
        <div className="max-w-lg mx-auto text-center py-12 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 flex items-center justify-center">
            <FileUp className="w-8 h-8 text-stone-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-900">Importer vos relevés bancaires</h3>
            <p className="text-sm text-stone-500 mt-1">
              Ajoutez vos comptes Triodos et VDK, puis importez vos fichiers CODA depuis votre e-banking pour rapprocher les transactions.
            </p>
          </div>
        </div>
      )}

      {/* Connection details */}
      {connections.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-3">Comptes enregistrés</h3>
          <div className="space-y-2">
            {connections.map((conn) => {
              const isEditing = editingId === conn.id
              return (
                <div
                  key={conn.id}
                  className={`bg-white rounded-lg border transition-colors ${
                    isEditing ? 'border-[#5B5781]/40 ring-1 ring-[#5B5781]/10 shadow-sm' : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-4 px-4 py-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-stone-900">{conn.bankName}</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-stone-100 text-stone-500 uppercase">
                          {SCOPE_LABELS[conn.accountingScope] || conn.accountingScope}
                        </span>
                        {conn.iban && <span className="text-xs text-stone-400 font-mono">{conn.iban}</span>}
                        {conn.organizationName && (
                          <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider">
                            · {conn.organizationName}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-400">
                        Ajouté par {conn.connectedBy?.name || '—'} le {fmtDate(conn.createdAt)}
                        · Import CODA
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => triggerFileUpload(conn.id)}
                        disabled={uploadingId === conn.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#5B5781] border border-[#5B5781]/30 rounded-lg hover:bg-[#5B5781]/5 disabled:opacity-50"
                      >
                        <Upload className="w-3 h-3" />
                        CODA
                      </button>
                      <button
                        onClick={() => (isEditing ? cancelEdit() : startEdit(conn))}
                        className={`p-1.5 rounded transition-colors ${
                          isEditing ? 'text-[#5B5781] bg-[#5B5781]/10' : 'text-stone-400 hover:text-[#5B5781]'
                        }`}
                        title={isEditing ? 'Fermer' : 'Modifier'}
                      >
                        {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Supprimer le compte ${conn.bankName} ? Les transactions associées seront également supprimées.`)) {
                            onDisconnect(conn.id)
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-500 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="border-t border-stone-100 px-4 py-4 bg-stone-50/50 rounded-b-lg space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="block space-y-1">
                          <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">Banque</span>
                          <input
                            type="text"
                            value={editDraft.bankName}
                            onChange={(e) => setEditDraft({ ...editDraft, bankName: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5B5781]/20 focus:border-[#5B5781]"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">IBAN</span>
                          <input
                            type="text"
                            value={editDraft.iban}
                            onChange={(e) => setEditDraft({ ...editDraft, iban: e.target.value })}
                            placeholder="BE12 5230 8000 1234"
                            className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#5B5781]/20 focus:border-[#5B5781]"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">Périmètre comptable</span>
                          <select
                            value={editDraft.accountingScope}
                            onChange={(e) => setEditDraft({ ...editDraft, accountingScope: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5B5781]/20 focus:border-[#5B5781]"
                          >
                            <option value="general">Général (tous les pôles)</option>
                            <option value="nursery">Pépinière (nursery uniquement)</option>
                          </select>
                        </label>
                        {organizations.length > 0 && (
                          <label className="block space-y-1">
                            <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">Structure (régime TVA)</span>
                            <select
                              value={editDraft.organizationId}
                              onChange={(e) => setEditDraft({ ...editDraft, organizationId: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5B5781]/20 focus:border-[#5B5781]"
                            >
                              {organizations.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.name}{!o.vatSubject ? ' · franchise TVA' : ''}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                      </div>

                      {editError && (
                        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                          {editError}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => saveEdit(conn)}
                          disabled={savingEdit}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-lg disabled:opacity-50"
                          style={{ backgroundColor: '#5B5781' }}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {savingEdit ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3.5 py-2 text-xs text-stone-500 hover:text-stone-700"
                        >
                          Annuler
                        </button>
                        <span className="ml-auto text-[11px] text-stone-400 italic">
                          Le fournisseur et le statut ne sont pas modifiables ici.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
