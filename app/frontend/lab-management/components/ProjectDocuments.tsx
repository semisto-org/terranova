import React, { useState, useRef, useCallback, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Upload, FileText, Image, File, FileSpreadsheet, Trash2, Download, Info, User, Calendar, HardDrive, X } from 'lucide-react'

interface DocumentData {
  id: string
  filename: string
  contentType: string
  byteSize: number
  url: string
  uploadedBy: string | null
  createdAt: string
}

interface ProjectDocumentsProps {
  documents: DocumentData[]
  projectId: string
  onUpload: (files: FileList) => Promise<void>
  onDelete: (docId: string) => Promise<void>
  busy: boolean
}

function getFileIcon(contentType: string) {
  if (contentType?.startsWith('image/')) return Image
  if (contentType === 'application/pdf') return FileText
  if (contentType?.includes('spreadsheet') || contentType?.includes('csv') || contentType?.includes('excel'))
    return FileSpreadsheet
  if (contentType?.includes('word') || contentType?.includes('document')) return FileText
  return File
}

function getIconColor(contentType: string) {
  if (contentType?.startsWith('image/')) return '#8B5CF6'
  if (contentType === 'application/pdf') return '#EF4444'
  if (contentType?.includes('spreadsheet') || contentType?.includes('csv') || contentType?.includes('excel'))
    return '#10B981'
  if (contentType?.includes('word') || contentType?.includes('document')) return '#3B82F6'
  return '#6B7280'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toUpperCase() : ''
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function InfoTooltip({ doc }: { doc: DocumentData }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({
        top: rect.bottom + 8 + window.scrollY,
        left: rect.left + rect.width / 2 - 110 + window.scrollX,
      })
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors shadow-sm ${
          open
            ? 'bg-[#5B5781]/10 border-[#5B5781]/30 text-[#5B5781]'
            : 'bg-white/90 border-stone-200 text-stone-500 hover:text-[#5B5781] hover:border-[#5B5781]/30'
        }`}
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && ReactDOM.createPortal(
        <div
          ref={tooltipRef}
          className="z-[9999] w-[220px] rounded-xl bg-white border border-stone-200 text-[11px] leading-relaxed shadow-lg shadow-stone-900/8"
          style={{
            top: pos.top,
            left: pos.left,
            position: 'absolute',
            animation: 'tooltipFadeIn 150ms ease-out',
          }}
          onClick={e => e.stopPropagation()}
        >
          <style>{`@keyframes tooltipFadeIn { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div className="px-3 py-2.5 space-y-2">
            {doc.uploadedBy && (
              <div className="flex items-start gap-2">
                <User className="w-3 h-3 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Ajouté par</p>
                  <p className="text-stone-700 font-medium">{doc.uploadedBy}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Calendar className="w-3 h-3 text-stone-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Date</p>
                <p className="text-stone-700 font-medium">{formatDate(doc.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <HardDrive className="w-3 h-3 text-stone-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Taille</p>
                <p className="text-stone-700 font-medium">{formatSize(doc.byteSize)}</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

const CONFIRM_TIMEOUT = 5000

function ConfirmDeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (confirming) {
      timerRef.current = setTimeout(() => setConfirming(false), CONFIRM_TIMEOUT)
      return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }
  }, [confirming])

  if (!confirming) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
        className="w-7 h-7 rounded-lg bg-white/90 border border-stone-200 flex items-center justify-center text-stone-500 hover:text-red-600 hover:border-red-300 transition-colors shadow-sm"
        title="Supprimer"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onConfirm() }}
      className="relative h-7 rounded-lg text-white text-[10px] font-medium shadow-sm transition-colors overflow-hidden flex items-center"
      style={{ minWidth: 0 }}
    >
      {/* Background: fills as countdown, red base underneath */}
      <span className="absolute inset-0 bg-red-700" />
      <span
        className="absolute inset-0 bg-red-500 origin-left"
        style={{
          animation: `confirmShrink ${CONFIRM_TIMEOUT}ms linear forwards`,
        }}
      />
      <style>{`@keyframes confirmShrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>

      <span className="relative z-10 flex items-center gap-1 px-2 whitespace-nowrap">
        Supprimer ?
      </span>

      {/* Cancel zone */}
      <span
        className="relative z-10 flex items-center justify-center w-6 h-full border-l border-red-400/40 hover:bg-red-800/50 transition-colors"
        onClick={(e) => { e.stopPropagation(); setConfirming(false) }}
      >
        <X className="w-3 h-3" />
      </span>
    </button>
  )
}

export function ProjectDocuments({ documents, projectId, onUpload, onDelete, busy }: ProjectDocumentsProps) {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      await onUpload(e.dataTransfer.files)
    }
  }, [onUpload])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await onUpload(e.target.files)
      e.target.value = ''
    }
  }, [onUpload])

  const handleDelete = useCallback(async (docId: string) => {
    await onDelete(docId)
  }, [onDelete])

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {documents.length > 0 ? (
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 ${busy ? 'opacity-60 pointer-events-none' : ''}`}
        >
          {documents.map(doc => {
            const Icon = getFileIcon(doc.contentType)
            const iconColor = getIconColor(doc.contentType)
            const ext = getFileExtension(doc.filename)

            return (
              <div
                key={doc.id}
                className="group relative bg-white rounded-xl border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all overflow-hidden"
              >
                {/* File preview area */}
                <a
                  href={doc.url}
                  download
                  className="flex flex-col items-center justify-center py-6 px-3 cursor-pointer"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${iconColor}12` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: iconColor }} />
                  </div>
                  {ext && (
                    <span
                      className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md mb-1.5"
                      style={{ backgroundColor: `${iconColor}15`, color: iconColor }}
                    >
                      {ext}
                    </span>
                  )}
                </a>

                {/* File info footer */}
                <div className="px-3 pb-3 text-center">
                  <p className="text-xs font-medium text-stone-800 truncate leading-snug" title={doc.filename}>
                    {doc.filename}
                  </p>
                </div>

                {/* Hover actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <InfoTooltip doc={doc} />
                  <a
                    href={doc.url}
                    download
                    className="w-7 h-7 rounded-lg bg-white/90 border border-stone-200 flex items-center justify-center text-stone-500 hover:text-[#5B5781] hover:border-[#5B5781]/30 transition-colors shadow-sm"
                    title="Télécharger"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <ConfirmDeleteButton onConfirm={() => handleDelete(doc.id)} />
                </div>
              </div>
            )
          })}

          {/* Add more button as card */}
          <button
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center py-6 px-3 rounded-xl border-2 border-dashed transition-all ${
              dragOver
                ? 'border-[#5B5781] bg-[#5B5781]/5'
                : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
            }`}
          >
            <Upload className={`w-6 h-6 mb-2 ${dragOver ? 'text-[#5B5781]' : 'text-stone-400'}`} />
            <span className={`text-xs font-medium ${dragOver ? 'text-[#5B5781]' : 'text-stone-500'}`}>
              Ajouter
            </span>
          </button>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed py-10 flex flex-col items-center justify-center transition-all ${
            dragOver
              ? 'border-[#5B5781] bg-[#5B5781]/5'
              : 'border-stone-200'
          }`}
        >
          <Upload className={`w-8 h-8 mb-3 ${dragOver ? 'text-[#5B5781]' : 'text-stone-300'}`} />
          <p className="text-sm text-stone-500 mb-1">Glissez vos fichiers ici</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-[#5B5781] hover:underline"
          >
            ou parcourir
          </button>
        </div>
      )}
    </div>
  )
}
