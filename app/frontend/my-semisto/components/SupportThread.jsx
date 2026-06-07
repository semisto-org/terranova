import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import { myApiRequest } from '../lib/api'
import { myApiPath } from '../lib/paths'

const COLOR_ACADEMY = '#B01A19'

function formatTimestamp(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// A chat-style support thread between the participant and the Academy team.
// My messages are right-aligned (accent), the team's are left-aligned (grey).
export default function SupportThread({ trainingId }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)

  const load = useCallback(() => {
    return myApiRequest(`${myApiPath('/academy')}/${trainingId}/messages`)
      .then((data) => {
        setMessages(data.messages || [])
        setError(null)
      })
      .catch((err) => setError(err.message))
  }, [trainingId])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  // Keep the latest message in view after each load.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  const send = async () => {
    const text = body.trim()
    if (!text || sending) return
    setSending(true)
    setError(null)
    try {
      await myApiRequest(`${myApiPath('/academy')}/${trainingId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: text }),
      })
      setBody('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="my-animate-section" style={{ animationDelay: '180ms' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLOR_ACADEMY }} />
        <h2 className="text-lg text-stone-800" style={{ fontFamily: 'var(--font-heading)' }}>
          Nous contacter
        </h2>
      </div>

      <div className="rounded-xl bg-white border border-stone-200 overflow-hidden">
        {/* Messages */}
        <div className="px-4 py-4 max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-stone-400" />
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="text-center py-8">
              <div
                className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3"
                style={{ backgroundColor: '#B01A190D' }}
              >
                <MessageSquare size={20} style={{ color: COLOR_ACADEMY }} />
              </div>
              <p className="text-sm text-stone-500">
                Une question ? Écris-nous, on te répond ici.
              </p>
            </div>
          )}

          {!loading && messages.length > 0 && (
            <div className="space-y-3">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-stone-100 p-3 bg-stone-50">
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            placeholder="Écris ton message…"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#B01A19]/20 focus:border-[#B01A19] resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={send}
              disabled={sending || !body.trim()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: COLOR_ACADEMY }}
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }) {
  const mine = message.from === 'me'
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className="rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line"
          style={
            mine
              ? { backgroundColor: COLOR_ACADEMY, color: 'white', borderBottomRightRadius: '4px' }
              : { backgroundColor: '#f5f5f4', color: '#44403c', borderBottomLeftRadius: '4px' }
          }
        >
          {message.body}
        </div>
        <span className="text-[11px] text-stone-400 mt-1 px-1">
          {mine ? 'Toi' : "L'équipe"} · {formatTimestamp(message.createdAt)}
        </span>
      </div>
    </div>
  )
}
