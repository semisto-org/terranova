import { useState, useEffect, useMemo, useRef } from 'react'
import { Building2, Check, ChevronsUpDown, GraduationCap, Globe2, Layers, Palette, Search, Sliders, Sparkles, Tag, X } from 'lucide-react'
import SimpleEditor from '../SimpleEditor'
import { apiRequest } from '@/lib/api'
import { ProjectableCombobox } from './ProjectableCombobox'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--expense-accent,#B01A19)]/30 focus:border-[var(--expense-accent,#B01A19)]'

// Selects: extra right padding so the dropdown arrow has breathing room and isn't flush to the border
const selectBase =
  'w-full pl-4 pr-10 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--expense-accent,#B01A19)]/30 focus:border-[var(--expense-accent,#B01A19)] cursor-pointer appearance-none bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat'
// Custom chevron via SVG data URI so we control spacing; Tailwind 4 doesn't have dropdown arrow by default
const selectChevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23787573' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
}

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Prévue' },
  { value: 'processing', label: 'Traitement en cours' },
  { value: 'ready_for_payment', label: 'Prêt pour paiement' },
  { value: 'paid', label: 'Payé' },
]

const EXPENSE_TYPE_OPTIONS = [
  { value: 'services_and_goods', label: 'Services et biens divers' },
  { value: 'salaries', label: 'Salaires' },
  { value: 'merchandise', label: 'Marchandises' },
  { value: 'other', label: 'Autres' },
  { value: 'corporate_tax', label: 'Impôts sur les sociétés' },
  { value: 'exceptional_expenses', label: 'Dépenses exceptionnelles' },
  { value: 'financial_expenses', label: 'Dépenses financières' },
  { value: 'provisions_and_depreciation', label: 'Provisions et amortissements' },
  { value: 'taxes_and_duties', label: 'Taxes et impôts' },
]

const BILLING_ZONE_OPTIONS = [
  { value: 'belgium', label: 'Belgique' },
  { value: 'intra_eu', label: 'Intracommunautaire' },
  { value: 'extra_eu', label: 'Hors UE' },
]

const VAT_RATE_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '6', label: '6%' },
  { value: '12', label: '12%' },
  { value: '21', label: '21%' },
  { value: 'na', label: 'N/A' },
  { value: 'intracom', label: 'Intracom' },
]

const EU_VAT_RATE_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '6', label: '6%' },
  { value: '12', label: '12%' },
  { value: '21', label: '21%' },
]

const PAYMENT_TYPE_OPTIONS = [
  { value: 'card_triodos', label: 'Carte (Triodos)' },
  { value: 'transfer_triodos', label: 'Virement (Triodos)' },
  { value: 'cash', label: 'Cash' },
  { value: 'reimbursement_michael', label: 'Remboursement à Michael' },
  { value: 'member', label: 'Membre' },
  { value: 'stripe_fee', label: 'Stripe fee' },
]

const REBILLING_STATUS_OPTIONS = [
  { value: 'to_invoice', label: 'À facturer au client' },
  { value: 'invoiced', label: 'Facturé' },
]

const POLE_OPTIONS = [
  { value: 'academy', label: 'Academy' },
  { value: 'design', label: 'Studio' },
  { value: 'nursery', label: 'Nursery' },
]
const POLE_COLOR = {
  academy: { fg: '#B01A19', bg: '#f5dad3' },
  design: { fg: '#6F7900', bg: '#eef0e0' },
  nursery: { fg: '#B36F00', bg: '#fdf0d6' },
  lab: { fg: '#5B5781', bg: '#e8e5ed' },
}

const CONTACT_TYPE_OPTIONS = [
  { value: 'person', label: 'Personne' },
  { value: 'organization', label: 'Organisation' },
]

function toIsoDate(d) {
  if (!d) return ''
  if (typeof d === 'string') return d.slice(0, 10)
  return new Date(d).toISOString().slice(0, 10)
}

