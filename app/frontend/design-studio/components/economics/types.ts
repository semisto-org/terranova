export type InputCategory = 'plants' | 'materials' | 'labor' | 'other'
export type OutputCategory = 'harvest' | 'sale' | 'transformation' | 'donation' | 'autoconsumption'
export type LaborType = 'plantation' | 'entretien' | 'recolte'

export interface EconomicInput {
  id: number
  date: string
  category: InputCategory
  amount_cents: number
  quantity: number
  unit: string
  labor_type: LaborType | null
  notes: string | null
  location_id: number | null
  zone_id: number | null
  design_project_id: number | null
}

export interface EconomicOutput {
  id: number
  date: string
  category: OutputCategory
  amount_cents: number | null
  quantity: number
  unit: string
  species_name: string | null
  species_id: string | null
  species_latin_name: string | null
  notes: string | null
  location_id: number | null
  zone_id: number | null
  design_project_id: number | null
}

export interface EconomicsDashboard {
  period: { from: string | null; to: string | null }
  totals: { inputs_cents: number; outputs_cents: number; balance_cents: number }
  metrics: {
    area_m2: number | null
    productivity_eur_per_ha: number | null
    cost_eur_per_m2: number | null
  }
  breakdown: {
    inputs_by_category_cents: Record<string, number>
    outputs_by_category_cents: Record<string, number>
  }
}

export interface EconomicsFilters {
  from: string
  to: string
  design_project_id: string
}

export interface SpeciesSearchResult {
  id: string
  type: string
  latinName: string
  commonName: string | null
}

export interface EconomicsActions {
  onFilterChange: (key: keyof EconomicsFilters, value: string) => void
  onCreateInput: (values: Record<string, unknown>) => Promise<void>
  onUpdateInput: (id: number, values: Record<string, unknown>) => Promise<void>
  onDeleteInput: (id: number) => void
  onCreateOutput: (values: Record<string, unknown>) => Promise<void>
  onUpdateOutput: (id: number, values: Record<string, unknown>) => Promise<void>
  onDeleteOutput: (id: number) => void
  onSearchSpecies: (query: string) => Promise<SpeciesSearchResult[]>
}

export const INPUT_CATEGORY_LABELS: Record<InputCategory, string> = {
  plants: 'Plantes',
  materials: 'Matériaux',
  labor: 'Main-d\u2019\u0153uvre',
  other: 'Autre',
}

export const OUTPUT_CATEGORY_LABELS: Record<OutputCategory, string> = {
  harvest: 'Récolte',
  sale: 'Vente',
  transformation: 'Transformation',
  donation: 'Don',
  autoconsumption: 'Autoconsommation',
}

export const LABOR_TYPE_LABELS: Record<LaborType, string> = {
  plantation: 'Plantation',
  entretien: 'Entretien',
  recolte: 'Récolte',
}

export const INPUT_CATEGORY_COLORS: Record<InputCategory, string> = {
  plants: '#22c55e',
  materials: '#6366f1',
  labor: '#f59e0b',
  other: '#94a3b8',
}

export const OUTPUT_CATEGORY_COLORS: Record<OutputCategory, string> = {
  harvest: '#22c55e',
  sale: '#AFBD00',
  transformation: '#8b5cf6',
  donation: '#ec4899',
  autoconsumption: '#06b6d4',
}

export const euro = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
export const euroDecimal = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })
export const numberFmt = new Intl.NumberFormat('fr-BE', { maximumFractionDigits: 1 })
