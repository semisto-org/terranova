import { useState } from 'react'
import {
  Leaf,
  Calendar,
  Stethoscope,
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle,
} from 'lucide-react'
import type {
  PlantFollowUp,
  Annotation,
  HarvestCalendar,
  MaintenanceCalendar,
} from '../../types'
import { EmptyState } from '../shared/EmptyState'

interface CoGestionTabProps {
  plantFollowUp: PlantFollowUp | null
  annotations: Annotation[]
  harvestCalendar: HarvestCalendar | null
  maintenanceCalendar: MaintenanceCalendar | null
  onAddPlantRecord: (values: {
    marker_id?: string
    palette_item_id?: string
    status: string
    health_score?: number
    notes?: string
  }) => void
  onUpdatePlantRecord: (
    recordId: string,
    values: { status?: string; notes?: string }
  ) => void
  onAddFollowUpVisit: (values: {
    date: string
    visit_type: string
    notes?: string
  }) => void
  onAddIntervention: (values: {
    date: string
    intervention_type: string
    notes?: string
    plant_record_id?: string
  }) => void
  onAddAnnotation: (values: {
    document_id: string
    x: number
    y: number
    author_name: string
    author_type: 'team' | 'client'
    content: string
  }) => void
  onResolveAnnotation: (id: string) => void
  onDeleteAnnotation: (id: string) => void
  onUpdateHarvestCalendar: (month: number, items: unknown[]) => void
  onUpdateMaintenanceCalendar: (month: number, items: unknown[]) => void
}

