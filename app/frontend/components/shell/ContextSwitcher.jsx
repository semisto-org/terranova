import React, { useState, useRef, useEffect } from 'react'
import { Link, usePage, router } from '@inertiajs/react'

const POLES = [
  { id: 'lab', label: 'Gestion du Lab', path: '/lab', accent: '#5B5781', bg: '#c8bfd2', icon: '/semisto-global.png' },
  { id: 'design', label: 'Design Studio', path: '/design', accent: '#AFBD00', bg: '#e1e6d8', icon: '/icons/design.png' },
  { id: 'academy', label: 'Academy', path: '/academy', accent: '#B01A19', bg: '#eac7b8', icon: '/icons/academy.png' },
  { id: 'nursery', label: 'Nursery', path: '/nursery', accent: '#EF9B0D', bg: '#fbe6c3', icon: '/icons/nursery.png' },
  { id: 'plants', label: 'Bases de données végétales', path: '/plants', accent: '#5B5781', bg: '#c8bfd2' },
  { id: 'knowledge', label: 'Base de connaissances', path: '/knowledge', accent: '#0D9488', bg: '#ccfbf1' },
  { id: 'admin', label: 'Administration', path: '/admin', accent: '#64748B', bg: '#e2e8f0' },
]

export function getPoleFromPath(pathname) {
  const segment = pathname.split('/').filter(Boolean)[0] || ''
  return POLES.find((p) => p.id === segment) || POLES[0]
}

export default function ContextSwitcher() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { auth } = usePage().props
  const currentPole = getPoleFromPath(window.location.pathname)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
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

      {open && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-xl border border-stone-200 shadow-xl z-50 overflow-hidden">
          {auth?.member && (
            <div className="px-4 py-3 border-b border-stone-100">
              <p className="text-sm font-medium text-stone-900">{auth.member.firstName} {auth.member.lastName}</p>
              <p className="text-xs text-stone-500">{auth.member.email}</p>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier mon profil
              </Link>
            </div>
          )}

          <div className="py-1.5">
            <p className="px-4 py-1.5 text-xs font-medium text-stone-400 uppercase tracking-wider">Poles</p>
            {POLES.filter((p) => p.id !== 'plants' && p.id !== 'knowledge').map((pole) => (
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
          </div>

          <div className="py-1.5 border-t border-stone-100">
            <p className="px-4 py-1.5 text-xs font-medium text-stone-400 uppercase tracking-wider">Outils</p>
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

          <div className="py-1.5 border-t border-stone-100">
            <button
              onClick={() => {
                setOpen(false)
                router.delete('/logout')
              }}
              className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Deconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
