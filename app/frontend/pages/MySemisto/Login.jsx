import React, { useMemo } from 'react'
import { useForm, usePage } from '@inertiajs/react'
import semistoLogo from '../../assets/semisto-square-main.png'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Bonne nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon apres-midi'
  return 'Bonsoir'
}

export default function Login() {
  const { flash } = usePage().props
  const { data, setData, post, processing } = useForm({ email: '' })
  const greeting = useMemo(() => getGreeting(), [])

  function handleSubmit(e) {
    e.preventDefault()
    post('/my/login')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#1B4332]">
      {/* Nature-inspired animated blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="my-blob my-blob-1" />
        <div className="my-blob my-blob-2" />
        <div className="my-blob my-blob-3" />
        <div className="my-blob my-blob-4" />
        <div className="my-blob my-blob-5" />
      </div>
      {/* Noise texture */}
      <div className="auth-noise absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="auth-animate-in auth-stagger-1 flex justify-center mb-8">
          <img
            src={semistoLogo}
            alt="Semisto"
            className="h-20 w-20 rounded-2xl shadow-lg"
          />
        </div>

        {/* Card */}
        <div className="auth-animate-in auth-stagger-2 rounded-3xl overflow-hidden shadow-2xl border border-white/20">
          <div className="backdrop-blur-xl bg-white/85 px-8 pt-7 pb-8 space-y-6">
            {/* Greeting */}
            <div className="auth-animate-in auth-stagger-3 text-center">
              <h1
                className="text-2xl text-stone-800"
                style={{ fontFamily: "var(--font-heading, 'DM Serif Display', serif)" }}
              >
                {greeting} !
              </h1>
              <p className="text-sm text-stone-500 mt-1">Mon Espace Semisto</p>
            </div>

            {flash?.notice && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-300/40 px-3 py-2.5 text-sm text-emerald-800" role="status">
                {flash.notice}
              </div>
            )}

            {flash?.alert && (
              <div className="rounded-xl bg-red-500/10 border border-red-300/40 px-3 py-2.5 text-sm text-red-800" role="alert">
                {flash.alert}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="auth-animate-in auth-stagger-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-stone-600 mb-1.5"
                >
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full rounded-xl bg-white/50 border-0 px-4 py-2.5 text-sm text-stone-800
                             placeholder:text-stone-400
                             focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:bg-white/90
                             transition-all duration-200"
                  aria-describedby="email-help"
                />
                <p id="email-help" className="text-xs text-stone-400 mt-1.5">
                  Un lien de connexion vous sera envoye par email.
                </p>
              </div>

              <div className="auth-animate-in auth-stagger-5 pt-1">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white
                             bg-[#2D6A4F] hover:bg-[#245A42] disabled:opacity-50 cursor-pointer
                             transition-colors duration-200 shadow-md"
                >
                  {processing ? 'Envoi en cours...' : 'Recevoir mon lien de connexion'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Tagline */}
        <p
          className="auth-animate-in auth-stagger-6 text-center mt-6 text-xs tracking-wide text-white/40"
          style={{ fontFamily: "var(--font-heading, 'DM Serif Display', serif)" }}
        >
          En route vers l'ere des forets comestibles
        </p>
      </div>
    </main>
  )
}
