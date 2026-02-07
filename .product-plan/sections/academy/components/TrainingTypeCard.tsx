import type { TrainingType } from '../types'
import { Image as ImageIcon, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface TrainingTypeCardProps {
  trainingType: TrainingType
  onView?: (trainingTypeId: string) => void
  onEdit?: (trainingTypeId: string) => void
  onDelete?: (trainingTypeId: string) => void
}

export function TrainingTypeCard({
  trainingType,
  onView,
  onEdit,
  onDelete,
}: TrainingTypeCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [imageError, setImageError] = useState<number[]>([])

  return (
    <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden hover:shadow-md transition-shadow">
      {/* Photo gallery header */}
      {trainingType.photoGallery.length > 0 && (
        <div className="relative h-48 bg-stone-100 dark:bg-stone-800 overflow-hidden">
          <div className="flex h-full">
            {trainingType.photoGallery.slice(0, 3).map((photoUrl, index) => (
              <div
                key={index}
                className={`flex-1 ${index < trainingType.photoGallery.slice(0, 3).length - 1 ? 'border-r border-stone-200 dark:border-stone-700' : ''}`}
              >
                {imageError.includes(index) ? (
                  <div className="w-full h-full flex items-center justify-center bg-stone-200 dark:bg-stone-700">
                    <ImageIcon className="w-8 h-8 text-stone-400 dark:text-stone-500" />
                  </div>
                ) : (
                  <img
                    src={photoUrl}
                    alt={`${trainingType.name} - Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => setImageError([...imageError, index])}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-lg flex-1">
            {trainingType.name}
          </h3>
          <div className="relative ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-stone-400" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-20 w-40 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 shadow-lg py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onView?.(trainingType.id)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Voir
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onEdit?.(trainingType.id)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onDelete?.(trainingType.id)
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
      </div>
    </div>
  )
}

