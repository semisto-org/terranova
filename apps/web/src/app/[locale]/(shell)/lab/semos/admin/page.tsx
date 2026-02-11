import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getMembers,
  getWallets,
  getSemosRates,
  getSemosEmissions,
} from '@/lib/dal/lab-management'
import { SemosAdminPanel } from '@/components/lab/SemosAdminPanel'

export default async function SemosAdminPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/api/auth/signin')
  }

  // Check if user is admin
  const userEmail = session.user.email
  const tempMember = await import('@/lib/db').then((mod) =>
    mod.prisma.member.findUnique({
      where: { email: userEmail },
      select: { isAdmin: true },
    })
  )

  if (!tempMember?.isAdmin) {
    redirect('/lab/semos')
  }

  // TODO: Get labId from session
  const labId = 'lab-1'

  const [members, wallets, rates, emissions] = await Promise.all([
    getMembers(labId),
    getWallets(labId),
    getSemosRates(labId),
    getSemosEmissions(labId),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SemosAdminPanel
        members={members}
        wallets={wallets}
        rates={rates}
        emissions={emissions}
      />
    </div>
  )
}
