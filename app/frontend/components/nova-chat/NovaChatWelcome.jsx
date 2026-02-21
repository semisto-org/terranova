import React from 'react'

const suggestions = [
  'Prochaine formation ?',
  'Espèces recommandées',
  'Aide Terranova',
]

export default function NovaChatWelcome({ onSuggestion }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8 nova-animate-fade">
      <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center text-2xl mb-4">
        🌱
      </div>
      <h3 className="text-base font-semibold text-stone-800 mb-1.5">
        Salut ! Je suis Nova 🌱
      </h3>
      <p className="text-sm text-stone-500 mb-6 max-w-[260px]">
        Ton assistante Semisto. Pose-moi n'importe quelle question !
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="px-3 py-1.5 text-xs font-medium rounded-full border border-teal-200 text-teal-700 bg-teal-50/50 hover:bg-teal-100 hover:border-teal-300 transition-all duration-200"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
