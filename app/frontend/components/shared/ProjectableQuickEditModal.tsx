import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { apiRequest } from '../../lib/api'
import { ProjectableCombobox, type ProjectableValue } from './ProjectableCombobox'

interface Props {
  entity: { type: 'expense' | 'revenue'; id: string; label?: string | null }
  currentProjectable: ProjectableValue | null
  onSaved: (next: ProjectableValue | null) => void
  onCancel: () => void
}

export function ProjectableQuickEditModal({ entity, currentProjectable, onSaved, onCancel }: Props) {
  const [value, setValue] = useState<ProjectableValue | null>(currentProjectable)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const endpoint = entity.type === 'expense'
    ? `/api/v1/lab/expenses/${entity.id}`
    : `/api/v1/lab/revenues/${entity.id}`

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setBusy(true)
    setError(null)
    // onSaved unmounts this modal, so no need to reset busy on success.
    try {
      await apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({
          projectable_type: value?.type ?? null,
          projectable_id: value?.id ?? null,
        }),
      })
      onSaved(value)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
      setBusy(false)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm"
        onClick={busy ? undefined : onCancel}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="px-6 pt-5 pb-4 border-b border-stone-100 flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400 font-medium">
                {entity.type === 'expense' ? 'Dépense' : 'Recette'}
              </p>
              <h2 className="mt-1 font-serif text-lg text-stone-900 leading-tight">
                {entity.label || 'Lier à un projet'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="shrink-0 p-1.5 rounded-md text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors disabled:opacity-50"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <form onSubmit={handleSave}>
            <div className="px-6 py-5 space-y-3">
              <label className="block text-[11px] uppercase tracking-[0.12em] text-stone-500 font-medium">
                Projet concerné
              </label>
              <ProjectableCombobox
                value={value}
                onChange={setValue}
                placeholder="Aucun projet (global)"
                disabled={busy}
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>

            <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/40 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="px-4 py-2 rounded-lg font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-[#5B5781] disabled:opacity-60 transition-colors"
              >
                {busy ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
