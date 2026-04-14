import { useEffect, useMemo, useState } from 'react'
import { Download, GripVertical, Plus, Send, Trash2, X } from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ExpenseNoteStatusBadge, EXPENSE_NOTE_STATUS_LABELS, type ExpenseNoteStatus } from './ExpenseNoteStatusBadge'

export interface ExpenseNoteLineForm {
  id?: string
  uid?: string
  label: string
  quantity: number
  unitAmountCents: number
  position?: number
  _destroy?: boolean
}

export interface ExpenseNoteFormValues {
  id?: string
  number?: string
  subject: string
  noteDate: string
  status: ExpenseNoteStatus
  contactId: string
  organizationId: string
  notes: string
  lines: ExpenseNoteLineForm[]
}

export interface ContactOption {
  id: string
  name: string
}

export interface OrganizationOption {
  id: string
  name: string
  isDefault?: boolean
}

export interface ExpenseNoteFormProps {
  initialValues?: Partial<ExpenseNoteFormValues>
  contacts: ContactOption[]
  organizations: OrganizationOption[]
  busy?: boolean
  onSave: (values: ExpenseNoteFormValues) => Promise<void> | void
  onTransition?: (status: ExpenseNoteStatus) => Promise<void> | void
  onDownloadPdf?: () => void
  onCancel: () => void
}