export function CoGestionTab({
  plantFollowUp,
  annotations,
  harvestCalendar,
  maintenanceCalendar,
  onAddPlantRecord,
  onUpdatePlantRecord,
  onAddFollowUpVisit,
  onAddIntervention,
  onAddAnnotation,
  onResolveAnnotation,
  onDeleteAnnotation,
  onUpdateHarvestCalendar,
  onUpdateMaintenanceCalendar,
}: CoGestionTabProps) {
  const [plantRecordForm, setPlantRecordForm] = useState({
    marker_id: '',
    palette_item_id: '',
    status: 'alive',
    health_score: 100,
    notes: '',
  })
  const [visitForm, setVisitForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    visit_type: 'follow-up',
    notes: '',
  })
  const [interventionForm, setInterventionForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    intervention_type: 'mulching',
    notes: '',
    plant_record_id: '',
  })
  const [annotationForm, setAnnotationForm] = useState({
    document_id: '',
    x: 0.5,
    y: 0.5,
    author_name: 'Team',
    author_type: 'team' as 'team' | 'client',
    content: '',
  })

  const records =
    (plantFollowUp as { plantRecords?: typeof plantFollowUp.plants })?.plantRecords ??
    plantFollowUp?.plants ??
    []
  const visits =
    (plantFollowUp as { followUpVisits?: typeof plantFollowUp.visits })?.followUpVisits ??
    plantFollowUp?.visits ??
    []
  const interventions = plantFollowUp?.interventions ?? []
  const openAnnotations = annotations.filter((a) => !a.resolved)

  const statusLabel: Record<string, string> = {
    alive: 'Vivant',
    dead: 'Mort',
    'to-replace': 'À remplacer',
    replaced: 'Remplacé',
  }

  return (
    <div className="space-y-8">
      {/* Plant records */}
      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <Leaf className="w-4 h-4 text-[#AFBD00]" />
          Suivi des plantes
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onAddPlantRecord(plantRecordForm)
            setPlantRecordForm({
              marker_id: '',
              palette_item_id: '',
              status: 'alive',
              health_score: 100,
              notes: '',
            })
          }}
          className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-4"
        >
          <input
            placeholder="Marker ID (opt.)"
            value={plantRecordForm.marker_id}
            onChange={(e) =>
              setPlantRecordForm((p) => ({ ...p, marker_id: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <input
            placeholder="Palette item ID (opt.)"
            value={plantRecordForm.palette_item_id}
            onChange={(e) =>
              setPlantRecordForm((p) => ({
                ...p,
                palette_item_id: e.target.value,
              }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <select
            value={plantRecordForm.status}
            onChange={(e) =>
              setPlantRecordForm((p) => ({ ...p, status: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          >
            {Object.entries(statusLabel).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            max={100}
            placeholder="Santé"
            value={plantRecordForm.health_score || ''}
            onChange={(e) =>
              setPlantRecordForm((p) => ({
                ...p,
                health_score: Number(e.target.value || 0),
              }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <input
            placeholder="Notes"
            value={plantRecordForm.notes}
            onChange={(e) =>
              setPlantRecordForm((p) => ({ ...p, notes: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent lg:col-span-2"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
          >
            Ajouter
          </button>
        </form>
        {records.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Aucun enregistrement plante.
          </p>
        ) : (
          <ul className="space-y-2">
            {records.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 py-2 border-b border-stone-100 dark:border-stone-700/50 last:border-0"
              >
                <span className="text-sm text-stone-700 dark:text-stone-300">
                  {statusLabel[r.status] ?? r.status} · santé {r.healthScore}/100
                  {r.notes && ` · ${r.notes}`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const status = window.prompt(
                      'Nouveau statut (alive/dead/to-replace/replaced)',
                      r.status
                    )
                    if (status) onUpdatePlantRecord(r.id, { status })
                  }}
                  className="text-xs text-[#5B5781] dark:text-[#9B94BB] hover:underline"
                >
                  Changer
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Visits */}
        <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Visites
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onAddFollowUpVisit(visitForm)
              setVisitForm((p) => ({ ...p, notes: '' }))
            }}
            className="grid gap-3 mb-4"
          >
            <input
              type="date"
              value={visitForm.date}
              onChange={(e) =>
                setVisitForm((p) => ({ ...p, date: e.target.value }))
              }
              className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            />
            <select
              value={visitForm.visit_type}
              onChange={(e) =>
                setVisitForm((p) => ({ ...p, visit_type: e.target.value }))
              }
              className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            >
              <option value="follow-up">Suivi</option>
              <option value="intervention">Intervention</option>
              <option value="client-meeting">Réunion client</option>
            </select>
            <input
              placeholder="Notes"
              value={visitForm.notes}
              onChange={(e) =>
                setVisitForm((p) => ({ ...p, notes: e.target.value }))
              }
              className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            />
            <button
              type="submit"
              className="rounded-xl border border-stone-300 dark:border-stone-600 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              Ajouter visite
            </button>
          </form>
          {visits.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Aucune visite.
            </p>
          ) : (
            <ul className="space-y-1 text-sm text-stone-600 dark:text-stone-400">
              {visits.map((v) => (
                <li key={v.id}>
                  {v.date} · {v.type} · {v.notes || '—'}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Interventions */}
        <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Interventions
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onAddIntervention({
                ...interventionForm,
                plant_record_id: interventionForm.plant_record_id || undefined,
              })
              setInterventionForm((p) => ({ ...p, notes: '' }))
            }}
            className="grid gap-3 mb-4"
          >
            <input
              type="date"
              value={interventionForm.date}
              onChange={(e) =>
                setInterventionForm((p) => ({ ...p, date: e.target.value }))
              }
              className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            />
            <select
              value={interventionForm.intervention_type}
              onChange={(e) =>
                setInterventionForm((p) => ({
                  ...p,
                  intervention_type: e.target.value,
                }))
              }
              className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            >
              <option value="planting">Plantation</option>
              <option value="mulching">Paillage</option>
              <option value="pruning">Taille</option>
              <option value="watering">Arrosage</option>
              <option value="treatment">Traitement</option>
              <option value="replacement">Remplacement</option>
              <option value="other">Autre</option>
            </select>
            <input
              placeholder="Notes"
              value={interventionForm.notes}
              onChange={(e) =>
                setInterventionForm((p) => ({ ...p, notes: e.target.value }))
              }
              className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            />
            <button
              type="submit"
              className="rounded-xl border border-stone-300 dark:border-stone-600 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              Ajouter intervention
            </button>
          </form>
          {interventions.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Aucune intervention.
            </p>
          ) : (
            <ul className="space-y-1 text-sm text-stone-600 dark:text-stone-400">
              {interventions.map((i) => (
                <li key={i.id}>
                  {i.date} · {i.type} · {i.notes || '—'}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Annotations */}
      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#AFBD00]" />
          Annotations sur les plans
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onAddAnnotation(annotationForm)
            setAnnotationForm((p) => ({ ...p, content: '' }))
          }}
          className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-4"
        >
          <input
            placeholder="Document ID"
            value={annotationForm.document_id}
            onChange={(e) =>
              setAnnotationForm((p) => ({ ...p, document_id: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            required
          />
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            placeholder="X"
            value={annotationForm.x}
            onChange={(e) =>
              setAnnotationForm((p) => ({
                ...p,
                x: Number(e.target.value || 0),
              }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            placeholder="Y"
            value={annotationForm.y}
            onChange={(e) =>
              setAnnotationForm((p) => ({
                ...p,
                y: Number(e.target.value || 0),
              }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <select
            value={annotationForm.author_type}
            onChange={(e) =>
              setAnnotationForm((p) => ({
                ...p,
                author_type: e.target.value as 'team' | 'client',
              }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          >
            <option value="team">Équipe</option>
            <option value="client">Client</option>
          </select>
          <input
            placeholder="Contenu"
            value={annotationForm.content}
            onChange={(e) =>
              setAnnotationForm((p) => ({ ...p, content: e.target.value }))
            }
            className="lg:col-span-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            required
          />
          <div className="sm:col-span-2 lg:col-span-6">
            <button
              type="submit"
              className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
            >
              Ajouter annotation
            </button>
          </div>
        </form>
        {annotations.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Aucune annotation.
          </p>
        ) : (
          <ul className="space-y-2">
            {annotations.map((a) => (
              <li
                key={a.id}
                className={`flex items-center justify-between gap-3 py-2 border-b border-stone-100 dark:border-stone-700/50 last:border-0 ${a.resolved ? 'opacity-60' : ''}`}
              >
                <span className="text-sm text-stone-700 dark:text-stone-300">
                  {a.authorType} · {a.content}
                  {a.resolved && ' · résolue'}
                </span>
                <div className="flex gap-1">
                  {!a.resolved && (
                    <button
                      type="button"
                      onClick={() => onResolveAnnotation(a.id)}
                      className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-lg"
                      title="Résoudre"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteAnnotation(a.id)}
                    className="p-1.5 text-stone-500 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Calendriers */}
      <div className="grid sm:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#AFBD00]" />
            Calendrier des récoltes
          </h3>
          {(harvestCalendar?.months ?? []).length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Calendrier vide.
            </p>
          ) : (
            <ul className="space-y-2">
              {harvestCalendar!.months.slice(0, 6).map((month) => (
                <li
                  key={month.month}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-stone-700 dark:text-stone-300">
                    {month.name} : {(month.harvests ?? []).length} récolte(s)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const product = window.prompt('Produit (ex: fruits)', 'fruits')
                      const species = window.prompt('Espèce', '')
                      if (!product || !species) return
                      const items = [
                        ...(month.harvests ?? []),
                        {
                          product,
                          species,
                          commonName: '',
                          notes: '',
                        },
                      ]
                      onUpdateHarvestCalendar(month.month, items)
                    }}
                    className="text-xs text-[#5B5781] dark:text-[#9B94BB] hover:underline"
                  >
                    Ajouter
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#AFBD00]" />
            Calendrier de maintenance
          </h3>
          {(maintenanceCalendar?.months ?? []).length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Calendrier vide.
            </p>
          ) : (
            <ul className="space-y-2">
              {maintenanceCalendar!.months.slice(0, 6).map((month) => (
                <li
                  key={month.month}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-stone-700 dark:text-stone-300">
                    {month.name} : {(month.tasks ?? []).length} tâche(s)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const title = window.prompt('Nouvelle tâche', '')
                      if (!title) return
                      const items = [
                        ...(month.tasks ?? []),
                        {
                          title,
                          description: '',
                          videoUrl: null,
                          photos: [],
                        },
                      ]
                      onUpdateMaintenanceCalendar(month.month, items)
                    }}
                    className="text-xs text-[#5B5781] dark:text-[#9B94BB] hover:underline"
                  >
                    Ajouter
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
