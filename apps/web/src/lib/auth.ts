import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './db'

const DEV_SEED_EMAILS = [
  'alice@semisto-paris.fr',
  'bob@semisto-paris.fr',
  'claire@semisto-paris.fr',
  'david@semisto-paris.fr',
  'emma@semisto-paris.fr',
]

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: { signIn: '/signin' },
  providers: [
    ...(process.env.NODE_ENV === 'development'
      ? [
          Credentials({
            name: 'Credentials',
            credentials: {
              email: { label: 'Email', type: 'email' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
              const email = credentials?.email
              if (!email || !DEV_SEED_EMAILS.includes(email)) return null
              const member = await prisma.member.findUnique({
                where: { email },
                select: { id: true, firstName: true, lastName: true, email: true },
              })
              if (!member) return null
              return {
                id: member.id,
                email: member.email,
                name: `${member.firstName} ${member.lastName}`,
              }
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user ID to token on sign in
      if (user && user.id) {
        token.id = user.id
        // Fetch member to get labId
        if (user.email) {
          const member = await prisma.member.findUnique({
            where: { email: user.email },
            select: { id: true, labId: true, isAdmin: true },
          })
          if (member) {
            token.memberId = member.id
            token.labId = member.labId
            token.isAdmin = member.isAdmin
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.memberId = (token.memberId as string) || ''
        session.user.labId = (token.labId as string) || ''
        session.user.isAdmin = (token.isAdmin as boolean) || false
      }
      return session
    },
  },
})
