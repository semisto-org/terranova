'use client'

import { useState } from 'react'
import type { ChowderItem, Scope } from '@terranova/types'
import { addChowderItem, moveChowderToScope } from '@/actions/lab-management'

interface ChowderListProps {
  pitchId: string
  chowderItems: ChowderItem[]
  scopes: Scope[]
  onRefresh?: () => void
}

export function ChowderList({
  pitchId,
  chowderItems,
  scopes,
  onRefresh,
}: ChowderListProps) {
  const [newItemTitle, setNewItemTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [movingItem, setMovingItem] = useState<string | null>(null)
  const [selectedScope, setSelectedScope] = useState<Record<string, string>>({})

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return

    setIsAdding(true)
    try {
      await addChowderItem(pitchId, newItemTitle)
      setNewItemTitle('')
      onRefresh?.()
    } catch (error) {
      alert('Error adding chowder item: ' + (error as Error).message)
    } finally {
      setIsAdding(false)
    }
  }

  const handleMoveToScope = async (itemId: string) => {
    const scopeId = selectedScope[itemId]
    if (!scopeId) return

    setMovingItem(itemId)
    try {
      await moveChowderToScope(itemId, scopeId)
      onRefresh?.()
    } catch (error) {
      alert('Error moving to scope: ' + (error as Error).message)
    } finally {
      setMovingItem(null)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="font-semibold text-gray-900">Chowder List</h3>
        <p className="mt-1 text-sm text-gray-500">
          Imagined tasks that don't fit in a scope yet
        </p>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-200">
        {chowderItems.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No chowder items yet
          </div>
        ) : (
          chowderItems.map((item) => (
            <div key={item.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {scopes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedScope[item.id] || ''}
                      onChange={(e) =>
                        setSelectedScope({
                          ...selectedScope,
                          [item.id]: e.target.value,
                        })
                      }
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Move to scope...</option>
                      {scopes.map((scope) => (
                        <option key={scope.id} value={scope.id}>
                          {scope.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleMoveToScope(item.id)}
                      disabled={
                        movingItem === item.id || !selectedScope[item.id]
                      }
                      className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {movingItem === item.id ? 'Moving...' : 'Move'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Item Form */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAddItem()
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Add a chowder item..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isAdding || !newItemTitle.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isAdding ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>
    </div>
  )
}
