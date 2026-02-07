import type { Lab } from '../types'

interface LabCardProps {
  lab: Lab
  onSelect?: (labId: string) => void
}

export function LabCard({ lab, onSelect }: LabCardProps) {
  return (
    <div 
      onClick={() => onSelect?.(lab.id)}
      className="group cursor-pointer bg-white dark:bg-stone-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-stone-200 dark:border-stone-700"
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={lab.heroImage} 
          alt={lab.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
        <div className="absolute bottom-4 left-4 right-4">
          <span className="text-white/90 text-sm font-medium block mb-1">
            {lab.country} • {lab.region}
          </span>
          <h3 
            className="text-xl font-bold text-white leading-tight"
            style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
          >
            {lab.name}
          </h3>
        </div>
      </div>
      
      <div className="p-5">
        <p className="text-stone-600 dark:text-stone-300 text-sm mb-4 line-clamp-2">
          {lab.shortDescription}
        </p>
        
        <div className="flex flex-wrap gap-2">
          {lab.activePoles.map(pole => (
            <span 
              key={pole}
              className="px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400"
            >
              {pole.replace('-', ' ')}
            </span>
          ))}
        </div>
        
        <div className="mt-4 flex items-center text-[#AFBD00] text-sm font-semibold group-hover:translate-x-1 transition-transform">
          Visiter le Lab
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </div>
  )
}
