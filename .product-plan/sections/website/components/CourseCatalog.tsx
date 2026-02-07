import { useState, useMemo } from 'react'
import type { CourseCatalogProps, Course, CourseCategory, CourseLevel, CourseFormat } from '../types'
import { CourseCard } from './CourseCard'

type FilterState = {
  category: CourseCategory | 'all'
  level: CourseLevel | 'all'
  format: 'présentiel' | 'en ligne' | 'all'
}

const CATEGORIES: { value: CourseCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes les catégories' },
  { value: 'design', label: 'Design' },
  { value: 'technique', label: 'Technique' },
  { value: 'pépinière', label: 'Pépinière' },
]

const LEVELS: { value: CourseLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous les niveaux' },
  { value: 'débutant', label: 'Débutant' },
  { value: 'intermédiaire', label: 'Intermédiaire' },
  { value: 'avancé', label: 'Avancé' },
]

const FORMATS: { value: 'présentiel' | 'en ligne' | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous les formats' },
  { value: 'présentiel', label: 'Présentiel' },
  { value: 'en ligne', label: 'En ligne' },
]

export function CourseCatalog({
  courses,
  onCourseView,
  onCourseRegister,
  onFilter
}: CourseCatalogProps) {
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    level: 'all',
    format: 'all'
  })
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      // Category filter
      if (filters.category !== 'all' && course.category !== filters.category) {
        return false
      }
      // Level filter (normalize different language variants)
      if (filters.level !== 'all') {
        const normalizedLevel = course.level.toLowerCase()
        const filterLevel = filters.level.toLowerCase()
        if (!normalizedLevel.includes(filterLevel.substring(0, 3))) {
          return false
        }
      }
      // Format filter
      if (filters.format !== 'all') {
        const normalizedFormat = course.format.toLowerCase()
        if (filters.format === 'en ligne' && !normalizedFormat.includes('ligne')) {
          return false
        }
        if (filters.format === 'présentiel' && normalizedFormat.includes('ligne')) {
          return false
        }
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          course.title.toLowerCase().includes(query) ||
          course.shortDescription.toLowerCase().includes(query) ||
          course.instructors.some(i => i.toLowerCase().includes(query))
        )
      }
      return true
    })
  }, [courses, filters, searchQuery])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilter?.({
      category: newFilters.category === 'all' ? undefined : newFilters.category,
      level: newFilters.level === 'all' ? undefined : newFilters.level,
      format: newFilters.format === 'all' ? undefined : newFilters.format
    })
  }

  const featuredCourses = filteredCourses.filter(c => c.isFeatured)
  const regularCourses = filteredCourses.filter(c => !c.isFeatured)
  const totalCourses = filteredCourses.length

  return (
    <div className="min-h-screen bg-white dark:bg-stone-900">
      {/* Hero Section with photo background */}
      <section className="relative overflow-hidden">
        {/* Background photo */}
        <div className="absolute inset-0">
          <img
            src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/b690c4ac-2c29-426b-8d36-a01c7e9aaca7/IMG_5114/w=3840,quality=90,fit=scale-down"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Color overlay for brand cohesion */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(91, 87, 129, 0.5) 0%, rgba(61, 58, 87, 0.6) 50%, rgba(42, 40, 64, 0.7) 100%)'
            }}
          />
        </div>

        {/* Decorative circles */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20"
          style={{ backgroundColor: '#AFBD00' }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full opacity-10"
          style={{ backgroundColor: '#AFBD00' }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-white/60 mb-8">
              <span className="hover:text-white cursor-pointer transition-colors">Accueil</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-white">Academy</span>
            </nav>

            {/* Badge */}
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
              style={{ backgroundColor: '#AFBD00', color: '#2a2840' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              </svg>
              Semisto Academy
            </span>

            {/* Title */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
            >
              Formations{' '}
              <span
                className="relative inline-block"
                style={{ color: '#AFBD00' }}
              >
                jardins-forêts
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 opacity-40"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 8 Q50 0, 100 8 T200 8"
                    fill="none"
                    stroke="#AFBD00"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-white/80 leading-relaxed mb-8 max-w-2xl">
              Apprenez à concevoir, planter et entretenir des écosystèmes comestibles.
              Des formations pour tous les niveaux, du jardinier débutant au designer professionnel.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-8">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(175, 189, 0, 0.2)' }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="#AFBD00" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{courses.length}</p>
                  <p className="text-sm text-white/60">formations</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(175, 189, 0, 0.2)' }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="#AFBD00" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">3 850+</p>
                  <p className="text-sm text-white/60">participants formés</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(175, 189, 0, 0.2)' }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="#AFBD00" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">4</p>
                  <p className="text-sm text-white/60">pays européens</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0 60V30C360 0 720 0 1080 30C1260 45 1350 52 1440 60H0Z"
              className="fill-white dark:fill-stone-900"
            />
          </svg>
        </div>
      </section>

      {/* Filters Section */}
      <section className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher une formation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] transition-all"
              />
            </div>

            {/* Filter dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category filter */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] cursor-pointer transition-all appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2378716c'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m19.5 8.25-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  paddingRight: '40px'
                }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>

              {/* Level filter */}
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] cursor-pointer transition-all appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2378716c'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m19.5 8.25-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  paddingRight: '40px'
                }}
              >
                {LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>

              {/* Format filter */}
              <select
                value={filters.format}
                onChange={(e) => handleFilterChange('format', e.target.value)}
                className="px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] cursor-pointer transition-all appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2378716c'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m19.5 8.25-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  paddingRight: '40px'
                }}
              >
                {FORMATS.map(format => (
                  <option key={format.value} value={format.value}>{format.label}</option>
                ))}
              </select>

              {/* Results count */}
              <span className="text-sm text-stone-500 dark:text-stone-400 ml-2">
                {totalCourses} formation{totalCourses > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Active filters display */}
          {(filters.category !== 'all' || filters.level !== 'all' || filters.format !== 'all' || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
              <span className="text-sm text-stone-500 dark:text-stone-400">Filtres actifs:</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#5B5781]/10 text-[#5B5781] hover:bg-[#5B5781]/20 transition-colors"
                >
                  "{searchQuery}"
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {filters.category !== 'all' && (
                <button
                  onClick={() => handleFilterChange('category', 'all')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#5B5781]/10 text-[#5B5781] hover:bg-[#5B5781]/20 transition-colors"
                >
                  {CATEGORIES.find(c => c.value === filters.category)?.label}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {filters.level !== 'all' && (
                <button
                  onClick={() => handleFilterChange('level', 'all')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#5B5781]/10 text-[#5B5781] hover:bg-[#5B5781]/20 transition-colors"
                >
                  {LEVELS.find(l => l.value === filters.level)?.label}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {filters.format !== 'all' && (
                <button
                  onClick={() => handleFilterChange('format', 'all')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#5B5781]/10 text-[#5B5781] hover:bg-[#5B5781]/20 transition-colors"
                >
                  {FORMATS.find(f => f.value === filters.format)?.label}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => {
                  setFilters({ category: 'all', level: 'all', format: 'all' })
                  setSearchQuery('')
                  onFilter?.({})
                }}
                className="text-xs font-medium text-stone-500 hover:text-[#5B5781] transition-colors ml-2"
              >
                Tout effacer
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Featured Courses Section */}
          {featuredCourses.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#AFBD00' }}
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <h2
                  className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100"
                  style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
                >
                  Formations en vedette
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredCourses.map((course, index) => (
                  <div
                    key={course.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CourseCard
                      course={course}
                      onView={() => onCourseView?.(course.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Courses Section */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2
                className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100"
                style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
              >
                {featuredCourses.length > 0 ? 'Toutes les formations' : 'Nos formations'}
              </h2>
            </div>

            {regularCourses.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularCourses.map((course, index) => (
                  <div
                    key={course.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${(featuredCourses.length + index) * 100}ms` }}
                  >
                    <CourseCard
                      course={course}
                      onView={() => onCourseView?.(course.id)}
                    />
                  </div>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              /* Empty state */
              <div className="text-center py-20">
                <div
                  className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ backgroundColor: '#c8bfd2' }}
                >
                  <svg className="w-10 h-10" fill="none" stroke="#5B5781" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
                <h3
                  className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2"
                  style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
                >
                  Aucune formation trouvée
                </h3>
                <p className="text-stone-500 dark:text-stone-400 mb-6 max-w-md mx-auto">
                  Essayez de modifier vos critères de recherche ou de supprimer certains filtres pour voir plus de résultats.
                </p>
                <button
                  onClick={() => {
                    setFilters({ category: 'all', level: 'all', format: 'all' })
                    setSearchQuery('')
                    onFilter?.({})
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all hover:scale-105"
                  style={{ backgroundColor: '#5B5781' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" />
                  </svg>
                  Réinitialiser les filtres
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-stone-50 dark:bg-stone-950">
        <div className="max-w-4xl mx-auto text-center">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
            style={{ backgroundColor: '#e1e6d8', color: '#5B5781' }}
          >
            Besoin d'aide ?
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 mb-4"
            style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
          >
            Vous ne savez pas quelle formation choisir ?
          </h2>
          <p className="text-lg text-stone-600 dark:text-stone-400 mb-8 max-w-2xl mx-auto">
            Contactez-nous pour un conseil personnalisé. Nous vous aiderons à trouver
            la formation adaptée à votre niveau et à vos objectifs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="px-8 py-4 rounded-full font-semibold text-white transition-all hover:scale-105"
              style={{ backgroundColor: '#5B5781' }}
            >
              Nous contacter
            </button>
            <button
              className="px-8 py-4 rounded-full font-semibold border-2 transition-all hover:scale-105"
              style={{ borderColor: '#5B5781', color: '#5B5781' }}
            >
              Voir le calendrier complet
            </button>
          </div>
        </div>
      </section>

      {/* Inline CSS for animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}
