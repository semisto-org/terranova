import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Pencil, Plus, Tag, Trash2, X } from 'lucide-react'
import { apiRequest } from '@/lib/api'

export interface ExpenseCategoryItem {
  id: string
  label: string
  expenseCount: number
}

export interface ExpenseCategoriesAdminProps {
  open: boolean
  onClose: () => void
  onCategoriesChanged: () => void
}

type Mode =
  | { kind: 'idle' }
  | { kind: 'create' }
  | { kind: 'edit'; id: string }
  | { kind: 'reassign'; id: string }

export function ExpenseCategoriesAdmin({ open, onClose, onCategoriesChanged }: ExpenseCategoriesAdminProps) {
  const [categories, setCategories] = useState<ExpenseCategoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>({ kind: 'idle' })
  const [formLabel, setFormLabel] = useState('')
  const [reassignTargetId, setReassignTargetId] = useState<string>('')
  const createInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const loadCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiRequest('/api/v1/lab/expense-categories')
      setCategories(response.items || [])
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des catégories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    loadCategories()
    setMode({ kind: 'idle' })
    setFormLabel('')
    setReassignTargetId('')
    setError(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (mode.kind !== 'idle') {
        cancelMode()
      } else {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, mode, onClose])

  useEffect(() => {
    if (mode.kind === 'create') {
      setTimeout(() => createInputRef.current?.focus(), 50)
    } else if (mode.kind === 'edit') {
      setTimeout(() => editInputRef.current?.focus(), 50)
    }
  }, [mode])

  const cancelMode = () => {
    setMode({ kind: 'idle' })
    setFormLabel('')
    setReassignTargetId('')
    setError(null)
  }

  const handleCreateStart = () => {
    setMode({ kind: 'create' })
    setFormLabel('')
    setError(null)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const label = formLabel.trim()
    if (!label) return
    setBusy(true)
    setError(null)
    try {
      await apiRequest('/api/v1/lab/expense-categories', {
        method: 'POST',
        body: JSON.stringify({ label }),
      })
      await loadCategories()
      onCategoriesChanged()
      cancelMode()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création')
    } finally {
      setBusy(false)
    }
  }

  const handleEditStart = (cat: ExpenseCategoryItem) => {
    setMode({ kind: 'edit', id: cat.id })
    setFormLabel(cat.label)
    setError(null)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode.kind !== 'edit') return
    const label = formLabel.trim()
    if (!label) return
    setBusy(true)
    setError(null)
    try {
      await apiRequest(`/api/v1/lab/expense-categories/${mode.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ label }),
      })
      await loadCategories()
      onCategoriesChanged()
      cancelMode()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (cat: ExpenseCategoryItem) => {
    if (cat.expenseCount > 0) {
      setMode({ kind: 'reassign', id: cat.id })
      setReassignTargetId('')
      setError(null)
      return
    }
    if (!window.confirm(`Supprimer la catégorie « ${cat.label} » ? Cette action est définitive.`)) return
    setBusy(true)
    setError(null)
    try {
      await apiRequest(`/api/v1/lab/expense-categories/${cat.id}`, { method: 'DELETE' })
      await loadCategories()
      onCategoriesChanged()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression')
    } finally {
      setBusy(false)
    }
  }

  const handleReassign = async () => {
    if (mode.kind !== 'reassign') return
    const source = categories.find((c) => c.id === mode.id)
    if (!source) return
    setBusy(true)
    setError(null)
    try {
      await apiRequest(`/api/v1/lab/expense-categories/${mode.id}/reassign`, {
        method: 'POST',
        body: JSON.stringify({ targetId: reassignTargetId || null }),
      })
      // Now delete the (now empty) category.
      await apiRequest(`/api/v1/lab/expense-categories/${mode.id}`, { method: 'DELETE' })
      await loadCategories()
      onCategoriesChanged()
      cancelMode()
    } catch (err: any) {
      setError(err.message || 'Erreur lors du déplacement')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  const totalExpenses = categories.reduce((sum, c) => sum + c.expenseCount, 0)

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl ring-1 ring-stone-900/5 flex flex-col animate-[fadeIn_.2s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — ledger-style, consistent with ExpenseList */}
        <header className="relative shrink-0 px-8 pt-7 pb-5 border-b border-stone-100">
          <div className="absolute left-0 top-7 bottom-5 w-[3px] bg-[#5B5781] rounded-full" aria-hidden />
          <div className="pl-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400 font-medium">
                Administration · Taxonomie
              </p>
              <h2 className="mt-1 font-serif text-2xl text-stone-900 tracking-tight">
                Catégories de dépenses
              </h2>
              <p className="mt-1.5 text-[13px] text-stone-500 leading-relaxed">
                <span className="font-mono tabular-nums text-stone-900">{categories.length}</span>{' '}
                catégorie{categories.length > 1 ? 's' : ''} ·{' '}
                <span className="font-mono tabular-nums">{totalExpenses}</span> dépense{totalExpenses > 1 ? 's' : ''} rattachée{totalExpenses > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateStart}
                disabled={mode.kind !== 'idle' || busy}
                className="group inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-white hover:bg-[#5B5781] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" />
                Nouvelle
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-md text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="shrink-0 mx-8 mt-4 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm animate-[fadeIn_.15s_ease-out]">
            {error}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-8 py-5 min-h-0">
          {loading ? (
            <div className="py-16 text-center text-stone-400">
              <div className="inline-flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-[#5B5781] animate-pulse" />
                Chargement des catégories…
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {/* Inline create row */}
              {mode.kind === 'create' && (
                <li className="py-3 animate-[fadeIn_.15s_ease-out]">
                  <form onSubmit={handleCreateSubmit} className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-[#5B5781] shrink-0" />
                    <input
                      ref={createInputRef}
                      type="text"
                      value={formLabel}
                      onChange={(e) => setFormLabel(e.target.value)}
                      placeholder="Nom de la catégorie…"
                      className="flex-1 px-3 py-1.5 text-sm rounded-md border border-[#5B5781]/30 bg-white focus:outline-none focus:ring-2 focus:ring-[#5B5781]/20 focus:border-[#5B5781]"
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      disabled={busy || !formLabel.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#5B5781] text-white text-xs font-medium hover:bg-[#4a4669] transition-colors disabled:opacity-40"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Créer
                    </button>
                    <button
                      type="button"
                      onClick={cancelMode}
                      disabled={busy}
                      className="px-3 py-1.5 rounded-md text-xs text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                    >
                      Annuler
                    </button>
                  </form>
                </li>
              )}

              {categories.length === 0 && mode.kind !== 'create' ? (
                <li className="py-16 text-center">
                  <Tag className="w-10 h-10 mx-auto text-stone-300 mb-3" strokeWidth={1.25} />
                  <p className="font-serif text-lg text-stone-700">Aucune catégorie définie</p>
                  <p className="text-sm text-stone-500 mt-1">Créez-en une pour commencer.</p>
                </li>
              ) : (
                categories.map((cat) => {
                  if (mode.kind === 'edit' && mode.id === cat.id) {
                    return (
                      <li key={cat.id} className="py-3 animate-[fadeIn_.15s_ease-out]">
                        <form onSubmit={handleEditSubmit} className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-[#5B5781] shrink-0" />
                          <input
                            ref={editInputRef}
                            type="text"
                            value={formLabel}
                            onChange={(e) => setFormLabel(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm rounded-md border border-[#5B5781]/30 bg-white focus:outline-none focus:ring-2 focus:ring-[#5B5781]/20 focus:border-[#5B5781]"
                            autoComplete="off"
                          />
                          <button
                            type="submit"
                            disabled={busy || !formLabel.trim()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#5B5781] text-white text-xs font-medium hover:bg-[#4a4669] transition-colors disabled:opacity-40"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            onClick={cancelMode}
                            disabled={busy}
                            className="px-3 py-1.5 rounded-md text-xs text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                          >
                            Annuler
                          </button>
                        </form>
                      </li>
                    )
                  }

                  if (mode.kind === 'reassign' && mode.id === cat.id) {
                    const others = categories.filter((c) => c.id !== cat.id)
                    return (
                      <li key={cat.id} className="py-4 animate-[fadeIn_.15s_ease-out] bg-amber-50/40 -mx-8 px-8 border-y border-amber-200/60">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                            <Trash2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-stone-800">
                              La catégorie{' '}
                              <span className="font-medium text-stone-900">« {cat.label} »</span>{' '}
                              contient{' '}
                              <span className="font-mono tabular-nums font-medium text-amber-900">
                                {cat.expenseCount}
                              </span>{' '}
                              dépense{cat.expenseCount > 1 ? 's' : ''}.
                            </p>
                            <p className="text-[13px] text-stone-500 mt-0.5">
                              Déplace-les d'abord vers une autre catégorie, puis la suppression s'exécutera.
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <label className="inline-flex items-center gap-2 text-xs text-stone-500">
                                <ArrowRight className="w-3.5 h-3.5" />
                                Déplacer vers
                              </label>
                              <select
                                value={reassignTargetId}
                                onChange={(e) => setReassignTargetId(e.target.value)}
                                className="text-sm px-3 py-1.5 rounded-md border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#5B5781]/20 focus:border-[#5B5781] min-w-[200px]"
                              >
                                <option value="">— Sans catégorie —</option>
                                {others.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={handleReassign}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 text-white text-xs font-medium hover:bg-[#5B5781] transition-colors disabled:opacity-40"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                Déplacer {cat.expenseCount} dépense{cat.expenseCount > 1 ? 's' : ''} puis supprimer
                              </button>
                              <button
                                type="button"
                                onClick={cancelMode}
                                disabled={busy}
                                className="px-3 py-1.5 rounded-md text-xs text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    )
                  }

                  const inactive = mode.kind !== 'idle'
                  return (
                    <li
                      key={cat.id}
                      className={`group py-3 flex items-center justify-between gap-4 ${
                        inactive ? 'opacity-40 pointer-events-none' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Tag className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="text-sm text-stone-900 truncate">{cat.label}</span>
                        <span
                          className={`inline-flex items-center text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-full ring-1 ring-inset ${
                            cat.expenseCount > 0
                              ? 'text-[#5B5781] ring-[#5B5781]/25 bg-[#5B5781]/5'
                              : 'text-stone-400 ring-stone-200'
                          }`}
                        >
                          {cat.expenseCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleEditStart(cat)}
                          className="p-1.5 rounded-md text-stone-400 hover:text-[#5B5781] hover:bg-[#5B5781]/10 transition-colors"
                          title="Renommer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title={cat.expenseCount > 0 ? 'Vider d\'abord pour supprimer' : 'Supprimer'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  )
                })
              )}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-8 py-3.5 border-t border-stone-100 bg-stone-50/40 flex items-center justify-between text-[11px] text-stone-400 font-mono">
          <span>Esc · Fermer</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs uppercase tracking-wider text-stone-500 hover:text-stone-900 px-2 py-1 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