const fmtMoney = (cents: number) =>
  `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

const todayIso = () => new Date().toISOString().slice(0, 10)

let uidCounter = 0
const nextUid = () => `line-${Date.now()}-${++uidCounter}`

const blankLine = (): ExpenseNoteLineForm => ({
  uid: nextUid(),
  label: '',
  quantity: 1,
  unitAmountCents: 0,
})

const lineKey = (line: ExpenseNoteLineForm) => line.id || line.uid || ''

const NEXT_STATUS: Record<ExpenseNoteStatus, { next: ExpenseNoteStatus; label: string } | null> = {
  draft:   { next: 'to_send', label: 'Marquer à envoyer' },
  to_send: { next: 'sent',    label: 'Marquer envoyée' },
  sent:    { next: 'paid',    label: 'Marquer payée' },
  paid:    null,
}

export function ExpenseNoteForm({
  initialValues,
  contacts,
  organizations,
  busy = false,
  onSave,
  onTransition,
  onDownloadPdf,
  onCancel,
}: ExpenseNoteFormProps) {
  const defaultOrg = organizations.find((o) => o.isDefault) || organizations[0]

  const [subject, setSubject] = useState(initialValues?.subject ?? '')
  const [noteDate, setNoteDate] = useState(initialValues?.noteDate ?? todayIso())
  const [contactId, setContactId] = useState(initialValues?.contactId ?? '')
  const [organizationId, setOrganizationId] = useState(initialValues?.organizationId ?? defaultOrg?.id ?? '')
  const [notes, setNotes] = useState(initialValues?.notes ?? '')
  const [lines, setLines] = useState<ExpenseNoteLineForm[]>(
    initialValues?.lines && initialValues.lines.length > 0
      ? initialValues.lines.map((l) => ({ ...l, uid: l.uid || nextUid() }))
      : [blankLine()]
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setLines((prev) => {
      const visibleIds = prev.filter((l) => !l._destroy).map(lineKey)
      const oldIndex = visibleIds.indexOf(active.id as string)
      const newIndex = visibleIds.indexOf(over.id as string)
      if (oldIndex < 0 || newIndex < 0) return prev
      const visible = prev.filter((l) => !l._destroy)
      const reordered = arrayMove(visible, oldIndex, newIndex)
      // Merge reordered visible lines back with the destroyed ones preserved at the end
      const destroyed = prev.filter((l) => l._destroy)
      return [...reordered, ...destroyed]
    })
  }
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  const status: ExpenseNoteStatus = (initialValues?.status as ExpenseNoteStatus) || 'draft'
  const isExisting = Boolean(initialValues?.id)
  const isLocked = status !== 'draft'

  const totalCents = useMemo(
    () =>
      lines
        .filter((l) => !l._destroy)
        .reduce((sum, l) => sum + Math.round(Number(l.unitAmountCents || 0) * Number(l.quantity || 0)), 0),
    [lines]
  )

  const updateLine = (key: string, patch: Partial<ExpenseNoteLineForm>) => {
    setLines((prev) => prev.map((l) => (lineKey(l) === key ? { ...l, ...patch } : l)))
  }

  const addLine = () => setLines((prev) => [...prev, blankLine()])

  const removeLine = (key: string) => {
    setLines((prev) => {
      const target = prev.find((l) => lineKey(l) === key)
      if (!target) return prev
      if (target.id) {
        return prev.map((l) => (lineKey(l) === key ? { ...l, _destroy: true } : l))
      }
      return prev.filter((l) => lineKey(l) !== key)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!subject.trim()) return setError('Le sujet est requis.')
    if (!contactId) return setError('Sélectionnez un contact.')
    if (!organizationId) return setError('Sélectionnez une structure émettrice.')
    const visibleLines = lines.filter((l) => !l._destroy)
    if (visibleLines.length === 0) return setError('Ajoutez au moins une ligne.')
    for (const line of visibleLines) {
      if (!line.label.trim()) return setError('Chaque ligne doit avoir un libellé.')
      if (!(Number(line.quantity) > 0)) return setError('La quantité doit être supérieure à 0.')
      if (Number(line.unitAmountCents) < 0) return setError('Le montant unitaire doit être positif.')
    }
    try {
      await onSave({
        id: initialValues?.id,
        subject: subject.trim(),
        noteDate,
        status,
        contactId,
        organizationId,
        notes,
        lines: lines.map((l, idx) => ({ ...l, position: idx })),
      })
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue.')
    }
  }

  const transition = NEXT_STATUS[status]

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end"
      style={{ backgroundColor: 'rgba(28, 25, 23, 0.55)', backdropFilter: 'blur(2px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-3xl bg-gradient-to-br from-stone-50 via-white to-stone-100/40 shadow-2xl flex flex-col h-full overflow-hidden border-l border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="shrink-0 px-8 pt-7 pb-5 border-b border-stone-200 bg-white/60 backdrop-blur">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#5B5781] font-semibold">Note de frais</p>
                <ExpenseNoteStatusBadge status={status} />
              </div>
              <h2 className="mt-1 text-2xl font-bold text-stone-900 tracking-tight truncate">
                {isExisting ? initialValues?.number : 'Nouvelle note'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-7">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">{error}</div>
            )}

            {isLocked && (
              <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
                Cette note est <strong>{EXPENSE_NOTE_STATUS_LABELS[status].toLowerCase()}</strong> — l'édition reste possible mais la suppression est désactivée.
              </div>
            )}

            {/* Meta block */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FieldLabel label="Sujet" required>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex. Remboursement déplacements mars"
                  className={inputCls}
                />
              </FieldLabel>
              <FieldLabel label="Date">
                <input
                  type="date"
                  value={noteDate}
                  onChange={(e) => setNoteDate(e.target.value)}
                  className={inputCls}
                />
              </FieldLabel>
              <FieldLabel label="Contact destinataire" required>
                <select value={contactId} onChange={(e) => setContactId(e.target.value)} className={inputCls}>
                  <option value="">— Sélectionner —</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="Structure émettrice" required>
                <select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} className={inputCls}>
                  <option value="">— Sélectionner —</option>
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                      {o.isDefault ? ' (défaut)' : ''}
                    </option>
                  ))}
                </select>
              </FieldLabel>
            </section>

            {/* Lines */}
            <section>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">Lignes</h3>
                  <p className="text-xs text-stone-500">Libellé · quantité × montant unitaire</p>
                </div>
                <button
                  type="button"
                  onClick={addLine}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 bg-white text-stone-700 hover:border-[#5B5781] hover:text-[#5B5781] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter une ligne
                </button>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] uppercase tracking-wider text-stone-500 font-semibold border-b border-stone-200 bg-stone-50">
                  <div className="col-span-1" />
                  <div className="col-span-5">Libellé</div>
                  <div className="col-span-2 text-right">Quantité</div>
                  <div className="col-span-2 text-right">Montant unit.</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext
                    items={lines.filter((l) => !l._destroy).map(lineKey)}
                    strategy={verticalListSortingStrategy}
                  >
                    {lines.map((line) =>
                      line._destroy ? null : (
                        <SortableLine
                          key={lineKey(line)}
                          line={line}
                          onUpdate={(patch) => updateLine(lineKey(line), patch)}
                          onRemove={() => removeLine(lineKey(line))}
                        />
                      )
                    )}
                  </SortableContext>
                </DndContext>

                {/* Total row */}
                <div className="grid grid-cols-12 gap-2 px-4 py-4 bg-stone-50/60 border-t border-stone-200">
                  <div className="col-span-9 text-right text-[11px] uppercase tracking-wider text-stone-500 font-semibold self-center">
                    Total à régler
                  </div>
                  <div className="col-span-3 text-right text-2xl font-bold text-stone-900 tabular-nums">
                    {fmtMoney(totalCents)}
                  </div>
                </div>
              </div>
            </section>

            {/* Notes */}
            <FieldLabel label="Notes internes (optionnel)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Référence interne, contexte…"
                className={`${inputCls} resize-none`}
              />
            </FieldLabel>
          </div>

          {/* Footer */}
          <footer className="shrink-0 px-8 py-4 border-t border-stone-200 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {isExisting && onDownloadPdf && (
                  <button
                    type="button"
                    onClick={onDownloadPdf}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-stone-300 bg-white text-stone-700 hover:border-[#5B5781] hover:text-[#5B5781] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le PDF
                  </button>
                )}
                {isExisting && transition && onTransition && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onTransition(transition.next)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-stone-300 bg-white text-stone-700 hover:border-[#5B5781] hover:text-[#5B5781] transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {transition.label}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 text-sm font-medium rounded-lg bg-[#5B5781] text-white shadow-md shadow-[#5B5781]/20 hover:bg-[#4a4669] hover:shadow-lg hover:shadow-[#5B5781]/25 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {busy ? 'Enregistrement…' : isExisting ? 'Enregistrer' : 'Créer la note'}
                </button>
              </div>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg bg-white border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#5B5781] focus:ring-2 focus:ring-[#5B5781]/15 transition-all'

function FieldLabel({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}

function SortableLine({
  line,
  onUpdate,
  onRemove,
}: {
  line: ExpenseNoteLineForm
  onUpdate: (patch: Partial<ExpenseNoteLineForm>) => void
  onRemove: () => void
}) {
  const id = lineKey(line)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    position: 'relative',
    boxShadow: isDragging ? '0 10px 30px -10px rgba(91, 87, 129, 0.35)' : undefined,
    backgroundColor: isDragging ? '#ffffff' : undefined,
  }

  const total = Math.round(line.unitAmountCents * line.quantity)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-b border-stone-100 last:border-0"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="col-span-1 flex items-center justify-center text-stone-300 hover:text-[#5B5781] cursor-grab active:cursor-grabbing touch-none"
        title="Glisser pour réordonner"
        aria-label="Réordonner la ligne"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <input
        type="text"
        value={line.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
        placeholder="Libellé"
        className="col-span-5 px-2.5 py-1.5 text-sm rounded-lg bg-stone-50 border border-transparent hover:border-stone-200 focus:bg-white focus:border-[#5B5781] focus:ring-2 focus:ring-[#5B5781]/15 focus:outline-none transition-all"
      />
      <input
        type="number"
        step="0.01"
        min="0"
        value={line.quantity}
        onChange={(e) => onUpdate({ quantity: Number(e.target.value) })}
        className="col-span-2 px-2.5 py-1.5 text-sm text-right tabular-nums rounded-lg bg-stone-50 border border-transparent hover:border-stone-200 focus:bg-white focus:border-[#5B5781] focus:ring-2 focus:ring-[#5B5781]/15 focus:outline-none transition-all"
      />
      <div className="col-span-2 relative">
        <input
          type="number"
          step="0.01"
          min="0"
          value={(line.unitAmountCents / 100).toString()}
          onChange={(e) => onUpdate({ unitAmountCents: Math.round(Number(e.target.value || 0) * 100) })}
          className="w-full pr-5 pl-2.5 py-1.5 text-sm text-right tabular-nums rounded-lg bg-stone-50 border border-transparent hover:border-stone-200 focus:bg-white focus:border-[#5B5781] focus:ring-2 focus:ring-[#5B5781]/15 focus:outline-none transition-all"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-400 pointer-events-none">€</span>
      </div>
      <div className="col-span-1 text-right text-sm font-semibold text-stone-900 tabular-nums">
        {`${(total / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="col-span-1 p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors justify-self-end"
        title="Supprimer la ligne"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
