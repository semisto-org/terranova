import type { Skill, Citizen, ExperienceLevel, Availability, SkillCategory } from '../types'

interface SkillCardProps {
  skill: Skill
  citizen: Citizen
  onContact?: () => void
}

const categoryConfig: Record<SkillCategory, { label: string; emoji: string; gradient: string }> = {
  greffe: { label: 'Greffe', emoji: '✂️', gradient: 'from-rose-500 to-pink-600' },
  taille: { label: 'Taille', emoji: '🌿', gradient: 'from-emerald-500 to-green-600' },
  sol: { label: 'Sol & Terroir', emoji: '🌍', gradient: 'from-amber-500 to-orange-600' },
  design: { label: 'Design', emoji: '📐', gradient: 'from-violet-500 to-purple-600' },
  identification: { label: 'Identification', emoji: '🔍', gradient: 'from-sky-500 to-blue-600' },
  multiplication: { label: 'Multiplication', emoji: '🌱', gradient: 'from-lime-500 to-green-600' },
}

const experienceConfig: Record<ExperienceLevel, { label: string; color: string; stars: number }> = {
  debutant: { label: 'Débutant', color: 'text-stone-500', stars: 1 },
  confirme: { label: 'Confirmé', color: 'text-amber-600 dark:text-amber-500', stars: 2 },
  expert: { label: 'Expert', color: 'text-emerald-600 dark:text-emerald-500', stars: 3 },
}

const availabilityConfig: Record<Availability, { label: string; icon: string }> = {
  weekends: { label: 'Week-ends', icon: '📅' },
  semaine: { label: 'En semaine', icon: '💼' },
  hiver: { label: 'Saison hivernale', icon: '❄️' },
  flexible: { label: 'Horaires flexibles', icon: '⏰' },
}

export function SkillCard({ skill, citizen, onContact }: SkillCardProps) {
  const category = categoryConfig[skill.category]
  const experience = experienceConfig[skill.experienceLevel]
  const availability = availabilityConfig[skill.availability]

  return (
    <article className="group relative">
      {/* Main card container */}
      <div className="
        relative bg-white dark:bg-stone-900
        rounded-2xl overflow-hidden
        border border-stone-200 dark:border-stone-800
        shadow-sm hover:shadow-xl
        transition-all duration-500 ease-out
        hover:-translate-y-1
      ">
        {/* Top accent gradient bar */}
        <div className={`h-1.5 bg-gradient-to-r ${category.gradient}`} />

        {/* Card content */}
        <div className="p-6">
          {/* Header: Avatar + Basic info */}
          <div className="flex gap-4 mb-5">
            {/* Avatar with decorative ring */}
            <div className="relative flex-shrink-0">
              <div className={`
                absolute -inset-1 rounded-full bg-gradient-to-br ${category.gradient} opacity-20
                group-hover:opacity-40 transition-opacity duration-300
              `} />
              <img
                src={citizen.avatarUrl}
                alt={`${citizen.firstName} ${citizen.lastName}`}
                className="relative w-16 h-16 rounded-full object-cover ring-2 ring-white dark:ring-stone-900"
              />
              {/* Experience badge */}
              <div className={`
                absolute -bottom-1 -right-1 w-6 h-6 rounded-full
                bg-white dark:bg-stone-800
                flex items-center justify-center
                border-2 border-white dark:border-stone-900
                shadow-sm
              `}>
                <span className="text-xs">{category.emoji}</span>
              </div>
            </div>

            {/* Name and location */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-stone-900 dark:text-white truncate leading-tight">
                {citizen.firstName} {citizen.lastName}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                {skill.villageIds.length > 1
                  ? `${skill.villageIds.length} villages couverts`
                  : 'Disponible localement'
                }
              </p>
              {/* Experience stars */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex gap-0.5">
                  {[1, 2, 3].map((star) => (
                    <svg
                      key={star}
                      className={`w-3.5 h-3.5 ${star <= experience.stars ? experience.color : 'text-stone-300 dark:text-stone-600'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className={`text-xs font-medium ${experience.color}`}>
                  {experience.label}
                </span>
              </div>
            </div>
          </div>

          {/* Skill title and category tag */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h4 className="text-base font-bold text-stone-900 dark:text-white leading-snug">
                {skill.title}
              </h4>
              <span className={`
                flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold
                bg-gradient-to-r ${category.gradient} text-white
                shadow-sm
              `}>
                {category.label}
              </span>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3">
              {skill.description}
            </p>
          </div>

          {/* Meta info row */}
          <div className="flex items-center gap-3 mb-5 py-3 border-y border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
              <span>{availability.icon}</span>
              <span>{availability.label}</span>
            </div>
            <div className="w-px h-4 bg-stone-200 dark:bg-stone-700" />
            <div className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
              <span>💬</span>
              <span className="capitalize">{skill.contactPreference === 'messagerie' ? 'Messagerie' : skill.contactPreference === 'email' ? 'Email' : 'Téléphone'}</span>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={onContact}
            className={`
              w-full py-3 px-4 rounded-xl
              font-semibold text-sm
              bg-gradient-to-r ${category.gradient}
              text-white
              shadow-lg shadow-stone-900/10
              hover:shadow-xl hover:shadow-stone-900/15
              transform hover:scale-[1.02]
              transition-all duration-300
              flex items-center justify-center gap-2
            `}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Contacter {citizen.firstName}
          </button>
        </div>
      </div>

      {/* Decorative background blur on hover */}
      <div className={`
        absolute -inset-4 -z-10 rounded-3xl opacity-0 group-hover:opacity-100
        bg-gradient-to-br ${category.gradient}
        blur-2xl
        transition-opacity duration-500
      `} style={{ opacity: 'var(--hover-opacity, 0)' }} />
    </article>
  )
}
