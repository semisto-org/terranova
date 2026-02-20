import React from 'react';

const CATEGORY_STYLES = {
  research: {
    label: 'Recherche',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
    ring: 'ring-blue-500/20',
  },
  regulation: {
    label: 'Réglementation',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-500/20',
  },
  funding: {
    label: 'Financement',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-500/20',
  },
  strategy: {
    label: 'Stratégie',
    bg: 'bg-violet-100 dark:bg-violet-900/40',
    text: 'text-violet-700 dark:text-violet-300',
    ring: 'ring-violet-500/20',
  },
  technical: {
    label: 'Technique',
    bg: 'bg-rose-100 dark:bg-rose-900/40',
    text: 'text-rose-700 dark:text-rose-300',
    ring: 'ring-rose-500/20',
  },
  other: {
    label: 'Autre',
    bg: 'bg-stone-100 dark:bg-stone-800/40',
    text: 'text-stone-600 dark:text-stone-300',
    ring: 'ring-stone-500/20',
  },
};

export default function CategoryBadge({ category, size = 'sm', className = '' }) {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.other;
  const sizeClasses = size === 'lg'
    ? 'px-3 py-1 text-sm'
    : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ring-1 ring-inset transition-colors
        ${style.bg} ${style.text} ${style.ring} ${sizeClasses} ${className}`}
    >
      {style.label}
    </span>
  );
}

export { CATEGORY_STYLES };
