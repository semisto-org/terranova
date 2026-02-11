import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SemosDashboard } from '../SemosDashboard'
import { mockWallet, mockMember, mockTransaction } from '@/test/mockData'

describe('SemosDashboard', () => {
  const defaultProps = {
    currentMember: mockMember,
    currentWallet: mockWallet,
    members: [mockMember],
    wallets: [mockWallet],
    transactions: [mockTransaction],
    emissions: [],
  }

  it('renders without crashing', () => {
    const { container } = render(<SemosDashboard {...defaultProps} />)
    expect(container).toBeInTheDocument()
  })

  it('displays wallet balance', () => {
    render(<SemosDashboard {...defaultProps} />)

    // Balance should be displayed somewhere
    expect(screen.getByText(/1000/)).toBeInTheDocument()
  })

  it('shows transaction description', () => {
    render(<SemosDashboard {...defaultProps} />)

    expect(screen.getByText('Test payment')).toBeInTheDocument()
  })

  it('handles empty transactions array', () => {
    render(<SemosDashboard {...defaultProps} transactions={[]} />)

    // Should render without errors
    expect(screen.queryByText('Test payment')).not.toBeInTheDocument()
  })
})
