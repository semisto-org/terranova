import React from 'react'
import { useShellContext } from './ShellContext'
import { getPoleFromPath } from './ContextSwitcher'

export default function MainNav() {
  const shell = useShellContext()
  const pole = getPoleFromPath(window.location.pathname)

  if (!shell || shell.sections.length === 0) return null

  return (
    <nav className="flex flex-col gap-0.5 px-3 py-3">
      <p className="px-2 pb-1.5 text-[11px] font-medium text-stone-400 uppercase tracking-wider">
        {pole.label}
      </p>
      {shell.sections.map((section) => {
        const isActive = section.id === shell.activeSection
        return (
          <button
            key={section.id}
            onClick={() => shell.handleSectionClick(section.id)}
            className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              isActive
                ? 'text-white'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
            style={isActive ? { backgroundColor: pole.accent } : undefined}
          >
            {section.label}
          </button>
        )
      })}
    </nav>
  )
}
