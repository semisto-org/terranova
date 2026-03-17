import React, { useState, useMemo } from 'react'
import { Users, Plus, Pencil, UserMinus, Search } from 'lucide-react'

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

export default function AcademyTeamView({
  team = [],
  onAddMember,
  onEditMember,
  onRemoveMember,
  onViewMember,
}) {
  const [search, setSearch] = useState('')

  const filteredTeam = useMemo(() => {
    if (!search.trim()) return team
    const q = search.trim().toLowerCase()
    return team.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q) ||
        (m.expertise || []).some((e) => e.toLowerCase().includes(q))
    )
  }, [team, search])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="h-12 w-1 bg-gradient-to-b from-[#B01A19] to-[#eac7b8] rounded-full shrink-0" />
          <div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
              Équipe
            </h1>
            <p className="text-sm text-stone-600 mt-2 font-medium">
              {team.length} formateur{team.length !== 1 ? 's' : ''} disponible{team.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un formateur..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30 focus:border-[#B01A19] text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => onAddMember?.()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#B01A19] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8f1514] shadow-md active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      {filteredTeam.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-16 px-6">
          <div className="mb-4 rounded-full bg-stone-100 p-4">
            <Users className="w-8 h-8 text-stone-400" />
          </div>
          <p className="text-base font-medium text-stone-700">
            {search.trim()
              ? 'Aucun résultat'
              : 'Aucun formateur dans l\'équipe'}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            {search.trim()
              ? 'Essayez avec d\'autres termes de recherche'
              : 'Ajoutez des formateurs pour les assigner aux activités'}
          </p>
          {!search.trim() && (
            <button
              type="button"
              onClick={() => onAddMember?.()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#B01A19] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8f1514]"
            >
              <Plus className="w-4 h-4" />
              Ajouter un formateur
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wide min-w-[200px]">
                    Nom
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wide">
                    Compétences
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wide w-12" />
                </tr>
              </thead>
              <tbody>
                {filteredTeam.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-stone-100 hover:bg-stone-50/50 group"
                  >
                    {/* Name + avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#B01A19]/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-[#B01A19]">
                            {getInitials(member.name)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onViewMember?.(member)}
                          className="text-sm font-medium text-stone-900 hover:text-[#B01A19] transition-colors text-left truncate"
                        >
                          {member.name}
                        </button>
                      </div>
                    </td>

                    {/* Expertise */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(member.expertise || []).slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-[#B01A19]/10 px-2.5 py-0.5 text-xs font-medium text-[#B01A19]"
                          >
                            {skill}
                          </span>
                        ))}
                        {(member.expertise || []).length > 3 && (
                          <span className="text-xs text-stone-400">
                            +{member.expertise.length - 3}
                          </span>
                        )}
                        {(!member.expertise || member.expertise.length === 0) && (
                          <span className="text-xs text-stone-400">—</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => onEditMember?.(member)}
                          className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-[#B01A19] transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveMember?.(member.id)}
                          className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Retirer de l'équipe"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
