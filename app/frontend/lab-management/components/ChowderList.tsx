import type { ChowderItem, Member } from '../types'

interface ChowderListProps {
  items: ChowderItem[]
  members: Member[]
  onMoveToScope?: (itemId: string) => void
  onDelete?: (itemId: string) => void
  onAdd?: () => void
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

export function ChowderList({ items, members, onMoveToScope, onDelete, onAdd }: ChowderListProps) {
  const getMember = (memberId: string) => members.find((m) => m.id === memberId)

  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-amber-100/50 border-b border-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍲</span>
            <h3 className="font-semibold text-amber-800">Chowder</h3>
            <span className="text-xs text-amber-600 bg-amber-200/50 px-1.5 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          {onAdd && (
            <button
              onClick={onAdd}
              className="text-xs text-amber-700 hover:text-amber-900 font-medium transition-colors"
            >
              + Ajouter
            </button>
          )}
        </div>
        <p className="text-xs text-amber-600 mt-1">
          Tâches découvertes en cours de route, pas encore assignées à un scope
        </p>
      </div>

      {/* Items list */}
      <div className="p-2">
        {items.length === 0 ? (
          <p className="text-sm text-amber-600/70 text-center py-4">
            Aucune tâche dans le chowder
          </p>
        ) : (
          <div className="space-y-1">
            {items.map((item) => {
              const creator = getMember(item.createdBy)
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/50 hover:bg-white transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-amber-500">•</span>
                    <span className="text-sm text-stone-700 truncate">
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {creator && (
                      <img
                        src={creator.avatar}
                        alt={creator.firstName}
                        className="w-5 h-5 rounded-full opacity-60"
                        title={`Ajouté par ${creator.firstName} ${creator.lastName}`}
                      />
                    )}
                    <span className="text-[10px] text-stone-400">
                      {formatDate(item.createdAt)}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onMoveToScope && (
                        <button
                          onClick={() => onMoveToScope(item.id)}
                          className="p-1 text-stone-400 hover:text-[#5B5781] transition-colors"
                          title="Déplacer vers un scope"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
