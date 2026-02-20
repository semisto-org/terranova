import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';

export default function BookmarkButton({ bookmarked = false, onToggle, size = 'md' }) {
  const [animating, setAnimating] = useState(false);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (e) => {
    e.stopPropagation();
    setAnimating(true);
    onToggle?.(!bookmarked);
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative p-1.5 rounded-lg transition-colors
        ${bookmarked
          ? 'text-teal-500 hover:text-teal-600'
          : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
        }`}
      title={bookmarked ? 'Retirer des signets' : 'Ajouter aux signets'}
    >
      <Bookmark
        className={`${sizes[size] || sizes.md} transition-transform duration-300 ease-out
          ${animating ? 'scale-125' : 'scale-100'}
          ${bookmarked ? 'fill-current' : ''}`}
      />
    </button>
  );
}
