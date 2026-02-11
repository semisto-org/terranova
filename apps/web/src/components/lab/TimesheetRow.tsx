'use client'

import type { Timesheet, Member } from '@terranova/types'
import { markTimesheetInvoiced, deleteTimesheet } from '@/actions/lab-management'
import { useState } from 'react'

interface TimesheetRowProps {
  timesheet: Timesheet
  member: Member | undefined
  currentMember: Member
  onEdit?: (timesheetId: string) => void
}

export function TimesheetRow({
  timesheet,
  member,
  currentMember,
  onEdit,
}: TimesheetRowProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMarkingInvoiced, setIsMarkingInvoiced] = useState(false)

  const canEdit =
    timesheet.memberId === currentMember.id || currentMember.isAdmin
  const canMarkInvoiced = currentMember.isAdmin && !timesheet.invoiced

  const handleMarkInvoiced = async () => {
    if (!confirm('Mark this timesheet as invoiced?')) return

    setIsMarkingInvoiced(true)
    try {
      await markTimesheetInvoiced(timesheet.id)
    } catch (error) {
      alert('Error marking as invoiced: ' + (error as Error).message)
    } finally {
      setIsMarkingInvoiced(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this timesheet?')) return

    setIsDeleting(true)
    try {
      await deleteTimesheet(timesheet.id)
    } catch (error) {
      alert('Error deleting timesheet: ' + (error as Error).message)
    } finally {
      setIsDeleting(false)
    }
  }

  const categoryColors: Record<string, string> = {
    design: 'bg-blue-100 text-blue-800',
    formation: 'bg-green-100 text-green-800',
    administratif: 'bg-gray-100 text-gray-800',
    coordination: 'bg-purple-100 text-purple-800',
    communication: 'bg-orange-100 text-orange-800',
  }

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      {/* Date */}
      <td className="px-4 py-3 text-sm text-gray-900">
        {new Date(timesheet.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </td>

      {/* Member (if admin view) */}
      {currentMember.isAdmin && (
        <td className="px-4 py-3 text-sm text-gray-900">
          {member ? `${member.firstName} ${member.lastName}` : 'Unknown'}
        </td>
      )}

      {/* Hours */}
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {timesheet.hours}h
      </td>

      {/* Category */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            categoryColors[timesheet.category] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {timesheet.category}
        </span>
      </td>

      {/* Description */}
      <td className="px-4 py-3 text-sm text-gray-600">
        <div className="max-w-xs truncate">{timesheet.description}</div>
      </td>

      {/* Payment Type */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            timesheet.paymentType === 'semos'
              ? 'bg-indigo-100 text-indigo-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {timesheet.paymentType}
        </span>
      </td>

      {/* Kilometers */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {timesheet.kilometers > 0 ? `${timesheet.kilometers} km` : '-'}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {timesheet.invoiced ? (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            Invoiced
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
            Pending
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex gap-2">
          {canEdit && onEdit && (
            <button
              onClick={() => onEdit(timesheet.id)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          )}
          {canMarkInvoiced && (
            <button
              onClick={handleMarkInvoiced}
              disabled={isMarkingInvoiced}
              className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
            >
              {isMarkingInvoiced ? 'Marking...' : 'Mark Invoiced'}
            </button>
          )}
          {canEdit && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
