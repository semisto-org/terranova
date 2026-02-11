import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemberCard } from '../MemberCard'
import { mockMember, mockGuild, mockWallet } from '@/test/mockData'

describe('MemberCard', () => {
  it('renders member information correctly', () => {
    render(
      <MemberCard
        member={mockMember}
        guilds={[mockGuild]}
        wallet={mockWallet}
      />
    )

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('displays member roles', () => {
    render(
      <MemberCard
        member={mockMember}
        guilds={[mockGuild]}
        wallet={mockWallet}
      />
    )

    expect(screen.getByText('designer')).toBeInTheDocument()
  })

  it('displays guilds', () => {
    render(
      <MemberCard
        member={mockMember}
        guilds={[mockGuild]}
        wallet={mockWallet}
      />
    )

    expect(screen.getByText('Design Guild')).toBeInTheDocument()
  })

  it('displays wallet balance', () => {
    render(
      <MemberCard
        member={mockMember}
        guilds={[mockGuild]}
        wallet={mockWallet}
      />
    )

    expect(screen.getByText('1000.00')).toBeInTheDocument()
  })

  it('shows admin badge for admin users', () => {
    const adminMember = { ...mockMember, isAdmin: true }
    render(
      <MemberCard
        member={adminMember}
        guilds={[mockGuild]}
        wallet={mockWallet}
      />
    )

    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('calls onViewMember when View Profile is clicked', async () => {
    const user = userEvent.setup()
    const onViewMember = vi.fn()

    render(
      <MemberCard
        member={mockMember}
        guilds={[mockGuild]}
        wallet={mockWallet}
        onViewMember={onViewMember}
      />
    )

    await user.click(screen.getByText('View Profile'))
    expect(onViewMember).toHaveBeenCalledWith(mockMember.id)
  })

  it('shows edit button for admin users only', () => {
    const onEditMember = vi.fn()

    const { rerender } = render(
      <MemberCard
        member={mockMember}
        guilds={[mockGuild]}
        wallet={mockWallet}
        onEditMember={onEditMember}
      />
    )

    // Non-admin member - no edit button
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()

    // Admin member - edit button appears
    const adminMember = { ...mockMember, isAdmin: true }
    rerender(
      <MemberCard
        member={adminMember}
        guilds={[mockGuild]}
        wallet={mockWallet}
        onEditMember={onEditMember}
      />
    )

    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('displays joined date', () => {
    render(
      <MemberCard
        member={mockMember}
        guilds={[mockGuild]}
        wallet={mockWallet}
      />
    )

    // Check that joined date is displayed (format varies by locale)
    expect(screen.getByText(/Joined/)).toBeInTheDocument()
  })
})
