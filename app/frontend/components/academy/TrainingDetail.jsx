import React, { useState, useRef, useEffect } from 'react'
import {
  ArrowLeft,
  X,
  RefreshCw,
  Edit,
  MoreVertical,
  Trash2,
  Users,
  Euro,
  TrendingUp,
  DollarSign,
  Info,
  Calendar,
  FileText,
  CheckSquare,
  Camera,
  ChevronDown,
  Check,
  MapPin,
  GraduationCap,
  AlertCircle,
} from 'lucide-react'
import TrainingInfoTab from './TrainingInfoTab'
import TrainingSessionsTab from './TrainingSessionsTab'
import TrainingRegistrationsTab from './TrainingRegistrationsTab'
import TrainingAttendancesTab from './TrainingAttendancesTab'
import TrainingDocumentsTab from './TrainingDocumentsTab'
import TrainingChecklistTab from './TrainingChecklistTab'
import TrainingFinancesTab from './TrainingFinancesTab'
import TrainingAlbumTab from './TrainingAlbumTab'

const STATUS_LABELS = {
  idea: 'Idée',
  in_construction: 'En construction',
  in_preparation: 'En préparation',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  post_production: 'En post-prod',
  completed: 'Clôturée',
  cancelled: 'Annulée',
}

const STATUS_COLORS = {
  idea: 'bg-amber-500',
  in_construction: 'bg-violet-500',
  in_preparation: 'bg-blue-500',
  registrations_open: 'bg-green-500',
  in_progress: 'bg-[#B01A19]',
  post_production: 'bg-teal-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
}

const STATUS_DOT_COLORS = {
  idea: 'bg-amber-400',
  in_construction: 'bg-violet-400',
  in_preparation: 'bg-blue-400',
  registrations_open: 'bg-green-400',
  in_progress: 'bg-[#B01A19]',
  post_production: 'bg-teal-400',
  completed: 'bg-emerald-400',
  cancelled: 'bg-red-400',
}

const STATUS_HOVER = {
  idea: 'hover:bg-amber-50',
  in_construction: 'hover:bg-violet-50',
  in_preparation: 'hover:bg-blue-50',
  registrations_open: 'hover:bg-emerald-50',
  in_progress: 'hover:bg-red-50',
  post_production: 'hover:bg-teal-50',
  completed: 'hover:bg-emerald-50',
  cancelled: 'hover:bg-rose-50',
}

const STATUS_ORDER = ['idea', 'in_construction', 'in_preparation', 'registrations_open', 'in_progress', 'post_production', 'completed', 'cancelled']

