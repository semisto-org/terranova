import { useEffect, useRef, useState } from 'react'
import { X, AlertTriangle, RotateCw, ChevronDown, ChevronRight, Clock, CheckCircle2, Loader2, Upload } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface JobDetail {
  id: number
  speciesId: number
  speciesLatinName: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  kind: string
  triggeredAt: string | null
  startedAt: string | null
  finishedAt: string | null
  errorMessage: string | null
  errorClass: string | null
  feedback: string | null
  promptUsed: string | null
  vdsVersion: string | null
  geminiAttempts: number | null
}

interface Props {
  jobId: number
  isAdmin: boolean
  onClose: () => void
  onRetry?: (jobId: number) => Promise<void> | void
  /** Called after an admin uploads a manual illustration for the job's species.
   *  Parent can use it to refresh dependent lists (e.g. the gallery grid). */
  onUploaded?: (speciesId: number) => void
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  return date.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function IllustrationJobModal({ jobId, isAdmin, onClose, onRetry, onUploaded }: Props) {
  const [job, setJob] = useState<JobDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiRequest<JobDetail>(`/api/v1/plants/illustrations/jobs/${jobId}`)
      .then(setJob)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Erreur de chargement'))
  }, [jobId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleRetry = async () => {
    if (!onRetry || !job) return
    setRetrying(true)
    try {
      await onRetry(job.id)
      onClose()
    } finally {
      setRetrying(false)
    }
  }

  const handleFileChosen = async (file: File) => {
    if (!job) return
    setUploading(true)
    setUploadError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      await apiRequest(`/api/v1/plants/species/${job.speciesId}/silhouette-illustration`, {
        method: 'POST',
        body: form,
      })
      onUploaded?.(job.speciesId)
      onClose()
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Échec de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  const statusBadge = (status: JobDetail['status']) => {
    const config = {
      pending:   { label: 'En queue',     icon: Clock,        cls: 'bg-stone-100 text-stone-700' },
      running:   { label: 'En cours',     icon: Loader2,      cls: 'bg-amber-50 text-amber-700' },
      completed: { label: 'Terminé',      icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700' },
      failed:    { label: 'Échec',        icon: AlertTriangle,cls: 'bg-red-50 text-red-700' },
    }[status]
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${config.cls}`}>
        <Icon className={`w-3.5 h-3.5 ${status === 'running' ? 'animate-spin' : ''}`} />
        {config.label}
      </span>
    )
  }

  const labelClass = 'block text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 mb-1'
  const fieldClass = 'text-sm text-stone-800'

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-900/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-2xl w-full overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-stone-100">
          <div className="flex items-start gap-3 min-w-0">
            <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(91, 87, 129, 0.10)' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: '#5B5781' }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl text-stone-900 leading-tight truncate" style={{ fontFamily: "'Sole Serif Small', 'DM Serif Display', serif" }}>
                Job #{jobId}
              </h2>
              {job && (
                <p className="text-sm italic text-stone-600 truncate">{job.speciesLatinName}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 -mr-2 -mt-1 p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          {!job && !error && (
            <p className="text-sm text-stone-500 italic">Chargement…</p>
          )}

          {job && (
            <>
              <div className="flex items-center gap-2">
                {statusBadge(job.status)}
                <span className="text-xs text-stone-500">
                  {job.kind === 'initial' ? 'Génération initiale' : 'Régénération'}
                  {job.vdsVersion && ` · VDS ${job.vdsVersion}`}
                  {typeof job.geminiAttempts === 'number' && ` · ${job.geminiAttempts} essai(s)`}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <span className={labelClass}>Déclenché</span>
                  <span className={fieldClass}>{formatTimestamp(job.triggeredAt)}</span>
                </div>
                <div>
                  <span className={labelClass}>Démarré</span>
                  <span className={fieldClass}>{formatTimestamp(job.startedAt)}</span>
                </div>
                <div>
                  <span className={labelClass}>Terminé</span>
                  <span className={fieldClass}>{formatTimestamp(job.finishedAt)}</span>
                </div>
              </div>

              {job.status === 'failed' && (
                <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-700 uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Détails de l'erreur
                  </div>
                  {job.errorClass && (
                    <div>
                      <span className={labelClass}>Type</span>
                      <code className="text-xs text-red-800 font-mono">{job.errorClass}</code>
                    </div>
                  )}
                  {job.errorMessage && (
                    <div>
                      <span className={labelClass}>Message</span>
                      <pre className="text-xs text-red-800 font-mono whitespace-pre-wrap break-words">{job.errorMessage}</pre>
                    </div>
                  )}
                </div>
              )}

              {job.feedback && (
                <div>
                  <span className={labelClass}>Feedback utilisateur</span>
                  <p className="text-sm text-stone-800 italic">"{job.feedback}"</p>
                </div>
              )}

              {job.promptUsed && (
                <div>
                  <button
                    type="button"
                    onClick={() => setPromptOpen(p => !p)}
                    className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-600 hover:text-stone-900"
                  >
                    {promptOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    Prompt envoyé à Gemini
                  </button>
                  {promptOpen && (
                    <pre className="mt-2 text-xs text-stone-700 font-mono whitespace-pre-wrap break-words bg-stone-50 border border-stone-200 rounded p-3 max-h-64 overflow-y-auto">
                      {job.promptUsed}
                    </pre>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFileChosen(f)
            e.target.value = ''
          }}
        />

        <div className="flex flex-col gap-2 px-6 py-4 bg-stone-50/60 border-t border-stone-100">
          {uploadError && (
            <p className="text-xs text-red-600 text-right">{uploadError}</p>
          )}
          <div className="flex items-center justify-end gap-2 flex-wrap">
            {job?.status === 'failed' && isAdmin && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-3 py-2 border border-stone-300 bg-white text-stone-800 rounded-lg text-sm font-medium hover:bg-stone-50 disabled:opacity-60"
              >
                <Upload className={`w-3.5 h-3.5 ${uploading ? 'animate-pulse' : ''}`} />
                {uploading ? 'Envoi…' : 'Uploader une illustration'}
              </button>
            )}
            {job?.status === 'failed' && isAdmin && onRetry && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={retrying}
                className="inline-flex items-center gap-2 px-3 py-2 bg-[#5B5781] text-white rounded-lg text-sm font-medium hover:bg-[#4a4770] disabled:opacity-60"
              >
                <RotateCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Relance…' : 'Relancer ce job'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 text-sm hover:bg-white"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
