import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, X, Briefcase, Compass, GraduationCap, Users } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import type { Timesheet } from '../types'

const HOURS_PRESETS = [0.5, 1, 2, 4, 6, 8]

const DESIGN_PHASES = [
  { value: 'offre', label: 'Offre' },
  { value: 'pre-projet', label: 'Pré-projet' },
  { value: 'projet-detaille', label: 'Projet détaillé' },
  { value: 'mise-en-oeuvre', label: 'Mise en oeuvre' },
  { value: 'co-gestion', label: 'Co-gestion' },
  { value: 'termine', label: 'Autonome' },
]

const PROJECT_TYPE_META: Record<
  string,
  { label: string; accent: string; bg: string; text: string; border: string; modelClass: string; Icon: typeof Briefcase }
> = {
  'lab-project': {
    label: 'Lab',
    accent: '#5B5781',
    bg: 'bg-[#5B5781]/12',
    text: 'text-[#5B5781]',
    border: 'border-[#5B5781]/25',
    modelClass: 'PoleProject',
    Icon: Briefcase,
  },
  'design-project': {
    label: 'Design',
    accent: '#AFBD00',
    bg: 'bg-[#AFBD00]/15',
    text: 'text-[#7a8500]',
    border: 'border-[#AFBD00]/30',
    modelClass: 'Design::Project',
    Icon: Compass,
  },
  training: {
    label: 'Academy',
    accent: '#B01A19',
    bg: 'bg-[#B01A19]/12',
    text: 'text-[#B01A19]',
    border: 'border-[#B01A19]/25',
    modelClass: 'Academy::Training',
    Icon: GraduationCap,
  },
  guild: {
    label: 'Guild',
    accent: '#234766',
    bg: 'bg-[#234766]/12',
    text: 'text-[#234766]',
    border: 'border-[#234766]/25',
    modelClass: 'Guild',
    Icon: Users,
  },
}

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]'

interface ProjectOption {
  id: string
  name: string
  typeKey: string
}

export interface TimesheetFormValues {
  date: string
  hours: number
  mode: 'billed' | 'semos'
  phase: string
  description: string
  travel_km: number
  billed: boolean
  projectable_type?: string
  projectable_id?: string
}

export interface TimesheetFormProps {
  timesheet?: Timesheet | null
  onSubmit: (values: TimesheetFormValues | { description: string }) => Promise<boolean | void>
  onCancel: () => void
  busy?: boolean
}

function ProjectCombobox({
  projects,
  loading,
  selected,
  onChange,
}: {
  projects: ProjectOption[]
  loading: boolean
  selected: ProjectOption | null
  onChange: (p: ProjectOption | null) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects.slice(0, 50)
    return projects
      .filter((p) => {
        const meta = PROJECT_TYPE_META[p.typeKey]
        return (
          p.name.toLowerCase().includes(q) ||
          (meta?.label.toLowerCase().includes(q) ?? false)
        )
      })
      .slice(0, 50)
  }, [projects, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  useEffect(() => {
    if (!open) return
    const item = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`)
    item?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  const commit = (p: ProjectOption | null) => {
    onChange(p)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && open) {
      e.preventDefault()
      const pick = filtered[activeIndex]
      if (pick) commit(pick)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setQuery('')
      inputRef.current?.blur()
    }
  }

  if (selected) {
    const meta = PROJECT_TYPE_META[selected.typeKey]
    const Icon = meta?.Icon ?? Briefcase
    return (
      <div
        className={`flex items-center gap-3 rounded-xl border ${meta?.border ?? 'border-stone-200'} ${meta?.bg ?? 'bg-stone-50'} px-3 py-2.5`}
      >
        <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${meta?.bg ?? 'bg-stone-100'} ${meta?.text ?? 'text-stone-600'}`}>
          <Icon className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-stone-900 truncate">{selected.name}</div>
          <div className={`text-[11px] font-medium uppercase tracking-wider ${meta?.text ?? 'text-stone-500'}`}>
            {meta?.label ?? selected.typeKey}
          </div>
        </div>
        <button
          type="button"
          onClick={() => commit(null)}
          aria-label="Retirer le projet"
          className="p-1.5 rounded-lg text-stone-500 hover:bg-white/70 hover:text-stone-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? 'Chargement des projets…' : 'Rechercher un projet par nom ou type…'}
          className={`${inputBase} pl-10`}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="project-combobox-listbox"
        />
      </div>
      {open && (
        <div
          ref={listRef}
          id="project-combobox-listbox"
          role="listbox"
          className="absolute z-50 mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-lg shadow-stone-900/10"
        >
          {loading && filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-stone-400">Chargement…</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-stone-400">
              Aucun projet ne correspond à « {query} »
            </div>
          )}
          {filtered.map((p, idx) => {
            const meta = PROJECT_TYPE_META[p.typeKey]
            const Icon = meta?.Icon ?? Briefcase
            const isActive = idx === activeIndex
            return (
              <button
                key={`${p.typeKey}-${p.id}`}
                type="button"
                role="option"
                aria-selected={isActive}
                data-idx={idx}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  commit(p)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  isActive ? 'bg-stone-100' : 'bg-white'
                }`}
              >
                <span className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${meta?.bg ?? 'bg-stone-100'} ${meta?.text ?? 'text-stone-600'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="flex-1 min-w-0 text-sm text-stone-800 truncate">{p.name}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${meta?.bg ?? 'bg-stone-100'} ${meta?.text ?? 'text-stone-500'}`}>
                  {meta?.label ?? p.typeKey}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
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

  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null)
  const [phase, setPhase] = useState('')

  useEffect(() => {
    if (!isEdit) return
    const el = document.getElementById('timesheet-description')
    el?.focus()
  }, [isEdit])

  useEffect(() => {
    if (isEdit) return
    setProjectsLoading(true)
    apiRequest('/api/v1/projects')
      .then((data) => {
        if (Array.isArray(data?.items)) {
          setProjects(
            data.items.map((p: any) => ({
              id: String(p.id),
              name: p.name,
              typeKey: p.typeKey,
            }))
          )
        }
      })
      .catch(() => {})
      .finally(() => setProjectsLoading(false))
  }, [isEdit])

  useEffect(() => {
    if (selectedProject?.typeKey !== 'design-project') setPhase('')
  }, [selectedProject])

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
        phase: selectedProject?.typeKey === 'design-project' ? phase : '',
        description,
        travel_km: travelKm,
        billed: mode === 'billed',
      }
      if (selectedProject) {
        const meta = PROJECT_TYPE_META[selectedProject.typeKey]
        if (meta) {
          values.projectable_type = meta.modelClass
          values.projectable_id = selectedProject.id
        }
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

                {/* Project (unified search) */}
                <div>
                  <span className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    Projet <span className="text-stone-400 normal-case font-normal tracking-normal">(optionnel)</span>
                  </span>
                  <ProjectCombobox
                    projects={projects}
                    loading={projectsLoading}
                    selected={selectedProject}
                    onChange={setSelectedProject}
                  />
                </div>

                {/* Conditional: Phase (design projects only) */}
                {selectedProject?.typeKey === 'design-project' && (
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
