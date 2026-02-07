import { useState, useEffect, useRef } from 'react'
import type { LabHomepageProps, PoleId } from '../types'

// Pole configuration with colors and metadata
const POLE_CONFIG: Record<PoleId, {
  name: string
  description: string
  icon: string
  color: string
  bgColor: string
  gradient: string
}> = {
  'design-studio': {
    name: 'Design Studio',
    description: 'Conception de jardins-forêts sur mesure',
    icon: '✏️',
    color: '#AFBD00',
    bgColor: '#e1e6d8',
    gradient: 'from-lime-500/20 to-lime-600/5'
  },
  'academy': {
    name: 'Academy',
    description: 'Formations et transmission des savoirs',
    icon: '📚',
    color: '#B01A19',
    bgColor: '#eac7b8',
    gradient: 'from-red-500/20 to-red-600/5'
  },
  'nursery': {
    name: 'Pépinière',
    description: 'Plants et arbres pour votre projet',
    icon: '🌱',
    color: '#EF9B0D',
    bgColor: '#fbe6c3',
    gradient: 'from-amber-500/20 to-amber-600/5'
  },
  'roots': {
    name: 'Semisto Roots',
    description: 'Bénévolat et chantiers participatifs',
    icon: '🤝',
    color: '#234766',
    bgColor: '#c9d1d9',
    gradient: 'from-slate-500/20 to-slate-600/5'
  }
}

// Animated counter hook
function useAnimatedCounter(end: number, duration = 2000, startOnVisible = true) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(!startOnVisible)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!startOnVisible) return

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
  }, [startOnVisible])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(end * easeOut))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration, isVisible])

  return { count, ref }
}

// Floating decorative element
function FloatingElement({ delay = 0, className = '' }: { delay?: number; className?: string }) {
  return (
    <div
      className={`absolute opacity-20 ${className}`}
      style={{
        animation: `float ${6 + delay}s ease-in-out infinite`,
        animationDelay: `${delay}s`
      }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor">
        <path d="M20 2C20 2 25 10 25 18C25 26 20 34 20 34C20 34 15 26 15 18C15 10 20 2 20 2Z" />
      </svg>
    </div>
  )
}

// Interactive Pole Card with hover effects
function PoleCard({
  poleId,
  isActive,
  onSelect
}: {
  poleId: PoleId
  isActive: boolean
  onSelect: () => void
}) {
  const config = POLE_CONFIG[poleId]
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative group w-full text-left p-6 rounded-2xl border-2 transition-all duration-500
        ${isActive
          ? 'border-transparent shadow-xl scale-[1.02]'
          : 'border-stone-200 dark:border-stone-700 hover:border-transparent hover:shadow-lg'
        }
      `}
      style={{
        backgroundColor: isActive || isHovered ? config.bgColor : undefined,
        borderColor: isActive ? config.color : undefined
      }}
    >
      {/* Background gradient on hover */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <span className="text-3xl">{config.icon}</span>
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
              ${isActive ? 'scale-100 opacity-100' : 'scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100'}
            `}
            style={{ backgroundColor: config.color }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <h3
          className="text-lg font-bold mb-2 text-stone-900 dark:text-stone-100 transition-colors"
          style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
        >
          {config.name}
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {config.description}
        </p>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-6 right-6 h-1 rounded-full transition-all duration-500"
        style={{
          backgroundColor: config.color,
          transform: isActive || isHovered ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'left'
        }}
      />
    </button>
  )
}

