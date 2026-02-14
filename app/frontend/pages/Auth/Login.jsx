import React from 'react'
import { useForm, usePage } from '@inertiajs/react'

export default function Login() {
  const { flash } = usePage().props
  const { data, setData, post, processing } = useForm({
    email: '',
    password: '',
  })

  function handleSubmit(e) {
    e.preventDefault()
    post('/login')
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 space-y-6">
          <div className="text-center">
            <h1
              className="text-2xl font-semibold text-stone-900"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Terranova
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Connectez-vous pour continuer
            </p>
          </div>

          {flash?.alert && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {flash.alert}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-stone-700 mb-1"
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
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
                           focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
                           focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white
                         disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {processing ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
