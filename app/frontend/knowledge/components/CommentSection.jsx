import React, { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import AvatarGroup from './AvatarGroup';

function relativeDate(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 30) return `Il y a ${diffDays} jours`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

export default function CommentSection({
  comments = [],
  currentUserId,
  onAddComment,
  onDeleteComment,
}) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    await onAddComment?.(text.trim());
    setText('');
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <h3
        className="text-lg font-semibold text-stone-900 dark:text-stone-100"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Commentaires ({comments.length})
      </h3>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Ajouter un commentaire..."
          rows={2}
          className="flex-1 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700
            bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100
            placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40
            transition-shadow text-sm resize-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="self-end px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700
            disabled:bg-teal-600/50 text-white text-sm font-medium
            transition-colors flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.map((comment, idx) => (
          <div
            key={comment.id || idx}
            className="flex gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50
              animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <AvatarGroup
              users={[{ id: comment.authorId, firstName: comment.authorFirstName, lastName: comment.authorLastName, avatar: comment.authorAvatar }]}
              max={1}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  {comment.authorFirstName}
                </span>
                <span className="text-xs text-stone-400">
                  {relativeDate(comment.createdAt)}
                </span>
                {currentUserId && comment.authorId === currentUserId && onDeleteComment && (
                  <button
                    onClick={() => onDeleteComment(comment.id)}
                    className="ml-auto text-stone-400 hover:text-red-500 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-stone-400 italic text-center py-4">
            Aucun commentaire pour l'instant.
          </p>
        )}
      </div>
    </div>
  );
}
