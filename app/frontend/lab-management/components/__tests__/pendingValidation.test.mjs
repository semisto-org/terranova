import test from 'node:test'
import assert from 'node:assert/strict'
import { groupPendingByMeeting, removePendingItem } from '../pendingValidation.js'

const mk = (id, eventId, eventTitle, position) => ({
  id, eventId, eventTitle, description: `point ${id}`,
  status: 'proposed', assigneeId: null, taskId: null, position,
})

test('groupPendingByMeeting groups items by meeting, preserving order', () => {
  const items = [
    mk('1', 'e1', 'Réunion A', 0),
    mk('2', 'e2', 'Réunion B', 0),
    mk('3', 'e1', 'Réunion A', 1),
  ]
  const groups = groupPendingByMeeting(items)

  assert.equal(groups.length, 2)
  assert.deepEqual(groups.map((g) => g.eventId), ['e1', 'e2']) // ordre de 1re apparition
  assert.equal(groups[0].eventTitle, 'Réunion A')
  assert.deepEqual(groups[0].items.map((i) => i.id), ['1', '3']) // 2 points de la réunion A
  assert.deepEqual(groups[1].items.map((i) => i.id), ['2'])
})

test('groupPendingByMeeting handles empty / nullish input', () => {
  assert.deepEqual(groupPendingByMeeting([]), [])
  assert.deepEqual(groupPendingByMeeting(undefined), [])
})

test('removePendingItem drops the validated item only', () => {
  const items = [mk('1', 'e1', 'A', 0), mk('2', 'e1', 'A', 1)]
  const next = removePendingItem(items, '1')
  assert.deepEqual(next.map((i) => i.id), ['2'])
})
