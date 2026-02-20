import React, { useState } from 'react';
import { X, Eye, Edit3, Save, ArrowLeft } from 'lucide-react';

const CATEGORIES = [
  { value: 'research',   label: 'Recherche' },
  { value: 'regulation', label: 'Réglementation' },
  { value: 'funding',    label: 'Financement' },
  { value: 'strategy',   label: 'Stratégie' },
  { value: 'technical',  label: 'Technique' },
  { value: 'other',      label: 'Autre' },
];

const POLES = [
  { value: 'lab',            label: 'Gestion du Lab' },
  { value: 'design',        label: 'Design Studio' },
  { value: 'academy',       label: 'Academy' },
  { value: 'nursery',       label: 'Nursery' },
  { value: 'implementation', label: 'Mise en œuvre' },
];

const STATUSES = [
  { value: 'draft',     label: 'Brouillon' },
  { value: 'published', label: 'Publié' },
];

const inputClasses = `w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700
  bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100
  placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40
  transition-shadow text-sm`;

const labelClasses = 'block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1';

export default function ArticleForm({
  article = null,
  labs = [],
  onSubmit,
  onCancel,
  saving = false,
}) {
  const isEdit = !!article;

  const [form, setForm] = useState({
    title: article?.title || '',
    summary: article?.summary || '',
    content: article?.content || '',
    category: article?.category || 'research',
    tags: article?.tags || [],
    labId: article?.labId || '',
    pole: article?.pole || '',
    sourceUrl: article?.sourceUrl || '',
    status: article?.status || 'draft',
  });

  const [tagInput, setTagInput] = useState('');
  const [preview, setPreview] = useState(false);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      set('tags', [...form.tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag) => set('tags', form.tags.filter(t => t !== tag));

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && !tagInput && form.tags.length > 0) {
      removeTag(form.tags[form.tags.length - 1]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  // Basic markdown preview (bold, italic, headers, links, code)
  const renderMarkdownPreview = (md) => {
    if (!md) return '<p class="text-stone-400 italic">Rien à prévisualiser.</p>';
    let html = md
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-stone-100 dark:bg-stone-700 rounded text-sm">$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-teal-600 underline" target="_blank" rel="noopener">$1</a>')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, '<br/>');
    return `<p class="mb-2">${html}</p>`;
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400
            hover:text-teal-600 dark:hover:text-teal-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Annuler
        </button>
        <h2
          className="text-xl font-bold text-stone-900 dark:text-stone-50"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {isEdit ? 'Modifier l'article' : 'Nouvel article'}
        </h2>
      </div>

      {/* Title */}
      <div>
        <label className={labelClasses}>Titre *</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Titre de l'article"
          className={inputClasses}
        />
      </div>

      {/* Summary */}
      <div>
        <label className={labelClasses}>Résumé</label>
        <textarea
          rows={2}
          value={form.summary}
          onChange={e => set('summary', e.target.value)}
          placeholder="Court résumé de l'article (affiché dans la liste)"
          className={`${inputClasses} resize-none`}
        />
      </div>

      {/* Content with preview toggle */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelClasses.replace(' mb-1', '')}>Contenu *</label>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400
              hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
          >
            {preview ? <><Edit3 className="w-3.5 h-3.5" /> Écriture</> : <><Eye className="w-3.5 h-3.5" /> Aperçu</>}
          </button>
        </div>
        {preview ? (
          <div
            className="min-h-[200px] p-4 rounded-lg border border-stone-200 dark:border-stone-700
              bg-white dark:bg-stone-800 prose prose-stone dark:prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(form.content) }}
          />
        ) : (
          <textarea
            rows={10}
            required
            value={form.content}
            onChange={e => set('content', e.target.value)}
            placeholder="Contenu de l'article — Supporte le Markdown"
            className={`${inputClasses} resize-y min-h-[200px] font-mono text-sm`}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        )}
      </div>

      {/* Category + Status row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Catégorie *</label>
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className={inputClasses}
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClasses}>Statut</label>
          <select
            value={form.status}
            onChange={e => set('status', e.target.value)}
            className={inputClasses}
          >
            {STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pole + Lab row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Pôle</label>
          <select
            value={form.pole}
            onChange={e => set('pole', e.target.value)}
            className={inputClasses}
          >
            <option value="">— Aucun —</option>
            {POLES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClasses}>Lab</label>
          <select
            value={form.labId}
            onChange={e => set('labId', e.target.value)}
            className={inputClasses}
          >
            <option value="">— Aucun —</option>
            {labs.map(lab => (
              <option key={lab.id} value={lab.id}>{lab.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className={labelClasses}>Tags</label>
        <div className={`flex flex-wrap gap-1.5 p-2 rounded-lg border border-stone-200 dark:border-stone-700
          bg-white dark:bg-stone-800 focus-within:ring-2 focus-within:ring-teal-500/40 transition-shadow`}>
          {form.tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 dark:bg-teal-900/40
                text-teal-700 dark:text-teal-300 text-xs rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-teal-900 dark:hover:text-teal-100 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
            placeholder={form.tags.length === 0 ? 'Taper un tag et appuyer sur Entrée' : ''}
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm
              text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* Source URL */}
      <div>
        <label className={labelClasses}>Source (URL)</label>
        <input
          type="url"
          value={form.sourceUrl}
          onChange={e => set('sourceUrl', e.target.value)}
          placeholder="https://..."
          className={inputClasses}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-stone-200 dark:border-stone-700">
        <button
          type="submit"
          disabled={saving || !form.title || !form.content}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium
            bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/50 text-white
            transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg text-sm font-medium
            bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300
            hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
