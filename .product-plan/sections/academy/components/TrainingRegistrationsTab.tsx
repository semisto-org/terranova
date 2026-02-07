import { Users, Plus, Edit, Trash2, Mail, Euro, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import type {
  TrainingRegistration,
  PaymentStatus
} from '../types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'

interface TrainingRegistrationsTabProps {
  registrations: TrainingRegistration[]
  trainingPrice: number
  onAddRegistration?: () => void
  onEditRegistration?: (registrationId: string) => void
  onDeleteRegistration?: (registrationId: string) => void
  onUpdatePaymentStatus?: (registrationId: string, status: PaymentStatus, amountPaid: number) => void
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; icon: typeof CheckCircle2; color: string }> = {
  paid: {
    label: 'Payé',
    icon: CheckCircle2,
    color: 'bg-emerald-500'
  },
  partial: {
    label: 'Partiel',
    icon: Clock,
    color: 'bg-orange-500'
  },
  pending: {
    label: 'En attente',
    icon: AlertCircle,
    color: 'bg-stone-500'
  }
}

export function TrainingRegistrationsTab({
  registrations,
  trainingPrice,
  onAddRegistration,
  onEditRegistration,
  onDeleteRegistration,
  onUpdatePaymentStatus,
}: TrainingRegistrationsTabProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const totalPaid = registrations.reduce((sum, reg) => sum + reg.amountPaid, 0)
  const totalExpected = registrations.length * trainingPrice
  const remainingAmount = totalExpected - totalPaid

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Inscriptions
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {registrations.length} participant{registrations.length > 1 ? 's' : ''} inscrit{registrations.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => onAddRegistration?.()} size="sm" className="w-full sm:w-auto">
          <Plus className="size-4" />
          <span className="ml-2">Nouvelle inscription</span>
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-800/50 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
          <div className="text-sm text-stone-500 dark:text-stone-400 mb-1">
            Montant total payé
          </div>
          <div className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            {totalPaid.toLocaleString('fr-FR')} €
          </div>
        </div>
        <div className="bg-white dark:bg-stone-800/50 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
          <div className="text-sm text-stone-500 dark:text-stone-400 mb-1">
            Montant attendu
          </div>
          <div className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            {totalExpected.toLocaleString('fr-FR')} €
          </div>
        </div>
        <div className="bg-white dark:bg-stone-800/50 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
          <div className="text-sm text-stone-500 dark:text-stone-400 mb-1">
            Reste à payer
          </div>
          <div className={`text-xl font-semibold ${remainingAmount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {remainingAmount.toLocaleString('fr-FR')} €
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      {registrations.length === 0 ? (
        <div className="bg-white dark:bg-stone-800/50 rounded-lg p-12 border border-stone-200 dark:border-stone-700 text-center">
          <Users className="size-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
          <p className="text-stone-500 dark:text-stone-400 mb-4">
            Aucune inscription pour le moment
          </p>
          <Button
            onClick={() => onAddRegistration?.()}
            variant="outline"
            size="sm"
          >
            <Plus className="size-4" />
            Ajouter une inscription
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableBody>
                {registrations.map((registration) => {
                  const StatusIcon = paymentStatusConfig[registration.paymentStatus].icon
                  const statusConfig = paymentStatusConfig[registration.paymentStatus]
                  const isFullyPaid = registration.amountPaid >= trainingPrice
                  const remaining = trainingPrice - registration.amountPaid

                  return (
                    <TableRow key={registration.id}>
                      <TableCell className="min-w-[200px]">
                        <div>
                          <p className="font-medium text-stone-900 dark:text-stone-100">
                            {registration.contactName}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Mail className="size-3 text-stone-400" />
                            <span className="text-xs text-stone-500 dark:text-stone-400">
                              {registration.contactEmail}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-stone-600 dark:text-stone-400">
                          {formatDate(registration.registeredAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`size-4 ${statusConfig.color.replace('bg-', 'text-')}`} />
                          <Badge className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Euro className="size-4 text-stone-400" />
                          <div>
                            <p className="font-medium text-stone-900 dark:text-stone-100">
                              {registration.amountPaid.toLocaleString('fr-FR')} €
                            </p>
                            {!isFullyPaid && (
                              <p className="text-xs text-stone-500 dark:text-stone-400">
                                Reste {remaining.toLocaleString('fr-FR')} €
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell min-w-[200px]">
                        {registration.internalNote ? (
                          <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
                            {registration.internalNote}
                          </p>
                        ) : (
                          <span className="text-xs text-stone-400">Aucune note</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditRegistration?.(registration.id)}>
                              <Edit className="size-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onUpdatePaymentStatus?.(registration.id, 'paid', trainingPrice)}
                              disabled={registration.paymentStatus === 'paid'}
                            >
                              <CheckCircle2 className="size-4" />
                              Marquer payé
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onUpdatePaymentStatus?.(registration.id, 'partial', registration.amountPaid)}
                              disabled={registration.paymentStatus === 'partial'}
                            >
                              <Clock className="size-4" />
                              Marquer partiel
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => onDeleteRegistration?.(registration.id)}
                            >
                              <Trash2 className="size-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

