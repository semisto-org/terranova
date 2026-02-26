import test from 'node:test'
import assert from 'node:assert/strict'
import { applyAcademyRealtimeUpdate } from '../realtime.js'

test('applyAcademyRealtimeUpdate patches training update payload', () => {
  const prev = {
    trainings: [{ id: 't1', title: 'Formation A', status: 'draft' }],
    trainingSessions: [],
    trainingRegistrations: [],
  }

  const next = applyAcademyRealtimeUpdate(prev, {
    type: 'training',
    action: 'updated',
    training: { id: 't1', title: 'Formation A+', status: 'planned' },
  })

  assert.equal(next.trainings[0].title, 'Formation A+')
  assert.equal(next.trainings[0].status, 'planned')
})
