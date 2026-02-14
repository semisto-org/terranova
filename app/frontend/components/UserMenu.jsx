import React from 'react'
import { usePage, router } from '@inertiajs/react'

export default function UserMenu() {
  const { auth } = usePage().props
  if (!auth?.member) return null

  function handleLogout(e) {
    e.preventDefault()
    router.delete('/logout')
  }

  return (
    <div className="flex items-center gap-3 text-sm text-stone-600">
      <span>{auth.member.firstName} {auth.member.lastName}</span>
      <button
        onClick={handleLogout}
        className="text-stone-400 hover:text-stone-700 underline cursor-pointer"
      >
        Deconnexion
      </button>
    </div>
  )
}
