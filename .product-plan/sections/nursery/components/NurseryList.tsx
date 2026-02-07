import { Plus, Filter } from 'lucide-react'
import { NurseryCard } from './NurseryCard'
import type { NurseryListProps } from '../types'

export function NurseryList({
  nurseries,
  onView,
  onCreate,
  onEdit,
  onDelete,
}: NurseryListProps) {
  // Séparer les pépinières par type d'intégration pour mise en évidence
  const platformNurseries = nurseries.filter(n => n.integration === 'platform')
  const manualNurseries = nurseries.filter(n => n.integration === 'manual')

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* En-tête avec titre et actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50 mb-2">
            Pépinières partenaires
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            Gérez le réseau de pépinières Semisto et partenaires labellisées
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            <Filter className="w-4 h-4" />
            Filtrer
          </button>
          <button
            onClick={onCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#EF9B0D] hover:bg-[#EF9B0D]/90 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter une pépinière
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-4">
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-50">
            {nurseries.length}
          </div>
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Pépinières totales
          </div>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-4">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {platformNurseries.length}
          </div>
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Avec plateforme
          </div>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-4">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {manualNurseries.length}
          </div>
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Gestion manuelle
          </div>
        </div>
      </div>

      {/* Section Pépinières avec plateforme */}
      {platformNurseries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent dark:via-emerald-700" />
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Pépinières avec plateforme
              <span className="text-sm font-normal text-stone-500 dark:text-stone-500">
                ({platformNurseries.length})
              </span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent dark:via-emerald-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformNurseries.map(nursery => (
              <NurseryCard
                key={nursery.id}
                nursery={nursery}
                onView={() => onView?.(nursery.id)}
                onEdit={() => onEdit?.(nursery.id)}
                onDelete={() => onDelete?.(nursery.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section Pépinières avec gestion manuelle */}
      {manualNurseries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent dark:via-amber-700" />
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Pépinières avec gestion manuelle
              <span className="text-sm font-normal text-stone-500 dark:text-stone-500">
                ({manualNurseries.length})
              </span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent dark:via-amber-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {manualNurseries.map(nursery => (
              <NurseryCard
                key={nursery.id}
                nursery={nursery}
                onView={() => onView?.(nursery.id)}
                onEdit={() => onEdit?.(nursery.id)}
                onDelete={() => onDelete?.(nursery.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* État vide */}
      {nurseries.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <Plus className="w-8 h-8 text-stone-400 dark:text-stone-500" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-2">
              Aucune pépinière
            </h3>
            <p className="text-stone-600 dark:text-stone-400 mb-6">
              Commencez par ajouter votre première pépinière au réseau
            </p>
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#EF9B0D] hover:bg-[#EF9B0D]/90 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter une pépinière
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


