import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { RegisterInput, LoginInput } from '@/lib/validations'

export type SafeUser = {
  id: string
  email: string
  username: string
  name: string | null
  bio: string | null
  avatar: string | null
  theme: string
  plan: 'FREE' | 'PRO'
}

export async function registerUser(input: RegisterInput): Promise<SafeUser> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
  })
  if (existing) {
    throw new Error(existing.email === input.email ? 'Email already in use' : 'Username already taken')
  }

  const password = await bcrypt.hash(input.password, 12)
  const user = await prisma.user.create({
    data: { email: input.email, password, username: input.username, name: input.name ?? null },
  })

  return toSafeUser(user)
}

export async function loginUser(input: LoginInput): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) throw new Error('Invalid credentials')

  const valid = await bcrypt.compare(input.password, user.password)
  if (!valid) throw new Error('Invalid credentials')

  return toSafeUser(user)
}

export async function getUserById(id: string): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({ where: { id } })
  return user ? toSafeUser(user) : null
}

function toSafeUser(user: {
  id: string
  email: string
  username: string
  name: string | null
  bio: string | null
  avatar: string | null
  theme: string
  plan: 'FREE' | 'PRO'
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    bio: user.bio,
    avatar: user.avatar,
    theme: user.theme,
    plan: user.plan,
  }
}
