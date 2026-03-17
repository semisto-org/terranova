import React, { useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { getNextActiveIndex } from './globalSearchKeyboard'

const RECENT_KEY = 'terranova.global_search.recent'
const flattenSections = (sections) => sections.flatMap((section) => section.items.map((item) => ({ ...item, section: section.section })))
const loadRecent = () => { try { return JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]') } catch (_) { return [] } }
const saveRecent = (query) => {
  if (!query?.trim()) return
  const current = loadRecent().filter((item) => item !== query)
  window.localStorage.setItem(RECENT_KEY, JSON.stringify([query, ...current].slice(0, 8)))
}

export default function GlobalSearchPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sections, setSections] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState([])
  const inputRef = useRef(null)
  const items = useMemo(() => flattenSections(sections), [sections])

  useEffect(() => { setRecent(loadRecent()) }, [])
  useEffect(() => {
    const onShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen((prev) => !prev) }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [])
  useEffect(() => { if (open) window.setTimeout(() => inputRef.current?.focus(), 20) }, [open])
  useEffect(() => {
    if (!open || !query.trim()) { setSections([]); setActiveIndex(-1); return }
    const timer = window.setTimeout(async () => {
      setLoading(true)
      const payload = await apiRequest(`/api/v1/search/global?q=${encodeURIComponent(query)}&limit=24`)
      setSections(payload.sections || [])
      setActiveIndex((payload.sections || []).length ? 0 : -1)
      setLoading(false)
    }, 180)
    return () => window.clearTimeout(timer)
  }, [open, query])

  const openItem = (item, newTab = false) => {
    saveRecent(query); setRecent(loadRecent())
    if (newTab) window.open(item.url, '_blank', 'noopener')
    else window.location.href = item.url
    setOpen(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-500 hover:border-stone-300 transition-colors"><span className="hidden sm:inline">Rechercher...</span><span className="text-xs text-stone-400 hidden md:inline">⌘K</span></button>
      {open && <div className="fixed inset-0 z-50 bg-black/40 p-4 md:p-12" onClick={() => setOpen(false)}><div className="mx-auto max-w-3xl rounded-xl bg-white shadow-2xl border border-stone-200" onClick={(e) => e.stopPropagation()}><div className="border-b border-stone-200 p-3"><input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((current) => getNextActiveIndex(current, event.key, items.length)); return }
        if (event.key === 'Enter' && activeIndex >= 0) { event.preventDefault(); openItem(items[activeIndex], event.metaKey || event.ctrlKey) }
      }} className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" placeholder="Rechercher projets, contacts, plantes, activités..." /></div>
      <div className="max-h-[65vh] overflow-y-auto p-2">{!query.trim() && recent.length > 0 && <div className="px-2 py-3 text-sm text-stone-600"><div className="mb-2 font-medium">Recherches récentes</div><div className="flex flex-wrap gap-2">{recent.map((item) => <button key={item} onClick={() => setQuery(item)} className="rounded-full border border-stone-200 px-3 py-1 text-xs">{item}</button>)}</div></div>}
      {loading && <div className="px-3 py-5 text-sm text-stone-500">Recherche instantanée…</div>}
      {!loading && query.trim() && items.length === 0 && <div className="px-3 py-6 text-sm text-stone-500">Aucun résultat pour <strong>{query}</strong>.</div>}
      {!loading && sections.map((section) => <div key={section.section} className="mb-3"><div className="px-2 py-1 text-xs uppercase tracking-wide text-stone-400">{section.section}</div>{section.items.map((item) => <button key={`${item.type}-${item.id}`} className="w-full text-left rounded-lg px-2 py-2 hover:bg-stone-50" onClick={() => openItem(item)}><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-medium text-stone-800">{item.title}</div><div className="text-xs text-stone-500" dangerouslySetInnerHTML={{ __html: item.snippet || '' }} /></div><span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">{item.type}</span></div></button>)}</div>)}
      {query.trim() && <div className="border-t border-stone-100 p-2 text-xs text-stone-400">Quick action: <a className="text-violet-700" href="/lab">Créer une tâche (Lab)</a></div>}
      </div></div></div>}
    </>
  )
}
