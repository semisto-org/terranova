import type { PlantLocation } from '../types'

interface PlantLocationMapProps {
  locations: PlantLocation[]
  onLocationSelect?: (locationId: string) => void
}

export function PlantLocationMap({ locations, onLocationSelect }: PlantLocationMapProps) {
  if (locations.length === 0) {
    return (
      <div className="aspect-video bg-gradient-to-br from-stone-100 to-stone-200 rounded-xl flex items-center justify-center">
        <div className="text-center text-stone-400">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">Aucune implantation répertoriée</p>
        </div>
      </div>
    )
  }

  // Static map placeholder - in production, this would integrate with Mapbox/Leaflet
  return (
    <div className="relative aspect-video bg-gradient-to-br from-[#e8ebe0] to-[#d4d9c6] rounded-xl overflow-hidden">
      {/* Map background pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-stone-400" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Location markers */}
      <div className="absolute inset-0 p-4">
        <div className="relative w-full h-full">
          {locations.map((location, index) => {
            // Distribute markers visually across the map placeholder
            const x = 15 + (index * 20) % 70
            const y = 20 + (index * 25) % 60

            return (
              <button
                key={location.id}
                onClick={() => onLocationSelect?.(location.id)}
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
              >
                {/* Marker */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                  location.isMotherPlant
                    ? 'bg-[#AFBD00] text-white'
                    : 'bg-[#5B5781] text-white'
                }`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  </svg>
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-stone-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {location.placeName}
                    {location.isMotherPlant && (
                      <span className="ml-1 text-[#AFBD00]">• Plant-mère</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#AFBD00]" />
            <span className="text-stone-600">Plant-mère</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#5B5781]" />
            <span className="text-stone-600">Implantation</span>
          </div>
        </div>
      </div>

      {/* Location count */}
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-stone-700">
        {locations.length} implantation{locations.length > 1 ? 's' : ''}
      </div>
    </div>
  )
}
