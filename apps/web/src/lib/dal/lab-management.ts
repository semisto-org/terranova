import { prisma } from '@/lib/db'
import type {
  Pitch,
  Scope,
  Breadboard,
  Member,
  Guild,
  Cycle,
  Event,
  Wallet,
  SemosTransaction,
  SemosEmission,
  SemosRate,
  Timesheet,
  Bet,
  HillChartSnapshot,
  ChowderItem,
  IdeaList,
  IdeaItem,
  ScopePosition,
} from '@terranova/types'

// =============================================================================
// Pitches
// =============================================================================

export async function getPitches(labId: string): Promise<Pitch[]> {
  const pitches = await prisma.pitch.findMany({
    where: { labId },
    include: {
      bets: { include: { betMembers: true } },
      scopes: { include: { tasks: true }, orderBy: { order: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return pitches.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status as Pitch['status'],
    appetite: p.appetite as Pitch['appetite'],
    authorId: p.authorId,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    problem: p.problem,
    solution: p.solution,
    rabbitHoles: p.rabbitHoles,
    noGos: p.noGos,
    breadboard: p.breadboard as Breadboard | null,
    fatMarkerSketch: p.fatMarkerSketch,
  }))
}

export async function getPitchById(pitchId: string): Promise<Pitch | null> {
  const pitch = await prisma.pitch.findUnique({
    where: { id: pitchId },
    include: {
      bets: { include: { betMembers: true } },
      scopes: { include: { tasks: true }, orderBy: { order: 'asc' } },
    },
  })

  if (!pitch) return null

  return {
    id: pitch.id,
    title: pitch.title,
    status: pitch.status as Pitch['status'],
    appetite: pitch.appetite as Pitch['appetite'],
    authorId: pitch.authorId,
    createdAt: pitch.createdAt.toISOString(),
    updatedAt: pitch.updatedAt.toISOString(),
    problem: pitch.problem,
    solution: pitch.solution,
    rabbitHoles: pitch.rabbitHoles,
    noGos: pitch.noGos,
    breadboard: pitch.breadboard as Breadboard | null,
    fatMarkerSketch: pitch.fatMarkerSketch,
  }
}

// =============================================================================
// Bets
// =============================================================================

export async function getBets(cycleId?: string): Promise<Bet[]> {
  const bets = await prisma.bet.findMany({
    where: cycleId ? { cycleId } : undefined,
    include: { betMembers: true },
    orderBy: { placedAt: 'desc' },
  })

  return bets.map((b) => ({
    id: b.id,
    pitchId: b.pitchId,
    cycleId: b.cycleId,
    teamMemberIds: b.betMembers.map((bm) => bm.memberId),
    status: b.status as Bet['status'],
    placedAt: b.placedAt.toISOString(),
    placedBy: b.placedBy,
  }))
}

// =============================================================================
// Scopes & Tasks
// =============================================================================

export async function getScopes(pitchId: string): Promise<Scope[]> {
  const scopes = await prisma.scope.findMany({
    where: { pitchId },
    include: { tasks: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  })

  return scopes.map((s) => ({
    id: s.id,
    pitchId: s.pitchId,
    name: s.name,
    description: s.description,
    hillPosition: s.hillPosition,
    tasks: s.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      isNiceToHave: t.isNiceToHave,
      completed: t.completed,
    })),
  }))
}

// =============================================================================
// Hill Chart Snapshots
// =============================================================================

export async function getHillChartSnapshots(
  pitchId: string
): Promise<HillChartSnapshot[]> {
  const snapshots = await prisma.hillChartSnapshot.findMany({
    where: { pitchId },
    orderBy: { createdAt: 'desc' },
  })

  return snapshots.map((s) => ({
    id: s.id,
    pitchId: s.pitchId,
    createdAt: s.createdAt.toISOString(),
    positions: s.positions as unknown as ScopePosition[],
  }))
}

// =============================================================================
// Chowder
// =============================================================================

export async function getChowderItems(pitchId: string): Promise<ChowderItem[]> {
  const items = await prisma.chowderItem.findMany({
    where: { pitchId },
    orderBy: { createdAt: 'asc' },
  })

  return items.map((i) => ({
    id: i.id,
    pitchId: i.pitchId,
    title: i.title,
    createdAt: i.createdAt.toISOString(),
    createdBy: i.createdBy,
  }))
}

// =============================================================================
// Idea Lists
// =============================================================================

export async function getIdeaLists(labId: string): Promise<IdeaList[]> {
  const lists = await prisma.ideaList.findMany({
    where: { labId },
    include: {
      items: {
        include: { voters: true },
        orderBy: { votes: 'desc' },
      },
    },
  })

  return lists.map((l) => ({
    id: l.id,
    name: l.name,
    description: l.description,
    items: l.items.map((i) => ({
      id: i.id,
      title: i.title,
      createdAt: i.createdAt.toISOString(),
      votes: i.votes,
    })),
  }))
}

// =============================================================================
// Members
// =============================================================================

export async function getMembers(labId: string): Promise<Member[]> {
  const members = await prisma.member.findMany({
    where: { labId },
    include: {
      wallet: true,
      guildMemberships: { include: { guild: true } },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return members.map((m) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    avatar: m.avatar,
    roles: m.roles as Member['roles'],
    status: m.status as Member['status'],
    isAdmin: m.isAdmin,
    joinedAt: m.joinedAt.toISOString(),
    walletId: m.wallet?.id || '',
    guildIds: m.guildMemberships.map((gm) => gm.guildId),
    labId: m.labId,
  }))
}

export async function getMemberById(memberId: string): Promise<Member | null> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      wallet: true,
      guildMemberships: { include: { guild: true } },
    },
  })

  if (!member) return null

  return {
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    avatar: member.avatar,
    roles: member.roles as Member['roles'],
    status: member.status as Member['status'],
    isAdmin: member.isAdmin,
    joinedAt: member.joinedAt.toISOString(),
    walletId: member.wallet?.id || '',
    guildIds: member.guildMemberships.map((gm) => gm.guildId),
    labId: member.labId,
  }
}

