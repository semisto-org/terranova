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
    })
  }
}

const PAGES_WITHOUT_SHELL = ['Auth/Login', 'Auth/ForgotPassword', 'Auth/ResetPassword', 'Design/ClientPortal', 'Academy/Registration']

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
    createRoot(el).render(React.createElement(App, props))
  },
})
