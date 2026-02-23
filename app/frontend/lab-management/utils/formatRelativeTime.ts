const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

export function formatRelativeTime(dateString: string | null): { text: string; isOnline: boolean } {
  if (!dateString) return { text: 'Jamais', isOnline: false }

  const now = Date.now()
  const date = new Date(dateString)
  const diffMs = now - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 5) return { text: 'En ligne', isOnline: true }

  // Format court : "17 octobre"
  const day = date.getDate()
  const month = MONTHS_FR[date.getMonth()]
  return { text: `${day} ${month}`, isOnline: false }
}
