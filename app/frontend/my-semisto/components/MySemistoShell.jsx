import React, { useState } from 'react'
import { usePage, Link, router } from '@inertiajs/react'
import { Home, GraduationCap, Wallet, LogOut, Menu, X } from 'lucide-react'
import semistoLogo from '../../assets/semisto-square-main.png'

const NAV_ITEMS = [
  { label: 'Accueil', href: '/my', icon: Home },
  { label: 'Mes Formations', href: '/my/academy', icon: GraduationCap },
  { label: 'Mon Portefeuille', href: '/my/wallet', icon: Wallet, disabled: true },
]

export default function MySemistoShell({ children, activeNav }) {
  const { auth } = usePage().props
  const contact = auth?.contact
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout(e) {
    e.preventDefault()
    router.delete('/my/logout')
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-stone-100">
          <img src={semistoLogo} alt="Semisto" className="h-10 w-10 rounded-lg" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-800 truncate" style={{ fontFamily: "var(--font-heading)" }}>
              Mon Espace Semisto
            </p>
            {contact && (
              <p className="text-xs text-stone-500 truncate">{contact.name}</p>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" role="navigation" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = activeNav === item.href
            if (item.disabled) {
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-400 cursor-default"
                  title="Bientot disponible"
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                  <span className="ml-auto text-[10px] bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded-full">Bientot</span>
                </div>
              )
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  active
                    ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] font-medium'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={18} />
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full cursor-pointer"
          >
            <LogOut size={18} />
            <span className="text-sm">Se deconnecter</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-stone-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={semistoLogo} alt="Semisto" className="h-8 w-8 rounded-lg" />
            <span className="text-sm font-semibold text-stone-800" style={{ fontFamily: "var(--font-heading)" }}>
              Mon Espace
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 cursor-pointer"
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/30"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="md:hidden fixed top-[57px] left-0 right-0 z-50 bg-white border-b border-stone-200 shadow-lg" role="dialog" aria-label="Menu">
            <nav className="px-3 py-3 space-y-1" role="navigation" aria-label="Navigation mobile">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const active = activeNav === item.href
                if (item.disabled) {
                  return (
                    <div
                      key={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-400"
                    >
                      <Icon size={18} />
                      <span className="text-sm">{item.label}</span>
                      <span className="ml-auto text-[10px] bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded-full">Bientot</span>
                    </div>
                  )
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      active
                        ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] font-medium'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={18} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                )
              })}
              <div className="border-t border-stone-100 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full cursor-pointer"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Se deconnecter</span>
                </button>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-[57px] md:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
