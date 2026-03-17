/**
 * Domain-aware path helpers for My Semisto.
 * On my.semisto.org (or any my.* domain), paths have no /my prefix.
 * On terranova.semisto.org (or localhost), paths are prefixed with /my.
 */

function isMyDomain() {
  return window.location.hostname.startsWith('my.')
}

export function myPath(path = '/') {
  const prefix = isMyDomain() ? '' : '/my'
  return `${prefix}${path}`
}

export function myApiPath(path) {
  const prefix = isMyDomain() ? '/api/v1' : '/api/v1/my'
  return `${prefix}${path}`
}
