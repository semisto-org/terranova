import { Building2, Plus, Star, Edit, Trash2 } from 'lucide-react'

export interface OrganizationItem {
  id: string
  name: string
  legalForm: string | null
  registrationNumber: string | null
  address: string | null
  iban: string | null
  email: string | null
  phone: string | null
  isDefault: boolean
  logoUrl: string | null
}

export interface OrganizationListProps {
  organizations: OrganizationItem[]
  onCreate: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function OrganizationList({ organizations, onCreate, onEdit, onDelete }: OrganizationListProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#5B5781] font-semibold">Administration</p>
            <h1 className="mt-1 text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight">Structures émettrices</h1>
            <p className="mt-2 text-stone-600">Personnes morales utilisées pour émettre notes de frais et factures.</p>
          </div>
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B5781] text-white font-medium shadow-lg shadow-[#5B5781]/20 hover:bg-[#4a4669] hover:shadow-xl hover:shadow-[#5B5781]/30 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouvelle structure
          </button>
        </div>

        {organizations.length === 0 ? (
          <div className="rounded-2xl bg-white border border-stone-200 shadow-sm px-6 py-16 text-center">
            <Building2 className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="mt-3 text-stone-600 font-medium">Aucune structure enregistrée</p>
            <p className="text-sm text-stone-400 mt-1">Créez Semisto ASBL pour commencer.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {organizations.map((org) => (
              <article
                key={org.id}
                className="group rounded-2xl bg-white border border-stone-200 shadow-sm hover:shadow-md hover:border-[#5B5781]/30 transition-all p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={`Logo ${org.name}`}
                        className="w-14 h-14 rounded-xl object-contain bg-white border border-stone-200 p-1 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-stone-100 border border-dashed border-stone-300 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-stone-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-stone-900 tracking-tight truncate">{org.name}</h2>
                        {org.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#5B5781] bg-[#5B5781]/10">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            Défaut
                          </span>
                        )}
                      </div>
                      {org.legalForm && (
                        <p className="text-xs uppercase tracking-wider text-stone-500 mt-0.5">{org.legalForm}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEdit(org.id)}
                      className="p-2 text-stone-500 hover:text-[#5B5781] hover:bg-[#5B5781]/5 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(org.id)}
                      className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  {org.registrationNumber && (
                    <Row label="BCE">{org.registrationNumber}</Row>
                  )}
                  {org.address && (
                    <Row label="Adresse">
                      <span className="whitespace-pre-line">{org.address}</span>
                    </Row>
                  )}
                  {org.iban && <Row label="IBAN" mono>{org.iban}</Row>}
                  {org.email && <Row label="Email">{org.email}</Row>}
                  {org.phone && <Row label="Téléphone">{org.phone}</Row>}
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2">
      <dt className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold pt-0.5">{label}</dt>
      <dd className={`text-stone-700 ${mono ? 'font-mono text-xs' : ''}`}>{children}</dd>
    </div>
  )
}
