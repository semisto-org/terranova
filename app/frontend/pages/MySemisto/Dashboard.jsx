import React from 'react'
import { usePage, Link } from '@inertiajs/react'
import { GraduationCap, ArrowRight, CalendarCheck } from 'lucide-react'
import MySemistoShell from '../../my-semisto/components/MySemistoShell'
import WalletCard from '../../my-semisto/components/WalletCard'

export default function Dashboard() {
  const { contactName, upcomingTrainingsCount, totalTrainingsCount } = usePage().props

  return (
    <MySemistoShell activeNav="/my">
      {/* Welcome */}
      <div className="mb-8 my-animate-section">
        <h1
          className="text-2xl text-stone-800 mb-1"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Bienvenue, {contactName} !
        </h1>
        <p className="text-sm text-stone-500">
          Retrouvez ici vos formations, documents et informations personnelles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick stats */}
        <div className="my-animate-section space-y-4" style={{ animationDelay: '100ms' }}>
          <Link
            href="/my/academy"
            className="block rounded-2xl bg-white border border-stone-200 p-5 hover:shadow-md hover:border-stone-300 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center">
                  <GraduationCap size={20} className="text-[#2D6A4F]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800">Mes Formations</p>
                  <p className="text-xs text-stone-500">{totalTrainingsCount} formation{totalTrainingsCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-stone-400 group-hover:text-[#2D6A4F] transition-colors" />
            </div>

            {upcomingTrainingsCount > 0 && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700">
                <CalendarCheck size={14} />
                <span className="text-xs font-medium">
                  {upcomingTrainingsCount} formation{upcomingTrainingsCount > 1 ? 's' : ''} a venir
                </span>
              </div>
            )}

            {totalTrainingsCount === 0 && (
              <p className="text-xs text-stone-400 mt-1">
                Vous n'avez pas encore de formations enregistrees.
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
