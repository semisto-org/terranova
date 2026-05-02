import { useState, useRef, useEffect } from 'react'
import { Eye, Edit, Trash2, AlertTriangle, MoreHorizontal, Check } from 'lucide-react'

const GROWTH_STAGE_LABELS = {
  seed: 'Graine',
  seedling: 'Semis',
  young: 'Jeune',
  established: 'Établi',
  mature: 'Mature',
}

const STATUS_META = {
  available:     { label: 'Disponible',    chip: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  in_production: { label: 'En production', chip: 'bg-amber-50 text-amber-800 border-amber-200',       dot: 'bg-amber-500'   },
  sold_out:      { label: 'Épuisé',        chip: 'bg-stone-100 text-stone-700 border-stone-200',      dot: 'bg-stone-500'   },
  archived:      { label: 'Archivé',       chip: 'bg-stone-50 text-stone-500 border-stone-200',       dot: 'bg-stone-300'   },
}

const STATUS_QUICK = ['available', 'in_production', 'sold_out', 'archived']

export function StockBatchRow({ batch, containerName, nurseryName, onView, onEdit, onDelete, onQuickStatusChange }) {
  const isLowStock = batch.status === 'available' && batch.availableQuantity <= 10
  const stockPercentage = batch.quantity > 0 ? (batch.availableQuantity / batch.quantity) * 100 : 0
  const status = batch.status || 'available'
  const meta = STATUS_META[status] || STATUS_META.available

  return (
    <div className="group relative">
      {/* Desktop */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 items-center py-4 px-4 border-b border-stone-200 hover:bg-stone-50 transition-colors">
        <div className="col-span-3">
          <div className="font-serif italic text-stone-900" style={{ fontFamily: 'Sole Serif Small, serif' }}>{batch.speciesName}</div>
          {batch.varietyName && <div className="text-sm text-stone-600">{batch.varietyName}</div>}
          {status === 'in_production' && (batch.availabilityLabel || batch.expectedAvailabilityOn) && (
            <div className="mt-0.5 text-xs italic text-amber-700">→ disponible {batch.availabilityLabel || formatDate(batch.expectedAvailabilityOn)}</div>
          )}
        </div>
        <div className="col-span-2 text-sm text-stone-600">{nurseryName}</div>
        <div className="col-span-1 text-sm text-stone-600">{containerName}</div>
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="text-sm font-medium text-stone-900">{batch.availableQuantity}</div>
              <div className="text-xs text-stone-500">{batch.reservedQuantity > 0 ? `${batch.reservedQuantity} réservé` : `sur ${batch.quantity}`}</div>
            </div>
            {isLowStock && <AlertTriangle className="w-4 h-4 text-[#EF9B0D] flex-shrink-0" />}
          </div>
          <div className="mt-1 h-1 bg-stone-200 rounded-full overflow-hidden">
            <div className={`h-full transition-all ${stockPercentage > 50 ? 'bg-emerald-500' : stockPercentage > 25 ? 'bg-[#EF9B0D]' : 'bg-red-500'}`} style={{ width: `${Math.min(stockPercentage, 100)}%` }} />
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-sm font-medium text-stone-900">{batch.priceEuros.toFixed(2)} €</div>
          {batch.acceptsSemos && batch.priceSemos && <div className="text-xs text-stone-500">{batch.priceSemos} Semos</div>}
        </div>
        <div className="col-span-1 flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden />
            {meta.label}
          </span>
        </div>
        <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <StatusQuickMenu currentStatus={status} onChange={(s) => onQuickStatusChange?.(batch.id, s)} />
          <button onClick={onView} title="Voir" className="p-1.5 rounded-md text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"><Eye className="w-4 h-4" /></button>
          <button onClick={onEdit} title="Modifier" className="p-1.5 rounded-md text-stone-500 hover:text-[#EF9B0D] hover:bg-[#fbe6c3]/50 transition-colors"><Edit className="w-4 h-4" /></button>
          <button onClick={onDelete} title="Supprimer" className="p-1.5 rounded-md text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden p-4 border border-stone-200 rounded-lg bg-white hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="font-serif italic text-stone-900 mb-1" style={{ fontFamily: 'Sole Serif Small, serif' }}>{batch.speciesName}</div>
            {batch.varietyName && <div className="text-sm text-stone-600 mb-1">{batch.varietyName}</div>}
            <div className="text-xs text-stone-500">{nurseryName} • {containerName}</div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.chip}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
              {status === 'in_production' && (batch.availabilityLabel || batch.expectedAvailabilityOn) && (
                <span className="text-xs italic text-amber-700">{batch.availabilityLabel || formatDate(batch.expectedAvailabilityOn)}</span>
              )}
            </div>
          </div>
          {isLowStock && <AlertTriangle className="w-5 h-5 text-[#EF9B0D] flex-shrink-0" />}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs text-stone-500 mb-1">Stock</div>
            <div className="text-sm font-medium text-stone-900">{batch.availableQuantity} dispo</div>
            {batch.reservedQuantity > 0 && <div className="text-xs text-stone-500">{batch.reservedQuantity} réservé</div>}
          </div>
          <div>
            <div className="text-xs text-stone-500 mb-1">Prix</div>
            <div className="text-sm font-medium text-stone-900">{batch.priceEuros.toFixed(2)} €</div>
            {batch.acceptsSemos && batch.priceSemos && <div className="text-xs text-stone-500">{batch.priceSemos} Semos</div>}
          </div>
        </div>
        {batch.growthStage && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#fbe6c3] text-[#EF9B0D] border border-[#EF9B0D]/20">
              {GROWTH_STAGE_LABELS[batch.growthStage] || batch.growthStage}
            </span>
          </div>
        )}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
          <button onClick={onView} className="px-3 py-1.5 text-sm rounded-md text-stone-600 hover:bg-stone-100 transition-colors">Voir</button>
          <button onClick={onEdit} className="px-3 py-1.5 text-sm rounded-md text-[#EF9B0D] hover:bg-[#fbe6c3]/50 transition-colors">Modifier</button>
          <button onClick={onDelete} className="px-3 py-1.5 text-sm rounded-md text-red-600 hover:bg-red-50 transition-colors">Supprimer</button>
        </div>
      </div>
    </div>
  )
}

function StatusQuickMenu({ currentStatus, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button title="Changer le statut" onClick={() => setOpen((v) => !v)} className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors">
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-stone-200 bg-white shadow-lg">
          <div className="border-b border-stone-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Statut</div>
          {STATUS_QUICK.map((s) => {
            const m = STATUS_META[s]
            const active = s === currentStatus
            return (
              <button
                key={s}
                onClick={() => { setOpen(false); if (!active) onChange(s) }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${active ? 'bg-stone-50 text-stone-500' : 'text-stone-800 hover:bg-stone-50'}`}
              >
                <span className={`h-2 w-2 rounded-full ${m.dot}`} />
                <span>{m.label}</span>
                {active && <Check className="ml-auto h-3.5 w-3.5 text-stone-400" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' })
  } catch { return iso }
}
