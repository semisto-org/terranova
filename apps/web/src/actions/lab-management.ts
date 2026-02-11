'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =============================================================================
// Validation Schemas
// =============================================================================

const timesheetSchema = z.object({
  date: z.string(),
  hours: z.number().positive(),
  description: z.string(),
  category: z.enum([
    'design',
    'formation',
    'administratif',
    'coordination',
    'communication',
  ]),
  paymentType: z.enum(['invoice', 'semos']),
  kilometers: z.number().min(0).default(0),
  projectId: z.string().optional(),
  courseId: z.string().optional(),
  guildId: z.string().optional(),
})

const pitchSchema = z.object({
  title: z.string().min(1),
  problem: z.string().min(1),
  solution: z.string().min(1),
  appetite: z.enum(['2-weeks', '3-weeks', '6-weeks']),
  rabbitHoles: z.array(z.string()).default([]),
  noGos: z.array(z.string()).default([]),
  breadboard: z.any().optional(),
  fatMarkerSketch: z.string().optional(),
})

// =============================================================================
// Timesheet Actions
// =============================================================================

export async function createTimesheet(
  data: z.infer<typeof timesheetSchema>
) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const validated = timesheetSchema.parse(data)

  await prisma.timesheet.create({
    data: {
      ...validated,
      date: new Date(validated.date),
      memberId: session.user.id!,
    },
  })

  revalidatePath('/lab/timesheets')
  return { success: true }
}

export async function updateTimesheet(
  timesheetId: string,
  data: z.infer<typeof timesheetSchema>
) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const validated = timesheetSchema.parse(data)

  // Verify ownership
  const timesheet = await prisma.timesheet.findUnique({
    where: { id: timesheetId },
  })

  if (!timesheet || timesheet.memberId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  await prisma.timesheet.update({
    where: { id: timesheetId },
    data: {
      ...validated,
      date: new Date(validated.date),
    },
  })

  revalidatePath('/lab/timesheets')
  return { success: true }
}

export async function deleteTimesheet(timesheetId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  // Verify ownership or admin
  const timesheet = await prisma.timesheet.findUnique({
    where: { id: timesheetId },
    include: { member: true },
  })

  if (
    !timesheet ||
    (timesheet.memberId !== session.user.id && !timesheet.member.isAdmin)
  ) {
    throw new Error('Unauthorized')
  }

  await prisma.timesheet.delete({
    where: { id: timesheetId },
  })

  revalidatePath('/lab/timesheets')
  return { success: true }
}

export async function markTimesheetInvoiced(timesheetId: string) {
  const session = await auth()
  const member = await prisma.member.findUnique({
    where: { email: session?.user?.email! },
  })

  if (!member?.isAdmin) throw new Error('Unauthorized - Admin only')

  await prisma.timesheet.update({
    where: { id: timesheetId },
    data: { invoiced: true },
  })

  revalidatePath('/lab/timesheets')
  return { success: true }
}

// =============================================================================
// Semos Actions
// =============================================================================

export async function transferSemos(
  toWalletId: string,
  amount: number,
  description: string
) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')

  const member = await prisma.member.findUnique({
    where: { email: session.user.email },
    include: { wallet: true },
  })

  if (!member?.wallet) throw new Error('Wallet not found')

  const fromWallet = member.wallet

  if (fromWallet.balance < amount) {
    throw new Error('Insufficient balance')
  }

  await prisma.$transaction([
    prisma.semosTransaction.create({
      data: {
        fromWalletId: fromWallet.id,
        toWalletId,
        amount,
        description,
        type: 'transfer',
      },
    }),
    prisma.wallet.update({
      where: { id: fromWallet.id },
      data: { balance: { decrement: amount } },
    }),
    prisma.wallet.update({
      where: { id: toWalletId },
      data: { balance: { increment: amount } },
    }),
  ])

  revalidatePath('/lab/semos')
  revalidatePath('/lab')
  return { success: true }
}

export async function emitSemos(
  walletId: string,
  amount: number,
  reason: string,
  description: string
) {
  const session = await auth()
  const member = await prisma.member.findUnique({
    where: { email: session?.user?.email! },
  })

  if (!member?.isAdmin) throw new Error('Unauthorized - Admin only')

  await prisma.$transaction([
    prisma.semosEmission.create({
      data: {
        walletId,
        amount,
        reason,
        description,
        createdBy: member.id,
      },
    }),
    prisma.wallet.update({
      where: { id: walletId },
      data: { balance: { increment: amount } },
    }),
  ])

  revalidatePath('/lab/semos')
  revalidatePath('/lab/semos/admin')
  return { success: true }
}

