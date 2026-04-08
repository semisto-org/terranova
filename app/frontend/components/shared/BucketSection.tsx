import { useState, useEffect, useCallback } from 'react'
import { usePage } from '@inertiajs/react'
import { apiRequest } from '@/lib/api'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  X,
  Loader2,
  Lock,
} from 'lucide-react'

interface BucketTransaction {
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

interface BucketData {
  transactions: BucketTransaction[]
  totalCredits: number
  totalDebits: number
  balance: number
}

interface TeamMember {
  id: string
  name: string
}

interface BucketSectionProps {
  /** The project type key matching Projectable::PROJECT_TYPE_KEYS values */
  projectType: 'lab-project' | 'training' | 'design-project' | 'guild'
  projectId: string
  /** Team members available for debit attribution */
  teamMembers?: TeamMember[]
  /** Accent color for the domain (default: Lab purple #5B5781) */
  accentColor?: string
}

function BucketIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M5 9h14l-1.5 10a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7L5 9z" />
      <path d="M3.5 9a1 1 0 0 1-.2-2l3-1.5a1 1 0 0 1 .5-.1h10.4a1 1 0 0 1 .5.1l3 1.5a1 1 0 0 1-.2 2H3.5z" />
    </svg>
  )
}

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
        <clipPath id="bucket-clip">
          <path d="M6 24 L74 24 L68 72 A28 6 0 0 1 12 72 Z" />
        </clipPath>
      </defs>
      {clamped > 0 && (
        <path
          d={`M${lf} ${fillY} A${fillRx} 4 0 0 1 ${rf} ${fillY} L68 72 A28 6 0 0 1 12 72 Z`}
          fill={waterColor}
          opacity="0.3"
          clipPath="url(#bucket-clip)"
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
          clipPath="url(#bucket-clip)"
        />
      )}
    </svg>
  )
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric' })

const formatAmount = (val: number) =>
  val.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function BucketSection({
  projectType,
  projectId,
  teamMembers = [],
  accentColor = '#5B5781',
}: BucketSectionProps) {
  const { auth } = usePage<{ auth: { member: { isAdmin: boolean } | null } }>().props
  const isAdmin = auth?.member?.isAdmin ?? false

  const [data, setData] = useState<BucketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [formKind, setFormKind] = useState<'credit' | 'debit'>('credit')
  const [formAmount, setFormAmount] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))
  const [formMemberId, setFormMemberId] = useState('')

  const load = useCallback(async () => {
    setError(null)
    try {
      const payload = await apiRequest(`/api/v1/projects/${projectType}/${projectId}/bucket`)
      setData(payload)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectType, projectId])

  useEffect(() => {
    load()
  }, [load])

  const openForm = (kind: 'credit' | 'debit') => {
    setFormKind(kind)
    setFormAmount('')
    setFormDescription(kind === 'credit' ? 'Facturation client' : '')
    setFormDate(new Date().toISOString().slice(0, 10))
    setFormMemberId('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(formAmount)
    if (!amount || amount <= 0) return
    setError(null)
    try {
      await apiRequest(`/api/v1/projects/${projectType}/${projectId}/bucket`, {
        method: 'POST',
        body: JSON.stringify({
          kind: formKind,
          amount,
          description: formDescription,
          date: formDate,
          ...(formKind === 'debit' && formMemberId ? { member_id: formMemberId } : {}),
        }),
      })
      setShowForm(false)
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) return
    setError(null)
    try {
      await apiRequest(`/api/v1/bucket/${id}`, { method: 'DELETE' })
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
      </div>
    )
  }

  const bucket = data ?? { transactions: [], totalCredits: 0, totalDebits: 0, balance: 0 }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className="rounded-2xl border-2 p-5 relative overflow-hidden flex items-center justify-between"
          style={{
            borderColor: accentColor,
            background: `linear-gradient(135deg, ${accentColor}08 0%, ${accentColor}18 100%)`,
          }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: accentColor }}>
              Solde disponible
            </p>
            <p
              className="text-3xl font-bold tracking-tight"
              style={{ color: bucket.balance >= 0 ? accentColor : '#dc2626' }}
            >
              {formatAmount(bucket.balance)} €
            </p>
          </div>
          <FillableBucket
            fillPercent={bucket.totalCredits > 0 ? (bucket.balance / bucket.totalCredits) * 100 : 0}
            color={accentColor}
          />
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
              Budget total
            </p>
            <p className="text-2xl font-semibold tracking-tight" style={{ color: accentColor }}>
              {formatAmount(bucket.totalCredits)} €
            </p>
          </div>
          <div className="border-l border-stone-200 pl-5 ml-5">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
              Utilisé
            </p>
            <p className="text-2xl font-semibold text-stone-700 tracking-tight">
              {formatAmount(bucket.totalDebits)} €
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
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: accentColor }}
              >
                <ArrowDownCircle className="w-4 h-4" />
                Remplir le bucket
              </button>
              <button
                type="button"
                onClick={() => openForm('debit')}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
              >
                <ArrowUpCircle className="w-4 h-4" />
                Vider le bucket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900">
              {formKind === 'credit' ? 'Remplir le bucket' : 'Vider le bucket'}
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
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
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
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-600 mb-1">Description</label>
              <input
                type="text"
                required
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                placeholder={formKind === 'credit' ? 'Ex: Facturation client' : 'Ex: Paiement intervenant'}
              />
            </div>
            {formKind === 'debit' && teamMembers.length > 0 && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-600 mb-1">Membre <span className="text-stone-400 font-normal">(optionnel)</span></label>
                <select
                  value={formMemberId}
                  onChange={(e) => setFormMemberId(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                >
                  <option value="">Paiement direct (Semisto)</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
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
                className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: accentColor }}
              >
                {formKind === 'credit' ? 'Ajouter le crédit' : 'Enregistrer le paiement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transaction list */}
      {bucket.transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 py-12 px-6 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white border border-stone-200 mb-4 shadow-sm">
            <BucketIcon className="w-10 h-10 text-stone-400" />
          </div>
          <h3 className="text-base font-medium text-stone-900 mb-1">Aucun mouvement</h3>
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-4 py-3 font-semibold text-stone-600">Date</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Type</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Description</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Membre</th>
                  <th className="px-4 py-3 font-semibold text-stone-600 text-right">Montant</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Enregistré par</th>
                  {isAdmin && <th className="px-4 py-3 w-12" />}
                </tr>
              </thead>
              <tbody>
                {bucket.transactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                    <td className="px-4 py-3 text-stone-600">
                      {formatDate(txn.date)}
                    </td>
                    <td className="px-4 py-3">
                      {txn.kind === 'credit' ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                        >
                          <ArrowDownCircle className="w-3 h-3" />
                          Crédit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
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
                    <td className="px-4 py-3 text-right font-medium" style={{ color: txn.kind === 'credit' ? accentColor : undefined }}>
                      {txn.kind === 'credit' ? '+' : '−'}{formatAmount(txn.amount)} €
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs">
                      {txn.recordedByName}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleDelete(txn.id)}
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
