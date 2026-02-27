import { useState, useEffect, useCallback } from 'react'
import {
  Wheat,
  Sprout,
  Package,
  Leaf,
  GraduationCap,
  Users,
  UserCheck,
  Heart,
  MapPin,
  Globe,
  AlertTriangle,
} from 'lucide-react'
import { apiRequest } from '../../lib/api'

// ── Types ────────────────────────────────────────────────────────────

interface HectaresData {
  potentialHa: number
  inProgressHa: number
  transformedHa: number
  totalHa: number
  projectCounts: { potential: number; inProgress: number; transformed: number }
}

interface LayerBreakdown {
  layer: string
  quantity: number
  speciesCount: number
}

interface FunctionalDiversityData {
  distinctSpeciesCount: number
  layersCovered: number
  totalLayers: number
  layerCoveragePct: number
  shannonIndex: number
  shannonNormalizedPct: number
  layerBreakdown: LayerBreakdown[]
}

interface MonthlyBreakdown {
  month: number
  itemCount: number
}

interface FoodAutonomyData {
  placeholderScore: number
  isEstimate: boolean
  monthsCovered: number
  monthlyCoveragePct: number
  monthlyBreakdown: MonthlyBreakdown[]
  productsCovered: number
  productTypes: string[]
  edibleSpeciesRatioPct: number
}

interface NurseryData {
  totalProduced: number
  totalDistributed: number
  distinctSpecies: number
}

interface AcademyData {
  trainingsCompleted: number
  peopleTrained: number
}

interface MembersData {
  total: number
  effective: number
  adherent: number
}

interface PlantHealthData {
  totalPlantRecords: number
  aliveCount: number
  survivalRatePct: number | null
  avgHealthScore: number | null
}

interface ProjectTypeBreakdown {
  type: string
  count: number
}

interface GeographicData {
  distinctCities: number
  distinctCountries: number
  projectTypeBreakdown: ProjectTypeBreakdown[]
}

interface ImpactData {
  hectares: HectaresData
  functionalDiversity: FunctionalDiversityData
  foodAutonomy: FoodAutonomyData
  nursery: NurseryData
  academy: AcademyData
  members: MembersData
  plantHealth: PlantHealthData
  geographic: GeographicData
  lastUpdatedAt: string
}

// ── Constants ────────────────────────────────────────────────────────

const LAYER_LABELS: Record<string, string> = {
  canopy: 'Canopée',
  'sub-canopy': 'Sous-canopée',
  shrub: 'Arbustes',
  herbaceous: 'Herbacées',
  'ground-cover': 'Couvre-sol',
  vine: 'Lianes',
  root: 'Racines',
}

const LAYER_COLORS: Record<string, string> = {
  canopy: '#2d6a4f',
  'sub-canopy': '#40916c',
  shrub: '#52b788',
  herbaceous: '#74c69d',
  'ground-cover': '#95d5b2',
  vine: '#b7e4c7',
  root: '#d8f3dc',
}

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

const PROJECT_TYPE_LABELS: Record<string, string> = {
  prive: 'Privé',
  professionnel: 'Professionnel',
  collectif: 'Collectif',
  public: 'Public',
}

// ── Helpers ──────────────────────────────────────────────────────────

function StatRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="w-4 h-4 text-stone-400 shrink-0" />
      <span className="text-sm text-stone-600 flex-1">{label}</span>
      <span className="text-sm font-semibold text-stone-900">{value}</span>
    </div>
  )
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-stone-200 p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  )
}

