import type { PoleId } from '../types'

interface PoleCardProps {
  poleId: PoleId
  onSelect?: () => void
}

const poleData: Record<PoleId, { 
  title: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
}> = {
  'design-studio': {
    title: 'Design Studio',
    description: 'Conception de jardins-forêts sur mesure pour particuliers, entreprises et collectivités',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
    color: '#AFBD00',
    bgColor: '#e1e6d8'
  },
  'academy': {
    title: 'Academy',
    description: 'Formations et événements pour apprendre à créer et entretenir des jardins-forêts',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
    color: '#B01A19',
    bgColor: '#eac7b8'
  },
  'nursery': {
    title: 'Pépinière',
    description: 'Production et vente de plantes adaptées aux jardins-forêts',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
    color: '#EF9B0D',
    bgColor: '#fbe6c3'
  },
  'roots': {
    title: 'Semisto Roots',
    description: 'Rejoignez les Food Forest Heroes pour des chantiers participatifs bénévoles',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    color: '#234766',
    bgColor: '#c9d1d9'
  }
}

export function PoleCard({ poleId, onSelect }: PoleCardProps) {
  const pole = poleData[poleId]
  
  return (
    <button
      onClick={onSelect}
      className="group relative flex flex-col items-start p-8 rounded-3xl text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{ 
        backgroundColor: pole.bgColor,
        // @ts-expect-error CSS custom property
        '--tw-ring-color': pole.color
      }}
    >
      {/* Decorative corner accent */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-bl-[80px] opacity-30 transition-opacity group-hover:opacity-50"
        style={{ backgroundColor: pole.color }}
      />
      
      {/* Icon */}
      <div 
        className="relative z-10 p-4 rounded-2xl mb-6 transition-transform group-hover:scale-110"
        style={{ backgroundColor: pole.color, color: 'white' }}
      >
        {pole.icon}
      </div>
      
      {/* Content */}
      <h3 
        className="relative z-10 text-2xl font-bold mb-3 tracking-tight"
        style={{ color: pole.color, fontFamily: '"Sole Serif Small", Georgia, serif' }}
      >
        {pole.title}
      </h3>
      
      <p className="relative z-10 text-stone-600 dark:text-stone-700 leading-relaxed mb-6">
        {pole.description}
      </p>
      
      {/* Arrow indicator */}
      <div 
        className="relative z-10 mt-auto flex items-center gap-2 text-sm font-semibold transition-transform group-hover:translate-x-2"
        style={{ color: pole.color }}
      >
        <span>Découvrir</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </button>
  )
}

