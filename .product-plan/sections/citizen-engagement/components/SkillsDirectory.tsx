import { useState, useMemo } from 'react'
import type {
  SkillsDirectoryProps,
  SkillCategory,
  ExperienceLevel,
} from '../types'
import { SkillCard } from './SkillCard'

type FilterCategory = SkillCategory | 'all'
type FilterExperience = ExperienceLevel | 'all'

const categoryFilters: { key: FilterCategory; label: string; emoji: string }[] = [
  { key: 'all', label: 'Toutes', emoji: '✨' },
  { key: 'greffe', label: 'Greffe', emoji: '✂️' },
  { key: 'taille', label: 'Taille', emoji: '🌿' },
  { key: 'sol', label: 'Sol', emoji: '🌍' },
  { key: 'design', label: 'Design', emoji: '📐' },
  { key: 'identification', label: 'Identification', emoji: '🔍' },
  { key: 'multiplication', label: 'Multiplication', emoji: '🌱' },
]

const experienceFilters: { key: FilterExperience; label: string }[] = [
  { key: 'all', label: 'Tous niveaux' },
  { key: 'expert', label: 'Experts' },
  { key: 'confirme', label: 'Confirmés' },
  { key: 'debutant', label: 'Débutants' },
]

export function SkillsDirectory({
  skills,
  citizens,
  currentVillageIds,
  onContactGardener,
  onAddSkill,
}: SkillsDirectoryProps) {
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all')
  const [experienceFilter, setExperienceFilter] = useState<FilterExperience>('all')
  const [showNearbyOnly, setShowNearbyOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Create citizen lookup
  const citizenMap = useMemo(() => {
    return new Map(citizens.map(c => [c.id, c]))
  }, [citizens])

  // Filter skills
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      // Category filter
      if (categoryFilter !== 'all' && skill.category !== categoryFilter) return false

      // Experience filter
      if (experienceFilter !== 'all' && skill.experienceLevel !== experienceFilter) return false

      // Nearby filter
      if (showNearbyOnly && currentVillageIds.length > 0) {
        const hasOverlap = skill.villageIds.some(vid => currentVillageIds.includes(vid))
        if (!hasOverlap) return false
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const citizen = citizenMap.get(skill.citizenId)
        const searchText = `${skill.title} ${skill.description} ${citizen?.firstName || ''} ${citizen?.lastName || ''}`.toLowerCase()
        if (!searchText.includes(query)) return false
      }

      return true
    })
  }, [skills, categoryFilter, experienceFilter, showNearbyOnly, searchQuery, currentVillageIds, citizenMap])

  // Stats for hero
  const totalExperts = skills.filter(s => s.experienceLevel === 'expert').length
  const uniqueCategories = new Set(skills.map(s => s.category)).size
  const totalVillagesCovered = new Set(skills.flatMap(s => s.villageIds)).size

  return (
    <div className="min-h-screen bg-[#FDFCFA] dark:bg-stone-950">
      {/* ========== HERO SECTION ========== */}
      <section className="relative overflow-hidden">
        {/* Textured background */}
        <div className="absolute inset-0">
          {/* Warm paper texture gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#F5F0E8] via-[#FDFCFA] to-[#F0EBE3] dark:from-stone-900 dark:via-stone-950 dark:to-stone-900" />

          {/* Subtle grain texture */}
          <div
            className="absolute inset-0 opacity-30 dark:opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Decorative botanical illustration silhouettes */}
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03] dark:opacity-[0.02]">
            <svg viewBox="0 0 400 600" className="w-full h-full" fill="currentColor">
              <path d="M350 50 Q300 150 320 250 Q340 350 300 450 Q260 550 280 600" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
              <circle cx="320" cy="100" r="40" opacity="0.3" />
              <circle cx="280" cy="200" r="25" opacity="0.2" />
              <ellipse cx="340" cy="350" rx="60" ry="30" opacity="0.2" />
              <path d="M100 100 Q150 180 120 280 Q90 380 130 480" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
            </svg>
          </div>

          {/* Accent line */}
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 via-teal-500 to-emerald-600" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-20 sm:pb-16">
          {/* Editorial masthead style */}
          <div className="max-w-3xl">
            {/* Section label */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-emerald-600 dark:text-emerald-500 text-sm font-semibold tracking-[0.2em] uppercase">
                Transmission des savoirs
              </span>
              <div className="h-px flex-1 max-w-[100px] bg-emerald-500/30" />
            </div>

            {/* Main headline - editorial serif style */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light text-stone-900 dark:text-white mb-6 leading-[1.15] tracking-tight">
              Les savoirs ancestraux,
              <br />
              <span className="font-normal italic text-emerald-700 dark:text-emerald-400">
                à portée de main.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl mb-10">
              Greffe, taille, reconnaissance des sols... Connectez-vous avec les jardiniers
              expérimentés de votre village qui transmettent leur expertise.
            </p>

            {/* Stats in elegant horizontal layout */}
            <div className="flex flex-wrap gap-8 sm:gap-12">
              <div className="group">
                <div className="text-4xl sm:text-5xl font-serif font-light text-stone-900 dark:text-white mb-1">
                  {skills.length}
                </div>
                <div className="text-sm text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Compétences partagées
                </div>
              </div>
              <div className="w-px h-16 bg-stone-200 dark:bg-stone-800 hidden sm:block" />
              <div className="group">
                <div className="text-4xl sm:text-5xl font-serif font-light text-stone-900 dark:text-white mb-1">
                  {totalExperts}
                </div>
                <div className="text-sm text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Experts disponibles
                </div>
              </div>
              <div className="w-px h-16 bg-stone-200 dark:bg-stone-800 hidden sm:block" />
              <div className="group">
                <div className="text-4xl sm:text-5xl font-serif font-light text-stone-900 dark:text-white mb-1">
                  {totalVillagesCovered}
                </div>
                <div className="text-sm text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Villages couverts
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FILTERS BAR ========== */}
      <section className="sticky top-[58px] z-30 bg-[#FDFCFA]/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search + Add button row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Search input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher une compétence ou un jardinier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-12 pr-4 py-3 rounded-xl
                  bg-white dark:bg-stone-900
                  border border-stone-200 dark:border-stone-700
                  text-stone-900 dark:text-white
                  placeholder-stone-400
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                  transition-all duration-200
                "
              />
            </div>

            {/* Add skill CTA */}
            <button
              onClick={onAddSkill}
              className="
                inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                bg-emerald-600 hover:bg-emerald-700
                text-white font-semibold text-sm
                shadow-lg shadow-emerald-600/25
                hover:shadow-xl hover:shadow-emerald-600/30
                transform hover:scale-[1.02]
                transition-all duration-300
                whitespace-nowrap
              "
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Partager ma compétence
            </button>
          </div>

          {/* Category filters - horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
            {categoryFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setCategoryFilter(filter.key)}
                className={`
                  inline-flex items-center gap-1.5 px-4 py-2 rounded-full
                  font-medium text-sm whitespace-nowrap
                  transition-all duration-200
                  ${categoryFilter === filter.key
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-md'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
                  }
                `}
              >
                <span className="text-base">{filter.emoji}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </div>

          {/* Secondary filters row */}
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
            {/* Experience dropdown-style buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide">Niveau</span>
              <div className="flex gap-1">
                {experienceFilters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setExperienceFilter(filter.key)}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium
                      transition-all duration-200
                      ${experienceFilter === filter.key
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                        : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }
                    `}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-5 bg-stone-200 dark:bg-stone-700 hidden sm:block" />

            {/* Nearby toggle */}
            {currentVillageIds.length > 0 && (
              <button
                onClick={() => setShowNearbyOnly(!showNearbyOnly)}
                className={`
                  inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
                  text-xs font-medium transition-all duration-200
                  ${showNearbyOnly
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }
                `}
              >
                <svg className={`w-4 h-4 ${showNearbyOnly ? 'text-emerald-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                À proximité
              </button>
            )}

            {/* Results count */}
            <div className="ml-auto text-sm text-stone-500 dark:text-stone-400">
              {filteredSkills.length} résultat{filteredSkills.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </section>

      {/* ========== MAIN CONTENT ========== */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {filteredSkills.length > 0 ? (
          <>
            {/* Featured expert (first expert if available) */}
            {filteredSkills.some(s => s.experienceLevel === 'expert') && (
              <div className="mb-10">
                {(() => {
                  const featuredSkill = filteredSkills.find(s => s.experienceLevel === 'expert')!
                  const featuredCitizen = citizenMap.get(featuredSkill.citizenId)!
                  return (
                    <div className="relative bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/50 dark:via-stone-900 dark:to-teal-950/50 rounded-3xl overflow-hidden border border-emerald-100 dark:border-emerald-900/50">
                      {/* Decorative pattern */}
                      <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                          <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="1" />
                          <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="1" />
                          <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
                        </svg>
                      </div>

                      <div className="relative p-6 sm:p-8 lg:p-10">
                        <div className="flex items-start gap-2 mb-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Expert à la une
                          </span>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className="absolute -inset-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl opacity-20 blur-lg" />
                            <img
                              src={featuredCitizen.avatarUrl}
                              alt={`${featuredCitizen.firstName} ${featuredCitizen.lastName}`}
                              className="relative w-28 h-28 lg:w-36 lg:h-36 rounded-2xl object-cover shadow-xl"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <h3 className="text-2xl lg:text-3xl font-serif font-light text-stone-900 dark:text-white mb-2">
                              {featuredCitizen.firstName} {featuredCitizen.lastName}
                            </h3>
                            <h4 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-3">
                              {featuredSkill.title}
                            </h4>
                            <p className="text-stone-600 dark:text-stone-400 leading-relaxed mb-6 max-w-2xl">
                              {featuredSkill.description}
                            </p>
                            <button
                              onClick={() => onContactGardener?.(featuredSkill.id)}
                              className="
                                inline-flex items-center gap-2 px-6 py-3 rounded-xl
                                bg-emerald-600 hover:bg-emerald-700
                                text-white font-semibold text-sm
                                shadow-lg shadow-emerald-600/25
                                hover:shadow-xl
                                transform hover:scale-[1.02]
                                transition-all duration-300
                              "
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              Prendre contact
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Skills grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSkills
                .filter(s => {
                  // Skip the featured expert in the grid if we showed them above
                  if (filteredSkills.some(fs => fs.experienceLevel === 'expert')) {
                    const featuredId = filteredSkills.find(fs => fs.experienceLevel === 'expert')?.id
                    return s.id !== featuredId
                  }
                  return true
                })
                .map((skill) => {
                  const citizen = citizenMap.get(skill.citizenId)
                  if (!citizen) return null
                  return (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      citizen={citizen}
                      onContact={() => onContactGardener?.(skill.id)}
                    />
                  )
                })}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-stone-100 dark:bg-stone-800 text-4xl mb-6">
              🔍
            </div>
            <h3 className="text-xl font-semibold text-stone-900 dark:text-white mb-2">
              Aucune compétence trouvée
            </h3>
            <p className="text-stone-600 dark:text-stone-400 mb-6 max-w-md mx-auto">
              {searchQuery
                ? `Aucun résultat pour "${searchQuery}". Essayez d'autres termes ou élargissez vos filtres.`
                : 'Modifiez vos filtres pour voir plus de résultats, ou soyez le premier à partager cette compétence !'}
            </p>
            <button
              onClick={onAddSkill}
              className="
                inline-flex items-center gap-2 px-5 py-3 rounded-xl
                bg-emerald-600 hover:bg-emerald-700
                text-white font-semibold text-sm
                shadow-lg shadow-emerald-600/25
                transition-all duration-300
              "
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Partager ma compétence
            </button>
          </div>
        )}
      </main>

      {/* ========== CALL TO ACTION FOOTER ========== */}
      <section className="bg-gradient-to-b from-[#FDFCFA] to-[#F5F0E8] dark:from-stone-950 dark:to-stone-900 py-16 border-t border-stone-200/50 dark:border-stone-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Quote decoration */}
          <div className="text-6xl text-emerald-500/20 mb-4 font-serif">"</div>

          <blockquote className="text-2xl sm:text-3xl font-serif font-light text-stone-900 dark:text-white mb-6 leading-relaxed">
            La vraie richesse d'un village, c'est ce que ses habitants savent faire
            <span className="italic text-emerald-700 dark:text-emerald-400"> et choisissent de transmettre.</span>
          </blockquote>

          <p className="text-stone-600 dark:text-stone-400 mb-8">
            Partagez vos connaissances et contribuez à l'autonomie alimentaire de nos territoires.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={onAddSkill}
              className="
                inline-flex items-center gap-2 px-6 py-3 rounded-xl
                bg-stone-900 dark:bg-white text-white dark:text-stone-900
                font-semibold text-sm
                hover:bg-stone-800 dark:hover:bg-stone-100
                shadow-lg shadow-stone-900/20
                transition-all duration-200 hover:scale-[1.02]
              "
            >
              <span>🌱</span>
              Devenir transmetteur
            </button>
            <button className="
              inline-flex items-center gap-2 px-6 py-3 rounded-xl
              bg-white dark:bg-stone-800 text-stone-900 dark:text-white
              font-semibold text-sm border border-stone-200 dark:border-stone-700
              hover:bg-stone-50 dark:hover:bg-stone-700
              transition-all duration-200
            ">
              <span>📚</span>
              Guide du transmetteur
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
