import React from 'react'

function formatTime(date) {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function renderContent(text) {
  // Simple rich text: bold, inline code, links
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/\S+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1 py-0.5 bg-stone-100 rounded text-sm font-mono">{part.slice(1, -1)}</code>
    }
    if (/^https?:\/\/\S+$/.test(part)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">{part}</a>
    }
    return part
  })
}

export default function NovaChatMessage({ message, isLast }) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex gap-2.5 nova-animate-message ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{ animationFillMode: 'both', animationDelay: isLast ? '50ms' : '0ms' }}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center text-sm shrink-0 mt-0.5">
          🌱
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? 'order-1' : ''}`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-teal-600 text-white rounded-br-md'
              : 'bg-white text-stone-700 rounded-bl-md shadow-sm border border-stone-100'
          }`}
        >
          {renderContent(message.content)}
        </div>
        <p className={`text-[10px] text-stone-400 mt-1 ${isUser ? 'text-right' : 'text-left ml-1'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}
