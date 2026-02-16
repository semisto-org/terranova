import { useState, useEffect, useRef } from 'react'
import { apiRequest } from '@/lib/api'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'
import type { EventTypeConfig } from '../types'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]'

export interface EventTypesAdminProps {
  busy?: boolean
}

export function EventTypesAdmin({ busy: externalBusy = false }: EventTypesAdminProps) {
  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingType, setEditingType] = useState<EventTypeConfig | null>(null)
  const [formValues, setFormValues] = useState({
    label: '',
  })
  const [deleteConfirm, setDeleteConfirm] = useState<{
    title: string
    message: string
    action: () => void
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadEventTypes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiRequest('/api/v1/lab/event-types')
      setEventTypes(response.items || [])
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des types')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEventTypes()
  }, [])

  const handleCreate = () => {
    setEditingType(null)
    setFormValues({
      label: '',
    })
    setError(null)
    setModalOpen(true)
  }

  const handleEdit = (type: EventTypeConfig) => {
    setEditingType(type)
    setFormValues({
      label: type.label,
    })
    setError(null)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingType(null)
    setFormValues({
      label: '',
    })
    setError(null)
  }

  // Focus input when modal opens
  useEffect(() => {
    if (modalOpen && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [modalOpen])

  // Handle Escape key
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
      if (editingType) {
        await apiRequest(`/api/v1/lab/event-types/${editingType.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formValues),
        })
      } else {
        await apiRequest('/api/v1/lab/event-types', {
          method: 'POST',
          body: JSON.stringify(formValues),
        })
      }
      await loadEventTypes()
      handleCloseModal()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = (type: EventTypeConfig) => {
    setDeleteConfirm({
      title: 'Supprimer ce type d\'événement ?',
      message: `Le type « ${type.label} » sera supprimé définitivement.`,
      action: async () => {
        setBusy(true)
        setError(null)
        try {
          await apiRequest(`/api/v1/lab/event-types/${type.id}`, {
            method: 'DELETE',
          })
          await loadEventTypes()
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
      <div className="p-8 text-center text-stone-500 dark:text-stone-400">
        Chargement des types d'événements...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'var(--font-heading)' }}>
            Types d'événements
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Gérez les types d'événements disponibles dans le calendrier
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

      {/* Modal */}
      {modalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleCloseModal}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="shrink-0 px-6 py-5 border-b border-stone-200 dark:border-stone-700 bg-gradient-to-br from-stone-50 to-white dark:from-stone-800 dark:to-stone-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'var(--font-heading)' }}>
                      {editingType ? 'Modifier le type' : 'Nouveau type d\'événement'}
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                      {editingType ? 'Modifiez les informations du type' : 'Créez un nouveau type d\'événement pour le calendrier'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="ml-4 p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    aria-label="Fermer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="flex flex-col min-h-0 h-full">
                <div className="flex-1 overflow-y-auto min-h-0 p-6">
                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm animate-in slide-in-from-top-2 duration-200">
                      {error}
                    </div>
                  )}

                  <div className="space-y-5">
                    <div>
                      <label
                        htmlFor="event-type-label"
                        className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2"
                      >
                        Nom du type <span className="text-rose-500">*</span>
                      </label>
                      <input
                        ref={inputRef}
                        id="event-type-label"
                        type="text"
                        value={formValues.label}
                        onChange={(e) => setFormValues({ ...formValues, label: e.target.value })}
                        required
                        disabled={!!editingType}
                        className={`${inputBase} ${editingType ? 'bg-stone-100 dark:bg-stone-800 cursor-not-allowed' : ''}`}
                        placeholder="ex: Réunion projet"
                        autoComplete="off"
                      />
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                        {editingType ? (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Le nom ne peut pas être modifié après création
                          </span>
                        ) : (
                          'Nom unique qui identifiera ce type d\'événement dans le calendrier'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 px-6 py-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={busy || externalBusy}
                    className="px-4 py-2 rounded-xl font-medium text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* List */}
      <div className="space-y-2">
        {eventTypes.length === 0 ? (
          <div className="p-8 text-center text-stone-500 dark:text-stone-400 rounded-xl border border-stone-200 dark:border-stone-700">
            Aucun type d'événement défini
          </div>
        ) : (
          eventTypes.map((type) => (
            <div
              key={type.id}
              className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-semibold text-stone-900 dark:text-stone-100">{type.label}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(type)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(type)}
                  disabled={busy || externalBusy}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60"
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
