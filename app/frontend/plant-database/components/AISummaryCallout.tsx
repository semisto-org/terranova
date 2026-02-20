import type { AISummary } from '../types'

interface AISummaryCalloutProps {
  aiSummary?: AISummary
  onGenerate?: () => void
}

export function AISummaryCallout({ aiSummary, onGenerate }: AISummaryCalloutProps) {
  const status = aiSummary?.status || 'idle'

  return (
    <div className="bg-gradient-to-br from-[#5B5781]/5 to-[#5B5781]/10 rounded-2xl p-5 border border-[#5B5781]/20">
      {status === 'idle' && (
        <>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#5B5781]/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#5B5781]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-stone-900 mb-1">
                Résumé intelligent
              </h4>
              <p className="text-sm text-stone-600 leading-relaxed">
                Générez un résumé synthétisant les notes des contributeurs et les propriétés de cette espèce grâce à l'IA.
              </p>
            </div>
          </div>
          <button
            onClick={onGenerate}
            className="w-full py-2.5 px-4 bg-[#5B5781] hover:bg-[#4a4669] text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Générer le résumé IA
          </button>
        </>
      )}

      {status === 'loading' && (
        <div className="flex items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-xl bg-[#5B5781]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#5B5781] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-stone-900">Génération en cours...</p>
            <p className="text-sm text-stone-500">Analyse des notes et propriétés</p>
          </div>
        </div>
      )}

      {status === 'success' && aiSummary?.content && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-[#AFBD00]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#7a8200]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-medium text-stone-600">Résumé généré par IA</span>
          </div>
          <p className="text-stone-700 text-sm leading-relaxed">
            {aiSummary.content}
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-red-700 mb-1">Erreur de génération</p>
            <p className="text-sm text-stone-600">{aiSummary?.error || 'Une erreur est survenue'}</p>
            <button
              onClick={onGenerate}
              className="mt-2 text-sm text-[#5B5781] hover:underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
