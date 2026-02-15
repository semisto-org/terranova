import { useState, useEffect, useMemo } from 'react'
import type { Timesheet, TimesheetCategory, PaymentType } from '../types'

const CATEGORIES: { value: TimesheetCategory; label: string; color: string }[] = [
  { value: 'design', label: 'Design', color: 'bg-[#AFBD00]/15 text-[#8a9600] dark:bg-[#AFBD00]/25 dark:text-[#c8d44a] border-[#AFBD00]/30' },
  { value: 'formation', label: 'Formation', color: 'bg-[#B01A19]/15 text-[#B01A19] dark:bg-[#B01A19]/25 dark:text-[#e47777] border-[#B01A19]/30' },
  { value: 'administratif', label: 'Administratif', color: 'bg-[#5B5781]/15 text-[#5B5781] dark:bg-[#5B5781]/25 dark:text-[#c8bfd2] border-[#5B5781]/30' },
  { value: 'coordination', label: 'Coordination', color: 'bg-[#234766]/15 text-[#234766] dark:bg-[#234766]/25 dark:text-[#7badd4] border-[#234766]/30' },
  { value: 'communication', label: 'Communication', color: 'bg-[#EF9B0D]/15 text-[#c47f00] dark:bg-[#EF9B0D]/25 dark:text-[#f5b84d] border-[#EF9B0D]/30' },
]

const HOURS_PRESETS = [0.5, 1, 2, 4, 6, 8]

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]'

export interface TimesheetFormValues {
  date: string
  hours: number
  payment_type: PaymentType
  category: TimesheetCategory
  description: string
  kilometers: number
}

export interface TimesheetFormProps {
  timesheet?: Timesheet | null
  onSubmit: (values: TimesheetFormValues | { description: string }) => Promise<void>
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
  const [paymentType, setPaymentType] = useState<PaymentType>(timesheet?.paymentType ?? 'invoice')
  const [category, setCategory] = useState<TimesheetCategory>(timesheet?.category ?? 'design')
  const [description, setDescription] = useState(timesheet?.description ?? '')
  const [kilometers, setKilometers] = useState(timesheet?.kilometers ?? 0)

  useEffect(() => {
    if (!isEdit) return
    const el = document.getElementById('timesheet-description')
    el?.focus()
  }, [isEdit])

  const setQuickDate = (daysOffset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    setDate(d.toISOString().slice(0, 10))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) {
      onSubmit({ description })
    } else {
      onSubmit({
        date,
        hours,
        payment_type: paymentType,
        category,
        description,
        kilometers,
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xl shadow-stone-900/20"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 h-full">
          <div className="shrink-0 px-6 pt-6 pb-4 border-b border-stone-100 dark:border-stone-800">
            <h2
              className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {isEdit ? 'Modifier la prestation' : 'Nouvelle prestation'}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              {isEdit
                ? 'Mettez à jour la description'
                : 'Enregistrez vos heures travaillées'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-5">
            {!isEdit && (
              <>
                {/* Date — quick picks + picker */}
                <div>
                  <span className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                    Date
                  </span>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setQuickDate(-1)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        date === yesterday ? 'bg-[#5B5781] text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      Hier
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(0)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        date === today ? 'bg-[#5B5781] text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      Aujourd&apos;hui
                    </button>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className={`flex-1 min-w-[140px] ${inputBase}`}
                    />
                  </div>
                </div>

                {/* Hours — presets + input */}
                <div>
                  <span className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                    Heures
                  </span>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {HOURS_PRESETS.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHours(h)}
                        className={`min-w-[3rem] px-3 py-2 rounded-xl text-sm font-semibold tabular-nums transition-all ${
                          hours === h
                            ? 'bg-[#5B5781] text-white shadow-sm'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={0.25}
                    max={24}
                    step={0.25}
                    value={hours}
                    onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                    className={inputBase}
                  />
                </div>

                {/* Payment type */}
                <div>
                  <span className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                    Rémunération
                  </span>
                  <div
                    role="group"
                    aria-label="Rémunération"
                    className="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-600/60"
                  >
                    <button
                      type="button"
                      onClick={() => setPaymentType('invoice')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        paymentType === 'invoice'
                          ? 'text-white shadow-sm bg-emerald-600'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      Facture
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('semos')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        paymentType === 'semos'
                          ? 'text-white shadow-sm bg-amber-500'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      Semos
                    </button>
                  </div>
                </div>

                {/* Category — chips */}
                <div>
                  <span className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                    Catégorie
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                          category === cat.value
                            ? `${cat.color} ring-2 ring-[#5B5781]/40 ring-offset-2 dark:ring-offset-stone-900`
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-transparent hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kilometers — compact, optional */}
                <div>
                  <label htmlFor="timesheet-km" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    Kilomètres (optionnel)
                  </label>
                  <input
                    id="timesheet-km"
                    type="number"
                    min={0}
                    step={1}
                    value={kilometers || ''}
                    onChange={(e) => setKilometers(parseFloat(e.target.value) || 0)}
                    className={inputBase}
                    placeholder="0"
                  />
                </div>
              </>
            )}

            {/* Description — always, prominent */}
            <div>
              <label
                htmlFor="timesheet-description"
                className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2"
              >
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="timesheet-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={isEdit ? 3 : 4}
                className={`${inputBase} resize-none`}
                placeholder="Ex: Atelier design client Dupont, réunion coordination..."
                autoFocus={isEdit}
              />
            </div>
          </div>

          <div className="shrink-0 px-6 py-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl font-medium text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 rounded-xl font-medium text-white bg-[#5B5781] hover:bg-[#4a4669] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-[#5B5781]/20 transition-all duration-200 hover:shadow-[#5B5781]/30 active:scale-[0.99]"
            >
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
      </div>
    </div>
  )
}
