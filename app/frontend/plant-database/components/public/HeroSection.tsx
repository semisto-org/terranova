type Photo = { id: string; url: string; role: string | null; caption: string | null }
type Species = {
  latinName: string
  commonNamesFr?: string | null
  strate?: string | null
  lifeCycle?: string | null
  successionalRole?: string | null
  hardiness?: string
  heightMinCm?: number | null
  heightMaxCm?: number | null
  spreadMinCm?: number | null
  spreadMaxCm?: number | null
  plantingSpacingCm?: number | null
  growthHabit?: string | null
}

const STRATE_LABELS: Record<string, string> = {
  low: 'Basse', medium: 'Médiane', shrub: 'Arbrisseau', tree: 'Arbre',
  canopy: 'Canopée', vine: 'Grimpante', aquatic: 'Aquatique', subterranean: 'Racinaire',
}
const STRATE_BG: Record<string, string> = {
  low: 'bg-[#C8E6A0] text-[#2d4a1f]',
  medium: 'bg-[#8FBC4F] text-white',
  shrub: 'bg-[#5A9A2F] text-white',
  tree: 'bg-[#2D7A1F] text-white',
  canopy: 'bg-[#1B4D14] text-white',
  vine: 'bg-[#B45F8E] text-white',
  aquatic: 'bg-[#4A90C2] text-white',
  subterranean: 'bg-[#8B5A3C] text-white',
}
const CYCLE_LABELS: Record<string, string> = {
  annual: 'Annuelle', biennial: 'Bisannuelle', perennial: 'Vivace',
}
const CYCLE_BG: Record<string, string> = {
  annual: 'bg-[#F4D35E] text-[#5C4500]',
  biennial: 'bg-[#EE964B] text-white',
  perennial: 'bg-[#274C77] text-white',
}
const ROLE_LABELS: Record<string, string> = {
  pioneer: 'Pionnier', nurse: 'Nourricier', climax: 'Climax',
}
const ROLE_BG: Record<string, string> = {
  pioneer: 'bg-[#E07A47] text-white',
  nurse: 'bg-[#B8916A] text-white',
  climax: 'bg-[#1B4D52] text-white',
}
const USDA_TO_C: Record<string, number> = {
  'zone-3': -40, 'zone-4': -34, 'zone-5': -29, 'zone-6': -23, 'zone-7': -18,
  'zone-8': -12, 'zone-9': -7, 'zone-10': -1,
}

export function HeroSection({ species, photos }: { species: Species; photos: Photo[] }) {
  const flowerPhoto = photos.find(p => p.role === 'flower')
  const fruitPhoto = photos.find(p => p.role === 'fruit')
  const otherPhotos = photos.filter(p => !['flower', 'fruit'].includes(p.role || ''))

  const tempC = species.hardiness ? USDA_TO_C[species.hardiness] : null

  const fmtMeters = (cm: number | null | undefined) =>
    cm == null ? null : (cm / 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })

  const hasPhotos = !!(flowerPhoto || fruitPhoto || otherPhotos.length > 0)

  return (
    <section className="bg-white">
      {hasPhotos && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1 aspect-[16/9] md:aspect-[2/1] overflow-hidden">
          {flowerPhoto && (
            <figure className="relative">
              <img src={flowerPhoto.url} alt={flowerPhoto.caption || 'Floraison'} className="w-full h-full object-cover" />
              <figcaption className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white/90 text-[10px] tracking-widest uppercase font-bold text-[#234766]">Floraison</figcaption>
            </figure>
          )}
          {fruitPhoto && (
            <figure className="relative">
              <img src={fruitPhoto.url} alt={fruitPhoto.caption || 'Fruit'} className="w-full h-full object-cover" />
              <figcaption className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white/90 text-[10px] tracking-widest uppercase font-bold text-[#234766]">Fruit</figcaption>
            </figure>
          )}
          {otherPhotos.slice(0, 1).map(p => (
            <figure key={p.id} className="hidden md:block relative">
              <img src={p.url} alt={p.caption || ''} className="w-full h-full object-cover" />
            </figure>
          ))}
        </div>
      )}

      <div className="px-6 md:px-12 py-6 md:py-8 max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl md:text-5xl tracking-tight text-stone-900">
          {species.commonNamesFr || species.latinName}
        </h1>
        <div className="italic text-stone-500 text-base md:text-lg mt-1">{species.latinName}</div>

        <div className="flex flex-wrap gap-2 mt-4">
          {species.strate && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${STRATE_BG[species.strate]}`}>
              {STRATE_LABELS[species.strate]}
            </span>
          )}
          {species.lifeCycle && CYCLE_LABELS[species.lifeCycle] && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${CYCLE_BG[species.lifeCycle]}`}>
              {CYCLE_LABELS[species.lifeCycle]}
            </span>
          )}
          {species.successionalRole && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${ROLE_BG[species.successionalRole]}`}>
              {ROLE_LABELS[species.successionalRole]}
            </span>
          )}
          {tempC != null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#dde4ec] text-[#234766]">
              ❄ −{Math.abs(tempC)} °C
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-sm text-stone-600">
          {species.heightMinCm && species.heightMaxCm && (
            <span>↕ {fmtMeters(species.heightMinCm)}–{fmtMeters(species.heightMaxCm)} m</span>
          )}
          {species.spreadMinCm && species.spreadMaxCm && (
            <span>↔ {fmtMeters(species.spreadMinCm)}–{fmtMeters(species.spreadMaxCm)} m</span>
          )}
          {species.plantingSpacingCm && (
            <span>⇿ Espacement {fmtMeters(species.plantingSpacingCm)} m</span>
          )}
          {species.growthHabit && (
            <span className="text-stone-500">Port : {species.growthHabit.replace('-', ' ')}</span>
          )}
        </div>
      </div>
    </section>
  )
}
