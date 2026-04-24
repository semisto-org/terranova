import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

const ALL_TOOLBAR_ITEMS = [
  'bold', 'italic', 'strike',
  '|',
  'h2', 'h3',
  '|',
  'bulletList', 'orderedList', 'blockquote',
  '|',
  'link', 'horizontalRule', 'code',
]

function normalizeUrl(url) {
  const trimmed = (url || '').trim()
  if (!trimmed) return ''
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function LinkButton({ editor, btnClass }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const popoverRef = useRef(null)
  const inputRef = useRef(null)
  const isActive = editor.isActive('link')

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const handleOpen = () => {
    const existing = editor.getAttributes('link').href || ''
    setValue(existing)
    setOpen(true)
  }

  const handleSave = () => {
    const url = normalizeUrl(value)
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
    setOpen(false)
  }

  const handleRemove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setOpen(false)
  }

  return (
    <div ref={popoverRef} className="relative">
      <button type="button" onClick={handleOpen} className={btnClass(isActive)} title="Ajouter un lien">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-1.5 shadow-lg">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleSave() }
              if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
            }}
            placeholder="https://exemple.com"
            className="w-56 rounded border border-stone-200 px-2 py-1 text-xs focus:border-stone-400 focus:outline-none"
          />
          <button type="button" onClick={handleSave} className="rounded bg-stone-800 px-2 py-1 text-xs text-white hover:bg-stone-700">OK</button>
          {isActive && (
            <button type="button" onClick={handleRemove} className="rounded px-2 py-1 text-xs text-stone-500 hover:bg-stone-100" title="Retirer le lien">
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function MenuBar({ editor, toolbar }) {
  if (!editor) return null

  const items = toolbar || ALL_TOOLBAR_ITEMS

  const btnClass = (active) =>
    `rounded px-2 py-1 text-sm transition-colors ${
      active
        ? 'bg-stone-800 text-white'
        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
    }`

  const buttons = {
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
          <line x1="9" y1="6" x2="21" y2="6" />
          <line x1="9" y1="12" x2="21" y2="12" />
          <line x1="9" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    ),
    orderedList: (
      <button key="orderedList" type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Liste numérotée">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <text x="2" y="8" fontSize="7" fontWeight="bold" stroke="none" fontFamily="sans-serif">1</text>
          <text x="2" y="14.5" fontSize="7" fontWeight="bold" stroke="none" fontFamily="sans-serif">2</text>
          <text x="2" y="21" fontSize="7" fontWeight="bold" stroke="none" fontFamily="sans-serif">3</text>
          <line x1="10" y1="6" x2="21" y2="6" fill="none" />
          <line x1="10" y1="12" x2="21" y2="12" fill="none" />
          <line x1="10" y1="18" x2="21" y2="18" fill="none" />
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
    link: <LinkButton key="link" editor={editor} btnClass={btnClass} />,
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
      {items.map((item) => {
        if (item === '|') return <div key={`sep-${separatorIndex++}`} className="mx-1 h-5 w-px bg-stone-200" />
        return buttons[item] || null
      })}
    </div>
  )
}

const SimpleEditor = forwardRef(function SimpleEditor(
  { content, onUpdate, placeholder, minHeight = '200px', toolbar },
  ref,
) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-blue-600 underline underline-offset-2 hover:text-blue-700',
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML())
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-stone prose-sm max-w-none px-4 py-3 focus:outline-none',
        style: `min-height: ${minHeight}`,
      },
    },
  })

  useImperativeHandle(ref, () => ({
    setContent: (html, { focus = true, atEnd = true } = {}) => {
      if (!editor) return
      editor.commands.setContent(html || '', { emitUpdate: true })
      if (focus) {
        if (atEnd) editor.commands.focus('end')
        else editor.commands.focus()
      }
    },
    clear: () => {
      if (!editor) return
      editor.commands.clearContent(true)
    },
    focus: () => editor?.commands.focus('end'),
  }), [editor])

  return (
    <div className="overflow-hidden rounded-lg border border-stone-300 bg-white transition-all focus-within:border-[#B01A19] focus-within:ring-2 focus-within:ring-[#B01A19]/10">
      <MenuBar editor={editor} toolbar={toolbar} />
      <EditorContent editor={editor} />
    </div>
  )
})

export default SimpleEditor
