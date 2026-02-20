import { useState } from 'react'
import { Map, ChevronDown, ChevronRight } from 'lucide-react'
import type { SiteAnalysis } from '../../types'
import { EmptyState } from '../shared/EmptyState'

interface SiteAnalysisTabProps {
  siteAnalysis: SiteAnalysis | null
  onSave: (values: {
    hardinessZone?: string
    soilType?: string
    notes?: string
    [key: string]: unknown
  }) => void
}

const SECTIONS = [
  { key: 'climate', label: 'Climat', fields: ['hardinessZone', 'frostFreeDays', 'annualRainfall', 'notes'] },
  { key: 'geomorphology', label: 'Géomorphologie', fields: ['slope', 'aspect', 'elevation', 'soilType', 'notes'] },
  { key: 'water', label: 'Eau', fields: ['sources', 'wetZones', 'drainage', 'notes'] },
  { key: 'socioEconomic', label: 'Socio-économique', fields: ['ownership', 'easements', 'neighbors', 'localMarket', 'notes'] },
  { key: 'access', label: 'Accès', fields: ['mainAccess', 'secondaryAccess', 'parking', 'notes'] },
  { key: 'vegetation', label: 'Végétation', fields: ['existingTrees', 'problematicSpecies', 'notableFeatures', 'notes'] },
  { key: 'microclimate', label: 'Microclimat', fields: ['windExposure', 'sunPatterns', 'frostPockets', 'notes'] },
  { key: 'buildings', label: 'Bâtiments', fields: ['existing', 'utilities', 'notes'] },
  { key: 'soil', label: 'Sol', fields: ['type', 'ph', 'organic', 'texture', 'notes'] },
  { key: 'clientObservations', label: 'Observations client', fields: ['sunnyAreas', 'wetAreas', 'windyAreas', 'favoriteSpots', 'historyNotes'] },
] as const

export function SiteAnalysisTab({ siteAnalysis, onSave }: SiteAnalysisTabProps) {
  const [openSection, setOpenSection] = useState<string | null>('climate')
  const [form, setForm] = useState(() => {
    const a = siteAnalysis
    return {
      hardinessZone: (a?.climate as { hardinessZone?: string })?.hardinessZone ?? '',
      soilType: (a?.soil as { type?: string })?.type ?? '',
      notes: (a?.climate as { notes?: string })?.notes ?? '',
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      hardinessZone: form.hardinessZone,
      soilType: form.soilType,
      notes: form.notes,
    })
  }

  const hasAnyData = siteAnalysis && (
    (siteAnalysis.climate as Record<string, unknown>)?.hardinessZone ||
    (siteAnalysis.soil as Record<string, unknown>)?.type ||
    (siteAnalysis.clientObservations as Record<string, unknown>)?.sunnyAreas
  )

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <Map className="w-4 h-4 text-[#AFBD00]" />
          Analyse rapide (échelle de permanence)
        </h3>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-4">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Zone de rusticité
            </span>
            <input
              type="text"
              placeholder="ex. H7"
              value={form.hardinessZone}
              onChange={(e) =>
                setForm((p) => ({ ...p, hardinessZone: e.target.value }))
              }
              className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Type de sol
            </span>
            <input
              type="text"
              placeholder="ex. limon, argile"
              value={form.soilType}
              onChange={(e) =>
                setForm((p) => ({ ...p, soilType: e.target.value }))
              }
              className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            />
          </label>
          <label className="grid gap-1 sm:col-span-3">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Notes climat / sol
            </span>
            <input
              type="text"
              placeholder="Notes générales"
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            />
          </label>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
            >
              Sauvegarder l’analyse
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-2">
        {SECTIONS.map(({ key, label }) => {
          const isOpen = openSection === key
          const sectionData = siteAnalysis?.[key as keyof SiteAnalysis]
          const hasContent = sectionData && typeof sectionData === 'object' && Object.values(sectionData).some(Boolean)
          return (
            <div
              key={key}
              className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenSection(isOpen ? null : key)}
                className="w-full flex items-center gap-2 px-5 py-3 text-left text-sm font-medium text-stone-900 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800/80 transition-colors"
              >
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-stone-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-stone-500" />
                )}
                {label}
                {hasContent && (
                  <span className="ml-2 w-2 h-2 rounded-full bg-[#AFBD00]" />
                )}
              </button>
              {isOpen && (
                <div className="px-5 pb-4 pt-0 border-t border-stone-100 dark:border-stone-700">
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-3">
                    Les champs détaillés pour « {label} » peuvent être ajoutés
                    ici (formulaire complet à étendre selon les types).
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!hasAnyData && !form.hardinessZone && !form.soilType && (
        <EmptyState
          icon={<Map className="w-10 h-10 text-stone-400" />}
          title="Analyse terrain non commencée"
          description="Renseignez la zone de rusticité, le type de sol et les observations pour démarrer l’analyse du site."
        />
      )}
    </div>
  )
}
