import type { FilterOptions, SearchFilters } from '../types'

interface FilterPanelProps {
  filterOptions: FilterOptions
  filters: SearchFilters
  showAdvanced: boolean
  onShowAdvancedChange: (show: boolean) => void
  onFilterChange: (key: keyof SearchFilters, value: string[]) => void
}

interface FilterChipGroupProps {
  label: string
  options: { id: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  icon?: React.ReactNode
}

function FilterChipGroup({ label, options, selected, onChange, icon }: FilterChipGroupProps) {
  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
        {icon}
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.id)
          return (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                isSelected
                  ? 'bg-[#5B5781] text-white shadow-md shadow-[#5B5781]/20'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function FilterPanel({
  filterOptions,
  filters,
  showAdvanced,
  onShowAdvancedChange,
  onFilterChange,
}: FilterPanelProps) {
  return (
    <div className="mt-4 p-5 bg-white rounded-2xl shadow-lg border border-stone-200/50 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Primary Filters */}
      <div className="space-y-5">
        {/* Type */}
        <FilterChipGroup
          label="Type"
          options={filterOptions.types}
          selected={filters.types}
          onChange={(value) => onFilterChange('types', value)}
          icon={
            <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          }
        />

        {/* Exposure */}
        <FilterChipGroup
          label="Exposition"
          options={filterOptions.exposures}
          selected={filters.exposures}
          onChange={(value) => onFilterChange('exposures', value)}
          icon={
            <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />

        {/* Hardiness */}
        <FilterChipGroup
          label="Rusticité"
          options={filterOptions.hardinessZones}
          selected={filters.hardinessZones}
          onChange={(value) => onFilterChange('hardinessZones', value)}
          icon={
            <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          }
        />
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => onShowAdvancedChange(!showAdvanced)}
        className="w-full mt-5 pt-4 border-t border-stone-200 flex items-center justify-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
      >
        {showAdvanced ? 'Moins de filtres' : 'Plus de filtres'}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-5 pt-5 border-t border-stone-200 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Edible Parts */}
          <FilterChipGroup
            label="Parties comestibles"
            options={filterOptions.edibleParts}
            selected={filters.edibleParts}
            onChange={(value) => onFilterChange('edibleParts', value)}
            icon={
              <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          {/* Interests */}
          <FilterChipGroup
            label="Intérêts"
            options={filterOptions.interests}
            selected={filters.interests}
            onChange={(value) => onFilterChange('interests', value)}
            icon={
              <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
          />

          {/* Native Countries */}
          <FilterChipGroup
            label="Indigène"
            options={filterOptions.europeanCountries.slice(0, 10)}
            selected={filters.nativeCountries}
            onChange={(value) => onFilterChange('nativeCountries', value)}
            icon={
              <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          {/* Soil Types */}
          <FilterChipGroup
            label="Type de sol"
            options={filterOptions.soilTypes}
            selected={filters.soilTypes}
            onChange={(value) => onFilterChange('soilTypes', value)}
            icon={
              <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />

          {/* Soil Moisture */}
          <FilterChipGroup
            label="Humidité du sol"
            options={filterOptions.soilMoistures}
            selected={filters.soilMoisture}
            onChange={(value) => onFilterChange('soilMoisture', value)}
            icon={
              <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            }
          />

          {/* Watering Needs */}
          <FilterChipGroup
            label="Besoins en arrosage"
            options={filterOptions.wateringNeeds}
            selected={filters.wateringNeed}
            onChange={(value) => onFilterChange('wateringNeed', value)}
            icon={
              <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            }
          />
        </div>
      )}
    </div>
  )
}
