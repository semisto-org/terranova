import type { AcademyProps } from '../types'
import { Plus, Search, Eye, Edit, Trash2, Image as ImageIcon, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'

export function TrainingTypeList({
  trainingTypes,
  members,
  onCreateTrainingType,
  onViewTrainingType,
  onEditTrainingType,
  onDeleteTrainingType,
}: AcademyProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Filter training types by search query
  const filteredTypes = trainingTypes.filter((type) =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Helper to get trainers for a training type
  const getTrainers = (trainerIds: string[]) => {
    return members.filter(m => trainerIds.includes(m.id))
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
              Types de formation
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              Gérez les types de formations réutilisables avec leurs templates de checklist et galeries photos
            </p>
          </div>
          <button
            onClick={() => onCreateTrainingType?.()}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#B01A19] hover:bg-[#B01A19]/90 rounded-lg transition-colors w-full md:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau type</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher un type de formation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/20 focus:border-[#B01A19]"
          />
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className="mb-4 text-sm text-stone-600 dark:text-stone-400">
          {filteredTypes.length} type{filteredTypes.length !== 1 ? 's' : ''} trouvé{filteredTypes.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Training types table */}
      {filteredTypes.length > 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 overflow-visible">
          <div className="md:overflow-x-auto">
            <Table className="w-full">
            <TableBody>
              {filteredTypes.map((trainingType, index) => {
                const isLastRow = index === filteredTypes.length - 1
                const isFirstRow = index === 0
                return (
                  <TableRow key={trainingType.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                    {/* Photo - masquée sur mobile */}
                    <TableCell className="hidden md:table-cell">
                      {trainingType.photoGallery.length > 0 ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center">
                          <img
                            src={trainingType.photoGallery[0]}
                            alt={trainingType.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent && !parent.querySelector('svg')) {
                                const icon = document.createElement('div')
                                icon.innerHTML = '<svg class="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>'
                                parent.appendChild(icon)
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-stone-400 dark:text-stone-500" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="min-w-0">
                      <div className="font-medium text-stone-900 dark:text-stone-100 break-words">
                        {trainingType.name}
                      </div>
                      {/* Avatars sous le nom sur mobile */}
                      {trainingType.trainerIds.length > 0 && (
                        <div className="flex -space-x-2 mt-2 md:hidden">
                          {getTrainers(trainingType.trainerIds).slice(0, 4).map((trainer) => (
                            <div key={trainer.id} className="relative group">
                              <img
                                src={trainer.avatar}
                                alt={`${trainer.firstName} ${trainer.lastName}`}
                                className="w-8 h-8 rounded-full border-2 border-white dark:border-stone-900 bg-stone-100"
                              />
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                <div className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                  {trainer.firstName} {trainer.lastName}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-stone-900 dark:border-t-stone-100"></div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {trainingType.trainerIds.length > 4 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-stone-900 bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-medium text-stone-600 dark:text-stone-300">
                              +{trainingType.trainerIds.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    {/* Avatars dans colonne séparée sur desktop */}
                    <TableCell className="hidden md:table-cell">
                      {trainingType.trainerIds.length > 0 ? (
                        <div className="flex -space-x-2">
                          {getTrainers(trainingType.trainerIds).slice(0, 4).map((trainer) => (
                            <div key={trainer.id} className="relative group">
                              <img
                                src={trainer.avatar}
                                alt={`${trainer.firstName} ${trainer.lastName}`}
                                className="w-8 h-8 rounded-full border-2 border-white dark:border-stone-900 bg-stone-100"
                              />
                              {/* Tooltip - affiche vers le bas pour la première ligne, vers le haut pour les autres */}
                              <div className={`absolute left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 ${
                                isFirstRow ? 'top-full mt-2' : 'bottom-full mb-2'
                              }`}>
                                <div className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                  {trainer.firstName} {trainer.lastName}
                                  <div className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 ${
                                    isFirstRow 
                                      ? 'bottom-full border-b-4 border-transparent border-b-stone-900 dark:border-b-stone-100' 
                                      : 'top-full border-t-4 border-transparent border-t-stone-900 dark:border-t-stone-100'
                                  }`}></div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {trainingType.trainerIds.length > 4 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-stone-900 bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-medium text-stone-600 dark:text-stone-300">
                              +{trainingType.trainerIds.length - 4}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-stone-400 dark:text-stone-500">Aucun formateur</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === trainingType.id ? null : trainingType.id)}
                            className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-stone-400" />
                          </button>
                          {openMenuId === trainingType.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className={`absolute right-0 z-20 w-40 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 shadow-lg py-1 ${
                                isLastRow ? 'bottom-8' : 'top-8'
                              }`}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenMenuId(null)
                                    onViewTrainingType?.(trainingType.id)
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  Voir
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenMenuId(null)
                                    onEditTrainingType?.(trainingType.id)
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  Modifier
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenMenuId(null)
                                    onDeleteTrainingType?.(trainingType.id)
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Supprimer
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-1">
            {searchQuery ? 'Aucun type trouvé' : 'Aucun type de formation'}
          </h3>
          <p className="text-stone-500 dark:text-stone-400 max-w-sm mb-4">
            {searchQuery
              ? 'Aucun type de formation ne correspond à votre recherche. Essayez d\'autres mots-clés.'
              : 'Commencez par créer votre premier type de formation avec son template de checklist et sa galerie photos.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => onCreateTrainingType?.()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#B01A19] hover:bg-[#B01A19]/90 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer un type de formation
            </button>
          )}
        </div>
      )}
    </div>
  )
}

