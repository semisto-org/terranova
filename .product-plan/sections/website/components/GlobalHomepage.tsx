import { useState, useEffect, useRef } from 'react'
import type { HomepageProps, Lab, Course, Project, Article, ImpactStats } from '../types'

// =============================================================================
// AESTHETIC DIRECTION: "Botanical Editorial"
// Inspired by high-end nature magazines meets modern tech.
// Organic shapes, editorial typography, warm earth tones with lime accents.
// Delightful micro-interactions, parallax effects, and a sense of growth.
// =============================================================================

// Animated counter hook
function useAnimatedCounter(end: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setCount(Math.round(end * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [isVisible, end, duration])

  return { count, ref }
}

// Floating leaf decoration
function FloatingLeaf({ delay, size, left, duration }: { delay: number; size: number; left: string; duration: number }) {
  return (
    <div
      className="absolute pointer-events-none opacity-20"
      style={{
        left,
        top: '-50px',
        animation: `floatDown ${duration}s ease-in-out ${delay}s infinite`,
        fontSize: size
      }}
    >
      🍃
    </div>
  )
}

// Impact stat with animated counter
function ImpactStat({ value, label, suffix = '', icon }: { value: number; label: string; suffix?: string; icon: React.ReactNode }) {
  const { count, ref } = useAnimatedCounter(value)

  return (
    <div ref={ref} className="text-center group">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#AFBD00]/20 to-[#AFBD00]/5 flex items-center justify-center text-[#AFBD00] group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <div className="text-4xl md:text-5xl font-bold text-stone-800 dark:text-stone-100 mb-2" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-stone-500 dark:text-stone-400 uppercase tracking-widest">{label}</div>
    </div>
  )
}

// Lab card with hover effect
function LabCard({ lab, onSelect }: { lab: Lab; onSelect?: (id: string) => void }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={() => onSelect?.(lab.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white dark:bg-stone-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 text-left w-full"
    >
      {/* Background image with parallax */}
      <div className="relative h-48 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80)`,
            transform: isHovered ? 'scale(1.1)' : 'scale(1)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />

        {/* Country badge */}
        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold text-stone-700">
          {lab.country === 'BE' ? '🇧🇪' : lab.country === 'FR' ? '🇫🇷' : lab.country === 'ES' ? '🇪🇸' : '🇩🇪'} {lab.region}
        </div>

        {/* Active poles */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-2">
          {lab.activePoles.map(pole => (
            <span
              key={pole}
              className="px-2 py-0.5 rounded-full bg-[#AFBD00]/90 text-[10px] font-bold uppercase tracking-wider text-stone-900"
            >
              {pole === 'design-studio' ? 'Design' : pole === 'academy' ? 'Academy' : pole === 'nursery' ? 'Pépinière' : 'Roots'}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2 group-hover:text-[#5B5781] transition-colors">
          {lab.name}
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 line-clamp-2">
          {lab.shortDescription}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {lab.newsletterSubscribers.toLocaleString()} abonnés
          </span>
        </div>

        {/* Arrow indicator */}
        <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-[#5B5781] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>
    </button>
  )
}

// Course card with playful design
function FeaturedCourseCard({ course, onView }: { course: Course; onView?: (id: string) => void }) {
  return (
    <button
      onClick={() => onView?.(course.id)}
      className="group relative bg-white dark:bg-stone-800 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 text-left w-full"
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={course.image}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent" />

        {/* Price badge */}
        <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-[#AFBD00] text-stone-900 font-bold shadow-lg">
          {course.price}€
        </div>

        {/* Format badge */}
        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold uppercase">
          {course.format}
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#AFBD00] transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-stone-200 line-clamp-2">{course.shortDescription}</p>
        </div>
      </div>

      {/* Meta info */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {course.duration}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {course.location || 'En ligne'}
          </span>
        </div>

        {/* Spots indicator */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#AFBD00] animate-pulse" />
          <span className="text-xs font-medium text-stone-500">{course.spotsAvailable} places</span>
        </div>
      </div>
    </button>
  )
}

// Project card with funding progress
function FeaturedProjectCard({ project, onView }: { project: Project; onView?: (id: string) => void }) {
  const fundingProgress = project.fundingGoal ? Math.round((project.fundingRaised || 0) / project.fundingGoal * 100) : 0

  return (
    <button
      onClick={() => onView?.(project.id)}
      className="group relative bg-white dark:bg-stone-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 text-left w-full"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={`https://images.unsplash.com/photo-${project.status === 'completed' ? '1500651230702-0e2d8a49d4ad' : '1591857177580-dc82b9ac4e1e'}?w=600&q=80`}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-transparent to-transparent" />

        {/* Status badge */}
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          project.status === 'completed' ? 'bg-[#AFBD00] text-stone-900' :
          project.status === 'in-progress' ? 'bg-[#5B5781] text-white' :
          'bg-amber-500 text-white'
        }`}>
          {project.status === 'completed' ? '✓ Terminé' : project.status === 'in-progress' ? 'En cours' : 'Financement'}
        </div>

        {/* Surface badge */}
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold text-stone-700">
          {project.surface.toLocaleString()} m²
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-2 group-hover:text-[#5B5781] transition-colors">
          {project.title}
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 line-clamp-2">
          {project.shortDescription}
        </p>

        {/* Location & trees */}
        <div className="flex items-center gap-4 text-xs text-stone-400 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {project.location}
          </span>
          {project.treesPlanted > 0 && (
            <span className="flex items-center gap-1 text-[#AFBD00]">
              🌳 {project.treesPlanted} arbres
            </span>
          )}
        </div>

        {/* Funding progress */}
        {project.fundingStatus === 'active' && project.fundingGoal && (
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="font-bold text-stone-700 dark:text-stone-300">{project.fundingRaised?.toLocaleString()}€</span>
              <span className="text-stone-400">sur {project.fundingGoal.toLocaleString()}€</span>
            </div>
            <div className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000"
                style={{ width: `${fundingProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </button>
  )
}

// Article card
function FeaturedArticleCard({ article, onView }: { article: Article; onView?: (id: string) => void }) {
  return (
    <button
      onClick={() => onView?.(article.id)}
      className="group text-left w-full"
    >
      {/* Image */}
      <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
        <img
          src={`https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80`}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 to-transparent" />

        {/* Category */}
        <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold uppercase text-stone-700">
          {article.category}
        </div>
      </div>

      {/* Content */}
      <div className="flex items-center gap-2 text-xs text-stone-400 mb-2">
        <span>{article.author}</span>
        <span>•</span>
        <span>{article.readingTime} min</span>
      </div>

      <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-2 group-hover:text-[#5B5781] transition-colors line-clamp-2">
        {article.title}
      </h3>

      <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2">
        {article.excerpt}
      </p>
    </button>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function GlobalHomepage({
  labs,
  featuredCourses,
  featuredProjects,
  featuredArticles,
  impactStats,
  onLabSelect,
  onCourseView,
  onProjectView,
  onArticleView
}: HomepageProps) {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-stone-950 overflow-hidden">
      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=DM+Sans:wght@400;500;600;700&display=swap');

        @keyframes floatDown {
          0%, 100% { transform: translateY(-50px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.2; }
          90% { opacity: 0.2; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-scale-in {
          animation: scaleIn 0.6s ease-out forwards;
        }

        .font-display {
          font-family: 'Fraunces', Georgia, serif;
        }

        .font-body {
          font-family: 'DM Sans', system-ui, sans-serif;
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large organic shape */}
          <div
            className="absolute -right-1/4 -top-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[#AFBD00]/30 to-[#5B5781]/20 blur-3xl"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          />
          <div
            className="absolute -left-1/4 -bottom-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#5B5781]/20 to-[#AFBD00]/10 blur-3xl"
            style={{ transform: `translateY(${scrollY * -0.05}px)` }}
          />

          {/* Floating leaves */}
          <FloatingLeaf delay={0} size={24} left="10%" duration={15} />
          <FloatingLeaf delay={3} size={18} left="30%" duration={18} />
          <FloatingLeaf delay={6} size={28} left="60%" duration={20} />
          <FloatingLeaf delay={9} size={20} left="80%" duration={16} />
          <FloatingLeaf delay={12} size={22} left="45%" duration={22} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#AFBD00]/10 border border-[#AFBD00]/20 mb-8">
                <span className="w-2 h-2 rounded-full bg-[#AFBD00] animate-pulse" />
                <span className="text-sm font-medium text-[#5B5781] font-body">Le mouvement des forêts comestibles</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-stone-800 dark:text-stone-100 mb-8 leading-[1.1] font-display">
                Cultivons
                <br />
                <span className="text-[#5B5781]">l'abondance,</span>
                <br />
                <span className="relative inline-block">
                  ensemble
                  <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" fill="none">
                    <path d="M2 10C50 2 150 2 198 10" stroke="#AFBD00" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p className="text-xl text-stone-600 dark:text-stone-400 mb-10 max-w-xl leading-relaxed font-body">
                Semisto connecte les humains et la nature à travers des jardins-forêts productifs.
                Rejoignez un réseau européen de lieux vivants, nourriciers et résilients.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => document.getElementById('labs-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group px-8 py-4 rounded-full bg-[#5B5781] text-white font-bold text-lg hover:bg-[#4a4669] transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl font-body"
                >
                  Trouver mon Lab
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <button className="px-8 py-4 rounded-full bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold text-lg border border-stone-200 dark:border-stone-700 hover:border-[#5B5781] hover:text-[#5B5781] transition-all duration-300 font-body">
                  Découvrir le concept
                </button>
              </div>
            </div>

            {/* Right: Hero image / illustration */}
            <div className="relative animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative aspect-square max-w-lg mx-auto">
                {/* Decorative rings */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#AFBD00]/30 animate-spin" style={{ animationDuration: '30s' }} />
                <div className="absolute inset-8 rounded-full border-2 border-dashed border-[#5B5781]/20 animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }} />

                {/* Main image */}
                <div className="absolute inset-16 rounded-full overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80"
                    alt="Jardin-forêt luxuriant"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Floating stat cards */}
                <div className="absolute -left-4 top-1/4 bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-xl animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                  <div className="text-3xl font-bold text-[#AFBD00] font-display">{impactStats.treesPlanted.toLocaleString()}</div>
                  <div className="text-xs text-stone-500 uppercase tracking-wider font-body">arbres plantés</div>
                </div>

                <div className="absolute -right-4 bottom-1/4 bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-xl animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                  <div className="text-3xl font-bold text-[#5B5781] font-display">{impactStats.activeLabs}</div>
                  <div className="text-xs text-stone-500 uppercase tracking-wider font-body">Labs actifs</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone-400 animate-bounce">
          <span className="text-xs uppercase tracking-widest font-body">Découvrir</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Impact Stats Section */}
      <section className="py-24 px-6 bg-white dark:bg-stone-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-800 dark:text-stone-100 mb-4 font-display">
              Notre impact collectif
            </h2>
            <p className="text-lg text-stone-500 dark:text-stone-400 max-w-2xl mx-auto font-body">
              Ensemble, nous transformons le paysage européen en écosystèmes nourriciers
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <ImpactStat
              value={impactStats.treesPlanted}
              label="Arbres plantés"
              icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
            />
            <ImpactStat
              value={impactStats.hectaresTransformed}
              suffix=" ha"
              label="Transformés"
              icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>}
            />
            <ImpactStat
              value={impactStats.volunteersActive}
              label="Bénévoles"
              icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
            />
            <ImpactStat
              value={impactStats.trainingParticipants}
              label="Formés"
              icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
            />
          </div>
        </div>
      </section>

      {/* Labs Section */}
      <section id="labs-section" className="py-24 px-6 bg-[#fafaf9] dark:bg-stone-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-16">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#5B5781]/10 text-[#5B5781] text-sm font-bold uppercase tracking-wider mb-4 font-body">
                Notre Réseau
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-stone-800 dark:text-stone-100 font-display">
                Les Semisto Labs
              </h2>
            </div>
            <p className="text-lg text-stone-500 dark:text-stone-400 max-w-md font-body">
              Chaque Lab est un ancrage local autonome développant jardins-forêts, formations et pépinière.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {labs.map((lab, index) => (
              <div key={lab.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in-up">
                <LabCard lab={lab} onSelect={onLabSelect} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-24 px-6 bg-[#5B5781] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <circle cx="80" cy="20" r="40" fill="white" />
            <circle cx="20" cy="80" r="30" fill="white" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-16">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#AFBD00] text-stone-900 text-sm font-bold uppercase tracking-wider mb-4 font-body">
                Semisto Academy
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-white font-display">
                Apprenez à concevoir l'abondance
              </h2>
            </div>
            <button className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm text-white font-semibold hover:bg-white/20 transition-colors font-body">
              Voir toutes les formations →
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.slice(0, 3).map((course, index) => (
              <div key={course.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in-up">
                <FeaturedCourseCard course={course} onView={onCourseView} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-24 px-6 bg-white dark:bg-stone-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-16">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#AFBD00]/10 text-[#AFBD00] text-sm font-bold uppercase tracking-wider mb-4 font-body">
                Réalisations
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-stone-800 dark:text-stone-100 font-display">
                Projets à l'honneur
              </h2>
            </div>
            <button className="px-6 py-3 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors font-body">
              Voir tous les projets →
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProjects.slice(0, 3).map((project, index) => (
              <div key={project.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in-up">
                <FeaturedProjectCard project={project} onView={onProjectView} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="py-24 px-6 bg-[#fafaf9] dark:bg-stone-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-stone-800 dark:text-stone-100 mb-4 font-display">
              Ressources & Actualités
            </h2>
            <p className="text-lg text-stone-500 dark:text-stone-400 font-body">
              Découvrez nos derniers articles et guides pratiques
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredArticles.slice(0, 3).map((article, index) => (
              <div key={article.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in-up">
                <FeaturedArticleCard article={article} onView={onArticleView} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#5B5781] to-[#4a4669] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#AFBD00]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 font-display">
            Restez connecté au mouvement
          </h2>
          <p className="text-xl text-stone-200 mb-10 font-body">
            Recevez nos conseils de saison, les dates de formations et les actualités du réseau.
          </p>

          <form className="flex flex-col sm:flex-row gap-4 justify-center" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="votre@email.com"
              className="px-8 py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#AFBD00] flex-grow max-w-md font-body"
            />
            <button
              type="submit"
              className="px-8 py-4 rounded-full bg-[#AFBD00] text-stone-900 font-bold hover:bg-[#c2d100] transition-colors whitespace-nowrap shadow-lg font-body"
            >
              S'inscrire 🌱
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