export async function updateSemosRate(rateId: string, newAmount: number) {
  const session = await auth()
  const member = await prisma.member.findUnique({
    where: { email: session?.user?.email! },
  })

  if (!member?.isAdmin) throw new Error('Unauthorized - Admin only')

  await prisma.semosRate.update({
    where: { id: rateId },
    data: { amount: newAmount },
  })

  revalidatePath('/lab/semos/admin')
  return { success: true }
}

// =============================================================================
// Pitch Actions
// =============================================================================

export async function createPitch(data: z.infer<typeof pitchSchema>) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')

  const member = await prisma.member.findUnique({
    where: { email: session.user.email },
  })

  if (!member) throw new Error('Member not found')

  const validated = pitchSchema.parse(data)

  const pitch = await prisma.pitch.create({
    data: {
      ...validated,
      authorId: member.id,
      labId: member.labId,
      status: 'raw',
    },
  })

  revalidatePath('/lab/shape-up')
  return { success: true, pitchId: pitch.id }
}

export async function updatePitch(
  pitchId: string,
  data: Partial<z.infer<typeof pitchSchema>>
) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')

  await prisma.pitch.update({
    where: { id: pitchId },
    data,
  })

  revalidatePath('/lab/shape-up')
  return { success: true }
}

export async function updatePitchStatus(pitchId: string, status: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  await prisma.pitch.update({
    where: { id: pitchId },
    data: { status },
  })

  revalidatePath('/lab/shape-up')
  return { success: true }
}

export async function deletePitch(pitchId: string) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')

  const member = await prisma.member.findUnique({
    where: { email: session.user.email },
  })

  const pitch = await prisma.pitch.findUnique({
    where: { id: pitchId },
  })

  if (!pitch || (pitch.authorId !== member?.id && !member?.isAdmin)) {
    throw new Error('Unauthorized')
  }

  await prisma.pitch.delete({
    where: { id: pitchId },
  })

  revalidatePath('/lab/shape-up')
  return { success: true }
}

// =============================================================================
// Betting Actions
// =============================================================================

export async function placeBet(
  pitchId: string,
  cycleId: string,
  teamMemberIds: string[]
) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')

  const member = await prisma.member.findUnique({
    where: { email: session.user.email },
  })

  if (!member?.isAdmin) throw new Error('Unauthorized - Admin only')

  // Verify cycle is in cooldown
  const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } })
  if (cycle?.status !== 'cooldown') {
    throw new Error('Betting is only allowed during cooldown period')
  }

  await prisma.$transaction([
    prisma.bet.create({
      data: {
        pitchId,
        cycleId,
        status: 'pending',
        placedBy: member.id,
        betMembers: {
          create: teamMemberIds.map((memberId) => ({ memberId })),
        },
      },
    }),
    prisma.pitch.update({
      where: { id: pitchId },
      data: { status: 'betting' },
    }),
  ])

  revalidatePath('/lab/shape-up')
  return { success: true }
}

export async function removeBet(betId: string) {
  const session = await auth()
  const member = await prisma.member.findUnique({
    where: { email: session?.user?.email! },
  })

  if (!member?.isAdmin) throw new Error('Unauthorized - Admin only')

  await prisma.bet.delete({
    where: { id: betId },
  })

  revalidatePath('/lab/shape-up')
  return { success: true }
}

// =============================================================================
// Scope & Task Actions
// =============================================================================

export async function createScope(
  pitchId: string,
  name: string,
  description: string
) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const scope = await prisma.scope.create({
    data: { pitchId, name, description, hillPosition: 0 },
  })

  // Create initial snapshot
  const allScopes = await prisma.scope.findMany({ where: { pitchId } })
  await prisma.hillChartSnapshot.create({
    data: {
      pitchId,
      positions: allScopes.map((s) => ({
        scopeId: s.id,
        position: s.hillPosition,
      })),
    },
  })

  revalidatePath('/lab/shape-up')
  return { success: true, scopeId: scope.id }
}

export async function updateHillPosition(scopeId: string, position: number) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const scope = await prisma.scope.update({
    where: { id: scopeId },
    data: { hillPosition: position },
  })

  // Create snapshot
  const allScopes = await prisma.scope.findMany({
    where: { pitchId: scope.pitchId },
  })
  await prisma.hillChartSnapshot.create({
    data: {
      pitchId: scope.pitchId,
      positions: allScopes.map((s) => ({
        scopeId: s.id,
        position: s.hillPosition,
      })),
    },
  })

  revalidatePath('/lab/shape-up')
  return { success: true }
}

export async function addTask(
  scopeId: string,
  title: string,
  isNiceToHave: boolean
) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  await prisma.task.create({
    data: { scopeId, title, isNiceToHave },
  })

  revalidatePath('/lab/shape-up')
  return { success: true }
}

