import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'terranova_nursery_cart_v1'

function readStorage() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStorage(items) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* quota — ignore */
  }
}

function snapshotBatch(batch) {
  return {
    stockBatchId: batch.stockBatchId,
    speciesId: batch.speciesId,
    speciesName: batch.speciesName,
    varietyId: batch.varietyId,
    varietyName: batch.varietyName,
    containerName: batch.containerName,
    priceEuros: batch.priceEuros,
    nurseryId: batch.nurseryId,
    nurseryName: batch.nurseryName,
    availableQuantity: batch.availableQuantity,
  }
}

export function useCart() {
  const [items, setItems] = useState(() => readStorage())

  useEffect(() => { writeStorage(items) }, [items])

  const addItem = useCallback((batch, qty = 1) => {
    if (!batch || !batch.stockBatchId) return
    const cap = typeof batch.availableQuantity === 'number' ? batch.availableQuantity : 200
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.stockBatchId === batch.stockBatchId)
      if (idx >= 0) {
        const next = prev.slice()
        const newQty = Math.min(next[idx].quantity + qty, Math.max(cap, 1))
        next[idx] = { ...next[idx], quantity: newQty, batch: snapshotBatch(batch) }
        return next
      }
      return [...prev, { stockBatchId: batch.stockBatchId, quantity: Math.min(qty, Math.max(cap, 1)), batch: snapshotBatch(batch) }]
    })
  }, [])

  const setQuantity = useCallback((stockBatchId, qty) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((it) => it.stockBatchId !== stockBatchId)
      return prev.map((it) => {
        if (it.stockBatchId !== stockBatchId) return it
        const cap = typeof it.batch?.availableQuantity === 'number' ? it.batch.availableQuantity : 200
        return { ...it, quantity: Math.min(Math.max(qty, 1), Math.max(cap, 1)) }
      })
    })
  }, [])

  const removeItem = useCallback((stockBatchId) => {
    setItems((prev) => prev.filter((it) => it.stockBatchId !== stockBatchId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  // Reconcile local items with the latest server batches (call on each catalog reload).
  // - Drop items whose batch is missing or no longer "available".
  // - Refresh price/availability snapshot from server.
  const reconcile = useCallback((batches) => {
    if (!Array.isArray(batches)) return
    const byId = new Map(batches.map((b) => [b.stockBatchId, b]))
    setItems((prev) => prev
      .map((it) => {
        const fresh = byId.get(it.stockBatchId)
        if (!fresh) return null
        if (fresh.status !== 'available' || !fresh.available) return null
        const cap = typeof fresh.availableQuantity === 'number' ? fresh.availableQuantity : it.quantity
        return { ...it, quantity: Math.min(it.quantity, Math.max(cap, 1)), batch: snapshotBatch(fresh) }
      })
      .filter(Boolean))
  }, [])

  const count = useMemo(() => items.reduce((sum, it) => sum + it.quantity, 0), [items])
  const totalEuros = useMemo(
    () => items.reduce((sum, it) => sum + it.quantity * (it.batch?.priceEuros || 0), 0),
    [items]
  )
  const nurseryIds = useMemo(() => new Set(items.map((it) => it.batch?.nurseryId).filter(Boolean)), [items])

  return { items, addItem, setQuantity, removeItem, clear, reconcile, count, totalEuros, nurseryIds }
}
