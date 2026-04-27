import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'
import { apiRequest } from '../../lib/api'

// Mirrors Projectable::PROJECT_TYPE_KEYS in app/models/concerns/projectable.rb.
const TYPE_KEY_TO_RUBY = {
  'lab-project': 'PoleProject',
  'training': 'Academy::Training',
  'design-project': 'Design::Project',
  'guild': 'Guild',
} as const

const RUBY_TO_TYPE_KEY = {
  PoleProject: 'lab-project',
  'Academy::Training': 'training',
  'Design::Project': 'design-project',
  Guild: 'guild',
} as const

export type ProjectableTypeKey = keyof typeof TYPE_KEY_TO_RUBY
export type ProjectableRubyType = keyof typeof RUBY_TO_TYPE_KEY

export interface ProjectableValue {
  type: ProjectableRubyType
  id: string
}

export interface ProjectableOption {
  id: string
  name: string
  typeKey: ProjectableTypeKey
}

const GROUPS: { typeKey: ProjectableTypeKey; label: string; color: string; bg: string }[] = [
  { typeKey: 'lab-project',    label: 'Lab',           color: '#5B5781', bg: '#e8e5ed' },
  { typeKey: 'training',       label: 'Academy',       color: '#B01A19', bg: '#f5dad3' },
  { typeKey: 'design-project', label: 'Design Studio', color: '#6F7900', bg: '#eef0e0' },
  { typeKey: 'guild',          label: 'Guildes',       color: '#78716C', bg: '#e7e5e4' },
]

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

interface Props {
  value: ProjectableValue | null
  onChange: (value: ProjectableValue | null) => void
  projects?: ProjectableOption[]
  placeholder?: string
  accent?: string
  disabled?: boolean
}

export function ProjectableCombobox({
  value,
  onChange,
  projects: projectsProp,
  placeholder = 'Sélectionner un projet…',
  accent = '#5B5781',
  disabled = false,
}: Props) {
  const [fetched, setFetched] = useState<ProjectableOption[] | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (projectsProp) return
    let cancelled = false
    apiRequest('/api/v1/projects')
      .then((payload: { items?: ProjectableOption[] }) => {
        if (cancelled) return
        setFetched(payload?.items ?? [])
      })
      .catch(() => {
        if (!cancelled) setFetched([])
      })
    return () => { cancelled = true }
  }, [projectsProp])

  const projects: ProjectableOption[] = projectsProp ?? fetched ?? []

  const selected = useMemo(() => {
    if (!value) return null
    const expectedKey = RUBY_TO_TYPE_KEY[value.type]
    return projects.find((p) => p.id === value.id && p.typeKey === expectedKey) ?? null
  }, [projects, value])

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return projects
    return projects.filter((p) => normalize(p.name).includes(q))
  }, [projects, query])

  const grouped = useMemo(() => {
    return GROUPS.map((g) => ({
      ...g,
      items: filtered.filter((p) => p.typeKey === g.typeKey),
    })).filter((g) => g.items.length > 0)
  }, [filtered])

  const flatItems = useMemo(
    () => grouped.flatMap((g) => g.items.map((item) => ({ group: g, item }))),
    [grouped]
  )

  const flatIndexByKey = useMemo(() => {
    const map = new Map<string, number>()
    flatItems.forEach((fi, i) => {
      map.set(`${fi.item.typeKey}:${fi.item.id}`, i)
    })
    return map
  }, [flatItems])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => { setHighlight(0) }, [query])

  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector(`[data-index="${highlight}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight, open])

  const handleSelect = (item: ProjectableOption) => {
    onChange({ type: TYPE_KEY_TO_RUBY[item.typeKey], id: item.id })
    setOpen(false)
    setQuery('')
  }

  const handleClear = () => {
    onChange(null)
    setOpen(false)
    setQuery('')
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, flatItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (flatItems[highlight]) handleSelect(flatItems[highlight].item)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  const selectedGroup = selected ? GROUPS.find((g) => g.typeKey === selected.typeKey) : null

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={`w-full pl-3 pr-9 py-2.5 rounded-lg bg-white border text-left transition-all duration-150 focus:outline-none focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          open ? 'border-stone-400 ring-2' : 'border-stone-200 hover:border-stone-300'
        }`}
        style={open ? { borderColor: accent, boxShadow: `0 0 0 2px ${accent}25` } : undefined}
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate">
            {selectedGroup && (
              <span
                className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
                style={{ color: selectedGroup.color, backgroundColor: selectedGroup.bg }}
              >
                {selectedGroup.label}
              </span>
            )}
            <span className="text-stone-900 truncate">{selected.name}</span>
          </span>
        ) : (
          <span className="text-stone-400">{placeholder}</span>
        )}
        <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full rounded-lg bg-white border border-stone-200 shadow-xl overflow-hidden">
          <div className="relative border-b border-stone-100">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Rechercher un projet…"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-stone-400"
            />
          </div>

          <ul ref={listRef} className="max-h-72 overflow-y-auto py-1">
            {value && (
              <li>
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full text-left px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-50 italic flex items-center gap-2"
                >
                  <X className="w-3 h-3" />
                  Aucun projet (effacer)
                </button>
              </li>
            )}
            {flatItems.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-stone-400">
                {projects.length === 0 ? 'Chargement…' : `Aucun projet trouvé pour « ${query} »`}
              </li>
            ) : (
              grouped.map((group) => (
                <li key={group.typeKey}>
                  <div
                    className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-[0.14em] font-semibold"
                    style={{ color: group.color }}
                  >
                    {group.label}
                  </div>
                  <ul>
                    {group.items.map((item) => {
                      const flatIdx = flatIndexByKey.get(`${item.typeKey}:${item.id}`) ?? -1
                      const isSelected = value?.type === TYPE_KEY_TO_RUBY[item.typeKey] && value.id === item.id
                      const isHighlighted = flatIdx === highlight
                      return (
                        <li key={`${item.typeKey}-${item.id}`} data-index={flatIdx}>
                          <button
                            type="button"
                            onMouseEnter={() => setHighlight(flatIdx)}
                            onClick={() => handleSelect(item)}
                            className={`w-full text-left pl-5 pr-3 py-1.5 text-sm flex items-center gap-2 transition-colors ${
                              isHighlighted ? 'bg-stone-100' : 'hover:bg-stone-50'
                            } ${isSelected ? 'font-medium' : 'text-stone-800'}`}
                            style={isSelected ? { color: group.color } : undefined}
                          >
                            <span className="flex-1 truncate">{item.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
