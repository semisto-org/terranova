import React, { useState } from 'react'
import { CheckSquare, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'

export default function TrainingChecklistTab({
  checklistItems = [],
  checkedItems = [],
  onToggleChecklistItem,
  onAddChecklistItem,
  onRemoveChecklistItem,
}) {
  const [newItem, setNewItem] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const progress =
    checklistItems.length > 0
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Checklist</h3>
          <p className="text-sm text-stone-500 mt-1">Suivi des actions à effectuer</p>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Ajouter une action
          </button>
        )}
      </div>

      {checklistItems.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-900">Progression</span>
            <span className="text-sm text-stone-500">
              {checkedItems.length} / {checklistItems.length}
            </span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#B01A19] h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-stone-500 mt-2">{progress}% complété</p>
        </div>
      )}

      {checklistItems.length === 0 ? (
        <div className="bg-white rounded-lg p-12 border border-stone-200 text-center">
          <CheckSquare className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 mb-4">Aucune action dans la checklist</p>
          {!isAdding && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              <Plus className="w-4 h-4" />
              Ajouter une action
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {checklistItems.map((item, index) => {
            const isChecked = checkedItems.includes(index)

            return (
              <div
                key={`${item}-${index}`}
                className={`bg-white rounded-lg p-4 border border-stone-200 transition-all ${
                  isChecked ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleChecklistItem?.(index)}
                    className="mt-0.5 shrink-0 rounded p-0.5 hover:bg-stone-100"
                  >
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-400" />
                    )}
                  </button>
                  <p
                    className={`flex-1 min-w-0 text-stone-900 ${
                      isChecked ? 'line-through' : ''
                    }`}
                  >
                    {item}
                  </p>
                  <button
                    type="button"
                    onClick={() => onRemoveChecklistItem?.(index)}
                    className="p-1 text-stone-400 hover:text-red-600 transition-colors shrink-0 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}

          {!isAdding && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              <Plus className="w-4 h-4" />
              Ajouter une action
            </button>
          )}
        </div>
      )}

      {isAdding && (
        <div className="bg-white rounded-lg p-4 border border-stone-200">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Nouvelle action à effectuer..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem()
                if (e.key === 'Escape') {
                  setIsAdding(false)
                  setNewItem('')
                }
              }}
              className="flex-1 min-w-[200px] rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-[#B01A19] focus:ring-2 focus:ring-[#B01A19]/10 outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddItem}
              className="rounded-lg bg-[#B01A19] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1514]"
            >
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false)
                setNewItem('')
              }}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
