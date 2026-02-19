import { Eye, CheckCircle2, XCircle, Clock, MapPin, Calendar, Sprout } from 'lucide-react'

const statusConfig = {
  pending: { label: 'En attente', color: 'text-[#EF9B0D]', bgColor: 'bg-[#fbe6c3] dark:bg-[#fbe6c3]/30', icon: <Clock className="w-3.5 h-3.5" /> },
  validated: { label: 'Validé', color: 'text-green-700', bgColor: 'bg-green-100 dark:bg-green-950/30', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: 'Rejeté', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-950/30', icon: <XCircle className="w-3.5 h-3.5" /> },
}

const sourceConfig = {
  'design-studio': { label: 'Design Studio', color: 'text-[#5B5781]', bgColor: 'bg-[#c8bfd2] dark:bg-[#c8bfd2]/30' },
  'member-proposal': { label: 'Proposition membre', color: 'text-[#AFBD00]', bgColor: 'bg-[#e1e6d8] dark:bg-[#e1e6d8]/30' },
}

const formatDate = (dateString) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString))

export function MotherPlantRow({ motherPlant, onView, onValidate, onReject }) {
  const status = statusConfig[motherPlant.status] || statusConfig.pending
  const source = sourceConfig[motherPlant.source] || sourceConfig['design-studio']
  const isPending = motherPlant.status === 'pending'

  return (
    <div className={`group relative ${isPending ? 'bg-[#fbe6c3]/30 border-l-4 border-[#EF9B0D]' : ''}`}>
      {/* Desktop */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 items-center py-4 px-4 border-b border-stone-200 hover:bg-stone-50 transition-colors">
        <div className="col-span-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-stone-900 truncate">{motherPlant.placeName}</div>
              <div className="text-xs text-stone-500 truncate">{motherPlant.placeAddress}</div>
            </div>
          </div>
        </div>
        <div className="col-span-2 flex items-center gap-1.5 text-sm text-stone-700">
          <Calendar className="w-3.5 h-3.5 text-stone-400" />{formatDate(motherPlant.plantingDate)}
        </div>
        <div className="col-span-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${source.color} ${source.bgColor}`}>{source.label}</span>
        </div>
        <div className="col-span-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${status.color} ${status.bgColor}`}>{status.icon}{status.label}</span>
        </div>
        <div className="col-span-1 flex items-center gap-1.5 text-sm font-medium text-stone-900">
          <Sprout className="w-4 h-4 text-[#EF9B0D]" />{motherPlant.quantity}
        </div>
        <div className="col-span-1">
          {motherPlant.lastHarvestDate ? <div className="text-xs text-stone-600">{formatDate(motherPlant.lastHarvestDate)}</div> : <span className="text-xs text-stone-400">—</span>}
        </div>
        <div className="col-span-1 flex items-center justify-end gap-2">
          <button onClick={onView} className="p-1.5 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"><Eye className="w-4 h-4" /></button>
          {isPending && <>
            <button onClick={onValidate} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
            <button onClick={onReject} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"><XCircle className="w-4 h-4" /></button>
          </>}
        </div>
      </div>
      {/* Mobile */}
      <div className="md:hidden p-4 border-b border-stone-200 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${status.color} ${status.bgColor}`}>{status.icon}{status.label}</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${source.color} ${source.bgColor}`}>{source.label}</span>
            </div>
            <div className="font-medium text-stone-900">{motherPlant.placeName}</div>
            <div className="text-xs text-stone-500 mt-0.5">{motherPlant.placeAddress}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-stone-700"><Calendar className="w-4 h-4 text-stone-400" /><span className="text-xs">Planté le {formatDate(motherPlant.plantingDate)}</span></div>
          <div className="flex items-center gap-1.5 text-stone-700"><Sprout className="w-4 h-4 text-[#EF9B0D]" /><span className="text-xs font-medium">{motherPlant.quantity} disponibles</span></div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
          <button onClick={onView} className="px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg transition-colors">Voir détails</button>
          {isPending && <>
            <button onClick={onValidate} className="px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 rounded-lg transition-colors">Valider</button>
            <button onClick={onReject} className="px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors">Rejeter</button>
          </>}
        </div>
      </div>
    </div>
  )
}
