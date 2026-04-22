import { Archive, Edit, Package, Plus, Trash2, TrendingUp } from 'lucide-react'
import { fmtMoney, VAT_RATE_OPTIONS } from './helpers'
import { SHOP_ACCENT, type ShopProduct } from './types'

interface ProductListProps {
  products: ShopProduct[]
  onCreateProduct: () => void
  onEditProduct: (product: ShopProduct) => void
  onRestockProduct: (product: ShopProduct) => void
  onDeleteProduct: (product: ShopProduct) => void
}

const vatLabel = (rate: string) =>
  VAT_RATE_OPTIONS.find((o) => o.value === rate)?.label || rate

export function ProductList({ products, onCreateProduct, onEditProduct, onRestockProduct, onDeleteProduct }: ProductListProps) {
  const active = products.filter((p) => !p.archivedAt)
  const archived = products.filter((p) => p.archivedAt)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-stone-700 inline-flex items-center gap-2">
          <Package className="w-4 h-4 text-stone-400" />
          Catalogue
        </h3>
        <button
          onClick={onCreateProduct}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: SHOP_ACCENT }}
        >
          <Plus className="w-4 h-4" />
          Nouveau produit
        </button>
      </div>

      {active.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-xl border border-dashed border-stone-200">
          <Package className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="mt-2 text-stone-500 font-medium">Aucun produit dans le catalogue</p>
          <p className="text-xs text-stone-400 mt-0.5">
            Créez votre premier produit pour commencer à saisir des ventes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {active.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={() => onEditProduct(p)}
              onRestock={() => onRestockProduct(p)}
              onDelete={() => onDeleteProduct(p)}
            />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <details className="bg-white rounded-xl border border-stone-200">
          <summary className="px-4 py-3 text-sm font-medium text-stone-500 cursor-pointer inline-flex items-center gap-2">
            <Archive className="w-3.5 h-3.5" />
            Produits archivés
            <span className="text-xs text-stone-400">({archived.length})</span>
          </summary>
          <ul className="divide-y divide-stone-100">
            {archived.map((p) => (
              <li key={p.id} className="px-4 py-2 flex items-center justify-between text-sm">
                <span className="text-stone-700">{p.name}</span>
                <span className="text-xs text-stone-400">archivé</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function ProductCard({
  product,
  onEdit,
  onRestock,
  onDelete,
}: {
  product: ShopProduct
  onEdit: () => void
  onRestock: () => void
  onDelete: () => void
}) {
  const lowStock = product.stockQuantity <= 2
  const outOfStock = product.stockQuantity === 0
  const stockBg = outOfStock
    ? 'bg-red-50 border-red-200 text-red-700'
    : lowStock
      ? 'bg-amber-50 border-amber-200 text-amber-700'
      : 'bg-emerald-50 border-emerald-200 text-emerald-700'

  return (
    <article className="group bg-white rounded-xl border border-stone-200 hover:shadow-sm hover:border-stone-300 transition-all overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="text-[15px] font-semibold text-stone-900 truncate">{product.name}</h4>
            {product.sku && (
              <p className="text-[10px] font-mono text-stone-400 tracking-wider uppercase mt-0.5">{product.sku}</p>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={onEdit} className="p-1.5 text-stone-400 hover:text-stone-700 rounded">
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="p-1.5 text-stone-400 hover:text-red-600 rounded">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {product.description && (
          <p className="mt-1.5 text-xs text-stone-500 line-clamp-2">{product.description}</p>
        )}

        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Prix TTC</div>
            <div className="font-mono text-lg font-semibold text-stone-900">{fmtMoney(product.unitPrice)}</div>
            <div className="text-[10px] text-stone-400 mt-0.5">TVA {vatLabel(product.vatRate)}</div>
          </div>

          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${stockBg}`}>
            <span className="font-mono">{product.stockQuantity}</span>
            <span className="font-normal text-[10px] uppercase tracking-wider">en stock</span>
          </div>
        </div>

        <button
          onClick={onRestock}
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 hover:text-stone-900 transition-colors"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Ajuster le stock
        </button>
      </div>
    </article>
  )
}
