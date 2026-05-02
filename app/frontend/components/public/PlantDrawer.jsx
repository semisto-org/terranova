import { useEffect, useState } from 'react'
import { X, MapPin, Leaf, Sprout, Sun, Cloud, Droplet, Mountain, AlertTriangle, Calendar, Star } from 'lucide-react'
import { apiRequest } from '@/lib/api'

/**
 * PlantDrawer — slide-in panel that displays a plant's botanical sheet.
 * Designed as a "specimen card pulled from the herbarium archive" :
 * deep paper texture, monospaced annotations, italic latin name, and
 * the catalogue's available batches inline at the top.
 */
export function PlantDrawer({ kind, id, batches = [], allBatchesForSpecies = [], onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setErr(null)
    const path = kind === 'variety' ? `/api/v1/plants/public/varieties/${id}` : `/api/v1/plants/public/species/${id}`
    apiRequest(path)
      .then((res) => { if (!cancelled) setData(res) })
      .catch((e) => { if (!cancelled) setErr(e.message || 'Erreur') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [kind, id])

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* overlay */}
      <button
        onClick={onClose}
        aria-label="Fermer le panneau"
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
      />
      {/* panel */}
      <aside
        role="dialog"
        aria-modal="true"
        className="relative h-full w-full max-w-[560px] overflow-y-auto bg-[#fbf6ec] shadow-2xl"
        style={{ animation: 'slideIn 280ms cubic-bezier(0.2, 0.7, 0.2, 1)' }}
      >
        <style>{`
          @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `}</style>

        <button onClick={onClose} aria-label="Fermer" className="absolute right-5 top-5 z-10 rounded-full bg-white/80 p-2 text-stone-700 shadow-sm transition hover:bg-white">
          <X className="h-4 w-4" />
        </button>

        {loading && <div className="p-12 text-center text-stone-500">Chargement…</div>}
        {err && <div className="p-12 text-center text-red-600">{err}</div>}
        {!loading && !err && data && (
          <DrawerContent
            kind={kind}
            data={data}
            batches={batches}
            allBatchesForSpecies={allBatchesForSpecies}
          />
        )}
      </aside>
    </div>
  )
}

