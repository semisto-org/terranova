import React, { useState } from 'react'
import { Wallet, X, Sparkles } from 'lucide-react'

export default function WalletCard() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full rounded-2xl bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] p-5 text-left text-white
                   hover:shadow-lg transition-shadow cursor-pointer group"
        aria-label="Voir le portefeuille Semos"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet size={20} className="opacity-80" />
            <span className="text-sm font-medium opacity-90">Mon Portefeuille</span>
          </div>
          <Sparkles size={16} className="opacity-50 group-hover:opacity-80 transition-opacity" />
        </div>
        <p className="text-3xl font-bold tracking-tight">0 Semos</p>
        <p className="text-xs opacity-60 mt-1">Monnaie complementaire Semisto</p>
      </button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wallet-modal-title"
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 my-animate-modal"
            onClick={(e) => e.stopPropagation()}
          >
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
                Les <strong>Semos</strong> sont la monnaie complementaire du mouvement Semisto.
                Ils recompensent votre engagement et votre participation aux formations,
                chantiers et evenements.
              </p>
              <p>
                Vous pourrez bientot utiliser vos Semos pour beneficier de reductions
                sur les formations, echanger des plants dans la pepiniere, et bien plus encore.
              </p>

              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <Sparkles size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    Cette fonctionnalite est en cours de developpement.
                    Restez a l'ecoute !
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#2D6A4F] text-white text-sm font-medium
                         hover:bg-[#245A42] transition-colors cursor-pointer"
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </>
  )
}
