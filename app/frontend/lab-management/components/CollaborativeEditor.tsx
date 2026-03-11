import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { apiRequest } from '@/lib/api'
import { getCableConsumer } from '@/lib/cable'
import { MemberDisplay, type MemberOption } from './MemberPicker'

interface CollaborativeEditorProps {
  projectId: string
  initialContent: string
  currentMember: {
    id: string
    firstName: string
    lastName: string
  }
  members: MemberOption[]
}

const TOOLBAR_ITEMS = [
  'bold', 'italic', 'strike',
  '|',
  'h2', 'h3',
  '|',
  'bulletList', 'orderedList', 'blockquote',
  '|',
  'horizontalRule', 'code',
]

function MenuBar({ editor }: { editor: any }) {
  if (!editor) return null

  const btnClass = (active: boolean) =>
    `rounded px-2 py-1 text-sm transition-colors ${
      active
        ? 'bg-stone-800 text-white'
        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
    }`

  const buttons: Record<string, React.ReactNode> = {
    bold: (
      <button key="bold" type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Gras">
        <strong>B</strong>
      </button>
    ),
    italic: (
      <button key="italic" type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italique">
        <em>I</em>
      </button>
    ),
    strike: (
      <button key="strike" type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))} title="Barré">
        <s>S</s>
      </button>
    ),
    h2: (
      <button key="h2" type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Titre 2">
        H2
      </button>
    ),
    h3: (
      <button key="h3" type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))} title="Titre 3">
        H3
      </button>
    ),
    bulletList: (
      <button key="bulletList" type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Liste à puces">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
          <line x1="9" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="9" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    ),
    orderedList: (
      <button key="orderedList" type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Liste numérotée">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <text x="2" y="8" fontSize="7" fontWeight="bold" stroke="none" fontFamily="sans-serif">1</text>
          <text x="2" y="14.5" fontSize="7" fontWeight="bold" stroke="none" fontFamily="sans-serif">2</text>
          <text x="2" y="21" fontSize="7" fontWeight="bold" stroke="none" fontFamily="sans-serif">3</text>
          <line x1="10" y1="6" x2="21" y2="6" fill="none" /><line x1="10" y1="12" x2="21" y2="12" fill="none" /><line x1="10" y1="18" x2="21" y2="18" fill="none" />
        </svg>
      </button>
    ),
    blockquote: (
      <button key="blockquote" type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Citation">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    ),
    horizontalRule: (
      <button key="hr" type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass(false)} title="Ligne horizontale">
        —
      </button>
    ),
    code: (
      <button key="code" type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={btnClass(editor.isActive('code'))} title="Code inline">
        {'</>'}
      </button>
    ),
  }

  let separatorIndex = 0

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-stone-200 px-3 py-2">
      {TOOLBAR_ITEMS.map((item) => {
        if (item === '|') return <div key={`sep-${separatorIndex++}`} className="mx-1 h-5 w-px bg-stone-200" />
        return buttons[item] || null
      })}
    </div>
  )
}

