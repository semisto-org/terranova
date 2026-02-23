import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import type { Timesheet, ProjectPhase } from '../../types'
import { phaseLabels } from '../shared/PhaseIndicator'

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

  useEffect(() => {
    if (timesheet) {
      setDate(timesheet.date.slice(0, 10))
      setHours(Number(timesheet.hours) || 0)
      setPhase((timesheet.phase as ProjectPhase) || 'offre')
      setMode((timesheet.mode as 'billed' | 'semos') || 'billed')
      setTravelKm(Number(timesheet.travelKm) || 0)
      setNotes(timesheet.notes || '')
    }
  }, [timesheet])

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
    })
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl shadow-stone-900/10 overflow-hidden">
          <div className="px-6 py-5 border-b border-stone-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#AFBD00]" />
            <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
              Modifier la prestation
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
          </form>
        </div>
      </div>
    </>
  )
}
