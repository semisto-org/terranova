import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getMembers,
  getCycles,
  getPitches,
  getBets,
  getScopes,
  getEvents,
  getWallets,
  getSemosTransactions,
} from '@/lib/dal/lab-management'
import { Dashboard } from '@/components/lab/Dashboard'

export default async function LabDashboardPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/api/auth/signin')
  }

  // TODO: Get labId from session/user profile
  const labId = 'lab-1'

  const [
    members,
    cycles,
    pitches,
    bets,
    events,
    wallets,
    transactions,
  ] = await Promise.all([
    getMembers(labId),
    getCycles(labId),
    getPitches(labId),
    getBets(),
    getEvents(labId),
    getWallets(labId),
    getSemosTransactions(),
  ])

  // Get scopes for all pitches
  const allScopesPromises = pitches.map((p) => getScopes(p.id))
  const allScopesArrays = await Promise.all(allScopesPromises)
  const scopes = allScopesArrays.flat()

  // Find current member by email
  const currentMember = members.find((m) => m.email === session.user.email)
  const currentMemberId = currentMember?.id || ''

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Dashboard
        members={members}
        cycles={cycles}
        pitches={pitches}
        bets={bets}
        scopes={scopes}
        events={events}
        wallets={wallets}
        transactions={transactions}
        currentMemberId={currentMemberId}
      />
    </div>
  )
}
