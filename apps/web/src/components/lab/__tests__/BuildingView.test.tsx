import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BuildingView } from '../BuildingView'
import { mockPitch } from '@/test/mockData'

describe('BuildingView', () => {
  const scopes = [
    {
      id: 'scope-1',
      pitchId: mockPitch.id,
      name: 'Test Scope',
      description: 'Test scope description',
      hillPosition: 25,
      tasks: [
        {
          id: 'task-1',
          title: 'Test task',
          isNiceToHave: false,
          completed: false,
        },
      ],
    },
  ]

  const defaultProps = {
    pitch: mockPitch,
    scopes,
    chowderItems: [],
    hillChartSnapshots: [],
  }

  it('renders without crashing', () => {
    const { container} = render(<BuildingView {...defaultProps} />)
    expect(container).toBeInTheDocument()
  })

  it('displays pitch title', () => {
    render(<BuildingView {...defaultProps} />)

    expect(screen.getByText('Test Pitch')).toBeInTheDocument()
  })

  it('displays scope name', () => {
    render(<BuildingView {...defaultProps} />)

    // Scope name should appear somewhere (multiple times in SVG and legend)
    const scopeTexts = screen.getAllByText('Test Scope')
    expect(scopeTexts.length).toBeGreaterThan(0)
  })
})
