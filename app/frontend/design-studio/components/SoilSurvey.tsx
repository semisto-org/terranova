import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Trash2, AlertTriangle, FlaskConical, Image as ImageIcon } from 'lucide-react'
import { apiRequest } from '../../lib/api'

interface SoilSample {
  id: number
  locationLabel: string
  depthCm: number | null
  pollutantFlag: boolean
  labStatus: string
  results: Record<string, unknown>
}
interface ReleveData {
  planUrl: string | null
  soilSamples: SoilSample[]
}

const LAB_STATUS_LABELS: Record<string, string> = {
  pending: 'À envoyer',
  sent: 'Envoyé labo',
  received: 'Résultats reçus',
}

export function SoilSurvey({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ReleveData | null>(null)
  const [label, setLabel] = useState('')
  const [depth, setDepth] = useState('')
  const [pollutant, setPollutant] = useState(false)
  const planRef = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    apiRequest(`/api/v1/design/${projectId}/releve`).then(setData).catch(() => {})
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const addSample = useCallback(async () => {
    if (!label.trim()) return
    await apiRequest(`/api/v1/design/${projectId}/soil-samples`, {
      method: 'POST',
      body: JSON.stringify({ location_label: label, depth_cm: depth ? Number(depth) : null, pollutant_flag: pollutant }),
    })
    setLabel('')
    setDepth('')
    setPollutant(false)
    load()
  }, [label, depth, pollutant, projectId, load])

  const cycleStatus = useCallback(
    async (s: SoilSample) => {
      const order = ['pending', 'sent', 'received']
      const next = order[(order.indexOf(s.labStatus) + 1) % order.length]
      await apiRequest(`/api/v1/design/soil-samples/${s.id}`, { method: 'PATCH', body: JSON.stringify({ lab_status: next }) })
      load()
    },
    [load],
  )

  const remove = useCallback(
    async (id: number) => {
      if (!window.confirm('Supprimer ce prélèvement ?')) return
      await apiRequest(`/api/v1/design/soil-samples/${id}`, { method: 'DELETE' })
      load()
    },
    [load],
  )

  const uploadPlan = useCallback(async () => {
    const file = planRef.current?.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('plan', file)
    const res = await apiRequest(`/api/v1/design/${projectId}/releve/plan`, { method: 'POST', body: form })
    setData((d) => (d ? { ...d, planUrl: res.planUrl } : d))
    if (planRef.current) planRef.current.value = ''
  }, [projectId])

  if (!data) return null

  return (
    <div className="mt-3 rounded-xl bg-stone-50 p-3">
      {/* Plan subjectif */}
      <div className="mb-3">
        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-stone-400">
          <ImageIcon className="h-3.5 w-3.5" /> Plan subjectif
        </p>
        {data.planUrl && (
          <a href={data.planUrl} target="_blank" rel="noopener noreferrer">
            <img src={data.planUrl} alt="Plan subjectif" className="mb-2 max-h-40 rounded-lg border border-stone-200" />
          </a>
        )}
        <div className="flex items-center gap-2">
          <input ref={planRef} type="file" accept="image/*" className="text-[12px] text-stone-500" />
          <button type="button" onClick={uploadPlan} className="rounded-lg bg-stone-200 px-2.5 py-1.5 text-[12px] font-medium text-stone-700 hover:bg-stone-300">
            {data.planUrl ? 'Remplacer' : 'Téléverser'}
          </button>
        </div>
      </div>

      {/* Prélèvements de sol */}
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-stone-400">
        <FlaskConical className="h-3.5 w-3.5" /> Prélèvements de sol
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Localisation"
          className="flex-1 min-w-[8rem] rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[13px]" />
        <input value={depth} onChange={(e) => setDepth(e.target.value)} type="number" placeholder="cm"
          className="w-16 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[13px]" />
        <label className="flex items-center gap-1 text-[12px] text-stone-600">
          <input type="checkbox" checked={pollutant} onChange={(e) => setPollutant(e.target.checked)} /> Polluants ?
        </label>
        <button type="button" onClick={addSample} className="rounded-lg bg-[#AFBD00] p-1.5 text-white hover:bg-[#9aa800]">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <ul className="mt-2 space-y-1.5">
        {data.soilSamples.map((s) => (
          <li key={s.id} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[13px]">
            <span className="flex-1 text-stone-700">
              {s.locationLabel}
              {s.depthCm != null && <span className="text-stone-400"> · {s.depthCm} cm</span>}
            </span>
            {s.pollutantFlag && (
              <span className="inline-flex items-center gap-0.5 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600">
                <AlertTriangle className="h-3 w-3" /> Polluants
              </span>
            )}
            <button type="button" onClick={() => cycleStatus(s)}
              className="rounded bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600 hover:bg-stone-200">
              {LAB_STATUS_LABELS[s.labStatus] ?? s.labStatus}
            </button>
            <button type="button" onClick={() => remove(s.id)} className="rounded p-1 text-stone-300 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
