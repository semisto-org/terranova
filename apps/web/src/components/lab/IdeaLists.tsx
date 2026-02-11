'use client'

import { useState } from 'react'
import type { IdeaList } from '@terranova/types'
import { addIdea, voteIdea } from '@/actions/lab-management'

interface IdeaListsProps {
  ideaLists: IdeaList[]
  currentMemberId: string
  onRefresh?: () => void
}

export function IdeaLists({
  ideaLists,
  currentMemberId,
  onRefresh,
}: IdeaListsProps) {
  const [newIdeaTitles, setNewIdeaTitles] = useState<Record<string, string>>({})
  const [submittingIdea, setSubmittingIdea] = useState<string | null>(null)
  const [votingIdea, setVotingIdea] = useState<string | null>(null)

  const handleAddIdea = async (listId: string) => {
    const title = newIdeaTitles[listId]?.trim()
    if (!title) return

    setSubmittingIdea(listId)
    try {
      await addIdea(listId, title)
      setNewIdeaTitles({ ...newIdeaTitles, [listId]: '' })
      onRefresh?.()
    } catch (error) {
      alert('Error adding idea: ' + (error as Error).message)
    } finally {
      setSubmittingIdea(null)
    }
  }

  const handleVoteIdea = async (ideaId: string) => {
    setVotingIdea(ideaId)
    try {
      await voteIdea(ideaId)
      onRefresh?.()
    } catch (error) {
      alert('Error voting: ' + (error as Error).message)
    } finally {
      setVotingIdea(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Idea Lists</h2>
        <p className="text-sm text-gray-500">
          Vote for ideas you'd like to see
        </p>
      </div>

      {ideaLists.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-500">No idea lists yet</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {ideaLists.map((list) => (
            <div
              key={list.id}
              className="rounded-lg border border-gray-200 bg-white shadow-sm"
            >
              {/* Header */}
              <div className="border-b border-gray-200 px-4 py-3">
                <h3 className="font-semibold text-gray-900">{list.name}</h3>
                {list.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {list.description}
                  </p>
                )}
              </div>

              {/* Ideas */}
              <div className="divide-y divide-gray-200">
                {list.items
                  .sort((a, b) => b.votes - a.votes)
                  .map((idea) => (
                    <div
                      key={idea.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{idea.title}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(idea.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>

                      <button
                        onClick={() => handleVoteIdea(idea.id)}
                        disabled={votingIdea === idea.id}
                        className="ml-3 flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span>👍</span>
                        <span>{idea.votes}</span>
                      </button>
                    </div>
                  ))}
              </div>

              {/* Add Idea Form */}
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleAddIdea(list.id)
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={newIdeaTitles[list.id] || ''}
                    onChange={(e) =>
                      setNewIdeaTitles({
                        ...newIdeaTitles,
                        [list.id]: e.target.value,
                      })
                    }
                    placeholder="Add a new idea..."
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={
                      submittingIdea === list.id ||
                      !newIdeaTitles[list.id]?.trim()
                    }
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submittingIdea === list.id ? 'Adding...' : 'Add'}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
