import React, { useRef, useEffect, useState } from 'react'
import NovaChatMessage from './NovaChatMessage'
import NovaChatTyping from './NovaChatTyping'
import NovaChatWelcome from './NovaChatWelcome'

export default function NovaChatPanel({ messages, isTyping, isConnected, onSend, onClose }) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    // Focus input when panel opens
    const timer = setTimeout(() => inputRef.current?.focus(), 300)
    return () => clearTimeout(timer)
  }, [])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    onSend(text)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[min(500px,calc(100vh-6rem))] flex flex-col bg-white rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-200/80 overflow-hidden nova-animate-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-500 text-white shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🌱</span>
          <div>
            <h2 className="text-sm font-semibold leading-none">Nova</h2>
            <p className="text-[10px] mt-0.5 text-teal-100">
              {isConnected ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-300' : 'bg-stone-300'}`} />
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/15 transition-colors"
          aria-label="Fermer le chat"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-stone-50/50 min-h-0">
        {messages.length === 0 && !isTyping ? (
          <NovaChatWelcome onSuggestion={onSend} />
        ) : (
          <>
            {messages.map((msg, i) => (
              <NovaChatMessage key={msg.id || i} message={msg} isLast={i === messages.length - 1} />
            ))}
            {isTyping && <NovaChatTyping />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-stone-200 px-3 py-2.5 bg-white shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Demandez à Nova..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-all max-h-24"
            style={{ fontFamily: 'var(--font-body)' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
            aria-label="Envoyer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
