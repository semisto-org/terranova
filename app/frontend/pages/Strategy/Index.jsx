import React, { useState, useEffect, useCallback } from 'react'
import { useShellNav } from '../../components/shell/ShellContext'
import { apiRequest } from '../../lib/api'
import {
  BookOpen, Plus, Search, Pin, Edit3, Trash2, ChevronLeft, X,
  MessageCircle, FileText, Target, ExternalLink, Paperclip,
  Send, Check, XCircle, MinusCircle, PenLine, ChevronDown, ChevronRight
} from 'lucide-react'
import SimpleEditor from '../../components/SimpleEditor'

const ACCENT = '#2563EB'

const RESOURCE_TYPES = [
  { value: 'article', label: 'Article' },
  { value: 'report', label: 'Rapport' },
  { value: 'reference', label: 'Référence' },
  { value: 'framework', label: 'Framework' },
  { value: 'tool', label: 'Outil' },
]

const DELIB_STATUSES = [
  { value: '', label: 'Toutes' },
  { value: 'open', label: 'Ouvertes' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'decided', label: 'Décidées' },
  { value: 'archived', label: 'Archivées' },
]

const DELIB_STATUS_COLORS = {
  open: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  decided: 'bg-green-50 text-green-700',
  archived: 'bg-stone-100 text-stone-500',
}

const DELIB_STATUS_LABELS = { open: 'Ouverte', in_progress: 'En cours', decided: 'Décidée', archived: 'Archivée' }

const FRAMEWORK_TYPES = [
  { value: 'charter', label: 'Charte' },
  { value: 'protocol', label: 'Protocole' },
  { value: 'decision_matrix', label: 'Matrice de décision' },
  { value: 'role_definition', label: 'Définition de rôle' },
]

const FRAMEWORK_TYPE_LABELS = { charter: 'Charte', protocol: 'Protocole', decision_matrix: 'Matrice de décision', role_definition: 'Définition de rôle' }
const FRAMEWORK_STATUS_LABELS = { draft: 'Brouillon', active: 'Actif', superseded: 'Remplacé', archived: 'Archivé' }
const FRAMEWORK_STATUS_COLORS = { draft: 'bg-stone-100 text-stone-600', active: 'bg-green-50 text-green-700', superseded: 'bg-amber-50 text-amber-700', archived: 'bg-stone-100 text-stone-500' }

const AXIS_STATUS_LABELS = { active: 'Actif', paused: 'En pause', achieved: 'Atteint', abandoned: 'Abandonné' }
const AXIS_STATUS_COLORS = { active: 'bg-green-50 text-green-700', paused: 'bg-amber-50 text-amber-700', achieved: 'bg-blue-50 text-blue-700', abandoned: 'bg-stone-100 text-stone-500' }

