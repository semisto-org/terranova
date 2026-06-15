/*
 * Terranova — service worker (PWA app-shell).
 *
 * Objectif : éliminer l'écran blanc au lancement de la PWA installée sur iOS.
 * iOS gèle la webview d'une PWA standalone en arrière-plan ; au réveil, sans
 * coquille en cache, le boot dépend d'un cold fetch réseau (Vite/Inertia) et
 * on obtient un écran blanc. Ce SW sert une coquille HTML mise en cache en
 * fallback de navigation.
 *
 * Stratégies :
 *   - Navigations (mode: 'navigate')  → network-first, fallback coquille cachée.
 *   - Assets fingerprintés sous /vite/ → cache-first (immutables).
 *   - /api/v1/* et toute requête non-GET → réseau pur, jamais de cache.
 *
 * Mise à jour : caches versionnés, purge des anciens à l'activate, skipWaiting
 * + clients.claim pour prendre le contrôle proprement (le boot recharge la page
 * une fois quand un nouveau SW prend la main — voir application.jsx).
 *
 * ⚠️ Bump CACHE_VERSION à chaque changement de logique de ce fichier pour forcer
 * la purge des anciens caches.
 */

const CACHE_VERSION = 'v1'
const SHELL_CACHE = `terranova-shell-${CACHE_VERSION}`
const ASSET_CACHE = `terranova-assets-${CACHE_VERSION}`
const CURRENT_CACHES = [SHELL_CACHE, ASSET_CACHE]

// Clé sous laquelle on conserve la dernière page de navigation réussie, servie
// comme coquille de secours quand le réseau échoue (webview gelée / hors-ligne).
const SHELL_KEY = '/__terranova_app_shell__'

self.addEventListener('install', () => {
  // Le nouveau SW devient actif sans attendre la fermeture des onglets ouverts.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((key) => !CURRENT_CACHES.includes(key)).map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Réseau pur pour : requêtes non-GET, cross-origin, et l'API (jamais de
  // données périmées servies depuis le cache).
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  // Navigations : network-first avec fallback sur la coquille cachée.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  // Assets Vite fingerprintés (immutables) : cache-first.
  // NB : en dev, Vite sert sous /vite-dev/ — non concerné, donc pas
  // d'interférence HMR même si le SW était enregistré.
  if (url.pathname.startsWith('/vite/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Tout le reste : comportement navigateur par défaut (pas de respondWith).
})

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL_CACHE)
  try {
    const response = await fetch(request)
    // On garde une copie de la dernière navigation réussie comme coquille.
    if (response && response.ok) {
      cache.put(SHELL_KEY, response.clone())
    }
    return response
  } catch (err) {
    const cached = (await cache.match(request)) || (await cache.match(SHELL_KEY))
    if (cached) return cached
    throw err
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response && response.ok) {
    cache.put(request, response.clone())
  }
  return response
}
