import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ShapeUpWorkboard } from '../ShapeUpWorkboard'
import { mockPitch, mockMember } from '@/test/mockData'

describe('ShapeUpWorkboard', () => {
  const defaultProps = {
    pitches: [mockPitch],
    currentMemberId: mockMember.id,
    members: [mockMember],
    cycles: [],
    bets: [],
    chowderItems: [],
    ideaLists: [],
  }

  it('renders without crashing', () => {
    const { container } = render(<ShapeUpWorkboard {...defaultProps} />)
    expect(container).toBeInTheDocument()
  })

  it('handles empty pitches array', () => {
    const { container } = render(<ShapeUpWorkboard {...defaultProps} pitches={[]} />)
    expect(container).toBeInTheDocument()
  })
})