// Course Card with beautiful design
function CourseCard({
  course,
  onView
}: {
  course: {
    id: string
    title: string
    shortDescription: string
    nextSession: string
    duration: string
    format: string
    spotsAvailable: number
    spotsTotal: number
    image: string
    price: number
    currency: string
  }
  onView: () => void
}) {
  const spotsPercent = (course.spotsAvailable / course.spotsTotal) * 100
  const isAlmostFull = spotsPercent < 25

  return (
    <button
      onClick={onView}
      className="group relative flex gap-5 p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-lg transition-all duration-300 text-left w-full"
    >
      {/* Image */}
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden">
        <img
          src={course.image}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div
          className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: '#B01A19' }}
        >
          {course.format}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4
            className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#B01A19] transition-colors line-clamp-2"
            style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
          >
            {course.title}
          </h4>
        </div>

        <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2 mb-3">
          {course.shortDescription}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(course.nextSession).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {course.duration}
            </span>
          </div>

          {isAlmostFull && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              Plus que {course.spotsAvailable} places
            </span>
          )}
        </div>
      </div>

      {/* Price badge */}
      <div className="hidden sm:flex flex-col items-end justify-center">
        <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
          {course.price}€
        </span>
        <span className="text-xs text-stone-500 dark:text-stone-400">
          {course.duration}
        </span>
      </div>

      {/* Arrow on hover */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
        <svg className="w-5 h-5 text-[#B01A19]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}

// Event Card with timeline design
function EventCard({
  event,
  onView
}: {
  event: {
    id: string
    type: string
    title: string
    date: string
    time: string
    location: string
    price: number
    currency: string
  }
  onView: () => void
}) {
  const eventDate = new Date(event.date)
  const typeColors: Record<string, { bg: string; text: string }> = {
    'conférence': { bg: '#c8bfd2', text: '#5B5781' },
    'visite': { bg: '#e1e6d8', text: '#AFBD00' },
    'atelier': { bg: '#fbe6c3', text: '#EF9B0D' }
  }
  const colors = typeColors[event.type] || typeColors['atelier']

  return (
    <button
      onClick={onView}
      className="group flex items-center gap-4 p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-all duration-300 text-left w-full"
    >
      {/* Date badge */}
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-stone-100 dark:bg-stone-800 flex flex-col items-center justify-center border border-stone-200 dark:border-stone-700 group-hover:border-[#EF9B0D] transition-colors">
        <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">
          {eventDate.toLocaleDateString('fr-FR', { month: 'short' })}
        </span>
        <span className="text-xl font-bold text-stone-900 dark:text-stone-100">
          {eventDate.getDate()}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {event.type}
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400">{event.time}</span>
        </div>
        <h4 className="font-semibold text-stone-900 dark:text-stone-100 group-hover:text-[#EF9B0D] transition-colors truncate">
          {event.title}
        </h4>
        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
          📍 {event.location}
        </p>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right">
        <span className="font-semibold text-stone-900 dark:text-stone-100">
          {event.price === 0 ? 'Gratuit' : `${event.price}€`}
        </span>
      </div>
    </button>
  )
}

// Project Card with beautiful imagery
function ProjectCard({
  project,
  onView
}: {
  project: {
    id: string
    title: string
    shortDescription: string
    location: string
    surface: number
    treesPlanted: number
    status: string
    images: string[]
    fundingStatus?: string | null
    fundingGoal?: number | null
    fundingRaised?: number | null
  }
  onView: () => void
}) {
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    'completed': { bg: '#e1e6d8', text: '#AFBD00', label: 'Terminé' },
    'in-progress': { bg: '#c8bfd2', text: '#5B5781', label: 'En cours' },
    'funding': { bg: '#fbe6c3', text: '#EF9B0D', label: 'Financement' }
  }
  const status = statusColors[project.status] || statusColors['in-progress']
  const fundingPercent = project.fundingGoal && project.fundingRaised
    ? (project.fundingRaised / project.fundingGoal) * 100
    : 0

  return (
    <button
      onClick={onView}
      className="group relative overflow-hidden rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-xl transition-all duration-500 text-left w-full"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={`https://images.unsplash.com/photo-${['1500651230702-0e2d8a49d4ad', '1416879595882-3373a0480b5b', '1542601906990-b4d3fb778b09'][Math.floor(Math.random() * 3)]}?w=600&q=80`}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Status badge */}
        <div
          className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: status.bg, color: status.text }}
        >
          {status.label}
        </div>

        {/* Surface badge */}
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-stone-900/90 text-stone-900 dark:text-stone-100">
          {project.surface.toLocaleString()} m²
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-white/80 text-sm mb-1">📍 {project.location}</p>
          <h3
            className="text-xl font-bold text-white"
            style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
          >
            {project.title}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 line-clamp-2">
          {project.shortDescription}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 text-stone-600 dark:text-stone-400">
            <span className="text-lg">🌳</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">{project.treesPlanted}</span>
            <span className="text-sm">arbres</span>
          </div>

          {project.status === 'funding' && project.fundingGoal && (
            <div className="text-right">
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                {project.fundingRaised?.toLocaleString()}€
              </span>
              <span className="text-sm text-stone-500 dark:text-stone-400">
                {' '}/ {project.fundingGoal?.toLocaleString()}€
              </span>
            </div>
          )}
        </div>

        {/* Funding progress bar */}
        {project.status === 'funding' && (
          <div className="relative h-2 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
              style={{
                width: `${fundingPercent}%`,
                backgroundColor: '#EF9B0D'
              }}
            />
          </div>
        )}

        {/* CTA for completed projects */}
        {project.status === 'completed' && (
          <div className="flex items-center gap-2 text-[#AFBD00] font-medium text-sm group-hover:translate-x-1 transition-transform">
            Voir le projet
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        )}
      </div>
    </button>
  )
}

