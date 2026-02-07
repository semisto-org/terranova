import { CheckSquare, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TrainingChecklistTabProps {
  checklistItems: string[]
  checkedItems: number[]
  onToggleChecklistItem?: (itemIndex: number) => void
  onAddChecklistItem?: (item: string) => void
  onRemoveChecklistItem?: (itemIndex: number) => void
}

export function TrainingChecklistTab({
  checklistItems,
  checkedItems,
  onToggleChecklistItem,
  onAddChecklistItem,
  onRemoveChecklistItem,
}: TrainingChecklistTabProps) {
  const [newItem, setNewItem] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const progress = checklistItems.length > 0
    ? Math.round((checkedItems.length / checklistItems.length) * 100)
    : 0

  const handleAddItem = () => {
    if (newItem.trim()) {
      onAddChecklistItem?.(newItem.trim())
      setNewItem('')
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Checklist
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Suivi des actions à effectuer
          </p>
        </div>
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Plus className="size-4" />
            <span className="ml-2">Ajouter une action</span>
          </Button>
        )}
      </div>

      {/* Progress */}
      {checklistItems.length > 0 && (
        <div className="bg-white dark:bg-stone-800/50 rounded-lg p-6 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
              Progression
            </span>
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {checkedItems.length} / {checklistItems.length}
            </span>
          </div>
          <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#B01A19] h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
            {progress}% complété
          </p>
        </div>
      )}

      {/* Checklist Items */}
      {checklistItems.length === 0 ? (
        <div className="bg-white dark:bg-stone-800/50 rounded-lg p-12 border border-stone-200 dark:border-stone-700 text-center">
          <CheckSquare className="size-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
          <p className="text-stone-500 dark:text-stone-400 mb-4">
            Aucune action dans la checklist
          </p>
          {!isAdding && (
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              size="sm"
            >
              <Plus className="size-4" />
              Ajouter une action
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {checklistItems.map((item, index) => {
            const isChecked = checkedItems.includes(index)

            return (
              <div
                key={index}
                className={`bg-white dark:bg-stone-800/50 rounded-lg p-4 border border-stone-200 dark:border-stone-700 transition-all ${
                  isChecked ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggleChecklistItem?.(index)}
                    className="mt-0.5 shrink-0"
                  >
                    {isChecked ? (
                      <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="size-5 text-stone-400" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-stone-900 dark:text-stone-100 ${
                        isChecked ? 'line-through' : ''
                      }`}
                    >
                      {item}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveChecklistItem?.(index)}
                    className="p-1 text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )
          })}
          
          {/* Add button at bottom of list */}
          {!isAdding && (
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              className="w-full mt-2"
            >
              <Plus className="size-4" />
              <span className="ml-2">Ajouter une action</span>
            </Button>
          )}
        </div>
      )}

      {/* Add Item Form - at bottom */}
      {isAdding && (
        <div className="bg-white dark:bg-stone-800/50 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
          <div className="flex gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Nouvelle action à effectuer..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem()
                } else if (e.key === 'Escape') {
                  setIsAdding(false)
                  setNewItem('')
                }
              }}
              autoFocus
            />
            <Button onClick={handleAddItem} size="sm">
              Ajouter
            </Button>
            <Button
              onClick={() => {
                setIsAdding(false)
                setNewItem('')
              }}
              variant="outline"
              size="sm"
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

