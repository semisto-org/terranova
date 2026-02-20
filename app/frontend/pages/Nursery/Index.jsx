import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { useShellNav } from '../../components/shell/ShellContext'
import { NurseryDashboard } from '../../nursery/components/NurseryDashboard'
import { StockManagement } from '../../nursery/components/StockManagement'
import { OrderList } from '../../nursery/components/OrderList'
import { OrderDetail } from '../../nursery/components/OrderDetail'
import { MotherPlantList } from '../../nursery/components/MotherPlantList'
import { Catalog } from '../../nursery/components/Catalog'
import { TransferManagement } from '../../nursery/components/TransferManagement'
import { NurseryList } from '../../nursery/components/NurseryList'
import { NurseryForm } from '../../nursery/components/NurseryForm'

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
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [nurseryForm, setNurseryForm] = useState(null)
  useShellNav({ sections: NURSERY_SECTIONS, activeSection: view, onSectionChange: (v) => { setView(v); setSelectedOrderId(null) } })

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
    const data = await apiRequest('/api/v1/nursery')
    setPayload(data)
  }, [])

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
    return () => { mounted = false }
  }, [loadNursery])

  const runMutation = useCallback(async (handler) => {
    setBusy(true)
    setError(null)
    try {
      await handler()
      await loadNursery()
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }, [loadNursery])

  // ── Stock actions ──
  const handleSaveBatch = useCallback((data, editId) => {
    const body = JSON.stringify({
      nursery_id: data.nurseryId,
      container_id: data.containerId,
      species_id: data.speciesId || `sp-${Date.now()}`,
      species_name: data.speciesName,
      variety_id: data.varietyId,
      variety_name: data.varietyName,
      quantity: data.quantity,
      available_quantity: data.availableQuantity,
      reserved_quantity: data.reservedQuantity,
      growth_stage: data.growthStage,
      sowing_date: data.sowingDate,
      origin: data.origin,
      price_euros: data.priceEuros,
      accepts_semos: data.acceptsSemos,
      price_semos: data.priceSemos,
      notes: data.notes,
    })
    if (editId) {
      return runMutation(() => apiRequest(`/api/v1/nursery/stock-batches/${editId}`, { method: 'PATCH', body }))
    }
    return runMutation(() => apiRequest('/api/v1/nursery/stock-batches', { method: 'POST', body }))
  }, [runMutation])

  const handleDeleteBatch = useCallback((id) => {
    if (!confirm('Supprimer ce lot ?')) return
    runMutation(() => apiRequest(`/api/v1/nursery/stock-batches/${id}`, { method: 'DELETE' }))
  }, [runMutation])

  // ── Order actions ──
  const handleAdvanceOrder = useCallback((orderId, action) => {
    const endpoint = action === 'process' ? 'process' : action === 'ready' ? 'ready' : action === 'picked-up' ? 'picked-up' : 'cancel'
    return runMutation(() => apiRequest(`/api/v1/nursery/orders/${orderId}/${endpoint}`, { method: 'PATCH' }))
  }, [runMutation])

  // ── Mother plant actions ──
  const handleValidateMotherPlant = useCallback((id) => {
    runMutation(() => apiRequest(`/api/v1/nursery/mother-plants/${id}/validate`, { method: 'PATCH', body: JSON.stringify({ validated_by: 'Nursery Manager' }) }))
  }, [runMutation])

  const handleRejectMotherPlant = useCallback((id) => {
    runMutation(() => apiRequest(`/api/v1/nursery/mother-plants/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ validated_by: 'Nursery Manager', notes: 'Non conforme' }) }))
  }, [runMutation])

  // ── Nursery CRUD ──
  const handleSaveNursery = useCallback(async (data) => {
    const editId = nurseryForm && nurseryForm !== 'new' ? nurseryForm.id : null
    if (editId) {
      const ok = await runMutation(() => apiRequest(`/api/v1/nursery/nurseries/${editId}`, { method: 'PATCH', body: JSON.stringify(data) }))
      if (ok) setNurseryForm(null)
    } else {
      const ok = await runMutation(() => apiRequest('/api/v1/nursery/nurseries', { method: 'POST', body: JSON.stringify(data) }))
      if (ok) setNurseryForm(null)
    }
  }, [nurseryForm, runMutation])

  const handleDeleteNursery = useCallback((id) => {
    const n = payload.nurseries.find((item) => item.id === id)
    if (!confirm(`Supprimer la pépinière « ${n?.name || ''} » ?`)) return
    runMutation(() => apiRequest(`/api/v1/nursery/nurseries/${id}`, { method: 'DELETE' }))
  }, [payload.nurseries, runMutation])

  // ── Order detail ──
  const selectedOrder = selectedOrderId ? payload.orders.find((o) => o.id === selectedOrderId) : null

  if (loading) return <div className="flex items-center justify-center h-full p-8"><p className="text-stone-500">Chargement Nursery...</p></div>

  return (
    <div className="px-4 py-4">
      <div className="max-w-7xl mx-auto">
        {view === 'dashboard' && (
          <NurseryDashboard
            alerts={payload.dashboard.alerts}
            lowStockCount={payload.dashboard.lowStockCount}
            pendingOrdersCount={payload.dashboard.pendingOrdersCount}
            pendingTransfersCount={payload.dashboard.pendingTransfersCount}
            pendingValidationsCount={payload.dashboard.pendingValidationsCount}
            recentOrders={payload.dashboard.recentOrders}
            onViewStock={() => setView('stock')}
            onViewOrders={() => setView('orders')}
            onViewTransfers={() => setView('transfers')}
            onViewValidations={() => setView('mother-plants')}
          />
        )}

        {view === 'stock' && (
          <StockManagement
            batches={payload.stockBatches}
            nurseries={payload.nurseries}
            containers={payload.containers}
            onSaveBatch={handleSaveBatch}
            onDeleteBatch={handleDeleteBatch}
          />
        )}

        {view === 'orders' && !selectedOrder && (
          <OrderList
            orders={payload.orders}
            nurseries={payload.nurseries}
            onView={(id) => setSelectedOrderId(id)}
            onProcess={(id) => handleAdvanceOrder(id, 'process')}
            onMarkReady={(id) => handleAdvanceOrder(id, 'ready')}
            onMarkPickedUp={(id) => handleAdvanceOrder(id, 'picked-up')}
            onCancel={(id) => handleAdvanceOrder(id, 'cancel')}
          />
        )}

        {view === 'orders' && selectedOrder && (
          <OrderDetail
            order={selectedOrder}
            onProcess={() => handleAdvanceOrder(selectedOrder.id, 'process')}
            onMarkReady={() => handleAdvanceOrder(selectedOrder.id, 'ready')}
            onMarkPickedUp={() => handleAdvanceOrder(selectedOrder.id, 'picked-up')}
            onCancel={() => handleAdvanceOrder(selectedOrder.id, 'cancel')}
            onBack={() => setSelectedOrderId(null)}
          />
        )}

        {view === 'mother-plants' && (
          <MotherPlantList
            motherPlants={payload.motherPlants}
            onValidate={handleValidateMotherPlant}
            onReject={handleRejectMotherPlant}
          />
        )}

        {view === 'catalog' && (
          <Catalog
            nurseries={payload.nurseries}
            batches={payload.stockBatches}
            containers={payload.containers}
          />
        )}

        {view === 'transfers' && (
          <TransferManagement
            transfers={payload.transfers}
            nurseries={payload.nurseries}
          />
        )}

        {view === 'nurseries' && (
          <NurseryList
            nurseries={payload.nurseries}
            onCreate={() => setNurseryForm('new')}
            onEdit={(id) => setNurseryForm(payload.nurseries.find((n) => n.id === id) || 'new')}
            onDelete={handleDeleteNursery}
          />
        )}

        {nurseryForm && (
          <NurseryForm
            nursery={nurseryForm === 'new' ? null : nurseryForm}
            onCancel={() => setNurseryForm(null)}
            onSave={handleSaveNursery}
          />
        )}

        {(busy || error || notice) && (
          <div className="fixed bottom-4 right-4 z-40 space-y-2">
            {busy && <div className="rounded bg-stone-900 px-3 py-2 text-xs text-white">Synchronisation...</div>}
            {error && (
              <div className="rounded bg-red-600 px-3 py-2 text-sm text-white cursor-pointer" onClick={() => setError(null)}>
                {error} <span className="underline ml-2">Fermer</span>
              </div>
            )}
            {notice && (
              <div className="rounded bg-emerald-600 px-3 py-2 text-sm text-white">
                {notice}
                <button className="ml-2 underline" onClick={() => setNotice(null)}>Fermer</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
