import { useCallback, useEffect, useState } from 'react'
import { Package, ShoppingBag } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { ProductList } from './ProductList'
import { SaleList } from './SaleList'
import { ProductFormModal } from './ProductFormModal'
import { RestockModal } from './RestockModal'
import { SaleFormModal } from './SaleFormModal'
import { SHOP_ACCENT, type ShopProduct, type ShopSale, type ShopOrganization, type ShopContactOption } from './types'

type SubView = 'products' | 'sales'

export function ShopSection() {
  const [subView, setSubView] = useState<SubView>('sales')
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [sales, setSales] = useState<ShopSale[]>([])
  const [organizations, setOrganizations] = useState<ShopOrganization[]>([])
  const [contacts, setContacts] = useState<ShopContactOption[]>([])
  const [loading, setLoading] = useState(true)

  const [productFormModal, setProductFormModal] = useState<{ product: ShopProduct | null } | null>(null)
  const [restockModal, setRestockModal] = useState<ShopProduct | null>(null)
  const [saleFormModal, setSaleFormModal] = useState<{ sale: ShopSale | null } | null>(null)

  const loadProducts = useCallback(async () => {
    const data = await apiRequest('/api/v1/shop/products')
    setProducts(data.items)
  }, [])

  const loadSales = useCallback(async () => {
    const data = await apiRequest('/api/v1/shop/sales')
    setSales(data.items)
  }, [])

  const loadOrganizations = useCallback(async () => {
    try {
      const data = await apiRequest('/api/v1/organizations')
      setOrganizations(data.items || [])
    } catch {
      setOrganizations([])
    }
  }, [])

  const loadContacts = useCallback(async () => {
    try {
      const data = await apiRequest('/api/v1/lab/contacts')
      setContacts(
        (data.items || []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })),
      )
    } catch {
      setContacts([])
    }
  }, [])

  useEffect(() => {
    Promise.all([loadProducts(), loadSales(), loadOrganizations(), loadContacts()]).finally(() =>
      setLoading(false),
    )
  }, [loadProducts, loadSales, loadOrganizations, loadContacts])

  const handleSaveProduct = async (payload: Partial<ShopProduct>) => {
    const isEdit = productFormModal?.product?.id
    const url = isEdit ? `/api/v1/shop/products/${isEdit}` : '/api/v1/shop/products'
    const method = isEdit ? 'PATCH' : 'POST'
    await apiRequest(url, { method, body: JSON.stringify(payload) })
    setProductFormModal(null)
    await loadProducts()
  }

  const handleDeleteProduct = async (product: ShopProduct) => {
    const msg = product.stockQuantity > 0
      ? `Supprimer "${product.name}" ? (stock restant : ${product.stockQuantity})`
      : `Supprimer "${product.name}" ?`
    if (!window.confirm(msg)) return
    await apiRequest(`/api/v1/shop/products/${product.id}`, { method: 'DELETE' })
    await loadProducts()
  }

  const handleRestock = async (product: ShopProduct, delta: number) => {
    await apiRequest(`/api/v1/shop/products/${product.id}/restock`, {
      method: 'POST',
      body: JSON.stringify({ quantity: delta }),
    })
    setRestockModal(null)
    await loadProducts()
  }

  const handleSaveSale = async (payload: Record<string, unknown>) => {
    const isEdit = saleFormModal?.sale?.id
    const url = isEdit ? `/api/v1/shop/sales/${isEdit}` : '/api/v1/shop/sales'
    const method = isEdit ? 'PATCH' : 'POST'
    await apiRequest(url, { method, body: JSON.stringify(payload) })
    setSaleFormModal(null)
    await Promise.all([loadSales(), loadProducts()])
  }

  const handleDeleteSale = async (sale: ShopSale) => {
    if (!window.confirm(`Supprimer la vente du ${new Date(sale.soldAt).toLocaleDateString('fr-FR')} (${sale.totalAmount.toFixed(2)} €) ?`)) return
    await apiRequest(`/api/v1/shop/sales/${sale.id}`, { method: 'DELETE' })
    await Promise.all([loadSales(), loadProducts()])
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-stone-400">Chargement…</div>
  }

  const activeProducts = products.filter((p) => !p.archivedAt)
  const lowStockCount = activeProducts.filter((p) => p.stockQuantity <= 2).length

  return (
    <div className="space-y-6">
      {/* Hero header — identité comptoir */}
      <div
        className="relative overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white px-6 py-5"
      >
        <div
          className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-10 pointer-events-none"
          style={{ backgroundColor: SHOP_ACCENT }}
        />
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: SHOP_ACCENT }}>
              Comptoir · Shop
            </p>
            <h2 className="mt-1 text-2xl font-bold text-stone-900 tracking-tight">Ventes &amp; stock</h2>
            <p className="mt-1 text-sm text-stone-500">
              Chaque vente génère automatiquement une recette, le stock se met à jour en direct.
            </p>
          </div>
          <div className="flex gap-3 text-xs">
            <div className="bg-white border border-stone-200 rounded-xl px-4 py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Produits actifs</div>
              <div className="mt-0.5 font-mono text-xl font-semibold text-stone-900">{activeProducts.length}</div>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl px-4 py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Ventes</div>
              <div className="mt-0.5 font-mono text-xl font-semibold text-stone-900">{sales.length}</div>
            </div>
            {lowStockCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                <div className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold">Stock faible</div>
                <div className="mt-0.5 font-mono text-xl font-semibold text-amber-700">{lowStockCount}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 border-b border-stone-200">
        {([
          { id: 'sales' as const, label: 'Ventes', icon: ShoppingBag, count: sales.length },
          { id: 'products' as const, label: 'Produits', icon: Package, count: activeProducts.length },
        ]).map((tab) => {
          const Icon = tab.icon
          const active = subView === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setSubView(tab.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? 'text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
              style={active ? { borderColor: SHOP_ACCENT } : undefined}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-semibold rounded-full bg-stone-100 text-stone-600">
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {subView === 'sales' && (
        <SaleList
          sales={sales}
          onCreateSale={() => setSaleFormModal({ sale: null })}
          onEditSale={(sale) => setSaleFormModal({ sale })}
          onDeleteSale={handleDeleteSale}
        />
      )}

      {subView === 'products' && (
        <ProductList
          products={products}
          onCreateProduct={() => setProductFormModal({ product: null })}
          onEditProduct={(product) => setProductFormModal({ product })}
          onRestockProduct={(product) => setRestockModal(product)}
          onDeleteProduct={handleDeleteProduct}
        />
      )}

      {productFormModal && (
        <ProductFormModal
          product={productFormModal.product}
          onSave={handleSaveProduct}
          onCancel={() => setProductFormModal(null)}
        />
      )}

      {restockModal && (
        <RestockModal
          product={restockModal}
          onConfirm={(delta) => handleRestock(restockModal, delta)}
          onCancel={() => setRestockModal(null)}
        />
      )}

      {saleFormModal && (
        <SaleFormModal
          sale={saleFormModal.sale}
          products={activeProducts}
          organizations={organizations}
          contacts={contacts}
          onSave={handleSaveSale}
          onCancel={() => setSaleFormModal(null)}
        />
      )}
    </div>
  )
}