export function CollaborativeEditor({ projectId, initialContent, currentMember, members }: CollaborativeEditorProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'remote-update'>('idle')
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [connectedUsers, setConnectedUsers] = useState<Array<{ name: string }>>([])
  const subscriptionRef = useRef<any>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editorRef = useRef<any>(null)
  const isFocusedRef = useRef(false)
  const isRemoteUpdateRef = useRef(false)
  const lastSavedHtmlRef = useRef(initialContent)
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const lastTypingBroadcastRef = useRef(0)

  const memberName = `${currentMember.firstName} ${currentMember.lastName}`

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'prose prose-stone prose-sm max-w-none px-4 py-3 focus:outline-none',
        style: 'min-height: 200px',
      },
    },
    onFocus: () => { isFocusedRef.current = true },
    onBlur: () => { isFocusedRef.current = false },
  })

  editorRef.current = editor

  // Auto-save with debounce: save to DB via API, then notify others via ActionCable
  const saveNotes = useCallback(async () => {
    if (!editorRef.current) return
    const html = editorRef.current.getHTML()
    // Skip if content hasn't changed since last save
    if (html === lastSavedHtmlRef.current) return
    setSaveStatus('saving')
    try {
      await apiRequest(`/api/v1/lab/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: html }),
      })
      lastSavedHtmlRef.current = html
      // Notify other clients that notes changed
      subscriptionRef.current?.send({
        type: 'notes_updated',
        by: memberName,
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2000)
    } catch (e) {
      console.warn('Failed to save notes:', e)
      setSaveStatus('idle')
    }
  }, [projectId, memberName])

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(saveNotes, 1500)
  }, [saveNotes])

  // Watch for editor changes
  useEffect(() => {
    if (!editor) return
    const handler = () => {
      if (isRemoteUpdateRef.current) return
      scheduleSave()
      // Throttle typing broadcasts to once per 2s
      const now = Date.now()
      if (now - lastTypingBroadcastRef.current > 2000) {
        lastTypingBroadcastRef.current = now
        subscriptionRef.current?.send({ type: 'typing', user: { name: memberName } })
      }
    }
    editor.on('update', handler)
    return () => { editor.off('update', handler) }
  }, [editor, scheduleSave, memberName])

  // ActionCable: presence + remote update notifications
  useEffect(() => {
    if (!editor) return

    const cable = getCableConsumer()
    const connectedUsersMap = new Map<string, ReturnType<typeof setTimeout>>()

    const subscription = cable.subscriptions.create(
      { channel: 'ProjectNotesChannel', project_id: projectId },
      {
        connected() {
          // Announce presence
          subscription.send({ type: 'presence', user: { name: memberName } })
        },
        received(data: any) {
          // Another user saved the notes — fetch and apply update
          if (data.type === 'notes_updated' && data.by !== memberName) {
            apiRequest(`/api/v1/lab/projects/${projectId}`).then(res => {
              if (res.notes != null && editorRef.current) {
                const currentHtml = editorRef.current.getHTML()
                if (res.notes !== currentHtml) {
                  // Preserve cursor position when editor is focused
                  const cursorPos = editorRef.current.state.selection.anchor
                  isRemoteUpdateRef.current = true
                  editorRef.current.commands.setContent(res.notes)
                  // Restore cursor, clamped to new document length
                  try {
                    const maxPos = editorRef.current.state.doc.content.size
                    editorRef.current.commands.setTextSelection(Math.min(cursorPos, maxPos))
                  } catch (_) {}
                  isRemoteUpdateRef.current = false
                  lastSavedHtmlRef.current = res.notes
                }
              }
            }).catch(() => {})
            setSaveStatus('remote-update')
            setTimeout(() => setSaveStatus(prev => prev === 'remote-update' ? 'idle' : prev), 3000)
          }

          // Presence: another user is on this page
          if (data.type === 'presence' && data.user && data.user.name !== memberName) {
            // Reset expiry timer for this user
            const existing = connectedUsersMap.get(data.user.name)
            if (existing) clearTimeout(existing)
            connectedUsersMap.set(data.user.name, setTimeout(() => {
              connectedUsersMap.delete(data.user.name)
              setConnectedUsers(Array.from(connectedUsersMap.keys()).map(name => ({ name })))
            }, 25000))
            setConnectedUsers(Array.from(connectedUsersMap.keys()).map(name => ({ name })))
          }

          // Typing indicator
          if (data.type === 'typing' && data.user && data.user.name !== memberName) {
            const name = data.user.name
            const existing = typingTimersRef.current.get(name)
            if (existing) clearTimeout(existing)
            typingTimersRef.current.set(name, setTimeout(() => {
              typingTimersRef.current.delete(name)
              setTypingUsers(Array.from(typingTimersRef.current.keys()))
            }, 4000))
            setTypingUsers(Array.from(typingTimersRef.current.keys()))
          }

          // User left
          if (data.type === 'presence_leave' && data.user) {
            const timer = connectedUsersMap.get(data.user.name)
            if (timer) clearTimeout(timer)
            connectedUsersMap.delete(data.user.name)
            setConnectedUsers(Array.from(connectedUsersMap.keys()).map(name => ({ name })))
          }
        },
        disconnected() {
          setConnectedUsers([])
          setTypingUsers([])
          connectedUsersMap.forEach(t => clearTimeout(t))
          connectedUsersMap.clear()
          typingTimersRef.current.forEach(t => clearTimeout(t))
          typingTimersRef.current.clear()
        },
      }
    )
    subscriptionRef.current = subscription

    // Heartbeat presence every 15s
    const presenceInterval = setInterval(() => {
      subscription.send({ type: 'presence', user: { name: memberName } })
    }, 15000)

    return () => {
      // Flush pending save before unmounting
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveNotes()
      }
      clearInterval(presenceInterval)
      try {
        subscription.send({ type: 'presence_leave', user: { name: memberName } })
      } catch (_) {}
      subscription.unsubscribe()
      subscriptionRef.current = null
      connectedUsersMap.forEach(t => clearTimeout(t))
      typingTimersRef.current.forEach(t => clearTimeout(t))
      typingTimersRef.current.clear()
    }
  }, [editor, projectId, memberName, saveNotes])

  return (
    <div>
      {/* Connected users indicator */}
      {connectedUsers.length > 0 && (
        <div className="flex items-center gap-3 mb-2">
          {connectedUsers.map((user, i) => (
            <div key={i} className="inline-flex items-center gap-1">
              <MemberDisplay name={user.name} members={members} size={20} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white transition-all focus-within:border-[#5B5781] focus-within:ring-2 focus-within:ring-[#5B5781]/10">
        <MenuBar editor={editor} />
        <EditorContent editor={editor} />

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-1 min-h-[16px]">
            {typingUsers.length > 0 && (
              <>
                <span className="flex gap-[3px] items-center">
                  <span className="w-1 h-1 rounded-full bg-[#5B5781] animate-bounce" style={{ animationDelay: '0ms', animationDuration: '800ms' }} />
                  <span className="w-1 h-1 rounded-full bg-[#5B5781] animate-bounce" style={{ animationDelay: '150ms', animationDuration: '800ms' }} />
                  <span className="w-1 h-1 rounded-full bg-[#5B5781] animate-bounce" style={{ animationDelay: '300ms', animationDuration: '800ms' }} />
                </span>
                <span className="text-[10px] text-[#5B5781] ml-1">
                  {typingUsers.length === 1
                    ? `${typingUsers[0].split(' ')[0]} écrit...`
                    : `${typingUsers.map(n => n.split(' ')[0]).join(', ')} écrivent...`
                  }
                </span>
              </>
            )}
          </div>
          <span className={`text-[10px] min-h-[16px] flex items-center transition-colors duration-300 ${
            saveStatus === 'saving' ? 'text-stone-400'
              : saveStatus === 'remote-update' ? 'text-blue-500'
              : saveStatus === 'saved' ? 'text-emerald-600'
              : 'text-stone-300'
          }`}>
            {saveStatus === 'saving' && 'Enregistrement...'}
            {saveStatus === 'saved' && 'Enregistré'}
            {saveStatus === 'remote-update' && 'Mis à jour par un collaborateur'}
            {saveStatus === 'idle' && 'Auto-enregistré'}
          </span>
        </div>
      </div>
    </div>
  )
}
