import type { SemistoRootsProps, Worksite, ImpactStats } from '../types'

// Sub-component: Worksite Card with organic, handcrafted feel
interface WorksiteCardProps {
  worksite: Worksite
  onView?: () => void
  onRegister?: () => void
  index: number
}

function WorksiteCard({ worksite, onView, onRegister, index }: WorksiteCardProps) {
  const spotsPercentage = ((worksite.spotsTotal - worksite.spotsAvailable) / worksite.spotsTotal) * 100
  const isAlmostFull = worksite.spotsAvailable <= 5

  // Earthy color rotation for cards
  const earthColors = [
    { bg: 'from-amber-900/90 to-amber-800/80', accent: 'amber' },
    { bg: 'from-emerald-900/90 to-emerald-800/80', accent: 'emerald' },
    { bg: 'from-stone-800/90 to-stone-700/80', accent: 'stone' },
    { bg: 'from-lime-900/90 to-lime-800/80', accent: 'lime' },
  ]
  const colorScheme = earthColors[index % earthColors.length]

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase(),
      weekday: date.toLocaleDateString('fr-FR', { weekday: 'long' })
    }
  }
  const dateInfo = formatDate(worksite.date)

  return (
    <article
      className="group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
      onClick={onView}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Background with torn paper edge effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.bg}`} />

      {/* Organic blob decorations */}
      <svg className="absolute -right-16 -top-16 w-64 h-64 text-white/5" viewBox="0 0 200 200">
        <path d="M45,-61.1C56.7,-52.5,63.4,-37.4,67.8,-21.8C72.2,-6.2,74.3,10,69.8,24C65.3,38,54.2,49.8,41.1,57.7C28,65.6,12.9,69.6,-2.2,72.5C-17.4,75.4,-32.6,77.2,-44.4,70.1C-56.2,63,-64.6,47,-68.8,30.6C-73,14.2,-73,-2.6,-68.4,-17.5C-63.8,-32.4,-54.6,-45.4,-42.6,-53.8C-30.6,-62.2,-15.3,-66,0.8,-67.1C16.9,-68.2,33.3,-69.7,45,-61.1Z"
          transform="translate(100 100)"
          fill="currentColor"
        />
      </svg>

      {/* Soil texture overlay */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      <div className="relative p-6 md:p-8">
        {/* Date badge - like a calendar page torn off */}
        <div className="absolute -top-2 -right-2 md:top-4 md:right-4">
          <div className="relative">
            {/* Shadow layer */}
            <div className="absolute inset-0 bg-black/30 rounded-2xl rotate-3 translate-x-1 translate-y-1" />
            {/* Main badge */}
            <div className="relative bg-white dark:bg-stone-100 rounded-2xl p-3 text-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform duration-300">
              <div className="text-xs font-bold text-stone-500 tracking-wider">{dateInfo.month}</div>
              <div className="text-3xl font-black text-stone-900 leading-none" style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}>
                {dateInfo.day}
              </div>
              <div className="text-[10px] text-stone-600 capitalize">{dateInfo.weekday}</div>
            </div>
          </div>
        </div>

        {/* Difficulty badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white/90 text-sm mb-4">
          <span className="flex gap-0.5">
            {[1, 2, 3].map((level) => (
              <span
                key={level}
                className={`w-2 h-2 rounded-full ${
                  (worksite.difficulty === 'facile' || worksite.difficulty === 'leicht') && level === 1 ? 'bg-emerald-400' :
                  (worksite.difficulty === 'modéré' || worksite.difficulty === 'mittel') && level <= 2 ? 'bg-amber-400' :
                  (worksite.difficulty === 'difficile' || worksite.difficulty === 'schwer') ? 'bg-red-400' :
                  'bg-white/30'
                }`}
              />
            ))}
          </span>
          <span className="capitalize">{worksite.difficulty}</span>
        </div>

        {/* Title */}
        <h3
          className="text-2xl md:text-3xl font-bold text-white mb-3 pr-20 leading-tight"
          style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
        >
          {worksite.title}
        </h3>

        {/* Description */}
        <p className="text-white/80 text-sm md:text-base leading-relaxed mb-6 line-clamp-2">
          {worksite.description}
        </p>

        {/* Location with icon */}
        <div className="flex items-start gap-2 text-white/70 text-sm mb-6">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{worksite.location}</span>
        </div>

        {/* Progress bar - organic style */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/60 text-sm">Places réservées</span>
            <span className={`text-sm font-bold ${isAlmostFull ? 'text-red-300' : 'text-white'}`}>
              {worksite.spotsTotal - worksite.spotsAvailable}/{worksite.spotsTotal}
            </span>
          </div>
          <div className="h-3 bg-black/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isAlmostFull
                  ? 'bg-gradient-to-r from-red-400 to-red-500'
                  : 'bg-gradient-to-r from-lime-400 to-emerald-400'
              }`}
              style={{ width: `${spotsPercentage}%` }}
            />
          </div>
          {isAlmostFull && (
            <p className="text-red-300 text-xs mt-1 animate-pulse">
              Plus que {worksite.spotsAvailable} place{worksite.spotsAvailable > 1 ? 's' : ''} !
            </p>
          )}
        </div>

        {/* Requirements pills */}
        {worksite.requirements.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {worksite.requirements.slice(0, 2).map((req, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-white/10 rounded-lg text-white/70 text-xs"
              >
                {req}
              </span>
            ))}
            {worksite.providedTools && (
              <span className="px-2 py-1 bg-emerald-500/30 rounded-lg text-emerald-200 text-xs flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Outils fournis
              </span>
            )}
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRegister?.()
          }}
          disabled={worksite.spotsAvailable === 0}
          className={`
            w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300
            ${worksite.spotsAvailable === 0
              ? 'bg-white/10 text-white/40 cursor-not-allowed'
              : 'bg-white text-stone-900 hover:bg-lime-400 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
            }
          `}
        >
          {worksite.spotsAvailable === 0 ? 'Complet' : "Je m'inscris"}
        </button>
      </div>
    </article>
  )
}

