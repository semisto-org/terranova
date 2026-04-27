import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, Check, ChevronDown, ChevronsUpDown, CreditCard, FileText, Image as ImageIcon, Link2, Paperclip, Search, Sparkles, StickyNote, Trash2, Upload, User, X } from 'lucide-react'
import type { RevenueDocument, RevenueItem } from '../../lab-management/components/RevenueList'
import { ProjectableCombobox, type ProjectableValue } from './ProjectableCombobox'

// Shared inputs — stripped-back editorial style matching the new Dépenses ledger
const inputBase =
  'w-full px-3 py-2.5 rounded-lg bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/25 focus:border-[#5B5781]'
const selectBase =
  'w-full pl-3 pr-9 py-2.5 rounded-lg bg-white border border-stone-200 text-stone-900 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/25 focus:border-[#5B5781] cursor-pointer appearance-none'

const STATUS_OPTIONS: { value: Status; label: string; dot: string; tint: string }[] = [
  { value: 'draft', label: 'Brouillon', dot: 'bg-stone-400', tint: 'ring-stone-300 text-stone-600' },
  { value: 'confirmed', label: 'Confirmée', dot: 'bg-amber-400', tint: 'ring-amber-300 text-amber-700' },
  { value: 'received', label: 'Encaissée', dot: 'bg-emerald-500', tint: 'ring-emerald-300 text-emerald-700' },
]

type Status = 'draft' | 'confirmed' | 'received'

const POLE_OPTIONS = [
  { value: '', label: 'Global', color: '#78716C' },
  { value: 'academy', label: 'Academy', color: '#B01A19' },
  { value: 'design_studio', label: 'Design Studio', color: '#AFBD00' },
  { value: 'nursery', label: 'Nursery', color: '#EF9B0D' },
  { value: 'roots', label: 'Roots', color: '#234766' },
  { value: 'lab', label: 'Lab', color: '#5B5781' },
]

// Aligns with actual DB values (e.g. '6%', 'N/A')
const VAT_RATE_OPTIONS = [
  { value: '', label: '—', numeric: null },
  { value: '0%', label: '0 %', numeric: 0 },
  { value: '6%', label: '6 %', numeric: 6 },
  { value: '12%', label: '12 %', numeric: 12 },
  { value: '21%', label: '21 %', numeric: 21 },
  { value: 'N/A', label: 'N/A', numeric: null },
] as const

const PAYMENT_METHOD_OPTIONS = [
  'Virement',
  'Carte',
  'Caisse',
  'Open Collective',
  'Punchpass',
  'Stripe',
  'Autre',
]

// Canonical list from existing DB values — keep as suggestions via datalist
const CATEGORY_SUGGESTIONS = [
  'Dons',
  'Frais',
  'Marchandises',
  'Prestations de services',
  'Transfert de charges',
  'Subventions',
  'Sponsoring',
  'Adhésions',
]

