import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { apiRequest } from '@/lib/api'
import SimpleEditor from '@/components/SimpleEditor'
import type { Species, Genus, FilterOptions } from '../types'

interface CommonNameEntry {
  language: string
  name: string
}

interface SpeciesFormModalProps {
  species?: Species | null
  genera: Genus[]
  filterOptions: FilterOptions
  existingCommonNames?: CommonNameEntry[]
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  busy?: boolean
  defaultGenusId?: string | null
}

interface DuplicateMatch {
  id: string
  latinName: string
  commonName?: string | null
}

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
]

// French labels for all option IDs coming from the API
const FR_LABELS: Record<string, string> = {
  // Plant types
  'tree': 'Arbre', 'shrub': 'Arbuste', 'small-shrub': 'Petit arbuste',
  'climber': 'Grimpante', 'herbaceous': 'Herbacée', 'ground-cover': 'Couvre-sol',
  // Exposures
  'sun': 'Soleil', 'partial-shade': 'Mi-ombre', 'shade': 'Ombre',
  // Life cycles
  'annual': 'Annuelle', 'biennial': 'Bisannuelle', 'perennial': 'Vivace',
  // Growth rates
  'slow': 'Lente', 'medium': 'Moyenne', 'fast': 'Rapide', 'slow-start': 'Départ lent', 'fast-start': 'Départ rapide',
  // Foliage types
  'deciduous': 'Caduc', 'semi-evergreen': 'Semi-persistant', 'evergreen': 'Persistant', 'marcescent': 'Marcescent',
  // Foliage colors
  'green': 'Vert', 'dark-green': 'Vert foncé', 'light-green': 'Vert clair',
  'purple': 'Pourpre', 'variegated': 'Panaché', 'silver': 'Argenté', 'golden': 'Doré',
  // Root systems
  'taproot': 'Pivotant', 'fibrous': 'Fibreux', 'spreading': 'Traçant', 'shallow': 'Superficiel', 'deep': 'Profond',
  // Forest garden zones
  'edge': 'Lisière', 'light-shade': 'Mi-ombre', 'full-sun': 'Plein soleil', 'understory': 'Sous-étage', 'canopy': 'Canopée',
  // Fragrance
  'none': 'Aucun', 'light': 'Léger', 'strong': 'Fort',
  // Flower colors
  'white': 'Blanc', 'pink': 'Rose', 'red': 'Rouge', 'yellow': 'Jaune',
  'orange': 'Orange', 'blue': 'Bleu',
  // Soil types
  'clay': 'Argileux', 'loam': 'Limoneux', 'sandy': 'Sableux', 'chalky': 'Calcaire', 'peaty': 'Tourbeux',
  // Soil moisture
  'dry': 'Sec', 'moist': 'Frais', 'wet': 'Humide', 'waterlogged': 'Détrempé',
  // Soil richness
  'poor': 'Pauvre', 'moderate': 'Modéré', 'rich': 'Riche', 'very-rich': 'Très riche',
  // Planting seasons
  'autumn': 'Automne', 'winter': 'Hiver', 'spring': 'Printemps',
  // Edible parts
  'fruit': 'Fruit', 'leaf': 'Feuille', 'flower': 'Fleur', 'seed': 'Graine',
  'root': 'Racine', 'bark': 'Écorce', 'sap': 'Sève',
  // Interests
  'edible': 'Comestible', 'medicinal': 'Médicinal', 'nitrogen-fixer': 'Fixateur d\'azote',
  'pollinator': 'Pollinisateur', 'hedge': 'Haie', 'ornamental': 'Ornemental',
  // Ecosystem needs
  'nurse-tree': 'Arbre nourricier', 'pioneer': 'Pionnier', 'climax': 'Climax',
  'erosion-control': 'Anti-érosion',
  // Propagation methods
  'seed': 'Semis', 'cutting': 'Bouture', 'layering': 'Marcottage',
  'grafting': 'Greffe', 'division': 'Division', 'sucker': 'Drageon',
  // Transformations
  'jam': 'Confiture', 'jelly': 'Gelée', 'compote': 'Compote', 'juice': 'Jus',
  'syrup': 'Sirop', 'liqueur': 'Liqueur', 'dried': 'Séché', 'frozen': 'Congelé',
  'vinegar': 'Vinaigre', 'chutney': 'Chutney',
  // Fodder qualities
  'sheep': 'Moutons', 'goats': 'Chèvres', 'pigs': 'Porcs',
  'cattle': 'Bovins', 'poultry': 'Volaille', 'rabbits': 'Lapins',
  // Fertility
  'self-fertile': 'Autofertile', 'self-sterile': 'Autostérile', 'partially-self-fertile': 'Partiellement autofertile',
  // Pollination
  'insect': 'Insectes', 'wind': 'Vent', 'self': 'Autopollinisation', 'bird': 'Oiseaux',
}

