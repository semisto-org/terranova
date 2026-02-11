'use client'

import { useState } from 'react'
import type { Member, Wallet, SemosRate, SemosEmission, EmissionReason } from '@terranova/types'
import { emitSemos, updateSemosRate } from '@/actions/lab-management'
import { useRouter } from 'next/navigation'

interface SemosAdminPanelProps {
  members: Member[]
  wallets: Wallet[]
  rates: SemosRate[]
  emissions: SemosEmission[]
}

export function SemosAdminPanel({
  members,
  wallets,
  rates,
  emissions,
}: SemosAdminPanelProps) {
  const router = useRouter()
  const [view, setView] = useState<'emit' | 'rates' | 'overview'>('emit')

  // Emit Form State
  const [emitForm, setEmitForm] = useState({
    memberId: '',
    amount: '',
    reason: 'cotisation_member' as EmissionReason,
    description: '',
  })
  const [isEmitting, setIsEmitting] = useState(false)

  // Rate Edit State
  const [editingRate, setEditingRate] = useState<string | null>(null)
  const [rateValues, setRateValues] = useState<Record<string, string>>({})

  const handleEmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const selectedMember = members.find((m) => m.id === emitForm.memberId)
    const wallet = selectedMember
      ? wallets.find((w) => w.memberId === selectedMember.id)
      : null

    if (!wallet) {
      alert('Wallet not found for selected member')
      return
    }

    setIsEmitting(true)
    try {
      await emitSemos(
        wallet.id,
        parseFloat(emitForm.amount),
        emitForm.reason,
        emitForm.description
      )
      setEmitForm({
        memberId: '',
        amount: '',
        reason: 'cotisation_member',
        description: '',
      })
      router.refresh()
    } catch (error) {
      alert('Error emitting Semos: ' + (error as Error).message)
    } finally {
      setIsEmitting(false)
    }
  }

  const handleUpdateRate = async (rateId: string) => {
    const newAmount = parseFloat(rateValues[rateId] || '0')
    if (newAmount <= 0) return

    try {
      await updateSemosRate(rateId, newAmount)
      setEditingRate(null)
      setRateValues({})
      router.refresh()
    } catch (error) {
      alert('Error updating rate: ' + (error as Error).message)
    }
  }

  // Calculate total Semos in circulation
  const totalSemos = wallets.reduce((sum, w) => sum + w.balance, 0)
  const totalEmissions = emissions.reduce((sum, e) => sum + e.amount, 0)

  // Recent emissions
  const recentEmissions = [...emissions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Semos Administration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage emissions and rates
        </p>
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-4">
          <button
            onClick={() => setView('emit')}
            className={`border-b-2 px-1 py-3 text-sm font-medium ${
              view === 'emit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Emit Semos
          </button>
          <button
            onClick={() => setView('rates')}
            className={`border-b-2 px-1 py-3 text-sm font-medium ${
              view === 'rates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Rates
          </button>
          <button
            onClick={() => setView('overview')}
            className={`border-b-2 px-1 py-3 text-sm font-medium ${
              view === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
        </nav>
      </div>

      {/* Emit View */}
      {view === 'emit' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Emit Form */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Emit New Semos
            </h2>

            <form onSubmit={handleEmit} className="space-y-4">
              {/* Member */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Member *
                </label>
                <select
                  required
                  value={emitForm.memberId}
                  onChange={(e) =>
                    setEmitForm({ ...emitForm, memberId: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select a member...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount *
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={emitForm.amount}
                  onChange={(e) =>
                    setEmitForm({ ...emitForm, amount: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason *
                </label>
                <select
                  required
                  value={emitForm.reason}
                  onChange={(e) =>
                    setEmitForm({
                      ...emitForm,
                      reason: e.target.value as EmissionReason,
                    })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="cotisation_member">Member Contribution</option>
                  <option value="volunteer_work">Volunteer Work</option>
                  <option value="provider_fee">Provider Fee</option>
                  <option value="peer_review">Peer Review</option>
                  <option value="loyalty">Loyalty</option>
                  <option value="participation">Participation</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={emitForm.description}
                  onChange={(e) =>
                    setEmitForm({ ...emitForm, description: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Why are these Semos being emitted?"
                />
              </div>

              <button
                type="submit"
                disabled={isEmitting}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isEmitting ? 'Emitting...' : 'Emit Semos'}
              </button>
            </form>
          </div>

          {/* Recent Emissions */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Emissions
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {recentEmissions.map((emission) => {
                const wallet = wallets.find((w) => w.id === emission.walletId)
                const member = wallet
                  ? members.find((m) => m.id === wallet.memberId)
                  : null

                return (
                  <div key={emission.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {member
                            ? `${member.firstName} ${member.lastName}`
                            : 'Unknown'}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {emission.reason} • {emission.description}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          {new Date(emission.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          +{emission.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Rates View */}
      {view === 'rates' && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Semos Rates</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {rates.map((rate) => (
              <div key={rate.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {rate.type.replace(/_/g, ' ')}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {rate.description}
                    </div>
                  </div>

                  {editingRate === rate.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={rateValues[rate.id] || rate.amount}
                        onChange={(e) =>
                          setRateValues({
                            ...rateValues,
                            [rate.id]: e.target.value,
                          })
                        }
                        className="w-24 rounded-md border border-gray-300 px-3 py-1 text-sm"
                      />
                      <button
                        onClick={() => handleUpdateRate(rate.id)}
                        className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingRate(null)
                          setRateValues({})
                        }}
                        className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-semibold text-gray-900">
                        {rate.amount.toFixed(2)} Semos
                      </div>
                      <button
                        onClick={() => {
                          setEditingRate(rate.id)
                          setRateValues({ [rate.id]: rate.amount.toString() })
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview View */}
      {view === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="text-sm text-gray-500">Total in Circulation</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {totalSemos.toFixed(2)}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="text-sm text-gray-500">Total Emissions</div>
              <div className="mt-2 text-3xl font-bold text-green-600">
                {totalEmissions.toFixed(2)}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="text-sm text-gray-500">Active Wallets</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {wallets.length}
              </div>
            </div>
          </div>

          {/* Wallet List */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                All Wallets
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Member
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                      Floor
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                      Ceiling
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {wallets.map((wallet) => {
                    const member = members.find((m) => m.id === wallet.memberId)
                    return (
                      <tr key={wallet.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {member
                            ? `${member.firstName} ${member.lastName}`
                            : 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                          {wallet.balance.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-600">
                          {wallet.floor.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-600">
                          {wallet.ceiling.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
