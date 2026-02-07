import { useState } from 'react'
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Users, 
  Euro, 
  TrendingUp,
  Calendar,
  MapPin,
  User,
  FileText,
  CheckSquare,
  DollarSign,
  Info
} from 'lucide-react'
import type {
  Training,
  TrainingType,
  TrainingSession,
  TrainingRegistration,
  TrainingAttendance,
  TrainingDocument,
  TrainingExpense,
  TrainingLocation,
  Member,
  TrainingStatus
} from '../types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { TrainingInfoTab } from './TrainingInfoTab'
import { TrainingSessionsTab } from './TrainingSessionsTab'
import { TrainingRegistrationsTab } from './TrainingRegistrationsTab'
import { TrainingAttendancesTab } from './TrainingAttendancesTab'
import { TrainingDocumentsTab } from './TrainingDocumentsTab'
import { TrainingChecklistTab } from './TrainingChecklistTab'
import { TrainingFinancesTab } from './TrainingFinancesTab'

interface TrainingDetailProps {
  training: Training
  trainingType: TrainingType
  sessions: TrainingSession[]
  registrations: TrainingRegistration[]
  attendances: TrainingAttendance[]
  documents: TrainingDocument[]
  expenses: TrainingExpense[]
  locations: TrainingLocation[]
  members: Member[]
  checklistItems: string[]
  checkedItems: number[]
  onEdit?: () => void
  onDelete?: () => void
  onUpdateStatus?: (status: TrainingStatus) => void
  onAddSession?: () => void
  onEditSession?: (sessionId: string) => void
  onDeleteSession?: (sessionId: string) => void
  onAddRegistration?: () => void
  onEditRegistration?: (registrationId: string) => void
  onDeleteRegistration?: (registrationId: string) => void
  onUpdatePaymentStatus?: (registrationId: string, status: 'pending' | 'partial' | 'paid', amountPaid: number) => void
  onMarkAttendance?: (registrationId: string, sessionId: string, isPresent: boolean) => void
  onUploadDocument?: () => void
  onDeleteDocument?: (documentId: string) => void
  onToggleChecklistItem?: (itemIndex: number) => void
  onAddChecklistItem?: (item: string) => void
  onRemoveChecklistItem?: (itemIndex: number) => void
  onAddExpense?: () => void
  onEditExpense?: (expenseId: string) => void
  onDeleteExpense?: (expenseId: string) => void
}

const statusLabels: Record<TrainingStatus, string> = {
  draft: 'Brouillon',
  planned: 'Planifiée',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée'
}

const statusColors: Record<TrainingStatus, string> = {
  draft: 'bg-stone-500',
  planned: 'bg-blue-500',
  registrations_open: 'bg-green-500',
  in_progress: 'bg-orange-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500'
}

