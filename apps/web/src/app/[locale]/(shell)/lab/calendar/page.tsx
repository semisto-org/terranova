import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getEvents,
  getCycles,
  getMembers,
} from '@/lib/dal/lab-management'
import { CalendarView } from '@/components/lab/CalendarView'

export default async function CalendarPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/api/auth/signin')
  }

  // TODO: Get labId from session/user profile
  const labId = 'lab-1'

  const [events, cycles, members] = await Promise.all([
    getEvents(labId),
    getCycles(labId),
    getMembers(labId),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CalendarView events={events} cycles={cycles} members={members} />
    </div>
  )
}
