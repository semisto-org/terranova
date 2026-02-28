import { Filter } from 'lucide-react'
import type { EconomicsFilters } from './types'

interface EconomicsFilterBarProps {
  filters: EconomicsFilters
  projects: Array<{ id: string; name: string }>
  onFilterChange: (key: keyof EconomicsFilters, value: string) => void
}

export function EconomicsFilterBar({ filters, projects, onFilterChange }: EconomicsFilterBarProps) {
  const hasActiveFilter = filters.from || filters.to || filters.design_project_id

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-stone-500">
        <Filter className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wider">Filtres</span>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-xs text-stone-500">Du</label>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => onFilterChange('from', e.target.value)}
          className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-xs text-stone-500">Au</label>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => onFilterChange('to', e.target.value)}
          className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40 focus:border-transparent"
        />
      </div>

      <select
        value={filters.design_project_id}
        onChange={(e) => onFilterChange('design_project_id', e.target.value)}
        className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40 focus:border-transparent"
      >
        <option value="">Tous les projets</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {hasActiveFilter && (
        <button
          type="button"
          onClick={() => {
            onFilterChange('from', '')
            onFilterChange('to', '')
            onFilterChange('design_project_id', '')
          }}
          className="text-xs text-stone-500 hover:text-stone-700 underline underline-offset-2 transition-colors"
        >
          Réinitialiser
        </button>
      )}
    </div>
  )
}