// Sub-component: Impact Counter with organic animation
interface ImpactCounterProps {
  value: number
  label: string
  icon: React.ReactNode
  suffix?: string
}

function ImpactCounter({ value, label, icon, suffix }: ImpactCounterProps) {
  return (
    <div className="relative group">
      {/* Organic background blob */}
      <div className="absolute inset-0 bg-gradient-to-br from-lime-500/20 to-emerald-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 scale-90 group-hover:scale-100" />

      <div className="relative bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 text-center border border-lime-200/50 dark:border-lime-900/50 transition-all duration-300 hover:shadow-xl">
        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-lime-500 to-emerald-600 flex items-center justify-center text-white shadow-lg">
          {icon}
        </div>
        <div
          className="text-4xl md:text-5xl font-black text-stone-900 dark:text-white mb-2"
          style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
        >
          {value.toLocaleString('fr-FR')}{suffix}
        </div>
        <div className="text-stone-600 dark:text-stone-400 text-sm md:text-base">{label}</div>
      </div>
    </div>
  )
}

// Sub-component: Hand-drawn divider
function OrganicDivider() {
  return (
    <div className="relative h-24 my-8 md:my-16 overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 100"
        preserveAspectRatio="none"
        fill="none"
      >
        {/* Roots spreading horizontally */}
        <path
          d="M0,50 Q100,30 200,50 T400,45 T600,55 T800,48 T1000,52 T1200,50"
          stroke="url(#root-gradient)"
          strokeWidth="3"
          fill="none"
          className="animate-draw-root"
        />
        <path
          d="M0,55 Q150,70 300,55 T500,60 T700,50 T900,58 T1100,52 T1200,55"
          stroke="url(#root-gradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="8,4"
          className="animate-draw-root-2"
        />
        {/* Small root branches */}
        {[150, 350, 550, 750, 950].map((x, i) => (
          <g key={i}>
            <path
              d={`M${x},50 Q${x + 10},${30 + (i % 2) * 40} ${x + 30},${25 + (i % 2) * 50}`}
              stroke="#a3e635"
              strokeWidth="2"
              fill="none"
              opacity="0.6"
            />
            <circle cx={x + 30} cy={25 + (i % 2) * 50} r="4" fill="#84cc16" opacity="0.8" />
          </g>
        ))}
        <defs>
          <linearGradient id="root-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#854d0e" />
            <stop offset="50%" stopColor="#65a30d" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

// Main Component
export function SemistoRoots({
  lab,
  upcomingWorksites,
  impactStats,
  onWorksiteView,
  onWorksiteRegister,
  onJoinHeroes
}: SemistoRootsProps) {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 overflow-hidden">
      {/* Hero Section - Earth & Community */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Layered background */}
        <div className="absolute inset-0">
          {/* Base gradient - earth tones */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900 via-stone-800 to-stone-900" />

          {/* Animated soil texture */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}
          />

          {/* Growing plants from bottom - silhouettes */}
          <svg
            className="absolute bottom-0 left-0 right-0 w-full h-[60%] text-stone-900/50"
            viewBox="0 0 1440 600"
            preserveAspectRatio="xMidYMax slice"
            fill="currentColor"
          >
            {/* Ground layer */}
            <path d="M0,600 L0,450 Q180,420 360,450 T720,430 T1080,460 T1440,440 L1440,600 Z" fill="currentColor" opacity="0.8" />

            {/* Plant silhouettes */}
            <g className="animate-sway-slow">
              <path d="M100,450 Q110,380 100,320 Q90,380 100,450" fill="#365314" opacity="0.6" />
              <path d="M95,340 Q60,320 40,280" stroke="#365314" strokeWidth="3" fill="none" opacity="0.6" />
              <path d="M105,340 Q140,315 170,290" stroke="#365314" strokeWidth="3" fill="none" opacity="0.6" />
            </g>
            <g className="animate-sway-medium" style={{ transformOrigin: '300px 450px' }}>
              <path d="M300,450 Q320,350 300,250 Q280,350 300,450" fill="#3f6212" opacity="0.7" />
              <path d="M295,300 Q250,270 220,220" stroke="#3f6212" strokeWidth="4" fill="none" opacity="0.7" />
              <path d="M305,280 Q350,250 400,230" stroke="#3f6212" strokeWidth="4" fill="none" opacity="0.7" />
              <circle cx="220" cy="220" r="20" fill="#4d7c0f" opacity="0.5" />
              <circle cx="400" cy="230" r="25" fill="#4d7c0f" opacity="0.5" />
            </g>
            <g className="animate-sway-fast" style={{ transformOrigin: '550px 450px' }}>
              <path d="M550,450 Q560,400 550,350 Q540,400 550,450" fill="#4d7c0f" opacity="0.5" />
            </g>
            <g className="animate-sway-slow" style={{ transformOrigin: '800px 460px' }}>
              <path d="M800,460 Q830,320 800,180 Q770,320 800,460" fill="#365314" opacity="0.8" />
              <path d="M795,250 Q720,200 680,130" stroke="#365314" strokeWidth="5" fill="none" opacity="0.8" />
              <path d="M805,220 Q880,170 950,140" stroke="#365314" strokeWidth="5" fill="none" opacity="0.8" />
              <circle cx="680" cy="130" r="35" fill="#4d7c0f" opacity="0.6" />
              <circle cx="950" cy="140" r="40" fill="#4d7c0f" opacity="0.6" />
            </g>
            <g className="animate-sway-medium" style={{ transformOrigin: '1100px 440px' }}>
              <path d="M1100,440 Q1110,380 1100,320 Q1090,380 1100,440" fill="#3f6212" opacity="0.6" />
              <path d="M1095,350 Q1050,320 1020,280" stroke="#3f6212" strokeWidth="3" fill="none" opacity="0.6" />
            </g>
            <g className="animate-sway-fast" style={{ transformOrigin: '1300px 450px' }}>
              <path d="M1300,450 Q1320,380 1300,300 Q1280,380 1300,450" fill="#4d7c0f" opacity="0.7" />
              <path d="M1305,340 Q1360,300 1400,260" stroke="#4d7c0f" strokeWidth="4" fill="none" opacity="0.7" />
              <circle cx="1400" cy="260" r="28" fill="#65a30d" opacity="0.5" />
            </g>
          </svg>

          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-transparent to-stone-900/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center py-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-lime-500/20 border border-lime-500/30 backdrop-blur-sm mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-lime-300 font-medium tracking-wide">{lab.name}</span>
          </div>

          {/* Main title - Hand-painted feel */}
          <h1 className="mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <span
              className="block text-6xl md:text-8xl lg:text-9xl font-black text-white leading-[0.85] tracking-tight"
              style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
            >
              Semisto
            </span>
            <span
              className="block text-7xl md:text-9xl lg:text-[10rem] font-black leading-[0.85] tracking-tight"
              style={{
                fontFamily: '"Sole Serif Small", Georgia, serif',
                background: 'linear-gradient(135deg, #a3e635 0%, #22c55e 50%, #84cc16 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Roots
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-xl md:text-2xl text-stone-300 max-w-3xl mx-auto leading-relaxed mb-12 animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            Rejoignez les <strong className="text-lime-400">Food Forest Heroes</strong> —
            une communauté de planteurs bénévoles qui transforment notre territoire,
            un arbre à la fois.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up"
            style={{ animationDelay: '300ms' }}
          >
            <button
              onClick={onJoinHeroes}
              className="group relative px-10 py-5 bg-lime-500 hover:bg-lime-400 text-stone-900 font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-lime-500/30 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-3">
                Devenir un Hero
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-lime-400 blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
            </button>

            <button
              onClick={() => document.getElementById('worksites')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-5 border-2 border-white/30 hover:border-white/60 text-white font-medium rounded-2xl transition-all duration-300 hover:bg-white/10 backdrop-blur-sm"
            >
              Voir les chantiers
            </button>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <svg className="w-8 h-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Impact Stats Section */}
      <section className="relative py-20 md:py-32 px-6 bg-white dark:bg-stone-900">
        {/* Decorative leaves */}
        <svg className="absolute top-0 right-0 w-64 h-64 text-lime-500/10" viewBox="0 0 200 200" fill="currentColor">
          <path d="M100,0 Q150,50 100,100 Q50,50 100,0" transform="rotate(45 100 100)" />
          <path d="M100,0 Q150,50 100,100 Q50,50 100,0" transform="rotate(90 100 100)" />
        </svg>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-6xl font-black text-stone-900 dark:text-white mb-4"
              style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
            >
              Notre Impact Collectif
            </h2>
            <p className="text-stone-600 dark:text-stone-400 text-lg max-w-2xl mx-auto">
              Chaque chantier participatif nous rapproche d'un futur plus vert. Voici ce que nous avons accompli ensemble.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <ImpactCounter
              value={impactStats.volunteersActive}
              label="Food Forest Heroes actifs"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <ImpactCounter
              value={impactStats.treesPlanted}
              label="arbres plantés ensemble"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      <OrganicDivider />

      {/* Upcoming Worksites Section */}
      <section id="worksites" className="relative py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span
              className="inline-block px-4 py-1 bg-lime-500/20 text-lime-700 dark:text-lime-400 rounded-full text-sm font-medium mb-4"
            >
              Rejoignez-nous sur le terrain
            </span>
            <h2
              className="text-4xl md:text-6xl font-black text-stone-900 dark:text-white mb-4"
              style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
            >
              Prochains Chantiers
            </h2>
            <p className="text-stone-600 dark:text-stone-400 text-lg max-w-2xl mx-auto">
              Aucune expérience requise, juste l'envie de mettre les mains dans la terre et de faire partie du changement.
            </p>
          </div>

          {upcomingWorksites.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
              {upcomingWorksites.map((worksite, index) => (
                <WorksiteCard
                  key={worksite.id}
                  worksite={worksite}
                  index={index}
                  onView={() => onWorksiteView?.(worksite.id)}
                  onRegister={() => onWorksiteRegister?.(worksite.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-stone-200/50 dark:bg-stone-800/50 rounded-3xl">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-stone-300 dark:bg-stone-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-stone-700 dark:text-stone-300 mb-2">
                Pas de chantier programmé
              </h3>
              <p className="text-stone-600 dark:text-stone-400 max-w-md mx-auto">
                Inscrivez-vous comme Food Forest Hero pour être informé des prochains chantiers dès leur annonce.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Join CTA Section */}
      <section className="relative py-24 md:py-32 px-6 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-lime-600 via-emerald-600 to-green-700" />

        {/* Organic pattern overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="leaves-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M10,0 Q15,5 10,10 Q5,5 10,0" fill="currentColor" />
          </pattern>
          <rect width="100" height="100" fill="url(#leaves-pattern)" />
        </svg>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Hand-drawn underline effect */}
          <h2
            className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight"
            style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
          >
            Prêt·e à planter
            <br />
            <span className="relative inline-block">
              l'avenir
              <svg className="absolute -bottom-2 left-0 w-full h-4 text-lime-300" viewBox="0 0 200 20" preserveAspectRatio="none">
                <path d="M0,10 Q50,0 100,10 T200,10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
              </svg>
            </span>
            ?
          </h2>

          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
            Rejoignez une communauté de passionnés qui croit que chaque arbre planté est un acte d'espoir.
          </p>

          <button
            onClick={onJoinHeroes}
            className="group inline-flex items-center gap-4 px-12 py-6 bg-white text-emerald-700 font-bold text-xl rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
          >
            <span>Rejoindre les Roots</span>
            <span className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/70">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-lime-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>100% bénévole</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-lime-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Formation incluse</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-lime-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Convivialité garantie</span>
            </div>
          </div>
        </div>
      </section>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }

        @keyframes sway-slow {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        .animate-sway-slow {
          animation: sway-slow 8s ease-in-out infinite;
        }

        @keyframes sway-medium {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        .animate-sway-medium {
          animation: sway-medium 6s ease-in-out infinite;
        }

        @keyframes sway-fast {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
        .animate-sway-fast {
          animation: sway-fast 4s ease-in-out infinite;
        }

        @keyframes draw-root {
          from { stroke-dashoffset: 2000; }
          to { stroke-dashoffset: 0; }
        }
        .animate-draw-root {
          stroke-dasharray: 2000;
          animation: draw-root 3s ease-out forwards;
        }
        .animate-draw-root-2 {
          stroke-dasharray: 2000;
          animation: draw-root 4s ease-out forwards;
          animation-delay: 0.5s;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
