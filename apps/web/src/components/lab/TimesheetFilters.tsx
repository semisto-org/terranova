'use client'

import type { TimesheetCategory, PaymentType } from '@terranova/types'

interface TimesheetFiltersProps {
  startDate: string
  endDate: string
  category: string
  paymentType: string
  invoiced: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onPaymentTypeChange: (value: string) => void
  onInvoicedChange: (value: string) => void
  onReset: () => void
}

export function TimesheetFilters({
  startDate,
  endDate,
  category,
  paymentType,
  invoiced,
  onStartDateChange,
  onEndDateChange,
  onCategoryChange,
  onPaymentTypeChange,
  onInvoicedChange,
  onReset,
}: TimesheetFiltersProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        <button
          onClick={onReset}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          Reset
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Start Date */}
        <div>
          <label
            htmlFor="startDate"
            className="block text-xs font-medium text-gray-700"
          >
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label
            htmlFor="endDate"
            className="block text-xs font-medium text-gray-700"
          >
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-xs font-medium text-gray-700"
          >
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="design">Design</option>
            <option value="formation">Formation</option>
            <option value="administratif">Administratif</option>
            <option value="coordination">Coordination</option>
            <option value="communication">Communication</option>
          </select>
        </div>

        {/* Payment Type */}
        <div>
          <label
            htmlFor="paymentType"
            className="block text-xs font-medium text-gray-700"
          >
            Payment Type
          </label>
          <select
            id="paymentType"
            value={paymentType}
            onChange={(e) => onPaymentTypeChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="invoice">Invoice</option>
            <option value="semos">Semos</option>
          </select>
        </div>

        {/* Invoiced */}
        <div>
          <label
            htmlFor="invoiced"
            className="block text-xs font-medium text-gray-700"
          >
            Status
          </label>
          <select
            id="invoiced"
            value={invoiced}
            onChange={(e) => onInvoicedChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="invoiced">Invoiced</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
    </div>
  )
}
