import type { Timesheet } from '@terranova/types'

interface TimesheetStatsProps {
  timesheets: Timesheet[]
}

export function TimesheetStats({ timesheets }: TimesheetStatsProps) {
  const totalHours = timesheets.reduce((sum, t) => sum + t.hours, 0)
  const totalKilometers = timesheets.reduce((sum, t) => sum + t.kilometers, 0)
  const invoicedCount = timesheets.filter((t) => t.invoiced).length
  const pendingCount = timesheets.filter((t) => !t.invoiced).length

  const semosCount = timesheets.filter((t) => t.paymentType === 'semos').length
  const invoiceCount = timesheets.filter(
    (t) => t.paymentType === 'invoice'
  ).length

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-sm text-gray-500">Total Hours</div>
        <div className="mt-1 text-2xl font-bold text-gray-900">
          {totalHours.toFixed(1)}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-sm text-gray-500">Total Kilometers</div>
        <div className="mt-1 text-2xl font-bold text-gray-900">
          {totalKilometers.toFixed(0)}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-sm text-gray-500">Invoiced / Pending</div>
        <div className="mt-1 text-2xl font-bold text-gray-900">
          {invoicedCount} / {pendingCount}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-sm text-gray-500">Semos / Invoice</div>
        <div className="mt-1 text-2xl font-bold text-gray-900">
          {semosCount} / {invoiceCount}
        </div>
      </div>
    </div>
  )
}
