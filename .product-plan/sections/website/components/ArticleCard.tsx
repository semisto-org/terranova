import type { Article } from '../types'

interface ArticleCardProps {
  article: Article
  onView?: () => void
  variant?: 'default' | 'featured' | 'compact'
}

const categoryStyles: Record<string, { color: string; bgColor: string }> = {
  'technique': { color: '#5B5781', bgColor: '#c8bfd2' },
  'retour-experience': { color: '#AFBD00', bgColor: '#e1e6d8' },
  'témoignage': { color: '#EF9B0D', bgColor: '#fbe6c3' },
  'actualité': { color: '#B01A19', bgColor: '#eac7b8' }
}

export function ArticleCard({ article, onView, variant = 'default' }: ArticleCardProps) {
  const category = categoryStyles[article.category] || categoryStyles['technique']
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  if (variant === 'featured') {
    return (
      <button
        onClick={onView}
        className="group relative flex flex-col md:flex-row bg-white dark:bg-stone-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 text-left w-full"
      >
        {/* Image area */}
        <div className="relative md:w-1/2 h-64 md:h-auto overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-br from-[#5B5781] via-[#5B5781] to-[#AFBD00]"
          />
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5c-8 12-25 20-25 35 0 10 11 15 25 15s25-5 25-15c0-15-17-23-25-35z' fill='white' fill-opacity='0.3'/%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />
          
          {/* Featured badge */}
          <div className="absolute top-6 left-6 px-4 py-2 rounded-full text-sm font-bold bg-white text-[#5B5781]">
            ⭐ Article vedette
          </div>
          
          {/* Reading time */}
          <div className="absolute bottom-6 left-6 px-3 py-1.5 rounded-full text-sm font-medium bg-white/90 text-stone-700">
            {article.readingTime} min de lecture
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-8 md:p-10 flex flex-col">
          {/* Category */}
          <span 
            className="inline-flex self-start px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ backgroundColor: category.bgColor, color: category.color }}
          >
            {article.category}
          </span>
          
          {/* Title */}
          <h3 
            className="text-2xl md:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-4 group-hover:text-[#5B5781] transition-colors"
            style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
          >
            {article.title}
          </h3>
          
          {/* Excerpt */}
          <p className="text-stone-600 dark:text-stone-400 leading-relaxed mb-6 line-clamp-3">
            {article.excerpt}
          </p>
          
          {/* Author and date */}
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: '#5B5781' }}
              >
                {article.author.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="font-medium text-stone-900 dark:text-stone-100 text-sm">
                  {article.author}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  {formatDate(article.publishedAt)}
                </div>
              </div>
            </div>
            
            <span 
              className="flex items-center gap-1 text-sm font-semibold group-hover:translate-x-1 transition-transform"
              style={{ color: '#5B5781' }}
            >
              Lire
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={onView}
        className="group flex items-start gap-4 text-left w-full py-4 border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800/50 -mx-2 px-2 rounded-lg transition-colors"
      >
        {/* Mini date */}
        <div className="text-center min-w-[50px]">
          <div className="text-2xl font-bold" style={{ color: '#5B5781' }}>
            {new Date(article.publishedAt).getDate()}
          </div>
          <div className="text-xs text-stone-500 uppercase">
            {new Date(article.publishedAt).toLocaleDateString('fr-FR', { month: 'short' })}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-stone-900 dark:text-stone-100 group-hover:text-[#5B5781] transition-colors line-clamp-2">
            {article.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
            <span>{article.author}</span>
            <span>•</span>
            <span>{article.readingTime} min</span>
          </div>
        </div>
      </button>
    )
  }

  // Default variant
  return (
    <button
      onClick={onView}
      className="group flex flex-col bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 text-left w-full"
    >
      {/* Image area */}
      <div className="relative h-44 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br"
          style={{ 
            backgroundImage: `linear-gradient(135deg, ${category.color}ee, ${category.color}aa)`
          }}
        />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 5c-5 8-15 12-15 22 0 6 6 8 15 8s15-2 15-8c0-10-10-14-15-22z' fill='white' fill-opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Category badge */}
        <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-stone-700">
          {article.category}
        </div>
        
        {/* Reading time */}
        <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-stone-700">
          {article.readingTime} min
        </div>
      </div>
      
      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Title */}
        <h3 
          className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-2 group-hover:text-[#5B5781] transition-colors line-clamp-2"
          style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
        >
          {article.title}
        </h3>
        
        {/* Excerpt */}
        <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed mb-4 line-clamp-2">
          {article.excerpt}
        </p>
        
        {/* Author and date */}
        <div className="mt-auto flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: category.color }}
          >
            {article.author.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-stone-900 dark:text-stone-100 text-sm truncate">
              {article.author}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400">
              {formatDate(article.publishedAt)}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

