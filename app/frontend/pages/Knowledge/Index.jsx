import React, { useState, useEffect, useCallback } from 'react'
import { useShellNav } from '../../components/shell/ShellContext'
import { apiRequest } from '../../lib/api'
import { BookOpen, Plus, Search, Pin, ExternalLink, Archive, Edit3, Trash2, ChevronLeft, X } from 'lucide-react'

const ACCENT = '#0D9488'
const CATEGORIES = [
  { value: 'research', label: 'Recherche', color: 'bg-blue-100 text-blue-700' },
  { value: 'regulation', label: 'Réglementation', color: 'bg-amber-100 text-amber-700' },
  { value: 'funding', label: 'Financement', color: 'bg-green-100 text-green-700' },
  { value: 'strategy', label: 'Stratégie', color: 'bg-purple-100 text-purple-700' },
  { value: 'technical', label: 'Technique', color: 'bg-rose-100 text-rose-700' },
  { value: 'other', label: 'Autre', color: 'bg-stone-100 text-stone-700' },
]
const POLES = [
  { value: 'academy', label: 'Academy' },
  { value: 'design', label: 'Design' },
  { value: 'nursery', label: 'Nursery' },
  { value: 'roots', label: 'Roots' },
]

function getCategoryBadge(cat) {
  return CATEGORIES.find(c => c.value === cat) || CATEGORIES[5]
}