function stripHtml(html) {
  if (!html || typeof html !== 'string') return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

const KR_STATUS_COLORS = { on_track: 'bg-green-500', at_risk: 'bg-amber-500', behind: 'bg-red-500', achieved: 'bg-blue-500' }
const KR_STATUS_LABELS = { on_track: 'En bonne voie', at_risk: 'À risque', behind: 'En retard', achieved: 'Atteint' }

const DECISION_MODE_LABELS = { consent: 'Consentement', vote: 'Vote', advisory: 'Consultatif' }

const REACTION_CONFIG = [
  { position: 'consent', label: 'Consentement', icon: Check, color: 'text-green-600 hover:bg-green-50' },
  { position: 'objection', label: 'Objection', icon: XCircle, color: 'text-red-600 hover:bg-red-50' },
  { position: 'abstain', label: 'Abstention', icon: MinusCircle, color: 'text-stone-500 hover:bg-stone-50' },
  { position: 'amendment', label: 'Amendement', icon: PenLine, color: 'text-amber-600 hover:bg-amber-50' },
]

// ─── Resources List ───
function ResourcesList({ onSelect, onNew }) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterType) params.set('resource_type', filterType)
    const data = await apiRequest(`/api/v1/strategy/resources?${params}`)
    if (data) setResources(data.resources || [])
    setLoading(false)
  }, [search, filterType])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher une ressource..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: ACCENT }}
        >
          <Plus className="w-4 h-4" /> Nouvelle ressource
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType('')}
          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${!filterType ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}
        >
          Tous
        </button>
        {RESOURCE_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setFilterType(filterType === t.value ? '' : t.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${filterType === t.value ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-stone-400 text-sm">Chargement...</div>
      ) : resources.length === 0 ? (
        <div className="py-12 text-center text-stone-400 text-sm">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-stone-300" />
          Aucune ressource trouvée
        </div>
      ) : (
        <div className="grid gap-3">
          {resources.map(r => (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className="text-left bg-white border border-stone-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {r.pinned && <Pin className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    <h3 className="text-sm font-semibold text-stone-900 truncate">{r.title}</h3>
                  </div>
                  {r.summary && <p className="text-xs text-stone-500 mb-2 line-clamp-2">{r.summary}</p>}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {RESOURCE_TYPES.find(t => t.value === r.resourceType)?.label || r.resourceType}
                    </span>
                    {(r.tags || []).slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600">{tag}</span>
                    ))}
                    {r.sourceUrl && <ExternalLink className="w-3 h-3 text-stone-400" />}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] text-stone-400">
                    {new Date(r.createdAt).toLocaleDateString('fr-BE')}
                  </span>
                </div>
              </div>
              {r.creatorName && (
                <p className="text-[10px] text-stone-400 mt-2">Par {r.creatorName}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Resource Detail ───
function ResourceDetail({ resourceId, onBack, onEdit }) {
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await apiRequest(`/api/v1/strategy/resources/${resourceId}`)
      if (data) setResource(data.resource)
      setLoading(false)
    }
    load()
  }, [resourceId])

  const handleDelete = async () => {
    if (!confirm('Supprimer cette ressource ?')) return
    await apiRequest(`/api/v1/strategy/resources/${resourceId}`, { method: 'DELETE' })
    onBack()
  }

  const handleTogglePin = async () => {
    const data = await apiRequest(`/api/v1/strategy/resources/${resourceId}/pin`, { method: 'PATCH' })
    if (data) setResource(prev => ({ ...prev, pinned: data.resource.pinned }))
  }

  if (loading) return <div className="py-12 text-center text-stone-400 text-sm">Chargement...</div>
  if (!resource) return <div className="py-12 text-center text-stone-400 text-sm">Ressource introuvable</div>

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Retour
      </button>

      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {resource.pinned && <Pin className="w-4 h-4 text-blue-600" />}
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {RESOURCE_TYPES.find(t => t.value === resource.resourceType)?.label}
              </span>
            </div>
            <h1 className="text-xl font-bold text-stone-900">{resource.title}</h1>
            {resource.summary && <p className="text-sm text-stone-500 mt-1">{resource.summary}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={handleTogglePin} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-blue-600 transition-colors" title={resource.pinned ? 'Désépingler' : 'Épingler'}>
              <Pin className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit(resource)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors" title="Modifier">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-red-600 transition-colors" title="Supprimer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-400 mb-4 pb-4 border-b border-stone-100">
          {resource.creatorName && <span>Par {resource.creatorName}</span>}
          <span>{new Date(resource.createdAt).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>

        {(resource.tags || []).length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {resource.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{tag}</span>
            ))}
          </div>
        )}

        {resource.sourceUrl && (
          <a
            href={resource.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Source externe
          </a>
        )}

        {resource.content && (
          <div
            className="prose prose-sm max-w-none text-sm text-stone-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: resource.content }}
          />
        )}

        {resource.attachments?.length > 0 && (
          <div className="mt-6 pt-4 border-t border-stone-100">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" /> Fichiers joints
            </h3>
            <div className="space-y-1">
              {resource.attachments.map(a => (
                <a key={a.id} href={a.url} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700" target="_blank" rel="noopener noreferrer">
                  <Paperclip className="w-3.5 h-3.5" /> {a.filename}
                  <span className="text-[10px] text-stone-400">({Math.round(a.byteSize / 1024)} Ko)</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Resource Form ───
function ResourceForm({ resource, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: resource?.title || '',
    summary: resource?.summary || '',
    content: resource?.content || '',
    source_url: resource?.sourceUrl || '',
    resource_type: resource?.resourceType || 'article',
    tags: (resource?.tags || []).join(', '),
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }
    const url = resource?.id ? `/api/v1/strategy/resources/${resource.id}` : '/api/v1/strategy/resources'
    const method = resource?.id ? 'PATCH' : 'POST'
    const data = await apiRequest(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    setSaving(false)
    if (data?.resource) onSave()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">
          {resource?.id ? 'Modifier la ressource' : 'Nouvelle ressource'}
        </h2>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Titre *</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            placeholder="Titre de la ressource" />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Résumé</label>
          <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={2}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-y"
            placeholder="Résumé court de la ressource" />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Contenu</label>
          <SimpleEditor
            content={form.content}
            onUpdate={(html) => setForm(f => ({ ...f, content: html }))}
            placeholder="Notes, analyse, contenu de la ressource..."
            minHeight="200px"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Type *</label>
            <select value={form.resource_type} onChange={e => setForm(f => ({ ...f, resource_type: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              {RESOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">URL source</label>
            <input type="url" value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              placeholder="https://..." />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Tags (séparés par des virgules)</label>
          <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            placeholder="gouvernance, sociocratie, enspiral" />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">Annuler</button>
        <button type="submit" disabled={saving || !form.title}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: ACCENT }}>
          {saving ? 'Enregistrement...' : (resource?.id ? 'Mettre à jour' : 'Créer')}
        </button>
      </div>
    </form>
  )
}

// ─── Deliberations List ───
function DeliberationsList({ onSelect, onNew }) {
  const [deliberations, setDeliberations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterStatus) params.set('status', filterStatus)
    const data = await apiRequest(`/api/v1/strategy/deliberations?${params}`)
    if (data) setDeliberations(data.deliberations || [])
    setLoading(false)
  }, [search, filterStatus])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input type="text" placeholder="Rechercher une délibération..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
        </div>
        <button onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: ACCENT }}>
          <Plus className="w-4 h-4" /> Nouvelle délibération
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {DELIB_STATUSES.map(s => (
          <button key={s.value} onClick={() => setFilterStatus(filterStatus === s.value ? '' : s.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${filterStatus === s.value ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-stone-400 text-sm">Chargement...</div>
      ) : deliberations.length === 0 ? (
        <div className="py-12 text-center text-stone-400 text-sm">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 text-stone-300" />
          Aucune délibération trouvée
        </div>
      ) : (
        <div className="grid gap-3">
          {deliberations.map(d => (
            <button key={d.id} onClick={() => onSelect(d.id)}
              className="text-left bg-white border border-stone-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-stone-900 truncate">{d.title}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${DELIB_STATUS_COLORS[d.status]}`}>
                      {DELIB_STATUS_LABELS[d.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-stone-400">
                    <span>{d.proposalCount} proposition{d.proposalCount !== 1 ? 's' : ''}</span>
                    {d.reactionsSummary && (
                      <>
                        <span className="text-green-600">✓ {d.reactionsSummary.consent}</span>
                        <span className="text-red-600">✗ {d.reactionsSummary.objection}</span>
                      </>
                    )}
                    <span>{d.commentCount} commentaire{d.commentCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <span className="text-[10px] text-stone-400 shrink-0">
                  {new Date(d.createdAt).toLocaleDateString('fr-BE')}
                </span>
              </div>
              {d.creatorName && <p className="text-[10px] text-stone-400 mt-2">Par {d.creatorName}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Deliberation Detail ───
function DeliberationDetail({ deliberationId, onBack, onEdit }) {
  const [delib, setDelib] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [newProposal, setNewProposal] = useState('')
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [showDecideForm, setShowDecideForm] = useState(false)
  const [outcomeText, setOutcomeText] = useState('')
  const [reactionForm, setReactionForm] = useState(null) // { proposalId, position }

  const load = useCallback(async () => {
    setLoading(true)
    const data = await apiRequest(`/api/v1/strategy/deliberations/${deliberationId}`)
    if (data) setDelib(data.deliberation)
    setLoading(false)
  }, [deliberationId])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!confirm('Supprimer cette délibération ?')) return
    await apiRequest(`/api/v1/strategy/deliberations/${deliberationId}`, { method: 'DELETE' })
    onBack()
  }

  const handleAddProposal = async (e) => {
    e.preventDefault()
    if (!newProposal.trim()) return
    await apiRequest(`/api/v1/strategy/deliberations/${deliberationId}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newProposal })
    })
    setNewProposal('')
    setShowProposalForm(false)
    load()
  }

  const handleReaction = async (proposalId, position, rationale) => {
    await apiRequest(`/api/v1/strategy/proposals/${proposalId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position, rationale })
    })
    setReactionForm(null)
    load()
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    await apiRequest(`/api/v1/strategy/deliberations/${deliberationId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment })
    })
    setNewComment('')
    load()
  }

  const handleDecide = async (e) => {
    e.preventDefault()
    await apiRequest(`/api/v1/strategy/deliberations/${deliberationId}/decide`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome: outcomeText })
    })
    setShowDecideForm(false)
    load()
  }

  if (loading) return <div className="py-12 text-center text-stone-400 text-sm">Chargement...</div>
  if (!delib) return <div className="py-12 text-center text-stone-400 text-sm">Délibération introuvable</div>

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Retour
      </button>

      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${DELIB_STATUS_COLORS[delib.status]}`}>
                {DELIB_STATUS_LABELS[delib.status]}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                {DECISION_MODE_LABELS[delib.decisionMode]}
              </span>
            </div>
            <h1 className="text-xl font-bold text-stone-900">{delib.title}</h1>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(delib)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors" title="Modifier">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-red-600 transition-colors" title="Supprimer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-400 mb-4 pb-4 border-b border-stone-100">
          {delib.creatorName && <span>Par {delib.creatorName}</span>}
          <span>{new Date(delib.createdAt).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>

        {delib.context && (
          <div className="prose prose-sm max-w-none text-sm text-stone-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: delib.context }} />
        )}
      </div>

      {/* Outcome (if decided) */}
      {delib.status === 'decided' && delib.outcome && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> Décision
          </h3>
          <div className="text-sm text-green-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: delib.outcome }} />
          {delib.decidedAt && (
            <p className="text-xs text-green-600 mt-2">Décidée le {new Date(delib.decidedAt).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          )}
        </div>
      )}

      {/* Proposals */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Propositions ({delib.proposals?.length || 0})</h3>
          {delib.status !== 'decided' && delib.status !== 'archived' && (
            <button onClick={() => setShowProposalForm(true)}
              className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-colors" style={{ color: ACCENT }}>
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          )}
        </div>

        {(delib.proposals || []).map(p => (
          <div key={p.id} className="mb-4 pb-4 border-b border-stone-100 last:border-0 last:mb-0 last:pb-0">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                {p.authorAvatar ? <img src={p.authorAvatar} className="w-7 h-7 rounded-full" alt="" /> : p.authorName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-stone-700">{p.authorName}</span>
                  <span className="text-[10px] text-stone-400">{new Date(p.createdAt).toLocaleString('fr-BE')}</span>
                </div>
                <div className="text-sm text-stone-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: p.content }} />
              </div>
            </div>

            {/* Reaction counts */}
            <div className="flex items-center gap-3 ml-10 mb-2">
              {Object.entries(p.reactionCounts || {}).filter(([, c]) => c > 0).map(([pos, count]) => (
                <span key={pos} className={`text-[11px] ${pos === 'consent' ? 'text-green-600' : pos === 'objection' ? 'text-red-600' : pos === 'amendment' ? 'text-amber-600' : 'text-stone-400'}`}>
                  {REACTION_CONFIG.find(r => r.position === pos)?.label} ({count})
                </span>
              ))}
            </div>

            {/* Existing reactions detail */}
            {(p.reactions || []).length > 0 && (
              <div className="ml-10 space-y-1 mb-2">
                {p.reactions.map(r => (
                  <div key={r.id} className="flex items-center gap-2 text-[11px]">
                    <span className={`${r.position === 'consent' ? 'text-green-600' : r.position === 'objection' ? 'text-red-600' : r.position === 'amendment' ? 'text-amber-600' : 'text-stone-400'}`}>
                      {REACTION_CONFIG.find(rc => rc.position === r.position)?.label}
                    </span>
                    <span className="text-stone-500">— {r.memberName}</span>
                    {r.rationale && <span className="text-stone-400 italic">: {r.rationale}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Reaction buttons */}
            {delib.status !== 'decided' && delib.status !== 'archived' && (
              <div className="ml-10">
                {reactionForm?.proposalId === p.id ? (
                  <ReactionFormInline
                    position={reactionForm.position}
                    onSubmit={(rationale) => handleReaction(p.id, reactionForm.position, rationale)}
                    onCancel={() => setReactionForm(null)}
                  />
                ) : (
                  <div className="flex gap-1.5">
                    {REACTION_CONFIG.map(rc => (
                      <button key={rc.position} onClick={() => setReactionForm({ proposalId: p.id, position: rc.position })}
                        className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-stone-200 transition-colors ${rc.color}`}>
                        <rc.icon className="w-3 h-3" /> {rc.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {showProposalForm && (
          <form onSubmit={handleAddProposal} className="mt-4 pt-4 border-t border-stone-100">
            <label className="block text-xs font-medium text-stone-600 mb-1">Nouvelle proposition</label>
            <SimpleEditor
              content={newProposal}
              onUpdate={setNewProposal}
              placeholder="Décrivez votre proposition..."
              minHeight="120px"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => { setShowProposalForm(false); setNewProposal('') }}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg">Annuler</button>
              <button type="submit" disabled={!newProposal.trim()}
                className="px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: ACCENT }}>Soumettre</button>
            </div>
          </form>
        )}
      </div>

      {/* Decide button */}
      {delib.status !== 'decided' && delib.status !== 'archived' && (
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          {showDecideForm ? (
            <form onSubmit={handleDecide}>
              <label className="block text-xs font-medium text-stone-600 mb-1">Résultat de la décision</label>
              <SimpleEditor content={outcomeText} onUpdate={setOutcomeText} placeholder="Décrivez la décision prise..." minHeight="120px" />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowDecideForm(false)} className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg">Annuler</button>
                <button type="submit" disabled={!outcomeText.trim()} className="px-3 py-1.5 text-xs font-medium text-white rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50">Confirmer la décision</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowDecideForm(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800 transition-colors">
              <Check className="w-4 h-4" /> Marquer comme décidée
            </button>
          )}
        </div>
      )}

      {/* Comments */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" /> Discussion ({delib.comments?.length || 0})
        </h3>
        {(delib.comments || []).length === 0 ? (
          <p className="text-sm text-stone-400 mb-3">Aucun commentaire pour le moment.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {delib.comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {c.authorAvatar ? <img src={c.authorAvatar} className="w-7 h-7 rounded-full" alt="" /> : c.authorName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-stone-700">{c.authorName}</span>
                    <span className="text-[10px] text-stone-400">{new Date(c.createdAt).toLocaleString('fr-BE')}</span>
                  </div>
                  <p className="text-sm text-stone-600 mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          <button type="submit" disabled={!newComment.trim()} className="p-2 rounded-lg text-white disabled:opacity-50 transition-colors hover:opacity-90" style={{ backgroundColor: ACCENT }}>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Reaction Form Inline ───
function ReactionFormInline({ position, onSubmit, onCancel }) {
  const [rationale, setRationale] = useState('')
  const config = REACTION_CONFIG.find(r => r.position === position)

  return (
    <div className="flex items-center gap-2 mt-1">
      <span className={`text-xs font-medium ${config.color.split(' ')[0]}`}>{config.label} :</span>
      <input type="text" value={rationale} onChange={e => setRationale(e.target.value)}
        placeholder="Argumentaire (optionnel)..."
        className="flex-1 px-2 py-1 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/30"
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSubmit(rationale) } }} />
      <button onClick={() => onSubmit(rationale)} className="text-xs px-2 py-1 rounded-lg text-white hover:opacity-90" style={{ backgroundColor: ACCENT }}>OK</button>
      <button onClick={onCancel} className="text-xs text-stone-400 hover:text-stone-600">
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

// ─── Deliberation Form ───
function DeliberationForm({ deliberation, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: deliberation?.title || '',
    context: deliberation?.context || '',
    decision_mode: deliberation?.decisionMode || 'consent',
    status: deliberation?.status || 'open',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const url = deliberation?.id ? `/api/v1/strategy/deliberations/${deliberation.id}` : '/api/v1/strategy/deliberations'
    const method = deliberation?.id ? 'PATCH' : 'POST'
    const data = await apiRequest(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setSaving(false)
    if (data?.deliberation) onSave()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">
          {deliberation?.id ? 'Modifier la délibération' : 'Nouvelle délibération'}
        </h2>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Titre *</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            placeholder="Sujet de la délibération" />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Contexte</label>
          <SimpleEditor content={form.context} onUpdate={(html) => setForm(f => ({ ...f, context: html }))}
            placeholder="Pourquoi cette délibération est-elle nécessaire ?" minHeight="150px" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Mode de décision</label>
            <select value={form.decision_mode} onChange={e => setForm(f => ({ ...f, decision_mode: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              <option value="consent">Consentement</option>
              <option value="vote">Vote</option>
              <option value="advisory">Consultatif</option>
            </select>
          </div>
          {deliberation?.id && (
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Statut</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                {DELIB_STATUSES.filter(s => s.value).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">Annuler</button>
        <button type="submit" disabled={saving || !form.title}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: ACCENT }}>
          {saving ? 'Enregistrement...' : (deliberation?.id ? 'Mettre à jour' : 'Créer')}
        </button>
      </div>
    </form>
  )
}

// ─── Frameworks List ───
function FrameworksList({ onSelect, onNew }) {
  const [frameworks, setFrameworks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await apiRequest('/api/v1/strategy/frameworks')
      if (data) setFrameworks(data.frameworks || [])
      setLoading(false)
    }
    load()
  }, [])

  const grouped = frameworks.reduce((acc, f) => {
    const type = FRAMEWORK_TYPE_LABELS[f.frameworkType] || f.frameworkType
    if (!acc[type]) acc[type] = []
    acc[type].push(f)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <button onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: ACCENT }}>
          <Plus className="w-4 h-4" /> Nouveau cadre
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-stone-400 text-sm">Chargement...</div>
      ) : frameworks.length === 0 ? (
        <div className="py-12 text-center text-stone-400 text-sm">
          <FileText className="w-8 h-8 mx-auto mb-2 text-stone-300" />
          Aucun cadre de gouvernance
        </div>
      ) : (
        Object.entries(grouped).map(([typeName, items]) => (
          <div key={typeName}>
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">{typeName}</h3>
            <div className="grid gap-3 mb-4">
              {items.map(f => (
                <button key={f.id} onClick={() => onSelect(f.id)}
                  className="text-left bg-white border border-stone-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-stone-900 truncate">{f.title}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${FRAMEWORK_STATUS_COLORS[f.status]}`}>
                          {FRAMEWORK_STATUS_LABELS[f.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-stone-400">
                        <span>v{f.version}</span>
                        {f.deliberationTitle && <span className="text-blue-600">↗ {f.deliberationTitle}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-stone-400 shrink-0">
                      {new Date(f.createdAt).toLocaleDateString('fr-BE')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ─── Framework Detail ───
function FrameworkDetail({ frameworkId, onBack, onEdit }) {
  const [framework, setFramework] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await apiRequest(`/api/v1/strategy/frameworks/${frameworkId}`)
      if (data) setFramework(data.framework)
      setLoading(false)
    }
    load()
  }, [frameworkId])

  const handleDelete = async () => {
    if (!confirm('Supprimer ce cadre ?')) return
    await apiRequest(`/api/v1/strategy/frameworks/${frameworkId}`, { method: 'DELETE' })
    onBack()
  }

  if (loading) return <div className="py-12 text-center text-stone-400 text-sm">Chargement...</div>
  if (!framework) return <div className="py-12 text-center text-stone-400 text-sm">Cadre introuvable</div>

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Retour
      </button>

      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {FRAMEWORK_TYPE_LABELS[framework.frameworkType]}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${FRAMEWORK_STATUS_COLORS[framework.status]}`}>
                {FRAMEWORK_STATUS_LABELS[framework.status]}
              </span>
              <span className="text-xs text-stone-400">v{framework.version}</span>
            </div>
            <h1 className="text-xl font-bold text-stone-900">{framework.title}</h1>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(framework)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"><Edit3 className="w-4 h-4" /></button>
            <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-400 mb-4 pb-4 border-b border-stone-100">
          {framework.creatorName && <span>Par {framework.creatorName}</span>}
          <span>{new Date(framework.createdAt).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          {framework.deliberationTitle && (
            <span className="text-blue-600">Issu de : {framework.deliberationTitle}</span>
          )}
        </div>

        <div className="prose prose-sm max-w-none text-sm text-stone-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: framework.content }} />

        {framework.attachments?.length > 0 && (
          <div className="mt-6 pt-4 border-t border-stone-100">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" /> Fichiers joints
            </h3>
            <div className="space-y-1">
              {framework.attachments.map(a => (
                <a key={a.id} href={a.url} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700" target="_blank" rel="noopener noreferrer">
                  <Paperclip className="w-3.5 h-3.5" /> {a.filename}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Framework Form ───
function FrameworkForm({ framework, onSave, onCancel }) {
  const [deliberations, setDeliberations] = useState([])
  const [form, setForm] = useState({
    title: framework?.title || '',
    content: framework?.content || '',
    framework_type: framework?.frameworkType || 'charter',
    status: framework?.status || 'draft',
    version: framework?.version || 1,
    deliberation_id: framework?.deliberationId || '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiRequest('/api/v1/strategy/deliberations?status=decided').then(data => {
      if (data) setDeliberations(data.deliberations || [])
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, deliberation_id: form.deliberation_id || null }
    const url = framework?.id ? `/api/v1/strategy/frameworks/${framework.id}` : '/api/v1/strategy/frameworks'
    const method = framework?.id ? 'PATCH' : 'POST'
    const data = await apiRequest(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (data?.framework) onSave()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">{framework?.id ? 'Modifier le cadre' : 'Nouveau cadre de gouvernance'}</h2>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400"><X className="w-4 h-4" /></button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Titre *</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            placeholder="Titre du document de gouvernance" />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Contenu *</label>
          <SimpleEditor content={form.content} onUpdate={(html) => setForm(f => ({ ...f, content: html }))}
            placeholder="Rédigez le contenu du cadre de gouvernance..." minHeight="250px" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Type *</label>
            <select value={form.framework_type} onChange={e => setForm(f => ({ ...f, framework_type: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              {FRAMEWORK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Statut</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              <option value="draft">Brouillon</option>
              <option value="active">Actif</option>
              <option value="superseded">Remplacé</option>
              <option value="archived">Archivé</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Version</label>
            <input type="number" min="1" value={form.version} onChange={e => setForm(f => ({ ...f, version: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Issu de la délibération</label>
          <select value={form.deliberation_id} onChange={e => setForm(f => ({ ...f, deliberation_id: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="">Aucune</option>
            {deliberations.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">Annuler</button>
        <button type="submit" disabled={saving || !form.title || !form.content}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: ACCENT }}>
          {saving ? 'Enregistrement...' : (framework?.id ? 'Mettre à jour' : 'Créer')}
        </button>
      </div>
    </form>
  )
}

// ─── Axes List ───
function AxesList({ onNew }) {
  const [axes, setAxes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingAxis, setEditingAxis] = useState(null)
  const [krForm, setKrForm] = useState(null) // { axisId }
  const [editingKr, setEditingKr] = useState(null) // { id, currentValue }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const data = await apiRequest('/api/v1/strategy/axes')
    if (data) setAxes(data.axes || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreateAxis = async (formData) => {
    const url = editingAxis?.id ? `/api/v1/strategy/axes/${editingAxis.id}` : '/api/v1/strategy/axes'
    const method = editingAxis?.id ? 'PATCH' : 'POST'
    await apiRequest(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
    setShowForm(false)
    setEditingAxis(null)
    fetchData()
  }

  const handleDeleteAxis = async (id) => {
    if (!confirm('Supprimer cet axe et ses résultats clés ?')) return
    await apiRequest(`/api/v1/strategy/axes/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleAddKeyResult = async (axisId, formData) => {
    await apiRequest(`/api/v1/strategy/axes/${axisId}/key-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    setKrForm(null)
    fetchData()
  }

  const handleUpdateKrValue = async (krId, currentValue) => {
    await apiRequest(`/api/v1/strategy/key-results/${krId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_value: currentValue })
    })
    setEditingKr(null)
    fetchData()
  }

  const handleDeleteKr = async (krId) => {
    await apiRequest(`/api/v1/strategy/key-results/${krId}`, { method: 'DELETE' })
    fetchData()
  }

  if (showForm) {
    return (
      <AxisForm
        axis={editingAxis}
        onSave={handleCreateAxis}
        onCancel={() => { setShowForm(false); setEditingAxis(null) }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <button onClick={() => { setShowForm(true); setEditingAxis(null) }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: ACCENT }}>
          <Plus className="w-4 h-4" /> Nouvel axe
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-stone-400 text-sm">Chargement...</div>
      ) : axes.length === 0 ? (
        <div className="py-12 text-center text-stone-400 text-sm">
          <Target className="w-8 h-8 mx-auto mb-2 text-stone-300" />
          Aucun axe stratégique défini
        </div>
      ) : (
        <div className="space-y-3">
          {axes.map(axis => {
            const isExpanded = expandedId === axis.id
            return (
              <div key={axis.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : axis.id)}
                  className="w-full text-left p-4 hover:bg-stone-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-stone-900 truncate">{axis.title}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${AXIS_STATUS_COLORS[axis.status]}`}>
                          {AXIS_STATUS_LABELS[axis.status]}
                        </span>
                        {axis.targetYear && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">{axis.targetYear}</span>}
                      </div>
                      {axis.description && <p className="text-xs text-stone-500 truncate">{stripHtml(axis.description)}</p>}
                    </div>

                    {/* Progress circle */}
                    <div className="relative w-10 h-10 shrink-0">
                      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="#e7e5e4" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke={axis.color || ACCENT} strokeWidth="3"
                          strokeDasharray={`${axis.progress}, 100`} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-stone-700">{axis.progress}%</span>
                    </div>

                    <span className="text-[11px] text-stone-400 shrink-0">{axis.keyResultCount || 0} KR</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-stone-100">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-stone-400">Résultats clés</span>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setEditingAxis(axis); setShowForm(true) }}
                          className="text-xs text-stone-400 hover:text-stone-600 p-1"><Edit3 className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteAxis(axis.id) }}
                          className="text-xs text-stone-400 hover:text-red-600 p-1"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>

                    {(axis.keyResults || []).map(kr => (
                      <div key={kr.id} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${KR_STATUS_COLORS[kr.status]}`} title={KR_STATUS_LABELS[kr.status]} />
                        <span className="text-sm text-stone-700 flex-1 min-w-0 truncate">{kr.title}</span>

                        {/* Progress bar */}
                        <div className="w-24 shrink-0">
                          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${kr.targetValue ? Math.min(100, (kr.currentValue / kr.targetValue) * 100) : 0}%`,
                              backgroundColor: ACCENT
                            }} />
                          </div>
                        </div>

                        {/* Value */}
                        {editingKr?.id === kr.id ? (
                          <input type="number" autoFocus value={editingKr.currentValue}
                            onChange={e => setEditingKr(prev => ({ ...prev, currentValue: e.target.value }))}
                            onBlur={() => handleUpdateKrValue(kr.id, editingKr.currentValue)}
                            onKeyDown={e => { if (e.key === 'Enter') handleUpdateKrValue(kr.id, editingKr.currentValue) }}
                            className="w-14 px-1 py-0.5 text-xs text-center border border-blue-300 rounded" />
                        ) : (
                          <button onClick={() => setEditingKr({ id: kr.id, currentValue: kr.currentValue })}
                            className="text-xs text-stone-500 hover:text-blue-600 min-w-[3rem] text-right">
                            {kr.currentValue}/{kr.targetValue}
                          </button>
                        )}

                        <button onClick={() => handleDeleteKr(kr.id)} className="text-stone-300 hover:text-red-500 p-0.5">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Add key result */}
                    {krForm?.axisId === axis.id ? (
                      <KeyResultInlineForm
                        onSave={(data) => handleAddKeyResult(axis.id, data)}
                        onCancel={() => setKrForm(null)}
                      />
                    ) : (
                      <button onClick={() => setKrForm({ axisId: axis.id })}
                        className="flex items-center gap-1 text-xs mt-2 hover:opacity-80 transition-colors" style={{ color: ACCENT }}>
                        <Plus className="w-3 h-3" /> Ajouter un résultat clé
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Key Result Inline Form ───
function KeyResultInlineForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ title: '', metric_type: 'percentage', target_value: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title) return
    onSave({ ...form, target_value: parseFloat(form.target_value) || 100 })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-100">
      <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        placeholder="Titre du résultat clé" autoFocus
        className="flex-1 px-2 py-1 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/30" />
      <select value={form.metric_type} onChange={e => setForm(f => ({ ...f, metric_type: e.target.value }))}
        className="px-2 py-1 text-xs border border-stone-200 rounded-lg">
        <option value="percentage">%</option>
        <option value="number">#</option>
        <option value="boolean">✓/✗</option>
      </select>
      <input type="number" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))}
        placeholder="Cible" className="w-16 px-2 py-1 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/30" />
      <button type="submit" disabled={!form.title} className="text-xs px-2 py-1 rounded-lg text-white hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: ACCENT }}>OK</button>
      <button type="button" onClick={onCancel} className="text-stone-400 hover:text-stone-600"><X className="w-3 h-3" /></button>
    </form>
  )
}

// ─── Axis Form ───
function AxisForm({ axis, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: axis?.title || '',
    description: axis?.description || '',
    target_year: axis?.targetYear || new Date().getFullYear() + 3,
    status: axis?.status || 'active',
    color: axis?.color || ACCENT,
    progress: axis?.progress || 0,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">{axis?.id ? "Modifier l'axe" : 'Nouvel axe stratégique'}</h2>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400"><X className="w-4 h-4" /></button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Titre *</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            placeholder="Ex: Établir 10 Labs d'ici 2030" />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Description</label>
          <SimpleEditor
            content={form.description}
            onUpdate={(html) => setForm(f => ({ ...f, description: html }))}
            placeholder="Décrivez cet axe stratégique..."
            minHeight="120px"
            toolbar={['bold', 'italic', '|', 'bulletList', 'orderedList']}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Année cible</label>
            <input type="number" min="2024" max="2050" value={form.target_year} onChange={e => setForm(f => ({ ...f, target_year: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Statut</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              {Object.entries(AXIS_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Progression (%)</label>
            <input type="number" min="0" max="100" value={form.progress} onChange={e => setForm(f => ({ ...f, progress: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Couleur</label>
            <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              className="w-full h-[38px] px-1 py-1 border border-stone-200 rounded-lg cursor-pointer" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">Annuler</button>
        <button type="submit" disabled={!form.title}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: ACCENT }}>
          {axis?.id ? 'Mettre à jour' : 'Créer'}
        </button>
      </div>
    </form>
  )
}

// ─── Main Page ───
export default function StrategyIndex() {
  const [activeSection, setActiveSection] = useState('ressources')
  const [view, setView] = useState('list') // list, detail, form
  const [selectedId, setSelectedId] = useState(null)
  const [editingItem, setEditingItem] = useState(null)

  useShellNav({
    sections: [
      { id: 'ressources', label: 'Ressources' },
      { id: 'deliberations', label: 'Délibérations' },
      { id: 'cadres', label: 'Cadres' },
      { id: 'axes', label: 'Axes stratégiques' },
    ],
    activeSection,
    onSectionChange: (id) => {
      setActiveSection(id)
      setView('list')
      setSelectedId(null)
      setEditingItem(null)
    },
  })

  const handleSelect = (id) => { setSelectedId(id); setView('detail'); setEditingItem(null) }
  const handleBack = () => { setView('list'); setSelectedId(null); setEditingItem(null) }
  const handleNew = () => { setView('form'); setEditingItem(null); setSelectedId(null) }
  const handleEdit = (item) => { setEditingItem(item); setView('form'); setSelectedId(null) }
  const handleSaved = () => { setView('list'); setEditingItem(null); setSelectedId(null) }

  const sectionIcons = { ressources: BookOpen, deliberations: MessageCircle, cadres: FileText, axes: Target }
  const sectionTitles = { ressources: 'Ressources', deliberations: 'Délibérations', cadres: 'Cadres de gouvernance', axes: 'Axes stratégiques' }
  const sectionDescs = {
    ressources: 'Bibliothèque stratégique : rapports, articles, références et frameworks',
    deliberations: 'Discussions structurées avec propositions et consentement sociocratique',
    cadres: 'Chartes, protocoles, matrices de décision et définitions de rôles',
    axes: 'Objectifs stratégiques du réseau avec résultats clés',
  }

  const SectionIcon = sectionIcons[activeSection]

  return (
    <div className="px-6 py-5 max-w-4xl">
      <div className="mb-5">
        <div className="flex items-center gap-2.5 mb-1">
          <SectionIcon className="w-5 h-5" style={{ color: ACCENT }} />
          <h1 className="text-lg font-bold text-stone-900">{sectionTitles[activeSection]}</h1>
        </div>
        <p className="text-sm text-stone-500">{sectionDescs[activeSection]}</p>
      </div>

      {/* Ressources */}
      {activeSection === 'ressources' && (
        view === 'form' ? <ResourceForm resource={editingItem} onSave={handleSaved} onCancel={handleBack} /> :
        view === 'detail' ? <ResourceDetail resourceId={selectedId} onBack={handleBack} onEdit={handleEdit} /> :
        <ResourcesList onSelect={handleSelect} onNew={handleNew} />
      )}

      {/* Délibérations */}
      {activeSection === 'deliberations' && (
        view === 'form' ? <DeliberationForm deliberation={editingItem} onSave={handleSaved} onCancel={handleBack} /> :
        view === 'detail' ? <DeliberationDetail deliberationId={selectedId} onBack={handleBack} onEdit={handleEdit} /> :
        <DeliberationsList onSelect={handleSelect} onNew={handleNew} />
      )}

      {/* Cadres */}
      {activeSection === 'cadres' && (
        view === 'form' ? <FrameworkForm framework={editingItem} onSave={handleSaved} onCancel={handleBack} /> :
        view === 'detail' ? <FrameworkDetail frameworkId={selectedId} onBack={handleBack} onEdit={handleEdit} /> :
        <FrameworksList onSelect={handleSelect} onNew={handleNew} />
      )}

      {/* Axes */}
      {activeSection === 'axes' && (
        <AxesList onNew={handleNew} />
      )}
    </div>
  )
}
