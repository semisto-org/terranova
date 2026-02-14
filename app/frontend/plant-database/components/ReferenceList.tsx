import type { Reference } from '../types'

interface ReferenceListProps {
  references: Reference[]
}

export function ReferenceList({ references }: ReferenceListProps) {
  if (references.length === 0) {
    return (
      <p className="text-sm text-stone-500 dark:text-stone-400 italic">
        Aucune référence disponible
      </p>
    )
  }

  const links = references.filter(r => r.type === 'link')
  const pdfs = references.filter(r => r.type === 'pdf')

  return (
    <div className="space-y-3">
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map(ref => (
            <a
              key={ref.id}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 group-hover:text-[#5B5781] dark:group-hover:text-[#a89ec4] transition-colors truncate">
                  {ref.title}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{ref.source}</p>
              </div>
              <svg className="w-4 h-4 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>
      )}

      {pdfs.length > 0 && (
        <div className="space-y-2">
          {pdfs.map(ref => (
            <a
              key={ref.id}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 group-hover:text-[#5B5781] dark:group-hover:text-[#a89ec4] transition-colors truncate">
                  {ref.title}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{ref.source} • PDF</p>
              </div>
              <svg className="w-4 h-4 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
