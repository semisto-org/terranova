import React, { useState } from 'react';
import { Plus, Edit3, Trash2, ChevronUp, ChevronDown, Check, X, FolderOpen } from 'lucide-react';

export default function SectionManager({
  sections = [],
  onCreateSection,
  onRenameSection,
  onReorderSection,
  onDeleteSection,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const startEdit = (section) => {
    setEditingId(section.id);
    setEditName(section.name);
  };

  const confirmEdit = () => {
    if (editName.trim() && editingId) {
      onRenameSection?.(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleAdd = () => {
    if (newName.trim()) {
      onCreateSection?.(newName.trim());
      setNewName('');
      setAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3
          className="text-lg font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          <FolderOpen className="w-5 h-5 text-teal-500" />
          Sections
        </h3>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
              bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300
              hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouvelle section
          </button>
        )}
      </div>

      {/* Add new */}
      {adding && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20
          border border-teal-200 dark:border-teal-800">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Nom de la section"
            className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700
              bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm
              focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
          <button onClick={handleAdd} className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-100 dark:hover:bg-teal-900/40">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => { setAdding(false); setNewName(''); }} className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section list */}
      <div className="space-y-2">
        {sections.length === 0 && !adding && (
          <p className="text-sm text-stone-400 italic text-center py-6">
            Aucune section. Créez-en une pour organiser vos sujets.
          </p>
        )}
        {sections.map((section, idx) => (
          <div
            key={section.id}
            className="flex items-center gap-2 p-3 rounded-lg bg-white dark:bg-stone-800
              border border-stone-200 dark:border-stone-700 group"
          >
            {editingId === section.id ? (
              <>
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') confirmEdit();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="flex-1 px-2 py-1 rounded border border-teal-300 dark:border-teal-700
                    bg-white dark:bg-stone-800 text-sm text-stone-900 dark:text-stone-100
                    focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
                <button onClick={confirmEdit} className="p-1 text-teal-600"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingId(null)} className="p-1 text-stone-400"><X className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-stone-900 dark:text-stone-100">
                  {section.name}
                </span>
                <span className="text-xs text-stone-400 mr-2">
                  {section.topicCount ?? 0} sujet{(section.topicCount ?? 0) !== 1 ? 's' : ''}
                </span>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Reorder */}
                  <button
                    onClick={() => onReorderSection?.(section.id, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded text-stone-400 hover:text-stone-600 disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onReorderSection?.(section.id, 'down')}
                    disabled={idx === sections.length - 1}
                    className="p-1 rounded text-stone-400 hover:text-stone-600 disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  <button onClick={() => startEdit(section)} className="p-1 rounded text-stone-400 hover:text-teal-600">
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {deleteConfirmId === section.id ? (
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => { onDeleteSection?.(section.id); setDeleteConfirmId(null); }}
                        className="px-2 py-0.5 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700"
                      >
                        Oui
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-0.5 rounded text-xs font-medium bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(section.id)}
                      className="p-1 rounded text-stone-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
