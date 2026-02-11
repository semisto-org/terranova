import type { NavItem } from './AppShell'

interface MainNavProps {
  items: NavItem[]
  poleColor: string
  onNavigate?: (href: string) => void
}

// Convert hex to rgba for transparency
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function MainNav({ items, poleColor, onNavigate }: MainNavProps) {
  return (
    <nav className="p-3">
      <ul className="space-y-1">
        {items.map(item => (
          <li key={item.href}>
            <button
              onClick={() => onNavigate?.(item.href)}
              className={`group relative w-full flex items-center px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                item.isActive
                  ? 'font-medium'
                  : 'hover:bg-stone-100/60 dark:hover:bg-stone-800/50'
              }`}
              style={item.isActive ? {
                backgroundColor: hexToRgba(poleColor, 0.12),
              } : undefined}
            >
              {/* Active indicator bar */}
              {item.isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full transition-all duration-150"
                  style={{ backgroundColor: poleColor }}
                />
              )}

              <span
                className={`transition-colors duration-150 ${
                  item.isActive
                    ? 'text-stone-900 dark:text-stone-100'
                    : 'text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200'
                }`}
                style={item.isActive ? { color: poleColor } : undefined}
              >
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
