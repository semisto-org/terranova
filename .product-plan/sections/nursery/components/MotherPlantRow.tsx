import type { MotherPlant } from '../types'
import { Eye, CheckCircle2, XCircle, Clock, MapPin, Calendar, Sprout } from 'lucide-react'

interface MotherPlantRowProps {
  motherPlant: MotherPlant
  onView?: () => void
  onValidate?: () => void
  onReject?: () => void
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: {
    label: 'En attente',
    color: 'text-[#EF9B0D] dark:text-[#EF9B0D]',
    bgColor: 'bg-[#fbe6c3] dark:bg-[#fbe6c3]/30',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  validated: {
    label: 'Validé',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-950/30',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  rejected: {
    label: 'Rejeté',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-950/30',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
}

const sourceConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  'design-studio': {
    label: 'Design Studio',
    color: 'text-[#5B5781] dark:text-[#5B5781]',
    bgColor: 'bg-[#c8bfd2] dark:bg-[#c8bfd2]/30',
  },
  'member-proposal': {
    label: 'Proposition membre',
    color: 'text-[#AFBD00] dark:text-[#AFBD00]',
    bgColor: 'bg-[#e1e6d8] dark:bg-[#e1e6d8]/30',
  },
}

export function MotherPlantRow({
  motherPlant,
  onView,
  onValidate,
  onReject,
}: MotherPlantRowProps) {
  const status = statusConfig[motherPlant.status] || statusConfig.pending
  const source = sourceConfig[motherPlant.source] || sourceConfig['design-studio']
  const isPending = motherPlant.status === 'pending'

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  return (
    <div className={`group relative ${isPending ? 'bg-[#fbe6c3]/30 dark:bg-[#fbe6c3]/10 border-l-4 border-[#EF9B0D]' : ''}`}>
      {/* Desktop: Table row */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 items-center py-4 px-4 border-b border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors">
        {/* Lieu */}
        <div className="col-span-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-stone-900 dark:text-stone-100 truncate">
                {motherPlant.placeName}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {motherPlant.placeAddress}
              </div>
            </div>
          </div>
        </div>

        {/* Date de plantation */}
        <div className="col-span-2">
          <div className="flex items-center gap-1.5 text-sm text-stone-700 dark:text-stone-300">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            {formatDate(motherPlant.plantingDate)}
          </div>
        </div>

        {/* Source */}
        <div className="col-span-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${source.color} ${source.bgColor}`}>
            {source.label}
          </span>
        </div>

        {/* Statut */}
        <div className="col-span-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${status.color} ${status.bgColor}`}>
            {status.icon}
            {status.label}
          </span>
        </div>

        {/* Quantité */}
        <div className="col-span-1">
          <div className="flex items-center gap-1.5 text-sm font-medium text-stone-900 dark:text-stone-100">
            <Sprout className="w-4 h-4 text-[#EF9B0D]" />
            {motherPlant.quantity}
          </div>
        </div>

        {/* Dernière récolte */}
        <div className="col-span-1">
          {motherPlant.lastHarvestDate ? (
            <div className="text-xs text-stone-600 dark:text-stone-400">
              {formatDate(motherPlant.lastHarvestDate)}
            </div>
          ) : (
            <span className="text-xs text-stone-400 dark:text-stone-600">—</span>
          )}
        </div>

        {/* Actions */}
        <div className="col-span-1 flex items-center justify-end gap-2">
          <button
            onClick={onView}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Voir détails"
          >
            <Eye className="w-4 h-4" />
          </button>
          {isPending && (
            <>
              <button
                onClick={onValidate}
                className="p-1.5 rounded-lg text-green-600 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
                title="Valider"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={onReject}
                className="p-1.5 rounded-lg text-red-600 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Rejeter"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile: Card */}
      <div className="md:hidden p-4 border-b border-stone-200 dark:border-stone-800 space-y-3">
        {/* Header avec statut et source */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${status.color} ${status.bgColor}`}>
                {status.icon}
                {status.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${source.color} ${source.bgColor}`}>
                {source.label}
              </span>
            </div>
            <div className="font-medium text-stone-900 dark:text-stone-100">
              {motherPlant.placeName}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {motherPlant.placeAddress}
            </div>
          </div>
        </div>

        {/* Infos */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
            <Calendar className="w-4 h-4 text-stone-400" />
            <span className="text-xs">Planté le {formatDate(motherPlant.plantingDate)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
            <Sprout className="w-4 h-4 text-[#EF9B0D]" />
            <span className="text-xs font-medium">{motherPlant.quantity} disponibles</span>
          </div>
          {motherPlant.lastHarvestDate && (
            <div className="col-span-2 text-xs text-stone-600 dark:text-stone-400">
              Dernière récolte : {formatDate(motherPlant.lastHarvestDate)}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
          <button
            onClick={onView}
            className="px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            Voir détails
          </button>
          {isPending && (
            <>
              <button
                onClick={onValidate}
                className="px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors"
              >
                Valider
              </button>
              <button
                onClick={onReject}
                className="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              >
                Rejeter
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