function DrawerContent({ kind, data, batches, allBatchesForSpecies }) {
  const species = data.species
  const variety = data.variety
  const genus = data.genus
  const commonNames = data.commonNames || []
  const varieties = data.varieties || []
  const photos = data.photos || []

  const primaryName = (kind === 'variety' && variety?.latinName) || species?.latinName
  const subtitle = kind === 'variety' ? species?.latinName : (genus?.latinName ? `Genre · ${genus.latinName}` : null)

  // Group available batches per nursery
  const availBatches = batches.filter((b) => b.status === 'available' && b.availableQuantity > 0)
  const prodBatches = batches.filter((b) => b.status === 'in_production')

  return (
    <div>
      {/* Hero band */}
      <div className="border-b border-[#2f4a3a]/15 bg-white px-7 pb-7 pt-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#EF9B0D]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {kind === 'variety' ? 'Variété' : 'Espèce'}
        </p>
        <h2 className="mt-2 font-serif text-4xl italic leading-tight text-[#1d2e23]" style={{ fontFamily: 'Sole Serif Small, serif' }}>
          {primaryName}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm uppercase tracking-[0.2em] text-stone-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {subtitle}
          </p>
        )}
        {commonNames.length > 0 && (
          <p className="mt-3 text-sm text-stone-600">
            {commonNames.slice(0, 5).map((cn, i) => (
              <span key={i}>
                {i > 0 && <span className="text-stone-300"> · </span>}
                {cn.flag && <span className="mr-1">{cn.flag}</span>}
                {cn.name}
              </span>
            ))}
          </p>
        )}
      </div>

      {/* Disponibilités */}
      <Section title="Disponibilités">
        {availBatches.length === 0 && prodBatches.length === 0 && (
          <p className="text-sm italic text-stone-500">Aucun lot dans nos pépinières en ce moment.</p>
        )}
        {availBatches.length > 0 && (
          <ul className="space-y-2">
            {availBatches.map((b) => (
              <li key={b.stockBatchId} className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    <span className="font-mono text-xs uppercase tracking-wider text-emerald-700">{b.containerName}</span> · {b.availableQuantity ?? '—'} disponibles
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-800/80"><MapPin className="mr-1 inline h-3 w-3" />{b.nurseryName}</p>
                </div>
                <span className="text-base font-semibold text-emerald-900">{b.priceEuros.toFixed(2)} €</span>
              </li>
            ))}
          </ul>
        )}
        {prodBatches.length > 0 && (
          <ul className="mt-3 space-y-2">
            {prodBatches.map((b) => (
              <li key={b.stockBatchId} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-amber-900"><Calendar className="mr-1.5 inline h-3.5 w-3.5" />En production
                    {(b.availabilityLabel || b.expectedAvailabilityOn) && <span className="ml-1 font-normal italic">— disponible {b.availabilityLabel || formatDate(b.expectedAvailabilityOn)}</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-amber-800/80"><MapPin className="mr-1 inline h-3 w-3" />{b.nurseryName}</p>
                </div>
                {b.priceEuros > 0 && <span className="text-sm text-amber-800/80">~ {b.priceEuros.toFixed(2)} €</span>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Variety-specific */}
      {kind === 'variety' && variety && (
        <Section title="Variété">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Stat label="Goût" value={variety.tasteRating ? <StarRating value={variety.tasteRating} /> : '—'} />
            <Stat label="Maturité" value={variety.maturity || '—'} />
            <Stat label="Calibre fruit" value={variety.fruitSize || '—'} />
            <Stat label="Conservation" value={variety.storageLife || '—'} />
            <Stat label="Productivité" value={variety.productivity || '—'} />
            <Stat label="Résistance maladies" value={variety.diseaseResistance || '—'} />
          </div>
          {variety.additionalNotes && (
            <p className="mt-4 rounded-lg border-l-2 border-[#EF9B0D] bg-white/60 px-4 py-3 text-sm italic text-stone-700">
              "{variety.additionalNotes}"
            </p>
          )}
        </Section>
      )}

      {/* Botanique générale */}
      <Section title="Caractéristiques botaniques">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Stat icon={<Leaf className="h-3.5 w-3.5" />} label="Type" value={frenchValue(species?.type) || '—'} />
          <Stat icon={<Sprout className="h-3.5 w-3.5" />} label="Port" value={frenchHabit(species?.growthHabit) || '—'} />
          <Stat icon={<Calendar className="h-3.5 w-3.5" />} label="Cycle de vie" value={frenchValue(species?.lifeCycle) || '—'} />
          <Stat icon={<Mountain className="h-3.5 w-3.5" />} label="Dimensions" value={formatDimensions(species)} />
          <Stat icon={<Sun className="h-3.5 w-3.5" />} label="Exposition" value={listOrDash(species?.exposures, frenchValue)} />
          <Stat icon={<Cloud className="h-3.5 w-3.5" />} label="Rusticité" value={species?.hardiness || '—'} />
          <Stat icon={<Droplet className="h-3.5 w-3.5" />} label="Besoin en eau" value={species?.wateringNeed ? `${species.wateringNeed} / 5` : '—'} />
          <Stat icon={<Mountain className="h-3.5 w-3.5" />} label="Sol" value={listOrDash(species?.soilTypes, frenchValue)} />
        </div>
        {species?.isInvasive && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
            <AlertTriangle className="h-3 w-3" /> Espèce potentiellement invasive — à planter avec précaution.
          </p>
        )}
      </Section>

      {/* Qualités d'usage (ratings) */}
      {(species?.edibleRating || species?.medicinalRating) ? (
        <Section title="Qualités d'usage">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {species.edibleRating ? <Stat label="Comestible" value={<StarRating value={species.edibleRating} />} /> : <span />}
            {species.medicinalRating ? <Stat label="Médicinal" value={<StarRating value={species.medicinalRating} />} /> : <span />}
          </div>
        </Section>
      ) : null}

      {/* Comestible / usages */}
      {(species?.edibleParts?.length || species?.interests?.length || species?.transformations?.length) ? (
        <Section title="Usages">
          {species.edibleParts?.length > 0 && (
            <Detail label="Parties comestibles" tags={species.edibleParts.map(frenchValue)} />
          )}
          {species.interests?.length > 0 && (
            <Detail label="Intérêts" tags={species.interests.map(frenchValue)} />
          )}
          {species.transformations?.length > 0 && (
            <Detail label="Transformations" tags={species.transformations.map(frenchValue)} />
          )}
        </Section>
      ) : null}

      {/* Calendrier */}
      {(species?.floweringMonths?.length || species?.fruitingMonths?.length || species?.harvestMonths?.length) ? (
        <Section title="Calendrier">
          {species.floweringMonths?.length > 0 && <Detail label="Floraison" tags={species.floweringMonths.map(frenchMonth)} />}
          {species.fruitingMonths?.length > 0 && <Detail label="Fructification" tags={species.fruitingMonths.map(frenchMonth)} />}
          {species.harvestMonths?.length > 0 && <Detail label="Récolte" tags={species.harvestMonths.map(frenchMonth)} />}
        </Section>
      ) : null}

      {/* Variétés disponibles pour l'espèce (si on est sur la fiche espèce) */}
      {kind === 'species' && varieties.length > 0 && (
        <Section title="Variétés">
          <ul className="space-y-1">
            {varieties.map((v) => (
              <li key={v.id} className="flex items-start gap-2 text-sm">
                <Sprout className="mt-1 h-3.5 w-3.5 shrink-0 text-[#EF9B0D]" aria-hidden />
                <div>
                  <span className="font-serif italic text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>{v.latinName}</span>
                  {v.additionalNotes && <p className="mt-0.5 text-xs italic text-stone-600">"{v.additionalNotes}"</p>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <Section title="Photos">
          <PhotoGroup photos={photos.filter((p) => p.role === 'flower')} label="En fleur" />
          <PhotoGroup photos={photos.filter((p) => p.role === 'fruit')} label="Fruit" />
          <PhotoGroup photos={photos.filter((p) => p.role === 'foliage')} label="Feuillage" />
          <PhotoGroup photos={photos.filter((p) => p.role === 'habit')} label="Port" />
          <PhotoGroup photos={photos.filter((p) => !p.role || p.role === 'general')} label={photos.some((p) => p.role) ? 'Autres' : null} />
        </Section>
      )}

      <div className="px-7 py-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>· Fin de fiche ·</p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="border-b border-[#2f4a3a]/10 px-7 py-6">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2f4a3a]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        {title}
      </h3>
      {children}
    </section>
  )
}

function Stat({ label, value, icon }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-stone-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        {icon}{label}
      </p>
      <p className="mt-1 text-sm text-stone-800">{value}</p>
    </div>
  )
}

function Detail({ label, tags = [] }) {
  if (!tags.length) return null
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-stone-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t, i) => (
          <span key={i} className="rounded-full bg-[#2f4a3a]/8 px-2.5 py-0.5 text-xs text-[#2f4a3a]">{t}</span>
        ))}
      </div>
    </div>
  )
}

function StarRating({ value }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
      ))}
    </span>
  )
}

