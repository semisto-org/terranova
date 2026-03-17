import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Wallet, X, Sparkles } from 'lucide-react'

const POLE_DOTS = ['#5B5781', '#AFBD00', '#B01A19', '#EF9B0D', '#234766']

export default function WalletCard() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full rounded-2xl p-5 text-left text-white relative overflow-hidden
                   hover:shadow-lg transition-all cursor-pointer group"
        style={{
          background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 60%, #234766 100%)',
        }}
        aria-label="Voir le portefeuille Semos"
      >
        {/* Decorative orb */}
        <div
          className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"
          style={{ background: 'radial-gradient(circle, #EF9B0D, transparent)' }}
        />
        <div
          className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #5B5781, transparent)' }}
        />

        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet size={20} className="opacity-80" />
              <span className="text-sm font-medium opacity-90">Mon Portefeuille</span>
            </div>
            <Sparkles size={16} className="opacity-50 group-hover:opacity-80 transition-opacity" />
          </div>
          <p className="text-3xl font-bold tracking-tight">0 Semos</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs opacity-60">Monnaie complémentaire Semisto</p>
            <div className="flex gap-1">
              {POLE_DOTS.map((c) => (
                <div key={c} className="w-1 h-1 rounded-full" style={{ backgroundColor: c, opacity: 0.5 }} />
              ))}
            </div>
          </div>
        </div>
      </button>

      {showModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40"
            onClick={() => setShowModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-modal-title"
          >
            <div
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden my-animate-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Colored top bar */}
              <div className="h-1" style={{ background: 'linear-gradient(90deg, #2D6A4F, #EF9B0D, #5B5781, #B01A19, #234766)' }} />

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 id="wallet-modal-title" className="text-lg font-semibold text-stone-800" style={{ fontFamily: "var(--font-heading)" }}>
                    Les Semos
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors cursor-pointer"
                    aria-label="Fermer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
                  <p>
Les <strong>Semos</strong> sont la monnaie complémentaire du mouvement Semisto.
                    Ils récompensent votre engagement et votre participation aux activités,
                    chantiers et événements.
                  </p>
                  <p>
                    Vous pourrez bientôt utiliser vos Semos pour bénéficier de réductions
                    sur les activités, échanger des plants dans la pépinière, et bien plus encore.
                  </p>

                  <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: '#EF9B0D12', border: '1px solid #EF9B0D30' }}>
                    <div className="flex items-start gap-2">
                      <Sparkles size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#EF9B0D' }} />
                      <p className="text-sm" style={{ color: '#92600a' }}>
                        Cette fonctionnalité est en cours de développement.
                        Restez à l'écoute !
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="mt-5 w-full py-2.5 rounded-xl text-white text-sm font-medium
                             hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ backgroundColor: '#2D6A4F' }}
                >
                  Compris !
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
