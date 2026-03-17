import React, { useState } from 'react'
import { usePage, Link, router } from '@inertiajs/react'
import { Home, GraduationCap, Wallet, LogOut, Menu, X, Leaf } from 'lucide-react'
import semistoLogo from '../../assets/semisto-square-main.png'

const NAV_ITEMS = [
  { label: 'Accueil', href: '/my', icon: Home, color: '#2D6A4F' },
  { label: 'Semisto Academy', href: '/my/academy', icon: GraduationCap, color: '#B01A19' },
  { label: 'Mes Semos (bientôt)', href: '/my/wallet', icon: Wallet, color: '#EF9B0D', disabled: true, hideBadge: true },
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
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30">
        {/* Decorative color stripe on left edge */}
        <div className="absolute left-0 top-0 bottom-0 w-1 my-sidebar-stripe" />

        <div className="flex-1 flex flex-col bg-white border-r border-stone-200 ml-1">
          <div className="flex items-center gap-3 px-5 py-5 border-b border-stone-100">
            <img src={semistoLogo} alt="Semisto" className="h-10 w-10 rounded-lg" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-800 truncate" style={{ fontFamily: "var(--font-heading)" }}>
                My Semisto
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
                    title="Bientôt disponible"
                  >
                    <Icon size={18} />
                    <span className="text-sm">{item.label}</span>
                    {!item.hideBadge && (
                      <span className="ml-auto text-[10px] bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded-full">bientôt</span>
                    )}
                  </div>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    active
                      ? 'font-medium shadow-sm'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
                  }`}
                  style={active ? {
                    backgroundColor: `${item.color}12`,
                    color: item.color,
                    boxShadow: `0 0 0 1px ${item.color}18`,
                  } : undefined}
                  aria-current={active ? 'page' : undefined}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    style={active ? { backgroundColor: `${item.color}18` } : undefined}
                  >
                    <Icon size={16} />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Decorative bottom element */}
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 px-3 py-2 text-stone-300">
              <Leaf size={12} />
              <span className="text-[10px] tracking-wider uppercase">Semisto</span>
            </div>
          </div>

          <div className="px-3 pb-4 border-t border-stone-100 pt-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full cursor-pointer"
            >
              <LogOut size={18} />
              <span className="text-sm">Me déconnecter</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-stone-200">
        {/* Thin color bar on top */}
        <div className="h-0.5 my-sidebar-stripe" />
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
          <div className="md:hidden fixed top-[59px] left-0 right-0 z-50 bg-white border-b border-stone-200 shadow-lg" role="dialog" aria-label="Menu">
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
                      {!item.hideBadge && (
                        <span className="ml-auto text-[10px] bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded-full">bientôt</span>
                      )}
                    </div>
                  )
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      active
                        ? 'font-medium'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                    style={active ? {
                      backgroundColor: `${item.color}12`,
                      color: item.color,
                    } : undefined}
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
                  <span className="text-sm">Me déconnecter</span>
                </button>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-[59px] md:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
