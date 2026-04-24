import React, { useState, useEffect, useCallback } from 'react'
import { X, Send, MessageCircle } from 'lucide-react'
import { apiRequest } from '../../lib/api'
import SimpleEditor from '../../components/SimpleEditor'
import CommentCard from './CommentCard'

const ACCENT = '#2563EB'
const REPLY_EDITOR_TOOLBAR = ['bold', 'italic', 'strike', '|', 'bulletList', 'orderedList', 'blockquote', '|', 'link']

export default function CommentThreadDrawer({ rootCommentId, deliberationId, canComment, authMemberId, onClose }) {
  const [root, setRoot] = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    const data = await apiRequest(`/api/v1/strategy/deliberations/${deliberationId}/comments`)
    if (!data) return
    const byPhase = data.commentsByPhase || {}
    const allRoots = Object.values(byPhase).flat()
    const match = allRoots.find(c => String(c.id) === String(rootCommentId))
    setRoot(match || null)
    setReplies(match?.replies || [])
    setLoading(false)
  }, [deliberationId, rootCommentId])

  useEffect(() => { load() }, [load])

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!reply.trim() || reply === '<p></p>') return
    setSending(true)
    await apiRequest(`/api/v1/strategy/deliberations/${deliberationId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: reply, parent_id: rootCommentId }),
    })
    setReply('')
    setSending(false)
    load()
  }

  return (
    <div
      className="fixed inset-0 bg-stone-900/40 flex items-start justify-end z-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl h-full bg-white border-l border-stone-200 shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-stone-200 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-stone-500" />
            <h2 className="text-sm font-semibold text-stone-900">Fil de discussion</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-stone-100"
            title="Fermer"
          >
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
          {loading && <p className="text-sm text-stone-400">Chargement...</p>}
          {!loading && !root && (
            <p className="text-sm text-stone-400">Commentaire introuvable.</p>
          )}
          {!loading && root && (
            <>
              <CommentCard
                comment={root}
                variant="reply"
                authMemberId={authMemberId}
                onChanged={load}
              />
              <div className="flex items-center gap-3">
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  {replies.length === 0
                    ? 'Aucune réponse'
                    : `${replies.length} réponse${replies.length > 1 ? 's' : ''}`}
                </span>
                <div className="h-px flex-1 bg-stone-100" />
              </div>
              <div className="space-y-3">
                {replies.map((r) => (
                  <CommentCard
                    key={r.id}
                    comment={r}
                    variant="reply"
                    authMemberId={authMemberId}
                    onChanged={load}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {canComment && root && (
          <form
            onSubmit={handleSendReply}
            className="border-t border-stone-200 px-5 py-3 bg-stone-50/60 shrink-0"
          >
            <SimpleEditor
              content={reply}
              onUpdate={setReply}
              placeholder="Répondre dans ce fil..."
              minHeight="80px"
              toolbar={REPLY_EDITOR_TOOLBAR}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={sending || !reply.trim() || reply === '<p></p>'}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: ACCENT }}
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Envoi...' : 'Répondre'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
