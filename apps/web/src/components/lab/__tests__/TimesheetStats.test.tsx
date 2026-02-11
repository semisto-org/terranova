import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimesheetStats } from '../TimesheetStats'
import { mockTimesheet } from '@/test/mockData'

describe('TimesheetStats', () => {
  it('calculates total hours correctly', () => {
    const timesheets = [
      { ...mockTimesheet, hours: 8 },
      { ...mockTimesheet, id: 'ts-2', hours: 6.5 },
      { ...mockTimesheet, id: 'ts-3', hours: 4 },
    ]

    render(<TimesheetStats timesheets={timesheets} />)

    expect(screen.getByText('18.5')).toBeInTheDocument()
  })

  it('calculates total kilometers correctly', () => {
    const timesheets = [
      { ...mockTimesheet, kilometers: 25 },
      { ...mockTimesheet, id: 'ts-2', kilometers: 30 },
      { ...mockTimesheet, id: 'ts-3', kilometers: 15 },
    ]

    render(<TimesheetStats timesheets={timesheets} />)

    expect(screen.getByText('70')).toBeInTheDocument()
  })

  it('counts invoiced and pending correctly', () => {
    const timesheets = [
      { ...mockTimesheet, invoiced: true },
      { ...mockTimesheet, id: 'ts-2', invoiced: false },
      { ...mockTimesheet, id: 'ts-3', invoiced: false },
    ]

    render(<TimesheetStats timesheets={timesheets} />)

    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('counts semos and invoice types correctly', () => {
    const timesheets = [
      { ...mockTimesheet, paymentType: 'semos' as const },
      { ...mockTimesheet, id: 'ts-2', paymentType: 'semos' as const },
      { ...mockTimesheet, id: 'ts-3', paymentType: 'invoice' as const },
    ]

    render(<TimesheetStats timesheets={timesheets} />)

    expect(screen.getByText('2 / 1')).toBeInTheDocument()
  })

  it('handles empty timesheets array', () => {
    render(<TimesheetStats timesheets={[]} />)

    expect(screen.getByText('0.0')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    // "0 / 0" appears twice (invoiced/pending and semos/invoice)
    expect(screen.getAllByText('0 / 0').length).toBe(2)
  })

  it('displays correct stat labels', () => {
    render(<TimesheetStats timesheets={[mockTimesheet]} />)

    expect(screen.getByText('Total Hours')).toBeInTheDocument()
    expect(screen.getByText('Total Kilometers')).toBeInTheDocument()
    expect(screen.getByText('Invoiced / Pending')).toBeInTheDocument()
    expect(screen.getByText('Semos / Invoice')).toBeInTheDocument()
  })
})
