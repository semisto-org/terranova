'use client'

import { useState } from 'react'
import type { Timesheet, Member } from '@terranova/types'
import { TimesheetRow } from './TimesheetRow'
import { TimesheetFilters } from './TimesheetFilters'
import { TimesheetStats } from './TimesheetStats'

interface TimesheetListProps {
  timesheets: Timesheet[]
  members: Member[]
  currentMember: Member
  onCreateTimesheet?: () => void
  onEditTimesheet?: (timesheetId: string) => void
}

export function TimesheetList({
  timesheets,
  members,
  currentMember,
  onCreateTimesheet,
  onEditTimesheet,
}: TimesheetListProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [category, setCategory] = useState('all')
  const [paymentType, setPaymentType] = useState('all')
  const [invoiced, setInvoiced] = useState('all')

  // Filter timesheets
  const filteredTimesheets = timesheets.filter((timesheet) => {
    // Date filter
    if (startDate && new Date(timesheet.date) < new Date(startDate)) {
      return false
    }
    if (endDate && new Date(timesheet.date) > new Date(endDate)) {
      return false
    }

    // Category filter
    if (category !== 'all' && timesheet.category !== category) {
      return false
    }

    // Payment type filter
    if (paymentType !== 'all' && timesheet.paymentType !== paymentType) {
      return false
    }

    // Invoiced filter
    if (invoiced === 'invoiced' && !timesheet.invoiced) {
      return false
    }
    if (invoiced === 'pending' && timesheet.invoiced) {
      return false
    }

    return true
  })

  // Sort by date (newest first)
  const sortedTimesheets = [...filteredTimesheets].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const handleReset = () => {
    setStartDate('')
    setEndDate('')
    setCategory('all')
    setPaymentType('all')
    setInvoiced('all')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Timesheets</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filteredTimesheets.length} of {timesheets.length} timesheets
          </p>
        </div>

        {onCreateTimesheet && (
          <button
            onClick={onCreateTimesheet}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Timesheet
          </button>
        )}
      </div>

      {/* Stats */}
      <TimesheetStats timesheets={filteredTimesheets} />

      {/* Filters */}
      <TimesheetFilters
        startDate={startDate}
        endDate={endDate}
        category={category}
        paymentType={paymentType}
        invoiced={invoiced}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onCategoryChange={setCategory}
        onPaymentTypeChange={setPaymentType}
        onInvoicedChange={setInvoiced}
        onReset={handleReset}
      />

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {sortedTimesheets.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No timesheets found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Date
                  </th>
                  {currentMember.isAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Member
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Hours
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Km
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTimesheets.map((timesheet) => {
                  const member = members.find(
                    (m) => m.id === timesheet.memberId
                  )
                  return (
                    <TimesheetRow
                      key={timesheet.id}
                      timesheet={timesheet}
                      member={member}
                      currentMember={currentMember}
                      onEdit={onEditTimesheet}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
