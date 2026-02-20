import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Save, X, Upload, FileText, Image, BarChart3, Trash2 } from 'lucide-react';
import SimpleEditor from '../../components/SimpleEditor';

function fileIcon(type) {
  if (!type) return <FileText className="w-6 h-6 text-stone-400" />;
  if (type.startsWith('image/')) return <Image className="w-6 h-6 text-purple-500" />;
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv'))
    return <BarChart3 className="w-6 h-6 text-emerald-500" />;
  if (type.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
  return <FileText className="w-6 h-6 text-teal-500" />;
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
}

const FUN_MESSAGES = [
  { idle: 'Glissez vos fichiers ici 📎', emoji: '📎' },
  { idle: 'Déposez vos documents ici 📄', emoji: '📄' },
];
const DROP_MESSAGES = ['Lâchez tout ! 🎯', 'Encore ! 🥳', 'Par ici ! 🎉', 'Go go go ! 🚀'];

const inputClasses = `w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700
  bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100
  placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40
  transition-shadow text-sm`;

const labelClasses = 'block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1';

export default function TopicForm({
  topic = null,
  sections = [],
  allTags = [],
  onSubmit,
  onCancel,
  saving = false,
}) {
  const isEdit = !!topic;
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: topic?.title || '',
    content: topic?.contentHtml || topic?.content || '',
    tags: topic?.tags || [],
    sectionId: topic?.sectionId || '',
    status: topic?.status || 'draft',
  });

  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [files, setFiles] = useState(topic?.attachments || []);
  const [newFiles, setNewFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [funMsg] = useState(() => FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)]);
  const [dropMsg, setDropMsg] = useState(DROP_MESSAGES[0]);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // Tags autocomplete
  const handleTagChange = (value) => {
    setTagInput(value);
    if (value.trim()) {
      const q = value.toLowerCase();
      setTagSuggestions(
        allTags.filter(t => t.toLowerCase().includes(q) && !form.tags.includes(t)).slice(0, 5)
      );
    } else {
      setTagSuggestions([]);
    }
  };

  const addTag = (tag) => {
    const t = (tag || tagInput).trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      set('tags', [...form.tags, t]);
    }
    setTagInput('');
    setTagSuggestions([]);
  };

  const removeTag = (tag) => set('tags', form.tags.filter(t => t !== tag));

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !tagInput && form.tags.length > 0) {
      removeTag(form.tags[form.tags.length - 1]);
    }
  };

  // File handling
  const handleFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList);
    const withPreviews = incoming.map(f => ({
      file: f,
      name: f.name,
      size: f.size,
      contentType: f.type,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      id: `new-${Date.now()}-${Math.random()}`,
    }));
    setNewFiles(prev => [...prev, ...withPreviews]);

    // Fake progress animation
    withPreviews.forEach(f => {
      setUploadProgress(prev => ({ ...prev, [f.id]: 0 }));
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30 + 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        setUploadProgress(prev => ({ ...prev, [f.id]: Math.min(progress, 100) }));
      }, 200);
    });
  }, []);

  const removeNewFile = (id) => {
    setNewFiles(prev => prev.filter(f => f.id !== id));
  };

  const removeExistingFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); setDropMsg(DROP_MESSAGES[Math.floor(Math.random() * DROP_MESSAGES.length)]); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({
      ...form,
      existingAttachments: files,
      newAttachments: newFiles.map(f => f.file),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400
            hover:text-teal-600 dark:hover:text-teal-400 transition-colors group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Annuler
        </button>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50"
          style={{ fontFamily: 'var(--font-heading)' }}>
          {isEdit ? 'Modifier le sujet' : 'Nouveau sujet'}
        </h2>
      </div>

      {/* Title */}
      <div>
        <label className={labelClasses}>Titre *</label>
        <input type="text" required value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="Titre du sujet" className={inputClasses} />
      </div>

      {/* Content — TipTap */}
      <div>
        <label className={labelClasses}>Contenu *</label>
        <SimpleEditor
          content={form.content}
          onUpdate={(html) => set('content', html)}
          placeholder="Écrivez le contenu du sujet..."
          minHeight="250px"
        />
      </div>

      {/* Section + Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Section</label>
          <select value={form.sectionId} onChange={e => set('sectionId', e.target.value)}
            className={inputClasses}>
            <option value="">Aucune</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClasses}>Statut</label>
          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={() => set('status', form.status === 'published' ? 'draft' : 'published')}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300
                ${form.status === 'published' ? 'bg-teal-500' : 'bg-stone-300 dark:bg-stone-600'}`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300
                ${form.status === 'published' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${form.status === 'published'
              ? 'text-teal-700 dark:text-teal-400' : 'text-stone-500 dark:text-stone-400'}`}>
              {form.status === 'published' ? 'Publié' : 'Brouillon'}
            </span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className={labelClasses}>Tags</label>
        <div className="relative">
          <div className={`flex flex-wrap gap-1.5 p-2 rounded-lg border border-stone-200 dark:border-stone-700
            bg-white dark:bg-stone-800 focus-within:ring-2 focus-within:ring-teal-500/40 transition-shadow`}>
            {form.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100
                dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs rounded-full">
                {tag}
                <button type="button" onClick={() => removeTag(tag)}
                  className="hover:text-teal-900 dark:hover:text-teal-100 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input type="text" value={tagInput} onChange={e => handleTagChange(e.target.value)}
              onKeyDown={handleTagKeyDown} onBlur={() => { addTag(); setTimeout(() => setTagSuggestions([]), 200); }}
              placeholder={form.tags.length === 0 ? 'Taper un tag et appuyer sur Entrée' : ''}
              className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm
                text-stone-900 dark:text-stone-100 placeholder:text-stone-400" />
          </div>
          {/* Autocomplete dropdown */}
          {tagSuggestions.length > 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-stone-800 border
              border-stone-200 dark:border-stone-700 rounded-lg shadow-lg overflow-hidden">
              {tagSuggestions.map(tag => (
                <button key={tag} type="button"
                  onMouseDown={(e) => { e.preventDefault(); addTag(tag); }}
                  className="w-full text-left px-3 py-2 text-sm text-stone-700 dark:text-stone-300
                    hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Files — FUN experience */}
      <div>
        <label className={labelClasses}>Fichiers joints</label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center
            transition-all duration-300
            ${dragOver
              ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20 scale-[1.02]'
              : 'border-stone-300 dark:border-stone-600 hover:border-teal-300 dark:hover:border-teal-700 bg-stone-50 dark:bg-stone-800/50'
            }`}
          style={dragOver ? { borderImage: 'none', animation: 'pulse 1s ease-in-out infinite' } : {}}
        >
          <input ref={fileInputRef} type="file" multiple className="hidden"
            onChange={e => handleFiles(e.target.files)} />
          <Upload className={`w-10 h-10 mx-auto mb-3 transition-transform duration-500
            ${dragOver ? 'text-teal-500 animate-bounce' : 'text-stone-400'}`} />
          <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
            {dragOver ? dropMsg : funMsg.idle}
          </p>
          <p className="text-xs text-stone-400 mt-1">
            ou cliquez pour parcourir
          </p>
        </div>

        {/* Existing files */}
        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map(file => (
              <div key={file.id} className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-stone-800
                border border-stone-200 dark:border-stone-700">
                {fileIcon(file.contentType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate">{file.name}</p>
                  <p className="text-xs text-stone-400">{formatSize(file.size)}</p>
                </div>
                <button type="button" onClick={() => removeExistingFile(file.id)}
                  className="p-1 text-stone-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New files with previews + progress */}
        {newFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {newFiles.map(file => (
              <div key={file.id} className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-stone-800
                border border-stone-200 dark:border-stone-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {file.preview ? (
                  <img src={file.preview} alt={file.name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  fileIcon(file.contentType)
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate">{file.name}</p>
                  <p className="text-xs text-stone-400">{formatSize(file.size)}</p>
                  {(uploadProgress[file.id] ?? 0) < 100 && (
                    <div className="mt-1 h-1.5 w-full bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300
                          bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500"
                        style={{ width: `${uploadProgress[file.id] || 0}%` }}
                      />
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => removeNewFile(file.id)}
                  className="p-1 text-stone-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-stone-200 dark:border-stone-700">
        <button type="submit" disabled={saving || !form.title}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium
            bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/50 text-white
            transition-colors shadow-sm">
          <Save className="w-4 h-4" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-lg text-sm font-medium
            bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300
            hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
          Annuler
        </button>
      </div>
    </form>
  );
}
