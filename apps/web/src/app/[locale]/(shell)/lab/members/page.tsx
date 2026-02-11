import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMembers, getGuilds, getWallets } from '@/lib/dal/lab-management'
import { MemberList } from '@/components/lab/MemberList'

export default async function MembersPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/api/auth/signin')
  }

  // TODO: Get labId from session/user profile
  // For now, using a placeholder
  const labId = 'lab-1'

  const [members, guilds, wallets] = await Promise.all([
    getMembers(labId),
    getGuilds(labId),
    getWallets(labId),
  ])

  // Find current member by email
  const currentMember = members.find((m) => m.email === session.user.email)
  const currentMemberId = currentMember?.id || ''

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <MemberList
        members={members}
        guilds={guilds}
        wallets={wallets}
        currentMemberId={currentMemberId}
      />
    </div>
  )
}
