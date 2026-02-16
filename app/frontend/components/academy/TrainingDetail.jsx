import React, { useState } from 'react'
import {
  ArrowLeft,
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
} from 'lucide-react'
import TrainingInfoTab from './TrainingInfoTab'
import TrainingSessionsTab from './TrainingSessionsTab'
import TrainingRegistrationsTab from './TrainingRegistrationsTab'
import TrainingAttendancesTab from './TrainingAttendancesTab'
import TrainingDocumentsTab from './TrainingDocumentsTab'
import TrainingChecklistTab from './TrainingChecklistTab'
import TrainingFinancesTab from './TrainingFinancesTab'

const STATUS_LABELS = {
  draft: 'Brouillon',
  planned: 'Planifiée',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const STATUS_COLORS = {
  draft: 'bg-stone-500',
  planned: 'bg-blue-500',
  registrations_open: 'bg-green-500',
  in_progress: 'bg-[#B01A19]',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
}

const TABS = [
  { id: 'info', label: 'Info', icon: Info },
  { id: 'sessions', label: 'Sessions', icon: Calendar },
  { id: 'registrations', label: 'Inscriptions', icon: Users },
  { id: 'attendances', label: 'Présences', icon: Users },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'checklist', label: 'Checklist', icon: CheckSquare },
  { id: 'finances', label: 'Finances', icon: DollarSign },
]

export default function TrainingDetail({ training, data, busy, onBack, onRefresh, actions }) {
  const [tab, setTab] = useState('info')

  const trainingType = data.trainingTypes?.find((t) => t.id === training.trainingTypeId) || null
  const sessions = data.trainingSessions?.filter((s) => s.trainingId === training.id) || []
  const registrations = data.trainingRegistrations?.filter((r) => r.trainingId === training.id) || []
  const documents = data.trainingDocuments?.filter((d) => d.trainingId === training.id) || []
  const expenses = data.trainingExpenses?.filter((e) => e.trainingId === training.id) || []
  const attendances = data.trainingAttendances || []
  const locations = data.trainingLocations || []
  const members = data.members || []

  const revenue = registrations.reduce((sum, r) => sum + Number(r.amountPaid || 0), 0)
  const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const profitability = revenue - expenseTotal
  const profitabilityPercent = revenue > 0 ? Math.round((profitability / revenue) * 100) : 0
  const registrationCount = registrations.length
  const maxParticipants = Number(training.maxParticipants) || 0
  const fillRate = maxParticipants > 0 ? Math.round((registrationCount / maxParticipants) * 100) : 0

  const checklistItems = training.checklistItems || []
  const checkedItems = training.checkedItems || []
  const checklistProgress =
    checklistItems.length > 0 ? Math.round((checkedItems.length / checklistItems.length) * 100) : 0

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour Kanban
          </button>
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

        <header className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-3">
                <div className="h-12 w-1 bg-[#B01A19] rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold text-stone-900 tracking-tight break-words">
                    {training.title}
                  </h1>
                  <p className="text-sm text-stone-500 mt-1.5 font-medium">
                    {trainingType?.name || '—'}
                  </p>
                </div>
              </div>
              <div className="ml-5">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white shadow-sm ${STATUS_COLORS[training.status] || STATUS_COLORS.draft}`}
                >
                  {STATUS_LABELS[training.status] || training.status}
                </span>
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
                onClick={() => {
                  if (window.confirm('Supprimer cette formation ?')) actions.deleteTraining(training.id)
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Supprimer</span>
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            <div className="text-2xl font-bold text-stone-900 mb-2">{registrationCount}</div>
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
                Recettes
              </span>
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {revenue.toLocaleString('fr-FR')} €
            </div>
            <div className="text-xs text-stone-500">
              {Number(training.price || 0).toLocaleString('fr-FR')} € / participant
            </div>
          </div>
          <div className="group bg-white rounded-xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-orange-50">
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                Dépenses
              </span>
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {expenseTotal.toLocaleString('fr-FR')} €
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
              {profitability >= 0 ? '+' : ''}
              {profitability.toLocaleString('fr-FR')} €
            </div>
            <div className="text-xs text-stone-500">
              {profitabilityPercent >= 0 ? '+' : ''}
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

          <div className="p-6">
            {tab === 'info' && (
              <TrainingInfoTab
                training={training}
                trainingType={trainingType}
                sessions={sessions}
                locations={locations}
                members={members}
                onUpdateStatus={(status) => actions.updateTrainingStatus(training.id, status)}
              />
            )}
            {tab === 'sessions' && (
              <TrainingSessionsTab
                sessions={sessions}
                locations={locations}
                members={members}
                onAddSession={() => actions.addSession(training.id)}
                onEditSession={(id) => actions.editSession(id)}
                onDeleteSession={(id) => actions.deleteSession(id)}
              />
            )}
            {tab === 'registrations' && (
              <TrainingRegistrationsTab
                registrations={registrations}
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
                onMarkAttendance={(regId, sessionId, isPresent) =>
                  actions.markAttendance(regId, sessionId, isPresent)
                }
              />
            )}
            {tab === 'documents' && (
              <TrainingDocumentsTab
                documents={documents}
                onUploadDocument={() => actions.addDocument(training.id)}
                onDeleteDocument={(id) => actions.deleteDocument(id)}
              />
            )}
            {tab === 'checklist' && (
              <TrainingChecklistTab
                checklistItems={checklistItems}
                checkedItems={checkedItems}
                onToggleChecklistItem={(index) => actions.toggleChecklistItem(training.id, index)}
                onAddChecklistItem={(item) => actions.addChecklistItem(training.id, item)}
                onRemoveChecklistItem={(index) => actions.removeChecklistItem(training.id, index)}
              />
            )}
            {tab === 'finances' && (
              <TrainingFinancesTab
                registrations={registrations}
                expenses={expenses}
                trainingPrice={Number(training.price || 0)}
                onAddExpense={() => actions.addExpense(training.id)}
                onEditExpense={(id) => actions.editExpense(id)}
                onDeleteExpense={(id) => actions.deleteExpense(id)}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
