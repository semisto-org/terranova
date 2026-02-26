import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { ChevronDown, X, Search, Check } from 'lucide-react'

export interface MemberOption {
  id: string
  firstName: string
  lastName: string
  avatar: string | null
}

function MemberAvatar({ member, size = 24 }: { member: MemberOption; size?: number }) {
  const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase()

  if (member.avatar) {
    return (
      <img
        src={member.avatar}
        alt={`${member.firstName} ${member.lastName}`}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="rounded-full bg-[#5B5781]/10 text-[#5B5781] flex items-center justify-center font-medium flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  )
}

// ── Single member picker ──

interface SingleMemberPickerProps {
  members: MemberOption[]
  value: string
  onChange: (name: string) => void
  placeholder?: string
  className?: string
}

export function MemberPicker({ members, value, onChange, placeholder = 'Sélectionner...', className }: SingleMemberPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setSearch('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const selectedMember = useMemo(
    () => members.find(m => `${m.firstName} ${m.lastName}` === value || m.firstName === value),
    [members, value]
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return members
    const q = search.toLowerCase()
    return members.filter(m =>
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
    )
  }, [members, search])

  const select = useCallback((m: MemberOption) => {
    onChange(`${m.firstName} ${m.lastName}`)
    setOpen(false)
  }, [onChange])

  const clear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setOpen(false)
  }, [onChange])

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm transition-all duration-200 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] focus:bg-white"
      >
        {selectedMember ? (
          <>
            <MemberAvatar member={selectedMember} size={22} />
            <span className="flex-1 text-left text-stone-900 truncate">
              {selectedMember.firstName} {selectedMember.lastName}
            </span>
            <X className="w-3.5 h-3.5 text-stone-400 hover:text-stone-600" onClick={clear} />
          </>
        ) : (
          <>
            <span className="flex-1 text-left text-stone-400">{placeholder}</span>
            <ChevronDown className="w-4 h-4 text-stone-400" />
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-stone-200 shadow-xl shadow-stone-900/10 overflow-hidden">
          <div className="p-2 border-b border-stone-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#5B5781]/30 focus:border-[#5B5781]"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-3">Aucun membre trouvé</p>
            ) : (
              filtered.map(m => {
                const fullName = `${m.firstName} ${m.lastName}`
                const isSelected = fullName === value || m.firstName === value
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => select(m)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-stone-50 transition-colors ${isSelected ? 'bg-[#5B5781]/5' : ''}`}
                  >
                    <MemberAvatar member={m} size={26} />
                    <span className="flex-1 text-sm text-stone-900 truncate">{fullName}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#5B5781]" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Multi member picker ──

interface MultiMemberPickerProps {
  members: MemberOption[]
  value: string[]
  onChange: (names: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiMemberPicker({ members, value, onChange, placeholder = 'Ajouter des membres...', className }: MultiMemberPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setSearch('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const selectedMembers = useMemo(
    () => value.map(name => members.find(m => `${m.firstName} ${m.lastName}` === name || m.firstName === name)).filter(Boolean) as MemberOption[],
    [members, value]
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return members
    const q = search.toLowerCase()
    return members.filter(m =>
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
    )
  }, [members, search])

  const toggle = useCallback((m: MemberOption) => {
    const fullName = `${m.firstName} ${m.lastName}`
    if (value.includes(fullName)) {
      onChange(value.filter(n => n !== fullName))
    } else {
      onChange([...value, fullName])
    }
  }, [value, onChange])

  const remove = useCallback((name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter(n => n !== name))
  }, [value, onChange])

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm transition-all duration-200 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] focus:bg-white min-h-[42px] flex-wrap"
      >
        {selectedMembers.length > 0 ? (
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {selectedMembers.map(m => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#5B5781]/8 text-[#5B5781] rounded-lg text-xs font-medium"
              >
                <MemberAvatar member={m} size={16} />
                {m.firstName}
                <X className="w-3 h-3 opacity-60 hover:opacity-100 cursor-pointer" onClick={e => remove(`${m.firstName} ${m.lastName}`, e)} />
              </span>
            ))}
          </div>
        ) : (
          <span className="flex-1 text-left text-stone-400">{placeholder}</span>
        )}
        <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-stone-200 shadow-xl shadow-stone-900/10 overflow-hidden">
          <div className="p-2 border-b border-stone-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#5B5781]/30 focus:border-[#5B5781]"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-3">Aucun membre trouvé</p>
            ) : (
              filtered.map(m => {
                const fullName = `${m.firstName} ${m.lastName}`
                const isSelected = value.includes(fullName)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggle(m)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-stone-50 transition-colors ${isSelected ? 'bg-[#5B5781]/5' : ''}`}
                  >
                    <MemberAvatar member={m} size={26} />
                    <span className="flex-1 text-sm text-stone-900 truncate">{fullName}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#5B5781]" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Inline member display with avatar ──

interface MemberDisplayProps {
  name: string
  members: MemberOption[]
  size?: number
}

export function MemberDisplay({ name, members, size = 24 }: MemberDisplayProps) {
  const member = useMemo(
    () => members.find(m => `${m.firstName} ${m.lastName}` === name || m.firstName === name),
    [members, name]
  )

  if (!name) return null

  return (
    <span className="inline-flex items-center gap-1.5">
      {member ? (
        <MemberAvatar member={member} size={size} />
      ) : (
        <div
          className="rounded-full bg-stone-200 text-stone-500 flex items-center justify-center font-medium flex-shrink-0"
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          {name[0]?.toUpperCase()}
        </div>
      )}
      <span className="text-sm text-stone-700">{member ? `${member.firstName} ${member.lastName}` : name}</span>
    </span>
  )
}

// ── Avatar stack for multiple members ──

interface MemberAvatarStackProps {
  names: string[]
  members: MemberOption[]
  size?: number
  max?: number
}

export function MemberAvatarStack({ names, members, size = 28, max = 4 }: MemberAvatarStackProps) {
  const resolved = useMemo(
    () => names.map(name => ({
      name,
      member: members.find(m => `${m.firstName} ${m.lastName}` === name || m.firstName === name) || null,
    })),
    [names, members]
  )

  const visible = resolved.slice(0, max)
  const remaining = resolved.length - max

  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {visible.map(({ name, member }, i) => (
          <div key={i} className="ring-2 ring-white rounded-full" title={name}>
            {member ? (
              <MemberAvatar member={member} size={size} />
            ) : (
              <div
                className="rounded-full bg-stone-200 text-stone-500 flex items-center justify-center font-medium"
                style={{ width: size, height: size, fontSize: size * 0.4 }}
              >
                {name[0]?.toUpperCase()}
              </div>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <div
            className="ring-2 ring-white rounded-full bg-stone-100 text-stone-500 flex items-center justify-center font-medium"
            style={{ width: size, height: size, fontSize: size * 0.36 }}
          >
            +{remaining}
          </div>
        )}
      </div>
    </div>
  )
}
