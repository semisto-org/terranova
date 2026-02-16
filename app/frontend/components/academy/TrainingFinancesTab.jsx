import React, { useState, useRef, useEffect } from 'react'
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Receipt,
} from 'lucide-react'

const CATEGORY_LABELS = {
  location: 'Lieu',
  material: 'Matériel',
  food: 'Repas',
  accommodation: 'Hébergement',
  transport: 'Transport',
  other: 'Autre',
}

const CATEGORY_COLORS = {
  location: 'bg-blue-500',
  material: 'bg-purple-500',
  food: 'bg-orange-500',
  accommodation: 'bg-amber-500',
  transport: 'bg-cyan-500',
  other: 'bg-stone-500',
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function TrainingFinancesTab({
  registrations = [],
  expenses = [],
  trainingPrice = 0,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}) {
  const totalRevenue = registrations.reduce(
    (sum, r) => sum + Number(r.amountPaid || 0),
    0
  )
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const profitability = totalRevenue - totalExpenses
  const profitabilityPercent =
    totalRevenue > 0 ? Math.round((profitability / totalRevenue) * 100) : 0

  const expensesByCategory = expenses.reduce((acc, exp) => {
    const cat = exp.category || 'other'
    acc[cat] = (acc[cat] || 0) + Number(exp.amount || 0)
    return acc
  }, {})

  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Finances</h3>
          <p className="text-sm text-stone-500 mt-1">
            Vue d'ensemble financière de la formation
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAddExpense?.()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#B01A19] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1514] w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Ajouter une dépense
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-6 border border-stone-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-stone-500">Recettes</span>
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {totalRevenue.toLocaleString('fr-FR')} €
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {registrations.length} inscription{registrations.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-stone-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span className="text-sm text-stone-500">Dépenses</span>
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {totalExpenses.toLocaleString('fr-FR')} €
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {expenses.length} dépense{expenses.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-stone-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign
              className={`w-5 h-5 ${
                profitability >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            />
            <span className="text-sm text-stone-500">Rentabilité</span>
          </div>
          <div
            className={`text-2xl font-bold ${
              profitability >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {profitability >= 0 ? '+' : ''}
            {profitability.toLocaleString('fr-FR')} €
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {profitabilityPercent >= 0 ? '+' : ''}
            {profitabilityPercent}%
          </div>
        </div>
      </div>

      {Object.keys(expensesByCategory).length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-stone-200">
          <h4 className="text-base font-semibold text-stone-900 mb-4">
            Dépenses par catégorie
          </h4>
          <div className="mb-4 relative">
            <div className="w-full bg-stone-200 rounded-full h-4 overflow-visible flex">
              {Object.entries(expensesByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const percentage =
                    totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
                  return (
                    <div
                      key={category}
                      className={`${CATEGORY_COLORS[category] || CATEGORY_COLORS.other} h-full transition-all duration-300 hover:opacity-80 relative group cursor-default rounded-full first:rounded-l-full last:rounded-r-full`}
                      style={{ width: `${percentage}%` }}
                      title={`${CATEGORY_LABELS[category] || category}: ${amount.toLocaleString('fr-FR')} € (${Math.round(percentage)}%)`}
                    />
                  )
                })}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(expensesByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category]) => (
                <div key={category} className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      CATEGORY_COLORS[category] || CATEGORY_COLORS.other
                    }`}
                  />
                  <span className="text-sm font-medium text-stone-900">
                    {CATEGORY_LABELS[category] || category}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-200">
          <h4 className="text-base font-semibold text-stone-900">
            Détail des dépenses
          </h4>
        </div>
        {sortedExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 mb-4">Aucune dépense enregistrée</p>
            <button
              type="button"
              onClick={() => onAddExpense?.()}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              <Plus className="w-4 h-4" />
              Ajouter une dépense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">
                    Catégorie
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase text-right">
                    Montant
                  </th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {sortedExpenses.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    formatDate={formatDate}
                    onEdit={() => onEditExpense?.(expense.id)}
                    onDelete={() => onDeleteExpense?.(expense.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function ExpenseRow({ expense, formatDate, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const categoryLabel = CATEGORY_LABELS[expense.category] || expense.category
  const categoryColor = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50/50">
      <td className="px-4 py-3 text-sm text-stone-600">
        {expense.date ? formatDate(expense.date) : '—'}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${categoryColor}`}
        >
          {categoryLabel}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-stone-900">{expense.description || '—'}</p>
      </td>
      <td className="px-4 py-3 text-right font-medium text-stone-900">
        {Number(expense.amount || 0).toLocaleString('fr-FR')} €
      </td>
      <td className="px-4 py-3 relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          aria-label="Actions"
        >
          <Edit className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 py-1 w-36 bg-white rounded-lg border border-stone-200 shadow-lg z-20">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onEdit()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onDelete()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
