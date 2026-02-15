import React from 'react'
import { useForm, usePage, Link } from '@inertiajs/react'

export default function ResetPassword({ token }) {
  const { flash } = usePage().props
  const { data, setData, patch, processing } = useForm({
    token: token,
    password: '',
    password_confirmation: '',
  })

  function handleSubmit(e) {
    e.preventDefault()
    patch('/reset-password')
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
              Nouveau mot de passe
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Choisissez un nouveau mot de passe pour votre compte
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
                htmlFor="password"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Nouveau mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                autoFocus
                required
                minLength={8}
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
                           focus:border-transparent"
              />
              <p className="mt-1 text-xs text-stone-400">
                8 caracteres minimum
              </p>
            </div>

            <div>
              <label
                htmlFor="password_confirmation"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="password_confirmation"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={data.password_confirmation}
                onChange={(e) => setData('password_confirmation', e.target.value)}
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
              {processing ? 'Reinitialisation...' : 'Reinitialiser le mot de passe'}
            </button>
          </form>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              Retour a la connexion
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
