import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, MessageSquareText, Plus, Trash2, Loader2, Pencil } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import SimpleEditor from '@/components/SimpleEditor'
import CommentsBlock from '@/components/comments/CommentsBlock'
import FollowButton from '@/components/subscriptions/FollowButton'

// Message Board par projet (#118, epic #101 — Phase 4).
// Onglet « Messages » d'un projet : posts async structurés (annonce / proposition /
// compte-rendu). Réutilise les substrats déjà livrés — CommentsBlock (#102),
// FollowButton (#103) — sur les routes /api/v1/{posts}/:id. Le corps est sanitizé
// côté serveur (SanitizesRichText) avant d'être rendu ici.

interface PostSummary {
  id: string
  title: string
  authorId: string | null
  authorName: string | null
  authorAvatar: string | null
  createdAt: string
  updatedAt: string
  commentsCount: number
  canEdit: boolean
}

interface PostDetail extends PostSummary {
  body: string
}

interface MentionMember {
  id: string
  label: string
}

interface MessagesTabProps {
  typeKey: string
  projectId: string
  members: any[]
  accent: string
}

const relativeDate = (iso: string) => {
  if (!iso) return '–'
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

const initials = (name: string | null) =>
  (name || '?')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

const isBlankHtml = (html: string) =>
  !html || html.replace(/<[^>]*>/g, '').trim() === ''

export default function MessagesTab({ typeKey, projectId, members, accent }: MessagesTabProps) {
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)
  const [openPostId, setOpenPostId] = useState<string | null>(null)

  const mentionMembers: MentionMember[] = (members || []).map((m: any) => ({
    id: String(m.memberId || m.id),
    label: `${m.firstName} ${m.lastName}`.trim(),
  }))

  const base = `/api/v1/projects/${typeKey}/${projectId}/posts`

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res: any = await apiRequest(base)
      setPosts(res?.posts || [])
    } catch (err: any) {
      setError(err?.message || 'Impossible de charger les messages.')
    } finally {
      setLoading(false)
    }
  }, [base])

  useEffect(() => { loadPosts() }, [loadPosts])

  // Détail d'un post sélectionné
  if (openPostId) {
    return (
      <PostDetailView
        postId={openPostId}
        accent={accent}
        mentionMembers={mentionMembers}
        onBack={() => { setOpenPostId(null); loadPosts() }}
        onDeleted={() => { setOpenPostId(null); loadPosts() }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
          <MessageSquareText className="w-4 h-4" style={{ color: accent }} />
          Messages{posts.length > 0 ? ` (${posts.length})` : ''}
        </h3>
        <button
          type="button"
          onClick={() => setComposing((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau message
        </button>
      </div>

      {composing && (
        <PostComposer
          base={base}
          accent={accent}
          mentionMembers={mentionMembers}
          onCancel={() => setComposing(false)}
          onCreated={(created) => {
            setComposing(false)
            setPosts((prev) => [
              {
                id: created.id,
                title: created.title,
                authorId: created.authorId,
                authorName: created.authorName,
                authorAvatar: created.authorAvatar,
                createdAt: created.createdAt,
                updatedAt: created.updatedAt,
                commentsCount: created.commentsCount,
                canEdit: created.canEdit,
              },
              ...prev,
            ])
            setOpenPostId(created.id)
          }}
        />
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
        </div>
      ) : posts.length === 0 ? (
        !composing && (
          <div className="flex flex-col items-center justify-center py-16 text-stone-400">
            <MessageSquareText className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Aucun message pour ce projet</p>
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="mt-2 text-sm font-medium hover:underline"
              style={{ color: accent }}
            >
              Écrire le premier message
            </button>
          </div>
        )
      ) : (
        <ul className="space-y-2.5">
          {posts.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setOpenPostId(p.id)}
                className="w-full text-left rounded-xl border border-stone-200/80 bg-white px-5 py-4 hover:border-stone-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  {p.authorAvatar ? (
                    <img src={p.authorAvatar} alt="" className="w-8 h-8 rounded-full object-cover bg-stone-200 shrink-0" />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-stone-200 text-stone-600 text-[10px] font-semibold flex items-center justify-center shrink-0">
                      {initials(p.authorName)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-stone-900 truncate">{p.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-400">
                      <span>{p.authorName || 'Membre inconnu'}</span>
                      <span>·</span>
                      <span>{relativeDate(p.createdAt)}</span>
                      {p.commentsCount > 0 && (
                        <>
                          <span>·</span>
                          <span>{p.commentsCount} commentaire{p.commentsCount > 1 ? 's' : ''}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ─── Composer (création d'un post) ─── */

function PostComposer({
  base,
  accent,
  mentionMembers,
  onCancel,
  onCreated,
}: {
  base: string
  accent: string
  mentionMembers: MentionMember[]
  onCancel: () => void
  onCreated: (post: PostDetail) => void
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const editorRef = useRef<{ clear: () => void } | null>(null)

  const canSubmit = title.trim().length > 0 && !isBlankHtml(body) && !sending

  const submit = async () => {
    if (!canSubmit) return
    setSending(true)
    setError(null)
    try {
      const res: any = await apiRequest(base, {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), body }),
      })
      onCreated(res.post)
    } catch (err: any) {
      setError(err?.message || "Le message n'a pas pu être publié.")
      setSending(false)
    }
  }

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white p-5 space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre du message"
        className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
        style={{ ['--tw-ring-color' as any]: accent }}
      />
      <SimpleEditor
        ref={editorRef as any}
        content=""
        onUpdate={setBody}
        toolbar={['bold', 'italic', '|', 'h3', 'bulletList', 'orderedList', '|', 'link']}
        minHeight="120px"
        placeholder="Écrire un message… (@ pour mentionner)"
        mentionMembers={mentionMembers}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium px-3 py-1.5 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="text-xs font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: accent }}
        >
          {sending ? 'Publication…' : 'Publier'}
        </button>
      </div>
    </div>
  )
}

/* ─── Détail d'un post ─── */

function PostDetailView({
  postId,
  accent,
  mentionMembers,
  onBack,
  onDeleted,
}: {
  postId: string
  accent: string
  mentionMembers: MentionMember[]
  onBack: () => void
  onDeleted: () => void
}) {
  const [post, setPost] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res: any = await apiRequest(`/api/v1/posts/${postId}`)
      setPost(res?.post || null)
    } catch (err: any) {
      setError(err?.message || 'Impossible de charger ce message.')
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce message ? Cette action est irréversible.')) return
    try {
      await apiRequest(`/api/v1/posts/${postId}`, { method: 'DELETE' })
      onDeleted()
    } catch (err: any) {
      setError(err?.message || 'La suppression a échoué.')
    }
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Tous les messages
      </button>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">{error}</div>
      ) : !post ? (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">Message introuvable</div>
      ) : editing ? (
        <PostEditor
          post={post}
          accent={accent}
          mentionMembers={mentionMembers}
          onCancel={() => setEditing(false)}
          onSaved={(updated) => { setPost(updated); setEditing(false) }}
        />
      ) : (
        <>
          <div className="rounded-xl border border-stone-200/80 bg-white p-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                {post.authorAvatar ? (
                  <img src={post.authorAvatar} alt="" className="w-9 h-9 rounded-full object-cover bg-stone-200 shrink-0" />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-stone-200 text-stone-600 text-xs font-semibold flex items-center justify-center shrink-0">
                    {initials(post.authorName)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-800">{post.authorName || 'Membre inconnu'}</p>
                  <p className="text-xs text-stone-400">{relativeDate(post.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <FollowButton parentType="posts" parentId={post.id} accentColor={accent} />
                {post.canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      title="Modifier ce message"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:bg-stone-100 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      title="Supprimer ce message"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>

            <h2
              className="text-lg sm:text-xl font-semibold text-stone-900 tracking-tight mb-3"
              style={{ fontFamily: "var(--font-heading, 'Sole Serif Small', serif)" }}
            >
              {post.title}
            </h2>

            <div
              className="prose prose-stone prose-sm max-w-none text-stone-700"
              // Sanitizé côté serveur (SanitizesRichText) avant persistance.
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          </div>

          <div className="rounded-xl border border-stone-200/80 bg-white p-5">
            <CommentsBlock parentType="posts" parentId={post.id} accentColor={accent} />
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Édition d'un post ─── */

function PostEditor({
  post,
  accent,
  mentionMembers,
  onCancel,
  onSaved,
}: {
  post: PostDetail
  accent: string
  mentionMembers: MentionMember[]
  onCancel: () => void
  onSaved: (post: PostDetail) => void
}) {
  const [title, setTitle] = useState(post.title)
  const [body, setBody] = useState(post.body)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = title.trim().length > 0 && !isBlankHtml(body) && !saving

  const submit = async () => {
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    try {
      const res: any = await apiRequest(`/api/v1/posts/${post.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: title.trim(), body }),
      })
      onSaved(res.post)
    } catch (err: any) {
      setError(err?.message || "Le message n'a pas pu être modifié.")
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white p-5 space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre du message"
        className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
        style={{ ['--tw-ring-color' as any]: accent }}
      />
      <SimpleEditor
        content={post.body}
        onUpdate={setBody}
        toolbar={['bold', 'italic', '|', 'h3', 'bulletList', 'orderedList', '|', 'link']}
        minHeight="120px"
        placeholder="Écrire un message… (@ pour mentionner)"
        mentionMembers={mentionMembers}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium px-3 py-1.5 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="text-xs font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: accent }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