// Article Card
function ArticleCard({
  article,
  variant = 'default',
  onView
}: {
  article: {
    id: string
    title: string
    excerpt: string
    author: string
    authorRole: string
    publishedAt: string
    readingTime: number
    category: string
    image: string
  }
  variant?: 'default' | 'featured' | 'compact'
  onView: () => void
}) {
  if (variant === 'featured') {
    return (
      <button
        onClick={onView}
        className="group relative h-full min-h-[400px] overflow-hidden rounded-2xl text-left"
      >
        <img
          src={`https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&q=80`}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm mb-4">
            {article.category}
          </span>
          <h3
            className="text-2xl font-bold text-white mb-3 group-hover:text-lime-300 transition-colors"
            style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
          >
            {article.title}
          </h3>
          <p className="text-white/80 text-sm mb-4 line-clamp-2">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-4 text-white/70 text-sm">
            <span>{article.author}</span>
            <span>•</span>
            <span>{article.readingTime} min</span>
          </div>
        </div>
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={onView}
        className="group flex items-start gap-4 p-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-300 text-left w-full"
      >
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-stone-900 dark:text-stone-100 group-hover:text-[#5B5781] transition-colors line-clamp-2 mb-1">
            {article.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <span>{article.readingTime} min</span>
            <span>•</span>
            <span>{new Date(article.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
          </div>
        </div>
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
          <img
            src={`https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&q=80`}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onView}
      className="group overflow-hidden rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:shadow-lg transition-all duration-300 text-left w-full"
    >
      <div className="aspect-video overflow-hidden">
        <img
          src={`https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80`}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5">
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 mb-3">
          {article.category}
        </span>
        <h4
          className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#5B5781] transition-colors mb-2"
          style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
        >
          {article.title}
        </h4>
        <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2 mb-3">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          <span className="font-medium text-stone-700 dark:text-stone-300">{article.author}</span>
          <span>•</span>
          <span>{article.readingTime} min</span>
        </div>
      </div>
    </button>
  )
}

// Newsletter CTA with beautiful design
function NewsletterSection({
  lab,
  subscriberCount,
  onSubscribe
}: {
  lab: { name: string; region: string }
  subscriberCount: number
  onSubscribe?: (email: string) => void
}) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { count, ref } = useAnimatedCounter(subscriberCount, 2000)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    await new Promise(r => setTimeout(r, 1000))
    onSubscribe?.(email)
    setIsSubmitting(false)
    setIsSuccess(true)
    setEmail('')
  }

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Beautiful gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#5B5781] via-[#4a4670] to-[#3d3a5e]" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-lime-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* Floating leaves */}
      <FloatingElement delay={0} className="top-10 left-[10%] text-lime-400" />
      <FloatingElement delay={1} className="top-20 right-[15%] text-amber-400" />
      <FloatingElement delay={2} className="bottom-16 left-[20%] text-lime-400" />

      <div className="relative max-w-4xl mx-auto text-center" ref={ref}>
        {/* Subscriber count */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
          <span className="font-medium">{count.toLocaleString()}</span> personnes reçoivent notre newsletter
        </div>

        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6"
          style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
        >
          Restez connecté à la nature
        </h2>
        <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
          Recevez chaque mois les actualités de {lab.name}, les prochains événements,
          et des conseils pratiques pour vos jardins-forêts.
        </p>

        {isSuccess ? (
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-lime-500 text-white font-semibold">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Bienvenue dans la communauté !
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <div className="relative flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-6 py-4 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 rounded-full bg-white text-[#5B5781] font-semibold hover:bg-lime-400 hover:text-stone-900 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-[#5B5781] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  S'inscrire
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

export function LabHomepage({
  lab,
  upcomingCourses,
  upcomingEvents,
  recentProjects,
  recentArticles,
  onCourseView,
  onEventView,
  onProjectView,
  onArticleView,
  onNewsletterSubscribe
}: LabHomepageProps) {
  const [activePole, setActivePole] = useState<PoleId | null>(null)
  const [scrollY, setScrollY] = useState(0)
  const featuredArticle = recentArticles.find(a => a.isFeatured)
  const otherArticles = recentArticles.filter(a => a !== featuredArticle).slice(0, 3)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-stone-900">
      {/* Keyframes for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slide-up { animation: slideUp 0.8s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.6s ease-out forwards; }
      `}</style>

      {/* Hero Section - Cinematic and immersive */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background image with parallax */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=1920&q=80)`,
            transform: `translateY(${scrollY * 0.3}px) scale(1.1)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/60 via-stone-900/40 to-stone-900/80" />

        {/* Decorative gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lime-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Region badge */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white mb-8 animate-scale-in"
            style={{ animationDelay: '0.2s' }}
          >
            <span className="w-2 h-2 rounded-full bg-lime-400" />
            <span className="font-medium">{lab.region} • {lab.country}</span>
          </div>

          {/* Main heading */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-slide-up"
            style={{
              fontFamily: '"Sole Serif Small", Georgia, serif',
              animationDelay: '0.3s'
            }}
          >
            {lab.name}
          </h1>

          {/* Description */}
          <p
            className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 animate-slide-up"
            style={{ animationDelay: '0.5s' }}
          >
            {lab.description}
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up"
            style={{ animationDelay: '0.7s' }}
          >
            <button
              className="px-8 py-4 rounded-full font-semibold text-stone-900 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{ backgroundColor: '#AFBD00' }}
            >
              Découvrir nos activités
            </button>
            <button
              className="px-8 py-4 rounded-full font-semibold text-white border-2 border-white/30 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
            >
              Nous contacter
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60">
          <span className="text-xs font-medium tracking-wider uppercase">Défiler</span>
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1">
            <div className="w-1.5 h-3 rounded-full bg-white/60 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Active Poles Section */}
      <section className="py-24 px-6 bg-stone-50 dark:bg-stone-950">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
              style={{ backgroundColor: '#c8bfd2', color: '#5B5781' }}
            >
              Nos pôles d'activités
            </span>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 dark:text-stone-100 mb-4"
              style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
            >
              Explorez nos domaines d'expertise
            </h2>
            <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
              {lab.name} propose {lab.activePoles.length} pôles d'activités complémentaires
              pour accompagner tous vos projets de jardins-forêts.
            </p>
          </div>

          {/* Interactive poles grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {lab.activePoles.map((poleId) => (
              <PoleCard
                key={poleId}
                poleId={poleId}
                isActive={activePole === poleId}
                onSelect={() => setActivePole(activePole === poleId ? null : poleId)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Courses & Events Section */}
      <section className="py-24 px-6 bg-white dark:bg-stone-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Courses */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2"
                    style={{ backgroundColor: '#eac7b8', color: '#B01A19' }}
                  >
                    Academy
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100"
                    style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
                  >
                    Prochaines formations
                  </h3>
                </div>
                <button
                  className="hidden sm:flex items-center gap-2 text-sm font-semibold transition-all hover:gap-3"
                  style={{ color: '#B01A19' }}
                >
                  Tout voir
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {upcomingCourses.slice(0, 3).map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onView={() => onCourseView?.(course.id)}
                  />
                ))}
              </div>
            </div>

            {/* Events */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2"
                    style={{ backgroundColor: '#fbe6c3', color: '#EF9B0D' }}
                  >
                    Agenda
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100"
                    style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
                  >
                    Événements à venir
                  </h3>
                </div>
                <button
                  className="hidden sm:flex items-center gap-2 text-sm font-semibold transition-all hover:gap-3"
                  style={{ color: '#EF9B0D' }}
                >
                  Tout voir
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>

              <div className="bg-stone-50 dark:bg-stone-800 rounded-2xl p-4 space-y-1">
                {upcomingEvents.slice(0, 5).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onView={() => onEventView?.(event.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-24 px-6 bg-stone-50 dark:bg-stone-950">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2"
                style={{ backgroundColor: '#e1e6d8', color: '#AFBD00' }}
              >
                Réalisations
              </span>
              <h2
                className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100"
                style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
              >
                Nos projets
              </h2>
            </div>
            <button
              className="flex items-center gap-2 text-sm font-semibold transition-all hover:gap-3"
              style={{ color: '#AFBD00' }}
            >
              Voir tous les projets
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>

          {/* Projects grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentProjects.slice(0, 3).map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onView={() => onProjectView?.(project.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <NewsletterSection
        lab={lab}
        subscriberCount={lab.newsletterSubscribers}
        onSubscribe={onNewsletterSubscribe}
      />

      {/* Articles Section */}
      <section className="py-24 px-6 bg-white dark:bg-stone-900">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2"
                style={{ backgroundColor: '#c8bfd2', color: '#5B5781' }}
              >
                Blog
              </span>
              <h2
                className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100"
                style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
              >
                Derniers articles
              </h2>
            </div>
            <button
              className="flex items-center gap-2 text-sm font-semibold transition-all hover:gap-3"
              style={{ color: '#5B5781' }}
            >
              Tous les articles
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>

          {/* Articles layout */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Featured article */}
            {featuredArticle && (
              <div className="lg:col-span-2">
                <ArticleCard
                  article={featuredArticle}
                  variant="featured"
                  onView={() => onArticleView?.(featuredArticle.id)}
                />
              </div>
            )}

            {/* Other articles */}
            <div className="space-y-2 bg-stone-50 dark:bg-stone-800 rounded-2xl p-4">
              <h4 className="font-semibold text-stone-500 dark:text-stone-400 text-sm uppercase tracking-wider px-3 pt-2 mb-4">
                Plus d'articles
              </h4>
              {otherArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant="compact"
                  onView={() => onArticleView?.(article.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 bg-stone-100 dark:bg-stone-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-4"
            style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
          >
            Prêt à démarrer votre projet ?
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mb-8 max-w-xl mx-auto">
            Que vous soyez particulier, entreprise ou collectivité, nous vous accompagnons
            dans la création de votre jardin-forêt.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="px-8 py-4 rounded-full font-semibold text-white transition-all hover:scale-105 hover:shadow-xl"
              style={{ backgroundColor: '#5B5781' }}
            >
              Découvrir le Design Studio
            </button>
            <button
              className="px-8 py-4 rounded-full font-semibold border-2 transition-all hover:scale-105"
              style={{ borderColor: '#5B5781', color: '#5B5781' }}
            >
              Nous contacter
            </button>
          </div>
        </div>
      </section>

      {/* Social Links Footer */}
      <section className="py-8 px-6 bg-stone-200 dark:bg-stone-900 border-t border-stone-300 dark:border-stone-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-stone-600 dark:text-stone-400 text-sm">
            Suivez <strong>{lab.name}</strong> sur les réseaux
          </p>
          <div className="flex gap-3">
            {lab.socialLinks.facebook && (
              <a
                href={lab.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white dark:bg-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-[#5B5781] hover:text-white transition-all duration-300 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            )}
            {lab.socialLinks.instagram && (
              <a
                href={lab.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white dark:bg-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-[#5B5781] hover:text-white transition-all duration-300 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            )}
            {lab.socialLinks.youtube && (
              <a
                href={lab.socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white dark:bg-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-[#5B5781] hover:text-white transition-all duration-300 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
