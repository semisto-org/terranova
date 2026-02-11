# Testing Infrastructure

## Overview

The Terranova web app uses **Vitest** and **React Testing Library** for component and integration testing.

## Test Stack

- **Vitest**: Fast unit test framework (compatible with Jest)
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom matchers for DOM assertions
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM implementation for Node.js

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

## Test Structure

```
apps/web/src/
├── components/lab/__tests__/
│   ├── BuildingView.test.tsx
│   ├── HillChart.test.tsx
│   ├── MemberCard.test.tsx
│   ├── SemosDashboard.test.tsx
│   ├── ShapeUpWorkboard.test.tsx
│   └── TimesheetStats.test.tsx
├── test/
│   ├── setup.ts           # Test environment setup
│   └── mockData.ts        # Shared mock data
└── vitest.config.ts       # Vitest configuration
```

## Current Test Coverage

### Component Tests (30 tests)

1. **MemberCard** (8 tests)
   - Rendering member information
   - Displaying roles and guilds
   - Showing wallet balance
   - Admin badge display
   - Callback functionality

2. **HillChart** (7 tests)
   - SVG rendering
   - Phase labels
   - Scope dots positioning
   - Legend display
   - Task completion tracking
   - Empty state handling
   - Multiple scopes with colors

3. **TimesheetStats** (6 tests)
   - Total hours calculation
   - Total kilometers calculation
   - Invoiced/pending counts
   - Payment type counts
   - Empty state handling
   - Stat labels display

4. **SemosDashboard** (4 tests)
   - Basic rendering
   - Wallet balance display
   - Transaction display
   - Empty state handling

5. **ShapeUpWorkboard** (2 tests)
   - Basic rendering
   - Empty pitches handling

6. **BuildingView** (3 tests)
   - Basic rendering
   - Pitch title display
   - Scope name display

## Mock Setup

### Global Mocks (test/setup.ts)

- **next/navigation**: Router, pathname, search params
- **next/cache**: revalidatePath, revalidateTag
- **@/lib/auth**: NextAuth session
- **@/lib/db**: Prisma client methods

### Mock Data (test/mockData.ts)

Provides realistic mock objects for:
- Members (regular and admin)
- Guilds
- Wallets
- Pitches
- Scopes
- Timesheets
- Semos transactions

## Writing New Tests

### Example Component Test

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyComponent } from '../MyComponent'
import { mockMember } from '@/test/mockData'

describe('MyComponent', () => {
  it('renders component', () => {
    render(<MyComponent member={mockMember} />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
  })
})
```

### Example User Interaction Test

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('MyForm', () => {
  it('handles form submission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<MyForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Name'), 'John Doe')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(onSubmit).toHaveBeenCalledWith({ name: 'John Doe' })
  })
})
```

## Test Best Practices

1. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
2. **Test user behavior**: Focus on what users see and do, not implementation details
3. **Use mock data**: Leverage `test/mockData.ts` for consistent test data
4. **Clean tests**: Each test should be independent and clean up after itself
5. **Descriptive names**: Test names should clearly state what they're testing

## Common Patterns

### Multiple Elements with Same Text

When testing components that render the same text multiple times (e.g., in SVG titles and legends):

```typescript
// Use getAllByText instead of getByText
const scopeTexts = screen.getAllByText('Test Scope')
expect(scopeTexts.length).toBeGreaterThan(0)
```

### Testing Empty States

```typescript
it('handles empty data', () => {
  render(<MyList items={[]} />)

  expect(screen.queryByText('Item 1')).not.toBeInTheDocument()
  expect(screen.getByText(/No items/i)).toBeInTheDocument()
})
```

### Testing Client Components

Client components ('use client') that use hooks like `useState` or `useRouter` are automatically handled by the mocks in `test/setup.ts`.

## Next Steps

To expand test coverage, consider adding:

1. **Server Action Tests**: Test mutations with mocked Prisma calls
2. **Integration Tests**: Test full user flows across multiple components
3. **E2E Tests**: Consider Playwright for critical user journeys
4. **API Route Tests**: Test Next.js API routes
5. **Accessibility Tests**: Add `@axe-core/react` for a11y testing

## Troubleshooting

### Module Resolution Errors

If you see "Cannot find module" errors:
- Check that all imports use path aliases (`@/...`)
- Ensure `vitest.config.ts` has correct path resolution

### Component Not Rendering

- Check that props match the component's actual interface
- Verify mock data has all required fields
- Look for console errors in test output

### Async Operations

For async operations, use `waitFor` or `findBy*` queries:

```typescript
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

## CI/CD Integration

To run tests in CI pipelines:

```yaml
- name: Run tests
  run: pnpm test --run
```

The `--run` flag ensures tests run once and exit (no watch mode).
