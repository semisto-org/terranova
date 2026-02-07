import { DollarSign, Plus, Edit, Trash2, TrendingUp, TrendingDown, Euro, Receipt } from 'lucide-react'
import type {
  TrainingRegistration,
  TrainingExpense,
  ExpenseCategory
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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TrainingFinancesTabProps {
  registrations: TrainingRegistration[]
  expenses: TrainingExpense[]
  trainingPrice: number
  onAddExpense?: () => void
  onEditExpense?: (expenseId: string) => void
  onDeleteExpense?: (expenseId: string) => void
}

const categoryLabels: Record<ExpenseCategory, string> = {
  location: 'Lieu',
  material: 'Matériel',
  food: 'Repas',
  accommodation: 'Hébergement',
  transport: 'Transport',
  other: 'Autre',
}

const categoryColors: Record<ExpenseCategory, string> = {
  location: 'bg-blue-500',
  material: 'bg-purple-500',
  food: 'bg-orange-500',
  accommodation: 'bg-amber-500',
  transport: 'bg-cyan-500',
  other: 'bg-stone-500',
}

export function TrainingFinancesTab({
  registrations,
  expenses,
  trainingPrice,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: TrainingFinancesTabProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const totalRevenue = registrations.reduce((sum, reg) => sum + reg.amountPaid, 0)
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const profitability = totalRevenue - totalExpenses
  const profitabilityPercent = totalRevenue > 0 ? Math.round((profitability / totalRevenue) * 100) : 0

  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {} as Record<ExpenseCategory, number>)

  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Finances
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Vue d'ensemble financière de la formation
          </p>
        </div>
        <Button onClick={() => onAddExpense?.()} size="sm" className="w-full sm:w-auto">
          <Plus className="size-4" />
          <span className="ml-2">Ajouter une dépense</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-800/50 rounded-lg p-6 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm text-stone-500 dark:text-stone-400">Recettes</span>
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {totalRevenue.toLocaleString('fr-FR')} €
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {registrations.length} inscription{registrations.length > 1 ? 's' : ''}
          </div>
        </div>
        <div className="bg-white dark:bg-stone-800/50 rounded-lg p-6 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="size-5 text-red-600 dark:text-red-400" />
            <span className="text-sm text-stone-500 dark:text-stone-400">Dépenses</span>
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {totalExpenses.toLocaleString('fr-FR')} €
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {expenses.length} dépense{expenses.length > 1 ? 's' : ''}
          </div>
        </div>
        <div className="bg-white dark:bg-stone-800/50 rounded-lg p-6 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={`size-5 ${profitability >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
            <span className="text-sm text-stone-500 dark:text-stone-400">Rentabilité</span>
          </div>
          <div className={`text-2xl font-bold ${profitability >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {profitability >= 0 ? '+' : ''}{profitability.toLocaleString('fr-FR')} €
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {profitabilityPercent >= 0 ? '+' : ''}{profitabilityPercent}%
          </div>
        </div>
      </div>

      {/* Expenses by Category */}
      {Object.keys(expensesByCategory).length > 0 && (
        <div className="bg-white dark:bg-stone-800/50 rounded-lg p-6 border border-stone-200 dark:border-stone-700">
          <h4 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Dépenses par catégorie
          </h4>
          
          {/* Single progress bar with segments */}
          <div className="mb-4 relative">
            <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-4 overflow-visible flex">
              {Object.entries(expensesByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount], index, array) => {
                  const percentage = totalExpenses > 0
                    ? (amount / totalExpenses) * 100
                    : 0
                  
                  return (
                    <div
                      key={category}
                      className={`${categoryColors[category as ExpenseCategory]} transition-all duration-300 hover:opacity-80 relative group cursor-pointer h-full`}
                      style={{ 
                        width: `${percentage}%`,
                      }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-stone-900 dark:bg-stone-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <div className="font-semibold mb-1">
                          {categoryLabels[category as ExpenseCategory]}
                        </div>
                        <div className="text-stone-300 dark:text-stone-400">
                          {amount.toLocaleString('fr-FR')} € ({Math.round(percentage)}%)
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-stone-900 dark:bg-stone-800 rotate-45" />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(expensesByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category]) => (
                <div key={category} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${categoryColors[category as ExpenseCategory]}`} />
                  <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {categoryLabels[category as ExpenseCategory]}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="p-4 border-b border-stone-200 dark:border-stone-700">
          <h4 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            Détail des dépenses
          </h4>
        </div>
        {sortedExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="size-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
            <p className="text-stone-500 dark:text-stone-400 mb-4">
              Aucune dépense enregistrée
            </p>
            <Button
              onClick={() => onAddExpense?.()}
              variant="outline"
              size="sm"
            >
              <Plus className="size-4" />
              Ajouter une dépense
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedExpenses.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <span className="text-sm text-stone-600 dark:text-stone-400">
                        {formatDate(expense.date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={categoryColors[expense.category]}>
                        {categoryLabels[expense.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-stone-900 dark:text-stone-100">
                        {expense.description}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-stone-900 dark:text-stone-100">
                        {expense.amount.toLocaleString('fr-FR')} €
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditExpense?.(expense.id)}>
                            <Edit className="size-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onDeleteExpense?.(expense.id)}
                          >
                            <Trash2 className="size-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

