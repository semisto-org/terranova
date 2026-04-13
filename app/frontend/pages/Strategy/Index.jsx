import React, { useState, useEffect, useCallback } from 'react'
import { usePage } from '@inertiajs/react'
import { useShellNav } from '../../components/shell/ShellContext'
import { useUrlState } from '@/hooks/useUrlState'
import { apiRequest } from '../../lib/api'
import {
  BookOpen, Plus, Search, Pin, Edit3, Trash2, ChevronLeft, X,
  MessageCircle, FileText, Target, ExternalLink, Paperclip,
  Send, Check, XCircle, PenLine, Clock, Vote, CheckCircle2, ChevronDown, ChevronRight
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
  { value: 'draft',           label: 'Brouillons' },
  { value: 'open',            label: 'Discussion' },
  { value: 'voting',          label: 'Vote en cours' },
  { value: 'outcome_pending', label: 'Décision à rédiger' },
  { value: 'decided',         label: 'Décidées' },
  { value: 'cancelled',       label: 'Annulées' },
]

const DELIB_STATUS_COLORS = {
  draft:           'bg-stone-100 text-stone-600',
  open:            'bg-blue-50 text-blue-700',
  voting:          'bg-amber-50 text-amber-700',
  outcome_pending: 'bg-purple-50 text-purple-700',
  decided:         'bg-green-50 text-green-700',
  cancelled:       'bg-stone-100 text-stone-500',
}

const DELIB_STATUS_LABELS = {
  draft:           'Brouillon',
  open:            'Discussion',
  voting:          'Vote en cours',
  outcome_pending: 'Décision à rédiger',
  decided:         'Décidée',
  cancelled:       'Annulée',
}

const DELIB_STATUS_ICONS = {
  draft:           { icon: FileText,       color: 'text-stone-400' },
  open:            { icon: MessageCircle,  color: 'text-blue-500' },
  voting:          { icon: Vote,           color: 'text-amber-500' },
  outcome_pending: { icon: PenLine,        color: 'text-purple-500' },
  decided:         { icon: CheckCircle2,   color: 'text-green-500' },
  cancelled:       { icon: XCircle,        color: 'text-stone-400' },
}

const PHASE_SECTION_LABELS = {
  draft:           'Commentaires pendant la préparation',
  open:            'Commentaires pendant la discussion',
  voting:          'Commentaires pendant le vote',
  outcome_pending: 'Commentaires pendant la rédaction de décision',
  decided:         'Commentaires après la décision',
  cancelled:       'Commentaires avant annulation',
}

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

