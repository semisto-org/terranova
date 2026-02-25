import { useEffect, useMemo, useState } from 'react'
import { Map, CheckCircle2, AlertTriangle, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import type { SiteAnalysis } from '../../types'
import { EmptyState } from '../shared/EmptyState'

interface SiteAnalysisTabProps {
  siteAnalysis: SiteAnalysis | null
  onSave: (values: {
    hardinessZone?: string
    soilType?: string
    notes?: string
    accessToWater?: boolean
    sectorPlanZones?: string[]
    projectType?: string
    clientInterestedIn?: string[]
    knownViaSemisto?: string
    [key: string]: unknown
  }) => Promise<void> | void
  busy?: boolean
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

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

const PROJECT_TYPES = ['Forêt-jardin', 'Haie fruitière', 'Verger', 'Agroforesterie', 'Potager vivant', 'Autre']
const CLIENT_INTERESTS = ['Design complet', 'Accompagnement', 'Plantation', 'Co-gestion', 'Formation']
const KNOWN_VIA_OPTIONS = ['Bouche-à-oreille', 'Instagram', 'LinkedIn', 'Site web', 'Événement', 'Partenaire']
const SECTOR_PLAN_OPTIONS = ['Zone agricole', 'Zone d’habitat', 'Zone naturelle', 'Zone forestière', 'Zone mixte']

export function SiteAnalysisTab({ siteAnalysis, onSave, busy = false }: SiteAnalysisTabProps) {
  const [openSection, setOpenSection] = useState<string | null>('climate')
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const [form, setForm] = useState(() => {
    const a = siteAnalysis
    const socio = (a?.socioEconomic ?? {}) as unknown as Record<string, unknown>
    const geo = (a?.geomorphology ?? {}) as unknown as Record<string, unknown>
    const water = (a?.water ?? {}) as unknown as Record<string, unknown>

    return {
      hardinessZone: (a?.climate as { hardinessZone?: string })?.hardinessZone ?? '',
      soilType: (a?.soil as { type?: string })?.type ?? '',
      notes: (a?.climate as { notes?: string })?.notes ?? '',
      accessToWater: Boolean(water.accessToWater),
      sectorPlanZones: Array.isArray(geo.sectorPlanZones) ? (geo.sectorPlanZones as string[]) : [],
      projectType: typeof socio.projectType === 'string' ? socio.projectType : '',
      clientInterestedIn: Array.isArray(socio.clientInterestedIn) ? (socio.clientInterestedIn as string[]) : [],
      knownViaSemisto: typeof socio.knownViaSemisto === 'string' ? socio.knownViaSemisto : '',
    }
  })

  useEffect(() => {
    if (busy) setSaveState('saving')
  }, [busy])

  useEffect(() => {
    const a = siteAnalysis
    const socio = (a?.socioEconomic ?? {}) as unknown as Record<string, unknown>
    const geo = (a?.geomorphology ?? {}) as unknown as Record<string, unknown>
    const water = (a?.water ?? {}) as unknown as Record<string, unknown>

    setForm({
      hardinessZone: (a?.climate as { hardinessZone?: string })?.hardinessZone ?? '',
      soilType: (a?.soil as { type?: string })?.type ?? '',
      notes: (a?.climate as { notes?: string })?.notes ?? '',
      accessToWater: Boolean(water.accessToWater),
      sectorPlanZones: Array.isArray(geo.sectorPlanZones) ? (geo.sectorPlanZones as string[]) : [],
      projectType: typeof socio.projectType === 'string' ? socio.projectType : '',
      clientInterestedIn: Array.isArray(socio.clientInterestedIn) ? (socio.clientInterestedIn as string[]) : [],
      knownViaSemisto: typeof socio.knownViaSemisto === 'string' ? socio.knownViaSemisto : '',
    })
  }, [siteAnalysis])

  const warnings = useMemo(() => {
    const items: string[] = []
    if (form.hardinessZone && !/^([A-Z])\d{1,2}$/i.test(form.hardinessZone.trim())) {
      items.push('La zone de rusticité semble inhabituelle (format conseillé: H7).')
    }
    if (form.clientInterestedIn.length > 3) {
      items.push('Beaucoup d’intérêts sélectionnés: prioriser 1 à 3 choix peut aider le cadrage.')
    }
    if (!form.accessToWater) {
      items.push('Sans accès à l’eau, prévoir une stratégie d’installation/rétention dès le pré-projet.')
    }
    return items
  }, [form])

  const toggleInArray = (key: 'sectorPlanZones' | 'clientInterestedIn', value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveState('saving')
    try {
      await onSave({
        hardinessZone: form.hardinessZone,
        soilType: form.soilType,
        notes: form.notes,
        accessToWater: form.accessToWater,
        sectorPlanZones: form.sectorPlanZones,
        projectType: form.projectType,
        clientInterestedIn: form.clientInterestedIn,
        knownViaSemisto: form.knownViaSemisto,
      })
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 1800)
    } catch {
      setSaveState('error')
    }
  }

  const hasAnyData = siteAnalysis && (
    (siteAnalysis.climate as unknown as Record<string, unknown>)?.hardinessZone ||
    (siteAnalysis.soil as unknown as Record<string, unknown>)?.type ||
    (siteAnalysis.clientObservations as unknown as Record<string, unknown>)?.sunnyAreas
  )

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-900 mb-1 flex items-center gap-2">
          <Map className="w-4 h-4 text-[#AFBD00]" />
          Analyse terrain
        </h3>
        <p className="text-xs text-stone-500 mb-4">Structurée en blocs pour un diagnostic rapide et une passation claire.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="grid md:grid-cols-2 gap-4 rounded-xl border border-stone-100 bg-stone-50/40 p-4">
            <h4 className="md:col-span-2 text-xs font-semibold text-stone-700 uppercase tracking-wide">Fondamentaux du site</h4>

            <label className="grid gap-1">
              <span className="text-xs font-medium text-stone-600">Zone de rusticité</span>
              <input
                type="text"
                placeholder="ex. H7"
                value={form.hardinessZone}
                onChange={(e) => setForm((p) => ({ ...p, hardinessZone: e.target.value }))}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
              />
              <span className="text-[11px] text-stone-500">Aide: zone climatique locale (Belgique souvent H7-H8).</span>
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-medium text-stone-600">Type de sol</span>
              <input
                type="text"
                placeholder="ex. limon, argile"
                value={form.soilType}
                onChange={(e) => setForm((p) => ({ ...p, soilType: e.target.value }))}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
              />
              <span className="text-[11px] text-stone-500">Aide: texture dominante observée à ce stade.</span>
            </label>

            <label className="md:col-span-2 grid gap-1">
              <span className="text-xs font-medium text-stone-600">Notes climat / sol</span>
              <textarea
                rows={2}
                placeholder="Notes générales"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
              />
            </label>
          </section>

          <section className="grid md:grid-cols-2 gap-4 rounded-xl border border-stone-100 bg-stone-50/40 p-4">
            <h4 className="md:col-span-2 text-xs font-semibold text-stone-700 uppercase tracking-wide">Cadrage projet</h4>

            <div className="grid gap-2">
              <span className="text-xs font-medium text-stone-600">Accès à l’eau</span>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, accessToWater: !p.accessToWater }))}
                className={`w-fit rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${form.accessToWater ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-stone-300 bg-white text-stone-600'}`}
              >
                {form.accessToWater ? 'Oui, accès disponible' : 'Non, pas d’accès'}
              </button>
              <span className="text-[11px] text-stone-500">Source sur place ou raccordement exploitable.</span>
            </div>

            <label className="grid gap-1">
              <span className="text-xs font-medium text-stone-600">Connu Semisto via</span>
              <select
                value={form.knownViaSemisto}
                onChange={(e) => setForm((p) => ({ ...p, knownViaSemisto: e.target.value }))}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
              >
                <option value="">Sélectionner…</option>
                {KNOWN_VIA_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>

            <div className="md:col-span-2 grid gap-2">
              <span className="text-xs font-medium text-stone-600">Type de projet</span>
              <div className="flex flex-wrap gap-2">
                {PROJECT_TYPES.map((option) => {
                  const selected = form.projectType === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, projectType: option }))}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${selected ? 'border-[#AFBD00] bg-[#EEF4C8] text-stone-900 font-semibold' : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-50'}`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="grid gap-4 rounded-xl border border-stone-100 bg-stone-50/40 p-4">
            <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wide">Contexte administratif & besoins</h4>
            <TagPicker
              label="Zones au plan de secteur"
              hint="Multi-sélection utile pour anticiper faisabilité et permis."
              options={SECTOR_PLAN_OPTIONS}
              values={form.sectorPlanZones}
              onToggle={(value) => toggleInArray('sectorPlanZones', value)}
            />
            <TagPicker
              label="Client intéressé par"
              hint="Choix multiples pour préparer l’offre la plus pertinente."
              options={CLIENT_INTERESTS}
              values={form.clientInterestedIn}
              onToggle={(value) => toggleInArray('clientInterestedIn', value)}
            />
          </section>

          {warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <div className="flex items-start gap-2 text-amber-800">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <ul className="text-xs space-y-1">
                  {warnings.map((warning) => <li key={warning}>• {warning}</li>)}
                </ul>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saveState === 'saving' || busy}
              className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saveState === 'saving' || busy ? 'Sauvegarde…' : 'Sauvegarder l’analyse'}
            </button>

            <SaveIndicator state={saveState === 'saving' && !busy ? 'saving' : saveState} />
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
              className="rounded-2xl border border-stone-200 bg-white overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenSection(isOpen ? null : key)}
                className="w-full flex items-center gap-2 px-5 py-3 text-left text-sm font-medium text-stone-900 hover:bg-stone-50 transition-colors"
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
                <div className="px-5 pb-4 pt-0 border-t border-stone-100">
                  <p className="text-xs text-stone-500 mt-3">
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
          description="Renseignez les fondamentaux et le cadrage projet pour démarrer une analyse claire et exploitable."
        />
      )}
    </div>
  )
}

function TagPicker({
  label,
  hint,
  options,
  values,
  onToggle,
}: {
  label: string
  hint: string
  options: string[]
  values: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="grid gap-2">
      <span className="text-xs font-medium text-stone-600">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${selected ? 'border-[#AFBD00] bg-[#EEF4C8] text-stone-900 font-medium' : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-50'}`}
            >
              {option}
            </button>
          )
        })}
      </div>
      <span className="text-[11px] text-stone-500">{hint}</span>
    </div>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'saving') {
    return <span className="inline-flex items-center gap-1 text-xs text-stone-500"><Loader2 className="w-3.5 h-3.5 animate-spin" />Enregistrement…</span>
  }
  if (state === 'saved') {
    return <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" />Enregistré</span>
  }
  if (state === 'error') {
    return <span className="inline-flex items-center gap-1 text-xs text-rose-700"><AlertTriangle className="w-3.5 h-3.5" />Erreur de sauvegarde</span>
  }
  return null
}
