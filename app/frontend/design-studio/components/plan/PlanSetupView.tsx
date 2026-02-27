import { useState, useRef, useCallback } from 'react'
import { Upload, Image as ImageIcon } from 'lucide-react'

interface PlanSetupViewProps {
  onUploadImage: (file: File) => void
}

export function PlanSetupView({ onUploadImage }: PlanSetupViewProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return
      setUploading(true)
      try {
        await onUploadImage(file)
      } finally {
        setUploading(false)
      }
    },
    [onUploadImage]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 transition-colors cursor-pointer ${
        isDragging
          ? 'border-[#AFBD00] bg-[#AFBD00]/5'
          : 'border-stone-300 bg-stone-50 hover:border-stone-400'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {uploading ? (
        <>
          <div className="w-12 h-12 rounded-full border-4 border-stone-200 border-t-[#AFBD00] animate-spin mb-4" />
          <p className="text-sm text-stone-600">Téléversement en cours…</p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
            {isDragging ? (
              <Upload className="w-8 h-8 text-[#AFBD00]" />
            ) : (
              <ImageIcon className="w-8 h-8 text-stone-400" />
            )}
          </div>
          <p className="text-sm font-medium text-stone-700 mb-1">
            Glisser-déposer ou cliquer pour téléverser
          </p>
          <p className="text-xs text-stone-500">
            Photo drone, orthophoto ou plan scanné (JPG, PNG, WebP)
          </p>
        </>
      )}
    </div>
  )
}
