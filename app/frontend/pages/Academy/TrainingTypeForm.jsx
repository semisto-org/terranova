import React, { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import SimpleEditor from '@/components/SimpleEditor'
import { useShellNav } from '@/components/shell/ShellContext'

const ACADEMY_SECTIONS = [
  { id: 'kanban', label: 'Activités' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'types', label: 'Types d\'activités' },
  { id: 'locations', label: 'Lieux' },
  { id: 'ideas', label: 'Bloc-notes' },
  { id: 'reporting', label: 'Reporting' },
]
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import SortableChecklistItem from '@/components/SortableChecklistItem'

const TYPE_COLORS = [
  { hex: '#EF4444', label: 'Rouge' },
  { hex: '#F97316', label: 'Orange' },
  { hex: '#F59E0B', label: 'Ambre' },
  { hex: '#EAB308', label: 'Jaune' },
  { hex: '#84CC16', label: 'Lime' },
  { hex: '#22C55E', label: 'Vert' },
  { hex: '#14B8A6', label: 'Sarcelle' },
  { hex: '#06B6D4', label: 'Cyan' },
  { hex: '#3B82F6', label: 'Bleu' },
  { hex: '#6366F1', label: 'Indigo' },
  { hex: '#8B5CF6', label: 'Violet' },
  { hex: '#A855F7', label: 'Pourpre' },
  { hex: '#EC4899', label: 'Rose' },
  { hex: '#F43F5E', label: 'Framboise' },
  { hex: '#78716C', label: 'Pierre' },
  { hex: '#6B7280', label: 'Gris' },
]

export default function TrainingTypeForm({ trainingTypeId }) {
  const [loading, setLoading] = useState(!!trainingTypeId)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6B7280')
  const [checklist, setChecklist] = useState([{ id: Date.now().toString(), value: 'Définir contenu' }])
  const [categories, setCategories] = useState([])
  const [activeId, setActiveId] = useState(null)

  // Register Academy navigation
  useShellNav({
    sections: ACADEMY_SECTIONS,
    activeSection: 'types',
    onSectionChange: (id) => {
      if (id === 'types') {
        window.location.href = '/academy?view=types'
      } else {
        window.location.href = `/academy${id === 'kanban' ? '' : id === 'calendar' ? '/calendar' : `?view=${id}`}`
      }
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const isEditing = !!trainingTypeId

  useEffect(() => {
    if (trainingTypeId) {
      apiRequest('/api/v1/academy')
        .then((payload) => {
          const trainingType = payload.trainingTypes.find((item) => item.id === trainingTypeId)
          if (trainingType) {
            setName(trainingType.name)
            setColor(trainingType.color || '#6B7280')
            setDescription(trainingType.description || '')
            const template = trainingType.checklistTemplate || ['Définir contenu']
            setChecklist(template.map((value, index) => ({ id: `item-${Date.now()}-${index}`, value })))
            const defaultCats = trainingType.defaultCategories || []
            setCategories(defaultCats.map((c, i) => ({
              id: `cat-${Date.now()}-${i}`,
              label: c.label || '',
              price: c.price || 0,
              maxSpots: c.maxSpots || c.max_spots || 0,
              depositAmount: c.depositAmount || c.deposit_amount || 0,
            })))
          }
          setLoading(false)
        })
        .catch((err) => {
          setError(err.message)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [trainingTypeId])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Le nom du type d\'activité est requis')
      return
    }

    setBusy(true)
    setError(null)

    try {
      if (isEditing) {
        const categoriesPayload = categories
          .filter((c) => c.label.trim())
          .map((c) => ({ label: c.label.trim(), price: Number(c.price) || 0, maxSpots: Number(c.maxSpots) || 0, depositAmount: Number(c.depositAmount) || 0 }))

        await apiRequest(`/api/v1/academy/training-types/${trainingTypeId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: name.trim(),
            description,
            color,
            checklist_template: checklist.map((item) => item.value),
            default_categories: categoriesPayload,
          }),
        })
      } else {
        const categoriesPayload = categories
          .filter((c) => c.label.trim())
          .map((c) => ({ label: c.label.trim(), price: Number(c.price) || 0, maxSpots: Number(c.maxSpots) || 0, depositAmount: Number(c.depositAmount) || 0 }))

        await apiRequest('/api/v1/academy/training-types', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            description,
            color,
            checklist_template: checklist.map((item) => item.value),
            default_categories: categoriesPayload,
            photo_gallery: [],
            trainer_ids: [],
          }),
        })
      }
      window.location.href = '/academy?view=types'
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [name, description, color, checklist, categories, isEditing, trainingTypeId])

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setChecklist((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(items, oldIndex, newIndex)
        }
        return items
      })
    }

    setActiveId(null)
  }

  const addChecklistItem = () => {
    setChecklist([...checklist, { id: `item-${Date.now()}`, value: '' }])
  }

  const updateChecklistItem = (id, value) => {
    setChecklist((items) => items.map((item) => (item.id === id ? { ...item, value } : item)))
  }

  const removeChecklistItem = (id) => {
    setChecklist((items) => items.filter((item) => item.id !== id))
  }

  const activeItem = activeId !== null ? checklist.find((item) => item.id === activeId) : null

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-stone-500">Chargement...</p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        [data-dragging="true"] {
          animation: slideIn 0.2s ease-out;
        }
      `}</style>
      <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900 tracking-tight">
              {isEditing ? 'Modifier le type d\'activité' : 'Nouveau type d\'activité'}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {isEditing ? 'Modifiez les informations du type d\'activité' : 'Créez un nouveau type d\'activité'}
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/academy?view=types'}
            className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-all hover:bg-stone-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Annuler
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Nom du type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 placeholder-stone-400 transition-all focus:border-[#B01A19] focus:outline-none focus:ring-2 focus:ring-[#B01A19]/10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Permaculture Design Course"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">Couleur</label>
                <div className="flex flex-wrap gap-1.5">
                  {TYPE_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      className={`w-7 h-7 rounded-lg transition-all duration-150 ${
                        color === c.hex
                          ? 'ring-2 ring-offset-2 ring-stone-900 scale-110'
                          : 'hover:scale-110 hover:ring-1 hover:ring-stone-300'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">Description</label>
                <SimpleEditor
                  content={description}
                  onUpdate={setDescription}
                  placeholder="Description du type d'activité, objectifs pédagogiques..."
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Étapes par défaut</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Définissez les étapes par défaut pour ce type d'activité
                </p>
              </div>
              <button
                type="button"
                onClick={addChecklistItem}
                className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-all hover:bg-stone-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter une étape
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50/50 p-4">
                {checklist.length === 0 ? (
                  <div className="py-8 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-stone-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p className="mt-3 text-sm text-stone-400">Aucun item dans la checklist</p>
                    <p className="mt-1 text-xs text-stone-400">Ajoutez votre premier item pour commencer</p>
                  </div>
                ) : (
                  <SortableContext items={checklist.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                    {checklist.map((item, index) => (
                      <SortableChecklistItem
                        key={item.id}
                        id={item.id}
                        index={index}
                        value={item.value}
                        onUpdate={(value) => updateChecklistItem(item.id, value)}
                        onRemove={() => removeChecklistItem(item.id)}
                      />
                    ))}
                  </SortableContext>
                )}
              </div>

              <DragOverlay>
                {activeItem !== null ? (
                  <div className="flex items-center gap-3 rounded-lg border border-[#B01A19] bg-white p-3 shadow-xl shadow-[#B01A19]/30">
                    <div className="flex h-8 w-8 shrink-0 cursor-grabbing items-center justify-center rounded-lg border border-stone-300 bg-stone-50 text-stone-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8h16M4 16h16"
                        />
                      </svg>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-gradient-to-br from-stone-50 to-stone-100 font-semibold text-stone-700">
                      {checklist.findIndex((item) => item.id === activeId) + 1}
                    </div>
                    <div className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900">
                      {activeItem?.value || `Étape ${checklist.findIndex((item) => item.id === activeId) + 1}`}
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          {/* Default Participant Categories */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Catégories de participants par défaut</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Ces catégories seront utilisées par défaut lors de la création d'une activité de ce type
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCategories([...categories, { id: `cat-${Date.now()}`, label: '', price: 0, maxSpots: 0, depositAmount: 0 }])}
                className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-all hover:bg-stone-50 shrink-0 self-start"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter une catégorie
              </button>
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-4">
              {categories.length === 0 ? (
                <div className="py-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="mt-3 text-sm text-stone-400">Aucune catégorie de participants définie</p>
                  <p className="mt-1 text-xs text-stone-400">Les catégories seront créées manuellement pour chaque activité</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="rounded-lg border border-stone-200 bg-white p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={cat.label}
                          onChange={(e) => setCategories((cats) => cats.map((c) => c.id === cat.id ? { ...c, label: e.target.value } : c))}
                          className="flex-1 min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-[#B01A19] focus:outline-none focus:ring-2 focus:ring-[#B01A19]/10"
                          placeholder="Libellé (ex: Adulte)"
                        />
                        <button
                          type="button"
                          onClick={() => setCategories((cats) => cats.filter((c) => c.id !== cat.id))}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                          title="Supprimer"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <div className="flex-1 min-w-[90px]">
                          <label className="block text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-1">Tarif</label>
                          <div className="flex rounded-lg border border-stone-300 bg-white overflow-hidden focus-within:border-[#B01A19] focus-within:ring-2 focus-within:ring-[#B01A19]/10">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={cat.price}
                              onChange={(e) => setCategories((cats) => cats.map((c) => c.id === cat.id ? { ...c, price: e.target.value } : c))}
                              className="w-full px-2.5 py-1.5 text-sm text-right text-stone-900 border-0 bg-transparent focus:outline-none"
                              placeholder="0"
                            />
                            <span className="flex items-center px-2 bg-stone-50 border-l border-stone-300 text-xs text-stone-500 font-medium">€</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-[80px]">
                          <label className="block text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-1">Places</label>
                          <div className="flex rounded-lg border border-stone-300 bg-white overflow-hidden focus-within:border-[#B01A19] focus-within:ring-2 focus-within:ring-[#B01A19]/10">
                            <input
                              type="number"
                              min="0"
                              value={cat.maxSpots}
                              onChange={(e) => setCategories((cats) => cats.map((c) => c.id === cat.id ? { ...c, maxSpots: e.target.value } : c))}
                              className="w-full px-2.5 py-1.5 text-sm text-right text-stone-900 border-0 bg-transparent focus:outline-none"
                              placeholder="0"
                            />
                            <span className="flex items-center px-2 bg-stone-50 border-l border-stone-300 text-[10px] text-stone-500 font-medium uppercase tracking-wider">max</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-[100px]">
                          <label className="block text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-1">Acompte</label>
                          <div className="flex rounded-lg border border-stone-300 bg-white overflow-hidden focus-within:border-[#B01A19] focus-within:ring-2 focus-within:ring-[#B01A19]/10">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={cat.depositAmount}
                              onChange={(e) => setCategories((cats) => cats.map((c) => c.id === cat.id ? { ...c, depositAmount: e.target.value } : c))}
                              className="w-full px-2.5 py-1.5 text-sm text-right text-stone-900 border-0 bg-transparent focus:outline-none"
                              placeholder="0"
                            />
                            <span className="flex items-center px-2 bg-stone-50 border-l border-stone-300 text-xs text-stone-500 font-medium">€</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3 border-t border-stone-200 pt-6">
            <button
              type="button"
              onClick={() => window.location.href = '/academy?view=types'}
              className="flex-1 rounded-lg border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-stone-700 transition-all hover:bg-stone-50 active:scale-[0.98]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="flex-1 rounded-lg bg-[#B01A19] px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#8f1514] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Créer le type d\'activité'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}
