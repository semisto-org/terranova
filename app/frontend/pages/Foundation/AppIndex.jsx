import React from 'react'
import { Link } from '@inertiajs/react'

export default function AppIndex({ message, milestone }) {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900" style={{ fontFamily: 'var(--font-heading)' }}>
          Terranova
        </h1>
        <p className="text-sm text-stone-500 mt-1">{message}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/lab" className="rounded-xl border border-stone-200 bg-white p-4 hover:border-[#5B5781] transition-colors block">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#5B5781' }}>L</span>
            <span className="font-medium text-stone-900">Gestion du Lab</span>
          </div>
          <p className="text-xs text-stone-500 mt-2">Cycles Shape Up, membres, Semos, timesheets</p>
        </Link>

        <Link href="/plants" className="rounded-xl border border-stone-200 bg-white p-4 hover:border-[#5B5781] transition-colors block">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold bg-emerald-600">P</span>
            <span className="font-medium text-stone-900">Bases de données végétales</span>
          </div>
          <p className="text-xs text-stone-500 mt-2">Base de données végétale, recherche, palettes</p>
        </Link>

        <Link href="/design" className="rounded-xl border border-stone-200 bg-white p-4 hover:border-[#AFBD00] transition-colors block">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#AFBD00' }}>D</span>
            <span className="font-medium text-stone-900">Design Studio</span>
          </div>
          <p className="text-xs text-stone-500 mt-2">Projets de jardins-forêts, offres, plantations</p>
        </Link>

        <Link href="/academy" className="rounded-xl border border-stone-200 bg-white p-4 hover:border-[#B01A19] transition-colors block">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#B01A19' }}>A</span>
            <span className="font-medium text-stone-900">Academy</span>
          </div>
          <p className="text-xs text-stone-500 mt-2">Formations, inscriptions, calendrier</p>
        </Link>

        <Link href="/nursery" className="rounded-xl border border-stone-200 bg-white p-4 hover:border-[#EF9B0D] transition-colors block">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#EF9B0D' }}>N</span>
            <span className="font-medium text-stone-900">Nursery</span>
          </div>
          <p className="text-xs text-stone-500 mt-2">Stock, commandes, catalogue, transferts</p>
        </Link>
      </div>
    </div>
  )
}
