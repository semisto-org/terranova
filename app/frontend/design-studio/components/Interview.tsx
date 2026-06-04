import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, Upload } from 'lucide-react'
import { apiRequest } from '../../lib/api'

interface Question {
  key: string
  label: string
}
interface InterviewData {
  questions: Question[]
  responses: Record<string, string>
  notes: string | null
  audioUrl: string | null
}

export function Interview({ projectId }: { projectId: string }) {
  const [data, setData] = useState<InterviewData | null>(null)
  const [busy, setBusy] = useState(false)
  const audioRef = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    apiRequest(`/api/v1/design/${projectId}/interview`).then(setData).catch(() => {})
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const saveResponse = useCallback(
    async (key: string, value: string) => {
      await apiRequest(`/api/v1/design/${projectId}/interview`, {
        method: 'PATCH',
        body: JSON.stringify({ responses: { [key]: value } }),
      })
    },
    [projectId],
  )

  const saveNotes = useCallback(
    async (value: string) => {
      await apiRequest(`/api/v1/design/${projectId}/interview`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: value }),
      })
    },
    [projectId],
  )

  const uploadAudio = useCallback(async () => {
    const file = audioRef.current?.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const form = new FormData()
      form.append('audio', file)
      const updated = await apiRequest(`/api/v1/design/${projectId}/interview/audio`, { method: 'POST', body: form })
      setData(updated)
      if (audioRef.current) audioRef.current.value = ''
    } finally {
      setBusy(false)
    }
  }, [projectId])

  if (!data) return null

  return (
    <div className="mt-3 rounded-xl bg-stone-50 p-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-stone-400">Questionnaire d'entrevue</p>

      <div className="space-y-3">
        {data.questions.map((q) => (
          <label key={q.key} className="block">
            <span className="mb-1 block text-[13px] font-medium text-stone-700">{q.label}</span>
            <textarea
              defaultValue={data.responses[q.key] ?? ''}
              onBlur={(e) => {
                if (e.target.value !== (data.responses[q.key] ?? '')) saveResponse(q.key, e.target.value)
              }}
              rows={2}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-700 focus:border-[#AFBD00] focus:ring-1 focus:ring-[#AFBD00]"
            />
          </label>
        ))}
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-400">Notes libres</span>
        <textarea
          defaultValue={data.notes ?? ''}
          onBlur={(e) => {
            if (e.target.value !== (data.notes ?? '')) saveNotes(e.target.value)
          }}
          rows={2}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-700 focus:border-[#AFBD00] focus:ring-1 focus:ring-[#AFBD00]"
        />
      </label>

      <div className="mt-3">
        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-stone-400">
          <Mic className="h-3.5 w-3.5" /> Enregistrement audio
        </div>
        {data.audioUrl && <audio controls src={data.audioUrl} className="mb-2 w-full" />}
        <div className="flex items-center gap-2">
          <input ref={audioRef} type="file" accept="audio/*" className="text-[12px] text-stone-500" />
          <button
            type="button"
            onClick={uploadAudio}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg bg-[#AFBD00] px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-[#9aa800] disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            {data.audioUrl ? 'Remplacer' : 'Téléverser'}
          </button>
        </div>
      </div>
    </div>
  )
}
