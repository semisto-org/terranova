import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Droplets,
  Home,
  LandPlot,
  Leaf,
  Loader2,
  Map,
  MapPin,
  Mountain,
  Navigation,
  Sun,
  TreePine,
  Waves,
  Wind,
  Sparkles,
} from 'lucide-react'
import type { SiteAnalysis } from '../../types'
import { EmptyState } from '../shared/EmptyState'

interface SiteAnalysisTabProps {
  siteAnalysis: SiteAnalysis | null
  onSave: (values: Record<string, unknown>) => Promise<void> | void
  busy?: boolean
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type SectionId =
  | 'climate'
  | 'geomorphology'
  | 'water'
  | 'vegetation'
  | 'socioEconomic'
  | 'access'
  | 'microclimate'
  | 'buildings'
  | 'zoning'
  | 'soil'
  | 'aesthetic'

const PROJECT_TYPES = ['Forêt-jardin', 'Haie fruitière', 'Verger', 'Agroforesterie', 'Potager vivant', 'Autre']
const CLIENT_INTERESTS = ['Design complet', 'Accompagnement', 'Plantation', 'Co-gestion', 'Formation']
const KNOWN_VIA_OPTIONS = ['Bouche-à-oreille', 'Instagram', 'LinkedIn', 'Site web', 'Événement', 'Partenaire']
const ZONING_OPTIONS = [
  { value: 'zone_agricole', label: 'Zone agricole' },
  { value: 'zone_habitat', label: 'Zone d’habitat' },
  { value: 'zone_naturelle', label: 'Zone naturelle' },
  { value: 'zone_forestiere', label: 'Zone forestière' },
  { value: 'zone_mixte', label: 'Zone mixte' },
  { value: 'autre', label: 'Autre' },
]

const SECTIONS: Array<{ id: SectionId, label: string, icon: ReactNode }> = [
  { id: 'climate', label: 'Climat', icon: <Sun className="h-4 w-4" /> },
  { id: 'geomorphology', label: 'Géomorphologie / Paysage', icon: <Mountain className="h-4 w-4" /> },
  { id: 'water', label: 'Eau', icon: <Droplets className="h-4 w-4" /> },
  { id: 'vegetation', label: 'Végétation & vie', icon: <Leaf className="h-4 w-4" /> },
  { id: 'socioEconomic', label: 'Environnement socio-économique', icon: <Home className="h-4 w-4" /> },
  { id: 'access', label: 'Accès', icon: <Navigation className="h-4 w-4" /> },
  { id: 'microclimate', label: 'Micro-climats', icon: <Wind className="h-4 w-4" /> },
  { id: 'buildings', label: 'Bâtis', icon: <MapPin className="h-4 w-4" /> },
  { id: 'zoning', label: 'Zonage', icon: <LandPlot className="h-4 w-4" /> },
  { id: 'soil', label: 'Sol', icon: <TreePine className="h-4 w-4" /> },
  { id: 'aesthetic', label: 'Esthétique', icon: <Sparkles className="h-4 w-4" /> },
]

export function SiteAnalysisTab({ siteAnalysis, onSave, busy = false }: SiteAnalysisTabProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('climate')
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const [form, setForm] = useState(() => buildForm(siteAnalysis))

  useEffect(() => {
    setForm(buildForm(siteAnalysis))
  }, [siteAnalysis])

  useEffect(() => {
    if (busy) setSaveState('saving')
  }, [busy])

  const sectionProgress = useMemo(() => buildSectionProgress(form), [form])
  const totalRequired = sectionProgress.reduce((sum, item) => sum + item.total, 0)
  const totalDone = sectionProgress.reduce((sum, item) => sum + item.done, 0)
  const missingSections = sectionProgress.filter((item) => item.done < item.total)

  const warnings = useMemo(() => {
    const items: string[] = []
    if (form.climate.hardinessZone && !/^([A-Z])\d{1,2}$/i.test(form.climate.hardinessZone.trim())) {
      items.push('La zone de rusticité semble inhabituelle (format conseillé: H7).')
    }
    if (!form.waterAccess) {
      items.push('Sans accès à l’eau, prévoir une stratégie d’installation/rétention dès le pré-projet.')
    }
    if (form.socioEconomic.clientInterestedIn.length > 3) {
      items.push('Plus de 3 intérêts sélectionnés: prioriser les besoins peut accélérer le cadrage.')
    }
    return items
  }, [form])

  const submitPayload = async () => {
    setSaveState('saving')
    try {
      await onSave(toPayload(form))
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 1600)
    } catch {
      setSaveState('error')
    }
  }

