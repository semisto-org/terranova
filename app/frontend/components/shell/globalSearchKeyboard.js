export function getNextActiveIndex(currentIndex, key, size) {
  if (size <= 0) return -1
  if (key === 'ArrowDown') return currentIndex >= size - 1 ? 0 : currentIndex + 1
  if (key === 'ArrowUp') return currentIndex <= 0 ? size - 1 : currentIndex - 1
  return currentIndex
}
