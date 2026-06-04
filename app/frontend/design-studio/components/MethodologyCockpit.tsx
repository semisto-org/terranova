import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Compass,
  Circle,
  CircleDashed,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  StickyNote,
  ArrowUpRight,
} from 'lucide-react'
import { apiRequest } from '../../lib/api'
import { ToolboxPanel } from './ToolboxPanel'
import { ObservationNotes } from './ObservationNotes'
import { Interview } from './Interview'
import { SoilSurvey } from './SoilSurvey'
import { TriDonnees, Biome, EchelleTemps, RessourcesLimites, SystemiqueEnPlace } from './AnalysisForms'
import { SiteMap } from './SiteMap'
import { AnalyseFonctionnelle, PositionnementEcosysteme, ContraintesCurseurs, Strategies } from './PositionnementForms'

// --- Types (miroir du payload GET /api/v1/design/:id/methodology) ---

type ItemStatus = 'todo' | 'in_progress' | 'done'

interface MethodItem {
  key: string
  label: string
}
interface MethodSubSection {
  key: string
  label: string
  tool?: string | null
  items: MethodItem[]
}
interface MethodStep {
  key: string
  label: string
  subSections: MethodSubSection[]
}
interface ItemState {
  status: ItemStatus
  notes: string | null
}
export interface MethodologyPayload {
  version: string
  steps: MethodStep[]
  items: Record<string, ItemState>
  summary: Record<string, { done: number; total: number; percent: number }>
  toolbox: Record<string, unknown>
  references: { sites: Array<{ label: string; url: string }>; apps: Array<{ label: string; usage: string }> }
}

// Libellé FR de l'outil cible d'une sous-section (deep-link vers l'onglet existant).
const TOOL_LABELS: Record<string, string> = {
  'site-analysis': "Ouvrir l'analyse de site",
  palette: 'Ouvrir la palette végétale',
  'planting-plan': 'Ouvrir le plan',
  tasks: 'Ouvrir les tâches',
  'co-gestion': 'Ouvrir la co-gestion',
  album: "Ouvrir l'album",
}

const STATUS_CYCLE: Record<ItemStatus, ItemStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
}

function leafKey(step: MethodStep, sub: MethodSubSection, item: MethodItem) {
  return `${step.key}/${sub.key}/${item.key}`
}

// Avancement d'une étape calculé côté client à partir des items (feuilles uniquement).
function stepProgress(step: MethodStep, items: Record<string, ItemState>) {
  let total = 0
  let done = 0
  step.subSections.forEach((sub) => {
    sub.items.forEach((item) => {
      total += 1
      if (items[leafKey(step, sub, item)]?.status === 'done') done += 1
    })
  })
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return { done, total, percent }
}

interface MethodologyCockpitProps {
  projectId: string
  onOpenTool?: (toolId: string) => void
  coordinates?: { lat: number; lng: number }
}

