import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link, usePage, router } from '@inertiajs/react'

const POLES = [
  { id: 'home', label: 'Accueil', path: '/', accent: '#78716C', bg: '#e7e5e4', icon: '/semisto-global.png' },
  { id: 'design', label: 'Design Studio', path: '/design', accent: '#AFBD00', bg: '#e1e6d8', icon: '/icons/design.png' },
  { id: 'academy', label: 'Academy', path: '/academy', accent: '#B01A19', bg: '#eac7b8', icon: '/icons/academy.png' },
  { id: 'nursery', label: 'Pépinière-école', path: '/nursery', accent: '#EF9B0D', bg: '#fbe6c3', icon: '/icons/nursery.png' },
  { id: 'plants', label: 'Bases de données végétales', path: '/plants', accent: '#5B5781', bg: '#c8bfd2' },
  { id: 'knowledge', label: 'Base de connaissances', path: '/knowledge', accent: '#0D9488', bg: '#ccfbf1' },
  { id: 'admin', label: 'Administration', path: '/admin', accent: '#64748B', bg: '#e2e8f0' },
  { id: 'parametres', label: 'Paramètres', path: '/parametres', accent: '#64748B', bg: '#e2e8f0' },
]

export function getPoleFromPath(pathname) {
  const segment = pathname.split('/').filter(Boolean)[0] || ''
  if (segment === '') return POLES.find((p) => p.id === 'home')
  return POLES.find((p) => p.id === segment) || POLES[0]
}

export default function ContextSwitcher() {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const { auth } = usePage().props
  const currentPole = getPoleFromPath(window.location.pathname)
  const isAdherent = auth?.member?.membershipType === 'adherent'

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({ top: rect.bottom + 4, left: rect.left })
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useLayoutEffect(() => {
    if (open) {
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [open, updatePosition])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-stone-100 transition-colors"
      >
        {currentPole.icon ? (
          <img src={currentPole.icon} alt="" className="w-7 h-7 rounded-lg shrink-0 object-cover" />
        ) : (
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: currentPole.accent }}
          >
            {currentPole.label[0]}
          </span>
        )}
        <span className="text-sm font-semibold text-stone-800">{currentPole.label}</span>
        <svg className={`w-4 h-4 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed w-72 bg-white rounded-xl border border-stone-200 shadow-xl overflow-hidden"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            zIndex: 99999,
          }}
        >
          <div className="py-1.5">
            {(() => {
              const homePole = POLES.find((p) => p.id === 'home')
              return (
                <Link
                  href={homePole.path}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                    currentPole.id === homePole.id
                      ? 'bg-stone-50 text-stone-900 font-medium'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <svg className="w-5 h-5 text-stone-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
                  </svg>
                  {homePole.label}
                </Link>
              )
            })()}
          </div>

          {!isAdherent && (<div className="py-1.5 border-t border-stone-100">
            <p className="px-4 py-1.5 text-xs font-medium text-stone-400 uppercase tracking-wider">Lab Wallonie</p>
            {POLES.filter((p) => !['home', 'plants', 'knowledge', 'parametres', 'admin'].includes(p.id)).map((pole) => (
              <Link
                key={pole.id}
                href={pole.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  currentPole.id === pole.id
                    ? 'bg-stone-50 text-stone-900 font-medium'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                {pole.icon ? (
                  <img src={pole.icon} alt="" className="w-5 h-5 rounded shrink-0 object-cover" />
                ) : (
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ backgroundColor: pole.accent }}
                  >
                    {pole.label[0]}
                  </span>
                )}
                {pole.label}
              </Link>
            ))}
          </div>)}

          <div className="py-1.5 border-t border-stone-100">
            <p className="px-4 py-1.5 text-xs font-medium text-stone-400 uppercase tracking-wider">Outils mutualisés</p>
            <Link
              href="/plants"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                currentPole.id === 'plants'
                  ? 'bg-stone-50 text-stone-900 font-medium'
                  : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span className="w-5 h-5 rounded flex items-center justify-center bg-emerald-600 text-white text-[10px] font-bold shrink-0">P</span>
              Bases de données végétales
            </Link>
            <Link
              href="/knowledge"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                currentPole.id === 'knowledge'
                  ? 'bg-stone-50 text-stone-900 font-medium'
                  : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span className="w-5 h-5 rounded flex items-center justify-center bg-teal-600 text-white text-[10px] font-bold shrink-0">K</span>
              Base de connaissances
            </Link>
          </div>

          {auth?.member?.isAdmin && (
          <div className="py-1.5 border-t border-stone-100">
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                window.location.pathname.startsWith('/admin')
                  ? 'bg-stone-50 text-stone-900 font-medium'
                  : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span
                className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: '#64748B' }}
              >
                A
              </span>
              Administration
            </Link>
            <Link
              href="/parametres"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                window.location.pathname === '/parametres'
                  ? 'bg-stone-50 text-stone-900 font-medium'
                  : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              <svg className="w-5 h-5 text-stone-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Paramètres
            </Link>
          </div>
          )}

          {auth?.member && (
            <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-3">
                {auth.member.avatar ? (
                  <img
                    src={auth.member.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 bg-stone-400"
                  >
                    {auth.member.firstName?.[0]}{auth.member.lastName?.[0]}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">{auth.member.firstName} {auth.member.lastName}</p>
                  <p className="text-xs text-stone-500 truncate">{auth.member.email}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modifier mon profil
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    router.delete('/logout')
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
