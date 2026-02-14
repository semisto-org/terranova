import type { VarietyDetailProps, FilterOptions } from '../types'
import { PhotoGallery } from './PhotoGallery'
import { NoteCard } from './NoteCard'
import { CollapsibleSection } from './CollapsibleSection'
import { AISummaryCallout } from './AISummaryCallout'
import { NurseryStockCard } from './NurseryStockCard'
import { PlantLocationMap } from './PlantLocationMap'
import { ReferenceList } from './ReferenceList'
import { AddToPaletteButton } from './AddToPaletteButton'
import { VarietyBreadcrumb } from './VarietyBreadcrumb'

export function VarietyDetail({
  variety,
  species,
  genus,
  commonNames,
  references,
  photos,
  notes,
  plantLocations,
  nurseryStocks,
  contributors,
  filterOptions,
  aiSummary,
  onGenerateAISummary,
  onAddPhoto,
  onAddNote,
  onAddReference,
  onAddToPalette,
  onSpeciesSelect,
  onContributorSelect,
  onNurserySelect,
  varieties = [],
  onVarietySelect,
}: VarietyDetailProps & { filterOptions: FilterOptions; varieties?: any[]; onVarietySelect?: (varietyId: string) => void }) {
  const primaryCommonName = commonNames.find((cn) => cn.language === 'fr')?.name
  const otherCommonNames = commonNames.filter((cn) => cn.language !== 'fr')

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      {/* Header */}
      <div className="bg-white dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {/* Breadcrumb */}
          {genus && species && (
            <VarietyBreadcrumb
              genus={genus}
              species={species}
              currentVariety={variety}
              siblingVarieties={varieties.filter((v) => v.speciesId === species.id && v.id !== variety.id)}
              onGenusSelect={() => {}}
              onSpeciesSelect={() => onSpeciesSelect?.(species.id)}
              onVarietySelect={(id) => onVarietySelect?.(id)}
            />
          )}

          <div className="mb-4 mt-4">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-2">
              <span className="italic">{variety.latinName}</span>
              {primaryCommonName && (
                <span className="ml-3 font-normal text-stone-600 dark:text-stone-400">
                  {primaryCommonName}
                </span>
              )}
            </h1>

            {/* Other common names */}
            {otherCommonNames.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-sm text-stone-500 dark:text-stone-400">Aussi appelé :</span>
                {otherCommonNames.map((cn) => (
                  <span
                    key={cn.id}
                    className="text-sm text-stone-600 dark:text-stone-400 font-medium"
                  >
                    {cn.name}
                    <span className="text-xs text-stone-400 dark:text-stone-500 ml-1">
                      ({cn.language})
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Add to palette */}
          {onAddToPalette && (
            <div className="mt-4">
              <AddToPaletteButton onAddToPalette={onAddToPalette} />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* AI Summary */}
        {aiSummary && (
          <AISummaryCallout
            aiSummary={aiSummary}
            onGenerate={onGenerateAISummary}
            targetName={variety.latinName}
          />
        )}

        {/* Variety-specific properties */}
        <CollapsibleSection title="Propriétés de la variété" icon="🌿" defaultOpen={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Taste Rating */}
            <div className="bg-white dark:bg-stone-800/50 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
              <div className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
                Qualité gustative
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${
                      star <= variety.tasteRating
                        ? 'text-amber-400 fill-current'
                        : 'text-stone-300 dark:text-stone-600'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 text-sm font-medium text-stone-700 dark:text-stone-300">
                  {variety.tasteRating}/5
                </span>
              </div>
            </div>

            {/* Productivity */}
            {variety.productivity && (
              <div className="bg-white dark:bg-stone-800/50 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
                <div className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
                  Productivité
                </div>
                <div className="text-base font-medium text-stone-900 dark:text-stone-100">
                  {variety.productivity}
                </div>
              </div>
            )}

            {/* Fruit Size */}
            {variety.fruitSize && (
              <div className="bg-white dark:bg-stone-800/50 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
                <div className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
                  Calibre des fruits
                </div>
                <div className="text-base font-medium text-stone-900 dark:text-stone-100">
                  {variety.fruitSize}
                </div>
              </div>
            )}

            {/* Storage Life */}
            {variety.storageLife && (
              <div className="bg-white dark:bg-stone-800/50 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
                <div className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
                  Durée de conservation
                </div>
                <div className="text-base font-medium text-stone-900 dark:text-stone-100">
                  {variety.storageLife}
                </div>
              </div>
            )}

            {/* Maturity */}
            {variety.maturity && (
              <div className="bg-white dark:bg-stone-800/50 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
                <div className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
                  Précocité
                </div>
                <div className="text-base font-medium text-stone-900 dark:text-stone-100">
                  {variety.maturity}
                </div>
              </div>
            )}

            {/* Disease Resistance */}
            {variety.diseaseResistance && (
              <div className="bg-white dark:bg-stone-800/50 rounded-lg p-4 border border-stone-200 dark:border-stone-700 sm:col-span-2">
                <div className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
                  Résistance aux maladies
                </div>
                <div className="text-base text-stone-900 dark:text-stone-100">
                  {variety.diseaseResistance}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Photos */}
        {photos.length > 0 && (
          <CollapsibleSection title="Photos" icon="📷" badge={photos.length} defaultOpen={true}>
            <PhotoGallery
              photos={photos}
              contributors={contributors}
              onContributorSelect={onContributorSelect}
            />
          </CollapsibleSection>
        )}

        {/* Notes */}
        {notes.length > 0 && (
          <CollapsibleSection title="Notes des contributeurs" icon="💬" badge={notes.length} defaultOpen={true}>
            <div className="space-y-4">
              {notes.map((note) => {
                const contributor = contributors.find((c) => c.id === note.contributorId)
                return (
                  <NoteCard
                    key={note.id}
                    note={note}
                    contributor={contributor}
                    onContributorSelect={onContributorSelect}
                  />
                )
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* Plant Locations */}
        {plantLocations.length > 0 && (
          <CollapsibleSection title="Carte des implantations" icon="📍" badge={plantLocations.length} defaultOpen={false}>
            <PlantLocationMap
              locations={plantLocations}
              onLocationSelect={(id) => console.log('Location selected:', id)}
            />
          </CollapsibleSection>
        )}

        {/* Nursery Stock */}
        {nurseryStocks.length > 0 && (
          <CollapsibleSection title="Disponibilité en pépinières" icon="🏪" badge={nurseryStocks.length} defaultOpen={false}>
            <div className="space-y-3">
              {nurseryStocks.map((stock) => (
                <NurseryStockCard
                  key={stock.id}
                  stock={stock}
                  onNurserySelect={() => onNurserySelect?.(stock.nurseryId)}
                />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* References */}
        {references.length > 0 && (
          <CollapsibleSection title="Références" icon="📚" badge={references.length} defaultOpen={false}>
            <ReferenceList references={references} />
          </CollapsibleSection>
        )}

        {/* Empty state */}
        {photos.length === 0 &&
          notes.length === 0 &&
          plantLocations.length === 0 &&
          nurseryStocks.length === 0 &&
          references.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700">
              <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-3xl mx-auto mb-4">
                🌿
              </div>
              <p className="text-stone-500 dark:text-stone-400">
                Aucune information supplémentaire disponible pour cette variété
              </p>
            </div>
          )}
      </div>
    </div>
  )
}

