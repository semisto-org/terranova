import React, { useState, useEffect, useCallback } from 'react'
import { useUrlState } from '@/hooks/useUrlState'
import { apiRequest } from '../../lib/api'
import { Plus, FileText, ChevronLeft, Edit3, Trash2, Paperclip, X } from 'lucide-react'
import SimpleEditor from '../../components/SimpleEditor'

const ACCENT = '#2563EB'

const FRAMEWORK_TYPES = [
  { value: 'charter', label: 'Charte' },
  { value: 'protocol', label: 'Protocole' },
  { value: 'decision_matrix', label: 'Matrice de décision' },
  { value: 'role_definition', label: 'Définition de rôle' },
]

const FRAMEWORK_TYPE_LABELS = { charter: 'Charte', protocol: 'Protocole', decision_matrix: 'Matrice de décision', role_definition: 'Définition de rôle' }
const FRAMEWORK_STATUS_LABELS = { draft: 'Brouillon', active: 'Actif', superseded: 'Remplacé', archived: 'Archivé' }
const FRAMEWORK_STATUS_COLORS = { draft: 'bg-stone-100 text-stone-600', active: 'bg-green-50 text-green-700', superseded: 'bg-amber-50 text-amber-700', archived: 'bg-stone-100 text-stone-500' }

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

// ─── Section wrapper ───
export default function FrameworksSection() {
  const [selectedIdStr, setSelectedIdUrl] = useUrlState('cadreId', '')
  const selectedId = selectedIdStr || null
  const [editingItem, setEditingItem] = useState(null)
  const view = editingItem ? 'form' : selectedId ? 'detail' : 'list'

  const setSelectedId = useCallback((id) => setSelectedIdUrl(id != null ? String(id) : ''), [setSelectedIdUrl])
  const handleSelect = (id) => { setSelectedId(id); setEditingItem(null) }
  const handleBack = () => { setSelectedId(null); setEditingItem(null) }
  const handleNew = () => { setEditingItem({}); setSelectedId(null) }
  const handleEdit = (item) => { setEditingItem(item); setSelectedId(null) }
  const handleSaved = () => { setEditingItem(null); setSelectedId(null) }

  return (
    <div className="px-6 py-5 max-w-4xl">
      <div className="mb-5">
        <div className="flex items-center gap-2.5 mb-1">
          <FileText className="w-5 h-5" style={{ color: ACCENT }} />
          <h1 className="text-lg font-bold text-stone-900">Cadres de gouvernance</h1>
        </div>
        <p className="text-sm text-stone-500">Chartes, protocoles, matrices de décision et définitions de rôles</p>
      </div>
      {view === 'form' ? (
        <FrameworkForm framework={editingItem} onSave={handleSaved} onCancel={handleBack} />
      ) : view === 'detail' ? (
        <FrameworkDetail frameworkId={selectedId} onBack={handleBack} onEdit={handleEdit} />
      ) : (
        <FrameworksList onSelect={handleSelect} onNew={handleNew} />
      )}
    </div>
  )
}
