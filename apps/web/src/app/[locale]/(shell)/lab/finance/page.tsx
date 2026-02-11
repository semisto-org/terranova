import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function FinancePage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/api/auth/signin')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Finance</h1>
      <p className="mt-1 text-sm text-gray-500">
        Vue d’ensemble finance et facturation du lab.
      </p>
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <p className="text-gray-600">
          Cette section est en construction. En attendant, vous pouvez utiliser :
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-gray-600">
          <li>
            <Link href="/lab/timesheets" className="text-blue-600 hover:underline">
              Feuilles de temps
            </Link>{' '}
            pour les heures et la facturation.
          </li>
          <li>
            <Link href="/lab/semos" className="text-blue-600 hover:underline">
              Semos
            </Link>{' '}
            pour la monnaie complémentaire.
          </li>
        </ul>
      </div>
    </div>
  )
}
