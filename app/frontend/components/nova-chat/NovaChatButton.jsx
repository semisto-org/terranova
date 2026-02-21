import React from 'react'

export default function NovaChatButton({ isOpen, unreadCount, onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-teal-600 text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700 hover:shadow-xl hover:shadow-teal-600/30 hover:scale-105 active:scale-95 transition-all duration-200 ease-out flex items-center justify-center group"
      aria-label={isOpen ? 'Fermer le chat Nova' : 'Ouvrir le chat Nova'}
    >
      <span
        className={`text-2xl transition-transform duration-300 ${isOpen ? 'rotate-90 scale-0 opacity-0 absolute' : 'rotate-0 scale-100'}`}
      >
        🌱
      </span>
      <svg
        className={`w-6 h-6 transition-all duration-300 ${isOpen ? 'rotate-0 scale-100' : '-rotate-90 scale-0 opacity-0 absolute'}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>

      {/* Unread badge */}
      {!isOpen && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center nova-animate-badge">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}

      {/* Pulse ring */}
      {!isOpen && (
        <span className="absolute inset-0 rounded-full bg-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      )}
    </button>
  )
}
