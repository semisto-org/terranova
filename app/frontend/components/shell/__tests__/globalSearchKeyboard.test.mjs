import test from 'node:test'
import assert from 'node:assert/strict'
import { getNextActiveIndex } from '../globalSearchKeyboard.js'

test('ArrowDown wraps around', () => {
  assert.equal(getNextActiveIndex(2, 'ArrowDown', 3), 0)
})

test('ArrowUp wraps around', () => {
  assert.equal(getNextActiveIndex(0, 'ArrowUp', 3), 2)
})

test('returns -1 when list empty', () => {
  assert.equal(getNextActiveIndex(-1, 'ArrowDown', 0), -1)
})
