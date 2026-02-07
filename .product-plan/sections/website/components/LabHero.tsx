import type { Lab } from '../types'

interface LabHeroProps {
  lab: Lab
  onNewsletterSubscribe?: (email: string) => void
}

export function LabHero({ lab, onNewsletterSubscribe }: LabHeroProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    if (email && onNewsletterSubscribe) {
      onNewsletterSubscribe(email)
    }
  }

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Organic background shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-stone-100 to-[#c8bfd2]/30 dark:from-stone-950 dark:via-stone-900 dark:to-[#5B5781]/20" />
      
      {/* Decorative blob shapes */}
      <div 
        className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #AFBD00 0%, transparent 70%)' }}
      />
      <div 
        className="absolute -bottom-48 -left-24 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #5B5781 0%, transparent 70%)' }}
      />
      
      {/* Leaf pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5c-8 12-25 20-25 35 0 10 11 15 25 15s25-5 25-15c0-15-17-23-25-35z' fill='%235B5781' fill-opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative w-full max-w-7xl mx-auto px-6 py-20 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left content */}
          <div className="space-y-8">
            {/* Region badge */}
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: '#c8bfd2',
                color: '#5B5781'
              }}
            >
              <span className="w-2 h-2 rounded-full bg-[#AFBD00] animate-pulse" />
              {lab.region}, {lab.country}
            </div>

            {/* Main heading */}
            <h1 
              className="text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-stone-900 dark:text-stone-50"
              style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
            >
              <span className="block">{lab.name.replace('Semisto ', '')}</span>
              <span 
                className="block mt-2"
                style={{ color: '#5B5781' }}
              >
                Jardins-Forêts
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-stone-600 dark:text-stone-400 max-w-xl leading-relaxed">
              {lab.description}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-8 pt-4">
              <div>
                <div 
                  className="text-3xl font-bold"
                  style={{ color: '#AFBD00' }}
                >
                  {lab.activePoles.length}
                </div>
                <div className="text-sm text-stone-500 dark:text-stone-400">
                  Pôles actifs
                </div>
              </div>
              <div>
                <div 
                  className="text-3xl font-bold"
                  style={{ color: '#5B5781' }}
                >
                  {lab.newsletterSubscribers.toLocaleString()}+
                </div>
                <div className="text-sm text-stone-500 dark:text-stone-400">
                  Abonnés newsletter
                </div>
              </div>
            </div>

            {/* Newsletter mini form */}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 pt-4">
              <input
                type="email"
                name="email"
                placeholder="votre@email.com"
                required
                className="flex-1 px-5 py-3.5 rounded-full border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-[#5B5781] transition-colors"
              />
              <button
                type="submit"
                className="px-8 py-3.5 rounded-full font-semibold text-white transition-all hover:scale-105 hover:shadow-lg active:scale-100"
                style={{ backgroundColor: '#5B5781' }}
              >
                S'abonner
              </button>
            </form>
          </div>

          {/* Right visual - Abstract forest layers */}
          <div className="relative hidden lg:block">
            <div className="relative w-full aspect-square">
              {/* Layered forest strata visualization */}
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="absolute rounded-[40%_60%_70%_30%/30%_40%_60%_70%] transition-transform duration-700 hover:scale-105"
                  style={{
                    width: `${85 - i * 12}%`,
                    height: `${85 - i * 12}%`,
                    left: `${7 + i * 6}%`,
                    top: `${7 + i * 6}%`,
                    backgroundColor: i % 2 === 0 ? '#5B5781' : '#AFBD00',
                    opacity: 0.15 + i * 0.15,
                    animationDelay: `${i * 150}ms`,
                  }}
                />
              ))}
              
              {/* Center icon */}
              <div 
                className="absolute inset-0 flex items-center justify-center"
              >
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl"
                  style={{ backgroundColor: '#5B5781' }}
                >
                  <svg 
                    className="w-12 h-12 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave transition */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg 
          viewBox="0 0 1440 120" 
          className="w-full h-auto fill-white dark:fill-stone-900"
          preserveAspectRatio="none"
        >
          <path d="M0,64 C480,120 960,0 1440,64 L1440,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  )
}

