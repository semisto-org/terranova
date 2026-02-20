import { useState, useEffect, useRef } from 'react'
import SimpleEditor from '../SimpleEditor'

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

const CONTACT_TYPE_OPTIONS = [
  { value: 'person', label: 'Personne' },
  { value: 'organization', label: 'Organisation' },
]

const EXPENSE_CATEGORY_OPTIONS = [
  'Assurances',
  'Autres dépenses',
  'Bibliothèque',
  'Charges sociales',
  'Communication',
  'Contributions et adhésions',
  'Déplacements',
  'Entretien et réparations',
  'Événements',
  'Fournitures',
  'Frais bancaires',
  'Frais de formation',
  'Frais généraux',
  'Frais juridiques et comptables',
  'Hébergement et restauration',
  'In/out',
  'Indemnités et avantages',
  'Laboratoire',
  'Licences et abonnements',
  'Loyer',
  'Matériel et équipements',
  'Matériel plantations',
  'Plants',
  'Prestations',
  'Projets',
  'Projets innovants',
  'Publicité et promotion',
  'Relations publiques',
  'Rémunération des bénévoles',
  'Réserves',
  'Salaires',
  'Site web et médias sociaux',
  'Sponsoring',
  'Stock pour shop',
  'Subventions et aides',
  'Télécommunications',
  'Transport et logistique',
  'Visites et conférences',
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
  const supplierRef = useRef(null)

  const today = toIsoDate(new Date())
  const [contactList, setContactList] = useState(contactOptionsProp)
  const [supplierContactId, setSupplierContactId] = useState(expense?.supplierContactId ?? expense?.supplier_contact_id ?? '')
  const [showNewContactForm, setShowNewContactForm] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactType, setNewContactType] = useState('organization')
  const [creatingContact, setCreatingContact] = useState(false)
  const [status, setStatus] = useState(expense?.status ?? 'processing')
  const [invoiceDate, setInvoiceDate] = useState(toIsoDate(expense?.invoiceDate ?? expense?.invoice_date) ?? today)
  const [category, setCategory] = useState(expense?.category ?? '')
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
  const [trainingId, setTrainingId] = useState(expense?.trainingId ?? expense?.training_id ?? defaultTrainingId ?? '')
  const [designProjectId, setDesignProjectId] = useState(expense?.designProjectId ?? expense?.design_project_id ?? defaultDesignProjectId ?? '')
  const [documentFile, setDocumentFile] = useState(null)
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- intentional: run once when modal opens

  useEffect(() => {
    if (supplierRef.current && !showNewContactForm) {
      const t = setTimeout(() => supplierRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [showNewContactForm])

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
      await onSubmit({
        ...(expense?.id && { id: expense.id }),
        supplier_contact_id: supplierContactId || undefined,
        status,
        invoice_date: status === 'planned' ? (invoiceDate || null) : invoiceDate,
        category: category.trim() || undefined,
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
        training_id: trainingId || undefined,
        design_project_id: designProjectId || undefined,
        document: documentFile,
      })
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement")
    }
  }

  const accent = accentColor || '#B01A19'

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
                      <div className="space-y-3 rounded-xl border border-stone-200 p-4 bg-stone-50/50">
                        <div>
                          <label className="block text-xs font-medium text-stone-500 mb-1">Nom</label>
                          <input
                            type="text"
                            value={newContactName}
                            onChange={(e) => setNewContactName(e.target.value)}
                            className={inputBase}
                            placeholder="Nom du fournisseur"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-500 mb-1">Type de contact</label>
                          <select
                            value={newContactType}
                            onChange={(e) => setNewContactType(e.target.value)}
                            className={selectBase}
                            style={selectChevronStyle}
                          >
                            {CONTACT_TYPE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCreateContact}
                            disabled={creatingContact || !newContactName.trim()}
                            className="px-4 py-2 rounded-xl font-medium text-white disabled:opacity-50"
                            style={{ backgroundColor: accent }}
                          >
                            {creatingContact ? 'Création...' : 'Créer le fournisseur'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowNewContactForm(false); setNewContactName('') }}
                            className="px-4 py-2 rounded-xl font-medium text-stone-600 border border-stone-300"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <select
                          ref={supplierRef}
                          value={supplierContactId}
                          onChange={(e) => {
                            const v = e.target.value
                            if (v === '__new__') {
                              setShowNewContactForm(true)
                              setSupplierContactId('')
                            } else {
                              setSupplierContactId(v)
                            }
                          }}
                          className={selectBase}
                          style={selectChevronStyle}
                        >
                          <option value="">—</option>
                          {contactList.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.contactType === 'organization' ? 'Organisation' : 'Personne'})
                            </option>
                          ))}
                          {onCreateContact && <option value="__new__">+ Créer un fournisseur...</option>}
                        </select>
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-stone-600 mb-1">Catégorie</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={selectBase}
                        style={selectChevronStyle}
                      >
                        <option value="">—</option>
                        {EXPENSE_CATEGORY_OPTIONS.map((label) => (
                          <option key={label} value={label}>{label}</option>
                        ))}
                      </select>
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
                    {POLE_OPTIONS.map((o) => (
                      <label key={o.value} className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={poles.includes(o.value)}
                          onChange={() => togglePole(o.value)}
                          className="rounded border-stone-300"
                        />
                        <span className="text-sm text-stone-700">{o.label}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

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
                    <select
                      value={billingZone}
                      onChange={(e) => setBillingZone(e.target.value)}
                      className={selectBase}
                      style={selectChevronStyle}
                    >
                      <option value="">—</option>
                      {BILLING_ZONE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-stone-700 mb-3">Montants</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">Montant HTVA (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amountExclVat || ''}
                      onChange={(e) => setAmountExclVat(Number(e.target.value) || 0)}
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">Taux TVA</label>
                    <select value={vatRate} onChange={(e) => setVatRate(e.target.value)} className={selectBase} style={selectChevronStyle}>
                      <option value="">—</option>
                      {VAT_RATE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">TVA 6% (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={vat6 || ''}
                      onChange={(e) => setVat6(Number(e.target.value) || 0)}
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">TVA 12% (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={vat12 || ''}
                      onChange={(e) => setVat12(Number(e.target.value) || 0)}
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">TVA 21% (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={vat21 || ''}
                      onChange={(e) => setVat21(Number(e.target.value) || 0)}
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">Total TVAC (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={totalInclVat || ''}
                      onChange={(e) => setTotalInclVat(Number(e.target.value) || 0)}
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">Taux TVA UE</label>
                    <select value={euVatRate} onChange={(e) => setEuVatRate(e.target.value)} className={selectBase} style={selectChevronStyle}>
                      <option value="">—</option>
                      {EU_VAT_RATE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">TVA UE (€)</label>
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

              {(showTrainingLink || showDesignProjectLink) && (
                <section>
                  <h4 className="text-sm font-semibold text-stone-700 mb-3">Liens</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {showTrainingLink && (
                      <div>
                        <label className="block text-sm font-medium text-stone-600 mb-1">Formation concernée</label>
                        <select
                          value={trainingId}
                          onChange={(e) => setTrainingId(e.target.value)}
                          className={selectBase}
                          style={selectChevronStyle}
                        >
                          <option value="">—</option>
                          {trainingOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {showDesignProjectLink && (
                      <div>
                        <label className="block text-sm font-medium text-stone-600 mb-1">Projet design concerné</label>
                        <select
                          value={designProjectId}
                          onChange={(e) => setDesignProjectId(e.target.value)}
                          className={selectBase}
                          style={selectChevronStyle}
                        >
                          <option value="">—</option>
                          {designProjectOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section>
                <h4 className="text-sm font-semibold text-stone-700 mb-3">Refacturation client</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={billableToClient}
                      onChange={(e) => setBillableToClient(e.target.checked)}
                      className="rounded border-stone-300"
                    />
                    <span className="text-sm text-stone-700">A facturer au client</span>
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

              <section>
                <h4 className="text-sm font-semibold text-stone-700 mb-3">Document</h4>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-stone-100 file:text-stone-800"
                />
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
