import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { RotateCw } from 'lucide-react'

interface Job {
  id: number
  speciesId: number
  speciesLatinName: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  kind: string
  triggeredAt: string
  startedAt: string | null
  finishedAt: string | null
  errorMessage: string | null
}

interface ApiResponse {
  jobs: Job[]
}

interface Props {
  isAdmin: boolean
  onRetry?: (jobId: number) => Promise<void> | void
}

const STATUS_DOT: Record<Job['status'], string> = {
  pending: 'bg-stone-300',
  running: 'bg-[#EF9B0D] shadow-[0_0_0_3px_rgba(239,155,13,0.18)] animate-pulse',
  completed: 'bg-[#AFBD00]',
  failed: 'bg-red-500'
}

const STATUS_LABEL: Record<Job['status'], string> = {
  pending: 'En queue',
  running: 'Génération…',
  completed: 'Terminé',
  failed: 'Échec'
}

function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000
  if (seconds < 60) return `il y a ${Math.round(seconds)}s`
  if (seconds < 3600) return `il y a ${Math.round(seconds / 60)}m`
  if (seconds < 86400) return `il y a ${Math.round(seconds / 3600)}h`
  return `il y a ${Math.round(seconds / 86400)}j`
}

export function IllustrationQueuePanel({ isAdmin, onRetry }: Props) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [retrying, setRetrying] = useState<Set<number>>(new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    const fetchJobs = () =>
      apiRequest('/api/v1/plants/illustrations/jobs?limit=15')
        .then((d: ApiResponse) => {
          if (!active) return
          setJobs(d.jobs || [])
          setLoaded(true)
        })
        .catch(() => { if (active) setLoaded(true) })

    fetchJobs()
    const id = setInterval(fetchJobs, 5000)
    return () => { active = false; clearInterval(id) }
  }, [])

  const handleRetry = async (jobId: number) => {
    if (!onRetry) return
    setRetrying(prev => new Set(prev).add(jobId))
    try {
      await onRetry(jobId)
    } finally {
      setRetrying(prev => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  return (
    <aside
      className="bg-[#fdfaf2] border border-stone-200 rounded-md shadow-[0_1px_0_rgba(0,0,0,0.04)] sticky top-6"
      style={{
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(91,87,129,0.06) 32px)'
      }}
    >
      <header className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-[0.24em] text-stone-700 font-semibold">
          Queue · jobs
        </h3>
        <span className="text-[10px] font-mono tabular-nums text-stone-500">
          {jobs.length}
        </span>
      </header>

      <div className="max-h-[60vh] overflow-auto px-4 py-3">
        {!loaded ? (
          <p className="text-[11px] text-stone-400 italic">Chargement…</p>
        ) : jobs.length === 0 ? (
          <p className="text-[11px] text-stone-500 italic leading-relaxed">
            L'atelier est silencieux. Aucun job récent.
          </p>
        ) : (
          <ul className="divide-y divide-stone-200/70">
            {jobs.map(job => {
              const isRetrying = retrying.has(job.id)
              const meta = job.status === 'completed'
                ? relativeTime(job.finishedAt)
                : job.status === 'running'
                  ? 'génération en cours'
                  : job.status === 'pending'
                    ? `en queue · ${relativeTime(job.triggeredAt)}`
                    : null

              return (
                <li key={job.id} className="py-2.5 flex items-start gap-2.5">
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[job.status]}`}
                    aria-label={STATUS_LABEL[job.status]}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className="italic text-[12px] text-stone-900 truncate leading-tight"
                      style={{ fontFamily: "'Sole Serif Small', 'DM Serif Display', serif" }}
                    >
                      {job.speciesLatinName}
                    </div>
                    {meta && (
                      <div className="text-[10px] text-stone-500 mt-0.5">{meta}</div>
                    )}
                    {job.status === 'failed' && (
                      <div className="mt-1 flex items-start gap-1.5 flex-wrap">
                        <span className="text-[10px] text-red-600 leading-snug break-words flex-1 min-w-0">
                          {job.errorMessage?.slice(0, 80) || 'Échec'}
                          {job.errorMessage && job.errorMessage.length > 80 ? '…' : ''}
                        </span>
                        {isAdmin && onRetry && (
                          <button
                            onClick={() => handleRetry(job.id)}
                            disabled={isRetrying}
                            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-[#5B5781] hover:text-[#3a3760] disabled:opacity-50 transition"
                          >
                            <RotateCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} strokeWidth={2.25} />
                            <span>{isRetrying ? 'Relance…' : 'Retry'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
