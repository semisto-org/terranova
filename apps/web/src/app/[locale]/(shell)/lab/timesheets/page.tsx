import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTimesheets, getMembers } from '@/lib/dal/lab-management'
import { TimesheetsClient } from './TimesheetsClient'

export default async function TimesheetsPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/api/auth/signin')
  }

  // TODO: Get labId from session
  const labId = 'lab-1'

  const [timesheets, members] = await Promise.all([
    getTimesheets(),
    getMembers(labId),
  ])

  // Find current member
  const currentMember = members.find((m) => m.email === session.user.email)

  if (!currentMember) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-500">Member profile not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <TimesheetsClient
        timesheets={timesheets}
        members={members}
        currentMember={currentMember}
      />
    </div>
  )
}
