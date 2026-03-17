import React, { useState, useRef, useEffect } from 'react'
import { Filter, X } from 'lucide-react'

const STATUS_LABELS = {
  idea: 'Idée',
  in_construction: 'En construction',
  in_preparation: 'En préparation',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  post_production: 'En post-prod',
  completed: 'Clôturée',
  cancelled: 'Annulée',
}

const STATUS_GROUPS = [
  { label: 'Idée', statuses: ['idea'] },
  { label: 'En construction', statuses: ['in_construction'] },
  { label: 'En préparation', statuses: ['in_preparation'] },
  { label: 'Inscriptions', statuses: ['registrations_open'] },
  { label: 'En cours', statuses: ['in_progress'] },
  { label: 'Post-prod', statuses: ['post_production'] },
  { label: 'Clôture', statuses: ['completed', 'cancelled'] },
]

const PERIOD_OPTIONS = [
  { id: 'all', label: 'Toutes periodes' },
  { id: 'next30', label: '30 prochains jours' },
  { id: 'next90', label: '90 prochains jours' },
  { id: 'past', label: 'Passees' },
  { id: 'undated', label: 'Sans date' },
]

const COMPLETENESS_OPTIONS = [
  { id: 'all', label: 'Toute completude' },
  { id: 'needs_work', label: 'A completer' },
  { id: 'almost_ready', label: 'Presque pret' },
  { id: 'ready', label: 'Pretes' },
]

