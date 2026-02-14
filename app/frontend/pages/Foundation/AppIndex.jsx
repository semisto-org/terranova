import React from 'react'
import { Link } from '@inertiajs/react'

export default function AppIndex({ message, milestone }) {
  return (
    <main style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '2rem' }}>
      <p style={{ margin: 0, color: '#5B5781', fontWeight: 700 }}>Inertia.js</p>
      <h1 style={{ marginTop: '0.5rem' }}>Terranova Application</h1>
      <p>{message}</p>
      <p>Milestone actif: {milestone}</p>
      <p>
        <Link href="/app/lab">Aller au Milestone 2 (Lab Management)</Link>
      </p>
      <p>
        <Link href="/plants">Aller au Milestone 3 (Plant Database)</Link>
      </p>
      <p>
        <Link href="/app/design">Aller au Milestone 4 (Design Studio)</Link>
      </p>
    </main>
  )
}
