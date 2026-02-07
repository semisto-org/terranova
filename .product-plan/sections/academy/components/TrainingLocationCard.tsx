import type { TrainingLocation, TrainingType } from '../types'
import { MapPin, Users, Home, MoreVertical, Eye, Edit, Trash2, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'

interface TrainingLocationCardProps {
  location: TrainingLocation
  trainingTypes: TrainingType[]
  onView?: (locationId: string) => void
  onEdit?: (locationId: string) => void
  onDelete?: (locationId: string) => void
}

export function TrainingLocationCard({
  location,
  trainingTypes,
  onView,
  onEdit,
  onDelete,
}: TrainingLocationCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

  // Extract city and province from address
  // Format: "Street, POSTAL_CODE City" -> extract "City"
  const getLocationDisplay = (address: string) => {
    const parts = address.split(',')
    if (parts.length > 1) {
      // Get the part after comma (postal code + city)
      const locationPart = parts[parts.length - 1].trim()
      // Remove postal code (first numbers) and keep city name
      const cityMatch = locationPart.match(/\d+\s+(.+)/)
      return cityMatch ? cityMatch[1] : locationPart
    }
    return address
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden hover:shadow-md transition-shadow">
      {/* Photo gallery */}
      {location.photoGallery.length > 0 ? (
        <div className="relative h-48 bg-stone-100 dark:bg-stone-800">
          <img
            src={location.photoGallery[selectedPhotoIndex]}
            alt={location.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent && !parent.querySelector('svg')) {
                const icon = document.createElement('div')
                icon.className = 'w-full h-full flex items-center justify-center'
                icon.innerHTML = '<svg class="w-12 h-12 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>'
                parent.appendChild(icon)
              }
            }}
          />
          {/* Accommodation icon overlay */}
          {location.hasAccommodation && (
            <div className="absolute top-2 right-2 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
              <Home className="w-5 h-5 text-[#B01A19]" />
            </div>
          )}
          {location.photoGallery.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {location.photoGallery.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedPhotoIndex(index)
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === selectedPhotoIndex
                      ? 'bg-white w-6'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-48 bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-stone-400 dark:text-stone-500" />
          {/* Accommodation icon overlay */}
          {location.hasAccommodation && (
            <div className="absolute top-2 right-2 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
              <Home className="w-5 h-5 text-[#B01A19]" />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-lg mb-1">
              {location.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{getLocationDisplay(location.address)}</span>
            </div>
          </div>
          <div className="relative ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-stone-400" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-20 w-40 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 shadow-lg py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onView?.(location.id)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Voir
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onEdit?.(location.id)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onDelete?.(location.id)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info badges */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded text-xs text-stone-700 dark:text-stone-300">
            <Users className="w-3.5 h-3.5" />
            <span>{location.capacity} places</span>
          </div>
        </div>
      </div>
    </div>
  )
}

