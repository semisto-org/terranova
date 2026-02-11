'use client'

import { useState } from 'react'
import { transferSemos } from '@/actions/lab-management'
import type { Member, Wallet } from '@terranova/types'

interface SemosTransferFormProps {
  currentMember: Member
  currentWallet: Wallet
  members: Member[]
  wallets: Wallet[]
  onClose: () => void
  onSuccess?: () => void
}

export function SemosTransferForm({
  currentMember,
  currentWallet,
  members,
  wallets,
  onClose,
  onSuccess,
}: SemosTransferFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    toMemberId: '',
    amount: '',
    description: '',
  })

  const otherMembers = members.filter((m) => m.id !== currentMember.id)
  const selectedMember = members.find((m) => m.id === formData.toMemberId)
  const toWallet = selectedMember
    ? wallets.find((w) => w.memberId === selectedMember.id)
    : null

  const amount = parseFloat(formData.amount || '0')
  const canTransfer = amount > 0 && amount <= currentWallet.balance && toWallet

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!toWallet) {
      alert('Please select a recipient')
      return
    }

    if (amount > currentWallet.balance) {
      alert('Insufficient balance')
      return
    }

    setIsSubmitting(true)

    try {
      await transferSemos(toWallet.id, amount, formData.description)
      onSuccess?.()
      onClose()
    } catch (error) {
      alert('Error transferring Semos: ' + (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Transfer Semos
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Current Balance */}
        <div className="mb-6 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
          <div className="text-sm text-gray-600">Your Balance</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">
            {currentWallet.balance.toFixed(2)} Semos
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient */}
          <div>
            <label
              htmlFor="recipient"
              className="block text-sm font-medium text-gray-700"
            >
              Recipient *
            </label>
            <select
              id="recipient"
              required
              value={formData.toMemberId}
              onChange={(e) =>
                setFormData({ ...formData, toMemberId: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a member...</option>
              {otherMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700"
            >
              Amount *
            </label>
            <input
              type="number"
              id="amount"
              required
              min="0.01"
              step="0.01"
              max={currentWallet.balance}
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0.00"
            />
            {amount > currentWallet.balance && (
              <p className="mt-1 text-sm text-red-600">
                Insufficient balance
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description *
            </label>
            <textarea
              id="description"
              required
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="What's this transfer for?"
            />
          </div>

          {/* Preview */}
          {selectedMember && toWallet && amount > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-medium text-gray-900">
                Transaction Preview
              </div>
              <div className="mt-2 space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>To:</span>
                  <span className="font-medium">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">{amount.toFixed(2)} Semos</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span>New Balance:</span>
                  <span className="font-semibold text-gray-900">
                    {(currentWallet.balance - amount).toFixed(2)} Semos
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canTransfer}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Transferring...' : 'Transfer Semos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
