import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCycles } from '@/lib/dal/lab-management'

export default async function CyclesPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/api/auth/signin')
  }

  const labId = 'lab-1'
  const cycles = await getCycles(labId)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Cycles</h1>
      <p className="mt-1 text-sm text-gray-500">
        Gestion des cycles Shape Up (Building / Cooldown).
      </p>
      <div className="mt-6">
        {cycles.length === 0 ? (
          <p className="text-gray-500">Aucun cycle pour le moment.</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {cycles.map((cycle) => (
              <li key={cycle.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-medium">{cycle.name}</span>
                <span className="text-sm text-gray-500">
                  {new Date(cycle.startDate).toLocaleDateString('fr-FR')} –{' '}
                  {new Date(cycle.endDate).toLocaleDateString('fr-FR')} · {cycle.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
