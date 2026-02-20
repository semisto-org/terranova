import React, { useState, useRef, useEffect } from 'react'
import { Users, Plus, Edit, Trash2, Mail, Euro, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const PAYMENT_CONFIG = {
  paid: { label: 'Payé', Icon: CheckCircle2, color: 'bg-emerald-500 text-white' },
  partial: { label: 'Partiel', Icon: Clock, color: 'bg-orange-500 text-white' },
  pending: { label: 'En attente', Icon: AlertCircle, color: 'bg-stone-500 text-white' },
}

export default function TrainingRegistrationsTab({
  registrations = [],
  trainingPrice = 0,
  onAddRegistration,
  onEditRegistration,
  onDeleteRegistration,
  onUpdatePaymentStatus,
}) {
  const totalPaid = registrations.reduce((sum, r) => sum + Number(r.amountPaid || 0), 0)
  const totalExpected = registrations.length * Number(trainingPrice)
  const remainingAmount = totalExpected - totalPaid

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Inscriptions</h3>
          <p className="text-sm text-stone-500 mt-1">
            {registrations.length} participant{registrations.length !== 1 ? 's' : ''} inscrit{registrations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAddRegistration?.()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#B01A19] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1514]"
        >
          <Plus className="w-4 h-4" />
          Nouvelle inscription
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-stone-200">
          <div className="text-sm text-stone-500 mb-1">Montant total payé</div>
          <div className="text-xl font-semibold text-stone-900">
            {totalPaid.toLocaleString('fr-FR')} €
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-stone-200">
          <div className="text-sm text-stone-500 mb-1">Montant attendu</div>
          <div className="text-xl font-semibold text-stone-900">
            {totalExpected.toLocaleString('fr-FR')} €
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-stone-200">
          <div className="text-sm text-stone-500 mb-1">Reste à payer</div>
          <div
            className={`text-xl font-semibold ${
              remainingAmount > 0 ? 'text-orange-600' : 'text-emerald-600'
            }`}
          >
            {remainingAmount.toLocaleString('fr-FR')} €
          </div>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="bg-white rounded-lg p-12 border border-stone-200 text-center">
          <Users className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 mb-4">Aucune inscription pour le moment</p>
          <button
            type="button"
            onClick={() => onAddRegistration?.()}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <Plus className="w-4 h-4" />
            Ajouter une inscription
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wide min-w-[200px]">
                    Participant
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wide hidden sm:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wide">
                    Paiement
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wide">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wide w-12" />
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => {
                  const config = PAYMENT_CONFIG[registration.paymentStatus] || PAYMENT_CONFIG.pending
                  const Icon = config.Icon
                  const isFullyPaid = Number(registration.amountPaid || 0) >= Number(trainingPrice)
                  const remaining = Number(trainingPrice) - Number(registration.amountPaid || 0)

                  return (
                    <RegistrationRow
                      key={registration.id}
                      registration={registration}
                      config={config}
                      Icon={Icon}
                      isFullyPaid={isFullyPaid}
                      remaining={remaining}
                      trainingPrice={trainingPrice}
                      formatDate={formatDate}
                      onEdit={() => onEditRegistration?.(registration.id)}
                      onDelete={() => onDeleteRegistration?.(registration.id)}
                      onUpdatePaymentStatus={onUpdatePaymentStatus}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function RegistrationRow({
  registration,
  config,
  Icon,
  isFullyPaid,
  remaining,
  trainingPrice,
  formatDate,
  onEdit,
  onDelete,
  onUpdatePaymentStatus,
}) {
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

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50/50">
      <td className="px-4 py-3 min-w-[200px]">
        <p className="font-medium text-stone-900">{registration.contactName}</p>
        <div className="flex items-center gap-1 mt-1">
          <Mail className="w-3 h-3 text-stone-400" />
          <span className="text-xs text-stone-500">{registration.contactEmail || '—'}</span>
        </div>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell text-sm text-stone-600">
        {registration.registeredAt ? formatDate(registration.registeredAt) : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-stone-500" />
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Euro className="w-4 h-4 text-stone-400" />
          <div>
            <p className="font-medium text-stone-900">
              {Number(registration.amountPaid || 0).toLocaleString('fr-FR')} €
            </p>
            {!isFullyPaid && (
              <p className="text-xs text-stone-500">Reste {remaining.toLocaleString('fr-FR')} €</p>
            )}
          </div>
        </div>
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
          <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-white rounded-lg border border-stone-200 shadow-lg z-20">
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
                onUpdatePaymentStatus?.(registration.id, 'paid', Number(trainingPrice))
              }}
              disabled={registration.paymentStatus === 'paid'}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50 disabled:pointer-events-none"
            >
              <CheckCircle2 className="w-4 h-4" />
              Marquer payé
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onUpdatePaymentStatus?.(registration.id, 'partial', Number(registration.amountPaid || 0))
              }}
              disabled={registration.paymentStatus === 'partial'}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Clock className="w-4 h-4" />
              Marquer partiel
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
