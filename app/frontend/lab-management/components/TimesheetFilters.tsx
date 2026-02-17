import type { Member, TimesheetCategory, PaymentType } from '../types'

export interface TimesheetFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  categoryFilter: TimesheetCategory | 'all'
  onCategoryChange: (category: TimesheetCategory | 'all') => void
  paymentFilter: PaymentType | 'all'
  onPaymentChange: (type: PaymentType | 'all') => void
  invoicedFilter: 'all' | 'invoiced' | 'pending'
  onInvoicedChange: (status: 'all' | 'invoiced' | 'pending') => void
  memberFilter: string
  onMemberChange: (memberId: string) => void
  members: Member[]
  showMemberFilter: boolean
  hasActiveFilters: boolean
  onClearFilters: () => void
}

const categories: { value: TimesheetCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes catégories' },
  { value: 'design', label: 'Design' },
  { value: 'formation', label: 'Formation' },
  { value: 'administratif', label: 'Administratif' },
  { value: 'coordination', label: 'Coordination' },
  { value: 'communication', label: 'Communication' },
]

const paymentTypes: { value: PaymentType | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous types' },
  { value: 'invoice', label: 'Facture' },
  { value: 'semos', label: 'Semos' },
]

const invoicedOptions: { value: 'all' | 'invoiced' | 'pending'; label: string }[] = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'invoiced', label: 'Facturées' },
  { value: 'pending', label: 'En attente' },
]

export function TimesheetFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  paymentFilter,
  onPaymentChange,
  invoicedFilter,
  onInvoicedChange,
  memberFilter,
  onMemberChange,
  members,
  showMemberFilter,
  hasActiveFilters,
  onClearFilters,
}: TimesheetFiltersProps) {
  const activeMembers = members.filter((m) => m.status === 'active')

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6">
      {/* Search bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher dans les descriptions..."
          className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Category filter */}
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
            Catégorie
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value as TimesheetCategory | 'all')}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] transition-colors appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem',
            }}
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Payment type filter */}
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
            Type
          </label>
          <select
            value={paymentFilter}
            onChange={(e) => onPaymentChange(e.target.value as PaymentType | 'all')}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] transition-colors appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem',
            }}
          >
            {paymentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Invoiced status filter */}
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
            Statut
          </label>
          <select
            value={invoicedFilter}
            onChange={(e) => onInvoicedChange(e.target.value as 'all' | 'invoiced' | 'pending')}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] transition-colors appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem',
            }}
          >
            {invoicedOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Member filter (admin only) */}
        {showMemberFilter && (
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
              Membre
            </label>
            <select
              value={memberFilter}
              onChange={(e) => onMemberChange(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] transition-colors appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              <option value="all">Tous les membres</option>
              {activeMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-stone-200">
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 text-sm text-[#5B5781] hover:text-[#4a4670] font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Effacer tous les filtres
          </button>
        </div>
      )}
    </div>
  )
}
