import { useState, useEffect, useMemo } from 'react'
import { Search, Zap, ArrowRight, Check, X, Loader2, MapPin, AlertCircle } from 'lucide-react'
import { apiRequest } from '../../lib/api'

interface DesignProject {
  id: string
  name: string
  clientName?: string
  city?: string
  phase: string
  status: string
  area?: number
}

const phaseLabels: Record<string, string> = {
  offre: 'Offre',
  'pre-projet': 'Pré-projet',
  'projet-detaille': 'Projet détaillé',
  'mise-en-oeuvre': 'Mise en œuvre',
  'co-gestion': 'Co-gestion',
  termine: 'Autonome',
}

const phaseColors: Record<string, { bg: string; text: string }> = {
  offre: { bg: 'bg-amber-50', text: 'text-amber-700' },
  'pre-projet': { bg: 'bg-orange-50', text: 'text-orange-700' },
  'projet-detaille': { bg: 'bg-[#e1e6d8]', text: 'text-[#6B7A00]' },
  'mise-en-oeuvre': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  'co-gestion': { bg: 'bg-[#c8bfd2]', text: 'text-[#5B5781]' },
  termine: { bg: 'bg-stone-100', text: 'text-stone-600' },
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500',
  pending: 'bg-amber-400',
  completed: 'bg-stone-400',
  archived: 'bg-stone-300',
}

interface SendToDesignStudioModalProps {
  paletteId: string
  onClose: () => void
  onSuccess: (projectId: string, projectName: string) => void
}

export function SendToDesignStudioModal({
  paletteId,
  onClose,
  onSuccess,
}: SendToDesignStudioModalProps) {
  const [projects, setProjects] = useState<DesignProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ projectId: string; projectName: string } | null>(null)

  useEffect(() => {
    let active = true
    apiRequest('/api/v1/design')
      .then((data) => {
        if (!active) return
        setProjects(data.projects ?? [])
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return projects
    const q = search.toLowerCase()
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.clientName && p.clientName.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q))
    )
  }, [projects, search])

  const handleImport = async (project: DesignProject) => {
    setImporting(project.id)
    setError(null)
    try {
      await apiRequest(`/api/v1/design/${project.id}/palette/import/${paletteId}`, {
        method: 'POST',
      })
      setSuccess({ projectId: project.id, projectName: project.name })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(null)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[min(600px,80vh)]">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-stone-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#AFBD00]/15 flex items-center justify-center">
                <Zap className="w-4.5 h-4.5 text-[#7a8200]" />
              </div>
              <h3 className="font-serif text-lg text-stone-900">
                Envoyer au Design Studio
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {success ? (
          /* Success state */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h4 className="text-lg font-medium text-stone-900 mb-1.5">
              Palette importée
            </h4>
            <p className="text-sm text-stone-500 mb-6 max-w-xs">
              Les plantes ont été ajoutées à la palette du projet
              {' '}<strong className="text-stone-700">{success.projectName}</strong>.
              Les doublons existants ont été ignorés.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => onSuccess(success.projectId, success.projectName)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#AFBD00] hover:bg-[#9BAA00] text-stone-900 font-medium rounded-xl text-sm transition-colors"
              >
                Voir le projet
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="flex-shrink-0 px-6 pt-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un projet…"
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/50 focus:border-[#AFBD00]"
                />
              </div>
              <p className="text-xs text-stone-400 mt-2">
                Sélectionnez le projet dans lequel importer la palette végétale.
              </p>
            </div>

            {/* Project list */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    type="button"
                    onClick={() => { setError(null); setLoading(true); apiRequest('/api/v1/design').then((d) => setProjects(d.projects ?? [])).catch((e) => setError(e.message)).finally(() => setLoading(false)) }}
                    className="mt-3 text-xs font-medium text-stone-500 hover:text-stone-700"
                  >
                    Réessayer
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-sm text-stone-500">
                    {search ? 'Aucun projet trouvé.' : 'Aucun projet Design Studio.'}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {filtered.map((project) => {
                    const phase = phaseColors[project.phase] ?? { bg: 'bg-stone-100', text: 'text-stone-600' }
                    const isImporting = importing === project.id

                    return (
                      <li key={project.id}>
                        <button
                          type="button"
                          disabled={!!importing}
                          onClick={() => handleImport(project)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-200 bg-white hover:border-[#AFBD00]/50 hover:bg-[#AFBD00]/[0.04] transition-all text-left group disabled:opacity-60 disabled:cursor-wait"
                        >
                          <div className="flex-shrink-0 relative">
                            <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusColors[project.status] ?? 'bg-stone-300'}`} />
                            <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 text-sm font-semibold">
                              {project.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-stone-900 truncate">
                                {project.name}
                              </p>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${phase.bg} ${phase.text} flex-shrink-0`}>
                                {phaseLabels[project.phase] ?? project.phase}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {project.clientName && (
                                <span className="text-xs text-stone-500 truncate">
                                  {project.clientName}
                                </span>
                              )}
                              {project.city && (
                                <span className="inline-flex items-center gap-0.5 text-xs text-stone-400">
                                  <MapPin className="w-3 h-3" />
                                  {project.city}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {isImporting ? (
                              <Loader2 className="w-4 h-4 text-[#7a8200] animate-spin" />
                            ) : (
                              <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-[#7a8200] transition-colors" />
                            )}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
