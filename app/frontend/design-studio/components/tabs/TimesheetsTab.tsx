import { useState, useMemo } from 'react'
import { Clock, Plus, Trash2 } from 'lucide-react'
import type { Timesheet, ProjectPhase } from '../../types'
import { EmptyState } from '../shared/EmptyState'
import { TimesheetEditModal } from './TimesheetEditModal'

const phaseOrder: ProjectPhase[] = [
  'offre',
  'pre-projet',
  'projet-detaille',
  'mise-en-oeuvre',
  'co-gestion',
  'termine',
]

interface TimesheetsTabProps {
  timesheets: Timesheet[]
  projectPhase: ProjectPhase
  onAddTimesheet: (values: {
    member_name: string
    member_id?: string
    date: string
    hours: number
    phase: ProjectPhase
    mode: 'billed' | 'semos'
    travel_km: number
    notes: string
  }) => void
  onUpdateTimesheet?: (
    id: string,
    values: {
      date: string
      hours: number
      phase: ProjectPhase
      mode: 'billed' | 'semos'
      travel_km: number
      notes: string
    }
  ) => Promise<void>
  onDeleteTimesheet: (id: string) => void
  timesheetEditBusy?: boolean
}

export function TimesheetsTab({
  timesheets,
  projectPhase,
  onAddTimesheet,
  onUpdateTimesheet,
  onDeleteTimesheet,
  timesheetEditBusy = false,
}: TimesheetsTabProps) {
  const [editModalTimesheet, setEditModalTimesheet] = useState<Timesheet | null>(null)
  const [form, setForm] = useState({
    member_name: '',
    hours: 2,
    phase: projectPhase,
    mode: 'billed' as 'billed' | 'semos',
    travel_km: 0,
    notes: '',
  })

  const totalHours = useMemo(
    () => timesheets.reduce((sum, t) => sum + Number(t.hours || 0), 0),
    [timesheets]
  )
  const totalBilled = useMemo(
    () =>
      timesheets
        .filter((t) => t.mode === 'billed')
        .reduce((sum, t) => sum + Number(t.hours || 0), 0),
    [timesheets]
  )
  const totalSemos = useMemo(
    () =>
      timesheets
        .filter((t) => t.mode === 'semos')
        .reduce((sum, t) => sum + Number(t.hours || 0), 0),
    [timesheets]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddTimesheet({
      ...form,
      date: new Date().toISOString().slice(0, 10),
      member_id: undefined,
    })
    setForm((p) => ({ ...p, notes: '' }))
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#AFBD00]" />
          Ajouter une prestation
        </h3>
        <form
          onSubmit={handleSubmit}
          className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3"
        >
          <input
            type="text"
            placeholder="Membre"
            value={form.member_name}
            onChange={(e) =>
              setForm((p) => ({ ...p, member_name: e.target.value }))
            }
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            required
          />
          <input
            type="number"
            step="0.5"
            min="0.5"
            placeholder="Heures"
            value={form.hours}
            onChange={(e) =>
              setForm((p) => ({ ...p, hours: Number(e.target.value || 0) }))
            }
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <select
            value={form.phase}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                phase: e.target.value as ProjectPhase,
              }))
            }
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          >
            {phaseOrder.map((ph) => (
              <option key={ph} value={ph}>
                {ph}
              </option>
            ))}
          </select>
          <select
            value={form.mode}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                mode: e.target.value as 'billed' | 'semos',
              }))
            }
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          >
            <option value="billed">Facturé</option>
            <option value="semos">Semos</option>
          </select>
          <input
            type="number"
            min="0"
            placeholder="Km"
            value={form.travel_km || ''}
            onChange={(e) =>
              setForm((p) => ({ ...p, travel_km: Number(e.target.value || 0) }))
            }
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Notes"
            value={form.notes}
            onChange={(e) =>
              setForm((p) => ({ ...p, notes: e.target.value }))
            }
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent lg:col-span-1"
          />
          <div className="sm:col-span-2 lg:col-span-6">
            <button
              type="submit"
              className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>

      {(totalHours > 0 && (
        <div className="flex flex-wrap gap-4 rounded-2xl border border-stone-200 bg-[#e1e6d8]/50 p-4">
          <span className="text-sm font-medium text-stone-700">
            Total : <strong>{totalHours}h</strong>
          </span>
          <span className="text-sm text-stone-600">
            Facturées : <strong>{totalBilled}h</strong>
          </span>
          <span className="text-sm text-stone-600">
            Semos : <strong>{totalSemos}h</strong>
          </span>
        </div>
      ))}

      {timesheets.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-10 h-10 text-stone-400" />}
          title="Aucune prestation"
          description="Les heures passées sur le projet apparaîtront ici."
        />
      ) : (
        <div className="rounded-2xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-4 py-3 font-semibold text-stone-600">
                    Date
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-600">
                    Membre
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-600 text-right">
                    Heures
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-600">
                    Phase
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-600">
                    Mode
                  </th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {timesheets.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-stone-100 hover:bg-stone-50/50 ${
                      onUpdateTimesheet ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => {
                      if (onUpdateTimesheet) {
                        const ts = timesheets.find((t) => t.id === item.id)
                        if (ts) setEditModalTimesheet(ts)
                      }
                    }}
                  >
                    <td className="px-4 py-3 text-stone-600">
                      {new Date(item.date).toLocaleDateString('fr-BE')}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {item.memberName}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {Number(item.hours)}h
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {item.phase}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          item.mode === 'billed'
                            ? 'text-[#5B5781]'
                            : 'text-stone-500'
                        }
                      >
                        {item.mode === 'billed' ? 'Facturé' : 'Semos'}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onDeleteTimesheet(item.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {onUpdateTimesheet && (
        <TimesheetEditModal
          timesheet={editModalTimesheet}
          open={Boolean(editModalTimesheet)}
          busy={timesheetEditBusy}
          onSave={async (values) => {
            if (editModalTimesheet) {
              await onUpdateTimesheet(editModalTimesheet.id, values)
            }
          }}
          onClose={() => setEditModalTimesheet(null)}
        />
      )}
    </div>
  )
}