export function TrainingDetail({
  training,
  trainingType,
  sessions,
  registrations,
  attendances,
  documents,
  expenses,
  locations,
  members,
  checklistItems,
  checkedItems,
  onEdit,
  onDelete,
  onUpdateStatus,
  onAddSession,
  onEditSession,
  onDeleteSession,
  onAddRegistration,
  onEditRegistration,
  onDeleteRegistration,
  onUpdatePaymentStatus,
  onMarkAttendance,
  onUploadDocument,
  onDeleteDocument,
  onToggleChecklistItem,
  onAddChecklistItem,
  onRemoveChecklistItem,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: TrainingDetailProps) {
  const [activeTab, setActiveTab] = useState('info')

  // Calcul des métriques
  const totalRevenue = registrations.reduce((sum, reg) => sum + reg.amountPaid, 0)
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const profitability = totalRevenue - totalExpenses
  const profitabilityPercent = totalRevenue > 0 ? Math.round((profitability / totalRevenue) * 100) : 0
  const registrationCount = registrations.length
  const fillRate = training.maxParticipants > 0 ? Math.round((registrationCount / training.maxParticipants) * 100) : 0
  
  // Calcul de la progression de la checklist
  const checklistProgress = checklistItems.length > 0 
    ? Math.round((checkedItems.length / checklistItems.length) * 100) 
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Academy accent */}
      <div className="space-y-6">
        {/* Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-12 w-1 bg-[#B01A19] rounded-full shrink-0" />
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 break-words tracking-tight">
                  {training.title}
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5 font-medium">
                  {trainingType.name}
                </p>
              </div>
            </div>
            <div className="ml-5">
              <Badge 
                className={`${statusColors[training.status]} text-white shadow-sm transition-all duration-200 hover:scale-105`}
              >
                {statusLabels[training.status]}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.()}
              className="transition-all duration-200 hover:border-[#B01A19] hover:text-[#B01A19] hover:shadow-sm"
            >
              <Edit className="size-4" />
              <span className="hidden sm:inline">Modifier</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="transition-all duration-200 hover:border-[#B01A19] hover:text-[#B01A19] hover:shadow-sm"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onUpdateStatus?.('planned')}>
                  Marquer comme planifiée
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus?.('registrations_open')}>
                  Ouvrir les inscriptions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus?.('in_progress')}>
                  Marquer en cours
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus?.('completed')}>
                  Marquer terminée
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  variant="destructive"
                  onClick={() => onDelete?.()}
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick Stats with enhanced visual hierarchy */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="group bg-white dark:bg-stone-800/50 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#B01A19] to-[#eac7b8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[#eac7b8]/20 group-hover:bg-[#B01A19]/10 transition-colors duration-200">
                <Users className="size-4 text-[#B01A19]" />
              </div>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Participants</span>
            </div>
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
              {registrationCount}
            </div>
            <div className="mb-2">
              <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    fillRate >= 60 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(fillRate, 100)}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400">
              {fillRate}% rempli <span className="text-stone-400">({training.maxParticipants} max)</span>
            </div>
          </div>
          <div className="group bg-white dark:bg-stone-800/50 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors duration-200">
                <Euro className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Recettes</span>
            </div>
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
              {totalRevenue.toLocaleString('fr-FR')} €
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400">
              {training.price} € <span className="text-stone-400">/ participant</span>
            </div>
          </div>
          <div className="group bg-white dark:bg-stone-800/50 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors duration-200">
                <TrendingUp className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Dépenses</span>
            </div>
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
              {totalExpenses.toLocaleString('fr-FR')} €
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400">
              {expenses.length} dépense{expenses.length > 1 ? 's' : ''}
            </div>
          </div>
          <div className="group bg-white dark:bg-stone-800/50 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${profitability >= 0 ? 'from-emerald-500 to-emerald-300' : 'from-red-500 to-red-300'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${profitability >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/20 group-hover:bg-red-100 dark:group-hover:bg-red-900/30'} transition-colors duration-200`}>
                <DollarSign className={`size-4 ${profitability >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Rentabilité</span>
            </div>
            <div className={`text-2xl font-bold mb-1 ${profitability >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {profitability >= 0 ? '+' : ''}{profitability.toLocaleString('fr-FR')} €
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400">
              {profitabilityPercent >= 0 ? '+' : ''}{profitabilityPercent}%
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs with Academy accent and integrated checklist progress */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className={`relative ${
          checklistItems.length > 0 ? 'rounded-t-xl overflow-hidden' : ''
        }`}>
          <TabsList className={`grid w-full grid-cols-7 h-auto p-1.5 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 shadow-inner ${
            checklistItems.length > 0 
              ? 'pb-3 rounded-t-xl rounded-b-none' 
              : 'rounded-xl'
          }`}>
            <TabsTrigger 
              value="info" 
              className="flex flex-col items-center gap-1.5 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-[#B01A19] data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <Info className="size-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="sessions" 
              className="flex flex-col items-center gap-1.5 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-[#B01A19] data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <Calendar className="size-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="registrations" 
              className="flex flex-col items-center gap-1.5 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-[#B01A19] data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <Users className="size-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="attendances" 
              className="flex flex-col items-center gap-1.5 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-[#B01A19] data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <User className="size-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="flex flex-col items-center gap-1.5 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-[#B01A19] data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <FileText className="size-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="checklist" 
              className="flex flex-col items-center gap-1.5 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-[#B01A19] data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <CheckSquare className="size-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="finances" 
              className="flex flex-col items-center gap-1.5 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-[#B01A19] data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <DollarSign className="size-5" />
            </TabsTrigger>
          </TabsList>
          
          {/* Integrated Checklist Progress Bar as bottom border */}
          {checklistItems.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden">
              {/* Background track */}
              <div className="absolute inset-0 bg-stone-200 dark:bg-stone-700" />
              {/* Animated fill with gradient */}
              <div 
                className={`absolute bottom-0 left-0 h-full transition-all duration-700 ease-out relative overflow-hidden ${
                  checklistProgress === 100 
                    ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500' 
                    : checklistProgress >= 60
                    ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-500'
                    : 'bg-gradient-to-r from-red-500 via-red-400 to-red-500'
                }`}
                style={{ width: `${checklistProgress}%` }}
              >
                {/* Shimmer effect */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  style={{
                    animation: 'shimmer 2s infinite',
                  }}
                />
                
                {/* Completion sparkle */}
                {checklistProgress === 100 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" />
                )}
              </div>
            </div>
          )}
        </div>

        <TabsContent value="info" className="mt-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <TrainingInfoTab
            training={training}
            trainingType={trainingType}
            sessions={sessions}
            locations={locations}
            members={members}
          />
        </TabsContent>

        <TabsContent value="sessions" className="mt-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <TrainingSessionsTab
            sessions={sessions}
            locations={locations}
            members={members}
            onAddSession={onAddSession}
            onEditSession={onEditSession}
            onDeleteSession={onDeleteSession}
          />
        </TabsContent>

        <TabsContent value="registrations" className="mt-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <TrainingRegistrationsTab
            registrations={registrations}
            trainingPrice={training.price}
            onAddRegistration={onAddRegistration}
            onEditRegistration={onEditRegistration}
            onDeleteRegistration={onDeleteRegistration}
            onUpdatePaymentStatus={onUpdatePaymentStatus}
          />
        </TabsContent>

        <TabsContent value="attendances" className="mt-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <TrainingAttendancesTab
            registrations={registrations}
            sessions={sessions}
            attendances={attendances}
            onMarkAttendance={onMarkAttendance}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <TrainingDocumentsTab
            documents={documents}
            onUploadDocument={onUploadDocument}
            onDeleteDocument={onDeleteDocument}
          />
        </TabsContent>

        <TabsContent value="checklist" className="mt-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <TrainingChecklistTab
            checklistItems={checklistItems}
            checkedItems={checkedItems}
            onToggleChecklistItem={onToggleChecklistItem}
            onAddChecklistItem={onAddChecklistItem}
            onRemoveChecklistItem={onRemoveChecklistItem}
          />
        </TabsContent>

        <TabsContent value="finances" className="mt-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <TrainingFinancesTab
            registrations={registrations}
            expenses={expenses}
            trainingPrice={training.price}
            onAddExpense={onAddExpense}
            onEditExpense={onEditExpense}
            onDeleteExpense={onDeleteExpense}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