  const saveCurrentSection = async () => {
    await submitPayload()
  }

  const hasAnyData = totalDone > 0

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-stone-200 bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1 flex items-center gap-2">
              <Map className="w-4 h-4 text-[#AFBD00]" />
              Analyse d’un projet
            </h3>
            <p className="text-xs text-stone-500">Collecte structurée des informations terrain, administratives et de conception.</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-wide text-stone-500">Complétude globale</p>
            <p className="text-sm font-semibold text-stone-900">{totalDone}/{totalRequired}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-4 lg:self-start rounded-2xl border border-stone-200 bg-white p-3">
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">Navigation rapide</div>
          <nav className="grid gap-1 max-h-[65vh] overflow-auto pr-1">
            {SECTIONS.map((section) => {
              const progress = sectionProgress.find((entry) => entry.id === section.id)
              const active = activeSection === section.id
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${active ? 'border-[#AFBD00] bg-[#F5F8E6]' : 'border-stone-200 hover:bg-stone-50'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-stone-800">
                      {section.icon}
                      {section.label}
                    </div>
                    <span className={`text-[11px] font-semibold ${progress && progress.done === progress.total ? 'text-emerald-700' : 'text-stone-500'}`}>
                      {progress?.done ?? 0}/{progress?.total ?? 0}
                    </span>
                  </div>
                </button>
              )
            })}
          </nav>

