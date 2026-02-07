import type { Course } from '../types'

interface CourseCardProps {
  course: Course
  onView?: () => void
}

export function CourseCard({ course, onView }: CourseCardProps) {
  const spotsPercentage = ((course.spotsTotal - course.spotsAvailable) / course.spotsTotal) * 100
  const isAlmostFull = course.spotsAvailable <= 5
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <button
      onClick={onView}
      className="group relative flex flex-col bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left w-full"
    >
      {/* Image with overlay */}
      <div className="relative h-48 overflow-hidden">
        {/* Background image */}
        {course.image ? (
          <img
            src={course.image}
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#5B5781] to-[#AFBD00]" />
        )}

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/30 to-stone-900/10" />

        {/* Decorative pattern overlay */}
        <div
          className="absolute inset-0 opacity-10 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 5c-5 8-15 12-15 22 0 6 6 8 15 8s15-2 15-8c0-10-10-14-15-22z' fill='white' fill-opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Featured badge */}
        {course.isFeatured && (
          <div 
            className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: '#AFBD00' }}
          >
            ⭐ En vedette
          </div>
        )}
        
        {/* Format badge */}
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-stone-700">
          {course.format === 'en ligne' ? '💻 En ligne' : '📍 Présentiel'}
        </div>
        
        {/* Duration badge */}
        <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-medium bg-white text-stone-800">
          {course.duration}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        {/* Category & Level */}
        <div className="flex items-center gap-2 mb-3">
          <span 
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: '#5B5781' }}
          >
            {course.category}
          </span>
          <span className="text-stone-300 dark:text-stone-600">•</span>
          <span className="text-xs text-stone-500 dark:text-stone-400 capitalize">
            {course.level}
          </span>
        </div>
        
        {/* Title */}
        <h3 
          className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-3 group-hover:text-[#5B5781] transition-colors line-clamp-2"
          style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
        >
          {course.title}
        </h3>
        
        {/* Description */}
        <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed mb-4 line-clamp-2">
          {course.shortDescription}
        </p>
        
        {/* Meta info */}
        <div className="mt-auto space-y-3">
          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span>{formatDate(course.nextSession)}</span>
          </div>
          
          {/* Spots progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className={isAlmostFull ? 'text-red-600 font-medium' : 'text-stone-500 dark:text-stone-400'}>
                {isAlmostFull ? `Plus que ${course.spotsAvailable} places !` : `${course.spotsAvailable} places disponibles`}
              </span>
            </div>
            <div className="h-1.5 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${spotsPercentage}%`,
                  backgroundColor: isAlmostFull ? '#B01A19' : '#AFBD00'
                }}
              />
            </div>
          </div>
          
          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-700">
            <span 
              className="text-2xl font-bold"
              style={{ color: '#5B5781' }}
            >
              {course.price}€
            </span>
            <span 
              className="text-sm font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform"
              style={{ color: '#5B5781' }}
            >
              Voir détails
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

