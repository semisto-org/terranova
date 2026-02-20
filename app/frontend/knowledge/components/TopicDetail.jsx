import React, { useState } from 'react';
import {
  ArrowLeft, Edit3, Pin, PinOff, Trash2, Clock, Tag,
  FileText, Image, BarChart3, Download, FolderOpen,
} from 'lucide-react';
import AvatarGroup from './AvatarGroup';
import BookmarkButton from './BookmarkButton';
import CommentSection from './CommentSection';
import RevisionHistory from './RevisionHistory';

function relativeDate(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 30) return `Il y a ${diffDays} jours`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} an(s)`;
}

function fileIcon(type) {
  if (!type) return <FileText className="w-8 h-8 text-stone-400" />;
  if (type.startsWith('image/')) return <Image className="w-8 h-8 text-purple-500" />;
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv'))
    return <BarChart3 className="w-8 h-8 text-emerald-500" />;
  if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
  return <FileText className="w-8 h-8 text-teal-500" />;
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
}

export default function TopicDetail({
  topic,
  relatedTopics = [],
  comments = [],
  revisions = [],
  currentUserId,
  sections = [],
  onBack,
  onEdit,
  onTogglePin,
  onDelete,
  onTopicClick,
  onToggleBookmark,
  onAddComment,
  onDeleteComment,
  onChangeSection,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!topic) return null;

  const sectionName = sections.find(s => s.id === topic.sectionId)?.name;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400
          hover:text-teal-600 dark:hover:text-teal-400 mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        Retour à la liste
      </button>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {/* Section badge */}
            {sectionName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 mb-3">
                <FolderOpen className="w-3 h-3" /> {sectionName}
              </span>
            )}

            <h1
              className="text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-50 leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {topic.title}
            </h1>
          </div>

          <BookmarkButton
            bookmarked={topic.bookmarked}
            onToggle={(val) => onToggleBookmark?.(topic.id, val)}
            size="lg"
          />
        </div>

        {/* Authors + meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
          {topic.authors?.length > 0 && (
            <AvatarGroup users={topic.authors} max={5} size="md" />
          )}
          {topic.readingTime && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {topic.readingTime} min de lecture
            </span>
          )}
          <span>{relativeDate(topic.updatedAt || topic.createdAt)}</span>
          {topic.pinned && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
              font-medium bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
              <Pin className="w-3 h-3 fill-current" /> Épinglé
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-stone-200 dark:border-stone-700">
          {onEdit && (
            <button onClick={() => onEdit(topic)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300
                hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors">
              <Edit3 className="w-4 h-4" /> Éditer
            </button>
          )}
          {onTogglePin && (
            <button onClick={() => onTogglePin(topic)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300
                hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
              {topic.pinned ? <><PinOff className="w-4 h-4" /> Désépingler</> : <><Pin className="w-4 h-4" /> Épingler</>}
            </button>
          )}
          {onChangeSection && (
            <select
              value={topic.sectionId || ''}
              onChange={e => onChangeSection(topic.id, e.target.value || null)}
              className="px-3 py-1.5 rounded-lg text-sm border border-stone-200 dark:border-stone-700
                bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300
                focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            >
              <option value="">Aucune section</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button onClick={() => setShowHistory(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
              bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300
              hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
            <Clock className="w-4 h-4" /> Historique
          </button>
          {onDelete && (
            showDeleteConfirm ? (
              <div className="inline-flex items-center gap-2">
                <span className="text-sm text-red-600 dark:text-red-400">Confirmer ?</span>
                <button onClick={() => { onDelete(topic); setShowDeleteConfirm(false); }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors">
                  Supprimer
                </button>
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-stone-100 dark:bg-stone-800
                    text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                  Annuler
                </button>
              </div>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                  bg-stone-100 dark:bg-stone-800 text-red-600 dark:text-red-400
                  hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            )
          )}
        </div>
      </header>

      {/* Content */}
      <div
        className="prose prose-stone dark:prose-invert max-w-none mb-8
          prose-headings:font-[var(--font-heading)] prose-a:text-teal-600 dark:prose-a:text-teal-400
          prose-code:font-[var(--font-mono)] prose-code:text-sm
          prose-img:rounded-xl prose-pre:bg-stone-50 dark:prose-pre:bg-stone-900"
        dangerouslySetInnerHTML={{ __html: topic.contentHtml || '<p class="text-stone-400 italic">Aucun contenu.</p>' }}
      />

      {/* Tags */}
      {topic.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-8">
          <Tag className="w-4 h-4 text-stone-400 mt-0.5" />
          {topic.tags.map(tag => (
            <span key={tag} className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600
              dark:text-stone-300 text-xs rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Attachments */}
      {topic.attachments?.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">
            Fichiers joints
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topic.attachments.map((file, idx) => (
              <a
                key={file.id || idx}
                href={file.url}
                download
                className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50
                  border border-stone-200 dark:border-stone-700 hover:border-teal-300
                  dark:hover:border-teal-700 transition-all group"
              >
                {fileIcon(file.contentType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate
                    group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                    {file.name}
                  </p>
                  <p className="text-xs text-stone-400">{formatSize(file.size)}</p>
                </div>
                <Download className="w-4 h-4 text-stone-400 group-hover:text-teal-500 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Related topics */}
      {relatedTopics.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">
            Sujets connexes
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedTopics.slice(0, 5).map(related => (
              <button
                key={related.id}
                onClick={() => onTopicClick?.(related)}
                className="text-left p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50
                  border border-stone-200 dark:border-stone-700
                  hover:border-teal-300 dark:hover:border-teal-700
                  hover:shadow-md transition-all group"
              >
                <p className="text-sm font-medium text-stone-700 dark:text-stone-200
                  group-hover:text-teal-700 dark:group-hover:text-teal-400 line-clamp-2 transition-colors"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                  {related.title}
                </p>
                {related.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {related.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-stone-100 dark:bg-stone-700 text-stone-500
                        dark:text-stone-400 text-xs rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="pt-8 border-t border-stone-200 dark:border-stone-700">
        <CommentSection
          comments={comments}
          currentUserId={currentUserId}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
        />
      </div>

      {/* Revision history modal */}
      <RevisionHistory
        revisions={revisions}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
