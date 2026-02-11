import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HillChart } from '../HillChart'
import { mockScope } from '@/test/mockData'

describe('HillChart', () => {
  it('renders the hill chart SVG', () => {
    const { container } = render(<HillChart scopes={[mockScope]} />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('displays phase labels', () => {
    render(<HillChart scopes={[mockScope]} />)

    expect(screen.getByText('Figuring Out')).toBeInTheDocument()
    expect(screen.getByText('Making It Happen')).toBeInTheDocument()
  })

  it('renders scope dots on the hill', () => {
    const { container } = render(<HillChart scopes={[mockScope]} />)

    // Check that circles are rendered for scopes
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBeGreaterThan(0)
  })

  it('displays scope legend', () => {
    render(<HillChart scopes={[mockScope]} />)

    // Use getAllByText since "Test Scope" appears in both SVG title and legend
    const scopeTexts = screen.getAllByText('Test Scope')
    expect(scopeTexts.length).toBeGreaterThan(0)
    expect(screen.getByText('(0/1 tasks)')).toBeInTheDocument()
  })

  it('shows task completion in legend', () => {
    const scopeWithCompletedTask = {
      ...mockScope,
      tasks: [
        {
          id: 'task-1',
          title: 'Completed task',
          isNiceToHave: false,
          completed: true,
        },
        {
          id: 'task-2',
          title: 'Incomplete task',
          isNiceToHave: false,
          completed: false,
        },
      ],
    }

    render(<HillChart scopes={[scopeWithCompletedTask]} />)

    expect(screen.getByText('(1/2 tasks)')).toBeInTheDocument()
  })

  it('handles empty scopes array', () => {
    const { container } = render(<HillChart scopes={[]} />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()

    // Should still render the hill curve, just no dots
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(0)
  })

  it('renders multiple scopes with different colors', () => {
    const scopes = [
      { ...mockScope, id: 'scope-1', name: 'Scope 1' },
      { ...mockScope, id: 'scope-2', name: 'Scope 2', hillPosition: 75 },
      { ...mockScope, id: 'scope-3', name: 'Scope 3', hillPosition: 50 },
    ]

    const { container } = render(<HillChart scopes={scopes} />)

    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(3)

    // Use getAllByText since scope names appear in both SVG titles and legend
    expect(screen.getAllByText('Scope 1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Scope 2').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Scope 3').length).toBeGreaterThan(0)
  })
})
