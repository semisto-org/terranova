import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import * as Sentry from '@sentry/react'
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

const PAGES_WITHOUT_SHELL = ['Auth/Login', 'Auth/ForgotPassword', 'Auth/ResetPassword', 'Design/ClientPortal', 'Academy/Registration', 'MySemisto/Login', 'MySemisto/Dashboard', 'MySemisto/Academy', 'MySemisto/TrainingDetail']

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('../pages/**/*.jsx', { eager: true })
    const page = pages[`../pages/${name}.jsx`]
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
      }, app)
    )
  },
})
