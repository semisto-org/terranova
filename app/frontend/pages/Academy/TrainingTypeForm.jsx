import React, { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import SimpleEditor from '@/components/SimpleEditor'
import { useShellNav } from '@/components/shell/ShellContext'

const ACADEMY_SECTIONS = [
  { id: 'kanban', label: 'Formations' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'types', label: 'Types de formations' },
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

export default function TrainingTypeForm({ trainingTypeId }) {
  const [loading, setLoading] = useState(!!trainingTypeId)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [checklist, setChecklist] = useState([{ id: Date.now().toString(), value: 'Définir contenu' }])
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
            setDescription(trainingType.description || '')
            const template = trainingType.checklistTemplate || ['Définir contenu']
            setChecklist(template.map((value, index) => ({ id: `item-${Date.now()}-${index}`, value })))
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
      setError('Le nom du type de formation est requis')
      return
    }

    setBusy(true)
    setError(null)

    try {
      if (isEditing) {
        await apiRequest(`/api/v1/academy/training-types/${trainingTypeId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: name.trim(),
            description,
            checklist_template: checklist.map((item) => item.value),
          }),
        })
      } else {
        await apiRequest('/api/v1/academy/training-types', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            description,
            checklist_template: checklist.map((item) => item.value),
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
  }, [name, description, checklist, isEditing, trainingTypeId])

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
              {isEditing ? 'Modifier le type de formation' : 'Nouveau type de formation'}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {isEditing ? 'Modifiez les informations du type de formation' : 'Créez un nouveau type de formation'}
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
                <label className="mb-2 block text-sm font-medium text-stone-700">Description</label>
                <SimpleEditor
                  content={description}
                  onUpdate={setDescription}
                  placeholder="Description du type de formation, objectifs pédagogiques..."
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Étapes par défaut</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Définissez les étapes par défaut pour ce type de formation
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
              {busy ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Créer le type de formation'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}
