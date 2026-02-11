import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock NextAuth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      user: {
        id: 'user-1',
        memberId: 'member-1',
        email: 'test@example.com',
        labId: 'lab-1',
        isAdmin: false,
      },
    })
  ),
}))

// Mock Prisma client
vi.mock('@/lib/db', () => ({
  prisma: {
    member: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    wallet: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    timesheet: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    semosTransaction: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    pitch: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    scope: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    task: {
      create: vi.fn(),
      update: vi.fn(),
    },
    bet: {
      create: vi.fn(),
    },
    cycle: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    hillChartSnapshot: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))
