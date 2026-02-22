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

  // AbortController ref for cancelling in-flight requests
  const abortRef = React.useRef(null)

  // Cancel pending request when panel closes
  useEffect(() => {
    if (!isOpen && abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
  }, [isOpen])

  const handleSend = useCallback(async (text) => {
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    // Cancel any previous in-flight request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch('/api/v1/nova/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      })
      const data = await response.json()
      const novaMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || data.error || "Désolée, je n'ai pas pu répondre 🌱",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, novaMessage])
      if (!isOpen) setUnreadCount((c) => c + 1)
    } catch (err) {
      if (err.name === 'AbortError') return
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Désolée, je n'ai pas pu me connecter. Réessaie dans un moment 🌱",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      abortRef.current = null
      setIsTyping(false)
    }
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
