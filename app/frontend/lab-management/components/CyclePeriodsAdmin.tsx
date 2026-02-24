import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '@/lib/api'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'

interface CyclePeriod {
  id: string
  name: string
  startsOn: string
  endsOn: string
  cooldownStartsOn: string
  cooldownEndsOn: string
  color: string
  notes: string | null
  active: boolean
}

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]'

const emptyForm = {
  name: '',
  starts_on: '',
  ends_on: '',
  cooldown_starts_on: '',
  cooldown_ends_on: '',
  color: '#5B5781',
  notes: '',
  active: true,
}

export function CyclePeriodsAdmin() {
  const [cycles, setCycles] = useState<CyclePeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CyclePeriod | null>(null)
  const [formValues, setFormValues] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<{ title: string; message: string; action: () => void } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadCycles = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiRequest('/api/v1/settings/cycles')
      setCycles(response.items || [])
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des cycles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCycles()
  }, [])

  useEffect(() => {
    if (modalOpen && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [modalOpen])

  const openCreate = () => {
    setEditing(null)
    setFormValues(emptyForm)
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (cycle: CyclePeriod) => {
    setEditing(cycle)
    setFormValues({
      name: cycle.name,
      starts_on: cycle.startsOn,
      ends_on: cycle.endsOn,
      cooldown_starts_on: cycle.cooldownStartsOn,
      cooldown_ends_on: cycle.cooldownEndsOn,
      color: cycle.color || '#5B5781',
      notes: cycle.notes || '',
      active: cycle.active,
    })
    setError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setFormValues(emptyForm)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)

    try {
      if (editing) {
        await apiRequest(`/api/v1/settings/cycles/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formValues),
        })
      } else {
        await apiRequest('/api/v1/settings/cycles', {
          method: 'POST',
          body: JSON.stringify(formValues),
        })
      }
      await loadCycles()
      closeModal()
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement")
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = (cycle: CyclePeriod) => {
    setDeleteConfirm({
      title: 'Supprimer ce cycle ?',
      message: `Le cycle « ${cycle.name} » sera supprimé définitivement.`,
      action: async () => {
        setBusy(true)
        setError(null)
        try {
          await apiRequest(`/api/v1/settings/cycles/${cycle.id}`, { method: 'DELETE' })
          await loadCycles()
        } catch (err: any) {
          setError(err.message || 'Erreur lors de la suppression')
        } finally {
          setBusy(false)
        }
      },
    })
  }

  if (loading) {
    return <div className="p-8 text-center text-stone-500">Chargement des cycles...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading)' }}>
            Cycles
          </h2>
          <p className="text-sm text-stone-500 mt-1">Gérez les périodes de cycle et cooldown du calendrier</p>
        </div>
        <button type="button" onClick={openCreate} className="px-4 py-2 rounded-xl font-medium text-white bg-[#5B5781] hover:bg-[#4a4669] transition-colors">
          + Nouveau cycle
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="space-y-2">
        {cycles.length === 0 ? (
          <div className="p-8 text-center text-stone-500 rounded-xl border border-stone-200">Aucun cycle défini</div>
        ) : (
          cycles.map((cycle) => (
            <div key={cycle.id} className="p-4 rounded-xl border border-stone-200 bg-white flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: cycle.color }} />
                  <div className="font-semibold text-stone-900">{cycle.name}</div>
                  {!cycle.active && <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">Inactif</span>}
                </div>
                <div className="text-sm text-stone-600">Cycle: {cycle.startsOn} → {cycle.endsOn}</div>
                <div className="text-sm text-stone-600">Cooldown: {cycle.cooldownStartsOn} → {cycle.cooldownEndsOn}</div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => openEdit(cycle)} className="px-3 py-1.5 rounded-lg text-sm font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors">Modifier</button>
                <button type="button" onClick={() => handleDelete(cycle)} disabled={busy} className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-60">Supprimer</button>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-2xl pointer-events-auto">
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-5 border-b border-stone-200">
                  <h3 className="text-xl font-bold text-stone-900">{editing ? 'Modifier le cycle' : 'Nouveau cycle'}</h3>
                </div>
                <div className="p-6 space-y-4">
                  <input ref={inputRef} className={inputBase} placeholder="Nom" value={formValues.name} onChange={(e) => setFormValues({ ...formValues, name: e.target.value })} required />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" className={inputBase} value={formValues.starts_on} onChange={(e) => setFormValues({ ...formValues, starts_on: e.target.value })} required />
                    <input type="date" className={inputBase} value={formValues.ends_on} onChange={(e) => setFormValues({ ...formValues, ends_on: e.target.value })} required />
                    <input type="date" className={inputBase} value={formValues.cooldown_starts_on} onChange={(e) => setFormValues({ ...formValues, cooldown_starts_on: e.target.value })} required />
                    <input type="date" className={inputBase} value={formValues.cooldown_ends_on} onChange={(e) => setFormValues({ ...formValues, cooldown_ends_on: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <input type="color" className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50" value={formValues.color} onChange={(e) => setFormValues({ ...formValues, color: e.target.value })} />
                    <label className="inline-flex items-center gap-2 text-sm text-stone-700">
                      <input type="checkbox" checked={formValues.active} onChange={(e) => setFormValues({ ...formValues, active: e.target.checked })} />
                      Actif
                    </label>
                  </div>
                  <textarea className={inputBase} placeholder="Notes" rows={3} value={formValues.notes} onChange={(e) => setFormValues({ ...formValues, notes: e.target.value })} />
                </div>
                <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-end gap-3">
                  <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100">Annuler</button>
                  <button type="submit" disabled={busy} className="px-5 py-2 rounded-xl font-medium text-white bg-[#5B5781] hover:bg-[#4a4669] disabled:opacity-60">
                    {busy ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {deleteConfirm && (
        <ConfirmDeleteModal
          title={deleteConfirm.title}
          message={deleteConfirm.message}
          onConfirm={() => {
            deleteConfirm.action()
            setDeleteConfirm(null)
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
