'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: '/lab',
    })
    setLoading(false)
    if (res?.error) {
      setError('Invalid email or password.')
      return
    }
    if (res?.ok && res.url) {
      window.location.href = res.url
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 max-w-sm">
      <h1 className="text-xl font-semibold">Sign in (dev)</h1>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-600">Email</span>
        <input
          type="email"
          name="email"
          data-testid="signin-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border rounded px-3 py-2"
          placeholder="alice@semisto-paris.fr"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-600">Password</span>
        <input
          type="password"
          name="password"
          data-testid="signin-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        data-testid="signin-submit"
        disabled={loading}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