export async function toggleTask(taskId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  await prisma.task.update({
    where: { id: taskId },
    data: { completed: !task?.completed },
  })

  revalidatePath('/lab/shape-up')
  return { success: true }
}

// =============================================================================
// Chowder Actions
// =============================================================================

export async function addChowderItem(pitchId: string, title: string) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')

  const member = await prisma.member.findUnique({
    where: { email: session.user.email },
  })

  if (!member) throw new Error('Member not found')

  await prisma.chowderItem.create({
    data: { pitchId, title, createdBy: member.id },
  })

  revalidatePath('/lab/shape-up')
  return { success: true }
}

export async function moveChowderToScope(itemId: string, scopeId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const item = await prisma.chowderItem.findUnique({ where: { id: itemId } })
  if (!item) throw new Error('Item not found')

  await prisma.$transaction([
    prisma.task.create({
      data: { scopeId, title: item.title, isNiceToHave: false },
    }),
    prisma.chowderItem.delete({ where: { id: itemId } }),
  ])

  revalidatePath('/lab/shape-up')
  return { success: true }
}

// =============================================================================
// Idea List Actions
// =============================================================================

export async function addIdea(listId: string, title: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  await prisma.ideaItem.create({
    data: { listId, title },
  })

  revalidatePath('/lab/shape-up')
  return { success: true }
}

export async function voteIdea(ideaId: string) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')

  const member = await prisma.member.findUnique({
    where: { email: session.user.email },
  })

  if (!member) throw new Error('Member not found')

  // Check if already voted
  const existingVote = await prisma.ideaVote.findUnique({
    where: {
      itemId_memberId: {
        itemId: ideaId,
        memberId: member.id,
      },
    },
  })

  if (existingVote) {
    // Remove vote
    await prisma.$transaction([
      prisma.ideaVote.delete({
        where: { id: existingVote.id },
      }),
      prisma.ideaItem.update({
        where: { id: ideaId },
        data: { votes: { decrement: 1 } },
      }),
    ])
  } else {
    // Add vote
    await prisma.$transaction([
      prisma.ideaVote.create({
        data: { itemId: ideaId, memberId: member.id },
      }),
      prisma.ideaItem.update({
        where: { id: ideaId },
        data: { votes: { increment: 1 } },
      }),
    ])
  }

  revalidatePath('/lab/shape-up')
  return { success: true }
}

// =============================================================================
// Event Actions
// =============================================================================

export async function createEvent(data: {
  title: string
  type: string
  startDate: string
  endDate: string
  location: string
  description: string
  attendeeIds: string[]
  cycleId?: string
}) {
  const session = await auth()
  const member = await prisma.member.findUnique({
    where: { email: session?.user?.email! },
  })

  if (!member?.isAdmin) throw new Error('Unauthorized - Admin only')

  await prisma.event.create({
    data: {
      ...data,
      labId: member.labId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      eventAttendees: {
        create: data.attendeeIds.map((memberId) => ({ memberId })),
      },
    },
  })

  revalidatePath('/lab/calendar')
  revalidatePath('/lab')
  return { success: true }
}

export async function updateEvent(
  eventId: string,
  data: Partial<{
    title: string
    type: string
    startDate: string
    endDate: string
    location: string
    description: string
    attendeeIds: string[]
  }>
) {
  const session = await auth()
  const member = await prisma.member.findUnique({
    where: { email: session?.user?.email! },
  })

  if (!member?.isAdmin) throw new Error('Unauthorized - Admin only')

  const updateData: any = { ...data }
  if (data.startDate) updateData.startDate = new Date(data.startDate)
  if (data.endDate) updateData.endDate = new Date(data.endDate)

  if (data.attendeeIds) {
    // Update attendees
    await prisma.eventAttendee.deleteMany({ where: { eventId } })
    updateData.eventAttendees = {
      create: data.attendeeIds.map((memberId) => ({ memberId })),
    }
    delete updateData.attendeeIds
  }

  await prisma.event.update({
    where: { id: eventId },
    data: updateData,
  })

  revalidatePath('/lab/calendar')
  revalidatePath('/lab')
  return { success: true }
}

export async function deleteEvent(eventId: string) {
  const session = await auth()
  const member = await prisma.member.findUnique({
    where: { email: session?.user?.email! },
  })

  if (!member?.isAdmin) throw new Error('Unauthorized - Admin only')

  await prisma.event.delete({
    where: { id: eventId },
  })

  revalidatePath('/lab/calendar')
  revalidatePath('/lab')
  return { success: true }
}