export default function KanbanFilters({
  statusFilters,
  onStatusFiltersChange,
  periodFilter,
  onPeriodFilterChange,
  completenessFilter,
  onCompletenessFilterChange,
  typeFilter,
  onTypeFilterChange,
  trainingTypes = [],
  viewMode,
  onViewModeChange,
  showClosed,
  onShowClosedChange,
  resultCount,
}) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const popoverRef = useRef(null)

  useEffect(() => {
    if (!popoverOpen) return
    const handleClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setPopoverOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [popoverOpen])

  const activeFilterCount =
    statusFilters.length +
    (periodFilter !== 'all' ? 1 : 0) +
    (completenessFilter !== 'all' ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0)

  const handleStatusToggle = (status) => {
    if (statusFilters.includes(status)) {
      onStatusFiltersChange(statusFilters.filter((s) => s !== status))
    } else {
      onStatusFiltersChange([...statusFilters, status])
    }
  }

  const resetAll = () => {
    onStatusFiltersChange([])
    onPeriodFilterChange('all')
    onCompletenessFilterChange('all')
    onTypeFilterChange('all')
  }

  const chips = []
  statusFilters.forEach((s) => {
    chips.push({ label: STATUS_LABELS[s] || s, onRemove: () => handleStatusToggle(s) })
  })
  if (periodFilter !== 'all') {
    const p = PERIOD_OPTIONS.find((o) => o.id === periodFilter)
    chips.push({ label: p?.label || periodFilter, onRemove: () => onPeriodFilterChange('all') })
  }
  if (completenessFilter !== 'all') {
    const c = COMPLETENESS_OPTIONS.find((o) => o.id === completenessFilter)
    chips.push({ label: c?.label || completenessFilter, onRemove: () => onCompletenessFilterChange('all') })
  }
  if (typeFilter !== 'all') {
    const t = trainingTypes.find((tt) => tt.id === typeFilter)
    chips.push({ label: t?.name || 'Type', onRemove: () => onTypeFilterChange('all') })
  }

  return (
    <div className="space-y-2">
      {/* Toolbar row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter popover trigger */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setPopoverOpen(!popoverOpen)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              activeFilterCount > 0
                ? 'border-[#B01A19]/30 bg-[#B01A19]/5 text-[#8f1514]'
                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-[#B01A19] px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Popover */}
          {popoverOpen && (
            <div
              className="absolute left-0 top-full mt-2 z-40 w-80 rounded-xl border border-stone-200 bg-white shadow-2xl"
              style={{ animation: 'kanbanFilterSlideDown 0.2s ease-out' }}
            >
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Status */}
                <div>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Statut</p>
                  {STATUS_GROUPS.map((group) => (
                    <div key={group.label} className="mb-2">
                      <p className="text-[11px] font-semibold text-stone-400 mb-1">{group.label}</p>
                      <div className="flex flex-wrap gap-1">
                        {group.statuses.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => handleStatusToggle(status)}
                            className={`rounded-md px-2 py-1 text-[11px] font-medium border transition-all ${
                              statusFilters.includes(status)
                                ? 'border-[#B01A19]/30 bg-[#B01A19]/10 text-[#8f1514]'
                                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            {STATUS_LABELS[status]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Period */}
                <div>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Periode</p>
                  <div className="flex flex-wrap gap-1">
                    {PERIOD_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onPeriodFilterChange(opt.id)}
                        className={`rounded-md px-2 py-1 text-[11px] font-medium border transition-all ${
                          periodFilter === opt.id
                            ? 'border-[#B01A19]/30 bg-[#B01A19]/10 text-[#8f1514]'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Completeness */}
                <div>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Completude</p>
                  <div className="flex flex-wrap gap-1">
                    {COMPLETENESS_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onCompletenessFilterChange(opt.id)}
                        className={`rounded-md px-2 py-1 text-[11px] font-medium border transition-all ${
                          completenessFilter === opt.id
                            ? 'border-[#B01A19]/30 bg-[#B01A19]/10 text-[#8f1514]'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type */}
                {trainingTypes.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Type</p>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => onTypeFilterChange('all')}
                        className={`rounded-md px-2 py-1 text-[11px] font-medium border transition-all ${
                          typeFilter === 'all'
                            ? 'border-[#B01A19]/30 bg-[#B01A19]/10 text-[#8f1514]'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        Tous
                      </button>
                      {trainingTypes.map((tt) => (
                        <button
                          key={tt.id}
                          type="button"
                          onClick={() => onTypeFilterChange(tt.id)}
                          className={`rounded-md px-2 py-1 text-[11px] font-medium border transition-all ${
                            typeFilter === tt.id
                              ? 'border-[#B01A19]/30 bg-[#B01A19]/10 text-[#8f1514]'
                              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {tt.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reset */}
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetAll}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 transition-all"
                  >
                    Reinitialiser tous les filtres
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('kanban')}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
              viewMode === 'kanban'
                ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200'
                : 'text-stone-500 hover:text-stone-700'
            }`}
            title="Vue Kanban"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200'
                : 'text-stone-500 hover:text-stone-700'
            }`}
            title="Vue Liste"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Show closed toggle */}
        <button
          type="button"
          onClick={() => onShowClosedChange(!showClosed)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
            showClosed
              ? 'border-stone-400 bg-stone-100 text-stone-700'
              : 'border-stone-200 bg-white text-stone-400 hover:text-stone-600 hover:border-stone-300'
          }`}
          title={showClosed ? 'Masquer les activités terminees et annulees' : 'Afficher les activités terminees et annulees'}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          Historique
        </button>

      </div>

      {/* Active filter chips + result count */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-stone-400 font-medium">{resultCount} resultat{resultCount !== 1 ? 's' : ''}</span>
          {chips.map((chip, i) => (
            <span
              key={`${chip.label}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-[#B01A19]/20 bg-[#B01A19]/5 px-2.5 py-1 text-[11px] font-medium text-[#8f1514]"
            >
              {chip.label}
              <button type="button" onClick={chip.onRemove} className="hover:text-[#B01A19]">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {chips.length > 1 && (
            <button
              type="button"
              onClick={resetAll}
              className="text-[11px] text-stone-400 hover:text-stone-600 underline"
            >
              Tout effacer
            </button>
          )}
        </div>
      )}
    </div>
  )
}