function daysRemaining(deadlineIso) {
  if (!deadlineIso) return null
  const diffMs = new Date(deadlineIso).getTime() - Date.now()
  if (diffMs <= 0) return 0
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function phaseCountdownLabel(delib) {
  if (delib.status === 'open' && delib.openedAt) {
    const discussionEnd = new Date(delib.openedAt)
    discussionEnd.setDate(discussionEnd.getDate() + 15)
    const n = daysRemaining(discussionEnd.toISOString())
    if (n === null) return null
    if (n === 0) return 'Dernier jour pour discuter cette proposition'
    return `Il reste ${n} jour${n > 1 ? 's' : ''} pour discuter cette proposition`
  }
  if (delib.status === 'voting' && delib.votingDeadline) {
    const n = daysRemaining(delib.votingDeadline)
    if (n === null) return null
    if (n === 0) return 'Dernier jour pour voter'
    return `Il reste ${n} jour${n > 1 ? 's' : ''} pour voter`
  }
  return null
}

const KR_STATUS_COLORS = { on_track: 'bg-green-500', at_risk: 'bg-amber-500', behind: 'bg-red-500', achieved: 'bg-blue-500' }
const KR_STATUS_LABELS = { on_track: 'En bonne voie', at_risk: 'À risque', behind: 'En retard', achieved: 'Atteint' }

const REACTION_CONFIG = [
  { position: 'consent',   label: 'Consentement', icon: Check,   color: 'text-green-600 hover:bg-green-50' },
  { position: 'objection', label: 'Objection',    icon: XCircle, color: 'text-red-600 hover:bg-red-50' },
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
            className="prose prose-stone prose-sm max-w-none text-sm text-stone-700 leading-relaxed"
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
function DeliberationsList({ onSelect, onNew, authMemberId }) {
  const [deliberations, setDeliberations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('open')

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

  const myDrafts = deliberations.filter(d => d.status === 'draft' && String(d.createdById) === String(authMemberId))
  const otherDelibs = deliberations.filter(d => !(d.status === 'draft' && String(d.createdById) === String(authMemberId)))

  const renderCard = (d) => {
    const countdown = phaseCountdownLabel(d)
    return (
      <button
        key={d.id}
        onClick={() => onSelect(d.id)}
        className={`text-left rounded-xl p-4 hover:shadow-sm transition-all cursor-pointer ${d.status === 'decided' ? 'bg-green-50 border border-green-300 hover:border-green-400' : 'bg-white border border-stone-200 hover:border-blue-300'}`}
      >
        <div className="flex items-start gap-3">
          {(() => {
            const si = DELIB_STATUS_ICONS[d.status]
            const StatusIcon = si?.icon
            return StatusIcon ? <StatusIcon className={`w-5 h-5 mt-0.5 shrink-0 ${si.color}`} /> : null
          })()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-stone-900 truncate">{d.title}</h3>
              <span className="text-[10px] text-stone-400 shrink-0">
                {new Date(d.openedAt || d.createdAt).toLocaleDateString('fr-BE')}
              </span>
            </div>
            {d.status !== 'draft' && (
              <div className="flex items-center gap-3 text-[11px] text-stone-400 flex-wrap">
                {d.reactionsSummary && d.status !== 'open' && (
                  <>
                    <span className="text-green-600">v {d.reactionsSummary.consent}</span>
                    <span className="text-red-600">x {d.reactionsSummary.objection}</span>
                  </>
                )}
                <span>{d.commentCount} commentaire{d.commentCount !== 1 ? 's' : ''}</span>
                {countdown && <span className="text-amber-600 font-medium">{countdown}</span>}
              </div>
            )}
          </div>
        </div>
        {d.creatorName && (
          <div className="flex items-center gap-1.5 mt-2.5 ml-8 text-xs text-stone-500">
            <span>Sujet amené par</span>
            {d.creatorAvatar ? (
              <img src={d.creatorAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-stone-300 flex items-center justify-center text-[8px] text-white font-medium">{d.creatorName.charAt(0)}</span>
            )}
            <span className="font-medium text-stone-600">{d.creatorName}</span>
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input type="text" placeholder="Rechercher une delibération..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
        </div>
        <button onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: ACCENT }}>
          <Plus className="w-4 h-4" /> Nouvelle delibération
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
          Aucune delibération trouvée
        </div>
      ) : (
        <div className="space-y-4">
          {myDrafts.length > 0 && (
            <div className="space-y-2">
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                Ces brouillons de délibérations, en cours de préparation, sont visibles uniquement par toi.
              </div>
              <div className="grid gap-3">{myDrafts.map(renderCard)}</div>
            </div>
          )}
          {otherDelibs.length > 0 && (
            <div className="grid gap-3">{otherDelibs.map(renderCard)}</div>
          )}
        </div>
      )}
    </div>
  )
}

const PHASES = [
  { id: 'draft',           label: 'Brouillon' },
  { id: 'open',            label: 'Discussion' },
  { id: 'voting',          label: 'Vote' },
  { id: 'outcome_pending', label: 'Décision' },
]

function PhaseBar({ delib, authMemberId, onPublish }) {
  const currentIdx = PHASES.findIndex(p => p.id === delib.status)
  const countdown = phaseCountdownLabel(delib)
  const isTerminal = delib.status === 'decided' || delib.status === 'cancelled'
  const showDraftPublish =
    delib.status === 'draft' &&
    authMemberId != null &&
    String(delib.createdById) === String(authMemberId)

  const visiblePhases = delib.status === 'draft' ? PHASES : PHASES.filter(p => p.id !== 'draft')

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-2">
          {visiblePhases.map((phase, idx) => {
            const phaseIdx = PHASES.findIndex(p => p.id === phase.id)
            const reached = currentIdx >= phaseIdx && !isTerminal
            const active = currentIdx === phaseIdx && !isTerminal
            const pillClass = active
              ? 'bg-blue-100 text-blue-800 border border-blue-400'
              : reached
                ? 'bg-stone-100 text-stone-700'
                : 'bg-stone-50 text-stone-400'
            return (
              <React.Fragment key={phase.id}>
                <div className={`flex-1 text-center py-2 rounded-lg text-xs font-medium transition-colors ${pillClass}`}>
                  {phase.label}
                </div>
                {idx < visiblePhases.length - 1 && <span className="text-stone-300 shrink-0" aria-hidden>→</span>}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {countdown && !isTerminal && (
        <div className="flex border-t border-blue-200/80 bg-blue-50/50">
          <div className="w-1 shrink-0 bg-blue-500" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500 shrink-0" />
              <p className="text-sm font-medium text-blue-900">{countdown}</p>
            </div>
            {delib.status === 'open' && (
              <p className="text-xs text-blue-800/70 leading-relaxed">
                Lorsqu'une proposition est publiée par son/sa porteur·se, elle peut être discutée pendant 15 jours. Durant cette période, le/la porteur·se met à jour la proposition sur base des nouvelles informations, des remarques ou des idées partagées dans les commentaires.
              </p>
            )}
            {delib.status === 'voting' && (
              <p className="text-xs text-blue-800/70 leading-relaxed">
                Après une période de discussion de 15 jours permettant au/à la porteur·se d'amender sa proposition, la phase de vote permet aux membres de marquer leur consentement avec la proposition ou de poser une objection motivée. Lorsqu'une objection est posée, la durée de vote est prolongée de 7 jours.
              </p>
            )}
          </div>
        </div>
      )}

      {delib.status === 'decided' && (
        <div className="flex border-t border-green-200/80 bg-green-50/60">
          <div className="w-1 shrink-0 bg-green-500" aria-hidden />
          <div className="flex items-center gap-2 px-4 py-3">
            <Check className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-900">Délibération décidée</p>
          </div>
        </div>
      )}

      {delib.status === 'cancelled' && (
        <div className="flex border-t border-stone-200/80 bg-stone-50/80">
          <div className="w-1 shrink-0 bg-stone-400" aria-hidden />
          <div className="flex items-center gap-2 px-4 py-3">
            <XCircle className="w-4 h-4 text-stone-400 shrink-0" />
            <p className="text-sm font-medium text-stone-500">Délibération annulée</p>
          </div>
        </div>
      )}

      {showDraftPublish && typeof onPublish === 'function' && (
        <div className="flex border-t border-amber-200/80 bg-amber-50/55">
          <div className="w-1 shrink-0 bg-amber-400" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-amber-950">Brouillon - visible uniquement par toi.</p>
              {!delib.proposals?.length && (
                <p className="mt-1 text-xs text-amber-800/85">Rédige une proposition pour pouvoir publier. Tu pourras amender ta proposition pendant toute la durée de la discussion.</p>
              )}
            </div>
            <button
              type="button"
              onClick={onPublish}
              disabled={!delib.proposals?.length}
              className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
              style={{ backgroundColor: ACCENT }}
            >
              Publier la délibération
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Deliberation Detail ───
function DeliberationDetail({ deliberationId, onBack, onEdit, authMemberId }) {
  const [delib, setDelib] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [newProposal, setNewProposal] = useState('')
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [showDecideForm, setShowDecideForm] = useState(false)
  const [outcomeText, setOutcomeText] = useState('')
  const [reactionForm, setReactionForm] = useState(null) // { proposalId, position }
  const [showVersionsFor, setShowVersionsFor] = useState(null)
  const [editingProposalId, setEditingProposalId] = useState(null)
  const [editingProposalContent, setEditingProposalContent] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const load = useCallback(async ({ preserveScroll = false } = {}) => {
    const scrollY = preserveScroll ? window.scrollY : null
    setLoading(prev => preserveScroll ? prev : true)
    const data = await apiRequest(`/api/v1/strategy/deliberations/${deliberationId}`)
    if (data) setDelib(data.deliberation)
    if (!preserveScroll) setLoading(false)
    if (scrollY != null) requestAnimationFrame(() => window.scrollTo(0, scrollY))
  }, [deliberationId])

  useEffect(() => { load() }, [load])

  const handleDeleteConfirm = async () => {
    setConfirmingDelete(false)
    await apiRequest(`/api/v1/strategy/deliberations/${deliberationId}`, { method: 'DELETE' })
    onBack()
  }

  const handleCancelConfirm = async () => {
    setConfirmingCancel(false)
    await apiRequest(`/api/v1/strategy/deliberations/${deliberationId}/cancel`, { method: 'PATCH' })
    load()
  }

  const handlePublish = async () => {
    if (!confirm('Publier cette délibération ? Elle deviendra visible par tous les membres effectifs et le compteur de discussion démarrera.')) return
    await apiRequest(`/api/v1/strategy/deliberations/${deliberationId}/publish`, { method: 'PATCH' })
    load()
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
    load({ preserveScroll: true })
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

  const handleAmendProposal = async (e) => {
    e.preventDefault()
    if (!editingProposalContent.trim()) return
    await apiRequest(`/api/v1/strategy/proposals/${editingProposalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editingProposalContent })
    })
    setEditingProposalId(null)
    setEditingProposalContent('')
    load()
  }

  if (loading) return <div className="py-12 text-center text-stone-400 text-sm">Chargement...</div>
  if (!delib) return <div className="py-12 text-center text-stone-400 text-sm">Délibération introuvable</div>

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Retour
      </button>
      <PhaseBar delib={delib} authMemberId={authMemberId} onPublish={handlePublish} />

      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${DELIB_STATUS_COLORS[delib.status]}`}>
                {DELIB_STATUS_LABELS[delib.status]}
              </span>
            </div>
            <h1 className="text-xl font-bold text-stone-900">{delib.title}</h1>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {delib.status === 'draft' && String(delib.createdById) === String(authMemberId) && (
              <button onClick={() => onEdit(delib)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors" title="Modifier">
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {delib.status === 'draft' && String(delib.createdById) === String(authMemberId) && (
              <button onClick={() => setConfirmingDelete(true)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-red-600 transition-colors" title="Supprimer le brouillon">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {delib.status !== 'draft' && delib.status !== 'decided' && delib.status !== 'cancelled' && String(delib.createdById) === String(authMemberId) && (
              <button onClick={() => setConfirmingCancel(true)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-red-600 transition-colors" title="Annuler la délibération">
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-stone-500 mb-4 pb-4 border-b border-stone-100">
          {delib.creatorName && (
            <span className="flex items-center gap-2">
              {delib.creatorAvatar ? (
                <img src={delib.creatorAvatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-stone-300 flex items-center justify-center text-[10px] text-white font-medium shrink-0">{delib.creatorName.charAt(0)}</span>
              )}
              <span>Par {delib.creatorName}</span>
            </span>
          )}
          <span>{new Date(delib.createdAt).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>

        {delib.context && delib.context.replace(/<[^>]*>/g, '').trim() ? (
          <div>
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Contexte</h3>
            <div className="prose prose-stone prose-sm max-w-none text-sm text-stone-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: delib.context }} />
          </div>
        ) : delib.status === 'draft' && String(delib.createdById) === String(authMemberId) && (
          <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50/50 px-4 py-3">
            <p className="text-xs text-stone-400">Aucun contexte renseigné. <button type="button" onClick={() => onEdit(delib)} className="text-blue-600 hover:underline">Modifie la délibération</button> pour ajouter du contexte et aider les membres à comprendre le sujet.</p>
          </div>
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
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            {(delib.proposals?.length || 0) <= 1
              ? 'Proposition'
              : `Propositions (${delib.proposals.length})`}
          </h3>
        </div>

        {delib.status === 'draft' && String(delib.createdById) === String(authMemberId) && !delib.proposals?.length && !showProposalForm && (
          <div className="flex flex-col items-center py-6">
            <button onClick={() => setShowProposalForm(true)}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90"
              style={{ backgroundColor: ACCENT }}>
              <PenLine className="w-4 h-4" /> Rédiger ma proposition
            </button>
            <p className="mt-4 max-w-lg text-center text-sm leading-relaxed text-stone-500">
              Le processus de consentement vise à déterminer si une proposition est sans danger et non si elle est parfaite. La proposition est adoptée pour autant qu'aucune objection valable n'est soulevée. En cas d'objection, notre collectif s'efforce de la résoudre. Et comme les membres peuvent modifier leur vote au fur et à mesure de l'évolution de la proposition, les objections deviennent un outil d'amélioration plutôt qu'un obstacle.
            </p>
          </div>
        )}

        {(delib.proposals || []).map(p => (
          <div key={p.id} className="mb-4 pb-4 border-b border-stone-100 last:border-0 last:mb-0 last:pb-0">
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-stone-400">
                  Dernière mise à jour le {new Date(p.lastVersionAt || p.updatedAt || p.createdAt).toLocaleString('fr-BE', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="prose prose-stone prose-sm max-w-none text-sm text-stone-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: p.content }} />
              <div className="flex items-center gap-3 mt-2">
                  {(delib.status === 'draft' || delib.status === 'open') && String(delib.createdById) === String(authMemberId) && (
                    <button
                      type="button"
                      onClick={() => { setEditingProposalId(p.id); setEditingProposalContent(p.content) }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-950 shadow-sm transition-colors hover:bg-amber-100"
                    >
                      <Edit3 className="h-3.5 w-3.5 shrink-0" />
                      Amender ma proposition
                    </button>
                  )}
                  {p.versionsCount > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowVersionsFor(p.id) }}
                      className="text-[11px] text-blue-600 hover:underline"
                    >
                      Voir l'historique ({p.versionsCount} {p.versionsCount === 1 ? 'version' : 'versions'})
                    </button>
                  )}
                </div>
            </div>

            {/* Reactions display */}
            {(() => {
              const reactions = p.reactions || []
              const consents = reactions.filter(r => r.position === 'consent')
              const objections = reactions.filter(r => r.position === 'objection')
              if (!consents.length && !objections.length) return null
              return (
                <div className="mt-4 rounded-lg border border-stone-100 overflow-hidden">
                  {consents.length > 0 && (
                    <div className="px-4 py-3 bg-green-50/40">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-semibold text-green-800 uppercase tracking-wider">
                          {consents.length} consentement{consents.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {consents.map(r => (
                          <div key={r.id} className="flex items-start gap-2">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-green-100/80 border border-green-200/60 px-2.5 py-1 shrink-0">
                              {r.memberAvatar ? (
                                <img src={r.memberAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                              ) : (
                                <span className="w-4 h-4 rounded-full bg-green-300 flex items-center justify-center text-[8px] text-white font-bold">{r.memberName?.[0]}</span>
                              )}
                              <span className="text-xs font-medium text-green-800">{r.memberName}</span>
                            </div>
                            {r.rationale && (
                              <span className="text-sm text-green-900/70 pt-0.5">{r.rationale}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {objections.length > 0 && (
                    <div className={`px-4 py-3 bg-red-50/40 ${consents.length > 0 ? 'border-t border-stone-100' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-semibold text-red-800 uppercase tracking-wider">
                          {objections.length} objection{objections.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {objections.map(r => (
                          <div key={r.id} className="rounded-lg bg-red-100/50 border border-red-200/40 px-3 py-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              {r.memberAvatar ? (
                                <img src={r.memberAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                              ) : (
                                <span className="w-4 h-4 rounded-full bg-red-300 flex items-center justify-center text-[8px] text-white font-bold">{r.memberName?.[0]}</span>
                              )}
                              <span className="text-xs font-semibold text-red-800">{r.memberName}</span>
                            </div>
                            {r.rationale && (
                              <p className="text-sm text-red-900/80 leading-relaxed pl-5.5">{r.rationale}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Reaction buttons — voting phase only */}
            {delib.status === 'voting' && (
              <div>
                {reactionForm?.proposalId === p.id ? (
                  <ReactionFormInline
                    position={reactionForm.position}
                    requireRationale={reactionForm.position === 'objection'}
                    onSubmit={(rationale) => handleReaction(p.id, reactionForm.position, rationale)}
                    onCancel={() => setReactionForm(null)}
                  />
                ) : (
                  <div className="flex gap-3">
                    {REACTION_CONFIG.map(rc => {
                      const isConsent = rc.position === 'consent'
                      return (
                        <button key={rc.position} onClick={() => setReactionForm({ proposalId: p.id, position: rc.position })}
                          className={`flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg border-2 transition-all ${
                            isConsent
                              ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400'
                              : 'border-red-200 bg-red-50/50 text-red-600 hover:bg-red-100 hover:border-red-300'
                          }`}>
                          <rc.icon className="w-4 h-4" /> {rc.label}
                        </button>
                      )
                    })}
                  </div>
                )}
                {reactionForm?.proposalId === p.id && reactionForm.position === 'objection' && (
                  <p className="text-[10px] text-red-600 mt-1">
                    Poser une objection rallonge la phase de vote de 7 jours.
                  </p>
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

      {/* Decide button — outcome_pending phase, author only */}
      {delib.status === 'outcome_pending' && String(delib.createdById) === String(authMemberId) && (
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
              <Check className="w-4 h-4" /> Rédiger la décision
            </button>
          )}
        </div>
      )}

      {/* Comments grouped by phase */}
      {delib.status !== 'draft' && <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-stone-100">
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            {(delib.commentCount || 0) === 0
              ? 'Discussion'
              : `Discussion (${delib.commentCount})`}
          </h3>
        </div>

        <div className="px-5 py-4">
          {(() => {
            const byPhase = delib.commentsByPhase || {}
            const phases = ['draft', 'open', 'voting', 'outcome_pending', 'decided', 'cancelled']
            const hasAny = phases.some(p => (byPhase[p] || []).length > 0)
            if (!hasAny) {
              return <p className="text-sm text-stone-400 py-3">Aucun commentaire pour le moment.</p>
            }
            return phases.map(phase => {
              const phaseComments = byPhase[phase] || []
              if (!phaseComments.length) return null
              return (
                <div key={phase} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-stone-500">
                      {PHASE_SECTION_LABELS[phase]}
                    </span>
                    <div className="h-px flex-1 bg-stone-100" />
                  </div>
                  <div className="space-y-2.5">
                    {phaseComments.map(c => (
                      <div key={c.id} className="flex gap-3 group">
                        <div className="w-7 h-7 mt-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold flex items-center justify-center shrink-0 ring-2 ring-white">
                          {c.authorAvatar ? <img src={c.authorAvatar} className="w-7 h-7 rounded-full object-cover" alt="" /> : c.authorName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0 rounded-lg bg-stone-50 px-3.5 py-2.5">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-stone-800">{c.authorName}</span>
                            <span className="text-[10px] text-stone-400">
                              {new Date(c.createdAt).toLocaleString('fr-BE', {
                                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-stone-700 leading-relaxed">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          })()}
        </div>

        {delib.status !== 'cancelled' && delib.status !== 'decided' && (
          <form onSubmit={handleAddComment} className="flex items-end gap-2 border-t border-stone-100 px-5 py-3 bg-stone-50/50">
            <textarea
              rows={2}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Commente la proposition..."
              className="flex-1 resize-none rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="shrink-0 rounded-lg p-2 text-white disabled:opacity-40 transition-colors hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>}

      {showVersionsFor && (
        <ProposalVersionsPanel proposalId={showVersionsFor} onClose={() => setShowVersionsFor(null)} />
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-50">
          <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-stone-900 mb-2">Supprimer ce brouillon ?</h2>
            <p className="text-sm text-stone-500 mb-5">Cette action est définitive. La délibération et son contenu seront supprimés.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmingDelete(false)}
                className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">Annuler</button>
              <button type="button" onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {confirmingCancel && (
        <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-stone-900 mb-2">Annuler cette délibération ?</h2>
            <p className="text-sm text-stone-500 mb-5">
              Cette action est irréversible. La délibération sera définitivement clôturée : les votes déjà exprimés, les commentaires et la proposition resteront visibles mais ne pourront plus être modifiés. Aucune décision ne sera prise.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmingCancel(false)}
                className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">Revenir</button>
              <button type="button" onClick={handleCancelConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Annuler la délibération</button>
            </div>
          </div>
        </div>
      )}

      {editingProposalId && (
        <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-50">
          <div className="w-full max-w-xl bg-white rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-stone-900 mb-3">Amender ma proposition</h2>
            <form onSubmit={handleAmendProposal}>
              <SimpleEditor
                content={editingProposalContent}
                onUpdate={setEditingProposalContent}
                placeholder="Nouvelle version de la proposition..."
                minHeight="200px"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button type="button" onClick={() => { setEditingProposalId(null); setEditingProposalContent('') }}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg">Annuler</button>
                <button type="submit" disabled={!editingProposalContent.trim()}
                  className="px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50 hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}>Enregistrer la nouvelle version</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Reaction Form Inline ───
function ReactionFormInline({ position, requireRationale, onSubmit, onCancel }) {
  const [rationale, setRationale] = useState('')
  const config = REACTION_CONFIG.find(r => r.position === position)
  const canSubmit = requireRationale ? rationale.trim().length > 0 : true

  return (
    <div className="flex items-center gap-2.5 mt-2">
      <span className={`text-sm font-medium ${config.color.split(' ')[0]}`}>{config.label} :</span>
      <input type="text" value={rationale} onChange={e => setRationale(e.target.value)}
        placeholder={requireRationale ? 'Argumentaire obligatoire' : 'Argumentaire (optionnel)...'}
        className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        onKeyDown={e => { if (e.key === 'Enter' && canSubmit) { e.preventDefault(); onSubmit(rationale) } }} />
      <button onClick={() => canSubmit && onSubmit(rationale)} disabled={!canSubmit}
        className="text-sm font-medium px-4 py-2 rounded-lg text-white hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: ACCENT }}>
        OK
      </button>
      <button onClick={onCancel} className="text-stone-400 hover:text-stone-600 p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

function ProposalVersionsPanel({ proposalId, onClose }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await apiRequest(`/api/v1/strategy/proposals/${proposalId}/versions`)
      if (data) setVersions(data.versions || [])
      setLoading(false)
    }
    load()
  }, [proposalId])

  return (
    <div className="fixed inset-0 bg-stone-900/40 flex items-start justify-end z-50" onClick={onClose}>
      <div className="w-full max-w-lg h-full bg-white border-l border-stone-200 overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-stone-200 px-5 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-900">Historique des versions</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-stone-100"><X className="w-4 h-4 text-stone-500" /></button>
        </div>
        <div className="px-5 py-4 space-y-5">
          {loading && <p className="text-sm text-stone-400">Chargement...</p>}
          {!loading && versions.length === 0 && <p className="text-sm text-stone-400">Aucune version.</p>}
          {!loading && versions.map(v => (
            <div key={v.id} className="border border-stone-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-700">v{v.version}</span>
                <span className="text-[10px] text-stone-400">
                  {new Date(v.createdAt).toLocaleString('fr-BE', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <div
                className="prose prose-stone prose-sm max-w-none text-sm text-stone-700"
                dangerouslySetInnerHTML={{ __html: v.content }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Deliberation Form ───
function DeliberationForm({ deliberation, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: deliberation?.title || '',
    context: deliberation?.context || '',
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
    if (data?.deliberation) onSave(data.deliberation)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-stone-900">
        {deliberation?.id ? 'Modifier la délibération' : 'Nouvelle délibération'}
      </h2>

      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Sujet *</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            placeholder="Sujet de la délibération" />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Contexte</label>
          <SimpleEditor content={form.context} onUpdate={(html) => setForm(f => ({ ...f, context: html }))}
            placeholder="Pourquoi cette délibération est-elle nécessaire ?" minHeight="150px" />
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

        <div className="prose prose-stone prose-sm max-w-none text-sm text-stone-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: framework.content }} />

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
  const { auth } = usePage().props
  const authMemberId = auth?.member?.id
  const [activeSection, setActiveSection] = useUrlState('tab', 'ressources')
  const [selectedIdStr, setSelectedIdUrl] = useUrlState('id', '')
  const selectedId = selectedIdStr || null
  const [editingItem, setEditingItem] = useState(null)
  const view = editingItem ? 'form' : selectedId ? 'detail' : 'list'

  const setSelectedId = useCallback((id) => {
    setSelectedIdUrl(id != null ? String(id) : '')
  }, [setSelectedIdUrl])

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
      setSelectedId(null)
      setEditingItem(null)
    },
  })

  const handleSelect = (id) => { setSelectedId(id); setEditingItem(null) }
  const handleBack = () => { setSelectedId(null); setEditingItem(null) }
  const handleNew = () => { setEditingItem({}); setSelectedId(null) }
  const handleEdit = (item) => { setEditingItem(item); setSelectedId(null) }
  const handleSaved = () => { setEditingItem(null); setSelectedId(null) }

  const handleDeliberationSaved = (saved) => {
    const id = saved?.id
    if (id != null) {
      setSelectedId(id)
      setEditingItem(null)
    } else {
      handleSaved()
    }
  }

  const handleDeliberationCancel = () => {
    const id = editingItem?.id
    if (id != null) {
      setSelectedId(id)
      setEditingItem(null)
    } else {
      handleBack()
    }
  }

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
        view === 'form' ? <DeliberationForm deliberation={editingItem} onSave={handleDeliberationSaved} onCancel={handleDeliberationCancel} /> :
        view === 'detail' ? <DeliberationDetail deliberationId={selectedId} onBack={handleBack} onEdit={handleEdit} authMemberId={authMemberId} /> :
        <DeliberationsList onSelect={handleSelect} onNew={handleNew} authMemberId={authMemberId} />
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
