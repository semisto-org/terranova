import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ReportingPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/api/auth/signin')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Reporting</h1>
      <p className="mt-1 text-sm text-gray-500">
        Tableaux de bord et rapports du lab.
      </p>
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <p className="text-gray-600">
          Cette section est en construction. Les rapports et indicateurs seront disponibles ici.
        </p>
      </div>
    </div>
  )
}
