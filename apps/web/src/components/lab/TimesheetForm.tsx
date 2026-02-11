'use client'

import { useState } from 'react'
import { createTimesheet } from '@/actions/lab-management'
import type { TimesheetCategory, PaymentType } from '@terranova/types'

interface TimesheetFormProps {
  onClose: () => void
  onSuccess?: () => void
}

export function TimesheetForm({ onClose, onSuccess }: TimesheetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    category: 'design' as TimesheetCategory,
    paymentType: 'semos' as PaymentType,
    kilometers: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await createTimesheet({
        date: formData.date,
        hours: parseFloat(formData.hours),
        description: formData.description,
        category: formData.category,
        paymentType: formData.paymentType,
        kilometers: parseFloat(formData.kilometers || '0'),
      })

      onSuccess?.()
      onClose()
    } catch (error) {
      alert('Error creating timesheet: ' + (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            New Timesheet Entry
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700"
            >
              Date *
            </label>
            <input
              type="date"
              id="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Hours */}
          <div>
            <label
              htmlFor="hours"
              className="block text-sm font-medium text-gray-700"
            >
              Hours *
            </label>
            <input
              type="number"
              id="hours"
              required
              min="0.25"
              step="0.25"
              value={formData.hours}
              onChange={(e) =>
                setFormData({ ...formData, hours: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="8"
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Category *
            </label>
            <select
              id="category"
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as TimesheetCategory,
                })
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="design">Design</option>
              <option value="formation">Formation</option>
              <option value="administratif">Administratif</option>
              <option value="coordination">Coordination</option>
              <option value="communication">Communication</option>
            </select>
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
              placeholder="Describe your work..."
            />
          </div>

          {/* Payment Type */}
          <div>
            <label
              htmlFor="paymentType"
              className="block text-sm font-medium text-gray-700"
            >
              Payment Type *
            </label>
            <select
              id="paymentType"
              required
              value={formData.paymentType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  paymentType: e.target.value as PaymentType,
                })
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="semos">Semos</option>
              <option value="invoice">Invoice</option>
            </select>
          </div>

          {/* Kilometers */}
          <div>
            <label
              htmlFor="kilometers"
              className="block text-sm font-medium text-gray-700"
            >
              Kilometers
            </label>
            <input
              type="number"
              id="kilometers"
              min="0"
              step="1"
              value={formData.kilometers}
              onChange={(e) =>
                setFormData({ ...formData, kilometers: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

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
              disabled={isSubmitting}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Timesheet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
