import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  MessageSquare,
  Send,
  RefreshCw,
  AlertCircle,
  Inbox,
} from 'lucide-react'
import { apiRequest } from '@/lib/api'

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function threadUnread(thread) {
  if (typeof thread.unread === 'number') return thread.unread
  if (thread.unread) return 1
  return (thread.messages || []).filter(
    (m) => m.sender === 'participant' && !m.readAt,
  ).length
}

export default function TrainingMessagesTab({ trainingId, onUnreadChange }) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedContactId, setSelectedContactId] = useState(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiRequest(`/api/v1/academy/trainings/${trainingId}/messages`)
      const list = data?.threads || []
      setThreads(list)
      setSelectedContactId((prev) => {
        if (prev && list.some((t) => t.contactId === prev)) return prev
        return list[0]?.contactId ?? null
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [trainingId])

  useEffect(() => {
    load()
  }, [load])

  // Surface total unread count to the parent (for the tab label badge).
  useEffect(() => {
    if (!onUnreadChange) return
    const total = threads.reduce((sum, t) => sum + threadUnread(t), 0)
    onUnreadChange(total)
  }, [threads, onUnreadChange])

  const selectedThread = threads.find((t) => t.contactId === selectedContactId) || null

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' })
  }, [selectedThread])

  async function handleReply(e) {
    e.preventDefault()
    if (!reply.trim() || !selectedThread) return
    setSending(true)
    setError(null)
    try {
      await apiRequest(`/api/v1/academy/trainings/${trainingId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ contact_id: selectedThread.contactId, body: reply.trim() }),
      })
      setReply('')
      // Refetch — replying marks inbound messages as read server-side.
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Messages</h3>
          <p className="text-sm text-stone-500 mt-1">
            {threads.length} conversation{threads.length !== 1 ? 's' : ''} avec les participants
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && threads.length === 0 ? (
        <div className="bg-white rounded-lg p-12 border border-stone-200 text-center text-stone-500">
          Chargement…
        </div>
      ) : threads.length === 0 ? (
        <div className="bg-white rounded-lg p-12 border border-stone-200 text-center">
          <Inbox className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500">Aucun message reçu pour le moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Liste des conversations */}
          <div className="md:col-span-1 bg-white rounded-xl border border-stone-200 overflow-hidden">
            <ul className="divide-y divide-stone-100 max-h-[480px] overflow-y-auto">
              {threads.map((thread) => {
                const unread = threadUnread(thread)
                const isActive = thread.contactId === selectedContactId
                return (
                  <li key={thread.contactId}>
                    <button
                      type="button"
                      onClick={() => setSelectedContactId(thread.contactId)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                        isActive ? 'bg-red-50' : 'hover:bg-stone-50'
                      }`}
                    >
                      <span className={`text-sm truncate ${unread > 0 ? 'font-semibold text-stone-900' : 'font-medium text-stone-700'}`}>
                        {thread.contactName || 'Participant'}
                      </span>
                      {unread > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#B01A19] text-white text-xs font-semibold shrink-0">
                          {unread}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Fil de la conversation sélectionnée */}
          <div className="md:col-span-2 bg-white rounded-xl border border-stone-200 flex flex-col min-h-[480px]">
            {selectedThread ? (
              <>
                <div className="px-5 py-3 border-b border-stone-200">
                  <h4 className="font-semibold text-stone-900">
                    {selectedThread.contactName || 'Participant'}
                  </h4>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 max-h-[360px]">
                  {(selectedThread.messages || []).length === 0 ? (
                    <p className="text-sm text-stone-500 text-center py-8">Aucun message</p>
                  ) : (
                    (selectedThread.messages || []).map((msg) => {
                      const fromTeam = msg.sender === 'team'
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${fromTeam ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            fromTeam
                              ? 'bg-[#B01A19] text-white rounded-br-sm'
                              : 'bg-stone-100 text-stone-900 rounded-bl-sm'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                            <span className={`block text-xs mt-1 ${fromTeam ? 'text-red-100' : 'text-stone-400'}`}>
                              {formatDateTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleReply} className="border-t border-stone-200 p-3 flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={2}
                    placeholder="Votre réponse…"
                    className="flex-1 resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-[#B01A19] focus:outline-none focus:ring-1 focus:ring-[#B01A19]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply(e)
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#B01A19] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1514] disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Envoi…' : 'Répondre'}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-stone-400">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                  <p className="text-sm">Sélectionnez une conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
