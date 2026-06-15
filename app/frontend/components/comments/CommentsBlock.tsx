import React, { useEffect, useRef, useState } from 'react'
import { MessageSquare, Trash2 } from 'lucide-react'
import SimpleEditor from '@/components/SimpleEditor'
import { apiRequest } from '@/lib/api'

// Bloc commentaires polymorphe (#102) — consomme les routes imbriquées
// /api/v1/{tasks|events}/:id/comments. Le body est sanitizé côté serveur
// (whitelist SanitizesRichText) avant d'être rendu ici.

interface CommentMention {
  id: string
  name: string
}

export interface CommentItem {
  id: string
  authorId: string | null
  authorName: string | null
  authorAvatar: string | null
  body: string
  mentions: CommentMention[]
  createdAt: string
  canDelete: boolean
}

interface MentionMember {
  id: string
  label: string
}

interface CommentsBlockProps {
  parentType: 'tasks' | 'events'
  parentId: string
  accentColor?: string
}

const relativeDate = (iso: string) => {
  const date = new Date(iso)
  const minutes = Math.round((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 7) return `il y a ${days} j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const isBlankHtml = (html: string) =>
  !html || (html.replace(/<[^>]*>/g, '').trim() === '' && !html.includes('data-type="mention"'))

const initials = (name: string | null) =>
  (name || '?')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

export default function CommentsBlock({ parentType, parentId, accentColor = '#5B5781' }: CommentsBlockProps) {
  const [comments, setComments] = useState<CommentItem[]>([])
  const [members, setMembers] = useState<MentionMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const editorRef = useRef<{ clear: () => void } | null>(null)

  const base = `/api/v1/${parentType}/${parentId}/comments`

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setComments([])
    apiRequest(base)
      .then((res: any) => { if (!cancelled) setComments(res?.comments || []) })
      .catch(() => { if (!cancelled) setError('Impossible de charger les commentaires.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [base])

  useEffect(() => {
    let cancelled = false
    apiRequest('/api/v1/lab/members')
      .then((res: any) => {
        if (cancelled) return
        const items = (res?.items || []).filter((m: any) => m.status === 'active')
        setMembers(items.map((m: any) => ({ id: String(m.id), label: `${m.firstName} ${m.lastName}`.trim() })))
      })
      .catch(() => {
        // Picker de mention indisponible ≠ bloquant : on peut commenter sans @.
      })
    return () => { cancelled = true }
  }, [])

  const submit = async () => {
    if (sending || isBlankHtml(body)) return
    setSending(true)
    setError(null)
    try {
      const res: any = await apiRequest(base, { method: 'POST', body: JSON.stringify({ body }) })
      setComments((prev) => [...prev, res.comment])
      setBody('')
      editorRef.current?.clear()
    } catch {
      setError("Le commentaire n'a pas pu être envoyé.")
    } finally {
      setSending(false)
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return
    try {
      await apiRequest(`${base}/${id}`, { method: 'DELETE' })
      setComments((prev) => prev.filter((c) => c.id !== id))
    } catch {
      setError('La suppression a échoué.')
    }
  }

  return (
    <div className="space-y-3">
      <span className="text-xs font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5" />
        Commentaires{comments.length > 0 ? ` (${comments.length})` : ''}
      </span>

      {loading ? (
        <p className="text-xs text-stone-400">Chargement…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-stone-400">Aucun commentaire pour l'instant.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex items-start gap-2.5 group">
              {comment.authorAvatar ? (
                <img src={comment.authorAvatar} alt="" className="w-7 h-7 rounded-full bg-stone-200 shrink-0 mt-0.5" />
              ) : (
                <span className="w-7 h-7 rounded-full bg-stone-200 text-stone-600 text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {initials(comment.authorName)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-stone-800">
                    {comment.authorName || 'Membre inconnu'}
                  </span>
                  <span className="text-xs text-stone-400">{relativeDate(comment.createdAt)}</span>
                  {comment.canDelete && (
                    <button
                      type="button"
                      onClick={() => remove(comment.id)}
                      title="Supprimer ce commentaire"
                      className="ml-auto opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div
                  className="prose prose-stone prose-sm max-w-none text-stone-700"
                  // Sanitizé côté serveur (SanitizesRichText) avant persistance.
                  dangerouslySetInnerHTML={{ __html: comment.body }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="space-y-2">
        <SimpleEditor
          ref={editorRef as any}
          content=""
          onUpdate={setBody}
          toolbar={['bold', 'italic', '|', 'link']}
          minHeight="80px"
          placeholder="Écrire un commentaire… (@ pour mentionner)"
          mentionMembers={members}
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={sending || isBlankHtml(body)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: accentColor }}
          >
            {sending ? 'Envoi…' : 'Commenter'}
          </button>
        </div>
      </div>
    </div>
  )
}
