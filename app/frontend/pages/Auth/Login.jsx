import React, { useMemo } from 'react'
import { useForm, usePage, Link } from '@inertiajs/react'
import terranovaLogo from '../../assets/terranova.svg'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Bonne nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export default function Login() {
  const { flash } = usePage().props
  const { data, setData, post, processing } = useForm({
    email: '',
    password: '',
  })
  const greeting = useMemo(() => getGreeting(), [])

  function handleSubmit(e) {
    e.preventDefault()
    post('/login')
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
      {/* Noise texture overlay */}
      <div className="auth-noise absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo above card */}
        <div className="auth-animate-in auth-stagger-1 flex justify-center mb-8">
          <img
            src={terranovaLogo}
            alt="Terranova"
            className="h-[85px] w-auto max-w-full object-contain rounded-2xl"
          />
        </div>

        {/* Card */}
        <div className="auth-animate-in auth-stagger-2 rounded-3xl overflow-hidden shadow-2xl border border-white/30">
          <div className="backdrop-blur-xl bg-white/80 px-8 pt-7 pb-8 space-y-6">
            {/* Greeting */}
            <div className="auth-animate-in auth-stagger-3 text-center">
              <h2
                className="text-2xl text-stone-800"
                style={{ fontFamily: "var(--font-heading, 'DM Serif Display', serif)" }}
              >
                {greeting} !
              </h2>
            </div>

            {flash?.alert && (
              <div className="rounded-xl bg-red-500/10 border border-red-300/40 px-3 py-2 text-sm text-red-800">
                {flash.alert}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="auth-animate-in auth-stagger-4">
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
                  required
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  className="w-full rounded-xl bg-white/50 border-0 px-4 py-2.5 text-sm text-stone-800
                             placeholder:text-stone-400
                             focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/90
                             transition-all duration-200"
                />
              </div>

              <div className="auth-animate-in auth-stagger-5">
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-stone-600"
                  >
                    Mot de passe
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  className="w-full rounded-xl bg-white/50 border-0 px-4 py-2.5 text-sm text-stone-800
                             placeholder:text-stone-400
                             focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/90
                             transition-all duration-200"
                />
              </div>

              <div className="auth-animate-in auth-stagger-6 pt-1">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white
                             bg-[#5B5781] hover:bg-[#4a4669] disabled:opacity-50 cursor-pointer
                             transition-colors duration-200 shadow-md"
                >
                  {processing ? 'Connexion...' : 'Se connecter'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Tagline below card */}
        <p
          className="auth-animate-in auth-stagger-6 text-center mt-6 text-xs tracking-wide text-white/40"
          style={{ fontFamily: "var(--font-heading, 'DM Serif Display', serif)" }}
        >
          En route vers l'ère des forêts comestibles
        </p>
      </div>
    </main>
  )
}
