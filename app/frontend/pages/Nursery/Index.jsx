import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { useShellNav } from '../../components/shell/ShellContext'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'
import { NurseryList } from '../../nursery/components/NurseryList'
import { NurseryForm } from '../../nursery/components/NurseryForm'

const ORDER_FLOW = ['new', 'processing', 'ready', 'picked-up', 'cancelled']

const NURSERY_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'stock', label: 'Stock' },
  { id: 'orders', label: 'Commandes' },
  { id: 'mother-plants', label: 'Plants-mères' },
  { id: 'catalog', label: 'Catalogue' },
  { id: 'transfers', label: 'Transferts' },
  { id: 'nurseries', label: 'Pépinières' },
]

export default function NurseryIndex() {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [view, setView] = useState('dashboard')
  useShellNav({ sections: NURSERY_SECTIONS, activeSection: view, onSectionChange: setView })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [nurseryForm, setNurseryForm] = useState(null) // null=closed, 'new' or nursery object
  const [filter, setFilter] = useState({ nursery_id: '', species_query: '' })
  const [payload, setPayload] = useState({
    nurseries: [],
    containers: [],
    stockBatches: [],
    motherPlants: [],
    orders: [],
    transfers: [],
    catalog: [],
    dashboard: { alerts: [], lowStockCount: 0, pendingOrdersCount: 0, pendingTransfersCount: 0, pendingValidationsCount: 0, recentOrders: [] },
  })

  const loadNursery = useCallback(async () => {
    const query = new URLSearchParams()
    if (filter.nursery_id) query.set('nursery_id', filter.nursery_id)
    const data = await apiRequest(`/api/v1/nursery${query.toString() ? `?${query.toString()}` : ''}`)
    setPayload(data)
  }, [filter.nursery_id])

  useEffect(() => {
    let mounted = true
    async function boot() {
      setLoading(true)
      try {
        await loadNursery()
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    boot()
    return () => {
      mounted = false
    }
  }, [loadNursery])

  const runMutation = useCallback(async (handler, options = { refresh: true }) => {
    setBusy(true)
    setError(null)
    try {
      await handler()
      if (options.refresh) await loadNursery()
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }, [loadNursery])

  const filteredCatalog = useMemo(() => payload.catalog.filter((item) => {
    if (filter.nursery_id && item.nurseryId !== filter.nursery_id) return false
    if (filter.species_query.trim() !== '') {
      const q = filter.species_query.trim().toLowerCase()
      if (!`${item.speciesName} ${item.varietyName || ''}`.toLowerCase().includes(q)) return false
    }
    return true
  }), [filter.nursery_id, filter.species_query, payload.catalog])

  const actions = useMemo(() => ({
    createStockBatch: () => {
      const nurseryId = window.prompt(`Nursery ID (${payload.nurseries.map((n) => n.id).join(', ')})`, payload.nurseries[0]?.id || '')
      const containerId = window.prompt(`Container ID (${payload.containers.map((c) => c.id).join(', ')})`, payload.containers[0]?.id || '')
      const speciesId = window.prompt('Species ID', 'sp-001')
      const speciesName = window.prompt('Species name', 'Malus domestica')
      const quantity = Number(window.prompt('Quantité', '50') || 0)
      const priceEuros = Number(window.prompt('Prix euros', '12') || 0)
      if (!nurseryId || !containerId || !speciesId || !speciesName || quantity <= 0) return
      runMutation(() => apiRequest('/api/v1/nursery/stock-batches', {
        method: 'POST',
        body: JSON.stringify({
          nursery_id: nurseryId,
          container_id: containerId,
          species_id: speciesId,
          species_name: speciesName,
          quantity,
          available_quantity: quantity,
          reserved_quantity: 0,
          growth_stage: 'young',
          price_euros: priceEuros,
          accepts_semos: false,
        }),
      }))
    },
    editStockBatch: (batchId) => {
      const current = payload.stockBatches.find((item) => item.id === batchId)
      if (!current) return
      const quantity = Number(window.prompt('Quantité', String(current.quantity || 0)) || current.quantity)
      const availableQuantity = Number(window.prompt('Disponible', String(current.availableQuantity || 0)) || current.availableQuantity)
      runMutation(() => apiRequest(`/api/v1/nursery/stock-batches/${batchId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          quantity,
          available_quantity: availableQuantity,
          reserved_quantity: current.reservedQuantity,
          nursery_id: current.nurseryId,
          container_id: current.containerId,
          species_id: current.speciesId,
          species_name: current.speciesName,
          growth_stage: current.growthStage,
          price_euros: current.priceEuros,
          accepts_semos: current.acceptsSemos,
          price_semos: current.priceSemos,
        }),
      }))
    },
    deleteStockBatch: (batchId) => {
      const batch = payload.stockBatches.find((item) => item.id === batchId)
      setDeleteConfirm({
        title: 'Supprimer ce lot ?',
        message: `Le lot « ${batch?.speciesName || ''} » sera supprimé définitivement.`,
        action: () => runMutation(() => apiRequest(`/api/v1/nursery/stock-batches/${batchId}`, { method: 'DELETE' })),
      })
    },
    createOrder: () => {
      const pickupNurseryId = window.prompt(`Pickup nursery ID (${payload.nurseries.map((n) => n.id).join(', ')})`, payload.nurseries[0]?.id || '')
      const customerName = window.prompt('Nom client', 'Client test')
      if (!pickupNurseryId || !customerName || payload.stockBatches.length === 0) return
      const batch = payload.stockBatches[0]
      runMutation(() => apiRequest('/api/v1/nursery/orders', {
        method: 'POST',
        body: JSON.stringify({
          pickup_nursery_id: pickupNurseryId,
          customer_name: customerName,
          customer_email: '',
          is_member: true,
          price_level: 'standard',
          lines: [
            {
              stock_batch_id: batch.id,
              quantity: 1,
              unit_price_euros: batch.priceEuros,
              unit_price_semos: batch.priceSemos,
              pay_in_semos: false,
            },
          ],
        }),
      }))
    },
    advanceOrder: (orderId, status) => {
      const endpoint = status === 'processing' ? 'process' : status === 'ready' ? 'ready' : status === 'picked-up' ? 'picked-up' : 'cancel'
      return runMutation(() => apiRequest(`/api/v1/nursery/orders/${orderId}/${endpoint}`, { method: 'PATCH' }))
    },
    validateMotherPlant: (id) => runMutation(() => apiRequest(`/api/v1/nursery/mother-plants/${id}/validate`, { method: 'PATCH', body: JSON.stringify({ validated_by: 'Nursery Manager' }) })),
    rejectMotherPlant: (id) => runMutation(() => apiRequest(`/api/v1/nursery/mother-plants/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ validated_by: 'Nursery Manager', notes: 'Non conforme' }) })),
    saveNursery: (data, editId) => {
      if (editId) {
        return runMutation(() => apiRequest(`/api/v1/nursery/nurseries/${editId}`, { method: 'PATCH', body: JSON.stringify(data) }))
      }
      return runMutation(() => apiRequest('/api/v1/nursery/nurseries', { method: 'POST', body: JSON.stringify(data) }))
    },
    deleteNursery: (id) => {
      const n = payload.nurseries.find((item) => item.id === id)
      setDeleteConfirm({
        title: 'Supprimer cette pépinière ?',
        message: `La pépinière « ${n?.name || ''} » sera supprimée définitivement.`,
        action: () => runMutation(() => apiRequest(`/api/v1/nursery/nurseries/${id}`, { method: 'DELETE' })),
      })
    },
  }), [payload, runMutation])

  if (loading) return <div className="flex items-center justify-center h-full p-8"><p className="text-stone-500">Chargement Nursery...</p></div>

  return (
    <div className="px-4 py-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {view === 'dashboard' && (
          <section className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded border border-stone-200 p-3 text-sm">Stock bas: {payload.dashboard.lowStockCount}</div>
              <div className="rounded border border-stone-200 p-3 text-sm">Cmd en attente: {payload.dashboard.pendingOrdersCount}</div>
              <div className="rounded border border-stone-200 p-3 text-sm">Transferts: {payload.dashboard.pendingTransfersCount}</div>
              <div className="rounded border border-stone-200 p-3 text-sm">Validations: {payload.dashboard.pendingValidationsCount}</div>
            </div>
            {payload.dashboard.alerts.length === 0 ? <p className="text-sm text-stone-500">Aucune alerte.</p> : payload.dashboard.alerts.map((alert) => (
              <div key={alert.id} className="rounded border border-stone-200 p-2 text-sm">
                <span className="font-medium">{alert.title}</span> · {alert.description}
              </div>
            ))}
          </section>
        )}

        {view === 'stock' && (
          <section className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button className="rounded bg-[#AFBD00] px-3 py-2 text-sm" onClick={actions.createStockBatch}>Ajouter un lot</button>
              <select className="rounded border border-stone-300 px-3 py-2 text-sm" value={filter.nursery_id} onChange={(event) => setFilter((prev) => ({ ...prev, nursery_id: event.target.value }))}>
                <option value="">Toutes pépinières</option>
                {payload.nurseries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            {payload.stockBatches.length === 0 ? <p className="text-sm text-stone-500">Aucun lot en stock. Ajouter un lot.</p> : payload.stockBatches.map((batch) => (
              <div key={batch.id} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between">
                <span>{batch.speciesName} {batch.varietyName || ''} · qté {batch.quantity} · dispo {batch.availableQuantity} · rés. {batch.reservedQuantity}</span>
                <div className="flex gap-2">
                  <button className="text-stone-700" onClick={() => actions.editStockBatch(batch.id)}>Modifier</button>
                  <button className="text-red-600" onClick={() => actions.deleteStockBatch(batch.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </section>
        )}

        {view === 'orders' && (
          <section className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
            <button className="rounded bg-[#AFBD00] px-3 py-2 text-sm" onClick={actions.createOrder}>Nouvelle commande</button>
            {payload.orders.length === 0 ? <p className="text-sm text-stone-500">Aucune commande.</p> : payload.orders.map((order) => (
              <div key={order.id} className="rounded border border-stone-200 p-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>{order.orderNumber} · {order.customerName} · {order.status} · {order.totalEuros}€</span>
                  <div className="flex gap-1">
                    {ORDER_FLOW.map((status) => (
                      <button key={status} className="rounded border border-stone-300 px-2 py-1 text-xs" onClick={() => actions.advanceOrder(order.id, status)}>{status}</button>
                    ))}
                  </div>
                </div>
                <div className="mt-1 text-xs text-stone-600">{order.lines.length} ligne(s) · pickup {order.pickupNurseryName}</div>
              </div>
            ))}
          </section>
        )}

        {view === 'mother-plants' && (
          <section className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
            {payload.motherPlants.length === 0 ? (
              <p className="text-sm text-stone-500">Aucun plant-mère enregistré. Les plants-mères servent de référence de multiplication.</p>
            ) : payload.motherPlants.map((item) => (
              <div key={item.id} className="rounded border border-stone-200 p-2 text-sm flex items-center justify-between">
                <span>{item.speciesName} · {item.placeName} · {item.status}</span>
                <div className="flex gap-2">
                  {item.status === 'pending' && <button className="text-emerald-700" onClick={() => actions.validateMotherPlant(item.id)}>Valider</button>}
                  {item.status === 'pending' && <button className="text-red-600" onClick={() => actions.rejectMotherPlant(item.id)}>Rejeter</button>}
                </div>
              </div>
            ))}
          </section>
        )}

        {view === 'catalog' && (
          <section className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
            <div className="flex gap-2">
              <input className="w-full rounded border border-stone-300 px-3 py-2 text-sm" placeholder="Rechercher espèce..." value={filter.species_query} onChange={(event) => setFilter((prev) => ({ ...prev, species_query: event.target.value }))} />
            </div>
            {filteredCatalog.length === 0 ? <p className="text-sm text-stone-500">Aucun résultat. Ajuster les filtres.</p> : filteredCatalog.map((item) => (
              <div key={`${item.stockBatchId}-${item.nurseryId}`} className="rounded border border-stone-200 p-2 text-sm">
                <span>{item.speciesName} {item.varietyName || ''} · {item.nurseryName} ({item.nurseryIntegration}) · {item.containerName} · {item.nurseryIntegration === 'manual' ? 'available' : `${item.availableQuantity} dispo`} · {item.priceEuros}€</span>
              </div>
            ))}
          </section>
        )}

        {view === 'transfers' && (
          <section className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
            {payload.transfers.length === 0 ? <p className="text-sm text-stone-500">Aucun transfert.</p> : payload.transfers.map((item) => (
              <div key={item.id} className="rounded border border-stone-200 p-2 text-sm">
                <span>{item.orderNumber} · {item.status} · {item.totalDistanceKm}km · {item.scheduledDate}</span>
              </div>
            ))}
          </section>
        )}

        {view === 'nurseries' && (
          <NurseryList
            nurseries={payload.nurseries}
            onCreate={() => setNurseryForm('new')}
            onEdit={(id) => setNurseryForm(payload.nurseries.find((n) => n.id === id) || 'new')}
            onDelete={(id) => actions.deleteNursery(id)}
          />
        )}

        {nurseryForm && (
          <NurseryForm
            nursery={nurseryForm === 'new' ? null : nurseryForm}
            onCancel={() => setNurseryForm(null)}
            onSave={async (data) => {
              const editId = nurseryForm !== 'new' ? nurseryForm.id : null
              const ok = await actions.saveNursery(data, editId)
              if (ok) setNurseryForm(null)
            }}
          />
        )}

        {(busy || error || notice) && (
          <div className="fixed bottom-4 right-4 z-40 space-y-2">
            {busy && <div className="rounded bg-stone-900 px-3 py-2 text-xs text-white">Synchronisation...</div>}
            {error && <div className="rounded bg-red-600 px-3 py-2 text-sm text-white">{error}</div>}
            {notice && (
              <div className="rounded bg-emerald-600 px-3 py-2 text-sm text-white">
                {notice}
                <button className="ml-2 underline" onClick={() => setNotice(null)}>Fermer</button>
              </div>
            )}
          </div>
        )}

        {deleteConfirm && (
          <ConfirmDeleteModal
            title={deleteConfirm.title}
            message={deleteConfirm.message}
            onConfirm={() => {
              deleteConfirm.action()
              setDeleteConfirm(null)
            }}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </div>
    </div>
  )
}
