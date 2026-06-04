import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Paperclip, MapPin } from 'lucide-react'
import { apiRequest } from '../../lib/api'

interface Media {
  id: number
  filename: string
  url: string
  contentType: string
}
interface Note {
  id: number
  body: string | null
  latitude: number | null
  longitude: number | null
  capturedAt: string | null
  media: Media[]
}

export function ObservationNotes({ projectId }: { projectId: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    apiRequest(`/api/v1/design/${projectId}/observation-notes`).then(setNotes).catch(() => {})
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const add = useCallback(async () => {
    const files = fileRef.current?.files
    if (!body.trim() && (!files || files.length === 0)) return
    setBusy(true)
    try {
      const form = new FormData()
      if (body.trim()) form.append('body', body)
      if (navigator.geolocation) {
        // Géoloc best-effort, non bloquante : ignorée si refusée.
      }
      Array.from(files ?? []).forEach((f) => form.append('media[]', f))
      await apiRequest(`/api/v1/design/${projectId}/observation-notes`, { method: 'POST', body: form })
      setBody('')
      if (fileRef.current) fileRef.current.value = ''
      load()
    } finally {
      setBusy(false)
    }
  }, [body, projectId, load])

  const remove = useCallback(
    async (id: number) => {
      if (!window.confirm('Supprimer cette note ?')) return
      await apiRequest(`/api/v1/design/observation-notes/${id}`, { method: 'DELETE' })
      load()
    },
    [load],
  )

  return (
    <div className="mt-3 rounded-xl bg-stone-50 p-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-stone-400">Carnet d'observation</p>

      <div className="flex items-start gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Note de terrain (impressions, repères, ressentis…)"
          rows={2}
          className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-700 focus:border-[#AFBD00] focus:ring-1 focus:ring-[#AFBD00]"
        />
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title="Joindre photo / vidéo / audio"
            className="rounded-lg border border-stone-200 bg-white p-2 text-stone-500 hover:bg-stone-100"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={add}
            disabled={busy}
            className="rounded-lg bg-[#AFBD00] p-2 text-white hover:bg-[#9aa800] disabled:opacity-50"
            title="Ajouter"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <input ref={fileRef} type="file" multiple accept="image/*,video/*,audio/*" className="hidden" />
      </div>

      <ul className="mt-3 space-y-2">
        {notes.map((note) => (
          <li key={note.id} className="rounded-lg border border-stone-200 bg-white p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {note.body && <p className="text-[13px] text-stone-700">{note.body}</p>}
                {note.media.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {note.media.map((m) =>
                      m.contentType?.startsWith('image/') ? (
                        <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer">
                          <img src={m.url} alt={m.filename} className="h-14 w-14 rounded object-cover" />
                        </a>
                      ) : (
                        <a
                          key={m.id}
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-1 text-[11px] text-stone-600"
                        >
                          <Paperclip className="h-3 w-3" />
                          {m.filename}
                        </a>
                      ),
                    )}
                  </div>
                )}
                <p className="mt-1 flex items-center gap-2 text-[11px] text-stone-400">
                  {note.capturedAt && new Date(note.capturedAt).toLocaleString('fr-BE')}
                  {note.latitude != null && note.longitude != null && (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />
                      {Number(note.latitude).toFixed(4)}, {Number(note.longitude).toFixed(4)}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(note.id)}
                className="shrink-0 rounded p-1 text-stone-300 hover:bg-red-50 hover:text-red-500"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
