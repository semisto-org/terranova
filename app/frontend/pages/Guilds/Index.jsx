import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest, getCsrfToken } from '@/lib/api'
import { useShellNav } from '../../components/shell/ShellContext'
import { useUrlState } from '@/hooks/useUrlState'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'
import SimpleEditor from '@/components/SimpleEditor'
import {
  Users, Plus, FileText, ListChecks, BookOpen, KeyRound,
  ChevronLeft, Upload, X, Eye, EyeOff, Trash2, Pencil,
  Check, Circle, Globe, Building2, Tag, Copy
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
  teal: '#14b8a6',
  pink: '#ec4899',
  amber: '#f59e0b',
  indigo: '#6366f1',
  slate: '#64748b',
  emerald: '#10b981',
  rose: '#f43f5e',
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
function TasksTab({ guild, members, onRefresh }) {
  const [newListName, setNewListName] = useState('')
  const [addingToList, setAddingToList] = useState(null)
  const [newActionName, setNewActionName] = useState('')
  const [editingAction, setEditingAction] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', assignee_name: '', due_date: '', priority: '' })
  const [editBusy, setEditBusy] = useState(false)
  const [editingListId, setEditingListId] = useState(null)
  const [editListName, setEditListName] = useState('')

  const guildMembers = useMemo(() => {
    const ids = new Set(guild.memberIds || [])
    return (members || []).filter((m) => ids.has(m.id))
  }, [members, guild.memberIds])

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

  async function handleRenameList(listId) {
    if (!editListName.trim()) return
    await apiRequest(`/api/v1/guilds/${guild.id}/task-lists/${listId}`, { method: 'PATCH', body: JSON.stringify({ name: editListName }) })
    setEditingListId(null)
    onRefresh()
  }

  function openEditAction(action) {
    setEditingAction(action)
    setEditForm({
      name: action.name || '',
      assignee_name: action.assigneeName || '',
      due_date: action.dueDate || '',
      priority: action.priority || '',
    })
  }

  async function handleSaveAction() {
    setEditBusy(true)
    try {
      await apiRequest(`/api/v1/guilds/${guild.id}/actions/${editingAction.id}`, { method: 'PATCH', body: JSON.stringify(editForm) })
      setEditingAction(null)
      onRefresh()
    } finally {
      setEditBusy(false)
    }
  }

  const lists = guild.taskLists || []

  return (
    <div className="space-y-4">
      {lists.map((list) => (
        <div key={list.id} className="border border-stone-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-stone-50 flex items-center justify-between group/header">
            {editingListId === list.id ? (
              <form onSubmit={(e) => { e.preventDefault(); handleRenameList(list.id) }} className="flex items-center gap-2 flex-1">
                <input value={editListName} onChange={(e) => setEditListName(e.target.value)} className="flex-1 text-sm font-semibold border border-stone-300 rounded px-2 py-0.5 bg-white text-stone-800" autoFocus onBlur={() => handleRenameList(list.id)} />
              </form>
            ) : (
              <h4 className="text-sm font-semibold text-stone-700">{list.name}</h4>
            )}
            <div className="flex items-center gap-1">
              <button onClick={() => { setEditingListId(list.id); setEditListName(list.name) }} className="p-1 rounded hover:bg-stone-200 text-stone-400 opacity-0 group-hover/header:opacity-100 transition-opacity"><Pencil className="w-3.5 h-3.5" /></button>
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
                {action.assigneeName && <span className="text-xs px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">{action.assigneeName}</span>}
                {action.dueDate && <span className="text-xs text-stone-400">{new Date(action.dueDate).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' })}</span>}
                <button onClick={() => openEditAction(action)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-stone-100 text-stone-400"><Pencil className="w-3 h-3" /></button>
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

      {/* Edit Action Modal */}
      {editingAction && (
        <FormModal title="Modifier la tâche" onSubmit={handleSaveAction} onClose={() => setEditingAction(null)} busy={editBusy}>
          <Field label="Nom"><input className={inputCls} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></Field>
          <Field label="Assigné à">
            <select className={inputCls} value={editForm.assignee_name} onChange={(e) => setEditForm({ ...editForm, assignee_name: e.target.value })}>
              <option value="">Non assigné</option>
              {guildMembers.map((m) => (
                <option key={m.id} value={`${m.firstName} ${m.lastName}`}>{m.firstName} {m.lastName}</option>
              ))}
            </select>
          </Field>
          <Field label="Échéance"><input className={inputCls} type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} /></Field>
          <Field label="Priorité">
            <select className={inputCls} value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
              <option value="">Aucune</option>
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
            </select>
          </Field>
        </FormModal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Wiki Tab
// ---------------------------------------------------------------------------
function WikiTab({ guild, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [sectionForm, setSectionForm] = useState({ name: '', description: '' })
  const [busy, setBusy] = useState(false)
  const sections = guild.knowledgeSections || []

  async function handleCreateSection() {
    setBusy(true)
    try {
      await apiRequest('/api/v1/knowledge/sections', { method: 'POST', body: JSON.stringify({ ...sectionForm, guild_id: guild.id }) })
      setShowForm(false)
      setSectionForm({ name: '', description: '' })
      onRefresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="px-3 py-1.5 text-sm rounded-lg font-semibold text-white flex items-center gap-1.5" style={{ backgroundColor: ACCENT }}>
          <Plus className="w-4 h-4" />Nouvelle section
        </button>
      </div>
      {sections.length === 0 ? (
        <p className="text-sm text-stone-400 py-8 text-center">Aucune section wiki</p>
      ) : (
        sections.map((s) => (
          <div key={s.id} className="border border-stone-200 rounded-lg px-4 py-3">
            <h4 className="text-sm font-semibold text-stone-800">{s.name}</h4>
            {s.description && <p className="text-xs text-stone-500 mt-0.5">{s.description}</p>}
            <span className="text-xs text-stone-400 mt-1 block">{s.topicsCount} article{s.topicsCount !== 1 ? 's' : ''}</span>
          </div>
        ))
      )}
      {showForm && (
        <FormModal title="Nouvelle section wiki" onSubmit={handleCreateSection} onClose={() => setShowForm(false)} busy={busy}>
          <Field label="Nom"><input className={inputCls} value={sectionForm.name} onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })} required /></Field>
          <Field label="Description"><textarea className={inputCls} rows={2} value={sectionForm.description} onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })} /></Field>
        </FormModal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Credentials Tab
// ---------------------------------------------------------------------------
function CredentialsTab({ guild, onRefresh }) {
  const [revealed, setRevealed] = useState({})
  const [copied, setCopied] = useState(null)
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

  async function copyPassword(credId) {
    let pw = revealed[credId]
    if (!pw) {
      const res = await apiRequest(`/api/v1/guilds/${guild.id}/credentials/${credId}/reveal`)
      pw = res.credential.password
    }
    if (pw) {
      await navigator.clipboard.writeText(pw)
      setCopied(credId)
      setTimeout(() => setCopied(null), 2000)
    }
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
                  <button onClick={() => copyPassword(cred.id)} className="p-0.5 rounded hover:bg-stone-100 text-stone-400" title="Copier le mot de passe">
                    {copied === cred.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => revealPassword(cred.id)} className="p-0.5 rounded hover:bg-stone-100 text-stone-400" title={revealed[cred.id] ? 'Masquer' : 'Afficher'}>
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
// Member Picker (autocomplete + pills)
// ---------------------------------------------------------------------------
function MemberPicker({ members, selectedIds, onAdd, onRemove }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = React.useRef(null)

  const selected = useMemo(() => (members || []).filter((m) => selectedIds.includes(m.id)), [members, selectedIds])

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return (members || [])
      .filter((m) => !selectedIds.includes(m.id))
      .filter((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q))
      .slice(0, 6)
  }, [members, selectedIds, query])

  function handleSelect(m) {
    onAdd(m.id)
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.key === 'Backspace' && !query && selected.length > 0) {
      onRemove(selected[selected.length - 1].id)
    }
  }

  return (
    <Field label="Membres">
      <div className="mt-1 relative">
        <div className="flex flex-wrap items-center gap-1.5 border border-stone-300 rounded-lg px-2 py-1.5 bg-white min-h-[38px] cursor-text" onClick={() => inputRef.current?.focus()}>
          {selected.map((m) => (
            <span key={m.id} className="flex items-center gap-1 pl-1 pr-0.5 py-0.5 rounded-full bg-stone-100 text-xs text-stone-700">
              {m.avatarUrl ? (
                <img src={m.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-stone-300 flex items-center justify-center text-[8px] font-medium text-white">{m.firstName?.[0]}{m.lastName?.[0]}</span>
              )}
              {m.firstName} {m.lastName}
              <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(m.id) }} className="ml-0.5 p-0.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => { if (query) setOpen(true) }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder={selected.length === 0 ? 'Rechercher un membre…' : ''}
            className="flex-1 min-w-[120px] text-sm outline-none bg-transparent text-stone-900 placeholder:text-stone-400"
          />
        </div>
        {open && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-10 overflow-hidden">
            {suggestions.map((m) => (
              <button key={m.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleSelect(m)} className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm hover:bg-stone-50 transition-colors">
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center text-[9px] font-medium text-stone-600">{m.firstName?.[0]}{m.lastName?.[0]}</span>
                )}
                <span className="text-stone-700">{m.firstName} {m.lastName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Field>
  )
}

// ---------------------------------------------------------------------------
// Guild Detail View
// ---------------------------------------------------------------------------
function GuildDetail({ guild, onBack, onRefresh, members, labs }) {
  const [activeTab, setActiveTab] = useState('documents')
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [editMemberIds, setEditMemberIds] = useState([])
  const [editBusy, setEditBusy] = useState(false)

  const guildMemberIds = useMemo(() => new Set(guild.memberIds || []), [guild.memberIds])
  const guildMembers = useMemo(() => (members || []).filter((m) => guildMemberIds.has(m.id)), [members, guildMemberIds])

  function openEdit() {
    setEditForm({ name: guild.name, description: guild.description || '', color: guild.color, guild_type: guild.guildType, lab_id: guild.labId || '' })
    setEditMemberIds([...(guild.memberIds || [])])
    setShowEdit(true)
  }

  async function handleSaveEdit() {
    setEditBusy(true)
    try {
      const payload = { ...editForm }
      if (payload.guild_type === 'network') delete payload.lab_id
      await apiRequest(`/api/v1/guilds/${guild.id}`, { method: 'PATCH', body: JSON.stringify(payload) })

      // Sync members: add new, remove old
      const current = new Set(guild.memberIds || [])
      const desired = new Set(editMemberIds)
      for (const id of desired) {
        if (!current.has(id)) await apiRequest(`/api/v1/guilds/${guild.id}/members`, { method: 'POST', body: JSON.stringify({ member_id: id }) })
      }
      for (const id of current) {
        if (!desired.has(id)) await apiRequest(`/api/v1/guilds/${guild.id}/members/${id}`, { method: 'DELETE' })
      }

      setShowEdit(false)
      onRefresh()
    } finally {
      setEditBusy(false)
    }
  }

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
        <button onClick={openEdit} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors" title="Modifier la guilde">
          <Pencil className="w-4 h-4" />
        </button>
      </div>
      {guild.description && <div className="text-sm text-stone-600 mb-4 prose prose-stone prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: guild.description }} />}

      {/* Members row */}
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-4 h-4 text-stone-400" />
        {guildMembers.length === 0 ? (
          <span className="text-xs text-stone-400">Aucun membre</span>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            {guildMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-stone-100 text-xs text-stone-700" title={`${m.firstName} ${m.lastName}`}>
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-stone-300 flex items-center justify-center text-[8px] font-medium text-white">{m.firstName?.[0]}{m.lastName?.[0]}</span>
                )}
                {m.firstName}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Guild Modal */}
      {showEdit && editForm && (
        <FormModal title="Modifier la guilde" onSubmit={handleSaveEdit} onClose={() => setShowEdit(false)} busy={editBusy}>
          <Field label="Nom"><input className={inputCls} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></Field>
          <Field label="Fonctions">
            <SimpleEditor
              content={editForm.description}
              onUpdate={(html) => setEditForm((f) => ({ ...f, description: html }))}
              minHeight="100px"
              toolbar={['bold', 'italic', '|', 'bulletList', 'orderedList']}
            />
          </Field>
          <Field label="Couleur">
            <div className="flex flex-wrap gap-2 mt-1">
              {Object.entries(COLOR_MAP).map(([name, hex]) => (
                <button key={name} type="button" onClick={() => setEditForm({ ...editForm, color: name })} className="w-7 h-7 rounded-full border-2 transition-all" style={{ backgroundColor: hex, borderColor: editForm.color === name ? '#1c1917' : 'transparent', transform: editForm.color === name ? 'scale(1.15)' : 'scale(1)' }} />
              ))}
            </div>
          </Field>
          <MemberPicker members={members} selectedIds={editMemberIds} onAdd={(id) => setEditMemberIds((ids) => [...ids, id])} onRemove={(id) => setEditMemberIds((ids) => ids.filter((x) => x !== id))} />
        </FormModal>
      )}

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
      {activeTab === 'tasks' && <TasksTab guild={guild} members={members} onRefresh={onRefresh} />}
      {activeTab === 'wiki' && <WikiTab guild={guild} onRefresh={onRefresh} />}
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
  const [labs, setLabs] = useState([])
  const [members, setMembers] = useState([])
  const [selectedGuildId, setSelectedGuildId] = useState(null)
  const [selectedGuild, setSelectedGuild] = useState(null)
  const [showGuildForm, setShowGuildForm] = useState(false)
  const [editGuild, setEditGuild] = useState(null)
  const [guildForm, setGuildForm] = useState({ name: '', description: '', color: 'blue', guild_type: 'network', lab_id: '' })
  const [formError, setFormError] = useState(null)
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
      apiRequest('/api/v1/labs').then((res) => setLabs(res.labs || [])).catch(() => {}),
      apiRequest('/api/v1/lab/members').then((res) => setMembers(res.items || [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  // Filter guilds by section
  const filtered = useMemo(() => {
    return guilds.filter((g) => g.guildType === section)
  }, [guilds, section])

  function openGuild(guild) {
    setSelectedGuildId(guild.id)
    loadGuildDetail(guild.id)
  }

  function refreshGuildDetail() {
    if (selectedGuildId) loadGuildDetail(selectedGuildId)
  }

  function openCreateForm() {
    setEditGuild(null)
    setFormError(null)
    setGuildForm({ name: '', description: '', color: 'blue', guild_type: section, lab_id: labs[0]?.id || '' })
    setShowGuildForm(true)
  }

  function openEditForm(guild) {
    setEditGuild(guild)
    setFormError(null)
    setGuildForm({ name: guild.name, description: guild.description || '', color: guild.color, guild_type: guild.guildType, lab_id: guild.labId || '' })
    setShowGuildForm(true)
  }

  async function handleSaveGuild() {
    setFormError(null)
    const payload = { ...guildForm }
    if (payload.guild_type === 'network') delete payload.lab_id
    setBusy(true)
    try {
      if (editGuild) {
        await apiRequest(`/api/v1/guilds/${editGuild.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      } else {
        await apiRequest('/api/v1/guilds', { method: 'POST', body: JSON.stringify(payload) })
      }
      setShowGuildForm(false)
      await loadGuilds()
    } catch (err) {
      setFormError(err.message || 'Une erreur est survenue')
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
          labs={labs}
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
                  {guild.description && <p className="text-xs text-stone-500 mt-1.5 line-clamp-2">{guild.description.replace(/<[^>]*>/g, '')}</p>}
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
          <div className="rounded-lg px-3.5 py-3 text-xs leading-relaxed text-stone-600" style={{ backgroundColor: ACCENT_BG + '66' }}>
            <p className="mb-1.5">Une <strong className="text-stone-800">guilde</strong> est une équipe qui prend en charge un service ou une fonction au sein de Semisto.</p>
            <p className="mb-0.5"><strong className="text-stone-800">Guilde Réseau</strong> — transversale à tous les Labs (ex. communication, infrastructure digitale).</p>
            <p><strong className="text-stone-800">Guilde Lab</strong> — interne à un Lab spécifique (ex. gestion locale, événements).</p>
          </div>
          {formError && <div className="rounded-lg px-3.5 py-2.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200">{formError}</div>}
          <Field label="Type">
            <div className="flex mt-1 rounded-lg border border-stone-200 overflow-hidden">
              <button type="button" onClick={() => setGuildForm({ ...guildForm, guild_type: 'network' })} className="flex items-center gap-2 flex-1 px-4 py-2.5 text-sm font-medium transition-colors" style={guildForm.guild_type === 'network' ? { backgroundColor: ACCENT, color: '#fff' } : { color: '#57534e' }}>
                <Globe className="w-4 h-4" />Réseau
              </button>
              <button type="button" onClick={() => setGuildForm({ ...guildForm, guild_type: 'lab' })} className="flex items-center gap-2 flex-1 px-4 py-2.5 text-sm font-medium border-l border-stone-200 transition-colors" style={guildForm.guild_type === 'lab' ? { backgroundColor: ACCENT, color: '#fff' } : { color: '#57534e' }}>
                <Building2 className="w-4 h-4" />Lab
              </button>
            </div>
          </Field>
          {guildForm.guild_type === 'lab' && (
            <Field label="Lab">
              <select className={inputCls} value={guildForm.lab_id} onChange={(e) => setGuildForm({ ...guildForm, lab_id: e.target.value })} required>
                {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Nom"><input className={inputCls} value={guildForm.name} onChange={(e) => setGuildForm({ ...guildForm, name: e.target.value })} required /></Field>
          <Field label="Fonctions">
            <SimpleEditor
              content={guildForm.description}
              onUpdate={(html) => setGuildForm((f) => ({ ...f, description: html }))}
              minHeight="100px"
              toolbar={['bold', 'italic', '|', 'bulletList', 'orderedList']}
            />
          </Field>
          <Field label="Couleur">
            <div className="flex flex-wrap gap-2 mt-1">
              {Object.entries(COLOR_MAP).map(([name, hex]) => (
                <button key={name} type="button" onClick={() => setGuildForm({ ...guildForm, color: name })} className="w-7 h-7 rounded-full border-2 transition-all" style={{ backgroundColor: hex, borderColor: guildForm.color === name ? '#1c1917' : 'transparent', transform: guildForm.color === name ? 'scale(1.15)' : 'scale(1)' }} />
              ))}
            </div>
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