const fmtMoney = (value: number) =>
  `${Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

const parseAmount = (s: string) => {
  if (!s) return 0
  const n = parseFloat(String(s).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

interface OrganizationOption {
  value: string
  label: string
  vatSubject?: boolean
}

interface CreatedContact {
  id: string
  name?: string
  contactType?: string
  contact_type?: string
}

interface RevenueFormModalProps {
  revenue: RevenueItem | null
  contacts?: { value: string; label: string }[]
  organizations?: OrganizationOption[]
  defaultOrganizationId?: string | null
  onSave: (data: Record<string, unknown>, options?: { documents?: File[] }) => void
  onCancel: () => void
  onCreateContact?: (input: { name: string; contact_type: string }) => Promise<CreatedContact>
  onDeleteDocument?: (documentId: string) => Promise<void>
  busy?: boolean
}

export function RevenueFormModal({ revenue, contacts: contactsProp = [], organizations = [], defaultOrganizationId, onSave, onCancel, onCreateContact, onDeleteDocument, busy = false }: RevenueFormModalProps) {
  const isEdit = !!revenue
  const today = new Date().toISOString().slice(0, 10)
  const amountInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    date: today,
    status: 'draft' as Status,
    pole: '',
    contact_id: '',
    label: '',
    description: '',
    category: '',
    revenue_type: '',
    amount_excl_vat_str: '',
    vat_rate: '',
    payment_method: '',
    paid_at: '',
    invoice_url: '',
    vat_exemption: false,
    notes: '',
    organization_id: '',
    projectable: null as ProjectableValue | null,
  })

  const [showPaymentSection, setShowPaymentSection] = useState(false)
  const [showInvoiceSection, setShowInvoiceSection] = useState(false)
  const [showNotesSection, setShowNotesSection] = useState(false)
  const [showDocumentsSection, setShowDocumentsSection] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Inline contact creation
  const [contacts, setContacts] = useState(contactsProp)
  useEffect(() => { setContacts(contactsProp) }, [contactsProp])
  const [showNewContactForm, setShowNewContactForm] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactType, setNewContactType] = useState<'person' | 'organization'>('organization')
  const [creatingContact, setCreatingContact] = useState(false)
  const [contactError, setContactError] = useState<string | null>(null)

  // Document attachments
  const [existingDocuments, setExistingDocuments] = useState<RevenueDocument[]>(revenue?.documents ?? [])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [removingDocId, setRemovingDocId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (revenue) {
      setForm({
        date: revenue.date ? revenue.date.slice(0, 10) : today,
        status: (revenue.status as Status) || 'draft',
        pole: revenue.pole || '',
        contact_id: revenue.contactId || '',
        label: revenue.label || '',
        description: revenue.description || '',
        category: revenue.category || '',
        revenue_type: revenue.revenueType || '',
        amount_excl_vat_str: revenue.amountExclVat ? String(revenue.amountExclVat).replace('.', ',') : '',
        vat_rate: revenue.vatRate || '',
        payment_method: revenue.paymentMethod || '',
        paid_at: revenue.paidAt ? revenue.paidAt.slice(0, 10) : '',
        invoice_url: revenue.invoiceUrl || '',
        vat_exemption: Boolean(revenue.vatExemption),
        notes: revenue.notes || '',
        organization_id: (revenue as RevenueItem & { organizationId?: string }).organizationId || defaultOrganizationId || '',
        projectable: revenue.projectableType && revenue.projectableId
          ? { type: revenue.projectableType as ProjectableValue['type'], id: revenue.projectableId }
          : null,
      })
      setExistingDocuments(revenue.documents ?? [])
      setPendingFiles([])
      // Auto-expand optional sections that have content
      if (revenue.paymentMethod || revenue.paidAt) setShowPaymentSection(true)
      if (revenue.invoiceUrl || revenue.vatExemption) setShowInvoiceSection(true)
      if (revenue.notes) setShowNotesSection(true)
      if ((revenue.documents?.length ?? 0) > 0) setShowDocumentsSection(true)
    } else {
      amountInputRef.current?.focus()
      const initialOrg = defaultOrganizationId || organizations[0]?.value || ''
      if (initialOrg) {
        setForm((prev) => ({ ...prev, organization_id: initialOrg }))
      }
      setExistingDocuments([])
      setPendingFiles([])
    }
  }, [revenue, defaultOrganizationId, organizations])

  // Keep organization selected when options arrive async
  useEffect(() => {
    if (form.organization_id) return
    if (organizations.length === 0) return
    setForm((prev) => ({ ...prev, organization_id: defaultOrganizationId || organizations[0].value }))
  }, [organizations, defaultOrganizationId, form.organization_id])

  const update = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  // Auto-derived VAT & total from HTVA + rate
  const amountExclVat = useMemo(() => parseAmount(form.amount_excl_vat_str), [form.amount_excl_vat_str])
  const vatInfo = useMemo(() => {
    const opt = VAT_RATE_OPTIONS.find((o) => o.value === form.vat_rate)
    const pct = opt?.numeric
    if (pct == null) return { vat6: 0, vat21: 0, total: amountExclVat, pct: null as number | null }
    const vatAmount = +(amountExclVat * (pct / 100)).toFixed(2)
    return {
      vat6: pct === 6 ? vatAmount : 0,
      vat21: pct === 21 ? vatAmount : 0,
      vat12: pct === 12 ? vatAmount : 0,
      total: +(amountExclVat + vatAmount).toFixed(2),
      pct,
    }
  }, [amountExclVat, form.vat_rate])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.date) errs.date = 'Date requise'
    if (amountExclVat <= 0) errs.amount = 'Montant requis'
    return errs
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      if (errs.amount) amountInputRef.current?.focus()
      return
    }

    // Schema constraints: category/description/invoice_url/label/payment_method/revenue_type/notes
    // are NOT NULL with default ''. pole/date/paid_at/vat_rate are nullable.
    const data: Record<string, unknown> = {
      date: form.date,
      status: form.status,
      label: form.label.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      revenue_type: form.revenue_type.trim(),
      pole: form.pole || null,
      amount_excl_vat: amountExclVat,
      vat_rate: form.vat_rate || null,
      vat_6: vatInfo.vat6 || 0,
      vat_21: vatInfo.vat21 || 0,
      amount: vatInfo.total,
      payment_method: form.payment_method.trim(),
      paid_at: form.paid_at || null,
      invoice_url: form.invoice_url.trim(),
      vat_exemption: form.vat_exemption,
      notes: form.notes || '',
      projectable_type: form.projectable?.type ?? null,
      projectable_id: form.projectable?.id ?? null,
    }
    if (form.contact_id) data.contact_id = form.contact_id
    if (form.organization_id) data.organization_id = form.organization_id
    onSave(data, { documents: pendingFiles })
  }

  const handleCreateContact = async () => {
    if (!newContactName.trim() || !onCreateContact) return
    setContactError(null)
    setCreatingContact(true)
    try {
      const contact = await onCreateContact({ name: newContactName.trim(), contact_type: newContactType })
      if (contact?.id) {
        const label = contact.name ?? newContactName.trim()
        setContacts((prev) => [...prev, { value: contact.id, label }])
        update('contact_id', contact.id)
        setShowNewContactForm(false)
        setNewContactName('')
      }
    } catch (err) {
      setContactError((err as Error)?.message || 'Impossible de créer le contact')
    } finally {
      setCreatingContact(false)
    }
  }

  const handleAddFiles = (files: FileList | File[] | null) => {
    if (!files) return
    const arr = Array.from(files)
    if (arr.length === 0) return
    setPendingFiles((prev) => [...prev, ...arr])
    setShowDocumentsSection(true)
  }

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDeleteExistingDocument = async (docId: string) => {
    if (!onDeleteDocument) return
    if (!window.confirm('Supprimer ce document ? Cette action est irréversible.')) return
    setRemovingDocId(docId)
    try {
      await onDeleteDocument(docId)
      setExistingDocuments((prev) => prev.filter((d) => d.id !== docId))
    } catch (err) {
      alert((err as Error)?.message || 'Erreur lors de la suppression du document')
    } finally {
      setRemovingDocId(null)
    }
  }

  // Cmd/Ctrl + Enter submits from anywhere inside the form
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      const errs = validate()
      setErrors(errs)
      if (Object.keys(errs).length === 0) handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === form.status) ?? STATUS_OPTIONS[0]
  const currentPole = POLE_OPTIONS.find((p) => p.value === form.pole) ?? POLE_OPTIONS[0]

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm animate-[fadeIn_.15s_ease-out]"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl pointer-events-auto max-h-[92vh] overflow-hidden flex flex-col animate-[slideInRight_.25s_cubic-bezier(0.16,1,0.3,1)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header — editorial */}
          <header className="relative shrink-0 px-7 pt-6 pb-5 border-b border-stone-100">
            <div
              className="absolute left-0 top-7 bottom-5 w-[3px] rounded-full"
              style={{ backgroundColor: currentPole.color }}
              aria-hidden
            />
            <div className="flex items-start justify-between gap-4 pl-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400 font-medium">
                  {isEdit ? 'Recette · Modification' : 'Nouvelle recette'}
                </p>
                <h2 className="mt-1 font-serif text-2xl text-stone-900 leading-tight">
                  {isEdit ? form.label || form.description || 'Modifier la recette' : 'Enregistrer une recette'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="shrink-0 p-1.5 rounded-md text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          <form onSubmit={handleSubmit} onKeyDown={onKeyDown} className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 overflow-y-auto min-h-0 px-7 pt-6 pb-3 space-y-7">
              {/* HERO — amount, VAT rate, auto-derived total */}
              <section>
                <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400 font-medium mb-2">Montant</div>
                <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-stone-50/60 to-white px-5 py-4">
                  <div className="flex items-end gap-4 flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-xs text-stone-500 mb-1.5">Montant HTVA</label>
                      <div className="relative">
                        <input
                          ref={amountInputRef}
                          type="text"
                          inputMode="decimal"
                          value={form.amount_excl_vat_str}
                          onChange={(e) => {
                            // Allow only digits, comma, dot, minus
                            const cleaned = e.target.value.replace(/[^\d.,-]/g, '')
                            update('amount_excl_vat_str', cleaned)
                            if (errors.amount) setErrors((p) => ({ ...p, amount: '' }))
                          }}
                          placeholder="0,00"
                          className={`font-mono tabular-nums text-2xl font-semibold text-stone-900 w-full pl-4 pr-10 py-2 rounded-lg bg-white border ${
                            errors.amount ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-stone-200 focus:ring-[#5B5781]/25 focus:border-[#5B5781]'
                          } focus:outline-none focus:ring-2 transition-all`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-stone-400 text-xl">€</span>
                      </div>
                      {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount}</p>}
                    </div>

                    <div>
                      <label className="block text-xs text-stone-500 mb-1.5">TVA</label>
                      <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
                        {VAT_RATE_OPTIONS.filter((o) => o.value).map((opt) => {
                          const active = form.vat_rate === opt.value
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => update('vat_rate', opt.value)}
                              className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                                active ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                              }`}
                            >
                              {opt.label.replace(' %', '%')}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* TVA breakdown readout */}
                  <div className="mt-4 pt-4 border-t border-dashed border-stone-200 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
                    {vatInfo.pct != null && vatInfo.pct > 0 ? (
                      <>
                        <span className="text-stone-500">
                          TVA {vatInfo.pct}% :{' '}
                          <span className="font-mono tabular-nums text-stone-700">
                            {fmtMoney(amountExclVat * (vatInfo.pct / 100))}
                          </span>
                        </span>
                        <span className="text-stone-300">·</span>
                      </>
                    ) : vatInfo.pct === 0 ? (
                      <>
                        <span className="text-stone-500">Sans TVA</span>
                        <span className="text-stone-300">·</span>
                      </>
                    ) : null}
                    <span className="ml-auto text-stone-500">
                      Total TTC{' '}
                      <span className="font-mono tabular-nums text-lg font-semibold text-[#5B5781]">
                        {fmtMoney(vatInfo.total)}
                      </span>
                    </span>
                  </div>
                </div>
              </section>

              {/* ESSENTIALS — date, status, pole */}
              <section>
                <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400 font-medium mb-2">Essentiel</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Date" icon={<Calendar className="w-3.5 h-3.5" />} required>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => update('date', e.target.value)}
                      className={inputBase}
                    />
                  </Field>

                  <Field label="Statut">
                    <div className="relative">
                      <select
                        value={form.status}
                        onChange={(e) => update('status', e.target.value as Status)}
                        className={`${selectBase} pl-9`}
                      >
                        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <span
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none ${currentStatus.dot}`}
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                    </div>
                  </Field>

                  <Field label="Pôle">
                    <div className="relative">
                      <select
                        value={form.pole}
                        onChange={(e) => update('pole', e.target.value)}
                        className={`${selectBase} pl-9`}
                      >
                        {POLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
                        style={{ backgroundColor: currentPole.color }}
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                    </div>
                  </Field>
                </div>

                {organizations.length > 0 && (
                  <div className="mt-3">
                    <Field label="Structure *" hint="Détermine le régime TVA">
                      <div className="relative">
                        <select
                          value={form.organization_id}
                          onChange={(e) => update('organization_id', e.target.value)}
                          className={selectBase}
                          required
                        >
                          {organizations.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}{o.vatSubject === false ? ' · franchise TVA' : ''}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      </div>
                    </Field>
                  </div>
                )}
              </section>

              {/* DESCRIPTION & CLASSIFICATION */}
              <section>
                <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400 font-medium mb-2">
                  Description
                </div>
                <div className="space-y-3">
                  <Field label="Libellé">
                    <input
                      type="text"
                      value={form.label}
                      onChange={(e) => update('label', e.target.value)}
                      placeholder="Ex. Formation Permaculture — Session d'octobre"
                      className={inputBase}
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Catégorie" hint="Tapez pour rechercher ou créer">
                      <input
                        type="text"
                        list="revenue-category-suggestions"
                        value={form.category}
                        onChange={(e) => update('category', e.target.value)}
                        placeholder="Prestations de services…"
                        className={inputBase}
                      />
                      <datalist id="revenue-category-suggestions">
                        {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
                      </datalist>
                    </Field>

                    <Field label="Client" icon={<User className="w-3.5 h-3.5" />}>
                      {showNewContactForm ? (
                        <InlineContactForm
                          name={newContactName}
                          contactType={newContactType}
                          onNameChange={setNewContactName}
                          onTypeChange={setNewContactType}
                          onCancel={() => { setShowNewContactForm(false); setNewContactName(''); setContactError(null) }}
                          onSubmit={handleCreateContact}
                          busy={creatingContact}
                          error={contactError}
                        />
                      ) : (
                        <ContactCombobox
                          contacts={contacts}
                          value={form.contact_id}
                          onChange={(v) => update('contact_id', v)}
                          onCreateNew={onCreateContact ? (initialName) => {
                            setNewContactName(initialName || '')
                            setShowNewContactForm(true)
                            update('contact_id', '')
                          } : undefined}
                        />
                      )}
                    </Field>
                  </div>
                </div>
              </section>

              {/* PROJET — lien optionnel vers un projectable */}
              <section>
                <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400 font-medium mb-2">
                  Projet
                </div>
                <ProjectableCombobox
                  value={form.projectable}
                  onChange={(v) => update('projectable', v)}
                  placeholder="Sélectionner un projet (optionnel — sinon recette globale)"
                  accent="#5B5781"
                />
              </section>

              {/* COLLAPSIBLE — PAIEMENT */}
              <Collapsible
                label="Paiement"
                icon={<CreditCard className="w-4 h-4" />}
                open={showPaymentSection}
                onToggle={() => setShowPaymentSection((v) => !v)}
                summary={form.payment_method || form.paid_at ? `${form.payment_method || '—'}${form.paid_at ? ` · ${form.paid_at}` : ''}` : 'Ajouter les détails'}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Méthode de paiement">
                    <div className="relative">
                      <select
                        value={form.payment_method}
                        onChange={(e) => update('payment_method', e.target.value)}
                        className={selectBase}
                      >
                        <option value="">— Sélectionner —</option>
                        {PAYMENT_METHOD_OPTIONS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="Date de paiement">
                    <input
                      type="date"
                      value={form.paid_at}
                      onChange={(e) => update('paid_at', e.target.value)}
                      className={inputBase}
                    />
                  </Field>
                </div>
              </Collapsible>

              {/* COLLAPSIBLE — FACTURE */}
              <Collapsible
                label="Facture"
                icon={<FileText className="w-4 h-4" />}
                open={showInvoiceSection}
                onToggle={() => setShowInvoiceSection((v) => !v)}
                summary={form.invoice_url ? 'Facture liée' : form.vat_exemption ? 'Exemptée de TVA' : 'Lien, exemption TVA'}
              >
                <div className="space-y-3">
                  <Field label="URL de la facture" icon={<Link2 className="w-3.5 h-3.5" />}>
                    <input
                      type="url"
                      value={form.invoice_url}
                      onChange={(e) => update('invoice_url', e.target.value)}
                      placeholder="https://…"
                      className={inputBase}
                    />
                  </Field>
                  <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.vat_exemption}
                      onChange={(e) => update('vat_exemption', e.target.checked)}
                      className="w-4 h-4 rounded accent-[#5B5781]"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-stone-800">Recette exemptée de TVA</div>
                      <div className="text-xs text-stone-500 mt-0.5">À cocher si la recette est hors champ TVA (Art. 44 §2 ou autre)</div>
                    </div>
                  </label>
                </div>
              </Collapsible>

              {/* COLLAPSIBLE — DOCUMENTS */}
              <Collapsible
                label="Documents"
                icon={<Paperclip className="w-4 h-4" />}
                open={showDocumentsSection}
                onToggle={() => setShowDocumentsSection((v) => !v)}
                summary={
                  existingDocuments.length + pendingFiles.length > 0
                    ? `${existingDocuments.length + pendingFiles.length} document${existingDocuments.length + pendingFiles.length > 1 ? 's' : ''}`
                    : 'Joindre une facture, une preuve…'
                }
              >
                <DocumentsField
                  existing={existingDocuments}
                  pending={pendingFiles}
                  fileInputRef={fileInputRef}
                  onAddFiles={handleAddFiles}
                  onRemovePending={handleRemovePendingFile}
                  onDeleteExisting={onDeleteDocument ? handleDeleteExistingDocument : undefined}
                  removingDocId={removingDocId}
                />
              </Collapsible>

              {/* COLLAPSIBLE — NOTES */}
              <Collapsible
                label="Notes"
                icon={<StickyNote className="w-4 h-4" />}
                open={showNotesSection}
                onToggle={() => setShowNotesSection((v) => !v)}
                summary={form.notes ? `${form.notes.length} caractères` : 'Ajouter un commentaire'}
              >
                <textarea
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  rows={4}
                  placeholder="Toute information complémentaire…"
                  className={`${inputBase} font-sans resize-y min-h-[96px]`}
                />
              </Collapsible>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-7 py-4 border-t border-stone-100 bg-stone-50/40 flex items-center gap-3">
              <div className="text-[11px] text-stone-400 hidden sm:flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-200 text-[10px] font-mono">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-200 text-[10px] font-mono">↵</kbd>
                pour enregistrer
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={busy}
                  className="px-4 py-2 rounded-lg font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={busy || amountExclVat <= 0}
                  className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-[#5B5781] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {busy ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Enregistrement…
                    </>
                  ) : isEdit ? 'Enregistrer' : 'Créer la recette'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

function Field({
  label,
  icon,
  hint,
  required,
  children,
}: {
  label: string
  icon?: React.ReactNode
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-stone-500 font-medium mb-1">
        {icon && <span className="text-stone-400">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
        {hint && <span className="ml-auto text-[10px] normal-case tracking-normal text-stone-400 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function Collapsible({
  label,
  icon,
  open,
  onToggle,
  summary,
  children,
}: {
  label: string
  icon: React.ReactNode
  open: boolean
  onToggle: () => void
  summary?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-stone-200 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
          open ? 'bg-stone-50 border-b border-stone-200' : 'hover:bg-stone-50/70'
        }`}
      >
        <span className="text-stone-400">{icon}</span>
        <span className="text-sm font-medium text-stone-800">{label}</span>
        {summary && <span className="text-xs text-stone-400 truncate ml-2">{summary}</span>}
        <ChevronDown
          className={`ml-auto w-4 h-4 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="p-4 bg-white">{children}</div>}
    </section>
  )
}

function ContactCombobox({
  contacts,
  value,
  onChange,
  onCreateNew,
}: {
  contacts: { value: string; label: string }[]
  value: string
  onChange: (id: string) => void
  onCreateNew?: (initialName: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = useMemo(() => contacts.find((c) => c.value === value), [contacts, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? contacts.filter((c) => c.label.toLowerCase().includes(q))
      : contacts
    return list.slice(0, 50) // cap to keep dropdown snappy
  }, [contacts, query])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlight(0)
  }, [query])

  // Auto-focus the search input when opening
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [open])

  // Keep highlighted item in view
  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.children[highlight] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight, open])

  const handleSelect = (id: string) => {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[highlight]) handleSelect(filtered[highlight].value)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  if (contacts.length === 0) {
    if (onCreateNew) {
      return (
        <button
          type="button"
          onClick={() => onCreateNew('')}
          className={`${inputBase} text-left flex items-center gap-2 text-[#5B5781] hover:bg-[#5B5781]/5`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Créer un nouveau client
        </button>
      )
    }
    return (
      <input
        type="text"
        value=""
        disabled
        placeholder="Aucun contact disponible"
        className={`${inputBase} bg-stone-50 text-stone-400`}
      />
    )
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full pl-3 pr-9 py-2.5 rounded-lg bg-white border text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/25 cursor-pointer ${
          open ? 'border-[#5B5781] ring-2 ring-[#5B5781]/25' : 'border-stone-200 hover:border-stone-300'
        }`}
      >
        {selected ? (
          <span className="text-stone-900 truncate block">{selected.label}</span>
        ) : (
          <span className="text-stone-400">— Aucun client —</span>
        )}
        <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full rounded-lg bg-white border border-stone-200 shadow-xl overflow-hidden animate-[fadeIn_.1s_ease-out]">
          <div className="relative border-b border-stone-100">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Rechercher un client…"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-stone-400"
            />
          </div>

          <ul ref={listRef} className="max-h-60 overflow-y-auto py-1">
            {onCreateNew && (
              <li className="border-b border-stone-100 mb-1">
                <button
                  type="button"
                  onClick={() => { const q = query.trim(); setOpen(false); onCreateNew(q) }}
                  className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 hover:bg-stone-50 font-medium text-[#5B5781]"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  {query.trim() ? (
                    <>
                      Créer <span className="font-semibold">« {query.trim()} »</span>
                    </>
                  ) : (
                    'Créer un nouveau client'
                  )}
                </button>
              </li>
            )}
            {value && (
              <li>
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className="w-full text-left px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-50 italic"
                >
                  Aucun client (effacer)
                </button>
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-stone-400">
                Aucun client trouvé pour « {query} »
              </li>
            ) : (
              filtered.map((c, i) => {
                const isSelected = c.value === value
                const isHighlighted = i === highlight
                return (
                  <li key={c.value}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => handleSelect(c.value)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                        isHighlighted ? 'bg-[#5B5781]/10' : 'hover:bg-stone-50'
                      } ${isSelected ? 'text-[#5B5781] font-medium' : 'text-stone-800'}`}
                    >
                      <span className="flex-1 truncate">{c.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  </li>
                )
              })
            )}
          </ul>

          {filtered.length === 50 && contacts.length > 50 && (
            <div className="px-3 py-1.5 text-[10px] text-stone-400 border-t border-stone-100 bg-stone-50/50">
              50 premiers résultats — affinez votre recherche
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const CONTACT_TYPE_OPTIONS: { value: 'person' | 'organization'; label: string }[] = [
  { value: 'person', label: 'Personne' },
  { value: 'organization', label: 'Organisation' },
]

function InlineContactForm({
  name,
  contactType,
  onNameChange,
  onTypeChange,
  onCancel,
  onSubmit,
  busy,
  error,
}: {
  name: string
  contactType: 'person' | 'organization'
  onNameChange: (v: string) => void
  onTypeChange: (v: 'person' | 'organization') => void
  onCancel: () => void
  onSubmit: () => void
  busy: boolean
  error: string | null
}) {
  const accent = '#5B5781'
  return (
    <div
      className="relative overflow-hidden rounded-xl border bg-white animate-[slideDown_.2s_ease-out]"
      style={{ borderColor: `${accent}40` }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: accent }} aria-hidden />
      <div
        className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-[0.05] pointer-events-none"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <div className="relative pl-5 pr-4 pt-4 pb-4 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: accent }} />
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: accent }}>
              Nouveau client
            </div>
            <div className="text-[11px] text-stone-500">
              Créé directement · disponible pour les prochaines recettes
            </div>
          </div>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
        )}

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">Nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className={inputBase}
            placeholder="Ex. SPRL Verger des Saveurs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (!busy && name.trim()) onSubmit()
              }
            }}
          />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {CONTACT_TYPE_OPTIONS.map((o) => {
              const active = contactType === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onTypeChange(o.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    active ? 'text-white shadow-sm' : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                  }`}
                  style={active ? { backgroundColor: accent, borderColor: accent } : undefined}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 rounded-lg"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy || !name.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ backgroundColor: accent }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {busy ? 'Création…' : 'Créer le client'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DocumentsField({
  existing,
  pending,
  fileInputRef,
  onAddFiles,
  onRemovePending,
  onDeleteExisting,
  removingDocId,
}: {
  existing: RevenueDocument[]
  pending: File[]
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onAddFiles: (files: FileList | File[] | null) => void
  onRemovePending: (index: number) => void
  onDeleteExisting?: (id: string) => void
  removingDocId: string | null
}) {
  const [isDragging, setIsDragging] = useState(false)

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const isImage = (type: string | null | undefined) => Boolean(type?.startsWith('image/'))
  const isPdf = (type: string | null | undefined) => type === 'application/pdf'

  const docIcon = (type: string | null | undefined) => {
    if (isImage(type)) return <ImageIcon className="w-4 h-4" />
    if (isPdf(type)) return <FileText className="w-4 h-4" />
    return <Paperclip className="w-4 h-4" />
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          onAddFiles(e.dataTransfer.files)
        }}
        className={`rounded-xl border-2 border-dashed transition-colors ${
          isDragging ? 'border-[#5B5781] bg-[#5B5781]/5' : 'border-stone-300 hover:border-stone-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            onAddFiles(e.target.files)
            if (e.target) e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-6 flex flex-col items-center gap-2 text-center"
        >
          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
            <Upload className="w-4 h-4" />
          </div>
          <div className="text-sm text-stone-700 font-medium">
            Glissez vos fichiers ici ou <span className="text-[#5B5781]">cliquez pour parcourir</span>
          </div>
          <div className="text-[11px] text-stone-400">PDF, images · plusieurs fichiers possibles</div>
        </button>
      </div>

      {/* Existing documents */}
      {existing.length > 0 && (
        <ul className="space-y-1.5">
          {existing.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2"
            >
              <span className="shrink-0 w-8 h-8 rounded-md bg-stone-100 text-stone-500 flex items-center justify-center">
                {docIcon(doc.contentType)}
              </span>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 text-sm text-stone-800 hover:text-[#5B5781] truncate"
                title={doc.filename}
              >
                {doc.filename}
              </a>
              <span className="shrink-0 text-[11px] font-mono text-stone-400">{fmtSize(doc.byteSize)}</span>
              {onDeleteExisting && (
                <button
                  type="button"
                  onClick={() => onDeleteExisting(doc.id)}
                  disabled={removingDocId === doc.id}
                  className="shrink-0 p-1.5 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Supprimer ce document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Pending uploads */}
      {pending.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400 font-medium mb-1.5">
            À téléverser à l'enregistrement
          </div>
          <ul className="space-y-1.5">
            {pending.map((file, idx) => (
              <li
                key={`${file.name}-${idx}`}
                className="flex items-center gap-3 rounded-lg border border-dashed border-[#5B5781]/40 bg-[#5B5781]/[0.04] px-3 py-2"
              >
                <span className="shrink-0 w-8 h-8 rounded-md bg-white text-[#5B5781] flex items-center justify-center">
                  {docIcon(file.type)}
                </span>
                <span className="flex-1 min-w-0 text-sm text-stone-800 truncate" title={file.name}>
                  {file.name}
                </span>
                <span className="shrink-0 text-[11px] font-mono text-stone-400">{fmtSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => onRemovePending(idx)}
                  className="shrink-0 p-1.5 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Retirer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
