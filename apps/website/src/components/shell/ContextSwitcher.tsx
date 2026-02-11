import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, Settings, LogOut, Home, Globe, Trees } from 'lucide-react'
import type { Pole, Lab, User } from './AppShell'

interface ContextSwitcherProps {
  poles: Pole[]
  activePoleId: string
  activePoleLabel: string
  labs: Lab[]
  activeLabId: string
  user: User
  showLabManagement?: boolean
  showWebsite?: boolean
  onPoleChange?: (poleId: string) => void
  onLabChange?: (labId: string) => void
  onSettings?: () => void
  onLogout?: () => void
}

export function ContextSwitcher({
  poles,
  activePoleId,
  activePoleLabel,
  labs,
  activeLabId,
  user,
  showLabManagement = true,
  showWebsite = false,
  onPoleChange,
  onLabChange,
  onSettings,
  onLogout,
}: ContextSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const activePole = poles.find(p => p.id === activePoleId)
  const activeLab = labs.find(l => l.id === activeLabId)

  // Update menu position when opened
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update position on open and on scroll/resize
  useEffect(() => {
    if (isOpen) {
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isOpen, updatePosition])

  const handlePoleSelect = (poleId: string) => {
    onPoleChange?.(poleId)
    setIsOpen(false)
  }

  const handleLabSelect = (labId: string) => {
    onLabChange?.(labId)
    setIsOpen(false)
  }

  const handleSpecialSection = (section: 'lab-management' | 'website') => {
    onPoleChange?.(section)
    setIsOpen(false)
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        {/* Pole color indicator */}
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ backgroundColor: activePole?.color || '#5B5781' }}
        >
          <Trees className="w-4 h-4 text-white" />
        </div>

        <div className="flex flex-col items-start">
          <span className="font-medium text-stone-900 dark:text-stone-100 text-sm leading-tight">
            {activeLab?.name || 'Semisto'}
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400 leading-tight">
            {activePoleLabel}
          </span>
        </div>

        <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu - using portal for correct positioning */}
      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed w-72 rounded-2xl overflow-y-auto shadow-2xl"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            maxHeight: `calc(100vh - ${menuPosition.top + 16}px)`,
            zIndex: 9999,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.75) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.2) inset, 0 1px 0 rgba(255,255,255,0.6) inset',
          }}
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-stone-900/10">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-stone-500/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-stone-700">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              )}
              <div>
                <div className="font-medium text-stone-900">
                  {user.name}
                </div>
                <div className="text-sm text-stone-600">
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Poles */}
          <div className="px-2 py-2 border-b border-stone-900/10">
            <div className="px-2 py-1 text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Pôles
            </div>
            {poles.map(pole => (
              <button
                key={pole.id}
                onClick={() => handlePoleSelect(pole.id)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-stone-900/5 transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: pole.color }}
                />
                <span className="flex-1 text-left text-stone-700">
                  {pole.label}
                </span>
                {activePoleId === pole.id && (
                  <Check className="w-4 h-4 text-stone-500" />
                )}
              </button>
            ))}
          </div>

          {/* Special Sections */}
          <div className="px-2 py-2 border-b border-stone-900/10">
            {showLabManagement && (
              <button
                onClick={() => handleSpecialSection('lab-management')}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-stone-900/5 transition-colors"
              >
                <Home className="w-4 h-4 text-stone-500" />
                <span className="flex-1 text-left text-stone-700">
                  Gestion du Lab
                </span>
                {activePoleId === 'lab-management' && (
                  <Check className="w-4 h-4 text-stone-500" />
                )}
              </button>
            )}
            {showWebsite && (
              <button
                onClick={() => handleSpecialSection('website')}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-stone-900/5 transition-colors"
              >
                <Globe className="w-4 h-4 text-stone-500" />
                <span className="flex-1 text-left text-stone-700">
                  Website
                </span>
                {activePoleId === 'website' && (
                  <Check className="w-4 h-4 text-stone-500" />
                )}
              </button>
            )}
          </div>

          {/* Labs (only if multiple) */}
          {labs.length > 1 && (
            <div className="px-2 py-2 border-b border-stone-900/10">
              <div className="px-2 py-1 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Labs
              </div>
              {labs.map(lab => (
                <button
                  key={lab.id}
                  onClick={() => handleLabSelect(lab.id)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-stone-900/5 transition-colors"
                >
                  <span className="flex-1 text-left text-stone-700">
                    {lab.name}
                  </span>
                  {activeLabId === lab.id && (
                    <Check className="w-4 h-4 text-stone-500" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="px-2 py-2">
            <button
              onClick={() => {
                onSettings?.()
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-stone-900/5 transition-colors"
            >
              <Settings className="w-4 h-4 text-stone-500" />
              <span className="text-stone-700">Paramètres</span>
            </button>
            <button
              onClick={() => {
                onLogout?.()
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
