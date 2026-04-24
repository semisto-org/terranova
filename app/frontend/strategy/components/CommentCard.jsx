import React, { useState } from 'react'
import { Edit3, Trash2, MessageCircle, X, Check } from 'lucide-react'
import { apiRequest } from '../../lib/api'
import SimpleEditor from '../../components/SimpleEditor'
import EmojiReactions from './EmojiReactions'

const ACCENT = '#2563EB'
const REPLY_EDITOR_TOOLBAR = ['bold', 'italic', 'strike', '|', 'bulletList', 'orderedList', 'blockquote', '|', 'link']

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('fr-BE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// HTML content is sanitized server-side via SanitizesRichText concern
// (app/models/concerns/sanitizes_rich_text.rb). Same pattern as proposal/context/outcome rendering.
function RenderedContent({ html }) {
  const props = { __html: html || '' }
  return (
    <div
      className="prose prose-stone prose-sm max-w-none text-sm text-stone-700 leading-relaxed"
      dangerouslySetInnerHTML={props}
    />
  )
}

export default function CommentCard({ comment, variant = 'root', onOpenThread, onChanged, authMemberId }) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content || '')
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isAuthor = authMemberId != null && String(comment.authorId) === String(authMemberId)
  const isDeleted = !!comment.isDeleted

  const handleToggleReaction = async (emoji) => {
    const existing = (comment.reactions || []).find(r => r.emoji === emoji)
    if (existing?.reactedByMe) {
      await apiRequest(`/api/v1/strategy/deliberation-comments/${comment.id}/reactions/${emoji}`, { method: 'DELETE' })
    } else {
      await apiRequest(`/api/v1/strategy/deliberation-comments/${comment.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })
    }
    onChanged?.()
  }

  const handleSaveEdit = async (e) => {
    e?.preventDefault?.()
    if (!editContent.trim() || editContent === '<p></p>') return
    setSaving(true)
    await apiRequest(`/api/v1/strategy/deliberation-comments/${comment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
    })
    setSaving(false)
    setEditing(false)
    onChanged?.()
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)
    await apiRequest(`/api/v1/strategy/deliberation-comments/${comment.id}`, { method: 'DELETE' })
    setDeleting(false)
    setConfirmingDelete(false)
    onChanged?.()
  }

  const hasReplies = (comment.replyCount || 0) > 0

  const participants = comment.replyParticipants || []
  const replyCount = comment.replyCount || 0

  return (
    <>
    <div className="flex gap-3 group">
      <div className="w-7 h-7 mt-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold flex items-center justify-center shrink-0 ring-2 ring-white overflow-hidden">
        {comment.authorAvatar
          ? <img src={comment.authorAvatar} className="w-7 h-7 rounded-full object-cover" alt="" />
          : comment.authorName?.[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="rounded-lg bg-stone-50 px-3.5 py-2.5">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-xs font-semibold text-stone-800">{comment.authorName}</span>
            <span className="text-[10px] text-stone-400">{formatDate(comment.createdAt)}</span>
            {comment.editedAt && (
              <span className="text-[10px] text-stone-400 italic" title={`Modifié le ${formatDate(comment.editedAt)}`}>
                (modifié)
              </span>
            )}
            {!isDeleted && isAuthor && !editing && (
              <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => { setEditContent(comment.content || ''); setEditing(true) }}
                  className="p-1 rounded hover:bg-stone-200 text-stone-400 hover:text-stone-700"
                  title="Modifier"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-600"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {isDeleted ? (
            <p className="text-sm italic text-stone-400">Ce commentaire a été supprimé.</p>
          ) : editing ? (
            <form onSubmit={handleSaveEdit} className="mt-1">
              <SimpleEditor
                content={editContent}
                onUpdate={setEditContent}
                placeholder="Modifier le commentaire..."
                minHeight="80px"
                toolbar={REPLY_EDITOR_TOOLBAR}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => { setEditing(false); setEditContent(comment.content || '') }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  <X className="w-3.5 h-3.5" /> Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || !editContent.trim() || editContent === '<p></p>'}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white rounded-lg disabled:opacity-50 hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Check className="w-3.5 h-3.5" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          ) : (
            <RenderedContent html={comment.content} />
          )}

          {!isDeleted && !editing && (
            <EmojiReactions reactions={comment.reactions || []} onToggle={handleToggleReaction} />
          )}
        </div>

        {variant === 'root' && !editing && (
          <button
            type="button"
            onClick={() => onOpenThread?.(comment)}
            className="mt-1.5 ml-1 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            {participants.length > 0 && (
              <span className="flex -space-x-1.5">
                {participants.map((p) => (
                  p.avatar ? (
                    <img
                      key={p.id}
                      src={p.avatar}
                      alt={p.name}
                      className="w-5 h-5 rounded-full object-cover ring-2 ring-white"
                    />
                  ) : (
                    <span
                      key={p.id}
                      className="w-5 h-5 rounded-full bg-stone-300 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white"
                      title={p.name}
                    >
                      {p.name?.[0]}
                    </span>
                  )
                ))}
              </span>
            )}
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="font-medium">
              {replyCount > 0
                ? `${replyCount} réponse${replyCount > 1 ? 's' : ''}`
                : 'Répondre'}
            </span>
          </button>
        )}
      </div>
    </div>

    {confirmingDelete && (
      <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl">
          <h2 className="text-sm font-semibold text-stone-900 mb-2">Supprimer ce commentaire ?</h2>
          <p className="text-sm text-stone-500 mb-5">
            {hasReplies
              ? "Ce commentaire a des réponses. Il restera visible dans le fil avec la mention « Ce commentaire a été supprimé », mais son contenu sera effacé."
              : "Cette action est définitive. Le commentaire sera supprimé."}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
              className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
