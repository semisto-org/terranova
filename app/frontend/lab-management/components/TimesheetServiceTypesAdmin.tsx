import { useState, useEffect, useRef } from 'react'
import { apiRequest } from '@/lib/api'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'
import type { TimesheetServiceTypeConfig } from '../types'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]'

const phaseOptions = [
  { value: '', label: '— Aucune —' },
  { value: 'offre', label: 'Offre' },
  { value: 'pre-projet', label: 'Pré-projet' },
  { value: 'projet-detaille', label: 'Projet détaillé' },
  { value: 'mise-en-oeuvre', label: 'Mise en œuvre' },
  { value: 'co-gestion', label: 'Co-gestion' },
  { value: 'termine', label: 'Terminé' },
]

export interface TimesheetServiceTypesAdminProps {
  busy?: boolean
}

export function TimesheetServiceTypesAdmin({ busy: externalBusy = false }: TimesheetServiceTypesAdminProps) {
  const [serviceTypes, setServiceTypes] = useState<TimesheetServiceTypeConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingType, setEditingType] = useState<TimesheetServiceTypeConfig | null>(null)
  const [formValues, setFormValues] = useState({
    label: '',
    defaultPhase: '',
  })
  const [deleteConfirm, setDeleteConfirm] = useState<{
    title: string
    message: string
    action: () => void
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadServiceTypes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiRequest('/api/v1/lab/timesheet-service-types')
      setServiceTypes(response.items || [])
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des types')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServiceTypes()
  }, [])

  const handleCreate = () => {
    setEditingType(null)
    setFormValues({
      label: '',
      defaultPhase: '',
    })
    setError(null)
    setModalOpen(true)
  }

  const handleEdit = (type: TimesheetServiceTypeConfig) => {
    setEditingType(type)
    setFormValues({
      label: type.label,
      defaultPhase: type.defaultPhase || '',
    })
    setError(null)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingType(null)
    setFormValues({
      label: '',
      defaultPhase: '',
    })
    setError(null)
  }

  useEffect(() => {
    if (modalOpen && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [modalOpen])

  useEffect(() => {
    if (!modalOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [modalOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const payload: { label: string; defaultPhase?: string } = {
        label: formValues.label.trim(),
      }
      if (formValues.defaultPhase) {
        payload.defaultPhase = formValues.defaultPhase
      }
      if (editingType) {
        await apiRequest(`/api/v1/lab/timesheet-service-types/${editingType.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await apiRequest('/api/v1/lab/timesheet-service-types', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      await loadServiceTypes()
      handleCloseModal()
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement")
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = (type: TimesheetServiceTypeConfig) => {
    setDeleteConfirm({
      title: 'Supprimer ce type de prestation ?',
      message: `Le type « ${type.label} » sera supprimé (soft delete).`,
      action: async () => {
        setBusy(true)
        setError(null)
        try {
          await apiRequest(`/api/v1/lab/timesheet-service-types/${type.id}`, {
            method: 'DELETE',
          })
          await loadServiceTypes()
        } catch (err: any) {
          setError(err.message || 'Erreur lors de la suppression')
        } finally {
          setBusy(false)
        }
      },
    })
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-stone-500">
        Chargement des types de prestation...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading)' }}>
            Types de prestation
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Gérez les types de prestation pour les timesheets (Design, Academy, Lab)
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="px-4 py-2 rounded-xl font-medium text-white bg-[#5B5781] hover:bg-[#4a4669] transition-colors"
        >
          + Nouveau type
        </button>
      </div>

      {modalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleCloseModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 px-6 py-5 border-b border-stone-200 bg-gradient-to-br from-stone-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading)' }}>
                      {editingType ? 'Modifier le type' : 'Nouveau type de prestation'}
                    </h3>
                    <p className="text-sm text-stone-500 mt-1">
                      {editingType ? 'Modifiez les informations du type' : 'Créez un nouveau type de prestation'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="ml-4 p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                    aria-label="Fermer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col min-h-0 h-full">
                <div className="flex-1 overflow-y-auto min-h-0 p-6">
                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in slide-in-from-top-2 duration-200">
                      {error}
                    </div>
                  )}

                  <div className="space-y-5">
                    <div>
                      <label
                        htmlFor="service-type-label"
                        className="block text-sm font-semibold text-stone-700 mb-2"
                      >
                        Nom du type <span className="text-rose-500">*</span>
                      </label>
                      <input
                        ref={inputRef}
                        id="service-type-label"
                        type="text"
                        value={formValues.label}
                        onChange={(e) => setFormValues({ ...formValues, label: e.target.value })}
                        required
                        disabled={!!editingType}
                        className={`${inputBase} ${editingType ? 'bg-stone-100 cursor-not-allowed' : ''}`}
                        placeholder="ex: Design"
                        autoComplete="off"
                      />
                      {editingType && (
                        <p className="text-xs text-stone-500 mt-2">
                          Le nom ne peut pas être modifié après création
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="service-type-phase"
                        className="block text-sm font-semibold text-stone-700 mb-2"
                      >
                        Phase par défaut
                      </label>
                      <select
                        id="service-type-phase"
                        value={formValues.defaultPhase}
                        onChange={(e) => setFormValues({ ...formValues, defaultPhase: e.target.value })}
                        className={inputBase}
                      >
                        {phaseOptions.map((opt) => (
                          <option key={opt.value || 'none'} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-stone-500 mt-2">
                        Phase suggérée automatiquement si non définie sur le timesheet
                      </p>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={busy || externalBusy}
                    className="px-4 py-2 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={busy || externalBusy || !formValues.label.trim()}
                    className="px-5 py-2 rounded-xl font-medium text-white bg-[#5B5781] hover:bg-[#4a4669] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
                  >
                    {busy ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Enregistrement...
                      </span>
                    ) : editingType ? (
                      'Enregistrer les modifications'
                    ) : (
                      'Créer le type'
                    )}
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

      <div className="space-y-2">
        {serviceTypes.length === 0 ? (
          <div className="p-8 text-center text-stone-500 rounded-xl border border-stone-200">
            Aucun type de prestation défini
          </div>
        ) : (
          serviceTypes.map((type) => (
            <div
              key={type.id}
              className="p-4 rounded-xl border border-stone-200 bg-white flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-semibold text-stone-900">{type.label}</div>
                  {type.defaultPhase && (
                    <div className="text-xs text-stone-500 mt-0.5">
                      Phase par défaut : {phaseOptions.find((o) => o.value === type.defaultPhase)?.label || type.defaultPhase}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(type)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(type)}
                  disabled={busy || externalBusy}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