export function MethodologyCockpit({ projectId, onOpenTool, coordinates }: MethodologyCockpitProps) {
  const [data, setData] = useState<MethodologyPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeStepKey, setActiveStepKey] = useState<string | null>(null)
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiRequest(`/api/v1/design/${projectId}/methodology`)
      .then((payload: MethodologyPayload) => {
        if (cancelled) return
        setData(payload)
        setActiveStepKey((prev) => prev ?? payload.steps[0]?.key ?? null)
      })
      .catch((e) => !cancelled && setError(e.message || 'Erreur de chargement'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [projectId])

  const items = data?.items ?? {}

  const patchItem = useCallback(
    async (nodeKey: string, patch: { status?: ItemStatus; notes?: string }) => {
      // Optimiste : on met à jour localement, on réconcilie sur la réponse.
      setData((prev) => {
        if (!prev) return prev
        const current = prev.items[nodeKey] ?? { status: 'todo' as ItemStatus, notes: null }
        return {
          ...prev,
          items: {
            ...prev.items,
            [nodeKey]: {
              status: patch.status ?? current.status,
              notes: patch.notes !== undefined ? patch.notes : current.notes,
            },
          },
        }
      })
      try {
        await apiRequest(`/api/v1/design/${projectId}/methodology/item`, {
          method: 'PATCH',
          body: JSON.stringify({ node_key: nodeKey, ...patch }),
        })
      } catch (e) {
        // En cas d'échec, on recharge pour ne pas mentir sur l'état.
        apiRequest(`/api/v1/design/${projectId}/methodology`).then(setData).catch(() => {})
      }
    },
    [projectId],
  )

  const activeStep = useMemo(
    () => data?.steps.find((s) => s.key === activeStepKey) ?? null,
    [data, activeStepKey],
  )

  if (loading) {
    return <div className="py-12 text-center text-stone-500">Chargement du parcours méthodologique…</div>
  }
  if (error || !data) {
    return (
      <div className="py-12 text-center text-red-600">
        Impossible de charger la méthodologie{error ? ` : ${error}` : ''}.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="min-w-0">
        {/* En-tête : intitulé + colonne vertébrale des 6 étapes */}
        <div className="mb-5 flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#6B7A00]" />
          <h2 className="text-lg font-serif font-semibold text-stone-900">Parcours méthodologique</h2>
          <span className="text-xs text-stone-400">Design Checklist · v{data.version}</span>
        </div>

        <ol className="flex flex-wrap gap-2 mb-6">
          {data.steps.map((step, idx) => {
            const prog = stepProgress(step, items)
            const isActive = step.key === activeStepKey
            const complete = prog.total > 0 && prog.done === prog.total
            return (
              <li key={step.key}>
                <button
                  type="button"
                  onClick={() => setActiveStepKey(step.key)}
                  className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors ${
                    isActive
                      ? 'border-[#AFBD00] bg-[#AFBD00]/10'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      complete
                        ? 'bg-[#AFBD00] text-white'
                        : isActive
                          ? 'bg-[#AFBD00]/20 text-[#6B7A00]'
                          : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {complete ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-stone-800 leading-tight">
                      {step.label}
                    </span>
                    <span className="block text-[11px] text-stone-400">
                      {prog.done}/{prog.total} · {prog.percent}%
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        {/* Panneau de l'étape active : sous-sections + checklist guidée */}
        {activeStep && (
          <div className="space-y-5">
            {activeStep.subSections.map((sub) => (
              <section key={sub.key} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-stone-800">{sub.label}</h3>
                  {sub.tool && onOpenTool && (
                    <button
                      type="button"
                      onClick={() => onOpenTool(sub.tool as string)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#AFBD00]/10 px-2.5 py-1 text-xs font-medium text-[#6B7A00] hover:bg-[#AFBD00]/20"
                    >
                      {TOOL_LABELS[sub.tool] ?? "Ouvrir l'outil"}
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {sub.items.map((item) => {
                    const key = leafKey(activeStep, sub, item)
                    const state = items[key] ?? { status: 'todo' as ItemStatus, notes: null }
                    const noteOpen = openNotes[key]
                    return (
                      <li key={item.key} className="rounded-lg px-1 py-1 hover:bg-stone-50/80">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            title="Changer l'état"
                            onClick={() => patchItem(key, { status: STATUS_CYCLE[state.status] })}
                            className="shrink-0"
                          >
                            {state.status === 'done' ? (
                              <CheckCircle2 className="w-5 h-5 text-[#AFBD00]" />
                            ) : state.status === 'in_progress' ? (
                              <CircleDashed className="w-5 h-5 text-amber-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-stone-300" />
                            )}
                          </button>
                          <span
                            className={`flex-1 text-[13px] ${
                              state.status === 'done' ? 'text-stone-400 line-through' : 'text-stone-700'
                            }`}
                          >
                            {item.label}
                          </span>
                          <button
                            type="button"
                            title="Note"
                            onClick={() => setOpenNotes((o) => ({ ...o, [key]: !o[key] }))}
                            className={`shrink-0 rounded p-1 hover:bg-stone-100 ${
                              state.notes ? 'text-[#6B7A00]' : 'text-stone-300'
                            }`}
                          >
                            <StickyNote className="w-4 h-4" />
                          </button>
                        </div>
                        {noteOpen && (
                          <textarea
                            defaultValue={state.notes ?? ''}
                            placeholder="Note de terrain, observation…"
                            onBlur={(e) => {
                              if (e.target.value !== (state.notes ?? '')) {
                                patchItem(key, { notes: e.target.value })
                              }
                            }}
                            className="mt-1.5 ml-7 w-[calc(100%-1.75rem)] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-[13px] text-stone-700 focus:border-[#AFBD00] focus:ring-1 focus:ring-[#AFBD00]"
                            rows={2}
                          />
                        )}
                      </li>
                    )
                  })}
                </ul>
                {activeStep.key === 'observation' && sub.key === 'promenade-sensible' && (
                  <ObservationNotes projectId={projectId} />
                )}
                {activeStep.key === 'observation' && sub.key === 'entrevue' && (
                  <Interview projectId={projectId} />
                )}
                {activeStep.key === 'observation' && sub.key === 'releve' && (
                  <SoilSurvey projectId={projectId} />
                )}
                {activeStep.key === 'analyse-evaluation' && sub.key === 'tri-des-donnees' && (
                  <TriDonnees projectId={projectId} />
                )}
                {activeStep.key === 'analyse-evaluation' && sub.key === 'cartographie-du-site' && (
                  <SiteMap projectId={projectId} coordinates={coordinates} />
                )}
                {activeStep.key === 'analyse-evaluation' && sub.key === 'biome' && (
                  <Biome projectId={projectId} />
                )}
                {activeStep.key === 'analyse-evaluation' && sub.key === 'echelle-de-temps' && (
                  <EchelleTemps projectId={projectId} />
                )}
                {activeStep.key === 'analyse-evaluation' && sub.key === 'ressources-facteurs-limitants' && (
                  <RessourcesLimites projectId={projectId} />
                )}
                {activeStep.key === 'analyse-evaluation' && sub.key === 'systemique-en-place' && (
                  <SystemiqueEnPlace projectId={projectId} />
                )}
                {activeStep.key === 'positionnement' && sub.key === 'analyse-fonctionnelle' && (
                  <AnalyseFonctionnelle projectId={projectId} />
                )}
                {activeStep.key === 'positionnement' && sub.key === 'positionnement-ecosysteme' && (
                  <PositionnementEcosysteme projectId={projectId} />
                )}
                {activeStep.key === 'positionnement' && sub.key === 'positionnement-contraintes' && (
                  <ContraintesCurseurs projectId={projectId} />
                )}
                {activeStep.key === 'positionnement' && sub.key === 'strategies' && (
                  <Strategies projectId={projectId} />
                )}
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Colonne droite persistante : boîte à outils permacole + références */}
      <ToolboxPanel toolbox={data.toolbox} references={data.references} activeStepKey={activeStepKey} />
    </div>
  )
}
