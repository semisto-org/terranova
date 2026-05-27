import React, { useState, useRef } from 'react'
import { Upload, Loader2, Plus, X } from 'lucide-react'
import { myApiRequest } from '../lib/api'
import { myApiPath } from '../lib/paths'

const ACCENT = '#B01A19'
const MAX_BYTES = 200 * 1024 * 1024 // 200 Mo — must match the server-side cap

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/**
 * Upload zone for a contact with the upload right on a training.
 * - file input (multiple), session selector (with explicit "Général" option),
 *   optional name, submit button.
 * - 200 Mo client-side guard with a clear message before sending.
 * - on success, calls onUploaded() so the parent can refetch without a full reload.
 */
export default function DocumentUploadForm({ trainingId, sessions = [], onUploaded }) {
  const [files, setFiles] = useState([])
  const [sessionId, setSessionId] = useState('') // '' === Général
  const [name, setName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const fileInputRef = useRef(null)

  function handleFileChange(e) {
    setError(null)
    setSuccess(null)
    setFiles(Array.from(e.target.files || []))
  }

  function reset() {
    setFiles([])
    setSessionId('')
    setName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (files.length === 0) {
      setError('Veuillez choisir au moins un fichier.')
      return
    }

    // Client-side 200 Mo guard — block before sending, with a clear message.
    const oversized = files.find((f) => f.size > MAX_BYTES)
    if (oversized) {
      setError(`Le fichier « ${oversized.name} » dépasse la limite de 200 Mo.`)
      return
    }

    const formData = new FormData()
    files.forEach((f) => formData.append('files[]', f))
    if (sessionId) formData.append('session_id', sessionId)
    if (name.trim()) formData.append('name', name.trim())

    setUploading(true)
    try {
      const result = await myApiRequest(
        `${myApiPath('/academy')}/${trainingId}/documents`,
        { method: 'POST', body: formData }
      )
      const count = result?.documents?.length || files.length
      setSuccess(`${count} document${count > 1 ? 's' : ''} ajouté${count > 1 ? 's' : ''}.`)
      reset()
      if (onUploaded) onUploaded()
    } catch (err) {
      setError(err.message || 'Échec de l’envoi. Réessayez.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-stone-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${ACCENT}12` }}
        >
          <Plus size={18} style={{ color: ACCENT }} />
        </div>
        <h3 className="text-base font-medium text-stone-800">Ajouter un document</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File input */}
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Fichier(s)</label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-stone-600
                       file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
                       file:text-sm file:font-medium file:bg-stone-100 file:text-stone-700
                       hover:file:bg-stone-200 file:cursor-pointer cursor-pointer"
          />
          {files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map((f, i) => (
                <li key={i} className="text-xs text-stone-500 truncate">
                  {f.name} — {(f.size / (1024 * 1024)).toFixed(1)} Mo
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Session selector + Général */}
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Rattacher à</label>
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            disabled={uploading}
            className="block w-full text-sm rounded-lg border border-stone-200 px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30 bg-white"
          >
            <option value="">Général (non lié à une session)</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.topic ? `${s.topic} — ${formatDateShort(s.startDate)}` : `Session du ${formatDateShort(s.startDate)}`}
              </option>
            ))}
          </select>
        </div>

        {/* Optional name */}
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">
            Nom (optionnel — sinon le nom du fichier est utilisé)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={uploading}
            placeholder="Ex. Support de cours session 1"
            className="block w-full text-sm rounded-lg border border-stone-200 px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700" role="alert">
            <X size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700" role="status">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || files.length === 0}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: ACCENT }}
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Envoi en cours…
            </>
          ) : (
            <>
              <Upload size={16} />
              Envoyer
            </>
          )}
        </button>
      </form>
    </div>
  )
}
