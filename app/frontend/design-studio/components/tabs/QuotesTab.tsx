import { useState } from 'react'
import { FileText, Plus, Send, Trash2, ExternalLink } from 'lucide-react'
import type { Quote } from '../../types'
import { EmptyState } from '../shared/EmptyState'

interface QuotesTabProps {
  projectId: string
  quotes: Quote[]
  onCreateQuote: () => void
  onSendQuote: (quoteId: string) => void
  onDeleteQuote: (quoteId: string) => void
  onAddQuoteLine: (
    quoteId: string,
    values: {
      description: string
      quantity: number
      unit: string
      unit_price: number
    }
  ) => void
  onDeleteQuoteLine: (lineId: string) => void
}

export function QuotesTab({
  projectId,
  quotes,
  onCreateQuote,
  onSendQuote,
  onDeleteQuote,
  onAddQuoteLine,
  onDeleteQuoteLine,
}: QuotesTabProps) {
  const [lineForm, setLineForm] = useState({
    description: '',
    quantity: 1,
    unit: 'u',
    unit_price: 0,
  })
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null)

  const statusLabel: Record<string, string> = {
    draft: 'Brouillon',
    sent: 'Envoyé',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    expired: 'Expiré',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onCreateQuote}
          className="inline-flex items-center gap-2 rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau devis
        </button>
        <a
          href={`/client/design/${projectId}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300 dark:border-stone-600 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir portail client
        </a>
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-10 h-10 text-stone-400" />}
          title="Aucun devis"
          description="Créez un devis pour le projet et envoyez-le au client via le portail."
          action={
            <button
              type="button"
              onClick={onCreateQuote}
              className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00]"
            >
              Nouveau devis
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-stone-900 dark:text-stone-100">
                    {quote.title}
                  </h4>
                  <span className="rounded-full bg-stone-200 dark:bg-stone-600 px-2 py-0.5 text-xs font-medium text-stone-700 dark:text-stone-300">
                    v{quote.version}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      quote.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : quote.status === 'sent'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          : quote.status === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {statusLabel[quote.status] ?? quote.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                    {Number(quote.total).toLocaleString('fr-BE')} €
                  </span>
                  {quote.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() => onSendQuote(quote.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#AFBD00] px-3 py-1.5 text-sm font-medium text-[#6B7A00] dark:text-[#AFBD00] hover:bg-[#AFBD00]/10"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Envoyer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteQuote(quote.id)}
                    className="p-1.5 text-stone-500 hover:text-red-600 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {(quote.lines ?? []).length > 0 && (
                  <ul className="space-y-2">
                    {quote.lines.map((line) => (
                      <li
                        key={line.id}
                        className="flex items-center justify-between gap-3 py-2 border-b border-stone-100 dark:border-stone-700/50 last:border-0"
                      >
                        <span className="text-sm text-stone-700 dark:text-stone-300">
                          {line.description} · {line.quantity} {line.unit}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-stone-900 dark:text-stone-100">
                            {Number(line.total).toLocaleString('fr-BE')} €
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteQuoteLine(line.id)}
                            className="p-1 text-stone-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {quote.status === 'draft' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      onAddQuoteLine(quote.id, lineForm)
                      setLineForm({
                        description: '',
                        quantity: 1,
                        unit: 'u',
                        unit_price: 0,
                      })
                    }}
                    className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2"
                  >
                    <input
                      type="text"
                      placeholder="Description"
                      value={lineForm.description}
                      onChange={(e) =>
                        setLineForm((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      className="sm:col-span-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
                      required
                    />
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      placeholder="Qté"
                      value={lineForm.quantity}
                      onChange={(e) =>
                        setLineForm((p) => ({
                          ...p,
                          quantity: Number(e.target.value || 0),
                        }))
                      }
                      className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Unité"
                      value={lineForm.unit}
                      onChange={(e) =>
                        setLineForm((p) => ({ ...p, unit: e.target.value }))
                      }
                      className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="Prix unitaire"
                      value={lineForm.unit_price || ''}
                      onChange={(e) =>
                        setLineForm((p) => ({
                          ...p,
                          unit_price: Number(e.target.value || 0),
                        }))
                      }
                      className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-stone-200 dark:bg-stone-700 px-4 py-2 text-sm font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600"
                    >
                      Ajouter ligne
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