function formatCurrency(value) {
  return Number(value).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function StatusDropdown({ currentStatus, onChangeStatus, readinessChecks = [] }) {
  const [open, setOpen] = useState(false)
  const [tooltipStatus, setTooltipStatus] = useState(null)
  const ref = useRef(null)

  const allReady = readinessChecks.length > 0 && readinessChecks.every((c) => c.done)
  const missingChecks = readinessChecks.filter((c) => !c.done)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-2 rounded-full pl-3 pr-2.5 py-1.5 text-sm font-medium text-white shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${STATUS_COLORS[currentStatus] || STATUS_COLORS.idea}`}
      >
        {STATUS_LABELS[currentStatus] || currentStatus}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 z-50 w-56 rounded-xl border border-stone-200 bg-white shadow-xl overflow-hidden"
          style={{ animation: 'statusDropdownReveal 0.18s ease-out' }}
        >
          <div className="py-1.5">
            {STATUS_ORDER.map((status) => {
              const isActive = status === currentStatus
              const isBlocked = status === 'registrations_open' && !allReady
              return (
                <div key={status} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (isBlocked) return
                      if (!isActive) onChangeStatus(status)
                      setOpen(false)
                    }}
                    onMouseEnter={() => isBlocked && setTooltipStatus(status)}
                    onMouseLeave={() => setTooltipStatus(null)}
                    disabled={isBlocked}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors duration-150 ${
                      isBlocked
                        ? 'text-stone-400 cursor-not-allowed'
                        : isActive
                          ? 'bg-stone-50 font-semibold text-stone-900'
                          : `text-stone-700 font-medium ${STATUS_HOVER[status]}`
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isBlocked ? 'bg-stone-300' : STATUS_DOT_COLORS[status]} ${isActive ? 'ring-2 ring-offset-1 ring-stone-300' : ''}`} />
                    <span className="flex-1">{STATUS_LABELS[status]}</span>
                    {isBlocked && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                    {isActive && !isBlocked && <Check className="w-4 h-4 text-stone-400 shrink-0" />}
                  </button>
                  {/* Tooltip for blocked status */}
                  {tooltipStatus === status && isBlocked && (
                    <div className="absolute left-full top-0 ml-2 z-50 w-52 rounded-lg border border-rose-200 bg-white shadow-lg p-3">
                      <p className="text-xs font-semibold text-rose-600 mb-1.5">Éléments manquants :</p>
                      <ul className="space-y-1">
                        {missingChecks.map((c) => (
                          <li key={c.id} className="flex items-center gap-1.5 text-xs text-stone-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                            {c.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes statusDropdownReveal {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

const TABS = [
  { id: 'info', label: 'Info', icon: Info },
  { id: 'sessions', label: 'Sessions', icon: Calendar },
  { id: 'registrations', label: 'Inscriptions', icon: Users },
  { id: 'attendances', label: 'Présences', icon: Users },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'album', label: 'Album', icon: Camera },
  { id: 'checklist', label: 'Checklist', icon: CheckSquare },
  { id: 'finances', label: 'Finances', icon: DollarSign },
]

export default function TrainingDetail({
  training,
  data,
  busy,
  onBack,
  onRefresh,
  actions,
  layout = 'page',
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}) {
  const [tab, setTab] = useState('info')
  const isDrawer = layout === 'drawer'

  const trainingType = data.trainingTypes?.find((t) => t.id === training.trainingTypeId) || null
  const sessions = data.trainingSessions?.filter((s) => s.trainingId === training.id) || []
  const registrations = data.trainingRegistrations?.filter((r) => r.trainingId === training.id) || []
  const documents = data.trainingDocuments?.filter((d) => d.trainingId === training.id) || []
  const expenses = data.trainingExpenses?.filter((e) => e.trainingId === training.id) || []
  const attendances = data.trainingAttendances || []
  const locations = data.trainingLocations || []
  const members = data.members || []
  const academyContacts = data.academyContacts || []

  const vatRate = Number(training.vatRate || 0)
  const revenue = registrations.reduce((sum, r) => {
    const paid = Number(r.amountPaid || 0)
    return sum + (vatRate > 0 ? paid / (1 + vatRate / 100) : paid)
  }, 0)
  const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amountExclVat || e.totalInclVat || e.amount || 0), 0)
  const profitability = revenue - expenseTotal
  const profitabilityPercent = revenue > 0 ? Math.round((profitability / revenue) * 100) : 0
  const participantCount = Number(training.totalSpotsTaken) || 0
  const maxParticipants = Number(training.totalCapacity) || Number(training.maxParticipants) || 0
  const fillRate = maxParticipants > 0 ? Math.round((participantCount / maxParticipants) * 100) : 0

  const checklistItems = training.checklistItems || []
  const checkedItems = training.checkedItems || []
  const checklistProgress =
    checklistItems.length > 0 ? Math.round((checkedItems.length / checklistItems.length) * 100) : 0

  return (
    <main className={isDrawer ? 'h-full bg-stone-50' : 'min-h-screen bg-stone-50 px-4 py-6'}>
      <div className={`${isDrawer ? 'h-full space-y-4 p-4 sm:p-5' : 'max-w-6xl mx-auto space-y-6'}`}>
        <div className="flex items-center gap-2">
          {isDrawer ? (
            <>
              <button
                type="button"
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" />
                Précédente
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={!hasNext}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suivante
              </button>
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  <X className="w-4 h-4" />
                  Fermer
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour Kanban
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
          {busy && (
            <span className="text-xs text-stone-500">Synchronisation...</span>
          )}
        </div>

        <div className={`${isDrawer ? 'h-[calc(100%-56px)] overflow-y-auto pr-1 space-y-4' : 'space-y-6'}`}>
        <header className={`rounded-2xl border border-stone-200 bg-white shadow-sm ${isDrawer ? 'p-4 sm:p-5' : 'p-6'}`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-3">
                <div className="h-12 w-1 bg-[#B01A19] rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <h1 className={`${isDrawer ? 'text-2xl' : 'text-3xl'} font-bold text-stone-900 tracking-tight break-words`}>
                    {training.title}
                  </h1>
                  <p className="text-sm text-stone-500 mt-1.5 font-medium">
                    {trainingType?.name || '—'}
                  </p>
                </div>
              </div>
              <div className="ml-5">
                <StatusDropdown
                  currentStatus={training.status || 'idea'}
                  onChangeStatus={(status) => actions.updateTrainingStatus(training.id, status)}
                  readinessChecks={[
                    { id: 'date', label: 'Date(s)', done: sessions.length > 0 },
                    { id: 'location', label: 'Lieu', done: sessions.length > 0 && sessions.every((s) => (s.locationIds || []).length > 0) },
                    { id: 'trainer', label: 'Formateur', done: sessions.length > 0 && sessions.every((s) => (s.trainerIds || []).length > 0) },
                    { id: 'price', label: 'Prix', done: Number(training.price) > 0 },
                  ]}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => actions.editTraining(training.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:border-[#B01A19] hover:text-[#B01A19]"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Modifier</span>
              </button>
              <button
                type="button"
                onClick={() => actions.deleteTraining(training.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Supprimer</span>
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="group bg-white rounded-xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#B01A19] to-[#eac7b8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[#eac7b8]/20">
                <Users className="w-4 h-4 text-[#B01A19]" />
              </div>
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                Participants
              </span>
            </div>
            <div className="text-2xl font-bold text-stone-900 mb-2">{participantCount}</div>
            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  fillRate >= 60 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(fillRate, 100)}%` }}
              />
            </div>
            <div className="text-xs text-stone-500 mt-1">
              {fillRate}% rempli ({maxParticipants} max)
            </div>
          </div>
          <div className="group bg-white rounded-xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-50">
                <Euro className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                Recettes{vatRate > 0 ? ' (HT)' : ''}
              </span>
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {formatCurrency(revenue)} €
            </div>
          </div>
          <div className="group bg-white rounded-xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-orange-50">
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                Dépenses (HT)
              </span>
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {formatCurrency(expenseTotal)} €
            </div>
            <div className="text-xs text-stone-500">
              {expenses.length} dépense{expenses.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="group bg-white rounded-xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden">
            <div
              className={`absolute top-0 left-0 w-full h-1 transition-opacity duration-300 group-hover:opacity-100 ${
                profitability >= 0
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-300'
                  : 'bg-gradient-to-r from-red-500 to-red-300'
              } opacity-0`}
            />
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`p-1.5 rounded-lg ${
                  profitability >= 0 ? 'bg-emerald-50' : 'bg-red-50'
                }`}
              >
                <DollarSign
                  className={`w-4 h-4 ${
                    profitability >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                />
              </div>
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                Rentabilité
              </span>
            </div>
            <div
              className={`text-2xl font-bold ${
                profitability >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(profitability)} €
            </div>
            <div className="text-xs text-stone-500">
              {profitabilityPercent}%
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="relative">
            <div
              className={`flex flex-wrap gap-1 p-2 border-b border-stone-200 bg-stone-50 ${
                checklistItems.length > 0 ? 'pb-4' : ''
              }`}
            >
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`inline-flex flex-col items-center gap-1.5 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    tab === id
                      ? 'bg-[#B01A19] text-white shadow-md'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            {checklistItems.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ease-out ${
                    checklistProgress === 100
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : checklistProgress >= 60
                        ? 'bg-green-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
            )}
          </div>

          <div className={`${isDrawer ? 'p-4 sm:p-5' : 'p-6'}`}>
            {tab === 'info' && (
              <TrainingInfoTab
                training={training}
                trainingType={trainingType}
                sessions={sessions}
                locations={locations}
                members={members}
                academyContacts={academyContacts}
              />
            )}
            {tab === 'sessions' && (
              <TrainingSessionsTab
                sessions={sessions}
                locations={locations}
                members={members}
                academyContacts={academyContacts}
                onAddSession={() => actions.addSession(training.id)}
                onEditSession={(id) => actions.editSession(id)}
                onDeleteSession={(id) => actions.deleteSession(id)}
              />
            )}
            {tab === 'registrations' && (
              <TrainingRegistrationsTab
                registrations={registrations}
                trainingId={training.id}
                trainingPrice={Number(training.price || 0)}
                onAddRegistration={() => actions.addRegistration(training.id)}
                onEditRegistration={(id) => actions.editRegistration(id)}
                onDeleteRegistration={(id) => actions.deleteRegistration(id)}
                onUpdatePaymentStatus={(id, status, amountPaid) =>
                  actions.updatePaymentStatus(id, status, amountPaid)
                }
              />
            )}
            {tab === 'attendances' && (
              <TrainingAttendancesTab
                registrations={registrations}
                sessions={sessions}
                attendances={attendances}
                onMarkAttendance={(regId, sessionId, status) =>
                  actions.markAttendance(regId, sessionId, status)
                }
              />
            )}
            {tab === 'documents' && (
              <TrainingDocumentsTab
                documents={documents}
                sessions={sessions}
                onUploadDocument={() => actions.addDocument(training.id)}
                onDeleteDocument={(id) => actions.deleteDocument(id)}
              />
            )}
            {tab === 'album' && (
              <TrainingAlbumTab
                training={training}
                onRefresh={onRefresh}
              />
            )}
            {tab === 'checklist' && (
              <TrainingChecklistTab
                checklistItems={checklistItems}
                checkedItems={checkedItems}
                onToggleChecklistItem={(index) => actions.toggleChecklistItem(training.id, index)}
                onAddChecklistItem={(item) => actions.addChecklistItem(training.id, item)}
                onRemoveChecklistItem={(index) => actions.removeChecklistItem(training.id, index)}
                onReorderChecklist={(newChecklistItems, newCheckedItems) =>
                  actions.reorderChecklist(training.id, newChecklistItems, newCheckedItems)
                }
              />
            )}
            {tab === 'finances' && (
              <TrainingFinancesTab
                registrations={registrations}
                expenses={expenses}
                trainingPrice={Number(training.price || 0)}
                vatRate={vatRate}
                onAddExpense={() => actions.addExpense(training.id)}
                onEditExpense={(id) => actions.editExpense(id)}
                onDeleteExpense={(id) => actions.deleteExpense(id)}
              />
            )}
          </div>
        </section>
        </div>
      </div>
    </main>
  )
}
