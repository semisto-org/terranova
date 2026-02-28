import React, { useState, useEffect, useCallback } from 'react'
import * as Sentry from '@sentry/react'
import { usePage } from '@inertiajs/react'
import { apiRequest } from '../../lib/api'
import NovaChatButton from './NovaChatButton'
import NovaChatPanel from './NovaChatPanel'

const STORAGE_KEY = 'nova-chat-messages'
const DEBUG = true // Nova chat debug logging

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
  const { component: currentPage, url: currentUrl } = usePage()
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
    if (abortRef.current) {
      if (DEBUG) console.log('[Nova] Aborting previous in-flight request')
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    if (DEBUG) console.log('[Nova] Sending message:', text.substring(0, 80))

    try {
      const data = await apiRequest('/api/v1/nova/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, page: currentPage, url: currentUrl }),
        signal: controller.signal,
      })
      if (DEBUG) console.log('[Nova] Response received:', JSON.stringify(data).substring(0, 200))
      if (data.error) {
        Sentry.captureMessage(`Nova chat error response: ${data.error}`, { level: 'warning', extra: { userMessage: text.substring(0, 100) } })
      }
      const novaMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || data.error || "Désolée, je n'ai pas pu répondre 🌱",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, novaMessage])
      if (!isOpen) setUnreadCount((c) => c + 1)
    } catch (err) {
      if (err.name === 'AbortError') {
        if (DEBUG) console.log('[Nova] Request aborted')
        return
      }
      console.error('[Nova] Request failed:', err.message, err)
      Sentry.captureException(err, { tags: { feature: 'nova-chat' }, extra: { userMessage: text.substring(0, 100) } })
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
