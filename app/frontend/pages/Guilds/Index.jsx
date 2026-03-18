import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest, getCsrfToken } from '@/lib/api'
import { useShellNav } from '../../components/shell/ShellContext'
import { useUrlState } from '@/hooks/useUrlState'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'
import {
  Users, Plus, FileText, ListChecks, BookOpen, KeyRound,
  ChevronLeft, Upload, X, Eye, EyeOff, Trash2, Pencil,
  Check, Circle, Globe, Building2, Search, Tag
} from 'lucide-react'

const ACCENT = '#5B5781'
const ACCENT_BG = '#c8bfd2'

const GUILD_SECTIONS = [
  { id: 'network', label: 'Guildes Réseau' },
  { id: 'lab', label: 'Guildes Lab' },
]

const GUILD_TABS = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'tasks', label: 'Tâches', icon: ListChecks },
  { id: 'wiki', label: 'Wiki', icon: BookOpen },
  { id: 'credentials', label: 'Credentials', icon: KeyRound },
]

const COLOR_MAP = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  green: '#22c55e',
  orange: '#f97316',
  red: '#ef4444',
}

// ---------------------------------------------------------------------------
// Shared Modal
// ---------------------------------------------------------------------------
function FormModal({ title, children, onSubmit, onClose, busy }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.42)' }} onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-xl border border-stone-200 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="flex flex-col min-h-0 h-full">
          <div className="shrink-0 px-4 pt-4 pb-3 border-b border-stone-200">
            <h2 className="text-xl font-bold text-stone-900 m-0">{title}</h2>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-3">
            {children}
          </div>
          <div className="shrink-0 px-4 py-3 border-t border-stone-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm border border-stone-300 rounded-lg bg-white text-stone-700 font-medium">Annuler</button>
            <button type="submit" className="px-3 py-1.5 text-sm border rounded-lg font-semibold text-white disabled:opacity-60" style={{ backgroundColor: ACCENT, borderColor: ACCENT }} disabled={busy}>
              {busy ? 'En cours…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return <label className="block space-y-1"><span className="text-sm font-semibold text-stone-700">{label}</span>{children}</label>
}

const inputCls = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-stone-900'

