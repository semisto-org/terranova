import React from 'react'
import { usePage, Link } from '@inertiajs/react'
import { GraduationCap, ArrowRight, CalendarCheck, Sprout, TreePine } from 'lucide-react'
import MySemistoShell from '../../my-semisto/components/MySemistoShell'
import WalletCard from '../../my-semisto/components/WalletCard'

const POLE_COLORS = ['#5B5781', '#AFBD00', '#B01A19', '#EF9B0D', '#234766']

export default function Dashboard() {
  const { contactName, upcomingTrainingsCount, totalTrainingsCount } = usePage().props

  return (
    <MySemistoShell activeNav="/my">
      {/* Welcome banner */}
      <div className="mb-8 my-animate-section relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] px-6 py-6 text-white">
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-4 -right-16 w-40 h-40 rounded-full bg-white/[0.03]" />
        <div className="absolute top-3 right-4 flex gap-1.5">
          {POLE_COLORS.map((c) => (
            <div key={c} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, opacity: 0.6 }} />
          ))}
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sprout size={18} className="opacity-70" />
            <span className="text-xs uppercase tracking-wider opacity-60 font-medium">Mon espace</span>
          </div>
          <h1
            className="text-2xl text-white mb-1"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Bienvenue, {contactName} !
          </h1>
          <p className="text-sm text-white/70">
            Retrouvez ici vos activités, documents et informations personnelles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academy card */}
        <div className="my-animate-section space-y-4" style={{ animationDelay: '100ms' }}>
          <Link
            href="/my/academy"
            className="block rounded-2xl bg-white border border-stone-200 p-5 hover:border-[#B01A19]/30 transition-all group my-card-accent my-warm-glow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: '#B01A1915' }}
                >
                  <GraduationCap size={20} style={{ color: '#B01A19' }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800">Semisto Academy</p>
                  <p className="text-xs text-stone-500">{totalTrainingsCount} activité{totalTrainingsCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-stone-400 group-hover:translate-x-0.5 transition-all" style={{ '--tw-translate-x': '0' }} />
            </div>

            {upcomingTrainingsCount > 0 && (
              <div
                className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg"
                style={{ backgroundColor: '#B01A190D', color: '#B01A19' }}
              >
                <CalendarCheck size={14} />
                <span className="text-xs font-medium">
                  {upcomingTrainingsCount} activité{upcomingTrainingsCount > 1 ? 's' : ''} à venir
                </span>
              </div>
            )}

            {totalTrainingsCount === 0 && (
              <p className="text-xs text-stone-400 mt-1">
                Vous n'avez pas encore d'activités enregistrées.
              </p>
            )}
          </Link>
        </div>

        {/* Wallet */}
        <div className="my-animate-section" style={{ animationDelay: '200ms' }}>
          <WalletCard />
        </div>
      </div>
    </MySemistoShell>
  )
}