const FR_LABELS = {
  tree: 'Arbre', shrub: 'Arbuste', 'small-shrub': 'Petit arbuste',
  climber: 'Grimpante', herbaceous: 'Herbacée', 'ground-cover': 'Couvre-sol',
  sun: 'Soleil', 'partial-shade': 'Mi-ombre', shade: 'Ombre',
  annual: 'Annuelle', biennial: 'Bisannuelle', perennial: 'Vivace',
  deciduous: 'Caduc', 'semi-evergreen': 'Semi-persistant', evergreen: 'Persistant', marcescent: 'Marcescent',
  edge: 'Lisière', 'light-shade': 'Mi-ombre', 'full-sun': 'Plein soleil', understory: 'Sous-étage', canopy: 'Canopée',
  fruit: 'Fruit', leaf: 'Feuille', flower: 'Fleur', seed: 'Graine', root: 'Racine', bark: 'Écorce', sap: 'Sève',
  edible: 'Comestible', medicinal: 'Médicinal', 'nitrogen-fixer': "Fixateur d'azote",
  pollinator: 'Pollinisateur', hedge: 'Haie', ornamental: 'Ornemental',
  jam: 'Confiture', jelly: 'Gelée', compote: 'Compote', juice: 'Jus',
  syrup: 'Sirop', liqueur: 'Liqueur', dried: 'Séché', frozen: 'Congelé', vinegar: 'Vinaigre', chutney: 'Chutney',
  clay: 'Argileux', loam: 'Limoneux', sandy: 'Sableux', chalky: 'Calcaire', peaty: 'Tourbeux',
  jan: 'Jan', feb: 'Fév', mar: 'Mar', apr: 'Avr', may: 'Mai', jun: 'Juin',
  jul: 'Juil', aug: 'Août', sep: 'Sept', oct: 'Oct', nov: 'Nov', dec: 'Déc',
}

