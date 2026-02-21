import React, { useState, useEffect, useCallback } from 'react'
import NovaChatButton from './NovaChatButton'
import NovaChatPanel from './NovaChatPanel'

const STORAGE_KEY = 'nova-chat-messages'

function loadMessages() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveMessages(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {}
}

export default function NovaChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(loadMessages)
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    saveMessages(messages)
  }, [messages])

  // Reset unread when opening
  useEffect(() => {
    if (isOpen) setUnreadCount(0)
  }, [isOpen])

  const handleSend = useCallback((text) => {
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])

    // TODO: Replace with WebSocket send
    // Simulate Nova response for now
    setIsTyping(true)
    setTimeout(() => {
      const novaMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Merci pour ta question ! Je suis encore en cours de connexion avec le backend. Eddy branche bientôt le WebSocket 🔌🌱",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, novaMessage])
      setIsTyping(false)
      if (!isOpen) setUnreadCount((c) => c + 1)
    }, 1500)
  }, [isOpen])

  return (
    <>
      {isOpen && (
        <NovaChatPanel
          messages={messages}
          isTyping={isTyping}
          isConnected={isConnected}
          onSend={handleSend}
          onClose={() => setIsOpen(false)}
        />
      )}
      <NovaChatButton
        isOpen={isOpen}
        unreadCount={unreadCount}
        onClick={() => setIsOpen((o) => !o)}
      />
    </>
  )
}
