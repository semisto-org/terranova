import { useState, useEffect } from 'react'
import type { Container } from '../types'

interface ContainerFormProps {
  container?: Container | null
  onSubmit: (container: Omit<Container, 'id'>) => void
  onCancel: () => void
}

export function ContainerForm({ container, onSubmit, onCancel }: ContainerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    volumeLiters: '',
    description: '',
    sortOrder: 1
  })

  useEffect(() => {
    if (container) {
      setFormData({
        name: container.name,
        shortName: container.shortName,
        volumeLiters: container.volumeLiters?.toString() || '',
        description: container.description || '',
        sortOrder: container.sortOrder
      })
    } else {
      setFormData({
        name: '',
        shortName: '',
        volumeLiters: '',
        description: '',
        sortOrder: 1
      })
    }
  }, [container])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name: formData.name,
      shortName: formData.shortName,
      volumeLiters: formData.volumeLiters ? parseFloat(formData.volumeLiters) : undefined,
      description: formData.description || undefined,
      sortOrder: formData.sortOrder
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-300">
          Nom complet *
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
          placeholder="Ex: Pot 1 litre"
        />
      </div>

      <div>
        <label htmlFor="shortName" className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-300">
          Nom court *
        </label>
        <input
          type="text"
          id="shortName"
          required
          value={formData.shortName}
          onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
          className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
          placeholder="Ex: P1L"
        />
      </div>

      <div>
        <label htmlFor="volumeLiters" className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-300">
          Volume (litres)
        </label>
        <input
          type="number"
          id="volumeLiters"
          min="0"
          step="0.1"
          value={formData.volumeLiters}
          onChange={(e) => setFormData({ ...formData, volumeLiters: e.target.value })}
          className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
          placeholder="Ex: 1"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-300">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent resize-none"
          placeholder="Description du contenant..."
        />
      </div>

      <div>
        <label htmlFor="sortOrder" className="block text-sm font-medium mb-1.5 text-stone-700 dark:text-stone-300">
          Ordre d'affichage *
        </label>
        <input
          type="number"
          id="sortOrder"
          required
          min="1"
          value={formData.sortOrder}
          onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
          className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-[#EF9B0D] hover:bg-[#d88a0c] text-white rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2 dark:focus:ring-offset-stone-800"
        >
          {container ? 'Modifier' : 'Créer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 dark:focus:ring-offset-stone-800"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}