/** Translate a filter option to French */
function fr(opt: { id: string; label: string }): { id: string; label: string } {
  return { id: opt.id, label: FR_LABELS[opt.id] || opt.label }
}

const inputBase =
  'w-full px-4 py-3 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/25 focus:border-[#5B5781]'

const labelBase = 'block text-sm font-semibold text-stone-700 mb-2'

type SectionId = 'identity' | 'characteristics' | 'soil' | 'calendar' | 'ecosystem' | 'uses' | 'propagation' | 'extra'

interface Section {
  id: SectionId
  label: string
  icon: string
}

const SECTIONS: Section[] = [
  { id: 'identity', label: 'Identité', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { id: 'characteristics', label: 'Caractéristiques', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { id: 'soil', label: 'Sol & eau', icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z' },
  { id: 'calendar', label: 'Calendrier', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'ecosystem', label: 'Écosystème', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'uses', label: 'Usages', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { id: 'propagation', label: 'Multiplication', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { id: 'extra', label: 'Avancé', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const MONTH_VALUES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function ChipGroup({ options, selected, onChange, color = '#5B5781' }: {
  options: { id: string; label: string }[]
  selected: string[]
  onChange: (next: string[]) => void
  color?: string
}) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id])
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt.id)
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
              active ? 'text-white shadow-sm' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
            }`}
            style={active ? { backgroundColor: color, borderColor: color } : undefined}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function MonthPicker({ selected, onChange, color = '#5B5781' }: {
  selected: string[]
  onChange: (next: string[]) => void
  color?: string
}) {
  const toggle = (month: string) => {
    onChange(selected.includes(month) ? selected.filter((v) => v !== month) : [...selected, month])
  }
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {MONTH_VALUES.map((month, i) => {
        const active = selected.includes(month)
        return (
          <button
            key={month}
            type="button"
            onClick={() => toggle(month)}
            className={`py-2 rounded-lg text-xs font-medium transition-all duration-150 border text-center ${
              active ? 'text-white shadow-sm' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
            }`}
            style={active ? { backgroundColor: color, borderColor: color } : undefined}
          >
            {MONTH_LABELS[i]}
          </button>
        )
      })}
    </div>
  )
}

function GenusAutocomplete({ genera, value, onChange }: {
  genera: Genus[]
  value: string
  onChange: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedGenus = genera.find((g) => g.id === value)

  const filtered = useMemo(() => {
    if (!query.trim()) return genera.slice(0, 15)
    const q = query.toLowerCase()
    return genera.filter((g) => g.latinName.toLowerCase().includes(q)).slice(0, 15)
  }, [genera, query])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => { setFocusedIndex(-1) }, [filtered])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) { if (e.key === 'ArrowDown' || e.key === 'Enter') { setOpen(true); e.preventDefault() }; return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex((p) => Math.min(p + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex((p) => Math.max(p - 1, 0)) }
    else if (e.key === 'Enter' && focusedIndex >= 0) { e.preventDefault(); select(filtered[focusedIndex]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  const select = (g: Genus) => {
    onChange(g.id)
    setQuery('')
    setOpen(false)
  }

  const clear = () => {
    onChange('')
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <div ref={wrapperRef} className="relative">
      {selectedGenus && !open ? (
        <div className={`${inputBase} flex items-center justify-between cursor-pointer`} onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}>
          <span className="italic text-stone-900">{selectedGenus.latinName}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); clear() }} className="p-0.5 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            className={inputBase}
            placeholder="Rechercher un genre..."
            autoComplete="off"
            spellCheck={false}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-stone-200 shadow-lg max-h-48 overflow-y-auto">
          {filtered.length > 0 ? filtered.map((g, i) => (
            <button
              key={g.id}
              type="button"
              onClick={() => select(g)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                i === focusedIndex ? 'bg-[#5B5781]/10 text-[#5B5781]' : 'text-stone-700 hover:bg-stone-50'
              } ${g.id === value ? 'font-semibold' : ''}`}
            >
              <span className="italic">{g.latinName}</span>
            </button>
          )) : (
            <div className="px-4 py-3 text-sm text-stone-400">Aucun genre trouvé</div>
          )}
          {!value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-sm text-stone-400 hover:bg-stone-50 border-t border-stone-100"
            >
              — Aucun genre —
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function SpeciesFormModal({
  species,
  genera,
  filterOptions,
  existingCommonNames = [],
  onSubmit,
  onCancel,
  busy = false,
  defaultGenusId = null,
}: SpeciesFormModalProps) {
  const isEdit = Boolean(species)
  const panelRef = useRef<HTMLDivElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [activeSection, setActiveSection] = useState<SectionId>('identity')

  // Translated filter options
  const opts = useMemo(() => ({
    types: filterOptions.types.map(fr),
    exposures: filterOptions.exposures.map(fr),
    lifeCycles: filterOptions.lifeCycles.map(fr),
    growthRates: filterOptions.growthRates.map(fr),
    foliageTypes: filterOptions.foliageTypes.map(fr),
    foliageColors: filterOptions.foliageColors.map(fr),
    rootSystems: filterOptions.rootSystems.map(fr),
    forestGardenZones: filterOptions.forestGardenZones.map(fr),
    fragranceLevels: filterOptions.fragranceLevels.map(fr),
    flowerColors: filterOptions.flowerColors.map(fr),
    soilTypes: filterOptions.soilTypes.map(fr),
    soilMoistures: filterOptions.soilMoistures.map(fr),
    soilRichness: filterOptions.soilRichness.map(fr),
    wateringNeeds: filterOptions.wateringNeeds,
    plantingSeasons: filterOptions.plantingSeasons.map(fr),
    edibleParts: filterOptions.edibleParts.map(fr),
    interests: filterOptions.interests.map(fr),
    ecosystemNeeds: filterOptions.ecosystemNeeds.map(fr),
    propagationMethods: filterOptions.propagationMethods.map(fr),
    transformations: filterOptions.transformations.map(fr),
    fodderQualities: filterOptions.fodderQualities.map(fr),
    fertilityTypes: filterOptions.fertilityTypes.map(fr),
    pollinationTypes: filterOptions.pollinationTypes.map(fr),
  }), [filterOptions])

  // Identity
  const [genusId, setGenusId] = useState(species?.genusId ?? defaultGenusId ?? '')
  const [latinName, setLatinName] = useState(species?.latinName ?? '')
  const [plantType, setPlantType] = useState(species?.type ?? '')
  const [commonNames, setCommonNames] = useState<CommonNameEntry[]>(
    existingCommonNames.length > 0 ? existingCommonNames : [{ language: 'fr', name: '' }]
  )

  // Characteristics
  const [lifeCycle, setLifeCycle] = useState(species?.lifeCycle ?? 'perennial')
  const [growthRate, setGrowthRate] = useState(species?.growthRate ?? 'medium')
  const [foliageType, setFoliageType] = useState(species?.foliageType ?? 'deciduous')
  const [foliageColor, setFoliageColor] = useState(species?.foliageColor ?? 'green')
  const [exposures, setExposures] = useState<string[]>(species?.exposures ?? [])
  const [hardiness, setHardiness] = useState(species?.hardiness ?? '')
  const [rootSystem, setRootSystem] = useState(species?.rootSystem ?? 'fibrous')
  const [forestGardenZones, setForestGardenZones] = useState<string[]>(
    species?.forestGardenZone ? [species.forestGardenZone] : []
  )
  const [fragrance, setFragrance] = useState(species?.fragrance ?? 'none')
  const [flowerColors, setFlowerColors] = useState<string[]>(species?.flowerColors ?? [])

  // Soil & water
  const [soilTypes, setSoilTypes] = useState<string[]>(species?.soilTypes ?? [])
  const [soilMoisture, setSoilMoisture] = useState(species?.soilMoisture ?? 'moist')
  const [soilRichness, setSoilRichness] = useState(species?.soilRichness ?? 'moderate')
  const [wateringNeed, setWateringNeed] = useState(species?.wateringNeed ?? '3')

  // Calendar
  const [floweringMonths, setFloweringMonths] = useState<string[]>(species?.floweringMonths ?? [])
  const [fruitingMonths, setFruitingMonths] = useState<string[]>(species?.fruitingMonths ?? [])
  const [harvestMonths, setHarvestMonths] = useState<string[]>(species?.harvestMonths ?? [])
  const [plantingSeasons, setPlantingSeasons] = useState<string[]>(species?.plantingSeasons ?? [])

  // Uses
  const [edibleParts, setEdibleParts] = useState<string[]>(species?.edibleParts ?? [])
  const [interests, setInterests] = useState<string[]>(species?.interests ?? [])
  const [ecosystemNeeds, setEcosystemNeeds] = useState<string[]>(species?.ecosystemNeeds ?? [])
  const [propagationMethods, setPropagationMethods] = useState<string[]>(species?.propagationMethods ?? [])
  const [transformations, setTransformations] = useState<string[]>(species?.transformations ?? [])
  const [fodderQualities, setFodderQualities] = useState<string[]>(species?.fodderQualities ?? [])

  // Extra
  const [fertility, setFertility] = useState(species?.fertility ?? 'self-fertile')
  const [pollinationType, setPollinationType] = useState(species?.pollinationType ?? 'insect')
  const [origin, setOrigin] = useState(species?.origin ?? '')
  const [isInvasive, setIsInvasive] = useState(species?.isInvasive ?? false)
  const [therapeuticProperties, setTherapeuticProperties] = useState(species?.therapeuticProperties ?? '')
  const [toxicElements, setToxicElements] = useState(species?.toxicElements ?? '')
  const [additionalNotes, setAdditionalNotes] = useState(species?.additionalNotes ?? '')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)

  // Duplicate check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = latinName.trim()
    if (!trimmed || trimmed.length < 3 || (isEdit && trimmed === species?.latinName)) {
      setDuplicateMatch(null); setCheckingDuplicate(false); return
    }
    setCheckingDuplicate(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await apiRequest(`/api/v1/plants/search?query=${encodeURIComponent(trimmed)}`)
        const match = (result?.items || []).find(
          (item: { type: string; latinName: string }) =>
            item.type === 'species' && item.latinName.toLowerCase() === trimmed.toLowerCase()
        )
        setDuplicateMatch(match ? { id: match.id, latinName: match.latinName, commonName: match.commonName } : null)
      } catch { setDuplicateMatch(null) }
      finally { setCheckingDuplicate(false) }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [latinName, isEdit, species?.latinName])

  // Focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => firstInputRef.current?.focus(), 120)
    return () => clearTimeout(timer)
  }, [])

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onCancel() } }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  // Focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll<HTMLElement>('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')
      if (!focusables.length) return
      const first = focusables[0]; const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const validate = useCallback(() => {
    const next: Record<string, string> = {}
    if (!latinName.trim()) next.latinName = 'Le nom latin est obligatoire'
    if (!plantType) next.plantType = 'Le type de plante est obligatoire'
    setErrors(next)
    return Object.keys(next).length === 0
  }, [latinName, plantType])

  useEffect(() => { if (Object.keys(touched).length > 0) validate() }, [latinName, plantType, touched, validate])

  const markTouched = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }))
  const showError = (field: string) => touched[field] && errors[field]

  const sectionComplete = useMemo(() => ({
    identity: Boolean(latinName.trim() && plantType),
    characteristics: exposures.length > 0,
    soil: soilTypes.length > 0,
    calendar: floweringMonths.length > 0 || harvestMonths.length > 0,
    ecosystem: interests.length > 0 || ecosystemNeeds.length > 0,
    uses: edibleParts.length > 0 || transformations.length > 0,
    propagation: propagationMethods.length > 0,
    extra: Boolean(origin.trim()),
  }), [latinName, plantType, exposures, soilTypes, floweringMonths, harvestMonths, interests, ecosystemNeeds, edibleParts, transformations, propagationMethods, origin])

  const addCommonName = () => {
    const usedLangs = commonNames.map((cn) => cn.language)
    const nextLang = LANGUAGES.find((l) => !usedLangs.includes(l.code))?.code || 'fr'
    setCommonNames([...commonNames, { language: nextLang, name: '' }])
  }
  const removeCommonName = (index: number) => setCommonNames(commonNames.filter((_, i) => i !== index))
  const updateCommonName = (index: number, field: keyof CommonNameEntry, value: string) => {
    setCommonNames(commonNames.map((cn, i) => (i === index ? { ...cn, [field]: value } : cn)))
  }

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id)
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ latinName: true, plantType: true })
    if (!validate()) { setActiveSection('identity'); return }
    const filteredNames = commonNames.filter((cn) => cn.name.trim())
    await onSubmit({
      genus_id: genusId || null,
      latin_name: latinName.trim(),
      plant_type: plantType,
      life_cycle: lifeCycle, growth_rate: growthRate, foliage_type: foliageType, foliage_color: foliageColor,
      exposures, hardiness, root_system: rootSystem, forest_garden_zone: forestGardenZones[0] || 'edge',
      fragrance, flower_colors: flowerColors, soil_types: soilTypes, soil_moisture: soilMoisture,
      soil_richness: soilRichness, watering_need: wateringNeed, flowering_months: floweringMonths,
      fruiting_months: fruitingMonths, harvest_months: harvestMonths, planting_seasons: plantingSeasons,
      edible_parts: edibleParts, interests, ecosystem_needs: ecosystemNeeds,
      propagation_methods: propagationMethods, transformations, fodder_qualities: fodderQualities,
      fertility, pollination_type: pollinationType,
      native_countries: [], origin: origin.trim(),
      is_invasive: isInvasive,
      therapeutic_properties: (therapeuticProperties === '<p></p>' ? '' : therapeuticProperties.trim()) || null,
      toxic_elements: (toxicElements === '<p></p>' ? '' : toxicElements.trim()) || null,
      additional_notes: (additionalNotes === '<p></p>' ? '' : additionalNotes.trim()) || null,
      common_names: filteredNames,
    })
  }

  const canSubmit = !busy && latinName.trim() && plantType && Object.keys(errors).length === 0

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" style={{ animation: 'fadeIn 200ms ease-out' }} onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div ref={panelRef} className="w-full max-w-3xl bg-white rounded-2xl border border-stone-200 shadow-2xl pointer-events-auto max-h-[92vh] overflow-hidden flex flex-col" style={{ animation: 'modalSlideIn 250ms ease-out' }} onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="shrink-0 px-6 py-5 border-b border-stone-100 bg-gradient-to-br from-emerald-50/80 via-stone-50/50 to-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.03]">
              <svg viewBox="0 0 100 100" fill="currentColor" className="text-emerald-900 w-full h-full">
                <path d="M50 5C50 5 20 25 15 55C10 85 40 95 50 95C60 95 90 85 85 55C80 25 50 5 50 5ZM50 20C50 20 35 35 32 55C29 75 45 85 50 85C55 85 71 75 68 55C65 35 50 20 50 20Z" />
              </svg>
            </div>
            <div className="flex items-center justify-between relative">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-[#AFBD00]/15 flex items-center justify-center">
                    <svg className="w-4.5 h-4.5 text-[#7a8500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading)' }}>
                    {isEdit ? "Modifier l'espèce" : 'Nouvelle espèce'}
                  </h3>
                </div>
                <p className="text-sm text-stone-500 ml-[42px]">
                  {isEdit ? 'Mettez à jour les caractéristiques botaniques' : 'Décrivez une nouvelle espèce avec ses propriétés'}
                </p>
              </div>
              <button type="button" onClick={onCancel} className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors" aria-label="Fermer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Section Navigation */}
            <div className="mt-4 flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {SECTIONS.map((section) => {
                const active = activeSection === section.id
                const complete = sectionComplete[section.id]
                return (
                  <button key={section.id} type="button" onClick={() => scrollToSection(section.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      active ? 'bg-[#5B5781] text-white shadow-sm' : complete ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-300'
                    }`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={section.icon} /></svg>
                    {section.label}
                    {complete && !active && <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 h-full">
            <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 p-6 space-y-8">

              {/* SECTION: Identity */}
              <div id="section-identity">
                <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-stone-500">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={SECTIONS[0].icon} /></svg>
                  </span>
                  Identité
                </h4>
                <div className="space-y-4">
                  {/* Genus autocomplete */}
                  <div>
                    <label className={labelBase}>Genre</label>
                    <GenusAutocomplete genera={genera} value={genusId} onChange={setGenusId} />
                  </div>

                  {/* Latin name with duplicate check */}
                  <div>
                    <label htmlFor="species-latin" className={labelBase}>Nom latin <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <input ref={firstInputRef} id="species-latin" type="text" value={latinName}
                        onChange={(e) => setLatinName(e.target.value)} onBlur={() => markTouched('latinName')}
                        className={`${inputBase} italic font-medium pr-10 ${showError('latinName') ? '!border-red-400 !ring-red-200' : ''}`}
                        placeholder="ex: Malus domestica, Prunus avium..." autoComplete="off" spellCheck={false} />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingDuplicate && (
                          <svg className="w-5 h-5 text-stone-300 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
                        {!checkingDuplicate && latinName.trim() && !errors.latinName && !duplicateMatch && (
                          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        )}
                        {!checkingDuplicate && duplicateMatch && (
                          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                        )}
                      </div>
                    </div>
                    {showError('latinName') && <p className="mt-1.5 text-xs text-red-600">{errors.latinName}</p>}
                    {!errors.latinName && duplicateMatch && (
                      <div className="mt-2 flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200/80">
                        <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <div className="text-xs leading-relaxed">
                          <p className="font-semibold text-amber-800">
                            L'espèce <span className="italic">{duplicateMatch.latinName}</span> existe déjà
                            {duplicateMatch.commonName && <span className="font-normal text-amber-700"> ({duplicateMatch.commonName})</span>}
                          </p>
                          <p className="text-amber-700 mt-0.5">Vérifiez qu'il ne s'agit pas d'un doublon avant de continuer.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Plant type */}
                  <div>
                    <label className={labelBase}>Type de plante <span className="text-rose-500">*</span></label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {opts.types.map((opt) => {
                        const active = plantType === opt.id
                        return (
                          <button key={opt.id} type="button" onClick={() => { setPlantType(opt.id); markTouched('plantType') }}
                            className={`py-2.5 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                              active ? 'bg-[#5B5781] text-white border-[#5B5781] shadow-sm' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                            }`}>
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                    {showError('plantType') && <p className="mt-1.5 text-xs text-red-600">{errors.plantType}</p>}
                  </div>

                  {/* Common Names */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={labelBase + ' !mb-0'}>Noms communs</label>
                      {commonNames.length < LANGUAGES.length && (
                        <button type="button" onClick={addCommonName} className="text-xs font-medium text-[#5B5781] hover:text-[#4a4770] flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                          Ajouter
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {commonNames.map((cn, index) => (
                        <div key={index} className="flex items-center gap-2 group">
                          <select value={cn.language} onChange={(e) => updateCommonName(index, 'language', e.target.value)}
                            className="w-[110px] shrink-0 px-3 py-3 rounded-xl bg-white border border-stone-200 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/25 focus:border-[#5B5781] transition-all">
                            {LANGUAGES.map((lang) => <option key={lang.code} value={lang.code}>{lang.flag} {lang.label}</option>)}
                          </select>
                          <input type="text" value={cn.name} onChange={(e) => updateCommonName(index, 'name', e.target.value)} className={inputBase}
                            placeholder={`Nom en ${LANGUAGES.find((l) => l.code === cn.language)?.label || cn.language}`} />
                          {commonNames.length > 1 && (
                            <button type="button" onClick={() => removeCommonName(index)} className="p-2 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-100" />

              {/* SECTION: Characteristics */}
              <div id="section-characteristics">
                <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-stone-500"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={SECTIONS[1].icon} /></svg></span>
                  Caractéristiques
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className={labelBase}>Cycle de vie</label>
                    <div className="flex gap-2">
                      {opts.lifeCycles.map((o) => {
                        const active = lifeCycle === o.id
                        const icons: Record<string, string> = {
                          annual: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                          biennial: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
                          perennial: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
                        }
                        return (
                          <button key={o.id} type="button" onClick={() => setLifeCycle(o.id)}
                            className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 transition-all duration-200 ${active ? 'border-[#5B5781] bg-[#5B5781]/5 shadow-sm' : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? 'bg-[#5B5781]/10' : 'bg-stone-100'}`}>
                              <svg className={`w-4 h-4 transition-colors ${active ? 'text-[#5B5781]' : 'text-stone-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={icons[o.id] || icons.annual} /></svg>
                            </div>
                            <span className={`text-sm font-medium transition-colors ${active ? 'text-[#5B5781]' : 'text-stone-600'}`}>{o.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <label className={labelBase}>Vitesse de croissance</label>
                    <select value={growthRate} onChange={(e) => setGrowthRate(e.target.value)} className={inputBase}>
                      {opts.growthRates.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelBase}>Type de feuillage</label>
                      <select value={foliageType} onChange={(e) => setFoliageType(e.target.value)} className={inputBase}>
                        {opts.foliageTypes.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelBase}>Couleur du feuillage</label>
                      <select value={foliageColor} onChange={(e) => setFoliageColor(e.target.value)} className={inputBase}>
                        {opts.foliageColors.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelBase}>Exposition</label>
                    <ChipGroup options={opts.exposures} selected={exposures} onChange={setExposures} color="#5B5781" />
                  </div>
                  <div>
                    <label htmlFor="species-hardiness" className={labelBase}>Rusticité</label>
                    <input id="species-hardiness" type="text" value={hardiness} onChange={(e) => setHardiness(e.target.value)} className={inputBase} placeholder="ex: -15°C, zone 7" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelBase}>Système racinaire</label>
                      <select value={rootSystem} onChange={(e) => setRootSystem(e.target.value)} className={inputBase}>
                        {opts.rootSystems.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelBase}>Zones forêt-jardin</label>
                    <ChipGroup options={opts.forestGardenZones} selected={forestGardenZones} onChange={setForestGardenZones} color="#234766" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelBase}>Parfum</label>
                      <select value={fragrance} onChange={(e) => setFragrance(e.target.value)} className={inputBase}>
                        {opts.fragranceLevels.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelBase}>Couleurs des fleurs</label>
                    <ChipGroup options={opts.flowerColors} selected={flowerColors} onChange={setFlowerColors} color="#c2185b" />
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-100" />

              {/* SECTION: Soil & Water */}
              <div id="section-soil">
                <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-stone-500"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={SECTIONS[2].icon} /></svg></span>
                  Sol & eau
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className={labelBase}>Types de sol</label>
                    <ChipGroup options={opts.soilTypes} selected={soilTypes} onChange={setSoilTypes} color="#795548" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelBase}>Humidité du sol</label>
                      <select value={soilMoisture} onChange={(e) => setSoilMoisture(e.target.value)} className={inputBase}>
                        {opts.soilMoistures.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelBase}>Richesse du sol</label>
                      <select value={soilRichness} onChange={(e) => setSoilRichness(e.target.value)} className={inputBase}>
                        {opts.soilRichness.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelBase}>Besoin en eau</label>
                      <div className="flex items-center gap-1">
                        {opts.wateringNeeds.map((o) => {
                          const active = wateringNeed === o.id
                          return (
                            <button key={o.id} type="button" onClick={() => setWateringNeed(o.id)}
                              className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all text-center ${
                                active ? 'bg-blue-500 text-white border-blue-500 shadow-sm' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                              }`}>{o.id}</button>
                          )
                        })}
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-stone-400 px-1"><span>Sec</span><span>Humide</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-100" />

              {/* SECTION: Calendar */}
              <div id="section-calendar">
                <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-stone-500"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={SECTIONS[3].icon} /></svg></span>
                  Calendrier
                </h4>
                <div className="space-y-5">
                  <div>
                    <label className={labelBase}><span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-400" />Floraison</span></label>
                    <MonthPicker selected={floweringMonths} onChange={setFloweringMonths} color="#ec407a" />
                  </div>
                  <div>
                    <label className={labelBase}><span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" />Fructification</span></label>
                    <MonthPicker selected={fruitingMonths} onChange={setFruitingMonths} color="#ff9800" />
                  </div>
                  <div>
                    <label className={labelBase}><span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Récolte</span></label>
                    <MonthPicker selected={harvestMonths} onChange={setHarvestMonths} color="#4caf50" />
                  </div>
                  <div>
                    <label className={labelBase}>Saisons de plantation</label>
                    <ChipGroup options={opts.plantingSeasons} selected={plantingSeasons} onChange={setPlantingSeasons} color="#5B5781" />
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-100" />

              {/* SECTION: Ecosystem */}
              <div id="section-ecosystem">
                <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-stone-500"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={SECTIONS[4].icon} /></svg></span>
                  Écosystème
                </h4>
                <div className="space-y-4">
                  <div><label className={labelBase}>Intérêts</label><ChipGroup options={opts.interests} selected={interests} onChange={setInterests} color="#5B5781" /></div>
                  <div><label className={labelBase}>Besoins écosystémiques</label><ChipGroup options={opts.ecosystemNeeds} selected={ecosystemNeeds} onChange={setEcosystemNeeds} color="#2e7d32" /></div>
                </div>
              </div>

              <div className="border-t border-stone-100" />

              {/* SECTION: Uses */}
              <div id="section-uses">
                <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-stone-500"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={SECTIONS[5].icon} /></svg></span>
                  Usages
                </h4>
                <div className="space-y-4">
                  <div><label className={labelBase}>Parties comestibles</label><ChipGroup options={opts.edibleParts} selected={edibleParts} onChange={setEdibleParts} color="#4caf50" /></div>
                  <div><label className={labelBase}>Transformations</label><ChipGroup options={opts.transformations} selected={transformations} onChange={setTransformations} color="#ff9800" /></div>
                  <div><label className={labelBase}>Fourrage</label><ChipGroup options={opts.fodderQualities} selected={fodderQualities} onChange={setFodderQualities} color="#795548" /></div>
                  <div>
                    <label className={labelBase}>Propriétés thérapeutiques</label>
                    <SimpleEditor content={therapeuticProperties} onUpdate={setTherapeuticProperties} toolbar={['bold', 'italic', '|', 'bulletList', 'orderedList']} />
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-100" />

              {/* SECTION: Propagation */}
              <div id="section-propagation">
                <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-stone-500"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={SECTIONS[6].icon} /></svg></span>
                  Multiplication
                </h4>
                <div className="space-y-4">
                  <div><label className={labelBase}>Méthodes de propagation</label><ChipGroup options={opts.propagationMethods} selected={propagationMethods} onChange={setPropagationMethods} color="#795548" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelBase}>Fertilité</label>
                      <select value={fertility} onChange={(e) => setFertility(e.target.value)} className={inputBase}>
                        {opts.fertilityTypes.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelBase}>Pollinisation</label>
                      <select value={pollinationType} onChange={(e) => setPollinationType(e.target.value)} className={inputBase}>
                        {opts.pollinationTypes.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-100" />

              {/* SECTION: Extra */}
              <div id="section-extra">
                <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-stone-500"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={SECTIONS[7].icon} /></svg></span>
                  Avancé
                </h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="species-origin" className={labelBase}>Origine</label>
                    <input id="species-origin" type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} className={inputBase} placeholder="ex: Asie Mineure, Europe du Sud, Amérique du Nord..." />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group py-1">
                    <div className="relative flex items-center">
                      <input type="checkbox" checked={isInvasive} onChange={(e) => setIsInvasive(e.target.checked)} className="sr-only" />
                      <div className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center ${isInvasive ? 'bg-red-500' : 'bg-stone-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${isInvasive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-sm text-stone-900">Espèce invasive</span>
                      <p className="text-xs text-stone-500">Signaler comme potentiellement invasive</p>
                    </div>
                  </label>
                  <div>
                    <label className={labelBase}>Éléments toxiques</label>
                    <SimpleEditor content={toxicElements} onUpdate={setToxicElements} toolbar={['bold', 'italic', '|', 'bulletList', 'orderedList']} />
                  </div>
                  <div>
                    <label className={labelBase}>Informations complémentaires</label>
                    <SimpleEditor content={additionalNotes} onUpdate={setAdditionalNotes} toolbar={['bold', 'italic', 'strike', '|', 'bulletList', 'orderedList']} />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
              <p className="text-xs text-stone-400 hidden sm:block"><span className="text-rose-500">*</span> Champs obligatoires — les autres sont optionnels</p>
              <div className="flex items-center gap-3 ml-auto">
                <button type="button" onClick={onCancel} disabled={busy} className="px-4 py-2.5 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors disabled:opacity-50">Annuler</button>
                <button type="submit" disabled={!canSubmit} className="px-5 py-2.5 rounded-xl font-medium text-white bg-[#5B5781] hover:bg-[#4a4770] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none flex items-center gap-2">
                  {busy ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Enregistrement...</>
                  ) : isEdit ? 'Enregistrer' : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Créer l'espèce</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </>
  )
}
