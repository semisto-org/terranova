import React from 'react'

/**
 * Bouton flottant pour ouvrir le formulaire de feedback Tally
 * Positionné en bas à droite avec un design organique et accueillant
 * S'inspire de l'esthétique naturelle de Terranova avec des formes organiques
 */
export default function FeedbackButton() {
  return (
    <button
      data-tally-open="LZWR7O"
      data-tally-hide-title="1"
      data-tally-emoji-text="👋"
      data-tally-emoji-animation="wave"
      data-tally-auto-close="5000"
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="Ouvrir le formulaire de feedback"
    >
      {/* Cercle principal avec gradient organique inspiré de la palette Lab */}
      <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-[#5B5781] via-[#7B6B9F] to-[#9B8BBF] shadow-[0_5px_16px_rgba(91,87,129,0.3)] hover:shadow-[0_8px_24px_rgba(91,87,129,0.4)] transition-all duration-500 hover:scale-110 flex items-center justify-center overflow-hidden">
        {/* Bordure organique subtile */}
        <div className="absolute inset-0 rounded-full border-2 border-white/20" />
        
        {/* Texture de grain organique */}
        <div 
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Emoji avec animation fluide */}
        <span className="relative text-2xl leading-none transform transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 select-none">
          👋
        </span>
        
        {/* Pulsation organique au hover */}
        <div className="absolute inset-0 rounded-full bg-[#5B5781] opacity-0 group-hover:opacity-30 group-hover:animate-ping" style={{ animationDuration: '1.5s' }} />
        
        {/* Lueur subtile */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#5B5781]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md" />
      </div>
      
      {/* Tooltip élégant au hover */}
      <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-stone-900/95 backdrop-blur-sm text-white text-sm font-medium rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-xl transform translate-y-2 group-hover:translate-y-0">
        Une idée? Un avis ou un besoin?
        <div className="absolute top-full right-5 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-stone-900/95" />
      </div>
    </button>
  )
}
