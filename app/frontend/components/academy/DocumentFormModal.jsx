import { useState, useEffect, useRef, useCallback } from 'react'
import { Upload, CheckCircle2, X, Calendar, User } from 'lucide-react'

function formatSessionDateRange(session) {
  const start = new Date(session.startDate)
  const end = new Date(session.endDate)
  const opts = { day: 'numeric', month: 'short' }
  const optsYear = { day: 'numeric', month: 'short', year: 'numeric' }
  if (session.startDate === session.endDate) return start.toLocaleDateString('fr-FR', optsYear)
  if (start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('fr-FR', opts)} – ${end.toLocaleDateString('fr-FR', optsYear)}`
  }
  return `${start.toLocaleDateString('fr-FR', optsYear)} – ${end.toLocaleDateString('fr-FR', optsYear)}`
}

function getSessionTrainers(session, academyContacts) {
  const ids = session.trainerIds || []
  if (!ids.length) return []
  return ids
    .map((id) => academyContacts.find((c) => String(c.id) === String(id)))
    .filter(Boolean)
    .map((c) => c.name)
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`
}

function formatSpeed(bytesPerSecond) {
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} o/s`
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(0)} Ko/s`
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} Mo/s`
}

function formatEta(seconds) {
  if (!seconds || !isFinite(seconds)) return ''
  if (seconds < 60) return `${Math.ceil(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.ceil(seconds % 60)
  return `${m}min ${s}s`
}

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30 focus:border-[#B01A19]'

export function DocumentFormModal({ onSubmit, onCancel, busy = false, sessions = [], members = [], academyContacts = [] }) {
  const nameRef = useRef(null)
  const fileInputRef = useRef(null)
  const xhrRef = useRef(null)
  const uploadStartRef = useRef(null)

  const [name, setName] = useState('')
  const [file, setFile] = useState(null)
  const [sessionId, setSessionId] = useState('')
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState(0)
  const [uploadEta, setUploadEta] = useState(null)
  const [uploadDone, setUploadDone] = useState(false)

  useEffect(() => {
    if (nameRef.current) {
      const timer = setTimeout(() => {
        nameRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !uploading) {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel, uploading])

  const handleCancelUpload = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort()
      xhrRef.current = null
    }
    setUploading(false)
    setUploadProgress(0)
    setUploadSpeed(0)
    setUploadEta(null)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Veuillez saisir un nom pour le document')
      return
    }

    if (!file) {
      setError('Veuillez sélectionner un fichier à envoyer')
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)
      setUploadSpeed(0)
      setUploadEta(null)
      setUploadDone(false)
      uploadStartRef.current = Date.now()

      await onSubmit({
        name: name.trim(),
        file,
        sessionId: sessionId || null,
      }, {
        onProgress: (progress) => {
          setUploadProgress(progress.percent)
          const elapsed = (Date.now() - uploadStartRef.current) / 1000
          if (elapsed > 0.5 && progress.loaded > 0) {
            const speed = progress.loaded / elapsed
            setUploadSpeed(speed)
            const remaining = progress.total - progress.loaded
            setUploadEta(remaining / speed)
          }
        },
        getXhrRef: (xhr) => { xhrRef.current = xhr },
      })

      setUploadDone(true)
      setUploadProgress(100)
    } catch (err) {
      if (err.name === 'AbortError' || err.message === 'Upload annulé') {
        return
      }
      setError(err.message || "Erreur lors de l'enregistrement")
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileChange = (e) => {
    const chosen = e.target.files?.[0]
    selectFile(chosen)
  }

  const selectFile = (chosen) => {
    setFile(chosen || null)
    if (chosen && !name.trim()) {
      setName(chosen.name.replace(/\.[^.]+$/, '') || chosen.name)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragging(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) selectFile(dropped)
  }

  const isUploading = uploading && !uploadDone

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={isUploading ? undefined : onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 px-6 py-5 border-b border-stone-200 bg-gradient-to-br from-red-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading)' }}>
                  Nouveau document
                </h3>
                <p className="text-sm text-stone-500 mt-1">
                  Envoyez un fichier depuis votre ordinateur (stockage local)
                </p>
              </div>
              <button
                type="button"
                onClick={isUploading ? undefined : onCancel}
                disabled={isUploading}
                className="ml-4 p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 h-full">
            <div className="flex-1 overflow-y-auto min-h-0 p-6">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in slide-in-from-top-2 duration-200">
                  {error}
                </div>
              )}

              {isUploading ? (
                <UploadProgressPanel
                  file={file}
                  progress={uploadProgress}
                  speed={uploadSpeed}
                  eta={uploadEta}
                  onCancel={handleCancelUpload}
                />
              ) : uploadDone ? (
                <UploadCompletePanel file={file} />
              ) : (
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="document-name"
                      className="block text-sm font-semibold text-stone-700 mb-2"
                    >
                      Nom du document <span className="text-rose-500">*</span>
                    </label>
                    <input
                      ref={nameRef}
                      id="document-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className={inputBase}
                      placeholder="ex: Support de cours - Introduction"
                    />
                  </div>

                  {/* File upload */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Fichier <span className="text-rose-500">*</span>
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`
                        flex items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-all cursor-pointer
                        ${file
                          ? 'border-[#B01A19]/50 bg-[#B01A19]/5'
                          : dragging
                            ? 'border-[#B01A19] bg-[#B01A19]/10 scale-[1.01]'
                            : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                        }
                      `}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,image/*,video/*,.txt,.csv,.zip,.rar,.7z"
                        onChange={handleFileChange}
                      />
                      <Upload className="w-8 h-8 text-stone-400 shrink-0" />
                      <div className="text-center min-w-0">
                        {file ? (
                          <>
                            <p className="font-medium text-stone-900 truncate">{file.name}</p>
                            <p className="text-xs text-stone-500 mt-0.5">
                              {formatFileSize(file.size)} · Cliquez pour changer
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-stone-700">Cliquez ou glissez un fichier</p>
                            <p className="text-xs text-stone-500 mt-0.5">PDF, images, vidéos, ZIP, etc.</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Session (optional) */}
                  {sessions.length > 0 && (
                    <div>
                      <p className="block text-sm font-semibold text-stone-700 mb-3">
                        Session associée
                      </p>
                      <div className="space-y-2">
                        <SessionRadio
                          selected={sessionId === ''}
                          onClick={() => setSessionId('')}
                        >
                          <span className={`text-sm ${sessionId === '' ? 'font-medium text-stone-900' : 'text-stone-600'}`}>
                            Aucune — document général
                          </span>
                        </SessionRadio>
                        {sessions.map((s) => {
                          const selected = String(sessionId) === String(s.id)
                          const trainers = getSessionTrainers(s, academyContacts)
                          return (
                            <SessionRadio
                              key={s.id}
                              selected={selected}
                              onClick={() => setSessionId(String(s.id))}
                            >
                              <div className="flex flex-col gap-1 min-w-0">
                                {s.topic && (
                                  <span className={`text-sm leading-snug ${selected ? 'font-medium text-stone-900' : 'text-stone-700'}`}>
                                    {s.topic}
                                  </span>
                                )}
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="inline-flex items-center gap-1.5 text-xs text-stone-500">
                                    <Calendar className="w-3 h-3 shrink-0" />
                                    {formatSessionDateRange(s)}
                                  </span>
                                  {trainers.length > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-stone-500">
                                      <User className="w-3 h-3 shrink-0" />
                                      {trainers.join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </SessionRadio>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-end gap-3">
              {uploadDone ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-5 py-2 rounded-xl font-medium text-white bg-[#B01A19] hover:bg-[#8f1514] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Fermer
                </button>
              ) : isUploading ? (
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="px-4 py-2 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors"
                >
                  Annuler l'envoi
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={busy}
                    className="px-4 py-2 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={busy || !name.trim() || !file}
                    className="px-5 py-2 rounded-xl font-medium text-white bg-[#B01A19] hover:bg-[#8f1514] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
                  >
                    {busy ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Envoi en cours...
                      </span>
                    ) : (
                      'Envoyer le document'
                    )}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

function SessionRadio({ selected, onClick, children }) {
  return (
    <label
      onClick={onClick}
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150
        ${selected
          ? 'border-[#B01A19]/40 bg-[#B01A19]/5 ring-1 ring-[#B01A19]/20'
          : 'border-stone-200 hover:border-stone-300 bg-white'
        }
      `}
    >
      <span className={`
        shrink-0 mt-0.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors duration-150
        ${selected ? 'border-[#B01A19]' : 'border-stone-300'}
      `}>
        {selected && (
          <span className="w-2.5 h-2.5 rounded-full bg-[#B01A19]" />
        )}
      </span>
      {children}
    </label>
  )
}

function UploadProgressPanel({ file, progress, speed, eta, onCancel }) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)
  const loaded = file ? (file.size * clampedProgress) / 100 : 0

  return (
    <div className="flex flex-col items-center py-4">
      <div className="w-full mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-stone-900 truncate max-w-[70%]">
            {file?.name}
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Annuler l'envoi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-3 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${clampedProgress}%`,
              background: 'linear-gradient(90deg, #B01A19 0%, #d4403f 50%, #B01A19 100%)',
              backgroundSize: '200% 100%',
              animation: clampedProgress < 100 ? 'shimmer 1.5s ease-in-out infinite' : 'none',
            }}
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-2.5 text-xs text-stone-500">
          <span>
            {formatFileSize(loaded)} / {file ? formatFileSize(file.size) : '—'}
          </span>
          <span className="font-mono tabular-nums text-stone-700 font-semibold text-sm">
            {Math.round(clampedProgress)}%
          </span>
        </div>
        <div className="flex items-center justify-between mt-1 text-xs text-stone-400">
          {speed > 0 && <span>{formatSpeed(speed)}</span>}
          {eta !== null && eta > 0 && (
            <span>~{formatEta(eta)} restant</span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

function UploadCompletePanel({ file }) {
  return (
    <div className="flex flex-col items-center py-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>
      <p className="text-base font-semibold text-stone-900 mb-1">Document envoyé</p>
      <p className="text-sm text-stone-500 truncate max-w-full">
        {file?.name} · {file ? formatFileSize(file.size) : ''}
      </p>
    </div>
  )
}
