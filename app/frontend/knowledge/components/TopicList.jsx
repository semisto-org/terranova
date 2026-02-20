import React, { useState, useMemo } from 'react';
import { Search, Pin, ChevronDown, ChevronRight, BookOpen, Bookmark, Clock, Tag } from 'lucide-react';
import AvatarGroup from './AvatarGroup';
import BookmarkButton from './BookmarkButton';

function relativeDate(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 30) return `Il y a ${diffDays} jours`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} an(s)`;
}

function readingTime(minutes) {
  if (!minutes) return null;
  return `${minutes} min`;
}

export default function TopicList({
  topics = [],
  sections = [],
  onTopicClick,
  onNewTopic,
  onToggleBookmark,
}) {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'bookmarks'

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tags = new Set();
    topics.forEach(t => t.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [topics]);

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  // Filter topics
  const filtered = useMemo(() => {
    let result = [...topics];

    if (activeTab === 'bookmarks') {
      result = result.filter(t => t.bookmarked);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter(t =>
        selectedTags.every(tag => t.tags?.includes(tag))
      );
    }

    // Pinned first
    const pinned = result.filter(t => t.pinned);
    const unpinned = result.filter(t => !t.pinned);
    pinned.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    unpinned.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    return [...pinned, ...unpinned];
  }, [topics, search, selectedTags, activeTab]);

  // Group by section
  const grouped = useMemo(() => {
    const sectionMap = new Map();
    sections.forEach(s => sectionMap.set(s.id, { ...s, topics: [] }));
    const uncategorized = [];

    filtered.forEach(topic => {
      if (topic.sectionId && sectionMap.has(topic.sectionId)) {
        sectionMap.get(topic.sectionId).topics.push(topic);
      } else {
        uncategorized.push(topic);
      }
    });

    const result = [];
    sections.forEach(s => {
      const group = sectionMap.get(s.id);
      if (group.topics.length > 0 || !search) {
        result.push(group);
      }
    });
    if (uncategorized.length > 0) {
      result.push({ id: '__uncategorized', name: 'Non classés', topics: uncategorized });
    }

    return result;
  }, [filtered, sections, search]);

  const TopicCard = ({ topic }) => (
    <article
      onClick={() => onTopicClick?.(topic)}
      className="group relative bg-white dark:bg-stone-800 rounded-xl border border-stone-200
        dark:border-stone-700 p-5 cursor-pointer transition-all duration-200
        hover:shadow-lg hover:shadow-teal-500/5 hover:border-teal-300 dark:hover:border-teal-700
        hover:-translate-y-0.5"
    >
      {/* Top row: pin + bookmark */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {topic.pinned && (
            <Pin className="w-4 h-4 text-teal-500 fill-teal-500" />
          )}
        </div>
        <BookmarkButton
          bookmarked={topic.bookmarked}
          onToggle={(val) => onToggleBookmark?.(topic.id, val)}
          size="sm"
        />
      </div>

      {/* Title */}
      <h3
        className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-2
          group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors line-clamp-2"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {topic.title}
      </h3>

      {/* Tags */}
      {topic.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {topic.tags.slice(0, 4).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-stone-100 dark:bg-stone-700 text-stone-500
              dark:text-stone-400 text-xs rounded-full">
              {tag}
            </span>
          ))}
          {topic.tags.length > 4 && (
            <span className="text-xs text-stone-400">+{topic.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-700/50">
        <div className="flex items-center gap-3">
          {topic.authors?.length > 0 && (
            <AvatarGroup users={topic.authors} max={3} size="sm" />
          )}
          {topic.readingTime && (
            <span className="flex items-center gap-1 text-xs text-stone-400">
              <Clock className="w-3 h-3" />
              {readingTime(topic.readingTime)}
            </span>
          )}
        </div>
        <span className="text-xs text-stone-400">
          {relativeDate(topic.updatedAt || topic.createdAt)}
        </span>
      </div>
    </article>
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${activeTab === 'all'
              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
        >
          <BookOpen className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Tous les sujets
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${activeTab === 'bookmarks'
              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
        >
          <Bookmark className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Mes signets
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="Rechercher un sujet..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700
            bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100
            placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40
            transition-shadow"
        />
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <Tag className="w-4 h-4 text-stone-400 mr-1" />
          {allTags.map(tag => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all
                  ${active
                    ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 ring-1 ring-teal-300 dark:ring-teal-700 scale-105'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-stone-500 dark:text-stone-400">
        {filtered.length} sujet{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grouped by sections */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-teal-500" />
          </div>
          <h3 className="text-lg font-semibold text-stone-700 dark:text-stone-200" style={{ fontFamily: 'var(--font-heading)' }}>
            {activeTab === 'bookmarks' ? 'Aucun signet' : 'Aucun sujet trouvé'}
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-sm">
            {activeTab === 'bookmarks'
              ? 'Ajoutez des sujets à vos signets pour les retrouver ici.'
              : search || selectedTags.length
                ? 'Essayez de modifier vos filtres ou votre recherche.'
                : 'La base de connaissances est vide. Commencez par créer un premier sujet !'}
          </p>
          {onNewTopic && !search && activeTab === 'all' && (
            <button
              onClick={onNewTopic}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm
                font-medium transition-colors"
            >
              Créer un sujet
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(section => (
            <div key={section.id}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center gap-2 mb-4 group/header w-full text-left"
              >
                {collapsedSections[section.id]
                  ? <ChevronRight className="w-4 h-4 text-stone-400" />
                  : <ChevronDown className="w-4 h-4 text-stone-400" />
                }
                <h2
                  className="text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400
                    group-hover/header:text-teal-600 dark:group-hover/header:text-teal-400 transition-colors"
                >
                  {section.name}
                </h2>
                <span className="text-xs text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                  {section.topics.length}
                </span>
              </button>

              {!collapsedSections[section.id] && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {section.topics.map(topic => (
                    <TopicCard key={topic.id} topic={topic} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