// ---------------------------------------------------------------------------
// Documents Tab
// ---------------------------------------------------------------------------
function DocumentsTab({ guild, onRefresh }) {
  const [uploading, setUploading] = useState(false)
  const [tagFilter, setTagFilter] = useState(null)
  const docs = guild.documents || []

  const allTags = useMemo(() => {
    const tags = new Set()
    docs.forEach((d) => (d.tags || []).forEach((t) => tags.add(t)))
    return [...tags].sort()
  }, [docs])

  const filtered = tagFilter ? docs.filter((d) => (d.tags || []).includes(tagFilter)) : docs

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', file.name)
      await apiRequest(`/api/v1/guilds/${guild.id}/documents`, { method: 'POST', body: fd, headers: { 'X-CSRF-Token': getCsrfToken() } })
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(docId) {
    await apiRequest(`/api/v1/guilds/${guild.id}/documents/${docId}`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {allTags.map((t) => (
            <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)} className="px-2 py-0.5 rounded-full text-xs font-medium border transition-colors" style={tagFilter === t ? { backgroundColor: ACCENT, color: '#fff', borderColor: ACCENT } : { borderColor: '#d6d3d1', color: '#57534e' }}>
              <Tag className="inline w-3 h-3 mr-1" />{t}
            </button>
          ))}
        </div>
        <label className="px-3 py-1.5 text-sm rounded-lg font-semibold text-white cursor-pointer flex items-center gap-1.5" style={{ backgroundColor: ACCENT }}>
          <Upload className="w-4 h-4" />{uploading ? 'Envoi…' : 'Ajouter'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-stone-400 py-8 text-center">Aucun document</p>
      ) : (
        <div className="divide-y divide-stone-100">
          {filtered.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between py-2.5 group">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-stone-400 shrink-0" />
                <div className="min-w-0">
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-stone-800 hover:underline truncate block">{doc.name}</a>
                  <span className="text-xs text-stone-400">{doc.fileName} · {doc.byteSize ? `${(doc.byteSize / 1024).toFixed(0)} Ko` : ''}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(doc.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tasks Tab
// ---------------------------------------------------------------------------
function TasksTab({ guild, onRefresh }) {
  const [newListName, setNewListName] = useState('')
  const [addingToList, setAddingToList] = useState(null)
  const [newActionName, setNewActionName] = useState('')

  async function handleAddList() {
    if (!newListName.trim()) return
    await apiRequest(`/api/v1/guilds/${guild.id}/task-lists`, { method: 'POST', body: JSON.stringify({ name: newListName }) })
    setNewListName('')
    onRefresh()
  }

  async function handleAddAction(listId) {
    if (!newActionName.trim()) return
    await apiRequest(`/api/v1/guilds/${guild.id}/task-lists/${listId}/actions`, { method: 'POST', body: JSON.stringify({ name: newActionName, status: 'todo' }) })
    setNewActionName('')
    setAddingToList(null)
    onRefresh()
  }

  async function toggleAction(action) {
    const next = action.status === 'done' ? 'todo' : 'done'
    await apiRequest(`/api/v1/guilds/${guild.id}/actions/${action.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) })
    onRefresh()
  }

  async function deleteAction(actionId) {
    await apiRequest(`/api/v1/guilds/${guild.id}/actions/${actionId}`, { method: 'DELETE' })
    onRefresh()
  }

  async function deleteList(listId) {
    await apiRequest(`/api/v1/guilds/${guild.id}/task-lists/${listId}`, { method: 'DELETE' })
    onRefresh()
  }

  const lists = guild.taskLists || []

  return (
    <div className="space-y-4">
      {lists.map((list) => (
        <div key={list.id} className="border border-stone-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-stone-50 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-stone-700">{list.name}</h4>
            <div className="flex items-center gap-1">
              <button onClick={() => { setAddingToList(list.id); setNewActionName('') }} className="p-1 rounded hover:bg-stone-200 text-stone-500"><Plus className="w-3.5 h-3.5" /></button>
              <button onClick={() => deleteList(list.id)} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="divide-y divide-stone-100">
            {(list.actions || []).map((action) => (
              <div key={action.id} className="flex items-center gap-2 px-3 py-2 group">
                <button onClick={() => toggleAction(action)} className="shrink-0">
                  {action.status === 'done' ? <Check className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-stone-300" />}
                </button>
                <span className={`text-sm flex-1 ${action.status === 'done' ? 'line-through text-stone-400' : 'text-stone-700'}`}>{action.name}</span>
                {action.assigneeName && <span className="text-xs text-stone-400">{action.assigneeName}</span>}
                <button onClick={() => deleteAction(action.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
            {addingToList === list.id && (
              <form onSubmit={(e) => { e.preventDefault(); handleAddAction(list.id) }} className="flex items-center gap-2 px-3 py-2">
                <input value={newActionName} onChange={(e) => setNewActionName(e.target.value)} placeholder="Nouvelle tâche…" className="flex-1 text-sm border border-stone-200 rounded px-2 py-1" autoFocus />
                <button type="submit" className="text-xs font-medium px-2 py-1 rounded text-white" style={{ backgroundColor: ACCENT }}>Ajouter</button>
                <button type="button" onClick={() => setAddingToList(null)} className="text-xs text-stone-400">Annuler</button>
              </form>
            )}
          </div>
        </div>
      ))}
      <form onSubmit={(e) => { e.preventDefault(); handleAddList() }} className="flex items-center gap-2">
        <input value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="Nouvelle liste…" className="flex-1 text-sm border border-stone-200 rounded-lg px-3 py-2" />
        <button type="submit" className="px-3 py-1.5 text-sm rounded-lg font-semibold text-white" style={{ backgroundColor: ACCENT }}>
          <Plus className="w-4 h-4 inline mr-1" />Liste
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Wiki Tab
// ---------------------------------------------------------------------------
function WikiTab({ guild }) {
  const sections = guild.knowledgeSections || []
  return (
    <div className="space-y-3">
      {sections.length === 0 ? (
        <p className="text-sm text-stone-400 py-8 text-center">Aucune section wiki. Créez-en depuis la Knowledge Base.</p>
      ) : (
        sections.map((s) => (
          <div key={s.id} className="border border-stone-200 rounded-lg px-4 py-3">
            <h4 className="text-sm font-semibold text-stone-800">{s.name}</h4>
            {s.description && <p className="text-xs text-stone-500 mt-0.5">{s.description}</p>}
            <span className="text-xs text-stone-400 mt-1 block">{s.topicsCount} article{s.topicsCount !== 1 ? 's' : ''}</span>
          </div>
        ))
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Credentials Tab
// ---------------------------------------------------------------------------
function CredentialsTab({ guild, onRefresh }) {
  const [revealed, setRevealed] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ service_name: '', username: '', password: '', url: '', notes: '' })
  const [busy, setBusy] = useState(false)

  async function revealPassword(credId) {
    if (revealed[credId]) {
      setRevealed((r) => ({ ...r, [credId]: null }))
      return
    }
    const res = await apiRequest(`/api/v1/guilds/${guild.id}/credentials/${credId}/reveal`)
    setRevealed((r) => ({ ...r, [credId]: res.credential.password }))
  }

  async function handleSave() {
    setBusy(true)
    try {
      if (editId) {
        await apiRequest(`/api/v1/guilds/${guild.id}/credentials/${editId}`, { method: 'PATCH', body: JSON.stringify(form) })
      } else {
        await apiRequest(`/api/v1/guilds/${guild.id}/credentials`, { method: 'POST', body: JSON.stringify(form) })
      }
      setShowForm(false)
      setEditId(null)
      setForm({ service_name: '', username: '', password: '', url: '', notes: '' })
      onRefresh()
    } finally {
      setBusy(false)
    }
  }

  function startEdit(cred) {
    setEditId(cred.id)
    setForm({ service_name: cred.serviceName, username: cred.username || '', password: '', url: cred.url || '', notes: cred.notes || '' })
    setShowForm(true)
  }

  async function handleDelete(credId) {
    await apiRequest(`/api/v1/guilds/${guild.id}/credentials/${credId}`, { method: 'DELETE' })
    onRefresh()
  }

  const creds = guild.credentials || []

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ service_name: '', username: '', password: '', url: '', notes: '' }) }} className="px-3 py-1.5 text-sm rounded-lg font-semibold text-white flex items-center gap-1.5" style={{ backgroundColor: ACCENT }}>
          <Plus className="w-4 h-4" />Ajouter
        </button>
      </div>
      {creds.length === 0 ? (
        <p className="text-sm text-stone-400 py-8 text-center">Aucun credential enregistré</p>
      ) : (
        <div className="divide-y divide-stone-100">
          {creds.map((cred) => (
            <div key={cred.id} className="py-3 group">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-stone-800">{cred.serviceName}</h4>
                  {cred.url && <a href={cred.url} target="_blank" rel="noopener noreferrer" className="text-xs text-stone-400 hover:underline">{cred.url}</a>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(cred)} className="p-1 rounded hover:bg-stone-100 text-stone-400"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(cred.id)} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {cred.username && <div className="text-xs text-stone-600 mt-1"><span className="text-stone-400 mr-1">Utilisateur:</span>{cred.username}</div>}
              {cred.hasPassword && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-stone-400">Mot de passe:</span>
                  <span className="text-xs font-mono text-stone-600">{revealed[cred.id] || '••••••••'}</span>
                  <button onClick={() => revealPassword(cred.id)} className="p-0.5 rounded hover:bg-stone-100 text-stone-400">
                    {revealed[cred.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
              {cred.notes && <p className="text-xs text-stone-500 mt-1">{cred.notes}</p>}
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <FormModal title={editId ? 'Modifier le credential' : 'Nouveau credential'} onSubmit={handleSave} onClose={() => { setShowForm(false); setEditId(null) }} busy={busy}>
          <Field label="Service"><input className={inputCls} value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} required /></Field>
          <Field label="URL"><input className={inputCls} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></Field>
          <Field label="Nom d'utilisateur"><input className={inputCls} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
          <Field label="Mot de passe"><input className={inputCls} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editId ? 'Laisser vide pour ne pas changer' : ''} /></Field>
          <Field label="Notes"><textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </FormModal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Guild Detail View
// ---------------------------------------------------------------------------
function GuildDetail({ guild, onBack, onRefresh, members }) {
  const [activeTab, setActiveTab] = useState('documents')

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-4">
        <ChevronLeft className="w-4 h-4" />Retour aux guildes
      </button>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLOR_MAP[guild.color] || '#94a3b8' }} />
        <h2 className="text-2xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading, Sole Serif, serif)' }}>{guild.name}</h2>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: ACCENT_BG, color: ACCENT }}>
          {guild.guildType === 'network' ? 'Réseau' : 'Lab'}
        </span>
        <span className="text-xs text-stone-400 ml-auto">{guild.memberCount} membre{guild.memberCount !== 1 ? 's' : ''}</span>
      </div>
      {guild.description && <p className="text-sm text-stone-600 mb-6">{guild.description}</p>}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200 mb-4">
        {GUILD_TABS.map((t) => {
          const Icon = t.icon
          const active = activeTab === t.id
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${active ? 'border-current' : 'border-transparent text-stone-500 hover:text-stone-700'}`} style={active ? { color: ACCENT } : undefined}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'documents' && <DocumentsTab guild={guild} onRefresh={onRefresh} />}
      {activeTab === 'tasks' && <TasksTab guild={guild} onRefresh={onRefresh} />}
      {activeTab === 'wiki' && <WikiTab guild={guild} />}
      {activeTab === 'credentials' && <CredentialsTab guild={guild} onRefresh={onRefresh} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function GuildsIndex() {
  const [section, setSection] = useUrlState('tab', 'network')
  useShellNav({ sections: GUILD_SECTIONS, activeSection: section, onSectionChange: setSection })

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [guilds, setGuilds] = useState([])
  const [members, setMembers] = useState([])
  const [selectedGuildId, setSelectedGuildId] = useState(null)
  const [selectedGuild, setSelectedGuild] = useState(null)
  const [search, setSearch] = useState('')
  const [showGuildForm, setShowGuildForm] = useState(false)
  const [editGuild, setEditGuild] = useState(null)
  const [guildForm, setGuildForm] = useState({ name: '', description: '', color: 'blue', guild_type: 'network' })
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const loadGuilds = useCallback(async () => {
    const res = await apiRequest('/api/v1/guilds')
    setGuilds(res.guilds || [])
  }, [])

  const loadGuildDetail = useCallback(async (id) => {
    const res = await apiRequest(`/api/v1/guilds/${id}`)
    setSelectedGuild(res.guild)
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      loadGuilds(),
      apiRequest('/api/v1/lab/members').then((res) => setMembers(res.members || [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  // Filter guilds by section and search
  const filtered = useMemo(() => {
    return guilds
      .filter((g) => g.guildType === section)
      .filter((g) => !search || g.name.toLowerCase().includes(search.toLowerCase()))
  }, [guilds, section, search])

  function openGuild(guild) {
    setSelectedGuildId(guild.id)
    loadGuildDetail(guild.id)
  }

  function refreshGuildDetail() {
    if (selectedGuildId) loadGuildDetail(selectedGuildId)
  }

  function openCreateForm() {
    setEditGuild(null)
    setGuildForm({ name: '', description: '', color: 'blue', guild_type: section })
    setShowGuildForm(true)
  }

  function openEditForm(guild) {
    setEditGuild(guild)
    setGuildForm({ name: guild.name, description: guild.description || '', color: guild.color, guild_type: guild.guildType })
    setShowGuildForm(true)
  }

  async function handleSaveGuild() {
    setBusy(true)
    try {
      if (editGuild) {
        await apiRequest(`/api/v1/guilds/${editGuild.id}`, { method: 'PATCH', body: JSON.stringify(guildForm) })
      } else {
        await apiRequest('/api/v1/guilds', { method: 'POST', body: JSON.stringify(guildForm) })
      }
      setShowGuildForm(false)
      await loadGuilds()
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteGuild(guildId) {
    await apiRequest(`/api/v1/guilds/${guildId}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    if (selectedGuildId === guildId) {
      setSelectedGuildId(null)
      setSelectedGuild(null)
    }
    await loadGuilds()
  }

  // Detail view
  if (selectedGuild) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4">
        <GuildDetail
          guild={selectedGuild}
          members={members}
          onBack={() => { setSelectedGuildId(null); setSelectedGuild(null); loadGuilds() }}
          onRefresh={refreshGuildDetail}
        />
      </div>
    )
  }

  // List view
  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {section === 'network' ? <Globe className="w-5 h-5" style={{ color: ACCENT }} /> : <Building2 className="w-5 h-5" style={{ color: ACCENT }} />}
              <h1 className="text-2xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading, Sole Serif, serif)' }}>
                {section === 'network' ? 'Guildes Réseau' : 'Guildes Lab'}
              </h1>
              <span className="text-sm text-stone-400">{filtered.length} guilde{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            <button onClick={openCreateForm} className="px-3 py-1.5 text-sm rounded-lg font-semibold text-white flex items-center gap-1.5" style={{ backgroundColor: ACCENT }}>
              <Plus className="w-4 h-4" />Nouvelle guilde
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une guilde…" className="w-full border border-stone-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-white text-stone-900" />
          </div>

          {/* Guild Cards */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 mx-auto text-stone-300 mb-3" />
              <p className="text-sm text-stone-400">Aucune guilde {section === 'network' ? 'réseau' : 'lab'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((guild) => (
                <div key={guild.id} onClick={() => openGuild(guild)} className="border border-stone-200 rounded-xl p-4 cursor-pointer transition-all hover:border-stone-300 hover:shadow-sm group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLOR_MAP[guild.color] || '#94a3b8' }} />
                      <h3 className="text-sm font-semibold text-stone-800 group-hover:text-stone-900">{guild.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); openEditForm(guild) }} className="p-1 rounded hover:bg-stone-100 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(guild) }} className="p-1 rounded hover:bg-red-50 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  {guild.description && <p className="text-xs text-stone-500 mt-1.5 line-clamp-2">{guild.description}</p>}
                  <div className="flex items-center gap-3 mt-3 text-xs text-stone-400">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{guild.memberCount}</span>
                    {guild.labName && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{guild.labName}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Guild Form Modal */}
      {showGuildForm && (
        <FormModal title={editGuild ? 'Modifier la guilde' : 'Nouvelle guilde'} onSubmit={handleSaveGuild} onClose={() => setShowGuildForm(false)} busy={busy}>
          <Field label="Nom"><input className={inputCls} value={guildForm.name} onChange={(e) => setGuildForm({ ...guildForm, name: e.target.value })} required /></Field>
          <Field label="Description"><textarea className={inputCls} rows={2} value={guildForm.description} onChange={(e) => setGuildForm({ ...guildForm, description: e.target.value })} /></Field>
          <Field label="Couleur">
            <div className="flex gap-2 mt-1">
              {Object.entries(COLOR_MAP).map(([name, hex]) => (
                <button key={name} type="button" onClick={() => setGuildForm({ ...guildForm, color: name })} className="w-7 h-7 rounded-full border-2 transition-all" style={{ backgroundColor: hex, borderColor: guildForm.color === name ? '#1c1917' : 'transparent', transform: guildForm.color === name ? 'scale(1.15)' : 'scale(1)' }} />
              ))}
            </div>
          </Field>
          <Field label="Type">
            <select className={inputCls} value={guildForm.guild_type} onChange={(e) => setGuildForm({ ...guildForm, guild_type: e.target.value })}>
              <option value="network">Réseau</option>
              <option value="lab">Lab</option>
            </select>
          </Field>
        </FormModal>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDeleteModal
          title="Supprimer cette guilde ?"
          message={`La guilde « ${deleteConfirm.name} » sera supprimée définitivement.`}
          onConfirm={() => handleDeleteGuild(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
          accentColor={ACCENT}
        />
      )}
    </div>
  )
}
