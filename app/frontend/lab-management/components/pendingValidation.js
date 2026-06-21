// Logique pure de la vue « tâches en attente de validation » (#47, AC4).
// Extrait du composant pour être testable sans DOM (node:test).

/**
 * Regroupe les points d'action en attente par réunion source, en conservant
 * l'ordre d'arrivée des items (l'API les renvoie déjà triés par position). La
 * première occurrence d'un eventId fixe la position du groupe — ce qui donne la
 * traçabilité « vient de la réunion X » attendue par l'AC4.
 *
 * @param {Array<{id:string, eventId:string, eventTitle:string, description:string,
 *   status:string, assigneeId:string|null, taskId:string|null, position:number}>} items
 * @returns {Array<{eventId:string, eventTitle:string, items:Array}>}
 */
export function groupPendingByMeeting(items) {
  const groups = []
  const byEvent = new Map()
  for (const item of items || []) {
    let group = byEvent.get(item.eventId)
    if (!group) {
      group = { eventId: item.eventId, eventTitle: item.eventTitle, items: [] }
      byEvent.set(item.eventId, group)
      groups.push(group)
    }
    group.items.push(item)
  }
  return groups
}

/**
 * Retire un point de la liste à plat (mise à jour optimiste après validation :
 * le point validé devient une tâche et quitte la file d'attente).
 *
 * @param {Array} items
 * @param {string} id
 * @returns {Array}
 */
export function removePendingItem(items, id) {
  return (items || []).filter((item) => item.id !== id)
}
