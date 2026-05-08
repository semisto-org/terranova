import { useEffect, useState } from 'react'
import { Lock, RotateCcw, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'

interface SpeciesShape {
  id: string
  latinName: string
  /** First-language common name, when available. */
  commonName: string | null
  /** Direct blob path to the current silhouette, when one is attached. */
  silhouetteUrl?: string | null
}

interface Props {
  open: boolean
  species: SpeciesShape
  onClose: () => void
  onSuccess?: () => void
}

/**
 * Free-text feedback dialog used from the species fiche to launch a single
 * generation/regeneration job. The note is appended to the prompt before
 * Gemini is called, so it directly steers the next image.
 *
 * Visual notes — kept consistent with the existing modal vocabulary used
 * across the app (rounded-xl, lab-violet primary, white background) rather
 * than the parchment look of the atelier page, so it doesn't feel out of
 * place when triggered from a fiche-style page.
 */
export function RegenerateIllustrationModal({ open, species, onClose, onSuccess }: Props) {
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFirstGeneration = !species.silhouetteUrl

  // Reset transient state when the dialog opens for a new species.
  useEffect(() => {
    if (!open) return
    setFeedback('')
    setError(null)
    setSubmitting(false)
  }, [open, species.id])

  // ESC closes — except while a request is in flight, to avoid orphaning a
  // submitted job in the user's mind.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, submitting, onClose])

  if (!open) return null

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await apiRequest('/api/v1/plants/illustrations/generate', {
        method: 'POST',
        body: JSON.stringify({
          species_ids: [parseInt(species.id, 10)],
          kind: isFirstGeneration ? 'initial' : 'regeneration',
          feedback: feedback.trim() || undefined,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      toast.success(
        isFirstGeneration
          ? "Génération lancée — l'image sera disponible automatiquement."
          : "Régénération lancée — l'image sera mise à jour automatiquement."
      )
      onSuccess?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec du lancement')
    } finally {
      setSubmitting(false)
    }
  }

  const headerLabel = isFirstGeneration ? "Générer l'illustration" : "Régénérer l'illustration"
  const submitLabel = isFirstGeneration ? 'Générer maintenant' : 'Régénérer maintenant'
  const HeaderIcon = isFirstGeneration ? Sparkles : RotateCcw

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-stone-100">
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(91, 87, 129, 0.10)' }}
            >
              <HeaderIcon className="w-4 h-4" style={{ color: '#5B5781' }} />
            </div>
            <div>
              <h2
                className="text-xl text-stone-900 leading-tight"
                style={{ fontFamily: "'Sole Serif Small', 'DM Serif Display', serif" }}
              >
                {headerLabel}
              </h2>
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400 mt-0.5">
                Plant Database · Atelier
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Fermer"
            className="shrink-0 -mr-2 -mt-1 p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            {species.silhouetteUrl ? (
              <img
                src={species.silhouetteUrl}
                alt=""
                className="w-16 h-20 object-contain border border-stone-200 rounded bg-white"
              />
            ) : (
              <div className="w-16 h-20 rounded border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center">
                <span className="text-[9px] uppercase tracking-[0.16em] text-stone-400">vide</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-semibold text-stone-900 truncate">
                {species.commonName || species.latinName}
              </div>
              <div className="italic text-stone-600 text-sm truncate">{species.latinName}</div>
            </div>
          </div>

          <div>
            <label
              htmlFor="regen-feedback"
              className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 mb-1.5"
            >
              Notes pour la prochaine génération <span className="text-stone-300">· optionnel</span>
            </label>
            <textarea
              id="regen-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={"Ex: trop dense, plus de fleurs visibles, troncs plus fins…"}
              disabled={submitting}
              rows={4}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#5B5781] focus:ring-2 focus:ring-[#5B5781]/15 disabled:opacity-60"
            />
            <p className="text-xs text-stone-500 mt-1.5 flex items-start gap-1.5">
              <Lock className="w-3 h-3 mt-0.5 shrink-0 text-stone-400" />
              Ces notes sont ajoutées au prompt envoyé au générateur d'image.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 bg-stone-50/60 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 text-sm hover:bg-white disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B5781] text-white rounded-lg text-sm font-medium hover:bg-[#4a4770] disabled:opacity-60"
          >
            <HeaderIcon className="w-3.5 h-3.5" />
            {submitting ? 'Lancement…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
