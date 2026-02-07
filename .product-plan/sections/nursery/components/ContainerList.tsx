import { useState, useMemo } from 'react'
import type { ContainerListProps, Container } from '../types'
import { ContainerForm } from './ContainerForm'

export function ContainerList({
  containers,
  onCreate,
  onEdit,
  onDelete,
  onReorder
}: ContainerListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Trier les contenants par sortOrder
  const sortedContainers = useMemo(() => {
    return [...containers].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [containers])

  const handleCreate = () => {
    setShowForm(true)
    setEditingId(null)
    onCreate?.()
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setShowForm(true)
    onEdit?.(id)
  }

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contenant ?')) {
      onDelete?.(id)
    }
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    
    const newContainers = [...sortedContainers]
    const temp = newContainers[index].sortOrder
    newContainers[index].sortOrder = newContainers[index - 1].sortOrder
    newContainers[index - 1].sortOrder = temp
    
    onReorder?.(newContainers)
  }

  const handleMoveDown = (index: number) => {
    if (index === sortedContainers.length - 1) return
    
    const newContainers = [...sortedContainers]
    const temp = newContainers[index].sortOrder
    newContainers[index].sortOrder = newContainers[index + 1].sortOrder
    newContainers[index + 1].sortOrder = temp
    
    onReorder?.(newContainers)
  }

  const handleFormSubmit = (containerData: Omit<Container, 'id'>) => {
    if (editingId) {
      const updatedContainers = sortedContainers.map(c =>
        c.id === editingId ? { ...c, ...containerData } : c
      )
      onReorder?.(updatedContainers)
    } else {
      // Pour la création, on devrait normalement avoir un callback onCreate avec les données
      // Pour l'instant, on ferme juste le formulaire
      onCreate?.()
    }
    setShowForm(false)
    setEditingId(null)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingId(null)
  }

  const editingContainer = editingId ? sortedContainers.find(c => c.id === editingId) : null

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-stone-900 dark:text-stone-100 mb-2">
            Configuration des contenants
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            Gérez les types de contenants disponibles pour les plants
          </p>
        </div>
        {!showForm && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-[#EF9B0D] hover:bg-[#d88a0c] text-white rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2 dark:focus:ring-offset-stone-800"
          >
            + Nouveau contenant
          </button>
        )}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-[#fbe6c3] dark:bg-stone-800/50 border border-[#EF9B0D]/20 dark:border-stone-700 rounded-lg p-6">
          <h2 className="text-xl font-serif text-stone-900 dark:text-stone-100 mb-4">
            {editingId ? 'Modifier le contenant' : 'Nouveau contenant'}
          </h2>
          <ContainerForm
            container={editingContainer || null}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      {/* Liste des contenants */}
      {!showForm && (
        <div className="space-y-3">
          {sortedContainers.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-700">
              <p className="text-stone-500 dark:text-stone-400">
                Aucun contenant configuré. Créez-en un pour commencer.
              </p>
            </div>
          ) : (
            sortedContainers.map((container, index) => (
              <div
                key={container.id}
                className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Indicateur d'ordre */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <div className="w-8 h-8 flex items-center justify-center rounded-md bg-[#EF9B0D]/10 dark:bg-[#EF9B0D]/20 text-[#EF9B0D] dark:text-[#EF9B0D] font-semibold text-sm">
                      {container.sortOrder}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-stone-400 hover:text-[#EF9B0D] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Déplacer vers le haut"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === sortedContainers.length - 1}
                        className="p-1 text-stone-400 hover:text-[#EF9B0D] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Déplacer vers le bas"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Informations du contenant */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                            {container.name}
                          </h3>
                          <span className="px-2 py-0.5 bg-[#EF9B0D]/10 dark:bg-[#EF9B0D]/20 text-[#EF9B0D] dark:text-[#EF9B0D] rounded text-sm font-medium">
                            {container.shortName}
                          </span>
                          {container.volumeLiters && (
                            <span className="text-sm text-stone-500 dark:text-stone-400">
                              {container.volumeLiters} L
                            </span>
                          )}
                        </div>
                        {container.description && (
                          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                            {container.description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(container.id)}
                          className="px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2 dark:focus:ring-offset-stone-800"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(container.id)}
                          className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-stone-800"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}


