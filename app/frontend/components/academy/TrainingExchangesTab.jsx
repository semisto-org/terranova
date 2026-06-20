import React, { useEffect, useRef, useState } from 'react'
import { MessagesSquare, Plus, Pencil, Trash2, X, Link2 } from 'lucide-react'
import SimpleEditor from '../SimpleEditor'
import { apiRequest } from '@/lib/api'

// Bloc « Échanges / Contexte » d'une activité Academy (#16).
// S'appuie sur le substrat commentaires polymorphe (#102) : chaque échange est
// un Comment rendu côté API via /api/v1/academy/trainings/:id/comments.
// UX dédiée : liste de cards avec aperçu 1–2 lignes → clic = modal de lecture
// (avec édition si auteur/admin). Le « lien optionnel » d'une note se pose dans
// le corps riche via le bouton Lien de l'éditeur.

const ACCENT = '#B01A19'

const relativeDate = (iso) => {
  if (!iso) return ''
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

const initials = (name) =>
  (name || '?')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

const isBlankHtml = (html) =>
  !html || (html.replace(/<[^>]*>/g, '').trim() === '' && !html.includes('data-type="mention"'))

// Aperçu texte brut depuis le corps HTML (mentions rendues lisibles).
const textPreview = (html) => {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim()
}

const hasLink = (html) => Boolean(html) && /<a\s/i.test(html)

function Avatar({ name, src, size = 'w-8 h-8' }) {
  if (src) return <img src={src} alt="" className={`${size} rounded-full bg-stone-200 shrink-0`} />
  return (
    <span className={`${size} rounded-full bg-stone-200 text-stone-600 text-[11px] font-semibold flex items-center justify-center shrink-0`}>
      {initials(name)}
    </span>
  )
}

// Coquille de modal réutilisable (même langage visuel que les modales Academy).
function ModalShell({ title, subtitle, onClose, children, footer }) {
  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="shrink-0 px-6 py-5 border-b border-stone-200 bg-gradient-to-br from-red-50 to-white">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
                {subtitle && <p className="text-sm text-stone-500 mt-1">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="ml-4 p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 p-6">{children}</div>
          {footer && (
            <div className="shrink-0 px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function TrainingExchangesTab({ trainingId }) {
  const [exchanges, setExchanges] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const composerRef = useRef(null)

  const [active, setActive] = useState(null) // échange ouvert dans le modal de lecture
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const base = `/api/v1/academy/trainings/${trainingId}/comments`

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiRequest(base)
      .then((res) => { if (!cancelled) setExchanges(res?.comments || []) })
      .catch(() => { if (!cancelled) setError('Impossible de charger les échanges.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [base])

  useEffect(() => {
    let cancelled = false
    apiRequest('/api/v1/lab/members')
      .then((res) => {
        if (cancelled) return
        const items = (res?.items || []).filter((m) => m.status === 'active')
        setMembers(items.map((m) => ({ id: String(m.id), label: `${m.firstName} ${m.lastName}`.trim() })))
      })
      .catch(() => { /* picker mentions indisponible ≠ bloquant */ })
    return () => { cancelled = true }
  }, [])

  const submit = async () => {
    if (sending || isBlankHtml(draft)) return
    setSending(true)
    setError(null)
    try {
      const res = await apiRequest(base, { method: 'POST', body: JSON.stringify({ body: draft }) })
      setExchanges((prev) => [...prev, res.comment])
      setDraft('')
      composerRef.current?.clear()
      setComposerOpen(false)
    } catch {
      setError("L'échange n'a pas pu être ajouté.")
    } finally {
      setSending(false)
    }
  }

  const openExchange = (exchange) => {
    setActive(exchange)
    setEditing(false)
    setEditBody(exchange.body)
  }

  const saveEdit = async () => {
    if (savingEdit || isBlankHtml(editBody) || !active) return
    setSavingEdit(true)
    setError(null)
    try {
      const res = await apiRequest(`${base}/${active.id}`, { method: 'PATCH', body: JSON.stringify({ body: editBody }) })
      setExchanges((prev) => prev.map((e) => (e.id === res.comment.id ? res.comment : e)))
      setActive(res.comment)
      setEditing(false)
    } catch {
      setError("La modification a échoué.")
    } finally {
      setSavingEdit(false)
    }
  }

  const remove = async (exchange) => {
    if (!window.confirm('Supprimer cet échange ?')) return
    try {
      await apiRequest(`${base}/${exchange.id}`, { method: 'DELETE' })
      setExchanges((prev) => prev.filter((e) => e.id !== exchange.id))
      if (active?.id === exchange.id) setActive(null)
    } catch {
      setError('La suppression a échoué.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2">
            <MessagesSquare className="w-4 h-4 text-[#B01A19]" />
            Échanges / Contexte
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Notes, liens et commentaires rattachés à cette activité.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl text-white transition-colors"
          style={{ backgroundColor: ACCENT }}
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-stone-400">Chargement…</p>
      ) : exchanges.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/60 px-6 py-10 text-center">
          <MessagesSquare className="w-7 h-7 text-stone-300 mx-auto mb-2" />
          <p className="text-sm text-stone-500">Aucun échange pour l'instant.</p>
          <p className="text-xs text-stone-400 mt-1">Ajoutez une note, un lien ou un commentaire pour garder le contexte à portée de main.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exchanges.map((exchange) => (
            <li key={exchange.id}>
              <button
                type="button"
                onClick={() => openExchange(exchange)}
                className="w-full h-full text-left rounded-xl border border-stone-200 bg-white p-4 hover:border-[#B01A19]/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Avatar name={exchange.authorName} src={exchange.authorAvatar} size="w-7 h-7" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{exchange.authorName || 'Membre inconnu'}</p>
                    <p className="text-xs text-stone-400">{relativeDate(exchange.createdAt)}</p>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#B01A19] bg-[#B01A19]/10 rounded-full px-2 py-0.5">
                    {hasLink(exchange.body) && <Link2 className="w-3 h-3" />}
                    Note
                  </span>
                </div>
                <p className="text-sm text-stone-600 line-clamp-2 min-h-[2.5rem]">
                  {textPreview(exchange.body) || '—'}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Modal d'ajout */}
      {composerOpen && (
        <ModalShell
          title="Nouvel échange"
          subtitle="Note, lien ou commentaire à rattacher à l'activité."
          onClose={() => setComposerOpen(false)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                disabled={sending}
                className="px-4 py-2 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={sending || isBlankHtml(draft)}
                className="px-5 py-2 rounded-xl font-medium text-white disabled:opacity-60 transition-colors"
                style={{ backgroundColor: ACCENT }}
              >
                {sending ? 'Ajout…' : 'Ajouter'}
              </button>
            </>
          }
        >
          <SimpleEditor
            ref={composerRef}
            content=""
            onUpdate={setDraft}
            toolbar={['bold', 'italic', '|', 'link', '|', 'bulletList']}
            minHeight="140px"
            placeholder="Écrire une note, coller un lien (bouton Lien)… (@ pour mentionner)"
            mentionMembers={members}
          />
        </ModalShell>
      )}

      {/* Modal de lecture / édition */}
      {active && (
        <ModalShell
          title="Échange"
          subtitle={`${active.authorName || 'Membre inconnu'} · ${relativeDate(active.createdAt)}${active.editedAt ? ' · modifié' : ''}`}
          onClose={() => { setActive(null); setEditing(false) }}
          footer={
            editing ? (
              <>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setEditBody(active.body) }}
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={savingEdit || isBlankHtml(editBody)}
                  className="px-5 py-2 rounded-xl font-medium text-white disabled:opacity-60 transition-colors"
                  style={{ backgroundColor: ACCENT }}
                >
                  {savingEdit ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </>
            ) : (
              <>
                {active.canDelete && (
                  <button
                    type="button"
                    onClick={() => remove(active)}
                    className="mr-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                )}
                {active.canEdit && (
                  <button
                    type="button"
                    onClick={() => { setEditing(true); setEditBody(active.body) }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Modifier
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="px-5 py-2 rounded-xl font-medium text-white transition-colors"
                  style={{ backgroundColor: ACCENT }}
                >
                  Fermer
                </button>
              </>
            )
          }
        >
          {editing ? (
            <SimpleEditor
              content={active.body}
              onUpdate={setEditBody}
              toolbar={['bold', 'italic', '|', 'link', '|', 'bulletList']}
              minHeight="160px"
              placeholder="Modifier l'échange…"
              mentionMembers={members}
            />
          ) : (
            <div className="flex items-start gap-3">
              <Avatar name={active.authorName} src={active.authorAvatar} />
              <div
                className="prose prose-stone prose-sm max-w-none text-stone-700 flex-1 min-w-0"
                // Sanitizé côté serveur (SanitizesRichText) avant persistance.
                dangerouslySetInnerHTML={{ __html: active.body }}
              />
            </div>
          )}
        </ModalShell>
      )}
    </div>
  )
}
