import type {
  SpeciesDetailProps,
  FilterOptions,
  Species
} from '../types'
import { PhotoGallery } from './PhotoGallery'
import { NoteCard } from './NoteCard'
import { CollapsibleSection } from './CollapsibleSection'
import { AISummaryCallout } from './AISummaryCallout'
import { NurseryStockCard } from './NurseryStockCard'
import { PlantLocationMap } from './PlantLocationMap'
import { ReferenceList } from './ReferenceList'
import { MonthsCalendar } from './MonthsCalendar'
import { SeasonCalendar } from './SeasonCalendar'
import { PropertyBadge } from './PropertyBadge'
import { AddToPaletteButton } from './AddToPaletteButton'
import { SpeciesBreadcrumb } from './SpeciesBreadcrumb'
import { CharacteristicCard } from './CharacteristicCard'
import {
  SunIcon,
  PartialShadeIcon,
  ShadeIcon,
  TreeIcon,
  ShrubIcon,
  HerbaceousIcon,
  ClimberIcon,
  GroundCoverIcon,
  DeciduousIcon,
  EvergreenIcon,
  TaprootIcon,
  FibrousRootIcon,
  SpreadingRootIcon,
  SlowGrowthIcon,
  MediumGrowthIcon,
  FastGrowthIcon,
  CanopyIcon,
  UnderstoryIcon,
  EdgeIcon,
  SelfFertileIcon,
  CrossPollinationIcon,
  HardinessIcon,
  WaterDropIcon
} from './CharacteristicIcons'

interface SpeciesDetailWithFiltersProps extends SpeciesDetailProps {
  filterOptions: FilterOptions
  siblingSpecies?: Species[]
  /** Called when user wants to add a variety to this species */
  onAddVariety?: () => void
  /** Called when user wants to edit this species */
  onEdit?: () => void
}