// ─── Articles List ───
function ArticlesList({ onSelect, onNew }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPole, setFilterPole] = useState('')

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterCategory) params.set('category', filterCategory)
    if (filterPole) params.set('pole', filterPole)
    params.set('status', 'published')
    const data = await apiRequest(`/api/v1/knowledge?${params}`)
    if (data) setArticles(data.articles || [])
    setLoading(false)
  }, [search, filterCategory, filterPole])

  useEffect(() => { fetchArticles() }, [fetchArticles])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher un article..."
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
          <Plus className="w-4 h-4" /> Nouveau
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="text-sm border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        >
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select
          value={filterPole}
          onChange={e => setFilterPole(e.target.value)}
          className="text-sm border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        >
          <option value="">Tous pôles</option>
          {POLES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-stone-400 text-sm">Chargement...</div>
      ) : articles.length === 0 ? (
        <div className="py-12 text-center text-stone-400 text-sm">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-stone-300" />
          Aucun article trouvé
        </div>
      ) : (
        <div className="grid gap-3">
          {articles.map(article => {
            const badge = getCategoryBadge(article.category)
            return (
              <button
                key={article.id}
                onClick={() => onSelect(article.id)}
                className="text-left bg-white border border-stone-200 rounded-xl p-4 hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {article.pinned && <Pin className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                      <h3 className="text-sm font-semibold text-stone-900 truncate">{article.title}</h3>
                    </div>
                    {article.summary && (
                      <p className="text-xs text-stone-500 line-clamp-2 mb-2">{article.summary}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                      {(article.tags || []).slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] text-stone-400 shrink-0">
                    {new Date(article.createdAt).toLocaleDateString('fr-BE')}
                  </div>
                </div>
                {article.authorName && (
                  <p className="text-[10px] text-stone-400 mt-2">Par {article.authorName}</p>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Article Detail ───
function ArticleDetail({ articleId, onBack, onEdit }) {
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await apiRequest(`/api/v1/knowledge/${articleId}`)
      if (data) setArticle(data.article)
      setLoading(false)
    }
    load()
  }, [articleId])

  const handleDelete = async () => {
    if (!confirm('Supprimer cet article ?')) return
    await apiRequest(`/api/v1/knowledge/${articleId}`, { method: 'DELETE' })
    onBack()
  }

  const handleTogglePin = async () => {
    const action = article.pinned ? 'unpin' : 'pin'
    const data = await apiRequest(`/api/v1/knowledge/${articleId}/${action}`, { method: 'PATCH' })
    if (data) setArticle(prev => ({ ...prev, pinned: data.article.pinned }))
  }

  const handleArchive = async () => {
    const data = await apiRequest(`/api/v1/knowledge/${articleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' })
    })
    if (data) onBack()
  }

  if (loading) return <div className="py-12 text-center text-stone-400 text-sm">Chargement...</div>
  if (!article) return <div className="py-12 text-center text-stone-400 text-sm">Article introuvable</div>

  const badge = getCategoryBadge(article.category)

  // Simple markdown to HTML (basic)
  const renderMarkdown = (md) => {
    if (!md) return ''
    return md
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
              {article.pinned && <Pin className="w-4 h-4 text-teal-600" />}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
              {article.pole && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">{article.pole}</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-stone-900">{article.title}</h1>
            {article.summary && <p className="text-sm text-stone-500 mt-1">{article.summary}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={handleTogglePin} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-teal-600 transition-colors" title={article.pinned ? 'Désépingler' : 'Épingler'}>
              <Pin className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit(article)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors" title="Modifier">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={handleArchive} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-amber-600 transition-colors" title="Archiver">
              <Archive className="w-4 h-4" />
            </button>
            <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-red-600 transition-colors" title="Supprimer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-400 mb-4 pb-4 border-b border-stone-100">
          {article.authorName && <span>Par {article.authorName}</span>}
          <span>{new Date(article.createdAt).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          {article.sourceUrl && (
            <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-teal-600 hover:text-teal-700">
              <ExternalLink className="w-3 h-3" /> Source
            </a>
          )}
        </div>

        {(article.tags || []).length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {article.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">{tag}</span>
            ))}
          </div>
        )}

        <div
          className="prose prose-sm max-w-none text-sm text-stone-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: `<p class="text-sm text-stone-700 leading-relaxed mb-3">${renderMarkdown(article.content)}</p>` }}
        />
      </div>
    </div>
  )
}

// ─── Article Form ───
function ArticleForm({ article, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: article?.title || '',
    content: article?.content || '',
    summary: article?.summary || '',
    category: article?.category || 'other',
    tags: (article?.tags || []).join(', '),
    sourceUrl: article?.sourceUrl || '',
    pole: article?.pole || '',
    status: article?.status || 'draft',
    authorName: article?.authorName || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      source_url: form.sourceUrl,
      author_name: form.authorName,
    }
    delete payload.sourceUrl
    delete payload.authorName

    const url = article?.id ? `/api/v1/knowledge/${article.id}` : '/api/v1/knowledge'
    const method = article?.id ? 'PATCH' : 'POST'
    const data = await apiRequest(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    setSaving(false)
    if (data?.article) onSave(data.article)
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
          {article?.id ? 'Modifier l\'article' : 'Nouvel article'}
        </h2>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        {field('Titre *', 'title', 'text', { placeholder: 'Titre de l\'article' })}
        {field('Résumé', 'summary', 'textarea', { rows: 2, placeholder: 'Résumé court...' })}
        {field('Contenu (Markdown) *', 'content', 'textarea', { rows: 12, placeholder: '# Mon article\n\nContenu en Markdown...' })}

        <div className="grid grid-cols-2 gap-4">
          {field('Catégorie', 'category', 'select', {
            options: CATEGORIES.map(c => ({ value: c.value, label: c.label }))
          })}
          {field('Pôle', 'pole', 'select', {
            options: [{ value: '', label: 'Aucun' }, ...POLES]
          })}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field('Tags (séparés par des virgules)', 'tags', 'text', { placeholder: 'PAC, agroforesterie, financement' })}
          {field('Auteur', 'authorName', 'text', { placeholder: 'Nom de l\'auteur' })}
        </div>

        {field('URL source', 'sourceUrl', 'text', { placeholder: 'https://...' })}

        {field('Statut', 'status', 'select', {
          options: [
            { value: 'draft', label: 'Brouillon' },
            { value: 'published', label: 'Publié' },
            { value: 'archived', label: 'Archivé' },
          ]
        })}
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
          {saving ? 'Enregistrement...' : (article?.id ? 'Mettre à jour' : 'Créer')}
        </button>
      </div>
    </form>
  )
}

// ─── Archives ───
function ArchivesList({ onSelect }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await apiRequest('/api/v1/knowledge?status=archived')
      if (data) setArticles(data.articles || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="py-12 text-center text-stone-400 text-sm">Chargement...</div>
  if (articles.length === 0) return (
    <div className="py-12 text-center text-stone-400 text-sm">
      <Archive className="w-8 h-8 mx-auto mb-2 text-stone-300" />
      Aucun article archivé
    </div>
  )

  return (
    <div className="grid gap-3">
      {articles.map(article => {
        const badge = getCategoryBadge(article.category)
        return (
          <button
            key={article.id}
            onClick={() => onSelect(article.id)}
            className="text-left bg-white border border-stone-200 rounded-xl p-4 hover:border-stone-300 transition-all cursor-pointer opacity-75"
          >
            <div className="flex items-center gap-2 mb-1">
              <Archive className="w-3.5 h-3.5 text-stone-400" />
              <h3 className="text-sm font-medium text-stone-700 truncate">{article.title}</h3>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
            </div>
            {article.summary && <p className="text-xs text-stone-400 line-clamp-1">{article.summary}</p>}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main Page ───
export default function KnowledgeIndex() {
  const [activeSection, setActiveSection] = useState('articles')
  const [selectedArticleId, setSelectedArticleId] = useState(null)
  const [editingArticle, setEditingArticle] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useShellNav({
    sections: [
      { id: 'articles', label: 'Articles' },
      { id: 'redaction', label: 'Rédaction' },
      { id: 'archives', label: 'Archives' },
    ],
    activeSection,
    onSectionChange: (id) => {
      setActiveSection(id)
      setSelectedArticleId(null)
      setEditingArticle(null)
      setShowForm(id === 'redaction')
    },
  })

  const handleSelectArticle = (id) => {
    setSelectedArticleId(id)
    setShowForm(false)
    setEditingArticle(null)
  }

  const handleBack = () => {
    setSelectedArticleId(null)
    setEditingArticle(null)
    setShowForm(false)
  }

  const handleNew = () => {
    setActiveSection('redaction')
    setShowForm(true)
    setEditingArticle(null)
    setSelectedArticleId(null)
  }

  const handleEdit = (article) => {
    setEditingArticle(article)
    setShowForm(true)
    setSelectedArticleId(null)
    setActiveSection('redaction')
  }

  const handleSaved = () => {
    setShowForm(false)
    setEditingArticle(null)
    setActiveSection('articles')
    setSelectedArticleId(null)
  }

  return (
    <div className="px-6 py-5 max-w-4xl">
      <div className="mb-5">
        <div className="flex items-center gap-2.5 mb-1">
          <BookOpen className="w-5 h-5" style={{ color: ACCENT }} />
          <h1 className="text-lg font-bold text-stone-900">Knowledge Base</h1>
        </div>
        <p className="text-sm text-stone-500">Veille stratégique, recherche, réglementation et ressources</p>
      </div>

      {showForm || activeSection === 'redaction' ? (
        <ArticleForm
          article={editingArticle}
          onSave={handleSaved}
          onCancel={handleBack}
        />
      ) : selectedArticleId ? (
        <ArticleDetail
          articleId={selectedArticleId}
          onBack={handleBack}
          onEdit={handleEdit}
        />
      ) : activeSection === 'archives' ? (
        <ArchivesList onSelect={handleSelectArticle} />
      ) : (
        <ArticlesList onSelect={handleSelectArticle} onNew={handleNew} />
      )}
    </div>
  )
}