function frenchValue(v) {
  if (!v) return null
  if (typeof v !== 'string') return String(v)
  return FR_LABELS[v] || v
}

function frenchMonth(v) { return FR_LABELS[v] || v }

function listOrDash(arr, fn = (x) => x) {
  if (!arr || arr.length === 0) return '—'
  return arr.map(fn).filter(Boolean).join(', ')
}

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' }) } catch { return iso }
}

const HABIT_LABELS = {
  'arbustif-elance': 'Arbustif élancé',
  'arbustif-arrondi': 'Arbustif arrondi',
  'buissonnant-elance': 'Buissonnant élancé',
  'buissonnant-arrondi': 'Buissonnant arrondi',
  grimpant: 'Grimpant',
  tige: 'Tige',
  touffe: 'Touffe',
  acaule: 'Acaule',
  tapissant: 'Tapissant',
}
function frenchHabit(v) { return HABIT_LABELS[v] || null }

function formatDimensions(species) {
  if (!species) return '—'
  const h = formatRange(species.heightMinCm, species.heightMaxCm)
  const w = formatRange(species.spreadMinCm, species.spreadMaxCm)
  if (!h && !w && !species.heightDescription && !species.spreadDescription) return '—'
  const parts = []
  if (h) parts.push(`H ${h}`)
  if (w) parts.push(`L ${w}`)
  return parts.join(' × ') || species.heightDescription || species.spreadDescription || '—'
}
function formatRange(min, max) {
  if (min == null && max == null) return null
  const m = (cm) => (cm >= 100 ? `${(cm / 100).toFixed(cm % 100 === 0 ? 0 : 1)} m` : `${cm} cm`)
  if (min != null && max != null && min !== max) return `${m(min)}–${m(max)}`
  return m(min ?? max)
}

function PhotoGroup({ photos, label }) {
  if (!photos || photos.length === 0) return null
  return (
    <div className="mb-4 last:mb-0">
      {label && <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-stone-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{label}</p>}
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <a key={i} href={p.url} target="_blank" rel="noreferrer" className="group block aspect-square overflow-hidden rounded-md border border-stone-200">
            <img src={p.url} alt={p.caption || ''} className="h-full w-full object-cover transition group-hover:scale-105" />
          </a>
        ))}
      </div>
    </div>
  )
}
