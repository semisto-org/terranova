import { useState } from 'react'
import type { IdeaList } from '../types'

interface IdeaListsProps {
  ideaLists: IdeaList[]
  onAddIdea?: (listId: string, title: string) => void
  onVoteIdea?: (listId: string, ideaId: string) => void
}

const listIcons: Record<string, { icon: string; color: string; bgColor: string }> = {
  Requests: {
    icon: '💬',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  Bugs: {
    icon: '🐛',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
  Ideas: {
    icon: '💡',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
}

export function IdeaLists({ ideaLists, onAddIdea, onVoteIdea }: IdeaListsProps) {
  const [activeListId, setActiveListId] = useState<string | null>(ideaLists[0]?.id || null)
  const [newIdeaText, setNewIdeaText] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const activeList = ideaLists.find((l) => l.id === activeListId)
  const listConfig = activeList ? listIcons[activeList.name] || listIcons.Ideas : null

  // Handle submit new idea
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeListId && newIdeaText.trim()) {
      onAddIdea?.(activeListId, newIdeaText.trim())
      setNewIdeaText('')
      setIsAdding(false)
    }
  }

  // Sort ideas by votes (descending)
  const sortedItems = [...(activeList?.items || [])].sort((a, b) => b.votes - a.votes)

  return (
    <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
      {/* List tabs */}
      <div className="flex border-b border-stone-200 dark:border-stone-700">
        {ideaLists.map((list) => {
          const config = listIcons[list.name] || listIcons.Ideas
          const isActive = list.id === activeListId

          return (
            <button
              key={list.id}
              onClick={() => setActiveListId(list.id)}
              className={`
                relative flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all
                ${
                  isActive
                    ? 'text-stone-800 dark:text-stone-100'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                }
              `}
            >
              <span>{config.icon}</span>
              <span className="hidden sm:inline">{list.name}</span>
              <span
                className={`
                  min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full
                  ${isActive ? config.bgColor + ' ' + config.color : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'}
                `}
              >
                {list.items.length}
              </span>

              {/* Active indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-800 dark:bg-stone-100" />
              )}
            </button>
          )
        })}
      </div>

      {/* List content */}
      <div className="p-4">
        {activeList && (
          <>
            {/* Description */}
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
              {activeList.description}
            </p>

            {/* Add idea button/form */}
            {!isAdding ? (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full mb-4 px-4 py-2.5 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                + Ajouter une idée
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIdeaText}
                    onChange={(e) => setNewIdeaText(e.target.value)}
                    placeholder="Décrivez votre idée..."
                    autoFocus
                    className="flex-1 px-3 py-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-[#5B5781] focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!newIdeaText.trim()}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${
                        newIdeaText.trim()
                          ? 'bg-[#5B5781] hover:bg-[#4a4670] text-white'
                          : 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                      }
                    `}
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false)
                      setNewIdeaText('')
                    }}
                    className="px-3 py-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}

            {/* Ideas list */}
            {sortedItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">{listConfig?.icon}</div>
                <p className="text-stone-400 dark:text-stone-500 text-sm">
                  Aucune idée dans cette liste
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg transition-colors
                      ${index === 0 && item.votes > 0 ? listConfig?.bgColor : 'hover:bg-stone-50 dark:hover:bg-stone-800'}
                    `}
                  >
                    {/* Vote button */}
                    <button
                      onClick={() => onVoteIdea?.(activeList.id, item.id)}
                      className={`
                        flex flex-col items-center justify-center min-w-[44px] py-1.5 rounded-lg transition-all
                        ${
                          item.votes > 0
                            ? 'bg-[#5B5781]/10 hover:bg-[#5B5781]/20 text-[#5B5781] dark:bg-[#5B5781]/30 dark:hover:bg-[#5B5781]/40 dark:text-[#c8bfd2]'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-500 dark:bg-stone-700 dark:hover:bg-stone-600 dark:text-stone-400'
                        }
                      `}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                      <span className="text-xs font-bold">{item.votes}</span>
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${index === 0 && item.votes > 0 ? 'font-medium text-stone-800 dark:text-stone-100' : 'text-stone-600 dark:text-stone-300'}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                        {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>

                    {/* Trophy for top voted */}
                    {index === 0 && item.votes > 0 && (
                      <span className="text-lg" title="Idée la plus votée">
                        🏆
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
