import type { ReactNode } from 'react'

// Exposure icons
export function SunIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function PartialShadeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 3v1M18.36 5.64l-.71.71M21 12h-1M18.36 18.36l-.71-.71M12 20v1M5.64 18.36l.71-.71M3 12h1M5.64 5.64l.71.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 7a5 5 0 0 1 0 10" fill="currentColor" />
      <path d="M12 7a5 5 0 0 0 0 10" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

export function ShadeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7a5 5 0 0 1 0 10" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

// Type icons
export function TreeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 22V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14L7 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 14L17 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="12" cy="8" rx="6" ry="6" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

export function ShrubIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 22V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="11" r="5" fill="currentColor" opacity="0.8" />
      <circle cx="7" cy="13" r="3" fill="currentColor" opacity="0.6" />
      <circle cx="17" cy="13" r="3" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

export function HerbaceousIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 12C12 8 15 5 15 5C15 5 12 8 12 12Z" fill="currentColor" opacity="0.8" />
      <path d="M12 14C12 10 9 7 9 7C9 7 12 10 12 14Z" fill="currentColor" opacity="0.8" />
      <path d="M12 16C12 13 14 11 14 11C14 11 12 13 12 16Z" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

export function ClimberIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M8 22C8 22 6 18 6 14C6 10 8 6 12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 8C14 8 16 10 16 12C16 14 14 16 14 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="10" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="14" cy="14" r="2" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

export function GroundCoverIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M2 18h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="6" cy="16" rx="3" ry="2" fill="currentColor" opacity="0.7" />
      <ellipse cx="12" cy="15" rx="4" ry="3" fill="currentColor" opacity="0.8" />
      <ellipse cx="18" cy="16" rx="3" ry="2" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

// Foliage icons
export function DeciduousIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 3C7 3 4 8 4 12C4 16 7 18 12 18C17 18 20 16 20 12C20 8 17 3 12 3Z" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 9L12 6L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
  )
}

export function EvergreenIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 3C7 3 4 8 4 12C4 16 7 18 12 18C17 18 20 16 20 12C20 8 17 3 12 3Z" fill="currentColor" opacity="0.8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// Root system icons
export function TaprootIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 4V20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 8L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 8L16 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 14L9 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 14L15 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function FibrousRootIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 4V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 8C8 8 6 14 5 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 8C10 8 9 14 8 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 8V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 8C14 8 15 14 16 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 8C16 8 18 14 19 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function SpreadingRootIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 4V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 12V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 12V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 12V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 12V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// Growth rate icons
export function SlowGrowthIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M4 20L10 14L14 18L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="12" r="2" fill="currentColor" />
    </svg>
  )
}

export function MediumGrowthIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M4 16L10 10L14 14L20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="8" r="2" fill="currentColor" />
    </svg>
  )
}

export function FastGrowthIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M4 18L8 14L12 16L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 4H20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Watering icons
export function WaterDropIcon({ filled = false, className = "w-5 h-5" }: { filled?: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21C16.4183 21 20 17.4183 20 13C20 8.58172 12 2 12 2C12 2 4 8.58172 4 13C4 17.4183 7.58172 21 12 21Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        opacity={filled ? 1 : 0.3}
      />
    </svg>
  )
}

// Soil icons
export function SoilClayIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="8" width="16" height="4" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="4" y="14" width="16" height="4" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="4" y="20" width="16" height="2" rx="1" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

export function SoilSandyIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="6" cy="10" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="12" cy="8" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="18" cy="10" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="8" cy="14" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="14" cy="13" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="10" cy="18" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="16" cy="17" r="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

// Fertility icons
export function SelfFertileIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  )
}

export function CrossPollinationIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="7" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M11 12H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 9L14 12L12 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// Hardiness icon
export function HardinessIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 6L8 10M12 6L16 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 12L7 17M12 12L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="4" r="2" fill="currentColor" />
    </svg>
  )
}

// Forest garden zone icons
export function CanopyIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="6" rx="8" ry="4" fill="currentColor" opacity="0.8" />
      <path d="M12 10V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 14L12 12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

export function UnderstoryIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="4" rx="10" ry="2" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <ellipse cx="12" cy="12" rx="5" ry="4" fill="currentColor" opacity="0.8" />
      <path d="M12 16V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function EdgeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M4 4C4 4 4 20 4 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <ellipse cx="14" cy="12" rx="6" ry="5" fill="currentColor" opacity="0.8" />
      <path d="M14 17V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// Helper to get icon by characteristic type
export function getCharacteristicIcon(type: string, value: string): ReactNode {
  const iconClass = "w-8 h-8"

  // Exposure
  if (type === 'exposure') {
    switch (value) {
      case 'sun': return <SunIcon className={iconClass} />
      case 'partial-shade': return <PartialShadeIcon className={iconClass} />
      case 'shade': return <ShadeIcon className={iconClass} />
    }
  }

  // Plant type
  if (type === 'plantType') {
    switch (value) {
      case 'tree': return <TreeIcon className={iconClass} />
      case 'shrub': return <ShrubIcon className={iconClass} />
      case 'herbaceous': return <HerbaceousIcon className={iconClass} />
      case 'climber': return <ClimberIcon className={iconClass} />
      case 'ground-cover': return <GroundCoverIcon className={iconClass} />
    }
  }

  // Foliage
  if (type === 'foliage') {
    switch (value) {
      case 'deciduous': return <DeciduousIcon className={iconClass} />
      case 'evergreen': return <EvergreenIcon className={iconClass} />
      case 'semi-evergreen': return <EvergreenIcon className={iconClass} />
    }
  }

  // Root system
  if (type === 'rootSystem') {
    switch (value) {
      case 'taproot': return <TaprootIcon className={iconClass} />
      case 'fibrous': return <FibrousRootIcon className={iconClass} />
      case 'spreading': return <SpreadingRootIcon className={iconClass} />
    }
  }

  // Growth rate
  if (type === 'growthRate') {
    switch (value) {
      case 'slow': return <SlowGrowthIcon className={iconClass} />
      case 'medium': return <MediumGrowthIcon className={iconClass} />
      case 'fast': return <FastGrowthIcon className={iconClass} />
    }
  }

  // Forest garden zone
  if (type === 'forestGardenZone') {
    switch (value) {
      case 'canopy': return <CanopyIcon className={iconClass} />
      case 'understory': return <UnderstoryIcon className={iconClass} />
      case 'edge': return <EdgeIcon className={iconClass} />
      case 'light-shade': return <UnderstoryIcon className={iconClass} />
    }
  }

  // Fertility
  if (type === 'fertility') {
    switch (value) {
      case 'self-fertile': return <SelfFertileIcon className={iconClass} />
      case 'self-sterile': return <CrossPollinationIcon className={iconClass} />
      case 'partially-self-fertile': return <CrossPollinationIcon className={iconClass} />
    }
  }

  return null
}
