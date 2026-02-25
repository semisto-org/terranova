import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, AlertTriangle, Loader2, Map, Navigation } from 'lucide-react'
import type { SiteAnalysis } from '../../types'
import { EmptyState } from '../shared/EmptyState'

interface SiteAnalysisTabProps {
  siteAnalysis: SiteAnalysis | null
  onSave: (values: Record<string, unknown>) => Promise<void> | void
  busy?: boolean
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

type FieldConfig = {
  key: string
  label: string
  placeholder?: string
}

type SectionConfig = {
  key: string
  label: string
  sourceKeys: string[]
  fields: FieldConfig[]
}

const SECTION_CONFIG: SectionConfig[] = [
  {
    key: 'climate',
    label: 'Climat',
    sourceKeys: ['climate'],
    fields: [
      { key: 'temperature', label: 'Température', placeholder: 'Amplitude, périodes extrêmes' },
      { key: 'rain', label: 'Pluie', placeholder: 'Pluviométrie, saisonnalité' },
      { key: 'wind', label: 'Vent', placeholder: 'Dominants, rafales, zones exposées' },
      { key: 'sun', label: 'Ensoleillement', placeholder: 'Orientation, ombres portées' },
      { key: 'exposure_constraints', label: 'Contraintes d’exposition', placeholder: 'Éléments bloquants relevés' },
    ],
  },
  {
    key: 'geomorphology',
    label: 'Géomorphologie',
    sourceKeys: ['geomorphology'],
    fields: [
      { key: 'topography', label: 'Topographie' },
      { key: 'slope', label: 'Pente' },
      { key: 'orientation', label: 'Orientation' },
      { key: 'relief', label: 'Relief' },
      { key: 'constraints', label: 'Contraintes' },
    ],
  },
  {
    key: 'water',
    label: 'Eau',
    sourceKeys: ['water'],
    fields: [
      { key: 'network', label: 'Réseau disponible' },
      { key: 'rainwater', label: 'Eaux pluviales' },
      { key: 'runoff', label: 'Ruissellement' },
      { key: 'flood_risk', label: 'Risque inondation' },
      { key: 'drainage', label: 'Drainage' },
    ],
  },
  {
    key: 'biodiversity',
    label: 'Biodiversité',
    sourceKeys: ['biodiversity', 'vegetation'],
    fields: [
      { key: 'existing_flora', label: 'Flore existante' },
      { key: 'existing_fauna', label: 'Faune observée' },
      { key: 'habitats', label: 'Habitats' },
      { key: 'ecological_pressures', label: 'Pressions écologiques' },
    ],
  },
  {
    key: 'socio_economic',
    label: 'Socio-économique',
    sourceKeys: ['socio_economic', 'socioEconomic'],
    fields: [
      { key: 'neighbors', label: 'Voisinage' },
      { key: 'uses', label: 'Usages du lieu' },
      { key: 'nuisances', label: 'Nuisances' },
      { key: 'opportunities', label: 'Opportunités' },
      { key: 'regulations', label: 'Réglementations locales' },
    ],
  },
  {
    key: 'access',
    label: 'Accès',
    sourceKeys: ['access', 'accessData'],
    fields: [
      { key: 'road_access', label: 'Accès routier' },
      { key: 'pedestrian_access', label: 'Accès piéton' },
      { key: 'logistics', label: 'Logistique chantier' },
      { key: 'parking', label: 'Stationnement' },
      { key: 'constraints', label: 'Contraintes d’accès' },
    ],
  },
  {
    key: 'microclimate',
    label: 'Microclimat',
    sourceKeys: ['microclimate'],
    fields: [
      { key: 'heat_islands', label: 'Îlots de chaleur' },
      { key: 'wind_corridors', label: 'Couloirs de vent' },
      { key: 'shade', label: 'Zones d’ombre' },
      { key: 'frost_pockets', label: 'Poches de gel' },
    ],
  },
  {
    key: 'built_environment',
    label: 'Environnement bâti',
    sourceKeys: ['built_environment', 'buildings'],
    fields: [
      { key: 'adjacent_buildings', label: 'Bâtiments adjacents' },
      { key: 'heritage', label: 'Patrimoine / contraintes' },
      { key: 'networks', label: 'Réseaux techniques' },
      { key: 'constraints', label: 'Contraintes bâties' },
    ],
  },
  {
    key: 'zoning',
    label: 'Zonage',
    sourceKeys: ['zoning'],
    fields: [
      { key: 'categories', label: 'Catégories de zone' },
      { key: 'prescriptions', label: 'Prescriptions' },
      { key: 'opportunities', label: 'Opportunités règlementaires' },
      { key: 'constraints', label: 'Contraintes règlementaires' },
    ],
  },
  {
    key: 'soil',
    label: 'Sol',
    sourceKeys: ['soil'],
    fields: [
      { key: 'texture', label: 'Texture' },
      { key: 'structure', label: 'Structure' },
      { key: 'ph', label: 'pH' },
      { key: 'organic_matter', label: 'Matière organique' },
      { key: 'contamination', label: 'Contamination potentielle' },
    ],
  },
  {
    key: 'aesthetics',
    label: 'Paysage & esthétique',
    sourceKeys: ['aesthetics'],
    fields: [
      { key: 'views', label: 'Vues' },
      { key: 'identity', label: 'Identité du lieu' },
      { key: 'materials', label: 'Matériaux dominants' },
      { key: 'ambience', label: 'Ambiance' },
      { key: 'references', label: 'Références client' },
    ],
  },
]

const CATEGORY_OPTIONS = [
  { value: 'zone_agricole', label: 'Zone agricole' },
  { value: 'zone_habitat', label: 'Zone habitat' },
  { value: 'zone_forestiere', label: 'Zone forestière' },
  { value: 'zone_naturelle', label: 'Zone naturelle' },
  { value: 'zone_mixte', label: 'Zone mixte' },
  { value: 'autre', label: 'Autre' },
]

const normalizeField = (raw: unknown) => {
  if (raw && typeof raw === 'object' && 'value' in (raw as Record<string, unknown>)) {
    const field = raw as Record<string, unknown>
    return {
      value: String(field.value ?? ''),
      note: String(field.note ?? ''),
    }
  }
  return { value: String(raw ?? ''), note: '' }
}

const buildInitialForm = (analysis: SiteAnalysis | null) => {
  const form: Record<string, Record<string, { value: string; note: string }>> = {}

  SECTION_CONFIG.forEach((section) => {
    const source = (section.sourceKeys
      .map((key) => analysis?.[key as keyof SiteAnalysis] as Record<string, unknown> | undefined)
      .find(Boolean) || {}) as Record<string, unknown>

    form[section.key] = {}
    section.fields.forEach((field) => {
      form[section.key][field.key] = normalizeField(source[field.key])
    })
  })

  const analysisRecord = (analysis ?? {}) as Record<string, unknown>
  const zoningRaw = ((analysis?.zoning as Record<string, unknown>)?.categories ?? analysisRecord.zoningCategories) as unknown
  const zoningCategories = Array.isArray(zoningRaw) ? zoningRaw.map((v) => String(v)) : []

  return {
    sections: form,
    waterAccess: Boolean(analysis?.waterAccess),
    zoningCategories,
    clientObservations: {
      sunnyAreas: String((analysis?.clientObservations as Record<string, unknown>)?.sunnyAreas ?? ''),
      wetAreas: String((analysis?.clientObservations as Record<string, unknown>)?.wetAreas ?? ''),
      windyAreas: String((analysis?.clientObservations as Record<string, unknown>)?.windyAreas ?? ''),
      favoriteSpots: String((analysis?.clientObservations as Record<string, unknown>)?.favoriteSpots ?? ''),
      historyNotes: String((analysis?.clientObservations as Record<string, unknown>)?.historyNotes ?? ''),
    },
  }
}

export function SiteAnalysisTab({ siteAnalysis, onSave, busy = false }: SiteAnalysisTabProps) {
  const [activeSection, setActiveSection] = useState(SECTION_CONFIG[0].key)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [form, setForm] = useState(() => buildInitialForm(siteAnalysis))

  useEffect(() => {
    if (busy) setSaveState('saving')
  }, [busy])

  useEffect(() => {
    setForm(buildInitialForm(siteAnalysis))
  }, [siteAnalysis])

  const completion = useMemo(() => {
    return SECTION_CONFIG.map((section) => {
      const fields = section.fields.length
      const filled = section.fields.filter((field) => {
        const item = form.sections[section.key]?.[field.key]
        return Boolean(item?.value?.trim() || item?.note?.trim())
      }).length
      return { key: section.key, label: section.label, filled, fields }
    })
  }, [form.sections])

  const warnings = useMemo(() => {
    const items: string[] = []
    if (!form.waterAccess) items.push('Aucun accès à l’eau indiqué : prévoir une stratégie de rétention et d’installation.')
    if ((form.sections.soil?.ph?.value || '').trim() !== '' && Number.isNaN(Number(form.sections.soil?.ph?.value))) {
      items.push('Le pH du sol doit être une valeur numérique (ex: 6.8).')
    }
    return items
  }, [form])

  const updateField = (sectionKey: string, fieldKey: string, part: 'value' | 'note', value: string) => {
    setForm((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections[sectionKey],
          [fieldKey]: {
            ...prev.sections[sectionKey][fieldKey],
            [part]: value,
          },
        },
      },
    }))
  }

  const toggleCategory = (value: string) => {
    setForm((prev) => ({
      ...prev,
      zoningCategories: prev.zoningCategories.includes(value)
        ? prev.zoningCategories.filter((item) => item !== value)
        : [...prev.zoningCategories, value],
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaveState('saving')

    try {
      const payload: Record<string, unknown> = {
        climate: form.sections.climate,
        geomorphology: form.sections.geomorphology,
        water: form.sections.water,
        biodiversity: form.sections.biodiversity,
        socio_economic: form.sections.socio_economic,
        access: form.sections.access,
        microclimate: form.sections.microclimate,
        built_environment: form.sections.built_environment,
        zoning: {
          ...form.sections.zoning,
          categories: form.zoningCategories,
        },
        soil: form.sections.soil,
        aesthetics: form.sections.aesthetics,
        zoning_categories: form.zoningCategories,
        water_access: form.waterAccess,
        client_observations: form.clientObservations,
      }

      await onSave(payload)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 1800)
    } catch {
      setSaveState('error')
    }
  }

  const currentSection = SECTION_CONFIG.find((item) => item.key === activeSection) || SECTION_CONFIG[0]

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-stone-900">
          <Map className="h-4 w-4 text-[#AFBD00]" />
          Analyse UX terrain
        </h3>
        <p className="text-xs text-stone-500">Navigation par sections, édition complète des blocs et sauvegarde en payload canonique.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-stone-200 bg-white p-3 lg:sticky lg:top-4 lg:self-start">
            <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              <Navigation className="h-3.5 w-3.5" /> Sections
            </div>
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
              {completion.map((section) => {
                const isActive = activeSection === section.key
                const isCompleted = section.filled === section.fields && section.fields > 0
                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => setActiveSection(section.key)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${isActive ? 'bg-[#EEF4C8] text-stone-900' : 'text-stone-600 hover:bg-stone-50'}`}
                  >
                    <span className="font-medium">{section.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>
                      {section.filled}/{section.fields}
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>

          <section className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 space-y-4">
            <h4 className="text-sm font-semibold text-stone-900">{currentSection.label}</h4>
            <div className="space-y-3">
              {currentSection.fields.map((field) => {
                const fieldValue = form.sections[currentSection.key]?.[field.key] || { value: '', note: '' }
                return (
                  <div key={field.key} className="rounded-xl border border-stone-100 bg-stone-50/50 p-3">
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-stone-700">{field.label}</span>
                      <input
                        type="text"
                        value={fieldValue.value}
                        placeholder={field.placeholder || 'Valeur'}
                        onChange={(event) => updateField(currentSection.key, field.key, 'value', event.target.value)}
                        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[#AFBD00]"
                      />
                    </label>
                    <label className="mt-2 grid gap-1">
                      <span className="text-[11px] font-medium text-stone-600">Note</span>
                      <textarea
                        rows={2}
                        value={fieldValue.note}
                        onChange={(event) => updateField(currentSection.key, field.key, 'note', event.target.value)}
                        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[#AFBD00]"
                      />
                    </label>
                  </div>
                )
              })}
            </div>

            {currentSection.key === 'zoning' && (
              <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-3">
                <p className="mb-2 text-xs font-medium text-stone-700">Catégories plan de secteur</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((option) => {
                    const selected = form.zoningCategories.includes(option.value)
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleCategory(option.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${selected ? 'border-[#AFBD00] bg-[#EEF4C8] text-stone-900 font-medium' : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-50'}`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 space-y-4">
          <h4 className="text-sm font-semibold text-stone-900">Synthèse opérationnelle</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-xs font-medium text-stone-600">Accès à l’eau</span>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, waterAccess: !prev.waterAccess }))}
                className={`w-fit rounded-full border px-3 py-1.5 text-xs font-medium ${form.waterAccess ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-stone-300 bg-white text-stone-600'}`}
              >
                {form.waterAccess ? 'Oui, accès disponible' : 'Non, pas d’accès'}
              </button>
            </div>

            {[
              ['sunnyAreas', 'Zones ensoleillées'],
              ['wetAreas', 'Zones humides'],
              ['windyAreas', 'Zones venteuses'],
              ['favoriteSpots', 'Espaces préférés'],
              ['historyNotes', 'Historique du lieu'],
            ].map(([key, label]) => (
              <label key={key} className="grid gap-1 sm:col-span-2">
                <span className="text-xs font-medium text-stone-600">{label}</span>
                <textarea
                  rows={2}
                  value={form.clientObservations[key as keyof typeof form.clientObservations]}
                  onChange={(event) => setForm((prev) => ({
                    ...prev,
                    clientObservations: { ...prev.clientObservations, [key]: event.target.value },
                  }))}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[#AFBD00]"
                />
              </label>
            ))}
          </div>
        </section>

        {warnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <div className="flex items-start gap-2 text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <ul className="space-y-1 text-xs">
                {warnings.map((warning) => <li key={warning}>• {warning}</li>)}
              </ul>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saveState === 'saving' || busy}
            className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 transition-colors hover:bg-[#9BAA00] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saveState === 'saving' || busy ? 'Sauvegarde…' : 'Sauvegarder l’analyse'}
          </button>

          <SaveIndicator state={saveState === 'saving' && !busy ? 'saving' : saveState} />
        </div>
      </form>

      {!siteAnalysis && (
        <EmptyState
          icon={<Map className="h-10 w-10 text-stone-400" />}
          title="Analyse terrain non commencée"
          description="Complétez les sections pour disposer d’un diagnostic exploitable en pré-projet et en passation d’équipe."
        />
      )}
    </div>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'saving') {
    return <span className="inline-flex items-center gap-1 text-xs text-stone-500"><Loader2 className="h-3.5 w-3.5 animate-spin" />Enregistrement…</span>
  }
  if (state === 'saved') {
    return <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Enregistré</span>
  }
  if (state === 'error') {
    return <span className="inline-flex items-center gap-1 text-xs text-rose-700"><AlertTriangle className="h-3.5 w-3.5" />Erreur de sauvegarde</span>
  }
  return null
}
