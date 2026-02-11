import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getGuilds } from '@/lib/dal/lab-management'

export default async function GuildesPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/api/auth/signin')
  }

  const labId = 'lab-1'
  const guilds = await getGuilds(labId)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Guildes</h1>
      <p className="mt-1 text-sm text-gray-500">
        Groupes et rôles au sein du lab.
      </p>
      <div className="mt-6">
        {guilds.length === 0 ? (
          <p className="text-gray-500">Aucune guilde pour le moment.</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {guilds.map((guild) => (
              <li key={guild.id} className="px-4 py-3">
                <span className="font-medium">{guild.name}</span>
                {guild.description && (
                  <p className="mt-1 text-sm text-gray-500">{guild.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
