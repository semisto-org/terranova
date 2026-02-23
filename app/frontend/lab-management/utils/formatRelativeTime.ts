export function formatRelativeTime(dateString: string | null): { text: string; isOnline: boolean } {
  if (!dateString) return { text: 'Jamais', isOnline: false }

  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)
  const diffW = Math.floor(diffD / 7)
  const diffM = Math.floor(diffD / 30)

  if (diffMin < 5) return { text: 'En ligne', isOnline: true }
  if (diffMin < 60) return { text: `Il y a ${diffMin}m`, isOnline: false }
  if (diffH < 24) return { text: `Il y a ${diffH}h`, isOnline: false }
  if (diffD < 7) return { text: `Il y a ${diffD}j`, isOnline: false }
  if (diffD < 30) return { text: `Il y a ${diffW} sem.`, isOnline: false }
  return { text: `Il y a ${diffM} mois`, isOnline: false }
}
