import { useState } from 'react'
import { BarChart3, ArrowDownCircle, ArrowUpCircle, Clock, Percent } from 'lucide-react'
import type { EconomicInput, EconomicOutput, EconomicsDashboard, EconomicsFilters, EconomicsActions } from './types'
import { EconomicsFilterBar } from './EconomicsFilterBar'
import { EconomicsDashboardView } from './EconomicsDashboardView'
import { InputsTable } from './InputsTable'
import { OutputsTable } from './OutputsTable'
import { LaborHoursView } from './LaborHoursView'
import { InputFormModal } from './InputFormModal'
import { OutputFormModal } from './OutputFormModal'
import { AsblRateDashboard } from './AsblRateDashboard'

const SUB_TABS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
  { id: 'inputs', label: 'Coûts', icon: ArrowDownCircle },
  { id: 'outputs', label: 'Revenus', icon: ArrowUpCircle },
  { id: 'labor', label: 'Heures de travail', icon: Clock },
  { id: 'asbl', label: 'Taux ASBL', icon: Percent },
] as const

type SubTab = typeof SUB_TABS[number]['id']

interface EconomicsSectionProps {
  dashboard: EconomicsDashboard | null
  inputs: EconomicInput[]
  outputs: EconomicOutput[]
  filters: EconomicsFilters
  projects: Array<{ id: string; name: string }>
  busy: boolean
  actions: EconomicsActions
}

export function EconomicsSection({
  dashboard,
  inputs,
  outputs,
  filters,
  projects,
  busy,
  actions,
}: EconomicsSectionProps) {
  const [activeTab, setActiveTab] = useState<SubTab>('dashboard')

  // Input modal state
  const [inputModal, setInputModal] = useState<{ open: boolean; editing: EconomicInput | null; presetLabor: boolean }>({
    open: false,
    editing: null,
    presetLabor: false,
  })

  // Output modal state
  const [outputModal, setOutputModal] = useState<{ open: boolean; editing: EconomicOutput | null }>({
    open: false,
    editing: null,
  })

  const handleSaveInput = async (values: Record<string, unknown>) => {
    const payload = { ...values }
    if (!inputModal.editing && filters.design_project_id) {
      payload.design_project_id = filters.design_project_id
    }
    if (inputModal.editing) {
      await actions.onUpdateInput(inputModal.editing.id, payload)
    } else {
      await actions.onCreateInput(payload)
    }
    setInputModal({ open: false, editing: null, presetLabor: false })
  }

  const handleSaveOutput = async (values: Record<string, unknown>) => {
    const payload = { ...values }
    if (!outputModal.editing && filters.design_project_id) {
      payload.design_project_id = filters.design_project_id
    }
    if (outputModal.editing) {
      await actions.onUpdateOutput(outputModal.editing.id, payload)
    } else {
      await actions.onCreateOutput(payload)
    }
    setOutputModal({ open: false, editing: null })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-stone-900">Données économiques</h1>
        <p className="text-stone-500 mt-1">Suivi des coûts, revenus et indicateurs de performance</p>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-1 border-b border-stone-200">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
                ${isActive
                  ? 'border-[#AFBD00] text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <EconomicsFilterBar
        filters={filters}
        projects={projects}
        onFilterChange={actions.onFilterChange}
      />

      {/* Active tab content */}
      {activeTab === 'dashboard' && (
        <EconomicsDashboardView dashboard={dashboard} />
      )}

      {activeTab === 'inputs' && (
        <InputsTable
          inputs={inputs}
          busy={busy}
          onOpenAdd={() => setInputModal({ open: true, editing: null, presetLabor: false })}
          onEdit={(item) => setInputModal({ open: true, editing: item, presetLabor: false })}
          onDelete={actions.onDeleteInput}
        />
      )}

      {activeTab === 'outputs' && (
        <OutputsTable
          outputs={outputs}
          busy={busy}
          onOpenAdd={() => setOutputModal({ open: true, editing: null })}
          onEdit={(item) => setOutputModal({ open: true, editing: item })}
          onDelete={actions.onDeleteOutput}
        />
      )}

      {activeTab === 'labor' && (
        <LaborHoursView
          inputs={inputs}
          busy={busy}
          onOpenAdd={() => setInputModal({ open: true, editing: null, presetLabor: true })}
          onEdit={(item) => setInputModal({ open: true, editing: item, presetLabor: false })}
          onDelete={actions.onDeleteInput}
        />
      )}

      {activeTab === 'asbl' && (
        <AsblRateDashboard />
      )}

      {/* Modals */}
      {inputModal.open && (
        <InputFormModal
          input={inputModal.editing}
          presetCategory={inputModal.presetLabor ? 'labor' : undefined}
          busy={busy}
          onSave={handleSaveInput}
          onClose={() => setInputModal({ open: false, editing: null, presetLabor: false })}
        />
      )}

      {outputModal.open && (
        <OutputFormModal
          output={outputModal.editing}
          busy={busy}
          onSave={handleSaveOutput}
          onClose={() => setOutputModal({ open: false, editing: null })}
          onSearchSpecies={actions.onSearchSpecies}
        />
      )}
    </div>
  )
}
