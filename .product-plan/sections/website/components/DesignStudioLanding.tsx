import type { DesignStudioLandingProps, DesignProfile } from '../types'

// Icon components for each profile type
const PROFILE_ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 28L32 8L56 28" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 26V52H52V26" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 52V38H38V52" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="20" r="3" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  building: (
    <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="12" y="16" width="40" height="40" rx="2" strokeLinecap="round" />
      <path d="M20 28H28M36 28H44M20 38H28M36 38H44M20 48H28M36 48H44" strokeLinecap="round" />
      <path d="M32 8V16" strokeLinecap="round" />
      <circle cx="32" cy="8" r="3" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  users: (
    <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="32" cy="20" r="8" />
      <circle cx="16" cy="26" r="6" />
      <circle cx="48" cy="26" r="6" />
      <path d="M18 56C18 46.059 24.268 38 32 38C39.732 38 46 46.059 46 56" strokeLinecap="round" />
      <path d="M6 56C6 48.82 10.477 43 16 43" strokeLinecap="round" opacity="0.5" />
      <path d="M58 56C58 48.82 53.523 43 48 43" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  landmark: (
    <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 56H56" strokeLinecap="round" />
      <path d="M12 56V28L32 12L52 28V56" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 56V36H28V56" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 56V36H44V56" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="24" r="4" />
    </svg>
  ),
}

// Color schemes for each profile - art deco inspired
const PROFILE_COLORS: Record<string, { gradient: string; accent: string; glow: string }> = {
  'profile-prive': {
    gradient: 'from-emerald-600 via-emerald-500 to-teal-400',
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)'
  },
  'profile-entreprise': {
    gradient: 'from-blue-700 via-blue-600 to-cyan-500',
    accent: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.4)'
  },
  'profile-collectif': {
    gradient: 'from-amber-600 via-orange-500 to-yellow-400',
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)'
  },
  'profile-public': {
    gradient: 'from-violet-700 via-purple-600 to-fuchsia-500',
    accent: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.4)'
  },
}

interface ProfileCardProps {
  profile: DesignProfile
  index: number
  onSelect?: () => void
}

