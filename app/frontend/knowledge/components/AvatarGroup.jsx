import React, { useState } from 'react';

export default function AvatarGroup({ users = [], max = 4, size = 'md' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const sizes = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  const sizeClass = sizes[size] || sizes.md;
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  const getInitials = (user) => {
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  const colors = [
    'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500',
    'bg-emerald-500', 'bg-purple-500', 'bg-sky-500', 'bg-orange-500',
  ];

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((user, i) => (
        <div
          key={user.id || i}
          className="relative"
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.firstName}
              className={`${sizeClass} rounded-full ring-2 ring-white dark:ring-stone-900 object-cover`}
            />
          ) : (
            <div
              className={`${sizeClass} rounded-full ring-2 ring-white dark:ring-stone-900
                ${colors[i % colors.length]} text-white font-medium
                flex items-center justify-center`}
            >
              {getInitials(user)}
            </div>
          )}
          {hoveredIndex === i && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1
              bg-stone-800 dark:bg-stone-700 text-white text-xs rounded-md whitespace-nowrap
              pointer-events-none z-20 shadow-lg animate-in fade-in duration-150">
              {user.firstName} {user.lastName || ''}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px
                border-4 border-transparent border-t-stone-800 dark:border-t-stone-700" />
            </div>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={`${sizeClass} rounded-full ring-2 ring-white dark:ring-stone-900
            bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300
            font-medium flex items-center justify-center`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
