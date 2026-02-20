import React, { useState } from 'react';
import {
  ArrowLeft, Edit3, Archive, Pin, PinOff, Trash2,
  ExternalLink, Calendar, User, Building2, Tag
} from 'lucide-react';
import CategoryBadge from './CategoryBadge';

const POLE_LABELS = {
  lab: 'Gestion du Lab',
  design: 'Design Studio',
  academy: 'Academy',
  nursery: 'Nursery',
  implementation: 'Mise en œuvre',
};

const POLE_ACCENT = {
  lab: '#5B5781',
  design: '#AFBD00',
  academy: '#B01A19',
  nursery: '#EF9B0D',
  implementation: '#234766',
};

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

export default function ArticleDetail({
  article,
  relatedArticles = [],
  onBack,
  onEdit,
  onArchive,
  onTogglePin,
  onDelete,
  onArticleClick,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!article) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
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
        <div className="flex items-center gap-2 mb-3">
          <CategoryBadge category={article.category} size="lg" />
          {article.pole && (
            <span
              className="px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: POLE_ACCENT[article.pole] || '#78716c' }}
            >
              {POLE_LABELS[article.pole] || article.pole}
            </span>
          )}
          {article.pinned && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
              font-medium bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
              <Pin className="w-3 h-3 fill-current" /> Épinglé
            </span>
          )}
        </div>

        <h1
          className="text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-50 mb-4 leading-tight"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {article.title}
        </h1>

        {article.summary && (
          <p className="text-lg text-stone-500 dark:text-stone-400 mb-4">
            {article.summary}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
          {article.authorName && (
            <span className="inline-flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {article.authorName}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {relativeDate(article.publishedAt || article.createdAt)}
          </span>
          {article.labName && (
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {article.labName}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-stone-200 dark:border-stone-700">
          {onEdit && (
            <button
              onClick={() => onEdit(article)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300
                hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
            >
              <Edit3 className="w-4 h-4" /> Éditer
            </button>
          )}
          {onTogglePin && (
            <button
              onClick={() => onTogglePin(article)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300
                hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              {article.pinned
                ? <><PinOff className="w-4 h-4" /> Désépingler</>
                : <><Pin className="w-4 h-4" /> Épingler</>
              }
            </button>
          )}
          {onArchive && (
            <button
              onClick={() => onArchive(article)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300
                hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              <Archive className="w-4 h-4" /> Archiver
            </button>
          )}
          {onDelete && (
            <>
              {showDeleteConfirm ? (
                <div className="inline-flex items-center gap-2">
                  <span className="text-sm text-red-600 dark:text-red-400">Confirmer ?</span>
                  <button
                    onClick={() => { onDelete(article); setShowDeleteConfirm(false); }}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white
                      hover:bg-red-700 transition-colors"
                  >
                    Supprimer
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-stone-100 dark:bg-stone-800
                      text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                    bg-stone-100 dark:bg-stone-800 text-red-600 dark:text-red-400
                    hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Supprimer
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        <div
          className="prose prose-stone dark:prose-invert max-w-none
            prose-headings:font-[var(--font-heading)] prose-a:text-teal-600 dark:prose-a:text-teal-400
            prose-code:font-[var(--font-mono)] prose-code:text-sm
            prose-img:rounded-xl prose-pre:bg-stone-50 dark:prose-pre:bg-stone-900"
          dangerouslySetInnerHTML={{ __html: article.contentHtml || '<p class="text-stone-400 italic">Aucun contenu.</p>' }}
        />

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Tags */}
          {article.tags?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {article.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600
                      dark:text-stone-300 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Source link */}
          {article.sourceUrl && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2">
                Source
              </h4>
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-teal-600 dark:text-teal-400
                  hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Voir la source
              </a>
            </div>
          )}

          {/* Related articles */}
          {relatedArticles.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2">
                Articles liés
              </h4>
              <div className="space-y-2">
                {relatedArticles.slice(0, 5).map(related => (
                  <button
                    key={related.id}
                    onClick={() => onArticleClick?.(related)}
                    className="block w-full text-left p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50
                      hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors group"
                  >
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-200
                      group-hover:text-teal-700 dark:group-hover:text-teal-400 line-clamp-2 transition-colors">
                      {related.title}
                    </p>
                    <CategoryBadge category={related.category} className="mt-1" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