function ProfileCard({ profile, index, onSelect }: ProfileCardProps) {
  const colors = PROFILE_COLORS[profile.id] || PROFILE_COLORS['profile-prive']
  const icon = PROFILE_ICONS[profile.icon] || PROFILE_ICONS['home']

  return (
    <button
      onClick={onSelect}
      className="group relative flex flex-col text-left w-full h-full min-h-[420px] perspective-1000"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Main card */}
      <div
        className="relative flex flex-col flex-1 rounded-3xl overflow-hidden transition-all duration-500 ease-out group-hover:scale-[1.02] group-hover:-translate-y-2"
        style={{
          boxShadow: `0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)`
        }}
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-95`} />

        {/* Art deco geometric pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='40' cy='40' r='35' fill='none' stroke='white' stroke-width='0.5'/%3E%3Ccircle cx='40' cy='40' r='25' fill='none' stroke='white' stroke-width='0.5'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='white' stroke-width='0.5'/%3E%3Cpath d='M40 5 L40 75 M5 40 L75 40' stroke='white' stroke-width='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
          }}
        />

        {/* Decorative arc */}
        <div className="absolute -top-20 -right-20 w-64 h-64 border-[40px] rounded-full opacity-10 border-white" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 border-[50px] rounded-full opacity-10 border-white" />

        {/* Hover glow effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${colors.glow} 0%, transparent 70%)`
          }}
        />

        {/* Content */}
        <div className="relative flex flex-col flex-1 p-8">
          {/* Icon container with decorative ring */}
          <div className="relative w-24 h-24 mb-8">
            {/* Outer decorative ring */}
            <div
              className="absolute inset-0 rounded-full border-2 border-white/20 transform group-hover:scale-110 group-hover:rotate-45 transition-transform duration-700"
            />
            {/* Inner circle with icon */}
            <div className="absolute inset-2 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <div className="w-12 h-12 text-white">
                {icon}
              </div>
            </div>
            {/* Animated pulse on hover */}
            <div
              className="absolute inset-0 rounded-full border border-white/30 opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-1000"
            />
          </div>

          {/* Title */}
          <h3
            className="text-3xl font-bold text-white mb-2 tracking-tight"
            style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
          >
            {profile.title}
          </h3>

          {/* Subtitle */}
          <p className="text-lg text-white/80 font-medium mb-4">
            {profile.subtitle}
          </p>

          {/* Description */}
          <p className="text-white/70 leading-relaxed mb-6 line-clamp-3">
            {profile.description}
          </p>

          {/* Benefits preview */}
          <div className="flex flex-wrap gap-2 mb-8">
            {profile.benefits.slice(0, 2).map((benefit, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/15 text-white/90 backdrop-blur-sm"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {benefit.length > 30 ? benefit.substring(0, 30) + '...' : benefit}
              </span>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* CTA button */}
          <div className="relative">
            <div
              className="flex items-center justify-between px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-all duration-300"
            >
              <span className="font-semibold text-white">
                {profile.ctaText}
              </span>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-stone-900 transform group-hover:translate-x-1 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

export function DesignStudioLanding({
  lab,
  profiles,
  onProfileSelect
}: DesignStudioLandingProps) {
  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-stone-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Complex layered background */}
        <div className="absolute inset-0">
          {/* Base gradient - warm cream to soft sage */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #faf9f7 0%, #f5f5f0 30%, #e8ebe0 70%, #dde4d5 100%)'
            }}
          />

          {/* Dark mode override */}
          <div className="absolute inset-0 bg-stone-950 opacity-0 dark:opacity-100" />

          {/* Large decorative circles - Art Deco inspired */}
          <svg
            className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] text-[#AFBD00]/10 dark:text-[#AFBD00]/5"
            viewBox="0 0 400 400"
          >
            <circle cx="200" cy="200" r="180" fill="none" stroke="currentColor" strokeWidth="40" />
            <circle cx="200" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="20" />
            <circle cx="200" cy="200" r="60" fill="currentColor" opacity="0.3" />
          </svg>

          <svg
            className="absolute -bottom-1/3 -left-1/4 w-[600px] h-[600px] text-[#5B5781]/10 dark:text-[#5B5781]/5"
            viewBox="0 0 400 400"
          >
            <circle cx="200" cy="200" r="180" fill="none" stroke="currentColor" strokeWidth="30" />
            <circle cx="200" cy="200" r="100" fill="none" stroke="currentColor" strokeWidth="15" />
          </svg>

          {/* Botanical leaf accents */}
          <svg
            className="absolute top-20 left-[10%] w-32 h-32 text-[#AFBD00]/20 dark:text-[#AFBD00]/10 animate-float"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <path d="M50 5c-20 30-45 45-45 70 0 15 20 20 45 20s45-5 45-20c0-25-25-40-45-70z" />
          </svg>
          <svg
            className="absolute bottom-40 right-[15%] w-24 h-24 text-[#5B5781]/15 dark:text-[#5B5781]/10 animate-float-delayed"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <path d="M50 5c-20 30-45 45-45 70 0 15 20 20 45 20s45-5 45-20c0-25-25-40-45-70z" />
          </svg>

          {/* Grain texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
            }}
          />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 mb-8">
            <span className="hover:text-[#5B5781] cursor-pointer transition-colors">{lab.name}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-stone-900 dark:text-stone-100 font-medium">Design Studio</span>
          </nav>

          {/* Main heading */}
          <div className="max-w-3xl mb-12 md:mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#AFBD00]/10 dark:bg-[#AFBD00]/20 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#AFBD00] animate-pulse" />
              <span className="text-sm font-semibold text-[#5B5781] dark:text-[#AFBD00]">
                Design Studio
              </span>
            </div>

            {/* Title with decorative elements */}
            <h1 className="relative">
              <span
                className="block text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 dark:text-stone-100 leading-[1.1] mb-4"
                style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
              >
                Créons ensemble votre
              </span>
              <span
                className="relative inline-block text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1]"
                style={{ fontFamily: '"Sole Serif Small", Georgia, serif', color: '#AFBD00' }}
              >
                jardin-forêt
                {/* Decorative underline */}
                <svg
                  className="absolute -bottom-2 left-0 w-full h-4"
                  viewBox="0 0 300 16"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 12 Q75 2, 150 12 T300 12"
                    fill="none"
                    stroke="#AFBD00"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-8 text-xl text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
              Du design à la plantation, nous vous accompagnons dans la création d'un écosystème
              comestible unique. Choisissez votre profil pour découvrir nos offres adaptées.
            </p>
          </div>

          {/* Visual transition - animated branches connecting to profile cards */}
          <div className="relative mt-12 mb-4">
            {/* Branching paths SVG - connects to the 4 cards below */}
            <div className="hidden xl:block relative h-24 max-w-5xl mx-auto">
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 1000 100"
                fill="none"
                preserveAspectRatio="xMidYMin meet"
              >
                {/* Central stem */}
                <path
                  d="M500 0 L500 30"
                  stroke="#AFBD00"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="animate-draw-stem"
                />

                {/* Branch to card 1 (far left) */}
                <path
                  d="M500 30 Q500 50, 350 50 Q200 50, 125 80"
                  stroke="url(#gradient-emerald)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  className="animate-draw-branch-1"
                />
                <circle cx="125" cy="80" r="6" fill="#10b981" className="animate-pulse-dot" style={{ animationDelay: '0.3s' }} />

                {/* Branch to card 2 (center left) */}
                <path
                  d="M500 30 Q500 45, 420 55 Q340 65, 375 80"
                  stroke="url(#gradient-blue)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  className="animate-draw-branch-2"
                />
                <circle cx="375" cy="80" r="6" fill="#3b82f6" className="animate-pulse-dot" style={{ animationDelay: '0.4s' }} />

                {/* Branch to card 3 (center right) */}
                <path
                  d="M500 30 Q500 45, 580 55 Q660 65, 625 80"
                  stroke="url(#gradient-amber)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  className="animate-draw-branch-3"
                />
                <circle cx="625" cy="80" r="6" fill="#f59e0b" className="animate-pulse-dot" style={{ animationDelay: '0.5s' }} />

                {/* Branch to card 4 (far right) */}
                <path
                  d="M500 30 Q500 50, 650 50 Q800 50, 875 80"
                  stroke="url(#gradient-violet)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  className="animate-draw-branch-4"
                />
                <circle cx="875" cy="80" r="6" fill="#8b5cf6" className="animate-pulse-dot" style={{ animationDelay: '0.6s' }} />

                {/* Gradients */}
                <defs>
                  <linearGradient id="gradient-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#AFBD00" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#AFBD00" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="gradient-amber" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#AFBD00" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <linearGradient id="gradient-violet" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#AFBD00" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Mobile/tablet: simpler visual */}
            <div className="xl:hidden flex justify-center">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <div className="w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-blue-500" />
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-amber-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-8 h-0.5 bg-gradient-to-r from-amber-500 to-violet-500" />
                <div className="w-3 h-3 rounded-full bg-violet-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Cards Grid */}
      <section className="relative px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
            {profiles.map((profile, index) => (
              <div
                key={profile.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ProfileCard
                  profile={profile}
                  index={index}
                  onSelect={() => onProfileSelect?.(profile.slug)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-stone-100 dark:bg-stone-900" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5c-10 15-25 22-25 40 0 8 10 10 25 10s25-2 25-10c0-18-15-25-25-40z' fill='%23AFBD00' fill-opacity='0.03'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />

        <div className="relative max-w-3xl mx-auto text-center">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: '#e1e6d8' }}
          >
            <svg className="w-8 h-8" fill="none" stroke="#5B5781" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </div>

          <h2
            className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-4"
            style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
          >
            Vous ne savez pas par où commencer ?
          </h2>

          <p className="text-stone-600 dark:text-stone-400 mb-8 max-w-xl mx-auto">
            Pas de souci ! Contactez-nous pour une première discussion sans engagement.
            Nous vous orienterons vers la solution la plus adaptée à votre situation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-white transition-all hover:scale-105 shadow-lg"
              style={{ backgroundColor: '#5B5781' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Nous contacter
            </button>

            <button
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold border-2 transition-all hover:scale-105"
              style={{ borderColor: '#5B5781', color: '#5B5781' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Appeler le {lab.contactEmail?.replace('@', ' · ') || 'Lab'}
            </button>
          </div>
        </div>
      </section>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
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

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out infinite;
          animation-delay: -3s;
        }

        .perspective-1000 {
          perspective: 1000px;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Branch drawing animations */
        @keyframes draw-stem {
          from { stroke-dashoffset: 30; }
          to { stroke-dashoffset: 0; }
        }
        .animate-draw-stem {
          stroke-dasharray: 30;
          animation: draw-stem 0.3s ease-out forwards;
        }

        @keyframes draw-branch {
          from { stroke-dashoffset: 400; opacity: 0; }
          to { stroke-dashoffset: 0; opacity: 1; }
        }
        .animate-draw-branch-1 {
          stroke-dasharray: 400;
          animation: draw-branch 0.8s ease-out forwards;
          animation-delay: 0.2s;
          opacity: 0;
        }
        .animate-draw-branch-2 {
          stroke-dasharray: 400;
          animation: draw-branch 0.6s ease-out forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }
        .animate-draw-branch-3 {
          stroke-dasharray: 400;
          animation: draw-branch 0.6s ease-out forwards;
          animation-delay: 0.4s;
          opacity: 0;
        }
        .animate-draw-branch-4 {
          stroke-dasharray: 400;
          animation: draw-branch 0.8s ease-out forwards;
          animation-delay: 0.5s;
          opacity: 0;
        }

        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        .animate-pulse-dot {
          animation: pulse-dot 2s ease-in-out infinite;
          opacity: 0;
          animation-fill-mode: backwards;
        }
      `}</style>
    </div>
  )
}
