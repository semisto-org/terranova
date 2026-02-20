import React, { useState, useEffect, useCallback } from 'react'
import { usePage } from '@inertiajs/react'
import { useShellNav } from '../../components/shell/ShellContext'
import { apiRequest } from '../../lib/api'
import {
  BookOpen, Plus, Search, Pin, Archive, Edit3, Trash2, ChevronLeft, X,
  Bookmark, BookmarkCheck, Clock, MessageCircle, Users, Paperclip, FolderOpen,
  History, Send, MoreHorizontal
} from 'lucide-react'

const ACCENT = '#0D9488'

// ─── Topics List ───
function TopicsList({ onSelect, onNew, sectionFilter }) {
  const [topics, setTopics] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSection, setFilterSection] = useState(sectionFilter || '')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterSection) params.set('section_id', filterSection)
    params.set('status', 'published')
    const [topicsData, sectionsData] = await Promise.all([
      apiRequest(`/api/v1/knowledge/topics?${params}`),
      apiRequest('/api/v1/knowledge/sections'),
    ])
    if (topicsData) setTopics(topicsData.topics || [])
    if (sectionsData) setSections(sectionsData.sections || [])
    setLoading(false)
  }, [search, filterSection])

  useEffect(() => { fetchData() }, [fetchData])

  const grouped = filterSection
    ? { [sections.find(s => String(s.id) === String(filterSection))?.name || 'Sujets']: topics }
    : topics.reduce((acc, t) => {
        const key = t.sectionName || 'Non classés'
        if (!acc[key]) acc[key] = []
        acc[key].push(t)
        return acc
      }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher un sujet..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          />
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: ACCENT }}
        >
          <Plus className="w-4 h-4" /> Nouveau sujet
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterSection('')}
          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${!filterSection ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}
        >
          Tous
        </button>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setFilterSection(String(s.id) === filterSection ? '' : String(s.id))}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${String(s.id) === filterSection ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}
          >
            {s.name} ({s.topicsCount})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-stone-400 text-sm">Chargement...</div>
      ) : topics.length === 0 ? (
        <div className="py-12 text-center text-stone-400 text-sm">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-stone-300" />
          Aucun sujet trouvé
        </div>
      ) : (
        Object.entries(grouped).map(([sectionName, sectionTopics]) => (
          <div key={sectionName}>
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" />
              {sectionName}
            </h3>
            <div className="grid gap-3 mb-4">
              {sectionTopics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => onSelect(topic.id)}
                  className="text-left bg-white border border-stone-200 rounded-xl p-4 hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {topic.pinned && <Pin className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                        <h3 className="text-sm font-semibold text-stone-900 truncate">{topic.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-stone-400 mb-2">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {topic.readingTimeMinutes} min</span>
                        {topic.commentsCount > 0 && <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {topic.commentsCount}</span>}
                        {topic.editors?.length > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {topic.editors.length + 1}</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(topic.tags || []).slice(0, 4).map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-stone-400">
                        {new Date(topic.createdAt).toLocaleDateString('fr-BE')}
                      </span>
                      {topic.bookmarked && <BookmarkCheck className="w-3.5 h-3.5 text-teal-500" />}
                    </div>
                  </div>
                  {topic.creatorName && (
                    <p className="text-[10px] text-stone-400 mt-2">Par {topic.creatorName}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ─── Topic Detail ───
function TopicDetail({ topicId, onBack, onEdit }) {
  const [topic, setTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [showRevisions, setShowRevisions] = useState(false)
  const [revisions, setRevisions] = useState([])
  const [related, setRelated] = useState([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [topicData, commentsData, relatedData] = await Promise.all([
        apiRequest(`/api/v1/knowledge/topics/${topicId}`),
        apiRequest(`/api/v1/knowledge/topics/${topicId}/comments`),
        apiRequest(`/api/v1/knowledge/topics/${topicId}/related`),
      ])
      if (topicData) setTopic(topicData.topic)
      if (commentsData) setComments(commentsData.comments || [])
      if (relatedData) setRelated(relatedData.topics || [])
      setLoading(false)
    }
    load()
  }, [topicId])

  const handleDelete = async () => {
    if (!confirm('Supprimer ce sujet ?')) return
    await apiRequest(`/api/v1/knowledge/topics/${topicId}`, { method: 'DELETE' })
    onBack()
  }

  const handleTogglePin = async () => {
    const action = topic.pinned ? 'unpin' : 'pin'
    const data = await apiRequest(`/api/v1/knowledge/topics/${topicId}/${action}`, { method: 'PATCH' })
    if (data) setTopic(prev => ({ ...prev, pinned: data.topic.pinned }))
  }

  const handleArchive = async () => {
    await apiRequest(`/api/v1/knowledge/topics/${topicId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' })
    })
    onBack()
  }

  const handleToggleBookmark = async () => {
    const method = topic.bookmarked ? 'DELETE' : 'POST'
    await apiRequest(`/api/v1/knowledge/topics/${topicId}/bookmark`, { method })
    setTopic(prev => ({ ...prev, bookmarked: !prev.bookmarked }))
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    const data = await apiRequest(`/api/v1/knowledge/topics/${topicId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment })
    })
    if (data?.comment) {
      setComments(prev => [...prev, data.comment])
      setNewComment('')
    }
  }

  const handleDeleteComment = async (commentId) => {
    await apiRequest(`/api/v1/knowledge/topics/${topicId}/comments/${commentId}`, { method: 'DELETE' })
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  const loadRevisions = async () => {
    const data = await apiRequest(`/api/v1/knowledge/topics/${topicId}/revisions`)
    if (data) setRevisions(data.revisions || [])
    setShowRevisions(true)
  }

  if (loading) return <div className="py-12 text-center text-stone-400 text-sm">Chargement...</div>
  if (!topic) return <div className="py-12 text-center text-stone-400 text-sm">Sujet introuvable</div>

  const renderContent = (content) => {
    if (!content) return ''
    return content
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-stone-900 mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-stone-900 mt-5 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-stone-900 mt-6 mb-3">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-stone-700">$1</li>')
      .replace(/\n\n/g, '</p><p class="text-sm text-stone-700 leading-relaxed mb-3">')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Retour
      </button>

      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {topic.pinned && <Pin className="w-4 h-4 text-teal-600" />}
              {topic.sectionName && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">{topic.sectionName}</span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {topic.readingTimeMinutes} min
              </span>
            </div>
            <h1 className="text-xl font-bold text-stone-900">{topic.title}</h1>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={handleToggleBookmark} className={`p-1.5 rounded-lg hover:bg-stone-100 transition-colors ${topic.bookmarked ? 'text-teal-600' : 'text-stone-400 hover:text-teal-600'}`} title={topic.bookmarked ? 'Retirer le signet' : 'Ajouter un signet'}>
              {topic.bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
            <button onClick={handleTogglePin} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-teal-600 transition-colors" title={topic.pinned ? 'Désépingler' : 'Épingler'}>
              <Pin className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit(topic)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors" title="Modifier">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={loadRevisions} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors" title="Historique">
              <History className="w-4 h-4" />
            </button>
            <button onClick={handleArchive} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-amber-600 transition-colors" title="Archiver">
              <Archive className="w-4 h-4" />
            </button>
            <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-red-600 transition-colors" title="Supprimer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-stone-400 mb-4 pb-4 border-b border-stone-100">
          {topic.creatorName && <span>Par {topic.creatorName}</span>}
          <span>{new Date(topic.createdAt).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          {topic.editors?.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {topic.editors.length} co-auteur{topic.editors.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Editors avatars */}
        {topic.editors?.length > 0 && (
          <div className="flex items-center gap-1 mb-4">
            <span className="text-xs text-stone-400 mr-1">Édité par :</span>
            {topic.editors.map((e, i) => (
              <span key={i} className="text-xs text-stone-500" title={e.firstName}>
                {e.avatarUrl ? (
                  <img src={e.avatarUrl} className="w-5 h-5 rounded-full inline" alt={e.firstName} />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold inline-flex items-center justify-center">{e.firstName?.[0]}</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Tags */}
        {(topic.tags || []).length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {topic.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">{tag}</span>
            ))}
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-sm max-w-none text-sm text-stone-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: `<p class="text-sm text-stone-700 leading-relaxed mb-3">${renderContent(topic.content)}</p>` }}
        />

        {/* Attachments */}
        {topic.attachments?.length > 0 && (
          <div className="mt-6 pt-4 border-t border-stone-100">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" /> Fichiers joints
            </h3>
            <div className="space-y-1">
              {topic.attachments.map(a => (
                <a key={a.id} href={a.url} className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700" target="_blank" rel="noopener noreferrer">
                  <Paperclip className="w-3.5 h-3.5" /> {a.filename}
                  <span className="text-[10px] text-stone-400">({Math.round(a.byteSize / 1024)} Ko)</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related topics */}
      {related.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Sujets connexes</h3>
          <div className="space-y-2">
            {related.map(r => (
              <button key={r.id} onClick={() => window.location.reload()} className="block w-full text-left p-2 rounded-lg hover:bg-stone-50 transition-colors">
                <p className="text-sm font-medium text-stone-700">{r.title}</p>
                <div className="flex gap-1 mt-1">
                  {(r.tags || []).slice(0, 3).map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600">{t}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Revisions modal */}
      {showRevisions && (
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Historique des modifications
            </h3>
            <button onClick={() => setShowRevisions(false)} className="text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
          </div>
          {revisions.length === 0 ? (
            <p className="text-sm text-stone-400">Aucune modification enregistrée.</p>
          ) : (
            <div className="space-y-2">
              {revisions.map(rev => (
                <div key={rev.id} className="text-xs border-l-2 border-stone-200 pl-3 py-1">
                  <span className="font-medium text-stone-700">{rev.userName}</span>
                  <span className="text-stone-400 ml-2">{new Date(rev.createdAt).toLocaleString('fr-BE')}</span>
                  <div className="text-stone-500 mt-0.5">
                    {Object.keys(rev.changes || {}).join(', ')} modifié{Object.keys(rev.changes || {}).length > 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" /> Commentaires ({comments.length})
        </h3>
        {comments.length === 0 ? (
          <p className="text-sm text-stone-400 mb-3">Aucun commentaire pour le moment.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {c.authorAvatar ? <img src={c.authorAvatar} className="w-7 h-7 rounded-full" alt="" /> : c.authorName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-stone-700">{c.authorName}</span>
                    <span className="text-[10px] text-stone-400">{new Date(c.createdAt).toLocaleString('fr-BE')}</span>
                    <button onClick={() => handleDeleteComment(c.id)} className="ml-auto text-stone-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm text-stone-600 mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          />
          <button type="submit" disabled={!newComment.trim()} className="p-2 rounded-lg text-white disabled:opacity-50 transition-colors hover:opacity-90" style={{ backgroundColor: ACCENT }}>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Topic Form ───
function TopicForm({ topic, onSave, onCancel }) {
  const [sections, setSections] = useState([])
  const [form, setForm] = useState({
    title: topic?.title || '',
    content: topic?.content || '',
    tags: (topic?.tags || []).join(', '),
    section_id: topic?.sectionId || '',
    status: topic?.status || 'draft',
    author_name: topic?.authorName || '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiRequest('/api/v1/knowledge/sections').then(data => {
      if (data) setSections(data.sections || [])
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    }
    const url = topic?.id ? `/api/v1/knowledge/topics/${topic.id}` : '/api/v1/knowledge/topics'
    const method = topic?.id ? 'PATCH' : 'POST'
    const data = await apiRequest(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    setSaving(false)
    if (data?.topic) onSave(data.topic)
  }

  const field = (label, name, type = 'text', opts = {}) => (
    <div className={opts.className || ''}>
      <label className="block text-xs font-medium text-stone-600 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          rows={opts.rows || 3}
          className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 resize-y"
          placeholder={opts.placeholder}
        />
      ) : type === 'select' ? (
        <select
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        >
          {opts.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          placeholder={opts.placeholder}
        />
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">
          {topic?.id ? 'Modifier le sujet' : 'Nouveau sujet'}
        </h2>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        {field('Titre *', 'title', 'text', { placeholder: 'Titre du sujet' })}
        {field('Contenu (Markdown) *', 'content', 'textarea', { rows: 12, placeholder: '# Mon sujet\n\nContenu...' })}

        <div className="grid grid-cols-2 gap-4">
          {field('Section', 'section_id', 'select', {
            options: [{ value: '', label: 'Non classé' }, ...sections.map(s => ({ value: String(s.id), label: s.name }))]
          })}
          {field('Statut', 'status', 'select', {
            options: [
              { value: 'draft', label: 'Brouillon' },
              { value: 'published', label: 'Publié' },
              { value: 'archived', label: 'Archivé' },
            ]
          })}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field('Tags (séparés par des virgules)', 'tags', 'text', { placeholder: 'PAC, agroforesterie' })}
          {field('Auteur externe', 'author_name', 'text', { placeholder: 'Nom (publication externe)' })}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving || !form.title || !form.content}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: ACCENT }}
        >
          {saving ? 'Enregistrement...' : (topic?.id ? 'Mettre à jour' : 'Créer')}
        </button>
      </div>
    </form>
  )
}

// ─── Bookmarks ───
function BookmarksList({ onSelect }) {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await apiRequest('/api/v1/knowledge/bookmarks')
      if (data) setTopics(data.topics || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="py-12 text-center text-stone-400 text-sm">Chargement...</div>
  if (topics.length === 0) return (
    <div className="py-12 text-center text-stone-400 text-sm">
      <Bookmark className="w-8 h-8 mx-auto mb-2 text-stone-300" />
      Aucun signet
    </div>
  )

  return (
    <div className="grid gap-3">
      {topics.map(topic => (
        <button
          key={topic.id}
          onClick={() => onSelect(topic.id)}
          className="text-left bg-white border border-stone-200 rounded-xl p-4 hover:border-teal-300 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1">
            <BookmarkCheck className="w-3.5 h-3.5 text-teal-500" />
            <h3 className="text-sm font-semibold text-stone-900 truncate">{topic.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {topic.sectionName && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600">{topic.sectionName}</span>}
            <span className="text-[10px] text-stone-400">{topic.creatorName}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Archives ───
function ArchivesList({ onSelect }) {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await apiRequest('/api/v1/knowledge/topics?status=archived')
      if (data) setTopics(data.topics || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="py-12 text-center text-stone-400 text-sm">Chargement...</div>
  if (topics.length === 0) return (
    <div className="py-12 text-center text-stone-400 text-sm">
      <Archive className="w-8 h-8 mx-auto mb-2 text-stone-300" />
      Aucun sujet archivé
    </div>
  )

  return (
    <div className="grid gap-3">
      {topics.map(topic => (
        <button
          key={topic.id}
          onClick={() => onSelect(topic.id)}
          className="text-left bg-white border border-stone-200 rounded-xl p-4 hover:border-stone-300 transition-all cursor-pointer opacity-75"
        >
          <div className="flex items-center gap-2 mb-1">
            <Archive className="w-3.5 h-3.5 text-stone-400" />
            <h3 className="text-sm font-medium text-stone-700 truncate">{topic.title}</h3>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Main Page ───
export default function KnowledgeIndex() {
  const [activeSection, setActiveSection] = useState('sujets')
  const [selectedTopicId, setSelectedTopicId] = useState(null)
  const [editingTopic, setEditingTopic] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useShellNav({
    sections: [
      { id: 'sujets', label: 'Sujets' },
      { id: 'redaction', label: 'Rédaction' },
      { id: 'signets', label: 'Signets' },
      { id: 'archives', label: 'Archives' },
    ],
    activeSection,
    onSectionChange: (id) => {
      setActiveSection(id)
      setSelectedTopicId(null)
      setEditingTopic(null)
      setShowForm(id === 'redaction')
    },
  })

  const handleSelectTopic = (id) => {
    setSelectedTopicId(id)
    setShowForm(false)
    setEditingTopic(null)
  }

  const handleBack = () => {
    setSelectedTopicId(null)
    setEditingTopic(null)
    setShowForm(false)
  }

  const handleNew = () => {
    setActiveSection('redaction')
    setShowForm(true)
    setEditingTopic(null)
    setSelectedTopicId(null)
  }

  const handleEdit = (topic) => {
    setEditingTopic(topic)
    setShowForm(true)
    setSelectedTopicId(null)
    setActiveSection('redaction')
  }

  const handleSaved = () => {
    setShowForm(false)
    setEditingTopic(null)
    setActiveSection('sujets')
    setSelectedTopicId(null)
  }

  return (
    <div className="px-6 py-5 max-w-4xl">
      <div className="mb-5">
        <div className="flex items-center gap-2.5 mb-1">
          <BookOpen className="w-5 h-5" style={{ color: ACCENT }} />
          <h1 className="text-lg font-bold text-stone-900">Base de connaissances</h1>
        </div>
        <p className="text-sm text-stone-500">Veille stratégique, recherche, réglementation et ressources</p>
      </div>

      {showForm || activeSection === 'redaction' ? (
        <TopicForm
          topic={editingTopic}
          onSave={handleSaved}
          onCancel={handleBack}
        />
      ) : selectedTopicId ? (
        <TopicDetail
          topicId={selectedTopicId}
          onBack={handleBack}
          onEdit={handleEdit}
        />
      ) : activeSection === 'signets' ? (
        <BookmarksList onSelect={handleSelectTopic} />
      ) : activeSection === 'archives' ? (
        <ArchivesList onSelect={handleSelectTopic} />
      ) : (
        <TopicsList onSelect={handleSelectTopic} onNew={handleNew} />
      )}
    </div>
  )
}
