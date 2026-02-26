import React from 'react'
import { useForm, usePage, Link } from '@inertiajs/react'

export default function ForgotPassword() {
  const { flash } = usePage().props
  const { data, setData, post, processing } = useForm({
    email: '',
  })

  function handleSubmit(e) {
    e.preventDefault()
    post('/forgot-password')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#2a2640]">
      {/* Animated color blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />
        <div className="auth-blob auth-blob-4" />
        <div className="auth-blob auth-blob-5" />
      </div>
      <div className="auth-noise absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="auth-animate-in auth-stagger-1 rounded-3xl overflow-hidden shadow-2xl border border-white/30">
          <div
            className="h-[3px]"
            style={{ background: 'linear-gradient(to right, #5B5781, #AFBD00, #B01A19, #EF9B0D, #234766)' }}
          />

          <div className="backdrop-blur-xl bg-white/80 px-8 pt-7 pb-8 space-y-6">
            <div className="auth-animate-in auth-stagger-2 text-center">
              <h1
                className="text-2xl text-stone-800"
                style={{ fontFamily: "var(--font-heading, 'DM Serif Display', serif)" }}
              >
                Mot de passe oublié
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                Entrez votre adresse email pour recevoir un lien de réinitialisation
              </p>
            </div>

            {flash?.notice && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-300/40 px-3 py-2 text-sm text-emerald-800">
                {flash.notice}
              </div>
            )}

            {flash?.alert && (
              <div className="rounded-xl bg-red-500/10 border border-red-300/40 px-3 py-2 text-sm text-red-800">
                {flash.alert}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="auth-animate-in auth-stagger-3">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-stone-600 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  className="w-full rounded-xl bg-white/50 border-0 px-4 py-2.5 text-sm text-stone-800
                             placeholder:text-stone-400
                             focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/90
                             transition-all duration-200"
                />
              </div>

              <div className="auth-animate-in auth-stagger-4 pt-1">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white
                             bg-[#5B5781] hover:bg-[#4a4669] disabled:opacity-50 cursor-pointer
                             transition-colors duration-200 shadow-md"
                >
                  {processing ? 'Envoi en cours...' : 'Envoyer le lien'}
                </button>
              </div>
            </form>

            <div className="auth-animate-in auth-stagger-5 text-center">
              <Link
                href="/login"
                className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>

        <p
          className="auth-animate-in auth-stagger-5 text-center mt-6 text-xs tracking-wide text-white/40"
          style={{ fontFamily: "var(--font-heading, 'DM Serif Display', serif)" }}
        >
          En route vers l'ère des forêts comestibles
        </p>
      </div>
    </main>
  )
}
