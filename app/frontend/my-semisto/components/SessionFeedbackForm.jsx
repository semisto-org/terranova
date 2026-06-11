import React, { useState } from 'react'
import { MessageSquareHeart, Star, ThumbsUp, ThumbsDown, Check, Loader2 } from 'lucide-react'
import { myApiRequest } from '../lib/api'
import { myApiPath } from '../lib/paths'

const ACCENT = '#B01A19'
const COLOR_OK = '#2D6A4F'

/**
 * Feedback « à chaud » d'un·e participant·e sur une session déjà commencée.
 * - Une seule réponse par session, non modifiable : si `session.myFeedback`
 *   existe, on affiche l'avis déposé en lecture seule (remerciement).
 * - Sinon, un petit formulaire : note 1–5, « recommanderais-tu ? » oui/non,
 *   commentaire libre facultatif.
 * - Affiché uniquement pour les sessions passées/en cours et les inscrit·es
 *   (le parent garde le contrôle via `canGiveFeedback`).
 * - Sur succès, appelle onSubmitted() pour que le parent refetch.
 */
export default function SessionFeedbackForm({ trainingId, session, onSubmitted }) {
  const existing = session.myFeedback || null
  const [rating, setRating] = useState(0)
  const [recommend, setRecommend] = useState(null)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // ── Déjà répondu : remerciement + rappel de l'avis ──
  if (existing) {
    return (
      <div className="mt-4 pt-4 border-t border-stone-100">
        <p className="text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 mb-2" style={{ color: COLOR_OK }}>
          <Check size={12} />
          Merci pour votre avis
        </p>
        <div className="flex items-center gap-3 text-sm text-stone-600">
          <StarsDisplay rating={existing.rating} />
          <span className="inline-flex items-center gap-1 text-xs">
            {existing.wouldRecommend ? (
              <><ThumbsUp size={12} style={{ color: COLOR_OK }} /> Recommande</>
            ) : (
              <><ThumbsDown size={12} className="text-stone-400" /> Ne recommande pas</>
            )}
          </span>
        </div>
        {existing.comment && (
          <p className="text-sm text-stone-500 mt-2 whitespace-pre-line">« {existing.comment} »</p>
        )}
      </div>
    )
  }

  async function submit(e) {
    e.preventDefault()
    if (rating < 1) {
      setError('Donnez une note de 1 à 5.')
      return
    }
    if (recommend === null) {
      setError('Indiquez si vous recommanderiez cette session.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await myApiRequest(
        `${myApiPath('/academy')}/${trainingId}/sessions/${session.id}/feedback`,
        {
          method: 'POST',
          body: JSON.stringify({
            rating,
            would_recommend: recommend,
            comment: comment.trim(),
          }),
        }
      )
      if (onSubmitted) onSubmitted()
    } catch (err) {
      setError(err.message || 'Échec de l’envoi. Réessayez.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 pt-4 border-t border-stone-100">
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
        <MessageSquareHeart size={12} style={{ color: ACCENT }} />
        Votre avis sur cette session
      </p>

      {/* Note globale 1–5 */}
      <div className="mb-3">
        <span className="block text-xs text-stone-500 mb-1.5">Note globale</span>
        <StarsInput rating={rating} onChange={setRating} disabled={saving} />
      </div>

      {/* Recommanderais-tu ? oui/non */}
      <div className="mb-3">
        <span className="block text-xs text-stone-500 mb-1.5">Recommanderiez-vous cette session ?</span>
        <div className="flex items-center gap-2">
          <RecommendButton
            active={recommend === true}
            onClick={() => setRecommend(true)}
            disabled={saving}
            icon={ThumbsUp}
            label="Oui"
            color={COLOR_OK}
          />
          <RecommendButton
            active={recommend === false}
            onClick={() => setRecommend(false)}
            disabled={saving}
            icon={ThumbsDown}
            label="Non"
            color="#78716c"
          />
        </div>
      </div>

      {/* Commentaire libre */}
      <div className="mb-3">
        <label htmlFor={`fb-comment-${session.id}`} className="block text-xs text-stone-500 mb-1.5">
          Un commentaire ? (facultatif)
        </label>
        <textarea
          id={`fb-comment-${session.id}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={saving}
          rows={3}
          placeholder="Ce qui vous a plu, ce qu'on pourrait améliorer…"
          className="w-full text-sm rounded-lg border border-stone-200 px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30"
        />
      </div>

      {error && (
        <p className="text-xs text-red-700 mb-2" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
        style={{ backgroundColor: ACCENT }}
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
        Envoyer mon avis
      </button>
    </form>
  )
}

function StarsInput({ rating, onChange, disabled }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Note de 1 à 5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || rating) >= n
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} sur 5`}
            aria-checked={rating === n}
            role="radio"
            className="p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
          >
            <Star
              size={26}
              style={{ color: filled ? '#EF9B0D' : '#d6d3d1' }}
              fill={filled ? '#EF9B0D' : 'none'}
            />
          </button>
        )
      })}
    </div>
  )
}

function StarsDisplay({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={15}
          style={{ color: rating >= n ? '#EF9B0D' : '#d6d3d1' }}
          fill={rating >= n ? '#EF9B0D' : 'none'}
        />
      ))}
    </span>
  )
}

function RecommendButton({ active, onClick, disabled, icon: Icon, label, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
      style={
        active
          ? { backgroundColor: color, borderColor: color, color: '#fff' }
          : { borderColor: '#e7e5e4', color: '#57534e' }
      }
    >
      <Icon size={15} />
      {label}
    </button>
  )
}
