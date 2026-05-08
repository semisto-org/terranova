import { useEffect, useRef, useState } from 'react'
import { Sparkles, X } from 'lucide-react'

interface Props {
  open: boolean
  count: number
  estimatedSeconds: number
  onConfirm: () => Promise<void> | void
  onCancel: () => void
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `~${Math.round(seconds / 60)} min`
  const hours = seconds / 3600
  if (hours < 10) return `~${Math.round(hours * 10) / 10}h`
  return `~${Math.round(hours)}h`
}

export function ConfirmBulkGenerationModal({
  open,
  count,
  estimatedSeconds,
  onConfirm,
  onCancel
}: Props) {
  const [busy, setBusy] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      setBusy(false)
      return
    }
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  const duration = formatDuration(estimatedSeconds)
  const plural = count > 1

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-gen-title"
    >
      <div
        className="absolute inset-0 bg-stone-900/45 backdrop-blur-sm"
        onClick={() => !busy && onCancel()}
        aria-hidden
      />
      <div
        className="relative w-full max-w-md bg-[#fdfaf2] rounded-md border border-stone-300 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] overflow-hidden"
      >
        {/* Letterpress masthead */}
        <div className="px-6 pt-6 pb-3 border-b border-stone-200 bg-gradient-to-b from-[#fdfaf2] to-transparent">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-stone-500 mb-1.5">
                Atelier · Mise en chantier
              </p>
              <h2
                id="bulk-gen-title"
                className="text-2xl text-stone-900 leading-tight"
                style={{ fontFamily: "'Sole Serif Small', 'DM Serif Display', serif", fontWeight: 400 }}
              >
                Lancer{' '}
                <span className="font-mono text-[#5B5781] tabular-nums">
                  {count.toLocaleString('fr-FR')}
                </span>{' '}
                génération{plural ? 's' : ''} ?
              </h2>
            </div>
            <button
              onClick={() => !busy && onCancel()}
              disabled={busy}
              className="text-stone-400 hover:text-stone-700 transition disabled:opacity-50 -mr-2 -mt-1"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="border-l-2 border-[#AFBD00] pl-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                Espèces
              </div>
              <div
                className="text-2xl text-stone-900 mt-0.5"
                style={{ fontFamily: "'Sole Serif Small', 'DM Serif Display', serif", fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}
              >
                {count.toLocaleString('fr-FR')}
              </div>
            </div>
            <div className="border-l-2 border-[#5B5781] pl-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                Estimation
              </div>
              <div
                className="text-2xl text-stone-900 mt-0.5"
                style={{ fontFamily: "'Sole Serif Small', 'DM Serif Display', serif", fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}
              >
                {duration}
              </div>
            </div>
          </div>

          <p className="text-sm text-stone-700 leading-relaxed">
            Les générations se déroulent en arrière-plan. Tu peux quitter cette
            page sans interrompre la queue —{' '}
            <span className="italic">le panneau à droite</span> trace l'avancement
            en direct.
          </p>

          <p className="text-[11px] text-stone-500 italic border-l border-stone-300 pl-3">
            Chaque planche consomme un appel à Gemini Imagen.
            Vérifie le quota avant un gros lot.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-stone-200 flex justify-end gap-2 bg-stone-50/50">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 text-sm font-medium text-stone-700 rounded-md border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md bg-[#5B5781] hover:bg-[#4A4670] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_1px_0_rgba(0,0,0,0.06),0_4px_12px_-4px_rgba(91,87,129,0.45)] transition"
          >
            <Sparkles className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
            <span>
              {busy ? 'Mise en queue…' : `Lancer ${count.toLocaleString('fr-FR')} génération${plural ? 's' : ''}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
