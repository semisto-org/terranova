import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getMembers,
  getWallets,
  getSemosTransactions,
  getSemosEmissions,
} from '@/lib/dal/lab-management'
import { SemosDashboard } from '@/components/lab/SemosDashboard'

export default async function SemosPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/api/auth/signin')
  }

  // TODO: Get labId from session
  const labId = 'lab-1'

  const [members, wallets, transactions, emissions] = await Promise.all([
    getMembers(labId),
    getWallets(labId),
    getSemosTransactions(),
    getSemosEmissions(labId),
  ])

  // Find current member and wallet
  const currentMember = members.find((m) => m.email === session.user.email)
  const currentWallet = currentMember
    ? wallets.find((w) => w.memberId === currentMember.id)
    : null

  if (!currentMember || !currentWallet) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-500">
            Member profile or wallet not found
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SemosDashboard
        currentMember={currentMember}
        currentWallet={currentWallet}
        members={members}
        wallets={wallets}
        transactions={transactions}
        emissions={emissions}
      />
    </div>
  )
}
