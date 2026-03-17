import { useState, useEffect, useMemo } from 'react'
import { apiRequest } from '@/lib/api'
import type { Timesheet } from '../types'

const HOURS_PRESETS = [0.5, 1, 2, 4, 6, 8]

const LINK_TYPES = [
  { value: 'design', label: 'Projet de design', color: 'bg-[#AFBD00]/15 text-[#8a9600] border-[#AFBD00]/30' },
  { value: 'training', label: 'Activité Academy', color: 'bg-[#B01A19]/15 text-[#B01A19] border-[#B01A19]/30' },
  { value: 'project', label: 'Projet', color: 'bg-[#5B5781]/15 text-[#5B5781] border-[#5B5781]/30' },
] as const

type LinkType = (typeof LINK_TYPES)[number]['value']

const DESIGN_PHASES = [
  { value: 'offre', label: 'Offre' },
  { value: 'pre-projet', label: 'Pré-projet' },
  { value: 'projet-detaille', label: 'Projet détaillé' },
  { value: 'mise-en-oeuvre', label: 'Mise en oeuvre' },
  { value: 'co-gestion', label: 'Co-gestion' },
  { value: 'termine', label: 'Autonome' },
]

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]'

export interface TimesheetFormValues {
  date: string
  hours: number
  mode: 'billed' | 'semos'
  phase: string
  description: string
  travel_km: number
  billed: boolean
  design_project_id?: string
  training_id?: string
  pole_project_id?: string
}

export interface TimesheetFormProps {
  timesheet?: Timesheet | null
  onSubmit: (values: TimesheetFormValues | { description: string }) => Promise<boolean | void>
  onCancel: () => void
  busy?: boolean
}

