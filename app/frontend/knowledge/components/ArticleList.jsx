import React, { useState, useMemo } from 'react';
import { Search, Pin, SlidersHorizontal, ArrowUpDown, BookOpen } from 'lucide-react';
import CategoryBadge, { CATEGORY_STYLES } from './CategoryBadge';

const POLE_COLORS = {
  lab:            { label: 'Lab',            accent: '#5B5781', bg: 'bg-[#c8bfd2]', text: 'text-[#5B5781]' },
  design:        { label: 'Design Studio',  accent: '#AFBD00', bg: 'bg-[#e1e6d8]', text: 'text-[#626b00]' },
  academy:       { label: 'Academy',        accent: '#B01A19', bg: 'bg-[#eac7b8]', text: 'text-[#B01A19]' },
  nursery:       { label: 'Nursery',        accent: '#EF9B0D', bg: 'bg-[#fbe6c3]', text: 'text-[#a06900]' },
  implementation:{ label: 'Mise en œuvre',  accent: '#234766', bg: 'bg-[#c9d1d9]', text: 'text-[#234766]' },
};

const CATEGORIES = ['research', 'regulation', 'funding', 'strategy', 'technical'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Plus récent' },
  { value: 'oldest', label: 'Plus ancien' },
  { value: 'alpha',  label: 'Alphabétique' },
];

function relativeDate(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 30) return `Il y a ${diffDays} jours`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} an(s)`;
}

export default function ArticleList({
  articles = [],
  labs = [],
  onArticleClick,
  onNewArticle,
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPole, setSelectedPole] = useState(null);
  const [selectedLab, setSelectedLab] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const filtered = useMemo(() => {
    let result = [...articles];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.summary?.toLowerCase().includes(q) ||
        a.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    if (selectedCategory) result = result.filter(a => a.category === selectedCategory);
    if (selectedPole) result = result.filter(a => a.pole === selectedPole);
    if (selectedLab) result = result.filter(a => String(a.labId) === selectedLab);

    // Pinned first
    const pinned = result.filter(a => a.pinned);
    const unpinned = result.filter(a => !a.pinned);

    const sortFn = {
      newest: (a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt),
      oldest: (a, b) => new Date(a.publishedAt || a.createdAt) - new Date(b.publishedAt || b.createdAt),
      alpha:  (a, b) => a.title.localeCompare(b.title, 'fr'),
    }[sortBy];

    pinned.sort(sortFn);
    unpinned.sort(sortFn);
    return [...pinned, ...unpinned];
  }, [articles, search, selectedCategory, selectedPole, selectedLab, sortBy]);

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="Rechercher un article..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700
            bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100
            placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40
            transition-shadow"
        />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 items-center">
          <SlidersHorizontal className="w-4 h-4 text-stone-400 mr-1" />
          {CATEGORIES.map(cat => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(active ? null : cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all
                  ${active
                    ? `${CATEGORY_STYLES[cat].bg} ${CATEGORY_STYLES[cat].text} ring-1 ring-inset ${CATEGORY_STYLES[cat].ring} scale-105`
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
              >
                {CATEGORY_STYLES[cat].label}
              </button>
            );
          })}
        </div>

        {/* Poles + Lab + Sort */}
        <div className="flex flex-wrap gap-2 items-center">
          {Object.entries(POLE_COLORS).map(([key, pole]) => {
            const active = selectedPole === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedPole(active ? null : key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all
                  ${active
                    ? `${pole.bg} ${pole.text} scale-105`
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
              >
                {pole.label}
              </button>
            );
          })}

          {labs.length > 0 && (
            <select
              value={selectedLab}
              onChange={e => setSelectedLab(e.target.value)}
              className="px-3 py-1 rounded-lg text-xs border border-stone-200 dark:border-stone-700
                bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300
                focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            >
              <option value="">Tous les Labs</option>
              {labs.map(lab => (
                <option key={lab.id} value={lab.id}>{lab.name}</option>
              ))}
            </select>
          )}

          <div className="ml-auto flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-2 py-1 rounded-lg text-xs border border-stone-200 dark:border-stone-700
                bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300
                focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-stone-500 dark:text-stone-400">
        {filtered.length} article{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Article cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-teal-500" />
          </div>
          <h3 className="text-lg font-semibold text-stone-700 dark:text-stone-200" style={{ fontFamily: 'var(--font-heading)' }}>
            Aucun article trouvé
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-sm">
            {search || selectedCategory || selectedPole
              ? 'Essayez de modifier vos filtres ou votre recherche.'
              : 'La base de connaissances est vide. Commencez par créer un premier article !'}
          </p>
          {onNewArticle && !search && !selectedCategory && (
            <button
              onClick={onNewArticle}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm
                font-medium transition-colors"
            >
              Créer un article
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(article => (
            <article
              key={article.id}
              onClick={() => onArticleClick?.(article)}
              className="group relative bg-white dark:bg-stone-800 rounded-xl border border-stone-200
                dark:border-stone-700 p-5 cursor-pointer transition-all duration-200
                hover:shadow-lg hover:shadow-teal-500/5 hover:border-teal-300 dark:hover:border-teal-700
                hover:-translate-y-0.5"
            >
              {article.pinned && (
                <Pin className="absolute top-3 right-3 w-4 h-4 text-teal-500 fill-teal-500" />
              )}

              <div className="flex items-start gap-2 mb-2">
                <CategoryBadge category={article.category} />
                {article.pole && POLE_COLORS[article.pole] && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${POLE_COLORS[article.pole].bg} ${POLE_COLORS[article.pole].text}`}>
                    {POLE_COLORS[article.pole].label}
                  </span>
                )}
              </div>

              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-1
                group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors line-clamp-2"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {article.title}
              </h3>

              {article.summary && (
                <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-3">
                  {article.summary}
                </p>
              )}

              {article.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {article.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-stone-100 dark:bg-stone-700 text-stone-500
                      dark:text-stone-400 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                  {article.tags.length > 4 && (
                    <span className="text-xs text-stone-400">+{article.tags.length - 4}</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-stone-400 dark:text-stone-500 mt-auto pt-2 border-t border-stone-100 dark:border-stone-700/50">
                <span>{article.authorName || 'Anonyme'}</span>
                <span>{relativeDate(article.publishedAt || article.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
