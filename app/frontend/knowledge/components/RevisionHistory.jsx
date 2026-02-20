import React from 'react';
import { X, Clock } from 'lucide-react';
import AvatarGroup from './AvatarGroup';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function RevisionHistory({ revisions = [], isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[80vh] bg-white dark:bg-stone-900
        rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700">
          <h3
            className="text-lg font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <Clock className="w-5 h-5 text-teal-500" />
            Historique des modifications
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300
              hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {revisions.length === 0 ? (
            <p className="text-sm text-stone-400 italic text-center py-8">
              Aucune révision enregistrée.
            </p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-2 bottom-2 w-px bg-stone-200 dark:bg-stone-700" />

              <div className="space-y-6">
                {revisions.map((rev, idx) => (
                  <div key={rev.id || idx} className="relative flex gap-4 pl-2">
                    {/* Dot */}
                    <div className={`relative z-10 mt-1 w-5 h-5 rounded-full flex items-center justify-center
                      ring-4 ring-white dark:ring-stone-900
                      ${idx === 0
                        ? 'bg-teal-500'
                        : 'bg-stone-300 dark:bg-stone-600'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>

                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AvatarGroup
                          users={[{ id: rev.authorId, firstName: rev.authorFirstName, lastName: rev.authorLastName, avatar: rev.authorAvatar }]}
                          max={1}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                          {rev.authorFirstName}
                        </span>
                      </div>
                      <p className="text-sm text-stone-600 dark:text-stone-300">
                        {rev.summary || 'Modification'}
                      </p>
                      <span className="text-xs text-stone-400 mt-1 block">
                        {formatDate(rev.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
