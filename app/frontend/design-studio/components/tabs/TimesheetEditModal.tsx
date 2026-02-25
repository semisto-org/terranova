import { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api'
import { Clock, ChevronDown, ChevronRight, Database } from 'lucide-react'
import type { Timesheet, ProjectPhase } from '../../types'
import { phaseLabels } from '../shared/PhaseIndicator'
import type { TimesheetServiceTypeConfig } from '@/lab-management/types'

const phaseOrder: ProjectPhase[] = [
  'offre',
  'pre-projet',
  'projet-detaille',
  'mise-en-oeuvre',
  'co-gestion',
  'termine',
]

const inputClass =
  'rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent'
const labelClass = 'block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5'

interface TimesheetEditModalProps {
  timesheet: Timesheet | null
  open: boolean
  busy: boolean
  onSave: (values: {
    date: string
    hours: number
    phase: ProjectPhase
    mode: 'billed' | 'semos'
    travel_km: number
    notes: string
    details?: string
    service_type_id?: string | null
  }) => Promise<void>
  onClose: () => void
}

export function TimesheetEditModal({
  timesheet,
  open,
  busy,
  onSave,
  onClose,
}: TimesheetEditModalProps) {
  const [date, setDate] = useState('')
  const [hours, setHours] = useState(0)
  const [phase, setPhase] = useState<ProjectPhase>('offre')
  const [mode, setMode] = useState<'billed' | 'semos'>('billed')
  const [travelKm, setTravelKm] = useState(0)
  const [notes, setNotes] = useState('')
  const [details, setDetails] = useState('')
  const [serviceTypeId, setServiceTypeId] = useState<string | null>(null)
  const [serviceTypes, setServiceTypes] = useState<TimesheetServiceTypeConfig[]>([])
  const [showRawData, setShowRawData] = useState(false)

  useEffect(() => {
    if (timesheet) {
      setDate(timesheet.date.slice(0, 10))
      setHours(Number(timesheet.hours) || 0)
      setPhase((timesheet.phase as ProjectPhase) || 'offre')
      setMode((timesheet.mode as 'billed' | 'semos') || 'billed')
      setTravelKm(Number(timesheet.travelKm) || 0)
      setNotes(timesheet.notes || '')
      setDetails(timesheet.details || '')
      setServiceTypeId(timesheet.serviceTypeId || null)
    }
  }, [timesheet])

  useEffect(() => {
    let cancelled = false

    apiRequest('/api/v1/lab/timesheet-service-types')
      .then((response: { items?: TimesheetServiceTypeConfig[] }) => {
        if (!cancelled) setServiceTypes(response.items || [])
      })
      .catch(() => {
        if (!cancelled) setServiceTypes([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!open || !timesheet) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({
      date,
      hours,
      phase,
      mode,
      travel_km: travelKm,
      notes,
      details: details || undefined,
      service_type_id: serviceTypeId || undefined,
    })
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md max-h-[90vh] flex flex-col bg-white rounded-2xl border border-stone-200 shadow-2xl shadow-stone-900/10 overflow-hidden">
          <div className="shrink-0 px-6 py-5 border-b border-stone-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#AFBD00]" />
            <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
              Modifier la prestation
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className={labelClass}>Membre</label>
              <input
                type="text"
                value={timesheet.memberName}
                readOnly
                className={`${inputClass} bg-stone-50 text-stone-600 cursor-not-allowed`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Heures</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value || 0))}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phase</label>
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value as ProjectPhase)}
                  className={inputClass}
                >
                  {phaseOrder.map((ph) => (
                    <option key={ph} value={ph}>
                      {phaseLabels[ph]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as 'billed' | 'semos')}
                  className={inputClass}
                >
                  <option value="billed">Facturé</option>
                  <option value="semos">Semos</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Km déplacement</label>
              <input
                type="number"
                min="0"
                value={travelKm || ''}
                onChange={(e) => setTravelKm(Number(e.target.value || 0))}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Type de prestation</label>
              <select
                value={serviceTypeId || ''}
                onChange={(e) => setServiceTypeId(e.target.value || null)}
                className={inputClass}
              >
                <option value="">— Aucun —</option>
                {serviceTypes.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Détails</label>
              <input
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className={inputClass}
                placeholder="Descriptif court de l'activité"
              />
            </div>

            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`${inputClass} min-h-[80px] resize-y`}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2.5 rounded-lg bg-[#AFBD00] text-stone-900 text-sm font-semibold hover:bg-[#9aa800] disabled:opacity-60 transition-colors"
              >
                {busy ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>

            {/* Raw data section */}
            <div className="mt-6 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowRawData((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
              >
                {showRawData ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <Database className="w-4 h-4" />
                Tous les attributs en base
              </button>
              {showRawData && (
                <div className="mt-3 rounded-xl bg-stone-50 border border-stone-200 p-4 overflow-x-auto">
                  <pre className="text-xs text-stone-600 font-mono text-left leading-relaxed">
                    {JSON.stringify(
                      {
                        id: timesheet.id,
                        projectId: timesheet.projectId,
                        memberId: timesheet.memberId,
                        memberName: timesheet.memberName,
                        date: timesheet.date,
                        hours: timesheet.hours,
                        phase: timesheet.phase,
                        mode: timesheet.mode,
                        travelKm: timesheet.travelKm,
                        notes: timesheet.notes,
                        details: timesheet.details,
                        serviceTypeId: timesheet.serviceTypeId,
                        serviceTypeLabel: timesheet.serviceTypeLabel,
                        billed: timesheet.billed,
                        trainingId: timesheet.trainingId,
                        notionId: timesheet.notionId,
                        notionCreatedAt: timesheet.notionCreatedAt,
                        notionUpdatedAt: timesheet.notionUpdatedAt,
                        createdAt: timesheet.createdAt,
                        updatedAt: timesheet.updatedAt,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
