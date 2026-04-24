import React, { useState, useEffect, useMemo } from 'react'
import { Check, Search, Users } from 'lucide-react'
import { apiRequest } from '../../lib/api'

const MIN_DECIDERS = 3

export default function DeciderSelector({ selectedIds, onChange, authMemberId }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const data = await apiRequest('/api/v1/strategy/effective-members')
      if (!cancelled && data) setMembers(data.members || [])
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const selectedSet = useMemo(() => new Set(selectedIds.map(String)), [selectedIds])
  const isSelfSelected = authMemberId != null && selectedSet.has(String(authMemberId))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return members
    return members.filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q))
  }, [members, search])

  const toggle = (memberId) => {
    const key = String(memberId)
    const next = new Set(selectedSet)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange(Array.from(next).map(Number))
  }

  const toggleSelf = () => {
    if (authMemberId == null) return
    toggle(authMemberId)
  }

  const count = selectedSet.size
  const missing = Math.max(0, MIN_DECIDERS - count)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-medium text-stone-600 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Décideurs *
        </label>
        <span className={`text-xs ${missing > 0 ? 'text-amber-700' : 'text-green-700'}`}>
          {count} décideur{count > 1 ? 's' : ''} sélectionné{count > 1 ? 's' : ''}
          {missing > 0 && ` — il en faut au moins ${MIN_DECIDERS}`}
        </span>
      </div>

      <p className="text-xs text-stone-500 leading-relaxed">
        Sélectionne les membres effectifs qui pourront exprimer consentement ou objection durant la phase de vote. Tous les membres effectifs pourront commenter pendant la discussion, mais seuls les décideurs désignés pourront voter.
      </p>

      {authMemberId != null && (
        <label className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2 cursor-pointer hover:bg-stone-100/60">
          <input
            type="checkbox"
            checked={isSelfSelected}
            onChange={toggleSelf}
            className="w-3.5 h-3.5 accent-blue-600"
          />
          <span className="text-xs text-stone-700">M'inclure comme décideur</span>
        </label>
      )}

      <div className="relative">
        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un membre..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />
      </div>

      <div className="max-h-64 overflow-y-auto rounded-lg border border-stone-200 divide-y divide-stone-100">
        {loading && (
          <div className="px-3 py-3 text-xs text-stone-400">Chargement des membres...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="px-3 py-3 text-xs text-stone-400">Aucun membre trouvé.</div>
        )}
        {!loading && filtered.map(m => {
          const key = String(m.id)
          const selected = selectedSet.has(key)
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                selected ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-stone-50'
              }`}
            >
              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                selected ? 'bg-blue-600 border-blue-600' : 'border-stone-300 bg-white'
              }`}>
                {selected && <Check className="w-3 h-3 text-white" />}
              </span>
              {m.avatar ? (
                <img src={m.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-stone-300 flex items-center justify-center text-[10px] text-white font-medium shrink-0">
                  {m.firstName?.[0]}{m.lastName?.[0]}
                </span>
              )}
              <span className="text-sm text-stone-800 truncate">
                {m.firstName} {m.lastName}
                {authMemberId != null && String(m.id) === String(authMemberId) && (
                  <span className="text-stone-400 text-xs ml-1">(moi)</span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