export function ExpenseFormModal({
  expense,
  defaultTrainingId,
  defaultDesignProjectId,
  trainingOptions = [],
  designProjectOptions = [],
  contactOptions: contactOptionsProp = [],
  categoryOptions = [],
  organizationOptions = [],
  defaultOrganizationId = null,
  fetchContacts,
  onCreateContact,
  showTrainingLink = true,
  showDesignProjectLink = true,
  onSubmit,
  onCancel,
  busy = false,
  accentColor = '#B01A19',
}) {
  const isEdit = Boolean(expense)

  const today = toIsoDate(new Date())
  const [contactList, setContactList] = useState(contactOptionsProp)
  const [supplierContactId, setSupplierContactId] = useState(expense?.supplierContactId ?? expense?.supplier_contact_id ?? '')
  const [showNewContactForm, setShowNewContactForm] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactType, setNewContactType] = useState('organization')
  const [creatingContact, setCreatingContact] = useState(false)
  const [status, setStatus] = useState(expense?.status ?? 'processing')
  const [invoiceDate, setInvoiceDate] = useState(toIsoDate(expense?.invoiceDate ?? expense?.invoice_date) ?? today)
  const [categoryId, setCategoryId] = useState(
    expense?.categoryId ?? expense?.category_id ?? expense?.expense_category_id ?? ''
  )
  const [fetchedCategories, setFetchedCategories] = useState([])
  const effectiveCategoryOptions = categoryOptions.length > 0 ? categoryOptions : fetchedCategories

  useEffect(() => {
    // Fetch once on mount when parent doesn't supply categories. We intentionally
    // don't depend on `categoryOptions` since it's often a freshly-created array on
    // each parent render, which would cause an infinite refetch loop.
    if (categoryOptions.length > 0) return
    let cancelled = false
    apiRequest('/api/v1/lab/expense-categories')
      .then((response) => {
        if (cancelled) return
        setFetchedCategories((response?.items || []).map((c) => ({ id: c.id, label: c.label })))
      })
      .catch(() => {
        /* If the fetch fails, the select simply shows no options; form still submits. */
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run once
  }, [])
  const [expenseType, setExpenseType] = useState(expense?.expenseType ?? expense?.expense_type ?? 'services_and_goods')
  const [billingZone, setBillingZone] = useState(expense?.billingZone ?? expense?.billing_zone ?? '')
  const [paymentDate, setPaymentDate] = useState(toIsoDate(expense?.paymentDate ?? expense?.payment_date) ?? '')
  const [paymentType, setPaymentType] = useState(expense?.paymentType ?? expense?.payment_type ?? '')
  const [amountExclVat, setAmountExclVat] = useState(expense ? Number(expense.amountExclVat ?? expense.amount_excl_vat ?? 0) : 0)
  const [vatRate, setVatRate] = useState(expense?.vatRate ?? expense?.vat_rate ?? '')
  const [vat6, setVat6] = useState(expense ? Number(expense.vat6 ?? expense.vat_6 ?? 0) : 0)
  const [vat12, setVat12] = useState(expense ? Number(expense.vat12 ?? expense.vat_12 ?? 0) : 0)
  const [vat21, setVat21] = useState(expense ? Number(expense.vat21 ?? expense.vat_21 ?? 0) : 0)
  const [totalInclVat, setTotalInclVat] = useState(expense ? Number(expense.totalInclVat ?? expense.total_incl_vat ?? 0) : 0)
  const [euVatRate, setEuVatRate] = useState(expense?.euVatRate ?? expense?.eu_vat_rate ?? '')
  const [euVatAmount, setEuVatAmount] = useState(expense ? Number(expense.euVatAmount ?? expense.eu_vat_amount ?? 0) : 0)
  // Manual override: user opens the per-rate breakdown table (for invoices with multiple VAT rates).
  // Auto-detected as ON when an existing expense has multiple non-zero VAT lines, or when
  // amount_excl_vat doesn't match the implied (vat × rate) of the single rate.
  const [manualVatOverride, setManualVatOverride] = useState(() => {
    if (!expense) return false
    const v6 = Number(expense.vat6 ?? expense.vat_6 ?? 0)
    const v12 = Number(expense.vat12 ?? expense.vat_12 ?? 0)
    const v21 = Number(expense.vat21 ?? expense.vat_21 ?? 0)
    const nonZeroCount = [v6, v12, v21].filter((x) => x > 0).length
    return nonZeroCount > 1
  })
  // HTVA per rate — only used in manual mode. Initialized from existing data when possible.
  const initialHtvaSplit = useMemo(() => {
    if (!expense) return { htva0: 0, htva6: 0, htva12: 0, htva21: 0 }
    const v6 = Number(expense.vat6 ?? expense.vat_6 ?? 0)
    const v12 = Number(expense.vat12 ?? expense.vat_12 ?? 0)
    const v21 = Number(expense.vat21 ?? expense.vat_21 ?? 0)
    const totalHtva = Number(expense.amountExclVat ?? expense.amount_excl_vat ?? 0)
    const htva6 = +(v6 / 0.06).toFixed(2)
    const htva12 = +(v12 / 0.12).toFixed(2)
    const htva21 = +(v21 / 0.21).toFixed(2)
    const htva0 = +(totalHtva - htva6 - htva12 - htva21).toFixed(2)
    return { htva0: Math.max(0, htva0), htva6, htva12, htva21 }
  }, [expense])
  const [htva0, setHtva0] = useState(initialHtvaSplit.htva0)
  const [htva6, setHtva6] = useState(initialHtvaSplit.htva6)
  const [htva12, setHtva12] = useState(initialHtvaSplit.htva12)
  const [htva21, setHtva21] = useState(initialHtvaSplit.htva21)
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? expense?.paid_by ?? '')
  const [reimbursed, setReimbursed] = useState(expense?.reimbursed ?? false)
  const [reimbursementDate, setReimbursementDate] = useState(toIsoDate(expense?.reimbursementDate ?? expense?.reimbursement_date) ?? '')
  const [billableToClient, setBillableToClient] = useState(expense?.billableToClient ?? expense?.billable_to_client ?? false)
  const [rebillingStatus, setRebillingStatus] = useState(expense?.rebillingStatus ?? expense?.rebilling_status ?? '')
  const [name, setName] = useState(expense?.name ?? expense?.description ?? '')
  const [notes, setNotes] = useState(expense?.notes ?? '')
  const poleValues = POLE_OPTIONS.map((o) => o.value)
  const [poles, setPoles] = useState(
    expense?.poles ? [...expense.poles].filter((p) => poleValues.includes(p)) : []
  )
  const [projectable, setProjectable] = useState(() => {
    if (expense?.projectableType && expense?.projectableId) {
      return { type: expense.projectableType, id: String(expense.projectableId) }
    }
    if (defaultTrainingId) return { type: 'Academy::Training', id: String(defaultTrainingId) }
    if (defaultDesignProjectId) return { type: 'Design::Project', id: String(defaultDesignProjectId) }
    return null
  })
  const [organizationId, setOrganizationId] = useState(
    expense?.organizationId ?? expense?.organization_id ?? defaultOrganizationId ?? organizationOptions[0]?.value ?? ''
  )

  // If organizationOptions arrive async after mount and we have no selection yet,
  // pick the default or the first option.
  useEffect(() => {
    if (organizationId) return
    if (organizationOptions.length === 0) return
    setOrganizationId(defaultOrganizationId || organizationOptions[0].value)
  }, [organizationOptions, defaultOrganizationId, organizationId])
  const existingAllocations = expense?.projectAllocations ?? expense?.project_allocations ?? []
  const [projectAllocations, setProjectAllocations] = useState(
    existingAllocations.map((a) => ({
      projectable_type: a.projectableType ?? a.projectable_type ?? '',
      projectable_id: String(a.projectableId ?? a.projectable_id ?? ''),
      amount: String(a.amount ?? 0),
      notes: a.notes ?? '',
    }))
  )
  const [multiProject, setMultiProject] = useState(existingAllocations.length > 0)
  const [documentFile, setDocumentFile] = useState(null)
  const [isDragOverDocument, setIsDragOverDocument] = useState(false)
  const [error, setError] = useState(null)

  // Sync from parent only when parent actually provides a list (e.g. Lab). When contactOptionsProp
  // is the default [], it's a new array ref every render, so we must not overwrite the fetched list.
  useEffect(() => {
    if (contactOptionsProp.length > 0) {
      setContactList(contactOptionsProp)
    }
  }, [contactOptionsProp])

  // Fetch contacts once on mount when no static list is provided (e.g. from Academy).
  // Don't depend on fetchContacts: parent often passes an inline function, so the ref
  // changes every render and would cancel the in-flight request and prevent the list from ever updating.
  useEffect(() => {
    if (!fetchContacts || contactOptionsProp.length > 0) return
    let cancelled = false
    fetchContacts()
      .then((res) => {
        const items = res?.items ?? res ?? []
        if (!cancelled) setContactList(Array.isArray(items) ? items : [])
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, []) // eslint-disable-line -- intentional: run once when modal opens

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showNewContactForm) setShowNewContactForm(false)
        else onCancel()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel, showNewContactForm])

  // Auto-derive VAT split + total from HTVA × rate (skipped when user opens manual override).
  useEffect(() => {
    if (manualVatOverride) return
    const pct = vatRate === '6' ? 6 : vatRate === '12' ? 12 : vatRate === '21' ? 21 : 0
    const vatAmount = pct > 0 ? +(amountExclVat * (pct / 100)).toFixed(2) : 0
    setVat6(pct === 6 ? vatAmount : 0)
    setVat12(pct === 12 ? vatAmount : 0)
    setVat21(pct === 21 ? vatAmount : 0)
    setTotalInclVat(+(amountExclVat + vatAmount).toFixed(2))
  }, [amountExclVat, vatRate, manualVatOverride])

  // Manual mode: sync the per-rate HTVA breakdown into the persisted fields.
  useEffect(() => {
    if (!manualVatOverride) return
    const v6 = +(htva6 * 0.06).toFixed(2)
    const v12 = +(htva12 * 0.12).toFixed(2)
    const v21 = +(htva21 * 0.21).toFixed(2)
    const totalHtva = +(htva0 + htva6 + htva12 + htva21).toFixed(2)
    setVat6(v6)
    setVat12(v12)
    setVat21(v21)
    setAmountExclVat(totalHtva)
    setTotalInclVat(+(totalHtva + v6 + v12 + v21).toFixed(2))
  }, [manualVatOverride, htva0, htva6, htva12, htva21])

  // Reset EU VAT amounts whenever billing zone is set to Belgium (not applicable).
  useEffect(() => {
    if (billingZone === 'belgium' || billingZone === '') {
      if (euVatRate) setEuVatRate('')
      if (euVatAmount) setEuVatAmount(0)
    }
  }, [billingZone]) // eslint-disable-line -- intentional: only react to zone changes

  // Whether at least one project is linked (single or multi mode).
  // Drives the visibility of the "Refacturation client" section.
  const hasProjectLink = multiProject
    ? projectAllocations.some((a) => a.projectable_type && a.projectable_id)
    : Boolean(projectable)

  // Auto-uncheck "billable to client" when no project is linked (avoid stale state).
  useEffect(() => {
    if (!hasProjectLink && billableToClient) {
      setBillableToClient(false)
      setRebillingStatus('')
    }
  }, [hasProjectLink]) // eslint-disable-line -- only react to link state

  const togglePole = (pole) => {
    setPoles((prev) => (prev.includes(pole) ? prev.filter((p) => p !== pole) : [...prev, pole]))
  }

  const handleCreateContact = async () => {
    if (!newContactName.trim() || !onCreateContact) return
    setError(null)
    setCreatingContact(true)
    try {
      const contact = await onCreateContact({ name: newContactName.trim(), contact_type: newContactType })
      if (contact?.id) {
        setContactList((prev) => [...prev, { id: contact.id, name: contact.name ?? newContactName.trim(), contactType: contact.contactType ?? contact.contact_type ?? newContactType }])
        setSupplierContactId(contact.id)
        setShowNewContactForm(false)
        setNewContactName('')
      }
    } catch (err) {
      setError(err.message || 'Impossible de créer le contact')
    } finally {
      setCreatingContact(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!supplierContactId) {
      setError('Veuillez sélectionner un fournisseur ou en créer un')
      return
    }
    if (!invoiceDate && status !== 'planned') {
      setError('Veuillez saisir la date de facture')
      return
    }
    if (!expenseType) {
      setError('Veuillez sélectionner le type de dépense')
      return
    }
    try {
      if (multiProject) {
        const cleaned = projectAllocations
          .filter((a) => a.projectable_type && a.projectable_id && parseFloat(a.amount) > 0)
        if (cleaned.length === 0) {
          setError('Ajoutez au moins une allocation projet, ou désactivez le mode multi-projets')
          return
        }
        const total = cleaned.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)
        if (total - (totalInclVat || 0) > 0.01) {
          setError(`La somme des allocations (${total.toFixed(2)} €) dépasse le total de la dépense (${(totalInclVat || 0).toFixed(2)} €)`)
          return
        }
      }
      await onSubmit({
        ...(expense?.id && { id: expense.id }),
        supplier_contact_id: supplierContactId || undefined,
        status,
        invoice_date: status === 'planned' ? (invoiceDate || null) : invoiceDate,
        expense_category_id: categoryId || null,
        expense_type: expenseType,
        billing_zone: billingZone || undefined,
        payment_date: paymentDate || undefined,
        payment_type: paymentType || undefined,
        amount_excl_vat: amountExclVat,
        vat_rate: vatRate || undefined,
        vat_6: vat6,
        vat_12: vat12,
        vat_21: vat21,
        total_incl_vat: totalInclVat,
        eu_vat_rate: euVatRate || undefined,
        eu_vat_amount: euVatAmount,
        paid_by: paidBy.trim() || undefined,
        reimbursed,
        reimbursement_date: reimbursementDate || undefined,
        billable_to_client: billableToClient,
        rebilling_status: rebillingStatus || undefined,
        name: name.trim() || '',
        notes: notes || '',
        poles: poles.length ? poles : [],
        projectable_type: multiProject ? null : (projectable?.type ?? null),
        projectable_id: multiProject ? null : (projectable?.id ?? null),
        organization_id: organizationId || undefined,
        project_allocations: multiProject
          ? projectAllocations
              .filter((a) => a.projectable_type && a.projectable_id && parseFloat(a.amount) > 0)
              .map((a) => ({
                projectable_type: a.projectable_type,
                projectable_id: a.projectable_id,
                amount: parseFloat(a.amount) || 0,
                notes: a.notes || '',
              }))
          : [],
        document: documentFile,
      })
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement")
    }
  }

  const accent = accentColor || '#B01A19'

  const handleDocumentDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOverDocument(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) setDocumentFile(file)
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
          style={{ '--expense-accent': accent }}
        >
          <div className="shrink-0 px-6 py-5 border-b border-stone-200 bg-gradient-to-br from-stone-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading)' }}>
                  {isEdit ? 'Modifier la dépense' : 'Nouvelle dépense'}
                </h3>
                <p className="text-sm text-stone-500 mt-1">
                  {isEdit ? 'Mettez à jour les informations' : 'Enregistrez une nouvelle dépense'}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="ml-4 p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <section>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">Fournisseur *</label>
                    {showNewContactForm ? (
                      <div
                        className="relative overflow-hidden rounded-xl border bg-white animate-[slideDown_.2s_ease-out]"
                        style={{ borderColor: `${accent}40` }}
                      >
                        {/* accent stripe */}
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: accent }} aria-hidden />
                        {/* Decorative seal */}
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
                                Nouveau fournisseur
                              </div>
                              <div className="text-[11px] text-stone-500">
                                Créé directement · disponible pour les prochaines dépenses
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
                              Nom
                            </label>
                            <input
                              type="text"
                              value={newContactName}
                              onChange={(e) => setNewContactName(e.target.value)}
                              className={inputBase}
                              placeholder="Ex. Boulangerie du coin"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  if (!creatingContact && newContactName.trim()) handleCreateContact()
                                }
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
                              Type
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {CONTACT_TYPE_OPTIONS.map((o) => {
                                const active = newContactType === o.value
                                return (
                                  <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => setNewContactType(o.value)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                                      active
                                        ? 'text-white shadow-sm'
                                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
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
                              onClick={() => { setShowNewContactForm(false); setNewContactName('') }}
                              className="px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 rounded-lg"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={handleCreateContact}
                              disabled={creatingContact || !newContactName.trim()}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              style={{ backgroundColor: accent }}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              {creatingContact ? 'Création…' : 'Créer le fournisseur'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <SupplierCombobox
                        contacts={contactList}
                        value={supplierContactId}
                        onChange={setSupplierContactId}
                        onCreateNew={onCreateContact ? (initialName) => {
                          setNewContactName(initialName || '')
                          setShowNewContactForm(true)
                          setSupplierContactId('')
                        } : null}
                        accent={accent}
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-stone-600 mb-1">Catégorie</label>
                      <CategoryCombobox
                        categories={effectiveCategoryOptions}
                        value={categoryId}
                        onChange={setCategoryId}
                        accent={accent}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-600 mb-1">Type *</label>
                      <select
                        value={expenseType}
                        onChange={(e) => setExpenseType(e.target.value)}
                        className={selectBase}
                        style={selectChevronStyle}
                      >
                        {EXPENSE_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">Libellé</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputBase}
                      placeholder="Libellé de la dépense"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-stone-700 mb-3">Notes</h4>
                <SimpleEditor
                  key={`expense-notes-${expense?.id ?? 'new'}`}
                  content={notes}
                  onUpdate={setNotes}
                  placeholder="Informations complémentaires..."
                  minHeight="120px"
                />
              </section>

              {POLE_OPTIONS.length > 0 && (
                <section>
                  <h4 className="text-sm font-semibold text-stone-700 mb-3">Pôles concernés</h4>
                  <div className="flex flex-wrap gap-2">
                    {POLE_OPTIONS.map((o) => {
                      const checked = poles.includes(o.value)
                      const colors = POLE_COLOR[o.value] || { fg: '#5B5781', bg: '#e8e5ed' }
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => togglePole(o.value)}
                          aria-pressed={checked}
                          className={`group relative inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${
                            checked
                              ? 'border-transparent shadow-sm'
                              : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                          }`}
                          style={checked ? { backgroundColor: colors.bg, color: colors.fg, borderColor: colors.fg } : undefined}
                        >
                          <span
                            className={`inline-flex items-center justify-center w-4 h-4 rounded-full border transition-all ${
                              checked ? 'border-transparent' : 'border-stone-300 group-hover:border-stone-400'
                            }`}
                            style={checked ? { backgroundColor: colors.fg } : undefined}
                          >
                            {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                          </span>
                          {o.label}
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}

              {organizationOptions.length > 0 && (
                <section>
                  <h4 className="text-sm font-semibold text-stone-700 mb-1">Structure *</h4>
                  <p className="text-xs text-stone-500 mb-3">Détermine le régime TVA applicable à cette dépense.</p>
                  <div className={`grid gap-2 ${organizationOptions.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
                    {organizationOptions.map((o) => {
                      const checked = organizationId === o.value
                      return (
                        <label
                          key={o.value}
                          className={`relative flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                            checked
                              ? 'border-[var(--expense-accent,#B01A19)] bg-[var(--expense-accent,#B01A19)]/5 shadow-sm'
                              : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="organization"
                            value={o.value}
                            checked={checked}
                            onChange={() => setOrganizationId(o.value)}
                            className="sr-only"
                          />
                          <span
                            className={`shrink-0 mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full border-2 transition-all ${
                              checked ? 'border-[var(--expense-accent,#B01A19)]' : 'border-stone-300'
                            }`}
                          >
                            {checked && <span className="w-2 h-2 rounded-full bg-[var(--expense-accent,#B01A19)]" />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Building2 className={`w-3.5 h-3.5 shrink-0 ${checked ? 'text-[var(--expense-accent,#B01A19)]' : 'text-stone-400'}`} />
                              <span className={`text-sm font-medium ${checked ? 'text-stone-900' : 'text-stone-700'}`}>
                                {o.label}
                              </span>
                            </div>
                            {o.vatSubject === false && (
                              <span className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                                Franchise TVA
                              </span>
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* FACTURATION — date + zone */}
              <section>
                <h4 className="text-sm font-semibold text-stone-700 mb-3">Facturation</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">
                      Date facture{status === 'planned' ? ' (optionnelle)' : ' *'}
                    </label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">Zone de facturation</label>
                    <div className="flex gap-1 rounded-xl bg-stone-100 p-1">
                      <button
                        type="button"
                        onClick={() => setBillingZone('belgium')}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          billingZone === 'belgium' || billingZone === ''
                            ? 'bg-white text-stone-900 shadow-sm'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        🇧🇪 Belgique
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingZone('intra_eu')}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          billingZone === 'intra_eu' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        🇪🇺 Intra UE
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingZone('extra_eu')}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          billingZone === 'extra_eu' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        🌍 Hors UE
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* MONTANTS — hero zone with auto-derivation */}
              <section>
                <h4 className="text-sm font-semibold text-stone-700 mb-3">Montants</h4>
                <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-stone-50/60 to-white px-5 py-4">
                  <div className="flex items-end gap-4 flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-xs text-stone-500 mb-1.5">Montant HTVA</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={amountExclVat || ''}
                          onChange={(e) => setAmountExclVat(Number(e.target.value) || 0)}
                          placeholder="0,00"
                          className="font-mono tabular-nums text-2xl font-semibold text-stone-900 w-full pl-4 pr-10 py-2 rounded-lg bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[var(--expense-accent,#B01A19)]/25 focus:border-[var(--expense-accent,#B01A19)] transition-all"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-stone-400 text-xl">€</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-stone-500 mb-1.5">TVA</label>
                      <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
                        {VAT_RATE_OPTIONS.map((opt) => {
                          const active = vatRate === opt.value
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setVatRate(opt.value)}
                              className={`px-2 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                                active ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                              }`}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Readout — derived TVA + Total TVAC */}
                  {!manualVatOverride && (
                    <div className="mt-4 pt-4 border-t border-dashed border-stone-200 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
                      {(vatRate === '6' || vatRate === '12' || vatRate === '21') ? (
                        <>
                          <span className="text-stone-500">
                            TVA {vatRate}% :{' '}
                            <span className="font-mono tabular-nums text-stone-700">
                              {(amountExclVat * (Number(vatRate) / 100)).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                            </span>
                          </span>
                          <span className="text-stone-300">·</span>
                        </>
                      ) : vatRate === '0' || vatRate === 'na' || vatRate === 'intracom' ? (
                        <>
                          <span className="text-stone-500">
                            {vatRate === 'intracom' ? 'TVA Intracommunautaire (autoliquidation)' : 'Sans TVA'}
                          </span>
                          <span className="text-stone-300">·</span>
                        </>
                      ) : null}
                      <span className="ml-auto text-stone-500">
                        Total TVAC{' '}
                        <span className="font-mono tabular-nums text-lg font-semibold" style={{ color: accent }}>
                          {totalInclVat.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Manual override toggle */}
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setManualVatOverride((v) => !v)}
                      className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors"
                    >
                      <Sliders className="w-3 h-3" />
                      {manualVatOverride ? 'Mode auto' : 'Saisir les taux TVA séparément (facture multi-taux)'}
                    </button>
                  </div>

                  {/* Manual VAT inputs — only when override is on */}
                  {manualVatOverride && (
                    <div className="mt-4 pt-4 border-t border-stone-200">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-stone-500 font-medium mb-2.5">
                        Répartition par taux (recopiez la facture)
                      </div>
                      <div className="rounded-lg border border-stone-200 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-stone-50/80 border-b border-stone-200">
                              <th className="text-left px-3 py-2 text-[10px] font-semibold text-stone-500 uppercase tracking-wider w-20">&nbsp;</th>
                              <th className="text-right px-3 py-2 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">0%</th>
                              <th className="text-right px-3 py-2 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">6%</th>
                              <th className="text-right px-3 py-2 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">12%</th>
                              <th className="text-right px-3 py-2 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">21%</th>
                              <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 bg-white">
                            <tr>
                              <td className="px-3 py-2 text-[11px] font-medium text-stone-500 uppercase tracking-wider">HTVA</td>
                              <td className="px-1 py-1.5"><BreakdownCell value={htva0} onChange={setHtva0} /></td>
                              <td className="px-1 py-1.5"><BreakdownCell value={htva6} onChange={setHtva6} /></td>
                              <td className="px-1 py-1.5"><BreakdownCell value={htva12} onChange={setHtva12} /></td>
                              <td className="px-1 py-1.5"><BreakdownCell value={htva21} onChange={setHtva21} /></td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums text-sm text-stone-700">
                                {fmtMoney(amountExclVat)}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 text-[11px] font-medium text-stone-500 uppercase tracking-wider">TVA</td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums text-xs text-stone-400">{fmtMoney(0)}</td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums text-xs text-stone-700">{fmtMoney(vat6)}</td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums text-xs text-stone-700">{fmtMoney(vat12)}</td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums text-xs text-stone-700">{fmtMoney(vat21)}</td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums text-sm text-stone-700">
                                {fmtMoney(vat6 + vat12 + vat21)}
                              </td>
                            </tr>
                            <tr style={{ backgroundColor: `${accent}0D` }}>
                              <td className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: accent }}>TVAC</td>
                              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-xs text-stone-700">{fmtMoney(htva0)}</td>
                              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-xs text-stone-700">{fmtMoney(htva6 + vat6)}</td>
                              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-xs text-stone-700">{fmtMoney(htva12 + vat12)}</td>
                              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-xs text-stone-700">{fmtMoney(htva21 + vat21)}</td>
                              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-base font-semibold" style={{ color: accent }}>
                                {fmtMoney(totalInclVat)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2 text-[11px] text-stone-400">
                        Saisissez le montant HTVA par taux — la TVA et le TVAC sont calculés automatiquement.
                      </p>
                    </div>
                  )}
                </div>

                {/* TVA UE — révélée uniquement pour Intra UE / Hors UE */}
                {(billingZone === 'intra_eu' || billingZone === 'extra_eu') && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/40 px-5 py-4 animate-[fadeIn_.15s_ease-out]">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe2 className="w-4 h-4 text-amber-700" />
                      <h5 className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                        TVA {billingZone === 'intra_eu' ? 'Intracommunautaire' : 'Hors UE'}
                      </h5>
                      <span className="text-[11px] text-amber-700/70">— autoliquidation à déclarer</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-stone-500 mb-1.5">Taux TVA UE</label>
                        <select value={euVatRate} onChange={(e) => setEuVatRate(e.target.value)} className={selectBase} style={selectChevronStyle}>
                          <option value="">—</option>
                          {EU_VAT_RATE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-stone-500 mb-1.5">Montant TVA UE (€)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={euVatAmount || ''}
                          onChange={(e) => setEuVatAmount(Number(e.target.value) || 0)}
                          className={inputBase}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section>
                <h4 className="text-sm font-semibold text-stone-700 mb-3">Paiement</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">Statut</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectBase} style={selectChevronStyle}>
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">Type de paiement</label>
                    <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={selectBase} style={selectChevronStyle}>
                      <option value="">—</option>
                      {PAYMENT_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">Date de paiement</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">Payé par</label>
                    <input
                      type="text"
                      value={paidBy}
                      onChange={(e) => setPaidBy(e.target.value)}
                      className={inputBase}
                      placeholder="Nom"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-stone-700 mb-3">Remboursement</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reimbursed}
                      onChange={(e) => setReimbursed(e.target.checked)}
                      className="rounded border-stone-300"
                    />
                    <span className="text-sm text-stone-700">Remboursé</span>
                  </label>
                  {reimbursed && (
                    <div>
                      <label className="block text-sm font-medium text-stone-600 mb-1">Date de remboursement</label>
                      <input
                        type="date"
                        value={reimbursementDate}
                        onChange={(e) => setReimbursementDate(e.target.value)}
                        className={inputBase}
                      />
                    </div>
                  )}
                </div>
              </section>

              <section>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h4 className="text-sm font-semibold text-stone-700">Liens</h4>
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-600">
                      <input
                        type="checkbox"
                        checked={multiProject}
                        onChange={(e) => setMultiProject(e.target.checked)}
                        className="rounded border-stone-300"
                      />
                      Dépense liée à plusieurs projets
                    </label>
                  </div>

                  {!multiProject && (
                    <div>
                      <label className="block text-sm font-medium text-stone-600 mb-1">Projet concerné</label>
                      <ProjectableCombobox
                        value={projectable}
                        onChange={setProjectable}
                        accent={accent}
                        placeholder="Sélectionnez un projet (optionnel — sinon dépense globale)"
                      />
                    </div>
                  )}

                  {multiProject && (
                    <div className="space-y-2">
                      {projectAllocations.map((alloc, idx) => {
                        return (
                          <div key={idx} className="bg-stone-50/80 border border-stone-200 rounded-lg p-3 relative">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-stone-400">
                                Allocation #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => setProjectAllocations((prev) => prev.filter((_, i) => i !== idx))}
                                className="ml-auto p-1 text-stone-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                                title="Retirer cette allocation"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <ProjectableCombobox
                                  value={alloc.projectable_type && alloc.projectable_id
                                    ? { type: alloc.projectable_type, id: alloc.projectable_id }
                                    : null}
                                  onChange={(sel) => {
                                    setProjectAllocations((prev) => prev.map((a, i) => i === idx
                                      ? { ...a, projectable_type: sel?.type || '', projectable_id: sel?.id || '' }
                                      : a))
                                  }}
                                  accent={accent}
                                  placeholder="Sélectionner un projet"
                                />
                              </div>
                              <div className="w-36 shrink-0">
                                <div className="relative">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0,00"
                                    value={alloc.amount}
                                    onChange={(e) => setProjectAllocations((prev) => prev.map((a, i) => i === idx ? { ...a, amount: e.target.value } : a))}
                                    className={`${inputBase} pr-7 font-mono tabular-nums text-right`}
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm pointer-events-none">€</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <button
                        type="button"
                        onClick={() => setProjectAllocations((prev) => [...prev, { projectable_type: '', projectable_id: '', amount: '', notes: '' }])}
                        className="w-full py-2 text-sm font-medium text-stone-500 border border-dashed border-stone-300 rounded-lg hover:bg-stone-50 hover:text-stone-700 transition-colors"
                      >
                        + Ajouter un projet
                      </button>
                      {(() => {
                        const allocated = projectAllocations.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0)
                        const total = totalInclVat || 0
                        const unallocated = +(total - allocated).toFixed(2)
                        const overAllocated = unallocated < -0.01
                        return (
                          <div className="rounded-lg border border-stone-200 bg-stone-50/60 px-3 py-2.5 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-stone-500">Imputé aux projets</span>
                              <span className="font-mono tabular-nums text-stone-900">{allocated.toFixed(2)} €</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={overAllocated ? 'text-red-600 font-medium' : 'text-stone-500'}>
                                {overAllocated ? 'Dépassement' : 'Non imputé (général)'}
                              </span>
                              <span className={`font-mono tabular-nums ${overAllocated ? 'text-red-700 font-semibold' : 'text-stone-700'}`}>
                                {unallocated.toFixed(2)} €
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                              <span className="text-stone-500">Total dépense</span>
                              <span className="font-mono tabular-nums font-semibold text-stone-900">{total.toFixed(2)} €</span>
                            </div>
                            {overAllocated && (
                              <div className="pt-1 text-red-600">
                                ⚠ Les allocations dépassent le total de la dépense de {Math.abs(unallocated).toFixed(2)} €.
                              </div>
                            )}
                            {!overAllocated && unallocated > 0.01 && (
                              <div className="pt-0.5 text-stone-400">
                                Le non-imputé restera sans projet (ex. prospection, travail interne).
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </section>

              {hasProjectLink && (
                <section>
                  <h4 className="text-sm font-semibold text-stone-700 mb-3">Refacturation client</h4>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={billableToClient}
                        onChange={(e) => setBillableToClient(e.target.checked)}
                        className="rounded border-stone-300 accent-[var(--expense-accent,#B01A19)]"
                      />
                      <span className="text-sm text-stone-700">À facturer au client</span>
                    </label>
                    {billableToClient && (
                      <div>
                        <label className="block text-sm font-medium text-stone-600 mb-1">Statut de refacturation</label>
                        <select value={rebillingStatus} onChange={(e) => setRebillingStatus(e.target.value)} className={selectBase} style={selectChevronStyle}>
                          <option value="">—</option>
                          {REBILLING_STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section>
                <h4 className="text-sm font-semibold text-stone-700 mb-3">Document</h4>
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragOverDocument(true)
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragOverDocument(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragOverDocument(false)
                  }}
                  onDrop={handleDocumentDrop}
                  className={`rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                    isDragOverDocument ? 'border-[var(--expense-accent,#B01A19)] bg-[var(--expense-accent,#B01A19)]/5' : 'border-stone-300 bg-stone-50'
                  }`}
                >
                  <input
                    id="expense-document-input"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <p className="text-sm text-stone-700">Glissez-déposez un fichier ici</p>
                  <p className="text-xs text-stone-500 mt-1">PDF ou image</p>
                  <button
                    type="button"
                    onClick={() => document.getElementById('expense-document-input')?.click()}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-stone-200 text-stone-800 text-xs font-medium hover:bg-stone-300"
                  >
                    Choisir un fichier
                  </button>
                </div>
                {documentFile && (
                  <p className="mt-2 text-sm text-stone-700">Nouveau fichier : <strong>{documentFile.name}</strong></p>
                )}
                {expense?.documentFilename && !documentFile && (
                  <p className="mt-2 text-sm text-stone-500">Fichier actuel : {expense.documentFilename}</p>
                )}
              </section>
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="px-4 py-2 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy || !supplierContactId || (status !== 'planned' && !invoiceDate) || !expenseType}
                className="px-5 py-2 rounded-xl font-medium text-white transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                style={{ backgroundColor: accent }}
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enregistrement...
                  </span>
                ) : isEdit ? (
                  'Enregistrer les modifications'
                ) : (
                  'Créer la dépense'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

const fmtMoney = (value) => `${Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

function BreakdownCell({ value, onChange }) {
  return (
    <input
      type="number"
      min="0"
      step="0.01"
      value={value || ''}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      placeholder="0,00"
      className="w-full px-2 py-1.5 rounded-md border border-stone-200 bg-white font-mono tabular-nums text-sm text-right placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[var(--expense-accent,#B01A19)]/25 focus:border-[var(--expense-accent,#B01A19)]"
    />
  )
}

function CategoryCombobox({ categories, value, onChange, accent }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const selected = useMemo(() => categories.find((c) => String(c.id) === String(value)), [categories, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? categories.filter((c) => (c.label || '').toLowerCase().includes(q)) : categories
  }, [categories, query])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  useEffect(() => { setHighlight(0) }, [query])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.children[highlight]
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight, open])

  const handleSelect = (id) => {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[highlight]) handleSelect(filtered[highlight].id)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  if (categories.length === 0) {
    return (
      <input type="text" value="" disabled placeholder="Catégories en cours de chargement…" className={`${inputBase} bg-stone-50 text-stone-400`} />
    )
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full pl-4 pr-10 py-2.5 rounded-xl bg-stone-50 border text-stone-900 text-left transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--expense-accent,#B01A19)]/25 ${
          open ? 'border-[var(--expense-accent,#B01A19)]' : 'border-stone-200 hover:border-stone-300'
        }`}
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate">
            <Tag className="w-3.5 h-3.5 shrink-0 text-stone-400" />
            <span className="truncate">{selected.label}</span>
          </span>
        ) : (
          <span className="text-stone-400 truncate block">— Choisir une catégorie</span>
        )}
        <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full rounded-xl bg-white border border-stone-200 shadow-2xl overflow-hidden">
          <div className="relative border-b border-stone-100">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Rechercher une catégorie…"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-stone-400"
            />
          </div>

          <ul ref={listRef} className="max-h-72 overflow-y-auto py-1">
            {value && (
              <li>
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className="w-full text-left px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-50 italic"
                >
                  Aucune catégorie (effacer)
                </button>
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-stone-400">
                Aucune catégorie trouvée pour « {query} »
              </li>
            ) : (
              filtered.map((c, i) => {
                const isSelected = String(c.id) === String(value)
                const isHighlighted = i === highlight
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => handleSelect(c.id)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                        isSelected ? 'font-medium' : 'text-stone-800'
                      } ${!isHighlighted && !isSelected ? 'hover:bg-stone-50' : ''}`}
                      style={{
                        backgroundColor: isHighlighted ? `${accent}1A` : undefined,
                        color: isSelected ? accent : undefined,
                      }}
                    >
                      <span className="flex-1 truncate">{c.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

function SupplierCombobox({ contacts, value, onChange, onCreateNew, accent }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const selected = useMemo(() => contacts.find((c) => c.id === value), [contacts, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? contacts.filter((c) => (c.name || '').toLowerCase().includes(q))
      : contacts
    return list.slice(0, 50)
  }, [contacts, query])

  // Outside click closes the dropdown
  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  useEffect(() => { setHighlight(0) }, [query])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.children[highlight]
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight, open])

  const handleSelect = (id) => {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[highlight]) handleSelect(filtered[highlight].id)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full pl-4 pr-10 py-2.5 rounded-xl bg-stone-50 border text-stone-900 text-left transition-all duration-200 focus:outline-none focus:ring-2 cursor-pointer ${
          open
            ? 'border-[var(--expense-accent,#B01A19)] ring-2'
            : 'border-stone-200 hover:border-stone-300'
        }`}
        style={open ? { '--ring-color': `${accent}26` } : undefined}
      >
        {selected ? (
          <span className="block truncate">
            {selected.name}
            <span className="text-stone-400 ml-1">
              ({selected.contactType === 'organization' ? 'Organisation' : 'Personne'})
            </span>
          </span>
        ) : (
          <span className="text-stone-400">Sélectionnez un fournisseur…</span>
        )}
        <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full rounded-xl bg-white border border-stone-200 shadow-2xl overflow-hidden">
          <div className="relative border-b border-stone-100">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Rechercher un fournisseur…"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-stone-400"
            />
          </div>

          <ul ref={listRef} className="max-h-64 overflow-y-auto py-1">
            {onCreateNew && (
              <li className="border-b border-stone-100 mb-1">
                <button
                  type="button"
                  onClick={() => { const q = query.trim(); setOpen(false); onCreateNew(q) }}
                  className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 hover:bg-stone-50 font-medium"
                  style={{ color: accent }}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  {query.trim() ? (
                    <>
                      Créer <span className="font-semibold">« {query.trim()} »</span>
                    </>
                  ) : (
                    'Créer un nouveau fournisseur'
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
                  Aucun fournisseur (effacer)
                </button>
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-stone-400">
                Aucun fournisseur trouvé pour « {query} »
              </li>
            ) : (
              filtered.map((c, i) => {
                const isSelected = c.id === value
                const isHighlighted = i === highlight
                const accentColor = `${accent}1A` // 10% alpha hex
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => handleSelect(c.id)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                        isSelected ? 'font-medium' : 'text-stone-800'
                      } ${!isHighlighted && !isSelected ? 'hover:bg-stone-50' : ''}`}
                      style={{
                        backgroundColor: isHighlighted ? accentColor : undefined,
                        color: isSelected ? accent : undefined,
                      }}
                    >
                      <span className="flex-1 truncate">
                        {c.name}
                        <span className="text-stone-400 ml-1 font-normal">
                          ({c.contactType === 'organization' ? 'Organisation' : 'Personne'})
                        </span>
                      </span>
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
