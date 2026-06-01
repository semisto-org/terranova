import React, { useEffect, useState } from 'react'
import { X, Pencil, Trash2, Star, Hand, ExternalLink, UserCheck, CheckCircle2, CalendarClock } from 'lucide-react'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'
import type { Task, ProjectTypeKey } from './types'
import { PROJECT_TYPE_LABELS } from './types'

interface TaskDetailProps {
  task: Task
  accentColor?: string
  busy?: boolean
  onClose: () => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStar?: (id: string) => void
  onPing?: (id: string) => void
  onSaveNotes: (id: string, notes: string) => Promise<void> | void
  onNavigateToProject?: (projectType: ProjectTypeKey, projectId: string) => void
}

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null

function fullName(m?: { firstName: string; lastName: string } | null) {
  return m ? `${m.firstName} ${m.lastName}`.trim() : null
}

export function TaskDetail({
  task, accentColor = '#5B5781', busy, onClose, onEdit, onDelete, onStar, onPing, onSaveNotes, onNavigateToProject,
}: TaskDetailProps) {
  const [notes, setNotes] = useState(task.notes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => { setNotes(task.notes || '') }, [task.id])

  const starred = !!task.starredAt
  const pinged = !!task.pingedAt
  const notesDirty = (task.notes || '') !== notes

  const saveNotes = async () => {
    if (!notesDirty) return
    setSavingNotes(true)
    try { await onSaveNotes(task.id, notes) } finally { setSavingNotes(false) }
  }

  const statusLabel = task.status === 'completed' ? 'Terminée' : task.status === 'in_progress' ? 'En cours' : 'À faire'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.42)' }} onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-stone-900 tracking-tight flex items-center gap-2">
              {pinged && <Hand className="w-4 h-4 text-amber-500 shrink-0" />}
              <span className={task.status === 'completed' ? 'line-through text-stone-400' : ''}>{task.name}</span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                {statusLabel}
              </span>
              {task.projectName && (
                <button
                  onClick={() => task.projectType && task.projectId && onNavigateToProject?.(task.projectType, task.projectId)}
                  className="text-xs text-stone-500 hover:text-stone-800 inline-flex items-center gap-1 hover:underline"
                >
                  {task.projectName}
                  {task.projectType && <span className="text-stone-400">· {PROJECT_TYPE_LABELS[task.projectType]}</span>}
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          {task.description && (
            <p className="text-sm text-stone-600 whitespace-pre-wrap">{task.description}</p>
          )}

          {/* Provenance / historique */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Historique</span>
            <ul className="space-y-2 text-sm text-stone-600">
              {task.assignedBy || task.assignedAt ? (
                <li className="flex items-start gap-2">
                  <UserCheck className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                  <span>Assignée {fullName(task.assignedBy) ? <>par <strong className="font-medium text-stone-800">{fullName(task.assignedBy)}</strong></> : null}{task.assignedAt ? ` le ${fmt(task.assignedAt)}` : ''}{task.assigneeName ? <> à <strong className="font-medium text-stone-800">{task.assigneeName}</strong></> : null}</span>
                </li>
              ) : (
                <li className="text-stone-400 text-xs">Pas d'information d'assignation.</li>
              )}
              {task.completedAt && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Terminée {fullName(task.completedBy) ? <>par <strong className="font-medium text-stone-800">{fullName(task.completedBy)}</strong></> : null} le {fmt(task.completedAt)}</span>
                </li>
              )}
              {task.dueDate && (
                <li className="flex items-start gap-2">
                  <CalendarClock className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                  <span>Échéance le {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </li>
              )}
              {pinged && (
                <li className="flex items-start gap-2">
                  <Hand className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>Coucou {fullName(task.pingedBy) ? <>de <strong className="font-medium text-stone-800">{fullName(task.pingedBy)}</strong></> : null}{task.pingedAt ? ` le ${fmt(task.pingedAt)}` : ''}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Notes</span>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={saveNotes}
              rows={4}
              placeholder="Ajouter des notes, du contexte, des liens…"
              className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400 focus:bg-white"
            />
            {notesDirty && (
              <button onClick={saveNotes} disabled={savingNotes} className="text-xs font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-50" style={{ backgroundColor: accentColor }}>
                {savingNotes ? 'Enregistrement…' : 'Enregistrer les notes'}
              </button>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1">
            {onStar && (
              <button onClick={() => onStar(task.id)} disabled={busy} title={starred ? 'Retirer de ma sélection' : 'Ajouter à ma sélection'}
                className={`p-2 rounded-lg transition-colors ${starred ? 'text-amber-500 bg-amber-50' : 'text-stone-400 hover:bg-stone-100'}`}>
                <Star className="w-4 h-4" fill={starred ? 'currentColor' : 'none'} />
              </button>
            )}
            {onPing && (
              <button onClick={() => onPing(task.id)} disabled={busy} title={pinged ? 'Retirer le coucou' : 'Faire coucou 👋'}
                className={`p-2 rounded-lg transition-colors ${pinged ? 'text-amber-500 bg-amber-50' : 'text-stone-400 hover:bg-stone-100'}`}>
                <Hand className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(task)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmDeleteModal
          title="Supprimer cette tâche ?"
          message={`« ${task.name} » sera définitivement supprimée.`}
          onConfirm={() => { onDelete(task.id); setShowDeleteConfirm(false) }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
