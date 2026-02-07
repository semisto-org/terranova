import { useState, useEffect, useRef } from 'react'
import type { ArticleDetailProps, Article } from '../types'

// =============================================================================
// Sub-Components
// =============================================================================

// Plant Growth Reading Progress - A growing stem with leaves and flowers
function ReadingProgress({ articleEndRef }: { articleEndRef: React.RefObject<HTMLDivElement | null> }) {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateProgress = () => {
      // Calculate progress based on article end position, not page end
      const articleEnd = articleEndRef.current
      if (!articleEnd) {
        // Fallback to page-based calculation
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
        const scrolled = window.scrollY
        const percentage = Math.min(100, Math.max(0, (scrolled / scrollHeight) * 100))
        setProgress(percentage)
      } else {
        // Calculate based on article end marker
        const articleEndPosition = articleEnd.getBoundingClientRect().top + window.scrollY
        const viewportHeight = window.innerHeight
        const scrolled = window.scrollY

        // Progress is 100% when the article end reaches the bottom of the viewport
        const targetScroll = articleEndPosition - viewportHeight
        const percentage = Math.min(100, Math.max(0, (scrolled / targetScroll) * 100))
        setProgress(percentage)
      }

      setIsVisible(window.scrollY > 50)
    }

    window.addEventListener('scroll', updateProgress)
    updateProgress() // Initial calculation
    return () => window.removeEventListener('scroll', updateProgress)
  }, [articleEndRef])

  // Generate leaf positions along the stem
  const leaves = [
    { position: 8, side: 'top', type: 'small', delay: 0 },
    { position: 15, side: 'bottom', type: 'medium', delay: 50 },
    { position: 25, side: 'top', type: 'small', delay: 100 },
    { position: 32, side: 'bottom', type: 'large', delay: 150 },
    { position: 42, side: 'top', type: 'medium', delay: 200 },
    { position: 50, side: 'bottom', type: 'small', delay: 250 },
    { position: 58, side: 'top', type: 'large', delay: 300 },
    { position: 65, side: 'bottom', type: 'medium', delay: 350 },
    { position: 75, side: 'top', type: 'small', delay: 400 },
    { position: 82, side: 'bottom', type: 'large', delay: 450 },
    { position: 90, side: 'top', type: 'medium', delay: 500 },
  ]

  // Generate flowers at key progress points
  const flowers = [
    { position: 33, type: 'bud', delay: 200 },
    { position: 66, type: 'bloom', delay: 400 },
    { position: 95, type: 'full', delay: 600 },
  ]

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 h-12 transition-all duration-500 ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-full'
      }`}
    >
      {/* Background container */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white/0 dark:from-stone-950/95 dark:via-stone-950/90 dark:to-stone-950/0 backdrop-blur-sm" />

      {/* The growing plant container */}
      <div className="relative h-full max-w-screen-2xl mx-auto px-4">
        {/* Soil/pot at the start */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20">
          <svg width="24" height="24" viewBox="0 0 24 24" className="text-amber-700 dark:text-amber-600">
            {/* Pot */}
            <path
              d="M4 12 L6 20 L18 20 L20 12 Z"
              fill="currentColor"
              className="opacity-80"
            />
            <ellipse cx="12" cy="12" rx="8" ry="2" fill="currentColor" />
            {/* Soil */}
            <ellipse cx="12" cy="11" rx="6" ry="1.5" className="fill-amber-900 dark:fill-amber-800" />
          </svg>
        </div>

        {/* Main stem - grows from left to right */}
        <svg
          className="absolute inset-0 w-full h-full overflow-visible"
          preserveAspectRatio="none"
          style={{ marginLeft: '28px', width: 'calc(100% - 56px)' }}
        >
          <defs>
            {/* Stem gradient */}
            <linearGradient id="stemGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#65a30d" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#84cc16" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="stemGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Leaf gradient */}
            <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>

            {/* Flower gradient */}
            <radialGradient id="flowerGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#eab308" />
            </radialGradient>
          </defs>

          {/* Background track (subtle) */}
          <line
            x1="0%"
            y1="50%"
            x2="100%"
            y2="50%"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="text-stone-200 dark:text-stone-800"
            strokeOpacity="0.5"
          />

          {/* Growing stem with natural curve */}
          <path
            d={`M 0,24 Q ${progress * 0.5}%,${20 + Math.sin(progress * 0.1) * 4} ${progress}%,24`}
            fill="none"
            stroke="url(#stemGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#stemGlow)"
            className="transition-all duration-300 ease-out"
            style={{
              strokeDasharray: 2000,
              strokeDashoffset: 2000 - (progress * 20),
            }}
          />

          {/* Leaves along the stem */}
          {leaves.map((leaf, index) => {
            const isReached = progress >= leaf.position
            const leafProgress = isReached ? Math.min(1, (progress - leaf.position) / 5) : 0

            // Different leaf shapes based on type
            const leafSize = leaf.type === 'small' ? 8 : leaf.type === 'medium' ? 12 : 16
            const yOffset = leaf.side === 'top' ? -leafSize - 2 : leafSize + 2

            return (
              <g
                key={index}
                style={{
                  transform: `translate(${leaf.position}%, 24px)`,
                  opacity: leafProgress,
                  transition: `all 0.5s ease-out ${leaf.delay}ms`,
                }}
              >
                {/* Leaf */}
                <path
                  d={leaf.side === 'top'
                    ? `M 0,0 Q ${leafSize * 0.7},${-leafSize * 0.8} ${leafSize},${-leafSize * 0.3} Q ${leafSize * 0.7},${leafSize * 0.2} 0,0`
                    : `M 0,0 Q ${leafSize * 0.7},${leafSize * 0.8} ${leafSize},${leafSize * 0.3} Q ${leafSize * 0.7},${-leafSize * 0.2} 0,0`
                  }
                  fill="url(#leafGradient)"
                  style={{
                    transform: `scale(${leafProgress}) rotate(${leaf.side === 'top' ? -30 : 30}deg)`,
                    transformOrigin: '0 0',
                    transition: `transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${leaf.delay}ms`,
                  }}
                />
                {/* Leaf vein */}
                <line
                  x1="1"
                  y1={leaf.side === 'top' ? -1 : 1}
                  x2={leafSize * 0.6}
                  y2={leaf.side === 'top' ? -leafSize * 0.4 : leafSize * 0.4}
                  stroke="#166534"
                  strokeWidth="0.5"
                  strokeOpacity="0.3"
                  style={{
                    transform: `rotate(${leaf.side === 'top' ? -30 : 30}deg)`,
                    transformOrigin: '0 0',
                  }}
                />
              </g>
            )
          })}

          {/* Flowers at milestone points */}
          {flowers.map((flower, index) => {
            const isReached = progress >= flower.position
            const flowerProgress = isReached ? Math.min(1, (progress - flower.position) / 8) : 0

            return (
              <g
                key={`flower-${index}`}
                style={{
                  transform: `translate(${flower.position}%, 24px)`,
                  opacity: flowerProgress,
                  transition: `all 0.6s ease-out ${flower.delay}ms`,
                }}
              >
                {flower.type === 'bud' && (
                  // Small bud
                  <ellipse
                    cx="0"
                    cy="-8"
                    rx={4 * flowerProgress}
                    ry={6 * flowerProgress}
                    fill="#84cc16"
                    style={{ transition: 'all 0.4s ease-out' }}
                  />
                )}
                {flower.type === 'bloom' && (
                  // Opening flower
                  <g style={{ transform: `scale(${flowerProgress})`, transformOrigin: '0 -10px' }}>
                    {[0, 72, 144, 216, 288].map((angle) => (
                      <ellipse
                        key={angle}
                        cx="0"
                        cy="-14"
                        rx="4"
                        ry="6"
                        fill="url(#flowerGradient)"
                        style={{
                          transform: `rotate(${angle}deg)`,
                          transformOrigin: '0 -8px',
                        }}
                      />
                    ))}
                    <circle cx="0" cy="-10" r="3" fill="#fbbf24" />
                  </g>
                )}
                {flower.type === 'full' && (
                  // Full bloom with more petals
                  <g style={{ transform: `scale(${flowerProgress})`, transformOrigin: '0 -12px' }}>
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                      <ellipse
                        key={angle}
                        cx="0"
                        cy="-18"
                        rx="5"
                        ry="8"
                        fill="url(#flowerGradient)"
                        style={{
                          transform: `rotate(${angle}deg)`,
                          transformOrigin: '0 -10px',
                        }}
                      />
                    ))}
                    <circle cx="0" cy="-12" r="4" fill="#f59e0b" />
                    {/* Sparkle effect for completion */}
                    {progress >= 98 && (
                      <>
                        <circle cx="8" cy="-20" r="1.5" fill="#fef08a" className="animate-ping" style={{ animationDuration: '1.5s' }} />
                        <circle cx="-6" cy="-18" r="1" fill="#fef08a" className="animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                        <circle cx="4" cy="-6" r="1.5" fill="#fef08a" className="animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.3s' }} />
                      </>
                    )}
                  </g>
                )}
              </g>
            )
          })}

          {/* Growing tip (small leaf emerging at the end) */}
          <g
            style={{
              transform: `translate(${progress}%, 24px)`,
              transition: 'transform 0.15s ease-out',
            }}
          >
            {/* Tip bud */}
            <ellipse
              cx="2"
              cy="-3"
              rx="3"
              ry="5"
              fill="#84cc16"
              style={{
                transform: 'rotate(-20deg)',
                transformOrigin: '0 0',
              }}
            />
            <ellipse
              cx="2"
              cy="3"
              rx="3"
              ry="4"
              fill="#65a30d"
              style={{
                transform: 'rotate(20deg)',
                transformOrigin: '0 0',
              }}
            />
          </g>
        </svg>

        {/* Progress percentage (subtle) */}
        <div
          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400 dark:text-stone-500 tabular-nums"
          style={{ opacity: isVisible ? 0.7 : 0 }}
        >
          {Math.round(progress)}%
        </div>
      </div>

      {/* Bottom fade line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-500/20 to-transparent" />
    </div>
  )
}

// Floating table of contents (desktop)
function FloatingTOC({ headings, activeId }: { headings: { id: string; text: string }[]; activeId: string }) {
  if (headings.length === 0) return null

  return (
    <nav className="hidden xl:block fixed left-8 top-1/2 -translate-y-1/2 z-40 max-w-[200px]">
      <div className="relative pl-4 border-l-2 border-stone-200 dark:border-stone-800">
        {headings.map((heading, index) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={`
              block py-2 text-sm transition-all duration-300
              ${activeId === heading.id
                ? 'text-lime-600 dark:text-lime-400 font-medium translate-x-1'
                : 'text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400'
              }
            `}
          >
            <span
              className={`
                absolute left-0 w-2 h-2 rounded-full -translate-x-[5px] transition-all duration-300
                ${activeId === heading.id
                  ? 'bg-lime-500 scale-125'
                  : 'bg-stone-300 dark:bg-stone-700'
                }
              `}
              style={{ top: `${index * 40 + 16}px` }}
            />
            {heading.text}
          </a>
        ))}
      </div>
    </nav>
  )
}

// Category badge with gradient
function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    'technique': 'from-emerald-500 to-teal-500',
    'retour-experience': 'from-amber-500 to-orange-500',
    'témoignage': 'from-violet-500 to-purple-500',
    'actualité': 'from-blue-500 to-cyan-500'
  }

  const labels: Record<string, string> = {
    'technique': 'Guide technique',
    'retour-experience': "Retour d'expérience",
    'témoignage': 'Témoignage',
    'actualité': 'Actualité'
  }

  return (
    <span className={`
      inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold text-white
      bg-gradient-to-r ${colors[category] || 'from-stone-500 to-stone-600'}
    `}>
      {labels[category] || category}
    </span>
  )
}

// Author card with avatar
interface AuthorCardProps {
  author: string
  role: string
  publishedAt: string
  readingTime: number
}

function AuthorCard({ author, role, publishedAt, readingTime }: AuthorCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Generate initials for avatar
  const initials = author.split(' ').map(n => n[0]).join('').slice(0, 2)

  // Note: This component is used in the hero section which always has a dark background
  // So we use light text colors that work on dark backgrounds
  return (
    <div className="flex items-center gap-4">
      {/* Avatar */}
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
          {initials}
        </div>
        {/* Decorative ring */}
        <div className="absolute -inset-1 rounded-full border-2 border-lime-500/30" />
      </div>

      <div>
        <p className="font-bold text-white text-lg">{author}</p>
        <p className="text-stone-300 text-sm">{role}</p>
        <div className="flex items-center gap-3 mt-1 text-sm text-stone-400">
          <span>{formatDate(publishedAt)}</span>
          <span className="w-1 h-1 rounded-full bg-stone-500" />
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {readingTime} min
          </span>
        </div>
      </div>
    </div>
  )
}

// Pull quote component
function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="relative my-16 mx-auto max-w-3xl">
      {/* Decorative quote mark */}
      <svg
        className="absolute -top-8 -left-4 w-24 h-24 text-lime-500/20 dark:text-lime-400/10"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M30,60 L30,40 Q30,20 50,20 L50,30 Q40,30 40,40 L50,40 L50,60 Z M60,60 L60,40 Q60,20 80,20 L80,30 Q70,30 70,40 L80,40 L80,60 Z" />
      </svg>

      <p
        className="relative text-3xl md:text-4xl font-light text-stone-700 dark:text-stone-300 leading-relaxed italic"
        style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
      >
        {children}
      </p>

      {/* Decorative line */}
      <div className="mt-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-lime-500 to-transparent" />
        <svg className="w-6 h-6 text-lime-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L4 12h4v6H4l8 12 8-12h-4v-6h4L12 2z" />
        </svg>
        <div className="h-px flex-1 bg-gradient-to-l from-lime-500 to-transparent" />
      </div>
    </blockquote>
  )
}

// Share buttons
function ShareButtons({ title }: { title: string }) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-stone-300 font-medium">Partager</span>
      <div className="flex gap-2">
        {/* Facebook */}
        <button
          onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-[#1877F2] hover:text-white hover:scale-110 transition-all duration-300"
          aria-label="Partager sur Facebook"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </button>
        {/* LinkedIn */}
        <button
          onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-[#0A66C2] hover:text-white hover:scale-110 transition-all duration-300"
          aria-label="Partager sur LinkedIn"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </button>
        {/* Copy link */}
        <button
          onClick={() => navigator.clipboard?.writeText(shareUrl)}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-lime-500 hover:text-white hover:scale-110 transition-all duration-300"
          aria-label="Copier le lien"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Related article card
interface RelatedCardProps {
  article: Article
  onClick?: () => void
}

function RelatedCard({ article, onClick }: RelatedCardProps) {
  return (
    <article
      onClick={onClick}
      className="group cursor-pointer"
    >
      {/* Image placeholder */}
      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-800 dark:to-stone-700">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Decorative pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id={`related-${article.id}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="4" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill={`url(#related-${article.id})`} />
        </svg>

        {/* Category */}
        <div className="absolute top-3 left-3">
          <CategoryBadge category={article.category} />
        </div>

        {/* Reading time */}
        <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm">
          {article.readingTime} min
        </div>
      </div>

      <h3
        className="text-xl font-bold text-stone-900 dark:text-white mb-2 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors line-clamp-2"
        style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
      >
        {article.title}
      </h3>

      <p className="text-stone-600 dark:text-stone-400 text-sm line-clamp-2">
        {article.excerpt}
      </p>
    </article>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function ArticleDetail({
  article,
  lab,
  relatedArticles,
  onBack
}: ArticleDetailProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const articleEndRef = useRef<HTMLDivElement>(null)
  const [activeHeading, setActiveHeading] = useState('')

  // Simulated content sections based on article.content
  // In real implementation, this would be parsed markdown/rich text
  const contentSections = [
    {
      id: 'introduction',
      title: 'Introduction',
      content: article.content
    },
    {
      id: 'concept',
      title: 'Le concept',
      content: "Le jardin-forêt, aussi appelé forêt comestible ou forêt nourricière, est un système agroforestier qui imite la structure et les fonctions d'une forêt naturelle tout en produisant une abondance de nourriture. Contrairement aux monocultures conventionnelles, il combine arbres fruitiers, arbustes à baies, plantes grimpantes, légumes vivaces et plantes couvre-sol dans un écosystème productif et auto-entretenu."
    },
    {
      id: 'strates',
      title: 'Les sept strates',
      content: "La canopée (grands arbres fruitiers et à noix), la strate arborée basse (petits arbres et arbres nains), la strate arbustive (arbustes à fruits et à fleurs), la strate herbacée (légumes vivaces et herbes aromatiques), la strate couvre-sol (plantes rampantes et couvre-sol comestibles), la strate grimpante (vignes et lianes), et enfin la rhizosphère (racines et tubercules comestibles)."
    },
    {
      id: 'benefices',
      title: 'Les bénéfices',
      content: "Une fois établi, le jardin-forêt demande très peu d'entretien comparé à un potager traditionnel. Il séquestre du carbone, crée des habitats pour la biodiversité, régénère les sols, produit de la nourriture variée et nutritive, et offre un espace de bien-être et de connexion avec la nature. C'est une solution concrète face aux défis climatiques et alimentaires de notre époque."
    },
    {
      id: 'conclusion',
      title: 'Pour aller plus loin',
      content: "Si ce sujet vous inspire, nous vous invitons à découvrir nos formations, à visiter l'un de nos jardins-forêts démonstrateurs, ou à rejoindre notre communauté de Food Forest Heroes pour participer à des chantiers de plantation. Chaque arbre planté est un acte d'espoir pour les générations futures."
    }
  ]

  // Track active heading on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0% -70% 0%' }
    )

    contentSections.forEach((section) => {
      const element = document.getElementById(section.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950">
      <ReadingProgress articleEndRef={articleEndRef} />

      <FloatingTOC
        headings={contentSections.map(s => ({ id: s.id, text: s.title }))}
        activeId={activeHeading}
      />

      {/* Hero Section */}
      <header className="relative min-h-[80vh] flex items-end overflow-hidden">
        {/* Full-bleed Unsplash background image */}
        <div className="absolute inset-0">
          {/* Background image - lush forest canopy */}
          <img
            src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Color overlay for brand cohesion */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-stone-900/30 to-stone-900/50 mix-blend-multiply" />

          {/* Animated gradient orbs for depth */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute w-[800px] h-[800px] rounded-full blur-3xl opacity-20 animate-float-slow"
              style={{
                background: 'radial-gradient(circle, #84cc16 0%, transparent 70%)',
                top: '-20%',
                right: '-10%'
              }}
            />
            <div
              className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-15 animate-float-medium"
              style={{
                background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)',
                bottom: '-10%',
                left: '-5%'
              }}
            />
          </div>

          {/* Film grain texture for cinematic feel */}
          <div
            className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}
          />
        </div>

        {/* Multi-layer gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/50 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-16 pt-32">
          {/* Back button */}
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-stone-400 hover:text-white mb-8 transition-colors"
          >
            <svg
              className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour aux articles
          </button>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <CategoryBadge category={article.category} />
            <span className="text-stone-400 text-sm">{lab.name}</span>
          </div>

          {/* Title */}
          <h1
            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1] mb-8 max-w-4xl animate-fade-in-up"
            style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
          >
            {article.title}
          </h1>

          {/* Excerpt as intro */}
          <p
            className="text-xl md:text-2xl text-stone-300 leading-relaxed max-w-3xl mb-10 animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            {article.excerpt}
          </p>

          {/* Author and share */}
          <div
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            <AuthorCard
              author={article.author}
              role={article.authorRole}
              publishedAt={article.publishedAt}
              readingTime={article.readingTime}
            />
            <ShareButtons title={article.title} />
          </div>
        </div>
      </header>

      {/* Tags ribbon */}
      <div className="bg-stone-100 dark:bg-stone-900 border-y border-stone-200 dark:border-stone-800 py-4">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-stone-500 dark:text-stone-400 mr-2">Tags:</span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-white dark:bg-stone-800 rounded-full text-sm text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-lime-500 hover:text-lime-600 dark:hover:text-lime-400 cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Article content */}
      <article ref={contentRef} className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          {/* Editorial content with enhanced typography */}
          <div className="prose prose-lg dark:prose-invert prose-stone max-w-none">
            {contentSections.map((section, index) => (
              <section key={section.id} id={section.id} className="mb-16 scroll-mt-24">
                {index > 0 && (
                  <h2
                    className="text-3xl md:text-4xl font-bold text-stone-900 dark:text-white mb-6"
                    style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
                  >
                    {section.title}
                  </h2>
                )}

                {/* First paragraph with editorial drop cap treatment */}
                {index === 0 ? (
                  <div className="relative">
                    {/* Decorative line accent */}
                    <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-lime-500 via-emerald-500 to-transparent rounded-full hidden md:block" />

                    <p
                      className="text-xl md:text-2xl text-stone-800 dark:text-stone-200 leading-relaxed md:leading-[1.8]"
                      style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
                    >
                      {/* Large drop cap in a decorative box */}
                      <span className="float-left mr-4 mb-2 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-gradient-to-br from-lime-500 to-emerald-600 text-white text-5xl md:text-6xl font-bold rounded-2xl shadow-lg shadow-lime-500/30">
                        {section.content.charAt(0)}
                      </span>
                      <span className="text-stone-700 dark:text-stone-300" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {section.content.slice(1)}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p
                    className="text-lg md:text-xl text-stone-700 dark:text-stone-300 leading-relaxed"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  >
                    {section.content}
                  </p>
                )}

                {/* Pull quote after second section */}
                {index === 1 && (
                  <PullQuote>
                    Le jardin-forêt n'est pas seulement une technique agricole, c'est une philosophie de vie en harmonie avec la nature.
                  </PullQuote>
                )}

                {/* Visual break with stats after third section */}
                {index === 2 && (
                  <div className="my-16 grid grid-cols-3 gap-4">
                    {[
                      { value: '7', label: 'Strates végétales' },
                      { value: '200+', label: 'Espèces possibles' },
                      { value: '∞', label: "Années d'abondance" }
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="text-center p-6 bg-stone-50 dark:bg-stone-900 rounded-2xl"
                      >
                        <div
                          className="text-4xl font-black text-lime-600 dark:text-lime-400 mb-1"
                          style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
                        >
                          {stat.value}
                        </div>
                        <div className="text-sm text-stone-500 dark:text-stone-400">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Author bio box - Magazine style */}
          <div className="mt-24 relative">
            {/* Decorative background */}
            <div className="absolute -inset-4 bg-gradient-to-br from-lime-500/10 via-emerald-500/5 to-transparent rounded-[2rem] blur-2xl" />

            <div className="relative bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xl">
              {/* Top accent bar */}
              <div className="h-2 bg-gradient-to-r from-lime-500 via-emerald-500 to-lime-400" />

              <div className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Avatar with decorative ring */}
                  <div className="relative flex-shrink-0 group">
                    {/* Animated ring */}
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-lime-500 via-emerald-500 to-lime-400 opacity-20 group-hover:opacity-40 blur-md transition-opacity" />
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-lime-500 via-emerald-500 to-lime-400 opacity-50" />

                    {/* Main avatar */}
                    <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-lime-400 via-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-3xl shadow-2xl">
                      {article.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>

                    {/* Verified badge */}
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white dark:bg-stone-900 shadow-lg flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-lime-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 text-xs font-semibold rounded-full">
                        Auteur
                      </span>
                      <span className="text-stone-400 dark:text-stone-500 text-sm">
                        {lab.name}
                      </span>
                    </div>

                    <h3
                      className="text-2xl md:text-3xl font-bold text-stone-900 dark:text-white mb-1"
                      style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
                    >
                      {article.author}
                    </h3>
                    <p className="text-lime-600 dark:text-lime-400 font-medium mb-4">
                      {article.authorRole}
                    </p>

                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed mb-6 max-w-xl">
                      Passionné·e par la régénération des écosystèmes et la transmission des savoirs.
                      Convaincu·e que chaque jardin-forêt planté est un pas vers un avenir plus résilient.
                    </p>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <button className="group px-5 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-medium rounded-xl hover:bg-stone-800 dark:hover:bg-stone-100 transition-all flex items-center gap-2">
                        <span>Tous ses articles</span>
                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <button className="px-5 py-2.5 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-medium rounded-xl hover:border-lime-500 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">
                        Suivre
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Article end marker for reading progress */}
      <div ref={articleEndRef} aria-hidden="true" />

      {/* Newsletter CTA */}
      <section className="py-20 bg-gradient-to-br from-lime-500 via-emerald-500 to-green-600 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute top-0 left-0 w-96 h-96 text-white" viewBox="0 0 200 200" fill="currentColor">
            <circle cx="50" cy="50" r="80" />
          </svg>
          <svg className="absolute bottom-0 right-0 w-64 h-64 text-white" viewBox="0 0 200 200" fill="currentColor">
            <circle cx="150" cy="150" r="60" />
          </svg>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2
            className="text-3xl md:text-4xl font-black text-white mb-4"
            style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
          >
            Vous avez aimé cet article ?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Recevez nos prochains articles et conseils directement dans votre boîte mail.
          </p>

          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="votre@email.com"
              className="flex-1 px-5 py-4 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border border-white/30 focus:outline-none focus:border-white focus:bg-white/30 transition-all"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-xl hover:bg-stone-100 transition-colors shadow-lg"
            >
              S'inscrire
            </button>
          </form>
        </div>
      </section>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="py-20 bg-stone-50 dark:bg-stone-900">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-12">
              <h2
                className="text-3xl font-bold text-stone-900 dark:text-white"
                style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
              >
                Articles similaires
              </h2>
              <button className="text-lime-600 dark:text-lime-400 font-medium hover:underline">
                Voir tous →
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedArticles.slice(0, 3).map((related) => (
                <RelatedCard
                  key={related.id}
                  article={related}
                />
              ))}
            </div>
          </div>
        </section>
      )}

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

        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.05); }
        }
        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }

        @keyframes float-medium {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 20px) scale(1.03); }
        }
        .animate-float-medium {
          animation: float-medium 15s ease-in-out infinite;
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
