'use client'

import { useState } from 'react'
import type { Timesheet, Member } from '@terranova/types'
import { TimesheetList } from '@/components/lab/TimesheetList'
import { TimesheetForm } from '@/components/lab/TimesheetForm'
import { useRouter } from 'next/navigation'

interface TimesheetsClientProps {
  timesheets: Timesheet[]
  members: Member[]
  currentMember: Member
}

export function TimesheetsClient({
  timesheets,
  members,
  currentMember,
}: TimesheetsClientProps) {
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <>
      <TimesheetList
        timesheets={timesheets}
        members={members}
        currentMember={currentMember}
        onCreateTimesheet={() => setShowForm(true)}
      />

      {showForm && (
        <TimesheetForm
          onClose={() => setShowForm(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
