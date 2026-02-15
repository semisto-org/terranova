import type { Contact, LinkedActivities } from '../types'

interface ContactDetailProps {
  contact: Contact
  linkedActivities: LinkedActivities
  onClose: () => void
  onEdit?: () => void
}

export function ContactDetail({
  contact,
  linkedActivities,
  onClose,
  onEdit,
}: ContactDetailProps) {
  const isPerson = contact.contactType === 'person'
  const hasDesign = linkedActivities.designProjects.length > 0
  const hasAcademy = linkedActivities.academyRegistrations.length > 0
  const hasNursery = linkedActivities.nurseryOrders.length > 0
  const hasActivities = hasDesign || hasAcademy || hasNursery

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto min-h-0 p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-[#5B5781]/15 dark:bg-[#5B5781]/25 text-[#5B5781] dark:text-[#a9a3c7] font-bold text-xl shrink-0">
                {isPerson ? (
                  contact.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                ) : (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{contact.name}</h2>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                  {isPerson ? 'Personne' : 'Organisation'}
                </span>
                {!isPerson && contact.organizationType && (
                  <span className="ml-2 text-sm text-stone-500 dark:text-stone-400">{contact.organizationType}</span>
                )}
                {contact.tagNames.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {contact.tagNames.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-[#5B5781]/15 text-[#5B5781] dark:bg-[#5B5781]/25 dark:text-[#a9a3c7]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="px-3 py-2 text-sm font-medium text-[#5B5781] dark:text-[#a9a3c7] bg-[#5B5781]/10 dark:bg-[#5B5781]/20 rounded-xl hover:bg-[#5B5781]/20 transition-colors"
                >
                  Modifier
                </button>
              )}
              <button
                onClick={onClose}
                className="px-3 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                Coordonnées
              </h3>
              <div className="space-y-1 text-stone-900 dark:text-stone-100">
                {contact.email && (
                  <p>
                    <span className="text-stone-500 dark:text-stone-400">Email:</span>{' '}
                    <a href={`mailto:${contact.email}`} className="text-[#5B5781] hover:underline">
                      {contact.email}
                    </a>
                  </p>
                )}
                {contact.phone && (
                  <p>
                    <span className="text-stone-500 dark:text-stone-400">Téléphone:</span>{' '}
                    <a href={`tel:${contact.phone}`} className="text-[#5B5781] hover:underline">
                      {contact.phone}
                    </a>
                  </p>
                )}
                {contact.address && (
                  <p>
                    <span className="text-stone-500 dark:text-stone-400">Adresse:</span> {contact.address}
                  </p>
                )}
                {!contact.email && !contact.phone && !contact.address && (
                  <p className="text-stone-500 dark:text-stone-400 italic">Aucune coordonnée</p>
                )}
              </div>
            </div>

            {isPerson && contact.organization && (
              <div>
                <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                  Organisation
                </h3>
                <p className="text-stone-900 dark:text-stone-100">{contact.organization.name}</p>
              </div>
            )}

            {contact.notes && (
              <div>
                <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                  Notes
                </h3>
                <p className="text-stone-900 dark:text-stone-100 whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}

            {hasActivities && (
              <div>
                <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                  Activités liées
                </h3>
                <div className="space-y-4">
                  {hasDesign && (
                    <div>
                      <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Design Studio</h4>
                      <ul className="space-y-2">
                        {linkedActivities.designProjects.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center justify-between py-2 px-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700"
                          >
                            <span className="font-medium text-stone-900 dark:text-stone-100">{p.name}</span>
                            <span className="text-xs text-stone-500 dark:text-stone-400">
                              {p.phase} · {p.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {hasAcademy && (
                    <div>
                      <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Academy</h4>
                      <ul className="space-y-2">
                        {linkedActivities.academyRegistrations.map((r) => (
                          <li
                            key={r.id}
                            className="flex items-center justify-between py-2 px-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700"
                          >
                            <span className="font-medium text-stone-900 dark:text-stone-100">
                              {r.trainingName || `Formation #${r.trainingId}`}
                            </span>
                            <span className="text-xs text-stone-500 dark:text-stone-400">{r.paymentStatus}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {hasNursery && (
                    <div>
                      <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Nursery</h4>
                      <ul className="space-y-2">
                        {linkedActivities.nurseryOrders.map((o) => (
                          <li
                            key={o.id}
                            className="flex items-center justify-between py-2 px-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700"
                          >
                            <span className="font-medium text-stone-900 dark:text-stone-100">
                              Commande {o.orderNumber}
                            </span>
                            <span className="text-xs text-stone-500 dark:text-stone-400">{o.status}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!hasActivities && (
              <p className="text-sm text-stone-500 dark:text-stone-400 italic">
                Aucune activité liée trouvée (projets Design, formations Academy, commandes Nursery). Les liens sont
                détectés par correspondance nom/email.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
