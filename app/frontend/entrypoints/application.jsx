import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import * as Sentry from '@sentry/react'
import { Toaster } from 'sonner'
import AppShell from '../components/shell/AppShell'
import '../styles/application.css'

if (import.meta.env.PROD) {
  const dsn = document.querySelector('meta[name="sentry-dsn"]')?.content
  if (dsn) {
    Sentry.init({
      dsn,
      environment: 'production',
      tracesSampleRate: 0.1,
      integrations: [Sentry.browserTracingIntegration()],
    })
  }
}

// Service worker — coquille PWA pour éliminer l'écran blanc au réveil d'une
// webview iOS gelée. Uniquement en production (en dev, on ne l'enregistre pas
// pour ne pas interférer avec le HMR Vite servi sous /vite-dev/).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // Capturé avant l'enregistrement : si la page n'était pas encore contrôlée,
  // le premier `controllerchange` est la prise de contrôle initiale (clients.claim)
  // et ne doit PAS recharger. S'il y avait déjà un contrôleur, un changement = un
  // nouveau SW déployé → on recharge une fois pour ne pas coincer sur l'ancienne version.
  const hadController = Boolean(navigator.serviceWorker.controller)
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing || !hadController) return
    refreshing = true
    window.location.reload()
  })
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Échec d'enregistrement non bloquant : l'app fonctionne sans SW.
    })
  })
}

const PAGES_WITHOUT_SHELL = ['Auth/Login', 'Auth/ForgotPassword', 'Auth/ResetPassword', 'Design/ClientPortal', 'Academy/Registration', 'MySemisto/Login', 'MySemisto/Dashboard', 'MySemisto/Academy', 'MySemisto/TrainingDetail', 'MySemisto/Directory', 'MySemisto/Profile', 'Public/Catalog', 'Plants/PublicSpecies', 'DesignSystem']

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('../pages/**/*.{jsx,tsx}', { eager: true })
    const page = pages[`../pages/${name}.jsx`] || pages[`../pages/${name}.tsx`]
    if (!PAGES_WITHOUT_SHELL.includes(name) && page.default) {
      page.default.layout = page.default.layout || ((page) => <AppShell>{page}</AppShell>)
    }
    return page
  },
  setup({ el, App, props }) {
    // Set Sentry user from Inertia shared props
    const member = props?.initialPage?.props?.auth?.member
    if (member) {
      Sentry.setUser({ id: member.id, email: member.email, username: `${member.firstName} ${member.lastName}` })
    }

    const app = React.createElement(App, props)
    const toaster = React.createElement(Toaster, {
      position: 'top-right',
      richColors: true,
      closeButton: true,
      duration: 5000,
    })
    createRoot(el).render(
      React.createElement(Sentry.ErrorBoundary, {
        fallback: ({ error }) => (
          React.createElement('div', { style: { padding: '2rem', textAlign: 'center' } },
            React.createElement('h1', null, 'Une erreur est survenue'),
            React.createElement('p', { style: { color: '#666' } }, 'Rechargez la page pour continuer.'),
            React.createElement('button', {
              onClick: () => window.location.reload(),
              style: { marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }
            }, 'Recharger')
          )
        ),
        showDialog: false,
      }, React.createElement(React.Fragment, null, app, toaster))
    )
  },
})