// =============================================================================
// Guilds
// =============================================================================

export async function getGuilds(labId: string): Promise<Guild[]> {
  const guilds = await prisma.guild.findMany({
    where: { labId },
    include: { members: true },
  })

  return guilds.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    labId: g.labId,
    leaderId: g.leaderId,
    memberIds: g.members.map((gm) => gm.memberId),
    color: 'blue' as const, // TODO: Add color field to database or derive from name
  }))
}

// =============================================================================
// Cycles
// =============================================================================

export async function getCycles(labId: string): Promise<Cycle[]> {
  const cycles = await prisma.cycle.findMany({
    where: { labId },
    include: { bets: true },
    orderBy: { startDate: 'desc' },
  })

  return cycles.map((c) => ({
    id: c.id,
    name: c.name,
    labId: c.labId,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    cooldownStart: c.cooldownStart.toISOString(),
    cooldownEnd: c.cooldownEnd.toISOString(),
    status: c.status as Cycle['status'],
    betIds: c.bets.map((b) => b.id),
  }))
}

export async function getCurrentCycle(labId: string): Promise<Cycle | null> {
  const now = new Date()
  const cycle = await prisma.cycle.findFirst({
    where: {
      labId,
      startDate: { lte: now },
      cooldownEnd: { gte: now },
    },
    include: { bets: true },
  })

  if (!cycle) return null

  return {
    id: cycle.id,
    name: cycle.name,
    labId: cycle.labId,
    startDate: cycle.startDate.toISOString(),
    endDate: cycle.endDate.toISOString(),
    cooldownStart: cycle.cooldownStart.toISOString(),
    cooldownEnd: cycle.cooldownEnd.toISOString(),
    status: cycle.status as Cycle['status'],
    betIds: cycle.bets.map((b) => b.id),
  }
}

// =============================================================================
// Events
// =============================================================================

export async function getEvents(labId: string): Promise<Event[]> {
  const events = await prisma.event.findMany({
    where: { labId },
    include: { eventAttendees: true },
    orderBy: { startDate: 'desc' },
  })

  return events.map((e) => ({
    id: e.id,
    labId: e.labId,
    title: e.title,
    type: e.type as Event['type'],
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    location: e.location,
    description: e.description,
    attendeeIds: e.eventAttendees.map((ea) => ea.memberId),
    cycleId: e.cycleId,
  }))
}

// =============================================================================
// Wallets & Semos
// =============================================================================

export async function getWallets(labId: string): Promise<Wallet[]> {
  const wallets = await prisma.wallet.findMany({
    where: { member: { labId } },
  })

  return wallets.map((w) => ({
    id: w.id,
    memberId: w.memberId,
    balance: w.balance,
    floor: w.floor,
    ceiling: w.ceiling,
  }))
}

export async function getSemosTransactions(
  walletId?: string
): Promise<SemosTransaction[]> {
  const transactions = await prisma.semosTransaction.findMany({
    where: walletId
      ? { OR: [{ fromWalletId: walletId }, { toWalletId: walletId }] }
      : undefined,
    orderBy: { createdAt: 'desc' },
  })

  return transactions.map((t) => ({
    id: t.id,
    fromWalletId: t.fromWalletId,
    toWalletId: t.toWalletId,
    amount: t.amount,
    description: t.description,
    createdAt: t.createdAt.toISOString(),
    type: t.type as SemosTransaction['type'],
  }))
}

export async function getSemosEmissions(labId: string): Promise<SemosEmission[]> {
  // Get all wallets for this lab first
  const wallets = await prisma.wallet.findMany({
    where: { member: { labId } },
    select: { id: true },
  })
  const walletIds = wallets.map((w) => w.id)

  const emissions = await prisma.semosEmission.findMany({
    where: { walletId: { in: walletIds } },
    orderBy: { createdAt: 'desc' },
  })

  return emissions.map((e) => ({
    id: e.id,
    walletId: e.walletId,
    amount: e.amount,
    reason: e.reason as SemosEmission['reason'],
    description: e.description,
    createdAt: e.createdAt.toISOString(),
    createdBy: e.createdBy,
  }))
}

export async function getSemosRates(labId: string): Promise<SemosRate[]> {
  const rates = await prisma.semosRate.findMany({
    where: { labId },
  })

  return rates.map((r) => ({
    id: r.id,
    labId: r.labId,
    type: r.type as SemosRate['type'],
    amount: r.amount,
    description: r.description,
  }))
}

// =============================================================================
// Timesheets
// =============================================================================

export async function getTimesheets(
  memberId?: string,
  filters?: {
    startDate?: Date
    endDate?: Date
    invoiced?: boolean
  }
): Promise<Timesheet[]> {
  const timesheets = await prisma.timesheet.findMany({
    where: {
      memberId,
      date: {
        gte: filters?.startDate,
        lte: filters?.endDate,
      },
      invoiced: filters?.invoiced,
    },
    orderBy: { date: 'desc' },
  })

  return timesheets.map((t) => ({
    id: t.id,
    memberId: t.memberId,
    date: t.date.toISOString(),
    hours: t.hours,
    paymentType: t.paymentType as Timesheet['paymentType'],
    description: t.description,
    category: t.category as Timesheet['category'],
    invoiced: t.invoiced,
    kilometers: t.kilometers,
    projectId: t.projectId,
    courseId: t.courseId,
    guildId: t.guildId,
  }))
}
