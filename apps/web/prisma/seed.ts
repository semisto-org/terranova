import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clean existing data (in reverse order of dependencies)
  console.log('Cleaning existing data...')
  await prisma.ideaVote.deleteMany()
  await prisma.ideaItem.deleteMany()
  await prisma.ideaList.deleteMany()
  await prisma.chowderItem.deleteMany()
  await prisma.hillChartSnapshot.deleteMany()
  await prisma.task.deleteMany()
  await prisma.scope.deleteMany()
  await prisma.betMember.deleteMany()
  await prisma.bet.deleteMany()
  await prisma.pitch.deleteMany()
  await prisma.eventAttendee.deleteMany()
  await prisma.event.deleteMany()
  await prisma.semosTransaction.deleteMany()
  await prisma.semosEmission.deleteMany()
  await prisma.semosRate.deleteMany()
  await prisma.timesheet.deleteMany()
  await prisma.guildMember.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.guild.deleteMany()
  await prisma.cycle.deleteMany()
  await prisma.member.deleteMany()
  await prisma.lab.deleteMany()

  // Create Lab
  console.log('Creating lab...')
  const lab = await prisma.lab.create({
    data: {
      id: 'lab-1',
      name: 'Semisto Paris',
      slug: 'semisto-paris',
      country: 'France',
      region: 'Île-de-France',
      description: 'Premier lab Semisto en France',
      contactEmail: 'contact@semisto-paris.fr',
      address: '123 Rue de la République, 75001 Paris',
      lat: 48.8566,
      lng: 2.3522,
    },
  })

  // Create Members
  console.log('Creating members...')
  const alice = await prisma.member.create({
    data: {
      id: 'member-1',
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice@semisto-paris.fr',
      avatar: 'https://i.pravatar.cc/150?img=1',
      roles: ['designer', 'shaper'],
      status: 'active',
      isAdmin: true,
      labId: lab.id,
      joinedAt: new Date('2024-01-15'),
    },
  })

  const bob = await prisma.member.create({
    data: {
      id: 'member-2',
      firstName: 'Bob',
      lastName: 'Dupont',
      email: 'bob@semisto-paris.fr',
      avatar: 'https://i.pravatar.cc/150?img=2',
      roles: ['designer'],
      status: 'active',
      isAdmin: false,
      labId: lab.id,
      joinedAt: new Date('2024-02-01'),
    },
  })

  const claire = await prisma.member.create({
    data: {
      id: 'member-3',
      firstName: 'Claire',
      lastName: 'Bernard',
      email: 'claire@semisto-paris.fr',
      avatar: 'https://i.pravatar.cc/150?img=3',
      roles: ['formateur', 'coordination'],
      status: 'active',
      isAdmin: false,
      labId: lab.id,
      joinedAt: new Date('2024-01-20'),
    },
  })

  const david = await prisma.member.create({
    data: {
      id: 'member-4',
      firstName: 'David',
      lastName: 'Leroy',
      email: 'david@semisto-paris.fr',
      avatar: 'https://i.pravatar.cc/150?img=4',
      roles: ['comptable', 'IT'],
      status: 'active',
      isAdmin: true,
      labId: lab.id,
      joinedAt: new Date('2024-01-10'),
    },
  })

  const emma = await prisma.member.create({
    data: {
      id: 'member-5',
      firstName: 'Emma',
      lastName: 'Petit',
      email: 'emma@semisto-paris.fr',
      avatar: 'https://i.pravatar.cc/150?img=5',
      roles: ['communication', 'coordination'],
      status: 'active',
      isAdmin: false,
      labId: lab.id,
      joinedAt: new Date('2024-02-15'),
    },
  })

  // Create Guilds
  console.log('Creating guilds...')
  const designGuild = await prisma.guild.create({
    data: {
      id: 'guild-1',
      name: 'Design Guild',
      description: 'Conception et réalisation de projets',
      labId: lab.id,
      leaderId: alice.id,
      memberIds: [alice.id, bob.id],
    },
  })

  const formationGuild = await prisma.guild.create({
    data: {
      id: 'guild-2',
      name: 'Formation Guild',
      description: 'Animation de formations',
      labId: lab.id,
      leaderId: claire.id,
      memberIds: [claire.id, emma.id],
    },
  })

  const techGuild = await prisma.guild.create({
    data: {
      id: 'guild-3',
      name: 'Tech Guild',
      description: 'Développement et infrastructure',
      labId: lab.id,
      leaderId: david.id,
      memberIds: [david.id],
    },
  })

  // Create GuildMember relations
  console.log('Creating guild memberships...')
  await prisma.guildMember.createMany({
    data: [
      { guildId: designGuild.id, memberId: alice.id },
      { guildId: designGuild.id, memberId: bob.id },
      { guildId: formationGuild.id, memberId: claire.id },
      { guildId: formationGuild.id, memberId: emma.id },
      { guildId: techGuild.id, memberId: david.id },
    ],
  })

  // Create Wallets
  console.log('Creating wallets...')
  const wallets = await Promise.all([
    prisma.wallet.create({
      data: {
        memberId: alice.id,
        balance: 1500,
        floor: 0,
        ceiling: 5000,
      },
    }),
    prisma.wallet.create({
      data: {
        memberId: bob.id,
        balance: 2300,
        floor: 0,
        ceiling: 5000,
      },
    }),
    prisma.wallet.create({
      data: {
        memberId: claire.id,
        balance: 1800,
        floor: 0,
        ceiling: 5000,
      },
    }),
    prisma.wallet.create({
      data: {
        memberId: david.id,
        balance: 3200,
        floor: 0,
        ceiling: 5000,
      },
    }),
    prisma.wallet.create({
      data: {
        memberId: emma.id,
        balance: 950,
        floor: 0,
        ceiling: 5000,
      },
    }),
  ])

  // Create Semos Rates
  console.log('Creating Semos rates...')
  await prisma.semosRate.createMany({
    data: [
      {
        labId: lab.id,
        type: 'cotisation_member_active',
        amount: 100,
        description: 'Cotisation membre actif mensuelle',
      },
      {
        labId: lab.id,
        type: 'cotisation_member_support',
        amount: 50,
        description: 'Cotisation membre soutien mensuelle',
      },
      {
        labId: lab.id,
        type: 'volunteer_hourly',
        amount: 25,
        description: 'Rémunération bénévolat par heure',
      },
      {
        labId: lab.id,
        type: 'provider_fee_percentage',
        amount: 10,
        description: 'Commission prestation (10%)',
      },
      {
        labId: lab.id,
        type: 'peer_review',
        amount: 50,
        description: 'Rémunération peer review',
      },
    ],
  })

  // Create Semos Emissions
  console.log('Creating Semos emissions...')
  await prisma.semosEmission.createMany({
    data: [
      {
        walletId: wallets[0].id,
        amount: 500,
        reason: 'cotisation_member',
        description: 'Émission mensuelle janvier 2025',
        createdBy: david.id,
        createdAt: new Date('2025-01-01'),
      },
      {
        walletId: wallets[1].id,
        amount: 500,
        reason: 'cotisation_member',
        description: 'Émission mensuelle janvier 2025',
        createdBy: david.id,
        createdAt: new Date('2025-01-01'),
      },
    ],
  })

  // Create Semos Transactions
  console.log('Creating Semos transactions...')
  await prisma.semosTransaction.createMany({
    data: [
      {
        fromWalletId: wallets[0].id,
        toWalletId: wallets[1].id,
        amount: 150,
        description: 'Rémunération design project',
        type: 'payment',
        createdAt: new Date('2025-01-15'),
      },
      {
        fromWalletId: wallets[3].id,
        toWalletId: wallets[2].id,
        amount: 200,
        description: 'Formation NextJS',
        type: 'payment',
        createdAt: new Date('2025-01-20'),
      },
    ],
  })

  // Create Cycles
  console.log('Creating cycles...')
  const cycle1 = await prisma.cycle.create({
    data: {
      id: 'cycle-1',
      name: 'Cycle 1 - Winter 2025',
      labId: lab.id,
      startDate: new Date('2025-01-06'),
      endDate: new Date('2025-02-24'),
      cooldownStart: new Date('2025-02-24'),
      cooldownEnd: new Date('2025-03-03'),
      status: 'active',
    },
  })

  const cycle2 = await prisma.cycle.create({
    data: {
      id: 'cycle-2',
      name: 'Cycle 2 - Spring 2025',
      labId: lab.id,
      startDate: new Date('2025-03-03'),
      endDate: new Date('2025-04-21'),
      cooldownStart: new Date('2025-04-21'),
      cooldownEnd: new Date('2025-04-28'),
      status: 'upcoming',
    },
  })

  // Create Pitches
  console.log('Creating pitches...')
  const pitch1 = await prisma.pitch.create({
    data: {
      id: 'pitch-1',
      title: 'Member Directory Redesign',
      status: 'building',
      appetite: '3-weeks',
      authorId: alice.id,
      labId: lab.id,
      problem:
        'The current member directory is hard to navigate and doesn\'t show enough information at a glance.',
      solution:
        'Create a card-based layout with filters and search. Show avatar, roles, guilds, and Semos balance on each card.',
      rabbitHoles: [
        'Don\'t try to build a perfect search algorithm',
        'Don\'t add export functionality in this pitch',
      ],
      noGos: [
        'No advanced permissions system',
        'No bulk operations',
      ],
      breadboard: {
        places: ['Member List', 'Member Card', 'Filter Panel'],
        affordances: ['Search', 'Filter by Guild', 'Filter by Status'],
        connections: [
          {
            from: 'Member List',
            to: 'Member Card',
            via: 'shows multiple',
          },
          {
            from: 'Filter Panel',
            to: 'Member List',
            via: 'filters',
          },
        ],
      },
      createdAt: new Date('2025-01-10'),
    },
  })

  const pitch2 = await prisma.pitch.create({
    data: {
      id: 'pitch-2',
      title: 'Semos Transfer System',
      status: 'shaped',
      appetite: '6-weeks',
      authorId: david.id,
      labId: lab.id,
      problem:
        'Members currently have no way to transfer Semos to each other digitally.',
      solution:
        'Build a simple transfer interface with transaction history and balance validation.',
      rabbitHoles: [
        'Don\'t build a full accounting system',
        'Don\'t add recurring payments',
      ],
      noGos: ['No external payment integration', 'No multi-currency support'],
      createdAt: new Date('2025-01-05'),
    },
  })

  const pitch3 = await prisma.pitch.create({
    data: {
      id: 'pitch-3',
      title: 'Event Calendar Enhancement',
      status: 'raw',
      appetite: '2-weeks',
      authorId: emma.id,
      labId: lab.id,
      problem: 'Hard to see what events are coming up across multiple cycles.',
      solution:
        'Add a unified calendar view with month/list toggle and cycle indicators.',
      rabbitHoles: [],
      noGos: [],
      createdAt: new Date('2025-02-01'),
    },
  })

  // Create Bets
  console.log('Creating bets...')
  const bet1 = await prisma.bet.create({
    data: {
      id: 'bet-1',
      pitchId: pitch1.id,
      cycleId: cycle1.id,
      status: 'in_progress',
      placedAt: new Date('2025-01-05'),
      placedBy: alice.id,
    },
  })

  await prisma.betMember.createMany({
    data: [
      { betId: bet1.id, memberId: alice.id },
      { betId: bet1.id, memberId: bob.id },
    ],
  })

  // Create Scopes for pitch1
  console.log('Creating scopes...')
  const scope1 = await prisma.scope.create({
    data: {
      id: 'scope-1',
      pitchId: pitch1.id,
      name: 'Member Card Component',
      description: 'Design and implement the member card UI',
      hillPosition: 65,
      order: 0,
    },
  })

  const scope2 = await prisma.scope.create({
    data: {
      id: 'scope-2',
      pitchId: pitch1.id,
      name: 'Filter System',
      description: 'Implement filtering by guild, status, and search',
      hillPosition: 45,
      order: 1,
    },
  })

  const scope3 = await prisma.scope.create({
    data: {
      id: 'scope-3',
      pitchId: pitch1.id,
      name: 'Data Integration',
      description: 'Connect to backend and handle loading states',
      hillPosition: 30,
      order: 2,
    },
  })

  // Create Tasks
  console.log('Creating tasks...')
  await prisma.task.createMany({
    data: [
      // Scope 1 tasks
      {
        scopeId: scope1.id,
        title: 'Design card layout',
        isNiceToHave: false,
        completed: true,
        order: 0,
      },
      {
        scopeId: scope1.id,
        title: 'Implement avatar display',
        isNiceToHave: false,
        completed: true,
        order: 1,
      },
      {
        scopeId: scope1.id,
        title: 'Add role badges',
        isNiceToHave: false,
        completed: true,
        order: 2,
      },
      {
        scopeId: scope1.id,
        title: 'Add guild indicators',
        isNiceToHave: false,
        completed: false,
        order: 3,
      },
      // Scope 2 tasks
      {
        scopeId: scope2.id,
        title: 'Implement search input',
        isNiceToHave: false,
        completed: true,
        order: 0,
      },
      {
        scopeId: scope2.id,
        title: 'Add guild filter dropdown',
        isNiceToHave: false,
        completed: false,
        order: 1,
      },
      {
        scopeId: scope2.id,
        title: 'Add status filter',
        isNiceToHave: false,
        completed: false,
        order: 2,
      },
      // Scope 3 tasks
      {
        scopeId: scope3.id,
        title: 'Create data access layer',
        isNiceToHave: false,
        completed: false,
        order: 0,
      },
      {
        scopeId: scope3.id,
        title: 'Add loading skeleton',
        isNiceToHave: true,
        completed: false,
        order: 1,
      },
    ],
  })

  // Create Hill Chart Snapshot
  console.log('Creating hill chart snapshot...')
  await prisma.hillChartSnapshot.create({
    data: {
      pitchId: pitch1.id,
      positions: [
        { scopeId: scope1.id, position: 65 },
        { scopeId: scope2.id, position: 45 },
        { scopeId: scope3.id, position: 30 },
      ],
      createdAt: new Date('2025-02-08'),
    },
  })

  // Create Chowder Items
  console.log('Creating chowder items...')
  await prisma.chowderItem.createMany({
    data: [
      {
        pitchId: pitch1.id,
        title: 'Add bulk export feature',
        createdBy: bob.id,
        createdAt: new Date('2025-02-10'),
      },
      {
        pitchId: pitch1.id,
        title: 'Mobile responsive layout',
        createdBy: alice.id,
        createdAt: new Date('2025-02-09'),
      },
    ],
  })

  // Create Idea Lists
  console.log('Creating idea lists...')
  const ideaList1 = await prisma.ideaList.create({
    data: {
      id: 'idea-list-1',
      labId: lab.id,
      name: 'Feature Requests',
      description: 'Ideas for new features',
    },
  })

  const ideaList2 = await prisma.ideaList.create({
    data: {
      id: 'idea-list-2',
      labId: lab.id,
      name: 'Improvements',
      description: 'Ways to improve existing features',
    },
  })

  // Create Idea Items
  console.log('Creating idea items...')
  const idea1 = await prisma.ideaItem.create({
    data: {
      listId: ideaList1.id,
      title: 'Mobile app for Semisto',
      votes: 3,
    },
  })

  const idea2 = await prisma.ideaItem.create({
    data: {
      listId: ideaList1.id,
      title: 'Integration with accounting software',
      votes: 5,
    },
  })

  const idea3 = await prisma.ideaItem.create({
    data: {
      listId: ideaList2.id,
      title: 'Better notification system',
      votes: 2,
    },
  })

  // Create Idea Votes
  console.log('Creating idea votes...')
  await prisma.ideaVote.createMany({
    data: [
      { itemId: idea1.id, memberId: alice.id },
      { itemId: idea1.id, memberId: bob.id },
      { itemId: idea1.id, memberId: claire.id },
      { itemId: idea2.id, memberId: alice.id },
      { itemId: idea2.id, memberId: bob.id },
      { itemId: idea2.id, memberId: claire.id },
      { itemId: idea2.id, memberId: david.id },
      { itemId: idea2.id, memberId: emma.id },
      { itemId: idea3.id, memberId: david.id },
      { itemId: idea3.id, memberId: emma.id },
    ],
  })

  // Create Events
  console.log('Creating events...')
  const event1 = await prisma.event.create({
    data: {
      id: 'event-1',
      labId: lab.id,
      title: 'Betting Table',
      type: 'betting',
      startDate: new Date('2025-02-24T14:00:00'),
      endDate: new Date('2025-02-24T17:00:00'),
      location: 'Lab Paris',
      description: 'Cycle 1 betting session',
      cycleId: cycle1.id,
    },
  })

  const event2 = await prisma.event.create({
    data: {
      id: 'event-2',
      labId: lab.id,
      title: 'Design Day',
      type: 'design_day',
      startDate: new Date('2025-02-15T09:00:00'),
      endDate: new Date('2025-02-15T18:00:00'),
      location: 'Jardin du Luxembourg',
      description: 'Site visit and design work',
      cycleId: cycle1.id,
    },
  })

  const event3 = await prisma.event.create({
    data: {
      id: 'event-3',
      labId: lab.id,
      title: 'Guild Meeting - Design',
      type: 'guild_meeting',
      startDate: new Date('2025-02-18T18:00:00'),
      endDate: new Date('2025-02-18T20:00:00'),
      location: 'Lab Paris',
      description: 'Monthly design guild sync',
    },
  })

  // Create Event Attendees
  console.log('Creating event attendees...')
  await prisma.eventAttendee.createMany({
    data: [
      { eventId: event1.id, memberId: alice.id },
      { eventId: event1.id, memberId: bob.id },
      { eventId: event1.id, memberId: claire.id },
      { eventId: event1.id, memberId: david.id },
      { eventId: event1.id, memberId: emma.id },
      { eventId: event2.id, memberId: alice.id },
      { eventId: event2.id, memberId: bob.id },
      { eventId: event3.id, memberId: alice.id },
      { eventId: event3.id, memberId: bob.id },
    ],
  })

  // Create Timesheets
  console.log('Creating timesheets...')
  await prisma.timesheet.createMany({
    data: [
      {
        memberId: alice.id,
        date: new Date('2025-02-03'),
        hours: 6,
        description: 'Design membre directory mockups',
        category: 'design',
        paymentType: 'semos',
        invoiced: false,
        kilometers: 0,
        guildId: designGuild.id,
      },
      {
        memberId: alice.id,
        date: new Date('2025-02-04'),
        hours: 8,
        description: 'Implement member card component',
        category: 'design',
        paymentType: 'semos',
        invoiced: false,
        kilometers: 0,
        guildId: designGuild.id,
      },
      {
        memberId: bob.id,
        date: new Date('2025-02-05'),
        hours: 4,
        description: 'Code review and testing',
        category: 'design',
        paymentType: 'semos',
        invoiced: false,
        kilometers: 0,
        guildId: designGuild.id,
      },
      {
        memberId: claire.id,
        date: new Date('2025-02-01'),
        hours: 3,
        description: 'Prepare NextJS training materials',
        category: 'formation',
        paymentType: 'invoice',
        invoiced: true,
        kilometers: 25,
        guildId: formationGuild.id,
      },
      {
        memberId: david.id,
        date: new Date('2025-02-06'),
        hours: 2,
        description: 'Admin tasks and coordination',
        category: 'administratif',
        paymentType: 'semos',
        invoiced: false,
        kilometers: 0,
      },
    ],
  })

  console.log('✅ Seed completed successfully!')
  console.log('\n📊 Created:')
  console.log('  - 1 lab')
  console.log('  - 5 members')
  console.log('  - 3 guilds')
  console.log('  - 5 wallets')
  console.log('  - 5 Semos rates')
  console.log('  - 2 Semos emissions')
  console.log('  - 2 Semos transactions')
  console.log('  - 2 cycles')
  console.log('  - 3 pitches')
  console.log('  - 1 bet')
  console.log('  - 3 scopes')
  console.log('  - 9 tasks')
  console.log('  - 2 chowder items')
  console.log('  - 2 idea lists')
  console.log('  - 3 idea items with votes')
  console.log('  - 3 events')
  console.log('  - 5 timesheets')
  console.log('\n🔐 Test accounts:')
  console.log('  - alice@semisto-paris.fr (admin)')
  console.log('  - david@semisto-paris.fr (admin)')
  console.log('  - bob@semisto-paris.fr')
  console.log('  - claire@semisto-paris.fr')
  console.log('  - emma@semisto-paris.fr')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