function BigNumber({ value, unit, subtitle }: { value: string | number; unit?: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-stone-900">{value}</span>
        {unit && <span className="text-lg text-stone-500">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────

function HectaresFunnel({ data }: { data: HectaresData }) {
  const maxHa = Math.max(data.potentialHa, data.inProgressHa, data.transformedHa, 0.01)
  const stages = [
    { label: 'Potentiels', ha: data.potentialHa, count: data.projectCounts.potential, color: '#d4c5a9' },
    { label: 'En cours', ha: data.inProgressHa, count: data.projectCounts.inProgress, color: '#95d5b2' },
    { label: 'Transformés', ha: data.transformedHa, count: data.projectCounts.transformed, color: '#2d6a4f' },
  ]

  return (
    <Card title="Hectares de jardin-forêt">
      <BigNumber value={data.totalHa} unit="ha" subtitle="Surface totale tous projets" />
      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-stone-700">{stage.label}</span>
              <span className="text-sm text-stone-500">
                {stage.ha} ha · {stage.count} projet{stage.count !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max((stage.ha / maxHa) * 100, stage.ha > 0 ? 4 : 0)}%`,
                  backgroundColor: stage.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function FunctionalDiversityCard({ data }: { data: FunctionalDiversityData }) {
  return (
    <Card title="Diversité fonctionnelle">
      <BigNumber
        value={`${data.shannonNormalizedPct}%`}
        subtitle={`Indice de Shannon normalisé (H=${data.shannonIndex})`}
      />

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-stone-500">Strates couvertes</span>
          <span className="text-xs font-semibold text-stone-700">{data.layersCovered}/{data.totalLayers}</span>
        </div>
        <div className="flex gap-1">
          {data.layerBreakdown.map((layer) => {
            const active = layer.quantity > 0
            return (
              <div
                key={layer.layer}
                className="flex-1 group relative"
                title={`${LAYER_LABELS[layer.layer]}: ${layer.quantity} plants, ${layer.speciesCount} espèces`}
              >
                <div
                  className={`h-6 rounded transition-colors ${active ? '' : 'opacity-20'}`}
                  style={{ backgroundColor: LAYER_COLORS[layer.layer] || '#e5e7eb' }}
                />
                <span className="block text-[9px] text-stone-500 text-center mt-1 truncate">
                  {LAYER_LABELS[layer.layer]?.slice(0, 5)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-stone-100">
        <StatRow icon={Leaf} label="Espèces distinctes" value={data.distinctSpeciesCount} />
      </div>
    </Card>
  )
}

function FoodAutonomyCard({ data }: { data: FoodAutonomyData }) {
  return (
    <Card title="Autonomie alimentaire">
      <div className="relative">
        <BigNumber
          value={`${data.placeholderScore}%`}
          subtitle={`${data.monthsCovered}/12 mois de récolte`}
        />
        {data.isEstimate && (
          <span className="absolute top-0 right-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            Estimation
          </span>
        )}
      </div>

      <div className="mb-4">
        <span className="text-xs text-stone-500 block mb-2">Calendrier de récolte</span>
        <div className="flex gap-1">
          {data.monthlyBreakdown.map((m) => {
            const active = m.itemCount > 0
            return (
              <div
                key={m.month}
                className={`flex-1 flex flex-col items-center gap-1`}
                title={`${MONTHS_FR[m.month - 1]}: ${m.itemCount} entrée${m.itemCount !== 1 ? 's' : ''}`}
              >
                <div
                  className={`w-full h-5 rounded-sm transition-colors ${active ? 'bg-green-500' : 'bg-stone-100'}`}
                />
                <span className="text-[9px] text-stone-400">{MONTHS_FR[m.month - 1]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {data.productTypes.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-stone-500 block mb-1.5">Types de produits</span>
          <div className="flex flex-wrap gap-1">
            {data.productTypes.map((p) => (
              <span key={p} className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 capitalize">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-stone-100">
        <StatRow icon={Wheat} label="Ratio espèces comestibles" value={`${data.edibleSpeciesRatioPct}%`} />
      </div>
    </Card>
  )
}

function NurseryCard({ data }: { data: NurseryData }) {
  return (
    <Card title="Pépinière">
      <StatRow icon={Sprout} label="Plants produits" value={data.totalProduced.toLocaleString('fr-BE')} />
      <StatRow icon={Package} label="Plants distribués" value={data.totalDistributed.toLocaleString('fr-BE')} />
      <StatRow icon={Leaf} label="Espèces distinctes" value={data.distinctSpecies} />
    </Card>
  )
}

function AcademyCard({ data }: { data: AcademyData }) {
  return (
    <Card title="Academy">
      <StatRow icon={GraduationCap} label="Formations complétées" value={data.trainingsCompleted} />
      <StatRow icon={Users} label="Personnes formées" value={data.peopleTrained.toLocaleString('fr-BE')} />
    </Card>
  )
}

function MembersCard({ data }: { data: MembersData }) {
  return (
    <Card title="Membres">
      <StatRow icon={Users} label="Total membres actifs" value={data.total} />
      <StatRow icon={UserCheck} label="Effectifs" value={data.effective} />
      <StatRow icon={Users} label="Adhérents" value={data.adherent} />
    </Card>
  )
}

function PlantHealthCard({ data }: { data: PlantHealthData }) {
  const survivalColor = data.survivalRatePct != null
    ? data.survivalRatePct >= 80 ? 'text-green-700 bg-green-50' : data.survivalRatePct >= 60 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'
    : 'text-stone-500 bg-stone-50'

  return (
    <Card title="Santé des plantations">
      {data.totalPlantRecords === 0 ? (
        <p className="text-sm text-stone-400 italic">Aucun suivi enregistré</p>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-3">
            <Heart className="w-5 h-5 text-stone-400" />
            <div>
              <span className={`inline-block px-2 py-0.5 rounded-full text-sm font-semibold ${survivalColor}`}>
                {data.survivalRatePct != null ? `${data.survivalRatePct}%` : '—'}
              </span>
              <span className="text-xs text-stone-500 ml-2">taux de survie</span>
            </div>
          </div>
          <div className="text-sm text-stone-600">
            <span className="font-medium">{data.aliveCount}</span> / {data.totalPlantRecords} plants vivants
          </div>
          {data.avgHealthScore != null && (
            <div className="text-sm text-stone-600 mt-1">
              Score de santé moyen : <span className="font-medium">{data.avgHealthScore}/100</span>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

function GeographicCard({ data }: { data: GeographicData }) {
  const activeTypes = data.projectTypeBreakdown.filter((t) => t.count > 0)

  return (
    <Card title="Rayonnement géographique">
      <StatRow icon={MapPin} label="Villes" value={data.distinctCities} />
      <StatRow icon={Globe} label="Pays" value={data.distinctCountries} />
      {activeTypes.length > 0 && (
        <div className="pt-3 border-t border-stone-100 mt-2">
          <span className="text-xs text-stone-500 block mb-2">Types de projets</span>
          <div className="flex flex-wrap gap-1.5">
            {activeTypes.map((t) => (
              <span key={t.type} className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
                {PROJECT_TYPE_LABELS[t.type] || t.type} ({t.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

// ── Main component ───────────────────────────────────────────────────

export function ImpactDashboard() {
  const [data, setData] = useState<ImpactData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiRequest('/api/v1/foundation/impact')
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-[#5B5781] rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-lg text-sm">
        {error}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          Impact
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Vue globale de l'impact Semisto · mis à jour {new Date(data.lastUpdatedAt).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Core indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HectaresFunnel data={data.hectares} />
        <FunctionalDiversityCard data={data.functionalDiversity} />
        <FoodAutonomyCard data={data.foodAutonomy} />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MembersCard data={data.members} />
        <NurseryCard data={data.nursery} />
        <AcademyCard data={data.academy} />
        <PlantHealthCard data={data.plantHealth} />
        <GeographicCard data={data.geographic} />
      </div>
    </div>
  )
}
