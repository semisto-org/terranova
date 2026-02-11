import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Exclude API, auth, static assets, and signin (unlocalized auth page)
  matcher: ['/((?!api|_next|_vercel|signin|.*\\..*).*)'],
}