export function TimesheetForm({
  timesheet,
  onSubmit,
  onCancel,
  busy = false,
}: TimesheetFormProps) {
  const isEdit = Boolean(timesheet)
  const [saved, setSaved] = useState(false)
  const { today, yesterday } = useMemo(() => {
    const now = new Date()
    const t = now.toISOString().slice(0, 10)
    const y = new Date(now)
    y.setDate(y.getDate() - 1)
    return { today: t, yesterday: y.toISOString().slice(0, 10) }
  }, [])
  const [date, setDate] = useState(() =>
    timesheet ? timesheet.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  )
  const [hours, setHours] = useState(timesheet?.hours ?? 4)
  const [mode, setMode] = useState<'billed' | 'semos'>(timesheet?.mode === 'semos' ? 'semos' : 'billed')
  const [description, setDescription] = useState(timesheet?.description ?? '')
  const [travelKm, setTravelKm] = useState(timesheet?.travelKm ?? 0)

  // Link type & related selections
  const [linkType, setLinkType] = useState<LinkType | null>(null)
  const [designProjectId, setDesignProjectId] = useState('')
  const [phase, setPhase] = useState('')
  const [trainingId, setTrainingId] = useState('')
  const [poleProjectId, setPoleProjectId] = useState('')

  // Data lists
  const [designProjects, setDesignProjects] = useState<{ id: string; name: string }[]>([])
  const [trainings, setTrainings] = useState<{ id: string; title: string }[]>([])
  const [poleProjects, setPoleProjects] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (!isEdit) return
    const el = document.getElementById('timesheet-description')
    el?.focus()
  }, [isEdit])

  // Fetch data lists when link type changes
  useEffect(() => {
    if (linkType === 'design' && designProjects.length === 0) {
      apiRequest('/api/v1/design').then((data) => {
        if (data?.projects) {
          setDesignProjects(data.projects.map((p: any) => ({ id: String(p.id), name: p.name })))
        }
      }).catch(() => {})
    }
    if (linkType === 'training' && trainings.length === 0) {
      apiRequest('/api/v1/academy').then((data) => {
        if (data?.trainings) {
          setTrainings(data.trainings.map((t: any) => ({ id: String(t.id), title: t.title })))
        }
      }).catch(() => {})
    }
    if (linkType === 'project' && poleProjects.length === 0) {
      apiRequest('/api/v1/lab/projects').then((data) => {
        if (data?.items) {
          setPoleProjects(data.items.map((p: any) => ({ id: String(p.id), name: p.name })))
        }
      }).catch(() => {})
    }
  }, [linkType])

  const toggleLinkType = (type: LinkType) => {
    if (linkType === type) {
      setLinkType(null)
    } else {
      setLinkType(type)
    }
    // Reset sub-selections when changing type
    setDesignProjectId('')
    setPhase('')
    setTrainingId('')
    setPoleProjectId('')
  }

  const setQuickDate = (daysOffset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    setDate(d.toISOString().slice(0, 10))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let payload: TimesheetFormValues | { description: string }
    if (isEdit) {
      payload = { description }
    } else {
      const values: TimesheetFormValues = {
        date,
        hours,
        mode,
        phase: linkType === 'design' ? phase : '',
        description,
        travel_km: travelKm,
        billed: mode === 'billed',
      }
      if (linkType === 'design' && designProjectId) {
        values.design_project_id = designProjectId
      }
      if (linkType === 'training' && trainingId) {
        values.training_id = trainingId
      }
      if (linkType === 'project' && poleProjectId) {
        values.pole_project_id = poleProjectId
      }
      payload = values
    }
    const result = await onSubmit(payload)
    if (result !== false) {
      setSaved(true)
      setTimeout(onCancel, 3000)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl border border-stone-200 shadow-2xl shadow-stone-900/20"
        onClick={(e) => e.stopPropagation()}
      >
        {saved ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4 animate-[scale-in_0.3s_ease-out]">
              <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="animate-[draw-check_0.4s_ease-out_0.15s_both]" style={{ strokeDasharray: 24, strokeDashoffset: 24, animation: 'draw-check 0.4s ease-out 0.15s forwards' }} />
              </svg>
            </div>
            <p className="text-lg font-semibold text-stone-900" style={{ fontFamily: 'var(--font-heading)' }}>
              {isEdit ? 'Prestation modifiée' : 'Prestation enregistrée'}
            </p>
            <p className="text-sm text-stone-500 mt-1">{hours}h — {new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
            <style>{`
              @keyframes draw-check {
                to { stroke-dashoffset: 0; }
              }
              @keyframes scale-in {
                from { transform: scale(0.5); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
            `}</style>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 h-full">
          <div className="shrink-0 px-6 pt-6 pb-4 border-b border-stone-100">
            <h2 className="text-xl font-bold text-stone-900 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              {isEdit ? 'Modifier la prestation' : 'Nouvelle prestation'}
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">
              {isEdit ? 'Mettez à jour la description' : 'Enregistrez vos heures travaillées'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-5">
            {!isEdit && (
              <>
                {/* Mode: Rémunéré / Bénévole (Semos) */}
                <div>
                  <span className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Type</span>
                  <div className="flex rounded-xl bg-stone-100 p-1">
                    <button
                      type="button"
                      onClick={() => setMode('billed')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'billed' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                      Rémunéré
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('semos')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'semos' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                      Bénévole (Semos)
                    </button>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <span className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Date</span>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button type="button" onClick={() => setQuickDate(-1)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${date === yesterday ? 'bg-[#5B5781] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                      Hier
                    </button>
                    <button type="button" onClick={() => setQuickDate(0)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${date === today ? 'bg-[#5B5781] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                      Aujourd&apos;hui
                    </button>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={`flex-1 min-w-[140px] ${inputBase}`} />
                  </div>
                </div>

                {/* Hours */}
                <div>
                  <span className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Heures</span>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {HOURS_PRESETS.map((h) => (
                      <button key={h} type="button" onClick={() => setHours(h)}
                        className={`min-w-[3rem] px-3 py-2 rounded-xl text-sm font-semibold tabular-nums transition-all ${hours === h ? 'bg-[#5B5781] text-white shadow-sm' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                        {h}h
                      </button>
                    ))}
                  </div>
                  <input type="number" min={0.25} max={24} step={0.25} value={hours}
                    onChange={(e) => setHours(parseFloat(e.target.value) || 0)} className={inputBase} />
                </div>

                {/* Link type */}
                <div>
                  <span className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    Lier à (optionnel)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {LINK_TYPES.map((lt) => (
                      <button key={lt.value} type="button" onClick={() => toggleLinkType(lt.value)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${linkType === lt.value ? `${lt.color} ring-2 ring-[#5B5781]/40 ring-offset-2` : 'bg-stone-100 text-stone-600 border-transparent hover:bg-stone-200'}`}>
                        {lt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional: Design project */}
                {linkType === 'design' && (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="timesheet-design-project" className="block text-sm font-medium text-stone-700 mb-1.5">
                        Projet de design
                      </label>
                      <select
                        id="timesheet-design-project"
                        value={designProjectId}
                        onChange={(e) => setDesignProjectId(e.target.value)}
                        className={inputBase}
                      >
                        <option value="">Sélectionner un projet...</option>
                        {designProjects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="timesheet-phase" className="block text-sm font-medium text-stone-700 mb-1.5">
                        Phase
                      </label>
                      <select
                        id="timesheet-phase"
                        value={phase}
                        onChange={(e) => setPhase(e.target.value)}
                        className={inputBase}
                      >
                        <option value="">Sélectionner une phase...</option>
                        {DESIGN_PHASES.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Conditional: Training */}
                {linkType === 'training' && (
                  <div>
                    <label htmlFor="timesheet-training" className="block text-sm font-medium text-stone-700 mb-1.5">
                      Activité Academy
                    </label>
                    <select
                      id="timesheet-training"
                      value={trainingId}
                      onChange={(e) => setTrainingId(e.target.value)}
                      className={inputBase}
                    >
                      <option value="">Sélectionner une activité...</option>
                      {trainings.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Conditional: Pole project */}
                {linkType === 'project' && (
                  <div>
                    <label htmlFor="timesheet-pole-project" className="block text-sm font-medium text-stone-700 mb-1.5">
                      Projet
                    </label>
                    <select
                      id="timesheet-pole-project"
                      value={poleProjectId}
                      onChange={(e) => setPoleProjectId(e.target.value)}
                      className={inputBase}
                    >
                      <option value="">Sélectionner un projet...</option>
                      {poleProjects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Travel km */}
                <div>
                  <label htmlFor="timesheet-km" className="block text-sm font-medium text-stone-700 mb-1.5">
                    Kilomètres (optionnel)
                  </label>
                  <input id="timesheet-km" type="number" min={0} step={1} value={travelKm || ''}
                    onChange={(e) => setTravelKm(parseFloat(e.target.value) || 0)} className={inputBase} placeholder="0" />
                </div>
              </>
            )}

            {/* Description */}
            <div>
              <label htmlFor="timesheet-description" className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea id="timesheet-description" value={description}
                onChange={(e) => setDescription(e.target.value)} required rows={isEdit ? 3 : 4}
                className={`${inputBase} resize-none`} placeholder="Ex: Atelier design client Dupont, réunion coordination..."
                autoFocus={isEdit} />
            </div>
          </div>

          <div className="shrink-0 px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-3">
            <button type="button" onClick={onCancel}
              className="px-4 py-2.5 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={busy}
              className="px-5 py-2.5 rounded-xl font-medium text-white bg-[#5B5781] hover:bg-[#4a4669] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-[#5B5781]/20 transition-all duration-200 hover:shadow-[#5B5781]/30 active:scale-[0.99]">
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enregistrement...
                </span>
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