export function SpeciesDetail({
  species,
  genus,
  varieties,
  commonNames,
  references,
  photos,
  notes,
  plantLocations,
  nurseryStocks,
  contributors,
  filterOptions,
  siblingSpecies = [],
  aiSummary,
  onGenerateAISummary,
  onAddPhoto,
  onAddNote,
  onAddToPalette,
  onVarietySelect,
  onGenusSelect,
  onContributorSelect,
  onNurserySelect,
  onSpeciesSelect,
  onAddVariety,
  onEdit,
}: SpeciesDetailWithFiltersProps & { onSpeciesSelect?: (id: string) => void }) {
  const primaryCommonName = commonNames.find(cn => cn.language === 'fr')?.name
  const otherCommonNames = commonNames.filter(cn => cn.language !== 'fr')

  const typeLabel = filterOptions.types.find(t => t.id === species.type)?.label

  // Get icons for characteristics
  const getExposureIcon = (exposure: string) => {
    switch (exposure) {
      case 'sun': return <SunIcon className="w-7 h-7" />
      case 'partial-shade': return <PartialShadeIcon className="w-7 h-7" />
      case 'shade': return <ShadeIcon className="w-7 h-7" />
      default: return <SunIcon className="w-7 h-7" />
    }
  }

  const getTypeIcon = () => {
    switch (species.type) {
      case 'tree': return <TreeIcon className="w-7 h-7" />
      case 'shrub': return <ShrubIcon className="w-7 h-7" />
      case 'herbaceous': return <HerbaceousIcon className="w-7 h-7" />
      case 'climber': return <ClimberIcon className="w-7 h-7" />
      case 'ground-cover': return <GroundCoverIcon className="w-7 h-7" />
      default: return <TreeIcon className="w-7 h-7" />
    }
  }

  const getFoliageIcon = () => {
    switch (species.foliageType) {
      case 'evergreen': return <EvergreenIcon className="w-7 h-7" />
      case 'semi-evergreen': return <EvergreenIcon className="w-7 h-7" />
      default: return <DeciduousIcon className="w-7 h-7" />
    }
  }

  const getRootIcon = () => {
    switch (species.rootSystem) {
      case 'taproot': return <TaprootIcon className="w-7 h-7" />
      case 'fibrous': return <FibrousRootIcon className="w-7 h-7" />
      case 'spreading': return <SpreadingRootIcon className="w-7 h-7" />
      default: return <FibrousRootIcon className="w-7 h-7" />
    }
  }

  const getGrowthIcon = () => {
    switch (species.growthRate) {
      case 'slow': return <SlowGrowthIcon className="w-7 h-7" />
      case 'medium': return <MediumGrowthIcon className="w-7 h-7" />
      case 'fast': return <FastGrowthIcon className="w-7 h-7" />
      default: return <MediumGrowthIcon className="w-7 h-7" />
    }
  }

  const getZoneIcon = () => {
    switch (species.forestGardenZone) {
      case 'canopy': return <CanopyIcon className="w-7 h-7" />
      case 'understory': return <UnderstoryIcon className="w-7 h-7" />
      case 'edge': return <EdgeIcon className="w-7 h-7" />
      case 'light-shade': return <UnderstoryIcon className="w-7 h-7" />
      default: return <CanopyIcon className="w-7 h-7" />
    }
  }

  const getFertilityIcon = () => {
    switch (species.fertility) {
      case 'self-fertile': return <SelfFertileIcon className="w-7 h-7" />
      default: return <CrossPollinationIcon className="w-7 h-7" />
    }
  }

  // Icons for sections
  const icons = {
    calendar: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    soil: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
      </svg>
    ),
    uses: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    map: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    nursery: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    notes: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
    reference: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    varieties: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
          {/* Breadcrumb with dropdown */}
          <SpeciesBreadcrumb
            genus={genus}
            currentSpecies={species}
            siblingSpecies={siblingSpecies}
            onGenusSelect={onGenusSelect}
            onSpeciesSelect={onSpeciesSelect}
          />

          <div className="md:flex md:gap-8">
            {/* Photo Gallery */}
            <div className="md:w-1/2 mb-6 md:mb-0">
              <PhotoGallery
                photos={photos}
                contributors={contributors}
                onContributorSelect={onContributorSelect}
                onAddPhoto={onAddPhoto}
              />
            </div>

            {/* Header Info */}
            <div className="md:w-1/2">
              {/* Type badge */}
              {typeLabel && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#AFBD00]/15 text-[#7a8200] mb-3">
                  {typeLabel}
                </span>
              )}

              {/* Latin name */}
              <div className="flex items-start gap-3 mb-2">
                <h1 className="font-serif text-3xl md:text-4xl text-stone-900 italic">
                  {species.latinName}
                </h1>
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="shrink-0 mt-1.5 p-2 rounded-lg text-stone-400 hover:text-[#5B5781] hover:bg-[#5B5781]/10 transition-colors"
                    aria-label="Modifier l'espèce"
                    title="Modifier"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Common name */}
              {primaryCommonName && (
                <p className="text-xl text-stone-600 mb-4">
                  {primaryCommonName}
                </p>
              )}

              {/* Other common names */}
              {otherCommonNames.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {otherCommonNames.map(cn => (
                    <span
                      key={cn.id}
                      className="text-sm text-stone-500"
                    >
                      <span className="text-xs opacity-70">{cn.language.toUpperCase()}</span> {cn.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <AddToPaletteButton onAddToPalette={onAddToPalette} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Characteristics Grid */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {/* Type */}
            <CharacteristicCard
              icon={getTypeIcon()}
              label="Type"
              value={species.type}
              options={filterOptions.types}
              color="green"
            />

            {/* Exposures */}
            {species.exposures.map(exp => (
              <CharacteristicCard
                key={exp}
                icon={getExposureIcon(exp)}
                label="Exposition"
                value={exp}
                options={filterOptions.exposures}
                color="orange"
              />
            ))}

            {/* Hardiness */}
            <CharacteristicCard
              icon={<HardinessIcon className="w-7 h-7" />}
              label="Rusticité"
              value={species.hardiness.split(' ')[0] + ' ' + species.hardiness.split(' ')[1]}
              color="blue"
            />

            {/* Foliage */}
            <CharacteristicCard
              icon={getFoliageIcon()}
              label="Feuillage"
              value={species.foliageType}
              options={filterOptions.foliageTypes}
              color="green"
            />

            {/* Growth Rate */}
            <CharacteristicCard
              icon={getGrowthIcon()}
              label="Croissance"
              value={species.growthRate}
              options={filterOptions.growthRates}
              color="default"
            />

            {/* Root System */}
            <CharacteristicCard
              icon={getRootIcon()}
              label="Racines"
              value={species.rootSystem}
              options={filterOptions.rootSystems}
              color="default"
            />

            {/* Forest Garden Zone */}
            <CharacteristicCard
              icon={getZoneIcon()}
              label="Zone"
              value={species.forestGardenZone}
              options={filterOptions.forestGardenZones}
              color="purple"
            />

            {/* Fertility */}
            <CharacteristicCard
              icon={getFertilityIcon()}
              label="Fertilité"
              value={species.fertility}
              options={filterOptions.fertilityTypes}
              color="default"
            />

            {/* Watering */}
            <div className="flex flex-col items-center text-center p-3 rounded-xl hover:bg-stone-50 transition-colors">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2 bg-blue-100">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(level => (
                    <WaterDropIcon
                      key={level}
                      filled={level <= parseInt(species.wateringNeed)}
                      className={`w-3 h-3 ${level <= parseInt(species.wateringNeed) ? 'text-blue-500' : 'text-blue-300'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-stone-500 mb-0.5">Arrosage</p>
              <p className="text-sm font-medium text-stone-900">
                {filterOptions.wateringNeeds.find(w => w.id === species.wateringNeed)?.label.split(' - ')[1] || species.wateringNeed}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* Collapsible sections */}
        <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-200 overflow-hidden">
          {/* Origin & Details */}
          <div className="px-4 md:px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-stone-500 mb-1">Origine</p>
                <p className="text-sm font-medium text-stone-900">{species.origin}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-1">Cycle de vie</p>
                <p className="text-sm font-medium text-stone-900">
                  {filterOptions.lifeCycles.find(l => l.id === species.lifeCycle)?.label}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-1">Pollinisation</p>
                <p className="text-sm font-medium text-stone-900">
                  {filterOptions.pollinationTypes.find(p => p.id === species.pollinationType)?.label}
                </p>
              </div>
            </div>

            {/* Native countries */}
            {species.nativeCountries.length > 0 && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <p className="text-xs text-stone-500 mb-2">Indigène en</p>
                <div className="flex flex-wrap gap-1">
                  {species.nativeCountries.map(country => (
                    <PropertyBadge
                      key={country}
                      value={country}
                      options={filterOptions.europeanCountries}
                      variant="subtle"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {(species.isInvasive || species.toxicElements) && (
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-stone-100">
                {species.isInvasive && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Espèce invasive
                  </div>
                )}
                {species.toxicElements && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{species.toxicElements}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="px-4 md:px-6">
            <CollapsibleSection title="Calendrier" icon={icons.calendar} defaultOpen={true}>
              <SeasonCalendar
                floweringMonths={species.floweringMonths}
                fruitingMonths={species.fruitingMonths}
                harvestMonths={species.harvestMonths}
                plantingSeasons={species.plantingSeasons}
                plantingSeasonsOptions={filterOptions.plantingSeasons}
              />
            </CollapsibleSection>
          </div>

          {/* Soil & Environment */}
          <div className="px-4 md:px-6">
            <CollapsibleSection title="Sol et environnement" icon={icons.soil} defaultOpen={true}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-stone-500 mb-2">Types de sol</p>
                  <div className="flex flex-wrap gap-1">
                    {species.soilTypes.map(soil => (
                      <PropertyBadge
                        key={soil}
                        value={soil}
                        options={filterOptions.soilTypes}
                        variant="subtle"
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-2">Humidité</p>
                  <PropertyBadge
                    value={species.soilMoisture}
                    options={filterOptions.soilMoistures}
                    variant="subtle"
                  />
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-2">Richesse</p>
                  <PropertyBadge
                    value={species.soilRichness}
                    options={filterOptions.soilRichness}
                    variant="subtle"
                  />
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-2">Couleurs fleurs</p>
                  <div className="flex flex-wrap gap-1">
                    {species.flowerColors.map(color => (
                      <PropertyBadge
                        key={color}
                        value={color}
                        options={filterOptions.flowerColors}
                        variant="subtle"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>

          {/* Uses & Interests */}
          <div className="px-4 md:px-6">
            <CollapsibleSection title="Usages et intérêts" icon={icons.uses} defaultOpen={true}>
              <div className="space-y-4">
                {species.edibleParts.length > 0 && (
                  <div>
                    <p className="text-xs text-stone-500 mb-2">Parties comestibles</p>
                    <div className="flex flex-wrap gap-2">
                      {species.edibleParts.map(part => (
                        <PropertyBadge
                          key={part}
                          value={part}
                          options={filterOptions.edibleParts}
                          variant="accent"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {species.interests.length > 0 && (
                  <div>
                    <p className="text-xs text-stone-500 mb-2">Intérêts</p>
                    <div className="flex flex-wrap gap-2">
                      {species.interests.map(interest => (
                        <PropertyBadge
                          key={interest}
                          value={interest}
                          options={filterOptions.interests}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {species.transformations.length > 0 && (
                  <div>
                    <p className="text-xs text-stone-500 mb-2">Transformations</p>
                    <div className="flex flex-wrap gap-2">
                      {species.transformations.map(trans => (
                        <PropertyBadge
                          key={trans}
                          value={trans}
                          options={filterOptions.transformations}
                          variant="subtle"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {species.fodderQualities.length > 0 && (
                  <div>
                    <p className="text-xs text-stone-500 mb-2">Qualités fourragères</p>
                    <div className="flex flex-wrap gap-2">
                      {species.fodderQualities.map(fodder => (
                        <PropertyBadge
                          key={fodder}
                          value={fodder}
                          options={filterOptions.fodderQualities}
                          variant="subtle"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {species.therapeuticProperties && (
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-xs font-medium text-emerald-700 mb-1">Propriétés thérapeutiques</p>
                    <p className="text-sm text-emerald-900">{species.therapeuticProperties}</p>
                  </div>
                )}

                {species.propagationMethods.length > 0 && (
                  <div>
                    <p className="text-xs text-stone-500 mb-2">Modes de multiplication</p>
                    <div className="flex flex-wrap gap-2">
                      {species.propagationMethods.map(method => (
                        <PropertyBadge
                          key={method}
                          value={method}
                          options={filterOptions.propagationMethods}
                          variant="subtle"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>

          {/* Varieties */}
          <div className="px-4 md:px-6">
            <CollapsibleSection title="Variétés" icon={icons.varieties} badge={varieties.length} defaultOpen={varieties.length > 0}>
              {varieties.length > 0 ? (
                <div className="space-y-3">
                  {varieties.map(variety => (
                    <button
                      key={variety.id}
                      onClick={() => onVarietySelect?.(variety.id)}
                      className="w-full text-left p-4 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-stone-900 italic group-hover:text-[#5B5781] transition-colors">
                          {variety.latinName.split("'")[1]?.replace("'", '') || variety.latinName}
                        </p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${star <= variety.tasteRating ? 'text-amber-400' : 'text-stone-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 text-sm">
                        <span className="text-stone-500">Productivité: <span className="text-stone-700">{variety.productivity.split(' (')[0]}</span></span>
                        <span className="text-stone-500">Calibre: <span className="text-stone-700">{variety.fruitSize.split(' (')[0]}</span></span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500 py-2">Aucune variété enregistrée</p>
              )}
              {onAddVariety && (
                <button
                  onClick={onAddVariety}
                  className="mt-3 w-full py-2.5 rounded-xl border-2 border-dashed border-stone-200 text-sm font-medium text-stone-500 hover:border-[#5B5781] hover:text-[#5B5781] hover:bg-[#5B5781]/5 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter une variété
                </button>
              )}
            </CollapsibleSection>
          </div>

          {/* Plant Locations Map */}
          <div className="px-4 md:px-6">
            <CollapsibleSection title="Implantations" icon={icons.map} badge={plantLocations.length} defaultOpen={plantLocations.length > 0}>
              <PlantLocationMap locations={plantLocations} />
            </CollapsibleSection>
          </div>

          {/* Nursery Availability */}
          <div className="px-4 md:px-6">
            <CollapsibleSection title="Disponibilité pépinières" icon={icons.nursery} badge={nurseryStocks.length} defaultOpen={nurseryStocks.length > 0}>
              {nurseryStocks.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {nurseryStocks.map(stock => (
                    <NurseryStockCard
                      key={stock.id}
                      stock={stock}
                      onNurserySelect={onNurserySelect}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500 italic">
                  Non disponible dans les pépinières du réseau
                </p>
              )}
            </CollapsibleSection>
          </div>

          {/* Notes */}
          <div className="px-4 md:px-6">
            <CollapsibleSection title="Notes de la communauté" icon={icons.notes} badge={notes.length} defaultOpen={notes.length > 0}>
              {notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.map(note => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      contributor={contributors.find(c => c.id === note.contributorId)}
                      onContributorSelect={onContributorSelect}
                    />
                  ))}
                  <button
                    onClick={() => onAddNote?.('')}
                    className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 hover:border-[#5B5781] hover:text-[#5B5781] transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Ajouter une note
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onAddNote?.('')}
                  className="w-full py-6 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 hover:border-[#5B5781] hover:text-[#5B5781] transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span>Soyez le premier à partager vos observations</span>
                </button>
              )}
            </CollapsibleSection>
          </div>

          {/* References */}
          <div className="px-4 md:px-6">
            <CollapsibleSection title="Références" icon={icons.reference} badge={references.length} defaultOpen={references.length > 0}>
              <ReferenceList references={references} />
            </CollapsibleSection>
          </div>
        </div>

        {/* AI Summary - at bottom */}
        <div className="mt-6">
          <AISummaryCallout
            aiSummary={aiSummary}
            onGenerate={onGenerateAISummary}
          />
        </div>
      </div>
    </div>
  )
}