          {missingSections.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-2.5">
              <p className="text-[11px] font-semibold text-amber-800 mb-1">Champs manquants</p>
              <ul className="space-y-1 text-[11px] text-amber-900">
                {missingSections.slice(0, 4).map((s) => (
                  <li key={s.id}>• {s.label} ({s.done}/{s.total})</li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 md:p-5 space-y-4">
          {activeSection === 'climate' && (
            <SectionCard title="Climat" hint="Données météo et rusticité utiles au choix des essences.">
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Zone de rusticité" value={form.climate.hardinessZone} placeholder="Ex: H7" onChange={(value) => setForm((p) => ({ ...p, climate: { ...p.climate, hardinessZone: value } }))} />
                <Input label="Jours sans gel" type="number" value={form.climate.frostFreeDays} onChange={(value) => setForm((p) => ({ ...p, climate: { ...p.climate, frostFreeDays: value } }))} />
                <Input label="Pluviométrie annuelle (mm)" type="number" value={form.climate.annualRainfall} onChange={(value) => setForm((p) => ({ ...p, climate: { ...p.climate, annualRainfall: value } }))} />
                <Textarea label="Notes climat" value={form.climate.notes} onChange={(value) => setForm((p) => ({ ...p, climate: { ...p.climate, notes: value } }))} />
              </div>
            </SectionCard>
          )}

          {activeSection === 'geomorphology' && (
            <SectionCard title="Géomorphologie / Paysage" hint="Topographie, exposition et reliefs du site.">
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Pente" value={form.geomorphology.slope} onChange={(value) => setForm((p) => ({ ...p, geomorphology: { ...p.geomorphology, slope: value } }))} />
                <Input label="Exposition" value={form.geomorphology.aspect} onChange={(value) => setForm((p) => ({ ...p, geomorphology: { ...p.geomorphology, aspect: value } }))} />
                <Input label="Altitude (m)" type="number" value={form.geomorphology.elevation} onChange={(value) => setForm((p) => ({ ...p, geomorphology: { ...p.geomorphology, elevation: value } }))} />
                <Textarea label="Notes paysage" value={form.geomorphology.notes} onChange={(value) => setForm((p) => ({ ...p, geomorphology: { ...p.geomorphology, notes: value } }))} />
              </div>
            </SectionCard>
          )}

          {activeSection === 'water' && (
            <SectionCard title="Eau" hint="Disponibilité, drainage et zones sensibles à l’humidité.">
              <div className="grid gap-3">
                <ChoiceToggle
                  label="Accès à l’eau"
                  checked={form.waterAccess}
                  checkedLabel="Oui, accès disponible"
                  uncheckedLabel="Non, accès absent"
                  onToggle={() => setForm((p) => ({ ...p, waterAccess: !p.waterAccess }))}
                />
                <Input label="Sources (séparées par virgule)" value={form.water.sources.join(', ')} onChange={(value) => setForm((p) => ({ ...p, water: { ...p.water, sources: splitCsv(value) } }))} />
                <Textarea label="Zones humides" value={form.water.wetZones} onChange={(value) => setForm((p) => ({ ...p, water: { ...p.water, wetZones: value } }))} />
                <Textarea label="Drainage" value={form.water.drainage} onChange={(value) => setForm((p) => ({ ...p, water: { ...p.water, drainage: value } }))} />
              </div>
            </SectionCard>
          )}

          {activeSection === 'vegetation' && (
            <SectionCard title="Végétation & vie" hint="Éléments vivants existants à préserver ou corriger.">
              <div className="grid gap-3">
                <Input label="Arbres existants (virgules)" value={form.vegetation.existingTrees.join(', ')} onChange={(value) => setForm((p) => ({ ...p, vegetation: { ...p.vegetation, existingTrees: splitCsv(value) } }))} />
                <Input label="Espèces problématiques (virgules)" value={form.vegetation.problematicSpecies.join(', ')} onChange={(value) => setForm((p) => ({ ...p, vegetation: { ...p.vegetation, problematicSpecies: splitCsv(value) } }))} />
                <Textarea label="Éléments remarquables" value={form.vegetation.notableFeatures} onChange={(value) => setForm((p) => ({ ...p, vegetation: { ...p.vegetation, notableFeatures: value } }))} />
              </div>
            </SectionCard>
          )}

          {activeSection === 'socioEconomic' && (
            <SectionCard title="Environnement socio-économique" hint="Cadre social, foncier et contexte client.">
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Régime de propriété" value={form.socioEconomic.ownership} onChange={(value) => setForm((p) => ({ ...p, socioEconomic: { ...p.socioEconomic, ownership: value } }))} />
                <Input label="Connu via" value={form.socioEconomic.knownViaSemisto} asSelect options={KNOWN_VIA_OPTIONS} onChange={(value) => setForm((p) => ({ ...p, socioEconomic: { ...p.socioEconomic, knownViaSemisto: value } }))} />
                <Input label="Servitudes" value={form.socioEconomic.easements} onChange={(value) => setForm((p) => ({ ...p, socioEconomic: { ...p.socioEconomic, easements: value } }))} />
                <Input label="Type de projet" value={form.socioEconomic.projectType} asSelect options={PROJECT_TYPES} onChange={(value) => setForm((p) => ({ ...p, socioEconomic: { ...p.socioEconomic, projectType: value } }))} />
                <Textarea label="Voisinage / parties prenantes" value={form.socioEconomic.neighbors} onChange={(value) => setForm((p) => ({ ...p, socioEconomic: { ...p.socioEconomic, neighbors: value } }))} />
                <Textarea label="Marché local" value={form.socioEconomic.localMarket} onChange={(value) => setForm((p) => ({ ...p, socioEconomic: { ...p.socioEconomic, localMarket: value } }))} />
              </div>
              <ChipPicker
                label="Client intéressé par"
                options={CLIENT_INTERESTS}
                values={form.socioEconomic.clientInterestedIn}
                onToggle={(value) => {
                  setForm((p) => ({
                    ...p,
                    socioEconomic: {
                      ...p.socioEconomic,
                      clientInterestedIn: p.socioEconomic.clientInterestedIn.includes(value)
                        ? p.socioEconomic.clientInterestedIn.filter((item) => item !== value)
                        : [...p.socioEconomic.clientInterestedIn, value],
                    },
                  }))
                }}
              />
            </SectionCard>
          )}

          {activeSection === 'access' && (
            <SectionCard title="Accès" hint="Logistique d’accès pour chantier, visite et maintenance.">
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Accès principal" value={form.access.mainAccess} onChange={(value) => setForm((p) => ({ ...p, access: { ...p.access, mainAccess: value } }))} />
                <Input label="Accès secondaire" value={form.access.secondaryAccess} onChange={(value) => setForm((p) => ({ ...p, access: { ...p.access, secondaryAccess: value } }))} />
                <Input label="Parking" value={form.access.parking} onChange={(value) => setForm((p) => ({ ...p, access: { ...p.access, parking: value } }))} />
                <Textarea label="Notes accès" value={form.access.notes} onChange={(value) => setForm((p) => ({ ...p, access: { ...p.access, notes: value } }))} />
              </div>
            </SectionCard>
          )}

          {activeSection === 'microclimate' && (
            <SectionCard title="Micro-climats" hint="Variations locales (vent, soleil, poches de gel).">
              <div className="grid gap-3 md:grid-cols-2">
                <Textarea label="Exposition au vent" value={form.microclimate.windExposure} onChange={(value) => setForm((p) => ({ ...p, microclimate: { ...p.microclimate, windExposure: value } }))} />
                <Textarea label="Ensoleillement" value={form.microclimate.sunPatterns} onChange={(value) => setForm((p) => ({ ...p, microclimate: { ...p.microclimate, sunPatterns: value } }))} />
                <Textarea label="Poches de gel" value={form.microclimate.frostPockets} onChange={(value) => setForm((p) => ({ ...p, microclimate: { ...p.microclimate, frostPockets: value } }))} />
                <Textarea label="Notes micro-climats" value={form.microclimate.notes} onChange={(value) => setForm((p) => ({ ...p, microclimate: { ...p.microclimate, notes: value } }))} />
              </div>
            </SectionCard>
          )}

          {activeSection === 'buildings' && (
            <SectionCard title="Bâtis" hint="Structures existantes et réseaux techniques disponibles.">
              <div className="grid gap-3">
                <Input label="Bâtiments existants (virgules)" value={form.buildings.existing.join(', ')} onChange={(value) => setForm((p) => ({ ...p, buildings: { ...p.buildings, existing: splitCsv(value) } }))} />
                <Input label="Réseaux / utilities" value={form.buildings.utilities} onChange={(value) => setForm((p) => ({ ...p, buildings: { ...p.buildings, utilities: value } }))} />
                <Textarea label="Notes bâtis" value={form.buildings.notes} onChange={(value) => setForm((p) => ({ ...p, buildings: { ...p.buildings, notes: value } }))} />
              </div>
            </SectionCard>
          )}

          {activeSection === 'zoning' && (
            <SectionCard title="Zonage" hint="Contraintes réglementaires et faisabilité administrative.">
              <ChipPicker
                label="Catégories de zonage"
                options={ZONING_OPTIONS.map((z) => z.label)}
                values={form.zoningCategories.map((code) => ZONING_OPTIONS.find((z) => z.value === code)?.label || code)}
                onToggle={(label) => {
                  const match = ZONING_OPTIONS.find((z) => z.label === label)
                  if (!match) return
                  setForm((p) => {
                    const next = p.zoningCategories.includes(match.value)
                      ? p.zoningCategories.filter((item) => item !== match.value)
                      : [...p.zoningCategories, match.value]
                    return { ...p, zoningCategories: next }
                  })
                }}
              />
              <Textarea label="Notes réglementaires" value={form.zoningNotes} onChange={(value) => setForm((p) => ({ ...p, zoningNotes: value }))} />
            </SectionCard>
          )}

          {activeSection === 'soil' && (
            <SectionCard title="Sol" hint="Texture, pH, matière organique et qualité du sol.">
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Type de sol" value={form.soil.type} onChange={(value) => setForm((p) => ({ ...p, soil: { ...p.soil, type: value } }))} />
                <Input label="pH" type="number" step="0.1" value={form.soil.ph} onChange={(value) => setForm((p) => ({ ...p, soil: { ...p.soil, ph: value } }))} />
                <Input label="Matière organique" value={form.soil.organic} onChange={(value) => setForm((p) => ({ ...p, soil: { ...p.soil, organic: value } }))} />
                <Input label="Texture" value={form.soil.texture} onChange={(value) => setForm((p) => ({ ...p, soil: { ...p.soil, texture: value } }))} />
                <Textarea label="Notes sol" value={form.soil.notes} onChange={(value) => setForm((p) => ({ ...p, soil: { ...p.soil, notes: value } }))} />
              </div>
            </SectionCard>
          )}

          {activeSection === 'aesthetic' && (
            <SectionCard title="Esthétique" hint="Perceptions client et usages sensibles du lieu.">
              <div className="grid gap-3 md:grid-cols-2">
                <Textarea label="Zones ensoleillées" value={form.clientObservations.sunnyAreas} onChange={(value) => setForm((p) => ({ ...p, clientObservations: { ...p.clientObservations, sunnyAreas: value } }))} />
                <Textarea label="Zones humides" value={form.clientObservations.wetAreas} onChange={(value) => setForm((p) => ({ ...p, clientObservations: { ...p.clientObservations, wetAreas: value } }))} />
                <Textarea label="Zones venteuses" value={form.clientObservations.windyAreas} onChange={(value) => setForm((p) => ({ ...p, clientObservations: { ...p.clientObservations, windyAreas: value } }))} />
                <Textarea label="Spots préférés" value={form.clientObservations.favoriteSpots} onChange={(value) => setForm((p) => ({ ...p, clientObservations: { ...p.clientObservations, favoriteSpots: value } }))} />
                <Textarea label="Historique / narration du lieu" value={form.clientObservations.historyNotes} onChange={(value) => setForm((p) => ({ ...p, clientObservations: { ...p.clientObservations, historyNotes: value } }))} />
              </div>
            </SectionCard>
          )}

          {warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <div className="flex items-start gap-2 text-amber-800">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <ul className="text-xs space-y-1">{warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={saveCurrentSection}
              disabled={saveState === 'saving' || busy}
              className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Sauvegarder cette section
            </button>
            <button
              type="button"
              onClick={submitPayload}
              disabled={saveState === 'saving' || busy}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Sauvegarder tout
            </button>
            <SaveIndicator state={saveState === 'saving' && !busy ? 'saving' : saveState} />
          </div>
        </section>
      </div>

      {!hasAnyData && (
        <EmptyState
          icon={<Waves className="w-10 h-10 text-stone-400" />}
          title="Analyse terrain non commencée"
          description="Commencez par les sections Climat, Eau et Sol pour atteindre rapidement un diagnostic exploitable."
        />
      )}
    </div>
  )
}

function buildForm(analysis: SiteAnalysis | null) {
  const a = analysis
  const climate = (a?.climate ?? {}) as unknown as Record<string, unknown>
  const socio = (a?.socioEconomic ?? {}) as unknown as Record<string, unknown>
  const geo = (a?.geomorphology ?? {}) as unknown as Record<string, unknown>
  const water = (a?.water ?? {}) as unknown as Record<string, unknown>
  const vegetation = (a?.vegetation ?? {}) as unknown as Record<string, unknown>
  const access = (a?.access ?? {}) as unknown as Record<string, unknown>
  const microclimate = (a?.microclimate ?? {}) as unknown as Record<string, unknown>
  const buildings = (a?.buildings ?? {}) as unknown as Record<string, unknown>
  const soil = (a?.soil ?? {}) as unknown as Record<string, unknown>
  const observations = (a?.clientObservations ?? {}) as unknown as Record<string, unknown>

  return {
    climate: {
      hardinessZone: toText(climate.hardinessZone),
      frostFreeDays: toText(climate.frostFreeDays),
      annualRainfall: toText(climate.annualRainfall),
      notes: toText(climate.notes),
    },
    geomorphology: {
      slope: toText(geo.slope),
      aspect: toText(geo.aspect),
      elevation: toText(geo.elevation),
      notes: toText(geo.notes),
    },
    water: {
      sources: toArray(water.sources),
      wetZones: toText(water.wetZones),
      drainage: toText(water.drainage),
      notes: toText(water.notes),
    },
    waterAccess: Boolean((a as unknown as Record<string, unknown>)?.waterAccess ?? water.accessToWater),
    vegetation: {
      existingTrees: toArray(vegetation.existingTrees),
      problematicSpecies: toArray(vegetation.problematicSpecies),
      notableFeatures: toText(vegetation.notableFeatures),
      notes: toText(vegetation.notes),
    },
    socioEconomic: {
      ownership: toText(socio.ownership),
      easements: toText(socio.easements),
      neighbors: toText(socio.neighbors),
      localMarket: toText(socio.localMarket),
      notes: toText(socio.notes),
      projectType: toText(socio.projectType),
      knownViaSemisto: toText(socio.knownViaSemisto),
      clientInterestedIn: toArray(socio.clientInterestedIn),
    },
    access: {
      mainAccess: toText(access.mainAccess),
      secondaryAccess: toText(access.secondaryAccess),
      parking: toText(access.parking),
      notes: toText(access.notes),
    },
    microclimate: {
      windExposure: toText(microclimate.windExposure),
      sunPatterns: toText(microclimate.sunPatterns),
      frostPockets: toText(microclimate.frostPockets),
      notes: toText(microclimate.notes),
    },
    buildings: {
      existing: toArray(buildings.existing),
      utilities: toText(buildings.utilities),
      notes: toText(buildings.notes),
    },
    zoningCategories: toArray((a as unknown as Record<string, unknown>)?.zoningCategories),
    zoningLabels: toArray((a as unknown as Record<string, unknown>)?.zoningCategoriesLabels),
    zoningNotes: toText(geo.zoningNotes),
    soil: {
      type: toText(soil.type),
      ph: toText(soil.ph),
      organic: toText(soil.organic),
      texture: toText(soil.texture),
      notes: toText(soil.notes),
    },
    clientObservations: {
      sunnyAreas: toText(observations.sunnyAreas),
      wetAreas: toText(observations.wetAreas),
      windyAreas: toText(observations.windyAreas),
      favoriteSpots: toText(observations.favoriteSpots),
      historyNotes: toText(observations.historyNotes),
    },
  }
}

function toPayload(form: ReturnType<typeof buildForm>) {
  return {
    climate: {
      hardinessZone: form.climate.hardinessZone,
      frostFreeDays: numberOrNil(form.climate.frostFreeDays),
      annualRainfall: numberOrNil(form.climate.annualRainfall),
      notes: form.climate.notes,
    },
    geomorphology: {
      slope: form.geomorphology.slope,
      aspect: form.geomorphology.aspect,
      elevation: numberOrNil(form.geomorphology.elevation),
      notes: form.geomorphology.notes,
      zoningNotes: form.zoningNotes,
    },
    water: {
      sources: form.water.sources,
      wetZones: form.water.wetZones,
      drainage: form.water.drainage,
      notes: form.water.notes,
      accessToWater: form.waterAccess,
    },
    socio_economic: {
      ownership: form.socioEconomic.ownership,
      easements: form.socioEconomic.easements,
      neighbors: form.socioEconomic.neighbors,
      localMarket: form.socioEconomic.localMarket,
      notes: form.socioEconomic.notes,
      projectType: form.socioEconomic.projectType,
      knownViaSemisto: form.socioEconomic.knownViaSemisto,
      clientInterestedIn: form.socioEconomic.clientInterestedIn,
    },
    access_data: {
      mainAccess: form.access.mainAccess,
      secondaryAccess: form.access.secondaryAccess,
      parking: form.access.parking,
      notes: form.access.notes,
    },
    vegetation: {
      existingTrees: form.vegetation.existingTrees,
      problematicSpecies: form.vegetation.problematicSpecies,
      notableFeatures: form.vegetation.notableFeatures,
      notes: form.vegetation.notes,
    },
    microclimate: {
      windExposure: form.microclimate.windExposure,
      sunPatterns: form.microclimate.sunPatterns,
      frostPockets: form.microclimate.frostPockets,
      notes: form.microclimate.notes,
    },
    buildings: {
      existing: form.buildings.existing,
      utilities: form.buildings.utilities,
      notes: form.buildings.notes,
    },
    soil: {
      type: form.soil.type,
      ph: numberOrNil(form.soil.ph),
      organic: form.soil.organic,
      texture: form.soil.texture,
      notes: form.soil.notes,
    },
    client_observations: form.clientObservations,
    water_access: form.waterAccess,
    zoning_categories: form.zoningCategories,
  }
}

function buildSectionProgress(form: ReturnType<typeof buildForm>) {
  const rows = [
    { id: 'climate', label: 'Climat', values: [form.climate.hardinessZone, form.climate.frostFreeDays, form.climate.annualRainfall] },
    { id: 'geomorphology', label: 'Géomorphologie / Paysage', values: [form.geomorphology.slope, form.geomorphology.aspect, form.geomorphology.elevation] },
    { id: 'water', label: 'Eau', values: [String(form.waterAccess), form.water.wetZones, form.water.drainage] },
    { id: 'vegetation', label: 'Végétation & vie', values: [form.vegetation.existingTrees.join(', '), form.vegetation.notableFeatures] },
    { id: 'socioEconomic', label: 'Environnement socio-économique', values: [form.socioEconomic.ownership, form.socioEconomic.projectType, form.socioEconomic.clientInterestedIn.join(', ')] },
    { id: 'access', label: 'Accès', values: [form.access.mainAccess, form.access.parking] },
    { id: 'microclimate', label: 'Micro-climats', values: [form.microclimate.windExposure, form.microclimate.sunPatterns] },
    { id: 'buildings', label: 'Bâtis', values: [form.buildings.existing.join(', '), form.buildings.utilities] },
    { id: 'zoning', label: 'Zonage', values: [form.zoningCategories.join(', ')] },
    { id: 'soil', label: 'Sol', values: [form.soil.type, form.soil.ph, form.soil.texture] },
    { id: 'aesthetic', label: 'Esthétique', values: [form.clientObservations.favoriteSpots, form.clientObservations.historyNotes] },
  ]

  return rows.map((row) => {
    const total = row.values.length
    const done = row.values.filter((value) => String(value).trim().length > 0).length
    return { ...row, done, total }
  }) as Array<{ id: SectionId, label: string, done: number, total: number }>
}

function toText(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function toArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item)).filter(Boolean)
}

function splitCsv(value: string): string[] {
  return value.split(',').map((x) => x.trim()).filter(Boolean)
}

function numberOrNil(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function Input({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  step,
  asSelect = false,
  options = [],
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  step?: string
  asSelect?: boolean
  options?: string[]
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-stone-700">{label}</span>
      {asSelect ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:border-[#AFBD00] focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40"
        >
          <option value="">Sélectionner…</option>
          {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          type={type}
          step={step}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:border-[#AFBD00] focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40"
        />
      )}
    </label>
  )
}

function Textarea({ label, value, onChange }: { label: string, value: string, onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-stone-700">{label}</span>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:border-[#AFBD00] focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40"
      />
    </label>
  )
}

function ChipPicker({ label, options, values, onToggle }: { label: string, options: string[], values: string[], onToggle: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-stone-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${selected ? 'border-[#AFBD00] bg-[#EEF4C8] text-stone-900 font-medium' : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-50'}`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ChoiceToggle({
  label,
  checked,
  checkedLabel,
  uncheckedLabel,
  onToggle,
}: {
  label: string
  checked: boolean
  checkedLabel: string
  uncheckedLabel: string
  onToggle: () => void
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-stone-700">{label}</p>
      <button
        type="button"
        onClick={onToggle}
        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${checked ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-stone-300 bg-white text-stone-600'}`}
      >
        {checked ? checkedLabel : uncheckedLabel}
      </button>
    </div>
  )
}

function SectionCard({ title, hint, children }: { title: string, hint: string, children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/40 p-4">
      <div>
        <h4 className="text-sm font-semibold text-stone-900">{title}</h4>
        <p className="text-xs text-stone-500">{hint}</p>
      </div>
      {children}
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
    return <span className="inline-flex items-center gap-1 text-xs text-rose-700"><AlertCircle className="w-3.5 h-3.5" />Erreur de sauvegarde</span>
  }
  return null
}
