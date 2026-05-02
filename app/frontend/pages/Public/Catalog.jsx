import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, X, Leaf, Sprout, MapPin } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { PlantDrawer } from '@/components/public/PlantDrawer'

/**
 * /catalogue — public catalogue de la pépinière.
 * Pas d'auth, pas de shell. Inspiré des journaux botaniques :
 * fond papier crème, latin en italique, étiquettes en mono comme sur
 * une planche d'herbier.
 */
export default function PublicCatalog() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all | available | in_production
  const [drawer, setDrawer] = useState(null) // { kind: 'species'|'variety', id }

  // ── Load data
  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const catalog = await apiRequest('/api/v1/nursery/catalog')
      setBatches(catalog || [])
    } catch (e) {
      setError(e.message || 'Erreur de chargement')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Group batches by species/variety
  const groups = useMemo(() => {
    const map = new Map()
    for (const b of batches) {
      if (statusFilter === 'available' && b.status !== 'available') continue
      if (statusFilter === 'in_production' && b.status !== 'in_production') continue
      const key = b.varietyId ? `v-${b.varietyId}` : `s-${b.speciesId}`
      if (!map.has(key)) {
        map.set(key, {
          key,
          kind: b.varietyId ? 'variety' : 'species',
          targetId: b.varietyId || b.speciesId,
          speciesId: b.speciesId,
          speciesName: b.speciesName,
          varietyId: b.varietyId,
          varietyName: b.varietyName,
          varietyNotes: b.varietyNotes,
          batches: [],
          hasAvailable: false,
          earliestExpected: null,
        })
      }
      const entry = map.get(key)
      entry.batches.push(b)
      if (b.status === 'available' && b.availableQuantity > 0) entry.hasAvailable = true
      if (b.status === 'in_production' && b.expectedAvailabilityOn) {
        if (!entry.earliestExpected || b.expectedAvailabilityOn < entry.earliestExpected) entry.earliestExpected = b.expectedAvailabilityOn
      }
    }
    let list = Array.from(map.values())
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((g) => (g.speciesName || '').toLowerCase().includes(q) || (g.varietyName || '').toLowerCase().includes(q))
    }
    list.sort((a, b) => (a.speciesName || '').localeCompare(b.speciesName || ''))
    return list
  }, [batches, statusFilter, search])

  return (
    <div className="min-h-screen bg-[#fbf6ec] text-stone-800" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── Page header (editorial) */}
      <header className="relative overflow-hidden border-b border-[#2f4a3a]/15">
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-[#EF9B0D]/8 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#2f4a3a]/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 pb-12 pt-16 md:pt-24">
          <div className="flex items-baseline gap-3">
            <span className="rounded-full border border-[#2f4a3a]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2f4a3a]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Pépinières Semisto
            </span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-stone-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>· Printemps 2026</span>
          </div>
          <h1
            className="mt-4 font-serif text-5xl leading-[0.95] text-[#1d2e23] md:text-7xl"
            style={{ fontFamily: 'Sole Serif Small, serif' }}
          >
            Catalogue<br />
            <span className="italic text-[#2f4a3a]">vivant</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-stone-600 md:text-lg">
            Plantes vivaces, légumes pérennes, arbres fruitiers et lianes comestibles
            cultivés dans nos pépinières-écoles. Disponibilités mises à jour
            par les pépiniéristes.
          </p>
        </div>
      </header>

      {/* ── Search & filters bar (sticky) */}
      <div className="sticky top-0 z-20 border-b border-[#2f4a3a]/15 bg-[#fbf6ec]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (Allium ursinum, ail des ours...)"
              className="w-full rounded-full border border-[#2f4a3a]/20 bg-white/80 px-4 py-3 pl-11 text-stone-900 placeholder-stone-400 transition focus:border-[#EF9B0D] focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]/30"
            />
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <FilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>Tout</FilterChip>
            <FilterChip active={statusFilter === 'available'} onClick={() => setStatusFilter('available')}>En stock</FilterChip>
            <FilterChip active={statusFilter === 'in_production'} onClick={() => setStatusFilter('in_production')}>En production</FilterChip>
          </div>
        </div>
      </div>

      {/* ── Grid of specimens */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        {loading && <p className="text-center text-stone-500">Chargement…</p>}
        {error && <p className="text-center text-red-600">{error}</p>}
        {!loading && !error && (
          <>
            <p className="mb-8 text-sm uppercase tracking-[0.18em] text-stone-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {groups.length} {groups.length > 1 ? 'plantes' : 'plante'}
            </p>
            {groups.length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-serif text-2xl italic text-stone-500" style={{ fontFamily: 'Sole Serif Small, serif' }}>Le sentier est calme aujourd'hui</p>
                <p className="mt-2 text-sm text-stone-500">Aucune plante ne correspond à ta recherche.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {groups.map((g) => (
                  <SpecimenCard key={g.key} group={g} onOpen={() => setDrawer({ kind: g.kind, id: g.targetId })} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Footer */}
      <footer className="border-t border-[#2f4a3a]/15 bg-white/40 py-8 text-center text-xs text-stone-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        <p className="uppercase tracking-[0.2em]">Semisto · Pépinières en transition</p>
      </footer>

      {/* ── Drawer */}
      {drawer && (
        <PlantDrawer
          kind={drawer.kind}
          id={drawer.id}
          batches={batches.filter((b) => (drawer.kind === 'variety' ? b.varietyId === drawer.id : b.speciesId === drawer.id && !b.varietyId))}
          allBatchesForSpecies={batches.filter((b) => b.speciesId === (drawer.kind === 'variety' ? groups.find((g) => g.targetId === drawer.id)?.speciesId : drawer.id))}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-wider transition ${
        active
          ? 'border-[#2f4a3a] bg-[#2f4a3a] text-[#fbf6ec]'
          : 'border-[#2f4a3a]/20 bg-white/50 text-stone-700 hover:border-[#2f4a3a]/50 hover:bg-white'
      }`}
      style={{ fontFamily: 'JetBrains Mono, monospace' }}
    >
      {children}
    </button>
  )
}

function SpecimenCard({ group, onOpen }) {
  const availableBatches = group.batches.filter((b) => b.status === 'available' && b.availableQuantity > 0)
  const productionBatches = group.batches.filter((b) => b.status === 'in_production')
  const minPrice = availableBatches.length ? Math.min(...availableBatches.map((b) => b.priceEuros)) : null

  return (
    <button
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-lg border border-[#2f4a3a]/15 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#EF9B0D]/50 hover:shadow-md"
    >
      {/* corner pin (herbarium) */}
      <span aria-hidden className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[#EF9B0D]" />

      {/* status ribbon */}
      <div className="absolute left-0 top-6 flex flex-col gap-1.5 pl-0">
        {group.hasAvailable ? (
          <span className="rounded-r-full border-y border-r border-emerald-300 bg-emerald-50 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800" style={{ fontFamily: 'JetBrains Mono, monospace' }}>En stock</span>
        ) : productionBatches.length ? (
          <span className="rounded-r-full border-y border-r border-amber-300 bg-amber-50 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800" style={{ fontFamily: 'JetBrains Mono, monospace' }}>En production</span>
        ) : (
          <span className="rounded-r-full border-y border-r border-stone-300 bg-stone-50 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Épuisé</span>
        )}
      </div>

      <div className="px-6 pb-5 pt-14">
        <Leaf className="mb-3 h-5 w-5 text-[#2f4a3a]/60" aria-hidden />
        <h3 className="font-serif text-2xl italic leading-tight text-[#1d2e23]" style={{ fontFamily: 'Sole Serif Small, serif' }}>
          {group.speciesName}
        </h3>
        {group.varietyName && (
          <p className="mt-1 text-sm uppercase tracking-[0.18em] text-stone-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            <Sprout className="mr-1 inline h-3 w-3" aria-hidden /> {group.varietyName}
          </p>
        )}

        {group.varietyNotes && (
          <p className="mt-3 line-clamp-2 text-sm italic text-stone-600">"{group.varietyNotes}"</p>
        )}

        <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-[#2f4a3a]/20 to-transparent" />

        {availableBatches.length > 0 && (
          <ul className="space-y-1.5">
            {availableBatches.slice(0, 3).map((b) => (
              <li key={b.stockBatchId} className="flex items-baseline justify-between text-sm">
                <span className="text-stone-700"><span className="font-mono text-xs uppercase tracking-wider text-stone-500">{b.containerName}</span> · {b.availableQuantity ?? '—'} {b.availableQuantity ? 'disponibles' : ''}</span>
                <span className="font-medium text-[#1d2e23]">{b.priceEuros.toFixed(2)} €</span>
              </li>
            ))}
            {availableBatches.length > 3 && <li className="pt-1 text-xs italic text-stone-500">…et {availableBatches.length - 3} autre(s) format(s)</li>}
          </ul>
        )}

        {availableBatches.length === 0 && productionBatches.length > 0 && (
          <div className="text-sm text-stone-700">
            <p className="text-amber-800">Disponible {productionBatches[0].availabilityLabel || formatExpected(productionBatches[0].expectedAvailabilityOn) || 'prochainement'}</p>
            {productionBatches[0].nurseryName && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-stone-500"><MapPin className="h-3 w-3" />{productionBatches[0].nurseryName}</p>
            )}
          </div>
        )}

        {minPrice != null && (
          <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-stone-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            à partir de · {minPrice.toFixed(2)} €
          </p>
        )}
      </div>
    </button>
  )
}

function formatExpected(iso) {
  if (!iso) return null
  try { return new Date(iso).toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' }) } catch { return null }
}
