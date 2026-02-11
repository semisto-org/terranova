import type {
  Member,
  Guild,
  Wallet,
  Pitch,
  Scope,
  Timesheet,
  SemosTransaction,
} from '@terranova/types'

export const mockMember: Member = {
  id: 'member-1',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.jpg',
  roles: ['designer'],
  status: 'active',
  isAdmin: false,
  joinedAt: '2024-01-01T00:00:00.000Z',
  walletId: 'wallet-1',
  guildIds: ['guild-1'],
  labId: 'lab-1',
}

export const mockAdminMember: Member = {
  ...mockMember,
  id: 'admin-1',
  email: 'admin@example.com',
  isAdmin: true,
}

export const mockGuild: Guild = {
  id: 'guild-1',
  name: 'Design Guild',
  description: 'Design team',
  labId: 'lab-1',
  leaderId: mockMember.id,
  memberIds: [mockMember.id],
  color: 'blue',
}

export const mockWallet: Wallet = {
  id: 'wallet-1',
  memberId: mockMember.id,
  balance: 1000,
  floor: 0,
  ceiling: 5000,
}

export const mockPitch: Pitch = {
  id: 'pitch-1',
  title: 'Test Pitch',
  status: 'raw',
  appetite: '6-weeks',
  authorId: mockMember.id,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  problem: 'Test problem',
  solution: 'Test solution',
  rabbitHoles: [],
  noGos: [],
  breadboard: null,
  fatMarkerSketch: null,
}

export const mockScope: Scope = {
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
}

export const mockTimesheet: Timesheet = {
  id: 'timesheet-1',
  memberId: mockMember.id,
  date: '2024-01-15T00:00:00.000Z',
  hours: 8,
  paymentType: 'semos',
  description: 'Test work',
  category: 'design',
  invoiced: false,
  kilometers: 0,
  projectId: null,
  courseId: null,
  guildId: mockGuild.id,
}

export const mockTransaction: SemosTransaction = {
  id: 'tx-1',
  fromWalletId: mockWallet.id,
  toWalletId: 'wallet-2',
  amount: 100,
  description: 'Test payment',
  createdAt: '2024-01-15T00:00:00.000Z',
  type: 'payment',
}
