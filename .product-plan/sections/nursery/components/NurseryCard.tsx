import { MapPin, Mail, Phone, Globe, Package, PackageCheck } from 'lucide-react'
import type { Nursery } from '../types'

interface NurseryCardProps {
  nursery: Nursery
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function NurseryCard({ nursery, onView, onEdit, onDelete }: NurseryCardProps) {
  const isSemisto = nursery.type === 'semisto'
  const hasPlatform = nursery.integration === 'platform'

  return (
    <div className="group relative bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      {/* Header avec badge de type et intégration */}
      <div className="relative px-6 pt-6 pb-4">
        {/* Badge type (Semisto/Partenaire) */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                isSemisto
                  ? 'bg-[#EF9B0D]/10 text-[#EF9B0D] dark:bg-[#EF9B0D]/20 dark:text-[#EF9B0D]'
                  : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
              }`}
            >
              {isSemisto ? 'Semisto' : 'Partenaire'}
            </span>
            
            {/* Badge intégration */}
            <div className="flex items-center gap-1.5">
              {hasPlatform ? (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Plateforme
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <Package className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    Manuel
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Point de retrait */}
          {nursery.isPickupPoint && (
            <div className="px-2 py-1 rounded-md bg-[#fbe6c3] dark:bg-[#EF9B0D]/10 border border-[#EF9B0D]/20">
              <span className="text-xs font-medium text-[#EF9B0D] dark:text-[#EF9B0D]">
                Point de retrait
              </span>
            </div>
          )}
        </div>

        {/* Nom de la pépinière */}
        <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2 group-hover:text-[#EF9B0D] transition-colors">
          {nursery.name}
        </h3>

        {/* Description */}
        {nursery.description && (
          <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2 mb-4">
            {nursery.description}
          </p>
        )}
      </div>

      {/* Informations de contact */}
      <div className="px-6 pb-4 space-y-2 border-t border-stone-100 dark:border-stone-800 pt-4">
        {/* Localisation */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-stone-400 dark:text-stone-500 mt-0.5 flex-shrink-0" />
          <div className="text-stone-700 dark:text-stone-300">
            <div className="font-medium">{nursery.city}</div>
            <div className="text-xs text-stone-500 dark:text-stone-500">
              {nursery.address}, {nursery.postalCode}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="flex items-center gap-2 text-sm">
          <Mail className="w-4 h-4 text-stone-400 dark:text-stone-500 flex-shrink-0" />
          <span className="text-stone-700 dark:text-stone-300 truncate">{nursery.contactEmail}</span>
        </div>

        {nursery.contactPhone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-stone-400 dark:text-stone-500 flex-shrink-0" />
            <span className="text-stone-700 dark:text-stone-300">{nursery.contactPhone}</span>
          </div>
        )}

        {nursery.website && (
          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-stone-400 dark:text-stone-500 flex-shrink-0" />
            <a
              href={nursery.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#EF9B0D] hover:underline truncate"
            >
              {nursery.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {/* Spécialités */}
      {nursery.specialties && nursery.specialties.length > 0 && (
        <div className="px-6 pb-4 border-t border-stone-100 dark:border-stone-800 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {nursery.specialties.map((specialty, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-xs rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 pb-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
        <button
          onClick={onView}
          className="flex-1 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
        >
          Voir détails
        </button>
        <button
          onClick={onEdit}
          className="px-4 py-2 text-sm font-medium text-[#EF9B0D] hover:bg-[#EF9B0D]/10 dark:hover:bg-[#EF9B0D]/20 rounded-lg transition-colors"
        >
          Modifier
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
        >
          Supprimer
        </button>
      </div>

      {/* Indicateur visuel pour plateforme (barre colorée en bas) */}
      {hasPlatform && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400" />
      )}
    </div>
  )
}


