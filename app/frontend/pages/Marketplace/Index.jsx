import React, { useState, useEffect, useCallback, useRef } from 'react'
import { usePage } from '@inertiajs/react'
import { useShellNav } from '../../components/shell/ShellContext'
import { useUrlState } from '@/hooks/useUrlState'
import { apiRequest } from '../../lib/api'
import {
  Store, Plus, Search, Edit3, Trash2, ChevronLeft, X,
  Pause, Play, Package, Briefcase, Mail, ImagePlus,
  ArrowUpRight, Leaf, Sprout
} from 'lucide-react'

const ACCENT = '#D946EF'
const ACCENT_DARK = '#a21caf'
const WARM = '#fdf4ed'
const WARM_DEEP = '#faecd8'

// Semos token icon — a little seed/coin
function SemosIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill={ACCENT} opacity="0.15" stroke={ACCENT} strokeWidth="1.5" />
      <text x="10" y="14.5" textAnchor="middle" fontSize="11" fontWeight="700" fill={ACCENT} fontFamily="var(--font-heading)">S</text>
    </svg>
  )
}

// Stagger delay helper
function staggerDelay(index, base = 60) {
  return { animationDelay: `${index * base}ms` }
}

// Format relative date in French
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `il y a ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `il y a ${days}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ─── Listing Card ───
function ListingCard({ listing, onClick, index = 0 }) {
  const thumb = listing.images?.[0]?.url
  const isService = listing.category === 'service'

  return (
    <button
      onClick={() => onClick(listing)}
      className="mkt-card-enter group text-left w-full"
      style={staggerDelay(index)}
    >
      <div className="relative bg-white rounded-2xl overflow-hidden border border-stone-200/60 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-fuchsia-500/5 hover:-translate-y-1 hover:border-stone-300">
        {/* Image */}
        <div className="mkt-card-image relative aspect-[3/2] overflow-hidden bg-stone-100">
          {thumb ? (
            <img src={thumb} alt={listing.title} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${WARM} 0%, ${WARM_DEEP} 100%)` }}>
              {isService ? (
                <Sprout className="w-12 h-12 text-fuchsia-300" strokeWidth={1.5} />
              ) : (
                <Leaf className="w-12 h-12 text-fuchsia-300" strokeWidth={1.5} />
              )}
            </div>
          )}

          {/* Category pill — overlaid on image */}
          <span className={`absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full backdrop-blur-md ${
            isService
              ? 'bg-amber-500/80 text-white'
              : 'bg-white/80 text-stone-700'
          }`}>
            {isService ? 'Service' : 'Produit'}
          </span>

          {/* Hover arrow */}
          <span className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <ArrowUpRight className="w-4 h-4 text-stone-700" />
          </span>
        </div>

        {/* Content */}
        <div className="p-4 pb-5">
          <h3 className="text-[15px] font-semibold text-stone-900 leading-snug line-clamp-2 mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
            {listing.title}
          </h3>

          <div className="flex items-end justify-between gap-3">
            {/* Price */}
            <div className="mkt-price-hover flex items-center gap-1.5">
              <SemosIcon size={18} />
              <span className="mkt-price-value text-lg font-bold tracking-tight" style={{ color: ACCENT_DARK }}>
                {listing.priceSemos}
              </span>
            </div>

            {/* Seller */}
            <div className="flex items-center gap-1.5 min-w-0">
              {listing.seller.avatar ? (
                <img src={listing.seller.avatar} alt="" className="w-6 h-6 rounded-full object-cover ring-2 ring-white" />
              ) : (
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }}>
                  {listing.seller.firstName?.[0]}{listing.seller.lastName?.[0]}
                </span>
              )}
              <span className="text-xs text-stone-500 truncate">{listing.seller.firstName}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

// ─── Skeleton Cards ───
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[0,1,2,3,4,5].map(i => (
        <div key={i} className="mkt-card-enter" style={staggerDelay(i, 80)}>
          <div className="rounded-2xl overflow-hidden border border-stone-100">
            <div className="mkt-skeleton aspect-[3/2]" />
            <div className="p-4 space-y-3">
              <div className="mkt-skeleton h-4 w-3/4" />
              <div className="mkt-skeleton h-3 w-1/2" />
              <div className="flex justify-between">
                <div className="mkt-skeleton h-5 w-16" />
                <div className="mkt-skeleton h-6 w-6 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Listing Detail ───
function ListingDetail({ listingId, onBack }) {
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    setLoading(true)
    setActiveImage(0)
    apiRequest(`/api/v1/marketplace/${listingId}`).then(data => {
      if (data) setListing(data.listing)
      setLoading(false)
    })
  }, [listingId])

  if (loading) return (
    <div className="mkt-detail-enter max-w-4xl mx-auto space-y-4">
      <div className="mkt-skeleton h-8 w-24" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 mkt-skeleton aspect-square rounded-2xl" />
        <div className="lg:col-span-2 space-y-4">
          <div className="mkt-skeleton h-6 w-20" />
          <div className="mkt-skeleton h-8 w-full" />
          <div className="mkt-skeleton h-10 w-32" />
          <div className="mkt-skeleton h-24 w-full" />
        </div>
      </div>
    </div>
  )

  if (!listing) return <div className="text-center py-20 text-stone-500">Annonce introuvable</div>

  const images = listing.images || []
  const isService = listing.category === 'service'

  return (
    <div className="mkt-detail-enter max-w-5xl mx-auto space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors group">
        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Retour aux annonces
      </button>

      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* Gallery — spans 3 cols */}
          <div className="lg:col-span-3 relative" style={{ background: `linear-gradient(145deg, ${WARM} 0%, #f5f0eb 100%)` }}>
            <div className="relative">
              {/* Main image */}
              <div className="aspect-[4/3] overflow-hidden">
                {images.length > 0 ? (
                  <img
                    src={images[activeImage]?.url}
                    alt={listing.title}
                    className="w-full h-full object-contain p-6 transition-opacity duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {isService ? (
                      <Sprout className="w-24 h-24 text-fuchsia-200" strokeWidth={1} />
                    ) : (
                      <Leaf className="w-24 h-24 text-fuchsia-200" strokeWidth={1} />
                    )}
                  </div>
                )}
              </div>

              {/* Grain overlay */}
              <div className="mkt-grain absolute inset-0 pointer-events-none opacity-[0.03]" />
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 px-6 pb-5 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 transition-all duration-200 ${
                      i === activeImage
                        ? 'ring-2 ring-fuchsia-400 ring-offset-2 scale-105'
                        : 'opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details — spans 2 cols */}
          <div className="lg:col-span-2 p-7 lg:p-8 flex flex-col border-l border-stone-100">
            {/* Category */}
            <span className={`self-start text-[10px] font-semibold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full mb-5 ${
              isService ? 'bg-amber-100 text-amber-700' : 'bg-fuchsia-50 text-fuchsia-700'
            }`}>
              {isService ? 'Service' : 'Produit'}
            </span>

            {/* Title */}
            <h1 className="text-2xl font-semibold text-stone-900 leading-tight mb-5" style={{ fontFamily: 'var(--font-heading)' }}>
              {listing.title}
            </h1>

            {/* Price block */}
            <div className="flex items-center gap-3 mb-7 pb-7 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <SemosIcon size={22} />
                <span className="text-3xl font-bold tracking-tight" style={{ color: ACCENT_DARK }}>{listing.priceSemos}</span>
              </div>
              <span className="text-sm text-stone-400 font-medium">Semos</span>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="mb-7 flex-1">
                <p className="text-[13px] text-stone-600 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* Seller section */}
            <div className="mt-auto pt-6 border-t border-stone-100">
              <div className="flex items-center gap-3 mb-5">
                {listing.seller.avatar ? (
                  <img src={listing.seller.avatar} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-stone-100" />
                ) : (
                  <span className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }}>
                    {listing.seller.firstName?.[0]}{listing.seller.lastName?.[0]}
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-stone-900">{listing.seller.firstName} {listing.seller.lastName}</p>
                  <p className="text-xs text-stone-400">Membre Semisto</p>
                </div>
              </div>

              <a
                href={`mailto:${listing.seller.email}`}
                className="group/btn w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-fuchsia-500/20 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }}
              >
                <Mail className="w-4 h-4" />
                Contacter — {listing.seller.email}
                <ArrowUpRight className="w-3.5 h-3.5 opacity-50 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </a>
              <p className="text-[11px] text-stone-400 text-center mt-2.5">Les transactions Semos seront bientot disponibles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Listing Form ───
function ListingForm({ listing, onSave, onCancel }) {
  const [title, setTitle] = useState(listing?.title || '')
  const [description, setDescription] = useState(listing?.description || '')
  const [priceSemos, setPriceSemos] = useState(listing?.priceSemos || '')
  const [category, setCategory] = useState(listing?.category || 'product')
  const [files, setFiles] = useState([])
  const [existingImages, setExistingImages] = useState(listing?.images || [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('price_semos', priceSemos)
      formData.append('category', category)
      files.forEach(f => formData.append('images[]', f))

      const url = listing ? `/api/v1/marketplace/${listing.id}` : '/api/v1/marketplace'
      const method = listing ? 'PATCH' : 'POST'

      const data = await apiRequest(url, { method, body: formData })
      if (data) onSave(data.listing)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  const removeExistingImage = async (imageId) => {
    await apiRequest(`/api/v1/marketplace/${listing.id}/images/${imageId}`, { method: 'DELETE' })
    setExistingImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (dropped.length) setFiles(prev => [...prev, ...dropped])
  }

  return (
    <div className="mkt-detail-enter max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-7 py-5 border-b border-stone-100 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${WARM} 0%, white 100%)` }}>
          <div>
            <h2 className="text-lg font-semibold text-stone-900" style={{ fontFamily: 'var(--font-heading)' }}>
              {listing ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {listing ? 'Mettez a jour les informations' : 'Proposez un produit ou service a la communaute'}
            </p>
          </div>
          <button type="button" onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-7 space-y-6">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200/60 rounded-xl px-4 py-3">{error}</div>
          )}

          {/* Category toggle */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Type</label>
            <div className="flex gap-2">
              {[
                { value: 'product', label: 'Produit', icon: Package },
                { value: 'service', label: 'Service', icon: Briefcase },
              ].map(opt => {
                const Icon = opt.icon
                const active = category === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                      active
                        ? 'border-fuchsia-400 bg-fuchsia-50 text-fuchsia-700 shadow-sm shadow-fuchsia-500/10'
                        : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Titre</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder={category === 'service' ? 'ex: Taille de fruitiers — 2h sur site' : 'ex: Graines de tomate ancienne — lot de 50'}
              className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-400 transition-shadow placeholder:text-stone-300"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Decrivez votre offre, ses conditions, sa disponibilite..."
              className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-400 transition-shadow resize-none placeholder:text-stone-300"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Prix</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <SemosIcon size={18} />
              </div>
              <input
                type="number"
                value={priceSemos}
                onChange={e => setPriceSemos(e.target.value)}
                required
                min={1}
                placeholder="0"
                className="w-full pl-10 pr-20 py-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-400 transition-shadow"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">Semos</span>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Photos</label>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {existingImages.map(img => (
                  <div key={img.id} className="relative group">
                    <img src={img.url} alt="" className="w-20 h-20 rounded-xl object-cover border border-stone-200" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New images preview */}
            {files.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {files.map((f, i) => (
                  <div key={i} className="relative group mkt-card-enter" style={staggerDelay(i, 50)}>
                    <img src={URL.createObjectURL(f)} alt="" className="w-20 h-20 rounded-xl object-cover border border-fuchsia-200" />
                    <button
                      type="button"
                      onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Drop zone */}
            <label
              className={`flex flex-col items-center gap-2 px-4 py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                dragOver
                  ? 'border-fuchsia-400 bg-fuchsia-50/50 scale-[1.01]'
                  : 'border-stone-200 hover:border-fuchsia-300 hover:bg-fuchsia-50/20'
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <ImagePlus className="w-6 h-6 text-stone-300" />
              <span className="text-xs text-stone-400">Glissez vos images ici ou cliquez pour parcourir</span>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*"
                onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-fuchsia-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }}
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement...</>
            ) : listing ? (
              'Mettre a jour'
            ) : (
              <><Plus className="w-4 h-4" /> Publier</>
            )}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2.5 text-sm text-stone-500 hover:text-stone-700 transition-colors">
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── My Listings ───
function MyListings({ onSelect, onNew }) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMine = useCallback(async () => {
    setLoading(true)
    const data = await apiRequest('/api/v1/marketplace/mine')
    if (data) setListings(data.listings || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchMine() }, [fetchMine])

  const toggleStatus = async (listing) => {
    const newStatus = listing.status === 'active' ? 'paused' : 'active'
    await apiRequest(`/api/v1/marketplace/${listing.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    })
    fetchMine()
  }

  const deleteListing = async (listing) => {
    if (!confirm('Supprimer cette annonce ?')) return
    await apiRequest(`/api/v1/marketplace/${listing.id}`, { method: 'DELETE' })
    fetchMine()
  }

  if (loading) return <SkeletonGrid />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-400">
          {listings.length} annonce{listings.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-fuchsia-500/20 hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }}
        >
          <Plus className="w-4 h-4" /> Nouvelle annonce
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="mkt-card-enter rounded-2xl border-2 border-dashed border-stone-200 p-16 text-center" style={{ background: `linear-gradient(135deg, ${WARM} 0%, white 100%)` }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ACCENT}15 0%, ${ACCENT}05 100%)` }}>
            <Store className="w-8 h-8 text-fuchsia-300" />
          </div>
          <p className="text-stone-900 font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Pas encore d'annonce</p>
          <p className="text-sm text-stone-400 mb-5">Proposez vos produits et services a la communaute Semisto</p>
          <button
            onClick={onNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-fuchsia-500/20 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }}
          >
            <Plus className="w-4 h-4" /> Creer ma premiere annonce
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((listing, i) => (
            <div
              key={listing.id}
              className="mkt-card-enter group bg-white rounded-xl border border-stone-200/60 p-4 flex items-center gap-4 transition-all duration-200 hover:shadow-md hover:shadow-stone-200/50 hover:border-stone-300"
              style={staggerDelay(i)}
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                {listing.images?.[0]?.url ? (
                  <img src={listing.images[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${WARM} 0%, ${WARM_DEEP} 100%)` }}>
                    {listing.category === 'product' ? <Leaf className="w-6 h-6 text-fuchsia-300" strokeWidth={1.5} /> : <Sprout className="w-6 h-6 text-fuchsia-300" strokeWidth={1.5} />}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-stone-900 truncate" style={{ fontFamily: 'var(--font-heading)' }}>{listing.title}</h3>
                  <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    listing.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-stone-100 text-stone-500'
                  }`}>
                    {listing.status === 'active' ? 'Active' : 'En pause'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-medium px-1.5 py-0.5 rounded-md ${listing.category === 'product' ? 'bg-fuchsia-50 text-fuchsia-600' : 'bg-amber-50 text-amber-600'}`}>
                    {listing.category === 'product' ? 'Produit' : 'Service'}
                  </span>
                  <span className="flex items-center gap-1 font-bold" style={{ color: ACCENT_DARK }}>
                    <SemosIcon size={12} /> {listing.priceSemos}
                  </span>
                  <span className="text-stone-400">{timeAgo(listing.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleStatus(listing)}
                  className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
                  title={listing.status === 'active' ? 'Mettre en pause' : 'Reactiver'}
                >
                  {listing.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => onSelect(listing)}
                  className="p-2 text-stone-400 hover:text-fuchsia-600 rounded-lg hover:bg-fuchsia-50 transition-colors"
                  title="Modifier"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteListing(listing)}
                  className="p-2 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Explorer (Browse All) ───
function Explorer({ onSelect }) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const fetchListings = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    const data = await apiRequest(`/api/v1/marketplace?${params}`)
    if (data) setListings(data.listings || [])
    setLoading(false)
  }, [search, category])

  useEffect(() => { fetchListings() }, [fetchListings])

  const counts = {
    all: listings.length,
    product: listings.filter(l => l.category === 'product').length,
    service: listings.filter(l => l.category === 'service').length,
  }

  return (
    <div className="space-y-6">
      {/* Search + filters bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
          <input
            type="text"
            placeholder="Rechercher dans la marketplace..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-400 transition-shadow placeholder:text-stone-300"
          />
        </div>
        <div className="flex gap-1.5 bg-stone-100/80 rounded-xl p-1">
          {[
            { value: '', label: 'Tous' },
            { value: 'product', label: 'Produits' },
            { value: 'service', label: 'Services' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setCategory(opt.value)}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                category === opt.value
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : listings.length === 0 ? (
        <div className="mkt-card-enter rounded-2xl border-2 border-dashed border-stone-200 p-16 text-center" style={{ background: `linear-gradient(135deg, ${WARM} 0%, white 100%)` }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ACCENT}15 0%, ${ACCENT}05 100%)` }}>
            <Search className="w-8 h-8 text-fuchsia-300" />
          </div>
          <p className="text-stone-900 font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            {search || category ? 'Aucun resultat' : 'La marketplace est vide'}
          </p>
          <p className="text-sm text-stone-400">
            {search || category ? 'Essayez avec d\'autres termes ou filtres' : 'Soyez le premier a publier une annonce !'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing, i) => (
            <ListingCard key={listing.id} listing={listing} onClick={onSelect} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───
export default function MarketplaceIndex() {
  const { auth } = usePage().props
  const [activeSection, setActiveSection] = useUrlState('tab', 'explorer')
  const [selectedListingId, setSelectedListingId] = useState(null)
  const [editingListing, setEditingListing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useShellNav({
    sections: [
      { id: 'explorer', label: 'Explorer' },
      { id: 'mes-annonces', label: 'Mes annonces' },
    ],
    activeSection,
    onSectionChange: (id) => {
      setActiveSection(id)
      setSelectedListingId(null)
      setEditingListing(null)
      setShowForm(false)
    },
  })

  let content = null
  if (activeSection === 'explorer') {
    if (selectedListingId) {
      content = (
        <ListingDetail
          listingId={selectedListingId}
          onBack={() => setSelectedListingId(null)}
        />
      )
    } else {
      content = <Explorer onSelect={(listing) => setSelectedListingId(listing.id)} />
    }
  } else if (activeSection === 'mes-annonces') {
    if (showForm || editingListing) {
      content = (
        <ListingForm
          listing={editingListing}
          onSave={() => {
            setShowForm(false)
            setEditingListing(null)
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingListing(null)
          }}
        />
      )
    } else {
      content = (
        <MyListings
          onSelect={(listing) => setEditingListing(listing)}
          onNew={() => setShowForm(true)}
        />
      )
    }
  }

  if (content) {
    return <div className="px-4 py-4">{content}</div>
  }
  return null
}
