import React, { useState } from 'react'
import { Star, Loader2, Check, MessageSquare } from 'lucide-react'
import { myApiRequest } from '../lib/api'
import { myApiPath } from '../lib/paths'

const COLOR_ACADEMY = '#B01A19'
const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// Compact post-session feedback form: a 1–10 rating, a free-text comment, and
// an "anonymous" toggle. At least a rating OR a comment is required (the API
// 422s otherwise — we surface that error). Linked to from the J+1 email.
export default function SessionFeedbackForm({ trainingId, session, autoFocus = false }) {
  const [rating, setRating] = useState(null)
  const [comment, setComment] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  const canSubmit = (rating !== null || comment.trim().length > 0) && !submitting

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await myApiRequest(
        `${myApiPath('/academy')}/${trainingId}/sessions/${session.id}/feedback`,
        {
          method: 'POST',
          body: JSON.stringify({ rating, comment: comment.trim(), anonymous }),
        }
      )
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-center">
        <div className="w-10 h-10 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-2">
          <Check size={20} className="text-green-700" />
        </div>
        <p className="text-sm font-medium text-green-800">Merci pour ton retour !</p>
        <p className="text-xs text-green-700 mt-0.5">Ça nous aide à améliorer nos sessions.</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border bg-white p-4"
      style={{ borderColor: autoFocus ? `${COLOR_ACADEMY}80` : '#e7e5e4', boxShadow: autoFocus ? `0 0 0 3px ${COLOR_ACADEMY}1a` : 'none' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={15} style={{ color: COLOR_ACADEMY }} />
        <h3 className="text-sm font-semibold text-stone-800">Ton retour sur cette session</h3>
      </div>

      {/* Rating 1–10 */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-stone-500 mb-1.5">
          Comment as-tu vécu cette session ? (1–10)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {RATINGS.map((n) => {
            const selected = rating === n
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(selected ? null : n)}
                aria-pressed={selected}
                className="w-8 h-8 rounded-lg text-sm font-medium border transition-colors cursor-pointer"
                style={
                  selected
                    ? { backgroundColor: COLOR_ACADEMY, color: 'white', borderColor: COLOR_ACADEMY }
                    : { backgroundColor: 'white', color: '#57534e', borderColor: '#e7e5e4' }
                }
              >
                {n}
              </button>
            )
          })}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-stone-500 mb-1.5">
          Un commentaire ? (facultatif)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Ce qui t'a plu, ce qu'on pourrait améliorer…"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/20 focus:border-[#B01A19] resize-none"
        />
      </div>

      {/* Anonymous toggle */}
      <label className="flex items-center gap-2 cursor-pointer mb-3">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="w-4 h-4 rounded border-stone-300 text-[#B01A19] focus:ring-[#B01A19]/20"
        />
        <span className="text-sm text-stone-600">Envoyer anonymement</span>
      </label>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        style={{ backgroundColor: COLOR_ACADEMY }}
      >
        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
        Envoyer{anonymous ? ' anonymement' : ''}
      </button>
    </div>
  )
}
